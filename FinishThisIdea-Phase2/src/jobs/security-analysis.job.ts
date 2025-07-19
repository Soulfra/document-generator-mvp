import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { analyzeSecurityIssues, SecurityAnalysisConfig } from '../services/security-analyzer.service';

export const securityAnalysisQueue = new Bull('security-analysis-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

interface SecurityAnalysisJobData {
  jobId: string;
  config?: SecurityAnalysisConfig;
}

securityAnalysisQueue.process('process', async (job) => {
  const { jobId, config } = job.data as SecurityAnalysisJobData;
  
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    const defaultConfig: SecurityAnalysisConfig = {
      scanTypes: ['owasp', 'dependencies', 'secrets'],
      severityLevel: 'medium',
      includeCompliance: true,
      complianceStandards: ['soc2', 'gdpr'],
      generateReport: true,
      includeRemediation: true,
      scanDependencies: true,
      ...config
    };

    const result = await analyzeSecurityIssues(jobId, defaultConfig, (progress) => {
      job.progress(progress);
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'COMPLETED',
        outputFileUrl: result.outputFileUrl,
        progress: 100,
        processingEndedAt: new Date()
      },
    });

    logger.info('Security analysis completed successfully', {
      jobId,
      vulnerabilities: result.vulnerabilities,
      riskScore: result.riskScore,
      complianceScore: result.complianceScore,
      cost: result.processingCost
    });

    return result;

  } catch (error) {
    logger.error('Security analysis failed', { jobId, error });
    
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingEndedAt: new Date()
      },
    });

    throw error;
  }
});

// Job event handlers
securityAnalysisQueue.on('completed', (job, result) => {
  logger.info('Security analysis job completed', {
    jobId: job.data.jobId,
    result: {
      riskScore: result.riskScore,
      totalVulnerabilities: Object.values(result.vulnerabilities as any).reduce((a: number, b: number) => a + b, 0)
    }
  });
});

securityAnalysisQueue.on('failed', (job, err) => {
  logger.error('Security analysis job failed', {
    jobId: job.data.jobId,
    error: err.message
  });
});

securityAnalysisQueue.on('stalled', (job) => {
  logger.warn('Security analysis job stalled', {
    jobId: job.data.jobId
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down security analysis queue...');
  await securityAnalysisQueue.close();
});

export default securityAnalysisQueue;
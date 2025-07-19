import path from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { llmRouter } from '../llm/router';
import { prisma } from '../utils/database';
import { uploadToS3, downloadFromS3 } from '../utils/storage';
import { ProcessingError } from '../utils/errors';
import archiver from 'archiver';

export interface SecurityAnalysisConfig {
  scanTypes: ('owasp' | 'dependencies' | 'secrets' | 'sql-injection' | 'xss')[];
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  includeCompliance: boolean;
  complianceStandards: ('soc2' | 'hipaa' | 'gdpr' | 'pci-dss')[];
  generateReport: boolean;
  includeRemediation: boolean;
  scanDependencies: boolean;
}

export interface SecurityAnalysisResult {
  outputFileUrl: string;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  riskScore: number; // 0-100
  complianceScore?: number;
  processingCost: number;
}

export async function analyzeSecurityIssues(
  jobId: string,
  config: SecurityAnalysisConfig,
  progressCallback?: (progress: number) => void
): Promise<SecurityAnalysisResult> {
  const updateProgress = (progress: number) => {
    progressCallback?.(progress);
  };

  updateProgress(5);

  try {
    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { analysisResult: true },
    });

    if (!job) {
      throw new ProcessingError('Job not found');
    }

    logger.info('Starting security analysis', { jobId, config });

    // Download source code
    updateProgress(10);
    const sourceDir = await downloadAndExtract(job.inputFileUrl, jobId);
    
    updateProgress(20);
    
    // Analyze codebase for security issues
    const securityAnalysis = await analyzeCodebaseForSecurity(sourceDir, config);
    updateProgress(50);
    
    // Generate security report
    const securityReport = await generateSecurityReport(sourceDir, securityAnalysis, config);
    updateProgress(80);
    
    // Package security analysis results
    const outputUrl = await packageSecurityReport(securityReport, jobId);
    updateProgress(95);
    
    // Store results
    await prisma.securityAnalysisResult.create({
      data: {
        jobId,
        vulnerabilities: securityReport.vulnerabilities,
        riskScore: securityReport.riskScore,
        complianceScore: securityReport.complianceScore,
        findings: securityReport.findings,
        recommendations: securityReport.recommendations,
        processingCostUsd: securityReport.totalCost,
      },
    });

    // Cleanup
    await cleanup(sourceDir);
    updateProgress(100);

    return {
      outputFileUrl: outputUrl,
      vulnerabilities: securityReport.vulnerabilities,
      riskScore: securityReport.riskScore,
      complianceScore: securityReport.complianceScore,
      processingCost: securityReport.totalCost,
    };

  } catch (error) {
    logger.error('Security analysis failed', { jobId, error });
    throw error;
  }
}

async function downloadAndExtract(fileUrl: string, jobId: string): Promise<string> {
  const tempDir = path.join('/tmp', `security-${jobId}`);
  const extractDir = path.join(tempDir, 'source');
  
  await fs.mkdir(extractDir, { recursive: true });
  
  const fileBuffer = await downloadFromS3(fileUrl);
  const zipPath = path.join(tempDir, 'source.zip');
  
  await fs.writeFile(zipPath, fileBuffer);
  
  const unzipper = await import('unzipper');
  await createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractDir }))
    .promise();
  
  return extractDir;
}

async function analyzeCodebaseForSecurity(
  sourceDir: string,
  config: SecurityAnalysisConfig
): Promise<{
  projectType: string;
  dependencies: any[];
  codeFiles: string[];
  configFiles: string[];
  sensitiveFiles: string[];
}> {
  const files = await getAllFiles(sourceDir);
  
  // Categorize files
  const codeFiles = files.filter(f => isCodeFile(f));
  const configFiles = files.filter(f => isConfigFile(f));
  const sensitiveFiles = files.filter(f => isSensitiveFile(f));
  
  // Extract dependencies
  const dependencies = await extractDependencies(sourceDir);
  
  // Detect project type
  const projectType = detectProjectType(files);
  
  return {
    projectType,
    dependencies,
    codeFiles,
    configFiles,
    sensitiveFiles,
  };
}

async function generateSecurityReport(
  sourceDir: string,
  analysis: any,
  config: SecurityAnalysisConfig
): Promise<{
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
  riskScore: number;
  complianceScore?: number;
  findings: any[];
  recommendations: any[];
  totalCost: number;
}> {
  let totalCost = 0;
  const findings: any[] = [];
  const recommendations: any[] = [];
  
  // OWASP Top 10 Analysis
  if (config.scanTypes.includes('owasp')) {
    const owaspResult = await llmRouter.route({
      type: 'analyze',
      input: {
        prompt: buildOwaspAnalysisPrompt(analysis, config),
      },
      options: { preferLocal: false, maxCost: 0.40 } // Security analysis needs sophisticated reasoning
    });
    
    const owaspFindings = parseSecurityFindings(owaspResult.data, 'owasp');
    findings.push(...owaspFindings);
    totalCost += owaspResult.cost;
  }
  
  // Dependency Vulnerability Analysis
  if (config.scanTypes.includes('dependencies')) {
    const depResult = await llmRouter.route({
      type: 'analyze',
      input: {
        prompt: buildDependencyAnalysisPrompt(analysis, config),
      },
      options: { preferLocal: true, maxCost: 0.25 }
    });
    
    const depFindings = parseSecurityFindings(depResult.data, 'dependencies');
    findings.push(...depFindings);
    totalCost += depResult.cost;
  }
  
  // Secret Detection
  if (config.scanTypes.includes('secrets')) {
    const secretsResult = await llmRouter.route({
      type: 'analyze',
      input: {
        prompt: buildSecretsAnalysisPrompt(analysis, config),
      },
      options: { preferLocal: true, maxCost: 0.20 }
    });
    
    const secretFindings = parseSecurityFindings(secretsResult.data, 'secrets');
    findings.push(...secretFindings);
    totalCost += secretsResult.cost;
  }
  
  // Generate Recommendations
  if (config.includeRemediation && findings.length > 0) {
    const remediationResult = await llmRouter.route({
      type: 'generate',
      input: {
        prompt: buildRemediationPrompt(findings, config),
      },
      options: { preferLocal: false, maxCost: 0.30 }
    });
    
    recommendations.push(...parseRecommendations(remediationResult.data));
    totalCost += remediationResult.cost;
  }
  
  // Calculate metrics
  const vulnerabilities = categorizeVulnerabilities(findings);
  const riskScore = calculateRiskScore(vulnerabilities);
  const complianceScore = config.includeCompliance ? calculateComplianceScore(findings, config) : undefined;
  
  return {
    vulnerabilities,
    riskScore,
    complianceScore,
    findings,
    recommendations,
    totalCost,
  };
}

function buildOwaspAnalysisPrompt(analysis: any, config: SecurityAnalysisConfig): string {
  return `Perform comprehensive OWASP Top 10 security analysis for this ${analysis.projectType} project.

Code Files: ${analysis.codeFiles.length} files
Configuration Files: ${analysis.configFiles.length} files  
Dependencies: ${analysis.dependencies.length} packages

Analyze for OWASP Top 10 vulnerabilities:
1. A01:2021 - Broken Access Control
2. A02:2021 - Cryptographic Failures  
3. A03:2021 - Injection
4. A04:2021 - Insecure Design
5. A05:2021 - Security Misconfiguration
6. A06:2021 - Vulnerable and Outdated Components
7. A07:2021 - Identification and Authentication Failures
8. A08:2021 - Software and Data Integrity Failures
9. A09:2021 - Security Logging and Monitoring Failures
10. A10:2021 - Server-Side Request Forgery (SSRF)

For each vulnerability found, provide:
- Severity level (Critical/High/Medium/Low)
- Location (file and line if possible)
- Description of the issue
- Potential impact
- CVSS score estimate

Return findings as JSON array:
[
  {
    "type": "injection",
    "severity": "high",
    "location": "src/api/users.js:42",
    "description": "SQL injection vulnerability in user search",
    "impact": "Potential database compromise",
    "cvss": 8.1,
    "cwe": "CWE-89"
  }
]`;
}

function buildDependencyAnalysisPrompt(analysis: any, config: SecurityAnalysisConfig): string {
  return `Analyze dependencies for known security vulnerabilities.

Dependencies to analyze:
${analysis.dependencies.map((dep: any) => `- ${dep.name}@${dep.version}`).join('\n')}

Check for:
1. Known CVEs in dependency versions
2. Outdated packages with security fixes
3. Packages with known malicious behavior
4. License compliance issues
5. Transitive dependency vulnerabilities

Return vulnerability findings as JSON array with severity, description, and recommended fixes.`;
}

function buildSecretsAnalysisPrompt(analysis: any, config: SecurityAnalysisConfig): string {
  return `Scan for exposed secrets and sensitive information.

Files to analyze: ${analysis.sensitiveFiles.length} sensitive files

Look for:
1. API keys and tokens
2. Database credentials  
3. Private keys and certificates
4. OAuth secrets
5. Session secrets
6. Third-party service credentials
7. Hardcoded passwords

For each finding, specify:
- File location
- Type of secret
- Confidence level
- Remediation steps

Return as JSON array of secret exposure findings.`;
}

function buildRemediationPrompt(findings: any[], config: SecurityAnalysisConfig): string {
  return `Generate actionable remediation recommendations for these security findings:

${findings.map(f => `- ${f.severity}: ${f.description} (${f.location})`).join('\n')}

For each finding, provide:
1. Step-by-step remediation instructions
2. Code examples of secure implementations
3. Configuration changes needed
4. Additional security measures
5. Priority level for fixing

Focus on practical, implementable solutions that address root causes.
Return as JSON array of detailed remediation steps.`;
}

async function packageSecurityReport(report: any, jobId: string): Promise<string> {
  const reportDir = path.join('/tmp', `security-report-${jobId}`);
  await fs.mkdir(reportDir, { recursive: true });
  
  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(report);
  await fs.writeFile(path.join(reportDir, 'EXECUTIVE_SUMMARY.md'), executiveSummary);
  
  // Generate detailed findings report
  const detailedReport = generateDetailedReport(report);
  await fs.writeFile(path.join(reportDir, 'SECURITY_FINDINGS.md'), detailedReport);
  
  // Generate remediation guide
  if (report.recommendations.length > 0) {
    const remediationGuide = generateRemediationGuide(report.recommendations);
    await fs.writeFile(path.join(reportDir, 'REMEDIATION_GUIDE.md'), remediationGuide);
  }
  
  // Generate JSON report for programmatic access
  const jsonReport = {
    summary: {
      riskScore: report.riskScore,
      vulnerabilities: report.vulnerabilities,
      complianceScore: report.complianceScore
    },
    findings: report.findings,
    recommendations: report.recommendations,
    generatedAt: new Date().toISOString()
  };
  
  await fs.writeFile(
    path.join(reportDir, 'security-report.json'),
    JSON.stringify(jsonReport, null, 2)
  );
  
  // Package everything
  const zipPath = path.join('/tmp', `security-report-${jobId}.zip`);
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  archive.directory(reportDir, false);
  await archive.finalize();
  
  // Upload to S3
  const fileBuffer = await fs.readFile(zipPath);
  const s3Key = `security-analysis/${jobId}/security-report.zip`;
  const uploadUrl = await uploadToS3(fileBuffer, s3Key);
  
  // Cleanup
  await fs.rm(reportDir, { recursive: true, force: true });
  await fs.unlink(zipPath);
  
  return uploadUrl;
}

// Helper functions
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !shouldIgnoreDir(entry.name)) {
        await scan(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

function shouldIgnoreDir(dirName: string): boolean {
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
  return ignoreDirs.includes(dirName) || dirName.startsWith('.');
}

function isCodeFile(filePath: string): boolean {
  const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.php', '.rb', '.go', '.rs'];
  return codeExtensions.some(ext => filePath.endsWith(ext));
}

function isConfigFile(filePath: string): boolean {
  const configPatterns = [
    'package.json', 'composer.json', 'requirements.txt', 'Gemfile',
    '.env', '.env.example', 'config.json', 'app.config',
    'web.config', 'nginx.conf', 'apache.conf'
  ];
  const filename = path.basename(filePath);
  return configPatterns.some(pattern => filename.includes(pattern)) ||
         filename.endsWith('.config.js') || filename.endsWith('.config.ts');
}

function isSensitiveFile(filePath: string): boolean {
  const sensitivePatterns = [
    '.env', '.key', '.pem', '.p12', '.jks', 'private',
    'secret', 'credential', 'password', 'token'
  ];
  const filename = path.basename(filePath).toLowerCase();
  return sensitivePatterns.some(pattern => filename.includes(pattern));
}

function detectProjectType(files: string[]): string {
  if (files.some(f => f.endsWith('package.json'))) return 'node';
  if (files.some(f => f.endsWith('requirements.txt'))) return 'python';
  if (files.some(f => f.endsWith('pom.xml'))) return 'java';
  return 'unknown';
}

async function extractDependencies(sourceDir: string): Promise<any[]> {
  const dependencies: any[] = [];
  
  try {
    // Node.js dependencies
    const packageJsonPath = path.join(sourceDir, 'package.json');
    if (await fs.access(packageJsonPath).then(() => true).catch(() => false)) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      Object.entries(deps).forEach(([name, version]) => {
        dependencies.push({ name, version, type: 'npm' });
      });
    }
  } catch (error) {
    // Ignore errors
  }
  
  return dependencies;
}

function parseSecurityFindings(data: string, type: string): any[] {
  try {
    const jsonMatch = data.match(/\[[^\]]*\]/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    logger.error('Failed to parse security findings', { error, type });
    return [];
  }
}

function parseRecommendations(data: string): any[] {
  try {
    const jsonMatch = data.match(/\[[^\]]*\]/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    logger.error('Failed to parse recommendations', { error });
    return [];
  }
}

function categorizeVulnerabilities(findings: any[]): { critical: number; high: number; medium: number; low: number } {
  const categories = { critical: 0, high: 0, medium: 0, low: 0 };
  
  findings.forEach(finding => {
    const severity = finding.severity?.toLowerCase();
    if (severity === 'critical') categories.critical++;
    else if (severity === 'high') categories.high++;
    else if (severity === 'medium') categories.medium++;
    else if (severity === 'low') categories.low++;
  });
  
  return categories;
}

function calculateRiskScore(vulnerabilities: any): number {
  const weights = { critical: 10, high: 7, medium: 4, low: 1 };
  const totalScore = 
    vulnerabilities.critical * weights.critical +
    vulnerabilities.high * weights.high +
    vulnerabilities.medium * weights.medium +
    vulnerabilities.low * weights.low;
  
  // Normalize to 0-100 scale
  const maxPossibleScore = 100; // Assume max 10 critical vulnerabilities
  return Math.min(100, Math.round((totalScore / maxPossibleScore) * 100));
}

function calculateComplianceScore(findings: any[], config: SecurityAnalysisConfig): number {
  // Simplified compliance scoring
  const totalFindings = findings.length;
  const criticalFindings = findings.filter(f => f.severity === 'critical').length;
  
  if (totalFindings === 0) return 100;
  if (criticalFindings > 0) return Math.max(20, 80 - (criticalFindings * 20));
  
  return Math.max(60, 100 - (totalFindings * 5));
}

function generateExecutiveSummary(report: any): string {
  return `# Security Analysis Executive Summary

## Risk Assessment
- **Overall Risk Score**: ${report.riskScore}/100
- **Compliance Score**: ${report.complianceScore || 'N/A'}/100

## Vulnerability Summary
- **Critical**: ${report.vulnerabilities.critical}
- **High**: ${report.vulnerabilities.high}
- **Medium**: ${report.vulnerabilities.medium}
- **Low**: ${report.vulnerabilities.low}

## Key Findings
${report.findings.slice(0, 5).map((f: any) => `- **${f.severity.toUpperCase()}**: ${f.description}`).join('\n')}

## Immediate Actions Required
${report.recommendations.slice(0, 3).map((r: any, i: number) => `${i + 1}. ${r.title || r.description}`).join('\n')}

## Business Impact
${report.vulnerabilities.critical > 0 
  ? 'Critical vulnerabilities detected that require immediate attention.'
  : report.vulnerabilities.high > 0
  ? 'High-risk vulnerabilities that should be addressed within 30 days.'
  : 'No critical security issues identified.'
}

---
*Generated by FinishThisIdea Security Analyzer*
`;
}

function generateDetailedReport(report: any): string {
  return `# Detailed Security Findings

## Overview
This report contains detailed analysis of security vulnerabilities found in the codebase.

## Findings by Severity

### Critical Vulnerabilities
${report.findings.filter((f: any) => f.severity === 'critical').map((f: any) => `
**${f.type}** - ${f.location}
- Description: ${f.description}
- Impact: ${f.impact}
- CWE: ${f.cwe || 'N/A'}
- CVSS: ${f.cvss || 'N/A'}
`).join('\n')}

### High Vulnerabilities
${report.findings.filter((f: any) => f.severity === 'high').map((f: any) => `
**${f.type}** - ${f.location}
- Description: ${f.description}
- Impact: ${f.impact}
`).join('\n')}

### Medium Vulnerabilities  
${report.findings.filter((f: any) => f.severity === 'medium').map((f: any) => `
**${f.type}** - ${f.location}
- Description: ${f.description}
`).join('\n')}

### Low Vulnerabilities
${report.findings.filter((f: any) => f.severity === 'low').map((f: any) => `
**${f.type}** - ${f.location}
- Description: ${f.description}
`).join('\n')}

---
*Generated by FinishThisIdea Security Analyzer*
`;
}

function generateRemediationGuide(recommendations: any[]): string {
  return `# Security Remediation Guide

This guide provides step-by-step instructions to fix identified security vulnerabilities.

${recommendations.map((rec: any, index: number) => `
## ${index + 1}. ${rec.title || rec.description}

**Priority**: ${rec.priority || 'Medium'}

### Steps to Fix:
${rec.steps ? rec.steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n') : rec.description}

${rec.code ? `
### Code Example:
\`\`\`${rec.language || 'javascript'}
${rec.code}
\`\`\`
` : ''}

### Additional Resources:
${rec.resources ? rec.resources.map((resource: string) => `- ${resource}`).join('\n') : 'None specified'}

---
`).join('\n')}

## General Security Best Practices
1. Keep dependencies up to date
2. Use secure coding practices
3. Implement proper input validation
4. Use environment variables for secrets
5. Enable security headers
6. Implement proper logging and monitoring

---
*Generated by FinishThisIdea Security Analyzer*
`;
}

async function cleanup(...dirs: string[]) {
  for (const dir of dirs) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      logger.warn('Failed to cleanup temp directory', { dir, error });
    }
  }
}
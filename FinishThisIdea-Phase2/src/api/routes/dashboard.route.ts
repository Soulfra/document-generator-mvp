import { Router } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';

const router = Router();

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  features: string[];
  estimatedTime?: string;
  category?: string;
  confidence?: number;
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  services: string[];
  price: number; // in cents
  savings: number; // in cents
}

const SERVICE_CATALOG: ServiceOffering[] = [
  // Original Phase 1 service
  {
    id: 'cleanup',
    name: 'Code Cleanup',
    description: 'Transform messy code into clean, standardized code',
    price: 100,
    features: ['Format code', 'Remove dead code', 'Fix linting issues', 'Standardize naming']
  },
  
  // Phase 2 services
  {
    id: 'documentation',
    name: 'Documentation Generator',
    description: 'Generate comprehensive documentation for your codebase',
    price: 300,
    features: ['README generation', 'API documentation', 'Code comments', 'Usage examples']
  },
  {
    id: 'api-generation',
    name: 'API Generator',
    description: 'Create REST APIs from your code structure',
    price: 500,
    features: ['REST endpoints', 'OpenAPI spec', 'Authentication', 'Validation']
  },
  {
    id: 'test-generation',
    name: 'Test Generator',
    description: 'Generate comprehensive test suites for your code',
    price: 400,
    features: ['Unit tests', 'Integration tests', 'Test coverage', 'Mocks']
  },
  {
    id: 'security-analysis',
    name: 'Security Analyzer',
    description: 'Find and fix security vulnerabilities in your code',
    price: 700,
    features: ['Vulnerability scan', 'OWASP compliance', 'Secret detection', 'Fix recommendations']
  },
  
  // Soulfra-imported services
  {
    id: 'code-navigation',
    name: 'Code Navigation',
    description: 'CODE GPS MVP - Visualize and Fix Your Codebase Chaos',
    price: 200,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '30-60 minutes',
    confidence: 0.85
  },
  {
    id: 'deep-cleanup',
    name: 'Deep Cleanup',
    description: 'CLEAN MASTER CONTROL - Actually connects to real services',
    price: 500,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '15-30 minutes',
    confidence: 0.8
  },
  {
    id: 'import-optimizer',
    name: 'Import Optimizer',
    description: 'FIX IMPORTS - Quick fixes for missing imports',
    price: 150,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '15-30 minutes',
    confidence: 0.85
  },
  {
    id: 'business-docs',
    name: 'Business Docs',
    description: 'DOMAIN BUSINESS MATCHER - Match your 100 GoDaddy domains to business ideas',
    price: 400,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '15-30 minutes',
    confidence: 0.75
  },
  {
    id: 'chat-api',
    name: 'Chat Api',
    description: 'CHAT API GATEWAY - Routes all chat requests to appropriate services',
    price: 450,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '15-30 minutes',
    confidence: 0.85
  },
  {
    id: 'orchestration-api',
    name: 'Orchestration Api',
    description: 'CREATE AI ORCHESTRATOR - Set up the structure for controlling everything from your phone',
    price: 600,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '5-10 minutes',
    confidence: 0.8
  },
  {
    id: 'integration-tests',
    name: 'Integration Tests',
    description: 'MEGA INTEGRATION TESTS - These are the 120 tests to run to ensure EVERY piece works together',
    price: 350,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '5-10 minutes',
    confidence: 0.8
  },
  {
    id: 'security-filter',
    name: 'Security Filter',
    description: 'ULTIMATE SECURITY FILTER - Prevents all unsafe operations from executing',
    price: 300,
    features: ["Vulnerability scan", "Input validation", "XSS protection", "SQL injection prevention"],
    category: 'enhancement',
    estimatedTime: '30-60 minutes',
    confidence: 0.75
  },
  {
    id: 'access-control',
    name: 'Access Control',
    description: 'STRICT ACCESS CONTROL - Implements role-based permissions across all services',
    price: 250,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '15-30 minutes',
    confidence: 0.8
  },
  {
    id: 'security-encoding',
    name: 'Security Encoding',
    description: 'SAFE ENCODING OPERATIONS - Properly encode and escape all user input',
    price: 200,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '15-30 minutes',
    confidence: 0.9
  },
  {
    id: 'ai-conductor',
    name: 'Ai Conductor',
    description: 'AI CONDUCTOR SYSTEM - Main orchestration and routing logic',
    price: 800,
    features: ["Service orchestration", "Workflow automation", "AI routing", "Load balancing"],
    category: 'premium',
    estimatedTime: '30-60 minutes',
    confidence: 0.85
  },
  {
    id: 'ai-validator',
    name: 'Ai Validator',
    description: 'AI VALIDATION RULES - Validates AI outputs before execution',
    price: 700,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'premium',
    estimatedTime: '30-60 minutes',
    confidence: 0.85
  },
  {
    id: 'ai-versioning',
    name: 'Ai Versioning',
    description: 'AI VERSION CONTROL - Manages different versions of AI models and services',
    price: 900,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'premium',
    estimatedTime: '30-60 minutes',
    confidence: 0.95
  },
  {
    id: 'autonomous-agent',
    name: 'Autonomous Agent',
    description: 'AUTONOMOUS AGENT V1 - Self-improving AI system framework',
    price: 1000,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'premium',
    estimatedTime: '5-10 minutes',
    confidence: 0.8
  },
  {
    id: 'ux-optimizer',
    name: 'Ux Optimizer',
    description: 'UNIFIED UX OPTIMIZER - Streamlines user experience across all interfaces',
    price: 600,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '30-60 minutes',
    confidence: 0.75
  },
  {
    id: 'ai-ux',
    name: 'Ai Ux',
    description: 'AI-POWERED UX - Adapts interface based on user behavior',
    price: 700,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'premium',
    estimatedTime: '15-30 minutes',
    confidence: 0.8
  },
  {
    id: 'load-testing',
    name: 'Load Testing',
    description: 'LOAD TEST SUITE - Stress tests your entire application',
    price: 500,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '15-30 minutes',
    confidence: 0.9
  },
  {
    id: 'code-consolidation',
    name: 'Code Consolidation',
    description: 'CONSOLIDATE ALL CODE - Merges duplicate code and optimizes structure',
    price: 800,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'premium',
    estimatedTime: '15-30 minutes',
    confidence: 0.8
  },
  {
    id: 'idea-extraction',
    name: 'Idea Extraction',
    description: 'IDEA EXTRACTOR PRO - Extracts business ideas from messy codebases',
    price: 600,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '15-30 minutes',
    confidence: 0.8
  },
  {
    id: 'service-chaining',
    name: 'Service Chaining',
    description: 'CHAIN ALL SERVICES - Links services together for complex workflows',
    price: 700,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'premium',
    estimatedTime: '30-60 minutes',
    confidence: 0.75
  },
  {
    id: 'containerization',
    name: 'Containerization',
    description: 'AUTO CONTAINERIZATION - Dockerizes your entire application',
    price: 500,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enhancement',
    estimatedTime: '15-30 minutes',
    confidence: 0.9
  },
  {
    id: 'enterprise-suite',
    name: 'Enterprise Suite',
    description: 'ENTERPRISE GRADE SYSTEM - Full enterprise deployment package',
    price: 2500,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enterprise',
    estimatedTime: '30-60 minutes',
    confidence: 0.85
  },
  {
    id: 'distributed-system',
    name: 'Distributed System',
    description: 'DISTRIBUTED PROCESSING - Scales across multiple servers',
    price: 2000,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enterprise',
    estimatedTime: '15-30 minutes',
    confidence: 0.85
  },
  {
    id: 'workflow-automation',
    name: 'Workflow Automation',
    description: 'WORKFLOW ENGINE V2 - Automates complex business processes',
    price: 1500,
    features: ["Advanced processing", "AI-powered analysis", "Automated optimization"],
    category: 'enterprise',
    estimatedTime: '15-30 minutes',
    confidence: 0.9
  }
];

const BUNDLES: Bundle[] = [
  {
    id: 'developer-essentials',
    name: 'Developer Essentials',
    description: 'Everything you need to clean and document your code',
    services: ['cleanup', 'documentation', 'test-generation'],
    price: 700, // $7
    savings: 100 // Save $1
  },
  {
    id: 'complete-transform',
    name: 'Complete Transform',
    description: 'Full codebase transformation with API and documentation',
    services: ['cleanup', 'documentation', 'api-generation', 'test-generation'],
    price: 1200, // $12
    savings: 500 // Save $5
  },
  {
    id: 'enterprise-security',
    name: 'Enterprise Security',
    description: 'Complete transformation with security analysis',
    services: ['cleanup', 'documentation', 'api-generation', 'test-generation', 'security-analysis'],
    price: 1900, // $19
    savings: 1000 // Save $10
  }
];

// Get service catalog
router.get('/services', async (req, res) => {
  try {
    logger.info('Fetching service catalog');
    
    // Return service catalog with pricing
    res.json({
      services: SERVICE_CATALOG,
      bundles: BUNDLES
    });
  } catch (error) {
    logger.error('Failed to fetch services', { error });
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get user's job history
router.get('/jobs', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const jobs = await prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        payment: true
      }
    });

    res.json({ jobs });
  } catch (error) {
    logger.error('Failed to fetch jobs', { error });
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const [totalJobs, completedJobs, totalSpent] = await Promise.all([
      prisma.job.count({ where: { userId } }),
      prisma.job.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.payment.aggregate({
        where: { job: { userId }, status: 'succeeded' },
        _sum: { amount: true }
      })
    ]);

    res.json({
      totalJobs,
      completedJobs,
      totalSpent: totalSpent._sum.amount || 0,
      servicesUsed: await getServicesUsed(userId)
    });
  } catch (error) {
    logger.error('Failed to fetch stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

async function getServicesUsed(userId: string) {
  const jobs = await prisma.job.findMany({
    where: { userId },
    select: { type: true },
    distinct: ['type']
  });

  return jobs.map(job => job.type);
}

// Create bundle
router.post('/bundles', async (req, res) => {
  try {
    const { bundleId, fileUrl, fileName, fileSize } = req.body;
    
    // Find bundle definition
    const bundleDefinition = BUNDLES.find(b => b.id === bundleId);
    if (!bundleDefinition) {
      return res.status(400).json({ error: 'Invalid bundle ID' });
    }
    
    // Create bundle record
    const bundle = await prisma.bundle.create({
      data: {
        name: bundleDefinition.name,
        description: bundleDefinition.description,
        services: bundleDefinition.services,
        totalPrice: bundleDefinition.price,
        status: 'PENDING',
        userId: req.body.userId || 'demo-user' // In production, get from auth
      }
    });
    
    // Create jobs for each service in bundle
    for (const serviceId of bundleDefinition.services) {
      await prisma.job.create({
        data: {
          type: serviceId.toUpperCase().replace(/-/g, '_'),
          status: 'PENDING',
          inputFileUrl: fileUrl,
          originalFileName: fileName,
          userId: req.body.userId || 'demo-user',
          bundleId: bundle.id
        }
      });
    }
    
    logger.info('Bundle created', { bundleId: bundle.id, services: bundleDefinition.services });
    
    res.json({
      success: true,
      data: {
        bundleId: bundle.id,
        services: bundleDefinition.services,
        totalPrice: bundleDefinition.price
      }
    });
    
  } catch (error) {
    logger.error('Failed to create bundle', { error });
    res.status(500).json({ error: 'Failed to create bundle' });
  }
});

// Create individual job
router.post('/jobs', async (req, res) => {
  try {
    const { type, inputFileUrl, userId } = req.body;
    
    const job = await prisma.job.create({
      data: {
        type,
        status: 'PENDING',
        inputFileUrl,
        userId: userId || 'demo-user'
      }
    });
    
    logger.info('Job created', { jobId: job.id, type });
    
    res.json({
      success: true,
      data: {
        id: job.id,
        type: job.type,
        status: job.status
      }
    });
    
  } catch (error) {
    logger.error('Failed to create job', { error });
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Get job info from payment session
router.get('/session/:sessionId/job', async (req, res) => {
  try {
    // In a real app, you'd look up the session in database
    // For now, return mock data
    res.json({
      success: true,
      data: {
        jobId: 'demo-job-' + Date.now(),
        services: ['Code Cleanup', 'Documentation'],
        status: 'PROCESSING'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job info' });
  }
});

// Download job results
router.get('/jobs/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job || !job.outputFileUrl) {
      return res.status(404).json({ error: 'Results not found' });
    }
    
    // Generate presigned download URL
    const { generatePresignedUrl } = await import('../../utils/storage');
    const downloadUrl = await generatePresignedUrl(job.outputFileUrl, 3600);
    
    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: `results-${jobId}.zip`
      }
    });
    
  } catch (error) {
    logger.error('Failed to generate download URL', { error });
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

export default router;
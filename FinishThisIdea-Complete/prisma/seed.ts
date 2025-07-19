import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create default context profiles
  console.log('Creating default context profiles...');
  
  const profiles = [
    {
      name: 'JavaScript/Node.js Standard',
      description: 'Standard cleanup for JavaScript and Node.js projects with common best practices',
      userId: null, // System profile
      data: {
        language: 'javascript',
        framework: 'node',
        version: 'latest',
        preferences: {
          semicolons: true,
          quotes: 'single',
          trailingCommas: true,
          indentation: 2
        },
        rules: [
          'Remove unused imports',
          'Fix indentation',
          'Add semicolons',
          'Use consistent quotes',
          'Remove console.log statements'
        ],
        exclusions: ['node_modules', '.git', 'dist', 'build']
      },
      language: 'javascript',
      framework: 'node',
      version: 'latest',
      isDefault: true,
      isPublic: true
    },
    {
      name: 'React/TypeScript Standard',
      description: 'Optimized cleanup for React applications with TypeScript',
      userId: null,
      data: {
        language: 'typescript',
        framework: 'react',
        version: '18+',
        preferences: {
          semicolons: true,
          quotes: 'single',
          jsx: 'react-jsx',
          strictMode: true
        },
        rules: [
          'Remove unused imports',
          'Fix TypeScript types',
          'Optimize React components',
          'Add proper prop types',
          'Remove dead code'
        ],
        exclusions: ['node_modules', '.git', 'dist', 'build', 'coverage']
      },
      language: 'typescript',
      framework: 'react',
      version: '18+',
      isDefault: true,
      isPublic: true
    },
    {
      name: 'Python/Django Standard',
      description: 'Python cleanup following PEP 8 and Django best practices',
      userId: null,
      data: {
        language: 'python',
        framework: 'django',
        version: '3.8+',
        preferences: {
          lineLength: 88,
          quotes: 'double',
          imports: 'isort',
          formatting: 'black'
        },
        rules: [
          'Fix PEP 8 violations',
          'Organize imports',
          'Remove unused variables',
          'Add type hints',
          'Fix docstrings'
        ],
        exclusions: ['__pycache__', '.git', 'venv', '.venv', 'migrations']
      },
      language: 'python',
      framework: 'django',
      version: '3.8+',
      isDefault: true,
      isPublic: true
    },
    {
      name: 'Generic Code Cleanup',
      description: 'General purpose cleanup for any programming language',
      userId: null,
      data: {
        language: 'generic',
        framework: null,
        version: null,
        preferences: {
          conservative: true,
          preserveComments: true,
          fixIndentation: true
        },
        rules: [
          'Fix indentation',
          'Remove trailing whitespace',
          'Ensure file endings',
          'Basic syntax fixes',
          'Remove empty files'
        ],
        exclusions: ['.git', 'node_modules', '__pycache__', 'dist', 'build']
      },
      language: null,
      framework: null,
      version: null,
      isDefault: true,
      isPublic: true
    }
  ];

  for (const profile of profiles) {
    await prisma.contextProfile.upsert({
      where: { name: profile.name },
      update: {},
      create: profile
    });
  }

  // 2. Create agent templates
  console.log('Creating agent templates...');
  
  const agentTemplates = [
    {
      name: 'Frontend Specialist',
      description: 'Expert in React, Vue, Angular, and modern frontend development',
      specialization: 'frontend',
      capabilities: ['React', 'Vue', 'Angular', 'TypeScript', 'CSS', 'HTML', 'JavaScript'],
      modelPreferences: ['gpt-4', 'claude-3-sonnet'],
      personalityTraits: ['detail-oriented', 'creative', 'user-focused'],
      codeStyle: 'modern',
      experienceLevel: 'SENIOR',
      pricePerToken: 100
    },
    {
      name: 'Backend Engineer',
      description: 'Specialized in server-side development, APIs, and database design',
      specialization: 'backend',
      capabilities: ['Node.js', 'Python', 'Java', 'SQL', 'API Design', 'Microservices'],
      modelPreferences: ['gpt-4', 'claude-3-sonnet'],
      personalityTraits: ['analytical', 'systematic', 'performance-focused'],
      codeStyle: 'enterprise',
      experienceLevel: 'SENIOR',
      pricePerToken: 120
    },
    {
      name: 'Full Stack Developer',
      description: 'Versatile developer comfortable with both frontend and backend',
      specialization: 'fullstack',
      capabilities: ['React', 'Node.js', 'TypeScript', 'Databases', 'DevOps', 'Testing'],
      modelPreferences: ['gpt-4', 'claude-3-sonnet'],
      personalityTraits: ['adaptable', 'problem-solver', 'collaborative'],
      codeStyle: 'balanced',
      experienceLevel: 'MID',
      pricePerToken: 80
    },
    {
      name: 'DevOps Specialist',
      description: 'Expert in deployment, CI/CD, cloud infrastructure, and monitoring',
      specialization: 'devops',
      capabilities: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Monitoring', 'Security'],
      modelPreferences: ['gpt-4', 'claude-3-sonnet'],
      personalityTraits: ['reliability-focused', 'automation-minded', 'security-conscious'],
      codeStyle: 'infrastructure',
      experienceLevel: 'EXPERT',
      pricePerToken: 150
    },
    {
      name: 'Junior Developer',
      description: 'Great for simple tasks and learning-focused development',
      specialization: 'general',
      capabilities: ['JavaScript', 'HTML', 'CSS', 'Basic Python', 'Git'],
      modelPreferences: ['gpt-3.5-turbo', 'claude-3-haiku'],
      personalityTraits: ['eager-to-learn', 'careful', 'follows-best-practices'],
      codeStyle: 'standard',
      experienceLevel: 'JUNIOR',
      pricePerToken: 30
    }
  ];

  for (const template of agentTemplates) {
    await prisma.agentTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template
    });
  }

  // 3. Create test users
  console.log('Creating test users...');
  
  const testUsers = [
    {
      email: 'demo@finishthisidea.com',
      displayName: 'Demo User',
      name: 'Demo User',
      platformTokens: 1000,
      totalEarnings: 0,
      referralCode: 'DEMO2024',
      metadata: {
        achievements: [],
        xp: 0,
        level: 1,
        preferences: {
          notifications: true,
          theme: 'dark'
        }
      }
    },
    {
      email: 'test@finishthisidea.com',
      displayName: 'Test User',
      name: 'Test User',
      platformTokens: 500,
      totalEarnings: 25.50,
      referralCode: 'TEST2024',
      metadata: {
        achievements: ['first-cleanup'],
        xp: 250,
        level: 2,
        preferences: {
          notifications: true,
          theme: 'light'
        }
      }
    }
  ];

  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
  }

  // 4. Create sample token holdings
  console.log('Creating sample token holdings...');
  
  const demoUser = await prisma.user.findUnique({ where: { email: 'demo@finishthisidea.com' } });
  const testUser = await prisma.user.findUnique({ where: { email: 'test@finishthisidea.com' } });

  if (demoUser) {
    await prisma.tokenHolding.createMany({
      data: [
        {
          userId: demoUser.id,
          amount: 1000,
          acquisitionType: 'INITIAL',
          source: 'Initial platform tokens'
        }
      ],
      skipDuplicates: true
    });
  }

  if (testUser) {
    await prisma.tokenHolding.createMany({
      data: [
        {
          userId: testUser.id,  
          amount: 500,
          acquisitionType: 'INITIAL',
          source: 'Initial platform tokens'
        },
        {
          userId: testUser.id,
          amount: 100,
          acquisitionType: 'EARNED',
          source: 'Completed cleanup job'
        }
      ],
      skipDuplicates: true
    });
  }

  // 5. Initialize platform revenue tracking
  console.log('Initializing platform revenue tracking...');
  
  await prisma.platformRevenue.upsert({
    where: { id: 'initial-revenue-config' },
    update: {},
    create: {
      id: 'initial-revenue-config',
      totalRevenue: 0,
      amount: 0,
      source: 'system',
      dividendRate: 0.3, // 30% to token holders
      tokenHolders: [],
      gradeThresholds: {
        bronze: 0,
        silver: 1000,
        gold: 5000,
        platinum: 25000
      },
      status: 'active'
    }
  });

  console.log('✅ Database seed completed successfully!');
  
  // Print summary
  const profileCount = await prisma.contextProfile.count();
  const templateCount = await prisma.agentTemplate.count();
  const userCount = await prisma.user.count();
  
  console.log(`\n📊 Seed Summary:`);
  console.log(`- Context Profiles: ${profileCount}`);
  console.log(`- Agent Templates: ${templateCount}`);
  console.log(`- Test Users: ${userCount}`);
  console.log(`- Platform revenue tracking initialized`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
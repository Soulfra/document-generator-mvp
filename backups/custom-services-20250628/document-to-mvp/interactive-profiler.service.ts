import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { ExtractedRequirement } from './document-parser.service';

export interface ProfilingChoice {
  id: string;
  label: string;
  description: string;
  previewImage?: string;
  value: any;
  tags: string[];
}

export interface ProfilingOption {
  id: string;
  category: 'tech-stack' | 'ui-style' | 'features' | 'deployment' | 'workflow';
  title: string;
  description: string;
  required: boolean;
  multiSelect: boolean;
  choices: ProfilingChoice[];
}

export interface UserProfile {
  id: string;
  userId: string;
  projectName: string;
  selectedChoices: Record<string, string | string[]>;
  requirements: ExtractedRequirement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileSession {
  sessionId: string;
  currentStep: number;
  totalSteps: number;
  profile: Partial<UserProfile>;
  completedOptions: string[];
}

export class InteractiveProfilerService {
  private sessions = new Map<string, ProfileSession>();

  constructor() {
    // Simple in-memory sessions for MVP
  }

  /**
   * Generate profiling options based on extracted requirements
   */
  generateProfilingOptions(requirements: ExtractedRequirement[]): ProfilingOption[] {
    const options: ProfilingOption[] = [];

    // Always include core options
    options.push(...this.getCoreProfilingOptions());

    // Add requirement-specific options
    if (requirements.some(r => r.type === 'api')) {
      options.push(...this.getBackendProfilingOptions());
    }

    if (requirements.some(r => r.type === 'ui')) {
      options.push(...this.getFrontendProfilingOptions());
    }

    if (requirements.some(r => r.type === 'data')) {
      options.push(...this.getDataProfilingOptions());
    }

    // Add deployment options based on complexity
    if (requirements.length > 10) {
      options.push(...this.getDeploymentProfilingOptions());
    }

    logger.info('Generated profiling options', {
      totalOptions: options.length,
      categories: [...new Set(options.map(o => o.category))]
    });

    return options;
  }

  /**
   * Start a new profiling session
   */
  async startProfilingSession(
    userId: string,
    projectName: string,
    requirements: ExtractedRequirement[]
  ): Promise<ProfileSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const options = this.generateProfilingOptions(requirements);

    const session: ProfileSession = {
      sessionId,
      currentStep: 0,
      totalSteps: options.length,
      profile: {
        userId,
        projectName,
        requirements,
        selectedChoices: {},
      },
      completedOptions: []
    };

    logger.info('Started profiling session', {
      sessionId,
      userId,
      projectName,
      totalSteps: options.length
    });

    return session;
  }

  /**
   * Get next profiling option for user
   */
  getNextProfilingOption(session: ProfileSession): ProfilingOption | null {
    const options = this.generateProfilingOptions(session.profile.requirements || []);
    
    if (session.currentStep >= options.length) {
      return null; // Session complete
    }

    return options[session.currentStep];
  }

  /**
   * Record user choice and advance session
   */
  recordChoice(
    session: ProfileSession,
    optionId: string,
    choice: string | string[]
  ): ProfileSession {
    // Update profile with choice
    session.profile.selectedChoices = session.profile.selectedChoices || {};
    session.profile.selectedChoices[optionId] = choice;

    // Mark option as completed
    session.completedOptions.push(optionId);
    session.currentStep++;

    logger.info('Recorded user choice', {
      sessionId: session.sessionId,
      optionId,
      choice,
      currentStep: session.currentStep,
      totalSteps: session.totalSteps
    });

    return session;
  }

  /**
   * Save completed profile to database
   */
  async saveProfile(session: ProfileSession): Promise<UserProfile> {
    if (!session.profile.userId || !session.profile.projectName) {
      throw new Error('Invalid profile data');
    }

    const profile: UserProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: session.profile.userId,
      projectName: session.profile.projectName,
      selectedChoices: session.profile.selectedChoices || {},
      requirements: session.profile.requirements || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Note: In a real implementation, you'd save this to a ProfileSession table
    // For now, we'll just return the profile object

    logger.info('Profile saved', {
      profileId: profile.id,
      userId: profile.userId,
      projectName: profile.projectName,
      choicesCount: Object.keys(profile.selectedChoices).length
    });

    return profile;
  }

  /**
   * Get core profiling options (always shown)
   */
  private getCoreProfilingOptions(): ProfilingOption[] {
    return [
      {
        id: 'project-type',
        category: 'tech-stack',
        title: 'Project Type',
        description: 'What type of application are you building?',
        required: true,
        multiSelect: false,
        choices: [
          {
            id: 'web-app',
            label: 'Web Application',
            description: 'Browser-based application with frontend and backend',
            value: 'web-app',
            tags: ['web', 'fullstack']
          },
          {
            id: 'api-service',
            label: 'API Service',
            description: 'Backend API service without frontend',
            value: 'api-service',
            tags: ['backend', 'api']
          },
          {
            id: 'mobile-app',
            label: 'Mobile Application',
            description: 'Native or hybrid mobile application',
            value: 'mobile-app',
            tags: ['mobile', 'react-native']
          },
          {
            id: 'desktop-app',
            label: 'Desktop Application',
            description: 'Cross-platform desktop application',
            value: 'desktop-app',
            tags: ['desktop', 'electron']
          }
        ]
      },
      {
        id: 'ui-style',
        category: 'ui-style',
        title: 'UI Style Preference',
        description: 'Choose your preferred user interface style',
        required: true,
        multiSelect: false,
        choices: [
          {
            id: 'modern-minimal',
            label: 'Modern Minimal',
            description: 'Clean, minimalist design with lots of whitespace',
            value: 'modern-minimal',
            tags: ['minimal', 'clean']
          },
          {
            id: 'professional',
            label: 'Professional Dashboard',
            description: 'Enterprise-grade dashboard with data tables and charts',
            value: 'professional',
            tags: ['enterprise', 'dashboard']
          },
          {
            id: 'creative',
            label: 'Creative & Colorful',
            description: 'Vibrant colors and creative layouts',
            value: 'creative',
            tags: ['colorful', 'creative']
          },
          {
            id: 'classic',
            label: 'Classic Bootstrap',
            description: 'Traditional web design with familiar patterns',
            value: 'classic',
            tags: ['bootstrap', 'traditional']
          }
        ]
      }
    ];
  }

  /**
   * Get backend-specific profiling options
   */
  private getBackendProfilingOptions(): ProfilingOption[] {
    return [
      {
        id: 'backend-framework',
        category: 'tech-stack',
        title: 'Backend Framework',
        description: 'Choose your preferred backend technology',
        required: true,
        multiSelect: false,
        choices: [
          {
            id: 'node-express',
            label: 'Node.js + Express',
            description: 'JavaScript backend with Express framework',
            value: 'node-express',
            tags: ['nodejs', 'javascript']
          },
          {
            id: 'node-fastify',
            label: 'Node.js + Fastify',
            description: 'High-performance Node.js framework',
            value: 'node-fastify',
            tags: ['nodejs', 'performance']
          },
          {
            id: 'python-fastapi',
            label: 'Python + FastAPI',
            description: 'Modern Python API framework',
            value: 'python-fastapi',
            tags: ['python', 'api']
          },
          {
            id: 'go-gin',
            label: 'Go + Gin',
            description: 'High-performance Go web framework',
            value: 'go-gin',
            tags: ['go', 'performance']
          }
        ]
      },
      {
        id: 'api-style',
        category: 'tech-stack',
        title: 'API Style',
        description: 'How should your API be structured?',
        required: true,
        multiSelect: false,
        choices: [
          {
            id: 'rest',
            label: 'REST API',
            description: 'Traditional RESTful API design',
            value: 'rest',
            tags: ['rest', 'traditional']
          },
          {
            id: 'graphql',
            label: 'GraphQL',
            description: 'Flexible query language for APIs',
            value: 'graphql',
            tags: ['graphql', 'flexible']
          },
          {
            id: 'trpc',
            label: 'tRPC',
            description: 'End-to-end typesafe APIs',
            value: 'trpc',
            tags: ['typescript', 'typesafe']
          }
        ]
      }
    ];
  }

  /**
   * Get frontend-specific profiling options
   */
  private getFrontendProfilingOptions(): ProfilingOption[] {
    return [
      {
        id: 'frontend-framework',
        category: 'tech-stack',
        title: 'Frontend Framework',
        description: 'Choose your preferred frontend technology',
        required: true,
        multiSelect: false,
        choices: [
          {
            id: 'react',
            label: 'React',
            description: 'Popular JavaScript library for building UIs',
            value: 'react',
            tags: ['react', 'javascript']
          },
          {
            id: 'nextjs',
            label: 'Next.js',
            description: 'React framework with SSR and routing',
            value: 'nextjs',
            tags: ['react', 'ssr']
          },
          {
            id: 'vue',
            label: 'Vue.js',
            description: 'Progressive JavaScript framework',
            value: 'vue',
            tags: ['vue', 'progressive']
          },
          {
            id: 'svelte',
            label: 'Svelte',
            description: 'Compile-time optimized framework',
            value: 'svelte',
            tags: ['svelte', 'performance']
          }
        ]
      },
      {
        id: 'styling-approach',
        category: 'ui-style',
        title: 'Styling Approach',
        description: 'How do you prefer to style your components?',
        required: true,
        multiSelect: false,
        choices: [
          {
            id: 'tailwind',
            label: 'Tailwind CSS',
            description: 'Utility-first CSS framework',
            value: 'tailwind',
            tags: ['utility', 'modern']
          },
          {
            id: 'styled-components',
            label: 'Styled Components',
            description: 'CSS-in-JS with component styling',
            value: 'styled-components',
            tags: ['css-in-js', 'react']
          },
          {
            id: 'css-modules',
            label: 'CSS Modules',
            description: 'Scoped CSS with modules',
            value: 'css-modules',
            tags: ['scoped', 'traditional']
          },
          {
            id: 'mui',
            label: 'Material-UI',
            description: 'React components implementing Material Design',
            value: 'mui',
            tags: ['material', 'components']
          }
        ]
      }
    ];
  }

  /**
   * Get data-specific profiling options
   */
  private getDataProfilingOptions(): ProfilingOption[] {
    return [
      {
        id: 'database',
        category: 'tech-stack',
        title: 'Database Technology',
        description: 'Choose your preferred database solution',
        required: true,
        multiSelect: false,
        choices: [
          {
            id: 'postgresql',
            label: 'PostgreSQL',
            description: 'Advanced open source relational database',
            value: 'postgresql',
            tags: ['sql', 'relational']
          },
          {
            id: 'mysql',
            label: 'MySQL',
            description: 'Popular open source relational database',
            value: 'mysql',
            tags: ['sql', 'relational']
          },
          {
            id: 'mongodb',
            label: 'MongoDB',
            description: 'NoSQL document database',
            value: 'mongodb',
            tags: ['nosql', 'document']
          },
          {
            id: 'sqlite',
            label: 'SQLite',
            description: 'Lightweight embedded database',
            value: 'sqlite',
            tags: ['lightweight', 'embedded']
          }
        ]
      },
      {
        id: 'orm',
        category: 'tech-stack',
        title: 'ORM/Database Layer',
        description: 'How do you want to interact with your database?',
        required: true,
        multiSelect: false,
        choices: [
          {
            id: 'prisma',
            label: 'Prisma',
            description: 'Modern database toolkit with type safety',
            value: 'prisma',
            tags: ['typescript', 'modern']
          },
          {
            id: 'typeorm',
            label: 'TypeORM',
            description: 'ORM for TypeScript and JavaScript',
            value: 'typeorm',
            tags: ['typescript', 'orm']
          },
          {
            id: 'mongoose',
            label: 'Mongoose',
            description: 'MongoDB object modeling for Node.js',
            value: 'mongoose',
            tags: ['mongodb', 'nodejs']
          },
          {
            id: 'raw-sql',
            label: 'Raw SQL',
            description: 'Direct SQL queries without ORM',
            value: 'raw-sql',
            tags: ['sql', 'performance']
          }
        ]
      }
    ];
  }

  /**
   * Get deployment-specific profiling options
   */
  private getDeploymentProfilingOptions(): ProfilingOption[] {
    return [
      {
        id: 'deployment-platform',
        category: 'deployment',
        title: 'Deployment Platform',
        description: 'Where do you want to deploy your application?',
        required: true,
        multiSelect: false,
        choices: [
          {
            id: 'vercel',
            label: 'Vercel',
            description: 'Platform for frontend frameworks and serverless functions',
            value: 'vercel',
            tags: ['serverless', 'frontend']
          },
          {
            id: 'netlify',
            label: 'Netlify',
            description: 'Platform for modern web projects',
            value: 'netlify',
            tags: ['jamstack', 'modern']
          },
          {
            id: 'railway',
            label: 'Railway',
            description: 'Simple cloud platform for full-stack applications',
            value: 'railway',
            tags: ['fullstack', 'simple']
          },
          {
            id: 'docker',
            label: 'Docker + VPS',
            description: 'Containerized deployment on virtual private server',
            value: 'docker',
            tags: ['docker', 'vps']
          }
        ]
      },
      {
        id: 'ci-cd',
        category: 'workflow',
        title: 'CI/CD Pipeline',
        description: 'Do you want automated deployment?',
        required: false,
        multiSelect: true,
        choices: [
          {
            id: 'github-actions',
            label: 'GitHub Actions',
            description: 'Automated workflows with GitHub Actions',
            value: 'github-actions',
            tags: ['github', 'automation']
          },
          {
            id: 'gitlab-ci',
            label: 'GitLab CI',
            description: 'GitLab integrated CI/CD',
            value: 'gitlab-ci',
            tags: ['gitlab', 'ci-cd']
          },
          {
            id: 'manual',
            label: 'Manual Deployment',
            description: 'No automated CI/CD, manual deployment only',
            value: 'manual',
            tags: ['manual', 'simple']
          }
        ]
      }
    ];
  }

  /**
   * Start interactive profiling session
   */
  async startProfilingSession(
    userId: string,
    projectName: string,
    requirements: ExtractedRequirement[]
  ): Promise<ProfileSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ProfileSession = {
      sessionId,
      currentStep: 0,
      totalSteps: this.getCoreProfilingOptions().length,
      profile: {
        userId,
        projectName,
        requirements,
        selectedChoices: {}
      },
      completedOptions: []
    };

    this.sessions.set(sessionId, session);

    logger.info('Profiling session started', {
      sessionId,
      userId,
      projectName,
      requirementsCount: requirements.length
    });

    return session;
  }

  /**
   * Record user choice for profiling option
   */
  async recordChoice(
    sessionId: string,
    optionId: string,
    choice: string | string[]
  ): Promise<ProfileSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Update profile with choice
    if (!session.profile.selectedChoices) {
      session.profile.selectedChoices = {};
    }
    session.profile.selectedChoices[optionId] = choice;

    // Add to completed options
    if (!session.completedOptions.includes(optionId)) {
      session.completedOptions.push(optionId);
    }

    // Move to next step
    session.currentStep = Math.min(session.currentStep + 1, session.totalSteps);
    
    // Update session
    this.sessions.set(sessionId, session);

    logger.info('Profiling choice recorded', {
      sessionId,
      optionId,
      choice,
      currentStep: session.currentStep
    });

    return session;
  }

  /**
   * Complete profiling session and return user profile
   */
  async completeSession(sessionId: string): Promise<UserProfile> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Create final user profile from session choices
    const userProfile: UserProfile = {
      id: sessionId + '-profile',
      userId: session.profile.userId || 'anonymous',
      projectName: session.profile.projectName || 'Untitled Project',
      selectedChoices: session.profile.selectedChoices || {},
      requirements: session.profile.requirements || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Clean up session
    this.sessions.delete(sessionId);

    logger.info('Profiling session completed', {
      sessionId,
      profileId: userProfile.id,
      choicesCount: Object.keys(userProfile.selectedChoices).length
    });

    return userProfile;
  }
}
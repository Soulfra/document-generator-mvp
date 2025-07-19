/**
 * VIRAL SERVICES - TypeScript Interfaces
 * 
 * Shared types and interfaces for all viral growth features
 */

// ============================================================================
// 💰 TREASURY & TOKEN ECONOMICS
// ============================================================================

export interface RevenueOptions {
  source?: 'usage' | 'subscription' | 'tip' | 'referral' | 'platform_share';
  userId?: string;
  metadata?: any;
}

export interface TokenHolding {
  userId: string;
  tokens: number;
  acquisitionType: 'initial' | 'earned' | 'referral' | 'upgrade';
  acquiredAt: Date;
}

export interface PlatformRevenue {
  id: string;
  totalRevenue: number;
  tokenHolders: TokenHolding[];
  dividendRate: number;
  gradeThresholds: Record<string, number>;
  status: 'active' | 'paused';
}

export interface TreasuryStats {
  totalRevenue: number;
  totalDividendsPaid: number;
  totalTokens: number;
  tokenHolders: number;
  dividendRate: number;
  nextDividendPool: number;
  averageTokensPerUser: number;
  gradeThresholds: Record<string, number>;
}

// ============================================================================
// 🤖 AGENT ECONOMY & MARKETPLACE
// ============================================================================

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  specialization: string;
  capabilities: string[];
  modelPreferences: string[];
  personalityTraits: string[];
  codeStyle: string;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
  pricePerToken: number;
}

export interface UserAgent {
  id: string;
  templateId: string;
  ownerId: string;
  customName: string;
  experience: number;
  specializations: string[];
  reputation: number;
  earnings: number;
  isPublic: boolean;
  collaborations: number;
  createdAt: Date;
  lastUsed: Date;
}

export interface AgentCollaboration {
  id: string;
  projectId: string;
  participants: {
    agentId: string;
    ownerId: string;
    role: string;
    contribution: number;
  }[];
  startedAt: Date;
  completedAt?: Date;
  outcome: 'success' | 'partial' | 'failed';
  revenueGenerated: number;
}

export interface MarketplaceStats {
  totalAgents: number;
  publicAgents: number;
  totalCollaborations: number;
  activeCollaborations: number;
  agentsByTemplate: Record<string, number>;
  topAgents: {
    id: string;
    name: string;
    reputation: number;
    earnings: number;
    collaborations: number;
    specializations: string[];
  }[];
  templates: number;
}

// ============================================================================
// 🚀 PROJECT SHOWCASE & SHARING
// ============================================================================

export interface ProjectShowcase {
  id: string;
  userId: string;
  title: string;
  description: string;
  beforeCode: string;
  afterCode: string;
  improvements: string[];
  technologies: string[];
  metrics: ShowcaseMetrics;
  shareMetrics: ShareMetrics;
  qrCode?: string;
  shareUrl: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShowcaseMetrics {
  complexity: number;
  performance: number;
  security: number;
  maintainability: number;
  linesReduced?: number;
  bugsFixed?: number;
  performanceGain?: number;
}

export interface ShareMetrics {
  views: number;
  likes: number;
  shares: number;
  forks: number;
  qrScans?: number;
}

export interface ShowcaseAnalytics {
  totalShowcases: number;
  totalViews: number;
  totalShares: number;
  avgImprovementScore: number;
  viralityScore: number;
  topTechnologies: { tech: string; count: number }[];
  recentTrending: ProjectShowcase[];
}

// ============================================================================
// 🔗 QR AUTHENTICATION & VIRAL LOOPS
// ============================================================================

export interface QRAuthSession {
  sessionId: string;
  qrCode: string;
  expiresAt: Date;
  scannedAt?: Date;
  completedAt?: Date;
  userId?: string;
  metadata?: {
    referralCode?: string;
    showcase?: string;
    agent?: string;
    [key: string]: any;
  };
}

export interface ViralLoop {
  type: 'referral' | 'showcase' | 'agent' | 'collaboration';
  sourceUserId: string;
  targetUserId?: string;
  metadata: {
    qrCode?: string;
    shareUrl?: string;
    incentive?: number;
    [key: string]: any;
  };
  completedAt?: Date;
  rewardIssued?: boolean;
}

// ============================================================================
// 📊 ANALYTICS & METRICS
// ============================================================================

export interface ViralGrowthMetrics {
  treasury: TreasuryStats;
  agents: MarketplaceStats;
  showcases: ShowcaseAnalytics;
  totalUsers: number;
  viralityScore: number;
  growthRate: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  topReferrers: {
    userId: string;
    name: string;
    referrals: number;
    earnings: number;
  }[];
}

export interface UserViralProfile {
  userId: string;
  platformTokens: number;
  totalEarnings: number;
  referralEarnings: number;
  agentsOwned: number;
  showcasesCreated: number;
  collaborationsParticipated: number;
  viralityScore: number;
  referralCode: string;
  referralCount: number;
}

// ============================================================================
// 🎯 PRICING & TIERS
// ============================================================================

export interface PricingTier {
  id: string;
  name: string;
  price: number; // in cents
  features: string[];
  limits: {
    filesPerMonth: number;
    tokensPerMonth: number;
    agentsAllowed: number;
    collaborationsPerMonth: number;
    showcasesPerMonth: number;
    apiCalls: number;
  };
  viralBenefits: {
    tokenMultiplier: number;
    referralBonus: number;
    dividendRate: number;
  };
}

// ============================================================================
// 🔄 SERVICE RESPONSES
// ============================================================================

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    userId?: string;
    cost?: number;
    tokensAwarded?: number;
    [key: string]: any;
  };
}

export interface BatchResponse<T = any> {
  success: boolean;
  results: ServiceResponse<T>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalCost?: number;
    totalTokensAwarded?: number;
  };
}

// ============================================================================
// 🛠️ UTILITY TYPES
// ============================================================================

export type ViralEventType = 
  | 'user_signup'
  | 'agent_created' 
  | 'showcase_published'
  | 'collaboration_started'
  | 'collaboration_completed'
  | 'referral_successful'
  | 'tokens_awarded'
  | 'dividend_received'
  | 'tier_upgraded';

export type NotificationPreference = {
  email: boolean;
  push: boolean;
  inApp: boolean;
  webhooks?: string[];
};

export type ViralFeatureFlag = 
  | 'treasury_enabled'
  | 'agents_enabled' 
  | 'showcases_enabled'
  | 'qr_auth_enabled'
  | 'referrals_enabled'
  | 'collaborations_enabled';
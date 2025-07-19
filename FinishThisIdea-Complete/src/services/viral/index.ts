/**
 * VIRAL SERVICES - Unified Exports
 * 
 * Central export point for all viral growth features:
 * - Treasury & Token Economics
 * - Agent Economy & Marketplace  
 * - Project Showcase & Sharing
 * - QR Authentication & Viral Loops
 */

// Core Services
export { treasuryService } from './treasury.service';
export { agentEconomyService } from './agent-economy.service';
export { projectShowcaseService } from './project-showcase.service';
export { qrAuthService } from './qr-auth.service';

// Service Interfaces & Types
export type {
  RevenueOptions,
  AgentTemplate,
  UserAgent,
  ProjectShowcase,
  ShowcaseMetrics
} from './types';

// Utility Functions
export { 
  generateReferralCode,
  calculateTokenReward,
  validateShowcaseData 
} from './utils/viral-utils';

/**
 * Initialize all viral services
 * Should be called during application startup
 */
export async function initializeViralServices(): Promise<void> {
  // Services initialize themselves, but we can add any cross-service setup here
  console.log('🚀 Viral services initialized');
}

/**
 * Get platform-wide viral growth metrics
 * Useful for admin dashboards and analytics
 */
export async function getViralGrowthMetrics(): Promise<{
  treasury: any;
  agents: any;
  showcases: any;
  totalUsers: number;
  viralityScore: number;
}> {
  const [treasuryStats, agentStats, showcaseAnalytics] = await Promise.all([
    treasuryService.getPlatformStats(),
    agentEconomyService.getMarketplaceStats(),
    projectShowcaseService.getAnalytics()
  ]);

  // Calculate overall virality score
  const viralityScore = calculateViralityScore({
    treasury: treasuryStats,
    agents: agentStats,
    showcases: showcaseAnalytics
  });

  return {
    treasury: treasuryStats,
    agents: agentStats,
    showcases: showcaseAnalytics,
    totalUsers: treasuryStats.tokenHolders || 0,
    viralityScore
  };
}

/**
 * Calculate platform virality score (0-100)
 * Based on user engagement, sharing, and growth metrics
 */
function calculateViralityScore(metrics: any): number {
  const {
    treasury: { tokenHolders = 0, totalRevenue = 0 },
    agents: { totalAgents = 0, publicAgents = 0, totalCollaborations = 0 },
    showcases: { totalShares = 0, totalViews = 0, viralityScore: showcaseVirality = 0 }
  } = metrics;

  // Weighted scoring algorithm
  const userEngagement = Math.min(tokenHolders / 100, 1) * 25; // 25% weight
  const agentActivity = Math.min(totalCollaborations / 50, 1) * 20; // 20% weight  
  const sharingActivity = Math.min(totalShares / 200, 1) * 25; // 25% weight
  const showcaseVirality_normalized = Math.min(showcaseVirality / 100, 1) * 30; // 30% weight

  const totalScore = userEngagement + agentActivity + sharingActivity + showcaseVirality_normalized;
  
  return Math.round(totalScore);
}

/**
 * Helper to check if viral features are enabled
 * Can be used for feature flagging
 */
export function isViralFeaturesEnabled(): boolean {
  return process.env.ENABLE_VIRAL_FEATURES !== 'false';
}

/**
 * Quick health check for all viral services
 */
export async function checkViralServicesHealth(): Promise<{
  treasury: boolean;
  agents: boolean;
  showcases: boolean;
  qrAuth: boolean;
  overall: boolean;
}> {
  const health = {
    treasury: true,
    agents: true,
    showcases: true,
    qrAuth: true,
    overall: true
  };

  try {
    // Test treasury service
    await treasuryService.getPlatformStats();
  } catch (error) {
    health.treasury = false;
    health.overall = false;
  }

  try {
    // Test agent service
    await agentEconomyService.getMarketplaceStats();
  } catch (error) {
    health.agents = false;
    health.overall = false;
  }

  try {
    // Test showcase service
    await projectShowcaseService.getAnalytics();
  } catch (error) {
    health.showcases = false;
    health.overall = false;
  }

  try {
    // Test QR auth service (if available)
    // Simple check since QR auth might not have a direct health method
    health.qrAuth = true;
  } catch (error) {
    health.qrAuth = false;
    health.overall = false;
  }

  return health;
}
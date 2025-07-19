"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateShowcaseData = exports.calculateTokenReward = exports.generateReferralCode = exports.qrAuthService = exports.projectShowcaseService = exports.agentEconomyService = exports.treasuryService = void 0;
exports.initializeViralServices = initializeViralServices;
exports.getViralGrowthMetrics = getViralGrowthMetrics;
exports.isViralFeaturesEnabled = isViralFeaturesEnabled;
exports.checkViralServicesHealth = checkViralServicesHealth;
var treasury_service_1 = require("./treasury.service");
Object.defineProperty(exports, "treasuryService", { enumerable: true, get: function () { return treasury_service_1.treasuryService; } });
var agent_economy_service_1 = require("./agent-economy.service");
Object.defineProperty(exports, "agentEconomyService", { enumerable: true, get: function () { return agent_economy_service_1.agentEconomyService; } });
var project_showcase_service_1 = require("./project-showcase.service");
Object.defineProperty(exports, "projectShowcaseService", { enumerable: true, get: function () { return project_showcase_service_1.projectShowcaseService; } });
var qr_auth_service_1 = require("./qr-auth.service");
Object.defineProperty(exports, "qrAuthService", { enumerable: true, get: function () { return qr_auth_service_1.qrAuthService; } });
var viral_utils_1 = require("./utils/viral-utils");
Object.defineProperty(exports, "generateReferralCode", { enumerable: true, get: function () { return viral_utils_1.generateReferralCode; } });
Object.defineProperty(exports, "calculateTokenReward", { enumerable: true, get: function () { return viral_utils_1.calculateTokenReward; } });
Object.defineProperty(exports, "validateShowcaseData", { enumerable: true, get: function () { return viral_utils_1.validateShowcaseData; } });
async function initializeViralServices() {
    console.log('🚀 Viral services initialized');
}
async function getViralGrowthMetrics() {
    const [treasuryStats, agentStats, showcaseAnalytics] = await Promise.all([
        treasuryService.getPlatformStats(),
        agentEconomyService.getMarketplaceStats(),
        projectShowcaseService.getAnalytics()
    ]);
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
function calculateViralityScore(metrics) {
    const { treasury: { tokenHolders = 0, totalRevenue = 0 }, agents: { totalAgents = 0, publicAgents = 0, totalCollaborations = 0 }, showcases: { totalShares = 0, totalViews = 0, viralityScore: showcaseVirality = 0 } } = metrics;
    const userEngagement = Math.min(tokenHolders / 100, 1) * 25;
    const agentActivity = Math.min(totalCollaborations / 50, 1) * 20;
    const sharingActivity = Math.min(totalShares / 200, 1) * 25;
    const showcaseVirality_normalized = Math.min(showcaseVirality / 100, 1) * 30;
    const totalScore = userEngagement + agentActivity + sharingActivity + showcaseVirality_normalized;
    return Math.round(totalScore);
}
function isViralFeaturesEnabled() {
    return process.env.ENABLE_VIRAL_FEATURES !== 'false';
}
async function checkViralServicesHealth() {
    const health = {
        treasury: true,
        agents: true,
        showcases: true,
        qrAuth: true,
        overall: true
    };
    try {
        await treasuryService.getPlatformStats();
    }
    catch (error) {
        health.treasury = false;
        health.overall = false;
    }
    try {
        await agentEconomyService.getMarketplaceStats();
    }
    catch (error) {
        health.agents = false;
        health.overall = false;
    }
    try {
        await projectShowcaseService.getAnalytics();
    }
    catch (error) {
        health.showcases = false;
        health.overall = false;
    }
    try {
        health.qrAuth = true;
    }
    catch (error) {
        health.qrAuth = false;
        health.overall = false;
    }
    return health;
}
//# sourceMappingURL=index.js.map
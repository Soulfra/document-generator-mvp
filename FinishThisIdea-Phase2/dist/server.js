"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const logger_1 = require("./utils/logger");
const database_1 = require("./utils/database");
const router_1 = require("./llm/router");
// Import monitoring tools
const analytics_dashboard_1 = require("./monitoring/analytics-dashboard");
// Import routes
const dashboard_route_1 = __importDefault(require("./api/routes/dashboard.route"));
const payments_route_1 = require("./api/routes/payments.route");
const upload_route_1 = __importDefault(require("./api/routes/upload.route"));
const qr_auth_route_1 = __importDefault(require("./api/routes/qr-auth.route"));
const treasury_route_1 = __importDefault(require("./api/routes/treasury.route"));
const agents_route_1 = __importDefault(require("./api/routes/agents.route"));
const showcase_route_1 = __importDefault(require("./api/routes/showcase.route"));
// Import job queues - Original Phase 2 services
require("./jobs/cleanup.job");
require("./jobs/documentation.job");
require("./jobs/api-generation.job");
require("./jobs/test-generation.job");
require("./jobs/security-analysis.job");
// Import job queues - Soulfra services
require("./jobs/codeCleanup.job");
require("./jobs/codeNavigation.job");
require("./jobs/deepCleanup.job");
require("./jobs/importOptimizer.job");
require("./jobs/documentationGenerator.job");
require("./jobs/businessDocs.job");
require("./jobs/apiGenerator.job");
require("./jobs/chatApi.job");
require("./jobs/orchestrationApi.job");
require("./jobs/testGenerator.job");
require("./jobs/integrationTests.job");
require("./jobs/securityFilter.job");
require("./jobs/accessControl.job");
require("./jobs/securityEncoding.job");
require("./jobs/aiConductor.job");
require("./jobs/aiValidator.job");
require("./jobs/aiVersioning.job");
require("./jobs/autonomousAgent.job");
require("./jobs/uxOptimizer.job");
require("./jobs/aiUx.job");
require("./jobs/loadTesting.job");
require("./jobs/codeConsolidation.job");
require("./jobs/ideaExtraction.job");
require("./jobs/serviceChaining.job");
require("./jobs/containerization.job");
require("./jobs/enterpriseSuite.job");
require("./jobs/distributedSystem.job");
require("./jobs/workflowAutomation.job");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const PORT = process.env.PORT || 3002;
async function startServer() {
    try {
        // Initialize database
        await database_1.prisma.$connect();
        logger_1.logger.info('✅ Database connected');
        // Initialize LLM router
        await router_1.llmRouter.initialize();
        logger_1.logger.info('✅ LLM router initialized');
        // Middleware
        app.use((0, helmet_1.default)());
        app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true
        }));
        app.use((0, compression_1.default)());
        // Session middleware
        app.use((0, express_session_1.default)({
            secret: process.env.SESSION_SECRET || 'finishthisidea-secret-key',
            resave: false,
            saveUninitialized: true,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));
        // Special handling for Stripe webhooks (raw body)
        app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
        // JSON parsing for all other routes
        app.use(express_1.default.json({ limit: '50mb' }));
        app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
        // Serve static files
        app.use(express_1.default.static('public'));
        // Health check
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'FinishThisIdea Phase2',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
        // API Routes
        app.use('/api/dashboard', dashboard_route_1.default);
        app.use('/api/payments', payments_route_1.paymentsRouter);
        app.use('/api/upload', upload_route_1.default);
        app.use('/api/qr-auth', qr_auth_route_1.default);
        app.use('/api/treasury', treasury_route_1.default);
        app.use('/api/agents', agents_route_1.default);
        app.use('/api/showcase', showcase_route_1.default);
        // WebSocket connection handling
        io.on('connection', (socket) => {
            logger_1.logger.info('Client connected', { socketId: socket.id });
            socket.on('subscribe-job', (jobId) => {
                socket.join(`job-${jobId}`);
                logger_1.logger.info('Client subscribed to job updates', { socketId: socket.id, jobId });
            });
            socket.on('subscribe-bundle', (bundleId) => {
                socket.join(`bundle-${bundleId}`);
                logger_1.logger.info('Client subscribed to bundle updates', { socketId: socket.id, bundleId });
            });
            socket.on('disconnect', () => {
                logger_1.logger.info('Client disconnected', { socketId: socket.id });
            });
        });
        // Job progress updates via WebSocket - Original Phase 2 services
        const { cleanupQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/cleanup.job')));
        const { documentationQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/documentation.job')));
        const { apiGenerationQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/api-generation.job')));
        const { testGenerationQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/test-generation.job')));
        const { securityAnalysisQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/security-analysis.job')));
        // Soulfra services
        const { codeCleanupQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/codeCleanup.job')));
        const { codeNavigationQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/codeNavigation.job')));
        const { deepCleanupQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/deepCleanup.job')));
        const { importOptimizerQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/importOptimizer.job')));
        const { documentationGeneratorQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/documentationGenerator.job')));
        const { businessDocsQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/businessDocs.job')));
        const { apiGeneratorQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/apiGenerator.job')));
        const { chatApiQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/chatApi.job')));
        const { orchestrationApiQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/orchestrationApi.job')));
        const { testGeneratorQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/testGenerator.job')));
        const { integrationTestsQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/integrationTests.job')));
        const { securityFilterQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/securityFilter.job')));
        const { accessControlQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/accessControl.job')));
        const { securityEncodingQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/securityEncoding.job')));
        const { aiConductorQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/aiConductor.job')));
        const { aiValidatorQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/aiValidator.job')));
        const { aiVersioningQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/aiVersioning.job')));
        const { autonomousAgentQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/autonomousAgent.job')));
        const { uxOptimizerQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/uxOptimizer.job')));
        const { aiUxQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/aiUx.job')));
        const { loadTestingQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/loadTesting.job')));
        const { codeConsolidationQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/codeConsolidation.job')));
        const { ideaExtractionQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/ideaExtraction.job')));
        const { serviceChainingQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/serviceChaining.job')));
        const { containerizationQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/containerization.job')));
        const { enterpriseSuiteQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/enterpriseSuite.job')));
        const { distributedSystemQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/distributedSystem.job')));
        const { workflowAutomationQueue } = await Promise.resolve().then(() => __importStar(require('./jobs/workflowAutomation.job')));
        // Setup progress tracking for all queues
        const allQueues = [
            cleanupQueue, documentationQueue, apiGenerationQueue, testGenerationQueue, securityAnalysisQueue,
            codeCleanupQueue, codeNavigationQueue, deepCleanupQueue, importOptimizerQueue, documentationGeneratorQueue,
            businessDocsQueue, apiGeneratorQueue, chatApiQueue, orchestrationApiQueue, testGeneratorQueue,
            integrationTestsQueue, securityFilterQueue, accessControlQueue, securityEncodingQueue, aiConductorQueue,
            aiValidatorQueue, aiVersioningQueue, autonomousAgentQueue, uxOptimizerQueue, aiUxQueue,
            loadTestingQueue, codeConsolidationQueue, ideaExtractionQueue, serviceChainingQueue, containerizationQueue,
            enterpriseSuiteQueue, distributedSystemQueue, workflowAutomationQueue
        ];
        allQueues.forEach(queue => {
            queue.on('progress', (job, progress) => {
                const jobId = job.data.jobId;
                io.to(`job-${jobId}`).emit('job-progress', {
                    jobId,
                    progress,
                    status: 'PROCESSING'
                });
            });
            queue.on('completed', async (job, result) => {
                const jobId = job.data.jobId;
                // Get updated job data
                const jobData = await database_1.prisma.job.findUnique({
                    where: { id: jobId },
                    include: { bundle: true }
                });
                io.to(`job-${jobId}`).emit('job-completed', {
                    jobId,
                    progress: 100,
                    status: 'COMPLETED',
                    result
                });
                // If part of bundle, check bundle completion
                if (jobData?.bundle) {
                    const bundleJobs = await database_1.prisma.job.findMany({
                        where: { bundleId: jobData.bundle.id }
                    });
                    const allCompleted = bundleJobs.every(j => j.status === 'COMPLETED');
                    if (allCompleted) {
                        await database_1.prisma.bundle.update({
                            where: { id: jobData.bundle.id },
                            data: { status: 'COMPLETED' }
                        });
                        io.to(`bundle-${jobData.bundle.id}`).emit('bundle-completed', {
                            bundleId: jobData.bundle.id,
                            status: 'COMPLETED',
                            jobs: bundleJobs
                        });
                    }
                }
            });
            queue.on('failed', async (job, error) => {
                const jobId = job.data.jobId;
                io.to(`job-${jobId}`).emit('job-failed', {
                    jobId,
                    status: 'FAILED',
                    error: error.message
                });
                // Update bundle status if applicable
                const jobData = await database_1.prisma.job.findUnique({
                    where: { id: jobId },
                    include: { bundle: true }
                });
                if (jobData?.bundle) {
                    await database_1.prisma.bundle.update({
                        where: { id: jobData.bundle.id },
                        data: { status: 'FAILED' }
                    });
                    io.to(`bundle-${jobData.bundle.id}`).emit('bundle-failed', {
                        bundleId: jobData.bundle.id,
                        status: 'FAILED',
                        failedJobId: jobId,
                        error: error.message
                    });
                }
            });
        });
        // Error handling middleware
        app.use((error, req, res, next) => {
            logger_1.logger.error('Unhandled error', {
                error: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method
            });
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        });
        // 404 handler
        app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Route not found'
            });
        });
        // Start server
        server.listen(PORT, () => {
            logger_1.logger.info(`🚀 FinishThisIdea Phase2 running on port ${PORT}`);
            logger_1.logger.info(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/services`);
            logger_1.logger.info(`💳 Payments: http://localhost:${PORT}/api/payments`);
            logger_1.logger.info(`💰 Treasury: http://localhost:${PORT}/treasury.html`);
            logger_1.logger.info(`🤖 Agents: http://localhost:${PORT}/api/agents/templates`);
            logger_1.logger.info(`🚀 Showcase: http://localhost:${PORT}/showcase.html`);
            logger_1.logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
            // Start analytics dashboard
            const analytics = new analytics_dashboard_1.AnalyticsDashboard(8889);
            analytics.start();
            logger_1.logger.info(`📈 Analytics Dashboard: http://localhost:8889`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('Received SIGTERM, shutting down gracefully...');
    try {
        await database_1.prisma.$disconnect();
        logger_1.logger.info('Database disconnected');
        server.close(() => {
            logger_1.logger.info('Server closed');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});
process.on('SIGINT', async () => {
    logger_1.logger.info('Received SIGINT, shutting down gracefully...');
    try {
        await database_1.prisma.$disconnect();
        logger_1.logger.info('Database disconnected');
        server.close(() => {
            logger_1.logger.info('Server closed');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map
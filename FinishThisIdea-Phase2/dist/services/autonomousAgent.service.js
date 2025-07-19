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
exports.processAutonomousAgent = processAutonomousAgent;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const storage_1 = require("../utils/storage");
const errors_1 = require("../utils/errors");
const child_process_1 = require("child_process");
/**
 * Autonomous Agent Service
 * Price: $10.0
 * AUTONOMOUS SIMPLE - Works within 2 minute limit
 */
async function processAutonomousAgent(jobId, config, progressCallback) {
    const updateProgress = (progress) => {
        progressCallback?.(progress);
    };
    updateProgress(5);
    try {
        const job = await database_1.prisma.job.findUnique({ where: { id: jobId } });
        if (!job)
            throw new errors_1.ProcessingError('Job not found');
        logger_1.logger.info('Starting autonomousAgent processing', { jobId });
        // Download and process
        const inputBuffer = await (0, storage_1.downloadFromS3)(job.inputFileUrl);
        const tempDir = path_1.default.join('/tmp', `autonomousAgent-${jobId}`);
        await promises_1.default.mkdir(tempDir, { recursive: true });
        const inputPath = path_1.default.join(tempDir, 'input.zip');
        await promises_1.default.writeFile(inputPath, inputBuffer);
        updateProgress(20);
        // Call Soulfra service via wrapper
        const result = await new Promise((resolve, reject) => {
            const proc = (0, child_process_1.spawn)('python3', [
                path_1.default.join(__dirname, '../../scripts/soulfra-service-wrapper.py'),
                path_1.default.join(__dirname, '../soulfra-scripts/autonomous-agent.py'),
                '--input', inputPath,
                '--output', tempDir,
                '--job-mode'
            ]);
            let output = '';
            proc.stdout.on('data', (data) => {
                const str = data.toString();
                output += str;
                const match = str.match(/progress: (\d+)/);
                if (match)
                    updateProgress(20 + (parseInt(match[1]) * 0.6));
            });
            proc.stderr.on('data', (data) => console.error(data.toString()));
            proc.on('close', (code) => {
                if (code !== 0)
                    reject(new Error('Processing failed'));
                else {
                    const jsonMatch = output.match(/\{[^{}]*\}/);
                    resolve(jsonMatch ? JSON.parse(jsonMatch[0]) : { success: true });
                }
            });
        });
        updateProgress(80);
        // Upload result
        const outputPath = path_1.default.join(tempDir, 'output.zip');
        if (!(await promises_1.default.stat(outputPath).catch(() => null))) {
            // Create output zip if not exists
            const archiver = await Promise.resolve().then(() => __importStar(require('archiver')));
            const output = promises_1.default.createWriteStream(outputPath);
            const archive = archiver.create('zip', { zlib: { level: 9 } });
            archive.pipe(output);
            archive.directory(tempDir, false);
            await archive.finalize();
        }
        const outputBuffer = await promises_1.default.readFile(outputPath);
        const outputUrl = await (0, storage_1.uploadToS3)(outputBuffer, `autonomousAgent/${jobId}/output.zip`);
        await promises_1.default.rm(tempDir, { recursive: true, force: true });
        updateProgress(100);
        return {
            outputFileUrl: outputUrl,
            metadata: result.metadata || {},
            processingCost: 0.001
        };
    }
    catch (error) {
        logger_1.logger.error('autonomousAgent processing failed', { jobId, error });
        throw error;
    }
}
//# sourceMappingURL=autonomousAgent.service.js.map
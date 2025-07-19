"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
(0, globals_1.describe)('Soulfra Service Wrapper Integration', () => {
    const testDir = path_1.default.join('/tmp', 'test-wrapper-' + (0, uuid_1.v4)());
    const testInput = path_1.default.join(testDir, 'input.zip');
    const testOutput = path_1.default.join(testDir, 'output');
    (0, globals_1.beforeAll)(async () => {
        // Create test directories
        await promises_1.default.mkdir(testDir, { recursive: true });
        await promises_1.default.mkdir(testOutput, { recursive: true });
        // Create a simple test zip file
        const testContent = 'console.log("Hello World");';
        const inputFile = path_1.default.join(testDir, 'test.js');
        await promises_1.default.writeFile(inputFile, testContent);
        // Create zip using native tools
        await new Promise((resolve, reject) => {
            const zip = (0, child_process_1.spawn)('zip', ['-j', testInput, inputFile], { cwd: testDir });
            zip.on('close', (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Zip failed with code ${code}`));
            });
        });
    });
    (0, globals_1.afterAll)(async () => {
        // Cleanup
        await promises_1.default.rm(testDir, { recursive: true, force: true });
    });
    (0, globals_1.it)('should execute wrapper with a simple Python service', async () => {
        // Test with import-optimizer as it's one of the simpler services
        const wrapperPath = path_1.default.join(__dirname, '../../../scripts/soulfra-service-wrapper.py');
        const servicePath = path_1.default.join(__dirname, '../../soulfra-scripts/import-optimizer.py');
        const result = await new Promise((resolve) => {
            const proc = (0, child_process_1.spawn)('python3', [
                wrapperPath,
                servicePath,
                '--input', testInput,
                '--output', testOutput,
                '--job-mode'
            ]);
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            proc.on('close', (code) => {
                resolve({
                    success: code === 0,
                    output: stdout,
                    error: stderr
                });
            });
        });
        (0, globals_1.expect)(result.success).toBe(true);
        (0, globals_1.expect)(result.output).toContain('progress:');
        (0, globals_1.expect)(result.output).toContain('"success": true');
    }, 30000); // 30 second timeout
    (0, globals_1.it)('should handle progress updates correctly', async () => {
        const wrapperPath = path_1.default.join(__dirname, '../../../scripts/soulfra-service-wrapper.py');
        const servicePath = path_1.default.join(__dirname, '../../soulfra-scripts/code-cleanup.py');
        const progressUpdates = [];
        await new Promise((resolve, reject) => {
            const proc = (0, child_process_1.spawn)('python3', [
                wrapperPath,
                servicePath,
                '--input', testInput,
                '--output', testOutput,
                '--job-mode'
            ]);
            proc.stdout.on('data', (data) => {
                const output = data.toString();
                const progressMatch = output.match(/progress:\s*(\d+)/g);
                if (progressMatch) {
                    progressMatch.forEach(match => {
                        const value = parseInt(match.split(':')[1].trim());
                        progressUpdates.push(value);
                    });
                }
            });
            proc.on('close', (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Process failed with code ${code}`));
            });
        });
        // Should have progress updates
        (0, globals_1.expect)(progressUpdates.length).toBeGreaterThan(0);
        (0, globals_1.expect)(progressUpdates).toContain(10);
        (0, globals_1.expect)(progressUpdates).toContain(100);
        // Progress should be in ascending order
        for (let i = 1; i < progressUpdates.length; i++) {
            (0, globals_1.expect)(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1]);
        }
    }, 30000);
    (0, globals_1.it)('should create output files', async () => {
        const wrapperPath = path_1.default.join(__dirname, '../../../scripts/soulfra-service-wrapper.py');
        const servicePath = path_1.default.join(__dirname, '../../soulfra-scripts/documentation-generator.py');
        await new Promise((resolve, reject) => {
            const proc = (0, child_process_1.spawn)('python3', [
                wrapperPath,
                servicePath,
                '--input', testInput,
                '--output', testOutput,
                '--job-mode'
            ]);
            proc.on('close', (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Process failed with code ${code}`));
            });
        });
        // Check that output files were created
        const outputFiles = await promises_1.default.readdir(testOutput);
        (0, globals_1.expect)(outputFiles.length).toBeGreaterThan(0);
        // Should have at least an output.zip
        const hasOutputZip = outputFiles.some(file => file.endsWith('.zip'));
        (0, globals_1.expect)(hasOutputZip).toBe(true);
    }, 30000);
});
//# sourceMappingURL=test-service-wrapper.js.map
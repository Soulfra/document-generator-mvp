#!/usr/bin/env tsx
/**
 * Test all services to ensure they're properly integrated
 * Run with: npm run test:services
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { logger } from '../src/utils/logger';

interface ServiceTest {
  id: string;
  name: string;
  scriptPath: string;
  expectedOutput?: string[];
}

// List of all services to test
const SERVICES_TO_TEST: ServiceTest[] = [
  // Original Phase 2 services (these use TypeScript directly)
  { id: 'cleanup', name: 'Code Cleanup (Phase1)', scriptPath: 'typescript', expectedOutput: ['cleaned'] },
  { id: 'documentation', name: 'Documentation Generator', scriptPath: 'typescript', expectedOutput: ['docs'] },
  { id: 'api-generation', name: 'API Generator', scriptPath: 'typescript', expectedOutput: ['api'] },
  { id: 'test-generation', name: 'Test Generator', scriptPath: 'typescript', expectedOutput: ['tests'] },
  { id: 'security-analysis', name: 'Security Analyzer', scriptPath: 'typescript', expectedOutput: ['vulnerabilities'] },
  
  // Soulfra Python services
  { id: 'code-cleanup', name: 'Code Cleanup (Soulfra)', scriptPath: 'src/soulfra-scripts/code-cleanup.py' },
  { id: 'code-navigation', name: 'Code Navigation', scriptPath: 'src/soulfra-scripts/code-navigation.py' },
  { id: 'deep-cleanup', name: 'Deep Cleanup', scriptPath: 'src/soulfra-scripts/deep-cleanup.py' },
  { id: 'import-optimizer', name: 'Import Optimizer', scriptPath: 'src/soulfra-scripts/import-optimizer.py' },
  { id: 'documentation-generator', name: 'Documentation Generator (Soulfra)', scriptPath: 'src/soulfra-scripts/documentation-generator.py' },
  { id: 'business-docs', name: 'Business Docs', scriptPath: 'src/soulfra-scripts/business-docs.py' },
  { id: 'api-generator', name: 'API Generator (Soulfra)', scriptPath: 'src/soulfra-scripts/api-generator.py' },
  { id: 'chat-api', name: 'Chat API', scriptPath: 'src/soulfra-scripts/chat-api.py' },
  { id: 'orchestration-api', name: 'Orchestration API', scriptPath: 'src/soulfra-scripts/orchestration-api.py' },
  { id: 'test-generator', name: 'Test Generator (Soulfra)', scriptPath: 'src/soulfra-scripts/test-generator.py' },
  { id: 'integration-tests', name: 'Integration Tests', scriptPath: 'src/soulfra-scripts/integration-tests.py' },
  { id: 'security-filter', name: 'Security Filter', scriptPath: 'src/soulfra-scripts/security-filter.py' },
  { id: 'access-control', name: 'Access Control', scriptPath: 'src/soulfra-scripts/access-control.py' },
  { id: 'security-encoding', name: 'Security Encoding', scriptPath: 'src/soulfra-scripts/security-encoding.py' },
  { id: 'ai-conductor', name: 'AI Conductor', scriptPath: 'src/soulfra-scripts/ai-conductor.py' },
  { id: 'ai-validator', name: 'AI Validator', scriptPath: 'src/soulfra-scripts/ai-validator.py' },
  { id: 'ai-versioning', name: 'AI Versioning', scriptPath: 'src/soulfra-scripts/ai-versioning.py' },
  { id: 'autonomous-agent', name: 'Autonomous Agent', scriptPath: 'src/soulfra-scripts/autonomous-agent.py' },
  { id: 'ux-optimizer', name: 'UX Optimizer', scriptPath: 'src/soulfra-scripts/ux-optimizer.py' },
  { id: 'ai-ux', name: 'AI UX', scriptPath: 'src/soulfra-scripts/ai-ux.py' },
  { id: 'load-testing', name: 'Load Testing', scriptPath: 'src/soulfra-scripts/load-testing.py' },
  { id: 'code-consolidation', name: 'Code Consolidation', scriptPath: 'src/soulfra-scripts/code-consolidation.py' },
  { id: 'idea-extraction', name: 'Idea Extraction', scriptPath: 'src/soulfra-scripts/idea-extraction.py' },
  { id: 'service-chaining', name: 'Service Chaining', scriptPath: 'src/soulfra-scripts/service-chaining.py' },
  { id: 'containerization', name: 'Containerization', scriptPath: 'src/soulfra-scripts/containerization.py' },
  { id: 'enterprise-suite', name: 'Enterprise Suite', scriptPath: 'src/soulfra-scripts/enterprise-suite.py' },
  { id: 'distributed-system', name: 'Distributed System', scriptPath: 'src/soulfra-scripts/distributed-system.py' },
  { id: 'workflow-automation', name: 'Workflow Automation', scriptPath: 'src/soulfra-scripts/workflow-automation.py' }
];

async function createTestInput(): Promise<{ inputPath: string; tempDir: string }> {
  const tempDir = path.join('/tmp', 'service-test-' + uuidv4());
  await fs.mkdir(tempDir, { recursive: true });

  // Create sample code files
  const sampleCode = `
// Sample JavaScript code for testing
function calculateSum(a, b) {
  return a + b;
}

class UserService {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
  }

  getUser(id) {
    return this.users.find(u => u.id === id);
  }
}

module.exports = { calculateSum, UserService };
`;

  const samplePython = `
# Sample Python code for testing
import json
import os

def process_data(data):
    """Process the input data"""
    return {"processed": True, "data": data}

class DataHandler:
    def __init__(self):
        self.data = []
    
    def add_item(self, item):
        self.data.append(item)
    
    def get_items(self):
        return self.data

if __name__ == "__main__":
    handler = DataHandler()
    handler.add_item({"test": "data"})
    print(json.dumps(handler.get_items()))
`;

  // Write sample files
  await fs.writeFile(path.join(tempDir, 'index.js'), sampleCode);
  await fs.writeFile(path.join(tempDir, 'main.py'), samplePython);
  await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    main: 'index.js'
  }, null, 2));

  // Create zip file
  const zipPath = path.join(tempDir, 'input.zip');
  await new Promise<void>((resolve, reject) => {
    const zip = spawn('zip', ['-r', 'input.zip', '.'], { cwd: tempDir });
    zip.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Zip creation failed with code ${code}`));
    });
  });

  return { inputPath: zipPath, tempDir };
}

async function testPythonService(service: ServiceTest, inputPath: string): Promise<boolean> {
  const outputDir = path.join('/tmp', `output-${service.id}-${uuidv4()}`);
  await fs.mkdir(outputDir, { recursive: true });

  try {
    const wrapperPath = path.join(__dirname, '../scripts/soulfra-service-wrapper.py');
    
    const result = await new Promise<{ success: boolean; output: string; error: string }>((resolve) => {
      const proc = spawn('python3', [
        wrapperPath,
        service.scriptPath,
        '--input', inputPath,
        '--output', outputDir,
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

    if (result.success) {
      logger.info(`✅ ${service.name}: SUCCESS`);
      
      // Check for output files
      const outputFiles = await fs.readdir(outputDir);
      logger.info(`   Output files: ${outputFiles.join(', ')}`);
      
      return true;
    } else {
      logger.error(`❌ ${service.name}: FAILED`);
      logger.error(`   Error: ${result.error}`);
      return false;
    }
  } catch (error) {
    logger.error(`❌ ${service.name}: EXCEPTION`, error);
    return false;
  } finally {
    // Cleanup
    await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function testTypeScriptService(service: ServiceTest): Promise<boolean> {
  // For TypeScript services, we'll just check if the service file exists
  // Full integration testing would require starting the server
  try {
    const servicePath = path.join(__dirname, `../src/services/${service.id}.service.ts`);
    await fs.access(servicePath);
    logger.info(`✅ ${service.name}: Service file exists`);
    return true;
  } catch (error) {
    logger.error(`❌ ${service.name}: Service file not found`);
    return false;
  }
}

async function main() {
  logger.info('🧪 Testing all services...\n');

  const { inputPath, tempDir } = await createTestInput();
  logger.info(`📁 Created test input at: ${inputPath}\n`);

  const results: { service: string; success: boolean }[] = [];

  for (const service of SERVICES_TO_TEST) {
    logger.info(`\n🔧 Testing: ${service.name}`);
    
    let success: boolean;
    if (service.scriptPath === 'typescript') {
      success = await testTypeScriptService(service);
    } else {
      success = await testPythonService(service, inputPath);
    }
    
    results.push({ service: service.name, success });
  }

  // Cleanup
  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

  // Summary
  logger.info('\n\n📊 Test Summary:');
  logger.info('================\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%\n`);
  
  if (failed > 0) {
    logger.info('Failed services:');
    results.filter(r => !r.success).forEach(r => {
      logger.info(`  - ${r.service}`);
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  logger.error('Test runner failed:', error);
  process.exit(1);
});
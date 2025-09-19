#!/usr/bin/env node
// Seed Expansion Orchestrator
// Continuously grows partial systems using local AI while you work on other stuff

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SeedExpansionOrchestrator {
  constructor() {
    // Track all the seed systems
    this.seeds = {
      'archaeological_programming': {
        path: './mcp/modules/archaeological-programming/',
        status: 'partial',
        completion: 60,
        growth_tasks: [
          'Expand symbol library to 1000+ symbols',
          'Add more civilizations (Maya, Aztec, Chinese, Indian)',
          'Create visual symbol renderer',
          'Build symbol-to-code AI translator',
          'Add audio pronunciation for symbols'
        ]
      },
      'agent_lore_system': {
        path: './mcp/modules/archaeological-programming/',
        status: 'partial', 
        completion: 40,
        growth_tasks: [
          'Generate 100+ pre-built agent personalities',
          'Create agent interaction simulator',
          'Build agent conversation engine',
          'Add agent memory persistence',
          'Create agent skill progression system'
        ]
      },
      'documentation_suite': {
        path: './docs/',
        status: 'partial',
        completion: 30,
        growth_tasks: [
          'Auto-generate docs for all existing files',
          'Create interactive documentation browser',
          'Build search functionality',
          'Add code examples for every feature',
          'Generate API documentation automatically'
        ]
      },
      'testing_framework': {
        path: './mcp/modules/archaeological-programming/',
        status: 'partial',
        completion: 35,
        growth_tasks: [
          'Write tests for every existing module',
          'Create automated test generation',
          'Build test result dashboard',
          'Add performance benchmarking',
          'Create visual test reports'
        ]
      },
      'platform_licensing': {
        path: './mcp/modules/archaeological-programming/',
        status: 'partial',
        completion: 50,
        growth_tasks: [
          'Build license management dashboard',
          'Create payment integration',
          'Add usage analytics',
          'Build customer portal',
          'Create license renewal automation'
        ]
      },
      'integration_layer': {
        path: './',
        status: 'missing',
        completion: 5,
        growth_tasks: [
          'Create master startup orchestrator',
          'Build unified API gateway', 
          'Create shared database layer',
          'Build service discovery system',
          'Add health monitoring dashboard'
        ]
      },
      'chat_log_processor': {
        path: './mcp/modules/archaeological-programming/',
        status: 'partial',
        completion: 25,
        growth_tasks: [
          'Process all existing chat logs automatically',
          'Build real-time chat analysis',
          'Create storyline continuation engine',
          'Add character development tracking',
          'Build lore database interface'
        ]
      }
    };

    // Ollama models for different expansion tasks
    this.aiModels = {
      'code_generation': 'codellama:7b',
      'documentation': 'mistral:latest', 
      'architecture': 'llama2:latest',
      'testing': 'codellama:7b',
      'integration': 'mistral:latest'
    };

    this.isRunning = false;
    this.currentExpansions = new Map();
  }

  // Start the continuous expansion process
  async startExpansion() {
    console.log('🌱 SEED EXPANSION ORCHESTRATOR STARTING');
    console.log('=======================================');
    
    this.isRunning = true;

    // Priority order for expansion
    const expansionQueue = [
      'integration_layer',      // FIRST: Make everything work together
      'archaeological_programming', // SECOND: Core platform
      'agent_lore_system',     // THIRD: Agent personalities
      'documentation_suite',   // FOURTH: Make it usable
      'testing_framework',     // FIFTH: Make it reliable
      'platform_licensing',    // SIXTH: Make it profitable
      'chat_log_processor'     // SEVENTH: Content generation
    ];

    console.log('📋 Expansion Priority Queue:');
    expansionQueue.forEach((seed, index) => {
      const completion = this.seeds[seed].completion;
      console.log(`  ${index + 1}. ${seed} (${completion}% complete)`);
    });

    // Start expanding in background
    this.runContinuousExpansion(expansionQueue);

    return this;
  }

  // Run continuous expansion in background
  async runContinuousExpansion(queue) {
    while (this.isRunning) {
      for (const seedName of queue) {
        const seed = this.seeds[seedName];
        
        if (seed.completion < 90 && !this.currentExpansions.has(seedName)) {
          console.log(`\\n🌱 Expanding seed: ${seedName} (${seed.completion}% → targeting 90%)`);
          
          // Start expansion in background
          this.expandSeed(seedName, seed);
          
          // Wait a bit before starting next expansion
          await this.sleep(5000); // 5 seconds between starts
        }
      }
      
      // Check progress every minute
      await this.sleep(60000);
      this.reportProgress();
    }
  }

  // Expand a specific seed using local AI
  async expandSeed(seedName, seed) {
    this.currentExpansions.set(seedName, Date.now());
    
    try {
      console.log(`🤖 Starting AI expansion for ${seedName}...`);
      
      // Pick next growth task
      const nextTask = seed.growth_tasks[0];
      if (!nextTask) {
        console.log(`✅ ${seedName} has no more growth tasks`);
        return;
      }

      console.log(`📝 Task: ${nextTask}`);

      // Determine which AI model to use
      const modelType = this.getModelTypeForTask(nextTask);
      const model = this.aiModels[modelType];

      // Generate expansion prompt
      const prompt = this.generateExpansionPrompt(seedName, seed, nextTask);

      // Call Ollama to expand the seed
      const result = await this.callOllama(model, prompt);

      if (result.success) {
        // Apply the expansion
        await this.applyExpansion(seedName, seed, nextTask, result.output);
        
        // Update progress
        seed.completion = Math.min(90, seed.completion + 10);
        seed.growth_tasks.shift(); // Remove completed task

        console.log(`✅ ${seedName} expanded to ${seed.completion}%`);
      } else {
        console.log(`❌ Expansion failed for ${seedName}: ${result.error}`);
      }

    } catch (error) {
      console.error(`💀 Error expanding ${seedName}:`, error);
    } finally {
      this.currentExpansions.delete(seedName);
    }
  }

  // Generate expansion prompt for AI
  generateExpansionPrompt(seedName, seed, task) {
    return `You are an expert software architect expanding the "${seedName}" system.

Current Status:
- Path: ${seed.path}
- Completion: ${seed.completion}%
- Task: ${task}

Your job is to generate code, configurations, or documentation that accomplishes this task.

Context: This is part of an Archaeological Programming platform that uses ancient symbols (Egyptian, Runic, Greek, Sumerian) in modern software development.

Please provide:
1. Specific file contents or code
2. File paths where they should be created
3. Integration instructions
4. Any dependencies needed

Generate practical, working code that integrates with the existing system.

Current project structure includes:
- /mcp/modules/archaeological-programming/ (core modules)
- /docs/ (documentation)
- /FinishThisIdea/ (document processing)
- Docker-based infrastructure

Task to complete: ${task}

Response format:
FILE: path/to/file.js
CONTENT:
[actual file content]

INTEGRATION:
[how to integrate this with existing system]

DEPENDENCIES:
[any new dependencies needed]`;
  }

  // Determine which AI model to use for a task
  getModelTypeForTask(task) {
    if (task.includes('code') || task.includes('API') || task.includes('system')) {
      return 'code_generation';
    } else if (task.includes('docs') || task.includes('documentation')) {
      return 'documentation';
    } else if (task.includes('test') || task.includes('benchmark')) {
      return 'testing';
    } else if (task.includes('integrat') || task.includes('orchestrat')) {
      return 'integration';
    } else {
      return 'architecture';
    }
  }

  // Call Ollama with retry logic
  async callOllama(model, prompt) {
    try {
      console.log(`🤖 Calling ${model} for expansion...`);
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 4000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        output: data.response
      };

    } catch (error) {
      console.error('Ollama call failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Apply the AI-generated expansion to the project
  async applyExpansion(seedName, seed, task, aiOutput) {
    console.log(`📝 Applying expansion for ${seedName}...`);
    
    try {
      // Parse AI output to extract files and instructions
      const parsed = this.parseAIOutput(aiOutput);
      
      // Create files
      for (const file of parsed.files) {
        const fullPath = path.resolve(file.path);
        const dir = path.dirname(fullPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(fullPath, file.content);
        console.log(`📄 Created: ${file.path}`);
      }

      // Record the expansion
      const expansionRecord = {
        timestamp: new Date().toISOString(),
        seed: seedName,
        task: task,
        files_created: parsed.files.length,
        integration_notes: parsed.integration,
        dependencies: parsed.dependencies
      };

      // Save expansion log
      const logPath = path.join(__dirname, 'expansion-log.json');
      let expansionLog = [];
      if (fs.existsSync(logPath)) {
        expansionLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      }
      expansionLog.push(expansionRecord);
      fs.writeFileSync(logPath, JSON.stringify(expansionLog, null, 2));

      console.log(`✅ Expansion applied: ${parsed.files.length} files created`);

    } catch (error) {
      console.error('Failed to apply expansion:', error);
      throw error;
    }
  }

  // Parse AI output to extract file instructions
  parseAIOutput(output) {
    const files = [];
    let integration = '';
    let dependencies = '';

    const lines = output.split('\\n');
    let currentFile = null;
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      if (line.startsWith('FILE:')) {
        // Save previous file if exists
        if (currentFile) {
          files.push({
            path: currentFile,
            content: currentContent.join('\\n')
          });
        }
        
        // Start new file
        currentFile = line.replace('FILE:', '').trim();
        currentContent = [];
        currentSection = 'content';
      } else if (line.startsWith('CONTENT:')) {
        currentSection = 'content';
        currentContent = [];
      } else if (line.startsWith('INTEGRATION:')) {
        // Save current file
        if (currentFile) {
          files.push({
            path: currentFile,
            content: currentContent.join('\\n')
          });
          currentFile = null;
        }
        currentSection = 'integration';
        currentContent = [];
      } else if (line.startsWith('DEPENDENCIES:')) {
        if (currentSection === 'integration') {
          integration = currentContent.join('\\n');
        }
        currentSection = 'dependencies';
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Handle final sections
    if (currentFile && currentSection === 'content') {
      files.push({
        path: currentFile,
        content: currentContent.join('\\n')
      });
    } else if (currentSection === 'integration') {
      integration = currentContent.join('\\n');
    } else if (currentSection === 'dependencies') {
      dependencies = currentContent.join('\\n');
    }

    return { files, integration, dependencies };
  }

  // Report current progress
  reportProgress() {
    console.log('\\n📊 SEED EXPANSION PROGRESS REPORT');
    console.log('=================================');
    
    Object.entries(this.seeds).forEach(([name, seed]) => {
      const status = this.currentExpansions.has(name) ? '🔄 EXPANDING' : '⏸️  WAITING';
      console.log(`${status} ${name}: ${seed.completion}% complete`);
      
      if (seed.growth_tasks.length > 0) {
        console.log(`   Next: ${seed.growth_tasks[0]}`);
      } else {
        console.log(`   ✅ All tasks complete!`);
      }
    });

    const totalCompletion = Object.values(this.seeds)
      .reduce((sum, seed) => sum + seed.completion, 0) / Object.keys(this.seeds).length;
    
    console.log(`\\n🎯 OVERALL PLATFORM COMPLETION: ${Math.round(totalCompletion)}%`);
  }

  // Stop the expansion process
  stop() {
    console.log('🛑 Stopping seed expansion...');
    this.isRunning = false;
  }

  // Utility sleep function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get status for external monitoring
  getStatus() {
    return {
      isRunning: this.isRunning,
      seeds: this.seeds,
      currentExpansions: Array.from(this.currentExpansions.keys()),
      overallCompletion: Object.values(this.seeds)
        .reduce((sum, seed) => sum + seed.completion, 0) / Object.keys(this.seeds).length
    };
  }
}

// Export for use in other modules
export { SeedExpansionOrchestrator };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new SeedExpansionOrchestrator();
  
  console.log('🌱 STARTING CONTINUOUS SEED EXPANSION');
  console.log('====================================');
  console.log('This will run in the background and continuously expand your partial systems.');
  console.log('Press Ctrl+C to stop.');
  
  // Start expansion
  orchestrator.startExpansion();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n🛑 Received interrupt signal...');
    orchestrator.stop();
    setTimeout(() => {
      console.log('✅ Seed expansion stopped gracefully');
      process.exit(0);
    }, 1000);
  });

  // Keep process alive
  setInterval(() => {
    // Just keep the process running
  }, 60000);
}
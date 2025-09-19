#!/usr/bin/env node

/**
 * Experiment Journal CLI
 * 
 * Easy command-line interface for the experiment journal system.
 * Following Pascal's scientific method for debugging and development.
 */

const ExperimentJournal = require('./experiment-journal-system');
const path = require('path');

// Create journal instance
const journal = new ExperimentJournal();

// Parse command line arguments
const [,, command, ...args] = process.argv;

// Utility function to parse CLI options
function parseOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }
  return options;
}

// Command handlers
const commands = {
  async create() {
    const options = parseOptions(args);
    
    if (!options.title) {
      console.error('❌ Error: --title is required');
      console.log('\nUsage: experiment-journal-cli.js create --title "Title" [options]');
      console.log('Options:');
      console.log('  --category     debugging|performance|integration|educational');
      console.log('  --problem      "Description of the problem"');
      console.log('  --hypothesis   "Your hypothesis about the cause"');
      console.log('  --expected     "Expected outcome"');
      console.log('  --criteria     "Success criteria"');
      console.log('\nExample:');
      console.log('  ./experiment-journal-cli.js create \\');
      console.log('    --title "Debug System Bus Service" \\');
      console.log('    --category "debugging" \\');
      console.log('    --problem "Service fails to connect" \\');
      console.log('    --hypothesis "Port conflict on 8080"');
      process.exit(1);
    }

    const experiment = journal.createExperiment({
      title: options.title,
      category: options.category || 'debugging',
      problem: options.problem || 'Problem to be defined during investigation',
      hypothesis: options.hypothesis || 'Hypothesis to be formed during investigation',
      expected: options.expected || 'Issue resolved with documented solution',
      criteria: options.criteria || 'Problem no longer reproduces'
    });

    return experiment;
  },

  async start() {
    const experimentId = args[0];
    if (!experimentId) {
      console.error('❌ Error: experiment ID required');
      console.log('\nUsage: experiment-journal-cli.js start <experiment-id>');
      console.log('Example: ./experiment-journal-cli.js start abc12345');
      process.exit(1);
    }

    try {
      const experiment = journal.startExperiment(experimentId);
      return experiment;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  async log() {
    const [experimentId, message] = args;
    if (!experimentId || !message) {
      console.error('❌ Error: experiment ID and message required');
      console.log('\nUsage: experiment-journal-cli.js log <experiment-id> "message"');
      console.log('Example: ./experiment-journal-cli.js log abc12345 "Found port conflict on 8080"');
      process.exit(1);
    }

    try {
      const logEntry = journal.addLogEntry(experimentId, message, 'manual');
      return logEntry;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  async measure() {
    const [experimentId, metric, value, unit] = args;
    if (!experimentId || !metric || !value) {
      console.error('❌ Error: experiment ID, metric, and value required');
      console.log('\nUsage: experiment-journal-cli.js measure <experiment-id> <metric> <value> [unit]');
      console.log('Example: ./experiment-journal-cli.js measure abc12345 memory_usage 512 MB');
      process.exit(1);
    }

    try {
      const measurement = journal.addMeasurement(experimentId, metric, parseFloat(value) || value, unit || '');
      return measurement;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  async visual() {
    const [experimentId, description] = args;
    if (!experimentId || !description) {
      console.error('❌ Error: experiment ID and description required');
      console.log('\nUsage: experiment-journal-cli.js visual <experiment-id> "description"');
      console.log('Example: ./experiment-journal-cli.js visual abc12345 "dashboard-before-fix"');
      process.exit(1);
    }

    try {
      const visualEvidence = await journal.captureVisualEvidence(experimentId, description);
      return visualEvidence;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  async complete() {
    const options = parseOptions(args);
    const experimentId = args[0];
    
    if (!experimentId) {
      console.error('❌ Error: experiment ID required');
      console.log('\nUsage: experiment-journal-cli.js complete <experiment-id> [options]');
      console.log('Options:');
      console.log('  --outcome      "Description of the outcome"');
      console.log('  --validated    true|false');
      console.log('  --learnings    "learning1,learning2,learning3"');
      console.log('\nExample:');
      console.log('  ./experiment-journal-cli.js complete abc12345 \\');
      console.log('    --outcome "Fixed by changing port to 8090" \\');
      console.log('    --validated true \\');
      console.log('    --learnings "Check ports,Use netstat,Document configs"');
      process.exit(1);
    }

    try {
      const experiment = journal.completeExperiment(experimentId, {
        outcome: options.outcome || 'Experiment completed',
        validated: options.validated,
        learnings: options.learnings
      });
      return experiment;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  async list() {
    const options = parseOptions(args);
    
    try {
      const filters = {};
      if (options.category) filters.category = options.category;
      if (options.status) filters.status = options.status;
      if (options.validated) filters.validated = options.validated === 'true';
      
      const experiments = journal.listExperiments(filters);
      
      if (experiments.length === 0) {
        console.log('📋 No experiments found');
        return;
      }
      
      console.log(`📋 Found ${experiments.length} experiment${experiments.length > 1 ? 's' : ''}:\n`);
      
      experiments.forEach(exp => {
        const status = exp.status === 'completed' ? '✅' : 
                     exp.status === 'in_progress' ? '🔬' : '📝';
        const validated = exp.validated === true ? '✅' : 
                         exp.validated === false ? '❌' : '❓';
        
        console.log(`${status} ${exp.id.slice(0, 8)} - ${exp.title}`);
        console.log(`   Category: ${exp.category} | Status: ${exp.status} | Validated: ${validated}`);
        console.log(`   Created: ${new Date(exp.createdAt).toLocaleDateString()}`);
        if (exp.duration) console.log(`   Duration: ${exp.duration}`);
        console.log('');
      });
      
      return experiments;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  async search() {
    const query = args[0];
    if (!query) {
      console.error('❌ Error: search query required');
      console.log('\nUsage: experiment-journal-cli.js search "query"');
      console.log('Example: ./experiment-journal-cli.js search "memory"');
      process.exit(1);
    }

    try {
      const experiments = journal.searchExperiments(query);
      
      if (experiments.length === 0) {
        console.log(`🔍 No experiments found matching "${query}"`);
        return;
      }
      
      console.log(`🔍 Found ${experiments.length} experiment${experiments.length > 1 ? 's' : ''} matching "${query}":\n`);
      
      experiments.forEach(exp => {
        console.log(`📋 ${exp.id.slice(0, 8)} - ${exp.title}`);
        console.log(`   Problem: ${exp.problem.slice(0, 80)}${exp.problem.length > 80 ? '...' : ''}`);
        console.log(`   Status: ${exp.status} | Created: ${new Date(exp.createdAt).toLocaleDateString()}`);
        console.log('');
      });
      
      return experiments;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  async patterns() {
    try {
      const patterns = journal.extractPatterns();
      
      console.log('🔍 Pattern Analysis:');
      console.log('===================');
      console.log(`\n📊 Overview:`);
      console.log(`   Total Experiments: ${patterns.totalExperiments}`);
      console.log(`   Completed: ${patterns.completedExperiments}`);
      console.log(`   Average Reproducibility: ${patterns.averageReproducibilityScore.toFixed(1)}%`);
      
      if (patterns.commonProblems.length > 0) {
        console.log(`\n🔴 Common Issues:`);
        patterns.commonProblems.forEach(({ word, count }) => {
          console.log(`   ${word}: ${count} occurrences`);
        });
      }
      
      if (patterns.successfulApproaches.length > 0) {
        console.log(`\n🟢 Successful Approaches:`);
        patterns.successfulApproaches.forEach(({ approach, count }) => {
          console.log(`   ${approach}: ${count} times`);
        });
      }
      
      if (patterns.errorPatterns.length > 0) {
        console.log(`\n⚠️  Error Patterns:`);
        patterns.errorPatterns.forEach(({ pattern, count }) => {
          console.log(`   ${pattern.slice(0, 50)}: ${count} occurrences`);
        });
      }
      
      return patterns;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  async qr() {
    const experimentId = args[0];
    if (!experimentId) {
      console.error('❌ Error: experiment ID required');
      console.log('\nUsage: experiment-journal-cli.js qr <experiment-id>');
      console.log('Example: ./experiment-journal-cli.js qr abc12345');
      process.exit(1);
    }

    try {
      const qrPath = await journal.generateQRCode(experimentId);
      if (qrPath) {
        console.log(`📱 QR code generated: ${path.basename(qrPath)}`);
      } else {
        console.log('⚠️  QR code generation not available (qrcode library not installed)');
      }
      return qrPath;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  help() {
    console.log(`
🔬 Experiment Journal CLI - Scientific Method for Debugging

Usage: experiment-journal-cli.js <command> [arguments]

Commands:
  create    Create a new experiment
  start     Start an existing experiment
  log       Add a log entry to an experiment  
  measure   Add a measurement to an experiment
  visual    Capture visual evidence
  complete  Mark an experiment as complete
  list      List all experiments
  search    Search experiments by text
  patterns  Analyze patterns across experiments
  qr        Generate QR code for an experiment
  help      Show this help message

Examples:
  # Create a new debugging experiment
  ./experiment-journal-cli.js create \\
    --title "Debug System Bus Service" \\
    --problem "Service fails to connect" \\
    --hypothesis "Port conflict on 8080"

  # Start the experiment
  ./experiment-journal-cli.js start abc12345

  # Log findings
  ./experiment-journal-cli.js log abc12345 "Found port 8080 in use by Platform Hub"

  # Take measurements  
  ./experiment-journal-cli.js measure abc12345 memory_usage 512 MB

  # Capture visual evidence
  ./experiment-journal-cli.js visual abc12345 "dashboard-before-fix"

  # Complete the experiment
  ./experiment-journal-cli.js complete abc12345 \\
    --outcome "Fixed by changing port to 8090" \\
    --validated true \\
    --learnings "Check ports,Use netstat,Document configs"

📚 For detailed guides, see:
  - EXPERIMENT-EXECUTION-GUIDE.md
  - MASTER-IMPLEMENTATION-GUIDE.md
`);
  }
};

// Main execution
async function main() {
  if (!command || !commands[command]) {
    commands.help();
    process.exit(1);
  }

  try {
    const result = await commands[command]();
    // Some commands return values that should be logged
    if (result && process.env.NODE_ENV === 'development') {
      console.log('Debug result:', result);
    }
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled promise rejection:', reason);
  process.exit(1);
});

// Run the CLI
main();
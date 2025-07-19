#!/usr/bin/env node

/**
 * Documentation Status Checker
 * Shows what's complete and what needs to be built
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Documentation structure we expect
const expectedDocs = {
  'Root Level': [
    'README.md',
    'INDEX.md',
    'CLAUDE.md',
    'AGENT.md',
    'QUALITY_STANDARDS.md',
    'FILE_MAP.md',
    'DEPENDENCIES.md',
    'BUILD_ORDER.md',
    'DOCUMENTATION_PROGRESS.md',
  ],
  'docs/01-overview': [
    'README.md',
    'vision.md',
    'quickstart.md',
    'roadmap.md',
  ],
  'docs/02-architecture': [
    'README.md',
    'system-design.md',
    'data-flow.md',
    'security-model.md',
    'scaling-strategy.md',
    'technology-choices.md',
  ],
  'docs/03-services': [
    'README.md',
    'mvp-cleanup.md',
    'llm-router.md',
    'tinder-ui.md',
    'template-engine.md',
    'browser-orchestrator.md',
    'pattern-learning.md',
    'code-generation.md',
    'payment-processing.md',
    'file-processing.md',
    'websocket-service.md',
  ],
  'docs/04-implementation': [
    'README.md',
    'week-1-mvp.md',
    'week-2-tinder-llm.md',
    'week-3-templates.md',
    'week-4-enterprise.md',
  ],
  'docs/05-deployment': [
    'README.md',
    'local-development.md',
    'railway-deployment.md',
    'docker-deployment.md',
    'kubernetes-deployment.md',
    'production-checklist.md',
    'monitoring-setup.md',
    'backup-strategy.md',
  ],
  'docs/06-api': [
    'README.md',
    'authentication.md',
    'upload-api.md',
    'job-api.md',
    'payment-api.md',
    'websocket-api.md',
    'error-codes.md',
    'rate-limiting.md',
  ],
  'docs/07-integrations': [
    'README.md',
    'ollama.md',
    'openai.md',
    'anthropic.md',
    'stripe.md',
    's3.md',
    'redis.md',
    'postgresql.md',
  ],
  'docs/08-operations': [
    'README.md',
    'runbook.md',
    'incident-response.md',
    'performance-tuning.md',
    'security-practices.md',
    'cost-optimization.md',
    'team-processes.md',
  ],
  'docs/09-troubleshooting': [
    'README.md',
    'common-errors.md',
    'debugging-guide.md',
    'performance-issues.md',
    'deployment-issues.md',
    'integration-issues.md',
    'faq.md',
  ],
};

// Check documentation status
function checkDocStatus() {
  let totalExpected = 0;
  let totalFound = 0;
  let completeDocs = 0;
  let partialDocs = 0;
  let stubDocs = 0;
  let missingDocs = 0;

  console.log(chalk.blue('\n📊 FinishThisIdea Documentation Status\n'));

  Object.entries(expectedDocs).forEach(([section, files]) => {
    console.log(chalk.yellow(`\n${section}:`));
    
    files.forEach(file => {
      totalExpected++;
      
      const filePath = section === 'Root Level' 
        ? path.join(process.cwd(), file)
        : path.join(process.cwd(), section, file);
      
      if (fs.existsSync(filePath)) {
        totalFound++;
        const content = fs.readFileSync(filePath, 'utf8');
        const status = getDocumentStatus(content);
        
        switch (status) {
          case 'complete':
            completeDocs++;
            console.log(chalk.green(`  ✅ ${file}`));
            break;
          case 'partial':
            partialDocs++;
            console.log(chalk.yellow(`  🚧 ${file} (partial)`));
            break;
          case 'stub':
            stubDocs++;
            console.log(chalk.red(`  📄 ${file} (stub)`));
            break;
        }
      } else {
        missingDocs++;
        console.log(chalk.red(`  ❌ ${file} (missing)`));
      }
    });
  });

  // Summary
  const completionPercentage = Math.round((totalFound / totalExpected) * 100);
  const qualityPercentage = Math.round((completeDocs / totalExpected) * 100);

  console.log(chalk.blue('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.blue('📈 Summary:'));
  console.log(chalk.white(`  Total Expected: ${totalExpected}`));
  console.log(chalk.green(`  ✅ Complete: ${completeDocs} (${Math.round((completeDocs / totalExpected) * 100)}%)`));
  console.log(chalk.yellow(`  🚧 Partial: ${partialDocs} (${Math.round((partialDocs / totalExpected) * 100)}%)`));
  console.log(chalk.red(`  📄 Stubs: ${stubDocs} (${Math.round((stubDocs / totalExpected) * 100)}%)`));
  console.log(chalk.red(`  ❌ Missing: ${missingDocs} (${Math.round((missingDocs / totalExpected) * 100)}%)`));
  console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.magenta(`\n📊 Overall Completion: ${completionPercentage}%`));
  console.log(chalk.magenta(`📊 Quality Score: ${qualityPercentage}%`));

  // Recommendations
  console.log(chalk.blue('\n🎯 Next Steps:'));
  if (missingDocs > 0) {
    console.log(chalk.red(`  1. Create ${missingDocs} missing documents`));
  }
  if (stubDocs > 0) {
    console.log(chalk.yellow(`  2. Complete ${stubDocs} stub documents`));
  }
  if (partialDocs > 0) {
    console.log(chalk.yellow(`  3. Finish ${partialDocs} partial documents`));
  }
  
  if (completionPercentage < 100) {
    console.log(chalk.yellow('\n⚠️  Documentation is not complete. Run:'));
    console.log(chalk.white('  npm run docs:missing    # See what\'s missing'));
    console.log(chalk.white('  npm run orchestrate     # Use AI to help complete'));
  } else if (qualityPercentage < 80) {
    console.log(chalk.yellow('\n⚠️  Documentation quality needs improvement.'));
  } else {
    console.log(chalk.green('\n✨ Documentation is complete and high quality!'));
  }
  
  console.log('');
}

// Determine document status
function getDocumentStatus(content) {
  const lines = content.split('\n');
  const contentLines = lines.filter(line => 
    line.trim() && 
    !line.startsWith('#') &&
    !line.startsWith('```')
  ).length;

  // Check for stub indicators
  if (
    content.includes('TODO') || 
    content.includes('FIXME') || 
    content.includes('TBD') ||
    content.includes('Coming soon') ||
    content.includes('Under construction')
  ) {
    return 'stub';
  }

  // Check content length
  if (contentLines < 10) return 'stub';
  if (contentLines < 50) return 'partial';

  return 'complete';
}

// Run the check
checkDocStatus();
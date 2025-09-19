#!/usr/bin/env node
/**
 * Experiment Journal System - Core Framework
 * 
 * A complete implementation of Pascal's scientific method for software debugging
 * with visual verification, QR code tamper-proofing, and reproducible results.
 * 
 * @version 1.0.0
 * @author Document Generator System
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// Using built-in crypto.randomUUID() instead of uuid package
const uuidv4 = () => crypto.randomUUID();

// Optional dependencies (graceful degradation if missing)
let puppeteer, tesseract, qrcode, canvas;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.warn('⚠️  Puppeteer not installed - visual capture disabled');
}

try {
  tesseract = require('tesseract.js');
} catch (e) {
  console.warn('⚠️  Tesseract.js not installed - OCR verification disabled');
}

try {
  qrcode = require('qrcode');
} catch (e) {
  console.warn('⚠️  QRCode not installed - QR generation disabled');
}

try {
  canvas = require('canvas');
} catch (e) {
  console.warn('⚠️  Canvas not installed - bitmap generation disabled');
}

class ExperimentJournal {
  constructor(options = {}) {
    this.baseDir = options.baseDir || process.cwd();
    this.experimentsDir = path.join(this.baseDir, 'experiments');
    this.visualsDir = path.join(this.experimentsDir, 'visuals');
    this.reportsDir = path.join(this.experimentsDir, 'reports');
    this.dataDir = path.join(this.experimentsDir, 'data');
    this.dbPath = path.join(this.experimentsDir, 'experiments.json');
    
    this.initializeDirectories();
    this.experiments = this.loadExperiments();
  }

  /**
   * Initialize directory structure
   */
  initializeDirectories() {
    const dirs = [this.experimentsDir, this.visualsDir, this.reportsDir, this.dataDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load existing experiments from database
   */
  loadExperiments() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️  Could not load experiments database:', error.message);
    }
    return [];
  }

  /**
   * Save experiments to database
   */
  saveExperiments() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.experiments, null, 2));
    } catch (error) {
      console.error('❌ Failed to save experiments:', error.message);
      throw error;
    }
  }

  /**
   * Create a new experiment
   */
  createExperiment(options = {}) {
    const experiment = {
      id: uuidv4(),
      title: options.title || 'Untitled Experiment',
      category: options.category || 'debugging',
      problem: options.problem || '',
      hypothesis: options.hypothesis || '',
      expectedOutcome: options.expected || '',
      criteria: options.criteria || '',
      
      // Metadata
      createdAt: new Date().toISOString(),
      status: 'created',
      duration: null,
      
      // Scientific method tracking
      observations: [],
      methodology: [],
      measurements: [],
      visualEvidence: [],
      logEntries: [],
      
      // Results
      outcome: null,
      validated: null,
      learnings: [],
      reproducibilityScore: null,
      
      // Verification
      checksum: null,
      qrCode: null
    };

    // Generate checksum
    experiment.checksum = this.generateChecksum(experiment);

    // Add to experiments array
    this.experiments.push(experiment);
    this.saveExperiments();

    console.log(`✅ Created experiment: ${experiment.id}`);
    console.log(`\nTitle: ${experiment.title}`);
    console.log(`Category: ${experiment.category}`);
    console.log(`\nNext steps:`);
    console.log(`1. Start: node experiment-journal-cli.js start ${experiment.id}`);
    console.log(`2. Log findings as you work`);
    console.log(`3. Complete when done`);

    return experiment;
  }

  /**
   * Start an experiment
   */
  startExperiment(experimentId) {
    const experiment = this.findExperiment(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'created') {
      throw new Error(`Experiment ${experimentId} already started`);
    }

    experiment.status = 'in_progress';
    experiment.startedAt = new Date().toISOString();

    this.addLogEntry(experimentId, 'Experiment started', 'system');
    this.saveExperiments();

    console.log(`🔬 Starting experiment: ${experiment.title}`);
    console.log(`Started at: ${new Date().toLocaleTimeString()}`);
    console.log(`\nLogging enabled. Use these commands:`);
    console.log(`- Log: node experiment-journal-cli.js log ${experimentId} "message"`);
    console.log(`- Measure: node experiment-journal-cli.js measure ${experimentId} metric value unit`);
    console.log(`- Visual: node experiment-journal-cli.js visual ${experimentId} "description"`);

    return experiment;
  }

  /**
   * Add a log entry to an experiment
   */
  addLogEntry(experimentId, message, type = 'manual') {
    const experiment = this.findExperiment(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      type,
      id: uuidv4().slice(0, 8)
    };

    experiment.logEntries.push(logEntry);
    this.saveExperiments();

    console.log(`📝 [${logEntry.id}] ${message}`);
    return logEntry;
  }

  /**
   * Add a measurement to an experiment
   */
  addMeasurement(experimentId, metric, value, unit = '') {
    const experiment = this.findExperiment(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const measurement = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      unit,
      id: uuidv4().slice(0, 8)
    };

    experiment.measurements.push(measurement);
    this.saveExperiments();

    console.log(`📊 [${measurement.id}] ${metric}: ${value} ${unit}`);
    return measurement;
  }

  /**
   * Capture visual evidence
   */
  async captureVisualEvidence(experimentId, description, options = {}) {
    const experiment = this.findExperiment(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (!puppeteer) {
      console.warn('⚠️  Puppeteer not available - skipping visual capture');
      return null;
    }

    try {
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      // Screenshot the dashboard or specified URL
      const url = options.url || `file://${path.join(this.baseDir, 'self-testing-visual-dashboard.html')}`;
      await page.goto(url);
      
      // Wait for any dynamic content
      await page.waitForTimeout(2000);

      // Take screenshot
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${experimentId}-${timestamp}-${description.replace(/\s+/g, '-').toLowerCase()}.png`;
      const screenshotPath = path.join(this.visualsDir, filename);
      
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: 'png'
      });

      await browser.close();

      const visualEvidence = {
        timestamp: new Date().toISOString(),
        description,
        filename,
        path: screenshotPath,
        url,
        id: uuidv4().slice(0, 8)
      };

      experiment.visualEvidence.push(visualEvidence);
      this.saveExperiments();

      console.log(`📸 [${visualEvidence.id}] Visual captured: ${description}`);
      console.log(`    Saved: ${screenshotPath}`);

      return visualEvidence;

    } catch (error) {
      console.error('❌ Failed to capture visual evidence:', error.message);
      return null;
    }
  }

  /**
   * Complete an experiment
   */
  completeExperiment(experimentId, options = {}) {
    const experiment = this.findExperiment(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'in_progress') {
      throw new Error(`Experiment ${experimentId} not in progress`);
    }

    // Update experiment
    experiment.status = 'completed';
    experiment.completedAt = new Date().toISOString();
    experiment.outcome = options.outcome || '';
    experiment.validated = options.validated === 'true' || options.validated === true;
    
    if (options.learnings) {
      experiment.learnings = Array.isArray(options.learnings) 
        ? options.learnings 
        : options.learnings.split(',').map(l => l.trim());
    }

    // Calculate duration
    if (experiment.startedAt) {
      const start = new Date(experiment.startedAt);
      const end = new Date(experiment.completedAt);
      const durationMs = end - start;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      experiment.duration = `${hours}h ${minutes}m ${seconds}s`;
    }

    // Calculate reproducibility score
    experiment.reproducibilityScore = this.calculateReproducibilityScore(experiment);

    // Generate final checksum
    experiment.checksum = this.generateChecksum(experiment);

    this.addLogEntry(experimentId, 'Experiment completed', 'system');
    this.saveExperiments();

    // Generate report
    const reportPath = this.generateReport(experiment);

    console.log(`✅ Experiment completed!`);
    console.log(`\nTitle: ${experiment.title}`);
    console.log(`Duration: ${experiment.duration}`);
    console.log(`Hypothesis Validated: ${experiment.validated ? 'Yes' : 'No'}`);
    console.log(`Reproducibility Score: ${experiment.reproducibilityScore}%`);
    console.log(`\nReport generated: ${reportPath}`);

    return experiment;
  }

  /**
   * Find experiment by ID
   */
  findExperiment(experimentId) {
    return this.experiments.find(exp => exp.id === experimentId || exp.id.startsWith(experimentId));
  }

  /**
   * List all experiments
   */
  listExperiments(filters = {}) {
    let filtered = [...this.experiments];

    if (filters.category) {
      filtered = filtered.filter(exp => exp.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(exp => exp.status === filters.status);
    }

    if (filters.validated !== undefined) {
      filtered = filtered.filter(exp => exp.validated === filters.validated);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Search experiments
   */
  searchExperiments(query) {
    const searchTerm = query.toLowerCase();
    return this.experiments.filter(exp => {
      return exp.title.toLowerCase().includes(searchTerm) ||
             exp.problem.toLowerCase().includes(searchTerm) ||
             exp.hypothesis.toLowerCase().includes(searchTerm) ||
             exp.outcome?.toLowerCase().includes(searchTerm) ||
             exp.logEntries.some(log => log.message.toLowerCase().includes(searchTerm));
    });
  }

  /**
   * Extract patterns from experiments
   */
  extractPatterns() {
    const completed = this.experiments.filter(exp => exp.status === 'completed');
    
    // Common problems
    const problemCounts = {};
    completed.forEach(exp => {
      const words = exp.problem.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          problemCounts[word] = (problemCounts[word] || 0) + 1;
        }
      });
    });

    // Successful approaches
    const successfulApproaches = completed
      .filter(exp => exp.validated)
      .map(exp => exp.learnings)
      .flat()
      .reduce((acc, learning) => {
        acc[learning] = (acc[learning] || 0) + 1;
        return acc;
      }, {});

    // Common error patterns
    const errorPatterns = {};
    completed.forEach(exp => {
      exp.logEntries.forEach(log => {
        if (log.message.toLowerCase().includes('error') || 
            log.message.toLowerCase().includes('fail')) {
          const key = log.message.substring(0, 50);
          errorPatterns[key] = (errorPatterns[key] || 0) + 1;
        }
      });
    });

    return {
      totalExperiments: this.experiments.length,
      completedExperiments: completed.length,
      averageReproducibilityScore: completed.reduce((sum, exp) => sum + (exp.reproducibilityScore || 0), 0) / completed.length,
      commonProblems: Object.entries(problemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word, count]) => ({ word, count })),
      successfulApproaches: Object.entries(successfulApproaches)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([approach, count]) => ({ approach, count })),
      errorPatterns: Object.entries(errorPatterns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([pattern, count]) => ({ pattern, count }))
    };
  }

  /**
   * Generate checksum for experiment
   */
  generateChecksum(experiment) {
    const data = JSON.stringify({
      id: experiment.id,
      title: experiment.title,
      problem: experiment.problem,
      hypothesis: experiment.hypothesis,
      logEntries: experiment.logEntries,
      measurements: experiment.measurements,
      outcome: experiment.outcome
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Calculate reproducibility score
   */
  calculateReproducibilityScore(experiment) {
    let score = 0;
    let maxScore = 0;

    // Has clear problem statement (20 points)
    maxScore += 20;
    if (experiment.problem && experiment.problem.length > 10) {
      score += 20;
    }

    // Has testable hypothesis (20 points)
    maxScore += 20;
    if (experiment.hypothesis && experiment.hypothesis.length > 10) {
      score += 20;
    }

    // Has measurements (20 points)
    maxScore += 20;
    if (experiment.measurements.length > 0) {
      score += 20;
    }

    // Has visual evidence (20 points)
    maxScore += 20;
    if (experiment.visualEvidence.length > 0) {
      score += 20;
    }

    // Has detailed logs (10 points)
    maxScore += 10;
    if (experiment.logEntries.length >= 3) {
      score += 10;
    }

    // Has outcome (10 points)
    maxScore += 10;
    if (experiment.outcome) {
      score += 10;
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Generate experiment report
   */
  generateReport(experiment) {
    const reportContent = `# Experiment Report: ${experiment.title}

## Metadata
- **ID**: ${experiment.id}
- **Date**: ${new Date(experiment.createdAt).toLocaleDateString()}
- **Duration**: ${experiment.duration || 'N/A'}
- **Category**: ${experiment.category}
- **Reproducibility**: ${experiment.reproducibilityScore}%
- **Status**: ${experiment.status}

## Problem & Hypothesis
**Problem**: ${experiment.problem}

**Hypothesis**: ${experiment.hypothesis}

**Expected Outcome**: ${experiment.expectedOutcome}

## Methodology
${experiment.methodology.length > 0 
  ? experiment.methodology.map(step => `- ${step}`).join('\n')
  : 'No explicit methodology recorded - see log entries below for step-by-step process.'}

## Log Entries
${experiment.logEntries.map(log => 
  `**${new Date(log.timestamp).toLocaleTimeString()}** [${log.id}] ${log.message}`
).join('\n\n')}

## Measurements
${experiment.measurements.length > 0 
  ? experiment.measurements.map(m => 
      `- **${m.metric}**: ${m.value} ${m.unit} (${new Date(m.timestamp).toLocaleTimeString()})`
    ).join('\n')
  : 'No measurements recorded.'}

## Visual Evidence
${experiment.visualEvidence.length > 0
  ? experiment.visualEvidence.map(v => 
      `- **${v.description}** (${new Date(v.timestamp).toLocaleTimeString()})\n  ![${v.description}](${v.filename})`
    ).join('\n\n')
  : 'No visual evidence captured.'}

## Results
**Outcome**: ${experiment.outcome || 'Not specified'}

**Hypothesis Validated**: ${experiment.validated ? '✅ Yes' : '❌ No'}

## Learnings
${experiment.learnings.length > 0
  ? experiment.learnings.map(learning => `- ${learning}`).join('\n')
  : 'No learnings recorded.'}

## Verification
- **Checksum**: \`${experiment.checksum}\`
- **Reproducibility Score**: ${experiment.reproducibilityScore}%

## Reproduction Steps
To reproduce this experiment:

1. Set up the same environment conditions
2. Follow the methodology steps above
3. Compare results with measurements and visual evidence
4. Verify checksum matches: \`${experiment.checksum}\`

---

*Generated by Experiment Journal System v1.0.0*
*Timestamp: ${new Date().toISOString()}*
`;

    const reportPath = path.join(this.reportsDir, `experiment-${experiment.id}-report.md`);
    fs.writeFileSync(reportPath, reportContent);

    return reportPath;
  }

  /**
   * Generate QR code for experiment
   */
  async generateQRCode(experimentId) {
    const experiment = this.findExperiment(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (!qrcode) {
      console.warn('⚠️  QRCode library not available');
      return null;
    }

    const qrData = {
      experimentId: experiment.id,
      title: experiment.title,
      status: experiment.status,
      checksum: experiment.checksum,
      timestamp: new Date().toISOString(),
      reproducibilityScore: experiment.reproducibilityScore
    };

    const qrString = JSON.stringify(qrData);
    const qrPath = path.join(this.visualsDir, `qr-${experiment.id}.png`);

    try {
      await qrcode.toFile(qrPath, qrString);
      experiment.qrCode = qrPath;
      this.saveExperiments();

      console.log(`📱 QR code generated: ${qrPath}`);
      return qrPath;
    } catch (error) {
      console.error('❌ Failed to generate QR code:', error.message);
      return null;
    }
  }
}

// Export for use as module
module.exports = ExperimentJournal;

// CLI functionality when run directly
if (require.main === module) {
  const journal = new ExperimentJournal();
  
  // Simple test
  console.log('🔬 Experiment Journal System Test');
  console.log('================================');
  
  const testExperiment = journal.createExperiment({
    title: 'System Bus Debug Test',
    category: 'debugging',
    problem: 'System Bus Service not connecting',
    hypothesis: 'Port 8080 conflict with Platform Hub',
    expected: 'Service connects on alternate port'
  });
  
  console.log('\n✅ Test experiment created successfully!');
  console.log(`Use: node experiment-journal-cli.js start ${testExperiment.id.slice(0, 8)}`);
}
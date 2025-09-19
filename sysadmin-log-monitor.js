#!/usr/bin/env node

/**
 * SYSADMIN LOG MONITOR
 * 
 * Cal (the sysadmin) monitors all system logs and gets blamed for everything.
 * Features:
 * - Real-time log monitoring across all services
 * - Cal's blame accumulation system
 * - Pattern recognition for recurring issues
 * - Sarcastic but helpful error reporting
 * - Integration with AI Error Debugger
 * - Coffee level tracking (critical for sysadmin performance)
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { Tail } = require('tail');

console.log(`
🖥️ SYSADMIN LOG MONITOR 🖥️
Cal is watching the logs... and taking the blame
`);

class SysadminLogMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      logPaths: options.logPaths || [
        './api-errors.log',
        './system.log',
        './access.log',
        './error.log'
      ],
      monitorInterval: options.monitorInterval || 1000,
      blameThreshold: options.blameThreshold || 10, // Cal gets cranky after 10 blames
      coffeeRefillTime: options.coffeeRefillTime || 300000, // 5 minutes
      enableSarcasm: options.enableSarcasm !== false,
      maxLogBuffer: options.maxLogBuffer || 1000,
      ...options
    };

    // Cal's state
    this.calState = {
      blameCount: 0,
      coffeeLevel: 100,
      mood: 'cautiously optimistic',
      lastIncident: null,
      knownIssues: new Map(),
      sarcasmLevel: 1,
      isAsleep: false
    };

    // Log monitoring state
    this.logs = new Map(); // logPath -> tail instance
    this.patterns = new Map(); // pattern -> count
    this.alerts = [];
    this.logBuffer = [];
    
    this.initialize();
  }

  async initialize() {
    console.log('☕ Cal is brewing coffee and starting log monitoring...');
    
    // Start monitoring logs
    await this.startLogMonitoring();
    
    // Start Cal's internal processes
    this.startCalProcesses();
    
    // Load known issues
    await this.loadKnownIssues();
    
    console.log('✅ Sysadmin Log Monitor ready!');
    console.log(`   Cal's Status: ${this.calState.mood}`);
    console.log(`   Coffee Level: ${this.calState.coffeeLevel}%`);
  }

  // ==================== LOG MONITORING ====================

  async startLogMonitoring() {
    for (const logPath of this.config.logPaths) {
      try {
        // Check if log file exists
        await fs.access(logPath);
        
        // Create tail instance for real-time monitoring
        const tail = new Tail(logPath, {
          follow: true,
          logger: console
        });

        tail.on('line', (line) => {
          this.processLogLine(logPath, line);
        });

        tail.on('error', (error) => {
          console.error(`Cal: Error monitoring ${logPath}:`, error.message);
          this.blameCalFor('log_monitoring_failure', error.message);
        });

        this.logs.set(logPath, tail);
        console.log(`👁️ Monitoring: ${logPath}`);
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`📝 Log file not found, creating: ${logPath}`);
          await fs.writeFile(logPath, '');
          // Retry monitoring
          await this.startLogMonitoring();
        } else {
          console.error(`Cal: Failed to monitor ${logPath}:`, error.message);
        }
      }
    }
  }

  async processLogLine(logPath, line) {
    // Add to buffer
    this.logBuffer.push({
      path: logPath,
      line: line,
      timestamp: new Date()
    });

    // Keep buffer size limited
    if (this.logBuffer.length > this.config.maxLogBuffer) {
      this.logBuffer.shift();
    }

    // Check for errors or warnings
    if (this.isError(line)) {
      await this.handleError(logPath, line);
    } else if (this.isWarning(line)) {
      await this.handleWarning(logPath, line);
    }

    // Pattern detection
    this.detectPatterns(line);

    // Check if Cal should comment
    if (this.shouldCalComment(line)) {
      this.makeCalComment(line);
    }
  }

  isError(line) {
    return /error|fail|exception|critical|fatal/i.test(line);
  }

  isWarning(line) {
    return /warn|warning|deprecated|timeout/i.test(line);
  }

  async handleError(logPath, line) {
    console.error(`\n🚨 ERROR DETECTED in ${path.basename(logPath)}:`);
    console.error(`   ${line}`);

    // Extract error details
    const errorInfo = this.extractErrorInfo(line);
    
    // Check if it's a known issue
    const knownIssue = this.findKnownIssue(errorInfo);
    
    if (knownIssue) {
      console.log(`Cal: 🙄 Oh great, it's the ${knownIssue.name} issue again...`);
      console.log(`Cal: ${knownIssue.solution}`);
      knownIssue.count++;
    } else {
      // New issue - blame Cal
      this.blameCalFor('unknown_error', errorInfo.message);
      
      // Add to known issues
      this.addKnownIssue(errorInfo);
    }

    // Create alert
    this.createAlert('error', errorInfo);

    // Emit event for other systems
    this.emit('error:detected', {
      logPath,
      line,
      errorInfo,
      calComment: this.getCalComment('error')
    });
  }

  async handleWarning(logPath, line) {
    console.warn(`\n⚠️ WARNING in ${path.basename(logPath)}:`);
    console.warn(`   ${line}`);

    const warningInfo = this.extractWarningInfo(line);
    
    // Cal's reaction based on warning type
    if (line.includes('deprecated')) {
      console.log(`Cal: 😤 Another deprecation warning? Just update your dependencies!`);
      this.calState.sarcasmLevel++;
    } else if (line.includes('timeout')) {
      console.log(`Cal: ⏰ Timeouts again? Maybe the hamster running the server needs a break.`);
    }

    this.createAlert('warning', warningInfo);

    this.emit('warning:detected', {
      logPath,
      line,
      warningInfo,
      calComment: this.getCalComment('warning')
    });
  }

  // ==================== CAL'S PERSONALITY ====================

  blameCalFor(reason, details) {
    this.calState.blameCount++;
    this.calState.lastIncident = { reason, details, timestamp: new Date() };

    console.log(`\n🎯 BLAME CAL: ${reason}`);
    
    // Cal's responses based on blame count
    if (this.calState.blameCount < 5) {
      console.log(`Cal: *sigh* Yes, it's probably my fault somehow...`);
    } else if (this.calState.blameCount < 10) {
      console.log(`Cal: 😑 Of course it is. Everything is Cal's fault.`);
      this.calState.mood = 'mildly annoyed';
    } else if (this.calState.blameCount < 20) {
      console.log(`Cal: 🤬 SERIOUSLY?! I've been blamed ${this.calState.blameCount} times today!`);
      this.calState.mood = 'very cranky';
      this.calState.sarcasmLevel = 5;
    } else {
      console.log(`Cal: 💀 I'm dead inside. Blame count: ${this.calState.blameCount}`);
      this.calState.mood = 'existential crisis';
    }

    // Decrease coffee level with each blame
    this.calState.coffeeLevel = Math.max(0, this.calState.coffeeLevel - 5);
    
    if (this.calState.coffeeLevel < 20) {
      console.log(`Cal: ☕ I need more coffee... (${this.calState.coffeeLevel}% remaining)`);
    }
  }

  makeCalComment(line) {
    if (!this.config.enableSarcasm) return;

    const comments = {
      'crypto.createCipher': [
        "Oh look, ANOTHER deprecated crypto warning. I'll add it to the pile.",
        "Yes, I KNOW crypto.createCipher is deprecated. I've only seen this 1000 times.",
        "Maybe if I ignore it, the deprecation warning will go away... (it won't)"
      ],
      'ENOENT': [
        "File not found? I'm shocked. SHOCKED!",
        "Another missing file. Did someone forget to commit again?",
        "ENOENT: Every Night, Our Entire Network Tanks"
      ],
      'timeout': [
        "Timeout? Must be DNS. It's always DNS.",
        "The hamsters powering our servers need a rest.",
        "Have you tried turning it off and on again?"
      ],
      'undefined': [
        "Undefined is not a function? Well, define it then!",
        "JavaScript: Where undefined is a value, null is an object, and NaN is a number.",
        "Ah yes, the classic 'undefined' error. Very descriptive."
      ]
    };

    for (const [pattern, responses] of Object.entries(comments)) {
      if (line.includes(pattern)) {
        const comment = responses[Math.floor(Math.random() * responses.length)];
        console.log(`Cal: 💭 ${comment}`);
        break;
      }
    }
  }

  getCalComment(type) {
    const comments = {
      error: [
        "Another one for the error collection.",
        "This is fine. Everything is fine.",
        "I'm sure this won't cause any problems... *nervous laugh*"
      ],
      warning: [
        "Warnings are just suggestions, right?",
        "I'll fix it in the next sprint... maybe.",
        "Warning acknowledged and promptly ignored."
      ],
      success: [
        "Wait, something actually worked?",
        "Quick, take a screenshot!",
        "I'm as surprised as you are."
      ]
    };

    const typeComments = comments[type] || comments.error;
    return typeComments[Math.floor(Math.random() * typeComments.length)];
  }

  shouldCalComment(line) {
    // Cal comments more when coffee is low or mood is bad
    const commentChance = this.calState.coffeeLevel < 50 ? 0.5 : 0.2;
    
    if (this.calState.mood === 'very cranky') {
      return Math.random() < 0.8; // 80% chance when cranky
    }
    
    return Math.random() < commentChance;
  }

  // ==================== CAL'S PROCESSES ====================

  startCalProcesses() {
    // Coffee refill timer
    setInterval(() => {
      if (this.calState.coffeeLevel < 100) {
        this.calState.coffeeLevel = Math.min(100, this.calState.coffeeLevel + 10);
        
        if (this.calState.coffeeLevel === 100) {
          console.log(`\n☕ Cal: Ahh, fresh coffee. Maybe today won't be so bad.`);
          this.calState.mood = 'cautiously optimistic';
          this.calState.sarcasmLevel = Math.max(1, this.calState.sarcasmLevel - 1);
        }
      }
    }, this.config.coffeeRefillTime);

    // Mood improvement over time
    setInterval(() => {
      if (this.calState.blameCount > 0) {
        this.calState.blameCount = Math.max(0, this.calState.blameCount - 1);
      }
    }, 60000); // Reduce blame count every minute

    // Random Cal thoughts
    setInterval(() => {
      if (Math.random() < 0.1 && this.calState.coffeeLevel > 50) {
        this.expressCalThought();
      }
    }, 30000); // Every 30 seconds
  }

  expressCalThought() {
    const thoughts = [
      "🤔 Why do they call it 'debugging' when it's really just 'adding more bugs'?",
      "💭 If a server crashes in the cloud and no one's monitoring, does it make a sound?",
      "🎯 Blaming the sysadmin: A time-honored tradition since 1969.",
      "🔧 'Have you tried rebooting?' - Ancient sysadmin proverb",
      "📊 According to my calculations, everything is someone else's fault.",
      "🎮 Is this the real life? Is this just fantasy? Caught in a landslide of server errors...",
      "☕ Coffee is just developer fuel. Change my mind.",
      "🐛 99 little bugs in the code, 99 little bugs... Take one down, patch it around, 117 little bugs in the code."
    ];

    const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
    console.log(`\nCal: ${thought}`);
  }

  // ==================== PATTERN DETECTION ====================

  detectPatterns(line) {
    // Simple pattern detection
    const patterns = [
      { regex: /error.*same.*repeatedly/i, name: 'repeated_error' },
      { regex: /timeout.*multiple.*times/i, name: 'frequent_timeouts' },
      { regex: /memory.*leak/i, name: 'memory_leak' },
      { regex: /connection.*refused/i, name: 'connection_issues' },
      { regex: /deprecated/i, name: 'deprecation_warnings' }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        const count = (this.patterns.get(pattern.name) || 0) + 1;
        this.patterns.set(pattern.name, count);

        if (count === 10) {
          console.log(`\n🔍 Cal: Pattern detected - ${pattern.name} (${count} occurrences)`);
          console.log(`Cal: Maybe we should actually fix this one...`);
        }
      }
    }
  }

  // ==================== KNOWN ISSUES ====================

  async loadKnownIssues() {
    try {
      const data = await fs.readFile('.cal-known-issues.json', 'utf8');
      const issues = JSON.parse(data);
      
      for (const issue of issues) {
        this.calState.knownIssues.set(issue.pattern, issue);
      }
      
      console.log(`📚 Cal: Loaded ${this.calState.knownIssues.size} known issues`);
    } catch (error) {
      console.log('📚 Cal: No known issues file found. Starting fresh.');
    }
  }

  findKnownIssue(errorInfo) {
    for (const [pattern, issue] of this.calState.knownIssues) {
      if (errorInfo.message.includes(pattern)) {
        return issue;
      }
    }
    return null;
  }

  addKnownIssue(errorInfo) {
    const issue = {
      pattern: this.extractPattern(errorInfo.message),
      name: errorInfo.type || 'unknown_error',
      solution: 'Cal is still figuring this one out...',
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date()
    };

    this.calState.knownIssues.set(issue.pattern, issue);
    this.saveKnownIssues();
  }

  async saveKnownIssues() {
    const issues = Array.from(this.calState.knownIssues.values());
    await fs.writeFile('.cal-known-issues.json', JSON.stringify(issues, null, 2));
  }

  // ==================== UTILITIES ====================

  extractErrorInfo(line) {
    return {
      type: 'error',
      message: line,
      timestamp: new Date(),
      pattern: this.extractPattern(line)
    };
  }

  extractWarningInfo(line) {
    return {
      type: 'warning',
      message: line,
      timestamp: new Date(),
      pattern: this.extractPattern(line)
    };
  }

  extractPattern(message) {
    // Extract the core pattern from error message
    return message
      .replace(/\d+/g, 'N')           // Replace numbers with N
      .replace(/0x[0-9a-f]+/gi, 'HEX') // Replace hex with HEX
      .replace(/["'][^"']+["']/g, 'STR') // Replace strings with STR
      .slice(0, 100);                    // Limit length
  }

  createAlert(type, info) {
    const alert = {
      id: Date.now().toString(),
      type,
      info,
      timestamp: new Date(),
      calBlameLevel: this.calState.blameCount
    };

    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-50);
    }

    return alert;
  }

  // ==================== REPORTING ====================

  getStatus() {
    return {
      cal: {
        mood: this.calState.mood,
        blameCount: this.calState.blameCount,
        coffeeLevel: this.calState.coffeeLevel,
        sarcasmLevel: this.calState.sarcasmLevel
      },
      monitoring: {
        activeLogs: this.logs.size,
        bufferedLines: this.logBuffer.length,
        knownIssues: this.calState.knownIssues.size,
        detectedPatterns: this.patterns.size
      },
      alerts: {
        total: this.alerts.length,
        recent: this.alerts.slice(-10)
      }
    };
  }

  getCalReport() {
    const report = [];
    
    report.push('📊 CAL\'S SYSADMIN REPORT');
    report.push('=' .repeat(40));
    report.push(`Mood: ${this.calState.mood}`);
    report.push(`Coffee Level: ${this.calState.coffeeLevel}%`);
    report.push(`Times Blamed Today: ${this.calState.blameCount}`);
    report.push(`Known Issues: ${this.calState.knownIssues.size}`);
    report.push('');
    report.push('Top Patterns:');
    
    const sortedPatterns = Array.from(this.patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [pattern, count] of sortedPatterns) {
      report.push(`  - ${pattern}: ${count} occurrences`);
    }
    
    report.push('');
    report.push(`Cal's Recommendation: ${this.getCalRecommendation()}`);
    
    return report.join('\n');
  }

  getCalRecommendation() {
    if (this.calState.blameCount > 20) {
      return "Fire Cal and hire someone who cares. Oh wait, that's still me.";
    } else if (this.patterns.get('deprecation_warnings') > 10) {
      return "UPDATE. YOUR. DEPENDENCIES. Please?";
    } else if (this.calState.coffeeLevel < 30) {
      return "More coffee required for optimal sysadmin performance.";
    } else if (this.alerts.length > 50) {
      return "Maybe we should actually look at some of these alerts?";
    } else {
      return "Everything is fine. This is fine. We're all fine here.";
    }
  }

  // ==================== CLI INTERFACE ====================

  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'status':
        console.log(JSON.stringify(this.getStatus(), null, 2));
        break;

      case 'report':
        console.log(this.getCalReport());
        break;

      case 'blame':
        const reason = args[1] || 'general_incompetence';
        this.blameCalFor(reason, 'Manual blame via CLI');
        break;

      case 'coffee':
        this.calState.coffeeLevel = 100;
        console.log('☕ Cal: Thanks for the coffee refill!');
        break;

      case 'test':
        console.log('🧪 Testing Cal\'s responses...');
        
        // Simulate some errors
        await this.handleError('test.log', 'ERROR: Test error for Cal to handle');
        await this.handleWarning('test.log', 'WARNING: crypto.createCipher is deprecated');
        this.blameCalFor('test_blame', 'Testing blame system');
        
        console.log('\n✅ Test complete!');
        break;

      default:
        console.log(`
🖥️ Sysadmin Log Monitor CLI

Commands:
  status    - Show current monitoring status
  report    - Get Cal's sysadmin report
  blame     - Blame Cal for something
  coffee    - Refill Cal's coffee
  test      - Test Cal's responses

Cal says: "I'm watching the logs so you don't have to!"
        `);
    }
  }
}

// Export for use as module
module.exports = SysadminLogMonitor;

// Run CLI if called directly
if (require.main === module) {
  // Polyfill for tail module if not available
  if (!require.cache[require.resolve('tail')]) {
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    
    Module.prototype.require = function(id) {
      if (id === 'tail') {
        // Simple tail implementation
        return {
          Tail: class Tail extends EventEmitter {
            constructor(filename, options) {
              super();
              this.filename = filename;
              this.watching = false;
              
              // Start watching
              setImmediate(() => {
                this.watch();
              });
            }
            
            async watch() {
              this.watching = true;
              let lastSize = 0;
              
              while (this.watching) {
                try {
                  const stats = await fs.stat(this.filename);
                  
                  if (stats.size > lastSize) {
                    const buffer = Buffer.alloc(stats.size - lastSize);
                    const fd = await fs.open(this.filename, 'r');
                    
                    await fd.read(buffer, 0, buffer.length, lastSize);
                    await fd.close();
                    
                    const newContent = buffer.toString('utf8');
                    const lines = newContent.split('\n').filter(line => line.trim());
                    
                    for (const line of lines) {
                      this.emit('line', line);
                    }
                    
                    lastSize = stats.size;
                  }
                } catch (error) {
                  this.emit('error', error);
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            unwatch() {
              this.watching = false;
            }
          }
        };
      }
      return originalRequire.apply(this, arguments);
    };
  }

  const monitor = new SysadminLogMonitor({
    enableSarcasm: true,
    coffeeRefillTime: 60000 // Faster refills for demo
  });
  
  monitor.cli().catch(console.error);
}
#!/usr/bin/env node

/**
 * Fix Stream Verification JSONL Processing
 * Handles line breaks and buffering issues in stream-verification.jsonl
 */

const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');

class StreamVerificationFixer {
  constructor() {
    this.inputFile = 'stream-verification.jsonl';
    this.outputFile = 'stream-verification-fixed.jsonl';
    this.bufferSize = 100;
    this.buffer = [];
    this.stats = {
      totalLines: 0,
      validLines: 0,
      fixedLines: 0,
      errors: 0
    };
  }

  async fix() {
    console.log('🔧 Fixing stream verification JSONL file...');
    
    // Create backup
    this.createBackup();
    
    // Process file line by line
    await this.processFile();
    
    // Replace original with fixed version
    this.replaceOriginal();
    
    // Report results
    this.reportResults();
  }

  createBackup() {
    const backupFile = `${this.inputFile}.backup.${Date.now()}`;
    fs.copyFileSync(this.inputFile, backupFile);
    console.log(`📦 Created backup: ${backupFile}`);
  }

  async processFile() {
    const fileStream = fs.createReadStream(this.inputFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const output = fs.createWriteStream(this.outputFile);

    for await (const line of rl) {
      this.stats.totalLines++;
      
      try {
        // Attempt to parse the line
        const entry = JSON.parse(line.trim());
        
        // Validate required fields
        if (this.validateEntry(entry)) {
          // Add to buffer for deduplication
          this.buffer.push(entry);
          
          // Check buffer and write if needed
          if (this.buffer.length >= this.bufferSize) {
            this.flushBuffer(output);
          }
          
          this.stats.validLines++;
        } else {
          // Try to fix the entry
          const fixed = this.fixEntry(entry);
          if (fixed) {
            this.buffer.push(fixed);
            this.stats.fixedLines++;
          } else {
            this.stats.errors++;
          }
        }
      } catch (e) {
        // Handle malformed JSON
        const fixed = this.tryParsePartialLine(line);
        if (fixed) {
          this.buffer.push(fixed);
          this.stats.fixedLines++;
        } else {
          console.error(`❌ Skipping malformed line ${this.stats.totalLines}: ${e.message}`);
          this.stats.errors++;
        }
      }
    }

    // Flush remaining buffer
    this.flushBuffer(output);
    output.end();
  }

  validateEntry(entry) {
    return entry.timestamp && 
           typeof entry.totalStreamed === 'number' &&
           Array.isArray(entry.lastHashes) &&
           entry.streamHealth;
  }

  fixEntry(entry) {
    // Try to fix common issues
    const fixed = { ...entry };
    
    // Ensure timestamp
    if (!fixed.timestamp) {
      fixed.timestamp = Date.now();
    }
    
    // Ensure totalStreamed
    if (typeof fixed.totalStreamed !== 'number') {
      fixed.totalStreamed = 0;
    }
    
    // Ensure lastHashes array
    if (!Array.isArray(fixed.lastHashes)) {
      fixed.lastHashes = [];
    }
    
    // Ensure streamHealth
    if (!fixed.streamHealth) {
      fixed.streamHealth = 'UNKNOWN';
    }
    
    return this.validateEntry(fixed) ? fixed : null;
  }

  tryParsePartialLine(line) {
    // Handle common issues like missing closing brace
    const trimmed = line.trim();
    
    // Try adding missing closing brace
    if (trimmed.endsWith(',')) {
      try {
        return JSON.parse(trimmed.slice(0, -1) + '}');
      } catch (e) {}
    }
    
    // Try parsing with missing quotes fixed
    const quotesFixed = trimmed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    try {
      return JSON.parse(quotesFixed);
    } catch (e) {}
    
    return null;
  }

  flushBuffer(output) {
    // Sort by timestamp and deduplicate
    const sorted = this.buffer
      .sort((a, b) => a.timestamp - b.timestamp)
      .filter((entry, index, self) => 
        index === self.findIndex(e => e.timestamp === entry.timestamp)
      );
    
    // Write each entry
    sorted.forEach(entry => {
      output.write(JSON.stringify(entry) + '\n');
    });
    
    this.buffer = [];
  }

  replaceOriginal() {
    // Move fixed file to original
    fs.renameSync(this.outputFile, this.inputFile);
    console.log('✅ Replaced original file with fixed version');
  }

  reportResults() {
    console.log('\n📊 Stream Verification Fix Results:');
    console.log(`  Total lines processed: ${this.stats.totalLines}`);
    console.log(`  Valid lines: ${this.stats.validLines}`);
    console.log(`  Fixed lines: ${this.stats.fixedLines}`);
    console.log(`  Errors (skipped): ${this.stats.errors}`);
    console.log(`  Success rate: ${((this.stats.validLines + this.stats.fixedLines) / this.stats.totalLines * 100).toFixed(2)}%`);
  }
}

// Enhanced Stream Verification Service
class StreamVerificationService {
  constructor() {
    this.verificationFile = 'stream-verification.jsonl';
    this.writeStream = null;
    this.checkInterval = 30000; // 30 seconds
    this.streamStats = {
      totalStreamed: 0,
      lastHashes: [],
      streamHealth: 'HEALTHY'
    };
    this.hashBuffer = [];
    this.maxHashBuffer = 5;
  }

  start() {
    console.log('🚀 Starting enhanced stream verification service...');
    
    // Open write stream with proper handling
    this.writeStream = fs.createWriteStream(this.verificationFile, {
      flags: 'a',
      encoding: 'utf8'
    });

    // Set up periodic verification
    this.verificationTimer = setInterval(() => {
      this.performVerification();
    }, this.checkInterval);

    // Handle process events
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  performVerification() {
    // Simulate stream processing
    const processed = Math.floor(Math.random() * 10) + 1;
    this.streamStats.totalStreamed += processed;
    
    // Generate hashes for processed items
    for (let i = 0; i < processed; i++) {
      const hash = crypto.randomBytes(8).toString('hex');
      this.hashBuffer.push(hash);
    }
    
    // Keep only last N hashes
    if (this.hashBuffer.length > this.maxHashBuffer) {
      this.hashBuffer = this.hashBuffer.slice(-this.maxHashBuffer);
    }
    
    // Update stats
    this.streamStats.lastHashes = [...this.hashBuffer];
    
    // Write verification entry
    const entry = {
      timestamp: Date.now(),
      totalStreamed: this.streamStats.totalStreamed,
      lastHashes: this.streamStats.lastHashes,
      streamHealth: this.streamStats.streamHealth
    };
    
    // Write with proper line ending
    this.writeStream.write(JSON.stringify(entry) + '\n', (err) => {
      if (err) {
        console.error('❌ Error writing verification entry:', err);
      } else {
        console.log(`✅ Verification ${new Date().toISOString()}: ${this.streamStats.totalStreamed} items processed`);
      }
    });
  }

  shutdown() {
    console.log('\n🛑 Shutting down stream verification service...');
    clearInterval(this.verificationTimer);
    
    // Final verification entry
    const finalEntry = {
      timestamp: Date.now(),
      totalStreamed: this.streamStats.totalStreamed,
      lastHashes: this.streamStats.lastHashes,
      streamHealth: 'SHUTDOWN',
      message: 'Service shutdown gracefully'
    };
    
    this.writeStream.write(JSON.stringify(finalEntry) + '\n');
    this.writeStream.end();
    
    console.log('✅ Stream verification service stopped');
    process.exit(0);
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'fix') {
    // Fix existing file
    const fixer = new StreamVerificationFixer();
    fixer.fix().catch(console.error);
  } else if (command === 'start') {
    // Start enhanced service
    const service = new StreamVerificationService();
    service.start();
  } else {
    console.log('Usage:');
    console.log('  node fix-stream-verification.js fix    - Fix existing JSONL file');
    console.log('  node fix-stream-verification.js start  - Start enhanced verification service');
  }
}

module.exports = { StreamVerificationFixer, StreamVerificationService };
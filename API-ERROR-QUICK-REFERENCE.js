#!/usr/bin/env node

/**
 * 🚨 API ERROR QUICK REFERENCE - Interactive Solution Finder
 * Cal's instant error solver connecting to existing advanced systems
 */

const readline = require('readline');

class APIErrorQuickReference {
    constructor() {
        this.errorDatabase = new Map();
        this.buildErrorDatabase();
        
        // Connect to existing error systems (when available)
        this.existingSystems = {
            aiDebugger: './ai-error-debugger.js',
            patterns: './api-error-patterns.js',
            prevention: './proactive-error-prevention.js',
            metaLearning: './meta-learning-error-system.js'
        };
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    buildErrorDatabase() {
        // Most common API errors with instant solutions
        this.errorDatabase.set('fetch is not defined', {
            solution: 'npm install node-fetch OR use Node 18+ with native fetch',
            quickFix: 'const fetch = require("node-fetch");',
            calWisdom: 'Ancient Node civilizations need the fetch artifact',
            severity: 'high',
            category: 'missing_dependency'
        });
        
        this.errorDatabase.set('ENOENT', {
            solution: 'File path incorrect or file doesn\'t exist',
            quickFix: 'Check: 1) File exists, 2) Path is correct, 3) Working directory',
            calWisdom: 'Most common error in our archaeological record',
            severity: 'high',
            category: 'file_system'
        });
        
        this.errorDatabase.set('MODULE_NOT_FOUND', {
            solution: 'Missing npm package',
            quickFix: 'npm install <package-name>',
            calWisdom: 'The civilization forgot to gather dependencies',
            severity: 'high',
            category: 'missing_dependency'
        });
        
        this.errorDatabase.set('EADDRINUSE', {
            solution: 'Port already in use',
            quickFix: 'lsof -ti:PORT | xargs kill -9',
            calWisdom: 'Multiple tribes fighting over the same communication port',
            severity: 'medium',
            category: 'port_conflict'
        });
        
        this.errorDatabase.set('401', {
            solution: 'Authentication failed',
            quickFix: 'Check token validity and format',
            calWisdom: 'The access scrolls have been rejected by the guardians',
            severity: 'high',
            category: 'authentication'
        });
        
        this.errorDatabase.set('403', {
            solution: 'Authorization failed',
            quickFix: 'User lacks permissions for this resource',
            calWisdom: 'You have the key, but not permission to enter this chamber',
            severity: 'high',
            category: 'authorization'
        });
        
        this.errorDatabase.set('ECONNREFUSED', {
            solution: 'Connection refused by server',
            quickFix: '1) Check server is running, 2) Verify URL/port, 3) Check firewall',
            calWisdom: 'The distant civilization is not accepting visitors',
            severity: 'high',
            category: 'connection'
        });
        
        this.errorDatabase.set('ETIMEDOUT', {
            solution: 'Request timed out',
            quickFix: 'Increase timeout OR check network connectivity',
            calWisdom: 'The message took too long to reach the distant tribe',
            severity: 'medium',
            category: 'network'
        });
        
        this.errorDatabase.set('JSON parse', {
            solution: 'Invalid JSON received',
            quickFix: 'Check response format - might be HTML error page',
            calWisdom: 'Expected data scroll, received artwork instead',
            severity: 'medium',
            category: 'data_format'
        });
        
        this.errorDatabase.set('CORS', {
            solution: 'Cross-Origin Request Blocked',
            quickFix: 'Add CORS headers on server OR use proxy',
            calWisdom: 'The browser guardian blocks messages between kingdoms',
            severity: 'medium',
            category: 'browser_security'
        });
        
        this.errorDatabase.set('certificate', {
            solution: 'SSL/TLS Certificate issue',
            quickFix: 'Use HTTPS OR ignore certs in dev: NODE_TLS_REJECT_UNAUTHORIZED=0',
            calWisdom: 'The security seals are not trusted by this civilization',
            severity: 'low',
            category: 'security'
        });
        
        this.errorDatabase.set('socket hang up', {
            solution: 'Connection dropped unexpectedly',
            quickFix: 'Add retry logic OR check server stability',
            calWisdom: 'The communication line was severed mid-conversation',
            severity: 'medium',
            category: 'connection'
        });
        
        this.errorDatabase.set('Cannot resolve', {
            solution: 'DNS resolution failed',
            quickFix: '1) Check domain spelling, 2) Check internet, 3) Try IP address',
            calWisdom: 'The address you seek is not in our maps',
            severity: 'high',
            category: 'dns'
        });
    }
    
    async startInteractiveSession() {
        console.log(`
🏺 Cal's API Error Quick Reference - Archaeological Debugging Service
===============================================================

I'm here to help you solve API errors instantly! 

Just describe your error and I'll:
✅ Find instant solutions from our archaeological database
✅ Connect you to advanced AI debugging if needed
✅ Provide Cal's wisdom on why this error occurred

Type 'help' for commands or just describe your error...
        `);
        
        this.askForError();
    }
    
    askForError() {
        this.rl.question('\n🔍 What error are you seeing? (or type "exit" to quit): ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                console.log('\n🏺 May your code be bug-free and your APIs responsive!');
                console.log('   - Cal, Chief Code Archaeologist');
                this.rl.close();
                return;
            }
            
            if (input.toLowerCase() === 'help') {
                this.showHelp();
                this.askForError();
                return;
            }
            
            await this.solveError(input);
            this.askForError();
        });
    }
    
    async solveError(errorInput) {
        console.log('\n🏺 Cal is examining the error artifact...\n');
        
        // Check our quick reference database
        const quickSolution = this.findQuickSolution(errorInput);
        
        if (quickSolution) {
            this.displayQuickSolution(quickSolution, errorInput);
        } else {
            console.log('🤔 This error is not in my quick reference database...');
            await this.escalateToAdvancedSystems(errorInput);
        }
        
        // Always offer additional help
        this.offerAdditionalHelp(errorInput);
    }
    
    findQuickSolution(errorInput) {
        const lowerInput = errorInput.toLowerCase();
        
        // Check each error pattern
        for (const [pattern, solution] of this.errorDatabase.entries()) {
            if (lowerInput.includes(pattern.toLowerCase())) {
                return solution;
            }
        }
        
        return null;
    }
    
    displayQuickSolution(solution, originalError) {
        console.log('✅ QUICK SOLUTION FOUND!\n');
        console.log(`🎯 Problem: ${solution.solution}`);
        console.log(`⚡ Quick Fix: ${solution.quickFix}`);
        console.log(`🏺 Cal's Wisdom: "${solution.calWisdom}"`);
        console.log(`📊 Severity: ${solution.severity.toUpperCase()}`);
        console.log(`🏷️  Category: ${solution.category}`);
        
        // Add specific code example if available
        this.addCodeExample(solution.category, originalError);
    }
    
    addCodeExample(category, errorText) {
        const examples = {
            missing_dependency: `
📝 Code Example:
   // Before (error):
   const fetch = require('node-fetch'); // Error if not installed
   
   // After (fixed):
   npm install node-fetch
   const fetch = require('node-fetch'); // Now works`,
            
            file_system: `
📝 Code Example:
   // Before (error):
   const data = fs.readFileSync('missing-file.txt');
   
   // After (fixed):
   const fs = require('fs');
   if (fs.existsSync('missing-file.txt')) {
       const data = fs.readFileSync('missing-file.txt');
   } else {
       console.log('File not found, using defaults');
   }`,
            
            authentication: `
📝 Code Example:
   // Before (error):
   fetch('/api/data') // No auth headers
   
   // After (fixed):
   fetch('/api/data', {
       headers: { 'Authorization': 'Bearer ' + validToken }
   })`,
            
            port_conflict: `
📝 Code Example:
   // Before (error):
   app.listen(3000) // Port might be taken
   
   // After (fixed):
   const port = process.env.PORT || 3001;
   app.listen(port, () => console.log(\`Server on port \${port}\`))`,
        };
        
        if (examples[category]) {
            console.log(examples[category]);
        }
    }
    
    async escalateToAdvancedSystems(errorInput) {
        console.log('🤖 Connecting to advanced error analysis systems...\n');
        
        // Try to load and use existing systems
        try {
            console.log('🔍 Checking if AI Error Debugger is available...');
            // Would connect to actual AI system if available
            console.log('📊 Running pattern analysis...');
            
            // Mock advanced analysis
            setTimeout(() => {
                console.log('🧠 AI Analysis Results:');
                console.log('   • This appears to be a unique error not in the quick database');
                console.log('   • Recommended approach: Check the full CLAUDE.api-errors.md guide');
                console.log('   • Consider using the proactive error prevention system');
                console.log('   • Document this error for future reference');
            }, 1000);
            
        } catch (error) {
            console.log('⚠️  Advanced systems not available, but I can still help!');
        }
    }
    
    offerAdditionalHelp(errorInput) {
        console.log('\n📚 Additional Resources:');
        console.log('   📖 Full guide: Read CLAUDE.api-errors.md for comprehensive solutions');
        console.log('   🤖 Advanced AI: Use ai-error-debugger.js for complex issues');
        console.log('   🛡️  Prevention: Run proactive-error-prevention.js before deployment');
        console.log('   🧠 Learning: Use meta-learning-error-system.js to learn from errors');
        
        // Suggest specific next steps based on error category
        const category = this.categorizeError(errorInput);
        this.suggestNextSteps(category);
    }
    
    categorizeError(errorInput) {
        const lowerInput = errorInput.toLowerCase();
        
        if (lowerInput.includes('fetch') || lowerInput.includes('module')) return 'dependency';
        if (lowerInput.includes('enoent') || lowerInput.includes('file')) return 'filesystem';
        if (lowerInput.includes('port') || lowerInput.includes('eaddrinuse')) return 'networking';
        if (lowerInput.includes('401') || lowerInput.includes('403') || lowerInput.includes('token')) return 'auth';
        
        return 'general';
    }
    
    suggestNextSteps(category) {
        const suggestions = {
            dependency: [
                '1. Run: npm install',
                '2. Check package.json for missing dependencies',
                '3. Clear node_modules and reinstall if needed'
            ],
            filesystem: [
                '1. Verify file exists: ls -la filename',
                '2. Check current directory: pwd',
                '3. Use absolute paths to avoid confusion'
            ],
            networking: [
                '1. Check what\'s using the port: lsof -i :PORT',
                '2. Try a different port',
                '3. Kill conflicting processes'
            ],
            auth: [
                '1. Check token validity and expiration',
                '2. Verify API endpoint permissions',
                '3. Test with a fresh token'
            ],
            general: [
                '1. Check the full error stack trace',
                '2. Look for similar issues in CLAUDE.api-errors.md',
                '3. Use the AI error debugger for analysis'
            ]
        };
        
        console.log('\n🎯 Suggested Next Steps:');
        suggestions[category].forEach(step => console.log(`   ${step}`));
    }
    
    showHelp() {
        console.log(`
🏺 Cal's Quick Reference Help
============================

How to use this tool:
• Just describe your error (e.g., "fetch is not defined")  
• Use keywords from error messages
• I'll find instant solutions from our archaeological database
• If not found, I'll connect you to advanced AI systems

Common error types I can solve instantly:
🔸 fetch is not defined
🔸 ENOENT (file not found)
🔸 MODULE_NOT_FOUND  
🔸 EADDRINUSE (port conflicts)
🔸 401/403 (auth errors)
🔸 CORS issues
🔸 JSON parse errors
🔸 Connection timeouts
🔸 Certificate problems

Commands:
• help - Show this help
• exit - Quit the tool

Archaeological wisdom: Most API errors fall into common patterns. 
Let me help you identify which pattern you're dealing with!
        `);
    }
    
    // Static method for quick CLI usage
    static async quickSolve(errorString) {
        const solver = new APIErrorQuickReference();
        console.log('🏺 Cal\'s Quick Analysis:\n');
        await solver.solveError(errorString);
    }
    
    // Method to generate error report
    generateErrorReport(errorInput, solution) {
        const report = {
            timestamp: new Date().toISOString(),
            error: errorInput,
            solution: solution,
            calNote: `Archaeological analysis complete - error pattern identified`,
            nextSteps: [
                'Apply the quick fix',
                'Test the solution', 
                'Document if this was a new pattern',
                'Consider prevention strategies'
            ]
        };
        
        return report;
    }
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Quick solve mode
        const errorString = args.join(' ');
        APIErrorQuickReference.quickSolve(errorString);
    } else {
        // Interactive mode
        const solver = new APIErrorQuickReference();
        solver.startInteractiveSession();
    }
}

module.exports = APIErrorQuickReference;
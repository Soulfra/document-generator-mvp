#!/usr/bin/env node

/**
 * ELOOP DIAGNOSTIC TOOL
 * Diagnoses and fixes the "weird loops" causing ELOOP errors
 * Part of the meta-architectural debugging system
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

class ELOOPDiagnosticTool {
    constructor() {
        this.app = express();
        this.port = 9975;
        
        this.diagnosticState = {
            detected_loops: new Map(),
            symlink_chains: new Map(),
            circular_references: new Map(),
            process_loops: new Map(),
            file_descriptor_leaks: new Map(),
            infinite_spawns: new Map(),
            weird_loops_count: 0
        };

        this.setupDiagnostics();
        this.setupRoutes();
    }

    setupDiagnostics() {
        console.log('🔍 Starting ELOOP diagnostic scan...');
        
        this.scanSymlinkLoops();
        this.scanProcessLoops();
        this.scanFileDescriptorLeaks();
        this.scanCircularDependencies();
        this.generateWeirdLoopReport();
    }

    scanSymlinkLoops() {
        console.log('🔗 Scanning for symbolic link loops...');
        
        const symlinkMap = new Map();
        const visited = new Set();
        
        const scanDirectory = (dir, depth = 0) => {
            if (depth > 10) {
                this.diagnosticState.detected_loops.set(`symlink_depth_${dir}`, {
                    type: 'symlink_depth_overflow',
                    path: dir,
                    depth: depth,
                    severity: 'HIGH'
                });
                return;
            }
            
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isSymbolicLink()) {
                        try {
                            const target = fs.readlinkSync(fullPath);
                            const resolvedTarget = path.resolve(dir, target);
                            
                            // Check for circular symlinks
                            if (visited.has(resolvedTarget)) {
                                this.diagnosticState.detected_loops.set(`circular_symlink_${fullPath}`, {
                                    type: 'circular_symlink',
                                    path: fullPath,
                                    target: resolvedTarget,
                                    chain: Array.from(visited),
                                    severity: 'CRITICAL'
                                });
                                continue;
                            }
                            
                            visited.add(fullPath);
                            symlinkMap.set(fullPath, resolvedTarget);
                            
                            // Recursively scan symlink target
                            if (fs.existsSync(resolvedTarget) && fs.statSync(resolvedTarget).isDirectory()) {
                                scanDirectory(resolvedTarget, depth + 1);
                            }
                            
                        } catch (error) {
                            this.diagnosticState.detected_loops.set(`broken_symlink_${fullPath}`, {
                                type: 'broken_symlink',
                                path: fullPath,
                                error: error.message,
                                severity: 'MEDIUM'
                            });
                        }
                    } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
                        scanDirectory(fullPath, depth);
                    }
                }
            } catch (error) {
                // Permission denied or other errors
                console.log(`Cannot scan ${dir}: ${error.message}`);
            }
        };
        
        scanDirectory(process.cwd());
        
        console.log(`🔗 Found ${this.diagnosticState.detected_loops.size} potential symlink issues`);
    }

    scanProcessLoops() {
        console.log('⚙️ Scanning for process loops...');
        
        const { exec } = require('child_process');
        
        exec('ps aux | grep node', (error, stdout, stderr) => {
            if (!error) {
                const processes = stdout.split('\n').filter(line => line.includes('node'));
                const processMap = new Map();
                
                processes.forEach(process => {
                    const parts = process.trim().split(/\s+/);
                    if (parts.length > 10) {
                        const pid = parts[1];
                        const command = parts.slice(10).join(' ');
                        
                        // Group processes by command
                        if (!processMap.has(command)) {
                            processMap.set(command, []);
                        }
                        processMap.get(command).push({ pid, command });
                    }
                });
                
                // Look for process multiplication
                for (const [command, instances] of processMap) {
                    if (instances.length > 3 && command.includes('.js')) {
                        this.diagnosticState.process_loops.set(`duplicate_process_${command}`, {
                            type: 'process_multiplication',
                            command: command,
                            instance_count: instances.length,
                            pids: instances.map(i => i.pid),
                            severity: instances.length > 10 ? 'CRITICAL' : 'HIGH'
                        });
                    }
                }
                
                console.log(`⚙️ Found ${this.diagnosticState.process_loops.size} process loop issues`);
            }
        });
    }

    scanFileDescriptorLeaks() {
        console.log('📁 Scanning for file descriptor leaks...');
        
        const { exec } = require('child_process');
        
        exec('lsof -p $$ 2>/dev/null | wc -l', (error, stdout, stderr) => {
            if (!error) {
                const fdCount = parseInt(stdout.trim());
                
                if (fdCount > 1000) {
                    this.diagnosticState.file_descriptor_leaks.set('fd_leak_current_process', {
                        type: 'file_descriptor_leak',
                        count: fdCount,
                        severity: fdCount > 5000 ? 'CRITICAL' : 'HIGH',
                        recommendation: 'Close unused file handles and connections'
                    });
                }
            }
        });
        
        // Check for WebSocket connection loops
        exec('netstat -an | grep ESTABLISHED | grep ":99" | wc -l', (error, stdout, stderr) => {
            if (!error) {
                const connectionCount = parseInt(stdout.trim());
                
                if (connectionCount > 20) {
                    this.diagnosticState.file_descriptor_leaks.set('websocket_connection_loop', {
                        type: 'websocket_connection_multiplier',
                        count: connectionCount,
                        severity: 'HIGH',
                        recommendation: 'Check for WebSocket connection loops between services'
                    });
                }
            }
        });
    }

    scanCircularDependencies() {
        console.log('🌀 Scanning for circular dependencies...');
        
        const dependencyMap = new Map();
        const visited = new Set();
        
        const scanJSFile = (filePath) => {
            if (visited.has(filePath)) return;
            visited.add(filePath);
            
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const requires = [];
                
                // Find require() statements
                const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
                let match;
                while ((match = requireRegex.exec(content)) !== null) {
                    const dep = match[1];
                    if (dep.startsWith('./') || dep.startsWith('../')) {
                        const resolvedPath = path.resolve(path.dirname(filePath), dep);
                        if (fs.existsSync(resolvedPath + '.js')) {
                            requires.push(resolvedPath + '.js');
                        }
                    }
                }
                
                dependencyMap.set(filePath, requires);
                
                // Recursively scan dependencies
                requires.forEach(dep => {
                    if (fs.existsSync(dep)) {
                        scanJSFile(dep);
                    }
                });
                
            } catch (error) {
                // Skip files we can't read
            }
        };
        
        // Scan all JS files in current directory
        const jsFiles = fs.readdirSync('.').filter(f => f.endsWith('.js'));
        jsFiles.forEach(file => scanJSFile(path.resolve(file)));
        
        // Detect circular dependencies
        const findCircular = (file, path = [], visited = new Set()) => {
            if (path.includes(file)) {
                const cycle = path.slice(path.indexOf(file));
                cycle.push(file);
                
                this.diagnosticState.circular_references.set(`circular_dep_${cycle.join('→')}`, {
                    type: 'circular_dependency',
                    cycle: cycle,
                    severity: 'MEDIUM',
                    recommendation: 'Refactor to break circular dependency'
                });
                return;
            }
            
            if (visited.has(file)) return;
            visited.add(file);
            
            const deps = dependencyMap.get(file) || [];
            deps.forEach(dep => {
                findCircular(dep, [...path, file], visited);
            });
        };
        
        dependencyMap.forEach((deps, file) => {
            findCircular(file);
        });
        
        console.log(`🌀 Found ${this.diagnosticState.circular_references.size} circular dependency issues`);
    }

    generateWeirdLoopReport() {
        console.log('🎭 Generating weird loop analysis...');
        
        // Count total "weird loops"
        this.diagnosticState.weird_loops_count = 
            this.diagnosticState.detected_loops.size +
            this.diagnosticState.process_loops.size +
            this.diagnosticState.file_descriptor_leaks.size +
            this.diagnosticState.circular_references.size;
        
        // Classify loop types
        const loopTypes = {
            architectural: 0,  // Part of intended recursive design
            problematic: 0,    // Causing actual issues
            dangerous: 0       // Could cause system failure
        };
        
        // Analyze each loop
        const allLoops = [
            ...this.diagnosticState.detected_loops.values(),
            ...this.diagnosticState.process_loops.values(),
            ...this.diagnosticState.file_descriptor_leaks.values(),
            ...this.diagnosticState.circular_references.values()
        ];
        
        allLoops.forEach(loop => {
            if (loop.severity === 'CRITICAL') {
                loopTypes.dangerous++;
            } else if (loop.severity === 'HIGH') {
                loopTypes.problematic++;
            } else {
                loopTypes.architectural++;
            }
        });
        
        this.diagnosticState.loop_classification = loopTypes;
        
        console.log(`🎭 Weird Loop Analysis Complete:`);
        console.log(`   Total Loops: ${this.diagnosticState.weird_loops_count}`);
        console.log(`   Architectural: ${loopTypes.architectural}`);
        console.log(`   Problematic: ${loopTypes.problematic}`);
        console.log(`   Dangerous: ${loopTypes.dangerous}`);
    }

    async fixDetectedLoops() {
        console.log('🔧 Attempting to fix detected loops...');
        
        let fixedCount = 0;
        
        // Fix broken symlinks
        for (const [id, loop] of this.diagnosticState.detected_loops) {
            if (loop.type === 'broken_symlink') {
                try {
                    fs.unlinkSync(loop.path);
                    console.log(`🗑️ Removed broken symlink: ${loop.path}`);
                    fixedCount++;
                } catch (error) {
                    console.log(`Failed to remove ${loop.path}: ${error.message}`);
                }
            }
        }
        
        // Kill duplicate processes
        for (const [id, loop] of this.diagnosticState.process_loops) {
            if (loop.type === 'process_multiplication' && loop.instance_count > 5) {
                // Kill all but the first 2 instances
                const pidsToKill = loop.pids.slice(2);
                
                for (const pid of pidsToKill) {
                    try {
                        process.kill(pid, 'SIGTERM');
                        console.log(`🔪 Killed duplicate process: ${pid}`);
                        fixedCount++;
                    } catch (error) {
                        console.log(`Failed to kill process ${pid}: ${error.message}`);
                    }
                }
            }
        }
        
        console.log(`🔧 Fixed ${fixedCount} loop issues`);
        return fixedCount;
    }

    setupRoutes() {
        this.app.use(express.json());

        this.app.get('/', (req, res) => {
            res.send(this.getDiagnosticHTML());
        });

        this.app.get('/api/diagnostic-report', (req, res) => {
            res.json({
                summary: {
                    total_weird_loops: this.diagnosticState.weird_loops_count,
                    classification: this.diagnosticState.loop_classification,
                    timestamp: new Date().toISOString()
                },
                details: {
                    symlink_loops: Array.from(this.diagnosticState.detected_loops.values()),
                    process_loops: Array.from(this.diagnosticState.process_loops.values()),
                    fd_leaks: Array.from(this.diagnosticState.file_descriptor_leaks.values()),
                    circular_deps: Array.from(this.diagnosticState.circular_references.values())
                }
            });
        });

        this.app.post('/api/fix-loops', async (req, res) => {
            const fixedCount = await this.fixDetectedLoops();
            res.json({
                status: 'fix_attempted',
                fixed_count: fixedCount,
                timestamp: new Date().toISOString()
            });
        });

        this.app.post('/api/rescan', (req, res) => {
            // Clear previous results
            this.diagnosticState.detected_loops.clear();
            this.diagnosticState.process_loops.clear();
            this.diagnosticState.file_descriptor_leaks.clear();
            this.diagnosticState.circular_references.clear();
            
            // Rescan
            this.setupDiagnostics();
            
            res.json({
                status: 'rescan_complete',
                new_loop_count: this.diagnosticState.weird_loops_count
            });
        });
    }

    getDiagnosticHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🔍 ELOOP Diagnostic Tool</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #0a0a0a;
            color: #00ff00;
            padding: 20px;
            line-height: 1.4;
        }

        .header {
            text-align: center;
            border: 2px solid #00ff00;
            padding: 20px;
            margin-bottom: 30px;
            background: rgba(0,255,0,0.1);
        }

        .diagnostic-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .diagnostic-panel {
            border: 1px solid #00ff00;
            padding: 15px;
            background: rgba(0,255,0,0.05);
        }

        .panel-title {
            color: #ffff00;
            font-size: 1.2em;
            margin-bottom: 15px;
            border-bottom: 1px solid #ffff00;
            padding-bottom: 5px;
        }

        .loop-item {
            margin: 10px 0;
            padding: 10px;
            border-left: 4px solid #ff6600;
            background: rgba(255,102,0,0.1);
        }

        .loop-item.critical {
            border-left-color: #ff0000;
            background: rgba(255,0,0,0.1);
        }

        .loop-item.medium {
            border-left-color: #ffff00;
            background: rgba(255,255,0,0.1);
        }

        .severity {
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 0.8em;
        }

        .severity.critical {
            background: #ff0000;
            color: white;
        }

        .severity.high {
            background: #ff6600;
            color: white;
        }

        .severity.medium {
            background: #ffff00;
            color: black;
        }

        .controls {
            text-align: center;
            margin: 30px 0;
        }

        .btn {
            background: #00ff00;
            color: #000;
            border: none;
            padding: 15px 30px;
            margin: 0 10px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
            text-transform: uppercase;
        }

        .btn:hover {
            background: #00cc00;
        }

        .btn.danger {
            background: #ff0000;
            color: white;
        }

        .btn.danger:hover {
            background: #cc0000;
        }

        .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }

        .stat {
            text-align: center;
        }

        .stat-number {
            font-size: 2em;
            color: #ffff00;
        }

        .weird-loop-indicator {
            animation: weirdPulse 2s infinite;
            text-align: center;
            font-size: 1.5em;
            margin: 20px 0;
        }

        @keyframes weirdPulse {
            0%, 100% { color: #00ff00; }
            50% { color: #ff00ff; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 ELOOP Diagnostic Tool</h1>
        <p>Analyzing the "weird loops" in your meta-architectural system</p>
        <div class="weird-loop-indicator">
            🌀 Detecting Infinite Recursion Patterns 🌀
        </div>
    </div>

    <div class="stats">
        <div class="stat">
            <div class="stat-number" id="total-loops">0</div>
            <div>Total Weird Loops</div>
        </div>
        <div class="stat">
            <div class="stat-number" id="critical-loops">0</div>
            <div>Critical Issues</div>
        </div>
        <div class="stat">
            <div class="stat-number" id="process-count">54</div>
            <div>Node Processes</div>
        </div>
    </div>

    <div class="controls">
        <button class="btn" onclick="rescanLoops()">🔄 Rescan Loops</button>
        <button class="btn danger" onclick="fixLoops()">🔧 Auto-Fix Issues</button>
        <button class="btn" onclick="downloadReport()">📊 Export Report</button>
    </div>

    <div class="diagnostic-grid">
        <div class="diagnostic-panel">
            <div class="panel-title">🔗 Symbolic Link Loops</div>
            <div id="symlink-loops">Loading...</div>
        </div>

        <div class="diagnostic-panel">
            <div class="panel-title">⚙️ Process Multiplication</div>
            <div id="process-loops">Loading...</div>
        </div>

        <div class="diagnostic-panel">
            <div class="panel-title">📁 File Descriptor Leaks</div>
            <div id="fd-loops">Loading...</div>
        </div>

        <div class="diagnostic-panel">
            <div class="panel-title">🌀 Circular Dependencies</div>
            <div id="circular-loops">Loading...</div>
        </div>
    </div>

    <script>
        function loadDiagnosticData() {
            fetch('/api/diagnostic-report')
                .then(response => response.json())
                .then(data => {
                    updateUI(data);
                });
        }

        function updateUI(data) {
            // Update stats
            document.getElementById('total-loops').textContent = data.summary.total_weird_loops;
            document.getElementById('critical-loops').textContent = 
                data.details.symlink_loops.filter(l => l.severity === 'CRITICAL').length +
                data.details.process_loops.filter(l => l.severity === 'CRITICAL').length;

            // Update panels
            updatePanel('symlink-loops', data.details.symlink_loops);
            updatePanel('process-loops', data.details.process_loops);
            updatePanel('fd-loops', data.details.fd_leaks);
            updatePanel('circular-loops', data.details.circular_deps);
        }

        function updatePanel(panelId, items) {
            const panel = document.getElementById(panelId);
            
            if (items.length === 0) {
                panel.innerHTML = '<div style="color: #666;">No issues detected</div>';
                return;
            }

            panel.innerHTML = items.map(item => \`
                <div class="loop-item \${item.severity.toLowerCase()}">
                    <div>
                        <span class="severity \${item.severity.toLowerCase()}">\${item.severity}</span>
                        <strong>\${item.type.replace(/_/g, ' ').toUpperCase()}</strong>
                    </div>
                    <div style="margin-top: 5px; font-size: 0.9em;">
                        \${item.path || item.command || item.cycle?.join(' → ') || 'System level issue'}
                    </div>
                    \${item.recommendation ? \`<div style="margin-top: 5px; color: #ffff00; font-size: 0.8em;">💡 \${item.recommendation}</div>\` : ''}
                </div>
            \`).join('');
        }

        function rescanLoops() {
            document.querySelector('button').disabled = true;
            fetch('/api/rescan', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(\`Rescan complete! Found \${data.new_loop_count} weird loops.\`);
                    loadDiagnosticData();
                    document.querySelector('button').disabled = false;
                });
        }

        function fixLoops() {
            if (confirm('This will attempt to automatically fix detected issues. Continue?')) {
                fetch('/api/fix-loops', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        alert(\`Auto-fix complete! Fixed \${data.fixed_count} issues.\`);
                        loadDiagnosticData();
                    });
            }
        }

        function downloadReport() {
            fetch('/api/diagnostic-report')
                .then(response => response.json())
                .then(data => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`eloop_diagnostic_\${Date.now()}.json\`;
                    a.click();
                });
        }

        // Load data on page load
        loadDiagnosticData();

        // Auto-refresh every 30 seconds
        setInterval(loadDiagnosticData, 30000);
    </script>
</body>
</html>
        `;
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🔍 ELOOP Diagnostic Tool: http://localhost:${this.port}`);
            console.log(`🎭 Detected ${this.diagnosticState.weird_loops_count} weird loops total`);
            console.log('🔧 Ready to diagnose and fix infinite recursion patterns');
        });
    }
}

// Start the diagnostic tool
const diagnostic = new ELOOPDiagnosticTool();
diagnostic.start();

module.exports = ELOOPDiagnosticTool;
#!/usr/bin/env node

/**
 * 🎯 SIMPLE WORKING SWIPER
 * Absolute minimal version that MUST work
 */

const fs = require('fs');
const express = require('express');

const app = express();
app.use(express.json());

// Ultra-simple state
let scanResults = { files: [], duplicates: [] };

// Main route
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🎯 Simple File Swiper</title>
    <style>
        body { font-family: Arial; margin: 40px; background: #f0f0f0; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
        .scan-btn { padding: 20px 40px; font-size: 18px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .scan-btn:hover { background: #45a049; }
        .results { margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 5px; }
        .file-item { margin: 10px 0; padding: 15px; background: #e9e9e9; border-radius: 5px; }
        .swipe-btn { margin: 5px; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; }
        .delete { background: #f44336; color: white; }
        .keep { background: #2196F3; color: white; }
        .success { color: #4CAF50; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Simple File Swiper</h1>
        <p>Ultra-minimal duplicate detection for JavaScript files</p>
        
        <button class="scan-btn" onclick="startScan()">🔍 Scan for JS Files</button>
        
        <div id="status" style="margin-top: 20px;"></div>
        <div id="results"></div>
    </div>
    
    <script>
        async function startScan() {
            document.getElementById('status').innerHTML = '🔍 Scanning...';
            
            try {
                const response = await fetch('/scan');
                const data = await response.json();
                
                if (data.success) {
                    displayResults(data);
                } else {
                    document.getElementById('status').innerHTML = '❌ Error: ' + (data.error || 'Unknown error');
                }
            } catch (error) {
                document.getElementById('status').innerHTML = '❌ Failed to scan: ' + error.message;
            }
        }
        
        function displayResults(data) {
            const status = document.getElementById('status');
            const results = document.getElementById('results');
            
            status.innerHTML = \`✅ Found \${data.totalFiles} JS files, \${data.duplicates.length} duplicates\`;
            
            if (data.duplicates.length === 0) {
                results.innerHTML = '<div class="success">🎉 No duplicates found! Your JS files are unique.</div>';
                return;
            }
            
            let html = '<h3>Duplicate Files:</h3>';
            data.duplicates.forEach((dup, index) => {
                html += \`
                    <div class="file-item">
                        <strong>Duplicate Set \${index + 1}:</strong><br>
                        \${dup.files.map(f => \`• \${f}\`).join('<br>')}
                        <br><br>
                        <button class="swipe-btn delete" onclick="handleDecision(\${index}, 'delete')">🗑️ Delete All</button>
                        <button class="swipe-btn keep" onclick="handleDecision(\${index}, 'keep')">📄 Keep All</button>
                        <span id="decision-\${index}"></span>
                    </div>
                \`;
            });
            
            results.innerHTML = html;
        }
        
        function handleDecision(index, decision) {
            const decisionEl = document.getElementById(\`decision-\${index}\`);
            const emoji = decision === 'delete' ? '🗑️' : '📄';
            decisionEl.innerHTML = \`<span class="success">\${emoji} Decision recorded!</span>\`;
            
            // Here you could send the decision to the server
            console.log(\`Decision for duplicate set \${index}: \${decision}\`);
        }
    </script>
</body>
</html>
    `);
});

// Scan endpoint
app.get('/scan', (req, res) => {
    try {
        console.log('🔍 Starting scan...');
        
        // Get JS files in current directory only
        const allFiles = fs.readdirSync('.');
        const jsFiles = allFiles.filter(file => 
            file.endsWith('.js') && 
            fs.statSync(file).isFile() &&
            !file.includes('node_modules')
        );
        
        console.log(`📊 Found ${jsFiles.length} JS files`);
        
        // Simple duplicate detection by file size
        const sizeGroups = {};
        const duplicates = [];
        
        jsFiles.forEach(file => {
            try {
                const size = fs.statSync(file).size;
                if (!sizeGroups[size]) {
                    sizeGroups[size] = [];
                }
                sizeGroups[size].push(file);
            } catch (error) {
                console.warn(`⚠️ Cannot process ${file}:`, error.message);
            }
        });
        
        // Find groups with multiple files
        Object.values(sizeGroups).forEach(group => {
            if (group.length > 1) {
                duplicates.push({ files: group });
            }
        });
        
        console.log(`📊 Found ${duplicates.length} duplicate groups`);
        
        res.json({
            success: true,
            totalFiles: jsFiles.length,
            duplicates: duplicates,
            message: `Scanned ${jsFiles.length} JS files, found ${duplicates.length} duplicate groups`
        });
        
    } catch (error) {
        console.error('❌ Scan failed:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = 3008;
app.listen(PORT, (err) => {
    if (err) {
        console.error('❌ Server failed to start:', err);
        process.exit(1);
    }
    
    console.log('🎯 SIMPLE WORKING SWIPER');
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log('📊 Ultra-minimal duplicate detection');
    console.log('🎯 Open browser and click "Scan for JS Files"');
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});
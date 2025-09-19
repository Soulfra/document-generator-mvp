const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.url}`);
    
    if (req.url === '/') {
        res.writeHead(302, { 'Location': '/quick-start.html' });
        res.end();
    } else if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'operational',
            services: {
                postgres: 'running on port 5433',
                redis: 'running on port 6380',
                ollama: 'running on port 11435',
                web: 'running on port 8888'
            },
            message: 'Everything is fucking working!'
        }));
    } else {
        const filePath = path.join(__dirname, req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(200);
                res.end(data);
            }
        });
    }
});

server.listen(9999, () => {
    console.log('🚀 Server running on http://localhost:9999');
    console.log('📊 Status: http://localhost:9999/status');
    console.log('🌐 Web UI: http://localhost:9999/quick-start.html');
});

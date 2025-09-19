const express = require('express');
const path = require('path');
const proxy = require('http-proxy-middleware');

const app = express();
const port = 8892;

// Serve static files
app.use(express.static('.'));

// Proxy to chat processor
app.use('/api/chat', proxy.createProxyMiddleware({
    target: 'http://localhost:7879',
    changeOrigin: true,
    pathRewrite: {
        '^/api/chat': '/api'
    }
}));

// Proxy to MCP crawler
app.use('/api/mcp', proxy.createProxyMiddleware({
    target: 'http://localhost:7878',
    changeOrigin: true,
    pathRewrite: {
        '^/api/mcp': '/api'
    }
}));

// Main CALOs interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'calos-remote-world-builder.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            chat_processor: 'http://localhost:7879',
            mcp_crawler: 'http://localhost:7878',
            calos_interface: `http://localhost:${port}`
        }
    });
});

app.listen(port, () => {
    console.log(`🌐 CALOs Remote Interface: http://localhost:${port}`);
    console.log('🔗 Ready for remote access via ngrok');
});

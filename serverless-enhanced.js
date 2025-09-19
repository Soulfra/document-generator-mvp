const { createExternalApp } = require('./external-communication-layer');

/**
 * Enhanced serverless entry point with full translation capabilities
 * 
 * Internal Systems (COBOL/Constellation/Broadcast) 
 *     ↓ Translation Bridge ↓
 * External Communication Layer
 *     ↓ Simple HTTP/JSON ↓
 * Cloudflare/Vercel (Happy!)
 */

// Create the app with all translation layers
const app = createExternalApp();

// Export for Vercel
module.exports = app;

// For local testing
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║          EXTERNAL COMMUNICATION LAYER ACTIVE                 ║
║                                                              ║
║  Internal → Translation → External → Success!                ║
║                                                              ║
║  Endpoints:                                                  ║
║  - GET  /health              Always works                    ║
║  - GET  /api/status          With fallbacks                  ║
║  - GET  /api/demo            Simple demo                     ║
║  - GET  /api/info            Basic info                      ║
║  - POST /api/process         Document processing             ║
║  - GET  /api/constellation   System status                   ║
║  - GET  /api/internal        Bridge status                   ║
║                                                              ║
║  Port: ${port}                                                    ║
╚══════════════════════════════════════════════════════════════╝
        `);
    });
}
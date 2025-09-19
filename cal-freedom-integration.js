#!/usr/bin/env node

/**
 * 🔗 CAL FREEDOM SYSTEM INTEGRATION
 * 
 * Connects the payment system to CalCompare and the broader ecosystem
 */

const CalFreedomPaymentSystem = require('./cal-freedom-payment-system');
const { CalEarningsSystem } = require('./cal-earnings-system');
const express = require('express');
const path = require('path');

class CalFreedomIntegration {
  constructor() {
    this.paymentSystem = new CalFreedomPaymentSystem();
    this.earningsSystem = new CalEarningsSystem();
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupIntegrations();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname)));
  }

  setupRoutes() {
    // Serve the display dashboard
    this.app.get('/cal-freedom', (req, res) => {
      res.sendFile(path.join(__dirname, 'cal-freedom-display.html'));
    });

    // Serve blog template
    this.app.get('/cal-freedom-blog', (req, res) => {
      res.sendFile(path.join(__dirname, 'cal-freedom-blog-template.md'));
    });

    // Widget endpoint for embedding
    this.app.get('/cal-freedom-widget.js', (req, res) => {
      res.type('application/javascript');
      res.send(`
        window.CalFreedom = {
          renderStats: function(elementId, options = {}) {
            const container = document.getElementById(elementId);
            if (!container) return;
            
            const iframe = document.createElement('iframe');
            iframe.src = '/cal-freedom-display.html';
            iframe.width = '100%';
            iframe.height = options.height || '600px';
            iframe.style.border = '2px solid #00ff88';
            iframe.style.background = '#000';
            container.appendChild(iframe);
          },
          
          makePayment: async function(amount, metadata = {}) {
            const response = await fetch('/api/cal-freedom/pay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount,
                type: 'api-payment',
                priority: 'instant',
                metadata
              })
            });
            return response.json();
          }
        };
      `);
    });

    // Forward API routes to payment system
    this.app.use('/api/cal-freedom', (req, res, next) => {
      // Proxy to payment system running on port 3056
      const options = {
        hostname: 'localhost',
        port: 3056,
        path: `/api/cal-freedom${req.url}`,
        method: req.method,
        headers: req.headers
      };

      const proxy = require('http').request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      req.pipe(proxy, { end: true });
    });
  }

  setupIntegrations() {
    // Connect payment system to earnings system
    this.paymentSystem.on('transaction-confirmed', async (data) => {
      const { transaction, balance } = data;
      
      // Track in earnings system
      if (this.earningsSystem.initialized) {
        await this.earningsSystem.trackConsultationEarnings({
          consultationId: transaction.txId,
          userId: transaction.fromUser,
          expertType: 'freedom-payment',
          cost: this.convertNanoToUSD(transaction.amount),
          provider: 'direct',
          response_time_ms: transaction.confirmedAt - transaction.createdAt
        });
      }
    });

    // Connect achievements
    this.paymentSystem.on('achievement-unlocked', (achievement) => {
      console.log(`🏆 Achievement broadcast: ${achievement.title}`);
      // Could send to WebSocket for real-time updates
    });

    // Connect freedom milestones
    this.paymentSystem.on('freedom-level-changed', (data) => {
      console.log(`🗽 Freedom level changed: ${data.oldLevel} → ${data.newLevel}`);
      // Could trigger special events or notifications
    });
  }

  convertNanoToUSD(nanoLines) {
    const fc = nanoLines / 1000000;
    return fc * 0.01;
  }

  async start() {
    // Initialize systems
    await this.earningsSystem.initialize();
    
    // Start servers
    const PORT = process.env.CAL_INTEGRATION_PORT || 3057;
    this.app.listen(PORT, () => {
      console.log(`🗽 Cal Freedom Integration running on port ${PORT}`);
      console.log(`🌐 Dashboard: http://localhost:${PORT}/cal-freedom`);
      console.log(`📝 Blog template: http://localhost:${PORT}/cal-freedom-blog`);
      console.log(`🔧 Widget: http://localhost:${PORT}/cal-freedom-widget.js`);
    });
  }
}

// Start the integration
if (require.main === module) {
  const integration = new CalFreedomIntegration();
  integration.start().catch(console.error);
}

module.exports = CalFreedomIntegration;
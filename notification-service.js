#!/usr/bin/env node

/**
 * 🔔 REAL-TIME NOTIFICATION SERVICE
 * 
 * Provides WebSocket-based real-time updates for agent work progress
 * Integrates with the marketplace to push updates to users
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

const PORT = 8081; // Notification service port

app.use(cors());
app.use(express.json());

// Connected clients tracking
const connectedClients = new Map();
const jobSubscriptions = new Map(); // jobId -> [socketIds]

console.log('🔔 Real-Time Notification Service Starting...');

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`👤 New client connected: ${socket.id}`);
  
  // Store client info
  connectedClients.set(socket.id, {
    connectedAt: new Date(),
    userId: null,
    subscribedJobs: new Set()
  });
  
  // Handle user authentication
  socket.on('authenticate', (data) => {
    const { userId, token } = data;
    const client = connectedClients.get(socket.id);
    if (client) {
      client.userId = userId;
      console.log(`🔐 Client ${socket.id} authenticated as user: ${userId}`);
      socket.emit('authenticated', { success: true, userId });
    }
  });
  
  // Subscribe to job updates
  socket.on('subscribe-job', (jobId) => {
    const client = connectedClients.get(socket.id);
    if (client) {
      client.subscribedJobs.add(jobId);
      
      // Add to job subscriptions
      if (!jobSubscriptions.has(jobId)) {
        jobSubscriptions.set(jobId, new Set());
      }
      jobSubscriptions.get(jobId).add(socket.id);
      
      console.log(`📊 Client ${socket.id} subscribed to job: ${jobId}`);
      socket.emit('subscribed', { jobId, success: true });
      
      // Send current job status if available
      sendJobStatus(socket, jobId);
    }
  });
  
  // Unsubscribe from job
  socket.on('unsubscribe-job', (jobId) => {
    const client = connectedClients.get(socket.id);
    if (client) {
      client.subscribedJobs.delete(jobId);
      
      const jobSubs = jobSubscriptions.get(jobId);
      if (jobSubs) {
        jobSubs.delete(socket.id);
        if (jobSubs.size === 0) {
          jobSubscriptions.delete(jobId);
        }
      }
      
      console.log(`🚫 Client ${socket.id} unsubscribed from job: ${jobId}`);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`👋 Client disconnected: ${socket.id}`);
    
    // Clean up subscriptions
    const client = connectedClients.get(socket.id);
    if (client) {
      client.subscribedJobs.forEach(jobId => {
        const jobSubs = jobSubscriptions.get(jobId);
        if (jobSubs) {
          jobSubs.delete(socket.id);
          if (jobSubs.size === 0) {
            jobSubscriptions.delete(jobId);
          }
        }
      });
    }
    
    connectedClients.delete(socket.id);
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// REST API for services to send notifications

// Send job progress update
app.post('/api/notify/job-progress', (req, res) => {
  const { jobId, progress, status, message, data } = req.body;
  
  if (!jobId) {
    return res.status(400).json({ error: 'Job ID required' });
  }
  
  const notification = {
    type: 'job-progress',
    jobId,
    progress: progress || 0,
    status: status || 'running',
    message: message || `Progress: ${progress}%`,
    data: data || {},
    timestamp: new Date().toISOString()
  };
  
  // Send to all subscribed clients
  const subscribers = jobSubscriptions.get(jobId);
  if (subscribers && subscribers.size > 0) {
    subscribers.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('job-update', notification);
      }
    });
    
    console.log(`📤 Sent job progress to ${subscribers.size} clients for job ${jobId}`);
  }
  
  res.json({ success: true, subscribers: subscribers ? subscribers.size : 0 });
});

// Send job completion notification
app.post('/api/notify/job-complete', (req, res) => {
  const { jobId, results, success, error } = req.body;
  
  if (!jobId) {
    return res.status(400).json({ error: 'Job ID required' });
  }
  
  const notification = {
    type: 'job-complete',
    jobId,
    success: success !== false,
    results: results || {},
    error: error || null,
    timestamp: new Date().toISOString()
  };
  
  // Send to all subscribed clients
  const subscribers = jobSubscriptions.get(jobId);
  if (subscribers && subscribers.size > 0) {
    subscribers.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('job-complete', notification);
      }
    });
    
    console.log(`🎉 Sent job completion to ${subscribers.size} clients for job ${jobId}`);
  }
  
  // Clean up job subscriptions after completion
  setTimeout(() => {
    jobSubscriptions.delete(jobId);
  }, 60000); // Clean up after 1 minute
  
  res.json({ success: true, subscribers: subscribers ? subscribers.size : 0 });
});

// Send custom notification
app.post('/api/notify/custom', (req, res) => {
  const { userId, type, title, message, data } = req.body;
  
  if (!userId || !type) {
    return res.status(400).json({ error: 'User ID and type required' });
  }
  
  const notification = {
    type: `custom-${type}`,
    title: title || 'Notification',
    message: message || '',
    data: data || {},
    timestamp: new Date().toISOString()
  };
  
  let sent = 0;
  
  // Find all sockets for this user
  connectedClients.forEach((client, socketId) => {
    if (client.userId === userId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('notification', notification);
        sent++;
      }
    }
  });
  
  console.log(`📨 Sent custom notification to ${sent} connections for user ${userId}`);
  
  res.json({ success: true, sent });
});

// Broadcast to all connected clients
app.post('/api/notify/broadcast', (req, res) => {
  const { type, title, message, data } = req.body;
  
  const notification = {
    type: `broadcast-${type || 'info'}`,
    title: title || 'System Announcement',
    message: message || '',
    data: data || {},
    timestamp: new Date().toISOString()
  };
  
  io.emit('broadcast', notification);
  
  console.log(`📢 Broadcast sent to ${connectedClients.size} clients`);
  
  res.json({ success: true, recipients: connectedClients.size });
});

// Get notification service stats
app.get('/api/stats', (req, res) => {
  const stats = {
    connectedClients: connectedClients.size,
    activeJobs: jobSubscriptions.size,
    clientDetails: Array.from(connectedClients.entries()).map(([socketId, client]) => ({
      socketId,
      userId: client.userId,
      connectedAt: client.connectedAt,
      subscribedJobs: Array.from(client.subscribedJobs)
    })),
    jobSubscriptions: Array.from(jobSubscriptions.entries()).map(([jobId, subscribers]) => ({
      jobId,
      subscribers: subscribers.size
    }))
  };
  
  res.json(stats);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Notification Service',
    websocket: 'active',
    connectedClients: connectedClients.size,
    timestamp: Date.now()
  });
});

// Helper function to send current job status
async function sendJobStatus(socket, jobId) {
  try {
    // Fetch current job status from marketplace
    const response = await require('axios').get(`http://localhost:8080/api/jobs/${jobId}`);
    
    if (response.data) {
      socket.emit('job-update', {
        type: 'job-status',
        jobId,
        progress: response.data.progress || 0,
        status: response.data.status || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error(`Failed to fetch job status for ${jobId}:`, error.message);
  }
}

// Simulate some notifications for testing
function simulateNotifications() {
  setInterval(() => {
    if (jobSubscriptions.size > 0) {
      const jobs = Array.from(jobSubscriptions.keys());
      const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
      const progress = Math.floor(Math.random() * 100);
      
      // Send progress update
      require('axios').post('http://localhost:8081/api/notify/job-progress', {
        jobId: randomJob,
        progress,
        status: progress === 100 ? 'completed' : 'running',
        message: `Processing... ${progress}% complete`
      }).catch(() => {});
    }
  }, 5000); // Every 5 seconds
}

// Start server
server.listen(PORT, () => {
  console.log(`
🔔 NOTIFICATION SERVICE ONLINE!
==============================
📍 WebSocket URL: ws://localhost:${PORT}
🔗 REST API: http://localhost:${PORT}/api
📊 Stats Dashboard: http://localhost:${PORT}/api/stats
✅ Ready to send real-time updates!
  `);
  
  // Start simulation in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('🎮 Starting notification simulation (dev mode)...');
    simulateNotifications();
  }
});

// Integration with marketplace service
// This would be imported by marketplace-integration.js
module.exports = {
  notifyJobProgress: async (jobId, progress, status, message) => {
    try {
      await require('axios').post(`http://localhost:${PORT}/api/notify/job-progress`, {
        jobId, progress, status, message
      });
    } catch (error) {
      console.error('Failed to send progress notification:', error.message);
    }
  },
  
  notifyJobComplete: async (jobId, results, success) => {
    try {
      await require('axios').post(`http://localhost:${PORT}/api/notify/job-complete`, {
        jobId, results, success
      });
    } catch (error) {
      console.error('Failed to send completion notification:', error.message);
    }
  },
  
  notifyUser: async (userId, type, title, message, data) => {
    try {
      await require('axios').post(`http://localhost:${PORT}/api/notify/custom`, {
        userId, type, title, message, data
      });
    } catch (error) {
      console.error('Failed to send user notification:', error.message);
    }
  }
};
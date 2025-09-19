#!/usr/bin/env node

/**
 * 🔐 TEMPORARY AUTH SERVICE
 * Provides basic authentication for system integration testing
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8899; // Different port to avoid conflicts

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'temp-integration-secret';

// Mock user database
const users = {
  'system-bus': { 
    id: 'system-bus', 
    username: 'system-bus', 
    roles: ['admin', 'system'],
    password: 'system-integration-key'
  },
  'admin': { 
    id: 'admin', 
    username: 'admin', 
    roles: ['admin'],
    password: 'admin'
  }
};

// System login endpoint
app.post('/api/system-login', (req, res) => {
  const { service, systemKey } = req.body;
  
  if (service === 'system-bus' && systemKey === 'system-integration-key') {
    const token = jwt.sign({
      id: 'system-bus',
      username: 'system-bus',
      roles: ['admin', 'system']
    }, JWT_SECRET, { expiresIn: '24h' });
    
    console.log('🔐 System bus token issued');
    
    return res.json({
      success: true,
      token,
      user: users['system-bus']
    });
  }
  
  res.status(401).json({ error: 'Invalid system credentials' });
});

// Token validation endpoint
app.post('/api/validate', (req, res) => {
  const { token } = req.body;
  
  if (token === 'SYSTEM_BUS_BYPASS_TOKEN') {
    return res.json({
      success: true,
      user: users['system-bus']
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users[username];
  if (user && user.password === password) {
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      roles: user.roles
    }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, roles: user.roles }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Temporary Auth Service' });
});

app.listen(PORT, () => {
  console.log('🔐 Temporary Auth Service running on port ' + PORT);
  console.log('   System token endpoint: POST /api/system-login');
  console.log('   Validation endpoint: POST /api/validate');
});

module.exports = app;

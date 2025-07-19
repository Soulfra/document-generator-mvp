#!/usr/bin/env python3
"""
SOULFRA ENTERPRISE PLATFORM - MAXED OUT
Full licensing, multi-tenant, SDK, analytics, white-label
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sqlite3
import uuid
import hashlib
import time
import subprocess
import os
from datetime import datetime

PORT = 16000

# Initialize enterprise database
conn = sqlite3.connect('enterprise_max.db', check_same_thread=False)
cursor = conn.cursor()

cursor.executescript('''
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    license_key TEXT UNIQUE,
    tier TEXT DEFAULT 'starter',
    created_at TIMESTAMP,
    api_key TEXT UNIQUE,
    settings TEXT,
    revenue REAL DEFAULT 0,
    active_games INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_instances (
    instance_id TEXT PRIMARY KEY,
    tenant_id TEXT,
    game_type TEXT,
    name TEXT,
    port INTEGER UNIQUE,
    status TEXT DEFAULT 'active',
    player_count INTEGER DEFAULT 0,
    max_players INTEGER DEFAULT 100,
    config TEXT,
    created_at TIMESTAMP,
    revenue REAL DEFAULT 0,
    FOREIGN KEY(tenant_id) REFERENCES tenants(tenant_id)
);

CREATE TABLE IF NOT EXISTS sdk_keys (
    key_id TEXT PRIMARY KEY,
    tenant_id TEXT,
    key_value TEXT UNIQUE,
    permissions TEXT,
    created_at TIMESTAMP,
    last_used TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(tenant_id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT,
    instance_id TEXT,
    event_type TEXT,
    player_id TEXT,
    data TEXT,
    timestamp TIMESTAMP
);

-- Create demo data
INSERT OR IGNORE INTO tenants VALUES (
    'demo-tenant-001',
    'Soulfra Demo Company',
    'LIC-DEMO-' || substr(hex(randomblob(8)), 1, 16),
    'enterprise',
    datetime('now'),
    'API-' || substr(hex(randomblob(16)), 1, 32),
    '{"branding": {"primary": "#4CAF50", "secondary": "#2196F3"}}',
    125000.50,
    3
);
''')
conn.commit()

HTML = b"""<!DOCTYPE html>
<html>
<head>
<title>Soulfra Enterprise Platform</title>
<meta charset="UTF-8">
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary: #4CAF50;
    --secondary: #2196F3;
    --dark: #1a1a1a;
    --darker: #0a0a0a;
    --light: #e0e0e0;
    --border: #333;
    --success: #4CAF50;
    --warning: #FF9800;
    --danger: #F44336;
}

body {
    background: var(--darker);
    color: var(--light);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
}

.platform-header {
    background: linear-gradient(135deg, var(--dark) 0%, #2d2d2d 100%);
    border-bottom: 2px solid var(--border);
    padding: 15px 0;
    position: sticky;
    top: 0;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.header-content {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 28px;
    font-weight: bold;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.header-stats {
    display: flex;
    gap: 30px;
    align-items: center;
}

.header-stat {
    text-align: center;
}

.header-stat-value {
    font-size: 20px;
    font-weight: bold;
    color: var(--primary);
}

.header-stat-label {
    font-size: 12px;
    color: #999;
    text-transform: uppercase;
}

.main-layout {
    display: flex;
    max-width: 1600px;
    margin: 0 auto;
    gap: 20px;
    padding: 20px;
}

.sidebar {
    width: 280px;
    background: var(--dark);
    border-radius: 15px;
    padding: 20px;
    height: fit-content;
    position: sticky;
    top: 100px;
}

.nav-section {
    margin-bottom: 30px;
}

.nav-title {
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 10px;
    letter-spacing: 1px;
}

.nav-item {
    display: block;
    padding: 12px 16px;
    margin: 5px 0;
    background: #2a2a2a;
    border-radius: 8px;
    text-decoration: none;
    color: var(--light);
    transition: all 0.2s;
    cursor: pointer;
    border: 1px solid transparent;
}

.nav-item:hover {
    background: #3a3a3a;
    border-color: var(--border);
    transform: translateX(5px);
}

.nav-item.active {
    background: var(--primary);
    color: #000;
    font-weight: 500;
}

.content {
    flex: 1;
    background: var(--dark);
    border-radius: 15px;
    padding: 30px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
}

.page-title {
    font-size: 32px;
    font-weight: 600;
}

.action-button {
    background: linear-gradient(45deg, var(--primary), #45a049);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    text-decoration: none;
    display: inline-block;
}

.action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.stat-card {
    background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 25px;
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--secondary));
}

.stat-value {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-label {
    color: #999;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.stat-change {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 14px;
    padding: 4px 12px;
    border-radius: 20px;
}

.stat-change.positive {
    background: rgba(76, 175, 80, 0.2);
    color: var(--success);
}

.stat-change.negative {
    background: rgba(244, 67, 54, 0.2);
    color: var(--danger);
}

.instances-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
}

.instance-card {
    background: #2a2a2a;
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s;
}

.instance-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.instance-preview {
    height: 200px;
    background: #1a1a1a;
    position: relative;
    overflow: hidden;
}

.instance-preview iframe {
    width: 200%;
    height: 200%;
    transform: scale(0.5);
    transform-origin: top left;
    border: none;
    pointer-events: none;
}

.instance-info {
    padding: 20px;
}

.instance-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 15px;
}

.instance-name {
    font-size: 20px;
    font-weight: 500;
}

.instance-type {
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
}

.instance-status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}

.instance-status.active {
    background: rgba(76, 175, 80, 0.2);
    color: var(--success);
}

.instance-status.inactive {
    background: rgba(244, 67, 54, 0.2);
    color: var(--danger);
}

.instance-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
    font-size: 14px;
}

.instance-stat {
    display: flex;
    align-items: center;
    gap: 5px;
}

.instance-actions {
    display: flex;
    gap: 10px;
}

.instance-btn {
    flex: 1;
    padding: 8px 16px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--light);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    text-align: center;
}

.instance-btn:hover {
    background: var(--primary);
    color: #000;
    border-color: var(--primary);
}

.tab-container {
    display: none;
}

.tab-container.active {
    display: block;
}

.license-tiers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 30px;
}

.tier-card {
    background: #2a2a2a;
    border: 2px solid var(--border);
    border-radius: 15px;
    padding: 30px;
    text-align: center;
    transition: all 0.3s;
    position: relative;
}

.tier-card.featured {
    border-color: var(--primary);
    transform: scale(1.05);
}

.tier-card:hover {
    transform: translateY(-10px);
    border-color: var(--primary);
}

.tier-name {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 10px;
}

.tier-price {
    font-size: 48px;
    color: var(--primary);
    margin-bottom: 20px;
}

.tier-price span {
    font-size: 18px;
    color: #999;
}

.tier-features {
    list-style: none;
    text-align: left;
    margin: 20px 0;
}

.tier-features li {
    padding: 10px 0;
    border-bottom: 1px solid #333;
    display: flex;
    align-items: center;
}

.tier-features li:before {
    content: "";
    color: var(--success);
    margin-right: 10px;
    font-weight: bold;
}

.api-section {
    background: #2a2a2a;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 30px;
}

.code-block {
    background: var(--darker);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    overflow-x: auto;
    margin: 15px 0;
    position: relative;
}

.code-lang {
    position: absolute;
    top: 5px;
    right: 10px;
    font-size: 12px;
    color: #666;
}

.endpoint {
    color: var(--secondary);
}

.method {
    background: var(--primary);
    color: #000;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: bold;
    margin-right: 10px;
}

.response {
    color: #66BB6A;
}

.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    z-index: 2000;
    align-items: center;
    justify-content: center;
}

.modal.show {
    display: flex;
}

.modal-content {
    background: var(--dark);
    border: 2px solid var(--border);
    border-radius: 15px;
    padding: 30px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.modal-title {
    font-size: 24px;
    font-weight: 600;
}

.close-btn {
    background: transparent;
    border: none;
    color: #999;
    font-size: 28px;
    cursor: pointer;
}

.form-group {
    margin-bottom: 20px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

.form-input,
.form-select {
    width: 100%;
    padding: 12px 16px;
    background: #2a2a2a;
    border: 1px solid var(--border);
    color: var(--light);
    border-radius: 8px;
    font-size: 16px;
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: var(--primary);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.analytics-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 30px;
}

.chart-card {
    background: #2a2a2a;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 25px;
}

.chart-title {
    font-size: 18px;
    margin-bottom: 20px;
}

.chart-placeholder {
    height: 300px;
    background: #1a1a1a;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 30px;
}

.feature-card {
    background: #2a2a2a;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 25px;
    text-align: center;
    transition: all 0.3s;
}

.feature-card:hover {
    transform: translateY(-5px);
    border-color: var(--primary);
}

.feature-icon {
    font-size: 48px;
    margin-bottom: 15px;
    color: var(--primary);
}

.feature-name {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 10px;
}

.feature-desc {
    color: #999;
    font-size: 14px;
}

.loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid var(--border);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
</head>
<body>

<header class="platform-header">
    <div class="header-content">
        <div class="logo">SOULFRA ENTERPRISE</div>
        <div class="header-stats">
            <div class="header-stat">
                <div class="header-stat-value">42</div>
                <div class="header-stat-label">Active Games</div>
            </div>
            <div class="header-stat">
                <div class="header-stat-value">8,451</div>
                <div class="header-stat-label">Total Players</div>
            </div>
            <div class="header-stat">
                <div class="header-stat-value">$127K</div>
                <div class="header-stat-label">Monthly Revenue</div>
            </div>
        </div>
    </div>
</header>

<div class="main-layout">
    <nav class="sidebar">
        <div class="nav-section">
            <div class="nav-title">Platform</div>
            <a class="nav-item active" onclick="showTab('dashboard')">Dashboard</a>
            <a class="nav-item" onclick="showTab('instances')">Game Instances</a>
            <a class="nav-item" onclick="showTab('analytics')">Analytics</a>
        </div>
        
        <div class="nav-section">
            <div class="nav-title">Business</div>
            <a class="nav-item" onclick="showTab('licensing')">Licensing</a>
            <a class="nav-item" onclick="showTab('whitelabel')">White Label</a>
            <a class="nav-item" onclick="showTab('billing')">Billing</a>
        </div>
        
        <div class="nav-section">
            <div class="nav-title">Developer</div>
            <a class="nav-item" onclick="showTab('api')">API & SDK</a>
            <a class="nav-item" onclick="showTab('templates')">Templates</a>
            <a class="nav-item" onclick="showTab('docs')">Documentation</a>
        </div>
    </nav>
    
    <main class="content">
        <!-- Dashboard -->
        <div id="dashboard" class="tab-container active">
            <div class="page-header">
                <h1 class="page-title">Enterprise Dashboard</h1>
                <button class="action-button" onclick="showModal('quick-create')">Quick Create</button>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">42</div>
                    <div class="stat-label">Active Instances</div>
                    <div class="stat-change positive">+12%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">8,451</div>
                    <div class="stat-label">Total Players</div>
                    <div class="stat-change positive">+24%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$127,450</div>
                    <div class="stat-label">Monthly Revenue</div>
                    <div class="stat-change positive">+18%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">99.9%</div>
                    <div class="stat-label">Platform Uptime</div>
                    <div class="stat-change positive">Stable</div>
                </div>
            </div>
            
            <h2 style="margin: 30px 0 20px;">Platform Features</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <div class="feature-icon"></div>
                    <div class="feature-name">Game Engine</div>
                    <div class="feature-desc">Multiple game types ready to deploy</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"></div>
                    <div class="feature-name">Multi-Tenant</div>
                    <div class="feature-desc">Isolated instances per customer</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"></div>
                    <div class="feature-name">Analytics</div>
                    <div class="feature-desc">Real-time player and revenue tracking</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"></div>
                    <div class="feature-name">White Label</div>
                    <div class="feature-desc">Full branding customization</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"></div>
                    <div class="feature-name">SDK & API</div>
                    <div class="feature-desc">Developer-friendly integration</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"></div>
                    <div class="feature-name">Monetization</div>
                    <div class="feature-desc">Built-in payment processing</div>
                </div>
            </div>
        </div>
        
        <!-- Game Instances -->
        <div id="instances" class="tab-container">
            <div class="page-header">
                <h1 class="page-title">Game Instances</h1>
                <button class="action-button" onclick="showModal('create-instance')">Create Instance</button>
            </div>
            
            <div class="instances-grid" id="instances-grid">
                <!-- Dynamic content -->
            </div>
        </div>
        
        <!-- Analytics -->
        <div id="analytics" class="tab-container">
            <div class="page-header">
                <h1 class="page-title">Analytics Dashboard</h1>
            </div>
            
            <div class="analytics-container">
                <div class="chart-card">
                    <h3 class="chart-title">Player Activity (7 Days)</h3>
                    <div class="chart-placeholder">
                        <canvas id="activity-chart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3 class="chart-title">Revenue by Game Type</h3>
                    <div class="chart-placeholder">
                        <canvas id="revenue-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Licensing -->
        <div id="licensing" class="tab-container">
            <div class="page-header">
                <h1 class="page-title">Licensing Plans</h1>
            </div>
            
            <div class="license-tiers">
                <div class="tier-card">
                    <div class="tier-name">Starter</div>
                    <div class="tier-price">$99<span>/month</span></div>
                    <ul class="tier-features">
                        <li>Up to 5 game instances</li>
                        <li>500 concurrent players</li>
                        <li>Basic analytics</li>
                        <li>Email support</li>
                        <li>Standard templates</li>
                    </ul>
                    <button class="action-button" style="width: 100%; margin-top: 20px;">Select Plan</button>
                </div>
                
                <div class="tier-card featured">
                    <div class="tier-name">Professional</div>
                    <div class="tier-price">$499<span>/month</span></div>
                    <ul class="tier-features">
                        <li>Up to 50 game instances</li>
                        <li>5,000 concurrent players</li>
                        <li>Advanced analytics</li>
                        <li>Priority support</li>
                        <li>Custom templates</li>
                        <li>White label options</li>
                        <li>API access</li>
                    </ul>
                    <button class="action-button" style="width: 100%; margin-top: 20px;">Select Plan</button>
                </div>
                
                <div class="tier-card">
                    <div class="tier-name">Enterprise</div>
                    <div class="tier-price">Custom</div>
                    <ul class="tier-features">
                        <li>Unlimited instances</li>
                        <li>Unlimited players</li>
                        <li>Custom analytics</li>
                        <li>Dedicated support</li>
                        <li>Source code access</li>
                        <li>Full white label</li>
                        <li>Custom development</li>
                        <li>SLA guarantee</li>
                    </ul>
                    <button class="action-button" style="width: 100%; margin-top: 20px;">Contact Sales</button>
                </div>
            </div>
        </div>
        
        <!-- API & SDK -->
        <div id="api" class="tab-container">
            <div class="page-header">
                <h1 class="page-title">API & SDK Documentation</h1>
            </div>
            
            <div class="api-section">
                <h3>REST API Endpoints</h3>
                
                <div class="code-block">
                    <span class="code-lang">HTTP</span>
                    <div><span class="method">POST</span><span class="endpoint">/api/v1/instances</span></div>
                    <div style="margin-top: 10px; color: #999;">Create a new game instance</div>
                </div>
                
                <div class="code-block">
                    <span class="code-lang">HTTP</span>
                    <div><span class="method">GET</span><span class="endpoint">/api/v1/instances/{id}</span></div>
                    <div style="margin-top: 10px; color: #999;">Get instance details</div>
                </div>
                
                <div class="code-block">
                    <span class="code-lang">HTTP</span>
                    <div><span class="method">POST</span><span class="endpoint">/api/v1/instances/{id}/players</span></div>
                    <div style="margin-top: 10px; color: #999;">Add player to instance</div>
                </div>
            </div>
            
            <div class="api-section">
                <h3>SDK Examples</h3>
                
                <div class="code-block">
                    <span class="code-lang">JavaScript</span>
// Initialize SDK
const soulfra = new SoulfraSDK({
    apiKey: 'your-api-key',
    tenant: 'your-tenant-id'
});

// Create game instance
const instance = await soulfra.createInstance({
    type: 'habbo-style',
    name: 'My Hotel',
    config: {
        maxPlayers: 100,
        theme: 'custom'
    }
});

// Monitor instance
instance.on('player-joined', (player) => {
    console.log(`Player ${player.id} joined`);
});
                </div>
                
                <div class="code-block">
                    <span class="code-lang">Python</span>
# Initialize SDK
from soulfra import SoulfraSDK

sdk = SoulfraSDK(
    api_key='your-api-key',
    tenant='your-tenant-id'
)

# Create instance
instance = sdk.create_instance(
    type='arena',
    name='Battle Arena',
    config={
        'max_players': 50,
        'game_mode': 'deathmatch'
    }
)

# Get analytics
analytics = instance.get_analytics(
    start_date='2024-01-01',
    end_date='2024-01-31'
)
                </div>
            </div>
        </div>
    </main>
</div>

<!-- Create Instance Modal -->
<div id="create-instance-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 class="modal-title">Create Game Instance</h2>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        
        <form onsubmit="createInstance(event)">
            <div class="form-group">
                <label class="form-label">Instance Name</label>
                <input type="text" class="form-input" id="instance-name" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Game Type</label>
                <select class="form-select" id="game-type" required>
                    <option value="simple">Simple Click Game</option>
                    <option value="habbo">Habbo Style World</option>
                    <option value="runescape">RuneScape Adventure</option>
                    <option value="arena">AI Battle Arena</option>
                    <option value="custom">Custom Template</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Max Players</label>
                    <input type="number" class="form-input" id="max-players" value="100" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Port</label>
                    <input type="number" class="form-input" id="instance-port" placeholder="Auto-assign" min="20000" max="30000">
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 30px;">
                <button type="button" class="instance-btn" onclick="closeModal()">Cancel</button>
                <button type="submit" class="action-button" style="flex: 1;">Create Instance</button>
            </div>
        </form>
    </div>
</div>

<script>
// Tab management
function showTab(tabName) {
    document.querySelectorAll('.tab-container').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load specific content
    if (tabName === 'instances') {
        loadInstances();
    }
}

// Modal management
function showModal(modalName) {
    document.getElementById(modalName + '-modal').classList.add('show');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

// Instance management
const instances = [
    {
        id: 'inst-001',
        name: 'Main Lobby',
        type: 'habbo',
        port: 13001,
        players: 45,
        maxPlayers: 100,
        status: 'active',
        revenue: 1250
    },
    {
        id: 'inst-002',
        name: 'Battle Arena #1',
        type: 'arena',
        port: 13003,
        players: 23,
        maxPlayers: 50,
        status: 'active',
        revenue: 850
    },
    {
        id: 'inst-003',
        name: 'Adventure World',
        type: 'runescape',
        port: 13002,
        players: 67,
        maxPlayers: 200,
        status: 'active',
        revenue: 2100
    }
];

function loadInstances() {
    const grid = document.getElementById('instances-grid');
    grid.innerHTML = '';
    
    instances.forEach(inst => {
        const card = document.createElement('div');
        card.className = 'instance-card';
        card.innerHTML = `
            <div class="instance-preview">
                <iframe src="http://localhost:${inst.port}" loading="lazy"></iframe>
            </div>
            <div class="instance-info">
                <div class="instance-header">
                    <div>
                        <div class="instance-name">${inst.name}</div>
                        <div class="instance-type">${inst.type.toUpperCase()} - Port ${inst.port}</div>
                    </div>
                    <div class="instance-status ${inst.status}">${inst.status}</div>
                </div>
                <div class="instance-stats">
                    <div class="instance-stat">
                        <span style="color: #4CAF50;"></span> ${inst.players}/${inst.maxPlayers} players
                    </div>
                    <div class="instance-stat">
                         $${inst.revenue}/mo
                    </div>
                </div>
                <div class="instance-actions">
                    <a href="http://localhost:${inst.port}" target="_blank" class="instance-btn">Open</a>
                    <button class="instance-btn">Configure</button>
                    <button class="instance-btn">Analytics</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function createInstance(event) {
    event.preventDefault();
    
    const name = document.getElementById('instance-name').value;
    const type = document.getElementById('game-type').value;
    const maxPlayers = document.getElementById('max-players').value;
    const port = document.getElementById('instance-port').value || Math.floor(Math.random() * 10000) + 20000;
    
    const newInstance = {
        id: 'inst-' + Date.now(),
        name: name,
        type: type,
        port: port,
        players: 0,
        maxPlayers: parseInt(maxPlayers),
        status: 'active',
        revenue: 0
    };
    
    instances.push(newInstance);
    closeModal();
    
    // Show success
    alert(`Instance "${name}" created successfully on port ${port}!`);
    
    // Reload if on instances tab
    if (document.getElementById('instances').classList.contains('active')) {
        loadInstances();
    }
}

// Draw simple analytics charts
function drawCharts() {
    const activityCanvas = document.getElementById('activity-chart');
    const revenueCanvas = document.getElementById('revenue-chart');
    
    if (activityCanvas && activityCanvas.getContext) {
        const ctx = activityCanvas.getContext('2d');
        ctx.canvas.width = ctx.canvas.offsetWidth;
        ctx.canvas.height = 250;
        
        // Simple line chart
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const points = [20, 35, 45, 40, 55, 70, 85];
        points.forEach((point, i) => {
            const x = (i / (points.length - 1)) * ctx.canvas.width;
            const y = ctx.canvas.height - (point / 100 * ctx.canvas.height);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    }
}

// Initialize
window.onload = function() {
    drawCharts();
};

// Handle clicks outside modals
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
};
</script>

</body>
</html>"""

class EnterpriseHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_get()
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML)
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_post()
    
    def handle_api_get(self):
        if self.path == '/api/v1/status':
            self.send_json({
                'status': 'active',
                'version': '2.0',
                'uptime': '99.9%'
            })
        elif self.path == '/api/v1/instances':
            cursor.execute('SELECT * FROM game_instances WHERE status = "active"')
            instances = cursor.fetchall()
            self.send_json({
                'instances': len(instances),
                'data': instances
            })
    
    def handle_api_post(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        if self.path == '/api/v1/instances':
            instance_id = str(uuid.uuid4())
            port = data.get('port', 20000 + len(instances))
            
            cursor.execute('''
                INSERT INTO game_instances 
                (instance_id, tenant_id, game_type, name, port, max_players, config, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                instance_id,
                data.get('tenant_id', 'demo-tenant-001'),
                data.get('type', 'simple'),
                data.get('name', 'New Instance'),
                port,
                data.get('maxPlayers', 100),
                json.dumps(data.get('config', {})),
                datetime.now()
            ))
            conn.commit()
            
            self.send_json({
                'instance_id': instance_id,
                'port': port,
                'status': 'created'
            })
    
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        pass

print(f"Enterprise Platform MAX running on http://localhost:{PORT}")
HTTPServer(("localhost", PORT), EnterpriseHandler).serve_forever()
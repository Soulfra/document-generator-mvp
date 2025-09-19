#!/usr/bin/env node

/**
 * USER COLOR STATUS SERVICE
 * Maps user activity to colors based on Unix timestamps
 * Integrates with existing systems for real-time status tracking
 * 
 * Color Mapping:
 * 🟢 Green = Online/Active (last seen < 5 minutes)
 * 🟡 Yellow = Away/Idle (last seen 5-30 minutes)
 * 🔴 Red = Offline (last seen > 30 minutes)
 * 🔵 Blue = New User (created < 24 hours ago)
 * 🟣 Purple = Premium/Special Status
 * ⚪ Gray = Inactive/Archived (no activity > 30 days)
 */

const { Client } = require('pg');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class UserColorStatusService {
    constructor() {
        this.status = {
            service: 'user-color-status',
            started: Date.now(),
            unixEpoch: new Date('1970-01-01T00:00:00Z').getTime(),
            connections: {
                postgres: null,
                websocket: null,
                sqlite: null
            },
            colorMappings: {
                online: { hex: '#00FF00', emoji: '🟢', name: 'green', threshold: 5 * 60 * 1000 }, // 5 minutes
                away: { hex: '#FFFF00', emoji: '🟡', name: 'yellow', threshold: 30 * 60 * 1000 }, // 30 minutes
                offline: { hex: '#FF0000', emoji: '🔴', name: 'red', threshold: Infinity },
                newUser: { hex: '#0000FF', emoji: '🔵', name: 'blue', threshold: 24 * 60 * 60 * 1000 }, // 24 hours
                premium: { hex: '#800080', emoji: '🟣', name: 'purple', threshold: null },
                inactive: { hex: '#808080', emoji: '⚪', name: 'gray', threshold: 30 * 24 * 60 * 60 * 1000 } // 30 days
            },
            users: new Map()
        };
        
        // Connect to existing systems
        this.initializeConnections();
        
        console.log('🎨 User Color Status Service Initializing...');
        console.log(`⏰ Unix Epoch: ${this.status.unixEpoch} (${new Date(this.status.unixEpoch).toISOString()})`);
        console.log(`📅 Current Time: ${Date.now()} (${new Date().toISOString()})`);
    }
    
    async initializeConnections() {
        try {
            // Connect to PostgreSQL (from existing AGENT-ECONOMY-FORUM config)
            this.status.connections.postgres = new Client({
                host: process.env.PG_HOST || 'localhost',
                port: process.env.PG_PORT || 5432,
                database: process.env.PG_DATABASE || 'document_generator',
                user: process.env.PG_USER || 'postgres',
                password: process.env.PG_PASSWORD || 'postgres'
            });
            
            await this.status.connections.postgres.connect();
            console.log('✅ Connected to PostgreSQL');
            
            // Create/update unified_users table with color fields
            await this.updateDatabaseSchema();
            
            // Connect to WebSocket server for real-time updates
            this.status.connections.websocket = new WebSocket.Server({ port: 8084 });
            console.log('✅ WebSocket server started on port 8084');
            
            this.setupWebSocketHandlers();
            
            // Start monitoring loop
            this.startMonitoring();
            
        } catch (error) {
            console.error('❌ Connection initialization failed:', error);
            throw error;
        }
    }
    
    async updateDatabaseSchema() {
        try {
            // Add color_status fields to unified_users if they don't exist
            const alterTableQuery = `
                DO $$ 
                BEGIN
                    -- Add color_status column if it doesn't exist
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'unified_users' AND column_name = 'color_status'
                    ) THEN
                        ALTER TABLE unified_users ADD COLUMN color_status VARCHAR(20) DEFAULT 'offline';
                    END IF;
                    
                    -- Add color_hex column
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'unified_users' AND column_name = 'color_hex'
                    ) THEN
                        ALTER TABLE unified_users ADD COLUMN color_hex VARCHAR(7) DEFAULT '#FF0000';
                    END IF;
                    
                    -- Add last_activity_unix column
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'unified_users' AND column_name = 'last_activity_unix'
                    ) THEN
                        ALTER TABLE unified_users ADD COLUMN last_activity_unix BIGINT DEFAULT 0;
                    END IF;
                    
                    -- Add days_since_epoch column
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'unified_users' AND column_name = 'days_since_epoch'
                    ) THEN
                        ALTER TABLE unified_users ADD COLUMN days_since_epoch INTEGER DEFAULT 0;
                    END IF;
                END $$;
            `;
            
            await this.status.connections.postgres.query(alterTableQuery);
            console.log('✅ Database schema updated with color fields');
            
        } catch (error) {
            console.error('❌ Schema update failed:', error);
        }
    }
    
    calculateUserColor(user) {
        const now = Date.now();
        const lastActivity = user.last_activity_unix || user.last_login?.getTime() || 0;
        const createdAt = user.created_at?.getTime() || 0;
        const timeSinceActivity = now - lastActivity;
        const timeSinceCreation = now - createdAt;
        
        // Calculate days since Unix epoch (like Mason's 1/1/1970)
        const daysSinceEpoch = Math.floor((now - this.status.unixEpoch) / (1000 * 60 * 60 * 24));
        
        // Special case: Unix epoch user (Mason)
        if (createdAt === this.status.unixEpoch) {
            return {
                status: 'epoch',
                hex: '#000000',
                emoji: '🌌',
                name: 'epoch',
                daysSinceEpoch
            };
        }
        
        // Premium/Special users (like those with special mottos)
        if (user.subscription_tier === 'premium' || user.role === 'admin') {
            return {
                status: 'premium',
                ...this.status.colorMappings.premium,
                daysSinceEpoch
            };
        }
        
        // New users (created within 24 hours)
        if (timeSinceCreation < this.status.colorMappings.newUser.threshold) {
            return {
                status: 'newUser',
                ...this.status.colorMappings.newUser,
                daysSinceEpoch
            };
        }
        
        // Inactive users (no activity for 30 days)
        if (timeSinceActivity > this.status.colorMappings.inactive.threshold) {
            return {
                status: 'inactive',
                ...this.status.colorMappings.inactive,
                daysSinceEpoch
            };
        }
        
        // Active status based on last activity
        if (timeSinceActivity < this.status.colorMappings.online.threshold) {
            return {
                status: 'online',
                ...this.status.colorMappings.online,
                daysSinceEpoch
            };
        } else if (timeSinceActivity < this.status.colorMappings.away.threshold) {
            return {
                status: 'away',
                ...this.status.colorMappings.away,
                daysSinceEpoch
            };
        } else {
            return {
                status: 'offline',
                ...this.status.colorMappings.offline,
                daysSinceEpoch
            };
        }
    }
    
    async updateUserColors() {
        try {
            // Fetch all users with their timestamps
            const result = await this.status.connections.postgres.query(`
                SELECT id, username, email, created_at, last_login, 
                       subscription_tier, role, last_activity_unix
                FROM unified_users
            `);
            
            const users = result.rows;
            const updates = [];
            
            for (const user of users) {
                const colorData = this.calculateUserColor(user);
                
                // Update user in database
                const updateQuery = `
                    UPDATE unified_users 
                    SET color_status = $1, 
                        color_hex = $2, 
                        last_activity_unix = $3,
                        days_since_epoch = $4
                    WHERE id = $5
                `;
                
                updates.push(this.status.connections.postgres.query(updateQuery, [
                    colorData.status,
                    colorData.hex,
                    user.last_login?.getTime() || Date.now(),
                    colorData.daysSinceEpoch,
                    user.id
                ]));
                
                // Store in memory for WebSocket updates
                this.status.users.set(user.id, {
                    ...user,
                    color: colorData
                });
            }
            
            await Promise.all(updates);
            
            // Broadcast color updates to connected clients
            this.broadcastColorUpdates();
            
            console.log(`🎨 Updated colors for ${users.length} users`);
            
        } catch (error) {
            console.error('❌ Color update failed:', error);
        }
    }
    
    setupWebSocketHandlers() {
        this.status.connections.websocket.on('connection', (ws) => {
            console.log('🔌 New WebSocket client connected');
            
            // Send current user colors on connection
            ws.send(JSON.stringify({
                type: 'initial_state',
                users: Array.from(this.status.users.values()),
                timestamp: Date.now(),
                daysSinceEpoch: Math.floor((Date.now() - this.status.unixEpoch) / (1000 * 60 * 60 * 24))
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    switch (data.type) {
                        case 'update_activity':
                            await this.updateUserActivity(data.userId);
                            break;
                            
                        case 'get_user_color':
                            const userColor = await this.getUserColor(data.userId);
                            ws.send(JSON.stringify({
                                type: 'user_color',
                                userId: data.userId,
                                color: userColor
                            }));
                            break;
                            
                        case 'subscribe_updates':
                            // Client wants real-time updates
                            ws.isSubscribed = true;
                            break;
                    }
                } catch (error) {
                    console.error('❌ WebSocket message error:', error);
                }
            });
        });
    }
    
    async updateUserActivity(userId) {
        const now = Date.now();
        
        try {
            // Update last activity in database
            await this.status.connections.postgres.query(`
                UPDATE unified_users 
                SET last_login = NOW(),
                    last_activity_unix = $1
                WHERE id = $2
            `, [now, userId]);
            
            // Update colors immediately
            await this.updateUserColors();
            
            console.log(`👤 Updated activity for user ${userId}`);
            
        } catch (error) {
            console.error('❌ Activity update failed:', error);
        }
    }
    
    async getUserColor(userId) {
        const user = this.status.users.get(userId);
        if (user) {
            return user.color;
        }
        
        // Fetch from database if not in memory
        const result = await this.status.connections.postgres.query(`
            SELECT color_status, color_hex, days_since_epoch
            FROM unified_users
            WHERE id = $1
        `, [userId]);
        
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        
        return null;
    }
    
    broadcastColorUpdates() {
        const message = JSON.stringify({
            type: 'color_update',
            users: Array.from(this.status.users.values()).map(u => ({
                id: u.id,
                username: u.username,
                color: u.color
            })),
            timestamp: Date.now()
        });
        
        // Broadcast to all subscribed clients
        this.status.connections.websocket.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.isSubscribed) {
                client.send(message);
            }
        });
    }
    
    startMonitoring() {
        // Update colors every 30 seconds
        setInterval(() => {
            this.updateUserColors();
        }, 30000);
        
        // Initial update
        this.updateUserColors();
        
        console.log('🔄 Color monitoring started (updates every 30 seconds)');
    }
    
    // Generate status report
    async generateStatusReport() {
        const users = Array.from(this.status.users.values());
        const report = {
            timestamp: Date.now(),
            daysSinceEpoch: Math.floor((Date.now() - this.status.unixEpoch) / (1000 * 60 * 60 * 24)),
            totalUsers: users.length,
            colorDistribution: {
                online: users.filter(u => u.color.status === 'online').length,
                away: users.filter(u => u.color.status === 'away').length,
                offline: users.filter(u => u.color.status === 'offline').length,
                newUser: users.filter(u => u.color.status === 'newUser').length,
                premium: users.filter(u => u.color.status === 'premium').length,
                inactive: users.filter(u => u.color.status === 'inactive').length,
                epoch: users.filter(u => u.color.status === 'epoch').length
            }
        };
        
        return report;
    }
}

// Export for use in other services
module.exports = UserColorStatusService;

// Run if called directly
if (require.main === module) {
    const service = new UserColorStatusService();
    
    // Add graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down User Color Status Service...');
        
        if (service.status.connections.postgres) {
            await service.status.connections.postgres.end();
        }
        
        if (service.status.connections.websocket) {
            service.status.connections.websocket.close();
        }
        
        process.exit(0);
    });
    
    console.log('🎨 User Color Status Service Running');
    console.log('📡 WebSocket: ws://localhost:8084');
    console.log('⌨️ Press Ctrl+C to stop');
}
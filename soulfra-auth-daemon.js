#!/usr/bin/env node

/**
 * SOULFRA AUTH DAEMON
 * 
 * Background service that manages OAuth connections and provides tokens to services.
 * Runs as a daemon, creating port mirrors between web and terminal.
 */

const http = require('http');
const net = require('net');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const OAuthSystemBridge = require('./oauth-system-bridge.js');

class SoulFraAuthDaemon {
    constructor() {
        this.bridge = new OAuthSystemBridge();
        this.port = 8463; // Daemon port
        this.socketPath = path.join(os.tmpdir(), 'soulfra-auth.sock');
        this.pidFile = path.join(os.homedir(), '.soulfra', 'auth-daemon.pid');
        this.logFile = path.join(os.homedir(), '.soulfra', 'auth-daemon.log');
        
        this.setupSignalHandlers();
    }
    
    async start() {
        // Check if already running
        if (await this.isRunning()) {
            console.log('❌ SoulFra Auth Daemon is already running');
            process.exit(1);
        }
        
        // Daemonize if not in foreground mode
        if (!process.env.SOULFRA_DAEMON_FOREGROUND) {
            this.daemonize();
            return;
        }
        
        await this.initialize();
    }
    
    async initialize() {
        console.log('🚀 SoulFra Auth Daemon starting...');
        
        // Write PID file
        await this.writePidFile();
        
        // Start HTTP API server
        await this.startAPIServer();
        
        // Start Unix socket server (for local IPC)
        await this.startSocketServer();
        
        // Start port mirror service
        await this.startPortMirror();
        
        console.log('✅ SoulFra Auth Daemon is running');
        console.log(`   HTTP API: http://localhost:${this.port}`);
        console.log(`   Socket: ${this.socketPath}`);
        console.log(`   PID: ${process.pid}`);
    }
    
    async startAPIServer() {
        this.apiServer = http.createServer(async (req, res) => {
            // CORS headers for browser access
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = new URL(req.url, `http://localhost:${this.port}`);
            
            try {
                switch (url.pathname) {
                    case '/status':
                        await this.handleStatus(req, res);
                        break;
                    
                    case '/token':
                        await this.handleGetToken(req, res);
                        break;
                    
                    case '/refresh':
                        await this.handleRefreshToken(req, res);
                        break;
                    
                    case '/providers':
                        await this.handleListProviders(req, res);
                        break;
                    
                    case '/login':
                        await this.handleLogin(req, res);
                        break;
                    
                    case '/health':
                        res.writeHead(200);
                        res.end(JSON.stringify({ status: 'healthy', pid: process.pid }));
                        break;
                    
                    default:
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: 'Not found' }));
                }
            } catch (error) {
                this.log(`API Error: ${error.message}`);
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        
        this.apiServer.listen(this.port);
    }
    
    async startSocketServer() {
        // Remove existing socket
        try {
            await fs.unlink(this.socketPath);
        } catch {}
        
        this.socketServer = net.createServer((client) => {
            client.on('data', async (data) => {
                try {
                    const request = JSON.parse(data.toString());
                    const response = await this.handleSocketRequest(request);
                    client.write(JSON.stringify(response));
                } catch (error) {
                    client.write(JSON.stringify({ error: error.message }));
                }
            });
        });
        
        this.socketServer.listen(this.socketPath);
        await fs.chmod(this.socketPath, 0o666); // Allow all users to connect
    }
    
    async handleSocketRequest(request) {
        switch (request.command) {
            case 'getToken':
                return this.getToken(request.provider, request.account);
            
            case 'listProviders':
                return this.listProviders();
            
            case 'checkStatus':
                return this.checkProviderStatus(request.provider);
            
            default:
                throw new Error(`Unknown command: ${request.command}`);
        }
    }
    
    async handleStatus(req, res) {
        const providers = await this.listProviders();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(providers));
    }
    
    async handleGetToken(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const provider = url.searchParams.get('provider');
        const account = url.searchParams.get('account');
        
        if (!provider) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Provider required' }));
            return;
        }
        
        const token = await this.getToken(provider, account);
        
        if (token.error) {
            res.writeHead(404);
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
        }
        
        res.end(JSON.stringify(token));
    }
    
    async handleRefreshToken(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const provider = url.searchParams.get('provider');
        
        if (!provider) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Provider required' }));
            return;
        }
        
        try {
            const result = await this.refreshToken(provider);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    async handleListProviders(req, res) {
        const providers = await this.listProviders();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(providers));
    }
    
    async handleLogin(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { provider, scopes } = JSON.parse(body);
                
                const config = await this.getProviderConfig(provider);
                if (!config) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Provider not configured' }));
                    return;
                }
                
                if (scopes) {
                    config.scopes = [...config.scopes, ...scopes];
                }
                
                const flow = await this.bridge.startOAuthFlow(provider, config);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(flow));
                
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async getToken(provider, account) {
        try {
            if (!account) {
                // Get account from stored data
                const status = await this.checkProviderStatus(provider);
                if (!status.authenticated) {
                    return { error: 'Not authenticated' };
                }
                account = status.account;
            }
            
            const token = await this.bridge.getKeychainItem(account, `${provider}-access`);
            if (!token) {
                return { error: 'Token not found' };
            }
            
            return {
                provider,
                account,
                token,
                type: 'Bearer'
            };
            
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async refreshToken(provider) {
        const status = await this.checkProviderStatus(provider);
        if (!status.authenticated) {
            throw new Error('Not authenticated');
        }
        
        const refreshToken = await this.bridge.getKeychainItem(
            status.account,
            `${provider}-refresh`
        );
        
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        // TODO: Implement actual token refresh logic for each provider
        throw new Error('Token refresh not yet implemented');
    }
    
    async listProviders() {
        const providers = ['github', 'google', 'microsoft'];
        const statuses = {};
        
        for (const provider of providers) {
            statuses[provider] = await this.checkProviderStatus(provider);
        }
        
        return statuses;
    }
    
    async checkProviderStatus(provider) {
        try {
            const accountData = await this.bridge.getKeychainItem('*', `${provider}-account`);
            if (!accountData) {
                return { authenticated: false, provider };
            }
            
            const account = JSON.parse(accountData);
            const hasAccessToken = await this.bridge.getKeychainItem(
                account.email || account.login || account.id,
                `${provider}-access`
            );
            
            return {
                provider,
                authenticated: !!hasAccessToken,
                account: account.email || account.login || account.id,
                accountInfo: account
            };
        } catch {
            return { provider, authenticated: false };
        }
    }
    
    async getProviderConfig(provider) {
        const clientId = await this.bridge.getKeychainItem('oauth-config', `${provider}-client-id`) ||
                        process.env[`${provider.toUpperCase()}_CLIENT_ID`];
        const clientSecret = await this.bridge.getKeychainItem('oauth-config', `${provider}-client-secret`) ||
                            process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
        
        if (!clientId || !clientSecret) {
            return null;
        }
        
        const configs = {
            github: {
                clientId,
                clientSecret,
                scopes: ['user:email', 'repo']
            },
            google: {
                clientId,
                clientSecret,
                scopes: ['profile', 'email']
            },
            microsoft: {
                clientId,
                clientSecret,
                scopes: ['User.Read', 'offline_access']
            }
        };
        
        return configs[provider];
    }
    
    async startPortMirror() {
        // Create port mirror for OAuth callbacks
        // This allows web services to use the same OAuth tokens
        
        this.portMirror = net.createServer((client) => {
            const service = net.createConnection(3340, 'localhost');
            
            client.pipe(service);
            service.pipe(client);
            
            client.on('error', () => service.end());
            service.on('error', () => client.end());
        });
        
        this.portMirror.listen(8464, () => {
            this.log('Port mirror listening on 8464 -> 3340');
        });
    }
    
    daemonize() {
        // Fork the process
        const child = spawn(process.argv[0], process.argv.slice(1), {
            detached: true,
            stdio: 'ignore',
            env: { ...process.env, SOULFRA_DAEMON_FOREGROUND: '1' }
        });
        
        child.unref();
        console.log(`✅ SoulFra Auth Daemon started (PID: ${child.pid})`);
        process.exit(0);
    }
    
    async isRunning() {
        try {
            const pid = await fs.readFile(this.pidFile, 'utf8');
            process.kill(parseInt(pid), 0); // Check if process exists
            return true;
        } catch {
            return false;
        }
    }
    
    async writePidFile() {
        await fs.mkdir(path.dirname(this.pidFile), { recursive: true });
        await fs.writeFile(this.pidFile, process.pid.toString());
    }
    
    async removePidFile() {
        try {
            await fs.unlink(this.pidFile);
        } catch {}
    }
    
    setupSignalHandlers() {
        process.on('SIGINT', this.shutdown.bind(this));
        process.on('SIGTERM', this.shutdown.bind(this));
        
        process.on('uncaughtException', (error) => {
            this.log(`Uncaught exception: ${error.message}`);
            this.shutdown();
        });
    }
    
    async shutdown() {
        console.log('\n🛑 Shutting down SoulFra Auth Daemon...');
        
        if (this.apiServer) {
            this.apiServer.close();
        }
        
        if (this.socketServer) {
            this.socketServer.close();
        }
        
        if (this.portMirror) {
            this.portMirror.close();
        }
        
        await this.bridge.cleanup();
        await this.removePidFile();
        
        console.log('✅ Daemon stopped');
        process.exit(0);
    }
    
    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${message}\n`;
        
        // Write to log file
        fs.appendFile(this.logFile, logMessage).catch(console.error);
        
        // Also log to console if in foreground
        if (process.env.SOULFRA_DAEMON_FOREGROUND) {
            console.log(message);
        }
    }
}

// CLI Commands
const args = process.argv.slice(2);
const daemon = new SoulFraAuthDaemon();

switch (args[0]) {
    case 'start':
        daemon.start();
        break;
    
    case 'stop':
        fs.readFile(daemon.pidFile, 'utf8')
            .then(pid => {
                process.kill(parseInt(pid), 'SIGTERM');
                console.log('✅ Daemon stop signal sent');
            })
            .catch(() => {
                console.log('❌ Daemon is not running');
            });
        break;
    
    case 'status':
        daemon.isRunning()
            .then(running => {
                if (running) {
                    console.log('✅ SoulFra Auth Daemon is running');
                    fs.readFile(daemon.pidFile, 'utf8')
                        .then(pid => console.log(`   PID: ${pid}`));
                } else {
                    console.log('❌ SoulFra Auth Daemon is not running');
                }
            });
        break;
    
    case 'foreground':
        process.env.SOULFRA_DAEMON_FOREGROUND = '1';
        daemon.start();
        break;
    
    default:
        console.log('Usage: soulfra-auth-daemon [start|stop|status|foreground]');
        process.exit(1);
}
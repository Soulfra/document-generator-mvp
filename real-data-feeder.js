#!/usr/bin/env node

/**
 * REAL DATA FEEDER - NO FAKE STUBS
 * Feeds actual system data to ticker tape logger
 */

// Use HTTP API instead of creating new logger instance
const fetch = require('node-fetch');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

class RealDataFeeder {
    constructor() {
        this.tickerUrl = 'http://localhost:8888/api/logs';
        this.startTime = Date.now();
        
        console.log('🔥 REAL DATA FEEDER ACTIVATED - NO FAKE SHIT');
        this.startFeeding();
    }
    
    async log(level, message, data = {}) {
        try {
            await fetch(this.tickerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level,
                    component: 'REAL_SYSTEM_DATA',
                    message,
                    ...data,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to log to ticker tape:', error.message);
        }
    }
    
    async startFeeding() {
        // Feed real system metrics every 10 seconds
        setInterval(() => {
            this.feedRealSystemData();
        }, 10000);
        
        // Feed real process data every 15 seconds  
        setInterval(() => {
            this.feedRealProcessData();
        }, 15000);
        
        // Feed real network data every 20 seconds
        setInterval(() => {
            this.feedRealNetworkData();
        }, 20000);
        
        // Initial data feed
        this.feedInitialRealData();
    }
    
    async feedInitialRealData() {
        await this.log('info', 'Real Data Feeder Started', {
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: os.platform(),
            arch: os.arch(),
            totalMemory: Math.round(os.totalmem() / 1024 / 1024),
            freeMemory: Math.round(os.freemem() / 1024 / 1024)
        });
    }
    
    async feedRealSystemData() {
        const memUsage = process.memoryUsage();
        const loadAvg = os.loadavg();
        
        await this.log('info', 'Real System Metrics', {
            memory: {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
            },
            cpu: {
                loadAverage1m: loadAvg[0].toFixed(2),
                loadAverage5m: loadAvg[1].toFixed(2),
                loadAverage15m: loadAvg[2].toFixed(2)
            },
            uptime: Math.round(process.uptime()),
            performance: {
                duration: Date.now() - this.startTime,
                memoryUsed: memUsage.heapUsed,
                cpuPercent: (process.cpuUsage().user / 1000000).toFixed(2)
            }
        });
    }
    
    feedRealProcessData() {
        // Check actual running processes
        exec('ps aux | grep node | grep -v grep | wc -l', (error, stdout) => {
            if (!error) {
                const nodeProcesses = parseInt(stdout.trim());
                this.log('info', 'Real Process Count', {
                    nodeProcesses,
                    totalProcesses: 'checking...'
                });
            }
        });
        
        // Check Docker containers
        exec('docker ps --format "table {{.Names}}\\t{{.Status}}" 2>/dev/null', (error, stdout) => {
            if (!error && stdout) {
                const containers = stdout.split('\n').filter(line => line.trim()).slice(1);
                this.log('info', 'Real Docker Status', {
                    containerCount: containers.length,
                    containers: containers.map(line => {
                        const parts = line.split('\t');
                        return {
                            name: parts[0],
                            status: parts[1]
                        };
                    })
                });
            }
        });
    }
    
    feedRealNetworkData() {
        // Check real port usage
        exec('lsof -i -P -n | grep LISTEN | head -10', (error, stdout) => {
            if (!error) {
                const ports = stdout.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        const parts = line.split(/\s+/);
                        const port = parts[8]?.split(':').pop();
                        return {
                            process: parts[0],
                            pid: parts[1],
                            port: port
                        };
                    });
                
                this.log('info', 'Real Network Ports', {
                    listeningPorts: ports.length,
                    ports: ports
                });
            }
        });
        
        // Check ticker tape itself
        exec('curl -s -I http://localhost:8888/', (error, stdout) => {
            if (!error && stdout.includes('200 OK')) {
                this.log('info', 'Ticker Tape Health Check', {
                    status: 'HEALTHY',
                    port: 8888,
                    response: 'OK'
                });
            } else {
                this.log('error', 'Ticker Tape Health Check', {
                    status: 'UNHEALTHY',
                    port: 8888,
                    error: error?.message || 'No response'
                });
            }
        });
    }
}

// Start feeding real data
const feeder = new RealDataFeeder();

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🔥 Real Data Feeder shutting down...');
    feeder.log('info', 'Real Data Feeder Shutdown', {
        uptime: process.uptime(),
        reason: 'SIGINT'
    });
    process.exit(0);
});
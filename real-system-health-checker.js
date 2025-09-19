#!/usr/bin/env node

/**
 * 🩺 REAL SYSTEM HEALTH CHECKER
 * 
 * Shows ACTUAL system status, not fake startup messages
 * Tests real database connections, API endpoints, and service health
 */

const { Client } = require('pg');
const Database = require('better-sqlite3');
const fs = require('fs');
const http = require('http');

class RealSystemHealthChecker {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            databases: {},
            services: {},
            processes: {},
            overall: 'UNKNOWN'
        };
        
        console.log('🩺 REAL SYSTEM HEALTH CHECKER');
        console.log('============================');
        console.log('🔍 Testing ACTUAL system health (no fake success messages)');
        console.log('');
    }
    
    async checkPostgreSQL() {
        console.log('🗄️  Testing PostgreSQL connection...');
        
        try {
            const pgClient = new Client({
                host: 'localhost',
                port: 5432,
                database: 'document_generator',
                user: process.env.POSTGRES_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || 'postgres'
            });
            
            await pgClient.connect();
            
            // Test actual query, not just connection
            const result = await pgClient.query('SELECT COUNT(*) FROM unified_users');
            const userCount = parseInt(result.rows[0].count);
            
            // Test another query to verify schema
            const agentResult = await pgClient.query('SELECT COUNT(*) FROM ai_agents');
            const agentCount = parseInt(agentResult.rows[0].count);
            
            await pgClient.end();
            
            this.results.databases.postgresql = {
                status: 'WORKING',
                connection: 'SUCCESS',
                queries: 'SUCCESS',
                userCount,
                agentCount,
                message: `Connected and queries working. ${userCount} users, ${agentCount} agents`
            };
            
            console.log(`   ✅ PostgreSQL: WORKING (${userCount} users, ${agentCount} agents)`);
            
        } catch (error) {
            this.results.databases.postgresql = {
                status: 'FAILED',
                connection: 'FAILED',
                queries: 'FAILED',
                error: error.message,
                message: `Connection or query failed: ${error.message}`
            };
            
            console.log(`   ❌ PostgreSQL: FAILED - ${error.message}`);
        }
    }
    
    async checkSQLiteDatabases() {
        console.log('🗃️  Testing SQLite databases...');
        
        const sqliteFiles = [
            'economic-engine.db',
            'ai-reasoning-game.db', 
            'trust-handshake.db',
            'gacha-tokens.db'
        ];
        
        for (const dbFile of sqliteFiles) {
            try {
                if (!fs.existsSync(dbFile)) {
                    this.results.databases[`sqlite_${dbFile}`] = {
                        status: 'MISSING',
                        message: `File does not exist: ${dbFile}`
                    };
                    console.log(`   ⚠️  SQLite ${dbFile}: MISSING`);
                    continue;
                }
                
                const db = new Database(dbFile);
                
                // Test actual query
                const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
                db.close();
                
                this.results.databases[`sqlite_${dbFile}`] = {
                    status: 'WORKING',
                    tableCount: tables.length,
                    tables: tables.map(t => t.name),
                    message: `Working with ${tables.length} tables`
                };
                
                console.log(`   ✅ SQLite ${dbFile}: WORKING (${tables.length} tables)`);
                
            } catch (error) {
                this.results.databases[`sqlite_${dbFile}`] = {
                    status: 'FAILED',
                    error: error.message,
                    message: `Failed to open or query: ${error.message}`
                };
                
                console.log(`   ❌ SQLite ${dbFile}: FAILED - ${error.message}`);
            }
        }
    }
    
    async checkRunningServices() {
        console.log('🔧 Testing running services...');
        
        const commonPorts = [
            { port: 3000, name: 'Main App' },
            { port: 8080, name: 'Platform Hub' },
            { port: 9800, name: 'Economy Hub' },
            { port: 5432, name: 'PostgreSQL' },
            { port: 6379, name: 'Redis' },
            { port: 9000, name: 'MinIO' },
            { port: 11434, name: 'Ollama' }
        ];
        
        for (const service of commonPorts) {
            try {
                const isListening = await this.testPort(service.port);
                
                if (isListening) {
                    // Test actual HTTP response if it's a web service
                    if (service.port !== 5432 && service.port !== 6379) {
                        const httpWorking = await this.testHttpEndpoint(`http://localhost:${service.port}`);
                        
                        this.results.services[service.name] = {
                            status: httpWorking ? 'WORKING' : 'LISTENING_NO_HTTP',
                            port: service.port,
                            listening: true,
                            httpResponse: httpWorking,
                            message: httpWorking ? 'Port listening and HTTP responding' : 'Port listening but no HTTP response'
                        };
                        
                        console.log(`   ${httpWorking ? '✅' : '⚠️'} ${service.name} (${service.port}): ${httpWorking ? 'WORKING' : 'LISTENING_NO_HTTP'}`);
                    } else {
                        this.results.services[service.name] = {
                            status: 'LISTENING',
                            port: service.port, 
                            listening: true,
                            message: 'Port listening (non-HTTP service)'
                        };
                        
                        console.log(`   ✅ ${service.name} (${service.port}): LISTENING`);
                    }
                } else {
                    this.results.services[service.name] = {
                        status: 'NOT_RUNNING',
                        port: service.port,
                        listening: false,
                        message: 'Port not listening'
                    };
                    
                    console.log(`   ❌ ${service.name} (${service.port}): NOT_RUNNING`);
                }
                
            } catch (error) {
                this.results.services[service.name] = {
                    status: 'ERROR',
                    port: service.port,
                    error: error.message,
                    message: `Error testing service: ${error.message}`
                };
                
                console.log(`   ❌ ${service.name} (${service.port}): ERROR - ${error.message}`);
            }
        }
    }
    
    async testPort(port) {
        return new Promise((resolve) => {
            const server = require('net').createServer();
            
            server.listen(port, () => {
                server.close();
                resolve(false); // Port is available, so nothing is listening
            });
            
            server.on('error', () => {
                resolve(true); // Port is in use, so something is listening
            });
        });
    }
    
    async testHttpEndpoint(url) {
        return new Promise((resolve) => {
            const request = http.get(url, (response) => {
                resolve(response.statusCode < 500);
            });
            
            request.on('error', () => {
                resolve(false);
            });
            
            request.setTimeout(2000, () => {
                request.destroy();
                resolve(false);
            });
        });
    }
    
    async checkNodeProcesses() {
        console.log('⚙️  Checking Node.js processes...');
        
        try {
            const { execSync } = require('child_process');
            const psOutput = execSync('ps aux | grep -E "node.*\\.js" | grep -v grep', { encoding: 'utf8' });
            
            const processes = psOutput.trim().split('\n').map(line => {
                const parts = line.trim().split(/\s+/);
                const pid = parts[1];
                const cpu = parts[2];
                const mem = parts[3];
                const command = parts.slice(10).join(' ');
                
                // Extract just the script name
                const scriptMatch = command.match(/node.*?([^/\s]+\.js)/);
                const scriptName = scriptMatch ? scriptMatch[1] : 'unknown';
                
                return { pid, cpu, mem, command, scriptName };
            });
            
            this.results.processes = {
                total: processes.length,
                list: processes,
                message: `${processes.length} Node.js processes running`
            };
            
            console.log(`   📊 Found ${processes.length} Node.js processes:`);
            processes.forEach(proc => {
                console.log(`      • ${proc.scriptName} (PID: ${proc.pid}, CPU: ${proc.cpu}%, MEM: ${proc.mem}%)`);
            });
            
        } catch (error) {
            this.results.processes = {
                total: 0,
                error: error.message,
                message: `Error checking processes: ${error.message}`
            };
            
            console.log(`   ❌ Error checking processes: ${error.message}`);
        }
    }
    
    calculateOverallHealth() {
        console.log('\n🎯 Overall System Health Assessment:');
        
        let workingCount = 0;
        let totalCount = 0;
        
        // Count database health
        Object.values(this.results.databases).forEach(db => {
            totalCount++;
            if (db.status === 'WORKING') workingCount++;
        });
        
        // Count service health
        Object.values(this.results.services).forEach(service => {
            totalCount++;
            if (service.status === 'WORKING' || service.status === 'LISTENING') workingCount++;
        });
        
        const healthPercentage = totalCount > 0 ? Math.round((workingCount / totalCount) * 100) : 0;
        
        if (healthPercentage >= 80) {
            this.results.overall = 'HEALTHY';
            console.log(`   🟢 HEALTHY (${healthPercentage}% - ${workingCount}/${totalCount} components working)`);
        } else if (healthPercentage >= 50) {
            this.results.overall = 'DEGRADED';
            console.log(`   🟡 DEGRADED (${healthPercentage}% - ${workingCount}/${totalCount} components working)`);
        } else {
            this.results.overall = 'UNHEALTHY';
            console.log(`   🔴 UNHEALTHY (${healthPercentage}% - ${workingCount}/${totalCount} components working)`);
        }
        
        this.results.healthPercentage = healthPercentage;
        this.results.workingComponents = workingCount;
        this.results.totalComponents = totalCount;
    }
    
    generateReport() {
        console.log('\n📋 SYSTEM HEALTH REPORT');
        console.log('=======================');
        
        // Save detailed report to file
        const reportFile = `system-health-report-${Date.now()}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
        
        console.log(`📁 Detailed report saved: ${reportFile}`);
        console.log(`🕐 Report timestamp: ${this.results.timestamp}`);
        console.log(`📊 Overall health: ${this.results.overall} (${this.results.healthPercentage}%)`);
        console.log(`⚙️  Node processes: ${this.results.processes.total || 0}`);
        
        return this.results;
    }
    
    async run() {
        try {
            await this.checkPostgreSQL();
            await this.checkSQLiteDatabases();
            await this.checkRunningServices();
            await this.checkNodeProcesses();
            
            this.calculateOverallHealth();
            return this.generateReport();
            
        } catch (error) {
            console.error('\n❌ Health check failed:', error.message);
            process.exit(1);
        }
    }
}

// Run health check if executed directly
if (require.main === module) {
    const checker = new RealSystemHealthChecker();
    checker.run().then(() => {
        console.log('\n✅ Health check complete');
        process.exit(0);
    });
}

module.exports = RealSystemHealthChecker;
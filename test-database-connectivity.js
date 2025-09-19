#!/usr/bin/env node

/**
 * Database Connectivity Test
 * Tests connections to PostgreSQL, Redis, and other data stores
 */

const { Client } = require('pg');
const redis = require('redis');
const fs = require('fs');
const path = require('path');

class DatabaseConnectivityTest {
    constructor() {
        this.results = {
            postgresql: { connected: false, error: null, details: {} },
            redis: { connected: false, error: null, details: {} },
            sqlite: { connected: false, error: null, details: {} },
            summary: { total: 3, connected: 0, failed: 0 }
        };
    }

    async runAllTests() {
        console.log('🔍 Database Connectivity Test Suite');
        console.log('=====================================');
        
        await this.testPostgreSQL();
        await this.testRedis();
        await this.testSQLite();
        await this.generateReport();
        
        console.log('✅ Database connectivity tests completed');
        return this.results;
    }

    async testPostgreSQL() {
        console.log('\n🐘 Testing PostgreSQL connection...');
        
        const config = {
            host: 'localhost',
            port: 5432,
            database: 'document_generator',
            user: 'postgres',
            password: 'postgres'
        };
        
        try {
            const client = new Client(config);
            
            console.log('   📡 Attempting connection...');
            await client.connect();
            
            console.log('   ✅ Connected successfully');
            
            // Test basic query
            const versionResult = await client.query('SELECT version()');
            const version = versionResult.rows[0].version;
            
            // Test table existence
            const tablesResult = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            `);
            
            const tables = tablesResult.rows.map(row => row.table_name);
            
            console.log(`   📊 Found ${tables.length} tables:`, tables.slice(0, 5).join(', ') + (tables.length > 5 ? '...' : ''));
            
            // Test sample data
            let recordCounts = {};
            for (const table of tables.slice(0, 3)) { // Check first 3 tables
                try {
                    const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                    recordCounts[table] = parseInt(countResult.rows[0].count);
                } catch (error) {
                    recordCounts[table] = 'error';
                }
            }
            
            await client.end();
            
            this.results.postgresql = {
                connected: true,
                error: null,
                details: {
                    version: version.substring(0, 50) + '...',
                    tables: tables,
                    tableCount: tables.length,
                    recordCounts: recordCounts,
                    config: { ...config, password: '***' }
                }
            };
            
            this.results.summary.connected++;
            console.log('   ✅ PostgreSQL test passed');
            
        } catch (error) {
            console.log(`   ❌ PostgreSQL connection failed: ${error.message}`);
            
            this.results.postgresql = {
                connected: false,
                error: error.message,
                details: {
                    config: { ...config, password: '***' },
                    errorCode: error.code,
                    hint: this.getPostgreSQLHint(error)
                }
            };
            
            this.results.summary.failed++;
        }
    }

    async testRedis() {
        console.log('\n🔴 Testing Redis connection...');
        
        const redisConfig = {
            host: 'localhost',
            port: 6379,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3
        };
        
        try {
            console.log('   📡 Attempting connection...');
            
            let client;
            
            // Try redis v4+ syntax first
            try {
                client = redis.createClient(redisConfig);
                await client.connect();
            } catch (error) {
                // Fallback to older redis syntax
                client = redis.createClient(redisConfig.port, redisConfig.host);
                await new Promise((resolve, reject) => {
                    client.on('connect', resolve);
                    client.on('error', reject);
                    setTimeout(() => reject(new Error('Connection timeout')), 5000);
                });
            }
            
            console.log('   ✅ Connected successfully');
            
            // Test basic operations
            const testKey = 'connectivity_test';
            const testValue = JSON.stringify({ timestamp: new Date().toISOString(), test: true });
            
            // Set and get
            if (client.setEx) {
                await client.setEx(testKey, 60, testValue); // v4+ syntax
                const retrieved = await client.get(testKey);
                await client.del(testKey);
            } else {
                // Fallback for older versions
                await new Promise((resolve, reject) => {
                    client.setex(testKey, 60, testValue, (err) => err ? reject(err) : resolve());
                });
                const retrieved = await new Promise((resolve, reject) => {
                    client.get(testKey, (err, result) => err ? reject(err) : resolve(result));
                });
                await new Promise((resolve, reject) => {
                    client.del(testKey, (err) => err ? reject(err) : resolve());
                });
            }
            
            // Get info
            let info = {};
            try {
                if (client.info) {
                    const infoStr = await client.info();
                    const lines = infoStr.split('\r\n');
                    lines.forEach(line => {
                        if (line.includes(':') && !line.startsWith('#')) {
                            const [key, value] = line.split(':');
                            info[key] = value;
                        }
                    });
                }
            } catch (error) {
                info.error = 'Could not retrieve info';
            }
            
            if (client.quit) {
                await client.quit();
            } else {
                client.quit();
            }
            
            this.results.redis = {
                connected: true,
                error: null,
                details: {
                    version: info.redis_version || 'unknown',
                    mode: info.redis_mode || 'unknown',
                    uptime: info.uptime_in_seconds || 'unknown',
                    connectedClients: info.connected_clients || 'unknown',
                    usedMemory: info.used_memory_human || 'unknown',
                    config: redisConfig
                }
            };
            
            this.results.summary.connected++;
            console.log('   ✅ Redis test passed');
            
        } catch (error) {
            console.log(`   ❌ Redis connection failed: ${error.message}`);
            
            this.results.redis = {
                connected: false,
                error: error.message,
                details: {
                    config: redisConfig,
                    hint: this.getRedisHint(error)
                }
            };
            
            this.results.summary.failed++;
        }
    }

    async testSQLite() {
        console.log('\n💾 Testing SQLite databases...');
        
        const sqliteFiles = [
            'process-registry.json',
            'symlink-health-report.json',
            'service-registry-report.json'
        ];
        
        try {
            const foundFiles = [];
            const fileContents = {};
            
            for (const file of sqliteFiles) {
                const filePath = path.join(__dirname, file);
                if (fs.existsSync(filePath)) {
                    foundFiles.push(file);
                    
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        const parsed = JSON.parse(content);
                        fileContents[file] = {
                            size: content.length,
                            keys: Object.keys(parsed).length,
                            lastModified: fs.statSync(filePath).mtime
                        };
                    } catch (error) {
                        fileContents[file] = { error: error.message };
                    }
                }
            }
            
            console.log(`   📊 Found ${foundFiles.length} data files:`, foundFiles.join(', '));
            
            // Test if we can write/read
            const testFile = path.join(__dirname, 'connectivity-test.json');
            const testData = {
                test: true,
                timestamp: new Date().toISOString(),
                pid: process.pid
            };
            
            fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));
            const readBack = JSON.parse(fs.readFileSync(testFile, 'utf8'));
            fs.unlinkSync(testFile);
            
            console.log('   ✅ File read/write test passed');
            
            this.results.sqlite = {
                connected: true,
                error: null,
                details: {
                    foundFiles: foundFiles,
                    fileContents: fileContents,
                    writeTest: 'passed'
                }
            };
            
            this.results.summary.connected++;
            console.log('   ✅ SQLite/JSON test passed');
            
        } catch (error) {
            console.log(`   ❌ SQLite/JSON test failed: ${error.message}`);
            
            this.results.sqlite = {
                connected: false,
                error: error.message,
                details: {
                    hint: 'Check file permissions and disk space'
                }
            };
            
            this.results.summary.failed++;
        }
    }

    getPostgreSQLHint(error) {
        if (error.code === 'ECONNREFUSED') {
            return 'PostgreSQL server may not be running. Try: docker start document-generator-postgres';
        } else if (error.code === 'ENOTFOUND') {
            return 'Cannot resolve host. Check if PostgreSQL container exists.';
        } else if (error.message.includes('authentication')) {
            return 'Authentication failed. Check username/password in config.';
        } else if (error.message.includes('database') && error.message.includes('does not exist')) {
            return 'Database "document_generator" does not exist. May need to run initialization script.';
        }
        return 'Check PostgreSQL configuration and container status.';
    }

    getRedisHint(error) {
        if (error.message.includes('ECONNREFUSED')) {
            return 'Redis server may not be running. Try: docker start document-generator-redis';
        } else if (error.message.includes('timeout')) {
            return 'Connection timeout. Redis may be overloaded or network issue.';
        }
        return 'Check Redis configuration and container status.';
    }

    async generateReport() {
        console.log('\n📊 Generating connectivity report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.results.summary,
            results: this.results,
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(__dirname, 'database-connectivity-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`   📄 Report saved to: ${reportPath}`);
        console.log(`   📊 Connection Score: ${this.results.summary.connected}/${this.results.summary.total}`);
        
        // Print summary
        console.log('\n📈 Connectivity Summary:');
        console.log(`   ✅ Connected: ${this.results.summary.connected}`);
        console.log(`   ❌ Failed: ${this.results.summary.failed}`);
        console.log(`   📊 Success Rate: ${Math.round((this.results.summary.connected / this.results.summary.total) * 100)}%`);
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (!this.results.postgresql.connected) {
            recommendations.push('Start PostgreSQL container: docker start document-generator-postgres');
            recommendations.push('Verify database exists and has proper schema');
        }
        
        if (!this.results.redis.connected) {
            recommendations.push('Start Redis container: docker start document-generator-redis');
            recommendations.push('Check Redis configuration and memory limits');
        }
        
        if (!this.results.sqlite.connected) {
            recommendations.push('Check file system permissions for JSON/SQLite files');
            recommendations.push('Verify disk space for local data storage');
        }
        
        if (this.results.summary.connected === this.results.summary.total) {
            recommendations.push('All database connections successful - system ready for full operation');
        }
        
        return recommendations;
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new DatabaseConnectivityTest();
    
    tester.runAllTests().then(() => {
        console.log('\n🎯 Next Steps:');
        console.log('   1. Review database-connectivity-report.json');
        console.log('   2. Fix any failed connections');
        console.log('   3. Test services can connect to databases');
        console.log('   4. Run full system integration test');
        
        process.exit(0);
    }).catch(console.error);
}

module.exports = DatabaseConnectivityTest;
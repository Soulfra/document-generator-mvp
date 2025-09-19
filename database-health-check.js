#!/usr/bin/env node

/**
 * DATABASE HEALTH CHECK
 * Verifies all databases are ready before starting services
 */

require('dotenv').config();
const { Client } = require('pg');
const redis = require('redis');
const fs = require('fs');

class DatabaseHealthChecker {
    constructor() {
        this.results = {
            postgresql: false,
            redis: false,
            sqlite_files: [],
            ready: false
        };
    }
    
    async checkAll() {
        console.log('🏥 Checking database health...');
        
        await this.checkPostgreSQL();
        await this.checkRedis();
        await this.checkSQLiteFiles();
        
        this.results.ready = this.results.postgresql && this.results.redis;
        
        if (this.results.ready) {
            console.log('✅ All databases are healthy');
            process.exit(0);
        } else {
            console.log('❌ Some databases are not ready');
            process.exit(1);
        }
    }
    
    async checkPostgreSQL() {
        try {
            const client = new Client({
                connectionString: process.env.DATABASE_URL
            });
            
            await client.connect();
            await client.query('SELECT 1');
            await client.end();
            
            this.results.postgresql = true;
            console.log('   ✅ PostgreSQL ready');
        } catch (error) {
            console.log('   ❌ PostgreSQL not ready:', error.message);
        }
    }
    
    async checkRedis() {
        try {
            const client = redis.createClient({
                url: process.env.REDIS_URL
            });
            
            await client.connect();
            await client.ping();
            await client.disconnect();
            
            this.results.redis = true;
            console.log('   ✅ Redis ready');
        } catch (error) {
            console.log('   ❌ Redis not ready:', error.message);
        }
    }
    
    async checkSQLiteFiles() {
        const sqliteFiles = [
            process.env.GAMING_DB_PATH,
            process.env.AI_REASONING_DB_PATH,
            process.env.TRUST_HANDSHAKE_DB_PATH,
            process.env.BUSINESS_ACCOUNTING_DB_PATH
        ].filter(Boolean);
        
        for (const file of sqliteFiles) {
            if (fs.existsSync(file)) {
                this.results.sqlite_files.push(file);
                console.log(`   ✅ SQLite file exists: ${file}`);
            } else {
                console.log(`   ⚠️  SQLite file missing: ${file}`);
            }
        }
    }
}

if (require.main === module) {
    const checker = new DatabaseHealthChecker();
    checker.checkAll().catch(console.error);
}

module.exports = DatabaseHealthChecker;

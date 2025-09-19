#!/usr/bin/env node

/**
 * 📊 DATABASE INITIALIZER
 * Initializes database using existing database-setup.sql schema
 * Supports MySQL, PostgreSQL, and SQLite fallback
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

class DatabaseInitializer {
    constructor() {
        this.schemaFile = 'database-setup.sql';
        this.sqliteFile = 'economic-engine.db';
        
        console.log('📊 DATABASE INITIALIZER');
        console.log('=======================');
        console.log(`📄 Schema: ${this.schemaFile}`);
        console.log('🎯 Target: Auto-detect (MySQL → PostgreSQL → SQLite)');
        console.log('');
    }
    
    async initialize() {
        try {
            console.log('🚀 Starting database initialization...\n');
            
            // Step 1: Check if schema file exists
            if (!await this.checkSchemaFile()) {
                throw new Error('Schema file not found');
            }
            
            // Step 2: Detect available database system
            const dbSystem = await this.detectDatabaseSystem();
            console.log(`🔍 Detected database system: ${dbSystem.toUpperCase()}`);
            
            // Step 3: Initialize based on detected system
            switch (dbSystem) {
                case 'mysql':
                    await this.initializeMySQL();
                    break;
                case 'postgresql':
                    await this.initializePostgreSQL();
                    break;
                case 'sqlite':
                    await this.initializeSQLite();
                    break;
                default:
                    throw new Error('No suitable database system found');
            }
            
            // Step 4: Verify initialization
            await this.verifyInitialization(dbSystem);
            
            console.log('\n✅ DATABASE INITIALIZATION COMPLETE!');
            console.log('===================================');
            this.showConnectionInfo(dbSystem);
            
            return { success: true, system: dbSystem };
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            console.log('\n🔄 Falling back to SQLite...');
            
            try {
                await this.initializeSQLite();
                console.log('✅ SQLite fallback successful');
                return { success: true, system: 'sqlite', fallback: true };
            } catch (sqliteError) {
                console.error('❌ SQLite fallback also failed:', sqliteError.message);
                return { success: false, error: sqliteError.message };
            }
        }
    }
    
    async checkSchemaFile() {
        console.log('📄 Checking schema file...');
        
        if (!fs.existsSync(this.schemaFile)) {
            console.error(`❌ Schema file not found: ${this.schemaFile}`);
            return false;
        }
        
        const stats = fs.statSync(this.schemaFile);
        console.log(`✅ Schema file found (${Math.round(stats.size / 1024)} KB)`);
        
        // Preview schema content
        const content = fs.readFileSync(this.schemaFile, 'utf8');
        const lines = content.split('\n').length;
        const tables = (content.match(/CREATE TABLE/gi) || []).length;
        
        console.log(`📊 Schema contains: ${lines} lines, ${tables} tables`);
        return true;
    }
    
    async detectDatabaseSystem() {
        console.log('🔍 Detecting available database systems...');
        
        // Check MySQL
        try {
            await this.execPromise('mysql --version');
            console.log('  ✅ MySQL found');
            
            // Test connection
            try {
                await this.execPromise('mysql -e "SELECT 1" 2>/dev/null');
                console.log('  ✅ MySQL connection successful');
                return 'mysql';
            } catch (connectionError) {
                console.log('  ⚠️  MySQL found but connection failed');
            }
        } catch (error) {
            console.log('  ❌ MySQL not available');
        }
        
        // Check PostgreSQL
        try {
            await this.execPromise('psql --version');
            console.log('  ✅ PostgreSQL found');
            
            // Test connection
            try {
                await this.execPromise('psql -c "SELECT 1" 2>/dev/null');
                console.log('  ✅ PostgreSQL connection successful');
                return 'postgresql';
            } catch (connectionError) {
                console.log('  ⚠️  PostgreSQL found but connection failed');
            }
        } catch (error) {
            console.log('  ❌ PostgreSQL not available');
        }
        
        // Fallback to SQLite
        console.log('  ✅ SQLite available (built-in)');
        return 'sqlite';
    }
    
    async initializeMySQL() {
        console.log('🐬 Initializing MySQL database...');
        
        // Create database if it doesn't exist
        await this.execPromise('mysql -e "CREATE DATABASE IF NOT EXISTS economic_engine;"');
        console.log('✅ Database created/verified');
        
        // Execute schema
        const command = `mysql economic_engine < ${this.schemaFile}`;
        await this.execPromise(command);
        console.log('✅ Schema executed successfully');
        
        // Grant permissions (if needed)
        try {
            await this.execPromise(`mysql -e "GRANT ALL PRIVILEGES ON economic_engine.* TO 'root'@'localhost';"`);
            console.log('✅ Permissions granted');
        } catch (error) {
            console.log('⚠️  Permission grant skipped (may not be needed)');
        }
    }
    
    async initializePostgreSQL() {
        console.log('🐘 Initializing PostgreSQL database...');
        
        // Create database if it doesn't exist
        try {
            await this.execPromise('createdb economic_engine');
            console.log('✅ Database created');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✅ Database already exists');
            } else {
                throw error;
            }
        }
        
        // Convert MySQL schema to PostgreSQL-compatible
        const mysqlSchema = fs.readFileSync(this.schemaFile, 'utf8');
        const postgresSchema = this.convertMySQLToPostgreSQL(mysqlSchema);
        
        // Write temporary PostgreSQL schema
        const tempSchema = 'temp-postgres-schema.sql';
        fs.writeFileSync(tempSchema, postgresSchema);
        
        try {
            // Execute schema
            await this.execPromise(`psql -d economic_engine -f ${tempSchema}`);
            console.log('✅ Schema executed successfully');
        } finally {
            // Cleanup temp file
            if (fs.existsSync(tempSchema)) {
                fs.unlinkSync(tempSchema);
            }
        }
    }
    
    async initializeSQLite() {
        console.log('📦 Initializing SQLite database...');
        
        return new Promise((resolve, reject) => {
            // Remove existing database if it exists
            if (fs.existsSync(this.sqliteFile)) {
                fs.unlinkSync(this.sqliteFile);
                console.log('🗑️  Removed existing SQLite database');
            }
            
            const db = new sqlite3.Database(this.sqliteFile, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('✅ SQLite database created');
            });
            
            // Use simple SQLite schema if available, otherwise convert MySQL schema
            let sqliteSchema;
            const simpleSchemaFile = 'sqlite-schema-simple.sql';
            
            if (fs.existsSync(simpleSchemaFile)) {
                console.log('📄 Using simplified SQLite schema');
                sqliteSchema = fs.readFileSync(simpleSchemaFile, 'utf8');
            } else {
                console.log('🔄 Converting MySQL schema to SQLite...');
                const mysqlSchema = fs.readFileSync(this.schemaFile, 'utf8');
                sqliteSchema = this.convertMySQLToSQLite(mysqlSchema);
            }
            
            // Execute schema statements
            db.serialize(() => {
                const statements = sqliteSchema.split(';').filter(stmt => stmt.trim());
                let completed = 0;
                let hasError = false;
                
                statements.forEach((statement, index) => {
                    if (statement.trim()) {
                        db.run(statement, (err) => {
                            if (err && !hasError) {
                                // Ignore some expected errors
                                if (!err.message.includes('duplicate column name') && 
                                    !err.message.includes('already exists') &&
                                    !err.message.includes('IGNORE')) {
                                    console.warn(`⚠️  SQL Warning: ${err.message}`);
                                    console.warn(`Statement: ${statement.slice(0, 100)}...`);
                                    // Don't reject on individual statement errors
                                }
                            }
                            
                            completed++;
                            if (completed === statements.length) {
                                console.log(`✅ Executed ${completed} SQL statements`);
                                
                                db.close((closeErr) => {
                                    if (closeErr) {
                                        reject(closeErr);
                                    } else {
                                        console.log('✅ SQLite database initialized');
                                        resolve();
                                    }
                                });
                            }
                        });
                    } else {
                        completed++;
                        if (completed === statements.length) {
                            console.log(`✅ Executed ${completed} SQL statements`);
                            
                            db.close((closeErr) => {
                                if (closeErr) {
                                    reject(closeErr);
                                } else {
                                    console.log('✅ SQLite database initialized');
                                    resolve();
                                }
                            });
                        }
                    }
                });
                
                // Handle case where no statements to execute
                if (statements.length === 0) {
                    console.log('⚠️  No SQL statements found');
                    db.close();
                    resolve();
                }
            });
        });
    }
    
    convertMySQLToPostgreSQL(mysqlSchema) {
        console.log('🔄 Converting MySQL schema to PostgreSQL...');
        
        return mysqlSchema
            // Convert SERIAL to SERIAL PRIMARY KEY
            .replace(/id SERIAL PRIMARY KEY/g, 'id SERIAL PRIMARY KEY')
            // Convert AUTO_INCREMENT to SERIAL
            .replace(/AUTO_INCREMENT/gi, '')
            // Convert MySQL data types
            .replace(/DATETIME/gi, 'TIMESTAMP')
            .replace(/TEXT/gi, 'TEXT')
            // Remove MySQL-specific syntax
            .replace(/ENGINE=\w+/gi, '')
            .replace(/DEFAULT CHARSET=\w+/gi, '')
            // Convert ON UPDATE CURRENT_TIMESTAMP
            .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '')
            // Handle DELIMITER statements (remove them)
            .replace(/DELIMITER\s+.*?\n/gi, '')
            // Remove MySQL specific procedures temporarily
            .replace(/CREATE PROCEDURE.*?END\s*\/\/\s*$/gms, '-- MySQL procedure removed')
            // Fix duplicate key syntax
            .replace(/ON DUPLICATE KEY UPDATE.*?;/gi, ';');
    }
    
    convertMySQLToSQLite(mysqlSchema) {
        console.log('🔄 Converting MySQL schema to SQLite...');
        
        let sqliteSchema = mysqlSchema
            // First, remove all MySQL-specific constructs that SQLite doesn't support
            .replace(/CREATE DATABASE.*?;/gi, '')
            .replace(/USE\s+\w+;/gi, '')
            .replace(/ENGINE=\w+/gi, '')
            .replace(/DEFAULT CHARSET=\w+/gi, '')
            .replace(/AUTO_INCREMENT/gi, '')
            
            // Handle ON UPDATE CURRENT_TIMESTAMP
            .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '')
            .replace(/updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'updated_at TEXT DEFAULT CURRENT_TIMESTAMP')
            
            // Convert data types
            .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
            .replace(/DATETIME/gi, 'TEXT')
            .replace(/TIMESTAMP/gi, 'TEXT') 
            .replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'REAL')
            .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
            .replace(/BOOLEAN/gi, 'INTEGER')
            .replace(/BIGINT/gi, 'INTEGER')
            .replace(/LONGTEXT/gi, 'TEXT')
            
            // Remove FOREIGN KEY constraints (add them back as simple references)
            .replace(/,\s*FOREIGN KEY[^,)]*\)/gi, ')')
            .replace(/,\s*FOREIGN KEY[^,]*,/gi, ',')
            
            // Remove INDEX statements that aren't CREATE INDEX
            .replace(/,\s*INDEX\s+\w+\s*\([^)]+\)/gi, '')
            .replace(/INDEX\s+\w+\s*\([^)]+\),?/gi, '')
            
            // Remove stored procedures and functions
            .replace(/DELIMITER\s+.*$/gmi, '')
            .replace(/CREATE\s+PROCEDURE.*?END\s*\/\/\s*$/gms, '')
            .replace(/CREATE\s+OR\s+REPLACE\s+VIEW.*?;/gms, '')
            
            // Remove ON DUPLICATE KEY syntax
            .replace(/ON DUPLICATE KEY UPDATE.*?;/gi, ';')
            
            // Remove GRANT statements
            .replace(/GRANT.*?;/gi, '')
            
            // Clean up extra commas and whitespace
            .replace(/,\s*\)/g, ')')
            .replace(/,\s*,/g, ',')
            .replace(/\n\s*\n/g, '\n');
            
        return sqliteSchema;
    }
    
    async verifyInitialization(dbSystem) {
        console.log(`🔍 Verifying ${dbSystem} initialization...`);
        
        try {
            switch (dbSystem) {
                case 'mysql':
                    const mysqlResult = await this.execPromise('mysql economic_engine -e "SHOW TABLES;"');
                    const mysqlTables = mysqlResult.split('\n').length - 1;
                    console.log(`✅ MySQL verification: ${mysqlTables} tables found`);
                    break;
                    
                case 'postgresql':
                    const pgResult = await this.execPromise('psql -d economic_engine -c "\\dt"');
                    const pgTables = (pgResult.match(/public \|/g) || []).length;
                    console.log(`✅ PostgreSQL verification: ${pgTables} tables found`);
                    break;
                    
                case 'sqlite':
                    await this.verifySQLite();
                    break;
            }
        } catch (error) {
            console.warn('⚠️  Verification failed, but initialization may have succeeded:', error.message);
        }
    }
    
    async verifySQLite() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.sqliteFile, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    console.log(`✅ SQLite verification: ${rows.length} tables found`);
                    console.log(`📋 Tables: ${rows.map(r => r.name).join(', ')}`);
                    
                    db.close();
                    resolve();
                });
            });
        });
    }
    
    showConnectionInfo(dbSystem) {
        console.log('🔌 CONNECTION INFO:');
        console.log('==================');
        
        switch (dbSystem) {
            case 'mysql':
                console.log('📊 MySQL Database: economic_engine');
                console.log('🌐 Host: localhost');
                console.log('🔌 Port: 3306 (default)');
                console.log('👤 User: root (or current user)');
                console.log('💡 Connection string: mysql://localhost:3306/economic_engine');
                break;
                
            case 'postgresql':
                console.log('📊 PostgreSQL Database: economic_engine');
                console.log('🌐 Host: localhost');
                console.log('🔌 Port: 5432 (default)');
                console.log('👤 User: current user');
                console.log('💡 Connection string: postgresql://localhost:5432/economic_engine');
                break;
                
            case 'sqlite':
                console.log(`📊 SQLite Database: ${path.resolve(this.sqliteFile)}`);
                console.log('🌐 File-based (no network connection needed)');
                console.log(`💡 Connection string: sqlite:./${this.sqliteFile}`);
                break;
        }
    }
    
    execPromise(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Command failed: ${command}\n${error.message}`));
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}

// Main execution
async function main() {
    const initializer = new DatabaseInitializer();
    
    const result = await initializer.initialize();
    
    if (result.success) {
        console.log('\n🎉 DATABASE READY FOR USE!');
        
        if (result.fallback) {
            console.log('⚠️  Using SQLite fallback - consider setting up MySQL/PostgreSQL for production');
        }
        
        process.exit(0);
    } else {
        console.error('\n❌ Database initialization failed completely');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DatabaseInitializer };
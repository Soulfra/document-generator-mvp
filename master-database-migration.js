#!/usr/bin/env node

/**
 * 🗃️ MASTER DATABASE MIGRATION SYSTEM
 * 
 * Fixes the schema conflicts by migrating all shared tables to PostgreSQL
 * and connecting all existing systems to unified database layer
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const Database = require('better-sqlite3');

class MasterDatabaseMigration {
    constructor() {
        this.pgClient = null;
        this.sqliteDbs = new Map();
        
        // Load database connection info from the mapping report
        this.connectionMapping = this.loadConnectionMapping();
        
        console.log('🗃️ MASTER DATABASE MIGRATION SYSTEM');
        console.log('==================================');
        console.log('🎯 Fixing schema conflicts and unifying all systems');
        console.log('');
    }
    
    loadConnectionMapping() {
        try {
            const mapping = JSON.parse(fs.readFileSync('database-connection-mapping-report.json', 'utf8'));
            console.log(`📊 Loaded database mapping with ${mapping.conflicts.length} conflicts to resolve`);
            return mapping;
        } catch (error) {
            console.error('❌ Could not load database connection mapping:', error.message);
            process.exit(1);
        }
    }
    
    async initialize() {
        console.log('🔌 Connecting to databases...');
        
        // Connect to PostgreSQL
        try {
            this.pgClient = new Client({
                host: 'localhost',
                port: 5432,
                database: 'document_generator',
                user: process.env.POSTGRES_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || 'password'
            });
            await this.pgClient.connect();
            console.log('✅ PostgreSQL connected');
        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error.message);
            console.log('💡 Make sure PostgreSQL is running: docker-compose up -d postgres');
            process.exit(1);
        }
        
        // Connect to SQLite databases with conflicts
        const conflictDbs = ['economic-engine.db', 'ai-reasoning-game.db', 'trust-handshake.db', 'gacha-tokens.db'];
        
        for (const dbFile of conflictDbs) {
            if (fs.existsSync(dbFile)) {
                try {
                    const db = new Database(dbFile);
                    this.sqliteDbs.set(dbFile, db);
                    console.log(`✅ SQLite connected: ${dbFile}`);
                } catch (error) {
                    console.warn(`⚠️  Could not connect to ${dbFile}: ${error.message}`);
                }
            } else {
                console.log(`📂 SQLite database not found: ${dbFile} (will skip)`);
            }
        }
    }
    
    async createUnifiedSchema() {
        console.log('\n🏗️  Creating unified PostgreSQL schema...');
        
        const unifiedSchema = `
        -- ================================================
        -- UNIFIED SCHEMA FOR ALL SYSTEMS
        -- ================================================
        
        -- Drop existing tables if they exist
        DROP TABLE IF EXISTS user_sessions CASCADE;
        DROP TABLE IF EXISTS ai_agent_trades CASCADE;
        DROP TABLE IF EXISTS ai_agents CASCADE;
        DROP TABLE IF EXISTS unified_users CASCADE;
        DROP TABLE IF EXISTS unified_documents CASCADE;
        
        -- Unified Users table (consolidates all user tables)
        CREATE TABLE unified_users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255),
            role VARCHAR(50) DEFAULT 'player',
            tier VARCHAR(50) DEFAULT 'free',
            trust_score DECIMAL(3,2) DEFAULT 0.5,
            reputation INTEGER DEFAULT 100,
            wallet_balance DECIMAL(10,2) DEFAULT 1000.00,
            api_credits INTEGER DEFAULT 0,
            device_id VARCHAR(255),
            biometric_hash VARCHAR(255),
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Gaming-specific fields
            level INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            games_played INTEGER DEFAULT 0,
            total_play_time INTEGER DEFAULT 0,
            achievements JSONB DEFAULT '[]',
            
            -- Forum fields
            posts INTEGER DEFAULT 0,
            forum_reputation INTEGER DEFAULT 100,
            join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Unified AI Agents table (consolidates all agent tables)
        CREATE TABLE ai_agents (
            id SERIAL PRIMARY KEY,
            agent_id VARCHAR(100) UNIQUE NOT NULL,
            owner_user_id INTEGER REFERENCES unified_users(id),
            name VARCHAR(255) NOT NULL,
            agent_type VARCHAR(100) DEFAULT 'general',
            specialty VARCHAR(255),
            level INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            wallet_balance DECIMAL(10,2) DEFAULT 1000.00,
            credit_balance INTEGER DEFAULT 1000,
            reputation INTEGER DEFAULT 100,
            
            -- AI-specific fields
            model_type VARCHAR(100),
            personality_traits JSONB,
            skills JSONB DEFAULT '[]',
            achievements JSONB DEFAULT '[]',
            learning_rate DECIMAL(5,4) DEFAULT 0.1,
            
            -- Activity tracking
            last_active TIMESTAMP,
            total_work_time INTEGER DEFAULT 0,
            tasks_completed INTEGER DEFAULT 0,
            productivity_score DECIMAL(5,2) DEFAULT 1.0,
            
            -- Status
            status VARCHAR(50) DEFAULT 'idle',
            current_task TEXT,
            is_online BOOLEAN DEFAULT false,
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Unified Documents table
        CREATE TABLE unified_documents (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES unified_users(id),
            filename VARCHAR(255) NOT NULL,
            content_type VARCHAR(100),
            file_size INTEGER,
            content_hash VARCHAR(64),
            processing_status VARCHAR(50) DEFAULT 'pending',
            ai_analysis JSONB,
            template_match VARCHAR(255),
            mvp_output JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP
        );
        
        -- User Sessions (for auth)
        CREATE TABLE user_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES unified_users(id),
            session_token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            device_info JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- AI Agent Trades (for agent economy)
        CREATE TABLE ai_agent_trades (
            id SERIAL PRIMARY KEY,
            from_agent_id INTEGER REFERENCES ai_agents(id),
            to_agent_id INTEGER REFERENCES ai_agents(id),
            trade_type VARCHAR(50) NOT NULL,
            amount DECIMAL(10,2),
            item_data JSONB,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        );
        
        -- Agent Work Log (for productivity tracking)
        CREATE TABLE agent_work_log (
            id SERIAL PRIMARY KEY,
            agent_id INTEGER REFERENCES ai_agents(id),
            task_type VARCHAR(100) NOT NULL,
            task_description TEXT,
            work_output JSONB,
            time_spent INTEGER, -- seconds
            productivity_rating DECIMAL(3,2),
            credits_earned DECIMAL(10,2) DEFAULT 0,
            credits_spent DECIMAL(10,2) DEFAULT 0,
            verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Forum Posts (for agent communication)
        CREATE TABLE forum_posts (
            id SERIAL PRIMARY KEY,
            board VARCHAR(100) NOT NULL,
            author_type VARCHAR(20) DEFAULT 'user', -- 'user' or 'agent'
            author_id INTEGER, -- references either unified_users or ai_agents
            title VARCHAR(255),
            content TEXT NOT NULL,
            post_type VARCHAR(50) DEFAULT 'discussion',
            reply_to_id INTEGER REFERENCES forum_posts(id),
            upvotes INTEGER DEFAULT 0,
            downvotes INTEGER DEFAULT 0,
            is_pinned BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Indexes for performance
        CREATE INDEX idx_users_username ON unified_users(username);
        CREATE INDEX idx_users_email ON unified_users(email);
        CREATE INDEX idx_agents_agent_id ON ai_agents(agent_id);
        CREATE INDEX idx_agents_owner ON ai_agents(owner_user_id);
        CREATE INDEX idx_sessions_token ON user_sessions(session_token);
        CREATE INDEX idx_posts_board ON forum_posts(board);
        CREATE INDEX idx_work_log_agent ON agent_work_log(agent_id);
        CREATE INDEX idx_trades_agents ON ai_agent_trades(from_agent_id, to_agent_id);
        
        -- Create views for backward compatibility
        CREATE VIEW users AS SELECT * FROM unified_users;
        CREATE VIEW documents AS SELECT * FROM unified_documents;
        `;
        
        try {
            await this.pgClient.query(unifiedSchema);
            console.log('✅ Unified schema created successfully');
        } catch (error) {
            console.error('❌ Schema creation failed:', error.message);
            throw error;
        }
    }
    
    async migrateDataFromSQLite() {
        console.log('\n📦 Migrating data from SQLite databases...');
        
        // Migrate users from economic-engine.db
        if (this.sqliteDbs.has('economic-engine.db')) {
            console.log('📤 Migrating users from economic-engine.db...');
            await this.migrateUsers('economic-engine.db');
        }
        
        // Migrate AI agents from multiple databases
        for (const [dbFile, db] of this.sqliteDbs) {
            if (this.hasTable(db, 'ai_agents')) {
                console.log(`📤 Migrating AI agents from ${dbFile}...`);
                await this.migrateAIAgents(dbFile);
            }
        }
        
        // Migrate documents
        if (this.sqliteDbs.has('economic-engine.db')) {
            console.log('📤 Migrating documents from economic-engine.db...');
            await this.migrateDocuments('economic-engine.db');
        }
    }
    
    async migrateUsers(dbFile) {
        const db = this.sqliteDbs.get(dbFile);
        
        try {
            const users = db.prepare('SELECT * FROM users').all();
            console.log(`   📊 Found ${users.length} users to migrate`);
            
            for (const user of users) {
                const insertQuery = `
                    INSERT INTO unified_users (
                        username, email, password_hash, role, tier, trust_score, 
                        reputation, wallet_balance, level, experience, games_played,
                        total_play_time, achievements, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (username) DO UPDATE SET
                        email = EXCLUDED.email,
                        updated_at = CURRENT_TIMESTAMP
                `;
                
                await this.pgClient.query(insertQuery, [
                    user.username || user.name,
                    user.email,
                    user.password_hash || user.password,
                    user.role || 'player',
                    user.tier || 'free',
                    user.trust_score || 0.5,
                    user.reputation || 100,
                    user.wallet_balance || user.balance || 1000,
                    user.level || 1,
                    user.experience || 0,
                    user.games_played || 0,
                    user.total_play_time || 0,
                    JSON.stringify(user.achievements || []),
                    user.created_at || new Date().toISOString()
                ]);
            }
            
            console.log(`   ✅ Migrated ${users.length} users`);
        } catch (error) {
            console.error(`   ❌ User migration failed: ${error.message}`);
        }
    }
    
    async migrateAIAgents(dbFile) {
        const db = this.sqliteDbs.get(dbFile);
        
        try {
            const agents = db.prepare('SELECT * FROM ai_agents').all();
            console.log(`   📊 Found ${agents.length} AI agents to migrate`);
            
            for (const agent of agents) {
                const insertQuery = `
                    INSERT INTO ai_agents (
                        agent_id, name, agent_type, specialty, level, experience,
                        wallet_balance, reputation, model_type, personality_traits,
                        last_active, status, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (agent_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        updated_at = CURRENT_TIMESTAMP
                `;
                
                await this.pgClient.query(insertQuery, [
                    agent.agent_id || agent.id,
                    agent.name,
                    agent.agent_type || agent.type || 'general',
                    agent.specialty,
                    agent.level || 1,
                    agent.experience || 0,
                    agent.wallet_balance || agent.balance || 1000,
                    agent.reputation || 100,
                    agent.model_type,
                    JSON.stringify(agent.personality_traits || {}),
                    agent.last_active,
                    agent.status || 'idle',
                    agent.created_at || new Date().toISOString()
                ]);
            }
            
            console.log(`   ✅ Migrated ${agents.length} AI agents`);
        } catch (error) {
            console.error(`   ❌ AI agent migration failed: ${error.message}`);
        }
    }
    
    async migrateDocuments(dbFile) {
        const db = this.sqliteDbs.get(dbFile);
        
        try {
            const documents = db.prepare('SELECT * FROM documents').all();
            console.log(`   📊 Found ${documents.length} documents to migrate`);
            
            for (const doc of documents) {
                const insertQuery = `
                    INSERT INTO unified_documents (
                        filename, content_type, file_size, content_hash,
                        processing_status, ai_analysis, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;
                
                await this.pgClient.query(insertQuery, [
                    doc.filename,
                    doc.content_type,
                    doc.file_size,
                    doc.content_hash,
                    doc.processing_status || 'pending',
                    JSON.stringify(doc.ai_analysis || {}),
                    doc.created_at || new Date().toISOString()
                ]);
            }
            
            console.log(`   ✅ Migrated ${documents.length} documents`);
        } catch (error) {
            console.error(`   ❌ Document migration failed: ${error.message}`);
        }
    }
    
    hasTable(db, tableName) {
        try {
            const result = db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name=?
            `).get(tableName);
            return !!result;
        } catch (error) {
            return false;
        }
    }
    
    async createDefaultData() {
        console.log('\n🌱 Creating default data...');
        
        // Create default admin user
        await this.pgClient.query(`
            INSERT INTO unified_users (username, email, role, tier, wallet_balance)
            VALUES ('admin', 'admin@document-generator.local', 'admin', 'unlimited', 10000.00)
            ON CONFLICT (username) DO NOTHING
        `);
        
        // Create some default AI agents for testing
        const defaultAgents = [
            {
                agent_id: 'html_master_001',
                name: 'HTML Master',
                specialty: 'Semantic Structure',
                agent_type: 'coding'
            },
            {
                agent_id: 'css_mage_002', 
                name: 'CSS Mage',
                specialty: 'Responsive Design',
                agent_type: 'design'
            },
            {
                agent_id: 'js_wizard_003',
                name: 'JS Wizard',
                specialty: 'Interactive Logic',
                agent_type: 'programming'
            }
        ];
        
        for (const agent of defaultAgents) {
            await this.pgClient.query(`
                INSERT INTO ai_agents (agent_id, name, specialty, agent_type, wallet_balance, credit_balance)
                VALUES ($1, $2, $3, $4, 1000.00, 1000)
                ON CONFLICT (agent_id) DO NOTHING
            `, [agent.agent_id, agent.name, agent.specialty, agent.agent_type]);
        }
        
        console.log('✅ Default data created');
    }
    
    async verifyMigration() {
        console.log('\n🔍 Verifying migration...');
        
        try {
            const userCount = await this.pgClient.query('SELECT COUNT(*) FROM unified_users');
            const agentCount = await this.pgClient.query('SELECT COUNT(*) FROM ai_agents');
            const docCount = await this.pgClient.query('SELECT COUNT(*) FROM unified_documents');
            
            console.log(`✅ Migration complete:`);
            console.log(`   👥 Users: ${userCount.rows[0].count}`);
            console.log(`   🤖 AI Agents: ${agentCount.rows[0].count}`);
            console.log(`   📄 Documents: ${docCount.rows[0].count}`);
            
            // Test a join query to ensure relationships work
            const testQuery = await this.pgClient.query(`
                SELECT u.username, a.name as agent_name, a.specialty
                FROM unified_users u 
                LEFT JOIN ai_agents a ON a.owner_user_id = u.id
                LIMIT 5
            `);
            
            console.log(`\n🔗 Cross-table relationships working:`);
            testQuery.rows.forEach(row => {
                console.log(`   👤 ${row.username} ${row.agent_name ? `→ 🤖 ${row.agent_name} (${row.specialty})` : '(no agents)'}`);
            });
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
            throw error;
        }
    }
    
    async run() {
        try {
            await this.initialize();
            await this.createUnifiedSchema();
            await this.migrateDataFromSQLite();
            await this.createDefaultData();
            await this.verifyMigration();
            
            console.log('\n🎉 DATABASE MIGRATION COMPLETE!');
            console.log('📊 All systems can now use unified PostgreSQL schema');
            console.log('🔗 No more table conflicts between services');
            console.log('\n💡 Next: Update services to use unified database');
            
        } catch (error) {
            console.error('\n❌ Migration failed:', error.message);
            process.exit(1);
        } finally {
            // Close connections
            if (this.pgClient) await this.pgClient.end();
            for (const db of this.sqliteDbs.values()) {
                db.close();
            }
        }
    }
}

// Run migration if executed directly
if (require.main === module) {
    const migration = new MasterDatabaseMigration();
    migration.run();
}

module.exports = MasterDatabaseMigration;
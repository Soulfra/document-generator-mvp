#!/usr/bin/env node

/**
 * 🎮 Initialize Game Database
 * 
 * Creates the game database schema and initial test data
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function initializeGameDatabase() {
    console.log('🎮 Initializing Game Database...');
    
    // Database connection
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 
            'postgresql://postgres:postgres@localhost:5432/document_generator',
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
    
    try {
        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to database');
        
        // Read schema file
        const schemaPath = path.join(__dirname, 'database', 'game-schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        console.log('📝 Applying database schema...');
        
        // Execute schema
        await client.query(schema);
        
        console.log('✅ Database schema created successfully');
        
        // Create test game session
        console.log('🎮 Creating test game session...');
        
        const result = await client.query('SELECT create_test_game_session()');
        const sessionId = result.rows[0].create_test_game_session;
        
        console.log(`✅ Test session created: ${sessionId}`);
        
        // Check tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        console.log('\n📊 Created tables:');
        tables.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });
        
        // Check views
        const views = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('\n📊 Created views:');
        views.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });
        
        // Get summary
        const summary = await client.query('SELECT * FROM active_game_stats');
        
        console.log('\n📊 Game Statistics:');
        if (summary.rows.length > 0) {
            const stats = summary.rows[0];
            console.log(`   • Session: ${stats.session_name}`);
            console.log(`   • Mode: ${stats.game_mode}`);
            console.log(`   • Players: ${stats.player_count}`);
            console.log(`   • AI Agents: ${stats.ai_agent_count}`);
        }
        
        client.release();
        
        console.log('\n✅ Game database initialization complete!');
        console.log('\n🎮 You can now:');
        console.log('   1. Run the enhanced 3D game');
        console.log('   2. Start the verification service');
        console.log('   3. Open the monitoring dashboard');
        console.log('\n📊 Database is ready to track:');
        console.log('   • Player progress and inventory');
        console.log('   • World modifications and chunks');
        console.log('   • AI behavior and conversations');
        console.log('   • Performance metrics');
        console.log('   • Game events and chat logs');
        
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    initializeGameDatabase()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { initializeGameDatabase };
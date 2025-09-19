#!/usr/bin/env node

/**
 * REINFORCEMENT LEARNING DATABASE INITIALIZER
 * Creates all necessary tables for the daisychain learning system
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function initializeRLDatabase() {
  console.log('🗄️ Initializing Reinforcement Learning Database...\n');
  
  // Database connection
  const db = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'document_generator',
    user: 'postgres',
    password: 'postgres'
  });
  
  try {
    // Test connection
    await db.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');
    
    // Read and execute the RL schema
    console.log('\n📋 Reading RL database schema...');
    const schemaSQL = await fs.readFile(
      path.join(__dirname, 'rl-database-schema.sql'), 
      'utf8'
    );
    
    console.log('🔧 Creating RL tables...');
    await db.query(schemaSQL);
    console.log('✅ RL tables created successfully');
    
    // Insert initial knowledge nodes for existing systems
    console.log('\n🧠 Initializing knowledge graph nodes...');
    const systems = [
      { id: 'carrot-system', name: 'Carrot Reinforcement System', role: 'reinforcement' },
      { id: 'learning-chain', name: 'Learning Chain Coordinator', role: 'coordination' },
      { id: 'ai-factory', name: 'AI Agent MVP Factory', role: 'generation' },
      { id: 'main-api', name: 'Main API', role: 'api' },
      { id: 'dashboard', name: 'Dashboard System', role: 'monitoring' }
    ];
    
    for (const system of systems) {
      await db.query(`
        INSERT INTO rl_knowledge_nodes (id, node_type, name, properties)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [
        system.id,
        'system',
        system.name,
        JSON.stringify({ role: system.role })
      ]);
    }
    console.log('✅ Knowledge nodes initialized');
    
    // Create initial health snapshot
    console.log('\n📸 Creating initial health snapshot...');
    await db.query(`
      INSERT INTO rl_health_snapshots (
        total_systems, healthy_systems, avg_health,
        avg_carrots, total_carrots, snapshot_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      systems.length,
      0, // No systems are healthy yet
      0.0,
      3.0, // Default carrots
      15.0, // Total default carrots
      JSON.stringify({ initialized: true, timestamp: new Date() })
    ]);
    console.log('✅ Initial health snapshot created');
    
    // Verify tables were created
    console.log('\n🔍 Verifying database setup...');
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'rl_%'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created RL tables:');
    tables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // Show row counts
    console.log('\n📈 Initial data:');
    const counts = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM rl_knowledge_nodes) as nodes,
        (SELECT COUNT(*) FROM rl_health_snapshots) as snapshots
    `);
    
    console.log(`   • Knowledge nodes: ${counts.rows[0].nodes}`);
    console.log(`   • Health snapshots: ${counts.rows[0].snapshots}`);
    
    console.log('\n✅ Reinforcement Learning database initialized successfully!');
    console.log('\n📍 Next steps:');
    console.log('   1. Stop the current carrot and learning chain systems (Ctrl+C)');
    console.log('   2. Start the database-enabled versions:');
    console.log('      • node carrot-reinforcement-learning-db.js');
    console.log('      • node learning-chain-coordinator-db.js');
    console.log('   3. Access dashboards:');
    console.log('      • Carrot System: http://localhost:9900/dashboard');
    console.log('      • Learning Chain: http://localhost:9800/dashboard');
    console.log('   4. Verify learning: http://localhost:9900/api/verify');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Tables already exist. To reset:');
      console.log('   1. Drop existing RL tables');
      console.log('   2. Run this script again');
    }
  } finally {
    await db.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeRLDatabase().catch(console.error);
}

module.exports = { initializeRLDatabase };
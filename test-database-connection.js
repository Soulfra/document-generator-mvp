#!/usr/bin/env node

/**
 * Test Database Connection
 * 
 * Simple test script to verify that the PostgreSQL database connection
 * and queries are working properly with the WASM recovery backend.
 */

const { Client: PostgresClient } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_generator';

async function testDatabaseConnection() {
    console.log('🧪 Testing Database Connection...');
    console.log(`📍 Database URL: ${DATABASE_URL}`);
    
    const client = new PostgresClient({
        connectionString: DATABASE_URL
    });
    
    try {
        console.log('\n🔌 Connecting to PostgreSQL...');
        await client.connect();
        console.log('✅ Database connection successful');
        
        console.log('\n📊 Testing basic queries...');
        
        // Test user count
        const userResult = await client.query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(userResult.rows[0].count);
        console.log(`👥 Total users: ${userCount}`);
        
        // Test job count
        const jobResult = await client.query('SELECT COUNT(*) as count FROM jobs');
        const jobCount = parseInt(jobResult.rows[0].count);
        console.log(`💼 Total jobs: ${jobCount}`);
        
        // Test job status breakdown
        const statusResult = await client.query('SELECT status, COUNT(*) as count FROM jobs GROUP BY status');
        
        console.log('\n📈 Job Status Breakdown:');
        statusResult.rows.forEach(({ status, count }) => {
            console.log(`  ${status}: ${count}`);
        });
        
        // Test recent activity
        const recentJobsResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM jobs 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        `);
        const recentJobs = parseInt(recentJobsResult.rows[0].count);
        console.log(`📅 Jobs created in last 24 hours: ${recentJobs}`);
        
        // Test recent users
        const activeUsersResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE last_login_at > NOW() - INTERVAL '24 hours'
        `);
        const activeUsers = parseInt(activeUsersResult.rows[0].count);
        console.log(`🟢 Active users in last 24 hours: ${activeUsers}`);
        
        // Test failed jobs
        const failedJobsResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM jobs 
            WHERE status = 'FAILED' AND updated_at > NOW() - INTERVAL '1 hour'
        `);
        const failedJobs = parseInt(failedJobsResult.rows[0].count);
        console.log(`❌ Failed jobs in last hour: ${failedJobs}`);
        
        console.log('\n✨ All database tests passed!');
        console.log('🏰 WASM Recovery Backend is ready to show REAL data');
        
    } catch (error) {
        console.error('\n❌ Database test failed:', error.message);
        console.error('\n🔍 Possible issues:');
        console.error('  • PostgreSQL server not running');
        console.error('  • Incorrect database credentials');
        console.error('  • Database not migrated or tables missing');
        console.error('  • Firewall blocking database connection');
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n📤 Database connection closed');
    }
}

if (require.main === module) {
    testDatabaseConnection();
}

module.exports = testDatabaseConnection;
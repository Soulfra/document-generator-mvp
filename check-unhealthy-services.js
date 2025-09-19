#!/usr/bin/env node

const axios = require('axios');

async function checkUnhealthyServices() {
    try {
        const response = await axios.get('http://localhost:9999/api/status');
        const status = response.data;
        
        console.log('🔍 SYSTEM STATUS ANALYSIS');
        console.log('=========================');
        console.log(`Total Services: ${status.summary.total}`);
        console.log(`Health: ${status.summary.healthPercentage}%`);
        console.log('');
        
        console.log('❌ UNHEALTHY SERVICES:');
        const unhealthy = status.services.filter(s => s.status === 'unhealthy');
        unhealthy.forEach(service => {
            console.log(`   • ${service.name} (port ${service.port})`);
            if (service.error) console.log(`     Error: ${service.error}`);
        });
        
        console.log('\n📴 OFFLINE SERVICES:');
        const offline = status.services.filter(s => s.status === 'offline');
        offline.forEach(service => {
            console.log(`   • ${service.name} (port ${service.port})`);
        });
        
        console.log('\n✅ HEALTHY SERVICES:');
        const healthy = status.services.filter(s => s.status === 'healthy');
        healthy.forEach(service => {
            console.log(`   • ${service.name} (port ${service.port})`);
        });
        
    } catch (error) {
        console.error('Failed to get system status:', error.message);
    }
}

checkUnhealthyServices();
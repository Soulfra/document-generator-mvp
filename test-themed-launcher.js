#!/usr/bin/env node

/**
 * TEST THEMED LAUNCHER
 * Verify the themed empire launcher is working correctly
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class ThemedLauncherTester {
  constructor() {
    this.apiBase = 'http://localhost:5555';
    this.tests = [];
  }

  async runAllTests() {
    console.log('🧪 TESTING THEMED EMPIRE LAUNCHER');
    console.log('=================================\n');

    await this.testAPIHealth();
    await this.testThemesEndpoint();
    await this.testEmpireStats();
    await this.testEmpireHealth();
    await this.testGameGeneration();
    await this.testSystemDiscovery();
    
    this.generateReport();
  }

  async testAPIHealth() {
    console.log('1️⃣ Testing API Health...');
    try {
      const response = await fetch(`${this.apiBase}/api/empire/health`);
      const data = await response.json();
      
      if (data.success && data.health.percentage > 0) {
        console.log(`   ✅ API healthy: ${data.health.percentage}% empire systems available`);
        console.log(`   📊 ${data.health.healthy}/${data.health.total} empire files found`);
        this.tests.push({ name: 'API Health', status: 'pass', details: `${data.health.percentage}% health` });
      } else {
        console.log('   ❌ API health check failed');
        this.tests.push({ name: 'API Health', status: 'fail', details: 'Health check failed' });
      }
    } catch (error) {
      console.log('   ❌ API unreachable');
      this.tests.push({ name: 'API Health', status: 'fail', details: error.message });
    }
    console.log();
  }

  async testThemesEndpoint() {
    console.log('2️⃣ Testing Themes Endpoint...');
    try {
      const response = await fetch(`${this.apiBase}/api/themes`);
      const data = await response.json();
      
      if (data.success && data.themes) {
        const themeCount = Object.keys(data.themes).length;
        console.log(`   ✅ Themes loaded: ${themeCount} available themes`);
        
        Object.entries(data.themes).forEach(([key, theme]) => {
          console.log(`      ${theme.icon} ${theme.name}`);
        });
        
        this.tests.push({ name: 'Themes Endpoint', status: 'pass', details: `${themeCount} themes` });
      } else {
        console.log('   ❌ Themes endpoint failed');
        this.tests.push({ name: 'Themes Endpoint', status: 'fail', details: 'No themes returned' });
      }
    } catch (error) {
      console.log('   ❌ Themes endpoint error');
      this.tests.push({ name: 'Themes Endpoint', status: 'fail', details: error.message });
    }
    console.log();
  }

  async testEmpireStats() {
    console.log('3️⃣ Testing Empire Stats...');
    try {
      const response = await fetch(`${this.apiBase}/api/empire/stats`);
      const data = await response.json();
      
      if (data.success && data.stats.totalFiles > 0) {
        console.log(`   ✅ Empire stats: ${data.stats.totalFiles.toLocaleString()} files (${data.stats.empireSizeMB}MB)`);
        console.log(`   🌿 Cannabis tycoon: ${data.stats.themed_systems.cannabis_tycoon} systems`);
        console.log(`   🚀 Space empire: ${data.stats.themed_systems.space_empire} systems`);
        console.log(`   🌌 Federation: ${data.stats.themed_systems.federation} systems`);
        
        this.tests.push({ name: 'Empire Stats', status: 'pass', details: `${data.stats.totalFiles} files` });
      } else {
        console.log('   ❌ Empire stats failed');
        this.tests.push({ name: 'Empire Stats', status: 'fail', details: 'No stats returned' });
      }
    } catch (error) {
      console.log('   ❌ Empire stats error');
      this.tests.push({ name: 'Empire Stats', status: 'fail', details: error.message });
    }
    console.log();
  }

  async testEmpireHealth() {
    console.log('4️⃣ Testing Empire Health...');
    try {
      const response = await fetch(`${this.apiBase}/api/empire/health`);
      const data = await response.json();
      
      if (data.success && data.health) {
        console.log(`   ✅ Empire health: ${data.health.percentage}%`);
        
        data.health.checks.forEach(check => {
          const status = check.status === 'healthy' ? '✅' : '❌';
          console.log(`      ${status} ${check.file.split('/').pop()}`);
        });
        
        this.tests.push({ name: 'Empire Health', status: 'pass', details: `${data.health.percentage}% healthy` });
      } else {
        console.log('   ❌ Empire health check failed');
        this.tests.push({ name: 'Empire Health', status: 'fail', details: 'Health check failed' });
      }
    } catch (error) {
      console.log('   ❌ Empire health error');
      this.tests.push({ name: 'Empire Health', status: 'fail', details: error.message });
    }
    console.log();
  }

  async testGameGeneration() {
    console.log('5️⃣ Testing Game Generation...');
    try {
      const response = await fetch(`${this.apiBase}/generate-themed-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: 'cannabis-tycoon',
          userInput: 'Create a cannabis dispensary management game with real-time market dynamics'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.game) {
        console.log(`   ✅ Game generated: "${data.game.name}"`);
        console.log(`   🎮 Theme: ${data.game.theme}`);
        console.log(`   ⚙️  Mechanics: ${data.game.mechanics.slice(0, 3).join(', ')}...`);
        console.log(`   🏛️ Empire source: ${data.game.empire_source}`);
        
        this.tests.push({ name: 'Game Generation', status: 'pass', details: data.game.name });
      } else {
        console.log('   ❌ Game generation failed');
        this.tests.push({ name: 'Game Generation', status: 'fail', details: data.error || 'Unknown error' });
      }
    } catch (error) {
      console.log('   ❌ Game generation error');
      this.tests.push({ name: 'Game Generation', status: 'fail', details: error.message });
    }
    console.log();
  }

  async testSystemDiscovery() {
    console.log('6️⃣ Testing System Discovery...');
    try {
      const response = await fetch(`${this.apiBase}/api/empire/discover`);
      const data = await response.json();
      
      if (data.success && data.discovered) {
        const categories = Object.keys(data.discovered).length;
        console.log(`   ✅ Discovery completed: ${categories} categories found`);
        console.log(`   📊 Stats: ${data.stats.totalSystems} total, ${data.stats.connectedSystems} connected`);
        
        Object.entries(data.discovered).forEach(([category, systems]) => {
          if (systems.length > 0) {
            console.log(`      🏛️ ${category}: ${systems.length} systems`);
          }
        });
        
        this.tests.push({ name: 'System Discovery', status: 'pass', details: `${categories} categories` });
      } else {
        console.log('   ❌ System discovery failed');
        this.tests.push({ name: 'System Discovery', status: 'fail', details: data.error || 'Unknown error' });
      }
    } catch (error) {
      console.log('   ❌ System discovery error');
      this.tests.push({ name: 'System Discovery', status: 'fail', details: error.message });
    }
    console.log();
  }

  generateReport() {
    const totalTests = this.tests.length;
    const passedTests = this.tests.filter(t => t.status === 'pass').length;
    const passRate = (passedTests / totalTests * 100).toFixed(1);

    console.log('📊 THEMED LAUNCHER TEST REPORT');
    console.log('==============================');
    console.log();

    this.tests.forEach(test => {
      const status = test.status === 'pass' ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${test.details}`);
    });

    console.log();
    console.log(`🎯 Test Results: ${passedTests}/${totalTests} passed (${passRate}%)`);
    
    if (passRate >= 80) {
      console.log('🎉 THEMED EMPIRE LAUNCHER IS WORKING!');
      console.log();
      console.log('🌐 Access your themed empire at:');
      console.log('   http://localhost:5555/themed-launcher');
      console.log();
      console.log('🎮 Your empire includes:');
      console.log('   • 🌿 Cannabis Tycoon Systems');
      console.log('   • 🚀 Star Trek/Wars Space Empire');
      console.log('   • 🏛️ Civilization Builder Games');
      console.log('   • 🌊 Depths Empire Tycoon');
      console.log('   • 🌌 Galactic Federation Networks');
      console.log('   • 🖖 Enterprise Command Systems');
    } else {
      console.log('⚠️  Some themed empire systems need attention');
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new ThemedLauncherTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ThemedLauncherTester;
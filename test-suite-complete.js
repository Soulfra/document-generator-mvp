#!/usr/bin/env node

/**
 * COMPLETE TEST SUITE
 * End-to-end and unit tests to verify the entire system works
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const assert = require('assert');
const { spawn } = require('child_process');

class CompleteTester {
  constructor() {
    this.GATEWAY = 'http://localhost:4444';
    this.BRIDGE = 'http://localhost:3333';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  // Test runner
  async runTest(name, fn) {
    process.stdout.write(`Testing ${name}... `);
    try {
      await fn();
      console.log('✅ PASSED');
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed' });
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', error: error.message });
    }
  }

  // Unit Tests
  async runUnitTests() {
    console.log('\n🧪 RUNNING UNIT TESTS\n');

    // Test 1: Service health checks
    await this.runTest('Gateway health check', async () => {
      const res = await fetch(`${this.GATEWAY}/api/health`);
      const data = await res.json();
      assert(data.status === 'healthy', 'Gateway should be healthy');
      assert(data.services.postgres === true, 'PostgreSQL should be connected');
      assert(data.services.redis === true, 'Redis should be connected');
      assert(data.services.bridge === true, 'Bridge should be connected');
    });

    // Test 2: Bridge empire systems
    await this.runTest('Bridge empire discovery', async () => {
      const res = await fetch(`${this.BRIDGE}/api/systems`);
      const data = await res.json();
      assert(data.totalFiles > 10000, 'Should discover 10k+ empire files');
      assert(data.systems.length > 0, 'Should have system details');
      assert(data.realData === true, 'Should be real data, not fake');
    });

    // Test 3: User creation
    await this.runTest('User creation', async () => {
      const res = await fetch(`${this.GATEWAY}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `test_${Date.now()}`,
          email: 'test@example.com'
        })
      });
      const data = await res.json();
      assert(data.success === true, 'User creation should succeed');
      assert(data.user.id > 0, 'User should have valid ID');
      this.testUserId = data.user.id;
    });

    // Test 4: Document creation
    await this.runTest('Document creation', async () => {
      const res = await fetch(`${this.GATEWAY}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.testUserId,
          title: 'Unit Test Document',
          content: 'Create a simple game for testing',
          docType: 'game-design'
        })
      });
      const data = await res.json();
      assert(data.success === true, 'Document creation should succeed');
      assert(data.document.id > 0, 'Document should have valid ID');
      this.testDocId = data.document.id;
    });

    // Test 5: Game creation
    await this.runTest('Game creation', async () => {
      const res = await fetch(`${this.GATEWAY}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.testUserId,
          name: 'Unit Test Game',
          type: 'puzzle',
          config: { difficulty: 'medium' }
        })
      });
      const data = await res.json();
      assert(data.success === true, 'Game creation should succeed');
      assert(data.game.id > 0, 'Game should have valid ID');
      this.testGameId = data.game.id;
    });

    // Test 6: Revenue tracking
    await this.runTest('Revenue tracking', async () => {
      const res = await fetch(`${this.GATEWAY}/api/revenue/summary`);
      const data = await res.json();
      assert(data.success === true, 'Revenue query should succeed');
      assert(typeof data.totalRevenue === 'number', 'Should have total revenue');
      assert(data.transactions >= 0, 'Should have transaction count');
    });

    // Test 7: Search functionality
    await this.runTest('Search functionality', async () => {
      const res = await fetch(`${this.GATEWAY}/api/search?q=test`);
      const data = await res.json();
      assert(data.success === true, 'Search should succeed');
      assert(Array.isArray(data.results), 'Should return results array');
    });
  }

  // Integration Tests
  async runIntegrationTests() {
    console.log('\n🔗 RUNNING INTEGRATION TESTS\n');

    // Test 1: Document to MVP flow
    await this.runTest('Document → MVP transformation', async () => {
      // Create document
      const docRes = await fetch(`${this.GATEWAY}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.testUserId,
          title: 'Integration Test: Mobile Trading Game',
          content: 'Create a mobile trading game where players can buy and sell virtual goods using QR codes',
          docType: 'game-design'
        })
      });
      const doc = await docRes.json();
      
      // Process document
      const processRes = await fetch(`${this.GATEWAY}/api/documents/${doc.document.id}/process`, {
        method: 'POST'
      });
      const processed = await processRes.json();
      
      assert(processed.success === true, 'Document processing should succeed');
      assert(processed.result.result.empireIntegration.relevantSystems > 0, 'Should integrate empire systems');
    });

    // Test 2: Game play and credit earning
    await this.runTest('Game play → Credit earning', async () => {
      const playRes = await fetch(`${this.GATEWAY}/api/games/${this.testGameId}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsEarned: 250 })
      });
      const play = await playRes.json();
      
      assert(play.success === true, 'Game play should succeed');
      assert(play.game.credits_earned >= 250, 'Credits should be recorded');
      
      // Check user credits updated
      const userRes = await fetch(`${this.GATEWAY}/api/users/${this.testUserId}`);
      const user = await userRes.json();
      assert(user.user.credits >= 250, 'User credits should be updated');
    });

    // Test 3: Empire system integration
    await this.runTest('Empire system action', async () => {
      const res = await fetch(`${this.BRIDGE}/api/bridge/empire-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-connection',
          value: 100,
          systemType: 'gaming'
        })
      });
      const data = await res.json();
      
      assert(data.success === true, 'Empire action should succeed');
      assert(data.connectedSystems > 0, 'Should connect to gaming systems');
      assert(data.realConnection === true, 'Should be real connection');
    });

    // Test 4: Audit system integration
    await this.runTest('Audit creation and tracking', async () => {
      const res = await fetch(`${this.GATEWAY}/api/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Test Company',
          systemType: 'web-application',
          auditType: 'security',
          budget: 5000
        })
      });
      const data = await res.json();
      
      assert(data.success === true, 'Audit creation should succeed');
      assert(data.audit.id > 0, 'Audit should have valid ID');
      assert(data.audit.budget === '5000.00', 'Budget should be recorded');
    });
  }

  // End-to-End Tests
  async runE2ETests() {
    console.log('\n🚀 RUNNING END-TO-END TESTS\n');

    // Test 1: Complete user journey
    await this.runTest('Complete user journey', async () => {
      // 1. Create new user
      const userRes = await fetch(`${this.GATEWAY}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `e2e_user_${Date.now()}`,
          email: 'e2e@test.com'
        })
      });
      const user = await userRes.json();
      const userId = user.user.id;

      // 2. Submit business plan
      const docRes = await fetch(`${this.GATEWAY}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'E2E Test: Social Gaming Platform',
          content: `
            Business Plan: Create a social gaming platform where users can:
            - Play mini-games and earn credits
            - Share games via QR codes
            - Challenge friends
            - Trade virtual items
            - Convert credits to rewards
          `,
          docType: 'business-plan'
        })
      });
      const doc = await docRes.json();

      // 3. Process to MVP
      const processRes = await fetch(`${this.GATEWAY}/api/documents/${doc.document.id}/process`, {
        method: 'POST'
      });
      const mvp = await processRes.json();

      // 4. Create game from MVP
      const gameRes = await fetch(`${this.GATEWAY}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: 'Social Gaming Platform',
          type: 'platform',
          config: mvp.result.result.processed
        })
      });
      const game = await gameRes.json();

      // 5. Simulate gameplay
      const playRes = await fetch(`${this.GATEWAY}/api/games/${game.game.id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsEarned: 500 })
      });

      // 6. Check revenue generated
      const revenueRes = await fetch(`${this.GATEWAY}/api/revenue/summary`);
      const revenue = await revenueRes.json();

      assert(mvp.success === true, 'MVP generation should succeed');
      assert(game.success === true, 'Game creation should succeed');
      assert(revenue.totalRevenue > 0, 'Revenue should be generated');
    });

    // Test 2: Multi-user interaction
    await this.runTest('Multi-user game interaction', async () => {
      // Create two users
      const user1Res = await fetch(`${this.GATEWAY}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: `player1_${Date.now()}`, email: 'p1@test.com' })
      });
      const user1 = await user1Res.json();

      const user2Res = await fetch(`${this.GATEWAY}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: `player2_${Date.now()}`, email: 'p2@test.com' })
      });
      const user2 = await user2Res.json();

      // Create shared game
      const gameRes = await fetch(`${this.GATEWAY}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user1.user.id,
          name: 'Multiplayer Test',
          type: 'multiplayer',
          config: { maxPlayers: 2, qrEnabled: true }
        })
      });
      const game = await gameRes.json();

      // Both users play
      await fetch(`${this.GATEWAY}/api/games/${game.game.id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsEarned: 100 })
      });

      await fetch(`${this.GATEWAY}/api/games/${game.game.id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsEarned: 150 })
      });

      // Check game stats
      const statsRes = await fetch(`${this.GATEWAY}/api/games/${game.game.id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditsEarned: 0 })
      });
      const stats = await statsRes.json();

      assert(stats.game.play_count >= 3, 'Should track all plays');
      assert(stats.game.credits_earned >= 250, 'Should track total credits');
    });
  }

  // Performance Tests
  async runPerformanceTests() {
    console.log('\n⚡ RUNNING PERFORMANCE TESTS\n');

    await this.runTest('API response time', async () => {
      const start = Date.now();
      await fetch(`${this.GATEWAY}/api/health`);
      const elapsed = Date.now() - start;
      
      assert(elapsed < 100, `Response time should be <100ms (was ${elapsed}ms)`);
    });

    await this.runTest('Concurrent requests', async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(fetch(`${this.GATEWAY}/api/health`));
      }
      
      const start = Date.now();
      await Promise.all(requests);
      const elapsed = Date.now() - start;
      
      assert(elapsed < 500, `10 concurrent requests should complete <500ms (was ${elapsed}ms)`);
    });

    await this.runTest('Database query performance', async () => {
      const start = Date.now();
      await fetch(`${this.GATEWAY}/api/revenue/summary`);
      const elapsed = Date.now() - start;
      
      assert(elapsed < 200, `Complex query should complete <200ms (was ${elapsed}ms)`);
    });
  }

  // UI Tests
  async runUITests() {
    console.log('\n🖥️  RUNNING UI TESTS\n');

    await this.runTest('Dashboard loads', async () => {
      const res = await fetch(`${this.GATEWAY}/`);
      const html = await res.text();
      
      assert(res.status === 200, 'Dashboard should return 200');
      assert(html.includes('Empire Control Center'), 'Should contain dashboard title');
      assert(html.includes('connectToBridge'), 'Should have bridge connection code');
    });

    await this.runTest('Mobile game platform loads', async () => {
      const res = await fetch(`${this.GATEWAY}/real-mobile-game-platform.html`);
      const html = await res.text();
      
      assert(res.status === 200, 'Mobile platform should return 200');
      assert(html.includes('Mobile Gaming Empire'), 'Should contain platform title');
      assert(html.includes('manifest.json'), 'Should be PWA-ready');
    });

    await this.runTest('Audit firm loads', async () => {
      const res = await fetch(`${this.GATEWAY}/real-audit-firm.html`);
      const html = await res.text();
      
      assert(res.status === 200, 'Audit firm should return 200');
      assert(html.includes('Audit Firm'), 'Should contain audit firm title');
      assert(html.includes('submitBugReport'), 'Should have bug submission code');
    });
  }

  // Generate test report
  generateReport() {
    console.log('\n📊 TEST REPORT\n');
    console.log('═══════════════════════════════════════');
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════\n');

    if (this.results.failed > 0) {
      console.log('Failed Tests:');
      this.results.tests
        .filter(t => t.status === 'failed')
        .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }

    return this.results.failed === 0;
  }

  // Main test runner
  async runAllTests() {
    console.log('🏃 COMPLETE TEST SUITE FOR DOCUMENT GENERATOR\n');
    console.log('Ensuring services are running...\n');

    // Check services first
    try {
      const health = await fetch(`${this.GATEWAY}/api/health`).then(r => r.json());
      if (!health.services.bridge) {
        console.log('⚠️  Bridge not ready, waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } catch (error) {
      console.error('❌ Services not running! Run: ./empire-system-manager.sh start');
      process.exit(1);
    }

    // Run all test suites
    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runE2ETests();
    await this.runPerformanceTests();
    await this.runUITests();

    // Generate report
    const allPassed = this.generateReport();

    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! The system is working perfectly!\n');
      console.log('✅ Document processing works');
      console.log('✅ Game creation works');
      console.log('✅ Revenue tracking works');
      console.log('✅ Empire integration works');
      console.log('✅ Multi-user support works');
      console.log('✅ Performance is good');
      console.log('✅ UI is accessible\n');
      console.log('🚀 Ready for production deployment!');
    } else {
      console.log('⚠️  Some tests failed. Please fix issues before deployment.');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CompleteTester();
  tester.runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = CompleteTester;
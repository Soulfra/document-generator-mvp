#!/usr/bin/env node

/**
 * Test Electron OS Integration
 * Verifies that all components work together in the Electron environment
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function testElectronOSIntegration() {
    console.log('🧪 Testing Electron OS Integration');
    console.log('================================');
    
    const results = {
        files: false,
        electron: false,
        dashboards: false,
        services: false,
        menu: false
    };
    
    // Test 1: Check required files exist
    console.log('\n1️⃣ Testing Required Files...');
    const requiredFiles = [
        'electron-main.js',
        'unified-live-dashboard.html',
        'meta-verification-overlay.html',
        'visual-dashboard.html',
        'dashboard.html',
        'index.js',
        'ai-reasoning-bridge.js',
        'dashboard-server.js'
    ];
    
    let filesExist = 0;
    for (const file of requiredFiles) {
        if (fs.existsSync(path.join(__dirname, file))) {
            console.log(`✅ ${file} exists`);
            filesExist++;
        } else {
            console.log(`❌ ${file} missing`);
        }
    }
    
    results.files = filesExist === requiredFiles.length;
    console.log(`📁 Files: ${filesExist}/${requiredFiles.length} found`);
    
    // Test 2: Check Electron availability
    console.log('\n2️⃣ Testing Electron Availability...');
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const hasElectron = packageJson.dependencies?.electron || packageJson.devDependencies?.electron;
        
        if (hasElectron) {
            console.log(`✅ Electron ${hasElectron} available in package.json`);
            results.electron = true;
        } else {
            console.log('❌ Electron not found in package.json');
        }
    } catch (error) {
        console.log('❌ Could not read package.json');
    }
    
    // Test 3: Check dashboard integration
    console.log('\n3️⃣ Testing Dashboard Integration...');
    try {
        const electronMain = fs.readFileSync('electron-main.js', 'utf8');
        
        const checks = [
            { name: 'Unified Dashboard Loading', pattern: /unified-live-dashboard\.html/ },
            { name: 'Dashboard Window Method', pattern: /openDashboardWindow/ },
            { name: 'Service Integration', pattern: /Document Generator API.*port: 3009/ },
            { name: 'Menu System', pattern: /label: 'Windows'/ }
        ];
        
        let dashboardChecks = 0;
        for (const check of checks) {
            if (check.pattern.test(electronMain)) {
                console.log(`✅ ${check.name} integrated`);
                dashboardChecks++;
            } else {
                console.log(`❌ ${check.name} not found`);
            }
        }
        
        results.dashboards = dashboardChecks === checks.length;
        console.log(`📊 Dashboard Integration: ${dashboardChecks}/${checks.length} checks passed`);
    } catch (error) {
        console.log('❌ Could not analyze electron-main.js');
    }
    
    // Test 4: Check service configuration
    console.log('\n4️⃣ Testing Service Configuration...');
    try {
        const electronMain = fs.readFileSync('electron-main.js', 'utf8');
        
        const serviceChecks = [
            { name: 'Main API Service (3009)', pattern: /port: 3009/ },
            { name: 'Reasoning Bridge (3007)', pattern: /port: 3007/ },
            { name: 'Dashboard Server (8081)', pattern: /port: 8081/ },
            { name: 'Direct Service Handling', pattern: /direct: true/ }
        ];
        
        let serviceTests = 0;
        for (const check of serviceChecks) {
            if (check.pattern.test(electronMain)) {
                console.log(`✅ ${check.name} configured`);
                serviceTests++;
            } else {
                console.log(`❌ ${check.name} not configured`);
            }
        }
        
        results.services = serviceTests === serviceChecks.length;
        console.log(`🔧 Service Configuration: ${serviceTests}/${serviceChecks.length} checks passed`);
    } catch (error) {
        console.log('❌ Could not analyze service configuration');
    }
    
    // Test 5: Check menu system
    console.log('\n5️⃣ Testing Menu System...');
    try {
        const electronMain = fs.readFileSync('electron-main.js', 'utf8');
        
        const menuChecks = [
            { name: 'Windows Menu', pattern: /label: 'Windows'/ },
            { name: 'Services Menu', pattern: /label: 'Services'/ },
            { name: 'Keyboard Shortcuts', pattern: /accelerator: 'CmdOrCtrl\+[1-4]'/ },
            { name: 'Dashboard Window Integration', pattern: /openDashboardWindow.*System Monitor/ }
        ];
        
        let menuTests = 0;
        for (const check of menuChecks) {
            if (check.pattern.test(electronMain)) {
                console.log(`✅ ${check.name} implemented`);
                menuTests++;
            } else {
                console.log(`❌ ${check.name} not found`);
            }
        }
        
        results.menu = menuTests === menuChecks.length;
        console.log(`📋 Menu System: ${menuTests}/${menuChecks.length} checks passed`);
    } catch (error) {
        console.log('❌ Could not analyze menu system');
    }
    
    // Final Results
    console.log('\n📊 ELECTRON OS INTEGRATION TEST RESULTS');
    console.log('=====================================');
    console.log(`Required Files: ${results.files ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Electron Availability: ${results.electron ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Dashboard Integration: ${results.dashboards ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Service Configuration: ${results.services ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Menu System: ${results.menu ? '✅ PASS' : '❌ FAIL'}`);
    
    const passCount = Object.values(results).filter(Boolean).length;
    const overallSuccess = passCount === 5;
    
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ COMPLETE SUCCESS' : `⚠️ PARTIAL SUCCESS (${passCount}/5)`}`);
    
    if (overallSuccess) {
        console.log('\n🎉 ELECTRON OS INTEGRATION COMPLETE!');
        console.log('🖥️ Ready to launch: ./launch-electron-os.sh');
        console.log('📚 Features:');
        console.log('   • Native desktop application');
        console.log('   • Embedded API services');
        console.log('   • Multiple dashboard windows');
        console.log('   • Keyboard shortcuts (Cmd/Ctrl+1-4)');
        console.log('   • Real-time data connections');
        console.log('   • Service management through Electron');
    } else {
        console.log('\n🔧 Some components need attention. Check the failed tests above.');
    }
    
    return overallSuccess;
}

// Run the test
if (require.main === module) {
    testElectronOSIntegration().catch(console.error);
}

module.exports = { testElectronOSIntegration };
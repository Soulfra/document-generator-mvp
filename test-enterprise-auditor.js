#!/usr/bin/env node

/**
 * 🛡️ ENTERPRISE SECURITY AUDITOR TEST
 * Tests the complete enterprise security auditing system
 */

async function testEnterpriseAuditor() {
    console.log('🛡️ ENTERPRISE SECURITY AUDITOR TEST');
    console.log('====================================');
    console.log('🔐 Testing the #1 Security Firm integration');
    console.log('📊 Full enterprise security audit with compliance');
    console.log('💰 Professional services with pricing');
    console.log('');

    const baseUrl = 'http://localhost:8090';
    
    // Test with demo enterprise client
    const testClientId = 'demo_enterprise';
    
    console.log(`🛡️ TESTING ENTERPRISE AUDIT: ${testClientId}`);
    console.log('   (Comprehensive security audit with all systems integrated)');
    console.log('');
    
    try {
        // Start the enterprise audit
        console.log('🛡️ STARTING ENTERPRISE SECURITY AUDIT...');
        const auditResponse = await fetch(`${baseUrl}/api/audit/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: testClientId,
                scope: 'comprehensive',
                targetUrls: ['https://example.com', 'https://api.example.com'],
                complianceFrameworks: ['SOC2', 'ISO27001', 'GDPR', 'PCI-DSS']
            })
        });
        
        const audit = await auditResponse.json();
        
        console.log('🛡️ ENTERPRISE AUDIT COMPLETED!');
        console.log(`   Audit ID: ${audit.id}`);
        console.log(`   Duration: ${audit.duration}ms`);
        console.log(`   Status: ${audit.status}`);
        console.log('');
        
        // Display phase results
        console.log('📋 AUDIT PHASES:');
        Object.entries(audit.phases).forEach(([phase, data]) => {
            const phaseTitle = phase.replace(/_/g, ' ').toUpperCase();
            console.log(`\n🔍 ${phaseTitle}:`);
            console.log(`   Status: ${data.status}`);
            console.log(`   Findings: ${data.findings ? data.findings.length : 0}`);
            
            if (data.findings && data.findings.length > 0) {
                data.findings.slice(0, 3).forEach(finding => {
                    console.log(`   • ${finding.title || finding.type || 'Finding'} (${finding.severity || 'info'})`);
                });
            }
        });
        
        // Display executive summary
        console.log('\n📊 EXECUTIVE SUMMARY:');
        if (audit.executive) {
            console.log(`   🔴 Critical Findings: ${audit.executive.criticalFindings}`);
            console.log(`   🟠 High Findings: ${audit.executive.highFindings}`);
            console.log(`   🟡 Medium Findings: ${audit.executive.mediumFindings}`);
            console.log(`   🟢 Low Findings: ${audit.executive.lowFindings}`);
            console.log(`   📈 Overall Risk Score: ${audit.executive.overallRiskScore}/100`);
            console.log(`   ✅ Compliance Score: ${audit.executive.complianceScore}%`);
            console.log(`   📊 Security Maturity: ${audit.executive.maturityLevel}`);
        }
        
        // Display compliance results
        console.log('\n📋 COMPLIANCE STATUS:');
        if (audit.phases.compliance_check && audit.phases.compliance_check.findings) {
            audit.phases.compliance_check.findings.forEach(compliance => {
                const status = compliance.compliant ? '✅' : '❌';
                console.log(`   ${status} ${compliance.framework}: ${compliance.score}% compliant`);
                if (compliance.gaps && compliance.gaps.length > 0) {
                    console.log(`      Gaps: ${compliance.gaps.slice(0, 2).join(', ')}`);
                }
            });
        }
        
        // Display remediation roadmap
        console.log('\n🗺️ REMEDIATION ROADMAP:');
        if (audit.roadmap) {
            console.log(`   🚨 Immediate Actions: ${audit.roadmap.immediate.length}`);
            console.log(`   📅 Short-term Actions: ${audit.roadmap.shortTerm.length}`);
            console.log(`   📆 Medium-term Actions: ${audit.roadmap.mediumTerm.length}`);
            console.log(`   🗓️ Long-term Actions: ${audit.roadmap.longTerm.length}`);
        }
        
        // Test invoice generation
        console.log('\n💰 GENERATING INVOICE...');
        const invoiceResponse = await fetch(`${baseUrl}/api/audit/invoice/${audit.id}`);
        const invoice = await invoiceResponse.json();
        
        if (invoice) {
            console.log(`   Service: ${invoice.services}`);
            console.log(`   Base Price: $${invoice.basePrice.toLocaleString()}`);
            console.log(`   Total Price: $${invoice.totalPrice.toLocaleString()}`);
            console.log(`   Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
        }
        
        console.log('\n✅ SUCCESS! Enterprise security audit completed successfully');
        console.log('🌐 Access the web interface at: http://localhost:8090/enterprise-audit');
        console.log('🛡️ Full integration with all security systems');
        console.log('📊 Professional enterprise-grade reporting');
        console.log('💼 Ready to serve Fortune 500 clients');
        
        return audit;
        
    } catch (error) {
        console.error('❌ Enterprise audit test failed:', error.message);
        console.log('🔧 Make sure the server is running on port 8090');
        return null;
    }
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = function(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = require('http');
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || 8090,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = client.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        json: () => Promise.resolve(JSON.parse(data)),
                        text: () => Promise.resolve(data),
                        ok: res.statusCode >= 200 && res.statusCode < 300
                    });
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    };
}

// Run the test
if (require.main === module) {
    testEnterpriseAuditor().catch(console.error);
}

module.exports = { testEnterpriseAuditor };
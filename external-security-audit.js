#!/usr/bin/env node

/**
 * 🔒 EXTERNAL SECURITY AUDIT SYSTEM 🔒
 * Comprehensive security audit for all connected systems
 * Checks for vulnerabilities, exposed data, and security best practices
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { execSync } = require('child_process');

class ExternalSecurityAudit {
    constructor() {
        this.auditResults = {
            timestamp: new Date().toISOString(),
            auditor: 'External Security Audit v1.0',
            systems: {},
            vulnerabilities: [],
            exposures: [],
            recommendations: [],
            overallScore: 0,
            status: 'pending'
        };
        
        this.endpoints = [
            { name: 'Unified API', url: 'http://localhost:4000', critical: true },
            { name: 'Gaming Bridge', url: 'http://localhost:7777', critical: true },
            { name: 'Financial Bridge', url: 'http://localhost:8888', critical: true },
            { name: 'Universal Data', url: 'http://localhost:9999', critical: true },
            { name: 'World Broadcaster', url: 'http://localhost:8080', critical: true }
        ];
        
        this.securityChecks = {
            authentication: 0,
            authorization: 0,
            encryption: 0,
            inputValidation: 0,
            rateLimit: 0,
            cors: 0,
            headers: 0,
            dataExposure: 0,
            apiKeys: 0,
            injections: 0
        };
    }
    
    async runFullSecurityAudit() {
        console.log('\n🔒 EXTERNAL SECURITY AUDIT SYSTEM 🔒');
        console.log('=====================================\n');
        console.log('Starting comprehensive security audit...\n');
        
        try {
            // Phase 1: Network Security
            await this.auditNetworkSecurity();
            
            // Phase 2: API Security
            await this.auditAPISecurity();
            
            // Phase 3: Data Security
            await this.auditDataSecurity();
            
            // Phase 4: Authentication & Authorization
            await this.auditAuthSecurity();
            
            // Phase 5: Input Validation
            await this.auditInputValidation();
            
            // Phase 6: Configuration Security
            await this.auditConfigurationSecurity();
            
            // Phase 7: Dependency Security
            await this.auditDependencies();
            
            // Phase 8: Code Security
            await this.auditCodeSecurity();
            
            // Generate final report
            this.generateSecurityReport();
            
        } catch (error) {
            console.error('❌ Security audit failed:', error);
            this.auditResults.status = 'failed';
            this.auditResults.error = error.message;
        }
    }
    
    async auditNetworkSecurity() {
        console.log('🌐 PHASE 1: Network Security Audit');
        console.log('==================================');
        
        for (const endpoint of this.endpoints) {
            console.log(`\n🔍 Auditing ${endpoint.name} (${endpoint.url})...`);
            
            try {
                // Check if endpoint is exposed
                const response = await axios.get(`${endpoint.url}/api/status`, {
                    timeout: 5000,
                    validateStatus: () => true
                });
                
                this.auditResults.systems[endpoint.name] = {
                    url: endpoint.url,
                    exposed: true,
                    statusCode: response.status,
                    headers: response.headers,
                    security: {}
                };
                
                // Check for security headers
                const securityHeaders = {
                    'x-frame-options': false,
                    'x-content-type-options': false,
                    'x-xss-protection': false,
                    'strict-transport-security': false,
                    'content-security-policy': false
                };
                
                for (const [header, found] of Object.entries(securityHeaders)) {
                    if (response.headers[header]) {
                        securityHeaders[header] = true;
                        this.securityChecks.headers++;
                    }
                }
                
                const missingHeaders = Object.entries(securityHeaders)
                    .filter(([_, found]) => !found)
                    .map(([header, _]) => header);
                
                if (missingHeaders.length > 0) {
                    this.auditResults.vulnerabilities.push({
                        severity: 'medium',
                        system: endpoint.name,
                        type: 'missing_security_headers',
                        details: `Missing headers: ${missingHeaders.join(', ')}`
                    });
                    console.log(`  ⚠️ Missing security headers: ${missingHeaders.length}`);
                } else {
                    console.log('  ✅ All security headers present');
                }
                
                // Check CORS
                if (response.headers['access-control-allow-origin'] === '*') {
                    this.auditResults.vulnerabilities.push({
                        severity: 'high',
                        system: endpoint.name,
                        type: 'cors_wildcard',
                        details: 'CORS allows all origins (*)'
                    });
                    console.log('  🚨 CORS allows all origins!');
                } else {
                    this.securityChecks.cors++;
                    console.log('  ✅ CORS properly configured');
                }
                
            } catch (error) {
                console.log(`  ❌ Endpoint unreachable: ${error.message}`);
                this.auditResults.systems[endpoint.name] = {
                    url: endpoint.url,
                    exposed: false,
                    error: error.message
                };
            }
        }
    }
    
    async auditAPISecurity() {
        console.log('\n\n🔐 PHASE 2: API Security Audit');
        console.log('==============================');
        
        // Test authentication requirements
        console.log('\n🔑 Testing authentication requirements...');
        
        for (const endpoint of this.endpoints) {
            if (!this.auditResults.systems[endpoint.name]?.exposed) continue;
            
            try {
                // Test various endpoints without auth
                const testEndpoints = [
                    '/api/everything',
                    '/api/game/action',
                    '/api/real-economy',
                    '/api/unified-data'
                ];
                
                let unprotectedEndpoints = [];
                
                for (const testPath of testEndpoints) {
                    try {
                        const response = await axios.get(`${endpoint.url}${testPath}`, {
                            timeout: 3000,
                            validateStatus: () => true
                        });
                        
                        if (response.status === 200) {
                            unprotectedEndpoints.push(testPath);
                        }
                    } catch (error) {
                        // Endpoint not available
                    }
                }
                
                if (unprotectedEndpoints.length > 0) {
                    this.auditResults.vulnerabilities.push({
                        severity: 'critical',
                        system: endpoint.name,
                        type: 'no_authentication',
                        details: `Unprotected endpoints: ${unprotectedEndpoints.join(', ')}`
                    });
                    console.log(`  🚨 ${endpoint.name}: ${unprotectedEndpoints.length} unprotected endpoints!`);
                } else {
                    this.securityChecks.authentication++;
                }
                
            } catch (error) {
                console.log(`  ❌ Could not test ${endpoint.name}: ${error.message}`);
            }
        }
        
        // Test rate limiting
        console.log('\n⏱️ Testing rate limiting...');
        
        const testRateLimit = async (url) => {
            const requests = [];
            for (let i = 0; i < 100; i++) {
                requests.push(axios.get(`${url}/api/status`, { 
                    timeout: 1000,
                    validateStatus: () => true 
                }));
            }
            
            try {
                const results = await Promise.all(requests);
                const rateLimited = results.some(r => r.status === 429);
                
                if (!rateLimited) {
                    this.auditResults.vulnerabilities.push({
                        severity: 'high',
                        system: url,
                        type: 'no_rate_limiting',
                        details: 'No rate limiting detected (100 requests succeeded)'
                    });
                    console.log(`  🚨 No rate limiting on ${url}`);
                } else {
                    this.securityChecks.rateLimit++;
                    console.log(`  ✅ Rate limiting active on ${url}`);
                }
            } catch (error) {
                // Some requests failed, could be rate limiting
            }
        };
        
        for (const endpoint of this.endpoints) {
            if (this.auditResults.systems[endpoint.name]?.exposed) {
                await testRateLimit(endpoint.url);
            }
        }
    }
    
    async auditDataSecurity() {
        console.log('\n\n🗄️ PHASE 3: Data Security Audit');
        console.log('================================');
        
        // Check for exposed sensitive data
        console.log('\n🔍 Checking for exposed sensitive data...');
        
        const sensitivePatterns = [
            { pattern: /api[_-]?key/i, type: 'api_key' },
            { pattern: /password/i, type: 'password' },
            { pattern: /secret/i, type: 'secret' },
            { pattern: /token/i, type: 'token' },
            { pattern: /private[_-]?key/i, type: 'private_key' },
            { pattern: /\b[A-Za-z0-9+/]{40,}\b/, type: 'potential_key' }
        ];
        
        for (const endpoint of this.endpoints) {
            if (!this.auditResults.systems[endpoint.name]?.exposed) continue;
            
            try {
                const response = await axios.get(`${endpoint.url}/api/everything`, {
                    timeout: 5000,
                    validateStatus: () => true
                });
                
                if (response.status === 200) {
                    const dataString = JSON.stringify(response.data);
                    let exposures = [];
                    
                    for (const { pattern, type } of sensitivePatterns) {
                        if (pattern.test(dataString)) {
                            exposures.push(type);
                        }
                    }
                    
                    if (exposures.length > 0) {
                        this.auditResults.exposures.push({
                            system: endpoint.name,
                            types: exposures,
                            severity: 'critical'
                        });
                        console.log(`  🚨 ${endpoint.name}: Potential sensitive data exposure (${exposures.join(', ')})`);
                    } else {
                        this.securityChecks.dataExposure++;
                        console.log(`  ✅ ${endpoint.name}: No sensitive data exposed`);
                    }
                }
            } catch (error) {
                // Could not retrieve data
            }
        }
    }
    
    async auditAuthSecurity() {
        console.log('\n\n🔐 PHASE 4: Authentication & Authorization Audit');
        console.log('==============================================');
        
        // Check for default credentials
        console.log('\n🔑 Testing for default credentials...');
        
        const defaultCreds = [
            { username: 'admin', password: 'admin' },
            { username: 'root', password: 'root' },
            { username: 'test', password: 'test' },
            { username: 'demo', password: 'demo' }
        ];
        
        for (const endpoint of this.endpoints) {
            if (!this.auditResults.systems[endpoint.name]?.exposed) continue;
            
            for (const cred of defaultCreds) {
                try {
                    const response = await axios.post(`${endpoint.url}/api/login`, cred, {
                        timeout: 3000,
                        validateStatus: () => true
                    });
                    
                    if (response.status === 200) {
                        this.auditResults.vulnerabilities.push({
                            severity: 'critical',
                            system: endpoint.name,
                            type: 'default_credentials',
                            details: `Default credentials work: ${cred.username}/${cred.password}`
                        });
                        console.log(`  🚨 ${endpoint.name}: Default credentials accepted!`);
                        break;
                    }
                } catch (error) {
                    // Login endpoint doesn't exist or credentials rejected
                }
            }
        }
        
        // Check authorization
        console.log('\n🛡️ Testing authorization controls...');
        
        // Test if we can access admin endpoints
        const adminEndpoints = [
            '/api/admin',
            '/api/config',
            '/api/users',
            '/api/system/shutdown'
        ];
        
        for (const endpoint of this.endpoints) {
            if (!this.auditResults.systems[endpoint.name]?.exposed) continue;
            
            let unauthorizedAccess = [];
            
            for (const adminPath of adminEndpoints) {
                try {
                    const response = await axios.get(`${endpoint.url}${adminPath}`, {
                        timeout: 3000,
                        validateStatus: () => true
                    });
                    
                    if (response.status === 200) {
                        unauthorizedAccess.push(adminPath);
                    }
                } catch (error) {
                    // Endpoint not available
                }
            }
            
            if (unauthorizedAccess.length > 0) {
                this.auditResults.vulnerabilities.push({
                    severity: 'critical',
                    system: endpoint.name,
                    type: 'no_authorization',
                    details: `Unauthorized access to: ${unauthorizedAccess.join(', ')}`
                });
                console.log(`  🚨 ${endpoint.name}: Unauthorized access possible!`);
            } else {
                this.securityChecks.authorization++;
                console.log(`  ✅ ${endpoint.name}: Authorization properly configured`);
            }
        }
    }
    
    async auditInputValidation() {
        console.log('\n\n💉 PHASE 5: Input Validation Audit');
        console.log('==================================');
        
        // Test for SQL injection
        console.log('\n🗃️ Testing for SQL injection vulnerabilities...');
        
        const sqlInjectionPayloads = [
            "' OR '1'='1",
            "1; DROP TABLE users--",
            "1' UNION SELECT * FROM users--",
            "admin'--"
        ];
        
        for (const endpoint of this.endpoints) {
            if (!this.auditResults.systems[endpoint.name]?.exposed) continue;
            
            let sqlVulnerable = false;
            
            for (const payload of sqlInjectionPayloads) {
                try {
                    const response = await axios.post(`${endpoint.url}/api/game/action`, {
                        action: 'test',
                        data: { input: payload }
                    }, {
                        timeout: 3000,
                        validateStatus: () => true
                    });
                    
                    // Check if error message reveals SQL structure
                    if (response.data && typeof response.data === 'string') {
                        if (response.data.includes('SQL') || response.data.includes('syntax')) {
                            sqlVulnerable = true;
                            break;
                        }
                    }
                } catch (error) {
                    // Request failed
                }
            }
            
            if (sqlVulnerable) {
                this.auditResults.vulnerabilities.push({
                    severity: 'critical',
                    system: endpoint.name,
                    type: 'sql_injection',
                    details: 'Potential SQL injection vulnerability detected'
                });
                console.log(`  🚨 ${endpoint.name}: Potential SQL injection vulnerability!`);
            }
        }
        
        // Test for XSS
        console.log('\n🌐 Testing for XSS vulnerabilities...');
        
        const xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")'
        ];
        
        for (const endpoint of this.endpoints) {
            if (!this.auditResults.systems[endpoint.name]?.exposed) continue;
            
            for (const payload of xssPayloads) {
                try {
                    const response = await axios.post(`${endpoint.url}/api/broadcast`, {
                        message: payload,
                        layer: 'test'
                    }, {
                        timeout: 3000,
                        validateStatus: () => true
                    });
                    
                    // Check if payload is returned unescaped
                    if (response.data && JSON.stringify(response.data).includes(payload)) {
                        this.auditResults.vulnerabilities.push({
                            severity: 'high',
                            system: endpoint.name,
                            type: 'xss',
                            details: 'XSS payload not properly escaped'
                        });
                        console.log(`  🚨 ${endpoint.name}: XSS vulnerability detected!`);
                        break;
                    }
                } catch (error) {
                    // Request failed
                }
            }
        }
        
        this.securityChecks.inputValidation++;
    }
    
    async auditConfigurationSecurity() {
        console.log('\n\n⚙️ PHASE 6: Configuration Security Audit');
        console.log('========================================');
        
        // Check for exposed configuration files
        console.log('\n📁 Checking for exposed configuration files...');
        
        const configFiles = [
            '.env',
            'config.json',
            'database.yml',
            'secrets.json',
            'credentials.json'
        ];
        
        for (const file of configFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                // Check for sensitive data in config files
                if (content.includes('password') || content.includes('secret') || content.includes('key')) {
                    this.auditResults.exposures.push({
                        type: 'config_file',
                        file: file,
                        severity: 'critical'
                    });
                    console.log(`  🚨 Sensitive data found in ${file}`);
                }
            }
        }
        
        // Check environment variables
        console.log('\n🔐 Checking environment variables...');
        
        const sensitiveEnvVars = [
            'API_KEY',
            'SECRET_KEY',
            'DATABASE_PASSWORD',
            'JWT_SECRET'
        ];
        
        for (const envVar of sensitiveEnvVars) {
            if (process.env[envVar]) {
                console.log(`  ⚠️ Sensitive environment variable exposed: ${envVar}`);
                this.auditResults.recommendations.push({
                    type: 'environment',
                    recommendation: `Move ${envVar} to secure secret management`
                });
            }
        }
    }
    
    async auditDependencies() {
        console.log('\n\n📦 PHASE 7: Dependency Security Audit');
        console.log('=====================================');
        
        try {
            console.log('\n🔍 Running npm audit...');
            const npmAudit = execSync('npm audit --json', { encoding: 'utf8' });
            const auditData = JSON.parse(npmAudit);
            
            if (auditData.metadata.vulnerabilities) {
                const vulns = auditData.metadata.vulnerabilities;
                const total = vulns.total || 0;
                
                if (total > 0) {
                    this.auditResults.vulnerabilities.push({
                        severity: 'high',
                        system: 'dependencies',
                        type: 'vulnerable_packages',
                        details: `${total} vulnerabilities found (Critical: ${vulns.critical || 0}, High: ${vulns.high || 0})`
                    });
                    console.log(`  🚨 Found ${total} vulnerable dependencies!`);
                } else {
                    console.log('  ✅ No vulnerable dependencies found');
                }
            }
        } catch (error) {
            console.log('  ⚠️ Could not run npm audit');
        }
    }
    
    async auditCodeSecurity() {
        console.log('\n\n🔍 PHASE 8: Code Security Audit');
        console.log('================================');
        
        // Check for hardcoded secrets in code
        console.log('\n🔑 Scanning for hardcoded secrets...');
        
        const codePatterns = [
            { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded_api_key' },
            { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded_password' },
            { pattern: /secret\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded_secret' }
        ];
        
        const jsFiles = this.findFiles('.', '.js');
        let secretsFound = 0;
        
        for (const file of jsFiles.slice(0, 20)) { // Limit to 20 files for performance
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                for (const { pattern, type } of codePatterns) {
                    if (pattern.test(content)) {
                        secretsFound++;
                        this.auditResults.exposures.push({
                            type: type,
                            file: file,
                            severity: 'critical'
                        });
                        break;
                    }
                }
            } catch (error) {
                // Could not read file
            }
        }
        
        if (secretsFound > 0) {
            console.log(`  🚨 Found ${secretsFound} files with potential hardcoded secrets!`);
        } else {
            console.log('  ✅ No hardcoded secrets found in sampled files');
        }
    }
    
    findFiles(dir, extension) {
        const files = [];
        
        try {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                if (item.startsWith('.') || item === 'node_modules') continue;
                
                const fullPath = `${dir}/${item}`;
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    files.push(...this.findFiles(fullPath, extension));
                } else if (item.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return files;
    }
    
    generateSecurityReport() {
        console.log('\n\n📊 SECURITY AUDIT REPORT');
        console.log('========================\n');
        
        // Calculate security score
        const totalChecks = Object.keys(this.securityChecks).length;
        const passedChecks = Object.values(this.securityChecks).reduce((a, b) => a + b, 0);
        const score = Math.round((passedChecks / totalChecks) * 100);
        
        this.auditResults.overallScore = score;
        this.auditResults.status = 'completed';
        
        // Summary
        console.log(`🛡️ Overall Security Score: ${score}%`);
        console.log(`✅ Passed Checks: ${passedChecks}/${totalChecks}`);
        console.log(`🚨 Vulnerabilities Found: ${this.auditResults.vulnerabilities.length}`);
        console.log(`⚠️ Data Exposures: ${this.auditResults.exposures.length}`);
        
        // Critical vulnerabilities
        const criticalVulns = this.auditResults.vulnerabilities.filter(v => v.severity === 'critical');
        if (criticalVulns.length > 0) {
            console.log('\n🚨 CRITICAL VULNERABILITIES:');
            criticalVulns.forEach(vuln => {
                console.log(`  - ${vuln.system}: ${vuln.type} - ${vuln.details}`);
            });
        }
        
        // Recommendations
        console.log('\n📋 RECOMMENDATIONS:');
        const recommendations = [
            'Implement authentication on all API endpoints',
            'Add rate limiting to prevent abuse',
            'Use HTTPS instead of HTTP for all services',
            'Implement proper CORS policies (not wildcard)',
            'Add security headers to all responses',
            'Validate and sanitize all user inputs',
            'Use environment variables for sensitive data',
            'Regular security audits and dependency updates',
            'Implement logging and monitoring',
            'Use secure session management'
        ];
        
        recommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. ${rec}`);
            this.auditResults.recommendations.push({ priority: i + 1, recommendation: rec });
        });
        
        fs.writeFileSync('security-audit-report.json', JSON.stringify(this.auditResults, null, 2));
        console.log('\n📄 Detailed report saved to security-audit-report.json');
        
        // Final verdict
        console.log('\n' + '='.repeat(50));
        if (score >= 80) {
            console.log('✅ SECURITY STATUS: GOOD');
            console.log('Minor improvements recommended.');
        } else if (score >= 60) {
            console.log('⚠️ SECURITY STATUS: NEEDS IMPROVEMENT');
            console.log('Several security issues need attention.');
        } else {
            console.log('🚨 SECURITY STATUS: CRITICAL');
            console.log('Major security vulnerabilities detected!');
            console.log('Immediate action required.');
        }
        console.log('='.repeat(50));
    }
}

// Run security audit if called directly
if (require.main === module) {
    console.log('🔒 Starting External Security Audit...\n');
    
    const audit = new ExternalSecurityAudit();
    
    audit.runFullSecurityAudit().then(() => {
        console.log('\n✅ Security audit complete!');
        process.exit(0);
    }).catch((error) => {
        console.error('\n❌ Security audit failed:', error);
        process.exit(1);
    });
}

module.exports = ExternalSecurityAudit;
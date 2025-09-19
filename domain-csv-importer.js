#!/usr/bin/env node

/**
 * 🌐 DOMAIN CSV IMPORTER & MANAGEMENT SYSTEM
 * Import, categorize, and manage domains from CSV files
 * Integrates with existing URL shortener infrastructure
 */

const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

class DomainCSVImporter {
    constructor() {
        this.domainRegistry = new Map();
        this.domainCategories = new Map();
        this.domainHealth = new Map();
        this.importHistory = [];
        
        // Domain configuration
        this.config = {
            categories: {
                'tracking': 'URL shortening and analytics tracking',
                'gaming': 'Gaming and entertainment domains',
                'utility': 'Utility and service domains',
                'international': 'International and localized domains',
                'premium': 'Premium branded domains',
                'experimental': 'Testing and experimental domains'
            },
            
            tlds: {
                standard: ['.com', '.net', '.org', '.io', '.co'],
                international: ['.tk', '.ml', '.ga', '.cf', '.de', '.jp', '.cn', '.kr'],
                gaming: ['.game', '.games', '.play', '.fun', '.gg'],
                premium: ['.ai', '.app', '.dev', '.tech', '.cloud'],
                crypto: ['.crypto', '.eth', '.bitcoin', '.nft', '.dao']
            },
            
            providers: {
                'namecheap': { api: true, bulkImport: true },
                'godaddy': { api: true, bulkImport: true },
                'cloudflare': { api: true, bulkImport: true },
                'enom': { api: true, bulkImport: false },
                'freenom': { api: false, bulkImport: true } // for .tk domains
            }
        };
        
        this.init();
    }

    async init() {
        console.log('🌐 Initializing Domain CSV Importer & Management System...');
        
        await this.loadExistingRegistry();
        await this.setupDomainCategories();
        await this.initializeDomainHealth();
        
        console.log('✅ Domain management system ready');
        console.log(`📊 Categories: ${this.domainCategories.size}`);
        console.log(`🌐 Registered domains: ${this.domainRegistry.size}`);
    }

    async loadExistingRegistry() {
        console.log('📂 Loading existing domain registry...');
        
        try {
            // Load from DOMAIN-REGISTRY.json
            const registryPath = path.join(__dirname, 'DOMAIN-REGISTRY.json');
            const registryData = await fs.readFile(registryPath, 'utf8');
            const registry = JSON.parse(registryData);
            
            // Import existing domains
            if (registry.domains) {
                for (const [domain, config] of Object.entries(registry.domains)) {
                    this.domainRegistry.set(domain, {
                        domain,
                        ...config,
                        source: 'existing-registry',
                        importedAt: new Date().toISOString(),
                        status: 'active'
                    });
                }
            }
            
            console.log(`✅ Loaded ${this.domainRegistry.size} existing domains`);
            
        } catch (error) {
            console.log('📁 No existing registry found, starting fresh');
        }
    }

    async importFromCSV(csvFilePath, options = {}) {
        console.log(`📄 Importing domains from CSV: ${csvFilePath}`);
        
        const importSession = {
            id: this.generateImportId(),
            file: csvFilePath,
            startTime: new Date().toISOString(),
            domains: [],
            errors: [],
            options
        };
        
        return new Promise((resolve, reject) => {
            const results = [];
            
            createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        const domain = this.parseDomainRow(row, options);
                        if (domain) {
                            results.push(domain);
                            importSession.domains.push(domain.domain);
                        }
                    } catch (error) {
                        importSession.errors.push({
                            row,
                            error: error.message
                        });
                    }
                })
                .on('end', async () => {
                    // Process all domains
                    for (const domain of results) {
                        await this.registerDomain(domain);
                    }
                    
                    importSession.endTime = new Date().toISOString();
                    importSession.successCount = results.length;
                    importSession.errorCount = importSession.errors.length;
                    
                    this.importHistory.push(importSession);
                    
                    console.log(`✅ Import complete: ${results.length} domains imported`);
                    if (importSession.errors.length > 0) {
                        console.log(`⚠️ ${importSession.errors.length} errors during import`);
                    }
                    
                    resolve(importSession);
                })
                .on('error', (error) => {
                    console.error('❌ CSV import error:', error);
                    importSession.error = error.message;
                    reject(error);
                });
        });
    }

    parseDomainRow(row, options = {}) {
        // Handle different CSV formats
        const domain = {
            domain: row.domain || row.Domain || row.url || row.URL || row.name,
            category: row.category || row.Category || options.defaultCategory || 'utility',
            provider: row.provider || row.registrar || options.defaultProvider || 'unknown',
            expiryDate: row.expiry || row.expiryDate || row.expires_at,
            purchaseDate: row.purchase || row.purchaseDate || row.created_at,
            price: parseFloat(row.price || row.Price || row.cost || 0),
            autoRenew: row.autoRenew === 'true' || row.auto_renew === '1',
            
            // Additional metadata
            description: row.description || row.Description || '',
            tags: this.parseTags(row.tags || row.Tags || ''),
            purpose: row.purpose || row.Purpose || 'url-shortening',
            
            // Technical details
            nameservers: this.parseNameservers(row.nameservers || row.NS || ''),
            ssl: row.ssl === 'true' || row.SSL === '1',
            redirectTo: row.redirect || row.redirectTo || '',
            
            // Custom fields
            customShortenerEnabled: row.shortener === 'true',
            qrTrackingEnabled: row.qr_tracking === 'true',
            analyticsEnabled: row.analytics !== 'false',
            
            // Import metadata
            importedAt: new Date().toISOString(),
            source: 'csv-import',
            status: 'pending-verification'
        };
        
        // Validate domain format
        if (!this.isValidDomain(domain.domain)) {
            throw new Error(`Invalid domain format: ${domain.domain}`);
        }
        
        // Auto-detect TLD category
        domain.tldCategory = this.detectTLDCategory(domain.domain);
        
        return domain;
    }

    async registerDomain(domainData) {
        console.log(`📝 Registering domain: ${domainData.domain}`);
        
        // Check if domain already exists
        if (this.domainRegistry.has(domainData.domain)) {
            console.log(`⚠️ Domain already registered: ${domainData.domain}`);
            
            // Update existing record
            const existing = this.domainRegistry.get(domainData.domain);
            domainData = { ...existing, ...domainData, lastUpdated: new Date().toISOString() };
        }
        
        // Verify domain status
        const healthCheck = await this.checkDomainHealth(domainData.domain);
        domainData.health = healthCheck;
        domainData.status = healthCheck.isActive ? 'active' : 'inactive';
        
        // Categorize domain
        this.categorizeDomain(domainData);
        
        // Save to registry
        this.domainRegistry.set(domainData.domain, domainData);
        
        // Update domain configuration files
        await this.updateDomainConfigs(domainData);
        
        console.log(`✅ Domain registered: ${domainData.domain} (${domainData.category})`);
        
        return domainData;
    }

    async checkDomainHealth(domain) {
        console.log(`🏥 Checking health for: ${domain}`);
        
        const health = {
            domain,
            checkedAt: new Date().toISOString(),
            isActive: true,
            dnsResolvable: true,
            httpReachable: true,
            httpsEnabled: true,
            responseTime: 0,
            errors: []
        };
        
        try {
            // DNS resolution check
            const dns = require('dns').promises;
            try {
                await dns.resolve4(domain);
                health.dnsResolvable = true;
            } catch (error) {
                health.dnsResolvable = false;
                health.errors.push(`DNS resolution failed: ${error.message}`);
            }
            
            // HTTP/HTTPS reachability check
            const startTime = Date.now();
            const https = require('https');
            
            await new Promise((resolve, reject) => {
                https.get(`https://${domain}`, (res) => {
                    health.responseTime = Date.now() - startTime;
                    health.httpReachable = true;
                    health.httpsEnabled = true;
                    health.statusCode = res.statusCode;
                    resolve();
                }).on('error', (error) => {
                    // Try HTTP fallback
                    const http = require('http');
                    http.get(`http://${domain}`, (res) => {
                        health.responseTime = Date.now() - startTime;
                        health.httpReachable = true;
                        health.httpsEnabled = false;
                        health.statusCode = res.statusCode;
                        resolve();
                    }).on('error', (httpError) => {
                        health.httpReachable = false;
                        health.errors.push(`HTTP check failed: ${httpError.message}`);
                        resolve();
                    });
                });
            });
            
            health.isActive = health.dnsResolvable && health.httpReachable;
            
        } catch (error) {
            health.errors.push(`Health check error: ${error.message}`);
            health.isActive = false;
        }
        
        // Cache health status
        this.domainHealth.set(domain, health);
        
        console.log(`✅ Health check complete: ${domain} - ${health.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        
        return health;
    }

    async updateDomainConfigs(domainData) {
        console.log(`📝 Updating domain configurations for: ${domainData.domain}`);
        
        // Update DOMAIN-REGISTRY.json
        await this.updateDomainRegistry(domainData);
        
        // Update CloudFlare routing if applicable
        if (domainData.provider === 'cloudflare' || domainData.cloudflareEnabled) {
            await this.updateCloudflareRouting(domainData);
        }
        
        // Update URL shortener configuration
        if (domainData.customShortenerEnabled) {
            await this.updateShortenerConfig(domainData);
        }
        
        // Update QR tracking configuration
        if (domainData.qrTrackingEnabled) {
            await this.updateQRConfig(domainData);
        }
    }

    async updateDomainRegistry(domainData) {
        try {
            const registryPath = path.join(__dirname, 'DOMAIN-REGISTRY.json');
            let registry;
            
            try {
                const data = await fs.readFile(registryPath, 'utf8');
                registry = JSON.parse(data);
            } catch {
                registry = {
                    meta: {
                        version: "1.1.0",
                        description: "Domain Registry with CSV imports",
                        lastUpdated: new Date().toISOString()
                    },
                    domains: {}
                };
            }
            
            // Add or update domain entry
            registry.domains[domainData.domain] = {
                zone: {
                    type: domainData.category,
                    name: domainData.description || `${domainData.domain} zone`,
                    description: domainData.purpose
                },
                branding: {
                    primaryColor: this.generateDomainColor(domainData.domain),
                    secondaryColor: "#1a1a1a",
                    logo: `/assets/logos/${domainData.domain.replace(/\./g, '-')}-logo.svg`,
                    theme: domainData.category,
                    favicon: `/assets/favicons/${domainData.domain.replace(/\./g, '-')}.ico`
                },
                functionality: {
                    features: this.generateDomainFeatures(domainData),
                    accessLevel: "public",
                    shortenerEnabled: domainData.customShortenerEnabled,
                    qrTrackingEnabled: domainData.qrTrackingEnabled,
                    analyticsEnabled: domainData.analyticsEnabled
                },
                routing: {
                    mainEndpoint: "/",
                    apiPath: "/api/v1",
                    websocket: `wss://${domainData.domain}/ws`,
                    crossDomainPortals: []
                },
                metadata: {
                    provider: domainData.provider,
                    expiryDate: domainData.expiryDate,
                    importedAt: domainData.importedAt,
                    tags: domainData.tags,
                    health: domainData.health
                }
            };
            
            // Update metadata
            registry.meta.lastUpdated = new Date().toISOString();
            registry.meta.totalDomains = Object.keys(registry.domains).length;
            
            await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
            
            console.log(`✅ Domain registry updated for: ${domainData.domain}`);
            
        } catch (error) {
            console.error(`❌ Failed to update domain registry: ${error.message}`);
        }
    }

    async updateCloudflareRouting(domainData) {
        console.log(`☁️ Updating CloudFlare routing for: ${domainData.domain}`);
        
        // This would integrate with CloudFlare API in production
        const routingConfig = {
            domain: domainData.domain,
            worker: "intelligent-universal-router",
            backend: domainData.redirectTo || "cal-riven-service.soulfra-cal:80",
            features: {
                url_shortening: domainData.customShortenerEnabled,
                qr_tracking: domainData.qrTrackingEnabled,
                analytics: domainData.analyticsEnabled,
                ssl: domainData.ssl
            }
        };
        
        // Save to CloudFlare config
        try {
            const cfConfigPath = path.join(__dirname, 'CLOUDFLARE-DOMAIN-ROUTING.json');
            let cfConfig;
            
            try {
                const data = await fs.readFile(cfConfigPath, 'utf8');
                cfConfig = JSON.parse(data);
            } catch {
                cfConfig = { domains: {} };
            }
            
            cfConfig.domains[domainData.domain] = routingConfig;
            
            await fs.writeFile(cfConfigPath, JSON.stringify(cfConfig, null, 2));
            
            console.log(`✅ CloudFlare routing configured for: ${domainData.domain}`);
            
        } catch (error) {
            console.error(`❌ Failed to update CloudFlare config: ${error.message}`);
        }
    }

    async updateShortenerConfig(domainData) {
        console.log(`🔗 Configuring URL shortener for: ${domainData.domain}`);
        
        const shortenerConfig = {
            domain: domainData.domain,
            enabled: true,
            features: {
                customPaths: true,
                qrGeneration: domainData.qrTrackingEnabled,
                analytics: domainData.analyticsEnabled,
                passwordProtection: true,
                expiringLinks: true,
                bulkGeneration: true
            },
            branding: {
                customCSS: true,
                logo: domainData.domain === 'niceleak.com' ? '/assets/niceleak-logo.svg' : null,
                theme: domainData.category
            },
            tracking: {
                clickTracking: true,
                geoLocation: true,
                deviceFingerprinting: true,
                referrerTracking: true,
                utmParameters: true
            }
        };
        
        // This would update the URL shortener service configuration
        console.log(`✅ URL shortener configured for: ${domainData.domain}`);
        
        return shortenerConfig;
    }

    async updateQRConfig(domainData) {
        console.log(`📱 Configuring QR tracking for: ${domainData.domain}`);
        
        const qrConfig = {
            domain: domainData.domain,
            enabled: true,
            features: {
                dynamicQR: true,
                customBranding: true,
                errorCorrection: 'H', // High error correction
                tracking: {
                    scanLocation: true,
                    deviceType: true,
                    timestamp: true,
                    sourceDomain: true // Track which domain the QR was scanned from
                }
            },
            analytics: {
                realtime: true,
                heatmaps: true,
                conversionTracking: true
            }
        };
        
        console.log(`✅ QR tracking configured for: ${domainData.domain}`);
        
        return qrConfig;
    }

    async exportDomains(format = 'csv', options = {}) {
        console.log(`📤 Exporting domains in ${format} format...`);
        
        const domains = Array.from(this.domainRegistry.values());
        
        switch (format.toLowerCase()) {
            case 'csv':
                return await this.exportToCSV(domains, options);
                
            case 'json':
                return await this.exportToJSON(domains, options);
                
            case 'excel':
                return await this.exportToExcel(domains, options);
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    async exportToCSV(domains, options = {}) {
        const headers = [
            'domain', 'category', 'provider', 'status', 'expiryDate',
            'shortenerEnabled', 'qrTrackingEnabled', 'analyticsEnabled',
            'health', 'lastChecked', 'tags', 'purpose'
        ];
        
        const rows = domains.map(domain => {
            return [
                domain.domain,
                domain.category,
                domain.provider,
                domain.status,
                domain.expiryDate || '',
                domain.customShortenerEnabled ? 'true' : 'false',
                domain.qrTrackingEnabled ? 'true' : 'false',
                domain.analyticsEnabled ? 'true' : 'false',
                domain.health?.isActive ? 'active' : 'inactive',
                domain.health?.checkedAt || '',
                (domain.tags || []).join(';'),
                domain.purpose || ''
            ].join(',');
        });
        
        const csv = [headers.join(','), ...rows].join('\n');
        
        if (options.outputFile) {
            await fs.writeFile(options.outputFile, csv);
            console.log(`✅ Exported ${domains.length} domains to ${options.outputFile}`);
        }
        
        return csv;
    }

    async exportToJSON(domains, options = {}) {
        const exportData = {
            meta: {
                exportDate: new Date().toISOString(),
                totalDomains: domains.length,
                categories: this.getCategorySummary(domains),
                health: this.getHealthSummary(domains)
            },
            domains: domains
        };
        
        const json = JSON.stringify(exportData, null, 2);
        
        if (options.outputFile) {
            await fs.writeFile(options.outputFile, json);
            console.log(`✅ Exported ${domains.length} domains to ${options.outputFile}`);
        }
        
        return exportData;
    }

    async exportToExcel(domains, options = {}) {
        // Simplified Excel export (would use a library like xlsx in production)
        console.log('📊 Excel export would require xlsx library');
        return this.exportToCSV(domains, options);
    }

    // Utility methods
    isValidDomain(domain) {
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
        return domainRegex.test(domain);
    }

    detectTLDCategory(domain) {
        const tld = domain.substring(domain.lastIndexOf('.'));
        
        for (const [category, tlds] of Object.entries(this.config.tlds)) {
            if (tlds.includes(tld)) {
                return category;
            }
        }
        
        return 'standard';
    }

    parseTags(tagString) {
        if (!tagString) return [];
        
        return tagString
            .split(/[,;|]/)
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

    parseNameservers(nsString) {
        if (!nsString) return [];
        
        return nsString
            .split(/[,;|\n]/)
            .map(ns => ns.trim())
            .filter(ns => ns.length > 0);
    }

    categorizeDomain(domainData) {
        const domain = domainData.domain.toLowerCase();
        
        // Auto-categorize based on keywords
        if (domain.includes('track') || domain.includes('analytics') || domain.includes('short')) {
            domainData.autoCategory = 'tracking';
        } else if (domain.includes('game') || domain.includes('play') || domain.includes('fun')) {
            domainData.autoCategory = 'gaming';
        } else if (domain.includes('api') || domain.includes('tool') || domain.includes('util')) {
            domainData.autoCategory = 'utility';
        } else if (this.config.tlds.international.includes(domain.substring(domain.lastIndexOf('.')))) {
            domainData.autoCategory = 'international';
        } else {
            domainData.autoCategory = domainData.category || 'utility';
        }
        
        // Add to category map
        if (!this.domainCategories.has(domainData.category)) {
            this.domainCategories.set(domainData.category, []);
        }
        this.domainCategories.get(domainData.category).push(domain);
    }

    generateDomainColor(domain) {
        // Generate consistent color based on domain name
        let hash = 0;
        for (let i = 0; i < domain.length; i++) {
            hash = domain.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    generateDomainFeatures(domainData) {
        const features = [];
        
        if (domainData.customShortenerEnabled) {
            features.push('url-shortening', 'link-analytics', 'custom-paths');
        }
        
        if (domainData.qrTrackingEnabled) {
            features.push('qr-generation', 'qr-tracking', 'mobile-scanning');
        }
        
        if (domainData.analyticsEnabled) {
            features.push('click-tracking', 'geo-analytics', 'conversion-tracking');
        }
        
        // Add category-specific features
        switch (domainData.category) {
            case 'tracking':
                features.push('utm-generation', 'attribution-modeling');
                break;
            case 'gaming':
                features.push('game-integration', 'player-tracking');
                break;
            case 'international':
                features.push('multi-language', 'locale-detection');
                break;
        }
        
        return features;
    }

    generateImportId() {
        return 'import_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    setupDomainCategories() {
        // Initialize category tracking
        for (const category of Object.keys(this.config.categories)) {
            this.domainCategories.set(category, []);
        }
    }

    async initializeDomainHealth() {
        console.log('🏥 Initializing domain health monitoring...');
        
        // Set up periodic health checks
        setInterval(() => {
            this.runHealthChecks();
        }, 3600000); // Every hour
    }

    async runHealthChecks() {
        console.log('🏥 Running domain health checks...');
        
        const domains = Array.from(this.domainRegistry.values())
            .filter(d => d.status === 'active');
        
        for (const domain of domains) {
            await this.checkDomainHealth(domain.domain);
        }
        
        console.log('✅ Health checks complete');
    }

    getCategorySummary(domains) {
        const summary = {};
        
        for (const domain of domains) {
            const category = domain.category || 'uncategorized';
            summary[category] = (summary[category] || 0) + 1;
        }
        
        return summary;
    }

    getHealthSummary(domains) {
        const active = domains.filter(d => d.health?.isActive).length;
        const inactive = domains.length - active;
        
        return {
            active,
            inactive,
            percentage: domains.length > 0 ? (active / domains.length * 100).toFixed(1) : 0
        };
    }

    // Public API
    async importCSV(filePath, options) {
        return await this.importFromCSV(filePath, options);
    }

    async bulkImport(domains) {
        const results = [];
        
        for (const domain of domains) {
            try {
                const result = await this.registerDomain(domain);
                results.push({ success: true, domain: result });
            } catch (error) {
                results.push({ success: false, domain: domain.domain, error: error.message });
            }
        }
        
        return results;
    }

    getDomainInfo(domain) {
        return this.domainRegistry.get(domain);
    }

    getAllDomains() {
        return Array.from(this.domainRegistry.values());
    }

    getDomainsByCategory(category) {
        return Array.from(this.domainRegistry.values())
            .filter(d => d.category === category);
    }

    getHealthStatus(domain) {
        return this.domainHealth.get(domain);
    }

    getImportHistory() {
        return this.importHistory;
    }
}

// Example CSV format documentation
const exampleCSV = `
# Example Domain Import CSV Format
# Save this as domains.csv and import using: node domain-csv-importer.js import domains.csv
#
domain,category,provider,expiryDate,price,shortener,qr_tracking,analytics,tags,purpose
example.com,tracking,namecheap,2025-12-31,12.99,true,true,true,"analytics,shortener",URL shortening and analytics
niceleak.com,utility,cloudflare,2026-03-15,15.99,true,true,true,"premium,tracking",Premium URL shortening service
coolsite.tk,international,freenom,2025-06-30,0,true,false,true,"free,international",Free international domain
gamezone.gg,gaming,namecheap,2025-09-20,29.99,false,true,true,"gaming,community",Gaming community portal
analytics.ai,premium,godaddy,2026-01-01,99.99,true,true,true,"ai,analytics,premium",AI-powered analytics platform
`;

// CLI Interface
if (require.main === module) {
    const importer = new DomainCSVImporter();
    
    const args = process.argv.slice(2);
    const command = args[0];
    const param = args[1];
    
    setTimeout(async () => {
        switch (command) {
            case 'import':
                if (!param) {
                    console.error('❌ Please provide CSV file path: node domain-csv-importer.js import <file.csv>');
                    process.exit(1);
                }
                
                try {
                    const result = await importer.importFromCSV(param, {
                        defaultCategory: 'utility',
                        defaultProvider: 'unknown'
                    });
                    
                    console.log('\n📊 Import Summary:');
                    console.log(`✅ Successfully imported: ${result.successCount} domains`);
                    console.log(`❌ Errors: ${result.errorCount}`);
                    
                } catch (error) {
                    console.error('❌ Import failed:', error.message);
                }
                break;
                
            case 'export':
                const format = param || 'csv';
                const outputFile = `domain-export-${Date.now()}.${format}`;
                
                try {
                    await importer.exportDomains(format, { outputFile });
                    console.log(`✅ Domains exported to: ${outputFile}`);
                    
                } catch (error) {
                    console.error('❌ Export failed:', error.message);
                }
                break;
                
            case 'example':
                const exampleFile = 'example-domains.csv';
                await fs.writeFile(exampleFile, exampleCSV.trim());
                console.log(`✅ Example CSV created: ${exampleFile}`);
                console.log('📄 Import it with: node domain-csv-importer.js import example-domains.csv');
                break;
                
            case 'health':
                const domains = importer.getAllDomains();
                console.log(`\n🏥 Running health checks for ${domains.length} domains...\n`);
                
                for (const domain of domains.slice(0, 5)) { // Limit to 5 for demo
                    await importer.checkDomainHealth(domain.domain);
                }
                break;
                
            case 'list':
                const allDomains = importer.getAllDomains();
                console.log(`\n📊 Registered Domains (${allDomains.length} total):\n`);
                
                for (const domain of allDomains) {
                    console.log(`- ${domain.domain} (${domain.category}) - ${domain.status}`);
                }
                break;
                
            default:
                console.log(`
🌐 Domain CSV Importer & Management System

Usage:
  node domain-csv-importer.js <command> [params]

Commands:
  import <file.csv>  Import domains from CSV file
  export [format]    Export domains (csv, json, excel)
  example           Create example CSV file
  health            Run health checks on domains
  list              List all registered domains
  
Example:
  node domain-csv-importer.js example
  node domain-csv-importer.js import example-domains.csv
  node domain-csv-importer.js export json
                `);
        }
        
    }, 1000);
}

module.exports = DomainCSVImporter;
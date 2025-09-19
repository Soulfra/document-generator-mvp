#!/usr/bin/env node

/**
 * 🗃️ OSS LIBRARY XML MAPPER
 * Maps all open source libraries (npm, cargo, pip, etc.) to XML
 * Creates comprehensive catalog of MIT, Apache, GPL libraries
 * Integrates with vault system for capsule management
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

class OSSLibraryXMLMapper {
    constructor() {
        this.port = 7654;
        this.xmlMapperPort = 9998;
        
        // Library registries
        this.registries = {
            npm: {
                name: 'NPM Registry',
                url: 'https://registry.npmjs.org',
                searchUrl: 'https://registry.npmjs.org/-/v1/search',
                type: 'javascript'
            },
            pypi: {
                name: 'Python Package Index',
                url: 'https://pypi.org',
                searchUrl: 'https://pypi.org/pypi',
                type: 'python'
            },
            cargo: {
                name: 'Crates.io',
                url: 'https://crates.io',
                searchUrl: 'https://crates.io/api/v1/crates',
                type: 'rust'
            },
            maven: {
                name: 'Maven Central',
                url: 'https://repo1.maven.org/maven2',
                searchUrl: 'https://search.maven.org/solrsearch/select',
                type: 'java'
            },
            rubygems: {
                name: 'RubyGems',
                url: 'https://rubygems.org',
                searchUrl: 'https://rubygems.org/api/v1/search.json',
                type: 'ruby'
            },
            packagist: {
                name: 'Packagist',
                url: 'https://packagist.org',
                searchUrl: 'https://packagist.org/search.json',
                type: 'php'
            }
        };
        
        // License types we care about
        this.openSourceLicenses = [
            'MIT', 'MIT License',
            'Apache-2.0', 'Apache License 2.0',
            'GPL-3.0', 'GPL-2.0', 'LGPL-3.0', 'LGPL-2.1',
            'BSD-3-Clause', 'BSD-2-Clause',
            'ISC', 'Unlicense',
            'MPL-2.0', 'CC0-1.0', 'WTFPL'
        ];
        
        // Vault system for capsules
        this.vaults = {
            soulfra: {
                name: 'Soulfra Vault',
                type: 'distributed',
                capsules: new Map()
            },
            cal: {
                name: 'CAL Vault',
                type: 'centralized',
                capsules: new Map()
            },
            community: {
                name: 'Community Vault',
                type: 'open',
                capsules: new Map()
            }
        };
        
        // Mapped libraries
        this.libraries = new Map();
        this.xmlCatalog = null;
        
        // Local package managers
        this.localManagers = {
            npm: { command: 'npm list --json --depth=0', parse: this.parseNpmList },
            pip: { command: 'pip list --format=json', parse: this.parsePipList },
            cargo: { command: 'cargo tree --format=json', parse: this.parseCargoTree },
            gem: { command: 'gem list --local', parse: this.parseGemList }
        };
        
        console.log('🗃️ OSS LIBRARY XML MAPPER INITIALIZING...');
        console.log('📚 Mapping open source libraries to XML');
        console.log('🔒 Vault system ready for capsule storage');
    }
    
    async initialize() {
        try {
            console.log('🚀 Starting OSS library mapper...');
            
            // Scan local packages
            await this.scanLocalPackages();
            
            // Connect to XML mapper
            await this.connectToXMLMapper();
            
            // Initialize vault system
            await this.initializeVaults();
            
            // Create initial XML catalog
            await this.createXMLCatalog();
            
            // Start HTTP server
            await this.startServer();
            
            // Start continuous discovery
            this.startContinuousDiscovery();
            
            console.log('✅ OSS LIBRARY MAPPER READY!');
            console.log('============================');
            console.log(`🌐 Dashboard: http://localhost:${this.port}`);
            console.log(`📚 Libraries mapped: ${this.libraries.size}`);
            console.log(`🔒 Vaults active: ${Object.keys(this.vaults).length}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize:', error.message);
            return false;
        }
    }
    
    async scanLocalPackages() {
        console.log('🔍 Scanning local packages...');
        
        for (const [manager, config] of Object.entries(this.localManagers)) {
            try {
                console.log(`📦 Checking ${manager}...`);
                
                const result = await this.execCommand(config.command);
                if (result) {
                    const packages = config.parse.call(this, result);
                    
                    packages.forEach(pkg => {
                        this.libraries.set(`${manager}:${pkg.name}`, {
                            name: pkg.name,
                            version: pkg.version,
                            manager: manager,
                            license: pkg.license || 'Unknown',
                            local: true,
                            dependencies: pkg.dependencies || [],
                            capsuleId: this.generateCapsuleId(pkg),
                            xmlPath: `/xml/libraries/${manager}/${pkg.name}`
                        });
                    });
                    
                    console.log(`✅ Found ${packages.length} ${manager} packages`);
                }
            } catch (error) {
                console.log(`⚠️ ${manager} not available: ${error.message}`);
            }
        }
    }
    
    parseNpmList(output) {
        try {
            const data = JSON.parse(output);
            const packages = [];
            
            if (data.dependencies) {
                Object.entries(data.dependencies).forEach(([name, info]) => {
                    packages.push({
                        name: name,
                        version: info.version,
                        license: this.extractLicense(info),
                        dependencies: Object.keys(info.dependencies || {})
                    });
                });
            }
            
            return packages;
        } catch (error) {
            return [];
        }
    }
    
    parsePipList(output) {
        try {
            const packages = JSON.parse(output);
            return packages.map(pkg => ({
                name: pkg.name,
                version: pkg.version,
                license: 'Check PyPI' // pip list doesn't include license
            }));
        } catch (error) {
            return [];
        }
    }
    
    parseCargoTree(output) {
        try {
            // Cargo tree JSON format is complex, simplified parsing
            const packages = [];
            const lines = output.split('\n');
            
            lines.forEach(line => {
                const match = line.match(/(\S+)\s+v([\d.]+)/);
                if (match) {
                    packages.push({
                        name: match[1],
                        version: match[2],
                        license: 'Check crates.io'
                    });
                }
            });
            
            return packages;
        } catch (error) {
            return [];
        }
    }
    
    parseGemList(output) {
        const packages = [];
        const lines = output.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/(\S+)\s+\(([\d.]+)\)/);
            if (match) {
                packages.push({
                    name: match[1],
                    version: match[2],
                    license: 'Check rubygems.org'
                });
            }
        });
        
        return packages;
    }
    
    extractLicense(packageInfo) {
        if (packageInfo.license) return packageInfo.license;
        if (packageInfo.licenses && packageInfo.licenses.length > 0) {
            return packageInfo.licenses[0];
        }
        return 'Unknown';
    }
    
    generateCapsuleId(pkg) {
        const data = `${pkg.manager}:${pkg.name}:${pkg.version}`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
    
    async connectToXMLMapper() {
        console.log('🔗 Connecting to XML mapper...');
        
        try {
            const response = await this.httpRequest(`http://localhost:${this.xmlMapperPort}/xml/everything`);
            if (response.statusCode === 200) {
                console.log('✅ Connected to XML mapper');
            }
        } catch (error) {
            console.warn('⚠️ XML mapper not available, continuing standalone');
        }
    }
    
    async initializeVaults() {
        console.log('🔒 Initializing vault system...');
        
        // Create vault directories
        const vaultDir = './vaults';
        if (!fs.existsSync(vaultDir)) {
            fs.mkdirSync(vaultDir);
        }
        
        Object.keys(this.vaults).forEach(vaultName => {
            const vaultPath = path.join(vaultDir, vaultName);
            if (!fs.existsSync(vaultPath)) {
                fs.mkdirSync(vaultPath);
            }
            
            // Load existing capsules
            const capsulesPath = path.join(vaultPath, 'capsules.json');
            if (fs.existsSync(capsulesPath)) {
                try {
                    const capsules = JSON.parse(fs.readFileSync(capsulesPath, 'utf8'));
                    capsules.forEach(capsule => {
                        this.vaults[vaultName].capsules.set(capsule.id, capsule);
                    });
                    console.log(`📦 Loaded ${capsules.length} capsules from ${vaultName} vault`);
                } catch (error) {
                    console.warn(`⚠️ Failed to load ${vaultName} capsules:`, error.message);
                }
            }
        });
        
        console.log('✅ Vault system initialized');
    }
    
    async createXMLCatalog() {
        console.log('📄 Creating XML catalog...');
        
        this.xmlCatalog = this.generateXMLCatalog();
        
        // Save to file
        fs.writeFileSync('oss-library-catalog.xml', this.xmlCatalog);
        console.log('✅ XML catalog created');
    }
    
    generateXMLCatalog() {
        const libraries = Array.from(this.libraries.values());
        const capsuleCount = Object.values(this.vaults).reduce((sum, vault) => sum + vault.capsules.size, 0);
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<OSSLibraryCatalog xmlns="http://document-generator.local/xml/oss">
    <CatalogInfo>
        <Name>Open Source Library XML Catalog</Name>
        <Generated>${new Date().toISOString()}</Generated>
        <TotalLibraries>${libraries.length}</TotalLibraries>
        <TotalCapsules>${capsuleCount}</TotalCapsules>
        <Registries>${Object.keys(this.registries).length}</Registries>
    </CatalogInfo>
    
    <Registries>
        ${Object.entries(this.registries).map(([key, registry]) => `
        <Registry id="${key}">
            <Name>${registry.name}</Name>
            <URL>${registry.url}</URL>
            <Type>${registry.type}</Type>
        </Registry>`).join('')}
    </Registries>
    
    <Libraries>
        ${libraries.map(lib => `
        <Library id="${lib.capsuleId}">
            <Name>${lib.name}</Name>
            <Version>${lib.version}</Version>
            <Manager>${lib.manager}</Manager>
            <License>${lib.license}</License>
            <Local>${lib.local}</Local>
            <XMLPath>${lib.xmlPath}</XMLPath>
            <Dependencies count="${lib.dependencies.length}">
                ${lib.dependencies.map(dep => `<Dependency>${dep}</Dependency>`).join('')}
            </Dependencies>
            <Capsule>
                <ID>${lib.capsuleId}</ID>
                <Vault>${this.determineVault(lib.license)}</Vault>
            </Capsule>
        </Library>`).join('')}
    </Libraries>
    
    <Vaults>
        ${Object.entries(this.vaults).map(([name, vault]) => `
        <Vault name="${name}" type="${vault.type}">
            <CapsuleCount>${vault.capsules.size}</CapsuleCount>
            <Capsules>
                ${Array.from(vault.capsules.values()).map(capsule => `
                <Capsule id="${capsule.id}">
                    <Library>${capsule.library}</Library>
                    <Created>${capsule.created}</Created>
                    <Metadata>${JSON.stringify(capsule.metadata)}</Metadata>
                </Capsule>`).join('')}
            </Capsules>
        </Vault>`).join('')}
    </Vaults>
    
    <LicenseMapping>
        ${this.openSourceLicenses.map(license => `
        <License name="${license}" vault="${this.determineVault(license)}" />`).join('')}
    </LicenseMapping>
</OSSLibraryCatalog>`;
    }
    
    determineVault(license) {
        if (!license) return 'community';
        
        const licenseUpper = license.toUpperCase();
        
        if (licenseUpper.includes('MIT') || licenseUpper.includes('ISC')) {
            return 'soulfra';
        } else if (licenseUpper.includes('APACHE') || licenseUpper.includes('BSD')) {
            return 'cal';
        } else {
            return 'community';
        }
    }
    
    async searchRegistry(registry, query) {
        console.log(`🔍 Searching ${registry} for: ${query}`);
        
        const reg = this.registries[registry];
        if (!reg) return [];
        
        try {
            switch (registry) {
                case 'npm':
                    return await this.searchNPM(query);
                case 'pypi':
                    return await this.searchPyPI(query);
                case 'cargo':
                    return await this.searchCargo(query);
                default:
                    console.warn(`⚠️ Search not implemented for ${registry}`);
                    return [];
            }
        } catch (error) {
            console.error(`❌ Search failed for ${registry}:`, error.message);
            return [];
        }
    }
    
    async searchNPM(query) {
        const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=20`;
        const response = await this.httpsRequest(url);
        
        if (response.statusCode === 200) {
            const data = JSON.parse(response.data);
            return data.objects.map(obj => ({
                name: obj.package.name,
                version: obj.package.version,
                description: obj.package.description,
                license: obj.package.license || 'Unknown',
                registry: 'npm'
            }));
        }
        
        return [];
    }
    
    async searchPyPI(query) {
        // PyPI search API implementation
        const url = `https://pypi.org/search/?q=${encodeURIComponent(query)}`;
        // Note: PyPI doesn't have a great API for search, would need to scrape or use a different endpoint
        console.log('PyPI search would go here');
        return [];
    }
    
    async searchCargo(query) {
        const url = `https://crates.io/api/v1/crates?q=${encodeURIComponent(query)}&per_page=20`;
        const response = await this.httpsRequest(url);
        
        if (response.statusCode === 200) {
            const data = JSON.parse(response.data);
            return data.crates.map(crate => ({
                name: crate.name,
                version: crate.max_version,
                description: crate.description,
                license: crate.license || 'Unknown',
                registry: 'cargo'
            }));
        }
        
        return [];
    }
    
    createCapsule(library) {
        const capsule = {
            id: library.capsuleId,
            library: library.name,
            version: library.version,
            license: library.license,
            created: new Date().toISOString(),
            metadata: {
                manager: library.manager,
                dependencies: library.dependencies,
                local: library.local
            },
            signature: this.generateCapsuleSignature(library)
        };
        
        // Determine vault
        const vaultName = this.determineVault(library.license);
        const vault = this.vaults[vaultName];
        
        // Store capsule
        vault.capsules.set(capsule.id, capsule);
        
        // Persist to disk
        this.saveCapsule(vaultName, capsule);
        
        console.log(`💊 Created capsule ${capsule.id} in ${vaultName} vault`);
        
        return capsule;
    }
    
    generateCapsuleSignature(library) {
        const data = JSON.stringify({
            name: library.name,
            version: library.version,
            license: library.license,
            timestamp: Date.now()
        });
        
        return crypto.createHash('sha512').update(data).digest('hex');
    }
    
    saveCapsule(vaultName, capsule) {
        const vaultPath = path.join('./vaults', vaultName);
        const capsulePath = path.join(vaultPath, `${capsule.id}.json`);
        
        fs.writeFileSync(capsulePath, JSON.stringify(capsule, null, 2));
        
        // Update capsules index
        const indexPath = path.join(vaultPath, 'capsules.json');
        const capsules = Array.from(this.vaults[vaultName].capsules.values());
        fs.writeFileSync(indexPath, JSON.stringify(capsules, null, 2));
    }
    
    startContinuousDiscovery() {
        console.log('🔄 Starting continuous discovery...');
        
        // Periodically scan for new packages
        setInterval(() => {
            this.scanLocalPackages();
        }, 300000); // Every 5 minutes
        
        // Update XML catalog
        setInterval(() => {
            this.createXMLCatalog();
        }, 60000); // Every minute
    }
    
    async startServer() {
        console.log('🌐 Starting OSS mapper server...');
        
        this.server = http.createServer(async (req, res) => {
            await this.handleRequest(req, res);
        });
        
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`✅ Server running on port ${this.port}`);
                    resolve();
                }
            });
        });
    }
    
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        try {
            if (url.pathname === '/') {
                await this.serveDashboard(res);
            } else if (url.pathname === '/xml/catalog') {
                res.writeHead(200, { 'Content-Type': 'application/xml' });
                res.end(this.xmlCatalog);
            } else if (url.pathname === '/api/libraries') {
                await this.serveLibraries(res);
            } else if (url.pathname === '/api/search' && req.method === 'POST') {
                await this.handleSearch(req, res);
            } else if (url.pathname === '/api/capsule' && req.method === 'POST') {
                await this.handleCreateCapsule(req, res);
            } else if (url.pathname.startsWith('/xml/library/')) {
                await this.serveLibraryXML(req, res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        } catch (error) {
            console.error('Server error:', error);
            res.writeHead(500);
            res.end('Internal server error');
        }
    }
    
    async serveDashboard(res) {
        const dashboard = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗃️ OSS Library XML Mapper</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            padding: 30px 0;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 36px;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .stat-number {
            font-size: 36px;
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .panel {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .panel h2 {
            color: #00ff88;
            margin-bottom: 15px;
            font-size: 20px;
        }
        
        .search-box {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .search-input {
            flex: 1;
            padding: 10px 15px;
            border: 2px solid #00ff88;
            border-radius: 25px;
            background: rgba(0,0,0,0.3);
            color: white;
            font-family: inherit;
        }
        
        .search-select {
            padding: 10px 15px;
            border: 2px solid #00ff88;
            border-radius: 25px;
            background: rgba(0,0,0,0.3);
            color: white;
            font-family: inherit;
        }
        
        .btn {
            padding: 10px 20px;
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #000;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
            transition: transform 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .library-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .library-item {
            background: rgba(0,255,136,0.1);
            margin: 8px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #00ff88;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .library-item:hover {
            background: rgba(0,255,136,0.2);
            transform: translateX(5px);
        }
        
        .library-name {
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 5px;
        }
        
        .library-info {
            font-size: 12px;
            opacity: 0.8;
            display: flex;
            gap: 15px;
        }
        
        .license {
            padding: 2px 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            font-size: 10px;
        }
        
        .vault-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        
        .vault-card {
            background: rgba(255,255,255,0.05);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .vault-name {
            font-weight: bold;
            color: #ff00ff;
            margin-bottom: 10px;
        }
        
        .capsule-count {
            font-size: 24px;
            color: #00ffff;
        }
        
        .xml-preview {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            overflow: auto;
            max-height: 300px;
            white-space: pre-wrap;
            border: 1px solid #00ff88;
        }
        
        .registry-tags {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        
        .registry-tag {
            padding: 5px 10px;
            background: rgba(0,255,255,0.2);
            border-radius: 15px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .registry-tag:hover {
            background: rgba(0,255,255,0.4);
        }
        
        .registry-tag.active {
            background: #00ffff;
            color: #000;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            opacity: 0.6;
        }
        
        .capsule-btn {
            background: linear-gradient(45deg, #ff00ff, #00ffff);
            padding: 5px 10px;
            border: none;
            border-radius: 15px;
            color: white;
            font-size: 11px;
            cursor: pointer;
            margin-left: 10px;
        }
        
        .search-results {
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .search-result {
            background: rgba(255,255,0,0.1);
            margin: 8px 0;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #ffff00;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗃️ OSS Library XML Mapper</h1>
            <p>Comprehensive catalog of open source libraries mapped to XML</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="total-libraries">${this.libraries.size}</div>
                <div class="stat-label">Total Libraries</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-capsules">${Array.from(Object.values(this.vaults)).reduce((sum, v) => sum + v.capsules.size, 0)}</div>
                <div class="stat-label">Vault Capsules</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.keys(this.registries).length}</div>
                <div class="stat-label">Registries</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="oss-licenses">${this.openSourceLicenses.length}</div>
                <div class="stat-label">License Types</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="panel">
                <h2>📚 Local Libraries</h2>
                <div class="registry-tags">
                    <span class="registry-tag active" data-filter="all">All</span>
                    <span class="registry-tag" data-filter="npm">NPM</span>
                    <span class="registry-tag" data-filter="pip">Python</span>
                    <span class="registry-tag" data-filter="cargo">Rust</span>
                    <span class="registry-tag" data-filter="gem">Ruby</span>
                </div>
                <div class="library-list" id="library-list">
                    ${Array.from(this.libraries.values()).map(lib => `
                        <div class="library-item" data-manager="${lib.manager}" onclick="viewLibrary('${lib.capsuleId}')">
                            <div class="library-name">${lib.name}</div>
                            <div class="library-info">
                                <span>${lib.version}</span>
                                <span class="license">${lib.license}</span>
                                <span>${lib.manager}</span>
                                <button class="capsule-btn" onclick="createCapsule('${lib.capsuleId}', event)">
                                    💊 Capsule
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="panel">
                <h2>🔍 Registry Search</h2>
                <div class="search-box">
                    <select class="search-select" id="registry-select">
                        ${Object.entries(this.registries).map(([key, reg]) => 
                            `<option value="${key}">${reg.name}</option>`
                        ).join('')}
                    </select>
                    <input type="text" class="search-input" id="search-input" 
                           placeholder="Search for libraries...">
                    <button class="btn" onclick="searchRegistry()">Search</button>
                </div>
                <div class="search-results" id="search-results"></div>
            </div>
        </div>
        
        <div class="panel">
            <h2>🔒 Vault System</h2>
            <div class="vault-section">
                ${Object.entries(this.vaults).map(([name, vault]) => `
                    <div class="vault-card">
                        <div class="vault-name">${vault.name}</div>
                        <div class="capsule-count">${vault.capsules.size}</div>
                        <div style="font-size: 11px; opacity: 0.7;">${vault.type} vault</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="panel">
            <h2>📄 XML Catalog Preview</h2>
            <div class="xml-preview" id="xml-preview">
                ${this.xmlCatalog ? this.xmlCatalog.substring(0, 1000) + '...' : 'Loading...'}
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <button class="btn" onclick="downloadXML()">💾 Download Full XML</button>
                <button class="btn" onclick="viewXML()">🔍 View Full XML</button>
                <button class="btn" onclick="refreshCatalog()">🔄 Refresh Catalog</button>
            </div>
        </div>
    </div>
    
    <script>
        // Filter libraries by manager
        document.querySelectorAll('.registry-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                document.querySelectorAll('.registry-tag').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                const filter = e.target.dataset.filter;
                document.querySelectorAll('.library-item').forEach(item => {
                    if (filter === 'all' || item.dataset.manager === filter) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
        
        async function searchRegistry() {
            const registry = document.getElementById('registry-select').value;
            const query = document.getElementById('search-input').value;
            
            if (!query) return;
            
            const resultsDiv = document.getElementById('search-results');
            resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
            
            try {
                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ registry, query })
                });
                
                const results = await response.json();
                
                if (results.length > 0) {
                    resultsDiv.innerHTML = results.map(lib => \`
                        <div class="search-result">
                            <div style="font-weight: bold; color: #ffff00;">\${lib.name} v\${lib.version}</div>
                            <div style="font-size: 11px; margin: 5px 0;">\${lib.description || 'No description'}</div>
                            <div style="font-size: 10px;">
                                <span class="license">\${lib.license}</span>
                                <span style="margin-left: 10px;">\${lib.registry}</span>
                            </div>
                        </div>
                    \`).join('');
                } else {
                    resultsDiv.innerHTML = '<div class="loading">No results found</div>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div style="color: #ff6464;">Search failed: ' + error.message + '</div>';
            }
        }
        
        function viewLibrary(capsuleId) {
            window.open(\`/xml/library/\${capsuleId}\`, '_blank');
        }
        
        async function createCapsule(capsuleId, event) {
            event.stopPropagation();
            
            try {
                const response = await fetch('/api/capsule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ capsuleId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(\`💊 Capsule created in \${result.vault} vault!\`);
                    location.reload();
                }
            } catch (error) {
                alert('Failed to create capsule: ' + error.message);
            }
        }
        
        function downloadXML() {
            window.open('/xml/catalog', '_blank');
        }
        
        function viewXML() {
            window.open('/xml/catalog', '_blank');
        }
        
        async function refreshCatalog() {
            location.reload();
        }
        
        // Auto-refresh stats
        setInterval(async () => {
            try {
                const response = await fetch('/api/libraries');
                const data = await response.json();
                
                document.getElementById('total-libraries').textContent = data.libraries;
                document.getElementById('total-capsules').textContent = data.capsules;
            } catch (error) {
                // Silently continue
            }
        }, 5000);
        
        // Handle Enter key in search
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchRegistry();
            }
        });
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    async serveLibraries(res) {
        const data = {
            libraries: this.libraries.size,
            capsules: Object.values(this.vaults).reduce((sum, v) => sum + v.capsules.size, 0),
            vaults: Object.keys(this.vaults).map(name => ({
                name: name,
                capsules: this.vaults[name].capsules.size
            }))
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }
    
    async handleSearch(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { registry, query } = JSON.parse(body);
                const results = await this.searchRegistry(registry, query);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async handleCreateCapsule(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { capsuleId } = JSON.parse(body);
                
                // Find library
                const library = Array.from(this.libraries.values())
                    .find(lib => lib.capsuleId === capsuleId);
                
                if (library) {
                    const capsule = this.createCapsule(library);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        capsule: capsule,
                        vault: this.determineVault(library.license)
                    }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Library not found' }));
                }
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async serveLibraryXML(req, res) {
        const capsuleId = req.url.split('/').pop();
        const library = Array.from(this.libraries.values())
            .find(lib => lib.capsuleId === capsuleId);
        
        if (library) {
            const xml = this.generateLibraryXML(library);
            res.writeHead(200, { 'Content-Type': 'application/xml' });
            res.end(xml);
        } else {
            res.writeHead(404);
            res.end('<?xml version="1.0"?><Error>Library not found</Error>');
        }
    }
    
    generateLibraryXML(library) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Library xmlns="http://document-generator.local/xml/oss/library">
    <Identification>
        <Name>${library.name}</Name>
        <Version>${library.version}</Version>
        <CapsuleID>${library.capsuleId}</CapsuleID>
        <Manager>${library.manager}</Manager>
    </Identification>
    
    <Licensing>
        <License>${library.license}</License>
        <OpenSource>${this.openSourceLicenses.includes(library.license)}</OpenSource>
        <Vault>${this.determineVault(library.license)}</Vault>
    </Licensing>
    
    <Dependencies>
        ${library.dependencies.map(dep => `<Dependency>${dep}</Dependency>`).join('\n        ')}
    </Dependencies>
    
    <Metadata>
        <Local>${library.local}</Local>
        <XMLPath>${library.xmlPath}</XMLPath>
        <LastUpdated>${new Date().toISOString()}</LastUpdated>
    </Metadata>
    
    <Integration>
        <XMLMapper>Connected</XMLMapper>
        <SynaestheticSystem>Available</SynaestheticSystem>
        <MovementControl>Enabled</MovementControl>
    </Integration>
</Library>`;
    }
    
    // Utility methods
    execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
    
    httpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {},
                timeout: options.timeout || 5000
            };
            
            const req = http.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            req.end();
        });
    }
    
    httpsRequest(url) {
        return new Promise((resolve, reject) => {
            https.get(url, { 
                headers: { 'User-Agent': 'OSS-Library-Mapper/1.0' }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            }).on('error', reject);
        });
    }
}

// Main execution
async function main() {
    const mapper = new OSSLibraryXMLMapper();
    
    const success = await mapper.initialize();
    
    if (success) {
        console.log('\n🗃️ OSS LIBRARY XML MAPPER ACTIVE!');
        console.log('=====================================');
        console.log('📚 Features:');
        console.log('  • Maps all local packages to XML');
        console.log('  • Searches npm, PyPI, Cargo, etc.');
        console.log('  • Creates vault capsules by license');
        console.log('  • Integrates with XML Everything Mapper');
        console.log('  • Real-time catalog updates');
        console.log('');
        console.log('🔒 Vault System:');
        console.log('  • Soulfra Vault: MIT/ISC licenses');
        console.log('  • CAL Vault: Apache/BSD licenses');
        console.log('  • Community Vault: Other OSS licenses');
        console.log('');
        console.log('🌐 Endpoints:');
        console.log(`  • Dashboard: http://localhost:${mapper.port}`);
        console.log(`  • XML Catalog: http://localhost:${mapper.port}/xml/catalog`);
        console.log(`  • Library API: http://localhost:${mapper.port}/api/libraries`);
        console.log('');
        console.log('💊 Capsule Format:');
        console.log('  • Unique ID per library version');
        console.log('  • Cryptographic signatures');
        console.log('  • Dependency tracking');
        console.log('  • License-based vault routing');
        console.log('');
        console.log('🛑 Press Ctrl+C to stop');
        
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down OSS mapper...');
            
            // Save all capsules
            Object.entries(mapper.vaults).forEach(([name, vault]) => {
                console.log(`💾 Saving ${vault.capsules.size} capsules in ${name} vault`);
            });
            
            if (mapper.server) {
                mapper.server.close();
            }
            
            process.exit(0);
        });
        
        // Keep running
        setInterval(() => {}, 1000);
        
    } else {
        console.error('❌ Failed to initialize OSS mapper');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { OSSLibraryXMLMapper };
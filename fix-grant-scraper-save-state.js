#!/usr/bin/env node

/**
 * 🔧 FIX GRANT SCRAPER & IMPLEMENT SAVE STATE
 * ==========================================
 * This fixes the grant scraper collapse by implementing proper save states
 * and connecting it to the multi-domain system with persistent data
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

class GrantScraperRecovery {
    constructor() {
        this.pgPool = null;
        this.saveStateDb = null;
        this.recoveredData = {
            grants: [],
            applications: [],
            scraperState: null
        };
    }

    async initialize() {
        console.log('🔧 GRANT SCRAPER RECOVERY SYSTEM');
        console.log('================================');
        console.log('Fixing the grant scraper collapse issue...\n');

        // Initialize databases
        await this.initializeDatabases();
        
        // Recover existing data
        await this.recoverExistingData();
        
        // Implement save state system
        await this.implementSaveStateSystem();
        
        // Connect to multi-domain system
        await this.connectToMultiDomainSystem();
        
        console.log('\n✅ Grant scraper recovery complete!');
    }

    async initializeDatabases() {
        console.log('📊 Initializing databases with save state support...');

        // PostgreSQL for main data
        this.pgPool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/document_generator'
        });

        // Create save state tables
        await this.pgPool.query(`
            -- Grant scraper save state table
            CREATE TABLE IF NOT EXISTS grant_scraper_state (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                state_key TEXT UNIQUE NOT NULL,
                state_data JSONB NOT NULL,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                version INTEGER DEFAULT 1
            );

            -- Grant discoveries with persistence
            CREATE TABLE IF NOT EXISTS discovered_grants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                source TEXT NOT NULL,
                grant_data JSONB NOT NULL,
                match_score DECIMAL(3,2),
                discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                status TEXT DEFAULT 'discovered',
                application_id UUID
            );

            -- Generated applications with save state
            CREATE TABLE IF NOT EXISTS grant_applications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                grant_id UUID REFERENCES discovered_grants(id),
                application_data JSONB NOT NULL,
                generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                status TEXT DEFAULT 'draft',
                submission_data JSONB
            );

            -- Scraper activity log (prevents re-scraping)
            CREATE TABLE IF NOT EXISTS scraper_activity_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                source TEXT NOT NULL,
                last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                grants_found INTEGER DEFAULT 0,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT,
                UNIQUE(source)
            );
        `);

        // SQLite for local caching
        this.saveStateDb = await open({
            filename: './grant-scraper-savestate.db',
            driver: sqlite3.Database
        });

        await this.saveStateDb.exec(`
            CREATE TABLE IF NOT EXISTS local_save_state (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            );
        `);

        console.log('✅ Databases initialized with save state support');
    }

    async recoverExistingData() {
        console.log('\n🔍 Recovering existing grant scraper data...');

        // Check for existing grant scraper files
        const scraperFiles = [
            'soulfra-grant-scraper-system.js',
            'GRANT-SCRAPER-SYSTEM.html',
            'grant-scraper-state.json',
            'discovered-grants.json',
            'grant-applications.json'
        ];

        for (const file of scraperFiles) {
            if (fs.existsSync(file)) {
                console.log(`📄 Found: ${file}`);
                
                if (file.endsWith('.json')) {
                    try {
                        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                        await this.importJsonData(file, data);
                    } catch (error) {
                        console.log(`⚠️ Could not parse ${file}: ${error.message}`);
                    }
                }
            }
        }

        // Check PostgreSQL for existing data
        try {
            const existingGrants = await this.pgPool.query(
                'SELECT COUNT(*) as count FROM discovered_grants'
            );
            console.log(`📊 Existing grants in database: ${existingGrants.rows[0].count}`);

            const existingApps = await this.pgPool.query(
                'SELECT COUNT(*) as count FROM grant_applications'
            );
            console.log(`📊 Existing applications in database: ${existingApps.rows[0].count}`);
        } catch (error) {
            console.log('📊 No existing grant data in database (tables may be new)');
        }
    }

    async importJsonData(filename, data) {
        if (filename.includes('grants')) {
            // Import discovered grants
            for (const grant of (Array.isArray(data) ? data : Object.values(data))) {
                await this.pgPool.query(`
                    INSERT INTO discovered_grants (source, grant_data, match_score, discovered_at)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT DO NOTHING
                `, [
                    grant.source || 'imported',
                    JSON.stringify(grant),
                    grant.matchScore || 0,
                    grant.discovered || new Date()
                ]);
            }
            console.log(`✅ Imported ${data.length || Object.keys(data).length} grants`);
        } else if (filename.includes('applications')) {
            // Import applications
            for (const app of (Array.isArray(data) ? data : Object.values(data))) {
                await this.pgPool.query(`
                    INSERT INTO grant_applications (application_data, generated_at)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [
                    JSON.stringify(app),
                    app.generated || new Date()
                ]);
            }
            console.log(`✅ Imported ${data.length || Object.keys(data).length} applications`);
        }
    }

    async implementSaveStateSystem() {
        console.log('\n🔧 Implementing save state system...');

        // Create save state manager
        const saveStateManager = `
class GrantScraperSaveState {
    constructor(pgPool, localDb) {
        this.pg = pgPool;
        this.local = localDb;
        this.saveInterval = 30000; // Save every 30 seconds
        this.lastSave = Date.now();
    }

    async saveState(key, data) {
        // Save to PostgreSQL (persistent)
        await this.pg.query(\`
            INSERT INTO grant_scraper_state (state_key, state_data)
            VALUES ($1, $2)
            ON CONFLICT (state_key)
            DO UPDATE SET 
                state_data = $2,
                last_updated = NOW(),
                version = grant_scraper_state.version + 1
        \`, [key, JSON.stringify(data)]);

        // Cache locally for fast access
        await this.local.run(
            'INSERT OR REPLACE INTO local_save_state (key, value) VALUES (?, ?)',
            [key, JSON.stringify(data)]
        );
    }

    async loadState(key) {
        // Try local cache first
        const local = await this.local.get(
            'SELECT value FROM local_save_state WHERE key = ?',
            [key]
        );
        
        if (local) {
            return JSON.parse(local.value);
        }

        // Fall back to PostgreSQL
        const result = await this.pg.query(
            'SELECT state_data FROM grant_scraper_state WHERE state_key = $1',
            [key]
        );

        if (result.rows.length > 0) {
            const data = result.rows[0].state_data;
            
            // Update local cache
            await this.local.run(
                'INSERT OR REPLACE INTO local_save_state (key, value) VALUES (?, ?)',
                [key, JSON.stringify(data)]
            );
            
            return data;
        }

        return null;
    }

    async autoSave(scraper) {
        setInterval(async () => {
            await this.saveState('scraper_queue', scraper.scrapingQueue);
            await this.saveState('active_scrapings', Array.from(scraper.activeScrapings.entries()));
            await this.saveState('discovered_grants_map', Array.from(scraper.discoveredGrants.entries()));
            await this.saveState('matched_grants_map', Array.from(scraper.matchedGrants.entries()));
            await this.saveState('applications_map', Array.from(scraper.applications.entries()));
            
            console.log('💾 Auto-saved grant scraper state');
        }, this.saveInterval);
    }

    async restore(scraper) {
        const queue = await this.loadState('scraper_queue');
        if (queue) scraper.scrapingQueue = queue;

        const active = await this.loadState('active_scrapings');
        if (active) scraper.activeScrapings = new Map(active);

        const discovered = await this.loadState('discovered_grants_map');
        if (discovered) scraper.discoveredGrants = new Map(discovered);

        const matched = await this.loadState('matched_grants_map');
        if (matched) scraper.matchedGrants = new Map(matched);

        const apps = await this.loadState('applications_map');
        if (apps) scraper.applications = new Map(apps);

        console.log('♻️ Restored grant scraper state from save');
    }
}

module.exports = GrantScraperSaveState;
`;

        // Save the save state manager
        fs.writeFileSync('grant-scraper-save-state.js', saveStateManager);
        console.log('✅ Save state system implemented');

        // Create enhanced grant scraper with save state
        await this.createEnhancedGrantScraper();
    }

    async createEnhancedGrantScraper() {
        const enhancedScraper = `#!/usr/bin/env node

/**
 * 🔧 ENHANCED GRANT SCRAPER WITH SAVE STATE
 * =========================================
 * Fixed version that won't collapse and maintains state
 */

const OriginalGrantScraper = require('./soulfra-grant-scraper-system.js');
const GrantScraperSaveState = require('./grant-scraper-save-state.js');
const { Pool } = require('pg');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

class EnhancedGrantScraper extends OriginalGrantScraper {
    constructor() {
        super();
        this.saveState = null;
        this.pgPool = null;
        this.isRecovering = false;
    }

    async initialize() {
        console.log('🚀 Enhanced Grant Scraper with Save State');
        console.log('========================================');
        
        // Initialize databases
        this.pgPool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/document_generator'
        });

        const localDb = await open({
            filename: './grant-scraper-savestate.db',
            driver: sqlite3.Database
        });

        // Initialize save state manager
        this.saveState = new GrantScraperSaveState(this.pgPool, localDb);

        // Restore previous state if exists
        await this.saveState.restore(this.grantScraper);

        // Set up auto-save
        await this.saveState.autoSave(this.grantScraper);

        // Start the grant scraper system
        await this.startGrantScraperSystem();
    }

    async processDiscoveredGrant(grant, source) {
        // Call original method
        await super.processDiscoveredGrant(grant, source);

        // Also save to persistent database
        await this.pgPool.query(\`
            INSERT INTO discovered_grants (id, source, grant_data, match_score, discovered_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
                match_score = $4,
                status = 'updated'
        \`, [
            grant.id,
            source,
            JSON.stringify(grant),
            grant.matchScore || 0,
            new Date(grant.discovered)
        ]);
    }

    async generateGrantApplication(grant) {
        // Call original method
        await super.generateGrantApplication(grant);

        // Get the generated application
        const application = this.autoFill.applications.get(grant.id);

        // Save to persistent database
        const result = await this.pgPool.query(\`
            INSERT INTO grant_applications (grant_id, application_data, generated_at)
            VALUES ($1, $2, $3)
            RETURNING id
        \`, [
            grant.id,
            JSON.stringify(application),
            new Date(application.generated)
        ]);

        // Update grant with application ID
        await this.pgPool.query(\`
            UPDATE discovered_grants 
            SET application_id = $1, status = 'application_generated'
            WHERE id = $2
        \`, [result.rows[0].id, grant.id]);
    }

    async handleCrash(error) {
        console.error('❌ Grant scraper crashed:', error);
        
        // Save current state immediately
        await this.saveState.saveState('crash_state', {
            error: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            queue_length: this.grantScraper.scrapingQueue.length,
            active_scrapings: this.grantScraper.activeScrapings.size
        });

        // Attempt recovery
        if (!this.isRecovering) {
            this.isRecovering = true;
            console.log('♻️ Attempting automatic recovery...');
            
            setTimeout(() => {
                this.isRecovering = false;
                this.initialize().catch(console.error);
            }, 5000);
        }
    }
}

// Start enhanced scraper with error handling
if (require.main === module) {
    const scraper = new EnhancedGrantScraper();
    
    process.on('uncaughtException', (error) => {
        scraper.handleCrash(error).catch(console.error);
    });

    process.on('unhandledRejection', (error) => {
        scraper.handleCrash(error).catch(console.error);
    });

    scraper.initialize().catch(console.error);
}

module.exports = EnhancedGrantScraper;
`;

        fs.writeFileSync('enhanced-grant-scraper.js', enhancedScraper);
        console.log('✅ Enhanced grant scraper created');
    }

    async connectToMultiDomainSystem() {
        console.log('\n🌐 Connecting to multi-domain system...');

        // Create grant scraper integration for multi-domain
        const integration = `
/**
 * 🌐 GRANT SCRAPER MULTI-DOMAIN INTEGRATION
 * =========================================
 */

class GrantScraperDomainIntegration {
    constructor() {
        this.domains = {
            'businesshub.example.com': {
                features: ['grant-dashboard', 'application-tracker'],
                endpoints: ['/api/grants', '/api/applications']
            },
            'tradezone.example.com': {
                features: ['funding-opportunities', 'investment-matching'],
                endpoints: ['/api/funding', '/api/investors']
            },
            'innovationlab.example.com': {
                features: ['grant-collaboration', 'application-workshop'],
                endpoints: ['/api/collaborate', '/api/workshop']
            }
        };
    }

    async integrateWithDomain(domain, agentId) {
        // Check agent's grant access permissions
        const hasAccess = await this.checkGrantAccess(agentId, domain);
        
        if (!hasAccess) {
            return { error: 'Agent does not have grant access for this domain' };
        }

        // Get agent's grant history
        const grantHistory = await this.getAgentGrantHistory(agentId);

        // Get relevant grants for domain
        const relevantGrants = await this.getRelevantGrants(domain);

        return {
            domain,
            agentId,
            hasAccess,
            grantHistory,
            relevantGrants,
            features: this.domains[domain].features
        };
    }

    async checkGrantAccess(agentId, domain) {
        // Query unified agent database
        const result = await pgPool.query(\`
            SELECT 
                ua.id,
                ua.domains_visited,
                dp.progress_data->>'grant_access' as grant_access
            FROM unified_agents ua
            LEFT JOIN domain_progress dp ON ua.id = dp.agent_id AND dp.domain = $2
            WHERE ua.id = $1
        \`, [agentId, domain]);

        return result.rows.length > 0 && 
               result.rows[0].grant_access !== 'false';
    }

    async getAgentGrantHistory(agentId) {
        const result = await pgPool.query(\`
            SELECT 
                ga.*,
                dg.grant_data
            FROM grant_applications ga
            JOIN discovered_grants dg ON ga.grant_id = dg.id
            WHERE ga.application_data->>'agentId' = $1
            ORDER BY ga.generated_at DESC
        \`, [agentId]);

        return result.rows;
    }

    async getRelevantGrants(domain) {
        // Get grants relevant to domain type
        const domainType = domain.split('.')[0]; // businesshub, tradezone, etc.
        
        const result = await pgPool.query(\`
            SELECT *
            FROM discovered_grants
            WHERE 
                status = 'discovered' AND
                match_score >= 0.7 AND
                grant_data->>'categories' ILIKE $1
            ORDER BY match_score DESC
            LIMIT 10
        \`, ['%' + domainType + '%']);

        return result.rows;
    }
}

module.exports = GrantScraperDomainIntegration;
`;

        fs.writeFileSync('grant-scraper-domain-integration.js', integration);
        console.log('✅ Multi-domain integration configured');

        // Create monitoring dashboard
        await this.createMonitoringDashboard();
    }

    async createMonitoringDashboard() {
        const monitoring = `
<!DOCTYPE html>
<html>
<head>
    <title>Grant Scraper Recovery Monitor</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #1a1a1a; 
            color: #00ff00; 
            padding: 20px; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .status-card {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            padding: 20px;
            margin: 10px 0;
            border-radius: 8px;
        }
        .error { color: #ff4444; }
        .success { color: #44ff44; }
        .warning { color: #ffaa44; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Grant Scraper Recovery Monitor</h1>
        
        <div class="status-card">
            <h2>System Status</h2>
            <div id="systemStatus">Loading...</div>
        </div>

        <div class="status-card">
            <h2>Save State Status</h2>
            <div id="saveStateStatus">Loading...</div>
        </div>

        <div class="status-card">
            <h2>Grant Statistics</h2>
            <div id="grantStats">Loading...</div>
        </div>

        <div class="status-card">
            <h2>Multi-Domain Integration</h2>
            <div id="domainIntegration">Loading...</div>
        </div>
    </div>

    <script>
        async function updateStatus() {
            try {
                const response = await fetch('/api/grant-scraper-status');
                const data = await response.json();
                
                document.getElementById('systemStatus').innerHTML = \`
                    <p class="\${data.operational ? 'success' : 'error'}">
                        Status: \${data.operational ? 'Operational' : 'Error'}
                    </p>
                    <p>Uptime: \${data.uptime}</p>
                    <p>Last Save: \${data.lastSave}</p>
                \`;

                document.getElementById('saveStateStatus').innerHTML = \`
                    <p>Database: \${data.database ? 'Connected' : 'Disconnected'}</p>
                    <p>Save Interval: \${data.saveInterval}ms</p>
                    <p>Queue Length: \${data.queueLength}</p>
                \`;

                document.getElementById('grantStats').innerHTML = \`
                    <p>Total Grants: \${data.totalGrants}</p>
                    <p>Matched Grants: \${data.matchedGrants}</p>
                    <p>Applications: \${data.applications}</p>
                    <p>Success Rate: \${data.successRate}%</p>
                \`;

                document.getElementById('domainIntegration').innerHTML = \`
                    <p>Connected Domains: \${data.connectedDomains}</p>
                    <p>Active Agents: \${data.activeAgents}</p>
                    <p>Cross-Domain Grants: \${data.crossDomainGrants}</p>
                \`;
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }

        // Update every 5 seconds
        setInterval(updateStatus, 5000);
        updateStatus();
    </script>
</body>
</html>
`;

        fs.writeFileSync('grant-scraper-monitor.html', monitoring);
        console.log('✅ Monitoring dashboard created');
    }
}

// Run recovery
if (require.main === module) {
    const recovery = new GrantScraperRecovery();
    recovery.initialize().catch(console.error);
}

module.exports = GrantScraperRecovery;
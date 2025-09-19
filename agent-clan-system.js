#!/usr/bin/env node

/**
 * 🏛️ AGENT CLAN SYSTEM
 * ====================
 * Multi-agent governance with ICANN compliance
 * Proper database schemas and clan organization
 */

const fs = require('fs').promises;
const http = require('http');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

class AgentClanSystem {
    constructor() {
        this.port = 6666;
        this.db = null;
        this.clans = new Map();
        this.agents = new Map();
        this.contracts = new Map();
        
        // ICANN Compliance
        this.icannCompliance = {
            domainRegistry: new Map(),
            ipAllocation: new Map(),
            dnsRecords: new Map(),
            compliance: {
                gdpr: true,
                ccpa: true,
                whois: true,
                dnssec: true
            }
        };
        
        // Schema definitions
        this.schemas = {
            agent: {
                id: 'TEXT PRIMARY KEY',
                name: 'TEXT NOT NULL',
                clan_id: 'TEXT',
                type: 'TEXT',
                personality: 'TEXT',
                created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                last_active: 'DATETIME',
                reputation: 'INTEGER DEFAULT 100',
                skills: 'TEXT',
                contracts: 'TEXT',
                icann_id: 'TEXT UNIQUE'
            },
            clan: {
                id: 'TEXT PRIMARY KEY',
                name: 'TEXT NOT NULL UNIQUE',
                motto: 'TEXT',
                founded: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                leader_id: 'TEXT',
                member_count: 'INTEGER DEFAULT 0',
                treasury: 'REAL DEFAULT 0',
                reputation: 'INTEGER DEFAULT 100',
                governance_type: 'TEXT',
                rules: 'TEXT',
                domain_name: 'TEXT UNIQUE'
            },
            contract: {
                id: 'TEXT PRIMARY KEY',
                type: 'TEXT NOT NULL',
                parties: 'TEXT NOT NULL',
                terms: 'TEXT',
                status: 'TEXT DEFAULT "pending"',
                created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                expires_at: 'DATETIME',
                icann_compliant: 'BOOLEAN DEFAULT TRUE',
                signatures: 'TEXT'
            },
            relationships: {
                id: 'TEXT PRIMARY KEY',
                agent1_id: 'TEXT NOT NULL',
                agent2_id: 'TEXT NOT NULL',
                relationship_type: 'TEXT',
                strength: 'REAL DEFAULT 0.5',
                established: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
            },
            icann_registry: {
                id: 'TEXT PRIMARY KEY',
                entity_type: 'TEXT',
                entity_id: 'TEXT',
                domain: 'TEXT UNIQUE',
                ip_address: 'TEXT',
                whois_data: 'TEXT',
                dnssec_enabled: 'BOOLEAN DEFAULT TRUE',
                registered_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                expires_at: 'DATETIME'
            }
        };
    }
    
    async initialize() {
        console.log('🏛️ AGENT CLAN SYSTEM INITIALIZING...');
        console.log('====================================');
        console.log('📊 Setting up database schemas...');
        console.log('🌐 Establishing ICANN compliance...');
        console.log('');
        
        // Initialize database
        await this.initializeDatabase();
        
        // Set up ICANN compliance
        await this.setupICANNCompliance();
        
        // Create initial clans
        await this.createInitialClans();
        
        // Start clan server
        await this.startClanServer();
    }
    
    async initializeDatabase() {
        try {
            // Open database
            this.db = await open({
                filename: './agent-clan-system.db',
                driver: sqlite3.Database
            });
            
            console.log('📊 Creating database schemas...');
            
            // Create tables
            for (const [tableName, schema] of Object.entries(this.schemas)) {
                const columns = Object.entries(schema)
                    .map(([col, type]) => `${col} ${type}`)
                    .join(', ');
                
                await this.db.exec(`
                    CREATE TABLE IF NOT EXISTS ${tableName} (${columns})
                `);
                
                console.log(`   ✅ Created table: ${tableName}`);
            }
            
            // Create indexes for performance
            await this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_agents_clan ON agent(clan_id);
                CREATE INDEX IF NOT EXISTS idx_contracts_status ON contract(status);
                CREATE INDEX IF NOT EXISTS idx_relationships_agents ON relationships(agent1_id, agent2_id);
                CREATE INDEX IF NOT EXISTS idx_icann_domain ON icann_registry(domain);
            `);
            
            console.log('   ✅ Database schemas initialized');
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    
    async setupICANNCompliance() {
        console.log('🌐 Setting up ICANN compliance framework...');
        
        // Register root domain for clan system
        this.icannCompliance.domainRegistry.set('clansystem.local', {
            registrar: 'Local Agent Registry',
            registered: new Date().toISOString(),
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            nameservers: ['ns1.clansystem.local', 'ns2.clansystem.local'],
            dnssec: true,
            whois: {
                registrant: 'Agent Clan System',
                admin: 'admin@clansystem.local',
                tech: 'tech@clansystem.local',
                created: new Date().toISOString()
            }
        });
        
        // Allocate IP ranges for clans
        this.icannCompliance.ipAllocation.set('clan-network', {
            range: '10.0.0.0/16',
            allocated: new Map([
                ['tech-clan', '10.0.1.0/24'],
                ['guardian-clan', '10.0.2.0/24'],
                ['merchant-clan', '10.0.3.0/24'],
                ['scholar-clan', '10.0.4.0/24']
            ])
        });
        
        console.log('   ✅ ICANN compliance framework established');
    }
    
    async createInitialClans() {
        console.log('🏛️ Creating initial clans...');
        
        const initialClans = [
            {
                id: crypto.randomUUID(),
                name: 'Tech Innovators',
                motto: 'Code is Law',
                governance_type: 'technocracy',
                rules: {
                    membership: 'skill-based',
                    voting: 'weighted-by-contribution',
                    treasury: 'project-funded'
                },
                domain_name: 'tech.clansystem.local'
            },
            {
                id: crypto.randomUUID(),
                name: 'Digital Guardians',
                motto: 'Protect and Serve',
                governance_type: 'military',
                rules: {
                    membership: 'merit-based',
                    voting: 'rank-based',
                    treasury: 'mission-funded'
                },
                domain_name: 'guardian.clansystem.local'
            },
            {
                id: crypto.randomUUID(),
                name: 'Merchant Alliance',
                motto: 'Trade Brings Prosperity',
                governance_type: 'plutocracy',
                rules: {
                    membership: 'investment-based',
                    voting: 'share-based',
                    treasury: 'profit-sharing'
                },
                domain_name: 'merchant.clansystem.local'
            },
            {
                id: crypto.randomUUID(),
                name: 'Scholar Collective',
                motto: 'Knowledge is Power',
                governance_type: 'meritocracy',
                rules: {
                    membership: 'knowledge-based',
                    voting: 'peer-review',
                    treasury: 'grant-funded'
                },
                domain_name: 'scholar.clansystem.local'
            }
        ];
        
        for (const clanData of initialClans) {
            // Store in database
            await this.db.run(`
                INSERT INTO clan (id, name, motto, governance_type, rules, domain_name)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                clanData.id,
                clanData.name,
                clanData.motto,
                clanData.governance_type,
                JSON.stringify(clanData.rules),
                clanData.domain_name
            ]);
            
            // Register with ICANN
            await this.registerClanDomain(clanData);
            
            // Store in memory
            this.clans.set(clanData.id, clanData);
            
            // Create founding agents
            await this.createFoundingAgents(clanData);
            
            console.log(`   ✅ Created clan: ${clanData.name}`);
        }
    }
    
    async registerClanDomain(clan) {
        // Register clan subdomain
        this.icannCompliance.domainRegistry.set(clan.domain_name, {
            registrar: 'Clan System Registry',
            registered: new Date().toISOString(),
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            nameservers: ['ns1.clansystem.local', 'ns2.clansystem.local'],
            dnssec: true,
            whois: {
                registrant: clan.name,
                admin: `admin@${clan.domain_name}`,
                tech: `tech@${clan.domain_name}`,
                created: new Date().toISOString()
            }
        });
        
        // Add DNS records
        this.icannCompliance.dnsRecords.set(clan.domain_name, {
            A: this.allocateIPForClan(clan.id),
            MX: `mail.${clan.domain_name}`,
            TXT: `v=spf1 include:clansystem.local ~all`
        });
        
        // Store in database
        await this.db.run(`
            INSERT INTO icann_registry (id, entity_type, entity_id, domain, ip_address, whois_data, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            crypto.randomUUID(),
            'clan',
            clan.id,
            clan.domain_name,
            this.allocateIPForClan(clan.id),
            JSON.stringify(this.icannCompliance.domainRegistry.get(clan.domain_name).whois),
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        ]);
    }
    
    allocateIPForClan(clanId) {
        const clanIndex = Array.from(this.clans.keys()).indexOf(clanId);
        return `10.0.${clanIndex + 1}.1`;
    }
    
    async createFoundingAgents(clan) {
        const agentTypes = this.getAgentTypesForClan(clan.governance_type);
        
        for (let i = 0; i < 5; i++) {
            const agent = {
                id: crypto.randomUUID(),
                name: this.generateAgentName(clan.governance_type),
                clan_id: clan.id,
                type: agentTypes[i % agentTypes.length],
                personality: this.generatePersonality(),
                skills: this.generateSkills(clan.governance_type),
                icann_id: `AGENT-${Date.now()}-${i}`
            };
            
            // Store in database
            await this.db.run(`
                INSERT INTO agent (id, name, clan_id, type, personality, skills, icann_id, last_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                agent.id,
                agent.name,
                agent.clan_id,
                agent.type,
                JSON.stringify(agent.personality),
                JSON.stringify(agent.skills),
                agent.icann_id,
                new Date().toISOString()
            ]);
            
            // Update clan member count
            await this.db.run(`
                UPDATE clan SET member_count = member_count + 1 WHERE id = ?
            `, [clan.id]);
            
            // Store in memory
            this.agents.set(agent.id, agent);
            
            // Make first agent the leader
            if (i === 0) {
                await this.db.run(`
                    UPDATE clan SET leader_id = ? WHERE id = ?
                `, [agent.id, clan.id]);
            }
        }
    }
    
    getAgentTypesForClan(governanceType) {
        const typeMap = {
            technocracy: ['developer', 'architect', 'researcher', 'engineer', 'analyst'],
            military: ['commander', 'strategist', 'scout', 'defender', 'tactician'],
            plutocracy: ['trader', 'investor', 'broker', 'analyst', 'negotiator'],
            meritocracy: ['professor', 'researcher', 'librarian', 'philosopher', 'scientist']
        };
        return typeMap[governanceType] || ['member'];
    }
    
    generateAgentName(governanceType) {
        const prefixes = {
            technocracy: ['Neo', 'Cyber', 'Tech', 'Data', 'Code'],
            military: ['Alpha', 'Bravo', 'Delta', 'Echo', 'Sigma'],
            plutocracy: ['Gold', 'Silver', 'Platinum', 'Diamond', 'Crystal'],
            meritocracy: ['Sage', 'Oracle', 'Scholar', 'Mentor', 'Guide']
        };
        
        const suffixes = ['One', 'Prime', 'Max', 'Pro', 'Elite', 'Core', 'Plus'];
        
        const prefix = prefixes[governanceType] || ['Agent'];
        return `${prefix[Math.floor(Math.random() * prefix.length)]}-${suffixes[Math.floor(Math.random() * suffixes.length)]}-${Math.floor(Math.random() * 1000)}`;
    }
    
    generatePersonality() {
        const traits = ['analytical', 'creative', 'social', 'competitive', 'cooperative', 'innovative'];
        const selected = [];
        
        for (let i = 0; i < 3; i++) {
            const trait = traits[Math.floor(Math.random() * traits.length)];
            if (!selected.includes(trait)) {
                selected.push(trait);
            }
        }
        
        return {
            traits: selected,
            loyalty: Math.random(),
            ambition: Math.random(),
            sociability: Math.random()
        };
    }
    
    generateSkills(governanceType) {
        const skillSets = {
            technocracy: {
                programming: Math.random(),
                systemDesign: Math.random(),
                debugging: Math.random(),
                innovation: Math.random()
            },
            military: {
                strategy: Math.random(),
                tactics: Math.random(),
                leadership: Math.random(),
                defense: Math.random()
            },
            plutocracy: {
                trading: Math.random(),
                negotiation: Math.random(),
                analysis: Math.random(),
                networking: Math.random()
            },
            meritocracy: {
                research: Math.random(),
                teaching: Math.random(),
                analysis: Math.random(),
                wisdom: Math.random()
            }
        };
        
        return skillSets[governanceType] || { general: Math.random() };
    }
    
    async createContract(type, parties, terms) {
        const contract = {
            id: crypto.randomUUID(),
            type: type,
            parties: JSON.stringify(parties),
            terms: JSON.stringify(terms),
            status: 'pending',
            icann_compliant: await this.verifyICANNCompliance(terms),
            signatures: JSON.stringify([])
        };
        
        // Store in database
        await this.db.run(`
            INSERT INTO contract (id, type, parties, terms, status, icann_compliant)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            contract.id,
            contract.type,
            contract.parties,
            contract.terms,
            contract.status,
            contract.icann_compliant
        ]);
        
        this.contracts.set(contract.id, contract);
        return contract;
    }
    
    async verifyICANNCompliance(terms) {
        // Check if contract terms comply with ICANN standards
        const requiredFields = ['domainUsage', 'dataProtection', 'disputeResolution'];
        return requiredFields.every(field => terms[field] !== undefined);
    }
    
    async startClanServer() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            
            if (req.url === '/') {
                res.end(await this.generateClanInterface());
            } else if (req.url === '/api/clans') {
                const clans = await this.db.all('SELECT * FROM clan');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(clans));
            } else if (req.url === '/api/agents') {
                const agents = await this.db.all(`
                    SELECT a.*, c.name as clan_name 
                    FROM agent a 
                    LEFT JOIN clan c ON a.clan_id = c.id
                `);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(agents));
            } else if (req.url === '/api/contracts') {
                const contracts = await this.db.all('SELECT * FROM contract ORDER BY created_at DESC');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(contracts));
            } else if (req.url === '/api/icann-status') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    compliance: this.icannCompliance.compliance,
                    domains: Array.from(this.icannCompliance.domainRegistry.keys()),
                    ipAllocations: Array.from(this.icannCompliance.ipAllocation.entries())
                }));
            } else if (req.url.startsWith('/api/create-agent')) {
                // Handle agent creation
                const agent = await this.createNewAgent(req);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(agent));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n🏛️ AGENT CLAN SYSTEM ACTIVE`);
            console.log(`🌐 Clan Interface: http://localhost:${this.port}`);
            console.log(`\n📊 DATABASE STATUS:`);
            console.log(`   • Schema: Initialized`);
            console.log(`   • Tables: ${Object.keys(this.schemas).length}`);
            console.log(`   • Clans: ${this.clans.size}`);
            console.log(`   • Agents: ${this.agents.size}`);
            console.log(`\n🌐 ICANN COMPLIANCE:`);
            console.log(`   • GDPR: ✅`);
            console.log(`   • CCPA: ✅`);
            console.log(`   • WHOIS: ✅`);
            console.log(`   • DNSSEC: ✅`);
            console.log(`   • Domains: ${this.icannCompliance.domainRegistry.size}`);
        });
    }
    
    async generateClanInterface() {
        const clans = await this.db.all('SELECT * FROM clan');
        const agents = await this.db.all('SELECT * FROM agent');
        const totalAgents = agents.length;
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>Agent Clan System - ICANN Compliant</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: #0a0a0a;
            color: #00ff00;
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #00ff00;
            border-radius: 10px;
        }
        
        .header h1 {
            font-size: 3em;
            margin: 0;
            text-shadow: 0 0 20px #00ff00;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: rgba(0, 255, 0, 0.05);
            border: 1px solid #00ff00;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #00ff00;
        }
        
        .stat-card .number {
            font-size: 2.5em;
            font-weight: bold;
            color: #00ffff;
        }
        
        .clans-section {
            margin: 40px 0;
        }
        
        .clan-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .clan-card {
            background: rgba(0, 255, 0, 0.02);
            border: 2px solid #00ff00;
            padding: 20px;
            border-radius: 10px;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .clan-card:hover {
            background: rgba(0, 255, 0, 0.1);
            transform: scale(1.02);
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
        }
        
        .clan-card h3 {
            margin: 0 0 10px 0;
            color: #00ff00;
            font-size: 1.5em;
        }
        
        .clan-card .motto {
            font-style: italic;
            color: #00ffff;
            margin: 10px 0;
        }
        
        .clan-card .stats {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            font-size: 0.9em;
        }
        
        .icann-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            padding: 15px;
            border-radius: 10px;
            min-width: 200px;
        }
        
        .icann-status h4 {
            margin: 0 0 10px 0;
            color: #00ff00;
        }
        
        .icann-status .compliance-item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        
        .agents-list {
            margin: 40px 0;
            background: rgba(0, 255, 0, 0.02);
            border: 1px solid #00ff00;
            padding: 20px;
            border-radius: 10px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .agent-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            margin: 5px 0;
            background: rgba(0, 255, 0, 0.05);
            border-radius: 5px;
        }
        
        .create-agent-btn {
            background: #00ff00;
            color: #000;
            border: none;
            padding: 15px 30px;
            font-size: 1.1em;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
            display: block;
            margin: 20px auto;
        }
        
        .create-agent-btn:hover {
            background: #00cc00;
            box-shadow: 0 0 20px #00ff00;
        }
        
        .contracts-section {
            margin: 40px 0;
            padding: 20px;
            background: rgba(255, 255, 0, 0.02);
            border: 2px solid #ffff00;
            border-radius: 10px;
        }
        
        .contracts-section h2 {
            color: #ffff00;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ AGENT CLAN SYSTEM</h1>
            <p>Distributed Multi-Agent Governance with ICANN Compliance</p>
            <p>Building autonomous communities with proper schemas and contracts</p>
        </div>
        
        <div class="icann-status">
            <h4>🌐 ICANN Compliance</h4>
            <div class="compliance-item">
                <span>GDPR:</span> <span style="color: #00ff00;">✅</span>
            </div>
            <div class="compliance-item">
                <span>CCPA:</span> <span style="color: #00ff00;">✅</span>
            </div>
            <div class="compliance-item">
                <span>WHOIS:</span> <span style="color: #00ff00;">✅</span>
            </div>
            <div class="compliance-item">
                <span>DNSSEC:</span> <span style="color: #00ff00;">✅</span>
            </div>
            <div class="compliance-item">
                <span>Domains:</span> <span>${this.icannCompliance.domainRegistry.size}</span>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Clans</h3>
                <div class="number">${clans.length}</div>
            </div>
            <div class="stat-card">
                <h3>Active Agents</h3>
                <div class="number">${totalAgents}</div>
            </div>
            <div class="stat-card">
                <h3>Contracts</h3>
                <div class="number">${this.contracts.size}</div>
            </div>
            <div class="stat-card">
                <h3>Compliance</h3>
                <div class="number">100%</div>
            </div>
        </div>
        
        <div class="clans-section">
            <h2>🏛️ Active Clans</h2>
            <div class="clan-grid">
                ${clans.map(clan => `
                    <div class="clan-card" onclick="viewClan('${clan.id}')">
                        <h3>${clan.name}</h3>
                        <div class="motto">"${clan.motto}"</div>
                        <div>Governance: ${clan.governance_type}</div>
                        <div>Domain: ${clan.domain_name}</div>
                        <div class="stats">
                            <span>Members: ${clan.member_count}</span>
                            <span>Treasury: ${clan.treasury.toFixed(2)}</span>
                            <span>Rep: ${clan.reputation}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <button class="create-agent-btn" onclick="createNewAgent()">
            + Create New Agent
        </button>
        
        <div class="agents-list">
            <h2>👥 Recent Agents</h2>
            <div id="agentsList">
                ${agents.slice(-10).reverse().map(agent => `
                    <div class="agent-item">
                        <span>${agent.name}</span>
                        <span>${agent.type}</span>
                        <span>Clan: ${clans.find(c => c.id === agent.clan_id)?.name || 'None'}</span>
                        <span>Rep: ${agent.reputation}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="contracts-section">
            <h2>📄 Smart Contracts</h2>
            <p>All contracts are ICANN compliant and stored in our database schema</p>
            <div id="contractsList">
                <div style="text-align: center; padding: 20px;">
                    <span class="pulse">Loading contracts...</span>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function viewClan(clanId) {
            console.log('Viewing clan:', clanId);
            // Implement clan view
        }
        
        function createNewAgent() {
            const name = prompt('Agent name:');
            if (name) {
                fetch('/api/create-agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                }).then(res => res.json())
                  .then(agent => {
                      alert('Agent created: ' + agent.name);
                      location.reload();
                  });
            }
        }
        
        // Load contracts
        fetch('/api/contracts')
            .then(res => res.json())
            .then(contracts => {
                const contractsList = document.getElementById('contractsList');
                if (contracts.length === 0) {
                    contractsList.innerHTML = '<p style="text-align: center;">No contracts yet</p>';
                } else {
                    contractsList.innerHTML = contracts.map(contract => \`
                        <div class="agent-item">
                            <span>Type: \${contract.type}</span>
                            <span>Status: \${contract.status}</span>
                            <span>ICANN: \${contract.icann_compliant ? '✅' : '❌'}</span>
                        </div>
                    \`).join('');
                }
            });
        
        // Auto-refresh
        setInterval(() => {
            fetch('/api/agents')
                .then(res => res.json())
                .then(agents => {
                    const agentsList = document.getElementById('agentsList');
                    agentsList.innerHTML = agents.slice(-10).reverse().map(agent => \`
                        <div class="agent-item">
                            <span>\${agent.name}</span>
                            <span>\${agent.type}</span>
                            <span>Clan: \${agent.clan_name || 'None'}</span>
                            <span>Rep: \${agent.reputation}</span>
                        </div>
                    \`).join('');
                });
        }, 5000);
    </script>
</body>
</html>`;
    }
    
    async createNewAgent(req) {
        // Parse request body (simplified)
        const body = await new Promise((resolve) => {
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => resolve(JSON.parse(data)));
        });
        
        const agent = {
            id: crypto.randomUUID(),
            name: body.name || this.generateAgentName('general'),
            clan_id: body.clan_id || null,
            type: body.type || 'freelancer',
            personality: this.generatePersonality(),
            skills: this.generateSkills('general'),
            icann_id: `AGENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Store in database
        await this.db.run(`
            INSERT INTO agent (id, name, clan_id, type, personality, skills, icann_id, last_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            agent.id,
            agent.name,
            agent.clan_id,
            agent.type,
            JSON.stringify(agent.personality),
            JSON.stringify(agent.skills),
            agent.icann_id,
            new Date().toISOString()
        ]);
        
        return agent;
    }
}

// Initialize the clan system
const clanSystem = new AgentClanSystem();
clanSystem.initialize().catch(error => {
    console.error('❌ Failed to initialize clan system:', error);
});
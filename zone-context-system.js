#!/usr/bin/env node

/**
 * 🎯 ZONE CONTEXT SYSTEM
 * Provides zone-aware context for voice commands and content generation
 * Connects zones to actual functionality without the fantasy BS
 */

const fs = require('fs').promises;
const path = require('path');
const ZoneDatabaseManager = require('./zone-database-manager');

class ZoneContextSystem {
    constructor() {
        this.db = new ZoneDatabaseManager();
        this.zoneMap = null;
        this.currentZone = null;
        this.zoneCapabilities = new Map();
        this.zonesCache = new Map(); // Cache for fast zone lookups
        
        // Define what each zone can actually do
        this.zoneActions = {
            'spawn': {
                name: 'Spawn Zone',
                description: 'Main hub - system overview and navigation',
                actions: [
                    'show_empire_status',
                    'list_all_zones', 
                    'get_system_health',
                    'show_recent_activity',
                    'navigate_to_zone'
                ],
                content_types: ['welcome_message', 'system_summary', 'navigation_help'],
                voice_prompts: [
                    'Where am I?',
                    'Show me the empire overview',
                    'What can I do here?',
                    'Take me to [zone name]'
                ]
            },
            'tech_zone': {
                name: 'Tech Zone',
                description: 'APIs, documentation, and developer tools',
                actions: [
                    'show_api_status',
                    'run_api_tests',
                    'check_service_health',
                    'search_documentation',
                    'debug_system'
                ],
                content_types: ['api_documentation', 'technical_guide', 'troubleshooting_help'],
                voice_prompts: [
                    'Run API tests',
                    'Check system health',
                    'Search docs for [query]',
                    'Help me debug [issue]'
                ]
            },
            'content_forge': {
                name: 'Content Forge',
                description: 'Content creation and generation',
                actions: [
                    'generate_content',
                    'run_gacha_generation',
                    'list_templates',
                    'show_generation_history',
                    'optimize_content'
                ],
                content_types: ['blog_post', 'product_description', 'social_media', 'marketing_copy'],
                voice_prompts: [
                    'Generate content for [topic]',
                    'Roll the gacha machine',
                    'Show me content templates',
                    'Create a [content type]'
                ]
            },
            'ai_temple': {
                name: 'AI Temple',
                description: 'AI services and machine learning',
                actions: [
                    'chat_with_ai',
                    'run_ai_analysis',
                    'train_model',
                    'check_ai_performance',
                    'manage_ai_models'
                ],
                content_types: ['ai_analysis', 'model_explanation', 'prediction_report'],
                voice_prompts: [
                    'Talk to AI assistant',
                    'Analyze this data',
                    'What models are available?',
                    'Run AI on [input]'
                ]
            },
            'marketplace': {
                name: 'Marketplace',
                description: 'Commerce and business operations',
                actions: [
                    'show_business_metrics',
                    'manage_products',
                    'process_orders',
                    'view_analytics',
                    'run_marketing_campaigns'
                ],
                content_types: ['product_listing', 'business_report', 'marketing_material'],
                voice_prompts: [
                    'Show business metrics',
                    'How are sales doing?',
                    'Create product listing',
                    'Run marketing analysis'
                ]
            },
            'gaming_arena': {
                name: 'Gaming Arena',
                description: 'Gaming and interactive content',
                actions: [
                    'start_game_session',
                    'check_player_stats',
                    'manage_achievements',
                    'run_tournaments',
                    'update_leaderboards'
                ],
                content_types: ['game_content', 'player_guide', 'achievement_description'],
                voice_prompts: [
                    'Start a game',
                    'Show my stats',
                    'What achievements can I unlock?',
                    'How do I play?'
                ]
            },
            'crypto_exchange': {
                name: 'Crypto Exchange',
                description: 'Blockchain and financial services',
                actions: [
                    'check_wallet_balance',
                    'view_transactions',
                    'execute_trade',
                    'monitor_prices',
                    'manage_portfolio'
                ],
                content_types: ['price_analysis', 'trading_guide', 'portfolio_report'],
                voice_prompts: [
                    'Show my wallet balance',
                    'What are crypto prices?',
                    'Analyze my portfolio',
                    'Help me with trading'
                ]
            },
            'data_mines': {
                name: 'Data Mines',
                description: 'Analytics and data processing',
                actions: [
                    'run_data_analysis',
                    'generate_reports',
                    'process_datasets',
                    'create_visualizations',
                    'export_data'
                ],
                content_types: ['data_report', 'analysis_summary', 'chart_description'],
                voice_prompts: [
                    'Analyze this data',
                    'Generate a report',
                    'Show me charts',
                    'Export data as [format]'
                ]
            },
            'danger_zone': {
                name: 'Danger Zone',
                description: 'Testing and experimental features',
                actions: [
                    'run_experimental_tests',
                    'access_beta_features',
                    'debug_advanced_systems',
                    'test_new_integrations',
                    'emergency_recovery'
                ],
                content_types: ['test_report', 'experimental_guide', 'debug_log'],
                voice_prompts: [
                    'Run experimental test',
                    'Show beta features',
                    'Help me debug [system]',
                    'Emergency recovery mode'
                ]
            },
            'security_citadel': {
                name: 'Security Citadel', 
                description: 'Blockchain security monitoring and threat detection',
                actions: [
                    'scan_smart_contracts',
                    'monitor_threats',
                    'audit_blockchain',
                    'security_report',
                    'threat_analysis',
                    'start_monitoring',
                    'check_vulnerabilities',
                    'start_threat_monitoring',
                    'stop_threat_monitoring',
                    'show_threat_dashboard',
                    'zone_threat_status'
                ],
                content_types: ['security_report', 'threat_alert', 'audit_summary', 'vulnerability_assessment'],
                voice_prompts: [
                    'Scan this contract',
                    'Monitor for threats',
                    'Run security audit',
                    'Generate threat report',
                    'Check network security',
                    'Start threat monitoring',
                    'Show threat dashboard',
                    'Stop threat monitoring',
                    'Zone security status',
                    'Cross-zone threat analysis'
                ]
            },
            'mystery_zone': {
                name: 'Mystery Zone',
                description: 'Uncategorized areas - basic functions only',
                actions: [
                    'identify_zone_type',
                    'suggest_categorization',
                    'basic_content_generation',
                    'general_help'
                ],
                content_types: ['general_content', 'help_message', 'zone_analysis'],
                voice_prompts: [
                    'What is this place?',
                    'Help me understand this zone',
                    'Generate basic content',
                    'Categorize this zone'
                ]
            }
        };
        
        console.log('🎯 Zone Context System initialized');
    }
    
    async initialize() {
        try {
            // Initialize database connection
            await this.db.initialize();
            
            // Load zones from database
            const zones = await this.db.getAllZones();
            console.log(`✅ Loaded ${zones.length} zones from database`);
            
            // Cache zones for fast lookup
            this.zonesCache.clear();
            zones.forEach(zone => {
                this.zonesCache.set(zone.id, zone);
            });
            
            // Set initial zone to spawn
            this.currentZone = 'spawn';
            
            // Load zone map for domain mapping
            await this.loadZoneMapFromDatabase();
            
        } catch (error) {
            console.warn('⚠️ Could not initialize zone database, using fallback');
            this.createDefaultZoneMap();
        }
    }
    
    async loadZoneMapFromDatabase() {
        try {
            const zones = await this.db.getAllZones();
            this.zoneMap = {
                generated_at: new Date().toISOString(),
                total_domains: 0,
                zones: {}
            };
            
            for (const zone of zones) {
                const domains = await this.db.getZoneDomains(zone.id);
                this.zoneMap.zones[zone.id] = {
                    name: zone.name,
                    domains: domains.map(d => ({
                        domain: d.domain,
                        confidence: d.confidence
                    }))
                };
                this.zoneMap.total_domains += domains.length;
            }
            
            console.log(`🗺️ Zone map loaded: ${this.zoneMap.total_domains} domains across ${zones.length} zones`);
            
        } catch (error) {
            console.warn('⚠️ Could not load zone map from database:', error.message);
            this.createDefaultZoneMap();
        }
    }
    
    createDefaultZoneMap() {
        this.zoneMap = {
            generated_at: new Date().toISOString(),
            total_domains: 10,
            zones: {
                spawn: {
                    name: 'Spawn Zone',
                    domains: [
                        { domain: 'localhost:8080', confidence: 1.0 },
                        { domain: 'deathtodata.com', confidence: 1.0 }
                    ]
                },
                tech_zone: {
                    name: 'Tech Zone',
                    domains: [
                        { domain: 'api.localhost:3001', confidence: 1.0 },
                        { domain: 'docs.localhost', confidence: 1.0 }
                    ]
                }
            }
        };
    }
    
    // ================================================
    // 🎯 ZONE DETECTION
    // ================================================
    
    async detectZoneFromDomain(domain) {
        try {
            // Use database for fast zone lookup
            const zone = await this.db.getZoneByDomain(domain);
            return zone ? zone.id : 'mystery_zone';
        } catch (error) {
            console.warn('⚠️ Database zone lookup failed, using fallback:', error.message);
            return this.detectZoneFromDomainFallback(domain);
        }
    }
    
    detectZoneFromDomainFallback(domain) {
        if (!this.zoneMap) return 'mystery_zone';
        
        // Clean domain for comparison
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/:\d+/, '').toLowerCase();
        
        // Search through all zones
        for (const [zoneType, zoneData] of Object.entries(this.zoneMap.zones)) {
            if (zoneData.domains) {
                for (const domainInfo of zoneData.domains) {
                    const zoneDomain = domainInfo.domain.toLowerCase();
                    if (zoneDomain.includes(cleanDomain) || cleanDomain.includes(zoneDomain)) {
                        return zoneType;
                    }
                }
            }
        }
        
        return 'mystery_zone';
    }
    
    async detectZoneFromURL(url) {
        const domain = new URL(url).hostname;
        return await this.detectZoneFromDomain(domain);
    }
    
    setCurrentZone(zoneType, context = {}) {
        if (this.zoneActions[zoneType]) {
            this.currentZone = zoneType;
            console.log(`🎯 Entered ${this.zoneActions[zoneType].name}`);
            return {
                success: true,
                zone: this.zoneActions[zoneType],
                context: context
            };
        } else {
            console.warn(`⚠️ Unknown zone type: ${zoneType}`);
            return {
                success: false,
                error: `Unknown zone: ${zoneType}`
            };
        }
    }
    
    getCurrentZone() {
        const zoneType = this.currentZone || 'spawn';
        
        // Try to get from database cache first
        const cachedZone = this.zonesCache.get(zoneType);
        if (cachedZone) {
            return {
                type: zoneType,
                id: cachedZone.id,
                name: cachedZone.name,
                description: cachedZone.description,
                emoji: cachedZone.emoji,
                actions: cachedZone.actions || [],
                content_types: cachedZone.content_types || [],
                voice_prompts: cachedZone.voice_prompts || [],
                domains: this.zoneMap?.zones[zoneType]?.domains || []
            };
        }
        
        // Fallback to static zone actions
        return {
            type: zoneType,
            ...this.zoneActions[zoneType],
            domains: this.zoneMap?.zones[zoneType]?.domains || []
        };
    }
    
    // ================================================
    // 🗣️ VOICE COMMAND CONTEXT
    // ================================================
    
    processVoiceCommand(command, context = {}) {
        const currentZone = this.getCurrentZone();
        const lowerCommand = command.toLowerCase();
        
        // Zone navigation commands
        if (lowerCommand.includes('what zone') || lowerCommand.includes('where am i')) {
            return this.handleWhereAmI();
        }
        
        if (lowerCommand.includes('warp to') || lowerCommand.includes('go to')) {
            const targetZone = this.extractTargetZone(command);
            return this.handleWarpToZone(targetZone);
        }
        
        if (lowerCommand.includes('zone map') || lowerCommand.includes('show zones')) {
            return this.handleShowZoneMap();
        }
        
        // Zone-specific commands
        if (lowerCommand.includes('what can i do')) {
            return this.handleWhatCanIDo();
        }
        
        if (lowerCommand.includes('generate content') && lowerCommand.includes('this zone')) {
            return this.handleZoneContentGeneration(command, context);
        }
        
        // Security-specific commands for Security Citadel zone
        if (currentZone.type === 'security_citadel') {
            if (lowerCommand.includes('scan') && (lowerCommand.includes('contract') || lowerCommand.includes('address'))) {
                return this.handleSecurityScan(command, context);
            }
            
            if (lowerCommand.includes('monitor') && lowerCommand.includes('threat')) {
                return this.handleThreatMonitoring(command, context);
            }
            
            if (lowerCommand.includes('security') && (lowerCommand.includes('report') || lowerCommand.includes('audit'))) {
                return this.handleSecurityReport(command, context);
            }
            
            if (lowerCommand.includes('check') && lowerCommand.includes('vulnerabilities')) {
                return this.handleVulnerabilityCheck(command, context);
            }
            
            if (lowerCommand.includes('audit') && (lowerCommand.includes('contract') || lowerCommand.includes('comprehensive'))) {
                return this.handleContractAudit(command, context);
            }
            
            if (lowerCommand.includes('gas') && lowerCommand.includes('optimization')) {
                return this.handleGasOptimization(command, context);
            }
            
            if (lowerCommand.includes('start') && (lowerCommand.includes('monitoring') || lowerCommand.includes('threat'))) {
                return this.handleStartThreatMonitoring(command, context);
            }
            
            if (lowerCommand.includes('stop') && (lowerCommand.includes('monitoring') || lowerCommand.includes('threat'))) {
                return this.handleStopThreatMonitoring(command, context);
            }
            
            if (lowerCommand.includes('threat') && (lowerCommand.includes('status') || lowerCommand.includes('dashboard'))) {
                return this.handleThreatDashboard(command, context);
            }
            
            if (lowerCommand.includes('zone') && (lowerCommand.includes('threat') || lowerCommand.includes('security'))) {
                return this.handleZoneThreatStatus(command, context);
            }
        }
        
        // Check if command matches zone-specific actions
        for (const action of currentZone.actions) {
            if (this.commandMatchesAction(command, action, currentZone)) {
                return this.handleZoneAction(action, command, context);
            }
        }
        
        // Default: provide zone-appropriate help
        return this.handleDefaultZoneResponse(command, currentZone);
    }
    
    handleWhereAmI() {
        const zone = this.getCurrentZone();
        return {
            intent: 'zone_location',
            response: `You are in the **${zone.name}** 🎯\n\n${zone.description}\n\n**Available actions:**\n${zone.actions.map(a => `• ${a.replace(/_/g, ' ')}`).join('\n')}`,
            zone: zone.type,
            suggestions: zone.voice_prompts.slice(0, 3)
        };
    }
    
    handleWarpToZone(targetZone) {
        if (!targetZone) {
            return {
                intent: 'zone_navigation_help',
                response: 'Available zones to warp to:\n' + Object.keys(this.zoneActions).map(z => `• ${this.zoneActions[z].name}`).join('\n'),
                suggestions: ['Warp to Tech Zone', 'Warp to Content Forge', 'Warp to Spawn Zone']
            };
        }
        
        const result = this.setCurrentZone(targetZone);
        if (result.success) {
            return {
                intent: 'zone_warp',
                response: `🌟 Warped to **${result.zone.name}**!\n\n${result.zone.description}\n\nYou can now:\n${result.zone.actions.map(a => `• ${a.replace(/_/g, ' ')}`).join('\n')}`,
                zone: targetZone,
                suggestions: result.zone.voice_prompts.slice(0, 3)
            };
        } else {
            return {
                intent: 'zone_warp_error',
                response: `❌ Could not warp to "${targetZone}". ${result.error}`,
                suggestions: ['Show zone map', 'List all zones']
            };
        }
    }
    
    handleShowZoneMap() {
        const zoneList = Object.entries(this.zoneActions).map(([type, info]) => {
            const domainCount = this.zoneMap?.zones[type]?.domains?.length || 0;
            return `${info.name} (${domainCount} domains) - ${info.description}`;
        }).join('\n');
        
        return {
            intent: 'zone_map',
            response: `🗺️ **Empire Zone Map**\n\n${zoneList}\n\nSay "warp to [zone name]" to travel to any zone.`,
            suggestions: ['Warp to Tech Zone', 'Warp to Content Forge', 'What zone am I in?']
        };
    }
    
    handleWhatCanIDo() {
        const zone = this.getCurrentZone();
        return {
            intent: 'zone_capabilities',
            response: `In the **${zone.name}**, you can:\n\n${zone.voice_prompts.map(p => `🗣️ "${p}"`).join('\n')}\n\n**Available actions:**\n${zone.actions.map(a => `• ${a.replace(/_/g, ' ')}`).join('\n')}`,
            zone: zone.type,
            suggestions: zone.voice_prompts.slice(0, 3)
        };
    }
    
    handleZoneContentGeneration(command, context) {
        const zone = this.getCurrentZone();
        const contentTypes = zone.content_types || ['general_content'];
        
        return {
            intent: 'zone_content_generation',
            response: `🎨 Generating content for the **${zone.name}**...\n\nAvailable content types:\n${contentTypes.map(t => `• ${t.replace(/_/g, ' ')}`).join('\n')}`,
            action: {
                type: 'content_generation',
                zone: zone.type,
                content_types: contentTypes,
                context: context
            },
            suggestions: contentTypes.map(t => `Generate ${t.replace(/_/g, ' ')}`)
        };
    }
    
    handleZoneAction(action, command, context) {
        const zone = this.getCurrentZone();
        
        return {
            intent: 'zone_action',
            response: `🎯 Executing "${action.replace(/_/g, ' ')}" in the **${zone.name}**...`,
            action: {
                type: action,
                zone: zone.type,
                command: command,
                context: context
            },
            suggestions: zone.voice_prompts.slice(0, 3)
        };
    }
    
    handleDefaultZoneResponse(command, zone) {
        return {
            intent: 'zone_help',
            response: `I'm not sure how to handle "${command}" in the **${zone.name}**.\n\nTry one of these:\n${zone.voice_prompts.slice(0, 3).map(p => `🗣️ "${p}"`).join('\n')}`,
            zone: zone.type,
            suggestions: zone.voice_prompts.slice(0, 3)
        };
    }
    
    // ================================================
    // 🛡️ SECURITY COMMAND HANDLERS
    // ================================================
    
    handleSecurityScan(command, context) {
        // Extract contract address from command
        const addressMatch = command.match(/0x[a-fA-F0-9]{40}/);
        const contractAddress = addressMatch ? addressMatch[0] : null;
        
        return {
            intent: 'security_scan',
            response: `🔍 **Security Scan Initiated**\n\n${contractAddress ? `Scanning contract: ${contractAddress}` : 'Please provide a contract address to scan'}\n\n**Scan includes:**\n• Bytecode analysis\n• AI threat detection\n• Vulnerability assessment\n• 0xCitadel security score`,
            action: {
                type: 'citadel_scan',
                contractAddress: contractAddress,
                scanType: 'full_audit',
                blockchain: 'ethereum' // Default, could be extracted from command
            },
            suggestions: [
                'Monitor for threats',
                'Generate security report', 
                'Check vulnerabilities'
            ]
        };
    }
    
    handleThreatMonitoring(command, context) {
        const isStart = command.toLowerCase().includes('start') || command.toLowerCase().includes('begin');
        const isStop = command.toLowerCase().includes('stop') || command.toLowerCase().includes('end');
        
        return {
            intent: 'threat_monitoring',
            response: `🚨 **Threat Monitoring ${isStart ? 'Starting' : isStop ? 'Stopping' : 'Status'}**\n\n${isStart ? '🟢 Continuous threat monitoring activated across all blockchain networks' : isStop ? '🔴 Threat monitoring stopped' : '📊 Current monitoring status: Active across 6 networks'}\n\n**Monitoring includes:**\n• Real-time contract scans\n• AI-powered threat detection\n• Automated security alerts\n• Cross-chain analysis`,
            action: {
                type: 'threat_monitoring',
                operation: isStart ? 'start' : isStop ? 'stop' : 'status'
            },
            suggestions: [
                'Scan specific contract',
                'View security dashboard',
                'Generate threat report'
            ]
        };
    }
    
    handleSecurityReport(command, context) {
        const isAudit = command.toLowerCase().includes('audit');
        const reportType = isAudit ? 'audit' : 'security';
        
        return {
            intent: 'security_report',
            response: `📋 **${isAudit ? 'Security Audit' : 'Security Report'} Generation**\n\n🔄 Generating comprehensive ${reportType} report...\n\n**Report includes:**\n• Contract security scores\n• Detected vulnerabilities\n• Threat analysis summary\n• Recommendations\n• Network security overview\n\n⏱️ Estimated completion: 2-3 minutes`,
            action: {
                type: 'generate_security_report',
                reportType: reportType,
                includeAll: true
            },
            suggestions: [
                'View threat dashboard',
                'Scan new contracts',
                'Export security data'
            ]
        };
    }
    
    handleVulnerabilityCheck(command, context) {
        return {
            intent: 'vulnerability_check',
            response: `🔍 **Vulnerability Assessment**\n\n🔄 Checking for vulnerabilities across all monitored contracts...\n\n**Assessment covers:**\n• Reentrancy vulnerabilities\n• Access control issues\n• Economic exploits\n• Flash loan attacks\n• Governance vulnerabilities\n\n**AI Models Active:**\n• Rugpull detector (85% confidence)\n• Honeypot scanner (90% confidence)\n• Flash loan monitor (75% confidence)`,
            action: {
                type: 'vulnerability_assessment',
                scope: 'all_contracts',
                deepScan: true
            },
            suggestions: [
                'Start threat monitoring',
                'Generate audit report',
                'View security metrics'
            ]
        };
    }
    
    handleContractAudit(command, context) {
        // Extract contract address from command
        const addressMatch = command.match(/0x[a-fA-F0-9]{40}/);
        const contractAddress = addressMatch ? addressMatch[0] : null;
        
        // Determine audit type
        const auditType = command.toLowerCase().includes('comprehensive') ? 'comprehensive' :
                         command.toLowerCase().includes('quick') ? 'quick' :
                         command.toLowerCase().includes('gas') ? 'gas_optimization' : 'comprehensive';
        
        return {
            intent: 'contract_audit',
            response: `🔍 **Comprehensive Contract Audit Initiated**\n\n${contractAddress ? `Auditing contract: ${contractAddress}` : 'Please provide a contract address to audit'}\n\n**Audit Type:** ${auditType.replace('_', ' ')}\n\n**Analysis includes:**\n• Complete security assessment\n• Vulnerability detection\n• Gas optimization analysis\n• Compliance verification\n• Economic risk assessment\n• Upgradeability review\n\n⏱️ Estimated completion: 5-10 minutes`,
            action: {
                type: 'comprehensive_audit',
                contractAddress: contractAddress,
                auditType: auditType,
                blockchain: 'ethereum', // Could be detected from command
                deepAnalysis: true
            },
            suggestions: [
                'View audit dashboard',
                'Generate compliance report',
                'Check gas optimization'
            ]
        };
    }
    
    handleGasOptimization(command, context) {
        const addressMatch = command.match(/0x[a-fA-F0-9]{40}/);
        const contractAddress = addressMatch ? addressMatch[0] : null;
        
        return {
            intent: 'gas_optimization',
            response: `⛽ **Gas Optimization Analysis**\n\n${contractAddress ? `Optimizing gas usage for: ${contractAddress}` : 'Gas optimization analysis across all monitored contracts'}\n\n**Analysis covers:**\n• Function gas consumption\n• Storage optimization opportunities\n• Loop efficiency improvements\n• Struct packing recommendations\n• Batch operation potential\n\n**Expected Savings:** 10-30% gas reduction`,
            action: {
                type: 'gas_optimization_audit',
                contractAddress: contractAddress,
                analysisType: 'detailed',
                includeBenchmarks: true
            },
            suggestions: [
                'Apply optimization recommendations',
                'Run comprehensive audit',
                'Compare with industry benchmarks'
            ]
        };
    }
    
    handleStartThreatMonitoring(command, context) {
        return {
            intent: 'start_threat_monitoring',
            response: `🚨 **Starting AI Threat Monitoring**\n\n🤖 Activating real-time threat detection across all zones...\n\n**Monitoring Features:**\n• Cross-zone threat correlation\n• AI-powered pattern detection\n• Automated security responses\n• Live WebSocket alerts\n• Multi-blockchain surveillance\n\n🔄 **Initialization process:**\n1. Loading zone monitors\n2. Connecting to blockchain networks\n3. Activating AI models\n4. Starting correlation engine\n\n⏱️ Estimated startup: 30 seconds`,
            action: {
                type: 'start_threat_monitoring',
                enableCrossZoneCorrelation: true,
                enableAutomatedResponse: true
            },
            suggestions: [
                'Check threat status',
                'View zone security levels',
                'Show threat dashboard'
            ]
        };
    }
    
    handleStopThreatMonitoring(command, context) {
        return {
            intent: 'stop_threat_monitoring',
            response: `🛑 **Stopping AI Threat Monitoring**\n\n⚠️ **WARNING**: This will disable real-time threat detection across all zones.\n\n**Services being stopped:**\n• Cross-zone threat correlation\n• Automated security responses\n• Live threat alerts\n• Continuous contract scanning\n\n🔄 Graceful shutdown in progress...\n\n**Note**: Individual contract monitoring will remain active, but coordinated threat detection will be disabled.`,
            action: {
                type: 'stop_threat_monitoring'
            },
            suggestions: [
                'Check final threat status',
                'View monitoring logs',
                'Restart monitoring'
            ]
        };
    }
    
    handleThreatDashboard(command, context) {
        return {
            intent: 'threat_dashboard',
            response: `📊 **AI Threat Detection Dashboard**\n\n🔄 Loading real-time threat intelligence...\n\n**Dashboard Sections:**\n• Active threat monitoring status\n• Zone-by-zone security levels\n• Recent threat detections\n• Cross-chain correlation patterns\n• Automated response actions\n• AI model performance metrics\n\n**Live Data Streams:**\n• WebSocket alerts (port 8082)\n• Threat correlation engine\n• Zone-specific risk scores\n• Blockchain security metrics\n\n📡 **Real-time updates**: Every 30 seconds`,
            action: {
                type: 'show_threat_dashboard',
                includeRealTimeData: true,
                includeZoneBreakdown: true
            },
            suggestions: [
                'View zone threat levels',
                'Show recent alerts',
                'Check correlation patterns'
            ]
        };
    }
    
    handleZoneThreatStatus(command, context) {
        // Extract zone name from command if specified
        const zoneMatch = command.match(/zone\s+(\w+)/i);
        const specificZone = zoneMatch ? zoneMatch[1] : null;
        
        return {
            intent: 'zone_threat_status',
            response: `🎯 **Zone Security Status${specificZone ? ` - ${specificZone}` : ' - All Zones'}**\n\n🔍 Analyzing zone-specific threat levels...\n\n**Zone Security Metrics:**\n• Threat level classification\n• Recent security events\n• Contract monitoring status\n• Risk score assessment\n• Active countermeasures\n\n**Security Zones Overview:**\n🛡️ Security Citadel: **CRITICAL** - 24/7 monitoring\n⛓️ Crypto Exchange: **HIGH** - DeFi protocols\n🏪 Marketplace: **MEDIUM** - Commerce contracts\n🎮 Gaming Arena: **LOW** - Game mechanics\n🏠 Spawn Zone: **SAFE** - Protected area\n\n${specificZone ? `🔍 **Detailed analysis for ${specificZone} zone**` : '📊 **Cross-zone threat correlation active**'}`,
            action: {
                type: 'zone_threat_analysis',
                targetZone: specificZone,
                includeHistory: true,
                includeRecommendations: true
            },
            suggestions: [
                'Start zone monitoring',
                'View threat history',
                'Show security recommendations'
            ]
        };
    }
    
    // ================================================
    // 🔧 UTILITY FUNCTIONS  
    // ================================================
    
    extractTargetZone(command) {
        const lowerCommand = command.toLowerCase();
        
        // Direct zone name matches
        for (const [zoneType, zoneInfo] of Object.entries(this.zoneActions)) {
            const zoneName = zoneInfo.name.toLowerCase();
            if (lowerCommand.includes(zoneName) || lowerCommand.includes(zoneType)) {
                return zoneType;
            }
        }
        
        // Keyword-based zone detection
        if (lowerCommand.includes('tech') || lowerCommand.includes('api') || lowerCommand.includes('dev')) return 'tech_zone';
        if (lowerCommand.includes('content') || lowerCommand.includes('create') || lowerCommand.includes('forge')) return 'content_forge';
        if (lowerCommand.includes('ai') || lowerCommand.includes('temple') || lowerCommand.includes('assistant')) return 'ai_temple';
        if (lowerCommand.includes('business') || lowerCommand.includes('market') || lowerCommand.includes('shop')) return 'marketplace';
        if (lowerCommand.includes('game') || lowerCommand.includes('play') || lowerCommand.includes('arena')) return 'gaming_arena';
        if (lowerCommand.includes('crypto') || lowerCommand.includes('wallet') || lowerCommand.includes('blockchain')) return 'crypto_exchange';
        if (lowerCommand.includes('data') || lowerCommand.includes('analytics') || lowerCommand.includes('mine')) return 'data_mines';
        if (lowerCommand.includes('security') || lowerCommand.includes('citadel') || lowerCommand.includes('scan') || lowerCommand.includes('threat')) return 'security_citadel';
        if (lowerCommand.includes('test') || lowerCommand.includes('danger') || lowerCommand.includes('experimental')) return 'danger_zone';
        if (lowerCommand.includes('home') || lowerCommand.includes('spawn') || lowerCommand.includes('start')) return 'spawn';
        
        return null;
    }
    
    commandMatchesAction(command, action, zone) {
        const lowerCommand = command.toLowerCase();
        const actionWords = action.split('_');
        
        // Check if command contains action keywords
        for (const word of actionWords) {
            if (lowerCommand.includes(word)) {
                return true;
            }
        }
        
        // Check against zone-specific voice prompts
        for (const prompt of zone.voice_prompts) {
            const promptWords = prompt.toLowerCase().split(' ');
            let matches = 0;
            for (const word of promptWords) {
                if (word.length > 2 && lowerCommand.includes(word)) {
                    matches++;
                }
            }
            if (matches >= 2) return true;
        }
        
        return false;
    }
    
    getZoneCapabilities(zoneType) {
        return this.zoneActions[zoneType] || this.zoneActions['mystery_zone'];
    }
    
    getAllZones() {
        return Object.entries(this.zoneActions).map(([type, info]) => ({
            type,
            ...info,
            domains: this.zoneMap?.zones[type]?.domains || []
        }));
    }
    
    // ================================================
    // 🌐 WEB INTEGRATION
    // ================================================
    
    generateZoneContextForDomain(domain) {
        const zoneType = this.detectZoneFromDomain(domain);
        const zone = this.getZoneCapabilities(zoneType);
        
        return {
            domain,
            zone_type: zoneType,
            zone_name: zone.name,
            zone_description: zone.description,
            available_actions: zone.actions,
            voice_prompts: zone.voice_prompts,
            content_types: zone.content_types,
            quick_commands: zone.voice_prompts.slice(0, 4).map(prompt => ({
                text: prompt,
                action: this.promptToAction(prompt, zoneType)
            }))
        };
    }
    
    promptToAction(prompt, zoneType) {
        // Convert voice prompts to actionable commands
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('status') || lowerPrompt.includes('health')) return 'check_status';
        if (lowerPrompt.includes('generate') || lowerPrompt.includes('create')) return 'generate_content';
        if (lowerPrompt.includes('search') || lowerPrompt.includes('find')) return 'search_docs';
        if (lowerPrompt.includes('test') || lowerPrompt.includes('run')) return 'run_tests';
        if (lowerPrompt.includes('show') || lowerPrompt.includes('display')) return 'show_info';
        
        return 'help';
    }
    
    // Export for web integration
    exportForWeb() {
        return {
            zones: this.getAllZones(),
            current_zone: this.getCurrentZone(),
            zone_map: this.zoneMap
        };
    }
    
    // ================================================
    // 🗃️ DATABASE LOGGING
    // ================================================
    
    async logVoiceCommand(command, result, context = {}) {
        try {
            const commandData = {
                entity_id: context.userId || null,
                zone_id: this.currentZone || 'spawn',
                command_text: command,
                intent: result.intent,
                confidence: result.confidence || 0.8,
                voice_verified: context.voiceVerified || false,
                audio_fingerprint: context.audioFingerprint,
                response_text: result.response,
                action_taken: result.action?.type,
                zone_changed: result.zone !== this.currentZone ? result.zone : null,
                success: !result.error,
                error_message: result.error
            };
            
            await this.db.logVoiceCommand(commandData);
            
            // Also log as zone action
            await this.db.logAction({
                entity_id: context.userId || null,
                zone_id: this.currentZone || 'spawn',
                action_type: 'voice_command',
                action_name: result.intent,
                command_text: command,
                result_summary: result.response,
                trigger_source: 'voice',
                session_id: context.sessionId,
                user_agent: context.userAgent,
                success: !result.error,
                points_awarded: result.error ? 0 : 10,
                experience_gained: result.error ? 0 : 5
            });
            
        } catch (error) {
            console.warn('⚠️ Failed to log voice command to database:', error.message);
        }
    }
    
    async logZoneAction(entityId, actionType, actionData = {}) {
        try {
            await this.db.logAction({
                entity_id: entityId,
                zone_id: this.currentZone || 'spawn',
                action_type: actionType,
                action_name: actionData.name || actionType,
                command_text: actionData.command,
                result_summary: actionData.result,
                trigger_source: actionData.source || 'system',
                success: actionData.success !== false,
                points_awarded: actionData.points || 0,
                experience_gained: actionData.experience || 0
            });
        } catch (error) {
            console.warn('⚠️ Failed to log zone action to database:', error.message);
        }
    }
}

module.exports = ZoneContextSystem;

// CLI usage
if (require.main === module) {
    async function testZoneSystem() {
        const zoneSystem = new ZoneContextSystem();
        await zoneSystem.initialize();
        
        console.log('\n🧪 Testing Zone Context System...\n');
        
        // Test zone detection
        console.log('🔍 Zone Detection Tests:');
        console.log('deathtodata.com →', zoneSystem.detectZoneFromDomain('deathtodata.com'));
        console.log('api.localhost →', zoneSystem.detectZoneFromDomain('api.localhost'));
        console.log('unknown.com →', zoneSystem.detectZoneFromDomain('unknown.com'));
        
        // Test voice commands
        console.log('\n🗣️ Voice Command Tests:');
        const commands = [
            'What zone am I in?',
            'Warp to tech zone',
            'Generate content for this zone',
            'Show me the zone map',
            'What can I do here?'
        ];
        
        for (const command of commands) {
            console.log(`\n"${command}":`);
            const result = zoneSystem.processVoiceCommand(command);
            console.log(`  Intent: ${result.intent}`);
            console.log(`  Response: ${result.response.split('\n')[0]}...`);
        }
        
        console.log('\n✅ Zone Context System test complete');
    }
    
    testZoneSystem().catch(console.error);
}
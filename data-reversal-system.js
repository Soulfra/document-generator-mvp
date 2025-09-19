#!/usr/bin/env node

/**
 * 🔄 DATA REVERSAL COMBAT SYSTEM
 * Reverse engineer what they collected on you and display it properly
 * Turn the tables - use their own infrastructure to audit what they know
 */

class DataReversalSystem {
    constructor(unifiedGameNode) {
        this.gameNode = unifiedGameNode;
        this.reversalBattles = new Map();
        this.collectedData = new Map();
        this.reverseAudits = new Map();
        this.dataProfiles = new Map();
        
        this.init();
    }
    
    init() {
        console.log('🔄 Data Reversal Combat System loaded - Ready to reverse their surveillance!');
    }
    
    async startReversalBattle(playerId, targetUrl, reversalConfig = {}) {
        const reversalId = `reversal_${Date.now()}`;
        const reversal = {
            id: reversalId,
            playerId,
            targetUrl,
            status: 'initializing',
            phase: 'reconnaissance',
            startTime: new Date(),
            character: await this.getPlayerCharacter(playerId),
            target: await this.analyzeTarget(targetUrl),
            phases: [],
            extractedData: [],
            reverseProfiles: [],
            counterIntelligence: [],
            dataDisplay: {}
        };
        
        this.reversalBattles.set(reversalId, reversal);
        
        console.log(`🔄 REVERSAL BATTLE INITIATED: ${playerId} vs ${targetUrl}`);
        console.log(`🎯 Reversal ID: ${reversalId}`);
        
        // Execute reversal phases
        await this.executeDataMining(reversal);
        await this.executeCookieReversal(reversal);
        await this.executeTrackerReversal(reversal);
        await this.executeFingerprinting(reversal);
        await this.executeProfileExtraction(reversal);
        await this.executeDataDisplay(reversal);
        
        reversal.status = 'completed';
        reversal.endTime = new Date();
        reversal.duration = reversal.endTime - reversal.startTime;
        
        this.reverseAudits.set(reversalId, reversal);
        
        return reversal;
    }
    
    async analyzeTarget(url) {
        console.log(`🔍 ANALYZING TARGET FOR REVERSAL: ${url}`);
        
        const urlObj = new URL(url);
        const target = {
            url: url,
            domain: urlObj.hostname,
            
            // What they likely collect about you
            trackingLevel: this.calculateTrackingLevel(urlObj),
            dataCollection: this.identifyDataCollection(urlObj),
            surveillance: this.identifySurveillance(urlObj),
            fingerprinting: this.identifyFingerprinting(urlObj),
            
            // Weaknesses we can exploit for reversal
            reversalVectors: this.identifyReversalVectors(urlObj),
            vulnPoints: this.identifyVulnerabilities(urlObj)
        };
        
        console.log(`🎯 TARGET ANALYZED FOR REVERSAL:`);
        console.log(`   Domain: ${target.domain}`);
        console.log(`   Tracking Level: ${target.trackingLevel}`);
        console.log(`   Data Collection: ${target.dataCollection.join(', ')}`);
        console.log(`   Reversal Vectors: ${target.reversalVectors.length}`);
        
        return target;
    }
    
    calculateTrackingLevel(urlObj) {
        let level = 1;
        
        // Big tech companies have massive tracking
        if (['google.com', 'facebook.com', 'amazon.com', 'microsoft.com'].some(domain => 
            urlObj.hostname.includes(domain))) {
            level = 10;
        }
        
        // Social media platforms
        if (['twitter.com', 'instagram.com', 'tiktok.com', 'linkedin.com'].some(domain => 
            urlObj.hostname.includes(domain))) {
            level = 8;
        }
        
        // Ad networks
        if (['doubleclick.net', 'googlesyndication.com', 'adsystem.com'].some(domain => 
            urlObj.hostname.includes(domain))) {
            level = 9;
        }
        
        // E-commerce sites
        if (urlObj.hostname.includes('shop') || urlObj.hostname.includes('store')) {
            level = 6;
        }
        
        return level;
    }
    
    identifyDataCollection(urlObj) {
        const collection = ['basic_analytics']; // Everyone has this
        
        // Big tech collects everything
        if (urlObj.hostname.includes('google')) {
            collection.push('search_history', 'location_data', 'email_content', 'browsing_patterns', 
                           'device_fingerprint', 'behavioral_analysis', 'social_graph');
        }
        
        if (urlObj.hostname.includes('facebook') || urlObj.hostname.includes('meta')) {
            collection.push('social_connections', 'political_views', 'interests', 'messaging_data',
                           'cross_platform_tracking', 'real_name_identity', 'relationship_status');
        }
        
        if (urlObj.hostname.includes('amazon')) {
            collection.push('purchase_history', 'financial_data', 'voice_recordings', 'smart_home_data',
                           'reading_habits', 'viewing_preferences');
        }
        
        // Common tracking elements
        collection.push('ip_address', 'user_agent', 'screen_resolution', 'timezone');
        
        return collection;
    }
    
    identifySurveillance(urlObj) {
        const surveillance = [];
        
        // Check for known surveillance patterns
        if (urlObj.hostname.includes('google')) {
            surveillance.push('cross_site_tracking', 'gmail_scanning', 'location_history');
        }
        
        if (urlObj.hostname.includes('facebook')) {
            surveillance.push('shadow_profiles', 'offline_activity_tracking', 'facial_recognition');
        }
        
        // Government/corporate surveillance indicators
        if (urlObj.hostname.includes('.gov')) {
            surveillance.push('traffic_analysis', 'metadata_collection', 'pattern_matching');
        }
        
        return surveillance;
    }
    
    identifyFingerprinting(urlObj) {
        return [
            'canvas_fingerprinting',
            'webgl_fingerprinting', 
            'audio_fingerprinting',
            'font_enumeration',
            'screen_metrics',
            'timezone_detection',
            'language_detection',
            'plugin_enumeration'
        ];
    }
    
    identifyReversalVectors(urlObj) {
        const vectors = [];
        
        // Common reversal techniques
        vectors.push('cookie_analysis', 'local_storage_extraction', 'session_replay');
        
        // Domain-specific vectors
        if (urlObj.hostname.includes('google')) {
            vectors.push('takeout_data_request', 'my_activity_scraping', 'ad_preferences_reversal');
        }
        
        if (urlObj.hostname.includes('facebook')) {
            vectors.push('download_your_data', 'ad_library_mining', 'graph_api_exploitation');
        }
        
        vectors.push('gdpr_data_request', 'api_endpoint_discovery', 'client_side_data_mining');
        
        return vectors;
    }
    
    identifyVulnerabilities(urlObj) {
        return [
            'exposed_debug_endpoints',
            'unprotected_api_routes', 
            'client_side_data_leakage',
            'session_hijacking_vectors',
            'cors_misconfigurations'
        ];
    }
    
    async executeDataMining(reversal) {
        console.log(`\n🕳️ PHASE 1: DATA MINING REVERSAL`);
        reversal.phase = 'data_mining';
        
        const phase = {
            phase: 'data_mining',
            actions: [],
            discoveries: [],
            extracted_data: [],
            vulnerabilities_found: 0
        };
        
        // Mine what data they have on you
        phase.actions.push('Scanning target for data collection points');
        phase.actions.push('Analyzing JavaScript tracking code');
        phase.actions.push('Enumerating tracking pixels and beacons');
        
        // Simulate discovering tracking mechanisms
        reversal.target.dataCollection.forEach(dataType => {
            phase.discoveries.push(`📊 Data Collection: ${dataType}`);
            phase.extracted_data.push({
                type: dataType,
                source: 'client_side_analysis',
                confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
                description: this.getDataDescription(dataType)
            });
        });
        
        // Character abilities help
        if (reversal.character.abilities.includes('stealth_probe')) {
            phase.actions.push('Character uses Stealth Probe - Hidden tracking discovered');
            phase.discoveries.push('🕵️ STEALTH: Hidden iframe trackers detected');
            phase.discoveries.push('🕵️ STEALTH: Invisible pixel beacons found');
            phase.vulnerabilities_found += 2;
        }
        
        reversal.phases.push(phase);
        console.log(`   🕳️ Data mining complete! Extracted ${phase.extracted_data.length} data types`);
        
        return phase;
    }
    
    async executeCookieReversal(reversal) {
        console.log(`\n🍪 PHASE 2: COOKIE & STORAGE REVERSAL`);
        reversal.phase = 'cookie_reversal';
        
        const phase = {
            phase: 'cookie_reversal',
            actions: [],
            discoveries: [],
            cookies_analyzed: 0,
            storage_extracted: [],
            tracking_ids: []
        };
        
        phase.actions.push('Analyzing first-party cookies');
        phase.actions.push('Discovering third-party tracking cookies');
        phase.actions.push('Extracting local storage data');
        phase.actions.push('Analyzing session storage contents');
        
        // Simulate cookie analysis
        const cookieTypes = [
            { name: '_ga', purpose: 'Google Analytics tracking', data: 'user_session_data' },
            { name: '_fbp', purpose: 'Facebook Pixel tracking', data: 'behavioral_patterns' },
            { name: 'session_id', purpose: 'Session management', data: 'login_state' },
            { name: '_hjid', purpose: 'Hotjar user tracking', data: 'interaction_recording' },
            { name: '__utma', purpose: 'Google Analytics user ID', data: 'unique_visitor_id' }
        ];
        
        cookieTypes.forEach(cookie => {
            phase.cookies_analyzed++;
            phase.discoveries.push(`🍪 Cookie: ${cookie.name} - ${cookie.purpose}`);
            phase.tracking_ids.push({
                cookie: cookie.name,
                trackingId: this.generateFakeTrackingId(),
                purpose: cookie.purpose,
                dataCollected: cookie.data
            });
        });
        
        // Local storage extraction
        const storageData = [
            'user_preferences',
            'browsing_history_cache', 
            'form_autofill_data',
            'shopping_cart_contents',
            'recently_viewed_items'
        ];
        
        storageData.forEach(data => {
            phase.storage_extracted.push({
                type: data,
                size: Math.floor(Math.random() * 50) + 10 + 'KB',
                lastModified: new Date(Date.now() - Math.random() * 86400000)
            });
            phase.discoveries.push(`💾 Storage: ${data} extracted`);
        });
        
        reversal.phases.push(phase);
        console.log(`   🍪 Cookie reversal complete! Analyzed ${phase.cookies_analyzed} cookies`);
        
        return phase;
    }
    
    async executeTrackerReversal(reversal) {
        console.log(`\n📡 PHASE 3: TRACKER NETWORK REVERSAL`);
        reversal.phase = 'tracker_reversal';
        
        const phase = {
            phase: 'tracker_reversal',
            actions: [],
            discoveries: [],
            tracker_network: [],
            data_flows: []
        };
        
        phase.actions.push('Mapping third-party tracker network');
        phase.actions.push('Analyzing cross-site tracking flows');
        phase.actions.push('Discovering data sharing partnerships');
        
        // Common tracker networks
        const trackers = [
            { name: 'Google Analytics', domain: 'google-analytics.com', purpose: 'Site analytics' },
            { name: 'Facebook Pixel', domain: 'facebook.com', purpose: 'Ad targeting' },
            { name: 'Amazon Associates', domain: 'amazon-adsystem.com', purpose: 'Product tracking' },
            { name: 'Hotjar', domain: 'hotjar.com', purpose: 'User behavior recording' },
            { name: 'Mixpanel', domain: 'mixpanel.com', purpose: 'Event tracking' }
        ];
        
        trackers.forEach(tracker => {
            phase.tracker_network.push(tracker);
            phase.discoveries.push(`📡 Tracker: ${tracker.name} (${tracker.purpose})`);
            
            // Data flows between trackers
            phase.data_flows.push({
                from: reversal.target.domain,
                to: tracker.domain,
                dataTypes: ['user_id', 'page_views', 'interaction_events'],
                frequency: 'real_time'
            });
        });
        
        // Use wormhole layer to trace data flows
        if (this.gameNode.torrentLayer) {
            phase.actions.push('Using wormhole layer to trace data flows');
            phase.discoveries.push('🌀 WORMHOLE: Data flows traced through torrent layer');
            phase.discoveries.push('🌀 WORMHOLE: Cross-platform tracking detected');
        }
        
        reversal.phases.push(phase);
        console.log(`   📡 Tracker reversal complete! Mapped ${phase.tracker_network.length} trackers`);
        
        return phase;
    }
    
    async executeFingerprinting(reversal) {
        console.log(`\n👤 PHASE 4: FINGERPRINTING REVERSAL`);
        reversal.phase = 'fingerprinting';
        
        const phase = {
            phase: 'fingerprinting',
            actions: [],
            discoveries: [],
            fingerprint_data: {},
            uniqueness_score: 0
        };
        
        phase.actions.push('Analyzing browser fingerprinting techniques');
        phase.actions.push('Extracting device characteristics');
        phase.actions.push('Calculating fingerprint uniqueness');
        
        // Simulate fingerprint extraction
        phase.fingerprint_data = {
            screen_resolution: '1920x1080',
            timezone: 'America/New_York',
            language: 'en-US',
            platform: 'MacIntel',
            user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            canvas_hash: this.generateCanvasHash(),
            webgl_hash: this.generateWebGLHash(),
            installed_fonts: ['Arial', 'Helvetica', 'Times New Roman', 'Courier New'],
            plugins: ['Chrome PDF Plugin', 'Widevine Content Decryption Module'],
            audio_fingerprint: this.generateAudioFingerprint()
        };
        
        // Calculate uniqueness
        phase.uniqueness_score = Math.random() * 0.3 + 0.7; // 70-100% unique
        
        Object.entries(phase.fingerprint_data).forEach(([key, value]) => {
            phase.discoveries.push(`👤 Fingerprint: ${key} = ${Array.isArray(value) ? value.join(', ') : value}`);
        });
        
        phase.discoveries.push(`🎯 Fingerprint Uniqueness: ${(phase.uniqueness_score * 100).toFixed(1)}%`);
        
        // Character abilities help with fingerprint reversal
        if (reversal.character.abilities.includes('pattern_sight')) {
            phase.actions.push('Character uses Pattern Sight - Fingerprint evasion detected');
            phase.discoveries.push('👁️ PATTERN: Anti-fingerprinting measures identified');
            phase.discoveries.push('👁️ PATTERN: Fingerprint spoofing opportunities found');
        }
        
        reversal.phases.push(phase);
        console.log(`   👤 Fingerprinting reversal complete! Uniqueness: ${(phase.uniqueness_score * 100).toFixed(1)}%`);
        
        return phase;
    }
    
    async executeProfileExtraction(reversal) {
        console.log(`\n📝 PHASE 5: PROFILE EXTRACTION`);
        reversal.phase = 'profile_extraction';
        
        const phase = {
            phase: 'profile_extraction',
            actions: [],
            discoveries: [],
            extracted_profiles: [],
            inferred_data: []
        };
        
        phase.actions.push('Extracting user profile data');
        phase.actions.push('Analyzing behavioral patterns');
        phase.actions.push('Inferring demographic information');
        
        // Build profile from collected data
        const profile = {
            digital_identity: {
                tracking_id: this.generateFakeTrackingId(),
                session_count: Math.floor(Math.random() * 1000) + 100,
                last_seen: new Date(),
                device_count: Math.floor(Math.random() * 5) + 1
            },
            behavioral_profile: {
                interests: this.inferInterests(reversal.target.domain),
                browsing_patterns: this.inferBrowsingPatterns(),
                interaction_style: this.inferInteractionStyle(),
                purchase_intent: Math.random()
            },
            demographic_inference: {
                age_range: this.inferAgeRange(),
                location: this.inferLocation(),
                income_bracket: this.inferIncome(),
                tech_savviness: Math.random()
            },
            risk_assessment: {
                fraud_score: Math.random() * 0.3, // Low fraud score
                bot_probability: Math.random() * 0.2, // Low bot probability
                privacy_awareness: Math.random() * 0.8 + 0.2 // 20-100% aware
            }
        };
        
        phase.extracted_profiles.push(profile);
        
        // Display what they know about you
        phase.discoveries.push(`📝 Profile: ${profile.digital_identity.session_count} sessions tracked`);
        phase.discoveries.push(`📝 Interests: ${profile.behavioral_profile.interests.join(', ')}`);
        phase.discoveries.push(`📝 Demographics: ${profile.demographic_inference.age_range}, ${profile.demographic_inference.location}`);
        phase.discoveries.push(`📝 Risk Score: ${(profile.risk_assessment.fraud_score * 100).toFixed(1)}% fraud risk`);
        
        reversal.phases.push(phase);
        console.log(`   📝 Profile extraction complete! ${phase.extracted_profiles.length} profiles extracted`);
        
        return phase;
    }
    
    async executeDataDisplay(reversal) {
        console.log(`\n📊 PHASE 6: DATA DISPLAY GENERATION`);
        reversal.phase = 'data_display';
        
        const dataDisplay = {
            summary: {
                target: reversal.targetUrl,
                tracking_level: reversal.target.trackingLevel,
                data_points_collected: this.countDataPoints(reversal),
                privacy_invasion_score: this.calculatePrivacyInvasion(reversal),
                reversal_success: true
            },
            what_they_know: {
                personal_data: this.extractPersonalData(reversal),
                behavioral_data: this.extractBehavioralData(reversal),
                technical_data: this.extractTechnicalData(reversal),
                tracking_network: this.extractTrackingNetwork(reversal)
            },
            your_digital_footprint: {
                unique_identifiers: this.extractUniqueIdentifiers(reversal),
                cross_site_tracking: this.extractCrossSiteTracking(reversal),
                data_sharing_partners: this.extractDataPartners(reversal),
                retention_period: this.estimateRetentionPeriod(reversal.target.domain)
            },
            countermeasures: {
                detected_vulnerabilities: this.extractVulnerabilities(reversal),
                evasion_opportunities: this.identifyEvasionOpportunities(reversal),
                data_deletion_options: this.identifyDeletionOptions(reversal.target.domain),
                privacy_tools: this.recommendPrivacyTools(reversal)
            }
        };
        
        reversal.dataDisplay = dataDisplay;
        
        console.log(`   📊 Data display generated! Privacy invasion score: ${dataDisplay.summary.privacy_invasion_score}/10`);
        
        return dataDisplay;
    }
    
    // Helper methods for data analysis
    getDataDescription(dataType) {
        const descriptions = {
            'basic_analytics': 'Page views, session duration, bounce rate',
            'search_history': 'Every search query you\'ve made',
            'location_data': 'Your physical location and movement patterns',
            'browsing_patterns': 'Sites visited, time spent, click patterns',
            'purchase_history': 'Everything you\'ve bought and considered buying',
            'social_connections': 'Your friends, family, and social network',
            'device_fingerprint': 'Unique identifier for your device',
            'behavioral_analysis': 'Predictions about your behavior and preferences'
        };
        return descriptions[dataType] || 'Data collection type';
    }
    
    generateFakeTrackingId() {
        return 'GA1.2.' + Math.floor(Math.random() * 1000000000) + '.' + Math.floor(Date.now() / 1000);
    }
    
    generateCanvasHash() {
        return 'canvas_' + Math.random().toString(36).substr(2, 16);
    }
    
    generateWebGLHash() {
        return 'webgl_' + Math.random().toString(36).substr(2, 16);
    }
    
    generateAudioFingerprint() {
        return 'audio_' + Math.random().toString(36).substr(2, 12);
    }
    
    inferInterests(domain) {
        const interestMap = {
            'google': ['search', 'productivity', 'technology'],
            'facebook': ['social_media', 'entertainment', 'news'],
            'amazon': ['shopping', 'entertainment', 'technology'],
            'youtube': ['video', 'entertainment', 'education'],
            'default': ['technology', 'web_browsing', 'general_internet']
        };
        
        for (const [key, interests] of Object.entries(interestMap)) {
            if (domain.includes(key)) return interests;
        }
        return interestMap.default;
    }
    
    inferBrowsingPatterns() {
        return {
            session_length: Math.floor(Math.random() * 30) + 5 + ' minutes',
            pages_per_session: Math.floor(Math.random() * 10) + 3,
            return_visitor: Math.random() > 0.3,
            mobile_usage: Math.floor(Math.random() * 60) + 20 + '%'
        };
    }
    
    inferInteractionStyle() {
        const styles = ['power_user', 'casual_browser', 'researcher', 'quick_scanner'];
        return styles[Math.floor(Math.random() * styles.length)];
    }
    
    inferAgeRange() {
        const ranges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
        return ranges[Math.floor(Math.random() * ranges.length)];
    }
    
    inferLocation() {
        const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
        return locations[Math.floor(Math.random() * locations.length)];
    }
    
    inferIncome() {
        const brackets = ['$25K-$50K', '$50K-$75K', '$75K-$100K', '$100K-$150K', '$150K+'];
        return brackets[Math.floor(Math.random() * brackets.length)];
    }
    
    countDataPoints(reversal) {
        return reversal.phases.reduce((total, phase) => {
            return total + (phase.extracted_data?.length || 0) + (phase.discoveries?.length || 0);
        }, 0);
    }
    
    calculatePrivacyInvasion(reversal) {
        const trackingLevel = reversal.target.trackingLevel;
        const dataPoints = this.countDataPoints(reversal);
        return Math.min(10, Math.floor(trackingLevel + (dataPoints / 10)));
    }
    
    extractPersonalData(reversal) {
        return reversal.phases
            .filter(phase => phase.extracted_data)
            .flatMap(phase => phase.extracted_data)
            .filter(data => ['location_data', 'purchase_history', 'social_connections'].includes(data.type));
    }
    
    extractBehavioralData(reversal) {
        return reversal.phases
            .filter(phase => phase.extracted_data)
            .flatMap(phase => phase.extracted_data)
            .filter(data => ['browsing_patterns', 'behavioral_analysis', 'interaction_events'].includes(data.type));
    }
    
    extractTechnicalData(reversal) {
        const fingerprintPhase = reversal.phases.find(phase => phase.phase === 'fingerprinting');
        return fingerprintPhase ? fingerprintPhase.fingerprint_data : {};
    }
    
    extractTrackingNetwork(reversal) {
        const trackerPhase = reversal.phases.find(phase => phase.phase === 'tracker_reversal');
        return trackerPhase ? trackerPhase.tracker_network : [];
    }
    
    extractUniqueIdentifiers(reversal) {
        const cookiePhase = reversal.phases.find(phase => phase.phase === 'cookie_reversal');
        return cookiePhase ? cookiePhase.tracking_ids : [];
    }
    
    extractCrossSiteTracking(reversal) {
        const trackerPhase = reversal.phases.find(phase => phase.phase === 'tracker_reversal');
        return trackerPhase ? trackerPhase.data_flows : [];
    }
    
    extractDataPartners(reversal) {
        return reversal.target.dataCollection.map(type => ({
            partner: this.getDataPartner(type),
            dataShared: type,
            purpose: this.getDataPurpose(type)
        }));
    }
    
    getDataPartner(dataType) {
        const partners = {
            'search_history': 'Google/Bing',
            'social_connections': 'Facebook/Meta',
            'purchase_history': 'Amazon/PayPal',
            'location_data': 'Google Maps/Apple',
            'browsing_patterns': 'Data Brokers'
        };
        return partners[dataType] || 'Third-party analytics';
    }
    
    getDataPurpose(dataType) {
        const purposes = {
            'search_history': 'Ad targeting and personalization',
            'social_connections': 'Social graph analysis',
            'purchase_history': 'Product recommendations',
            'location_data': 'Location-based advertising',
            'browsing_patterns': 'Behavioral profiling'
        };
        return purposes[dataType] || 'Analytics and improvement';
    }
    
    estimateRetentionPeriod(domain) {
        if (domain.includes('google')) return '18 months to indefinite';
        if (domain.includes('facebook')) return '2 years to indefinite';
        if (domain.includes('amazon')) return '7 years for transactions';
        return '6 months to 2 years';
    }
    
    extractVulnerabilities(reversal) {
        return reversal.phases.flatMap(phase => 
            phase.discoveries?.filter(d => d.includes('vulnerability') || d.includes('exposed')) || []
        );
    }
    
    identifyEvasionOpportunities(reversal) {
        return [
            'Use VPN to mask IP address',
            'Enable tracking protection in browser',
            'Clear cookies regularly',
            'Use privacy-focused browser',
            'Disable JavaScript for tracking sites',
            'Use ad blockers with anti-tracking'
        ];
    }
    
    identifyDeletionOptions(domain) {
        const options = {
            'google': ['Google Takeout', 'My Activity deletion', 'Account deletion'],
            'facebook': ['Download Your Information', 'Activity log clearing', 'Account deactivation'],
            'amazon': ['Account & Login Info', 'Order history deletion', 'Browsing history clearing'],
            'default': ['GDPR data request', 'CCPA opt-out', 'Account deletion request']
        };
        
        for (const [key, deletionOptions] of Object.entries(options)) {
            if (domain.includes(key)) return deletionOptions;
        }
        return options.default;
    }
    
    recommendPrivacyTools(reversal) {
        return [
            'uBlock Origin - Ad and tracker blocking',
            'Privacy Badger - Tracking protection',
            'DuckDuckGo - Privacy-focused search',
            'Firefox with privacy settings - Secure browser',
            'VPN service - IP address masking',
            'Tor Browser - Anonymous browsing'
        ];
    }
    
    async getPlayerCharacter(playerId) {
        // Get character from dimensional skills system
        const profile = await this.gameNode.achievements?.getPlayerProfile(playerId);
        
        return {
            id: playerId,
            level: profile?.stats?.total_level || 1,
            skills: profile?.skills || {},
            abilities: this.getCharacterAbilities(profile)
        };
    }
    
    getCharacterAbilities(profile) {
        const abilities = ['basic_scan'];
        if (profile?.skills?.anomaly_detection?.level > 5) abilities.push('anomaly_sense');
        if (profile?.skills?.stealth?.level > 10) abilities.push('stealth_probe');
        if (profile?.skills?.pattern_recognition?.level > 5) abilities.push('pattern_sight');
        return abilities;
    }
    
    // API methods
    getReversalBattle(reversalId) {
        return this.reversalBattles.get(reversalId) || this.reverseAudits.get(reversalId);
    }
    
    getActiveReversals() {
        return Array.from(this.reversalBattles.values());
    }
    
    getDataDisplay(reversalId) {
        const reversal = this.getReversalBattle(reversalId);
        return reversal?.dataDisplay || null;
    }
}

module.exports = DataReversalSystem;
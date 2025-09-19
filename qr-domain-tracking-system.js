#!/usr/bin/env node

/**
 * 📱 QR DOMAIN TRACKING SYSTEM
 * Enhanced QR code generation with source domain tagging
 * Tracks where QR codes are scanned from, like bit.ly does
 */

const QRCode = require('qrcode');
const crypto = require('crypto');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

class QRDomainTrackingSystem {
    constructor() {
        this.qrDatabase = new Map();
        this.scanDatabase = new Map();
        this.domainPerformance = new Map();
        this.realTimeTracking = [];
        
        // QR configuration
        this.config = {
            // QR code generation options
            qrOptions: {
                errorCorrectionLevel: 'H', // High error correction (30%)
                type: 'png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 512
            },
            
            // Domain tracking configuration
            domains: {
                primary: 'cal.ai',          // Primary short domain
                fallback: 'soulfra.com',    // Fallback domain
                custom: [
                    'niceleak.com',
                    'bit.cal',
                    'qr.cool',
                    'scan.link'
                ]
            },
            
            // Tracking parameters
            tracking: {
                sourceTag: '_qrs',          // QR source domain tag
                campaignTag: '_qrc',        // QR campaign tag
                mediumTag: '_qrm',          // QR medium tag
                deviceTag: '_qrd',          // Device fingerprint tag
                geoTag: '_qrg',            // Geo location tag
                timestampTag: '_qrt',       // Scan timestamp tag
                versionTag: '_qrv'          // QR version tag
            },
            
            // Analytics configuration
            analytics: {
                realTimeWindow: 300000,     // 5 minutes
                aggregationInterval: 60000,  // 1 minute
                retentionDays: 90,
                heatmapResolution: 'city'
            }
        };
        
        this.init();
    }

    async init() {
        console.log('📱 Initializing QR Domain Tracking System...');
        console.log('🔗 Primary domain:', this.config.domains.primary);
        console.log('📊 Tracking parameters configured');
        
        await this.loadExistingQRCodes();
        await this.setupRealTimeTracking();
        await this.initializeAnalytics();
        
        console.log('✅ QR Domain Tracking System ready');
    }

    async generateTrackingQR(originalUrl, options = {}) {
        console.log('🎯 Generating tracking QR code for:', originalUrl);
        
        const qrId = this.generateQRId();
        const domain = options.customDomain || this.selectOptimalDomain(options);
        
        // Build tracking URL with source domain tagging
        const trackingUrl = this.buildTrackingUrl(originalUrl, {
            qrId,
            domain,
            campaign: options.campaign || 'default',
            medium: options.medium || 'qr',
            source: options.source || domain,
            metadata: options.metadata || {}
        });
        
        // Generate QR code with custom styling
        const qrCode = await this.generateStyledQR(trackingUrl, {
            ...options,
            logo: options.logo || this.getDomainLogo(domain),
            colors: options.colors || this.getDomainColors(domain),
            style: options.style || 'modern'
        });
        
        // Store QR code data
        const qrData = {
            id: qrId,
            shortCode: this.generateShortCode(),
            originalUrl,
            trackingUrl,
            domain,
            campaign: options.campaign,
            createdAt: new Date().toISOString(),
            createdBy: options.userId || 'anonymous',
            
            // QR specific data
            qrCode: qrCode.dataUrl,
            qrFormat: qrCode.format,
            errorCorrection: this.config.qrOptions.errorCorrectionLevel,
            
            // Tracking data
            scans: 0,
            uniqueScans: 0,
            lastScanned: null,
            
            // Performance metrics
            conversionRate: 0,
            avgScanTime: 0,
            topLocations: [],
            topDevices: [],
            
            // Options
            expiresAt: options.expiresAt || null,
            maxScans: options.maxScans || null,
            passwordProtected: options.password ? true : false,
            tags: options.tags || [],
            
            // Custom branding
            branding: {
                logo: options.logo,
                colors: qrCode.colors,
                style: qrCode.style,
                customDomain: options.customDomain
            }
        };
        
        this.qrDatabase.set(qrId, qrData);
        
        console.log(`✅ QR code generated: ${domain}/${qrData.shortCode}`);
        console.log(`📊 Tracking URL: ${trackingUrl}`);
        
        return {
            qrId,
            shortUrl: `https://${domain}/${qrData.shortCode}`,
            qrCode: qrCode.dataUrl,
            trackingUrl,
            embedCode: this.generateEmbedCode(qrData),
            downloadUrl: await this.generateDownloadUrl(qrData)
        };
    }

    buildTrackingUrl(originalUrl, params) {
        const { qrId, domain, campaign, medium, source, metadata } = params;
        
        // Create base URL with short code
        const shortCode = this.qrDatabase.get(qrId)?.shortCode || this.generateShortCode();
        const baseUrl = `https://${domain}/${shortCode}`;
        
        // Build tracking parameters (like Shaw Inc's complex URLs)
        const trackingParams = new URLSearchParams();
        
        // Source domain tracking (most important)
        trackingParams.set(this.config.tracking.sourceTag, source);
        
        // Campaign tracking
        if (campaign) trackingParams.set(this.config.tracking.campaignTag, campaign);
        if (medium) trackingParams.set(this.config.tracking.mediumTag, medium);
        
        // Version tracking for A/B testing
        trackingParams.set(this.config.tracking.versionTag, 'v1');
        
        // Timestamp for time-based analytics
        trackingParams.set(this.config.tracking.timestampTag, Date.now().toString(36));
        
        // Custom metadata encoding
        if (Object.keys(metadata).length > 0) {
            const encodedMeta = this.encodeMetadata(metadata);
            trackingParams.set('_qrx', encodedMeta);
        }
        
        return `${baseUrl}?${trackingParams.toString()}`;
    }

    async generateStyledQR(url, options) {
        console.log('🎨 Generating styled QR code...');
        
        const qrOptions = {
            ...this.config.qrOptions,
            color: options.colors || this.config.qrOptions.color
        };
        
        // Generate base QR code
        const qrDataUrl = await QRCode.toDataURL(url, qrOptions);
        
        // Apply custom styling
        if (options.style === 'rounded' || options.style === 'dots') {
            // In production, this would use a library like qr-code-styling
            console.log(`🎨 Applied ${options.style} style to QR code`);
        }
        
        // Add logo if provided
        if (options.logo) {
            // In production, this would composite the logo onto the QR code
            console.log('🖼️ Added logo to QR code center');
        }
        
        return {
            dataUrl: qrDataUrl,
            format: 'png',
            colors: qrOptions.color,
            style: options.style || 'standard',
            size: qrOptions.width
        };
    }

    async trackQRScan(shortCode, scanData = {}) {
        console.log(`📱 Tracking QR scan: ${shortCode}`);
        
        // Find QR code by short code
        let qrData = null;
        for (const [id, data] of this.qrDatabase) {
            if (data.shortCode === shortCode) {
                qrData = data;
                break;
            }
        }
        
        if (!qrData) {
            console.log(`❌ QR code not found: ${shortCode}`);
            return null;
        }
        
        // Parse scan data
        const scan = {
            id: this.generateScanId(),
            qrId: qrData.id,
            timestamp: new Date().toISOString(),
            
            // Source tracking (which domain was used)
            sourceDomain: scanData.sourceDomain || qrData.domain,
            referrer: scanData.referrer || 'direct',
            
            // Device information
            userAgent: scanData.userAgent || '',
            device: this.parseDevice(scanData.userAgent),
            
            // Location data
            ip: scanData.ip || '0.0.0.0',
            geo: this.getGeoLocation(scanData.ip),
            
            // Tracking parameters from URL
            campaign: scanData.campaign || qrData.campaign,
            medium: scanData.medium || 'qr',
            source: scanData.source || qrData.domain,
            
            // Performance metrics
            loadTime: scanData.loadTime || 0,
            redirectTime: scanData.redirectTime || 0,
            
            // Custom data
            metadata: scanData.metadata || {}
        };
        
        // Update QR statistics
        qrData.scans++;
        qrData.lastScanned = scan.timestamp;
        
        // Track unique scans
        const scanKey = `${scan.ip}-${scan.device.type}`;
        if (!qrData.uniqueScansSet) {
            qrData.uniqueScansSet = new Set();
        }
        if (!qrData.uniqueScansSet.has(scanKey)) {
            qrData.uniqueScansSet.add(scanKey);
            qrData.uniqueScans++;
        }
        
        // Update location statistics
        this.updateLocationStats(qrData, scan.geo);
        
        // Update device statistics
        this.updateDeviceStats(qrData, scan.device);
        
        // Update domain performance
        this.updateDomainPerformance(scan.sourceDomain, scan);
        
        // Store scan record
        this.scanDatabase.set(scan.id, scan);
        
        // Real-time tracking
        this.realTimeTracking.push({
            ...scan,
            qrShortCode: qrData.shortCode
        });
        
        // Emit real-time event
        this.emitTrackingEvent('qr_scan', scan);
        
        console.log(`✅ QR scan tracked: ${scan.sourceDomain} → ${qrData.originalUrl}`);
        
        return {
            scanId: scan.id,
            redirectUrl: qrData.originalUrl,
            tracking: {
                qrId: qrData.id,
                scans: qrData.scans,
                uniqueScans: qrData.uniqueScans
            }
        };
    }

    parseDevice(userAgent) {
        const parser = new UAParser(userAgent);
        const result = parser.getResult();
        
        return {
            type: result.device.type || 'desktop',
            os: result.os.name || 'unknown',
            browser: result.browser.name || 'unknown',
            model: result.device.model || 'unknown',
            vendor: result.device.vendor || 'unknown'
        };
    }

    getGeoLocation(ip) {
        const geo = geoip.lookup(ip);
        
        if (!geo) {
            return {
                country: 'unknown',
                city: 'unknown',
                latitude: 0,
                longitude: 0
            };
        }
        
        return {
            country: geo.country,
            region: geo.region,
            city: geo.city,
            latitude: geo.ll[0],
            longitude: geo.ll[1],
            timezone: geo.timezone
        };
    }

    updateLocationStats(qrData, geo) {
        if (!qrData.locationStats) {
            qrData.locationStats = new Map();
        }
        
        const locationKey = `${geo.country}-${geo.city}`;
        const count = qrData.locationStats.get(locationKey) || 0;
        qrData.locationStats.set(locationKey, count + 1);
        
        // Update top locations
        qrData.topLocations = Array.from(qrData.locationStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([location, count]) => ({ location, count }));
    }

    updateDeviceStats(qrData, device) {
        if (!qrData.deviceStats) {
            qrData.deviceStats = new Map();
        }
        
        const deviceKey = `${device.type}-${device.os}`;
        const count = qrData.deviceStats.get(deviceKey) || 0;
        qrData.deviceStats.set(deviceKey, count + 1);
        
        // Update top devices
        qrData.topDevices = Array.from(qrData.deviceStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([device, count]) => ({ device, count }));
    }

    updateDomainPerformance(domain, scan) {
        if (!this.domainPerformance.has(domain)) {
            this.domainPerformance.set(domain, {
                domain,
                totalScans: 0,
                uniqueScans: 0,
                avgLoadTime: 0,
                conversionRate: 0,
                topCampaigns: [],
                topLocations: [],
                scanTimes: []
            });
        }
        
        const perf = this.domainPerformance.get(domain);
        perf.totalScans++;
        
        // Update average load time
        perf.scanTimes.push(scan.loadTime);
        if (perf.scanTimes.length > 100) {
            perf.scanTimes.shift(); // Keep last 100 scans
        }
        perf.avgLoadTime = perf.scanTimes.reduce((a, b) => a + b, 0) / perf.scanTimes.length;
        
        console.log(`📊 Domain performance updated: ${domain} (${perf.totalScans} scans)`);
    }

    selectOptimalDomain(options) {
        // Select best domain based on performance and availability
        const domains = [this.config.domains.primary, ...this.config.domains.custom];
        
        // If specific region, select regional domain
        if (options.region) {
            const regionalDomain = this.getRegionalDomain(options.region);
            if (regionalDomain) return regionalDomain;
        }
        
        // Select based on performance metrics
        let bestDomain = this.config.domains.primary;
        let bestScore = 0;
        
        for (const domain of domains) {
            const perf = this.domainPerformance.get(domain);
            if (!perf) continue;
            
            const score = this.calculateDomainScore(perf);
            if (score > bestScore) {
                bestScore = score;
                bestDomain = domain;
            }
        }
        
        return bestDomain;
    }

    calculateDomainScore(performance) {
        // Score based on scan volume, load time, and conversion rate
        const volumeScore = Math.log10(performance.totalScans + 1) * 10;
        const speedScore = Math.max(0, 100 - performance.avgLoadTime / 10);
        const conversionScore = performance.conversionRate * 100;
        
        return (volumeScore + speedScore + conversionScore) / 3;
    }

    getRegionalDomain(region) {
        const regionalDomains = {
            'US': 'cal.ai',
            'EU': 'niceleak.com',
            'ASIA': 'qr.cool',
            'DEFAULT': this.config.domains.primary
        };
        
        return regionalDomains[region] || regionalDomains.DEFAULT;
    }

    getDomainLogo(domain) {
        const logos = {
            'cal.ai': '/assets/logos/cal-ai-logo.svg',
            'niceleak.com': '/assets/logos/niceleak-logo.svg',
            'soulfra.com': '/assets/logos/soulfra-logo.svg'
        };
        
        return logos[domain] || null;
    }

    getDomainColors(domain) {
        const colors = {
            'cal.ai': { dark: '#6B46C1', light: '#FFFFFF' },
            'niceleak.com': { dark: '#00D4FF', light: '#FFFFFF' },
            'soulfra.com': { dark: '#FF00D4', light: '#FFFFFF' }
        };
        
        return colors[domain] || this.config.qrOptions.color;
    }

    encodeMetadata(metadata) {
        // Encode metadata for URL parameter (like _fplc in Shaw's URL)
        const json = JSON.stringify(metadata);
        return Buffer.from(json).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    }

    generateEmbedCode(qrData) {
        return `
<!-- QR Code Embed -->
<div class="qr-embed" data-qr-id="${qrData.id}">
    <img src="${qrData.qrCode}" alt="QR Code" width="256" height="256" />
    <p>Scan with phone camera</p>
    <a href="${qrData.trackingUrl}" class="qr-link">${qrData.domain}/${qrData.shortCode}</a>
</div>
<script src="https://${qrData.domain}/qr-analytics.js"></script>
        `.trim();
    }

    async generateDownloadUrl(qrData) {
        // In production, this would save QR code to S3/CDN
        return `https://${qrData.domain}/download/qr/${qrData.id}.png`;
    }

    async getQRAnalytics(qrId) {
        const qrData = this.qrDatabase.get(qrId);
        if (!qrData) return null;
        
        // Get all scans for this QR code
        const scans = Array.from(this.scanDatabase.values())
            .filter(scan => scan.qrId === qrId);
        
        // Calculate analytics
        const analytics = {
            qrId,
            shortCode: qrData.shortCode,
            originalUrl: qrData.originalUrl,
            
            // Basic metrics
            totalScans: qrData.scans,
            uniqueScans: qrData.uniqueScans,
            scanRate: qrData.scans / ((Date.now() - new Date(qrData.createdAt)) / 86400000), // Scans per day
            
            // Location analytics
            topLocations: qrData.topLocations,
            locationHeatmap: this.generateLocationHeatmap(scans),
            
            // Device analytics
            topDevices: qrData.topDevices,
            deviceBreakdown: this.getDeviceBreakdown(scans),
            
            // Time analytics
            scanTimeline: this.generateScanTimeline(scans),
            peakHours: this.calculatePeakHours(scans),
            
            // Domain performance
            domainPerformance: this.getDomainAnalytics(qrData.domain),
            
            // Conversion tracking
            conversionFunnel: this.calculateConversionFunnel(qrData, scans)
        };
        
        return analytics;
    }

    generateLocationHeatmap(scans) {
        const heatmap = new Map();
        
        for (const scan of scans) {
            const key = `${scan.geo.latitude},${scan.geo.longitude}`;
            const count = heatmap.get(key) || 0;
            heatmap.set(key, count + 1);
        }
        
        return Array.from(heatmap.entries()).map(([coords, count]) => ({
            coordinates: coords.split(',').map(Number),
            intensity: count
        }));
    }

    getDeviceBreakdown(scans) {
        const breakdown = {
            mobile: 0,
            tablet: 0,
            desktop: 0,
            other: 0
        };
        
        for (const scan of scans) {
            const type = scan.device.type || 'other';
            if (breakdown.hasOwnProperty(type)) {
                breakdown[type]++;
            } else {
                breakdown.other++;
            }
        }
        
        return breakdown;
    }

    generateScanTimeline(scans) {
        const timeline = [];
        const buckets = new Map();
        
        // Group scans by hour
        for (const scan of scans) {
            const hour = new Date(scan.timestamp).setMinutes(0, 0, 0);
            const count = buckets.get(hour) || 0;
            buckets.set(hour, count + 1);
        }
        
        // Convert to timeline array
        for (const [hour, count] of buckets) {
            timeline.push({
                timestamp: new Date(hour).toISOString(),
                scans: count
            });
        }
        
        return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    calculatePeakHours(scans) {
        const hourCounts = new Array(24).fill(0);
        
        for (const scan of scans) {
            const hour = new Date(scan.timestamp).getHours();
            hourCounts[hour]++;
        }
        
        return hourCounts.map((count, hour) => ({
            hour,
            scans: count,
            percentage: (count / scans.length * 100).toFixed(1)
        })).sort((a, b) => b.scans - a.scans).slice(0, 5);
    }

    getDomainAnalytics(domain) {
        const perf = this.domainPerformance.get(domain);
        if (!perf) return null;
        
        return {
            domain,
            totalScans: perf.totalScans,
            avgLoadTime: perf.avgLoadTime.toFixed(2),
            reliability: (100 - (perf.errors || 0) / perf.totalScans * 100).toFixed(1),
            performanceScore: this.calculateDomainScore(perf).toFixed(1)
        };
    }

    calculateConversionFunnel(qrData, scans) {
        const funnel = {
            generated: 1,
            scanned: qrData.scans > 0 ? 1 : 0,
            clicked: qrData.scans,
            converted: 0 // Would track actual conversions
        };
        
        return {
            steps: funnel,
            conversionRate: qrData.scans > 0 ? ((funnel.converted / qrData.scans) * 100).toFixed(1) : 0
        };
    }

    async setupRealTimeTracking() {
        console.log('📡 Setting up real-time tracking...');
        
        // Clean old tracking data periodically
        setInterval(() => {
            const cutoff = Date.now() - this.config.analytics.realTimeWindow;
            this.realTimeTracking = this.realTimeTracking.filter(
                scan => new Date(scan.timestamp).getTime() > cutoff
            );
        }, 60000);
        
        console.log('✅ Real-time tracking active');
    }

    async initializeAnalytics() {
        console.log('📊 Initializing analytics aggregation...');
        
        // Aggregate analytics periodically
        setInterval(() => {
            this.aggregateAnalytics();
        }, this.config.analytics.aggregationInterval);
        
        console.log('✅ Analytics aggregation scheduled');
    }

    aggregateAnalytics() {
        const summary = {
            timestamp: new Date().toISOString(),
            totalQRCodes: this.qrDatabase.size,
            totalScans: Array.from(this.qrDatabase.values()).reduce((sum, qr) => sum + qr.scans, 0),
            activeQRCodes: Array.from(this.qrDatabase.values()).filter(qr => qr.lastScanned).length,
            recentScans: this.realTimeTracking.length,
            topDomains: this.getTopDomains()
        };
        
        console.log('📊 Analytics aggregated:', summary);
        
        this.emitTrackingEvent('analytics_aggregated', summary);
    }

    getTopDomains() {
        const domains = Array.from(this.domainPerformance.values())
            .sort((a, b) => b.totalScans - a.totalScans)
            .slice(0, 5)
            .map(perf => ({
                domain: perf.domain,
                scans: perf.totalScans,
                avgLoadTime: perf.avgLoadTime.toFixed(2)
            }));
        
        return domains;
    }

    emitTrackingEvent(event, data) {
        // In production, this would emit to WebSocket/EventSource
        if (this.debug) {
            console.log(`📡 Event: ${event}`, data);
        }
    }

    async loadExistingQRCodes() {
        // In production, load from database
        console.log('📂 Loading existing QR codes...');
    }

    // Utility methods
    generateQRId() {
        return 'qr_' + crypto.randomBytes(8).toString('hex');
    }

    generateShortCode() {
        // Generate readable short code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    generateScanId() {
        return 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    // Public API
    async createQR(url, options) {
        return await this.generateTrackingQR(url, options);
    }

    async trackScan(shortCode, scanData) {
        return await this.trackQRScan(shortCode, scanData);
    }

    async getAnalytics(qrId) {
        return await this.getQRAnalytics(qrId);
    }

    getRealTimeStats() {
        return {
            activeScans: this.realTimeTracking.length,
            recentScans: this.realTimeTracking.slice(-10),
            domainPerformance: Array.from(this.domainPerformance.values())
        };
    }

    exportQRCode(qrId, format = 'png') {
        const qrData = this.qrDatabase.get(qrId);
        if (!qrData) return null;
        
        // In production, this would generate different formats
        return {
            format,
            data: qrData.qrCode,
            filename: `qr_${qrData.shortCode}.${format}`
        };
    }
}

// CLI interface for testing
if (require.main === module) {
    const qrTracker = new QRDomainTrackingSystem();
    
    setTimeout(async () => {
        console.log('\n🧪 Testing QR Domain Tracking System...\n');
        
        // Test 1: Generate QR code with tracking
        const qr1 = await qrTracker.createQR('https://example.com/product/123', {
            campaign: 'summer-sale',
            customDomain: 'niceleak.com',
            tags: ['promotion', 'product'],
            userId: 'merchant123'
        });
        
        console.log('📱 QR Code 1 generated:');
        console.log(`   Short URL: ${qr1.shortUrl}`);
        console.log(`   Tracking URL: ${qr1.trackingUrl}`);
        
        // Test 2: Generate QR for different region
        const qr2 = await qrTracker.createQR('https://example.com/eu-landing', {
            region: 'EU',
            campaign: 'eu-launch',
            style: 'rounded',
            colors: { dark: '#000080', light: '#FFFFFF' }
        });
        
        console.log('\n📱 QR Code 2 generated:');
        console.log(`   Short URL: ${qr2.shortUrl}`);
        
        // Test 3: Simulate QR scans
        console.log('\n📊 Simulating QR scans...\n');
        
        // Scan from mobile in US
        const scan1 = await qrTracker.trackScan(qr1.shortUrl.split('/').pop(), {
            sourceDomain: 'niceleak.com',
            ip: '72.229.28.185',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
            referrer: 'https://facebook.com',
            loadTime: 245
        });
        
        console.log('✅ Scan 1 tracked:', scan1.tracking);
        
        // Scan from desktop in EU
        const scan2 = await qrTracker.trackScan(qr2.shortUrl.split('/').pop(), {
            sourceDomain: qrTracker.config.domains.primary,
            ip: '185.86.151.11',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
            loadTime: 187
        });
        
        console.log('✅ Scan 2 tracked:', scan2.tracking);
        
        // Test 4: Get analytics
        console.log('\n📈 QR Analytics:\n');
        
        const analytics = await qrTracker.getAnalytics(qr1.qrId);
        console.log('QR 1 Analytics:');
        console.log(`   Total Scans: ${analytics.totalScans}`);
        console.log(`   Unique Scans: ${analytics.uniqueScans}`);
        console.log(`   Scan Rate: ${analytics.scanRate.toFixed(2)} per day`);
        
        // Test 5: Real-time stats
        const realTime = qrTracker.getRealTimeStats();
        console.log('\n📡 Real-Time Stats:');
        console.log(`   Active Scans: ${realTime.activeScans}`);
        console.log(`   Domain Performance: ${JSON.stringify(realTime.domainPerformance[0] || {})}`);
        
        console.log('\n✅ QR Domain Tracking System test complete');
        
    }, 1000);
}

module.exports = QRDomainTrackingSystem;
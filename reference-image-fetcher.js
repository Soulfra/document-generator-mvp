#!/usr/bin/env node

/**
 * REFERENCE IMAGE FETCHER
 * 
 * Specialized system for fetching reference images to enhance AI sprite generation.
 * Builds on existing web content fetcher and search orchestrator infrastructure.
 * 
 * Features:
 * - Google Images API integration for high-quality reference images
 * - Wikipedia Commons for classical imagery (grim reapers, anchors, etc.)
 * - Unsplash/Pixabay for copyright-free reference materials
 * - Game sprite databases for pixel art style references
 * - Contextual search based on mascot personality modes
 * - Image quality filtering and categorization
 * - Cache management with automatic cleanup
 * - Integration with existing AI Router and Replicate systems
 */

const EventEmitter = require('events');
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Import existing infrastructure
const WebContentFetcherService = require('./web-content-fetcher-service');
const SearchEngineScrapingOrchestrator = require('./search-engine-scraping-orchestrator');

class ReferenceImageFetcher extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Output settings
            output: {
                directory: './reference_images',
                categories: ['grim_reaper', 'anchor', 'husky', 'mystical', 'professional', 'playful', 'wise'],
                maxImagesPerCategory: 50,
                imageFormats: ['jpg', 'png', 'webp'],
                maxFileSize: 5 * 1024 * 1024, // 5MB
                minResolution: { width: 256, height: 256 },
                preferredResolution: { width: 512, height: 512 }
            },
            
            // Search sources
            sources: {
                googleImages: {
                    enabled: true,
                    apiKey: process.env.GOOGLE_API_KEY,
                    customSearchId: process.env.GOOGLE_CUSTOM_SEARCH_ID,
                    maxResults: 20,
                    safeSearch: 'moderate',
                    imageType: 'photo',
                    imgSize: 'medium'
                },
                wikipediaCommons: {
                    enabled: true,
                    apiUrl: 'https://commons.wikimedia.org/w/api.php',
                    maxResults: 15,
                    preferredLicenses: ['CC-BY', 'CC-BY-SA', 'Public Domain']
                },
                unsplash: {
                    enabled: true,
                    apiKey: process.env.UNSPLASH_API_KEY,
                    baseUrl: 'https://api.unsplash.com',
                    maxResults: 10,
                    preferredOrientation: 'squarish'
                },
                pixabay: {
                    enabled: true,
                    apiKey: process.env.PIXABAY_API_KEY,
                    baseUrl: 'https://pixabay.com/api',
                    maxResults: 15,
                    category: 'illustration',
                    imageType: 'photo'
                },
                gameSpriteDatabases: {
                    enabled: true,
                    sources: [
                        'https://www.spriters-resource.com',
                        'https://opengameart.org',
                        'https://itch.io/game-assets'
                    ],
                    maxResults: 10
                }
            },
            
            // Search terms for different contexts
            searchTerms: {
                grim_reaper: {
                    classical: ['grim reaper classical art', 'death personification medieval', 'reaper with scythe painting'],
                    cute: ['cute grim reaper', 'friendly death character', 'cartoon reaper mascot'],
                    pixel_art: ['grim reaper pixel art', 'death sprite game character', 'reaper 8bit art'],
                    husky_themed: ['dog grim reaper', 'husky death character', 'canine reaper mascot']
                },
                anchor: {
                    nautical: ['nautical anchor symbol', 'ship anchor design', 'maritime anchor art'],
                    decorative: ['anchor decoration', 'anchor logo design', 'anchor icon'],
                    vintage: ['vintage anchor illustration', 'antique anchor design', 'classic anchor symbol'],
                    pixel_art: ['anchor pixel art', 'anchor game sprite', 'nautical pixel icon']
                },
                husky: {
                    breeds: ['siberian husky', 'husky dog breeds', 'husky facial features'],
                    expressions: ['husky expressions', 'dog emotions', 'canine facial expressions'],
                    poses: ['husky sitting pose', 'dog action poses', 'husky body language'],
                    cartoon: ['cartoon husky', 'husky mascot design', 'animated dog character']
                },
                mystical: {
                    auras: ['mystical aura effects', 'magical glow effects', 'ethereal light'],
                    particles: ['soul particles', 'mystical particles', 'spiritual energy effects'],
                    backgrounds: ['mystical backgrounds', 'ethereal scenery', 'magical environments']
                }
            },
            
            // Image quality filters
            quality: {
                minWidth: 256,
                minHeight: 256,
                maxAspectRatio: 3.0, // width/height
                minAspectRatio: 0.33, // height/width
                preferSquareImages: true,
                rejectBlurryImages: true,
                rejectWatermarked: true
            },
            
            // Cache settings
            cache: {
                enabled: true,
                ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
                maxSize: 1000, // max cached items per category
                cleanupInterval: 24 * 60 * 60 * 1000 // 24 hours
            },
            
            ...options
        };
        
        // Initialize services
        this.webFetcher = null;
        this.searchOrchestrator = null;
        
        // Cache and storage
        this.imageCache = new Map();
        this.metadataCache = new Map();
        this.downloadedImages = new Map();
        
        // Processing queue
        this.processingQueue = [];
        this.isProcessing = false;
        
        // Statistics
        this.stats = {
            totalSearches: 0,
            imagesFound: 0,
            imagesDownloaded: 0,
            imagesFiltered: 0,
            cacheHits: 0,
            errors: 0,
            lastUpdate: null
        };
        
        console.log('🖼️ Reference Image Fetcher initialized');
        this.initialize();
    }
    
    /**
     * Initialize the image fetching system
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Reference Image Fetcher...');
            
            // Setup output directories
            await this.setupDirectories();
            
            // Initialize web services
            await this.initializeServices();
            
            // Load cached metadata
            await this.loadCacheFromDisk();
            
            // Schedule cache cleanup
            this.scheduleCacheCleanup();
            
            console.log('✅ Reference Image Fetcher ready');
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Reference Image Fetcher:', error);
            throw error;
        }
    }
    
    /**
     * Fetch reference images for specific contexts
     */
    async fetchReferenceImages(context, options = {}) {
        console.log(`🔍 Fetching reference images for context: ${context}`);
        
        const searchConfig = {
            maxImages: options.maxImages || 20,
            preferredStyle: options.style || 'mixed', // classical, cute, pixel_art, mixed
            includeSources: options.sources || Object.keys(this.config.sources),
            forceRefresh: options.forceRefresh || false,
            quality: options.quality || 'high'
        };
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(context, searchConfig);
            if (!searchConfig.forceRefresh && this.imageCache.has(cacheKey)) {
                console.log('  📋 Using cached results');
                this.stats.cacheHits++;
                return this.imageCache.get(cacheKey);
            }
            
            // Get search terms for context
            const searchTerms = this.getSearchTermsForContext(context, searchConfig.preferredStyle);
            
            // Fetch from all enabled sources
            const results = {
                context,
                timestamp: new Date().toISOString(),
                images: [],
                sources: {},
                metadata: {
                    totalFound: 0,
                    totalDownloaded: 0,
                    qualityFiltered: 0,
                    searchTermsUsed: searchTerms
                }
            };
            
            // Search each source
            for (const source of searchConfig.includeSources) {
                if (this.config.sources[source]?.enabled) {
                    console.log(`  🌐 Searching ${source}...`);
                    try {
                        const sourceResults = await this.searchSource(source, searchTerms, searchConfig);
                        results.sources[source] = sourceResults;
                        results.images.push(...sourceResults.images);
                    } catch (error) {
                        console.error(`  ❌ Error searching ${source}:`, error.message);
                        this.stats.errors++;
                    }
                }
            }
            
            // Process and filter images
            console.log(`  🔍 Processing ${results.images.length} found images...`);
            const processedImages = await this.processAndFilterImages(results.images);
            results.images = processedImages;
            results.metadata.totalFound = results.images.length;
            results.metadata.qualityFiltered = results.images.length - processedImages.length;
            
            // Download best images
            console.log(`  📥 Downloading best images...`);
            const downloadedImages = await this.downloadBestImages(processedImages, searchConfig.maxImages);
            results.images = downloadedImages;
            results.metadata.totalDownloaded = downloadedImages.length;
            
            // Cache results
            this.imageCache.set(cacheKey, results);
            await this.saveCacheToDisk();
            
            // Update statistics
            this.stats.totalSearches++;
            this.stats.imagesFound += results.metadata.totalFound;
            this.stats.imagesDownloaded += results.metadata.totalDownloaded;
            this.stats.lastUpdate = new Date().toISOString();
            
            console.log(`✅ Fetched ${results.metadata.totalDownloaded} reference images for ${context}`);
            
            this.emit('images_fetched', results);
            return results;
            
        } catch (error) {
            console.error(`❌ Failed to fetch reference images for ${context}:`, error);
            this.stats.errors++;
            throw error;
        }
    }
    
    /**
     * Search a specific source for images
     */
    async searchSource(source, searchTerms, config) {
        const sourceConfig = this.config.sources[source];
        let images = [];
        
        switch (source) {
            case 'googleImages':
                images = await this.searchGoogleImages(searchTerms, sourceConfig, config);
                break;
                
            case 'wikipediaCommons':
                images = await this.searchWikipediaCommons(searchTerms, sourceConfig, config);
                break;
                
            case 'unsplash':
                images = await this.searchUnsplash(searchTerms, sourceConfig, config);
                break;
                
            case 'pixabay':
                images = await this.searchPixabay(searchTerms, sourceConfig, config);
                break;
                
            case 'gameSpriteDatabases':
                images = await this.searchGameSpriteDatabases(searchTerms, sourceConfig, config);
                break;
                
            default:
                console.warn(`Unknown image source: ${source}`);
        }
        
        return {
            source,
            searchTerms,
            images,
            count: images.length,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Search Google Images using Custom Search API
     */
    async searchGoogleImages(searchTerms, sourceConfig, config) {
        if (!sourceConfig.apiKey || !sourceConfig.customSearchId) {
            console.warn('Google Images API not configured');
            return [];
        }
        
        const images = [];
        
        for (const term of searchTerms.slice(0, 3)) { // Limit API calls
            try {
                const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
                    params: {
                        key: sourceConfig.apiKey,
                        cx: sourceConfig.customSearchId,
                        q: term,
                        searchType: 'image',
                        num: Math.min(10, sourceConfig.maxResults),
                        safe: sourceConfig.safeSearch,
                        imgType: sourceConfig.imageType,
                        imgSize: sourceConfig.imgSize,
                        fileType: 'jpg|png|webp',
                        rights: 'cc_publicdomain|cc_attribute|cc_sharealike'
                    }
                });
                
                if (response.data.items) {
                    for (const item of response.data.items) {
                        images.push({
                            url: item.link,
                            thumbnailUrl: item.image.thumbnailLink,
                            title: item.title,
                            source: 'google',
                            contextLink: item.image.contextLink,
                            width: item.image.width,
                            height: item.image.height,
                            fileFormat: item.fileFormat,
                            searchTerm: term,
                            license: 'unknown'
                        });
                    }
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error searching Google Images for "${term}":`, error.message);
            }
        }
        
        return images;
    }
    
    /**
     * Search Wikipedia Commons for classical imagery
     */
    async searchWikipediaCommons(searchTerms, sourceConfig, config) {
        const images = [];
        
        for (const term of searchTerms.slice(0, 2)) {
            try {
                // Search for files on Wikimedia Commons
                const searchResponse = await axios.get(sourceConfig.apiUrl, {
                    params: {
                        action: 'query',
                        format: 'json',
                        list: 'search',
                        srsearch: `filetype:bitmap ${term}`,
                        srnamespace: 6, // File namespace
                        srlimit: sourceConfig.maxResults
                    }
                });
                
                if (searchResponse.data.query?.search) {
                    for (const result of searchResponse.data.query.search) {
                        try {
                            // Get file info
                            const fileResponse = await axios.get(sourceConfig.apiUrl, {
                                params: {
                                    action: 'query',
                                    format: 'json',
                                    titles: result.title,
                                    prop: 'imageinfo',
                                    iiprop: 'url|size|metadata|extmetadata'
                                }
                            });
                            
                            const page = Object.values(fileResponse.data.query.pages)[0];
                            if (page.imageinfo && page.imageinfo[0]) {
                                const imageInfo = page.imageinfo[0];
                                images.push({
                                    url: imageInfo.url,
                                    thumbnailUrl: imageInfo.thumburl || imageInfo.url,
                                    title: result.title.replace('File:', ''),
                                    source: 'wikipedia',
                                    contextLink: `https://commons.wikimedia.org/wiki/${encodeURIComponent(result.title)}`,
                                    width: imageInfo.width,
                                    height: imageInfo.height,
                                    fileFormat: path.extname(imageInfo.url).slice(1),
                                    searchTerm: term,
                                    license: this.extractWikipediaLicense(imageInfo.extmetadata)
                                });
                            }
                        } catch (error) {
                            console.error(`Error getting Wikipedia file info:`, error.message);
                        }
                        
                        // Rate limiting
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                }
                
            } catch (error) {
                console.error(`Error searching Wikipedia Commons for "${term}":`, error.message);
            }
        }
        
        return images;
    }
    
    /**
     * Search Unsplash for high-quality photography
     */
    async searchUnsplash(searchTerms, sourceConfig, config) {
        if (!sourceConfig.apiKey) {
            console.warn('Unsplash API not configured');
            return [];
        }
        
        const images = [];
        
        for (const term of searchTerms.slice(0, 2)) {
            try {
                const response = await axios.get(`${sourceConfig.baseUrl}/search/photos`, {
                    headers: {
                        'Authorization': `Client-ID ${sourceConfig.apiKey}`
                    },
                    params: {
                        query: term,
                        per_page: Math.min(30, sourceConfig.maxResults),
                        orientation: sourceConfig.preferredOrientation,
                        content_filter: 'high'
                    }
                });
                
                if (response.data.results) {
                    for (const photo of response.data.results) {
                        images.push({
                            url: photo.urls.regular,
                            thumbnailUrl: photo.urls.thumb,
                            title: photo.description || photo.alt_description || 'Untitled',
                            source: 'unsplash',
                            contextLink: photo.links.html,
                            width: photo.width,
                            height: photo.height,
                            fileFormat: 'jpg',
                            searchTerm: term,
                            license: 'Unsplash License',
                            photographer: photo.user.name
                        });
                    }
                }
                
                // Rate limiting (Unsplash has generous limits)
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error searching Unsplash for "${term}":`, error.message);
            }
        }
        
        return images;
    }
    
    /**
     * Search Pixabay for illustrations and vector art
     */
    async searchPixabay(searchTerms, sourceConfig, config) {
        if (!sourceConfig.apiKey) {
            console.warn('Pixabay API not configured');
            return [];
        }
        
        const images = [];
        
        for (const term of searchTerms.slice(0, 2)) {
            try {
                const response = await axios.get(sourceConfig.baseUrl, {
                    params: {
                        key: sourceConfig.apiKey,
                        q: term,
                        image_type: sourceConfig.imageType,
                        category: sourceConfig.category,
                        per_page: Math.min(20, sourceConfig.maxResults),
                        safesearch: 'true',
                        order: 'popular'
                    }
                });
                
                if (response.data.hits) {
                    for (const hit of response.data.hits) {
                        images.push({
                            url: hit.webformatURL,
                            thumbnailUrl: hit.previewURL,
                            title: hit.tags,
                            source: 'pixabay',
                            contextLink: hit.pageURL,
                            width: hit.webformatWidth,
                            height: hit.webformatHeight,
                            fileFormat: 'jpg',
                            searchTerm: term,
                            license: 'Pixabay License',
                            tags: hit.tags.split(', ')
                        });
                    }
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error searching Pixabay for "${term}":`, error.message);
            }
        }
        
        return images;
    }
    
    /**
     * Search game sprite databases for pixel art references
     */
    async searchGameSpriteDatabases(searchTerms, sourceConfig, config) {
        // This would integrate with sprite databases
        // For now, return empty array as these require custom scraping
        console.log('Game sprite database search not yet implemented');
        return [];
    }
    
    /**
     * Get search terms for a specific context and style
     */
    getSearchTermsForContext(context, style) {
        const contextTerms = this.config.searchTerms[context] || {};
        let terms = [];
        
        if (style === 'mixed') {
            // Use all style types
            Object.values(contextTerms).forEach(styleTerms => {
                terms.push(...styleTerms);
            });
        } else if (contextTerms[style]) {
            terms = [...contextTerms[style]];
        } else {
            // Fallback to all terms for context
            Object.values(contextTerms).forEach(styleTerms => {
                terms.push(...styleTerms);
            });
        }
        
        return terms;
    }
    
    /**
     * Process and filter images for quality
     */
    async processAndFilterImages(images) {
        const filtered = [];
        
        for (const image of images) {
            try {
                // Basic validation
                if (!image.url || !image.width || !image.height) {
                    continue;
                }
                
                // Size filtering
                if (image.width < this.config.quality.minWidth || 
                    image.height < this.config.quality.minHeight) {
                    continue;
                }
                
                // Aspect ratio filtering
                const aspectRatio = image.width / image.height;
                if (aspectRatio > this.config.quality.maxAspectRatio || 
                    aspectRatio < this.config.quality.minAspectRatio) {
                    continue;
                }
                
                // Add quality score
                image.qualityScore = this.calculateImageQualityScore(image);
                
                filtered.push(image);
                
            } catch (error) {
                console.error('Error processing image:', error.message);
            }
        }
        
        // Sort by quality score
        return filtered.sort((a, b) => b.qualityScore - a.qualityScore);
    }
    
    /**
     * Calculate quality score for an image
     */
    calculateImageQualityScore(image) {
        let score = 0;
        
        // Resolution scoring (higher is better, up to a point)
        const pixels = image.width * image.height;
        if (pixels >= 512 * 512) score += 30;
        else if (pixels >= 256 * 256) score += 20;
        else score += 10;
        
        // Aspect ratio scoring (prefer square-ish images)
        const aspectRatio = image.width / image.height;
        if (aspectRatio >= 0.8 && aspectRatio <= 1.2) score += 20;
        else if (aspectRatio >= 0.6 && aspectRatio <= 1.6) score += 10;
        
        // Source scoring
        const sourceScores = {
            'wikipedia': 25, // High quality, good licensing
            'unsplash': 20,  // Professional photography
            'pixabay': 15,   // Good quality illustrations
            'google': 10     // Variable quality
        };
        score += sourceScores[image.source] || 0;
        
        // License scoring
        if (image.license && (
            image.license.includes('Public Domain') ||
            image.license.includes('CC-BY') ||
            image.license.includes('Unsplash') ||
            image.license.includes('Pixabay')
        )) {
            score += 15;
        }
        
        return score;
    }
    
    /**
     * Download the best images from the filtered list
     */
    async downloadBestImages(images, maxImages) {
        const downloaded = [];
        const topImages = images.slice(0, maxImages);
        
        for (const image of topImages) {
            try {
                const downloadedImage = await this.downloadImage(image);
                if (downloadedImage) {
                    downloaded.push(downloadedImage);
                }
            } catch (error) {
                console.error(`Error downloading image ${image.url}:`, error.message);
            }
        }
        
        return downloaded;
    }
    
    /**
     * Download a single image
     */
    async downloadImage(imageData) {
        try {
            // Check if already downloaded
            const imageHash = crypto.createHash('md5').update(imageData.url).digest('hex');
            const fileName = `${imageHash}.${imageData.fileFormat || 'jpg'}`;
            const filePath = path.join(this.config.output.directory, 'downloads', fileName);
            
            // Check if file exists
            try {
                await fs.access(filePath);
                // File exists, return cached version
                return {
                    ...imageData,
                    localPath: filePath,
                    fileName,
                    downloaded: true,
                    cached: true
                };
            } catch {
                // File doesn't exist, download it
            }
            
            // Download the image
            const response = await axios.get(imageData.url, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DocumentGenerator/1.0)'
                }
            });
            
            // Check file size
            if (response.data.length > this.config.output.maxFileSize) {
                console.warn(`Image too large: ${response.data.length} bytes`);
                return null;
            }
            
            // Process image with Sharp for optimization
            const processedImage = await sharp(response.data)
                .resize(this.config.output.preferredResolution.width, 
                       this.config.output.preferredResolution.height, 
                       { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();
            
            // Save to disk
            await fs.writeFile(filePath, processedImage);
            
            // Update statistics
            this.stats.imagesDownloaded++;
            
            return {
                ...imageData,
                localPath: filePath,
                fileName,
                downloaded: true,
                cached: false,
                fileSize: processedImage.length,
                processedResolution: await this.getImageDimensions(processedImage)
            };
            
        } catch (error) {
            console.error(`Failed to download image:`, error.message);
            return null;
        }
    }
    
    /**
     * Get image dimensions from buffer
     */
    async getImageDimensions(buffer) {
        try {
            const metadata = await sharp(buffer).metadata();
            return { width: metadata.width, height: metadata.height };
        } catch {
            return { width: 0, height: 0 };
        }
    }
    
    // Helper methods
    
    async setupDirectories() {
        const dirs = [
            this.config.output.directory,
            path.join(this.config.output.directory, 'downloads'),
            path.join(this.config.output.directory, 'cache'),
            ...this.config.output.categories.map(cat => 
                path.join(this.config.output.directory, cat)
            )
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async initializeServices() {
        // Initialize web fetcher and search orchestrator if needed
        // For now, we'll handle API calls directly
        console.log('  🔧 Services initialized');
    }
    
    generateCacheKey(context, config) {
        const configStr = JSON.stringify({
            context,
            maxImages: config.maxImages,
            style: config.preferredStyle,
            sources: config.includeSources.sort()
        });
        return crypto.createHash('md5').update(configStr).digest('hex');
    }
    
    extractWikipediaLicense(extmetadata) {
        try {
            if (extmetadata?.LicenseShortName?.value) {
                return extmetadata.LicenseShortName.value;
            }
            if (extmetadata?.License?.value) {
                return extmetadata.License.value;
            }
            return 'Wikipedia Commons';
        } catch {
            return 'Unknown';
        }
    }
    
    async loadCacheFromDisk() {
        try {
            const cacheFile = path.join(this.config.output.directory, 'cache', 'metadata.json');
            const data = await fs.readFile(cacheFile, 'utf8');
            const cache = JSON.parse(data);
            
            // Restore cache with TTL check
            const now = Date.now();
            for (const [key, value] of Object.entries(cache)) {
                if (value.timestamp && (now - new Date(value.timestamp).getTime()) < this.config.cache.ttl) {
                    this.imageCache.set(key, value);
                }
            }
            
            console.log(`  📋 Loaded ${this.imageCache.size} cached entries`);
        } catch (error) {
            // Cache file doesn't exist or is corrupted, start fresh
            console.log('  📋 Starting with fresh cache');
        }
    }
    
    async saveCacheToDisk() {
        try {
            const cacheFile = path.join(this.config.output.directory, 'cache', 'metadata.json');
            const cacheData = Object.fromEntries(this.imageCache.entries());
            await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.error('Failed to save cache:', error.message);
        }
    }
    
    scheduleCacheCleanup() {
        setInterval(() => {
            this.cleanupCache();
        }, this.config.cache.cleanupInterval);
    }
    
    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, value] of this.imageCache.entries()) {
            if (value.timestamp && (now - new Date(value.timestamp).getTime()) > this.config.cache.ttl) {
                this.imageCache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
        }
    }
    
    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.imageCache.size,
            downloadedImagesCount: this.downloadedImages.size
        };
    }
    
    /**
     * Quick API for mascot-specific searches
     */
    async fetchGrimReaperReferences(style = 'cute') {
        return this.fetchReferenceImages('grim_reaper', { 
            style, 
            maxImages: 15,
            sources: ['wikipediaCommons', 'pixabay', 'unsplash']
        });
    }
    
    async fetchAnchorReferences(style = 'nautical') {
        return this.fetchReferenceImages('anchor', { 
            style, 
            maxImages: 10,
            sources: ['wikipediaCommons', 'pixabay', 'unsplash']
        });
    }
    
    async fetchHuskyReferences(style = 'breeds') {
        return this.fetchReferenceImages('husky', { 
            style, 
            maxImages: 20,
            sources: ['unsplash', 'pixabay']
        });
    }
    
    async fetchMysticalReferences(style = 'auras') {
        return this.fetchReferenceImages('mystical', { 
            style, 
            maxImages: 12,
            sources: ['pixabay', 'unsplash']
        });
    }
}

module.exports = ReferenceImageFetcher;

// Example usage for testing
if (require.main === module) {
    console.log('🖼️ Testing Reference Image Fetcher...');
    
    const fetcher = new ReferenceImageFetcher();
    
    fetcher.once('ready', async () => {
        console.log('\n🧪 Testing grim reaper reference fetching...');
        
        try {
            const grimReaperResults = await fetcher.fetchGrimReaperReferences('cute');
            console.log(`✅ Found ${grimReaperResults.metadata.totalDownloaded} grim reaper references`);
            
            console.log('\n🧪 Testing anchor reference fetching...');
            const anchorResults = await fetcher.fetchAnchorReferences('nautical');
            console.log(`✅ Found ${anchorResults.metadata.totalDownloaded} anchor references`);
            
            console.log('\n📊 Final statistics:');
            console.log(fetcher.getStats());
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    });
}
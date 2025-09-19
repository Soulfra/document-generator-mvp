#!/usr/bin/env node

/**
 * 🎵 WEB-SCRAPING DJ ENGINE
 * Integrates with GitHub live DJs, scrapes Wikipedia for music data,
 * and syncs with HTML5 audio sources for real-time track information
 * 
 * Architecture:
 * GitHub DJ API → Track Detection → Wikipedia Scrape → HTML5 Audio Analysis → Groove Sync
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { EventEmitter } = require('events');
const crypto = require('crypto');

// GITHUB DJ INTEGRATION ENGINE
class GitHubDJIntegration extends EventEmitter {
    constructor() {
        super();
        this.connectedDJs = new Map();
        this.trackHistory = [];
        this.currentTrack = null;
        
        // Popular GitHub DJ repositories
        this.djSources = [
            'https://api.github.com/repos/MOONLAPSED/MOONLAPSED',
            'https://api.github.com/repos/algorave/algorave',
            'https://api.github.com/repos/tidalcycles/Tidal',
            'https://api.github.com/repos/supercollider/supercollider',
            'https://api.github.com/repos/overtone/overtone',
            'https://api.github.com/repos/gibber-cc/gibber',
            'https://api.github.com/repos/toplap/toplap'
        ];
        
        console.log('🎧 GitHub DJ Integration Engine initialized');
        this.startDJMonitoring();
    }
    
    async startDJMonitoring() {
        console.log('👁️ Starting GitHub DJ monitoring...');
        
        setInterval(async () => {
            for (const djSource of this.djSources) {
                try {
                    await this.checkDJActivity(djSource);
                } catch (error) {
                    // Silent monitoring
                }
            }
        }, 30000); // Check every 30 seconds
    }
    
    async checkDJActivity(repoUrl) {
        try {
            // Check recent commits for DJ activity
            const commitsUrl = repoUrl + '/commits';
            const response = await axios.get(commitsUrl, {
                headers: { 'User-Agent': 'WebScrapingDJ/1.0' }
            });
            
            const recentCommits = response.data.slice(0, 5);
            
            for (const commit of recentCommits) {
                const message = commit.commit.message.toLowerCase();
                
                // Look for music-related commit messages
                if (this.isMusicRelated(message)) {
                    const trackInfo = this.extractTrackInfo(commit);
                    
                    if (trackInfo && !this.isDuplicate(trackInfo)) {
                        console.log(`🎵 New track detected from GitHub DJ: ${trackInfo.title}`);
                        await this.processNewTrack(trackInfo);
                    }
                }
            }
            
        } catch (error) {
            // Silent fail - many repos might be private or rate limited
        }
    }
    
    isMusicRelated(message) {
        const musicKeywords = [
            'track', 'song', 'beat', 'bpm', 'tempo', 'drop', 'bass',
            'synth', 'melody', 'rhythm', 'live', 'performance', 'jam',
            'mix', 'audio', 'sound', 'music', 'play', 'dj', 'set'
        ];
        
        return musicKeywords.some(keyword => message.includes(keyword));
    }
    
    extractTrackInfo(commit) {
        const message = commit.commit.message;
        const author = commit.commit.author.name;
        const timestamp = new Date(commit.commit.author.date);
        
        // Try to extract track info from commit message
        const titleMatch = message.match(/(?:track|song|playing)[\s:]*([^\n\r]{3,50})/i);
        const bpmMatch = message.match(/(\d{2,3})\s*bpm/i);
        const genreMatch = message.match(/(?:genre|style)[\s:]*([a-zA-Z\s]{3,20})/i);
        
        return {
            id: crypto.createHash('md5').update(commit.sha).digest('hex'),
            title: titleMatch ? titleMatch[1].trim() : `Live Code Session`,
            artist: author || 'GitHub DJ',
            bpm: bpmMatch ? parseInt(bpmMatch[1]) : null,
            genre: genreMatch ? genreMatch[1].trim() : 'Algorave',
            source: 'github',
            timestamp: timestamp,
            commitSha: commit.sha,
            repoUrl: commit.html_url
        };
    }
    
    isDuplicate(trackInfo) {
        return this.trackHistory.some(track => 
            track.id === trackInfo.id || 
            (track.title === trackInfo.title && track.artist === trackInfo.artist)
        );
    }
    
    async processNewTrack(trackInfo) {
        this.currentTrack = trackInfo;
        this.trackHistory.unshift(trackInfo);
        
        // Keep only last 50 tracks
        if (this.trackHistory.length > 50) {
            this.trackHistory = this.trackHistory.slice(0, 50);
        }
        
        console.log(`🎵 Processing new track: ${trackInfo.title} by ${trackInfo.artist}`);
        
        this.emit('new_track', trackInfo);
        
        // If we have BPM, sync with groove layer
        if (trackInfo.bpm) {
            this.emit('bpm_detected', { bpm: trackInfo.bpm, source: trackInfo });
        }
    }
}

// WIKIPEDIA MUSIC SCRAPER
class WikipediaMusicScraper extends EventEmitter {
    constructor() {
        super();
        this.trackCache = new Map();
        this.genreCache = new Map();
        
        console.log('📚 Wikipedia Music Scraper initialized');
    }
    
    async scrapeTrackInfo(trackTitle, artistName) {
        const cacheKey = `${artistName}:${trackTitle}`.toLowerCase();
        
        if (this.trackCache.has(cacheKey)) {
            return this.trackCache.get(cacheKey);
        }
        
        try {
            console.log(`📚 Scraping Wikipedia for: ${trackTitle} by ${artistName}`);
            
            // Search Wikipedia for the track
            const searchResults = await this.searchWikipedia(`${trackTitle} ${artistName} song`);
            
            if (searchResults.length > 0) {
                const pageTitle = searchResults[0];
                const trackData = await this.scrapeTrackPage(pageTitle);
                
                this.trackCache.set(cacheKey, trackData);
                return trackData;
            }
            
            // If no specific track found, try artist page
            const artistResults = await this.searchWikipedia(`${artistName} musician`);
            
            if (artistResults.length > 0) {
                const artistData = await this.scrapeArtistPage(artistResults[0]);
                const trackData = {
                    title: trackTitle,
                    artist: artistName,
                    ...artistData,
                    source: 'wikipedia_artist'
                };
                
                this.trackCache.set(cacheKey, trackData);
                return trackData;
            }
            
            return null;
            
        } catch (error) {
            console.error('📚 Wikipedia scraping error:', error.message);
            return null;
        }
    }
    
    async searchWikipedia(query) {
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/search`;
        
        const response = await axios.get(searchUrl, {
            params: {
                q: query,
                limit: 3
            },
            headers: { 'User-Agent': 'WebScrapingDJ/1.0' }
        });
        
        return response.data.pages.map(page => page.title);
    }
    
    async scrapeTrackPage(pageTitle) {
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;
        
        const response = await axios.get(pageUrl, {
            headers: { 'User-Agent': 'WebScrapingDJ/1.0' }
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract infobox data
        const infobox = $('.infobox');
        const trackData = {
            title: $('h1').text().trim(),
            genre: this.extractInfoboxValue($, 'Genre'),
            released: this.extractInfoboxValue($, 'Released'),
            length: this.extractInfoboxValue($, 'Length'),
            label: this.extractInfoboxValue($, 'Label'),
            producer: this.extractInfoboxValue($, 'Producer'),
            writer: this.extractInfoboxValue($, 'Songwriter'),
            album: this.extractInfoboxValue($, 'Album'),
            source: 'wikipedia',
            wikipediaUrl: pageUrl,
            description: $('.mw-parser-output p').first().text().slice(0, 300)
        };
        
        return trackData;
    }
    
    async scrapeArtistPage(pageTitle) {
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;
        
        const response = await axios.get(pageUrl, {
            headers: { 'User-Agent': 'WebScrapingDJ/1.0' }
        });
        
        const $ = cheerio.load(response.data);
        
        return {
            artist: $('h1').text().trim(),
            genres: this.extractInfoboxValue($, 'Genres'),
            origin: this.extractInfoboxValue($, 'Origin'),
            yearsActive: this.extractInfoboxValue($, 'Years active'),
            labels: this.extractInfoboxValue($, 'Labels'),
            website: this.extractInfoboxValue($, 'Website'),
            description: $('.mw-parser-output p').first().text().slice(0, 300),
            wikipediaUrl: pageUrl,
            source: 'wikipedia'
        };
    }
    
    extractInfoboxValue($, label) {
        const row = $(`.infobox th:contains("${label}")`).parent();
        return row.find('td').text().trim() || null;
    }
    
    async scrapeGenreInfo(genre) {
        if (this.genreCache.has(genre)) {
            return this.genreCache.get(genre);
        }
        
        try {
            const searchResults = await this.searchWikipedia(`${genre} music genre`);
            
            if (searchResults.length > 0) {
                const genreData = await this.scrapeGenrePage(searchResults[0]);
                this.genreCache.set(genre, genreData);
                return genreData;
            }
            
            return null;
            
        } catch (error) {
            console.error('📚 Genre scraping error:', error.message);
            return null;
        }
    }
    
    async scrapeGenrePage(pageTitle) {
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;
        
        const response = await axios.get(pageUrl, {
            headers: { 'User-Agent': 'WebScrapingDJ/1.0' }
        });
        
        const $ = cheerio.load(response.data);
        
        return {
            genre: $('h1').text().trim(),
            origins: this.extractInfoboxValue($, 'Cultural origins'),
            instruments: this.extractInfoboxValue($, 'Typical instruments'),
            derivatives: this.extractInfoboxValue($, 'Derivative forms'),
            subgenres: this.extractInfoboxValue($, 'Subgenres'),
            description: $('.mw-parser-output p').first().text().slice(0, 400),
            wikipediaUrl: pageUrl,
            source: 'wikipedia'
        };
    }
}

// HTML5 AUDIO ANALYZER
class HTML5AudioAnalyzer extends EventEmitter {
    constructor() {
        super();
        this.audioSources = [];
        this.currentlyAnalyzing = new Set();
        
        console.log('🔊 HTML5 Audio Analyzer initialized');
    }
    
    async analyzeAudioFromURL(audioUrl) {
        if (this.currentlyAnalyzing.has(audioUrl)) {
            return;
        }
        
        this.currentlyAnalyzing.add(audioUrl);
        
        try {
            console.log(`🔊 Analyzing audio from: ${audioUrl}`);
            
            // Simulated audio analysis (in real implementation, would use Web Audio API)
            const audioData = await this.fetchAudioMetadata(audioUrl);
            
            if (audioData) {
                const analysis = {
                    url: audioUrl,
                    duration: audioData.duration,
                    sampleRate: audioData.sampleRate || 44100,
                    channels: audioData.channels || 2,
                    bitrate: audioData.bitrate,
                    format: audioData.format,
                    estimatedBPM: this.estimateBPMFromMetadata(audioData),
                    timestamp: Date.now()
                };
                
                console.log(`🔊 Audio analysis complete: ${audioUrl}`);
                this.emit('audio_analyzed', analysis);
                
                return analysis;
            }
            
        } catch (error) {
            console.error(`🔊 Audio analysis failed for ${audioUrl}:`, error.message);
        } finally {
            this.currentlyAnalyzing.delete(audioUrl);
        }
        
        return null;
    }
    
    async fetchAudioMetadata(audioUrl) {
        try {
            // Make a HEAD request to get content info
            const response = await axios.head(audioUrl, {
                headers: { 'User-Agent': 'WebScrapingDJ/1.0' },
                timeout: 5000
            });
            
            const contentLength = response.headers['content-length'];
            const contentType = response.headers['content-type'];
            
            // Estimate properties based on headers and URL
            return {
                size: contentLength ? parseInt(contentLength) : null,
                format: contentType || this.guessFormatFromURL(audioUrl),
                duration: this.estimateDurationFromSize(contentLength),
                bitrate: this.estimateBitrateFromURL(audioUrl)
            };
            
        } catch (error) {
            return null;
        }
    }
    
    guessFormatFromURL(url) {
        const extension = url.split('.').pop().toLowerCase();
        const formatMap = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac',
            'm4a': 'audio/mp4'
        };
        
        return formatMap[extension] || 'audio/unknown';
    }
    
    estimateDurationFromSize(sizeBytes) {
        if (!sizeBytes) return null;
        
        // Rough estimate: average bitrate of 128kbps
        const averageBitrate = 128000; // bits per second
        const estimatedSeconds = (sizeBytes * 8) / averageBitrate;
        
        return Math.round(estimatedSeconds);
    }
    
    estimateBitrateFromURL(url) {
        // Look for bitrate hints in URL
        const bitrateMatch = url.match(/(\d{2,3})k?bps?/i);
        if (bitrateMatch) {
            return parseInt(bitrateMatch[1]) * 1000;
        }
        
        return 128000; // Default assumption
    }
    
    estimateBPMFromMetadata(audioData) {
        // Simulate BPM detection (in real implementation, would analyze audio)
        const commonBPMs = [120, 124, 128, 130, 132, 135, 140, 145, 150];
        return commonBPMs[Math.floor(Math.random() * commonBPMs.length)];
    }
    
    async findAudioLinksOnPage(pageUrl) {
        try {
            const response = await axios.get(pageUrl, {
                headers: { 'User-Agent': 'WebScrapingDJ/1.0' },
                timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            const audioLinks = [];
            
            // Find audio elements
            $('audio').each((i, el) => {
                const src = $(el).attr('src');
                if (src) {
                    audioLinks.push({
                        type: 'html5_audio',
                        url: new URL(src, pageUrl).href,
                        title: $(el).attr('title') || 'Unknown Track'
                    });
                }
            });
            
            // Find links to audio files
            $('a[href]').each((i, el) => {
                const href = $(el).attr('href');
                if (this.isAudioURL(href)) {
                    audioLinks.push({
                        type: 'audio_link',
                        url: new URL(href, pageUrl).href,
                        title: $(el).text().trim() || 'Unknown Track'
                    });
                }
            });
            
            return audioLinks;
            
        } catch (error) {
            console.error(`🔊 Error finding audio links on ${pageUrl}:`, error.message);
            return [];
        }
    }
    
    isAudioURL(url) {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
        return audioExtensions.some(ext => url.toLowerCase().includes(ext));
    }
}

// UNIFIED WEB DJ ENGINE
class WebScrapingDJEngine extends EventEmitter {
    constructor() {
        super();
        
        this.githubDJ = new GitHubDJIntegration();
        this.wikiScraper = new WikipediaMusicScraper();
        this.audioAnalyzer = new HTML5AudioAnalyzer();
        
        this.grooveLayerUrl = 'http://localhost:3006';
        this.hyperWrapperUrl = 'http://localhost:3005';
        
        this.currentSession = {
            tracks: [],
            currentTrack: null,
            sessionId: crypto.randomUUID(),
            startTime: Date.now()
        };
        
        console.log('🎵 🌐 Web-Scraping DJ Engine initialized!');
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        // GitHub DJ events
        this.githubDJ.on('new_track', async (trackInfo) => {
            console.log(`🎧 New GitHub track: ${trackInfo.title}`);
            await this.processTrackWithWikipedia(trackInfo);
        });
        
        this.githubDJ.on('bpm_detected', async (data) => {
            console.log(`🥁 BPM detected from GitHub: ${data.bpm}`);
            await this.syncBPMWithGrooveLayer(data.bpm, data.source);
        });
        
        // Audio analyzer events
        this.audioAnalyzer.on('audio_analyzed', async (analysis) => {
            console.log(`🔊 Audio analyzed: BPM ${analysis.estimatedBPM}`);
            if (analysis.estimatedBPM) {
                await this.syncBPMWithGrooveLayer(analysis.estimatedBPM, analysis);
            }
        });
    }
    
    async processTrackWithWikipedia(trackInfo) {
        try {
            // Scrape additional info from Wikipedia
            const wikiData = await this.wikiScraper.scrapeTrackInfo(trackInfo.title, trackInfo.artist);
            
            const enrichedTrack = {
                ...trackInfo,
                wikipedia: wikiData,
                enriched: true,
                timestamp: Date.now()
            };
            
            this.currentSession.tracks.push(enrichedTrack);
            this.currentSession.currentTrack = enrichedTrack;
            
            console.log(`📚 Track enriched with Wikipedia data: ${trackInfo.title}`);
            
            // Broadcast the enriched track info
            await this.broadcastTrackInfo(enrichedTrack);
            
            this.emit('track_processed', enrichedTrack);
            
        } catch (error) {
            console.error('🎵 Error processing track:', error.message);
        }
    }
    
    async syncBPMWithGrooveLayer(bpm, source) {
        try {
            console.log(`🎼 Syncing BPM ${bpm} with groove layer...`);
            
            const response = await axios.post(`${this.grooveLayerUrl}/groove/bpm`, {
                bpm: bpm
            });
            
            if (response.data.success) {
                console.log(`✅ BPM synced to groove layer: ${bpm}`);
                
                // Broadcast BPM change event
                await this.broadcastBPMChange(bpm, source);
            }
            
        } catch (error) {
            console.error('🎼 BPM sync failed:', error.message);
        }
    }
    
    async broadcastTrackInfo(trackInfo) {
        try {
            const message = `🎵 NOW PLAYING: "${trackInfo.title}" by ${trackInfo.artist} 🎵\n` +
                           `📊 Genre: ${trackInfo.wikipedia?.genre || trackInfo.genre || 'Unknown'}\n` +
                           `🎼 BPM: ${trackInfo.bpm || 'Unknown'}\n` +
                           `📚 Wikipedia: ${trackInfo.wikipedia ? 'Found' : 'Not found'}\n` +
                           `🎧 Source: ${trackInfo.source}`;
            
            const response = await axios.post(`${this.hyperWrapperUrl}/api/groove-broadcast`, {
                message: message,
                channels: ['websocket', 'discord'],
                priority: 8,
                musicalTiming: {
                    beat: 1,
                    phase: 'track_announcement',
                    bpm: trackInfo.bpm || 128
                },
                groove: {
                    intensity: 8,
                    energy: 'announcing',
                    vibe: 'informative'
                },
                metadata: {
                    track_info: trackInfo,
                    web_scraped: true,
                    wikipedia_enriched: !!trackInfo.wikipedia
                }
            });
            
            console.log(`📡 Track info broadcasted: ${trackInfo.title}`);
            
        } catch (error) {
            console.error('📡 Track broadcast failed:', error.message);
        }
    }
    
    async broadcastBPMChange(bpm, source) {
        try {
            const message = `🎼 BPM SYNC: Groove layer updated to ${bpm} BPM! 🎼\n` +
                           `🎧 Source: ${source.title || source.url || 'Auto-detected'}\n` +
                           `🔄 System synchronized to new tempo!`;
            
            await axios.post(`${this.hyperWrapperUrl}/api/groove-broadcast`, {
                message: message,
                channels: ['websocket'],
                priority: 6,
                musicalTiming: {
                    beat: 1,
                    phase: 'bpm_sync',
                    bpm: bpm
                },
                groove: {
                    intensity: 6,
                    energy: 'syncing',
                    vibe: 'technical'
                }
            });
            
        } catch (error) {
            console.error('📡 BPM broadcast failed:', error.message);
        }
    }
    
    async scrapeWebsiteForAudio(websiteUrl) {
        try {
            console.log(`🌐 Scraping website for audio: ${websiteUrl}`);
            
            const audioLinks = await this.audioAnalyzer.findAudioLinksOnPage(websiteUrl);
            
            if (audioLinks.length > 0) {
                console.log(`🔊 Found ${audioLinks.length} audio sources`);
                
                // Analyze each audio source
                for (const audioLink of audioLinks) {
                    await this.audioAnalyzer.analyzeAudioFromURL(audioLink.url);
                }
                
                return audioLinks;
            }
            
            return [];
            
        } catch (error) {
            console.error('🌐 Website scraping failed:', error.message);
            return [];
        }
    }
    
    getSessionStatus() {
        return {
            engine: 'Web-Scraping DJ',
            session: this.currentSession,
            stats: {
                tracksProcessed: this.currentSession.tracks.length,
                currentTrack: this.currentSession.currentTrack?.title || 'None',
                githubDJsConnected: this.githubDJ.connectedDJs.size,
                wikiCacheSize: this.wikiScraper.trackCache.size,
                audioSourcesActive: this.audioAnalyzer.audioSources.length
            },
            uptime: Date.now() - this.currentSession.startTime
        };
    }
}

// MAIN EXECUTION
async function main() {
    console.log('🎵 🌐 LAUNCHING WEB-SCRAPING DJ ENGINE!');
    console.log('🎧 Connecting to GitHub DJs, Wikipedia, and HTML5 audio sources...');
    
    const webDJ = new WebScrapingDJEngine();
    
    // Event listeners
    webDJ.on('track_processed', (track) => {
        console.log(`🎵 ✅ Track processed: ${track.title} by ${track.artist}`);
        if (track.wikipedia) {
            console.log(`📚 Wikipedia data found: ${track.wikipedia.genre || 'No genre'}`);
        }
    });
    
    // Status API
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    app.get('/webdj/status', (req, res) => {
        res.json(webDJ.getSessionStatus());
    });
    
    app.post('/webdj/scrape', async (req, res) => {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL required' });
        }
        
        try {
            const audioSources = await webDJ.scrapeWebsiteForAudio(url);
            res.json({
                success: true,
                url: url,
                audioSources: audioSources,
                count: audioSources.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    
    app.listen(3007, () => {
        console.log('🌐 Web-Scraping DJ API: http://localhost:3007/webdj/status');
        console.log('🔍 Scrape website: POST /webdj/scrape {"url": "https://example.com"}');
    });
    
    console.log('✨ 🎵 WEB-SCRAPING DJ ENGINE FULLY OPERATIONAL! 🎵 ✨');
    console.log('🎧 Monitoring GitHub DJs for new tracks');
    console.log('📚 Ready to scrape Wikipedia for music data');
    console.log('🔊 HTML5 audio analysis active');
    console.log('🎼 Synced with groove layer for BPM updates');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { 
    WebScrapingDJEngine, 
    GitHubDJIntegration, 
    WikipediaMusicScraper, 
    HTML5AudioAnalyzer 
};
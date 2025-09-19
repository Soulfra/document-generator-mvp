#!/usr/bin/env node

/**
 * 🎵 MUSIC INTEGRATION SERVICE
 * Extends universal-api-client.js with Spotify integration
 * Calculates music compatibility and generates wrapped-style visualizations
 */

const EventEmitter = require('events');
const axios = require('axios');
const crypto = require('crypto');

class MusicIntegrationService extends EventEmitter {
    constructor() {
        super();
        
        this.port = 7785;
        
        // Spotify configuration
        this.spotifyConfig = {
            clientId: process.env.SPOTIFY_CLIENT_ID || 'your_client_id',
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'your_client_secret',
            redirectUri: 'http://localhost:7785/callback',
            scopes: [
                'user-read-private',
                'user-read-email',
                'user-top-read',
                'user-read-recently-played',
                'playlist-read-private',
                'user-library-read'
            ]
        };
        
        // User sessions
        this.userSessions = new Map();
        
        // Music data cache
        this.musicCache = new Map();
        
        // Compatibility algorithms
        this.compatibilityEngines = {
            genre: this.calculateGenreCompatibility.bind(this),
            artist: this.calculateArtistCompatibility.bind(this),
            audio: this.calculateAudioFeatureCompatibility.bind(this),
            tempo: this.calculateTempoCompatibility.bind(this)
        };
        
        // Statistics
        this.stats = {
            usersConnected: 0,
            wrappedGenerated: 0,
            compatibilityChecks: 0,
            cacheHits: 0
        };
        
        console.log('🎵 Music Integration Service initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Start API server
        this.startServer();
        
        // Initialize Spotify client
        await this.initializeSpotifyClient();
        
        console.log('✅ Music Integration Service ready!');
    }
    
    async initializeSpotifyClient() {
        // Get app access token
        try {
            const response = await axios.post(
                'https://accounts.spotify.com/api/token',
                'grant_type=client_credentials',
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + Buffer.from(
                            `${this.spotifyConfig.clientId}:${this.spotifyConfig.clientSecret}`
                        ).toString('base64')
                    }
                }
            );
            
            this.appAccessToken = response.data.access_token;
            console.log('🎵 Spotify client authenticated');
            
        } catch (error) {
            console.warn('⚠️ Spotify authentication failed, using mock data mode');
        }
    }
    
    generateAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.spotifyConfig.clientId,
            response_type: 'code',
            redirect_uri: this.spotifyConfig.redirectUri,
            state: state,
            scope: this.spotifyConfig.scopes.join(' ')
        });
        
        return `https://accounts.spotify.com/authorize?${params}`;
    }
    
    async exchangeCodeForToken(code) {
        try {
            const response = await axios.post(
                'https://accounts.spotify.com/api/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.spotifyConfig.redirectUri
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + Buffer.from(
                            `${this.spotifyConfig.clientId}:${this.spotifyConfig.clientSecret}`
                        ).toString('base64')
                    }
                }
            );
            
            return response.data;
            
        } catch (error) {
            console.error('Token exchange failed:', error.response?.data || error.message);
            throw error;
        }
    }
    
    async getUserMusicData(userId, accessToken) {
        const cacheKey = `user_data_${userId}`;
        
        // Check cache
        if (this.musicCache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.musicCache.get(cacheKey);
        }
        
        console.log(`📊 Fetching music data for user ${userId}`);
        
        const data = {
            profile: await this.getSpotifyProfile(accessToken),
            topTracks: await this.getTopTracks(accessToken),
            topArtists: await this.getTopArtists(accessToken),
            recentlyPlayed: await this.getRecentlyPlayed(accessToken),
            audioFeatures: {},
            genres: new Map()
        };
        
        // Get audio features for top tracks
        if (data.topTracks.items.length > 0) {
            const trackIds = data.topTracks.items.map(t => t.id).slice(0, 50);
            data.audioFeatures = await this.getAudioFeatures(accessToken, trackIds);
        }
        
        // Extract and count genres
        data.topArtists.items.forEach(artist => {
            artist.genres.forEach(genre => {
                data.genres.set(genre, (data.genres.get(genre) || 0) + 1);
            });
        });
        
        // Cache for 1 hour
        this.musicCache.set(cacheKey, data);
        setTimeout(() => this.musicCache.delete(cacheKey), 3600000);
        
        return data;
    }
    
    async getSpotifyProfile(accessToken) {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            return response.data;
        } catch (error) {
            return this.getMockProfile();
        }
    }
    
    async getTopTracks(accessToken, timeRange = 'medium_term') {
        try {
            const response = await axios.get(
                `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );
            return response.data;
        } catch (error) {
            return this.getMockTopTracks();
        }
    }
    
    async getTopArtists(accessToken, timeRange = 'medium_term') {
        try {
            const response = await axios.get(
                `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );
            return response.data;
        } catch (error) {
            return this.getMockTopArtists();
        }
    }
    
    async getRecentlyPlayed(accessToken) {
        try {
            const response = await axios.get(
                'https://api.spotify.com/v1/me/player/recently-played?limit=50',
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );
            return response.data;
        } catch (error) {
            return this.getMockRecentlyPlayed();
        }
    }
    
    async getAudioFeatures(accessToken, trackIds) {
        try {
            const response = await axios.get(
                `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );
            return response.data.audio_features;
        } catch (error) {
            return this.getMockAudioFeatures(trackIds);
        }
    }
    
    async generateWrapped(userId, options = {}) {
        console.log(`🎁 Generating wrapped for user ${userId}`);
        
        const session = this.userSessions.get(userId);
        if (!session) {
            throw new Error('User not authenticated');
        }
        
        const musicData = await this.getUserMusicData(userId, session.accessToken);
        
        const wrapped = {
            userId,
            generated: new Date().toISOString(),
            timeframe: options.timeframe || 'yearly',
            data: {
                topSongs: this.formatTopSongs(musicData.topTracks),
                topArtists: this.formatTopArtists(musicData.topArtists),
                topGenres: this.formatTopGenres(musicData.genres),
                listeningStats: this.calculateListeningStats(musicData),
                audioProfile: this.calculateAudioProfile(musicData.audioFeatures),
                personality: this.generateMusicPersonality(musicData)
            },
            visualization: null,
            sharing: {}
        };
        
        // Generate visualization
        wrapped.visualization = this.generateWrappedVisualization(wrapped);
        
        // Generate sharing options
        wrapped.sharing = {
            qrCode: this.generateShareQR(wrapped),
            url: `http://localhost:${this.port}/wrapped/${userId}`,
            embedCode: this.generateEmbedCode(wrapped)
        };
        
        this.stats.wrappedGenerated++;
        
        this.emit('wrappedGenerated', wrapped);
        
        return wrapped;
    }
    
    formatTopSongs(topTracks) {
        return topTracks.items.slice(0, 10).map((track, index) => ({
            rank: index + 1,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            image: track.album.images[0]?.url,
            preview: track.preview_url,
            popularity: track.popularity
        }));
    }
    
    formatTopArtists(topArtists) {
        return topArtists.items.slice(0, 5).map((artist, index) => ({
            rank: index + 1,
            name: artist.name,
            image: artist.images[0]?.url,
            genres: artist.genres.slice(0, 3),
            popularity: artist.popularity,
            followers: artist.followers.total
        }));
    }
    
    formatTopGenres(genreMap) {
        const genres = Array.from(genreMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const total = genres.reduce((sum, [, count]) => sum + count, 0);
        
        return genres.map(([genre, count]) => ({
            name: genre,
            count: count,
            percentage: Math.round((count / total) * 100)
        }));
    }
    
    calculateListeningStats(musicData) {
        const stats = {
            totalTracks: musicData.topTracks.items.length,
            totalArtists: musicData.topArtists.items.length,
            averagePopularity: 0,
            diversityScore: 0,
            estimatedMinutes: 0
        };
        
        // Calculate average popularity
        const popularitySum = musicData.topTracks.items.reduce(
            (sum, track) => sum + track.popularity, 0
        );
        stats.averagePopularity = Math.round(popularitySum / stats.totalTracks);
        
        // Calculate diversity score based on genre variety
        stats.diversityScore = Math.min(musicData.genres.size * 10, 100);
        
        // Estimate listening time (mock)
        stats.estimatedMinutes = Math.floor(Math.random() * 50000) + 10000;
        
        return stats;
    }
    
    calculateAudioProfile(audioFeatures) {
        if (!audioFeatures || audioFeatures.length === 0) {
            return this.getDefaultAudioProfile();
        }
        
        const profile = {
            energy: 0,
            danceability: 0,
            valence: 0, // happiness
            acousticness: 0,
            instrumentalness: 0,
            tempo: 0
        };
        
        // Calculate averages
        audioFeatures.forEach(features => {
            if (features) {
                profile.energy += features.energy;
                profile.danceability += features.danceability;
                profile.valence += features.valence;
                profile.acousticness += features.acousticness;
                profile.instrumentalness += features.instrumentalness;
                profile.tempo += features.tempo;
            }
        });
        
        const count = audioFeatures.filter(f => f).length;
        Object.keys(profile).forEach(key => {
            profile[key] = profile[key] / count;
        });
        
        return profile;
    }
    
    generateMusicPersonality(musicData) {
        const profile = this.calculateAudioProfile(musicData.audioFeatures);
        
        let personality = '';
        
        if (profile.energy > 0.7) {
            personality = 'High Energy Enthusiast';
        } else if (profile.valence > 0.7) {
            personality = 'Happy Vibes Seeker';
        } else if (profile.acousticness > 0.7) {
            personality = 'Acoustic Soul';
        } else if (profile.danceability > 0.7) {
            personality = 'Dance Floor Regular';
        } else {
            personality = 'Eclectic Explorer';
        }
        
        return {
            type: personality,
            traits: [
                profile.energy > 0.5 ? 'Energetic' : 'Chill',
                profile.danceability > 0.5 ? 'Groovy' : 'Contemplative',
                profile.valence > 0.5 ? 'Upbeat' : 'Melancholic'
            ]
        };
    }
    
    async calculateCompatibility(userId1, userId2) {
        console.log(`💕 Calculating compatibility between ${userId1} and ${userId2}`);
        
        const user1Data = await this.getUserMusicData(
            userId1, 
            this.userSessions.get(userId1)?.accessToken
        );
        
        const user2Data = await this.getUserMusicData(
            userId2,
            this.userSessions.get(userId2)?.accessToken
        );
        
        const compatibility = {
            overall: 0,
            breakdown: {},
            sharedArtists: [],
            sharedGenres: [],
            recommendations: []
        };
        
        // Calculate compatibility for each engine
        for (const [engine, calculator] of Object.entries(this.compatibilityEngines)) {
            compatibility.breakdown[engine] = await calculator(user1Data, user2Data);
        }
        
        // Calculate overall score
        const scores = Object.values(compatibility.breakdown);
        compatibility.overall = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        // Find shared artists
        const user1Artists = new Set(user1Data.topArtists.items.map(a => a.id));
        compatibility.sharedArtists = user2Data.topArtists.items
            .filter(a => user1Artists.has(a.id))
            .map(a => a.name);
        
        // Find shared genres
        const user1Genres = new Set(user1Data.genres.keys());
        compatibility.sharedGenres = Array.from(user2Data.genres.keys())
            .filter(g => user1Genres.has(g));
        
        // Generate recommendations
        compatibility.recommendations = this.generateRecommendations(
            compatibility,
            user1Data,
            user2Data
        );
        
        this.stats.compatibilityChecks++;
        
        this.emit('compatibilityCalculated', compatibility);
        
        return compatibility;
    }
    
    calculateGenreCompatibility(user1Data, user2Data) {
        const genres1 = new Set(user1Data.genres.keys());
        const genres2 = new Set(user2Data.genres.keys());
        
        const intersection = new Set([...genres1].filter(g => genres2.has(g)));
        const union = new Set([...genres1, ...genres2]);
        
        return intersection.size / union.size;
    }
    
    calculateArtistCompatibility(user1Data, user2Data) {
        const artists1 = new Set(user1Data.topArtists.items.map(a => a.id));
        const artists2 = new Set(user2Data.topArtists.items.map(a => a.id));
        
        const sharedCount = [...artists1].filter(a => artists2.has(a)).length;
        const totalUnique = new Set([...artists1, ...artists2]).size;
        
        return sharedCount / totalUnique;
    }
    
    calculateAudioFeatureCompatibility(user1Data, user2Data) {
        const profile1 = this.calculateAudioProfile(user1Data.audioFeatures || []);
        const profile2 = this.calculateAudioProfile(user2Data.audioFeatures || []);
        
        let similarity = 0;
        let count = 0;
        
        Object.keys(profile1).forEach(feature => {
            if (feature !== 'tempo') {
                const diff = Math.abs(profile1[feature] - profile2[feature]);
                similarity += 1 - diff;
                count++;
            }
        });
        
        return similarity / count;
    }
    
    calculateTempoCompatibility(user1Data, user2Data) {
        const profile1 = this.calculateAudioProfile(user1Data.audioFeatures || []);
        const profile2 = this.calculateAudioProfile(user2Data.audioFeatures || []);
        
        const tempoDiff = Math.abs(profile1.tempo - profile2.tempo);
        const maxTempoDiff = 100; // Assume max difference of 100 BPM
        
        return 1 - (tempoDiff / maxTempoDiff);
    }
    
    generateRecommendations(compatibility, user1Data, user2Data) {
        const recommendations = [];
        
        if (compatibility.overall > 0.8) {
            recommendations.push('You two are music soulmates! 🎵❤️');
        } else if (compatibility.overall > 0.6) {
            recommendations.push('Great music chemistry! Consider making a shared playlist.');
        } else if (compatibility.overall > 0.4) {
            recommendations.push('Some common ground - explore each other\'s top artists!');
        } else {
            recommendations.push('Opposites attract! Share your favorite songs with each other.');
        }
        
        if (compatibility.sharedGenres.length > 3) {
            recommendations.push(`You both love ${compatibility.sharedGenres[0]} - check out live shows together!`);
        }
        
        return recommendations;
    }
    
    generateWrappedVisualization(wrapped) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Your Music Wrapped</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1DB954 0%, #191414 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 60px;
        }
        h1 {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .section {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
        }
        .top-songs {
            display: grid;
            gap: 15px;
        }
        .song {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            transition: all 0.3s;
        }
        .song:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
        }
        .rank {
            font-size: 24px;
            font-weight: bold;
            color: #1DB954;
            width: 40px;
        }
        .song-info {
            flex: 1;
        }
        .song-name {
            font-weight: 600;
            margin-bottom: 5px;
        }
        .artist-name {
            opacity: 0.8;
            font-size: 14px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #1DB954;
        }
        .stat-label {
            margin-top: 5px;
            opacity: 0.8;
        }
        .personality {
            text-align: center;
            padding: 40px;
            background: rgba(29, 185, 84, 0.2);
            border-radius: 20px;
            margin: 30px 0;
        }
        .personality h2 {
            font-size: 32px;
            margin-bottom: 20px;
        }
        .traits {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        .trait {
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 20px;
        }
        .share-section {
            text-align: center;
            margin-top: 40px;
        }
        .share-button {
            display: inline-block;
            background: #1DB954;
            color: white;
            padding: 15px 30px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: 600;
            margin: 10px;
            transition: all 0.3s;
        }
        .share-button:hover {
            background: #1ed760;
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your 2024 Wrapped</h1>
            <p>A year of music, reimagined</p>
        </div>
        
        <div class="section">
            <h2>Top Songs</h2>
            <div class="top-songs">
                ${wrapped.data.topSongs.map(song => `
                <div class="song">
                    <div class="rank">#${song.rank}</div>
                    <div class="song-info">
                        <div class="song-name">${song.name}</div>
                        <div class="artist-name">${song.artist}</div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>Your Stats</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${Math.floor(wrapped.data.listeningStats.estimatedMinutes / 60)}</div>
                    <div class="stat-label">Hours Listened</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${wrapped.data.topArtists.length}</div>
                    <div class="stat-label">Different Artists</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${wrapped.data.topGenres[0]?.name || 'Eclectic'}</div>
                    <div class="stat-label">Top Genre</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${wrapped.data.listeningStats.diversityScore}%</div>
                    <div class="stat-label">Diversity Score</div>
                </div>
            </div>
        </div>
        
        <div class="personality">
            <h2>You're a ${wrapped.data.personality.type}</h2>
            <div class="traits">
                ${wrapped.data.personality.traits.map(trait => `
                <span class="trait">${trait}</span>
                `).join('')}
            </div>
        </div>
        
        <div class="share-section">
            <h2>Share Your Wrapped</h2>
            <a href="#" class="share-button" onclick="shareToSocial()">Share to Social</a>
            <a href="${wrapped.sharing.url}" class="share-button">Copy Link</a>
        </div>
    </div>
    
    <script>
        function shareToSocial() {
            const text = "Check out my 2024 music wrapped! 🎵";
            const url = "${wrapped.sharing.url}";
            
            if (navigator.share) {
                navigator.share({ title: 'My Music Wrapped', text, url });
            } else {
                window.open(\`https://twitter.com/intent/tweet?text=\${encodeURIComponent(text)}&url=\${encodeURIComponent(url)}\`);
            }
        }
    </script>
</body>
</html>`;
    }
    
    generateShareQR(wrapped) {
        const data = {
            type: 'music_wrapped',
            userId: wrapped.userId,
            year: new Date().getFullYear(),
            url: wrapped.sharing.url
        };
        
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${
            encodeURIComponent(JSON.stringify(data))
        }`;
    }
    
    generateEmbedCode(wrapped) {
        return `<iframe src="${wrapped.sharing.url}" width="100%" height="800" frameborder="0"></iframe>`;
    }
    
    // Mock data methods for testing without Spotify API
    
    getMockProfile() {
        return {
            id: 'mock_user_123',
            display_name: 'Music Lover',
            email: 'user@example.com',
            country: 'US'
        };
    }
    
    getMockTopTracks() {
        const mockTracks = [
            'Blinding Lights - The Weeknd',
            'Levitating - Dua Lipa',
            'Heat Waves - Glass Animals',
            'STAY - The Kid LAROI & Justin Bieber',
            'good 4 u - Olivia Rodrigo'
        ];
        
        return {
            items: mockTracks.map((track, i) => {
                const [name, artist] = track.split(' - ');
                return {
                    id: `track_${i}`,
                    name,
                    popularity: 90 - i * 5,
                    artists: [{ name: artist }],
                    album: {
                        name: `${name} Album`,
                        images: [{ url: `https://via.placeholder.com/300?text=${name}` }]
                    },
                    preview_url: null
                };
            })
        };
    }
    
    getMockTopArtists() {
        const mockArtists = [
            { name: 'The Weeknd', genres: ['canadian contemporary r&b', 'pop'] },
            { name: 'Dua Lipa', genres: ['dance pop', 'uk pop'] },
            { name: 'Glass Animals', genres: ['indie rock', 'modern rock'] },
            { name: 'Justin Bieber', genres: ['canadian pop', 'pop'] },
            { name: 'Olivia Rodrigo', genres: ['pop', 'alt z'] }
        ];
        
        return {
            items: mockArtists.map((artist, i) => ({
                id: `artist_${i}`,
                name: artist.name,
                genres: artist.genres,
                popularity: 95 - i * 3,
                followers: { total: 50000000 - i * 5000000 },
                images: [{ url: `https://via.placeholder.com/300?text=${artist.name}` }]
            }))
        };
    }
    
    getMockRecentlyPlayed() {
        return {
            items: this.getMockTopTracks().items.slice(0, 10).map(track => ({
                track,
                played_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
            }))
        };
    }
    
    getMockAudioFeatures(trackIds) {
        return trackIds.map(id => ({
            id,
            energy: Math.random(),
            danceability: Math.random(),
            valence: Math.random(),
            acousticness: Math.random(),
            instrumentalness: Math.random() * 0.3,
            tempo: 80 + Math.random() * 100
        }));
    }
    
    getDefaultAudioProfile() {
        return {
            energy: 0.5,
            danceability: 0.5,
            valence: 0.5,
            acousticness: 0.3,
            instrumentalness: 0.1,
            tempo: 120
        };
    }
    
    startServer() {
        const express = require('express');
        const app = express();
        
        app.use(express.json());
        app.use(express.static(__dirname));
        
        // Spotify auth flow
        app.get('/auth', (req, res) => {
            const state = crypto.randomBytes(16).toString('hex');
            const authUrl = this.generateAuthUrl(state);
            
            res.redirect(authUrl);
        });
        
        app.get('/callback', async (req, res) => {
            try {
                const { code, state } = req.query;
                
                if (!code) {
                    throw new Error('No authorization code received');
                }
                
                const tokens = await this.exchangeCodeForToken(code);
                
                // Create user session
                const userId = `user_${Date.now()}`;
                this.userSessions.set(userId, {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresAt: Date.now() + tokens.expires_in * 1000
                });
                
                this.stats.usersConnected++;
                
                res.redirect(`/success?userId=${userId}`);
                
            } catch (error) {
                res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
            }
        });
        
        // Success page
        app.get('/success', (req, res) => {
            res.send(`
                <h1>Successfully connected to Spotify!</h1>
                <p>User ID: ${req.query.userId}</p>
                <p>You can now generate your wrapped and check compatibility.</p>
                <a href="/wrapped/${req.query.userId}">View Your Wrapped</a>
            `);
        });
        
        // Generate wrapped
        app.post('/generate-wrapped', async (req, res) => {
            try {
                const { userId, options } = req.body;
                
                const wrapped = await this.generateWrapped(userId, options);
                res.json({ wrapped });
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // View wrapped
        app.get('/wrapped/:userId', async (req, res) => {
            try {
                const wrapped = await this.generateWrapped(req.params.userId);
                res.send(wrapped.visualization);
                
            } catch (error) {
                res.status(500).send(`Error: ${error.message}`);
            }
        });
        
        // Calculate compatibility
        app.post('/compatibility', async (req, res) => {
            try {
                const { userId1, userId2 } = req.body;
                
                const compatibility = await this.calculateCompatibility(userId1, userId2);
                res.json({ compatibility });
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Mock authentication for testing
        app.post('/mock-auth', (req, res) => {
            const userId = `mock_${Date.now()}`;
            
            this.userSessions.set(userId, {
                accessToken: 'mock_token',
                refreshToken: 'mock_refresh',
                expiresAt: Date.now() + 3600000
            });
            
            this.stats.usersConnected++;
            
            res.json({ userId, message: 'Mock authentication successful' });
        });
        
        // Statistics
        app.get('/stats', (req, res) => {
            res.json(this.stats);
        });
        
        app.listen(this.port, () => {
            console.log(`🌐 Music Integration Service running on port ${this.port}`);
        });
    }
}

// Export
module.exports = MusicIntegrationService;

// Run if called directly
if (require.main === module) {
    const service = new MusicIntegrationService();
    
    // Example usage
    setTimeout(async () => {
        console.log('\n🎵 Example: Creating mock user sessions...\n');
        
        // Create two mock users
        const user1Response = await axios.post('http://localhost:7785/mock-auth');
        const user2Response = await axios.post('http://localhost:7785/mock-auth');
        
        const user1 = user1Response.data.userId;
        const user2 = user2Response.data.userId;
        
        console.log(`Created users: ${user1}, ${user2}`);
        
        // Generate wrapped for user1
        console.log('\nGenerating wrapped for user1...');
        const wrappedResponse = await axios.post('http://localhost:7785/generate-wrapped', {
            userId: user1
        });
        
        console.log('Wrapped URL:', wrappedResponse.data.wrapped.sharing.url);
        
    }, 2000).catch(console.error);
    
    console.log(`
🎵 MUSIC INTEGRATION SERVICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spotify API integration
Music compatibility calculation
Wrapped-style visualizations

Endpoints:
- GET  /auth - Start Spotify authentication
- POST /generate-wrapped - Generate user wrapped
- POST /compatibility - Calculate compatibility
- POST /mock-auth - Create mock session for testing

http://localhost:7785
    `);
}
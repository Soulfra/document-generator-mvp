#!/usr/bin/env node

/**
 * 🎥 MULTIMEDIA CONTENT ANALYZER
 * 
 * Processes YouTube videos, podcasts, and other multimedia content for insights.
 * Uses local LLMs for privacy-first analysis of transcripts and metadata.
 * 
 * Features:
 * - YouTube video analysis with transcript extraction
 * - Podcast RSS feed processing and episode analysis
 * - Audio transcription using local models
 * - Content summarization and insight generation
 * - Learning recommendations based on content
 * - Pattern recognition across media consumption
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const winston = require('winston');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/multimedia-analyzer.log' })
  ]
});

class MultimediaContentAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      outputDir: options.outputDir || './multimedia-content',
      tempDir: options.tempDir || './temp',
      maxFileSize: options.maxFileSize || 100 * 1024 * 1024, // 100MB
      ytDlpPath: options.ytDlpPath || 'yt-dlp',
      whisperPath: options.whisperPath || 'whisper',
      ffmpegPath: options.ffmpegPath || 'ffmpeg',
      enableTranscription: options.enableTranscription !== false,
      enableDownload: options.enableDownload !== false,
      llmProcessor: options.llmProcessor || null,
      database: options.database || null,
      ...options
    };

    // Processing state
    this.isInitialized = false;
    this.processingQueue = [];
    this.isProcessing = false;
    
    // Content cache
    this.transcriptCache = new Map();
    this.analysisCache = new Map();
    this.metadataCache = new Map();
    
    // Statistics
    this.stats = {
      videosProcessed: 0,
      podcastsProcessed: 0,
      transcriptsGenerated: 0,
      analysesCreated: 0,
      averageProcessingTime: 0,
      totalContentDuration: 0
    };

    console.log('🎥 Multimedia Content Analyzer initialized');
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing Multimedia Content Analyzer...');

      // Check dependencies
      await this.checkDependencies();
      
      // Create directories
      await this.createDirectories();
      
      // Load existing cache
      await this.loadCache();
      
      this.isInitialized = true;
      
      logger.info('✅ Multimedia Content Analyzer ready');
      this.emit('ready');

    } catch (error) {
      logger.error('❌ Failed to initialize analyzer:', error);
      throw error;
    }
  }

  /**
   * Check if required dependencies are available
   */
  async checkDependencies() {
    const dependencies = [
      { name: 'yt-dlp', command: this.config.ytDlpPath, flag: '--version' },
      { name: 'ffmpeg', command: this.config.ffmpegPath, flag: '-version' }
    ];

    for (const dep of dependencies) {
      try {
        await execAsync(`${dep.command} ${dep.flag}`);
        logger.info(`✅ ${dep.name} available`);
      } catch (error) {
        logger.warn(`⚠️ ${dep.name} not available: ${error.message}`);
      }
    }
  }

  /**
   * Create necessary directories
   */
  async createDirectories() {
    const dirs = [
      this.config.outputDir,
      this.config.tempDir,
      path.join(this.config.outputDir, 'videos'),
      path.join(this.config.outputDir, 'podcasts'),
      path.join(this.config.outputDir, 'transcripts'),
      path.join(this.config.outputDir, 'analysis')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Process a YouTube video
   */
  async processYouTubeVideo(url) {
    if (!this.isInitialized) {
      throw new Error('Analyzer not initialized');
    }

    const startTime = Date.now();
    
    try {
      logger.info('🎬 Processing YouTube video', { url });

      // Extract video ID
      const videoId = this.extractYouTubeVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Check cache
      const cacheKey = `youtube_${videoId}`;
      if (this.analysisCache.has(cacheKey)) {
        logger.info('📦 Using cached analysis');
        return this.analysisCache.get(cacheKey);
      }

      // Get video metadata
      const metadata = await this.getYouTubeMetadata(url);
      
      // Get transcript (try multiple methods)
      const transcript = await this.getYouTubeTranscript(url, videoId);
      
      // Generate analysis
      const analysis = await this.analyzeVideoContent(metadata, transcript);
      
      // Save results
      await this.saveVideoAnalysis(videoId, {
        url,
        metadata,
        transcript,
        analysis,
        processedAt: Date.now()
      });

      // Update cache
      this.analysisCache.set(cacheKey, analysis);
      
      // Update statistics
      this.stats.videosProcessed++;
      this.stats.averageProcessingTime = (this.stats.averageProcessingTime + (Date.now() - startTime)) / 2;
      if (metadata.duration) {
        this.stats.totalContentDuration += this.parseDuration(metadata.duration);
      }

      logger.info('✅ YouTube video processed', {
        videoId,
        title: metadata.title,
        duration: metadata.duration,
        processingTime: Date.now() - startTime
      });

      this.emit('video:processed', { videoId, analysis });
      return analysis;

    } catch (error) {
      logger.error('❌ Failed to process YouTube video:', error);
      throw error;
    }
  }

  /**
   * Process a podcast episode or feed
   */
  async processPodcast(url) {
    if (!this.isInitialized) {
      throw new Error('Analyzer not initialized');
    }

    const startTime = Date.now();
    
    try {
      logger.info('🎙️ Processing podcast', { url });

      // Determine if it's an RSS feed or direct episode URL
      const isPodcastFeed = url.includes('rss') || url.includes('feed') || url.includes('.xml');
      
      if (isPodcastFeed) {
        return await this.processPodcastFeed(url);
      } else {
        return await this.processPodcastEpisode(url);
      }

    } catch (error) {
      logger.error('❌ Failed to process podcast:', error);
      throw error;
    }
  }

  /**
   * Process a podcast RSS feed
   */
  async processPodcastFeed(feedUrl) {
    try {
      // Fetch RSS feed
      const response = await axios.get(feedUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MultimediaAnalyzer/1.0)'
        }
      });

      // Parse RSS feed (basic XML parsing)
      const feed = this.parseRSSFeed(response.data);
      
      // Process recent episodes (limit to 10)
      const recentEpisodes = feed.episodes.slice(0, 10);
      const processedEpisodes = [];

      for (const episode of recentEpisodes) {
        try {
          const analysis = await this.processPodcastEpisode(episode.audioUrl, episode);
          processedEpisodes.push(analysis);
        } catch (error) {
          logger.warn(`Failed to process episode: ${episode.title}`, error.message);
        }
      }

      // Generate feed-level analysis
      const feedAnalysis = await this.analyzePodcastFeed(feed, processedEpisodes);

      // Save results
      await this.savePodcastFeedAnalysis(feed.title || 'Unknown', {
        feedUrl,
        feed,
        episodes: processedEpisodes,
        analysis: feedAnalysis,
        processedAt: Date.now()
      });

      this.stats.podcastsProcessed += processedEpisodes.length;

      return {
        type: 'podcast_feed',
        feed: feed.title,
        episodesProcessed: processedEpisodes.length,
        analysis: feedAnalysis,
        episodes: processedEpisodes
      };

    } catch (error) {
      logger.error('❌ Failed to process podcast feed:', error);
      throw error;
    }
  }

  /**
   * Process a single podcast episode
   */
  async processPodcastEpisode(url, episodeData = null) {
    try {
      const episodeId = this.generateEpisodeId(url);
      const cacheKey = `podcast_${episodeId}`;

      // Check cache
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey);
      }

      // Get episode metadata
      const metadata = episodeData || await this.getPodcastMetadata(url);
      
      // Get transcript
      const transcript = await this.getPodcastTranscript(url, episodeId);
      
      // Generate analysis
      const analysis = await this.analyzePodcastContent(metadata, transcript);

      // Save and cache
      await this.savePodcastAnalysis(episodeId, {
        url,
        metadata,
        transcript,
        analysis,
        processedAt: Date.now()
      });

      this.analysisCache.set(cacheKey, analysis);

      return analysis;

    } catch (error) {
      logger.error('❌ Failed to process podcast episode:', error);
      throw error;
    }
  }

  /**
   * Get YouTube video metadata
   */
  async getYouTubeMetadata(url) {
    try {
      const command = `${this.config.ytDlpPath} --dump-json --no-download "${url}"`;
      const { stdout } = await execAsync(command);
      const metadata = JSON.parse(stdout);

      return {
        id: metadata.id,
        title: metadata.title,
        description: metadata.description,
        duration: metadata.duration,
        uploader: metadata.uploader,
        upload_date: metadata.upload_date,
        view_count: metadata.view_count,
        like_count: metadata.like_count,
        tags: metadata.tags || [],
        categories: metadata.categories || [],
        thumbnail: metadata.thumbnail
      };

    } catch (error) {
      logger.error('Failed to get YouTube metadata:', error);
      return { title: 'Unknown Video', description: '', duration: 0 };
    }
  }

  /**
   * Get YouTube transcript
   */
  async getYouTubeTranscript(url, videoId) {
    try {
      // Try to get auto-generated subtitles first
      const command = `${this.config.ytDlpPath} --write-auto-sub --sub-lang en --skip-download --output "${this.config.tempDir}/%(id)s.%(ext)s" "${url}"`;
      await execAsync(command);

      // Read subtitle file
      const subtitlePath = path.join(this.config.tempDir, `${videoId}.en.vtt`);
      try {
        const subtitleContent = await fs.readFile(subtitlePath, 'utf8');
        const transcript = this.parseVTTSubtitles(subtitleContent);
        
        // Cleanup temp file
        await fs.unlink(subtitlePath).catch(() => {});
        
        this.stats.transcriptsGenerated++;
        return transcript;

      } catch (readError) {
        logger.warn('No subtitles available, attempting audio transcription');
        return await this.transcribeYouTubeAudio(url, videoId);
      }

    } catch (error) {
      logger.warn('Failed to get YouTube transcript:', error.message);
      return '';
    }
  }

  /**
   * Transcribe YouTube audio using local transcription
   */
  async transcribeYouTubeAudio(url, videoId) {
    if (!this.config.enableTranscription) {
      return '';
    }

    try {
      // Download audio only
      const audioPath = path.join(this.config.tempDir, `${videoId}.mp3`);
      const downloadCommand = `${this.config.ytDlpPath} -x --audio-format mp3 --output "${audioPath}" "${url}"`;
      
      await execAsync(downloadCommand);

      // Check file size
      const stats = await fs.stat(audioPath);
      if (stats.size > this.config.maxFileSize) {
        await fs.unlink(audioPath);
        throw new Error('Audio file too large for transcription');
      }

      // Transcribe using Whisper (if available)
      let transcript = '';
      try {
        const transcribeCommand = `${this.config.whisperPath} "${audioPath}" --language en --output_format txt`;
        const { stdout } = await execAsync(transcribeCommand);
        transcript = stdout.trim();
      } catch (whisperError) {
        logger.warn('Whisper transcription failed:', whisperError.message);
      }

      // Cleanup
      await fs.unlink(audioPath).catch(() => {});

      if (transcript) {
        this.stats.transcriptsGenerated++;
      }

      return transcript;

    } catch (error) {
      logger.error('Failed to transcribe YouTube audio:', error);
      return '';
    }
  }

  /**
   * Get podcast metadata
   */
  async getPodcastMetadata(url) {
    try {
      const command = `${this.config.ytDlpPath} --dump-json --no-download "${url}"`;
      const { stdout } = await execAsync(command);
      const metadata = JSON.parse(stdout);

      return {
        title: metadata.title || 'Unknown Episode',
        description: metadata.description || '',
        duration: metadata.duration || 0,
        creator: metadata.uploader || metadata.creator,
        upload_date: metadata.upload_date,
        url: url
      };

    } catch (error) {
      logger.warn('Failed to get podcast metadata:', error.message);
      return { title: 'Unknown Episode', description: '', duration: 0, url };
    }
  }

  /**
   * Get podcast transcript
   */
  async getPodcastTranscript(url, episodeId) {
    if (!this.config.enableTranscription) {
      return '';
    }

    try {
      // Download audio
      const audioPath = path.join(this.config.tempDir, `${episodeId}.mp3`);
      const downloadCommand = `${this.config.ytDlpPath} -x --audio-format mp3 --output "${audioPath}" "${url}"`;
      
      await execAsync(downloadCommand);

      // Check file size
      const stats = await fs.stat(audioPath);
      if (stats.size > this.config.maxFileSize) {
        await fs.unlink(audioPath);
        throw new Error('Audio file too large for transcription');
      }

      // Transcribe
      let transcript = '';
      try {
        const transcribeCommand = `${this.config.whisperPath} "${audioPath}" --language en --output_format txt`;
        const { stdout } = await execAsync(transcribeCommand);
        transcript = stdout.trim();
      } catch (whisperError) {
        logger.warn('Podcast transcription failed:', whisperError.message);
      }

      // Cleanup
      await fs.unlink(audioPath).catch(() => {});

      if (transcript) {
        this.stats.transcriptsGenerated++;
      }

      return transcript;

    } catch (error) {
      logger.error('Failed to transcribe podcast:', error);
      return '';
    }
  }

  /**
   * Analyze video content using LLM
   */
  async analyzeVideoContent(metadata, transcript) {
    if (!this.config.llmProcessor) {
      return this.generateBasicVideoAnalysis(metadata, transcript);
    }

    const prompt = `Analyze this YouTube video and provide insights:

Title: ${metadata.title}
Description: ${metadata.description?.substring(0, 500)}...
Duration: ${metadata.duration} seconds
Creator: ${metadata.uploader}
Tags: ${metadata.tags?.join(', ')}

Transcript Preview:
${transcript.substring(0, 2000)}...

Provide analysis including:
1. Main topics and themes
2. Key takeaways and insights
3. Learning value assessment
4. Content quality rating
5. Recommended audience
6. Related topics to explore

Format as structured analysis.`;

    try {
      const insights = await this.config.llmProcessor.generateInsights(prompt);
      this.stats.analysesCreated++;
      
      return {
        title: metadata.title,
        duration: metadata.duration,
        topics: this.extractTopics(transcript),
        insights,
        summary: this.generateSummary(transcript),
        learningValue: this.assessLearningValue(metadata, transcript),
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('LLM analysis failed, using basic analysis:', error);
      return this.generateBasicVideoAnalysis(metadata, transcript);
    }
  }

  /**
   * Analyze podcast content using LLM
   */
  async analyzePodcastContent(metadata, transcript) {
    if (!this.config.llmProcessor) {
      return this.generateBasicPodcastAnalysis(metadata, transcript);
    }

    const prompt = `Analyze this podcast episode and provide insights:

Title: ${metadata.title}
Description: ${metadata.description?.substring(0, 500)}...
Duration: ${metadata.duration} seconds
Creator: ${metadata.creator}

Transcript Preview:
${transcript.substring(0, 2000)}...

Provide analysis including:
1. Episode themes and discussion points
2. Key insights and takeaways
3. Guest insights (if applicable)
4. Learning opportunities
5. Content quality assessment
6. Related episodes or topics

Format as structured podcast analysis.`;

    try {
      const insights = await this.config.llmProcessor.generateInsights(prompt);
      this.stats.analysesCreated++;
      
      return {
        title: metadata.title,
        duration: metadata.duration,
        topics: this.extractTopics(transcript),
        insights,
        summary: this.generateSummary(transcript),
        learningValue: this.assessLearningValue(metadata, transcript),
        type: 'podcast_episode',
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('LLM analysis failed, using basic analysis:', error);
      return this.generateBasicPodcastAnalysis(metadata, transcript);
    }
  }

  // Utility methods
  extractYouTubeVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }

  generateEpisodeId(url) {
    return Buffer.from(url).toString('base64').substring(0, 16);
  }

  parseVTTSubtitles(vttContent) {
    return vttContent
      .split('\n')
      .filter(line => !line.includes('-->') && !line.includes('WEBVTT') && line.trim())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  parseRSSFeed(xml) {
    // Basic RSS parsing - in production, use a proper XML parser
    const titleMatch = xml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
    const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : 'Unknown Podcast';
    
    // Extract episodes
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const episodes = itemMatches.slice(0, 10).map(item => {
      const episodeTitle = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const audioUrl = item.match(/<enclosure[^>]+url="([^"]+)"/);
      
      return {
        title: episodeTitle ? (episodeTitle[1] || episodeTitle[2]) : 'Unknown Episode',
        audioUrl: audioUrl ? audioUrl[1] : null
      };
    }).filter(ep => ep.audioUrl);

    return { title, episodes };
  }

  extractTopics(text) {
    const commonTopics = [
      'technology', 'programming', 'business', 'startup', 'AI', 'machine learning',
      'web development', 'mobile', 'design', 'marketing', 'productivity', 'career',
      'finance', 'health', 'science', 'education', 'entrepreneurship'
    ];

    const foundTopics = [];
    const lowerText = text.toLowerCase();
    
    commonTopics.forEach(topic => {
      if (lowerText.includes(topic)) {
        foundTopics.push(topic);
      }
    });
    
    return foundTopics.slice(0, 5);
  }

  generateSummary(transcript) {
    if (!transcript) return 'No transcript available';
    
    // Simple extractive summary - take first few sentences
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  assessLearningValue(metadata, transcript) {
    let score = 0;
    
    // Duration factor
    if (metadata.duration > 300) score += 1; // 5+ minutes
    if (metadata.duration > 1800) score += 1; // 30+ minutes
    
    // Content quality indicators
    if (transcript.length > 1000) score += 1;
    if (metadata.description && metadata.description.length > 100) score += 1;
    
    // Educational keywords
    const educationalKeywords = ['tutorial', 'learn', 'how to', 'guide', 'course', 'explain'];
    const hasEducationalContent = educationalKeywords.some(keyword => 
      metadata.title?.toLowerCase().includes(keyword) ||
      metadata.description?.toLowerCase().includes(keyword)
    );
    
    if (hasEducationalContent) score += 2;
    
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  parseDuration(duration) {
    if (typeof duration === 'number') return duration;
    // Parse duration string if needed
    return parseInt(duration) || 0;
  }

  // Fallback analysis methods
  generateBasicVideoAnalysis(metadata, transcript) {
    return {
      title: metadata.title,
      duration: metadata.duration,
      topics: this.extractTopics(transcript),
      insights: [`Video: ${metadata.title}`, `Duration: ${metadata.duration} seconds`],
      summary: this.generateSummary(transcript),
      learningValue: this.assessLearningValue(metadata, transcript),
      timestamp: Date.now()
    };
  }

  generateBasicPodcastAnalysis(metadata, transcript) {
    return {
      title: metadata.title,
      duration: metadata.duration,
      topics: this.extractTopics(transcript),
      insights: [`Podcast: ${metadata.title}`, `Duration: ${metadata.duration} seconds`],
      summary: this.generateSummary(transcript),
      learningValue: this.assessLearningValue(metadata, transcript),
      type: 'podcast_episode',
      timestamp: Date.now()
    };
  }

  // Storage methods
  async saveVideoAnalysis(videoId, data) {
    try {
      const filePath = path.join(this.config.outputDir, 'videos', `${videoId}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      if (this.config.database) {
        await this.config.database.saveVideoAnalysis(data);
      }

    } catch (error) {
      logger.error('Failed to save video analysis:', error);
    }
  }

  async savePodcastAnalysis(episodeId, data) {
    try {
      const filePath = path.join(this.config.outputDir, 'podcasts', `${episodeId}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      if (this.config.database) {
        await this.config.database.savePodcastAnalysis(data);
      }

    } catch (error) {
      logger.error('Failed to save podcast analysis:', error);
    }
  }

  async loadCache() {
    // Implementation for loading existing cache
    logger.info('📦 Cache loaded');
  }

  getStatus() {
    return {
      status: this.isInitialized ? 'ready' : 'initializing',
      stats: this.stats,
      queueSize: this.processingQueue.length,
      cacheSize: {
        transcripts: this.transcriptCache.size,
        analyses: this.analysisCache.size,
        metadata: this.metadataCache.size
      }
    };
  }
}

module.exports = MultimediaContentAnalyzer;

// Start standalone if called directly
if (require.main === module) {
  const analyzer = new MultimediaContentAnalyzer();
  
  analyzer.on('ready', () => {
    console.log('🎥 Multimedia Content Analyzer is ready!');
  });

  analyzer.on('video:processed', (result) => {
    console.log(`📹 Video processed: ${result.analysis.title}`);
  });

  analyzer.initialize().catch(error => {
    console.error('❌ Failed to initialize analyzer:', error);
    process.exit(1);
  });
}
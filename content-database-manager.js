#!/usr/bin/env node

/**
 * 📊 CONTENT DATABASE MANAGER
 * 
 * Manages storage and retrieval of all analyzed content including:
 * - Browser recording sessions and interactions
 * - YouTube video analyses and transcripts
 * - Podcast episode insights and summaries
 * - Web content analysis and learning patterns
 * - User behavior patterns and insights
 * 
 * Uses SQLite for local, privacy-first storage with full-text search capabilities.
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const winston = require('winston');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database-manager.log' })
  ]
});

class ContentDatabaseManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      dbPath: options.dbPath || './agentic-browser.db',
      enableWAL: options.enableWAL !== false,
      enableFTS: options.enableFTS !== false,
      backupInterval: options.backupInterval || 24 * 60 * 60 * 1000, // 24 hours
      maxBackups: options.maxBackups || 7,
      ...options
    };

    this.db = null;
    this.isInitialized = false;
    
    // Query cache
    this.queryCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Statistics
    this.stats = {
      sessions: 0,
      interactions: 0,
      videos: 0,
      podcasts: 0,
      webContent: 0,
      insights: 0,
      patterns: 0
    };

    console.log('📊 Content Database Manager initialized');
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing Content Database Manager...');

      // Open database connection
      this.db = await open({
        filename: this.config.dbPath,
        driver: sqlite3.Database
      });

      // Configure database
      await this.configureDatabase();
      
      // Create tables
      await this.createTables();
      
      // Update statistics
      await this.updateStatistics();
      
      // Schedule backups
      this.scheduleBackups();
      
      this.isInitialized = true;
      
      logger.info('✅ Content Database Manager ready', {
        dbPath: this.config.dbPath,
        stats: this.stats
      });
      
      this.emit('ready');

    } catch (error) {
      logger.error('❌ Failed to initialize database manager:', error);
      throw error;
    }
  }

  async configureDatabase() {
    // Enable WAL mode for better concurrency
    if (this.config.enableWAL) {
      await this.db.exec('PRAGMA journal_mode = WAL;');
    }
    
    // Optimize for performance
    await this.db.exec(`
      PRAGMA synchronous = NORMAL;
      PRAGMA cache_size = 10000;
      PRAGMA temp_store = MEMORY;
      PRAGMA mmap_size = 268435456;
    `);
  }

  async createTables() {
    // Sessions table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        interaction_count INTEGER DEFAULT 0,
        recording_path TEXT,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Interactions table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        data TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
      )
    `);

    // Content table (videos, podcasts, web content)
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS content (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'video', 'podcast', 'webpage'
        url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        duration INTEGER,
        creator TEXT,
        metadata TEXT,
        transcript TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Analyses table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        content_id TEXT,
        session_id TEXT,
        type TEXT NOT NULL, -- 'content', 'session', 'realtime'
        insights TEXT NOT NULL,
        topics TEXT,
        summary TEXT,
        learning_value TEXT,
        confidence_score REAL DEFAULT 0.0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (content_id) REFERENCES content (id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
      )
    `);

    // Patterns table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS patterns (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        pattern_name TEXT NOT NULL,
        description TEXT,
        frequency INTEGER DEFAULT 1,
        significance TEXT,
        first_seen INTEGER DEFAULT (strftime('%s', 'now')),
        last_seen INTEGER DEFAULT (strftime('%s', 'now')),
        metadata TEXT
      )
    `);

    // Learning insights table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS learning_insights (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        category TEXT NOT NULL,
        insight TEXT NOT NULL,
        confidence REAL DEFAULT 0.0,
        evidence_count INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create indexes for better performance
    await this.createIndexes();

    // Create full-text search tables if enabled
    if (this.config.enableFTS) {
      await this.createFTSTables();
    }
  }

  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions (start_time)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_session_id ON interactions (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions (type)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_content_type ON content (type)',
      'CREATE INDEX IF NOT EXISTS idx_content_url ON content (url)',
      'CREATE INDEX IF NOT EXISTS idx_content_created_at ON content (created_at)',
      'CREATE INDEX IF NOT EXISTS idx_analyses_content_id ON analyses (content_id)',
      'CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON analyses (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_analyses_type ON analyses (type)',
      'CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns (type)',
      'CREATE INDEX IF NOT EXISTS idx_patterns_frequency ON patterns (frequency)',
      'CREATE INDEX IF NOT EXISTS idx_learning_category ON learning_insights (category)'
    ];

    for (const indexSQL of indexes) {
      await this.db.exec(indexSQL);
    }
  }

  async createFTSTables() {
    // Full-text search for content
    await this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(
        id UNINDEXED,
        title,
        description,
        transcript,
        content='content',
        content_rowid='id'
      )
    `);

    // Full-text search for analyses
    await this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS analyses_fts USING fts5(
        id UNINDEXED,
        insights,
        topics,
        summary,
        content='analyses',
        content_rowid='id'
      )
    `);

    // Triggers to keep FTS tables in sync
    await this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS content_fts_insert AFTER INSERT ON content BEGIN
        INSERT INTO content_fts(id, title, description, transcript)
        VALUES (new.id, new.title, new.description, new.transcript);
      END;
    `);

    await this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS content_fts_update AFTER UPDATE ON content BEGIN
        UPDATE content_fts SET 
          title = new.title,
          description = new.description,
          transcript = new.transcript
        WHERE id = new.id;
      END;
    `);

    await this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS content_fts_delete AFTER DELETE ON content BEGIN
        DELETE FROM content_fts WHERE id = old.id;
      END;
    `);
  }

  // Session management
  async saveSession(session) {
    try {
      const stmt = await this.db.prepare(`
        INSERT OR REPLACE INTO sessions 
        (id, start_time, end_time, duration, interaction_count, recording_path, metadata, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);

      await stmt.run(
        session.id,
        session.startTime,
        session.endTime || null,
        session.duration || null,
        session.interactions?.length || 0,
        session.recordingPath || null,
        JSON.stringify(session.metadata || {})
      );

      await stmt.finalize();
      
      // Save interactions if present
      if (session.interactions && session.interactions.length > 0) {
        await this.saveInteractions(session.interactions);
      }

      logger.debug('💾 Session saved', { sessionId: session.id });

    } catch (error) {
      logger.error('❌ Failed to save session:', error);
      throw error;
    }
  }

  async saveInteractions(interactions) {
    try {
      const stmt = await this.db.prepare(`
        INSERT OR REPLACE INTO interactions (id, session_id, type, timestamp, data)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const interaction of interactions) {
        await stmt.run(
          interaction.id || `${interaction.sessionId}_${interaction.timestamp}`,
          interaction.sessionId,
          interaction.type,
          interaction.timestamp,
          JSON.stringify(interaction.data || {})
        );
      }

      await stmt.finalize();
      this.stats.interactions += interactions.length;

    } catch (error) {
      logger.error('❌ Failed to save interactions:', error);
      throw error;
    }
  }

  async getSession(sessionId) {
    try {
      const session = await this.db.get(`
        SELECT * FROM sessions WHERE id = ?
      `, sessionId);

      if (!session) return null;

      // Get interactions
      const interactions = await this.db.all(`
        SELECT * FROM interactions WHERE session_id = ? ORDER BY timestamp ASC
      `, sessionId);

      return {
        ...session,
        metadata: JSON.parse(session.metadata || '{}'),
        interactions: interactions.map(i => ({
          ...i,
          data: JSON.parse(i.data || '{}')
        }))
      };

    } catch (error) {
      logger.error('❌ Failed to get session:', error);
      throw error;
    }
  }

  async getRecentSessions(limit = 10) {
    try {
      const sessions = await this.db.all(`
        SELECT id, start_time, end_time, duration, interaction_count, 
               substr(metadata, 1, 100) as metadata_preview
        FROM sessions 
        ORDER BY start_time DESC 
        LIMIT ?
      `, limit);

      return sessions.map(session => ({
        ...session,
        metadata_preview: session.metadata_preview ? JSON.parse(session.metadata_preview) : {}
      }));

    } catch (error) {
      logger.error('❌ Failed to get recent sessions:', error);
      return [];
    }
  }

  // Content management
  async saveContent(content) {
    try {
      const stmt = await this.db.prepare(`
        INSERT OR REPLACE INTO content 
        (id, type, url, title, description, duration, creator, metadata, transcript, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);

      const contentId = content.id || this.generateContentId(content.url);

      await stmt.run(
        contentId,
        content.type,
        content.url,
        content.title || null,
        content.description || null,
        content.duration || null,
        content.creator || null,
        JSON.stringify(content.metadata || {}),
        content.transcript || null
      );

      await stmt.finalize();
      
      logger.debug('💾 Content saved', { contentId, type: content.type });
      return contentId;

    } catch (error) {
      logger.error('❌ Failed to save content:', error);
      throw error;
    }
  }

  async saveVideoAnalysis(videoData) {
    try {
      // Save content
      const contentId = await this.saveContent({
        id: `video_${videoData.metadata.id}`,
        type: 'video',
        url: videoData.url,
        title: videoData.metadata.title,
        description: videoData.metadata.description,
        duration: videoData.metadata.duration,
        creator: videoData.metadata.uploader,
        metadata: videoData.metadata,
        transcript: videoData.transcript
      });

      // Save analysis
      await this.saveAnalysis({
        id: `analysis_${contentId}`,
        content_id: contentId,
        type: 'content',
        insights: videoData.analysis.insights,
        topics: videoData.analysis.topics,
        summary: videoData.analysis.summary,
        learning_value: videoData.analysis.learningValue
      });

      this.stats.videos++;

    } catch (error) {
      logger.error('❌ Failed to save video analysis:', error);
      throw error;
    }
  }

  async savePodcastAnalysis(podcastData) {
    try {
      // Save content
      const contentId = await this.saveContent({
        id: `podcast_${podcastData.metadata.title?.replace(/\W/g, '_')}`,
        type: 'podcast',
        url: podcastData.url,
        title: podcastData.metadata.title,
        description: podcastData.metadata.description,
        duration: podcastData.metadata.duration,
        creator: podcastData.metadata.creator,
        metadata: podcastData.metadata,
        transcript: podcastData.transcript
      });

      // Save analysis
      await this.saveAnalysis({
        id: `analysis_${contentId}`,
        content_id: contentId,
        type: 'content',
        insights: podcastData.analysis.insights,
        topics: podcastData.analysis.topics,
        summary: podcastData.analysis.summary,
        learning_value: podcastData.analysis.learningValue
      });

      this.stats.podcasts++;

    } catch (error) {
      logger.error('❌ Failed to save podcast analysis:', error);
      throw error;
    }
  }

  // Analysis management
  async saveAnalysis(analysis) {
    try {
      const stmt = await this.db.prepare(`
        INSERT OR REPLACE INTO analyses 
        (id, content_id, session_id, type, insights, topics, summary, learning_value, confidence_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      await stmt.run(
        analysis.id || `analysis_${Date.now()}`,
        analysis.content_id || null,
        analysis.session_id || null,
        analysis.type,
        JSON.stringify(analysis.insights || []),
        JSON.stringify(analysis.topics || []),
        analysis.summary || null,
        analysis.learning_value || null,
        analysis.confidence_score || 0.0
      );

      await stmt.finalize();
      this.stats.insights++;

    } catch (error) {
      logger.error('❌ Failed to save analysis:', error);
      throw error;
    }
  }

  async getAnalysisByContentId(contentId) {
    try {
      return await this.db.get(`
        SELECT * FROM analyses WHERE content_id = ?
      `, contentId);

    } catch (error) {
      logger.error('❌ Failed to get analysis:', error);
      return null;
    }
  }

  // Pattern management
  async savePattern(pattern) {
    try {
      const stmt = await this.db.prepare(`
        INSERT OR REPLACE INTO patterns 
        (id, type, pattern_name, description, frequency, significance, last_seen, metadata)
        VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'), ?)
      `);

      await stmt.run(
        pattern.id || `${pattern.type}_${pattern.pattern_name}`,
        pattern.type,
        pattern.pattern_name,
        pattern.description || null,
        pattern.frequency || 1,
        pattern.significance || 'medium',
        JSON.stringify(pattern.metadata || {})
      );

      await stmt.finalize();
      this.stats.patterns++;

    } catch (error) {
      logger.error('❌ Failed to save pattern:', error);
      throw error;
    }
  }

  async getPatternsByType(type) {
    try {
      return await this.db.all(`
        SELECT * FROM patterns WHERE type = ? ORDER BY frequency DESC
      `, type);

    } catch (error) {
      logger.error('❌ Failed to get patterns:', error);
      return [];
    }
  }

  // Search functionality
  async searchContent(query, options = {}) {
    const limit = options.limit || 20;
    const type = options.type || null;

    try {
      let sql, params;

      if (this.config.enableFTS) {
        // Use full-text search
        sql = `
          SELECT c.*, rank
          FROM content c
          JOIN content_fts fts ON c.id = fts.id
          WHERE content_fts MATCH ?
          ${type ? 'AND c.type = ?' : ''}
          ORDER BY rank
          LIMIT ?
        `;
        params = type ? [query, type, limit] : [query, limit];
      } else {
        // Fallback to LIKE search
        sql = `
          SELECT * FROM content
          WHERE (title LIKE ? OR description LIKE ? OR transcript LIKE ?)
          ${type ? 'AND type = ?' : ''}
          ORDER BY created_at DESC
          LIMIT ?
        `;
        const likeQuery = `%${query}%`;
        params = type ? 
          [likeQuery, likeQuery, likeQuery, type, limit] : 
          [likeQuery, likeQuery, likeQuery, limit];
      }

      return await this.db.all(sql, params);

    } catch (error) {
      logger.error('❌ Search failed:', error);
      return [];
    }
  }

  async searchAnalyses(query, limit = 20) {
    try {
      if (this.config.enableFTS) {
        return await this.db.all(`
          SELECT a.*, rank
          FROM analyses a
          JOIN analyses_fts fts ON a.id = fts.id
          WHERE analyses_fts MATCH ?
          ORDER BY rank
          LIMIT ?
        `, query, limit);
      } else {
        const likeQuery = `%${query}%`;
        return await this.db.all(`
          SELECT * FROM analyses
          WHERE insights LIKE ? OR topics LIKE ? OR summary LIKE ?
          ORDER BY created_at DESC
          LIMIT ?
        `, likeQuery, likeQuery, likeQuery, limit);
      }

    } catch (error) {
      logger.error('❌ Analysis search failed:', error);
      return [];
    }
  }

  // Statistics and reporting
  async updateStatistics() {
    try {
      const [sessions, interactions, content, analyses, patterns] = await Promise.all([
        this.db.get('SELECT COUNT(*) as count FROM sessions'),
        this.db.get('SELECT COUNT(*) as count FROM interactions'),
        this.db.get('SELECT COUNT(*) as count FROM content'),
        this.db.get('SELECT COUNT(*) as count FROM analyses'),
        this.db.get('SELECT COUNT(*) as count FROM patterns')
      ]);

      this.stats = {
        sessions: sessions.count,
        interactions: interactions.count,
        videos: 0, // Will be updated by content type queries
        podcasts: 0,
        webContent: 0,
        insights: analyses.count,
        patterns: patterns.count
      };

      // Get content type breakdowns
      const contentTypes = await this.db.all(`
        SELECT type, COUNT(*) as count FROM content GROUP BY type
      `);

      contentTypes.forEach(({ type, count }) => {
        if (type === 'video') this.stats.videos = count;
        else if (type === 'podcast') this.stats.podcasts = count;
        else if (type === 'webpage') this.stats.webContent = count;
      });

    } catch (error) {
      logger.error('❌ Failed to update statistics:', error);
    }
  }

  async getContentLibrary() {
    try {
      return await this.db.all(`
        SELECT c.*, a.learning_value, a.created_at as analyzed_at
        FROM content c
        LEFT JOIN analyses a ON c.id = a.content_id
        ORDER BY c.created_at DESC
        LIMIT 100
      `);

    } catch (error) {
      logger.error('❌ Failed to get content library:', error);
      return [];
    }
  }

  async getDashboardData() {
    try {
      const [recentSessions, recentContent, topPatterns, learningInsights] = await Promise.all([
        this.getRecentSessions(5),
        this.db.all('SELECT * FROM content ORDER BY created_at DESC LIMIT 10'),
        this.db.all('SELECT * FROM patterns ORDER BY frequency DESC LIMIT 10'),
        this.db.all('SELECT * FROM learning_insights ORDER BY confidence DESC LIMIT 5')
      ]);

      return {
        stats: this.stats,
        recentSessions,
        recentContent,
        topPatterns,
        learningInsights
      };

    } catch (error) {
      logger.error('❌ Failed to get dashboard data:', error);
      return { stats: this.stats };
    }
  }

  // Maintenance
  async vacuum() {
    try {
      await this.db.exec('VACUUM');
      logger.info('🧹 Database vacuumed');
    } catch (error) {
      logger.error('❌ Failed to vacuum database:', error);
    }
  }

  async backup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${this.config.dbPath}.backup.${timestamp}`;
      
      await this.db.backup(backupPath);
      logger.info('💾 Database backup created', { backupPath });
      
      // Clean old backups
      await this.cleanOldBackups();
      
    } catch (error) {
      logger.error('❌ Failed to backup database:', error);
    }
  }

  async cleanOldBackups() {
    try {
      const dir = path.dirname(this.config.dbPath);
      const basename = path.basename(this.config.dbPath);
      const files = await fs.readdir(dir);
      
      const backupFiles = files
        .filter(f => f.startsWith(`${basename}.backup.`))
        .map(f => ({ name: f, path: path.join(dir, f) }))
        .sort((a, b) => b.name.localeCompare(a.name));

      if (backupFiles.length > this.config.maxBackups) {
        const filesToDelete = backupFiles.slice(this.config.maxBackups);
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          logger.debug('🗑️ Old backup deleted', { file: file.name });
        }
      }

    } catch (error) {
      logger.error('❌ Failed to clean old backups:', error);
    }
  }

  scheduleBackups() {
    setInterval(() => {
      this.backup();
    }, this.config.backupInterval);
  }

  // Utility methods
  generateContentId(url) {
    return Buffer.from(url).toString('base64').substring(0, 16);
  }

  async getSessionCount() {
    const result = await this.db.get('SELECT COUNT(*) as count FROM sessions');
    return result.count;
  }

  async getContentCount() {
    const result = await this.db.get('SELECT COUNT(*) as count FROM content');
    return result.count;
  }

  async getInsightsCount() {
    const result = await this.db.get('SELECT COUNT(*) as count FROM analyses');
    return result.count;
  }

  async updateSession(sessionId, updates) {
    try {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      
      await this.db.run(`
        UPDATE sessions SET ${setClause}, updated_at = strftime('%s', 'now')
        WHERE id = ?
      `, ...values, sessionId);

    } catch (error) {
      logger.error('❌ Failed to update session:', error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
    logger.info('📊 Database connection closed');
  }
}

module.exports = ContentDatabaseManager;

// Start standalone if called directly
if (require.main === module) {
  const dbManager = new ContentDatabaseManager();
  
  dbManager.on('ready', async () => {
    console.log('📊 Content Database Manager is ready!');
    
    // Show current statistics
    const stats = await dbManager.updateStatistics();
    console.log('📈 Database Statistics:', dbManager.stats);
  });

  dbManager.initialize().catch(error => {
    console.error('❌ Failed to initialize database manager:', error);
    process.exit(1);
  });
}
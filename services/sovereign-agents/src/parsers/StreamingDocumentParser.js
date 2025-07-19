/**
 * Streaming Document Parser - Memory-efficient processing for large documents
 */

const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class StreamingDocumentParser extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      chunkSize: options.chunkSize || 1024 * 1024, // 1MB chunks
      maxMemoryUsage: options.maxMemoryUsage || 100 * 1024 * 1024, // 100MB max
      enableProgressTracking: options.enableProgressTracking !== false,
      enableContentExtraction: options.enableContentExtraction !== false,
      supportedFormats: options.supportedFormats || [
        'txt', 'md', 'json', 'csv', 'log', 'chat'
      ],
      ...options
    };

    this.activeParses = new Map();
    this.memoryUsage = 0;
    this.totalBytesProcessed = 0;
    this.metrics = {
      documentsProcessed: 0,
      totalBytesProcessed: 0,
      averageProcessingTime: 0,
      errors: 0,
      memoryPeakUsage: 0
    };
  }

  /**
   * Parse document with streaming approach
   */
  async parseDocument(filePath, options = {}) {
    const parseId = uuidv4();
    const startTime = Date.now();
    
    try {
      // Validate file
      const fileInfo = await this.validateFile(filePath);
      
      // Create parse context
      const parseContext = {
        id: parseId,
        filePath,
        fileName: path.basename(filePath),
        fileSize: fileInfo.size,
        format: fileInfo.format,
        startTime,
        bytesProcessed: 0,
        progress: 0,
        status: 'initializing',
        chunks: [],
        extractedData: {
          metadata: {},
          content: null,
          structure: null,
          insights: []
        },
        options: {
          extractMetadata: options.extractMetadata !== false,
          extractStructure: options.extractStructure !== false,
          enableInsights: options.enableInsights !== false,
          ...options
        }
      };

      this.activeParses.set(parseId, parseContext);
      
      console.log(`📄 Starting streaming parse: ${parseContext.fileName} (${this.formatFileSize(fileInfo.size)})`);
      
      this.emit('parse:started', {
        parseId,
        fileName: parseContext.fileName,
        fileSize: fileInfo.size,
        format: fileInfo.format
      });

      // Choose parsing strategy based on format
      const result = await this.executeParsingStrategy(parseContext);
      
      // Finalize parsing
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      parseContext.status = 'completed';
      parseContext.endTime = endTime;
      parseContext.processingTime = processingTime;

      // Update metrics
      this.updateMetrics(parseContext);

      console.log(`✅ Streaming parse completed: ${parseContext.fileName} in ${processingTime}ms`);
      
      this.emit('parse:completed', {
        parseId,
        result,
        processingTime,
        bytesProcessed: parseContext.bytesProcessed
      });

      // Cleanup
      this.activeParses.delete(parseId);

      return {
        parseId,
        fileName: parseContext.fileName,
        fileSize: fileInfo.size,
        format: fileInfo.format,
        processingTime,
        bytesProcessed: parseContext.bytesProcessed,
        result
      };

    } catch (error) {
      console.error(`❌ Streaming parse failed for ${path.basename(filePath)}:`, error);
      
      const parseContext = this.activeParses.get(parseId);
      if (parseContext) {
        parseContext.status = 'failed';
        parseContext.error = error.message;
      }

      this.metrics.errors++;
      this.activeParses.delete(parseId);

      this.emit('parse:failed', {
        parseId,
        fileName: path.basename(filePath),
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Execute appropriate parsing strategy
   */
  async executeParsingStrategy(parseContext) {
    switch (parseContext.format) {
      case 'chat':
      case 'log':
        return this.parseChatLog(parseContext);
      
      case 'json':
        return this.parseJsonDocument(parseContext);
      
      case 'csv':
        return this.parseCsvDocument(parseContext);
      
      case 'md':
      case 'markdown':
        return this.parseMarkdownDocument(parseContext);
      
      case 'txt':
      default:
        return this.parseTextDocument(parseContext);
    }
  }

  /**
   * Parse chat log files (WhatsApp, Slack, Discord, etc.)
   */
  async parseChatLog(parseContext) {
    console.log(`💬 Parsing chat log: ${parseContext.fileName}`);
    
    const result = {
      documentType: 'chat_log',
      metadata: {
        fileName: parseContext.fileName,
        fileSize: parseContext.fileSize,
        estimatedMessages: 0,
        dateRange: { start: null, end: null },
        participants: new Set(),
        platforms: new Set()
      },
      content: {
        messages: [],
        conversations: [],
        topics: [],
        decisions: []
      },
      structure: {
        messagePattern: null,
        timestampFormat: null,
        participantFormat: null
      },
      insights: []
    };

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(parseContext.filePath, {
        encoding: 'utf8',
        highWaterMark: this.options.chunkSize
      });

      let buffer = '';
      let lineNumber = 0;
      let messageCount = 0;
      const messageBuffer = [];

      const processChunk = (chunk) => {
        this.updateMemoryUsage(chunk.length);
        parseContext.bytesProcessed += chunk.length;
        
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          lineNumber++;
          
          if (line.trim()) {
            const message = this.parseChatMessage(line, lineNumber, result.structure);
            
            if (message) {
              messageCount++;
              messageBuffer.push(message);
              
              // Track metadata
              if (message.timestamp) {
                if (!result.metadata.dateRange.start || message.timestamp < result.metadata.dateRange.start) {
                  result.metadata.dateRange.start = message.timestamp;
                }
                if (!result.metadata.dateRange.end || message.timestamp > result.metadata.dateRange.end) {
                  result.metadata.dateRange.end = message.timestamp;
                }
              }
              
              if (message.sender) {
                result.metadata.participants.add(message.sender);
              }

              // Process messages in batches to prevent memory overflow
              if (messageBuffer.length >= 1000) {
                this.processChatMessageBatch(messageBuffer, result);
                messageBuffer.length = 0; // Clear buffer
                this.garbageCollect();
              }
            }
          }

          // Update progress
          if (lineNumber % 10000 === 0) {
            parseContext.progress = Math.min(
              (parseContext.bytesProcessed / parseContext.fileSize) * 100,
              99
            );
            
            this.emit('parse:progress', {
              parseId: parseContext.id,
              progress: parseContext.progress,
              messagesFound: messageCount,
              bytesProcessed: parseContext.bytesProcessed
            });
          }
        }
      };

      stream.on('data', processChunk);

      stream.on('end', () => {
        // Process any remaining buffer
        if (buffer.trim()) {
          const message = this.parseChatMessage(buffer, lineNumber + 1, result.structure);
          if (message) {
            messageCount++;
            messageBuffer.push(message);
          }
        }

        // Process final batch
        if (messageBuffer.length > 0) {
          this.processChatMessageBatch(messageBuffer, result);
        }

        // Finalize metadata
        result.metadata.estimatedMessages = messageCount;
        result.metadata.participants = Array.from(result.metadata.participants);
        
        // Extract insights from chat content
        if (parseContext.options.enableInsights) {
          result.insights = this.extractChatInsights(result);
        }

        parseContext.progress = 100;
        console.log(`💬 Chat log parsed: ${messageCount} messages from ${result.metadata.participants.length} participants`);
        
        resolve(result);
      });

      stream.on('error', (error) => {
        console.error('❌ Chat log parsing error:', error);
        reject(error);
      });
    });
  }

  /**
   * Parse individual chat message
   */
  parseChatMessage(line, lineNumber, structure) {
    // WhatsApp format: [DD/MM/YYYY, HH:MM:SS] Sender: Message
    const whatsappPattern = /^\[(\d{2}\/\d{2}\/\d{4}),?\s+(\d{2}:\d{2}:\d{2})\]\s+([^:]+):\s+(.+)$/;
    
    // Slack export format: {"type":"message","user":"U123","text":"Hello","ts":"1234567890.123456"}
    const slackJsonPattern = /^\{.*"type":"message".*\}$/;
    
    // Discord format: [DD-MMM-YY HH:MM AM/PM] Username: Message
    const discordPattern = /^\[(\d{2}-\w{3}-\d{2}\s+\d{1,2}:\d{2}\s+(?:AM|PM))\]\s+([^:]+):\s+(.+)$/;
    
    // Generic timestamp pattern
    const genericPattern = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*[|\-:]\s*([^:|\-]+)[:|\-]\s*(.+)$/;

    let match;
    let message = null;

    // Try WhatsApp format
    if ((match = line.match(whatsappPattern))) {
      const [, date, time, sender, text] = match;
      const timestamp = this.parseTimestamp(date + ' ' + time, 'whatsapp');
      
      if (!structure.messagePattern) {
        structure.messagePattern = 'whatsapp';
        structure.timestampFormat = 'DD/MM/YYYY, HH:MM:SS';
        structure.participantFormat = 'brackets_colon';
      }

      message = {
        lineNumber,
        timestamp,
        sender: sender.trim(),
        text: text.trim(),
        platform: 'whatsapp',
        raw: line
      };
    }
    // Try Slack JSON format
    else if (slackJsonPattern.test(line)) {
      try {
        const data = JSON.parse(line);
        if (data.type === 'message' && data.text) {
          const timestamp = new Date(parseFloat(data.ts) * 1000);
          
          if (!structure.messagePattern) {
            structure.messagePattern = 'slack_json';
            structure.timestampFormat = 'unix_timestamp';
            structure.participantFormat = 'user_id';
          }

          message = {
            lineNumber,
            timestamp,
            sender: data.user || data.username || 'Unknown',
            text: data.text.trim(),
            platform: 'slack',
            userId: data.user,
            raw: line
          };
        }
      } catch (e) {
        // Not valid JSON, continue
      }
    }
    // Try Discord format
    else if ((match = line.match(discordPattern))) {
      const [, timestampStr, sender, text] = match;
      const timestamp = this.parseTimestamp(timestampStr, 'discord');
      
      if (!structure.messagePattern) {
        structure.messagePattern = 'discord';
        structure.timestampFormat = 'DD-MMM-YY HH:MM AM/PM';
        structure.participantFormat = 'brackets_colon';
      }

      message = {
        lineNumber,
        timestamp,
        sender: sender.trim(),
        text: text.trim(),
        platform: 'discord',
        raw: line
      };
    }
    // Try generic format
    else if ((match = line.match(genericPattern))) {
      const [, timestampStr, sender, text] = match;
      const timestamp = this.parseTimestamp(timestampStr, 'generic');
      
      if (!structure.messagePattern) {
        structure.messagePattern = 'generic';
        structure.timestampFormat = 'auto_detected';
        structure.participantFormat = 'separator_based';
      }

      message = {
        lineNumber,
        timestamp,
        sender: sender.trim(),
        text: text.trim(),
        platform: 'generic',
        raw: line
      };
    }

    return message;
  }

  /**
   * Parse timestamp from various formats
   */
  parseTimestamp(timestampStr, format) {
    try {
      switch (format) {
        case 'whatsapp':
          // DD/MM/YYYY, HH:MM:SS
          const parts = timestampStr.split(', ');
          const dateParts = parts[0].split('/');
          const timeParts = parts[1].split(':');
          return new Date(
            parseInt(dateParts[2]), // year
            parseInt(dateParts[1]) - 1, // month (0-indexed)
            parseInt(dateParts[0]), // day
            parseInt(timeParts[0]), // hour
            parseInt(timeParts[1]), // minute
            parseInt(timeParts[2]) // second
          );
        
        case 'discord':
          // DD-MMM-YY HH:MM AM/PM
          return new Date(timestampStr);
        
        case 'generic':
        default:
          return new Date(timestampStr);
      }
    } catch (error) {
      return new Date(); // Fallback to current time
    }
  }

  /**
   * Process batch of chat messages
   */
  processChatMessageBatch(messages, result) {
    // Group messages into conversations (within 30 minutes of each other)
    let currentConversation = null;
    const conversationGap = 30 * 60 * 1000; // 30 minutes

    for (const message of messages) {
      // Add to content
      result.content.messages.push({
        timestamp: message.timestamp,
        sender: message.sender,
        text: message.text,
        platform: message.platform
      });

      // Group into conversations
      if (!currentConversation || 
          (message.timestamp - currentConversation.endTime) > conversationGap) {
        
        if (currentConversation) {
          result.content.conversations.push(currentConversation);
        }

        currentConversation = {
          id: uuidv4(),
          startTime: message.timestamp,
          endTime: message.timestamp,
          participants: new Set([message.sender]),
          messageCount: 1,
          topics: [],
          summary: null
        };
      } else {
        currentConversation.endTime = message.timestamp;
        currentConversation.participants.add(message.sender);
        currentConversation.messageCount++;
      }
    }

    // Add final conversation
    if (currentConversation) {
      result.content.conversations.push(currentConversation);
    }
  }

  /**
   * Extract insights from chat content
   */
  extractChatInsights(result) {
    const insights = [];

    // Communication patterns
    insights.push({
      type: 'communication_pattern',
      data: {
        totalMessages: result.metadata.estimatedMessages,
        participants: result.metadata.participants.length,
        averageMessagesPerParticipant: Math.round(result.metadata.estimatedMessages / result.metadata.participants.length),
        conversationCount: result.content.conversations.length,
        timeSpan: result.metadata.dateRange.end - result.metadata.dateRange.start
      }
    });

    // Most active participants
    const participantActivity = {};
    for (const message of result.content.messages) {
      participantActivity[message.sender] = (participantActivity[message.sender] || 0) + 1;
    }

    const topParticipants = Object.entries(participantActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, messageCount: count }));

    insights.push({
      type: 'participant_activity',
      data: { topParticipants }
    });

    // Platform distribution
    const platformCounts = {};
    for (const message of result.content.messages) {
      platformCounts[message.platform] = (platformCounts[message.platform] || 0) + 1;
    }

    insights.push({
      type: 'platform_distribution',
      data: platformCounts
    });

    return insights;
  }

  /**
   * Parse JSON document
   */
  async parseJsonDocument(parseContext) {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(parseContext.filePath, {
        encoding: 'utf8',
        highWaterMark: this.options.chunkSize
      });

      let jsonContent = '';

      stream.on('data', (chunk) => {
        this.updateMemoryUsage(chunk.length);
        parseContext.bytesProcessed += chunk.length;
        jsonContent += chunk;

        parseContext.progress = Math.min(
          (parseContext.bytesProcessed / parseContext.fileSize) * 100,
          99
        );

        this.emit('parse:progress', {
          parseId: parseContext.id,
          progress: parseContext.progress,
          bytesProcessed: parseContext.bytesProcessed
        });
      });

      stream.on('end', () => {
        try {
          const data = JSON.parse(jsonContent);
          
          const result = {
            documentType: 'json',
            metadata: {
              fileName: parseContext.fileName,
              fileSize: parseContext.fileSize,
              keys: Object.keys(data).length,
              dataType: Array.isArray(data) ? 'array' : 'object'
            },
            content: data,
            structure: this.analyzeJsonStructure(data),
            insights: parseContext.options.enableInsights ? this.extractJsonInsights(data) : []
          };

          resolve(result);
        } catch (error) {
          reject(new Error(`Invalid JSON: ${error.message}`));
        }
      });

      stream.on('error', reject);
    });
  }

  /**
   * Parse text document
   */
  async parseTextDocument(parseContext) {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(parseContext.filePath, {
        encoding: 'utf8',
        highWaterMark: this.options.chunkSize
      });

      let content = '';
      let lineCount = 0;
      let wordCount = 0;

      stream.on('data', (chunk) => {
        this.updateMemoryUsage(chunk.length);
        parseContext.bytesProcessed += chunk.length;
        content += chunk;

        // Count lines and words in chunk
        lineCount += (chunk.match(/\n/g) || []).length;
        wordCount += chunk.split(/\s+/).filter(word => word.length > 0).length;

        parseContext.progress = Math.min(
          (parseContext.bytesProcessed / parseContext.fileSize) * 100,
          99
        );

        this.emit('parse:progress', {
          parseId: parseContext.id,
          progress: parseContext.progress,
          bytesProcessed: parseContext.bytesProcessed,
          lineCount,
          wordCount
        });
      });

      stream.on('end', () => {
        const result = {
          documentType: 'text',
          metadata: {
            fileName: parseContext.fileName,
            fileSize: parseContext.fileSize,
            lineCount,
            wordCount,
            characterCount: content.length
          },
          content,
          structure: this.analyzeTextStructure(content),
          insights: parseContext.options.enableInsights ? this.extractTextInsights(content) : []
        };

        resolve(result);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Validate file before parsing
   */
  async validateFile(filePath) {
    try {
      const stats = await fs.promises.stat(filePath);
      const extension = path.extname(filePath).toLowerCase().slice(1);
      
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      if (stats.size === 0) {
        throw new Error('File is empty');
      }

      if (stats.size > this.options.maxMemoryUsage * 10) {
        throw new Error(`File too large: ${this.formatFileSize(stats.size)} (max: ${this.formatFileSize(this.options.maxMemoryUsage * 10)})`);
      }

      // Detect format
      let format = extension;
      if (extension === 'txt' && this.detectChatFormat(filePath)) {
        format = 'chat';
      }

      if (!this.options.supportedFormats.includes(format)) {
        throw new Error(`Unsupported format: ${format}`);
      }

      return {
        size: stats.size,
        format,
        extension,
        lastModified: stats.mtime
      };

    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  /**
   * Detect if text file is chat format
   */
  detectChatFormat(filePath) {
    // Simple heuristic: check first few lines for chat patterns
    try {
      const firstChunk = fs.readFileSync(filePath, { encoding: 'utf8', start: 0, end: 1024 });
      const lines = firstChunk.split('\n').slice(0, 10);
      
      let chatLikeLines = 0;
      for (const line of lines) {
        if (line.match(/^\[.*\].*:/) || // [timestamp] user: message
            line.match(/^\d{2}\/\d{2}\/\d{4}.*:/) || // date time user: message
            line.match(/^\{.*"type":"message".*\}/)) { // JSON message format
          chatLikeLines++;
        }
      }

      return chatLikeLines >= 3; // At least 3 chat-like lines
    } catch (error) {
      return false;
    }
  }

  /**
   * Analyze JSON structure
   */
  analyzeJsonStructure(data) {
    const structure = {
      type: Array.isArray(data) ? 'array' : 'object',
      depth: this.calculateJsonDepth(data),
      keys: [],
      patterns: []
    };

    if (Array.isArray(data)) {
      structure.length = data.length;
      if (data.length > 0) {
        structure.itemType = typeof data[0];
        structure.keys = Object.keys(data[0] || {});
      }
    } else {
      structure.keys = Object.keys(data);
    }

    return structure;
  }

  /**
   * Calculate JSON depth
   */
  calculateJsonDepth(obj, depth = 0) {
    if (typeof obj !== 'object' || obj === null) {
      return depth;
    }

    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        maxDepth = Math.max(maxDepth, this.calculateJsonDepth(value, depth + 1));
      }
    }

    return maxDepth;
  }

  /**
   * Analyze text structure
   */
  analyzeTextStructure(content) {
    const lines = content.split('\n');
    const structure = {
      lineCount: lines.length,
      avgLineLength: content.length / lines.length,
      emptyLines: lines.filter(line => line.trim() === '').length,
      indentedLines: lines.filter(line => line.match(/^\s+/)).length,
      hasHeaders: lines.some(line => line.match(/^#{1,6}\s/)),
      hasBullets: lines.some(line => line.match(/^\s*[-*+]\s/)),
      hasNumbers: lines.some(line => line.match(/^\s*\d+\.\s/))
    };

    return structure;
  }

  /**
   * Extract JSON insights
   */
  extractJsonInsights(data) {
    const insights = [];

    if (Array.isArray(data)) {
      insights.push({
        type: 'array_analysis',
        data: {
          length: data.length,
          uniqueTypes: [...new Set(data.map(item => typeof item))],
          hasObjects: data.some(item => typeof item === 'object')
        }
      });
    }

    return insights;
  }

  /**
   * Extract text insights
   */
  extractTextInsights(content) {
    const insights = [];
    const words = content.split(/\s+/).filter(word => word.length > 0);
    
    // Word frequency
    const wordFreq = {};
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.length > 3) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });

    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    insights.push({
      type: 'word_frequency',
      data: { topWords }
    });

    return insights;
  }

  /**
   * Update memory usage tracking
   */
  updateMemoryUsage(bytes) {
    this.memoryUsage += bytes;
    if (this.memoryUsage > this.metrics.memoryPeakUsage) {
      this.metrics.memoryPeakUsage = this.memoryUsage;
    }

    // Trigger garbage collection if memory usage is high
    if (this.memoryUsage > this.options.maxMemoryUsage) {
      this.garbageCollect();
    }
  }

  /**
   * Force garbage collection and memory cleanup
   */
  garbageCollect() {
    if (global.gc) {
      global.gc();
    }
    this.memoryUsage = Math.max(0, this.memoryUsage * 0.7); // Estimated cleanup
  }

  /**
   * Update processing metrics
   */
  updateMetrics(parseContext) {
    this.metrics.documentsProcessed++;
    this.metrics.totalBytesProcessed += parseContext.bytesProcessed;
    
    const avgTime = this.metrics.averageProcessingTime;
    const count = this.metrics.documentsProcessed;
    this.metrics.averageProcessingTime = 
      (avgTime * (count - 1) + parseContext.processingTime) / count;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get parsing metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeParses: this.activeParses.size,
      currentMemoryUsage: this.memoryUsage,
      memoryUsageFormatted: this.formatFileSize(this.memoryUsage)
    };
  }

  /**
   * Get active parsing operations
   */
  getActiveParses() {
    return Array.from(this.activeParses.values()).map(parse => ({
      id: parse.id,
      fileName: parse.fileName,
      fileSize: parse.fileSize,
      format: parse.format,
      progress: parse.progress,
      status: parse.status,
      bytesProcessed: parse.bytesProcessed,
      startTime: parse.startTime
    }));
  }

  /**
   * Cancel active parsing operation
   */
  cancelParse(parseId) {
    const parseContext = this.activeParses.get(parseId);
    if (parseContext) {
      parseContext.status = 'cancelled';
      this.activeParses.delete(parseId);
      
      this.emit('parse:cancelled', { parseId });
      console.log(`🚫 Parse cancelled: ${parseContext.fileName}`);
      
      return true;
    }
    return false;
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      healthy: true,
      activeParses: this.activeParses.size,
      metrics: this.getMetrics(),
      memoryUsage: {
        current: this.memoryUsage,
        peak: this.metrics.memoryPeakUsage,
        limit: this.options.maxMemoryUsage,
        percentage: (this.memoryUsage / this.options.maxMemoryUsage) * 100
      }
    };
  }
}

module.exports = StreamingDocumentParser;
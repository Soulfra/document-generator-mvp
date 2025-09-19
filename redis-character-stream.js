#!/usr/bin/env node

/**
 * 🌊 REDIS CHARACTER STREAM
 * 
 * Streaming data pipeline for character/story generation:
 * Character Controller → Redis Streams → Data Sieve → Databases
 * 
 * Features:
 * - Redis Streams for character events
 * - Partitioned data by permission levels  
 * - Context expansion through streaming
 * - Memory-efficient processing
 */

const redis = require('redis');
const EventEmitter = require('events');

class RedisCharacterStream extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
            streamPrefix: config.streamPrefix || 'character:',
            maxStreamLength: config.maxStreamLength || 1000,
            batchSize: config.batchSize || 10,
            ...config
        };
        
        // Redis clients
        this.publisher = null;
        this.subscriber = null;
        this.streams = null;
        
        // Stream definitions
        this.streamChannels = {
            'character:story': {
                description: 'Story generation events',
                fields: ['character_id', 'story_type', 'content', 'metadata'],
                partitions: ['public', 'internal', 'private']
            },
            'character:development': {
                description: 'Character development and learning',
                fields: ['character_id', 'skill', 'level', 'experience'],
                partitions: ['public', 'internal']
            },
            'character:interaction': {
                description: 'User-character interactions',
                fields: ['user_id', 'character_id', 'interaction_type', 'data'],
                partitions: ['public', 'analytics', 'private']
            },
            'character:easter_eggs': {
                description: 'Easter egg placement and navigation',
                fields: ['egg_id', 'type', 'location', 'data'],
                partitions: ['public', 'internal']
            }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🌊 Initializing Redis Character Stream...');
        
        try {
            // Create Redis connections
            await this.connectRedis();
            
            // Initialize stream channels
            await this.initializeStreams();
            
            // Set up stream consumers
            this.setupStreamConsumers();
            
            console.log('✅ Redis Character Stream ready!');
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Redis streams:', error);
            throw error;
        }
    }
    
    async connectRedis() {
        // Publisher for sending events
        this.publisher = redis.createClient({ url: this.config.redisUrl });
        await this.publisher.connect();
        
        // Subscriber for receiving events
        this.subscriber = redis.createClient({ url: this.config.redisUrl });
        await this.subscriber.connect();
        
        // Streams client for managing streams
        this.streams = redis.createClient({ url: this.config.redisUrl });
        await this.streams.connect();
        
        console.log('📡 Connected to Redis');
    }
    
    async initializeStreams() {
        for (const [streamName, config] of Object.entries(this.streamChannels)) {
            try {
                // Create stream if it doesn't exist
                await this.streams.xAdd(streamName, '*', { initialized: Date.now() });
                
                // Set max length to prevent memory bloat
                await this.streams.xTrim(streamName, 'MAXLEN', '~', this.config.maxStreamLength);
                
                console.log(`📊 Stream initialized: ${streamName}`);
            } catch (error) {
                console.error(`❌ Failed to initialize stream ${streamName}:`, error);
            }
        }
    }
    
    /**
     * Stream character story event
     */
    async streamStoryEvent(characterId, storyData, partition = 'public') {
        const streamName = 'character:story';
        
        try {
            // Filter data based on partition
            const filteredData = this.filterDataByPartition(storyData, partition);
            
            const eventData = {
                character_id: characterId,
                story_type: storyData.type,
                content: JSON.stringify(filteredData),
                metadata: JSON.stringify(storyData.metadata),
                partition: partition,
                timestamp: Date.now()
            };
            
            const messageId = await this.publisher.xAdd(streamName, '*', eventData);
            
            console.log(`📝 Story event streamed: ${messageId} (partition: ${partition})`);
            this.emit('story_streamed', { messageId, characterId, partition });
            
            return messageId;
            
        } catch (error) {
            console.error('❌ Failed to stream story event:', error);
            throw error;
        }
    }
    
    /**
     * Stream character development event
     */
    async streamDevelopmentEvent(characterId, developmentData, partition = 'internal') {
        const streamName = 'character:development';
        
        try {
            const eventData = {
                character_id: characterId,
                skill: developmentData.skill,
                level: developmentData.level.toString(),
                experience: developmentData.experience.toString(),
                partition: partition,
                timestamp: Date.now()
            };
            
            const messageId = await this.publisher.xAdd(streamName, '*', eventData);
            
            console.log(`📈 Development event streamed: ${messageId}`);
            this.emit('development_streamed', { messageId, characterId });
            
            return messageId;
            
        } catch (error) {
            console.error('❌ Failed to stream development event:', error);
            throw error;
        }
    }
    
    /**
     * Stream easter egg placement
     */
    async streamEasterEgg(eggData, partition = 'public') {
        const streamName = 'character:easter_eggs';
        
        try {
            const eventData = {
                egg_id: eggData.id,
                type: eggData.type,
                location: eggData.location,
                data: JSON.stringify(this.filterDataByPartition(eggData.data, partition)),
                partition: partition,
                timestamp: Date.now()
            };
            
            const messageId = await this.publisher.xAdd(streamName, '*', eventData);
            
            console.log(`🍳 Easter egg streamed: ${messageId}`);
            this.emit('easter_egg_streamed', { messageId, eggData });
            
            return messageId;
            
        } catch (error) {
            console.error('❌ Failed to stream easter egg:', error);
            throw error;
        }
    }
    
    /**
     * Set up stream consumers for different services
     */
    setupStreamConsumers() {
        // Character story consumer
        this.consumeStream('character:story', 'story-processor', (messages) => {
            this.processStoryMessages(messages);
        });
        
        // Character development consumer  
        this.consumeStream('character:development', 'dev-processor', (messages) => {
            this.processDevelopmentMessages(messages);
        });
        
        // Easter egg consumer
        this.consumeStream('character:easter_eggs', 'egg-processor', (messages) => {
            this.processEasterEggMessages(messages);
        });
    }
    
    async consumeStream(streamName, consumerGroup, processor) {
        try {
            // Create consumer group if it doesn't exist
            try {
                await this.streams.xGroupCreate(streamName, consumerGroup, '0', { MKSTREAM: true });
            } catch (error) {
                // Group already exists
                if (!error.message.includes('BUSYGROUP')) {
                    throw error;
                }
            }
            
            // Start consuming
            this.startStreamConsumer(streamName, consumerGroup, processor);
            
        } catch (error) {
            console.error(`❌ Failed to setup consumer for ${streamName}:`, error);
        }
    }
    
    async startStreamConsumer(streamName, consumerGroup, processor) {
        const consumerName = `consumer-${Date.now()}`;
        
        while (true) {
            try {
                // Read from stream
                const messages = await this.streams.xReadGroup(
                    consumerGroup,
                    consumerName,
                    [{ key: streamName, id: '>' }],
                    { COUNT: this.config.batchSize, BLOCK: 5000 }
                );
                
                if (messages && messages.length > 0) {
                    for (const streamData of messages) {
                        const streamMessages = streamData.messages;
                        if (streamMessages.length > 0) {
                            await processor(streamMessages);
                            
                            // Acknowledge processed messages
                            for (const message of streamMessages) {
                                await this.streams.xAck(streamName, consumerGroup, message.id);
                            }
                        }
                    }
                }
                
            } catch (error) {
                console.error(`❌ Stream consumer error for ${streamName}:`, error);
                await this.sleep(5000); // Wait before retry
            }
        }
    }
    
    /**
     * Process story messages from stream
     */
    async processStoryMessages(messages) {
        for (const message of messages) {
            const data = message.message;
            
            // Route to appropriate database based on partition
            switch (data.partition) {
                case 'public':
                    await this.routeToPublicDB(data);
                    break;
                case 'internal':
                    await this.routeToInternalDB(data);
                    break;
                case 'private':
                    await this.routeToPrivateDB(data);
                    break;
            }
            
            this.emit('story_processed', { messageId: message.id, data });
        }
    }
    
    /**
     * Filter data based on partition level
     */
    filterDataByPartition(data, partition) {
        switch (partition) {
            case 'public':
                // Only public information
                return {
                    title: data.title,
                    theme: data.theme,
                    wordCount: data.wordCount,
                    publishedAt: data.publishedAt
                };
                
            case 'internal':
                // Internal + public information
                return {
                    ...this.filterDataByPartition(data, 'public'),
                    generationMethod: data.generationMethod,
                    aiModel: data.aiModel,
                    processingTime: data.processingTime
                };
                
            case 'private':
                // Full data
                return data;
                
            default:
                return this.filterDataByPartition(data, 'public');
        }
    }
    
    /**
     * Route data to different databases based on partition
     */
    async routeToPublicDB(data) {
        // Route to public-facing database (e.g., user stories)
        console.log(`📊 Routing to public DB: ${data.character_id}`);
    }
    
    async routeToInternalDB(data) {
        // Route to internal analytics database
        console.log(`📈 Routing to internal DB: ${data.character_id}`);
    }
    
    async routeToPrivateDB(data) {
        // Route to private/admin database
        console.log(`🔒 Routing to private DB: ${data.character_id}`);
    }
    
    /**
     * Get stream statistics
     */
    async getStreamStats() {
        const stats = {};
        
        for (const streamName of Object.keys(this.streamChannels)) {
            try {
                const info = await this.streams.xInfoStream(streamName);
                stats[streamName] = {
                    length: info.length,
                    groups: info.groups,
                    lastGeneratedId: info.lastGeneratedId
                };
            } catch (error) {
                stats[streamName] = { error: error.message };
            }
        }
        
        return stats;
    }
    
    async processDevelopmentMessages(messages) {
        for (const message of messages) {
            console.log(`📈 Processing development: ${message.id}`);
            this.emit('development_processed', message);
        }
    }
    
    async processEasterEggMessages(messages) {
        for (const message of messages) {
            console.log(`🍳 Processing easter egg: ${message.id}`);
            this.emit('easter_egg_processed', message);
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async cleanup() {
        if (this.publisher) await this.publisher.quit();
        if (this.subscriber) await this.subscriber.quit();
        if (this.streams) await this.streams.quit();
    }
}

module.exports = RedisCharacterStream;

// Demo usage
if (require.main === module) {
    const stream = new RedisCharacterStream();
    
    stream.on('ready', async () => {
        console.log('🌊 Testing Redis Character Stream...');
        
        // Test story streaming
        await stream.streamStoryEvent('ralph', {
            type: 'skill_levelup',
            title: 'The Database Mastery',
            theme: 'learning',
            wordCount: 500,
            metadata: { skill: 'database_operations' }
        }, 'public');
        
        // Test development streaming
        await stream.streamDevelopmentEvent('alice', {
            skill: 'pattern_recognition',
            level: 15,
            experience: 1500
        });
        
        // Show stream stats
        setTimeout(async () => {
            const stats = await stream.getStreamStats();
            console.log('📊 Stream Stats:', JSON.stringify(stats, null, 2));
        }, 2000);
    });
}
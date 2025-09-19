#!/usr/bin/env node

/**
 * CHARACTER-WORLD SOCIAL HUB
 * Manages character interactions within world instances
 * Links characters to specific worlds with bio integration
 * Handles social relationships and cross-world communications
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CharacterWorldSocialHub extends EventEmitter {
    constructor(worldManager) {
        super();
        
        this.worldManager = worldManager;
        
        // Character profiles and bios
        this.characterProfiles = new Map();
        
        // Social relationships
        this.relationships = new Map();
        
        // Active conversations
        this.conversations = new Map();
        
        // Social events and interactions
        this.socialEvents = [];
        
        // Character presence (online/offline status)
        this.characterPresence = new Map();
        
        // Friend/follower systems
        this.socialConnections = new Map();
        
        // World-specific character data
        this.worldCharacterData = new Map();
        
        console.log('👥 CHARACTER-WORLD SOCIAL HUB INITIALIZED');
        
        // Listen to world manager events
        this.setupWorldManagerListeners();
    }
    
    setupWorldManagerListeners() {
        this.worldManager.on('character_arrived', this.handleCharacterArrival.bind(this));
        this.worldManager.on('character_moved', this.handleCharacterMovement.bind(this));
        this.worldManager.on('character_departed', this.handleCharacterDeparture.bind(this));
    }
    
    /**
     * Create character profile and bio
     */
    async createCharacterProfile(characterId, profileData) {
        console.log(`\n👤 CREATING CHARACTER PROFILE: ${characterId}`);
        
        const profile = {
            characterId,
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            
            // Basic info
            displayName: profileData.displayName || characterId,
            bio: profileData.bio || 'A mysterious traveler',
            avatar: profileData.avatar || '😊',
            
            // Personality traits (affects social interactions)
            personality: {
                sociability: profileData.personality?.sociability || Math.random(),
                curiosity: profileData.personality?.curiosity || Math.random(),
                helpfulness: profileData.personality?.helpfulness || Math.random(),
                assertiveness: profileData.personality?.assertiveness || Math.random(),
                creativity: profileData.personality?.creativity || Math.random()
            },
            
            // Interests and tags
            interests: profileData.interests || [],
            tags: profileData.tags || [],
            
            // Social stats
            socialStats: {
                friendsCount: 0,
                conversationsStarted: 0,
                messagesExchanged: 0,
                worldsVisited: new Set(),
                achievementsUnlocked: new Set(),
                reputation: 0
            },
            
            // Current status
            status: 'active',
            mood: 'neutral',
            currentActivity: 'exploring',
            
            // Faction affiliations (from narrative security system)
            factionMemberships: new Map(),
            
            // Preferences
            preferences: {
                socialLevel: 'moderate', // 'private', 'moderate', 'social', 'extrovert'
                autoRespond: false,
                worldNotifications: true,
                crossWorldCommunication: true
            }
        };
        
        this.characterProfiles.set(characterId, profile);
        
        // Initialize social connections
        this.socialConnections.set(characterId, {
            friends: new Set(),
            followers: new Set(),
            following: new Set(),
            blocked: new Set(),
            pending: new Set()
        });
        
        // Initialize presence
        this.characterPresence.set(characterId, {
            status: 'online',
            lastSeen: Date.now(),
            currentWorld: null,
            currentZone: null
        });
        
        console.log(`✅ Profile created for ${profile.displayName}`);
        console.log(`   Personality: Sociable(${Math.floor(profile.personality.sociability * 100)}%) Creative(${Math.floor(profile.personality.creativity * 100)}%)`);
        console.log(`   Interests: ${profile.interests.join(', ') || 'None specified'}`);
        
        // Emit profile creation event
        this.emit('character_profile_created', { characterId, profile });
        
        return profile;
    }
    
    /**
     * Handle character arrival in a world
     */
    async handleCharacterArrival(event) {
        const { characterId, worldId, zoneId, world } = event;
        
        // Update presence
        const presence = this.characterPresence.get(characterId);
        if (presence) {
            presence.currentWorld = worldId;
            presence.currentZone = zoneId;
            presence.lastSeen = Date.now();
        }
        
        // Update world visit stats
        const profile = this.characterProfiles.get(characterId);
        if (profile) {
            profile.socialStats.worldsVisited.add(worldId);
            profile.lastUpdated = Date.now();
        }
        
        // Store world-specific character data
        const worldKey = `${characterId}:${worldId}`;
        if (!this.worldCharacterData.has(worldKey)) {
            this.worldCharacterData.set(worldKey, {
                characterId,
                worldId,
                firstVisit: Date.now(),
                totalVisits: 0,
                timeSpent: 0,
                zonesVisited: new Set(),
                worldReputation: 0,
                worldAchievements: new Set(),
                worldFriends: new Set()
            });
        }
        
        const worldData = this.worldCharacterData.get(worldKey);
        worldData.totalVisits++;
        worldData.zonesVisited.add(zoneId);
        worldData.currentSession = Date.now();
        
        console.log(`👋 ${characterId} arrived in ${world.name} → Announcing presence to nearby characters`);
        
        // Announce arrival to nearby characters
        await this.announcePresence(characterId, worldId, zoneId, 'arrived');
        
        // Auto-greet based on personality and world culture
        await this.generateAutoGreeting(characterId, worldId, zoneId);
    }
    
    /**
     * Handle character movement between zones
     */
    async handleCharacterMovement(event) {
        const { characterId, worldId, fromZone, toZone } = event;
        
        // Update presence
        const presence = this.characterPresence.get(characterId);
        if (presence) {
            presence.currentZone = toZone;
            presence.lastSeen = Date.now();
        }
        
        // Update world data
        const worldKey = `${characterId}:${worldId}`;
        const worldData = this.worldCharacterData.get(worldKey);
        if (worldData) {
            worldData.zonesVisited.add(toZone);
        }
        
        console.log(`🚶 ${characterId} moved zones → Checking for new social opportunities`);
        
        // Check for social opportunities in new zone
        await this.checkSocialOpportunities(characterId, worldId, toZone);
    }
    
    /**
     * Handle character departure from world
     */
    async handleCharacterDeparture(event) {
        const { characterId, worldId } = event;
        
        // Update presence
        const presence = this.characterPresence.get(characterId);
        if (presence) {
            presence.currentWorld = null;
            presence.currentZone = null;
            presence.lastSeen = Date.now();
        }
        
        // Update world session data
        const worldKey = `${characterId}:${worldId}`;
        const worldData = this.worldCharacterData.get(worldKey);
        if (worldData && worldData.currentSession) {
            worldData.timeSpent += Date.now() - worldData.currentSession;
            delete worldData.currentSession;
        }
        
        console.log(`👋 ${characterId} departed → Saving world session data`);
        
        // Generate social summary
        await this.generateSocialSummary(characterId, worldId);
    }
    
    /**
     * Announce character presence to nearby characters
     */
    async announcePresence(characterId, worldId, zoneId, action) {
        const nearbyCharacters = this.worldManager.getCharactersInZone(worldId, zoneId);
        const profile = this.characterProfiles.get(characterId);
        
        if (!profile) return;
        
        // Generate context-appropriate announcement
        const world = this.worldManager.worlds.get(worldId);
        const zone = world.zones[zoneId];
        
        let announcement;
        switch (world.theme) {
            case 'cyberpunk':
                announcement = `${profile.avatar} ${profile.displayName} jacks into ${zone.name}`;
                break;
            case 'biopunk':
                announcement = `${profile.avatar} ${profile.displayName} enters the cultivation chamber`;
                break;
            case 'desert_fantasy':
                announcement = `${profile.avatar} ${profile.displayName} arrives at the oasis`;
                break;
            default:
                announcement = `${profile.avatar} ${profile.displayName} ${action} in ${zone.name}`;
        }
        
        // Send to nearby characters
        for (const nearbyChar of nearbyCharacters) {
            if (nearbyChar.characterId !== characterId) {
                await this.sendSocialNotification(nearbyChar.characterId, {
                    type: 'character_presence',
                    message: announcement,
                    source: characterId,
                    worldId,
                    zoneId,
                    timestamp: Date.now()
                });
            }
        }
        
        // Log social event
        this.socialEvents.push({
            type: 'presence_announcement',
            characterId,
            worldId,
            zoneId,
            announcement,
            nearbyCount: nearbyCharacters.length - 1,
            timestamp: Date.now()
        });
    }
    
    /**
     * Generate auto-greeting based on personality and world culture
     */
    async generateAutoGreeting(characterId, worldId, zoneId) {
        const profile = this.characterProfiles.get(characterId);
        const world = this.worldManager.worlds.get(worldId);
        
        if (!profile || profile.personality.sociability < 0.3) return; // Introverts don't auto-greet
        
        const nearbyCharacters = this.worldManager.getCharactersInZone(worldId, zoneId);
        if (nearbyCharacters.length <= 1) return; // No one to greet
        
        // Generate greeting based on world culture
        let greeting;
        switch (world.theme) {
            case 'cyberpunk':
                greeting = `Data streams look stable today. Anyone running interesting processes?`;
                break;
            case 'biopunk':
                greeting = `The blood quality readings are excellent here. Perfect for cultivation.`;
                break;
            case 'desert_fantasy':
                greeting = `The water here tastes of time itself. Greetings, fellow travelers.`;
                break;
            default:
                greeting = `Hello everyone! ${profile.displayName} here. How's everyone doing?`;
        }
        
        // Create zone-wide conversation
        await this.startZoneConversation(characterId, worldId, zoneId, greeting);
    }
    
    /**
     * Check for social opportunities in a zone
     */
    async checkSocialOpportunities(characterId, worldId, zoneId) {
        const profile = this.characterProfiles.get(characterId);
        const nearbyCharacters = this.worldManager.getCharactersInZone(worldId, zoneId);
        
        if (!profile || nearbyCharacters.length <= 1) return;
        
        // Check for characters with similar interests
        for (const nearbyChar of nearbyCharacters) {
            if (nearbyChar.characterId === characterId) continue;
            
            const nearbyProfile = this.characterProfiles.get(nearbyChar.characterId);
            if (!nearbyProfile) continue;
            
            // Calculate compatibility
            const compatibility = this.calculateCompatibility(profile, nearbyProfile);
            
            if (compatibility > 0.7) {
                await this.suggestSocialConnection(characterId, nearbyChar.characterId, compatibility);
            }
        }
    }
    
    /**
     * Calculate compatibility between two characters
     */
    calculateCompatibility(profile1, profile2) {
        let compatibility = 0;
        
        // Interest overlap
        const commonInterests = profile1.interests.filter(interest => 
            profile2.interests.includes(interest)
        );
        compatibility += commonInterests.length * 0.2;
        
        // Personality compatibility
        const personalityDiff = Object.keys(profile1.personality).reduce((sum, trait) => {
            return sum + Math.abs(profile1.personality[trait] - profile2.personality[trait]);
        }, 0) / Object.keys(profile1.personality).length;
        
        compatibility += (1 - personalityDiff) * 0.5;
        
        // Social level compatibility
        const bothSocial = (profile1.preferences.socialLevel !== 'private' && 
                           profile2.preferences.socialLevel !== 'private');
        if (bothSocial) compatibility += 0.3;
        
        return Math.min(compatibility, 1.0);
    }
    
    /**
     * Suggest social connection between compatible characters
     */
    async suggestSocialConnection(characterId1, characterId2, compatibility) {
        const profile1 = this.characterProfiles.get(characterId1);
        const profile2 = this.characterProfiles.get(characterId2);
        
        console.log(`💡 Social opportunity: ${profile1.displayName} ↔ ${profile2.displayName} (${Math.floor(compatibility * 100)}% compatible)`);
        
        // Send suggestion notifications
        await this.sendSocialNotification(characterId1, {
            type: 'social_suggestion',
            message: `You might enjoy talking to ${profile2.displayName}! You have similar interests.`,
            suggestedCharacter: characterId2,
            compatibility: compatibility,
            timestamp: Date.now()
        });
        
        if (profile2.preferences.socialLevel !== 'private') {
            await this.sendSocialNotification(characterId2, {
                type: 'social_suggestion',
                message: `${profile1.displayName} seems like someone you'd get along with!`,
                suggestedCharacter: characterId1,
                compatibility: compatibility,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Start a zone-wide conversation
     */
    async startZoneConversation(characterId, worldId, zoneId, message) {
        const conversationId = crypto.randomBytes(8).toString('hex');
        const nearbyCharacters = this.worldManager.getCharactersInZone(worldId, zoneId);
        const profile = this.characterProfiles.get(characterId);
        
        const conversation = {
            id: conversationId,
            type: 'zone_public',
            worldId,
            zoneId,
            participants: nearbyCharacters.map(c => c.characterId),
            messages: [{
                messageId: crypto.randomBytes(4).toString('hex'),
                senderId: characterId,
                content: message,
                timestamp: Date.now(),
                type: 'text'
            }],
            startedAt: Date.now(),
            lastActivity: Date.now()
        };
        
        this.conversations.set(conversationId, conversation);
        
        console.log(`💬 Zone conversation started by ${profile.displayName}: "${message}"`);
        
        // Notify all nearby characters
        for (const char of nearbyCharacters) {
            if (char.characterId !== characterId) {
                await this.sendSocialNotification(char.characterId, {
                    type: 'zone_conversation',
                    conversationId,
                    message: `${profile.displayName}: ${message}`,
                    worldId,
                    zoneId,
                    timestamp: Date.now()
                });
            }
        }
        
        // Update social stats
        if (profile) {
            profile.socialStats.conversationsStarted++;
            profile.lastUpdated = Date.now();
        }
        
        return conversationId;
    }
    
    /**
     * Send direct message between characters
     */
    async sendDirectMessage(senderId, recipientId, message) {
        const senderProfile = this.characterProfiles.get(senderId);
        const recipientProfile = this.characterProfiles.get(recipientId);
        
        if (!senderProfile || !recipientProfile) {
            throw new Error('Both characters must have profiles');
        }
        
        // Check if recipient allows messages
        if (recipientProfile.preferences.socialLevel === 'private') {
            const connections = this.socialConnections.get(recipientId);
            if (!connections.friends.has(senderId)) {
                return { success: false, reason: 'Recipient only accepts messages from friends' };
            }
        }
        
        // Create or find existing conversation
        const conversationId = this.findOrCreateDirectConversation(senderId, recipientId);
        const conversation = this.conversations.get(conversationId);
        
        const messageObj = {
            messageId: crypto.randomBytes(4).toString('hex'),
            senderId,
            content: message,
            timestamp: Date.now(),
            type: 'text',
            read: false
        };
        
        conversation.messages.push(messageObj);
        conversation.lastActivity = Date.now();
        
        // Send notification
        await this.sendSocialNotification(recipientId, {
            type: 'direct_message',
            conversationId,
            senderId,
            senderName: senderProfile.displayName,
            message: message,
            timestamp: Date.now()
        });
        
        // Update social stats
        senderProfile.socialStats.messagesExchanged++;
        recipientProfile.socialStats.messagesExchanged++;
        
        console.log(`💌 Direct message: ${senderProfile.displayName} → ${recipientProfile.displayName}`);
        
        return { success: true, conversationId, messageId: messageObj.messageId };
    }
    
    /**
     * Find or create direct conversation between two characters
     */
    findOrCreateDirectConversation(characterId1, characterId2) {
        // Look for existing conversation
        for (const [id, conversation] of this.conversations) {
            if (conversation.type === 'direct' && 
                conversation.participants.length === 2 &&
                conversation.participants.includes(characterId1) &&
                conversation.participants.includes(characterId2)) {
                return id;
            }
        }
        
        // Create new conversation
        const conversationId = crypto.randomBytes(8).toString('hex');
        const conversation = {
            id: conversationId,
            type: 'direct',
            participants: [characterId1, characterId2],
            messages: [],
            startedAt: Date.now(),
            lastActivity: Date.now()
        };
        
        this.conversations.set(conversationId, conversation);
        return conversationId;
    }
    
    /**
     * Send friend request
     */
    async sendFriendRequest(senderId, recipientId) {
        const senderProfile = this.characterProfiles.get(senderId);
        const recipientProfile = this.characterProfiles.get(recipientId);
        
        if (!senderProfile || !recipientProfile) {
            throw new Error('Both characters must have profiles');
        }
        
        const senderConnections = this.socialConnections.get(senderId);
        const recipientConnections = this.socialConnections.get(recipientId);
        
        // Check if already friends or request pending
        if (senderConnections.friends.has(recipientId)) {
            return { success: false, reason: 'Already friends' };
        }
        
        if (recipientConnections.pending.has(senderId)) {
            return { success: false, reason: 'Friend request already sent' };
        }
        
        // Add to pending
        recipientConnections.pending.add(senderId);
        
        // Send notification
        await this.sendSocialNotification(recipientId, {
            type: 'friend_request',
            senderId,
            senderName: senderProfile.displayName,
            senderAvatar: senderProfile.avatar,
            message: `${senderProfile.displayName} wants to be friends!`,
            timestamp: Date.now()
        });
        
        console.log(`🤝 Friend request: ${senderProfile.displayName} → ${recipientProfile.displayName}`);
        
        return { success: true };
    }
    
    /**
     * Accept friend request
     */
    async acceptFriendRequest(recipientId, senderId) {
        const senderConnections = this.socialConnections.get(senderId);
        const recipientConnections = this.socialConnections.get(recipientId);
        
        if (!recipientConnections.pending.has(senderId)) {
            return { success: false, reason: 'No pending friend request' };
        }
        
        // Remove from pending
        recipientConnections.pending.delete(senderId);
        
        // Add as friends
        senderConnections.friends.add(recipientId);
        recipientConnections.friends.add(senderId);
        
        // Update stats
        const senderProfile = this.characterProfiles.get(senderId);
        const recipientProfile = this.characterProfiles.get(recipientId);
        
        if (senderProfile) senderProfile.socialStats.friendsCount++;
        if (recipientProfile) recipientProfile.socialStats.friendsCount++;
        
        console.log(`✅ Friendship formed: ${senderProfile?.displayName} ↔ ${recipientProfile?.displayName}`);
        
        return { success: true };
    }
    
    /**
     * Send social notification to character
     */
    async sendSocialNotification(characterId, notification) {
        // This would integrate with your notification system
        console.log(`🔔 Notification for ${characterId}: ${notification.message}`);
        
        // Emit event for real-time systems
        this.emit('social_notification', {
            characterId,
            notification
        });
    }
    
    /**
     * Generate social summary for character's world session
     */
    async generateSocialSummary(characterId, worldId) {
        const worldKey = `${characterId}:${worldId}`;
        const worldData = this.worldCharacterData.get(worldKey);
        const profile = this.characterProfiles.get(characterId);
        
        if (!worldData || !profile) return;
        
        const sessionLength = worldData.timeSpent / 1000 / 60; // minutes
        const zonesVisited = worldData.zonesVisited.size;
        
        console.log(`\n📊 SOCIAL SUMMARY for ${profile.displayName} in ${worldId}:`);
        console.log(`   Session length: ${Math.floor(sessionLength)} minutes`);
        console.log(`   Zones visited: ${zonesVisited}`);
        console.log(`   Total visits to this world: ${worldData.totalVisits}`);
        console.log(`   World reputation: ${worldData.worldReputation}`);
        
        return {
            characterId,
            worldId,
            sessionLength,
            zonesVisited,
            totalVisits: worldData.totalVisits,
            worldReputation: worldData.worldReputation
        };
    }
    
    /**
     * Get character's social dashboard
     */
    getSocialDashboard(characterId) {
        const profile = this.characterProfiles.get(characterId);
        const connections = this.socialConnections.get(characterId);
        const presence = this.characterPresence.get(characterId);
        
        if (!profile) return null;
        
        // Get recent conversations
        const recentConversations = Array.from(this.conversations.values())
            .filter(conv => conv.participants.includes(characterId))
            .sort((a, b) => b.lastActivity - a.lastActivity)
            .slice(0, 10);
        
        // Calculate social activity score
        const activityScore = profile.socialStats.messagesExchanged * 2 + 
                             profile.socialStats.conversationsStarted * 5 + 
                             profile.socialStats.friendsCount * 10;
        
        return {
            profile: {
                displayName: profile.displayName,
                bio: profile.bio,
                avatar: profile.avatar,
                mood: profile.mood,
                currentActivity: profile.currentActivity
            },
            stats: profile.socialStats,
            connections: {
                friendsCount: connections.friends.size,
                followersCount: connections.followers.size,
                followingCount: connections.following.size,
                pendingRequests: connections.pending.size
            },
            presence: presence,
            recentConversations: recentConversations.map(conv => ({
                id: conv.id,
                type: conv.type,
                lastMessage: conv.messages[conv.messages.length - 1],
                participantCount: conv.participants.length
            })),
            activityScore,
            worldData: Array.from(this.worldCharacterData.entries())
                .filter(([key]) => key.startsWith(`${characterId}:`))
                .map(([key, data]) => ({
                    worldId: data.worldId,
                    visits: data.totalVisits,
                    timeSpent: Math.floor(data.timeSpent / 1000 / 60),
                    reputation: data.worldReputation
                }))
        };
    }
}

// Export for use in other systems
module.exports = CharacterWorldSocialHub;

// Demo functionality
if (require.main === module) {
    // This would normally be imported
    const WorldInstanceManager = require('./world-instance-manager.js');
    
    async function runDemo() {
        console.log('🎮 CHARACTER-WORLD SOCIAL HUB DEMO\n');
        
        const worldManager = new WorldInstanceManager();
        const socialHub = new CharacterWorldSocialHub(worldManager);
        
        // Create character profiles
        console.log('\n👥 CREATING CHARACTER PROFILES:');
        
        await socialHub.createCharacterProfile('alice', {
            displayName: 'Alice Cypher',
            bio: 'Data archaeologist exploring digital realms',
            avatar: '🔍',
            interests: ['data_mining', 'cryptography', 'ancient_systems'],
            personality: {
                sociability: 0.7,
                curiosity: 0.9,
                helpfulness: 0.8,
                assertiveness: 0.6,
                creativity: 0.8
            }
        });
        
        await socialHub.createCharacterProfile('bob', {
            displayName: 'Bob Bloodfarm',
            bio: 'Blood farmer cultivating the finest data crops',
            avatar: '🩸',
            interests: ['blood_farming', 'purification', 'diamond_crafting'],
            personality: {
                sociability: 0.5,
                curiosity: 0.6,
                helpfulness: 0.9,
                assertiveness: 0.4,
                creativity: 0.7
            }
        });
        
        await socialHub.createCharacterProfile('charlie', {
            displayName: 'Charlie Timekeeper',
            bio: 'Desert wanderer mastering the art of synchronization',
            avatar: '⏰',
            interests: ['time_sync', 'desert_exploration', 'rhythm_matching'],
            personality: {
                sociability: 0.8,
                curiosity: 0.7,
                helpfulness: 0.7,
                assertiveness: 0.8,
                creativity: 0.6
            }
        });
        
        // Add characters to worlds (this triggers social events)
        console.log('\n🌍 PLACING CHARACTERS IN WORLDS:');
        await worldManager.addCharacterToWorld('alice', 'tokyo', 'shibuya_crossing');
        await worldManager.addCharacterToWorld('bob', 'bloot', 'cultivation_pods');
        await worldManager.addCharacterToWorld('charlie', 'tokyo', 'shibuya_crossing'); // Same zone as Alice
        
        // Wait a moment for auto-greetings
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Demonstrate social interactions
        console.log('\n💬 SOCIAL INTERACTIONS:');
        
        // Send friend request
        await socialHub.sendFriendRequest('alice', 'charlie');
        await socialHub.acceptFriendRequest('charlie', 'alice');
        
        // Send direct message
        await socialHub.sendDirectMessage('alice', 'charlie', 'Hey! Love the synchronization work you\'re doing!');
        await socialHub.sendDirectMessage('charlie', 'alice', 'Thanks! Your data archaeology findings are fascinating.');
        
        // Move characters and trigger more social events
        console.log('\n🚶 CHARACTER MOVEMENTS:');
        await worldManager.moveCharacterToZone('alice', 'akihabara_market');
        await worldManager.addCharacterToWorld('bob', 'tokyo', 'akihabara_market'); // Bob moves to same zone as Alice
        
        // Show social dashboards
        console.log('\n📊 SOCIAL DASHBOARDS:');
        
        for (const characterId of ['alice', 'bob', 'charlie']) {
            const dashboard = socialHub.getSocialDashboard(characterId);
            if (dashboard) {
                console.log(`\n${dashboard.profile.displayName}:`);
                console.log(`   Friends: ${dashboard.connections.friendsCount}`);
                console.log(`   Messages: ${dashboard.stats.messagesExchanged}`);
                console.log(`   Activity Score: ${dashboard.activityScore}`);
                console.log(`   Current Location: ${dashboard.presence.currentWorld}/${dashboard.presence.currentZone}`);
            }
        }
        
        console.log('\n✨ Social hub demonstration complete!');
    }
    
    runDemo().catch(console.error);
}
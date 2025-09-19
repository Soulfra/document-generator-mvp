#!/usr/bin/env node

/**
 * 🔐 ENCRYPTED PROMPT HANDLER
 * Converts real user needs into story mode for AI safety and fun
 * Encrypts sensitive data while preserving functionality requirements
 */

require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs').promises;

class EncryptedPromptHandler {
    constructor(config = {}) {
        this.config = {
            encryptionKey: config.encryptionKey || this.generateMasterKey(),
            storyModeEnabled: config.storyModeEnabled !== false,
            privacyLevel: config.privacyLevel || 'high', // low, medium, high
            narrativeStyle: config.narrativeStyle || 'adventure', // adventure, business, casual, epic
            ...config
        };
        
        // Story mode templates for different domains
        this.storyTemplates = {
            finance: {
                adventure: 'building your financial empire and conquering the markets',
                business: 'developing your investment portfolio and financial infrastructure', 
                casual: 'managing your money and tracking your investments',
                epic: 'forging the ultimate financial kingdom and dominating the crypto realm'
            },
            travel: {
                adventure: 'embarking on epic journeys and exploring new destinations',
                business: 'optimizing your travel logistics and booking management',
                casual: 'planning your trips and finding great deals',
                epic: 'commanding your travel empire and conquering every destination'
            },
            ecommerce: {
                adventure: 'building your merchant empire and conquering the marketplace',
                business: 'developing your e-commerce platform and sales infrastructure',
                casual: 'setting up your online store and selling products',
                epic: 'ruling the digital commerce realm and dominating all markets'
            },
            productivity: {
                adventure: 'organizing your quest for maximum efficiency and achievement',
                business: 'optimizing your workflow and team coordination systems',
                casual: 'getting organized and managing your tasks better',
                epic: 'mastering the art of productivity and leading your team to victory'
            },
            social: {
                adventure: 'creating communities and connecting like-minded adventurers',
                business: 'building your social platform and engagement infrastructure',
                casual: 'bringing people together and sharing experiences',
                epic: 'forging the ultimate social network and uniting all communities'
            }
        };
        
        // Sensitive data patterns to encrypt
        this.sensitivePatterns = {
            // Personal info
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
            ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
            
            // Financial info
            creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
            bankAccount: /\b\d{9,12}\b/g,
            
            // API keys and secrets
            apiKey: /\b[A-Za-z0-9]{24,}\b/g,
            
            // Addresses
            address: /\b\d+\s+[A-Za-z0-9\s,]+\b/g,
            
            // Crypto addresses (basic pattern)
            cryptoAddress: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b|0x[a-fA-F0-9]{40}\b/g
        };
        
        console.log('🔐 Encrypted Prompt Handler initialized');
        console.log(`📖 Story mode: ${this.config.storyModeEnabled ? 'ON' : 'OFF'}`);
        console.log(`🛡️ Privacy level: ${this.config.privacyLevel}`);
        console.log(`🎭 Narrative style: ${this.config.narrativeStyle}`);
    }
    
    // Main encryption function - converts user prompt to story mode
    async encryptPrompt(userPrompt, context = {}) {
        console.log(`🔐 Encrypting prompt: "${userPrompt.substring(0, 50)}..."`);
        
        try {
            // 1. Detect sensitive information
            const sensitiveData = this.detectSensitiveData(userPrompt);
            
            // 2. Encrypt sensitive parts
            const encryptedData = await this.encryptSensitiveData(sensitiveData);
            
            // 3. Replace sensitive data with encrypted tokens
            let safePrompt = this.replaceSensitiveData(userPrompt, encryptedData);
            
            // 4. Convert to story mode
            let storyPrompt = safePrompt;
            if (this.config.storyModeEnabled) {
                storyPrompt = await this.convertToStoryMode(safePrompt, context);
            }
            
            // 5. Generate final encrypted prompt
            const result = {
                original: userPrompt,
                safe: safePrompt,
                story: storyPrompt,
                encryptedData: encryptedData,
                encryptionKey: this.config.encryptionKey,
                timestamp: new Date().toISOString(),
                privacyLevel: this.config.privacyLevel,
                sensitiveDataDetected: sensitiveData.length > 0
            };
            
            console.log(`✅ Prompt encrypted successfully`);
            console.log(`📊 Sensitive items found: ${sensitiveData.length}`);
            console.log(`📖 Story mode: ${storyPrompt.substring(0, 100)}...`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Prompt encryption failed:', error);
            
            // Fallback: basic story mode without encryption
            return {
                original: userPrompt,
                safe: userPrompt,
                story: await this.convertToStoryMode(userPrompt, context),
                encryptedData: [],
                encryptionKey: null,
                timestamp: new Date().toISOString(),
                privacyLevel: 'none',
                sensitiveDataDetected: false,
                error: error.message
            };
        }
    }
    
    // Detect sensitive information in user prompt
    detectSensitiveData(prompt) {
        const sensitiveItems = [];
        
        for (const [type, pattern] of Object.entries(this.sensitivePatterns)) {
            const matches = [...prompt.matchAll(pattern)];
            
            for (const match of matches) {
                sensitiveItems.push({
                    type,
                    value: match[0],
                    index: match.index,
                    length: match[0].length
                });
            }
        }
        
        // Sort by index (last to first for safe replacement)
        return sensitiveItems.sort((a, b) => b.index - a.index);
    }
    
    // Encrypt sensitive data items
    async encryptSensitiveData(sensitiveItems) {
        const encrypted = [];
        
        for (const item of sensitiveItems) {
            const encryptedValue = this.encrypt(item.value);
            const token = `ENCRYPTED_${item.type.toUpperCase()}_${this.generateToken()}`;
            
            encrypted.push({
                ...item,
                encrypted: encryptedValue,
                token: token
            });
        }
        
        return encrypted;
    }
    
    // Replace sensitive data with encrypted tokens
    replaceSensitiveData(prompt, encryptedData) {
        let safePrompt = prompt;
        
        // Replace from last to first to preserve indices
        for (const item of encryptedData) {
            const replacement = this.getReplacementText(item.type);
            safePrompt = safePrompt.substring(0, item.index) + 
                        replacement + 
                        safePrompt.substring(item.index + item.length);
        }
        
        return safePrompt;
    }
    
    // Get appropriate replacement text for different sensitive data types
    getReplacementText(type) {
        const replacements = {
            email: '[user email]',
            phone: '[user phone]',
            ssn: '[user SSN]',
            creditCard: '[payment method]',
            bankAccount: '[bank account]',
            apiKey: '[API credentials]',
            address: '[user address]',
            cryptoAddress: '[crypto wallet]'
        };
        
        return replacements[type] || '[sensitive data]';
    }
    
    // Convert prompt to story mode narrative
    async convertToStoryMode(prompt, context = {}) {
        const category = context.category || this.detectCategory(prompt);
        const template = this.storyTemplates[category] || this.storyTemplates.productivity;
        const storyTheme = template[this.config.narrativeStyle] || template.adventure;
        
        // Story conversion patterns
        const storyConversions = {
            // Convert business terms to adventure terms
            'build': 'forge',
            'create': 'craft',
            'develop': 'construct',
            'manage': 'command',
            'optimize': 'enhance your mastery of',
            'track': 'monitor your progress in',
            'analyze': 'scout and explore',
            'implement': 'deploy your strategy for',
            'integrate': 'unite the forces of',
            'automate': 'enchant with magical automation',
            
            // Platform types to story equivalents  
            'platform': 'kingdom',
            'system': 'realm',
            'application': 'magical tool',
            'dashboard': 'command center',
            'database': 'treasure vault',
            'api': 'communication network',
            'interface': 'control panel',
            
            // User roles to character roles
            'user': 'adventurer',
            'admin': 'kingdom ruler',
            'customer': 'valued ally',
            'team': 'guild members',
            'manager': 'guild leader'
        };
        
        let storyPrompt = prompt.toLowerCase();
        
        // Apply story conversions
        for (const [original, storyVersion] of Object.entries(storyConversions)) {
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            storyPrompt = storyPrompt.replace(regex, storyVersion);
        }
        
        // Add story introduction
        const storyIntros = [
            `🎮 Welcome, brave entrepreneur! You're embarking on an epic quest: ${storyTheme}.`,
            `⚔️ Your mission, should you choose to accept it: ${storyTheme}.`,
            `🏰 In this adventure, you'll be ${storyTheme}.`,
            `🚀 Prepare for an exciting journey where you'll be ${storyTheme}.`,
            `🌟 Your entrepreneurial adventure begins with ${storyTheme}.`
        ];
        
        const randomIntro = storyIntros[Math.floor(Math.random() * storyIntros.length)];
        
        // Combine intro with story-converted prompt
        const finalStory = `${randomIntro}\n\nYour specific quest: ${storyPrompt}`;
        
        return finalStory;
    }
    
    // Detect category from prompt content
    detectCategory(prompt) {
        const categoryKeywords = {
            finance: ['money', 'crypto', 'bitcoin', 'trading', 'investment', 'portfolio', 'budget', 'expense'],
            travel: ['flight', 'hotel', 'travel', 'booking', 'trip', 'vacation'],
            ecommerce: ['store', 'shop', 'sell', 'product', 'inventory', 'marketplace'],
            productivity: ['task', 'project', 'manage', 'organize', 'team', 'crm'],
            social: ['social', 'community', 'forum', 'network', 'friends', 'chat']
        };
        
        const promptLower = prompt.toLowerCase();
        let maxMatches = 0;
        let detectedCategory = 'productivity';
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            const matches = keywords.filter(keyword => promptLower.includes(keyword)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedCategory = category;
            }
        }
        
        return detectedCategory;
    }
    
    // Decrypt encrypted prompt back to original
    async decryptPrompt(encryptedPrompt) {
        try {
            if (!encryptedPrompt.encryptedData || encryptedPrompt.encryptedData.length === 0) {
                return encryptedPrompt.original || encryptedPrompt.safe;
            }
            
            let decryptedPrompt = encryptedPrompt.safe;
            
            // Replace encrypted tokens with decrypted values
            for (const item of encryptedPrompt.encryptedData) {
                const decryptedValue = this.decrypt(item.encrypted);
                const replacement = this.getReplacementText(item.type);
                decryptedPrompt = decryptedPrompt.replace(replacement, decryptedValue);
            }
            
            return decryptedPrompt;
            
        } catch (error) {
            console.error('❌ Decryption failed:', error);
            return encryptedPrompt.safe || encryptedPrompt.story;
        }
    }
    
    // Get story prompt optimized for different AI models
    getPromptForAI(encryptedPrompt, aiModel = 'general') {
        const modelOptimizations = {
            'gemini': encryptedPrompt.story, // Gemini likes narrative style
            'claude': encryptedPrompt.safe,  // Claude prefers clean prompts  
            'gpt': encryptedPrompt.story,    // GPT-4 handles story mode well
            'ollama': encryptedPrompt.safe,  // Local models prefer simpler prompts
            'general': encryptedPrompt.story
        };
        
        return modelOptimizations[aiModel] || encryptedPrompt.story;
    }
    
    // Encryption utilities
    encrypt(text) {
        const cipher = crypto.createCipher('aes-256-cbc', this.config.encryptionKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    decrypt(encryptedText) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.config.encryptionKey);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    
    generateMasterKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    generateToken() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    
    // Save encrypted prompt to database/file
    async saveEncryptedPrompt(encryptedPrompt, userId = null) {
        const record = {
            id: crypto.randomUUID(),
            userId,
            timestamp: encryptedPrompt.timestamp,
            originalLength: encryptedPrompt.original.length,
            storyLength: encryptedPrompt.story.length,
            sensitiveDataCount: encryptedPrompt.encryptedData.length,
            privacyLevel: encryptedPrompt.privacyLevel,
            category: this.detectCategory(encryptedPrompt.original)
        };
        
        // In production, save to database
        console.log('💾 Encrypted prompt saved:', record.id);
        
        return record;
    }
    
    // Analytics for encryption effectiveness
    getEncryptionStats() {
        return {
            supportedSensitiveTypes: Object.keys(this.sensitivePatterns).length,
            storyCategories: Object.keys(this.storyTemplates).length,
            narrativeStyles: ['adventure', 'business', 'casual', 'epic'],
            privacyLevels: ['low', 'medium', 'high'],
            encryptionEnabled: true,
            storyModeEnabled: this.config.storyModeEnabled
        };
    }
}

module.exports = EncryptedPromptHandler;

// Demo if run directly
if (require.main === module) {
    const demo = async () => {
        console.log('🔐 ENCRYPTED PROMPT HANDLER DEMO');
        console.log('=================================\n');
        
        const handler = new EncryptedPromptHandler({
            narrativeStyle: 'adventure',
            privacyLevel: 'high'
        });
        
        const testPrompts = [
            "I want to build a crypto portfolio tracker for my wallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa with flight booking",
            "Create an online store with my email john@example.com and phone 555-1234",
            "Build a task management system for managing my team's productivity",
            "I need a social network for connecting with friends and sharing photos"
        ];
        
        for (const prompt of testPrompts) {
            console.log(`\n🔍 Original: "${prompt}"`);
            
            const encrypted = await handler.encryptPrompt(prompt);
            
            console.log(`🛡️ Safe: "${encrypted.safe}"`);
            console.log(`📖 Story: "${encrypted.story.substring(0, 100)}..."`);
            console.log(`🔐 Sensitive data: ${encrypted.sensitiveDataDetected ? encrypted.encryptedData.length + ' items' : 'none'}`);
            
            // Test different AI model prompts
            console.log(`🤖 For Gemini: "${handler.getPromptForAI(encrypted, 'gemini').substring(0, 80)}..."`);
        }
        
        console.log('\n📊 Encryption Stats:', handler.getEncryptionStats());
    };
    
    demo().catch(console.error);
}
#!/usr/bin/env node

/**
 * 🗜️ CONVERSATION COMPACTOR SYSTEM
 * 
 * Compacts conversations, removes duplicates, deduplicates files,
 * and creates efficient summaries for the Document Generator system.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class ConversationCompactor extends EventEmitter {
    constructor() {
        super();
        
        this.duplicateThreshold = 0.85; // 85% similarity = duplicate
        this.compressionRatio = 0.3;    // Compress to 30% of original
        this.batchSize = 100;           // Process 100 items at once
        
        this.patterns = {
            // Common conversation patterns to compact
            greetings: /^(hi|hello|hey|good morning|good afternoon)/i,
            confirmations: /^(yes|yeah|yep|ok|okay|sure|alright)/i,
            negations: /^(no|nope|nah|not really)/i,
            fillers: /^(um|uh|hmm|well|so|like)/i,
            duplicateLines: /(.+)\n\1+/g,
            timestamps: /\[\d{2}:\d{2}:\d{2}\]|\d{4}-\d{2}-\d{2}/g,
            usernames: /@\w+|<@\w+>|\w+:/g
        };
        
        this.deduplicationCache = new Map();
        this.conversationSummaries = new Map();
        this.fileHashes = new Map();
        
        console.log('🗜️ Conversation Compactor initialized');
    }
    
    /**
     * 🎯 Main compaction entry point
     */
    async compact(inputPath, outputPath = null) {
        console.log(`\n🗜️ Starting compaction of: ${inputPath}`);
        
        const stats = await this.analyzeInput(inputPath);
        console.log(`📊 Input analysis:`, stats);
        
        // Process based on input type
        if (stats.type === 'conversation') {
            return await this.compactConversations(inputPath, outputPath);
        } else if (stats.type === 'files') {
            return await this.deduplicateFiles(inputPath, outputPath);
        } else if (stats.type === 'mixed') {
            return await this.compactEverything(inputPath, outputPath);
        }
        
        throw new Error(`Unknown input type: ${stats.type}`);
    }
    
    /**
     * 📋 Analyze input to determine processing strategy
     */
    async analyzeInput(inputPath) {
        const stats = await fs.stat(inputPath);
        
        if (stats.isFile()) {
            const content = await fs.readFile(inputPath, 'utf8');
            return this.analyzeContent(content, inputPath);
        } else if (stats.isDirectory()) {
            return await this.analyzeDirectory(inputPath);
        }
        
        throw new Error(`Invalid input path: ${inputPath}`);
    }
    
    /**
     * 🔍 Analyze content type
     */
    analyzeContent(content, filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        // Check for conversation patterns
        const hasTimestamps = this.patterns.timestamps.test(content);
        const hasUsernames = this.patterns.usernames.test(content);
        const hasDialogue = content.includes(':') && content.includes('\n');
        
        const lines = content.split('\n');
        const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
        
        return {
            type: hasTimestamps && hasUsernames ? 'conversation' : 'text',
            size: content.length,
            lines: lines.length,
            avgLineLength,
            hasTimestamps,
            hasUsernames,
            hasDialogue,
            extension: ext,
            duplicateLines: this.findDuplicateLines(content),
            compressionPotential: this.estimateCompression(content)
        };
    }
    
    /**
     * 📁 Analyze directory structure
     */
    async analyzeDirectory(dirPath) {
        const files = await this.getAllFiles(dirPath);
        let totalSize = 0;
        let conversationFiles = 0;
        let duplicateFiles = 0;
        
        const fileHashes = new Map();
        
        for (const file of files) {
            const stats = await fs.stat(file);
            totalSize += stats.size;
            
            // Check if conversation file
            if (file.includes('conversation') || file.includes('chat') || file.includes('log')) {
                conversationFiles++;
            }
            
            // Check for duplicate files
            const hash = await this.getFileHash(file);
            if (fileHashes.has(hash)) {
                duplicateFiles++;
            } else {
                fileHashes.set(hash, file);
            }
        }
        
        return {
            type: conversationFiles > files.length * 0.3 ? 'conversation' : 'mixed',
            totalFiles: files.length,
            totalSize,
            conversationFiles,
            duplicateFiles,
            compressionPotential: duplicateFiles / files.length
        };
    }
    
    /**
     * 💬 Compact conversation files
     */
    async compactConversations(inputPath, outputPath) {
        console.log('\n💬 Compacting conversations...');
        
        const conversations = await this.loadConversations(inputPath);
        const compacted = [];
        
        for (const conversation of conversations) {
            console.log(`🔄 Processing conversation: ${conversation.id || 'unknown'}`);
            
            // Remove duplicates
            const deduplicated = this.removeDuplicateMessages(conversation.messages);
            
            // Compact similar messages
            const compactedMessages = this.compactSimilarMessages(deduplicated);
            
            // Summarize long conversations
            const summarized = await this.summarizeIfLong(compactedMessages);
            
            // Extract key insights
            const insights = this.extractKeyInsights(summarized);
            
            compacted.push({
                id: conversation.id,
                originalLength: conversation.messages.length,
                compactedLength: summarized.length,
                compressionRatio: summarized.length / conversation.messages.length,
                messages: summarized,
                insights,
                metadata: {
                    participants: this.extractParticipants(conversation.messages),
                    timeRange: this.getTimeRange(conversation.messages),
                    topics: this.extractTopics(summarized),
                    decisions: this.extractDecisions(summarized)
                }
            });
            
            this.emit('conversation.compacted', {
                id: conversation.id,
                compression: summarized.length / conversation.messages.length
            });
        }
        
        // Save compacted conversations
        if (outputPath) {
            await this.saveCompactedConversations(compacted, outputPath);
        }
        
        console.log(`✅ Compacted ${conversations.length} conversations`);
        return compacted;
    }
    
    /**
     * 🗑️ Remove duplicate messages
     */
    removeDuplicateMessages(messages) {
        const seen = new Set();
        const unique = [];
        
        for (const message of messages) {
            const hash = this.getMessageHash(message);
            
            if (!seen.has(hash)) {
                seen.add(hash);
                unique.push(message);
            }
        }
        
        console.log(`🗑️ Removed ${messages.length - unique.length} duplicate messages`);
        return unique;
    }
    
    /**
     * 🤝 Compact similar messages
     */
    compactSimilarMessages(messages) {
        const compacted = [];
        let currentGroup = [];
        
        for (const message of messages) {
            if (currentGroup.length === 0) {
                currentGroup.push(message);
                continue;
            }
            
            const lastMessage = currentGroup[currentGroup.length - 1];
            const similarity = this.calculateSimilarity(message.content, lastMessage.content);
            
            if (similarity > this.duplicateThreshold) {
                // Similar message, add to group
                currentGroup.push(message);
            } else {
                // Different message, process current group
                if (currentGroup.length > 1) {
                    compacted.push(this.mergeMessageGroup(currentGroup));
                } else {
                    compacted.push(currentGroup[0]);
                }
                currentGroup = [message];
            }
        }
        
        // Process final group
        if (currentGroup.length > 1) {
            compacted.push(this.mergeMessageGroup(currentGroup));
        } else if (currentGroup.length === 1) {
            compacted.push(currentGroup[0]);
        }
        
        console.log(`🤝 Compacted ${messages.length} → ${compacted.length} messages`);
        return compacted;
    }
    
    /**
     * 📄 Summarize long conversations
     */
    async summarizeIfLong(messages) {
        if (messages.length < 100) return messages;
        
        console.log(`📄 Summarizing long conversation (${messages.length} messages)`);
        
        // Keep first 10 and last 10 messages
        const important = [
            ...messages.slice(0, 10),
            ...messages.slice(-10)
        ];
        
        // Summarize the middle section
        const middle = messages.slice(10, -10);
        const summary = await this.generateSummary(middle);
        
        return [
            ...important.slice(0, 10),
            {
                type: 'summary',
                content: summary,
                originalCount: middle.length,
                timestamp: new Date().toISOString()
            },
            ...important.slice(10)
        ];
    }
    
    /**
     * 📁 Deduplicate files
     */
    async deduplicateFiles(inputPath, outputPath) {
        console.log('\n📁 Deduplicating files...');
        
        const files = await this.getAllFiles(inputPath);
        const duplicates = new Map(); // hash -> [files]
        const unique = [];
        
        for (const file of files) {
            const hash = await this.getFileHash(file);
            
            if (duplicates.has(hash)) {
                duplicates.get(hash).push(file);
            } else {
                duplicates.set(hash, [file]);
                unique.push(file);
            }
        }
        
        // Create deduplication report
        const duplicateGroupsArray = [];
        for (const [hash, files] of duplicates.entries()) {
            if (files.length > 1) {
                try {
                    const stats = await fs.stat(files[0]);
                    duplicateGroupsArray.push({
                        hash,
                        count: files.length,
                        files,
                        totalSize: files.length * stats.size
                    });
                } catch (error) {
                    console.warn(`⚠️ Failed to get file size for ${files[0]}`);
                    duplicateGroupsArray.push({
                        hash,
                        count: files.length,
                        files,
                        totalSize: 0
                    });
                }
            }
        }
        
        const report = {
            totalFiles: files.length,
            uniqueFiles: unique.length,
            duplicateGroups: duplicateGroupsArray
        };
        
        if (outputPath) {
            await this.saveDuplicateReport(report, outputPath);
        }
        
        console.log(`📁 Found ${report.duplicateGroups.length} duplicate groups`);
        console.log(`💾 Can save ${files.length - unique.length} files`);
        
        return report;
    }
    
    /**
     * 🔗 Get file hash for duplicate detection
     */
    async getFileHash(filePath) {
        if (this.fileHashes.has(filePath)) {
            return this.fileHashes.get(filePath);
        }
        
        const content = await fs.readFile(filePath);
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        this.fileHashes.set(filePath, hash);
        return hash;
    }
    
    /**
     * 🔗 Get message hash for duplicate detection
     */
    getMessageHash(message) {
        // Normalize message for hashing
        const normalized = message.content
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(this.patterns.timestamps, '')
            .trim();
            
        return crypto.createHash('md5').update(normalized).digest('hex');
    }
    
    /**
     * 📊 Calculate text similarity
     */
    calculateSimilarity(text1, text2) {
        // Simple Jaccard similarity
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }
    
    /**
     * 🤝 Merge similar messages into one
     */
    mergeMessageGroup(messages) {
        const first = messages[0];
        const count = messages.length;
        
        return {
            ...first,
            content: first.content,
            duplicateCount: count,
            originalMessages: messages.map(m => m.id || m.timestamp),
            compacted: true
        };
    }
    
    /**
     * 💡 Extract key insights from conversation
     */
    extractKeyInsights(messages) {
        const insights = {
            decisions: [],
            questions: [],
            actionItems: [],
            topics: [],
            sentiment: 'neutral'
        };
        
        for (const message of messages) {
            const content = message.content.toLowerCase();
            
            // Look for decisions
            if (content.includes('decide') || content.includes('agreed') || content.includes('will do')) {
                insights.decisions.push(message.content);
            }
            
            // Look for questions
            if (content.includes('?') || content.startsWith('how') || content.startsWith('what')) {
                insights.questions.push(message.content);
            }
            
            // Look for action items
            if (content.includes('todo') || content.includes('need to') || content.includes('should')) {
                insights.actionItems.push(message.content);
            }
        }
        
        return insights;
    }
    
    /**
     * 👥 Extract participants from conversation
     */
    extractParticipants(messages) {
        const participants = new Set();
        
        for (const message of messages) {
            if (message.author) {
                participants.add(message.author);
            } else if (message.user) {
                participants.add(message.user);
            }
        }
        
        return Array.from(participants);
    }
    
    /**
     * ⏰ Get time range of conversation
     */
    getTimeRange(messages) {
        const timestamps = messages
            .map(m => m.timestamp)
            .filter(t => t)
            .sort();
            
        return {
            start: timestamps[0],
            end: timestamps[timestamps.length - 1],
            duration: timestamps.length > 1 ? 
                new Date(timestamps[timestamps.length - 1]) - new Date(timestamps[0]) : 0
        };
    }
    
    /**
     * 🏷️ Extract topics from conversation
     */
    extractTopics(messages) {
        const topicKeywords = new Map();
        
        for (const message of messages) {
            const words = message.content
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 3);
                
            for (const word of words) {
                topicKeywords.set(word, (topicKeywords.get(word) || 0) + 1);
            }
        }
        
        // Return top 10 most frequent words
        return Array.from(topicKeywords.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
    }
    
    /**
     * ✅ Extract decisions from conversation
     */
    extractDecisions(messages) {
        const decisions = [];
        
        for (const message of messages) {
            const content = message.content;
            
            // Look for decision patterns
            if (/\b(decided|agreed|will|going to|plan to)\b/i.test(content)) {
                decisions.push({
                    decision: content,
                    timestamp: message.timestamp,
                    author: message.author
                });
            }
        }
        
        return decisions;
    }
    
    /**
     * 📝 Generate summary using AI-like logic
     */
    async generateSummary(messages) {
        const totalMessages = messages.length;
        const participants = this.extractParticipants(messages);
        const topics = this.extractTopics(messages);
        const decisions = this.extractDecisions(messages);
        
        let summary = `📝 **Conversation Summary** (${totalMessages} messages)\n\n`;
        
        summary += `👥 **Participants**: ${participants.join(', ')}\n\n`;
        
        if (topics.length > 0) {
            summary += `🏷️ **Main Topics**: ${topics.slice(0, 5).map(t => t.word).join(', ')}\n\n`;
        }
        
        if (decisions.length > 0) {
            summary += `✅ **Key Decisions**:\n`;
            for (const decision of decisions.slice(0, 3)) {
                summary += `- ${decision.decision}\n`;
            }
            summary += '\n';
        }
        
        summary += `📊 **Activity**: ${totalMessages} messages across conversation`;
        
        return summary;
    }
    
    /**
     * 🔍 Find duplicate lines in text
     */
    findDuplicateLines(content) {
        const lines = content.split('\n');
        const lineCount = new Map();
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
                lineCount.set(trimmed, (lineCount.get(trimmed) || 0) + 1);
            }
        }
        
        return Array.from(lineCount.entries())
            .filter(([line, count]) => count > 1)
            .length;
    }
    
    /**
     * 📈 Estimate compression potential
     */
    estimateCompression(content) {
        const totalLines = content.split('\n').length;
        const duplicateLines = this.findDuplicateLines(content);
        
        // Simple heuristic: duplicate ratio
        return duplicateLines / totalLines;
    }
    
    /**
     * 📂 Get all files recursively
     */
    async getAllFiles(dirPath) {
        const files = [];
        
        async function scan(currentPath) {
            const items = await fs.readdir(currentPath);
            
            for (const item of items) {
                const fullPath = path.join(currentPath, item);
                const stats = await fs.stat(fullPath);
                
                if (stats.isDirectory()) {
                    await scan(fullPath);
                } else {
                    files.push(fullPath);
                }
            }
        }
        
        await scan(dirPath);
        return files;
    }
    
    /**
     * 💾 Load conversations from various formats
     */
    async loadConversations(inputPath) {
        const stats = await fs.stat(inputPath);
        
        if (stats.isFile()) {
            return [await this.loadSingleConversation(inputPath)];
        } else {
            return await this.loadMultipleConversations(inputPath);
        }
    }
    
    /**
     * 📄 Load single conversation file
     */
    async loadSingleConversation(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const ext = path.extname(filePath).toLowerCase();
        
        if (ext === '.json') {
            return JSON.parse(content);
        } else {
            // Parse as text conversation
            return this.parseTextConversation(content, filePath);
        }
    }
    
    /**
     * 📚 Load multiple conversation files
     */
    async loadMultipleConversations(dirPath) {
        const files = await this.getAllFiles(dirPath);
        const conversations = [];
        
        for (const file of files) {
            if (this.isConversationFile(file)) {
                try {
                    const conversation = await this.loadSingleConversation(file);
                    conversations.push(conversation);
                } catch (error) {
                    console.warn(`⚠️ Failed to load conversation: ${file}`);
                }
            }
        }
        
        return conversations;
    }
    
    /**
     * 🗣️ Parse text conversation format
     */
    parseTextConversation(content, filePath) {
        const lines = content.split('\n');
        const messages = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Try to parse timestamp and author
            const timestampMatch = line.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
            const authorMatch = line.match(/^(\w+):\s*(.+)/);
            
            if (timestampMatch || authorMatch) {
                messages.push({
                    id: i,
                    timestamp: timestampMatch ? timestampMatch[1] : null,
                    author: authorMatch ? authorMatch[1] : 'unknown',
                    content: authorMatch ? authorMatch[2] : line,
                    line: i + 1
                });
            } else if (line.length > 0) {
                // Standalone message
                messages.push({
                    id: i,
                    author: 'unknown',
                    content: line,
                    line: i + 1
                });
            }
        }
        
        return {
            id: path.basename(filePath, path.extname(filePath)),
            source: filePath,
            messages
        };
    }
    
    /**
     * 🔍 Check if file is a conversation file
     */
    isConversationFile(filePath) {
        const name = path.basename(filePath).toLowerCase();
        const ext = path.extname(filePath).toLowerCase();
        
        return (
            name.includes('conversation') ||
            name.includes('chat') ||
            name.includes('log') ||
            name.includes('messages') ||
            ext === '.json' ||
            ext === '.txt' ||
            ext === '.md'
        );
    }
    
    /**
     * 💾 Save compacted conversations
     */
    async saveCompactedConversations(conversations, outputPath) {
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });
        
        // Save summary report
        const report = {
            timestamp: new Date().toISOString(),
            totalConversations: conversations.length,
            totalCompressionRatio: conversations.reduce((sum, c) => sum + c.compressionRatio, 0) / conversations.length,
            conversations: conversations.map(c => ({
                id: c.id,
                originalLength: c.originalLength,
                compactedLength: c.compactedLength,
                compressionRatio: c.compressionRatio,
                participants: c.metadata.participants,
                topics: c.metadata.topics
            }))
        };
        
        await fs.writeFile(
            path.join(outputDir, 'compaction-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        // Save individual conversations
        for (const conversation of conversations) {
            const filename = `${conversation.id}-compacted.json`;
            await fs.writeFile(
                path.join(outputDir, filename),
                JSON.stringify(conversation, null, 2)
            );
        }
        
        console.log(`💾 Saved ${conversations.length} compacted conversations to ${outputDir}`);
    }
    
    /**
     * 📊 Save duplicate report
     */
    async saveDuplicateReport(report, outputPath) {
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });
        
        await fs.writeFile(
            path.join(outputDir, 'duplicate-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        // Create duplicate removal script
        const script = this.generateDuplicateRemovalScript(report);
        await fs.writeFile(
            path.join(outputDir, 'remove-duplicates.sh'),
            script
        );
        
        console.log(`📊 Saved duplicate report to ${outputDir}`);
    }
    
    /**
     * 🗑️ Generate script to remove duplicates
     */
    generateDuplicateRemovalScript(report) {
        let script = '#!/bin/bash\n\n# Generated duplicate removal script\n\n';
        
        for (const group of report.duplicateGroups) {
            if (group.files.length > 1) {
                script += `# Duplicate group (${group.count} files, ${group.totalSize} bytes)\n`;
                script += `# Keep: ${group.files[0]}\n`;
                
                for (let i = 1; i < group.files.length; i++) {
                    script += `rm "${group.files[i]}"\n`;
                }
                
                script += '\n';
            }
        }
        
        return script;
    }
    
    /**
     * 🎯 Compact everything (conversations + files)
     */
    async compactEverything(inputPath, outputPath) {
        console.log('\n🎯 Compacting everything...');
        
        const results = {
            conversations: await this.compactConversations(inputPath, outputPath),
            files: await this.deduplicateFiles(inputPath, outputPath)
        };
        
        // Generate overall report
        const overallReport = {
            timestamp: new Date().toISOString(),
            inputPath,
            outputPath,
            conversations: {
                count: results.conversations.length,
                totalCompression: results.conversations.reduce((sum, c) => sum + c.compressionRatio, 0) / results.conversations.length
            },
            files: {
                total: results.files.totalFiles,
                unique: results.files.uniqueFiles,
                duplicates: results.files.duplicateGroups.length
            },
            savings: {
                conversationMessages: results.conversations.reduce((sum, c) => sum + (c.originalLength - c.compactedLength), 0),
                duplicateFiles: results.files.totalFiles - results.files.uniqueFiles
            }
        };
        
        if (outputPath) {
            await fs.writeFile(
                path.join(path.dirname(outputPath), 'compaction-summary.json'),
                JSON.stringify(overallReport, null, 2)
            );
        }
        
        console.log('\n✅ Compaction complete!');
        console.log(`💬 Conversations: ${overallReport.conversations.count} processed`);
        console.log(`📁 Files: ${overallReport.files.duplicates} duplicate groups found`);
        console.log(`💾 Total savings: ${overallReport.savings.conversationMessages} messages, ${overallReport.savings.duplicateFiles} files`);
        
        return overallReport;
    }
}

// 🚀 CLI Interface
if (require.main === module) {
    async function main() {
        const compactor = new ConversationCompactor();
        
        // Listen for events
        compactor.on('conversation.compacted', (data) => {
            console.log(`✅ Compacted conversation ${data.id} (${(data.compression * 100).toFixed(1)}% compression)`);
        });
        
        const inputPath = process.argv[2] || '.';
        const outputPath = process.argv[3] || './compacted';
        
        console.log('🗜️ Starting Document Generator Conversation Compactor...');
        console.log(`📥 Input: ${inputPath}`);
        console.log(`📤 Output: ${outputPath}`);
        
        try {
            const result = await compactor.compact(inputPath, outputPath);
            console.log('\n🎉 Compaction completed successfully!');
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('❌ Compaction failed:', error.message);
            process.exit(1);
        }
    }
    
    main().catch(console.error);
}

module.exports = ConversationCompactor;
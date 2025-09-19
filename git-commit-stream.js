#!/usr/bin/env node

/**
 * 🎬 GIT COMMIT STREAM MONITOR
 * Real-time git commit monitoring for dev streaming
 * Watches repository for changes and formats them for streaming display
 */

const { EventEmitter } = require('events');
const chokidar = require('chokidar');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class GitCommitStream extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.repoPath = options.repoPath || process.cwd();
        this.branch = options.branch || 'main';
        this.maxDiffSize = options.maxDiffSize || 500; // lines
        this.pollInterval = options.pollInterval || 5000; // 5 seconds
        
        this.lastCommitHash = null;
        this.commitHistory = [];
        this.isMonitoring = false;
        
        // Streaming formatting options
        this.streamFormat = {
            showDiff: options.showDiff !== false,
            showStats: options.showStats !== false,
            showFiles: options.showFiles !== false,
            colorize: options.colorize !== false
        };
        
        console.log('🎬 Git Commit Stream Monitor initialized');
        console.log(`📁 Watching: ${this.repoPath}`);
        console.log(`🌿 Branch: ${this.branch}`);
    }
    
    async start() {
        console.log('🚀 Starting git commit monitoring...');
        
        // Get initial commit
        this.lastCommitHash = await this.getCurrentCommitHash();
        
        // Start monitoring
        this.isMonitoring = true;
        this.monitorLoop();
        
        // Also watch .git directory for changes
        this.watchGitDirectory();
        
        this.emit('started', {
            repoPath: this.repoPath,
            branch: this.branch,
            lastCommit: this.lastCommitHash
        });
    }
    
    async stop() {
        console.log('🛑 Stopping git commit monitoring...');
        this.isMonitoring = false;
        
        if (this.watcher) {
            await this.watcher.close();
        }
        
        this.emit('stopped');
    }
    
    async monitorLoop() {
        while (this.isMonitoring) {
            try {
                const currentHash = await this.getCurrentCommitHash();
                
                if (currentHash && currentHash !== this.lastCommitHash) {
                    // New commit detected!
                    await this.handleNewCommit(currentHash);
                    this.lastCommitHash = currentHash;
                }
                
                // Check for branch changes
                const currentBranch = await this.getCurrentBranch();
                if (currentBranch !== this.branch) {
                    this.branch = currentBranch;
                    this.emit('branchChanged', {
                        oldBranch: this.branch,
                        newBranch: currentBranch
                    });
                }
                
            } catch (error) {
                console.error('Monitor error:', error);
            }
            
            // Wait before next check
            await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        }
    }
    
    watchGitDirectory() {
        const gitPath = path.join(this.repoPath, '.git');
        
        this.watcher = chokidar.watch(gitPath, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles except .git
            persistent: true,
            ignoreInitial: true,
            depth: 2
        });
        
        this.watcher.on('change', async (filepath) => {
            if (filepath.includes('COMMIT_EDITMSG') || filepath.includes('HEAD')) {
                // Potential new commit
                const currentHash = await this.getCurrentCommitHash();
                if (currentHash !== this.lastCommitHash) {
                    await this.handleNewCommit(currentHash);
                    this.lastCommitHash = currentHash;
                }
            }
        });
    }
    
    async handleNewCommit(commitHash) {
        console.log(`🎉 New commit detected: ${commitHash}`);
        
        try {
            // Get commit details
            const commitInfo = await this.getCommitInfo(commitHash);
            
            // Get diff information
            const diffInfo = await this.getCommitDiff(commitHash);
            
            // Get file changes
            const fileChanges = await this.getFileChanges(commitHash);
            
            // Format for streaming
            const streamData = this.formatForStream({
                hash: commitHash,
                ...commitInfo,
                diff: diffInfo,
                files: fileChanges
            });
            
            // Add to history
            this.commitHistory.unshift(streamData);
            if (this.commitHistory.length > 100) {
                this.commitHistory = this.commitHistory.slice(0, 100);
            }
            
            // Emit events
            this.emit('commit', streamData);
            this.emit('formatted', streamData.formatted);
            
        } catch (error) {
            console.error('Error processing commit:', error);
            this.emit('error', error);
        }
    }
    
    async getCurrentCommitHash() {
        try {
            const { stdout } = await execAsync(
                'git rev-parse HEAD',
                { cwd: this.repoPath }
            );
            return stdout.trim();
        } catch (error) {
            return null;
        }
    }
    
    async getCurrentBranch() {
        try {
            const { stdout } = await execAsync(
                'git branch --show-current',
                { cwd: this.repoPath }
            );
            return stdout.trim();
        } catch (error) {
            return 'unknown';
        }
    }
    
    async getCommitInfo(hash) {
        const { stdout } = await execAsync(
            `git show --no-patch --format=format:'%H|%h|%an|%ae|%at|%s|%b' ${hash}`,
            { cwd: this.repoPath }
        );
        
        const [fullHash, shortHash, author, email, timestamp, subject, body] = stdout.split('|');
        
        return {
            fullHash,
            shortHash,
            author,
            email,
            timestamp: new Date(parseInt(timestamp) * 1000),
            subject,
            body: body.trim(),
            message: subject + (body ? '\n\n' + body : '')
        };
    }
    
    async getCommitDiff(hash) {
        try {
            const { stdout } = await execAsync(
                `git show --stat ${hash}`,
                { cwd: this.repoPath }
            );
            
            const stats = this.parseGitStats(stdout);
            
            // Get actual diff (limited size for streaming)
            const { stdout: diff } = await execAsync(
                `git show --no-stat -U3 ${hash} | head -${this.maxDiffSize}`,
                { cwd: this.repoPath }
            );
            
            return {
                stats,
                diff: this.streamFormat.showDiff ? diff : null,
                truncated: diff.split('\n').length >= this.maxDiffSize
            };
            
        } catch (error) {
            return { stats: null, diff: null, error: error.message };
        }
    }
    
    async getFileChanges(hash) {
        const { stdout } = await execAsync(
            `git show --name-status --no-patch ${hash}`,
            { cwd: this.repoPath }
        );
        
        const lines = stdout.trim().split('\n');
        const files = [];
        
        // Skip commit info lines, find file changes
        let foundFiles = false;
        for (const line of lines) {
            if (line === '') {
                foundFiles = true;
                continue;
            }
            
            if (foundFiles && line.match(/^[AMDRT]\s+/)) {
                const [status, ...pathParts] = line.split(/\s+/);
                files.push({
                    status: this.getFileStatusName(status),
                    statusCode: status,
                    path: pathParts.join(' '),
                    extension: path.extname(pathParts.join(' '))
                });
            }
        }
        
        return files;
    }
    
    getFileStatusName(status) {
        const statusMap = {
            'A': 'added',
            'M': 'modified',
            'D': 'deleted',
            'R': 'renamed',
            'T': 'type changed'
        };
        return statusMap[status] || status;
    }
    
    parseGitStats(statsOutput) {
        const lines = statsOutput.split('\n');
        const statsLine = lines.find(l => l.includes('changed'));
        
        if (!statsLine) return null;
        
        const stats = {
            filesChanged: 0,
            insertions: 0,
            deletions: 0
        };
        
        // Parse "X files changed, Y insertions(+), Z deletions(-)"
        const match = statsLine.match(/(\d+) files? changed/);
        if (match) stats.filesChanged = parseInt(match[1]);
        
        const insertMatch = statsLine.match(/(\d+) insertions?/);
        if (insertMatch) stats.insertions = parseInt(insertMatch[1]);
        
        const deleteMatch = statsLine.match(/(\d+) deletions?/);
        if (deleteMatch) stats.deletions = parseInt(deleteMatch[1]);
        
        return stats;
    }
    
    formatForStream(commitData) {
        const formatted = {
            twitchChat: this.formatForTwitchChat(commitData),
            overlay: this.formatForOverlay(commitData),
            rss: this.formatForRSS(commitData),
            discord: this.formatForDiscord(commitData)
        };
        
        return {
            ...commitData,
            formatted
        };
    }
    
    formatForTwitchChat(commit) {
        let message = `🎯 New Commit: ${commit.subject} `;
        
        if (commit.diff?.stats) {
            const { filesChanged, insertions, deletions } = commit.diff.stats;
            message += `[${filesChanged} files, +${insertions}/-${deletions}]`;
        }
        
        message += ` - ${commit.author}`;
        
        return message;
    }
    
    formatForOverlay(commit) {
        return {
            title: commit.subject,
            author: commit.author,
            hash: commit.shortHash,
            stats: commit.diff?.stats,
            files: this.streamFormat.showFiles ? commit.files : [],
            timestamp: commit.timestamp,
            animate: true
        };
    }
    
    formatForRSS(commit) {
        let description = `<p><strong>Commit:</strong> ${commit.shortHash}</p>`;
        description += `<p><strong>Author:</strong> ${commit.author}</p>`;
        
        if (commit.body) {
            description += `<p>${commit.body.replace(/\n/g, '<br>')}</p>`;
        }
        
        if (commit.diff?.stats) {
            const { filesChanged, insertions, deletions } = commit.diff.stats;
            description += `<p><strong>Changes:</strong> ${filesChanged} files changed, `;
            description += `<span style="color: green">+${insertions}</span> insertions, `;
            description += `<span style="color: red">-${deletions}</span> deletions</p>`;
        }
        
        if (commit.files && commit.files.length > 0) {
            description += '<p><strong>Files:</strong></p><ul>';
            commit.files.forEach(file => {
                description += `<li>${file.status}: ${file.path}</li>`;
            });
            description += '</ul>';
        }
        
        return {
            title: commit.subject,
            description,
            link: `${this.repoPath}/${commit.fullHash}`,
            guid: commit.fullHash,
            pubDate: commit.timestamp,
            author: `${commit.email} (${commit.author})`
        };
    }
    
    formatForDiscord(commit) {
        const embed = {
            title: `🎯 ${commit.subject}`,
            description: commit.body || 'No description',
            color: 0x00ff00,
            author: {
                name: commit.author,
                icon_url: `https://github.com/${commit.author}.png`
            },
            fields: [
                {
                    name: 'Commit',
                    value: `\`${commit.shortHash}\``,
                    inline: true
                },
                {
                    name: 'Branch',
                    value: this.branch,
                    inline: true
                }
            ],
            timestamp: commit.timestamp
        };
        
        if (commit.diff?.stats) {
            embed.fields.push({
                name: 'Statistics',
                value: `${commit.diff.stats.filesChanged} files | +${commit.diff.stats.insertions}/-${commit.diff.stats.deletions}`,
                inline: false
            });
        }
        
        if (commit.files && commit.files.length > 0 && commit.files.length <= 10) {
            const fileList = commit.files
                .map(f => `${this.getFileEmoji(f.statusCode)} ${f.path}`)
                .join('\n');
            
            embed.fields.push({
                name: 'Files Changed',
                value: fileList,
                inline: false
            });
        }
        
        return embed;
    }
    
    getFileEmoji(status) {
        const emojiMap = {
            'A': '➕',
            'M': '📝',
            'D': '❌',
            'R': '🔄',
            'T': '🔧'
        };
        return emojiMap[status] || '📄';
    }
    
    // Utility methods
    async getRecentCommits(limit = 10) {
        const { stdout } = await execAsync(
            `git log --oneline -${limit}`,
            { cwd: this.repoPath }
        );
        
        return stdout.trim().split('\n').map(line => {
            const [hash, ...messageParts] = line.split(' ');
            return {
                hash,
                message: messageParts.join(' ')
            };
        });
    }
    
    getCommitHistory() {
        return this.commitHistory;
    }
    
    async analyzeCommitPatterns() {
        // Analyze commit patterns for streaming insights
        const { stdout } = await execAsync(
            'git log --format="%ai" --since="30 days ago"',
            { cwd: this.repoPath }
        );
        
        const timestamps = stdout.trim().split('\n').map(t => new Date(t));
        const hourCounts = new Array(24).fill(0);
        const dayCounts = new Array(7).fill(0);
        
        timestamps.forEach(date => {
            hourCounts[date.getHours()]++;
            dayCounts[date.getDay()]++;
        });
        
        return {
            totalCommits: timestamps.length,
            commitsPerDay: (timestamps.length / 30).toFixed(1),
            mostActiveHour: hourCounts.indexOf(Math.max(...hourCounts)),
            mostActiveDay: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayCounts.indexOf(Math.max(...dayCounts))],
            hourlyDistribution: hourCounts,
            dailyDistribution: dayCounts
        };
    }
}

module.exports = GitCommitStream;

// CLI usage
if (require.main === module) {
    const monitor = new GitCommitStream({
        repoPath: process.argv[2] || process.cwd(),
        branch: process.argv[3] || 'main',
        showDiff: true,
        showStats: true,
        showFiles: true
    });
    
    monitor.on('commit', (commit) => {
        console.log('\n' + '='.repeat(80));
        console.log('🎯 NEW COMMIT DETECTED!');
        console.log('='.repeat(80));
        console.log(`Hash: ${commit.shortHash}`);
        console.log(`Author: ${commit.author}`);
        console.log(`Message: ${commit.subject}`);
        
        if (commit.diff?.stats) {
            console.log(`\nStats: ${commit.diff.stats.filesChanged} files, +${commit.diff.stats.insertions}/-${commit.diff.stats.deletions}`);
        }
        
        if (commit.files && commit.files.length > 0) {
            console.log('\nFiles:');
            commit.files.forEach(file => {
                console.log(`  ${file.status}: ${file.path}`);
            });
        }
        
        console.log('\nFormatted for Twitch:', commit.formatted.twitchChat);
    });
    
    monitor.on('error', (error) => {
        console.error('❌ Error:', error);
    });
    
    monitor.start();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\nShutting down...');
        await monitor.stop();
        process.exit(0);
    });
}
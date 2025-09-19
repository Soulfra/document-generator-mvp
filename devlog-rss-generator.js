#!/usr/bin/env node

/**
 * 📡 DEVLOG RSS FEED GENERATOR
 * Generates RSS/Atom/JSON feeds from development activity
 * Integrates with git commits, documentation, and project milestones
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { create } = require('xmlbuilder2');

class DevlogRSSGenerator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Configuration
        this.config = {
            title: options.title || 'Development Log',
            description: options.description || 'Live development updates and progress',
            author: options.author || 'Developer',
            email: options.email || 'dev@example.com',
            siteUrl: options.siteUrl || 'https://example.com',
            feedUrl: options.feedUrl || 'https://example.com/devlog.xml',
            language: options.language || 'en-us',
            copyright: options.copyright || `Copyright ${new Date().getFullYear()}`,
            generator: 'DevLog RSS Generator v1.0',
            maxItems: options.maxItems || 50,
            categories: options.categories || ['development', 'programming', 'coding'],
            outputDir: options.outputDir || './feeds',
            ...options
        };
        
        // Feed items storage
        this.items = [];
        this.itemsById = new Map();
        
        // Feed types to generate
        this.feedTypes = {
            rss: true,
            atom: true,
            json: true
        };
        
        // Templates for different content types
        this.templates = {
            commit: this.commitTemplate.bind(this),
            milestone: this.milestoneTemplate.bind(this),
            documentation: this.documentationTemplate.bind(this),
            build: this.buildTemplate.bind(this),
            release: this.releaseTemplate.bind(this),
            learning: this.learningTemplate.bind(this),
            debugging: this.debuggingTemplate.bind(this),
            feature: this.featureTemplate.bind(this),
            refactor: this.refactorTemplate.bind(this),
            test: this.testTemplate.bind(this)
        };
        
        // Statistics
        this.stats = {
            totalItems: 0,
            itemsByType: {},
            lastGenerated: null,
            feedsGenerated: 0
        };
        
        console.log('📡 DevLog RSS Generator initialized');
        this.ensureOutputDirectory();
    }
    
    async ensureOutputDirectory() {
        try {
            await fs.mkdir(this.config.outputDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create output directory:', error);
        }
    }
    
    /**
     * Add a development event to the feed
     */
    async addItem(type, data) {
        const id = this.generateId(type, data);
        
        // Check for duplicates
        if (this.itemsById.has(id)) {
            return;
        }
        
        // Create feed item using appropriate template
        const template = this.templates[type] || this.defaultTemplate.bind(this);
        const item = await template(data);
        
        // Add metadata
        item.id = id;
        item.type = type;
        item.timestamp = data.timestamp || new Date();
        item.guid = `${this.config.siteUrl}/devlog/${id}`;
        
        // Add to storage
        this.items.unshift(item);
        this.itemsById.set(id, item);
        
        // Update stats
        this.stats.totalItems++;
        this.stats.itemsByType[type] = (this.stats.itemsByType[type] || 0) + 1;
        
        // Trim to max items
        if (this.items.length > this.config.maxItems) {
            const removed = this.items.splice(this.config.maxItems);
            removed.forEach(item => this.itemsById.delete(item.id));
        }
        
        // Emit event
        this.emit('itemAdded', { type, item });
        
        // Auto-generate feeds if configured
        if (this.config.autoGenerate) {
            await this.generateAllFeeds();
        }
        
        return item;
    }
    
    /**
     * Add a git commit to the feed
     */
    async addCommit(commitData) {
        return this.addItem('commit', commitData);
    }
    
    /**
     * Add multiple items in batch
     */
    async addBatch(items) {
        const results = [];
        
        for (const { type, data } of items) {
            const result = await this.addItem(type, data);
            if (result) results.push(result);
        }
        
        return results;
    }
    
    /**
     * Generate all configured feed types
     */
    async generateAllFeeds() {
        const results = {};
        
        if (this.feedTypes.rss) {
            results.rss = await this.generateRSS();
        }
        
        if (this.feedTypes.atom) {
            results.atom = await this.generateAtom();
        }
        
        if (this.feedTypes.json) {
            results.json = await this.generateJSON();
        }
        
        this.stats.lastGenerated = new Date();
        this.stats.feedsGenerated++;
        
        this.emit('feedsGenerated', results);
        
        return results;
    }
    
    /**
     * Generate RSS 2.0 feed
     */
    async generateRSS() {
        const feed = create({ encoding: 'UTF-8' })
            .ele('rss', { version: '2.0', 'xmlns:atom': 'http://www.w3.org/2005/Atom' })
            .ele('channel');
        
        // Channel metadata
        feed.ele('title').txt(this.config.title);
        feed.ele('description').txt(this.config.description);
        feed.ele('link').txt(this.config.siteUrl);
        feed.ele('atom:link', {
            href: this.config.feedUrl,
            rel: 'self',
            type: 'application/rss+xml'
        });
        feed.ele('language').txt(this.config.language);
        feed.ele('copyright').txt(this.config.copyright);
        feed.ele('lastBuildDate').txt(new Date().toUTCString());
        feed.ele('generator').txt(this.config.generator);
        
        // Categories
        this.config.categories.forEach(cat => {
            feed.ele('category').txt(cat);
        });
        
        // Add items
        for (const item of this.items) {
            const itemEle = feed.ele('item');
            
            itemEle.ele('title').txt(item.title);
            itemEle.ele('description').dat(item.description);
            itemEle.ele('link').txt(item.link || item.guid);
            itemEle.ele('guid', { isPermaLink: 'false' }).txt(item.guid);
            itemEle.ele('pubDate').txt(new Date(item.timestamp).toUTCString());
            
            if (item.author) {
                itemEle.ele('author').txt(`${this.config.email} (${item.author})`);
            }
            
            if (item.categories) {
                item.categories.forEach(cat => {
                    itemEle.ele('category').txt(cat);
                });
            }
            
            if (item.enclosure) {
                itemEle.ele('enclosure', {
                    url: item.enclosure.url,
                    type: item.enclosure.type,
                    length: item.enclosure.length || 0
                });
            }
        }
        
        const xml = feed.end({ prettyPrint: true });
        const filePath = path.join(this.config.outputDir, 'devlog.xml');
        await fs.writeFile(filePath, xml);
        
        return { type: 'rss', path: filePath, size: xml.length };
    }
    
    /**
     * Generate Atom 1.0 feed
     */
    async generateAtom() {
        const feed = create({ encoding: 'UTF-8' })
            .ele('feed', { xmlns: 'http://www.w3.org/2005/Atom' });
        
        // Feed metadata
        feed.ele('title').txt(this.config.title);
        feed.ele('subtitle').txt(this.config.description);
        feed.ele('id').txt(this.config.feedUrl);
        feed.ele('link', { href: this.config.feedUrl, rel: 'self' });
        feed.ele('link', { href: this.config.siteUrl });
        feed.ele('updated').txt(new Date().toISOString());
        feed.ele('author')
            .ele('name').txt(this.config.author).up()
            .ele('email').txt(this.config.email);
        feed.ele('generator').txt(this.config.generator);
        feed.ele('rights').txt(this.config.copyright);
        
        // Add entries
        for (const item of this.items) {
            const entry = feed.ele('entry');
            
            entry.ele('title').txt(item.title);
            entry.ele('id').txt(item.guid);
            entry.ele('link', { href: item.link || item.guid });
            entry.ele('updated').txt(new Date(item.timestamp).toISOString());
            entry.ele('published').txt(new Date(item.timestamp).toISOString());
            
            if (item.summary) {
                entry.ele('summary').txt(item.summary);
            }
            
            entry.ele('content', { type: 'html' }).dat(item.description);
            
            if (item.author) {
                entry.ele('author')
                    .ele('name').txt(item.author);
            }
            
            if (item.categories) {
                item.categories.forEach(cat => {
                    entry.ele('category', { term: cat });
                });
            }
        }
        
        const xml = feed.end({ prettyPrint: true });
        const filePath = path.join(this.config.outputDir, 'devlog.atom');
        await fs.writeFile(filePath, xml);
        
        return { type: 'atom', path: filePath, size: xml.length };
    }
    
    /**
     * Generate JSON Feed 1.1
     */
    async generateJSON() {
        const feed = {
            version: 'https://jsonfeed.org/version/1.1',
            title: this.config.title,
            description: this.config.description,
            home_page_url: this.config.siteUrl,
            feed_url: this.config.feedUrl.replace('.xml', '.json'),
            authors: [{
                name: this.config.author,
                email: this.config.email
            }],
            language: this.config.language,
            items: []
        };
        
        // Add items
        for (const item of this.items) {
            const jsonItem = {
                id: item.guid,
                title: item.title,
                content_html: item.description,
                url: item.link || item.guid,
                date_published: new Date(item.timestamp).toISOString(),
                authors: item.author ? [{ name: item.author }] : undefined,
                tags: item.categories,
                _devlog: {
                    type: item.type,
                    metadata: item.metadata
                }
            };
            
            if (item.summary) {
                jsonItem.summary = item.summary;
            }
            
            if (item.image) {
                jsonItem.image = item.image;
            }
            
            if (item.attachments) {
                jsonItem.attachments = item.attachments;
            }
            
            feed.items.push(jsonItem);
        }
        
        const json = JSON.stringify(feed, null, 2);
        const filePath = path.join(this.config.outputDir, 'devlog.json');
        await fs.writeFile(filePath, json);
        
        return { type: 'json', path: filePath, size: json.length };
    }
    
    /**
     * Content Templates
     */
    async commitTemplate(data) {
        const { subject, body, author, files, diff } = data;
        
        let description = `<h3>🎯 Commit: ${this.escapeHtml(subject)}</h3>`;
        
        if (body) {
            description += `<p>${this.escapeHtml(body).replace(/\n/g, '<br>')}</p>`;
        }
        
        if (diff?.stats) {
            const { filesChanged, insertions, deletions } = diff.stats;
            description += `<p><strong>Stats:</strong> ${filesChanged} files changed, `;
            description += `<span style="color: green">+${insertions}</span> insertions, `;
            description += `<span style="color: red">-${deletions}</span> deletions</p>`;
        }
        
        if (files && files.length > 0) {
            description += '<h4>Files Changed:</h4><ul>';
            files.forEach(file => {
                const emoji = this.getFileEmoji(file.statusCode);
                description += `<li>${emoji} ${file.status}: <code>${this.escapeHtml(file.path)}</code></li>`;
            });
            description += '</ul>';
        }
        
        if (diff?.diff && data.showDiff !== false) {
            description += '<details><summary>View Diff</summary>';
            description += `<pre><code>${this.escapeHtml(diff.diff.substring(0, 1000))}</code></pre>`;
            if (diff.truncated) {
                description += '<p><em>Diff truncated...</em></p>';
            }
            description += '</details>';
        }
        
        return {
            title: `Commit: ${subject}`,
            description,
            summary: subject,
            author: author,
            categories: ['commit', ...this.extractCategories(subject)],
            metadata: {
                hash: data.hash,
                shortHash: data.shortHash,
                filesChanged: files?.length || 0
            }
        };
    }
    
    async milestoneTemplate(data) {
        const { name, description, progress, completed, total } = data;
        
        let content = `<h3>🏁 Milestone: ${this.escapeHtml(name)}</h3>`;
        content += `<p>${this.escapeHtml(description)}</p>`;
        
        const percentage = Math.round((completed / total) * 100);
        content += `<p><strong>Progress:</strong> ${completed}/${total} (${percentage}%)</p>`;
        
        // Progress bar
        content += '<div style="background: #ddd; height: 20px; border-radius: 10px; overflow: hidden;">';
        content += `<div style="background: #4CAF50; height: 100%; width: ${percentage}%;"></div>`;
        content += '</div>';
        
        if (data.tasks) {
            content += '<h4>Tasks:</h4><ul>';
            data.tasks.forEach(task => {
                const check = task.completed ? '✅' : '☐️';
                content += `<li>${check} ${this.escapeHtml(task.name)}</li>`;
            });
            content += '</ul>';
        }
        
        return {
            title: `Milestone ${percentage === 100 ? 'Completed' : 'Update'}: ${name}`,
            description: content,
            summary: `${name} - ${percentage}% complete`,
            categories: ['milestone', percentage === 100 ? 'completed' : 'progress'],
            metadata: { progress: percentage, completed, total }
        };
    }
    
    async documentationTemplate(data) {
        const { file, type, added, modified, sections } = data;
        
        let description = `<h3>📖 Documentation Update</h3>`;
        description += `<p>Updated documentation in <code>${this.escapeHtml(file)}</code></p>`;
        
        if (sections && sections.length > 0) {
            description += '<h4>Sections Updated:</h4><ul>';
            sections.forEach(section => {
                description += `<li>${this.escapeHtml(section)}</li>`;
            });
            description += '</ul>';
        }
        
        if (added) {
            description += `<p><span style="color: green">+${added} lines added</span></p>`;
        }
        
        if (modified) {
            description += `<p><span style="color: orange">✏️ ${modified} lines modified</span></p>`;
        }
        
        return {
            title: `Docs: Updated ${path.basename(file)}`,
            description,
            summary: `Documentation updated in ${file}`,
            categories: ['documentation', type || 'general'],
            metadata: { file, added, modified }
        };
    }
    
    async buildTemplate(data) {
        const { status, duration, errors, warnings, artifacts } = data;
        
        const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '🔄';
        let description = `<h3>${emoji} Build ${status.toUpperCase()}</h3>`;
        
        if (duration) {
            description += `<p><strong>Duration:</strong> ${this.formatDuration(duration)}</p>`;
        }
        
        if (errors && errors.length > 0) {
            description += `<h4>❌ Errors (${errors.length}):</h4><ul>`;
            errors.slice(0, 5).forEach(error => {
                description += `<li><code>${this.escapeHtml(error)}</code></li>`;
            });
            if (errors.length > 5) {
                description += `<li><em>...and ${errors.length - 5} more</em></li>`;
            }
            description += '</ul>';
        }
        
        if (warnings && warnings.length > 0) {
            description += `<h4>⚠️ Warnings (${warnings.length}):</h4><ul>`;
            warnings.slice(0, 3).forEach(warning => {
                description += `<li>${this.escapeHtml(warning)}</li>`;
            });
            description += '</ul>';
        }
        
        if (artifacts && artifacts.length > 0) {
            description += '<h4>📦 Artifacts:</h4><ul>';
            artifacts.forEach(artifact => {
                description += `<li>${this.escapeHtml(artifact.name)} (${this.formatBytes(artifact.size)})</li>`;
            });
            description += '</ul>';
        }
        
        return {
            title: `Build ${status}: ${data.project || 'Project'}`,
            description,
            summary: `Build ${status} in ${this.formatDuration(duration)}`,
            categories: ['build', status],
            metadata: { status, duration, errorCount: errors?.length || 0 }
        };
    }
    
    async releaseTemplate(data) {
        const { version, name, changes, downloads, notes } = data;
        
        let description = `<h2>🎆 Release ${version}${name ? ` - ${name}` : ''}</h2>`;
        
        if (notes) {
            description += `<p>${this.escapeHtml(notes).replace(/\n/g, '<br>')}</p>`;
        }
        
        if (changes && changes.length > 0) {
            description += '<h3>Changes:</h3><ul>';
            changes.forEach(change => {
                const emoji = change.type === 'feature' ? '✨' :
                             change.type === 'fix' ? '🐛' :
                             change.type === 'breaking' ? '💥' : '🔧';
                description += `<li>${emoji} ${this.escapeHtml(change.description)}</li>`;
            });
            description += '</ul>';
        }
        
        if (downloads && downloads.length > 0) {
            description += '<h3>Downloads:</h3><ul>';
            downloads.forEach(download => {
                description += `<li><a href="${download.url}">${this.escapeHtml(download.name)}</a> `;
                description += `(${this.formatBytes(download.size)})</li>`;
            });
            description += '</ul>';
        }
        
        return {
            title: `Release: v${version}${name ? ` - ${name}` : ''}`,
            description,
            summary: `Version ${version} released`,
            categories: ['release', 'announcement'],
            metadata: { version, changeCount: changes?.length || 0 }
        };
    }
    
    async learningTemplate(data) {
        const { topic, resource, notes, duration } = data;
        
        let description = `<h3>🎓 Learning: ${this.escapeHtml(topic)}</h3>`;
        
        if (resource) {
            description += `<p><strong>Resource:</strong> ${this.escapeHtml(resource)}</p>`;
        }
        
        if (duration) {
            description += `<p><strong>Time spent:</strong> ${this.formatDuration(duration * 60000)}</p>`;
        }
        
        if (notes) {
            description += '<h4>Notes:</h4>';
            description += `<p>${this.escapeHtml(notes).replace(/\n/g, '<br>')}</p>`;
        }
        
        return {
            title: `Learning: ${topic}`,
            description,
            summary: `Studied ${topic}`,
            categories: ['learning', 'education'],
            metadata: { topic, duration }
        };
    }
    
    async debuggingTemplate(data) {
        const { issue, solution, timeSpent, stackTrace } = data;
        
        let description = `<h3>🐛 Debugging Session</h3>`;
        description += `<p><strong>Issue:</strong> ${this.escapeHtml(issue)}</p>`;
        
        if (solution) {
            description += `<p><strong>Solution:</strong> ${this.escapeHtml(solution)}</p>`;
        }
        
        if (timeSpent) {
            description += `<p><strong>Time spent:</strong> ${this.formatDuration(timeSpent * 60000)}</p>`;
        }
        
        if (stackTrace) {
            description += '<details><summary>Stack Trace</summary>';
            description += `<pre><code>${this.escapeHtml(stackTrace)}</code></pre>`;
            description += '</details>';
        }
        
        return {
            title: `Debugging: ${issue.substring(0, 50)}${issue.length > 50 ? '...' : ''}`,
            description,
            summary: solution ? 'Bug fixed' : 'Debugging issue',
            categories: ['debugging', solution ? 'solved' : 'ongoing'],
            metadata: { solved: !!solution, timeSpent }
        };
    }
    
    async featureTemplate(data) {
        const { name, description, completed, components } = data;
        
        let content = `<h3>✨ New Feature: ${this.escapeHtml(name)}</h3>`;
        content += `<p>${this.escapeHtml(description)}</p>`;
        
        if (components && components.length > 0) {
            content += '<h4>Components:</h4><ul>';
            components.forEach(comp => {
                content += `<li>${this.escapeHtml(comp)}</li>`;
            });
            content += '</ul>';
        }
        
        content += `<p><strong>Status:</strong> ${completed ? '✅ Completed' : '🔄 In Progress'}</p>`;
        
        return {
            title: `Feature: ${name}`,
            description: content,
            summary: `${completed ? 'Completed' : 'Working on'} ${name}`,
            categories: ['feature', completed ? 'completed' : 'development'],
            metadata: { name, completed }
        };
    }
    
    async refactorTemplate(data) {
        const { area, reason, changes, impact } = data;
        
        let description = `<h3>🔧 Refactoring: ${this.escapeHtml(area)}</h3>`;
        description += `<p><strong>Reason:</strong> ${this.escapeHtml(reason)}</p>`;
        
        if (changes && changes.length > 0) {
            description += '<h4>Changes:</h4><ul>';
            changes.forEach(change => {
                description += `<li>${this.escapeHtml(change)}</li>`;
            });
            description += '</ul>';
        }
        
        if (impact) {
            description += `<p><strong>Impact:</strong> ${this.escapeHtml(impact)}</p>`;
        }
        
        return {
            title: `Refactoring: ${area}`,
            description,
            summary: reason,
            categories: ['refactoring', 'improvement'],
            metadata: { area, changeCount: changes?.length || 0 }
        };
    }
    
    async testTemplate(data) {
        const { suite, passed, failed, skipped, coverage } = data;
        
        const total = passed + failed + skipped;
        const emoji = failed === 0 ? '✅' : '❌';
        
        let description = `<h3>${emoji} Test Results: ${this.escapeHtml(suite)}</h3>`;
        description += `<p><strong>Results:</strong> ${passed}/${total} passed`;
        
        if (failed > 0) {
            description += ` (${failed} failed)`;
        }
        
        if (skipped > 0) {
            description += ` (${skipped} skipped)`;
        }
        
        description += '</p>';
        
        if (coverage) {
            description += `<p><strong>Coverage:</strong> ${coverage}%</p>`;
            
            // Coverage bar
            const color = coverage >= 80 ? '#4CAF50' : coverage >= 60 ? '#FFC107' : '#F44336';
            description += '<div style="background: #ddd; height: 10px; border-radius: 5px; overflow: hidden;">';
            description += `<div style="background: ${color}; height: 100%; width: ${coverage}%;"></div>`;
            description += '</div>';
        }
        
        if (data.failedTests && data.failedTests.length > 0) {
            description += '<h4>Failed Tests:</h4><ul>';
            data.failedTests.slice(0, 5).forEach(test => {
                description += `<li><code>${this.escapeHtml(test)}</code></li>`;
            });
            description += '</ul>';
        }
        
        return {
            title: `Tests: ${suite} - ${failed === 0 ? 'All Passing' : `${failed} Failed`}`,
            description,
            summary: `${passed}/${total} tests passed`,
            categories: ['testing', failed === 0 ? 'passing' : 'failing'],
            metadata: { passed, failed, total, coverage }
        };
    }
    
    async defaultTemplate(data) {
        return {
            title: data.title || 'Development Update',
            description: data.description || '<p>Development activity logged</p>',
            summary: data.summary || data.title,
            categories: data.categories || ['general'],
            metadata: data.metadata || {}
        };
    }
    
    /**
     * Helper Methods
     */
    generateId(type, data) {
        const content = `${type}-${JSON.stringify(data)}-${Date.now()}`;
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }
    
    escapeHtml(text) {
        if (!text) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
    
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    
    extractCategories(text) {
        const categories = [];
        
        // Extract common dev keywords
        if (text.match(/\b(fix|bug|patch|hotfix)\b/i)) categories.push('bugfix');
        if (text.match(/\b(feat|feature|add|new)\b/i)) categories.push('feature');
        if (text.match(/\b(test|spec)\b/i)) categories.push('testing');
        if (text.match(/\b(doc|readme)\b/i)) categories.push('documentation');
        if (text.match(/\b(refactor|clean)\b/i)) categories.push('refactoring');
        if (text.match(/\b(deploy|release)\b/i)) categories.push('deployment');
        
        return categories;
    }
    
    /**
     * API Methods
     */
    getItems(limit = 10) {
        return this.items.slice(0, limit);
    }
    
    getItemsByType(type, limit = 10) {
        return this.items.filter(item => item.type === type).slice(0, limit);
    }
    
    getStats() {
        return {
            ...this.stats,
            currentItems: this.items.length
        };
    }
    
    clear() {
        this.items = [];
        this.itemsById.clear();
        this.stats.totalItems = 0;
        this.stats.itemsByType = {};
        this.emit('cleared');
    }
    
    async importFromGit(gitMonitor) {
        const commits = gitMonitor.getCommitHistory();
        
        for (const commit of commits) {
            await this.addCommit(commit);
        }
        
        return commits.length;
    }
}

module.exports = DevlogRSSGenerator;

// CLI usage
if (require.main === module) {
    const generator = new DevlogRSSGenerator({
        title: 'My Development Log',
        description: 'Live updates from my coding sessions',
        author: 'Developer',
        email: 'dev@example.com',
        siteUrl: 'https://mydevblog.com',
        feedUrl: 'https://mydevblog.com/devlog.xml',
        autoGenerate: true
    });
    
    // Example: Add a commit
    generator.addCommit({
        subject: 'Add RSS feed generation',
        body: 'Implemented RSS, Atom, and JSON feed generation for development logs',
        author: 'Developer',
        files: [
            { status: 'added', statusCode: 'A', path: 'devlog-rss-generator.js' }
        ],
        diff: {
            stats: { filesChanged: 1, insertions: 500, deletions: 0 }
        }
    });
    
    // Generate feeds
    generator.generateAllFeeds().then(results => {
        console.log('🎉 Feeds generated:');
        Object.entries(results).forEach(([type, result]) => {
            console.log(`  ${type}: ${result.path} (${result.size} bytes)`);
        });
    });
}
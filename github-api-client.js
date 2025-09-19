#!/usr/bin/env node

/**
 * GitHub API Client
 * 
 * Following GitHub's official API patterns from docs.github.com
 * Handles repository operations, content retrieval, and repo creation
 */

const https = require('https');
const { URL } = require('url');

class GitHubAPIClient {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.apiBase = 'https://api.github.com';
        this.headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Document-Generator-App',
            'X-GitHub-Api-Version': '2022-11-28' // Current API version per docs
        };
    }
    
    /**
     * Make authenticated API request
     */
    async request(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.apiBase);
            
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: method,
                headers: { ...this.headers }
            };
            
            if (data) {
                const jsonData = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }
            
            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject(new Error(`GitHub API Error: ${res.statusCode} - ${parsed.message || responseData}`));
                        }
                    } catch (error) {
                        // Some endpoints return non-JSON
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(responseData);
                        } else {
                            reject(new Error(`GitHub API Error: ${res.statusCode} - ${responseData}`));
                        }
                    }
                });
            });
            
            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
    
    /**
     * Get authenticated user information
     */
    async getUser() {
        return this.request('GET', '/user');
    }
    
    /**
     * List user's repositories with pagination
     * @param {Object} options - Query parameters (page, per_page, type, sort)
     */
    async listRepositories(options = {}) {
        const params = new URLSearchParams({
            per_page: options.per_page || 30,
            page: options.page || 1,
            sort: options.sort || 'updated',
            type: options.type || 'owner' // owner, member, or public
        });
        
        return this.request('GET', `/user/repos?${params}`);
    }
    
    /**
     * Get specific repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     */
    async getRepository(owner, repo) {
        return this.request('GET', `/repos/${owner}/${repo}`);
    }
    
    /**
     * Get repository contents
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - File/directory path (optional)
     */
    async getContents(owner, repo, path = '') {
        const endpoint = path 
            ? `/repos/${owner}/${repo}/contents/${path}`
            : `/repos/${owner}/${repo}/contents`;
            
        return this.request('GET', endpoint);
    }
    
    /**
     * Get file content (decoded)
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - File path
     */
    async getFileContent(owner, repo, path) {
        const file = await this.getContents(owner, repo, path);
        
        if (file.type !== 'file') {
            throw new Error('Path is not a file');
        }
        
        // Decode base64 content
        const content = Buffer.from(file.content, 'base64').toString('utf-8');
        
        return {
            name: file.name,
            path: file.path,
            sha: file.sha,
            size: file.size,
            content: content
        };
    }
    
    /**
     * Get repository README
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     */
    async getReadme(owner, repo) {
        try {
            return await this.request('GET', `/repos/${owner}/${repo}/readme`);
        } catch (error) {
            return null; // README might not exist
        }
    }
    
    /**
     * Create a new repository
     * @param {Object} options - Repository creation options
     */
    async createRepository(options) {
        const data = {
            name: options.name,
            description: options.description,
            private: options.private || false,
            auto_init: options.auto_init || true,
            gitignore_template: options.gitignore_template || 'Node',
            license_template: options.license_template || 'mit'
        };
        
        return this.request('POST', '/user/repos', data);
    }
    
    /**
     * Create or update file in repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - File path
     * @param {Object} options - File creation options
     */
    async createOrUpdateFile(owner, repo, path, options) {
        const data = {
            message: options.message,
            content: Buffer.from(options.content).toString('base64'),
            branch: options.branch || 'main'
        };
        
        // If updating, need the file SHA
        if (options.sha) {
            data.sha = options.sha;
        }
        
        return this.request('PUT', `/repos/${owner}/${repo}/contents/${path}`, data);
    }
    
    /**
     * Search for repositories containing documents
     * @param {string} query - Search query
     * @param {Object} options - Search options
     */
    async searchRepositories(query, options = {}) {
        const params = new URLSearchParams({
            q: query,
            sort: options.sort || 'stars',
            order: options.order || 'desc',
            per_page: options.per_page || 10
        });
        
        return this.request('GET', `/search/repositories?${params}`);
    }
    
    /**
     * Get repository topics
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     */
    async getTopics(owner, repo) {
        return this.request('GET', `/repos/${owner}/${repo}/topics`);
    }
    
    /**
     * Find document files in repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     */
    async findDocuments(owner, repo) {
        const contents = await this.getContents(owner, repo);
        const documentExtensions = ['.md', '.mdx', '.txt', '.doc', '.docx', '.pdf', '.json'];
        const documents = [];
        
        for (const item of contents) {
            if (item.type === 'file') {
                const ext = item.name.toLowerCase().match(/\.[^.]+$/)?.[0];
                if (documentExtensions.includes(ext)) {
                    documents.push({
                        name: item.name,
                        path: item.path,
                        size: item.size,
                        type: ext.slice(1),
                        download_url: item.download_url
                    });
                }
            } else if (item.type === 'dir' && ['docs', 'documentation', 'doc'].includes(item.name.toLowerCase())) {
                // Recursively check common doc directories
                try {
                    const dirContents = await this.getContents(owner, repo, item.path);
                    for (const subItem of dirContents) {
                        if (subItem.type === 'file') {
                            const ext = subItem.name.toLowerCase().match(/\.[^.]+$/)?.[0];
                            if (documentExtensions.includes(ext)) {
                                documents.push({
                                    name: subItem.name,
                                    path: subItem.path,
                                    size: subItem.size,
                                    type: ext.slice(1),
                                    download_url: subItem.download_url
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Could not read directory ${item.path}:`, error.message);
                }
            }
        }
        
        return documents;
    }
    
    /**
     * Get rate limit status
     */
    async getRateLimit() {
        return this.request('GET', '/rate_limit');
    }
}

// Export for use in other modules
module.exports = GitHubAPIClient;

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Usage: github-api-client.js <token> <command> [args...]');
        console.log('\nCommands:');
        console.log('  user                    - Get authenticated user');
        console.log('  repos                   - List repositories');
        console.log('  repo <owner> <name>     - Get specific repository');
        console.log('  contents <owner> <repo> - List repository contents');
        console.log('  readme <owner> <repo>   - Get repository README');
        console.log('  docs <owner> <repo>     - Find documents in repository');
        console.log('  create <name>           - Create new repository');
        console.log('  rate                    - Check API rate limit');
        process.exit(1);
    }
    
    const [token, command, ...commandArgs] = args;
    const client = new GitHubAPIClient(token);
    
    (async () => {
        try {
            let result;
            
            switch (command) {
                case 'user':
                    result = await client.getUser();
                    break;
                
                case 'repos':
                    result = await client.listRepositories();
                    break;
                
                case 'repo':
                    result = await client.getRepository(commandArgs[0], commandArgs[1]);
                    break;
                
                case 'contents':
                    result = await client.getContents(commandArgs[0], commandArgs[1], commandArgs[2]);
                    break;
                
                case 'readme':
                    result = await client.getReadme(commandArgs[0], commandArgs[1]);
                    break;
                
                case 'docs':
                    result = await client.findDocuments(commandArgs[0], commandArgs[1]);
                    break;
                
                case 'create':
                    result = await client.createRepository({
                        name: commandArgs[0],
                        description: commandArgs[1] || 'Created by Document Generator'
                    });
                    break;
                
                case 'rate':
                    result = await client.getRateLimit();
                    break;
                
                default:
                    console.error(`Unknown command: ${command}`);
                    process.exit(1);
            }
            
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    })();
}
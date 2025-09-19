const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Universal HTTP client that works across all Node.js versions
 * Replaces fetch() with a consistent interface
 */
class UniversalHttpClient {
    static async request(url, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const urlObj = new URL(url);
                const protocol = urlObj.protocol === 'https:' ? https : http;
                
                // Build request options
                const reqOptions = {
                    hostname: urlObj.hostname,
                    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                    path: urlObj.pathname + urlObj.search,
                    method: options.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    timeout: options.timeout || 30000
                };
                
                const req = protocol.request(reqOptions, (res) => {
                    let data = '';
                    
                    res.on('data', chunk => data += chunk);
                    
                    res.on('end', () => {
                        const response = {
                            ok: res.statusCode >= 200 && res.statusCode < 300,
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            headers: res.headers,
                            json: async () => {
                                try {
                                    return JSON.parse(data);
                                } catch (e) {
                                    throw new Error('Invalid JSON response: ' + e.message);
                                }
                            },
                            text: async () => data,
                            blob: async () => Buffer.from(data)
                        };
                        
                        resolve(response);
                    });
                });
                
                req.on('error', (err) => {
                    reject(new Error(`Request failed: ${err.message}`));
                });
                
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });
                
                // Send body if present
                if (options.body) {
                    if (typeof options.body === 'object') {
                        req.write(JSON.stringify(options.body));
                    } else {
                        req.write(options.body);
                    }
                }
                
                req.end();
            } catch (err) {
                reject(err);
            }
        });
    }
    
    // Convenience methods matching fetch API
    static async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    
    static async post(url, body, options = {}) {
        return this.request(url, { 
            ...options, 
            method: 'POST',
            body: typeof body === 'string' ? body : JSON.stringify(body)
        });
    }
    
    static async put(url, body, options = {}) {
        return this.request(url, { 
            ...options, 
            method: 'PUT',
            body: typeof body === 'string' ? body : JSON.stringify(body)
        });
    }
    
    static async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
    
    // Fetch-compatible interface
    static fetch(url, options = {}) {
        return this.request(url, options);
    }
}

// Create a global fetch polyfill if it doesn't exist
if (typeof global.fetch === 'undefined') {
    global.fetch = UniversalHttpClient.fetch;
    console.log('✅ Universal HTTP client installed as global.fetch');
}

// Export for direct use
module.exports = UniversalHttpClient;
#!/usr/bin/env node

/**
 * API Debug Interceptor
 * Catches and logs ALL API calls to identify 400 errors and character limit issues
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Log file
const logFile = path.join(__dirname, 'api-debug.log');
const errorLogFile = path.join(__dirname, 'api-errors.log');

// Store original methods
const originalHttpRequest = http.request;
const originalHttpsRequest = https.request;

// Create log streams
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
const errorStream = fs.createWriteStream(errorLogFile, { flags: 'a' });

function log(message, isError = false) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(logEntry);
    logStream.write(logEntry);
    
    if (isError) {
        errorStream.write(logEntry);
    }
}

// Intercept function
function interceptRequest(protocol, originalRequest) {
    return function(...args) {
        const [urlOrOptions, options, callback] = args;
        
        // Normalize arguments
        let requestOptions = typeof urlOrOptions === 'string' ? 
            require('url').parse(urlOrOptions) : urlOrOptions;
        
        if (typeof urlOrOptions === 'string' && options) {
            Object.assign(requestOptions, options);
        }
        
        const method = requestOptions.method || 'GET';
        const host = requestOptions.hostname || requestOptions.host || 'localhost';
        const path = requestOptions.path || '/';
        const port = requestOptions.port || (protocol === 'https' ? 443 : 80);
        
        // Log request details
        log(`➡️  ${method} ${protocol}://${host}:${port}${path}`);
        
        // Check for large payloads
        if (requestOptions.headers && requestOptions.headers['content-length']) {
            const contentLength = parseInt(requestOptions.headers['content-length']);
            log(`   Content-Length: ${contentLength} bytes`);
            
            if (contentLength > 1000000) { // 1MB
                log(`⚠️  LARGE PAYLOAD: ${contentLength} bytes`, true);
            }
        }
        
        // Create the actual request
        const req = originalRequest.apply(this, args);
        
        // Track request body size
        let requestBodySize = 0;
        const originalWrite = req.write;
        const originalEnd = req.end;
        
        req.write = function(chunk, ...args) {
            if (chunk) {
                requestBodySize += Buffer.byteLength(chunk);
            }
            return originalWrite.apply(this, [chunk, ...args]);
        };
        
        req.end = function(chunk, ...args) {
            if (chunk) {
                requestBodySize += Buffer.byteLength(chunk);
            }
            
            if (requestBodySize > 0) {
                log(`   Request body size: ${requestBodySize} bytes`);
                
                // Check for potential character limit issues
                if (requestBodySize > 100000) { // 100KB
                    log(`⚠️  LARGE REQUEST BODY: ${requestBodySize} bytes - potential character limit issue`, true);
                }
            }
            
            return originalEnd.apply(this, [chunk, ...args]);
        };
        
        // Intercept response
        req.on('response', (res) => {
            const statusCode = res.statusCode;
            const statusMessage = res.statusMessage || http.STATUS_CODES[statusCode];
            
            log(`⬅️  ${statusCode} ${statusMessage} from ${protocol}://${host}:${port}${path}`);
            
            // Capture response body for error cases
            if (statusCode >= 400) {
                let responseBody = '';
                
                res.on('data', (chunk) => {
                    responseBody += chunk.toString();
                });
                
                res.on('end', () => {
                    log(`❌ ERROR ${statusCode}: ${method} ${protocol}://${host}:${port}${path}`, true);
                    log(`   Request body size: ${requestBodySize} bytes`, true);
                    log(`   Response: ${responseBody.substring(0, 1000)}...`, true);
                    
                    // Special handling for 400 errors
                    if (statusCode === 400) {
                        log(`🚨 400 BAD REQUEST DETECTED!`, true);
                        
                        // Try to parse error details
                        try {
                            const errorData = JSON.parse(responseBody);
                            log(`   Error details: ${JSON.stringify(errorData, null, 2)}`, true);
                            
                            // Check for common character limit messages
                            const errorStr = JSON.stringify(errorData).toLowerCase();
                            if (errorStr.includes('character') || 
                                errorStr.includes('limit') || 
                                errorStr.includes('too long') ||
                                errorStr.includes('too large') ||
                                errorStr.includes('max')) {
                                log(`⚠️  CHARACTER/SIZE LIMIT ERROR DETECTED!`, true);
                            }
                        } catch (e) {
                            log(`   Raw error: ${responseBody}`, true);
                        }
                    }
                });
            }
        });
        
        // Handle request errors
        req.on('error', (error) => {
            log(`❌ REQUEST ERROR: ${error.message} for ${protocol}://${host}:${port}${path}`, true);
        });
        
        return req;
    };
}

// Apply interceptors
http.request = interceptRequest('http', originalHttpRequest);
https.request = interceptRequest('https', originalHttpsRequest);

// Also intercept fetch if available
if (global.fetch) {
    const originalFetch = global.fetch;
    
    global.fetch = async function(...args) {
        const [url, options = {}] = args;
        const method = options.method || 'GET';
        
        log(`➡️  FETCH ${method} ${url}`);
        
        // Check request body size
        if (options.body) {
            const bodySize = typeof options.body === 'string' ? 
                options.body.length : 
                JSON.stringify(options.body).length;
            
            log(`   Fetch body size: ${bodySize} bytes`);
            
            if (bodySize > 100000) {
                log(`⚠️  LARGE FETCH BODY: ${bodySize} bytes`, true);
            }
        }
        
        try {
            const response = await originalFetch.apply(this, args);
            const clonedResponse = response.clone();
            
            log(`⬅️  FETCH ${response.status} ${response.statusText} from ${url}`);
            
            if (!response.ok) {
                const errorBody = await clonedResponse.text();
                log(`❌ FETCH ERROR ${response.status}: ${method} ${url}`, true);
                log(`   Response: ${errorBody.substring(0, 1000)}...`, true);
                
                if (response.status === 400) {
                    log(`🚨 400 BAD REQUEST IN FETCH!`, true);
                }
            }
            
            return response;
        } catch (error) {
            log(`❌ FETCH ERROR: ${error.message} for ${url}`, true);
            throw error;
        }
    };
}

console.log('🔍 API Debug Interceptor Active');
console.log(`📝 Logging to: ${logFile}`);
console.log(`❌ Errors logged to: ${errorLogFile}`);
console.log('👀 Watching for 400 errors and character limit issues...\n');

// Export for use in other modules
module.exports = {
    log,
    logFile,
    errorLogFile
};

// If running standalone, keep process alive
if (require.main === module) {
    console.log('Running in standalone mode. Press Ctrl+C to exit.\n');
    
    // Keep the process running
    setInterval(() => {
        // Heartbeat
    }, 1000);
}
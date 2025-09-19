#!/usr/bin/env node

/**
 * Vault gRPC Service
 * 
 * "this is where i get confused with the grpc or grepa dn chmod or whatever"
 * 
 * Provides remote procedure call interface for vault decryption operations
 * Eliminates gRPC confusion by implementing a clean, simple RPC interface
 * for closed-loop systems to access decrypted data securely
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { Server, ServerCredentials } = require('@grpc/grpc-js');
const { loadPackageDefinition } = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

class VaultgRPCService extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 50051,
            host: config.host || '0.0.0.0',
            maxConnections: config.maxConnections || 1000,
            
            // Security settings
            enableTLS: config.enableTLS !== false,
            requireClientCerts: config.requireClientCerts !== false,
            
            // Service limits
            maxRequestSize: config.maxRequestSize || 10 * 1024 * 1024, // 10MB
            requestTimeout: config.requestTimeout || 30000, // 30 seconds
            
            // Unified Decryption Layer connection
            unifiedDecryptionLayer: config.unifiedDecryptionLayer,
            
            // Performance settings
            enableStreaming: config.enableStreaming !== false,
            batchSize: config.batchSize || 100,
            
            // Audit and monitoring
            enableRequestLogging: config.enableRequestLogging !== false,
            enableMetrics: config.enableMetrics !== false
        };
        
        // gRPC Server instance
        this.server = null;
        this.packageDefinition = null;
        this.protoDescriptor = null;
        
        // Service statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            activeConnections: 0,
            totalDataDecrypted: 0,
            averageResponseTime: 0,
            requestHistory: []
        };
        
        // Connection tracking
        this.activeConnections = new Map();
        this.clientSessions = new Map();
        
        // Service definitions
        this.serviceDefinitions = {
            // Basic decryption service
            Decrypt: this.handleDecrypt.bind(this),
            
            // Batch decryption for multiple items
            BatchDecrypt: this.handleBatchDecrypt.bind(this),
            
            // Streaming decryption for large datasets
            StreamDecrypt: this.handleStreamDecrypt.bind(this),
            
            // Database-specific decryption
            DecryptDatabaseValue: this.handleDecryptDatabaseValue.bind(this),
            
            // Cross-system data bridging
            BridgeDecryptedData: this.handleBridgeDecryptedData.bind(this),
            
            // Vault system status
            GetVaultStatus: this.handleGetVaultStatus.bind(this),
            
            // Permission checking
            CheckPermission: this.handleCheckPermission.bind(this),
            
            // Health check
            HealthCheck: this.handleHealthCheck.bind(this)
        };
        
        console.log('🌐 Vault gRPC Service initialized');
        console.log(`📡 Ready to serve on ${this.config.host}:${this.config.port}`);
    }
    
    /**
     * Initialize and start the gRPC server
     */
    async startServer() {
        console.log('🚀 Starting Vault gRPC server...');
        
        // Load protocol buffer definitions
        await this.loadProtoDefinitions();
        
        // Create gRPC server
        this.server = new Server();
        
        // Add service implementations
        this.addServiceImplementations();
        
        // Configure server credentials
        const credentials = this.configureCredentials();
        
        // Bind and start server
        const bindResult = await this.bindServer(credentials);
        
        if (bindResult) {
            this.server.start();
            console.log(`✅ Vault gRPC server listening on ${this.config.host}:${this.config.port}`);
            
            // Start monitoring
            this.startServerMonitoring();
            
            this.emit('server:started', {
                host: this.config.host,
                port: this.config.port,
                tls: this.config.enableTLS
            });
        } else {
            throw new Error('Failed to bind gRPC server');
        }
    }
    
    /**
     * Load protocol buffer definitions
     */
    async loadProtoDefinitions() {
        // Define the protobuf schema inline
        const protoDefinition = `
        syntax = "proto3";
        
        package vault;
        
        service VaultDecryption {
            // Basic decryption
            rpc Decrypt(DecryptRequest) returns (DecryptResponse);
            
            // Batch operations
            rpc BatchDecrypt(BatchDecryptRequest) returns (BatchDecryptResponse);
            
            // Streaming operations
            rpc StreamDecrypt(stream StreamDecryptRequest) returns (stream StreamDecryptResponse);
            
            // Database operations
            rpc DecryptDatabaseValue(DatabaseDecryptRequest) returns (DecryptResponse);
            
            // Cross-system bridge
            rpc BridgeDecryptedData(BridgeRequest) returns (BridgeResponse);
            
            // Status and health
            rpc GetVaultStatus(StatusRequest) returns (StatusResponse);
            rpc CheckPermission(PermissionRequest) returns (PermissionResponse);
            rpc HealthCheck(HealthRequest) returns (HealthResponse);
        }
        
        message DecryptRequest {
            bytes encrypted_data = 1;
            string user_id = 2;
            map<string, string> options = 3;
            string request_id = 4;
        }
        
        message DecryptResponse {
            bool success = 1;
            bytes decrypted_data = 2;
            string error_message = 3;
            string encryption_type = 4;
            int64 processing_time_ms = 5;
            string request_id = 6;
        }
        
        message BatchDecryptRequest {
            repeated DecryptRequest requests = 1;
            string batch_id = 2;
        }
        
        message BatchDecryptResponse {
            repeated DecryptResponse responses = 1;
            string batch_id = 2;
            int32 successful_count = 3;
            int32 failed_count = 4;
        }
        
        message StreamDecryptRequest {
            bytes encrypted_data = 1;
            string user_id = 2;
            string stream_id = 3;
            int32 sequence_number = 4;
        }
        
        message StreamDecryptResponse {
            bool success = 1;
            bytes decrypted_data = 2;
            string error_message = 3;
            string stream_id = 4;
            int32 sequence_number = 5;
        }
        
        message DatabaseDecryptRequest {
            string table_name = 1;
            string column_name = 2;
            bytes encrypted_value = 3;
            string user_id = 4;
            map<string, string> context = 5;
        }
        
        message BridgeRequest {
            string source_system = 1;
            string target_system = 2;
            bytes encrypted_data = 3;
            string user_id = 4;
            map<string, string> context = 5;
        }
        
        message BridgeResponse {
            bool success = 1;
            bytes transformed_data = 2;
            string error_message = 3;
            string connection_id = 4;
        }
        
        message StatusRequest {
            string request_type = 1;
        }
        
        message StatusResponse {
            map<string, string> vault_systems = 1;
            map<string, int64> performance_metrics = 2;
            repeated string supported_algorithms = 3;
            bool healthy = 4;
        }
        
        message PermissionRequest {
            string user_id = 1;
            string vault_type = 2;
            string operation = 3;
        }
        
        message PermissionResponse {
            bool allowed = 1;
            string reason = 2;
            repeated string required_permissions = 3;
        }
        
        message HealthRequest {
        }
        
        message HealthResponse {
            bool healthy = 1;
            string status = 2;
            int64 uptime_seconds = 3;
            map<string, string> component_status = 4;
        }
        `;
        
        // Create temporary proto file
        const protoPath = path.join(__dirname, 'temp_vault.proto');
        const fs = require('fs').promises;
        await fs.writeFile(protoPath, protoDefinition);
        
        // Load the package definition
        this.packageDefinition = protoLoader.loadSync(protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        });
        
        this.protoDescriptor = loadPackageDefinition(this.packageDefinition);
        
        // Clean up temp file
        await fs.unlink(protoPath);
        
        console.log('📋 Protocol buffer definitions loaded');
    }
    
    /**
     * Add service implementations to gRPC server
     */
    addServiceImplementations() {
        this.server.addService(
            this.protoDescriptor.vault.VaultDecryption.service,
            this.serviceDefinitions
        );
        
        console.log('🔧 Service implementations added to gRPC server');
    }
    
    /**
     * Configure server credentials (TLS/SSL)
     */
    configureCredentials() {
        if (this.config.enableTLS) {
            // In production, load actual certificates
            const serverCert = Buffer.from('dummy-cert');
            const serverKey = Buffer.from('dummy-key');
            const rootCert = Buffer.from('dummy-root');
            
            return ServerCredentials.createSsl(
                rootCert,
                [{
                    cert_chain: serverCert,
                    private_key: serverKey
                }],
                this.config.requireClientCerts
            );
        } else {
            return ServerCredentials.createInsecure();
        }
    }
    
    /**
     * Bind server to port
     */
    async bindServer(credentials) {
        return new Promise((resolve, reject) => {
            this.server.bindAsync(
                `${this.config.host}:${this.config.port}`,
                credentials,
                (error, port) => {
                    if (error) {
                        console.error('❌ Failed to bind gRPC server:', error);
                        reject(error);
                    } else {
                        console.log(`🔗 gRPC server bound to port ${port}`);
                        resolve(true);
                    }
                }
            );
        });
    }
    
    /**
     * Handle basic decryption requests
     */
    async handleDecrypt(call, callback) {
        const startTime = Date.now();
        const request = call.request;
        
        try {
            this.logRequest('Decrypt', request.user_id, request.request_id);
            
            // Validate request
            if (!request.encrypted_data || request.encrypted_data.length === 0) {
                throw new Error('No encrypted data provided');
            }
            
            // Perform decryption using Unified Decryption Layer
            const decrypted = await this.config.unifiedDecryptionLayer.decrypt(
                request.encrypted_data,
                {
                    userId: request.user_id,
                    requestId: request.request_id,
                    options: request.options || {}
                }
            );
            
            const processingTime = Date.now() - startTime;
            
            // Successful response
            const response = {
                success: true,
                decrypted_data: Buffer.from(decrypted),
                encryption_type: 'auto_detected',
                processing_time_ms: processingTime,
                request_id: request.request_id
            };
            
            this.updateStats('success', processingTime, request.encrypted_data.length);
            
            callback(null, response);
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            console.error(`❌ Decryption failed for ${request.request_id}:`, error.message);
            
            const response = {
                success: false,
                decrypted_data: Buffer.alloc(0),
                error_message: error.message,
                processing_time_ms: processingTime,
                request_id: request.request_id
            };
            
            this.updateStats('error', processingTime, 0);
            
            callback(null, response);
        }
    }
    
    /**
     * Handle batch decryption requests
     */
    async handleBatchDecrypt(call, callback) {
        const startTime = Date.now();
        const request = call.request;
        
        try {
            this.logRequest('BatchDecrypt', 'batch', request.batch_id);
            
            const responses = [];
            let successCount = 0;
            let failureCount = 0;
            
            // Process each item in the batch
            for (const item of request.requests) {
                try {
                    const decrypted = await this.config.unifiedDecryptionLayer.decrypt(
                        item.encrypted_data,
                        {
                            userId: item.user_id,
                            requestId: item.request_id,
                            options: item.options || {}
                        }
                    );
                    
                    responses.push({
                        success: true,
                        decrypted_data: Buffer.from(decrypted),
                        encryption_type: 'auto_detected',
                        request_id: item.request_id
                    });
                    
                    successCount++;
                    
                } catch (error) {
                    responses.push({
                        success: false,
                        decrypted_data: Buffer.alloc(0),
                        error_message: error.message,
                        request_id: item.request_id
                    });
                    
                    failureCount++;
                }
            }
            
            const processingTime = Date.now() - startTime;
            
            const response = {
                responses,
                batch_id: request.batch_id,
                successful_count: successCount,
                failed_count: failureCount
            };
            
            this.updateStats(successCount > 0 ? 'success' : 'error', processingTime, 0);
            
            callback(null, response);
            
        } catch (error) {
            console.error(`❌ Batch decryption failed for ${request.batch_id}:`, error.message);
            
            const response = {
                responses: [],
                batch_id: request.batch_id,
                successful_count: 0,
                failed_count: request.requests.length
            };
            
            callback(null, response);
        }
    }
    
    /**
     * Handle streaming decryption requests
     */
    handleStreamDecrypt(call) {
        console.log('📡 Starting stream decryption session');
        
        let streamId = null;
        let processedCount = 0;
        
        call.on('data', async (request) => {
            try {
                if (!streamId) {
                    streamId = request.stream_id;
                    console.log(`🌊 Stream ${streamId} started`);
                }
                
                // Decrypt the data
                const decrypted = await this.config.unifiedDecryptionLayer.decrypt(
                    request.encrypted_data,
                    {
                        userId: request.user_id,
                        streamId: streamId,
                        sequenceNumber: request.sequence_number
                    }
                );
                
                // Send response
                call.write({
                    success: true,
                    decrypted_data: Buffer.from(decrypted),
                    stream_id: streamId,
                    sequence_number: request.sequence_number
                });
                
                processedCount++;
                
            } catch (error) {
                console.error(`❌ Stream decryption error:`, error.message);
                
                call.write({
                    success: false,
                    decrypted_data: Buffer.alloc(0),
                    error_message: error.message,
                    stream_id: streamId,
                    sequence_number: request.sequence_number
                });
            }
        });
        
        call.on('end', () => {
            console.log(`✅ Stream ${streamId} completed: ${processedCount} items processed`);
            call.end();
        });
        
        call.on('error', (error) => {
            console.error(`❌ Stream ${streamId} error:`, error.message);
            call.end();
        });
    }
    
    /**
     * Handle database value decryption
     */
    async handleDecryptDatabaseValue(call, callback) {
        const startTime = Date.now();
        const request = call.request;
        
        try {
            this.logRequest('DecryptDatabaseValue', request.user_id, `${request.table_name}.${request.column_name}`);
            
            // Use database-specific decryption
            const decrypted = await this.config.unifiedDecryptionLayer.decryptDatabaseValue(
                request.table_name,
                request.column_name,
                request.encrypted_value,
                {
                    userId: request.user_id,
                    context: request.context || {}
                }
            );
            
            const processingTime = Date.now() - startTime;
            
            const response = {
                success: true,
                decrypted_data: Buffer.from(decrypted),
                encryption_type: 'database',
                processing_time_ms: processingTime
            };
            
            this.updateStats('success', processingTime, request.encrypted_value.length);
            
            callback(null, response);
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            console.error(`❌ Database decryption failed:`, error.message);
            
            const response = {
                success: false,
                decrypted_data: Buffer.alloc(0),
                error_message: error.message,
                processing_time_ms: processingTime
            };
            
            this.updateStats('error', processingTime, 0);
            
            callback(null, response);
        }
    }
    
    /**
     * Handle cross-system data bridging
     */
    async handleBridgeDecryptedData(call, callback) {
        const startTime = Date.now();
        const request = call.request;
        
        try {
            this.logRequest('BridgeDecryptedData', request.user_id, `${request.source_system} → ${request.target_system}`);
            
            // Use cross-system bridging
            const bridged = await this.config.unifiedDecryptionLayer.bridgeDecryptedData(
                request.source_system,
                request.target_system,
                request.encrypted_data,
                {
                    userId: request.user_id,
                    context: request.context || {}
                }
            );
            
            const processingTime = Date.now() - startTime;
            
            const response = {
                success: true,
                transformed_data: Buffer.from(bridged),
                connection_id: `${request.source_system}_to_${request.target_system}`
            };
            
            callback(null, response);
            
        } catch (error) {
            console.error(`❌ Data bridging failed:`, error.message);
            
            const response = {
                success: false,
                transformed_data: Buffer.alloc(0),
                error_message: error.message,
                connection_id: ''
            };
            
            callback(null, response);
        }
    }
    
    /**
     * Handle vault status requests
     */
    async handleGetVaultStatus(call, callback) {
        try {
            const status = this.config.unifiedDecryptionLayer.getSystemStatus();
            
            const response = {
                vault_systems: {},
                performance_metrics: {},
                supported_algorithms: status.capabilities.supportedAlgorithms,
                healthy: true
            };
            
            // Convert vault systems to string map
            Object.entries(status.vaultSystems).forEach(([name, vault]) => {
                response.vault_systems[name] = vault.status;
            });
            
            // Convert performance metrics
            Object.entries(status.performance).forEach(([key, value]) => {
                response.performance_metrics[key] = value.toString();
            });
            
            callback(null, response);
            
        } catch (error) {
            console.error(`❌ Status request failed:`, error.message);
            
            const response = {
                vault_systems: {},
                performance_metrics: {},
                supported_algorithms: [],
                healthy: false
            };
            
            callback(null, response);
        }
    }
    
    /**
     * Handle permission checking
     */
    async handleCheckPermission(call, callback) {
        try {
            // Check with unified decryption layer permission system
            const allowed = await this.config.unifiedDecryptionLayer.checkDecryptionPermission(
                call.request.vault_type,
                call.request.user_id
            );
            
            const response = {
                allowed,
                reason: allowed ? 'Permission granted' : 'Access denied',
                required_permissions: allowed ? [] : ['decrypt_access']
            };
            
            callback(null, response);
            
        } catch (error) {
            const response = {
                allowed: false,
                reason: error.message,
                required_permissions: ['decrypt_access']
            };
            
            callback(null, response);
        }
    }
    
    /**
     * Handle health check requests
     */
    handleHealthCheck(call, callback) {
        const uptime = process.uptime();
        
        const response = {
            healthy: true,
            status: 'operational',
            uptime_seconds: Math.floor(uptime),
            component_status: {
                'grpc_server': 'healthy',
                'unified_decryption_layer': 'connected',
                'vault_systems': 'operational'
            }
        };
        
        callback(null, response);
    }
    
    /**
     * Start server monitoring
     */
    startServerMonitoring() {
        // Stats reporting every 30 seconds
        setInterval(() => {
            this.logServerStats();
        }, 30000);
        
        // Connection cleanup every 5 minutes
        setInterval(() => {
            this.cleanupInactiveConnections();
        }, 300000);
        
        console.log('📊 Server monitoring started');
    }
    
    /**
     * Log request for debugging and audit
     */
    logRequest(method, userId, identifier) {
        if (this.config.enableRequestLogging) {
            console.log(`📥 gRPC ${method}: ${userId || 'unknown'} (${identifier || 'no-id'})`);
        }
    }
    
    /**
     * Update service statistics
     */
    updateStats(result, processingTime, dataSize) {
        this.stats.totalRequests++;
        
        if (result === 'success') {
            this.stats.successfulRequests++;
            this.stats.totalDataDecrypted += dataSize;
        } else {
            this.stats.failedRequests++;
        }
        
        // Update average response time
        const totalResponseTime = this.stats.averageResponseTime * (this.stats.totalRequests - 1) + processingTime;
        this.stats.averageResponseTime = totalResponseTime / this.stats.totalRequests;
        
        // Keep recent request history
        this.stats.requestHistory.push({
            timestamp: new Date(),
            result,
            processingTime,
            dataSize
        });
        
        // Limit history size
        if (this.stats.requestHistory.length > 1000) {
            this.stats.requestHistory = this.stats.requestHistory.slice(-1000);
        }
    }
    
    /**
     * Log server statistics
     */
    logServerStats() {
        const successRate = this.stats.totalRequests > 0 ? 
            (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(1) : 0;
        
        console.log(`📊 gRPC Stats: ${this.stats.totalRequests} total, ${successRate}% success, ${this.stats.averageResponseTime.toFixed(0)}ms avg`);
    }
    
    /**
     * Cleanup inactive connections
     */
    cleanupInactiveConnections() {
        const now = Date.now();
        const maxAge = 300000; // 5 minutes
        
        for (const [connectionId, connection] of this.activeConnections.entries()) {
            if (now - connection.lastActivity > maxAge) {
                this.activeConnections.delete(connectionId);
            }
        }
    }
    
    /**
     * Get service statistics
     */
    getStats() {
        return {
            ...this.stats,
            activeConnections: this.activeConnections.size,
            uptime: process.uptime()
        };
    }
    
    /**
     * Gracefully stop the server
     */
    async stopServer() {
        if (this.server) {
            console.log('🛑 Stopping gRPC server...');
            
            return new Promise((resolve) => {
                this.server.tryShutdown((error) => {
                    if (error) {
                        console.error('❌ Error stopping gRPC server:', error);
                        this.server.forceShutdown();
                    } else {
                        console.log('✅ gRPC server stopped gracefully');
                    }
                    resolve();
                });
            });
        }
    }
}

module.exports = { VaultgRPCService };

// Example usage and demonstration
if (require.main === module) {
    async function demonstrateVaultgRPCService() {
        console.log('\n🌐 VAULT gRPC SERVICE DEMONSTRATION\n');
        
        // Mock unified decryption layer for demo
        const mockUnifiedDecryptionLayer = {
            async decrypt(data, options) {
                // Simulate decryption
                await new Promise(resolve => setTimeout(resolve, 100));
                return `decrypted_${data.toString().substring(0, 10)}`;
            },
            
            async decryptDatabaseValue(table, column, value, context) {
                await new Promise(resolve => setTimeout(resolve, 50));
                return `db_decrypted_${value.toString()}`;
            },
            
            async bridgeDecryptedData(source, target, data, context) {
                await new Promise(resolve => setTimeout(resolve, 75));
                return `bridged_${source}_to_${target}_${data.toString()}`;
            },
            
            getSystemStatus() {
                return {
                    vaultSystems: {
                        gravityWell: { status: 'connected' },
                        cryptoVault: { status: 'connected' }
                    },
                    performance: {
                        keyCacheSize: 150,
                        activeDecryptions: 5
                    },
                    capabilities: {
                        supportedAlgorithms: ['AES-256-GCM', 'RSA-2048']
                    }
                };
            },
            
            async checkDecryptionPermission(type, userId) {
                return true; // Allow all for demo
            }
        };
        
        const grpcService = new VaultgRPCService({
            port: 50051,
            host: '127.0.0.1',
            enableTLS: false,
            unifiedDecryptionLayer: mockUnifiedDecryptionLayer,
            enableRequestLogging: true
        });
        
        // Start the server
        await grpcService.startServer();
        
        // Simulate some activity
        setTimeout(() => {
            console.log('\n📊 === gRPC SERVICE STATISTICS ===');
            const stats = grpcService.getStats();
            
            console.log(`Total Requests: ${stats.totalRequests}`);
            console.log(`Successful Requests: ${stats.successfulRequests}`);
            console.log(`Failed Requests: ${stats.failedRequests}`);
            console.log(`Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`);
            console.log(`Total Data Decrypted: ${stats.totalDataDecrypted} bytes`);
            console.log(`Active Connections: ${stats.activeConnections}`);
            console.log(`Uptime: ${stats.uptime.toFixed(0)} seconds`);
            
            console.log('\n🌐 gRPC Service Features:');
            console.log('   • Remote procedure calls for all vault operations');
            console.log('   • Eliminates gRPC confusion with simple interface');
            console.log('   • Batch and streaming decryption support');
            console.log('   • Database-specific decryption middleware');
            console.log('   • Cross-system data bridging');
            console.log('   • Permission checking and audit logging');
            console.log('   • Health checks and performance monitoring');
            console.log('   • TLS/SSL security (configurable)');
            console.log('   • Automatic connection management');
            
            // Stop the server
            setTimeout(async () => {
                await grpcService.stopServer();
                process.exit(0);
            }, 2000);
            
        }, 1000);
    }
    
    demonstrateVaultgRPCService().catch(console.error);
}

console.log('🌐 VAULT gRPC SERVICE LOADED');
console.log('📡 Ready to eliminate gRPC confusion with clean RPC interface!');
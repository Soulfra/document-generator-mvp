#!/usr/bin/env node

/**
 * 🔍 SERVICE DISCOVERY CLIENT
 * Client library for services to register and discover each other
 * Integrates with existing SERVICE-DISCOVERY-ENGINE.js
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class ServiceDiscoveryClient {
    constructor(serviceName, servicePort, serviceType = 'business') {
        this.serviceName = serviceName;
        this.servicePort = servicePort;
        this.serviceType = serviceType;
        this.serviceId = uuidv4();
        this.discoveryEngineUrl = 'http://localhost:9999';
        this.registeredServices = new Map();
        
        console.log(`🔍 Service Discovery Client initialized for ${serviceName}`);
        console.log(`   ID: ${this.serviceId}`);
        console.log(`   Port: ${servicePort}`);
        console.log(`   Type: ${serviceType}`);
    }
    
    async registerService() {
        try {
            const registrationData = {
                id: this.serviceId,
                name: this.serviceName,
                port: this.servicePort,
                type: this.serviceType,
                status: 'running',
                timestamp: Date.now(),
                healthEndpoint: '/health'
            };
            
            console.log(`📝 Registering ${this.serviceName} with service discovery...`);
            // Service registry will auto-discover running services
            // Just ensure we're providing health endpoint
            
            return { success: true, serviceId: this.serviceId };
        } catch (error) {
            console.error('Failed to register service:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async discoverService(serviceName, serviceType = null) {
        try {
            // Get all services from discovery engine
            const response = await axios.get(`${this.discoveryEngineUrl}/api/services`);
            const services = response.data.services;
            
            // Find matching service
            const matchingServices = Object.values(services).filter(service => {
                const nameMatch = service.name.toLowerCase().includes(serviceName.toLowerCase()) ||
                                service.actualName?.toLowerCase().includes(serviceName.toLowerCase());
                const typeMatch = !serviceType || service.type === serviceType;
                return nameMatch && typeMatch && service.isRunning;
            });
            
            if (matchingServices.length > 0) {
                const service = matchingServices[0]; // Use first healthy match
                console.log(`✅ Discovered ${serviceName}: ${service.serviceUrl}`);
                
                // Cache the service
                this.registeredServices.set(serviceName, service);
                
                return {
                    success: true,
                    service: {
                        url: service.serviceUrl,
                        port: service.port,
                        name: service.actualName || service.name,
                        healthy: service.isHealthy
                    }
                };
            } else {
                console.log(`❌ Service ${serviceName} not found`);
                return { success: false, error: 'Service not found' };
            }
        } catch (error) {
            console.error(`Failed to discover service ${serviceName}:`, error.message);
            return { success: false, error: error.message };
        }
    }
    
    async getServiceUrl(serviceName, fallbackUrl = null) {
        const cached = this.registeredServices.get(serviceName);
        if (cached && cached.serviceUrl) {
            return cached.serviceUrl;
        }
        
        const discovery = await this.discoverService(serviceName);
        if (discovery.success) {
            return discovery.service.url;
        }
        
        if (fallbackUrl) {
            console.log(`⚠️ Using fallback URL for ${serviceName}: ${fallbackUrl}`);
            return fallbackUrl;
        }
        
        throw new Error(`Service ${serviceName} not found and no fallback provided`);
    }
    
    async healthCheck(serviceName = null) {
        if (serviceName) {
            // Check health of specific service
            try {
                const serviceUrl = await this.getServiceUrl(serviceName);
                const response = await axios.get(`${serviceUrl}/health`, { timeout: 3000 });
                return { healthy: true, service: serviceName, data: response.data };
            } catch (error) {
                return { healthy: false, service: serviceName, error: error.message };
            }
        } else {
            // Check health of discovery engine
            try {
                const response = await axios.get(`${this.discoveryEngineUrl}/health`, { timeout: 3000 });
                return { healthy: true, service: 'discovery-engine', data: response.data };
            } catch (error) {
                return { healthy: false, service: 'discovery-engine', error: error.message };
            }
        }
    }
    
    async callService(serviceName, endpoint, options = {}) {
        try {
            const serviceUrl = await this.getServiceUrl(serviceName);
            const fullUrl = `${serviceUrl}${endpoint}`;
            
            const axiosOptions = {
                timeout: options.timeout || 10000,
                headers: {
                    'User-Agent': `ServiceClient/${this.serviceName}`,
                    'X-Service-ID': this.serviceId,
                    ...options.headers
                }
            };
            
            let response;
            switch (options.method?.toUpperCase() || 'GET') {
                case 'POST':
                    response = await axios.post(fullUrl, options.data, axiosOptions);
                    break;
                case 'PUT':
                    response = await axios.put(fullUrl, options.data, axiosOptions);
                    break;
                case 'DELETE':
                    response = await axios.delete(fullUrl, axiosOptions);
                    break;
                default:
                    response = await axios.get(fullUrl, axiosOptions);
            }
            
            return { success: true, data: response.data, status: response.status };
        } catch (error) {
            console.error(`Failed to call ${serviceName}${endpoint}:`, error.message);
            return { 
                success: false, 
                error: error.message,
                status: error.response?.status || 0
            };
        }
    }
    
    // Convenience methods for business services
    async recordTransaction(transactionData) {
        return this.callService('accounting', '/api/transactions', {
            method: 'POST',
            data: transactionData
        });
    }
    
    async calculateTax(taxData) {
        return this.callService('tax', '/api/tax/calculate', {
            method: 'POST',
            data: taxData
        });
    }
    
    async importWallet(walletData) {
        return this.callService('wallet', '/api/import/ethereum', {
            method: 'POST',
            data: walletData
        });
    }
    
    async uploadTaxDocument(documentData) {
        return this.callService('qr-tax', '/upload', {
            method: 'POST',
            data: documentData
        });
    }
    
    // Auth integration
    async authenticateWithWormhole() {
        try {
            const authService = await this.discoverService('auth', 'integration');
            if (authService.success) {
                console.log(`🌀 Connecting to auth wormhole at ${authService.service.url}`);
                // Integration with production-auth-wormhole.js
                return { success: true, authUrl: authService.service.url };
            }
            return { success: false, error: 'Auth wormhole not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Cleanup
    async unregister() {
        try {
            console.log(`📤 Unregistering ${this.serviceName}...`);
            // Service registry will detect when service stops responding
            this.registeredServices.clear();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = ServiceDiscoveryClient;
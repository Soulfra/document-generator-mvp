#!/usr/bin/env node

/**
 * 🛣️ REST API RESOURCE ROUTER
 * Unified REST API with full CRUD operations, resource management, and faction isolation
 * Handles GET/POST/PUT/DELETE with proper resource IDs and real-world integrations
 */

import express from 'express';
import { Router } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

class RESTAPIResourceRouter extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 8200,
            enableCORS: config.enableCORS !== false,
            rateLimit: config.rateLimit || 1000, // requests per minute
            enableAuth: config.enableAuth !== false,
            maxPayloadSize: config.maxPayloadSize || '50mb',
            ...config
        };
        
        // Resource storage (in production, use proper database)
        this.resources = new Map();
        this.resourceTypes = new Map();
        this.permissions = new Map();
        this.factionResources = new Map();
        this.domainMappings = new Map();
        
        // Request tracking
        this.requestLog = [];
        this.rateLimitTracker = new Map();
        
        // Resource schemas
        this.schemas = new Map();
        
        // Initialize resource types
        this.initializeResourceTypes();
        
        // Initialize router
        this.init();
    }
    
    async init() {
        console.log('🛣️ Initializing REST API Resource Router...');
        
        this.app = express();
        
        // Middleware setup
        this.setupMiddleware();
        
        // Setup resource routes
        this.setupResourceRoutes();
        
        // Setup faction routes
        this.setupFactionRoutes();
        
        // Setup domain routes
        this.setupDomainRoutes();
        
        // Setup special endpoints
        this.setupSpecialEndpoints();
        
        // Setup error handling
        this.setupErrorHandling();
        
        // Start server
        this.server = this.app.listen(this.config.port, () => {
            console.log(`🌐 REST API Router running on port ${this.config.port}`);
            this.logAPIEndpoints();
        });
    }
    
    setupMiddleware() {
        // Enable CORS
        if (this.config.enableCORS) {
            this.app.use(cors({
                origin: true,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Faction', 'X-Domain', 'X-Request-ID']
            }));
        }
        
        // Body parsing
        this.app.use(express.json({ limit: this.config.maxPayloadSize }));
        this.app.use(express.urlencoded({ extended: true, limit: this.config.maxPayloadSize }));
        
        // Request logging
        this.app.use((req, res, next) => {
            const requestId = uuidv4();
            req.requestId = requestId;
            req.startTime = Date.now();
            
            this.logRequest(req);
            next();
        });
        
        // Rate limiting
        this.app.use((req, res, next) => {
            if (this.checkRateLimit(req)) {
                next();
            } else {
                res.status(429).json({
                    error: 'Rate limit exceeded',
                    limit: this.config.rateLimit,
                    resetTime: this.getRateLimitReset(req)
                });
            }
        });
        
        // Authentication (if enabled)
        if (this.config.enableAuth) {
            this.app.use('/api', this.authMiddleware.bind(this));
        }
        
        // Faction/Domain extraction
        this.app.use((req, res, next) => {
            req.faction = req.headers['x-faction'] || 'neutral';
            req.domain = req.headers['x-domain'] || 'default';
            next();
        });
    }
    
    setupResourceRoutes() {
        const api = Router();
        
        // GET /api/resources - List all resources with filtering
        api.get('/resources', this.listResources.bind(this));
        
        // POST /api/resources - Create new resource
        api.post('/resources', this.createResource.bind(this));
        
        // GET /api/resources/:type - List resources by type
        api.get('/resources/:type', this.listResourcesByType.bind(this));
        
        // POST /api/resources/:type - Create resource of specific type
        api.post('/resources/:type', this.createResourceOfType.bind(this));
        
        // GET /api/resources/:type/:id - Get specific resource
        api.get('/resources/:type/:id', this.getResource.bind(this));
        
        // PUT /api/resources/:type/:id - Update resource
        api.put('/resources/:type/:id', this.updateResource.bind(this));
        
        // PATCH /api/resources/:type/:id - Partial update
        api.patch('/resources/:type/:id', this.patchResource.bind(this));
        
        // DELETE /api/resources/:type/:id - Delete resource
        api.delete('/resources/:type/:id', this.deleteResource.bind(this));
        
        // Resource relationships
        api.get('/resources/:type/:id/relationships', this.getResourceRelationships.bind(this));
        api.post('/resources/:type/:id/relationships', this.createRelationship.bind(this));
        api.delete('/resources/:type/:id/relationships/:relId', this.deleteRelationship.bind(this));
        
        // Resource history
        api.get('/resources/:type/:id/history', this.getResourceHistory.bind(this));
        
        // Bulk operations
        api.post('/resources/_bulk', this.bulkOperations.bind(this));
        
        this.app.use('/api', api);
    }
    
    setupFactionRoutes() {
        const factions = Router();
        
        // GET /api/factions - List all factions
        factions.get('/', this.listFactions.bind(this));
        
        // POST /api/factions - Create faction
        factions.post('/', this.createFaction.bind(this));
        
        // GET /api/factions/:id - Get faction
        factions.get('/:id', this.getFaction.bind(this));
        
        // PUT /api/factions/:id - Update faction
        factions.put('/:id', this.updateFaction.bind(this));
        
        // DELETE /api/factions/:id - Delete faction
        factions.delete('/:id', this.deleteFaction.bind(this));
        
        // Faction resources
        factions.get('/:id/resources', this.getFactionResources.bind(this));
        factions.post('/:id/resources', this.allocateResourceToFaction.bind(this));
        factions.delete('/:id/resources/:resourceId', this.deallocateResourceFromFaction.bind(this));
        
        // Faction permissions
        factions.get('/:id/permissions', this.getFactionPermissions.bind(this));
        factions.put('/:id/permissions', this.updateFactionPermissions.bind(this));
        
        // Faction wars (for territory control)
        factions.get('/:id/wars', this.getFactionWars.bind(this));
        factions.post('/:id/wars', this.declareFactionWar.bind(this));
        
        this.app.use('/api/factions', factions);
    }
    
    setupDomainRoutes() {
        const domains = Router();
        
        // GET /api/domains - List all domains
        domains.get('/', this.listDomains.bind(this));
        
        // POST /api/domains - Register domain
        domains.post('/', this.registerDomain.bind(this));
        
        // GET /api/domains/:id - Get domain
        domains.get('/:id', this.getDomain.bind(this));
        
        // PUT /api/domains/:id - Update domain
        domains.put('/:id', this.updateDomain.bind(this));
        
        // DELETE /api/domains/:id - Unregister domain
        domains.delete('/:id', this.unregisterDomain.bind(this));
        
        // Domain mappings
        domains.get('/:id/mappings', this.getDomainMappings.bind(this));
        domains.post('/:id/mappings', this.createDomainMapping.bind(this));
        
        // Domain health
        domains.get('/:id/health', this.checkDomainHealth.bind(this));
        
        this.app.use('/api/domains', domains);
    }
    
    setupSpecialEndpoints() {
        // Weather integration
        this.app.get('/api/weather/:location', this.getWeather.bind(this));
        
        // Real-time market data
        this.app.get('/api/market/:symbol', this.getMarketData.bind(this));
        
        // Binary loop integration
        this.app.post('/api/binary/process', this.processBinary.bind(this));
        
        // 3D generation integration
        this.app.post('/api/3d/generate', this.generate3D.bind(this));
        
        // Multi-format processing
        this.app.post('/api/process/:format', this.processFormat.bind(this));
        
        // Executive decisions
        this.app.post('/api/executive/decide', this.executeDecision.bind(this));
        
        // Analytics
        this.app.get('/api/analytics/usage', this.getUsageAnalytics.bind(this));
        this.app.get('/api/analytics/performance', this.getPerformanceAnalytics.bind(this));
        
        // System health
        this.app.get('/api/health', this.getSystemHealth.bind(this));
        this.app.get('/api/metrics', this.getSystemMetrics.bind(this));
        
        // WebSocket upgrade for real-time
        this.app.get('/api/realtime', this.upgradeToWebSocket.bind(this));
        
        // API documentation
        this.app.get('/api/docs', this.getAPIDocs.bind(this));
        this.app.get('/api/schema/:type', this.getResourceSchema.bind(this));
        
        // Batch processing
        this.app.post('/api/batch', this.processBatch.bind(this));
        
        // Search
        this.app.get('/api/search', this.searchResources.bind(this));
        
        // Export/Import
        this.app.get('/api/export/:type', this.exportResources.bind(this));
        this.app.post('/api/import/:type', this.importResources.bind(this));
    }
    
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Endpoint ${req.method} ${req.path} not found`,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        });
        
        // Error handler
        this.app.use((error, req, res, next) => {
            console.error('API Error:', error);
            
            const status = error.status || 500;
            
            res.status(status).json({
                error: error.name || 'Internal Server Error',
                message: error.message,
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        });
    }
    
    initializeResourceTypes() {
        // Define available resource types with schemas
        const resourceTypes = [
            {
                type: 'project',
                schema: {
                    name: { type: 'string', required: true },
                    description: { type: 'string' },
                    status: { type: 'enum', values: ['draft', 'active', 'paused', 'completed', 'cancelled'] },
                    budget: { type: 'number', min: 0 },
                    team: { type: 'array', items: { type: 'string' } },
                    faction: { type: 'string' },
                    domain: { type: 'string' }
                }
            },
            {
                type: 'ai_agent',
                schema: {
                    name: { type: 'string', required: true },
                    personality: { type: 'object' },
                    capabilities: { type: 'array', items: { type: 'string' } },
                    status: { type: 'enum', values: ['idle', 'active', 'training', 'disabled'] },
                    faction: { type: 'string' }
                }
            },
            {
                type: 'model_3d',
                schema: {
                    name: { type: 'string', required: true },
                    format: { type: 'enum', values: ['gltf', 'stl', 'obj', 'fbx'] },
                    vertices: { type: 'number' },
                    materials: { type: 'array' },
                    animations: { type: 'array' },
                    generated_from: { type: 'string' }
                }
            },
            {
                type: 'decision',
                schema: {
                    title: { type: 'string', required: true },
                    context: { type: 'object' },
                    options: { type: 'array' },
                    outcome: { type: 'string' },
                    reasoning: { type: 'string' },
                    executive: { type: 'string' }
                }
            },
            {
                type: 'domain',
                schema: {
                    name: { type: 'string', required: true },
                    url: { type: 'string', required: true },
                    faction: { type: 'string' },
                    accent: { type: 'string' },
                    capabilities: { type: 'array' },
                    api_keys: { type: 'object' }
                }
            },
            {
                type: 'faction',
                schema: {
                    name: { type: 'string', required: true },
                    accent: { type: 'string' },
                    territory: { type: 'array' },
                    resources: { type: 'object' },
                    allies: { type: 'array' },
                    enemies: { type: 'array' }
                }
            },
            {
                type: 'weather_data',
                schema: {
                    location: { type: 'string', required: true },
                    temperature: { type: 'number' },
                    conditions: { type: 'string' },
                    humidity: { type: 'number' },
                    wind_speed: { type: 'number' },
                    forecast: { type: 'array' }
                }
            },
            {
                type: 'market_data',
                schema: {
                    symbol: { type: 'string', required: true },
                    price: { type: 'number' },
                    change: { type: 'number' },
                    volume: { type: 'number' },
                    trend: { type: 'string' },
                    indicators: { type: 'object' }
                }
            }
        ];
        
        for (const resourceType of resourceTypes) {
            this.resourceTypes.set(resourceType.type, resourceType);
            this.schemas.set(resourceType.type, resourceType.schema);
        }
    }
    
    // Middleware methods
    
    authMiddleware(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authorization token required'
            });
        }
        
        // Validate token (simplified - use proper JWT validation)
        const user = this.validateToken(token);
        
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }
        
        req.user = user;
        next();
    }
    
    validateToken(token) {
        // Simplified token validation (use proper JWT in production)
        const validTokens = {
            'admin-token': { id: 'admin', role: 'admin', faction: 'admin' },
            'exec-token': { id: 'executive', role: 'executive', faction: 'neutral' },
            'dev-token': { id: 'developer', role: 'developer', faction: 'tech' }
        };
        
        return validTokens[token] || null;
    }
    
    checkRateLimit(req) {
        const key = req.ip + ':' + req.faction;
        const now = Date.now();
        const minute = Math.floor(now / 60000);
        
        if (!this.rateLimitTracker.has(key)) {
            this.rateLimitTracker.set(key, { minute, count: 0 });
        }
        
        const tracker = this.rateLimitTracker.get(key);
        
        if (tracker.minute !== minute) {
            tracker.minute = minute;
            tracker.count = 0;
        }
        
        tracker.count++;
        
        return tracker.count <= this.config.rateLimit;
    }
    
    getRateLimitReset(req) {
        const now = Date.now();
        const nextMinute = Math.floor(now / 60000) + 1;
        return new Date(nextMinute * 60000);
    }
    
    logRequest(req) {
        const entry = {
            id: req.requestId,
            method: req.method,
            path: req.path,
            faction: req.faction,
            domain: req.domain,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined
        };
        
        this.requestLog.push(entry);
        
        // Keep only last 1000 requests
        if (this.requestLog.length > 1000) {
            this.requestLog.shift();
        }
        
        console.log(`📝 ${req.method} ${req.path} [${req.faction}/${req.domain}] - ${req.requestId}`);
    }
    
    // Resource CRUD operations
    
    async listResources(req, res) {
        try {
            const {
                type,
                faction = req.faction,
                domain = req.domain,
                status,
                limit = 50,
                offset = 0,
                sort = 'created_at',
                order = 'desc',
                search
            } = req.query;
            
            let resources = Array.from(this.resources.values());
            
            // Apply filters
            if (type) {
                resources = resources.filter(r => r.type === type);
            }
            
            if (faction !== 'admin') {
                resources = resources.filter(r => r.faction === faction || r.faction === 'public');
            }
            
            if (domain !== 'admin') {
                resources = resources.filter(r => r.domain === domain || r.domain === 'public');
            }
            
            if (status) {
                resources = resources.filter(r => r.data.status === status);
            }
            
            if (search) {
                const searchLower = search.toLowerCase();
                resources = resources.filter(r => 
                    r.data.name?.toLowerCase().includes(searchLower) ||
                    r.data.description?.toLowerCase().includes(searchLower)
                );
            }
            
            // Sort
            resources.sort((a, b) => {
                const aVal = a[sort] || a.data[sort];
                const bVal = b[sort] || b.data[sort];
                
                if (order === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
            
            // Paginate
            const total = resources.length;
            const startIndex = parseInt(offset);
            const endIndex = startIndex + parseInt(limit);
            const paginatedResources = resources.slice(startIndex, endIndex);
            
            res.json({
                resources: paginatedResources,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: endIndex < total
                },
                filters: { type, faction, domain, status, search }
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async createResource(req, res) {
        try {
            const { type, data } = req.body;
            
            if (!type) {
                return res.status(400).json({ error: 'Resource type required' });
            }
            
            if (!this.resourceTypes.has(type)) {
                return res.status(400).json({ error: `Unknown resource type: ${type}` });
            }
            
            // Validate data against schema
            const schema = this.schemas.get(type);
            const validation = this.validateData(data, schema);
            
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }
            
            const resource = {
                id: uuidv4(),
                type,
                data: {
                    ...data,
                    faction: data.faction || req.faction,
                    domain: data.domain || req.domain
                },
                faction: data.faction || req.faction,
                domain: data.domain || req.domain,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: req.user?.id || 'anonymous',
                version: 1,
                history: []
            };
            
            this.resources.set(resource.id, resource);
            
            // Update faction resources
            this.updateFactionResourceCount(resource.faction, type, 1);
            
            // Emit event
            this.emit('resource:created', resource);
            
            res.status(201).json(resource);
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async listResourcesByType(req, res) {
        req.query.type = req.params.type;
        return this.listResources(req, res);
    }
    
    async createResourceOfType(req, res) {
        req.body.type = req.params.type;
        return this.createResource(req, res);
    }
    
    async getResource(req, res) {
        try {
            const { type, id } = req.params;
            const resource = this.resources.get(id);
            
            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }
            
            if (resource.type !== type) {
                return res.status(400).json({ error: 'Resource type mismatch' });
            }
            
            // Check permissions
            if (!this.canAccessResource(req, resource)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            res.json(resource);
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async updateResource(req, res) {
        try {
            const { type, id } = req.params;
            const resource = this.resources.get(id);
            
            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }
            
            if (resource.type !== type) {
                return res.status(400).json({ error: 'Resource type mismatch' });
            }
            
            // Check permissions
            if (!this.canModifyResource(req, resource)) {
                return res.status(403).json({ error: 'Modification denied' });
            }
            
            // Validate new data
            const schema = this.schemas.get(type);
            const validation = this.validateData(req.body, schema);
            
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }
            
            // Save history
            resource.history.push({
                version: resource.version,
                data: { ...resource.data },
                updated_at: resource.updated_at,
                updated_by: resource.updated_by || resource.created_by
            });
            
            // Update resource
            resource.data = req.body;
            resource.updated_at = new Date();
            resource.updated_by = req.user?.id || 'anonymous';
            resource.version++;
            
            // Emit event
            this.emit('resource:updated', resource);
            
            res.json(resource);
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async patchResource(req, res) {
        try {
            const { type, id } = req.params;
            const resource = this.resources.get(id);
            
            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }
            
            if (resource.type !== type) {
                return res.status(400).json({ error: 'Resource type mismatch' });
            }
            
            // Check permissions
            if (!this.canModifyResource(req, resource)) {
                return res.status(403).json({ error: 'Modification denied' });
            }
            
            // Save history
            resource.history.push({
                version: resource.version,
                data: { ...resource.data },
                updated_at: resource.updated_at,
                updated_by: resource.updated_by || resource.created_by
            });
            
            // Merge data
            Object.assign(resource.data, req.body);
            resource.updated_at = new Date();
            resource.updated_by = req.user?.id || 'anonymous';
            resource.version++;
            
            // Validate merged data
            const schema = this.schemas.get(type);
            const validation = this.validateData(resource.data, schema);
            
            if (!validation.valid) {
                // Rollback
                const lastHistory = resource.history.pop();
                resource.data = lastHistory.data;
                resource.updated_at = lastHistory.updated_at;
                resource.updated_by = lastHistory.updated_by;
                resource.version--;
                
                return res.status(400).json({
                    error: 'Validation failed after patch',
                    details: validation.errors
                });
            }
            
            // Emit event
            this.emit('resource:patched', resource);
            
            res.json(resource);
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async deleteResource(req, res) {
        try {
            const { type, id } = req.params;
            const resource = this.resources.get(id);
            
            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }
            
            if (resource.type !== type) {
                return res.status(400).json({ error: 'Resource type mismatch' });
            }
            
            // Check permissions
            if (!this.canDeleteResource(req, resource)) {
                return res.status(403).json({ error: 'Deletion denied' });
            }
            
            // Soft delete by default (add deleted flag)
            const hardDelete = req.query.hard === 'true';
            
            if (hardDelete) {
                this.resources.delete(id);
                this.updateFactionResourceCount(resource.faction, type, -1);
            } else {
                resource.data.deleted = true;
                resource.deleted_at = new Date();
                resource.deleted_by = req.user?.id || 'anonymous';
            }
            
            // Emit event
            this.emit('resource:deleted', { resource, hardDelete });
            
            res.status(204).send();
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // Permission checking
    
    canAccessResource(req, resource) {
        // Admin can access everything
        if (req.user?.role === 'admin') return true;
        
        // Public resources accessible to all
        if (resource.faction === 'public') return true;
        
        // Same faction access
        if (resource.faction === req.faction) return true;
        
        // Domain access
        if (resource.domain === req.domain) return true;
        
        return false;
    }
    
    canModifyResource(req, resource) {
        // Admin can modify everything
        if (req.user?.role === 'admin') return true;
        
        // Creator can modify
        if (resource.created_by === req.user?.id) return true;
        
        // Executive role can modify faction resources
        if (req.user?.role === 'executive' && resource.faction === req.faction) return true;
        
        return false;
    }
    
    canDeleteResource(req, resource) {
        // Admin can delete everything
        if (req.user?.role === 'admin') return true;
        
        // Creator can delete
        if (resource.created_by === req.user?.id) return true;
        
        // Executive role can delete faction resources
        if (req.user?.role === 'executive' && resource.faction === req.faction) return true;
        
        return false;
    }
    
    // Data validation
    
    validateData(data, schema) {
        const errors = [];
        
        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];
            
            // Required field check
            if (rules.required && (value === undefined || value === null)) {
                errors.push(`Field '${field}' is required`);
                continue;
            }
            
            // Skip validation if field is not present and not required
            if (value === undefined || value === null) continue;
            
            // Type validation
            if (rules.type === 'string' && typeof value !== 'string') {
                errors.push(`Field '${field}' must be a string`);
            } else if (rules.type === 'number' && typeof value !== 'number') {
                errors.push(`Field '${field}' must be a number`);
            } else if (rules.type === 'array' && !Array.isArray(value)) {
                errors.push(`Field '${field}' must be an array`);
            } else if (rules.type === 'object' && typeof value !== 'object') {
                errors.push(`Field '${field}' must be an object`);
            }
            
            // Enum validation
            if (rules.type === 'enum' && !rules.values.includes(value)) {
                errors.push(`Field '${field}' must be one of: ${rules.values.join(', ')}`);
            }
            
            // Number validation
            if (rules.type === 'number') {
                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`Field '${field}' must be at least ${rules.min}`);
                }
                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`Field '${field}' must be at most ${rules.max}`);
                }
            }
            
            // Array validation
            if (rules.type === 'array' && rules.items) {
                for (const item of value) {
                    const itemValidation = this.validateData({ item }, { item: rules.items });
                    if (!itemValidation.valid) {
                        errors.push(...itemValidation.errors);
                    }
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    // Faction methods
    
    async listFactions(req, res) {
        try {
            const factions = Array.from(this.factionResources.keys()).map(id => ({
                id,
                ...this.factionResources.get(id)
            }));
            
            res.json({ factions });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async createFaction(req, res) {
        try {
            const { name, accent, territory = [], allies = [], enemies = [] } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Faction name required' });
            }
            
            const factionId = createHash('sha256').update(name).digest('hex').substr(0, 12);
            
            const faction = {
                id: factionId,
                name,
                accent: accent || 'neutral',
                territory,
                allies,
                enemies,
                resources: {},
                created_at: new Date(),
                created_by: req.user?.id || 'anonymous'
            };
            
            this.factionResources.set(factionId, faction);
            
            res.status(201).json(faction);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getFaction(req, res) {
        try {
            const faction = this.factionResources.get(req.params.id);
            
            if (!faction) {
                return res.status(404).json({ error: 'Faction not found' });
            }
            
            res.json(faction);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getFactionResources(req, res) {
        try {
            const faction = this.factionResources.get(req.params.id);
            
            if (!faction) {
                return res.status(404).json({ error: 'Faction not found' });
            }
            
            const resources = Array.from(this.resources.values())
                .filter(r => r.faction === req.params.id);
            
            res.json({
                faction: faction.name,
                resourceCounts: faction.resources,
                resources
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    updateFactionResourceCount(factionId, resourceType, delta) {
        if (!this.factionResources.has(factionId)) {
            this.factionResources.set(factionId, {
                id: factionId,
                name: factionId,
                resources: {}
            });
        }
        
        const faction = this.factionResources.get(factionId);
        if (!faction.resources[resourceType]) {
            faction.resources[resourceType] = 0;
        }
        
        faction.resources[resourceType] += delta;
        
        if (faction.resources[resourceType] < 0) {
            faction.resources[resourceType] = 0;
        }
    }
    
    // Special endpoints
    
    async getWeather(req, res) {
        try {
            const { location } = req.params;
            
            // Simulate weather API (integrate with real API)
            const weather = {
                location,
                temperature: Math.floor(Math.random() * 40) + 32, // 32-72°F
                conditions: ['sunny', 'cloudy', 'rainy', 'stormy'][Math.floor(Math.random() * 4)],
                humidity: Math.floor(Math.random() * 100),
                wind_speed: Math.floor(Math.random() * 30),
                forecast: Array(5).fill(0).map((_, i) => ({
                    day: i + 1,
                    high: Math.floor(Math.random() * 40) + 32,
                    low: Math.floor(Math.random() * 20) + 32,
                    conditions: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)]
                })),
                timestamp: new Date()
            };
            
            // Store as resource
            const resource = {
                id: `weather_${location}_${Date.now()}`,
                type: 'weather_data',
                data: weather,
                faction: 'public',
                domain: 'public',
                created_at: new Date(),
                expires_at: new Date(Date.now() + 3600000) // 1 hour
            };
            
            this.resources.set(resource.id, resource);
            
            res.json(weather);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getMarketData(req, res) {
        try {
            const { symbol } = req.params;
            
            // Simulate market API
            const market = {
                symbol: symbol.toUpperCase(),
                price: Math.random() * 1000 + 10,
                change: (Math.random() - 0.5) * 20,
                volume: Math.floor(Math.random() * 1000000),
                trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
                indicators: {
                    rsi: Math.random() * 100,
                    macd: (Math.random() - 0.5) * 5,
                    sma_20: Math.random() * 1000 + 10
                },
                timestamp: new Date()
            };
            
            res.json(market);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async processBinary(req, res) {
        try {
            const { data, encoding = 'base64' } = req.body;
            
            // Forward to binary loop controller
            const response = await fetch('http://localhost:8110/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, encoding })
            });
            
            const result = await response.json();
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async generate3D(req, res) {
        try {
            const { prompt, format = 'gltf' } = req.body;
            
            // Forward to 3D generation API
            const response = await fetch('http://localhost:8116/api/generate-3d', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, format })
            });
            
            const result = await response.json();
            
            // Store as resource if successful
            if (result.success) {
                const resource = {
                    id: uuidv4(),
                    type: 'model_3d',
                    data: {
                        name: prompt.substring(0, 50),
                        format,
                        generated_from: prompt,
                        generation_id: result.generationId,
                        faction: req.faction,
                        domain: req.domain
                    },
                    faction: req.faction,
                    domain: req.domain,
                    created_at: new Date(),
                    created_by: req.user?.id || 'anonymous'
                };
                
                this.resources.set(resource.id, resource);
                result.resourceId = resource.id;
            }
            
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getSystemHealth(req, res) {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date(),
                services: {
                    api: 'healthy',
                    database: 'healthy', // Would check real DB
                    binaryLoop: await this.checkServiceHealth('http://localhost:8110/health'),
                    ai3DBridge: await this.checkServiceHealth('http://localhost:8115/status'),
                    executiveOS: await this.checkServiceHealth('http://localhost:9000/api/executive/status')
                },
                metrics: {
                    totalResources: this.resources.size,
                    totalFactions: this.factionResources.size,
                    requestsInLastHour: this.getRequestsInLastHour(),
                    uptime: process.uptime()
                }
            };
            
            // Determine overall health
            const unhealthyServices = Object.values(health.services)
                .filter(status => status !== 'healthy').length;
            
            if (unhealthyServices > 2) {
                health.status = 'critical';
            } else if (unhealthyServices > 0) {
                health.status = 'degraded';
            }
            
            res.json(health);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async checkServiceHealth(url) {
        try {
            const response = await fetch(url, { timeout: 5000 });
            return response.ok ? 'healthy' : 'unhealthy';
        } catch {
            return 'unreachable';
        }
    }
    
    getRequestsInLastHour() {
        const hourAgo = new Date(Date.now() - 3600000);
        return this.requestLog.filter(req => req.timestamp > hourAgo).length;
    }
    
    async getAPIDocs(req, res) {
        const docs = {
            title: 'REST API Resource Router',
            version: '1.0.0',
            description: 'Unified REST API with full CRUD operations and faction management',
            baseUrl: `http://localhost:${this.config.port}`,
            endpoints: {
                resources: {
                    'GET /api/resources': 'List all resources',
                    'POST /api/resources': 'Create new resource',
                    'GET /api/resources/:type': 'List resources by type',
                    'POST /api/resources/:type': 'Create resource of specific type',
                    'GET /api/resources/:type/:id': 'Get specific resource',
                    'PUT /api/resources/:type/:id': 'Update resource',
                    'PATCH /api/resources/:type/:id': 'Partial update resource',
                    'DELETE /api/resources/:type/:id': 'Delete resource'
                },
                factions: {
                    'GET /api/factions': 'List all factions',
                    'POST /api/factions': 'Create faction',
                    'GET /api/factions/:id': 'Get faction details',
                    'GET /api/factions/:id/resources': 'Get faction resources'
                },
                special: {
                    'GET /api/weather/:location': 'Get weather data',
                    'GET /api/market/:symbol': 'Get market data',
                    'POST /api/3d/generate': 'Generate 3D model',
                    'POST /api/binary/process': 'Process binary data',
                    'GET /api/health': 'System health check'
                }
            },
            resourceTypes: Array.from(this.resourceTypes.keys()),
            authentication: {
                type: 'Bearer token',
                header: 'Authorization: Bearer <token>',
                testTokens: {
                    admin: 'admin-token',
                    executive: 'exec-token',
                    developer: 'dev-token'
                }
            },
            factionHeaders: {
                'X-Faction': 'Specify faction (neutral, tech, creative, etc.)',
                'X-Domain': 'Specify domain (default, soulfra.com, etc.)'
            }
        };
        
        res.json(docs);
    }
    
    logAPIEndpoints() {
        console.log('\n📚 Available API Endpoints:');
        console.log('================================');
        console.log('🔧 Resource Management:');
        console.log('   GET    /api/resources - List all resources');
        console.log('   POST   /api/resources - Create resource');
        console.log('   GET    /api/resources/:type/:id - Get specific resource');
        console.log('   PUT    /api/resources/:type/:id - Update resource');
        console.log('   DELETE /api/resources/:type/:id - Delete resource');
        console.log('');
        console.log('👥 Faction Management:');
        console.log('   GET    /api/factions - List factions');
        console.log('   POST   /api/factions - Create faction');
        console.log('   GET    /api/factions/:id/resources - Faction resources');
        console.log('');
        console.log('🌍 Real-World Data:');
        console.log('   GET    /api/weather/:location - Weather data');
        console.log('   GET    /api/market/:symbol - Market data');
        console.log('');
        console.log('🤖 AI Integration:');
        console.log('   POST   /api/3d/generate - Generate 3D models');
        console.log('   POST   /api/binary/process - Process binary data');
        console.log('   POST   /api/executive/decide - Executive decisions');
        console.log('');
        console.log('📊 System Info:');
        console.log('   GET    /api/health - System health');
        console.log('   GET    /api/docs - API documentation');
        console.log('');
        console.log('🔑 Authentication: Bearer tokens');
        console.log('🏴 Faction Headers: X-Faction, X-Domain');
        console.log('');
    }
}

// Export for use
export default RESTAPIResourceRouter;

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const router = new RESTAPIResourceRouter();
    
    // Example usage
    setTimeout(() => {
        console.log('\n🧪 Testing API with example data...');
        
        // Create example faction
        router.factionResources.set('tech', {
            id: 'tech',
            name: 'Tech Faction',
            accent: 'silicon_valley',
            resources: { project: 5, ai_agent: 3 }
        });
        
        // Create example resources
        const exampleProject = {
            id: 'proj_001',
            type: 'project',
            data: {
                name: 'AI Assistant Platform',
                status: 'active',
                budget: 50000,
                faction: 'tech'
            },
            faction: 'tech',
            created_at: new Date()
        };
        
        router.resources.set(exampleProject.id, exampleProject);
        
        console.log('✅ Example data loaded');
        console.log(`🌐 API ready at http://localhost:${router.config.port}`);
        console.log('📖 Documentation: http://localhost:8200/api/docs');
    }, 2000);
}
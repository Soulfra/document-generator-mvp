#!/usr/bin/env node

/**
 * SCHEMA-TO-SYSTEM CONVERTER
 * Converts database schemas directly into running systems
 * No compilation needed - just read and execute
 */

const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { EventEmitter } = require('events');

class SchemaToSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            database: config.database || ':memory:',
            autoMigrate: config.autoMigrate !== false,
            generateEndpoints: config.generateEndpoints !== false,
            enableRealtimeSync: config.enableRealtimeSync !== false,
            ...config
        };
        
        // System state
        this.schemas = new Map();
        this.models = new Map();
        this.services = new Map();
        this.workflows = new Map();
        this.db = null;
        
        // Runtime system
        this.runtime = {
            tables: new Map(),
            procedures: new Map(),
            triggers: new Map(),
            views: new Map()
        };
        
        console.log('🔄 SCHEMA-TO-SYSTEM CONVERTER INITIALIZED');
    }
    
    /**
     * Load and convert schema to running system
     */
    async loadSchema(schemaPath) {
        console.log(`\n📋 Loading schema: ${schemaPath}`);
        
        const sqlContent = await fs.readFile(schemaPath, 'utf-8');
        const schemaName = path.basename(schemaPath, '.sql');
        
        // Parse schema
        const schema = await this.parseSchema(sqlContent);
        this.schemas.set(schemaName, schema);
        
        // Create database connection
        if (!this.db) {
            await this.connectDatabase();
        }
        
        // Execute schema in database
        if (this.config.autoMigrate) {
            await this.executeSchemaMigration(sqlContent);
        }
        
        // Generate runtime system
        await this.generateRuntimeSystem(schema);
        
        console.log(`✅ Schema loaded and system generated: ${schemaName}`);
        
        return {
            schema: schemaName,
            tables: schema.tables.size,
            models: this.models.size,
            services: this.services.size
        };
    }
    
    /**
     * Parse SQL schema into structured format
     */
    async parseSchema(sqlContent) {
        const schema = {
            tables: new Map(),
            indexes: new Map(),
            views: new Map(),
            procedures: new Map(),
            triggers: new Map()
        };
        
        // Remove comments
        const cleanSQL = sqlContent
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Parse CREATE TABLE statements
        const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\)(?:\s*;)?/gi;
        let match;
        
        while ((match = tableRegex.exec(cleanSQL)) !== null) {
            const tableName = match[1];
            const tableBody = match[2];
            
            const table = {
                name: tableName,
                columns: new Map(),
                constraints: [],
                relationships: []
            };
            
            // Parse columns and constraints
            this.parseTableDefinition(tableBody, table);
            
            schema.tables.set(tableName, table);
        }
        
        // Parse procedures
        const procRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?PROCEDURE\s+(\w+)\s*\((.*?)\)\s*(?:RETURNS\s+(\w+)\s*)?(?:BEGIN|AS)([\s\S]*?)END/gi;
        
        while ((match = procRegex.exec(cleanSQL)) !== null) {
            const procName = match[1];
            const params = match[2];
            const returns = match[3];
            const body = match[4];
            
            schema.procedures.set(procName, {
                name: procName,
                parameters: this.parseProcedureParams(params),
                returns,
                body
            });
        }
        
        return schema;
    }
    
    /**
     * Parse table definition
     */
    parseTableDefinition(tableBody, table) {
        const lines = tableBody.split(',').map(l => l.trim());
        
        for (const line of lines) {
            if (line.startsWith('PRIMARY KEY')) {
                const pkMatch = line.match(/PRIMARY KEY\s*\(([^)]+)\)/i);
                if (pkMatch) {
                    table.constraints.push({
                        type: 'PRIMARY KEY',
                        columns: pkMatch[1].split(',').map(c => c.trim())
                    });
                }
            } else if (line.includes('FOREIGN KEY')) {
                const fkMatch = line.match(/FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
                if (fkMatch) {
                    table.relationships.push({
                        type: 'FOREIGN KEY',
                        column: fkMatch[1].trim(),
                        referencedTable: fkMatch[2],
                        referencedColumn: fkMatch[3].trim()
                    });
                }
            } else {
                // Parse column
                const colMatch = line.match(/(\w+)\s+(\w+[^,]*)/);
                if (colMatch) {
                    const columnName = colMatch[1];
                    const columnDef = colMatch[2];
                    
                    table.columns.set(columnName, {
                        name: columnName,
                        type: this.extractColumnType(columnDef),
                        nullable: !line.includes('NOT NULL'),
                        unique: line.includes('UNIQUE'),
                        default: this.extractDefault(line),
                        autoIncrement: line.includes('AUTOINCREMENT') || line.includes('AUTO_INCREMENT'),
                        primaryKey: line.includes('PRIMARY KEY')
                    });
                }
            }
        }
    }
    
    /**
     * Connect to database
     */
    async connectDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.config.database, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`📀 Connected to database: ${this.config.database}`);
                    resolve();
                }
            });
        });
    }
    
    /**
     * Execute schema migration
     */
    async executeSchemaMigration(sqlContent) {
        console.log('🔄 Executing schema migration...');
        
        return new Promise((resolve, reject) => {
            this.db.exec(sqlContent, (err) => {
                if (err) {
                    console.error('❌ Migration failed:', err);
                    reject(err);
                } else {
                    console.log('✅ Schema migration completed');
                    resolve();
                }
            });
        });
    }
    
    /**
     * Generate runtime system from schema
     */
    async generateRuntimeSystem(schema) {
        console.log('⚙️ Generating runtime system...');
        
        // Generate models
        for (const [tableName, table] of schema.tables) {
            const model = this.generateModel(tableName, table);
            this.models.set(tableName, model);
        }
        
        // Generate services
        for (const [tableName, table] of schema.tables) {
            const service = this.generateService(tableName, table);
            this.services.set(tableName, service);
        }
        
        // Generate workflows from procedures
        for (const [procName, procedure] of schema.procedures) {
            const workflow = this.generateWorkflow(procName, procedure);
            this.workflows.set(procName, workflow);
        }
        
        // Set up real-time sync if enabled
        if (this.config.enableRealtimeSync) {
            this.setupRealtimeSync();
        }
    }
    
    /**
     * Generate model from table
     */
    generateModel(tableName, table) {
        const model = {
            name: tableName,
            columns: table.columns,
            
            // Create new instance
            create: async (data) => {
                const columns = [];
                const values = [];
                const placeholders = [];
                
                for (const [colName, colDef] of table.columns) {
                    if (data[colName] !== undefined && !colDef.autoIncrement) {
                        columns.push(colName);
                        values.push(data[colName]);
                        placeholders.push('?');
                    }
                }
                
                const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
                
                return new Promise((resolve, reject) => {
                    this.db.run(query, values, function(err) {
                        if (err) reject(err);
                        else resolve({ id: this.lastID, ...data });
                    });
                });
            },
            
            // Find by ID
            findById: async (id) => {
                const primaryKey = this.getPrimaryKey(table);
                const query = `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`;
                
                return new Promise((resolve, reject) => {
                    this.db.get(query, [id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
            },
            
            // Find all
            findAll: async (conditions = {}) => {
                let query = `SELECT * FROM ${tableName}`;
                const params = [];
                
                if (Object.keys(conditions).length > 0) {
                    const wheres = Object.keys(conditions).map(col => {
                        params.push(conditions[col]);
                        return `${col} = ?`;
                    });
                    query += ` WHERE ${wheres.join(' AND ')}`;
                }
                
                return new Promise((resolve, reject) => {
                    this.db.all(query, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });
            },
            
            // Update
            update: async (id, data) => {
                const primaryKey = this.getPrimaryKey(table);
                const sets = [];
                const values = [];
                
                for (const [key, value] of Object.entries(data)) {
                    if (key !== primaryKey && table.columns.has(key)) {
                        sets.push(`${key} = ?`);
                        values.push(value);
                    }
                }
                
                values.push(id);
                const query = `UPDATE ${tableName} SET ${sets.join(', ')} WHERE ${primaryKey} = ?`;
                
                return new Promise((resolve, reject) => {
                    this.db.run(query, values, function(err) {
                        if (err) reject(err);
                        else resolve({ id, ...data, changes: this.changes });
                    });
                });
            },
            
            // Delete
            delete: async (id) => {
                const primaryKey = this.getPrimaryKey(table);
                const query = `DELETE FROM ${tableName} WHERE ${primaryKey} = ?`;
                
                return new Promise((resolve, reject) => {
                    this.db.run(query, [id], function(err) {
                        if (err) reject(err);
                        else resolve(this.changes > 0);
                    });
                });
            },
            
            // Execute raw query
            query: async (sql, params = []) => {
                return new Promise((resolve, reject) => {
                    if (sql.trim().toUpperCase().startsWith('SELECT')) {
                        this.db.all(sql, params, (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        });
                    } else {
                        this.db.run(sql, params, function(err) {
                            if (err) reject(err);
                            else resolve({ changes: this.changes, lastID: this.lastID });
                        });
                    }
                });
            }
        };
        
        return model;
    }
    
    /**
     * Generate service from table
     */
    generateService(tableName, table) {
        const model = this.models.get(tableName);
        
        const service = {
            model,
            
            // Business logic methods
            createWithValidation: async (data) => {
                // Validate required fields
                for (const [colName, colDef] of table.columns) {
                    if (!colDef.nullable && !colDef.autoIncrement && !colDef.default) {
                        if (!data[colName]) {
                            throw new Error(`${colName} is required`);
                        }
                    }
                }
                
                // Apply defaults
                for (const [colName, colDef] of table.columns) {
                    if (colDef.default && data[colName] === undefined) {
                        data[colName] = colDef.default;
                    }
                }
                
                return model.create(data);
            },
            
            // Find with relationships
            findWithRelations: async (id) => {
                const item = await model.findById(id);
                if (!item) return null;
                
                // Load related data
                for (const rel of table.relationships) {
                    if (rel.type === 'FOREIGN KEY') {
                        const relatedModel = this.models.get(rel.referencedTable);
                        if (relatedModel && item[rel.column]) {
                            item[rel.referencedTable] = await relatedModel.findById(item[rel.column]);
                        }
                    }
                }
                
                return item;
            },
            
            // Bulk operations
            bulkCreate: async (items) => {
                const results = [];
                for (const item of items) {
                    try {
                        const created = await this.createWithValidation(item);
                        results.push({ success: true, data: created });
                    } catch (error) {
                        results.push({ success: false, error: error.message });
                    }
                }
                return results;
            },
            
            // Search functionality
            search: async (query) => {
                const searchableColumns = [];
                
                for (const [colName, colDef] of table.columns) {
                    if (colDef.type.includes('TEXT') || colDef.type.includes('VARCHAR')) {
                        searchableColumns.push(colName);
                    }
                }
                
                if (searchableColumns.length === 0) {
                    return [];
                }
                
                const conditions = searchableColumns
                    .map(col => `${col} LIKE ?`)
                    .join(' OR ');
                
                const params = searchableColumns.map(() => `%${query}%`);
                
                const sql = `SELECT * FROM ${tableName} WHERE ${conditions}`;
                return model.query(sql, params);
            },
            
            // Aggregate functions
            count: async (conditions = {}) => {
                let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
                const params = [];
                
                if (Object.keys(conditions).length > 0) {
                    const wheres = Object.keys(conditions).map(col => {
                        params.push(conditions[col]);
                        return `${col} = ?`;
                    });
                    sql += ` WHERE ${wheres.join(' AND ')}`;
                }
                
                const result = await model.query(sql, params);
                return result[0].count;
            },
            
            // Custom business logic based on table name
            ...this.generateCustomMethods(tableName, table)
        };
        
        return service;
    }
    
    /**
     * Generate custom methods based on table patterns
     */
    generateCustomMethods(tableName, table) {
        const methods = {};
        
        // Document-related tables
        if (tableName.toLowerCase().includes('document')) {
            methods.processDocument = async (id) => {
                const doc = await this.model.findById(id);
                if (!doc) throw new Error('Document not found');
                
                // Update status
                await this.model.update(id, { 
                    status: 'processing',
                    processed_at: new Date().toISOString()
                });
                
                // Simulate processing
                setTimeout(async () => {
                    await this.model.update(id, { status: 'completed' });
                }, 1000);
                
                return { id, status: 'processing' };
            };
        }
        
        // User/Agent tables
        if (tableName.toLowerCase().includes('user') || tableName.toLowerCase().includes('agent')) {
            methods.authenticate = async (username, password) => {
                const users = await this.model.findAll({ username });
                if (users.length === 0) return null;
                
                const user = users[0];
                // In production, use proper password hashing
                if (user.password === password) {
                    return { ...user, password: undefined };
                }
                return null;
            };
            
            methods.updateLastActive = async (id) => {
                return this.model.update(id, {
                    last_active: new Date().toISOString()
                });
            };
        }
        
        // Revenue/Transaction tables
        if (tableName.toLowerCase().includes('revenue') || tableName.toLowerCase().includes('transaction')) {
            methods.calculateTotal = async (startDate, endDate) => {
                const sql = `
                    SELECT SUM(amount) as total 
                    FROM ${tableName} 
                    WHERE created_at >= ? AND created_at <= ?
                `;
                const result = await this.model.query(sql, [startDate, endDate]);
                return result[0].total || 0;
            };
            
            methods.getByDateRange = async (startDate, endDate) => {
                const sql = `
                    SELECT * FROM ${tableName} 
                    WHERE created_at >= ? AND created_at <= ?
                    ORDER BY created_at DESC
                `;
                return this.model.query(sql, [startDate, endDate]);
            };
        }
        
        return methods;
    }
    
    /**
     * Generate workflow from procedure
     */
    generateWorkflow(procName, procedure) {
        return {
            name: procName,
            parameters: procedure.parameters,
            
            execute: async (...args) => {
                // Map parameters to arguments
                const params = {};
                procedure.parameters.forEach((param, index) => {
                    params[param.name] = args[index];
                });
                
                // Execute procedure logic
                // In a real implementation, this would parse and execute the procedure body
                console.log(`Executing workflow: ${procName}`, params);
                
                // For now, return mock result
                return {
                    workflow: procName,
                    params,
                    executed: new Date(),
                    result: 'success'
                };
            }
        };
    }
    
    /**
     * Set up real-time synchronization
     */
    setupRealtimeSync() {
        console.log('🔄 Setting up real-time synchronization...');
        
        // Listen for database changes
        this.db.on('profile', (sql, time) => {
            if (sql.toUpperCase().startsWith('INSERT') ||
                sql.toUpperCase().startsWith('UPDATE') ||
                sql.toUpperCase().startsWith('DELETE')) {
                
                // Extract table name from SQL
                const tableMatch = sql.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i);
                if (tableMatch) {
                    const tableName = tableMatch[1];
                    this.emit('data-change', {
                        table: tableName,
                        operation: sql.split(' ')[0].toUpperCase(),
                        timestamp: new Date()
                    });
                }
            }
        });
    }
    
    /**
     * Create REST API endpoints dynamically
     */
    createRESTEndpoints() {
        const express = require('express');
        const app = express();
        app.use(express.json());
        
        // Generate endpoints for each table
        for (const [tableName, service] of this.services) {
            const basePath = `/api/${tableName.toLowerCase()}`;
            
            // GET all
            app.get(basePath, async (req, res) => {
                try {
                    const items = await service.model.findAll(req.query);
                    res.json({ success: true, data: items });
                } catch (error) {
                    res.status(500).json({ success: false, error: error.message });
                }
            });
            
            // GET by ID
            app.get(`${basePath}/:id`, async (req, res) => {
                try {
                    const item = await service.findWithRelations(req.params.id);
                    if (!item) {
                        return res.status(404).json({ success: false, error: 'Not found' });
                    }
                    res.json({ success: true, data: item });
                } catch (error) {
                    res.status(500).json({ success: false, error: error.message });
                }
            });
            
            // POST create
            app.post(basePath, async (req, res) => {
                try {
                    const item = await service.createWithValidation(req.body);
                    res.status(201).json({ success: true, data: item });
                } catch (error) {
                    res.status(400).json({ success: false, error: error.message });
                }
            });
            
            // PUT update
            app.put(`${basePath}/:id`, async (req, res) => {
                try {
                    const item = await service.model.update(req.params.id, req.body);
                    res.json({ success: true, data: item });
                } catch (error) {
                    res.status(400).json({ success: false, error: error.message });
                }
            });
            
            // DELETE
            app.delete(`${basePath}/:id`, async (req, res) => {
                try {
                    const deleted = await service.model.delete(req.params.id);
                    if (!deleted) {
                        return res.status(404).json({ success: false, error: 'Not found' });
                    }
                    res.json({ success: true, message: 'Deleted successfully' });
                } catch (error) {
                    res.status(500).json({ success: false, error: error.message });
                }
            });
            
            // Search endpoint
            app.get(`${basePath}/search/:query`, async (req, res) => {
                try {
                    const results = await service.search(req.params.query);
                    res.json({ success: true, data: results });
                } catch (error) {
                    res.status(500).json({ success: false, error: error.message });
                }
            });
        }
        
        // Workflow endpoints
        for (const [workflowName, workflow] of this.workflows) {
            app.post(`/api/workflows/${workflowName}`, async (req, res) => {
                try {
                    const result = await workflow.execute(...Object.values(req.body));
                    res.json({ success: true, data: result });
                } catch (error) {
                    res.status(500).json({ success: false, error: error.message });
                }
            });
        }
        
        return app;
    }
    
    /**
     * Get system information
     */
    getSystemInfo() {
        return {
            schemas: Array.from(this.schemas.keys()),
            models: Array.from(this.models.keys()),
            services: Array.from(this.services.keys()),
            workflows: Array.from(this.workflows.keys()),
            database: this.config.database,
            features: {
                autoMigrate: this.config.autoMigrate,
                generateEndpoints: this.config.generateEndpoints,
                enableRealtimeSync: this.config.enableRealtimeSync
            }
        };
    }
    
    // Helper methods
    getPrimaryKey(table) {
        for (const constraint of table.constraints) {
            if (constraint.type === 'PRIMARY KEY') {
                return constraint.columns[0];
            }
        }
        
        for (const [colName, colDef] of table.columns) {
            if (colDef.primaryKey) {
                return colName;
            }
        }
        
        return 'id'; // Default
    }
    
    extractColumnType(columnDef) {
        const typeMatch = columnDef.match(/^(\w+)/);
        return typeMatch ? typeMatch[1].toUpperCase() : 'TEXT';
    }
    
    extractDefault(line) {
        const defaultMatch = line.match(/DEFAULT\s+(.+?)(?:\s|,|$)/i);
        if (defaultMatch) {
            let value = defaultMatch[1].trim();
            // Remove quotes
            if ((value.startsWith("'") && value.endsWith("'")) ||
                (value.startsWith('"') && value.endsWith('"'))) {
                value = value.slice(1, -1);
            }
            return value;
        }
        return null;
    }
    
    parseProcedureParams(paramString) {
        if (!paramString.trim()) return [];
        
        return paramString.split(',').map(param => {
            const parts = param.trim().split(/\s+/);
            return {
                name: parts[0],
                type: parts[1] || 'ANY',
                direction: parts[2] || 'IN'
            };
        });
    }
}

// Export for use
module.exports = SchemaToSystem;

// CLI usage
if (require.main === module) {
    const converter = new SchemaToSystem({
        database: './runtime.db',
        autoMigrate: true,
        generateEndpoints: true,
        enableRealtimeSync: true
    });
    
    const schemaFile = process.argv[2] || './schema.sql';
    
    console.log(`
🔄 SCHEMA-TO-SYSTEM CONVERTER
Converting ${schemaFile} to running system...
    `);
    
    converter.loadSchema(schemaFile)
        .then(result => {
            console.log('\n✨ System generated successfully!');
            console.log(result);
            
            // Start REST API if endpoints enabled
            if (converter.config.generateEndpoints) {
                const app = converter.createRESTEndpoints();
                const port = process.env.PORT || 3001;
                
                app.listen(port, () => {
                    console.log(`\n🌐 REST API running on http://localhost:${port}`);
                    console.log('📚 System info:', converter.getSystemInfo());
                });
            }
        })
        .catch(error => {
            console.error('\n❌ Conversion failed:', error);
            process.exit(1);
        });
}
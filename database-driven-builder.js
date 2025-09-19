#!/usr/bin/env node

/**
 * DATABASE-DRIVEN BUILDER
 * Reads SQL schemas and generates complete systems automatically
 * No DSL needed - the database IS the specification
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class DatabaseDrivenBuilder extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            schemaPath: config.schemaPath || './schema.sql',
            outputDir: config.outputDir || './generated-systems',
            generateAPI: config.generateAPI !== false,
            generateUI: config.generateUI !== false,
            generateTests: config.generateTests !== false,
            database: config.database || 'sqlite',
            ...config
        };
        
        // Parsed schema data
        this.tables = new Map();
        this.relationships = new Map();
        this.procedures = new Map();
        this.indexes = new Map();
        
        // Generated code
        this.generatedModels = new Map();
        this.generatedAPIs = new Map();
        this.generatedServices = new Map();
        
        console.log('🗄️ DATABASE-DRIVEN BUILDER INITIALIZED');
        console.log('📋 Building systems directly from SQL schemas');
    }
    
    /**
     * Build complete system from database schema
     */
    async buildFromSchema(schemaFile = null) {
        const schema = schemaFile || this.config.schemaPath;
        console.log(`\n🔨 Building system from schema: ${schema}`);
        
        try {
            // Step 1: Parse SQL schema
            const sqlContent = await fs.readFile(schema, 'utf-8');
            await this.parseSQLSchema(sqlContent);
            
            // Step 2: Generate data models
            await this.generateDataModels();
            
            // Step 3: Generate services
            await this.generateServices();
            
            // Step 4: Generate REST APIs
            if (this.config.generateAPI) {
                await this.generateAPIs();
            }
            
            // Step 5: Generate UI components
            if (this.config.generateUI) {
                await this.generateUIComponents();
            }
            
            // Step 6: Generate tests
            if (this.config.generateTests) {
                await this.generateTests();
            }
            
            // Step 7: Generate main application
            await this.generateMainApplication();
            
            // Step 8: Generate deployment config
            await this.generateDeploymentConfig();
            
            console.log('\n✅ System built successfully!');
            
            return {
                tables: Array.from(this.tables.keys()),
                models: Array.from(this.generatedModels.keys()),
                apis: Array.from(this.generatedAPIs.keys()),
                services: Array.from(this.generatedServices.keys()),
                outputDir: this.config.outputDir
            };
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            throw error;
        }
    }
    
    /**
     * Parse SQL schema file
     */
    async parseSQLSchema(sqlContent) {
        console.log('📖 Parsing SQL schema...');
        
        // Remove comments
        const cleanSQL = sqlContent
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Parse CREATE TABLE statements
        const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi;
        let match;
        
        while ((match = tableRegex.exec(cleanSQL)) !== null) {
            const tableName = match[1];
            const tableBody = match[2];
            
            const table = {
                name: tableName,
                columns: [],
                primaryKey: null,
                foreignKeys: [],
                indexes: []
            };
            
            // Parse columns
            const lines = tableBody.split(',').map(l => l.trim());
            
            for (const line of lines) {
                if (line.startsWith('PRIMARY KEY')) {
                    const pkMatch = line.match(/PRIMARY KEY\s*\(([^)]+)\)/i);
                    if (pkMatch) {
                        table.primaryKey = pkMatch[1].trim();
                    }
                } else if (line.includes('FOREIGN KEY')) {
                    const fkMatch = line.match(/FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
                    if (fkMatch) {
                        table.foreignKeys.push({
                            column: fkMatch[1].trim(),
                            referencedTable: fkMatch[2],
                            referencedColumn: fkMatch[3].trim()
                        });
                    }
                } else if (line.includes('REFERENCES')) {
                    // Inline foreign key
                    const refMatch = line.match(/(\w+)\s+.*?\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
                    if (refMatch) {
                        table.foreignKeys.push({
                            column: refMatch[1],
                            referencedTable: refMatch[2],
                            referencedColumn: refMatch[3].trim()
                        });
                    }
                } else {
                    // Regular column
                    const colMatch = line.match(/(\w+)\s+(\w+[^,]*)/);
                    if (colMatch) {
                        const column = {
                            name: colMatch[1],
                            type: this.normalizeDataType(colMatch[2]),
                            nullable: !line.includes('NOT NULL'),
                            unique: line.includes('UNIQUE'),
                            default: this.extractDefault(line),
                            autoIncrement: line.includes('AUTOINCREMENT') || line.includes('AUTO_INCREMENT')
                        };
                        
                        if (line.includes('PRIMARY KEY')) {
                            table.primaryKey = column.name;
                        }
                        
                        table.columns.push(column);
                    }
                }
            }
            
            this.tables.set(tableName, table);
            console.log(`  ✓ Parsed table: ${tableName} (${table.columns.length} columns)`);
        }
        
        // Parse CREATE INDEX statements
        const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/gi;
        
        while ((match = indexRegex.exec(cleanSQL)) !== null) {
            const indexName = match[1];
            const tableName = match[2];
            const columns = match[3].split(',').map(c => c.trim());
            
            this.indexes.set(indexName, {
                table: tableName,
                columns,
                unique: match[0].includes('UNIQUE')
            });
        }
        
        console.log(`✅ Parsed ${this.tables.size} tables, ${this.indexes.size} indexes`);
    }
    
    /**
     * Generate data models from tables
     */
    async generateDataModels() {
        console.log('\n🏗️ Generating data models...');
        
        await fs.mkdir(path.join(this.config.outputDir, 'models'), { recursive: true });
        
        for (const [tableName, table] of this.tables) {
            const modelName = this.tableNameToModelName(tableName);
            const modelCode = this.generateModelCode(modelName, table);
            
            const modelPath = path.join(this.config.outputDir, 'models', `${modelName}.js`);
            await fs.writeFile(modelPath, modelCode);
            
            this.generatedModels.set(modelName, {
                path: modelPath,
                table: tableName,
                className: modelName
            });
            
            console.log(`  ✓ Generated model: ${modelName}`);
        }
    }
    
    /**
     * Generate model code for a table
     */
    generateModelCode(modelName, table) {
        const code = [`/**
 * ${modelName} Model
 * Generated from table: ${table.name}
 */

class ${modelName} {
    constructor(data = {}) {`];
        
        // Add properties
        for (const column of table.columns) {
            const jsType = this.sqlTypeToJSType(column.type);
            const defaultValue = this.getJSDefaultValue(column);
            code.push(`        this.${column.name} = data.${column.name} || ${defaultValue};`);
        }
        
        code.push(`    }
    
    /**
     * Validate model data
     */
    validate() {
        const errors = [];`);
        
        // Add validation
        for (const column of table.columns) {
            if (!column.nullable && !column.autoIncrement) {
                code.push(`        
        if (!this.${column.name}) {
            errors.push('${column.name} is required');
        }`);
            }
        }
        
        code.push(`        
        return errors.length === 0 ? null : errors;
    }
    
    /**
     * Convert to database object
     */
    toDatabase() {
        return {`);
        
        for (const column of table.columns) {
            code.push(`            ${column.name}: this.${column.name},`);
        }
        
        code.push(`        };
    }
    
    /**
     * Create from database row
     */
    static fromDatabase(row) {
        return new ${modelName}(row);
    }
    
    /**
     * Get table name
     */
    static get tableName() {
        return '${table.name}';
    }
    
    /**
     * Get primary key field
     */
    static get primaryKey() {
        return '${table.primaryKey || 'id'}';
    }
}

module.exports = ${modelName};`);
        
        return code.join('\n');
    }
    
    /**
     * Generate services for business logic
     */
    async generateServices() {
        console.log('\n🔧 Generating services...');
        
        await fs.mkdir(path.join(this.config.outputDir, 'services'), { recursive: true });
        
        // Generate base service
        await this.generateBaseService();
        
        // Generate service for each table
        for (const [tableName, table] of this.tables) {
            const modelName = this.tableNameToModelName(tableName);
            const serviceName = `${modelName}Service`;
            const serviceCode = this.generateServiceCode(serviceName, modelName, table);
            
            const servicePath = path.join(this.config.outputDir, 'services', `${serviceName}.js`);
            await fs.writeFile(servicePath, serviceCode);
            
            this.generatedServices.set(serviceName, {
                path: servicePath,
                model: modelName,
                table: tableName
            });
            
            console.log(`  ✓ Generated service: ${serviceName}`);
        }
    }
    
    /**
     * Generate base service class
     */
    async generateBaseService() {
        const baseServiceCode = `/**
 * Base Service Class
 * Provides common database operations
 */

const Database = require('../database');

class BaseService {
    constructor(modelClass) {
        this.Model = modelClass;
        this.tableName = modelClass.tableName;
        this.primaryKey = modelClass.primaryKey;
    }
    
    async findAll(conditions = {}) {
        const query = this.buildSelectQuery(conditions);
        const rows = await Database.query(query.sql, query.params);
        return rows.map(row => this.Model.fromDatabase(row));
    }
    
    async findById(id) {
        const query = \`SELECT * FROM \${this.tableName} WHERE \${this.primaryKey} = ?\`;
        const rows = await Database.query(query, [id]);
        return rows.length > 0 ? this.Model.fromDatabase(rows[0]) : null;
    }
    
    async create(data) {
        const model = new this.Model(data);
        const errors = model.validate();
        
        if (errors) {
            throw new Error(\`Validation failed: \${errors.join(', ')}\`);
        }
        
        const dbData = model.toDatabase();
        const columns = Object.keys(dbData);
        const values = Object.values(dbData);
        const placeholders = columns.map(() => '?').join(', ');
        
        const query = \`INSERT INTO \${this.tableName} (\${columns.join(', ')}) VALUES (\${placeholders})\`;
        const result = await Database.query(query, values);
        
        model[this.primaryKey] = result.insertId;
        return model;
    }
    
    async update(id, data) {
        const model = await this.findById(id);
        if (!model) {
            throw new Error(\`\${this.Model.name} not found\`);
        }
        
        Object.assign(model, data);
        const errors = model.validate();
        
        if (errors) {
            throw new Error(\`Validation failed: \${errors.join(', ')}\`);
        }
        
        const dbData = model.toDatabase();
        delete dbData[this.primaryKey];
        
        const sets = Object.keys(dbData).map(col => \`\${col} = ?\`).join(', ');
        const values = Object.values(dbData);
        values.push(id);
        
        const query = \`UPDATE \${this.tableName} SET \${sets} WHERE \${this.primaryKey} = ?\`;
        await Database.query(query, values);
        
        return model;
    }
    
    async delete(id) {
        const query = \`DELETE FROM \${this.tableName} WHERE \${this.primaryKey} = ?\`;
        const result = await Database.query(query, [id]);
        return result.affectedRows > 0;
    }
    
    buildSelectQuery(conditions) {
        let sql = \`SELECT * FROM \${this.tableName}\`;
        const params = [];
        
        if (Object.keys(conditions).length > 0) {
            const wheres = Object.keys(conditions).map(col => \`\${col} = ?\`);
            sql += \` WHERE \${wheres.join(' AND ')}\`;
            params.push(...Object.values(conditions));
        }
        
        return { sql, params };
    }
}

module.exports = BaseService;`;
        
        const basePath = path.join(this.config.outputDir, 'services', 'BaseService.js');
        await fs.writeFile(basePath, baseServiceCode);
    }
    
    /**
     * Generate service code for a model
     */
    generateServiceCode(serviceName, modelName, table) {
        const code = [`/**
 * ${serviceName}
 * Business logic for ${modelName}
 */

const BaseService = require('./BaseService');
const ${modelName} = require('../models/${modelName}');

class ${serviceName} extends BaseService {
    constructor() {
        super(${modelName});
    }`];
        
        // Add custom methods based on table relationships
        for (const fk of table.foreignKeys) {
            const relatedModel = this.tableNameToModelName(fk.referencedTable);
            code.push(`
    
    /**
     * Get related ${relatedModel}
     */
    async get${relatedModel}(${table.primaryKey}) {
        const ${modelName.toLowerCase()} = await this.findById(${table.primaryKey});
        if (!${modelName.toLowerCase()}) return null;
        
        const ${relatedModel}Service = require('./${relatedModel}Service');
        const service = new ${relatedModel}Service();
        return service.findById(${modelName.toLowerCase()}.${fk.column});
    }`);
        }
        
        // Add business logic methods
        code.push(`
    
    /**
     * Custom business logic methods
     */
    
    async findActive() {
        return this.findAll({ status: 'active' });
    }
    
    async search(query) {
        // Implement search logic based on table columns
        const searchableColumns = ${JSON.stringify(
            table.columns
                .filter(col => col.type.includes('TEXT') || col.type.includes('VARCHAR'))
                .map(col => col.name)
        )};
        
        // This would be implemented with proper SQL LIKE queries
        return this.findAll();
    }`);
        
        code.push(`}

module.exports = ${serviceName};`);
        
        return code.join('\n');
    }
    
    /**
     * Generate REST APIs
     */
    async generateAPIs() {
        console.log('\n🌐 Generating REST APIs...');
        
        await fs.mkdir(path.join(this.config.outputDir, 'api'), { recursive: true });
        
        // Generate Express router for each service
        for (const [serviceName, serviceInfo] of this.generatedServices) {
            const routerCode = this.generateRouterCode(serviceName, serviceInfo);
            const routerPath = path.join(this.config.outputDir, 'api', `${serviceInfo.model.toLowerCase()}.js`);
            
            await fs.writeFile(routerPath, routerCode);
            
            this.generatedAPIs.set(serviceInfo.model, {
                path: routerPath,
                endpoints: [
                    `GET /api/${serviceInfo.table}`,
                    `GET /api/${serviceInfo.table}/:id`,
                    `POST /api/${serviceInfo.table}`,
                    `PUT /api/${serviceInfo.table}/:id`,
                    `DELETE /api/${serviceInfo.table}/:id`
                ]
            });
            
            console.log(`  ✓ Generated API: /api/${serviceInfo.table}`);
        }
        
        // Generate main API router
        await this.generateMainRouter();
    }
    
    /**
     * Generate router code for a service
     */
    generateRouterCode(serviceName, serviceInfo) {
        return `/**
 * REST API for ${serviceInfo.model}
 * Auto-generated from database schema
 */

const express = require('express');
const router = express.Router();
const ${serviceName} = require('../services/${serviceName}');

const service = new ${serviceName}();

// GET all ${serviceInfo.table}
router.get('/', async (req, res) => {
    try {
        const items = await service.findAll(req.query);
        res.json({
            success: true,
            data: items,
            count: items.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET single ${serviceInfo.model} by ID
router.get('/:id', async (req, res) => {
    try {
        const item = await service.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                error: '${serviceInfo.model} not found'
            });
        }
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST create new ${serviceInfo.model}
router.post('/', async (req, res) => {
    try {
        const item = await service.create(req.body);
        res.status(201).json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// PUT update ${serviceInfo.model}
router.put('/:id', async (req, res) => {
    try {
        const item = await service.update(req.params.id, req.body);
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE ${serviceInfo.model}
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await service.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: '${serviceInfo.model} not found'
            });
        }
        res.json({
            success: true,
            message: '${serviceInfo.model} deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;`;
    }
    
    /**
     * Generate main Express application
     */
    async generateMainApplication() {
        console.log('\n🚀 Generating main application...');
        
        const appCode = `/**
 * Main Application
 * Auto-generated from database schema
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
${Array.from(this.generatedAPIs.entries()).map(([model, info]) => 
    `app.use('/api/${this.tables.get(this.modelNameToTableName(model)).name}', require('./api/${model.toLowerCase()}'));`
).join('\n')}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        database: Database.isConnected() ? 'connected' : 'disconnected'
    });
});

// API documentation
app.get('/api', (req, res) => {
    res.json({
        version: '1.0.0',
        endpoints: {
${Array.from(this.generatedAPIs.entries()).map(([model, info]) => 
    `            '${model}': ${JSON.stringify(info.endpoints)},`
).join('\n')}
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
async function start() {
    try {
        // Initialize database
        await Database.connect();
        console.log('✅ Database connected');
        
        // Start server
        app.listen(PORT, () => {
            console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
            console.log(\`📚 API documentation: http://localhost:\${PORT}/api\`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\\n👋 Shutting down gracefully...');
    await Database.disconnect();
    process.exit(0);
});

// Start the application
start();

module.exports = app;`;
        
        await fs.writeFile(path.join(this.config.outputDir, 'app.js'), appCode);
        
        // Generate database connection module
        await this.generateDatabaseModule();
        
        // Generate package.json
        await this.generatePackageJSON();
    }
    
    /**
     * Generate database connection module
     */
    async generateDatabaseModule() {
        const dbCode = `/**
 * Database Connection Module
 * Auto-configured based on schema
 */

const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

class Database {
    constructor() {
        this.db = null;
    }
    
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(
                process.env.DATABASE_PATH || './database.sqlite',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
            
            // Promisify methods
            this.run = promisify(this.db.run.bind(this.db));
            this.get = promisify(this.db.get.bind(this.db));
            this.all = promisify(this.db.all.bind(this.db));
        });
    }
    
    async query(sql, params = []) {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            return this.all(sql, params);
        } else {
            const result = await this.run(sql, params);
            return {
                insertId: result.lastID,
                affectedRows: result.changes
            };
        }
    }
    
    isConnected() {
        return this.db !== null;
    }
    
    async disconnect() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close(() => resolve());
            });
        }
    }
}

module.exports = new Database();`;
        
        await fs.writeFile(path.join(this.config.outputDir, 'database.js'), dbCode);
    }
    
    /**
     * Generate package.json
     */
    async generatePackageJSON() {
        const packageJSON = {
            name: "database-driven-system",
            version: "1.0.0",
            description: "Auto-generated system from database schema",
            main: "app.js",
            scripts: {
                start: "node app.js",
                dev: "nodemon app.js",
                test: "jest",
                "init-db": "node init-database.js"
            },
            dependencies: {
                express: "^4.18.2",
                cors: "^2.8.5",
                morgan: "^1.10.0",
                sqlite3: "^5.1.6"
            },
            devDependencies: {
                nodemon: "^3.0.1",
                jest: "^29.5.0"
            }
        };
        
        await fs.writeFile(
            path.join(this.config.outputDir, 'package.json'),
            JSON.stringify(packageJSON, null, 2)
        );
    }
    
    /**
     * Generate UI components
     */
    async generateUIComponents() {
        console.log('\n🎨 Generating UI components...');
        
        await fs.mkdir(path.join(this.config.outputDir, 'ui'), { recursive: true });
        
        // Generate simple HTML interface
        const uiCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database-Driven System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .table-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .table-card {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .table-card:hover {
            background-color: #f0f0f0;
            transform: translateY(-2px);
        }
        .data-grid {
            margin: 20px 0;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #4CAF50;
            color: white;
        }
        .actions {
            margin: 20px 0;
        }
        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 0 5px;
            cursor: pointer;
            border-radius: 4px;
        }
        button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Database-Driven System</h1>
        <p>Auto-generated from SQL schema</p>
        
        <h2>Available Tables</h2>
        <div id="tableList" class="table-list"></div>
        
        <div id="dataView" style="display: none;">
            <h2 id="tableName"></h2>
            <div class="actions">
                <button onclick="loadData()">Refresh</button>
                <button onclick="showAddForm()">Add New</button>
                <button onclick="backToList()">Back to Tables</button>
            </div>
            <div id="dataGrid" class="data-grid"></div>
        </div>
    </div>
    
    <script>
        const API_BASE = 'http://localhost:3000/api';
        let currentTable = null;
        
        // Load available tables
        async function loadTables() {
            try {
                const response = await fetch(API_BASE);
                const data = await response.json();
                
                const tableList = document.getElementById('tableList');
                tableList.innerHTML = '';
                
                Object.keys(data.endpoints).forEach(table => {
                    const card = document.createElement('div');
                    card.className = 'table-card';
                    card.innerHTML = \`
                        <h3>\${table}</h3>
                        <p>\${data.endpoints[table].length} endpoints</p>
                    \`;
                    card.onclick = () => showTable(table);
                    tableList.appendChild(card);
                });
            } catch (error) {
                console.error('Failed to load tables:', error);
            }
        }
        
        // Show table data
        async function showTable(tableName) {
            currentTable = tableName.toLowerCase();
            document.getElementById('tableList').parentElement.style.display = 'none';
            document.getElementById('dataView').style.display = 'block';
            document.getElementById('tableName').textContent = tableName;
            
            await loadData();
        }
        
        // Load table data
        async function loadData() {
            try {
                // This is a simplified version - in reality, we'd need to map
                // model names to table names properly
                const response = await fetch(\`\${API_BASE}/\${currentTable}s\`);
                const result = await response.json();
                
                if (result.success && result.data.length > 0) {
                    displayData(result.data);
                } else {
                    document.getElementById('dataGrid').innerHTML = '<p>No data found</p>';
                }
            } catch (error) {
                console.error('Failed to load data:', error);
                document.getElementById('dataGrid').innerHTML = '<p>Error loading data</p>';
            }
        }
        
        // Display data in grid
        function displayData(data) {
            if (data.length === 0) return;
            
            const columns = Object.keys(data[0]);
            
            let html = '<table><thead><tr>';
            columns.forEach(col => {
                html += \`<th>\${col}</th>\`;
            });
            html += '<th>Actions</th></tr></thead><tbody>';
            
            data.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    html += \`<td>\${row[col] || ''}</td>\`;
                });
                html += \`<td>
                    <button onclick="editItem('\${row.id || row[columns[0]]}')">Edit</button>
                    <button onclick="deleteItem('\${row.id || row[columns[0]]}')">Delete</button>
                </td></tr>\`;
            });
            
            html += '</tbody></table>';
            document.getElementById('dataGrid').innerHTML = html;
        }
        
        // Back to table list
        function backToList() {
            document.getElementById('dataView').style.display = 'none';
            document.getElementById('tableList').parentElement.style.display = 'block';
        }
        
        // Initialize
        loadTables();
    </script>
</body>
</html>`;
        
        await fs.writeFile(path.join(this.config.outputDir, 'ui', 'index.html'), uiCode);
        console.log('  ✓ Generated UI interface');
    }
    
    /**
     * Generate tests
     */
    async generateTests() {
        console.log('\n🧪 Generating tests...');
        
        await fs.mkdir(path.join(this.config.outputDir, 'tests'), { recursive: true });
        
        for (const [serviceName, serviceInfo] of this.generatedServices) {
            const testCode = this.generateTestCode(serviceName, serviceInfo);
            const testPath = path.join(this.config.outputDir, 'tests', `${serviceInfo.model}.test.js`);
            
            await fs.writeFile(testPath, testCode);
            console.log(`  ✓ Generated test: ${serviceInfo.model}.test.js`);
        }
    }
    
    /**
     * Generate test code for a service
     */
    generateTestCode(serviceName, serviceInfo) {
        return `/**
 * Tests for ${serviceInfo.model}
 * Auto-generated test suite
 */

const ${serviceName} = require('../services/${serviceName}');
const Database = require('../database');

describe('${serviceName}', () => {
    let service;
    
    beforeAll(async () => {
        await Database.connect();
        service = new ${serviceName}();
    });
    
    afterAll(async () => {
        await Database.disconnect();
    });
    
    describe('CRUD Operations', () => {
        let createdId;
        
        test('should create a new ${serviceInfo.model}', async () => {
            const data = {
                // Add test data based on table columns
            };
            
            const result = await service.create(data);
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            createdId = result.id;
        });
        
        test('should find ${serviceInfo.model} by ID', async () => {
            const result = await service.findById(createdId);
            expect(result).toBeDefined();
            expect(result.id).toBe(createdId);
        });
        
        test('should update ${serviceInfo.model}', async () => {
            const updates = {
                // Add update data
            };
            
            const result = await service.update(createdId, updates);
            expect(result).toBeDefined();
        });
        
        test('should find all ${serviceInfo.model}s', async () => {
            const results = await service.findAll();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
        });
        
        test('should delete ${serviceInfo.model}', async () => {
            const result = await service.delete(createdId);
            expect(result).toBe(true);
            
            const found = await service.findById(createdId);
            expect(found).toBeNull();
        });
    });
});`;
    }
    
    /**
     * Generate deployment configuration
     */
    async generateDeploymentConfig() {
        console.log('\n📦 Generating deployment configuration...');
        
        // Generate Dockerfile
        const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]`;
        
        await fs.writeFile(path.join(this.config.outputDir, 'Dockerfile'), dockerfile);
        
        // Generate docker-compose.yml
        const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/data/database.sqlite
    volumes:
      - ./data:/data
    restart: unless-stopped`;
        
        await fs.writeFile(path.join(this.config.outputDir, 'docker-compose.yml'), dockerCompose);
        
        // Generate README
        const readme = `# Database-Driven System

Auto-generated from SQL schema using Database-Driven Builder.

## Features

- Complete REST API for all tables
- Data models with validation
- Service layer with business logic
- Web UI interface
- Docker deployment ready

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Start development server
npm run dev
\`\`\`

## API Endpoints

${Array.from(this.generatedAPIs.entries()).map(([model, info]) => 
    `### ${model}\n${info.endpoints.map(e => `- ${e}`).join('\n')}`
).join('\n\n')}

## Deployment

\`\`\`bash
# Build and run with Docker
docker-compose up -d
\`\`\`

Generated on ${new Date().toISOString()}`;
        
        await fs.writeFile(path.join(this.config.outputDir, 'README.md'), readme);
        
        console.log('  ✓ Generated deployment configuration');
    }
    
    // Helper methods
    normalizeDataType(sqlType) {
        return sqlType.toUpperCase()
            .replace(/\s+/g, ' ')
            .replace(/\([^)]*\)/g, '')
            .trim();
    }
    
    extractDefault(columnDef) {
        const defaultMatch = columnDef.match(/DEFAULT\s+(.+?)(?:\s|$)/i);
        if (defaultMatch) {
            return defaultMatch[1].replace(/['"`]/g, '');
        }
        return null;
    }
    
    tableNameToModelName(tableName) {
        return tableName
            .split('_')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('');
    }
    
    modelNameToTableName(modelName) {
        // Simple reverse - in real world would need proper mapping
        return modelName
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            .replace(/_+/g, '_');
    }
    
    sqlTypeToJSType(sqlType) {
        const typeMap = {
            'INTEGER': 'number',
            'INT': 'number',
            'BIGINT': 'number',
            'REAL': 'number',
            'FLOAT': 'number',
            'DOUBLE': 'number',
            'DECIMAL': 'number',
            'TEXT': 'string',
            'VARCHAR': 'string',
            'CHAR': 'string',
            'BOOLEAN': 'boolean',
            'BOOL': 'boolean',
            'DATE': 'Date',
            'DATETIME': 'Date',
            'TIMESTAMP': 'Date',
            'JSON': 'object',
            'JSONB': 'object'
        };
        
        return typeMap[sqlType] || 'any';
    }
    
    getJSDefaultValue(column) {
        if (column.default !== null) {
            const jsType = this.sqlTypeToJSType(column.type);
            if (jsType === 'string') {
                return `'${column.default}'`;
            } else if (jsType === 'Date' && column.default === 'CURRENT_TIMESTAMP') {
                return 'new Date()';
            }
            return column.default;
        }
        
        if (column.nullable) {
            return 'null';
        }
        
        const jsType = this.sqlTypeToJSType(column.type);
        const defaults = {
            'number': '0',
            'string': "''",
            'boolean': 'false',
            'Date': 'new Date()',
            'object': '{}',
            'any': 'null'
        };
        
        return defaults[jsType] || 'null';
    }
}

// CLI Interface
if (require.main === module) {
    const builder = new DatabaseDrivenBuilder();
    
    const args = process.argv.slice(2);
    const schemaFile = args[0] || './schema.sql';
    
    console.log(`
🗄️  DATABASE-DRIVEN BUILDER
Building complete system from SQL schema
    `);
    
    builder.buildFromSchema(schemaFile)
        .then(result => {
            console.log('\n✨ Build Complete!');
            console.log(`📁 Output directory: ${result.outputDir}`);
            console.log(`📊 Generated ${result.models.length} models`);
            console.log(`🔧 Generated ${result.services.length} services`);
            console.log(`🌐 Generated ${result.apis.length} APIs`);
            console.log('\nNext steps:');
            console.log(`  cd ${result.outputDir}`);
            console.log('  npm install');
            console.log('  npm start');
        })
        .catch(error => {
            console.error('\n❌ Build failed:', error);
            process.exit(1);
        });
}

module.exports = DatabaseDrivenBuilder;
#!/usr/bin/env node

/**
 * Database Perspective Adapter
 * 
 * Transforms data into raw SQL/JSON storage format
 * Shows how "1000 credits" becomes database records, schemas, and queries
 */

const crypto = require('crypto');

class DatabasePerspective {
    constructor(config = {}) {
        this.config = {
            databaseType: config.databaseType || 'postgresql',
            enableIndexSuggestions: config.enableIndexSuggestions !== false,
            enableConstraints: config.enableConstraints !== false,
            enablePartitioning: config.enablePartitioning !== false
        };
        
        // Database type configurations
        this.dbConfigs = {
            postgresql: {
                dataTypes: {
                    integer: 'INTEGER',
                    float: 'DECIMAL(10,2)',
                    string: 'VARCHAR(255)',
                    text: 'TEXT',
                    boolean: 'BOOLEAN',
                    timestamp: 'TIMESTAMP',
                    json: 'JSONB',
                    uuid: 'UUID'
                },
                features: ['indexes', 'constraints', 'triggers', 'partitioning']
            },
            
            mysql: {
                dataTypes: {
                    integer: 'INT',
                    float: 'DECIMAL(10,2)',
                    string: 'VARCHAR(255)',
                    text: 'TEXT',
                    boolean: 'BOOLEAN',
                    timestamp: 'TIMESTAMP',
                    json: 'JSON',
                    uuid: 'CHAR(36)'
                },
                features: ['indexes', 'constraints', 'triggers']
            },
            
            mongodb: {
                dataTypes: {
                    integer: 'Number',
                    float: 'Number',
                    string: 'String',
                    text: 'String',
                    boolean: 'Boolean',
                    timestamp: 'Date',
                    json: 'Object',
                    uuid: 'String'
                },
                features: ['indexes', 'validation', 'aggregation']
            }
        };
        
        // Table schemas for different data types
        this.schemas = {
            bounties: {
                table: 'bounties',
                columns: {
                    id: { type: 'uuid', primary: true, default: 'uuid_generate_v4()' },
                    actor: { type: 'string', nullable: false, index: true },
                    amount: { type: 'integer', nullable: false, check: 'amount > 0' },
                    currency: { type: 'string', nullable: false, default: "'credits'" },
                    description: { type: 'text', nullable: true },
                    status: { type: 'string', nullable: false, default: "'active'" },
                    created_at: { type: 'timestamp', nullable: false, default: 'NOW()' },
                    updated_at: { type: 'timestamp', nullable: false, default: 'NOW()' },
                    expires_at: { type: 'timestamp', nullable: true }
                },
                indexes: [
                    'CREATE INDEX idx_bounties_actor ON bounties(actor)',
                    'CREATE INDEX idx_bounties_amount ON bounties(amount DESC)',
                    'CREATE INDEX idx_bounties_status ON bounties(status)',
                    'CREATE INDEX idx_bounties_created_at ON bounties(created_at DESC)'
                ],
                constraints: [
                    'ALTER TABLE bounties ADD CONSTRAINT chk_amount_positive CHECK (amount > 0)',
                    'ALTER TABLE bounties ADD CONSTRAINT chk_valid_currency CHECK (currency IN (\'credits\', \'tokens\', \'coins\'))',
                    'ALTER TABLE bounties ADD CONSTRAINT chk_valid_status CHECK (status IN (\'active\', \'completed\', \'cancelled\', \'expired\'))'
                ]
            },
            
            transactions: {
                table: 'transactions',
                columns: {
                    id: { type: 'uuid', primary: true, default: 'uuid_generate_v4()' },
                    from_user: { type: 'string', nullable: true, index: true },
                    to_user: { type: 'string', nullable: true, index: true },
                    amount: { type: 'integer', nullable: false },
                    currency: { type: 'string', nullable: false },
                    transaction_type: { type: 'string', nullable: false },
                    reference_id: { type: 'uuid', nullable: true },
                    metadata: { type: 'json', nullable: true },
                    created_at: { type: 'timestamp', nullable: false, default: 'NOW()' }
                },
                indexes: [
                    'CREATE INDEX idx_transactions_from_user ON transactions(from_user)',
                    'CREATE INDEX idx_transactions_to_user ON transactions(to_user)',
                    'CREATE INDEX idx_transactions_type ON transactions(transaction_type)',
                    'CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC)'
                ]
            },
            
            events: {
                table: 'events',
                columns: {
                    id: { type: 'uuid', primary: true, default: 'uuid_generate_v4()' },
                    event_type: { type: 'string', nullable: false, index: true },
                    actor: { type: 'string', nullable: true, index: true },
                    data: { type: 'json', nullable: false },
                    timestamp: { type: 'timestamp', nullable: false, default: 'NOW()' },
                    processed: { type: 'boolean', nullable: false, default: 'false' }
                },
                indexes: [
                    'CREATE INDEX idx_events_type ON events(event_type)',
                    'CREATE INDEX idx_events_actor ON events(actor)',
                    'CREATE INDEX idx_events_timestamp ON events(timestamp DESC)',
                    'CREATE INDEX idx_events_processed ON events(processed) WHERE processed = false'
                ]
            }
        };
        
        console.log('💾 Database Perspective initialized');
    }
    
    /**
     * Transform data into database storage format
     */
    transform(data) {
        console.log('💾 Transforming to database perspective...');
        
        const transformation = {
            metadata: {
                transformedAt: new Date(),
                databaseType: this.config.databaseType,
                dataSize: this.calculateDataSize(data)
            }
        };
        
        // Determine table and generate SQL
        const tableInfo = this.determineTable(data);
        transformation.table = tableInfo;
        
        // Generate SQL statements
        transformation.sql = this.generateSQL(data, tableInfo);
        
        // Generate JSON representation
        transformation.json = this.generateJSON(data, tableInfo);
        
        // Generate schema if needed
        transformation.schema = this.generateSchema(tableInfo);
        
        // Suggest indexes
        if (this.config.enableIndexSuggestions) {
            transformation.indexes = this.suggestIndexes(data, tableInfo);
        }
        
        // Define constraints
        if (this.config.enableConstraints) {
            transformation.constraints = this.defineConstraints(data, tableInfo);
        }
        
        // Suggest optimizations
        transformation.optimizations = this.suggestOptimizations(data, tableInfo);
        
        // Generate queries for common operations
        transformation.queries = this.generateCommonQueries(data, tableInfo);
        
        return transformation;
    }
    
    /**
     * Determine which table this data belongs to
     */
    determineTable(data) {
        // Analyze data to determine appropriate table
        if (data.action === 'post_bounty' || data.type === 'bounty') {
            return { 
                name: 'bounties', 
                schema: this.schemas.bounties,
                primaryKey: 'id'
            };
        }
        
        if (data.transaction || data.amount && (data.from_user || data.to_user)) {
            return { 
                name: 'transactions', 
                schema: this.schemas.transactions,
                primaryKey: 'id'
            };
        }
        
        // Default to events table for general data
        return { 
            name: 'events', 
            schema: this.schemas.events,
            primaryKey: 'id'
        };
    }
    
    /**
     * Generate SQL statements for the data
     */
    generateSQL(data, tableInfo) {
        const sql = {
            insert: this.generateInsertSQL(data, tableInfo),
            select: this.generateSelectSQL(data, tableInfo),
            update: this.generateUpdateSQL(data, tableInfo),
            delete: this.generateDeleteSQL(data, tableInfo)
        };
        
        return sql;
    }
    
    generateInsertSQL(data, tableInfo) {
        const tableName = tableInfo.name;
        
        switch (tableName) {
            case 'bounties':
                return {
                    statement: `INSERT INTO bounties (actor, amount, currency, description, status, created_at) 
                               VALUES ($1, $2, $3, $4, $5, NOW()) 
                               RETURNING id, created_at`,
                    parameters: [
                        data.actor || 'unknown',
                        data.amount || 0,
                        data.currency || 'credits',
                        data.description || null,
                        'active'
                    ],
                    example: `INSERT INTO bounties (actor, amount, currency, description, status, created_at) 
                             VALUES ('${data.actor}', ${data.amount}, '${data.currency}', '${data.description}', 'active', NOW())`
                };
                
            case 'transactions':
                return {
                    statement: `INSERT INTO transactions (from_user, to_user, amount, currency, transaction_type, reference_id, metadata, created_at) 
                               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
                               RETURNING id`,
                    parameters: [
                        data.from_user || null,
                        data.to_user || null,
                        data.amount || 0,
                        data.currency || 'credits',
                        data.transaction_type || 'bounty_escrow',
                        data.reference_id || null,
                        JSON.stringify(data.metadata || {})
                    ]
                };
                
            case 'events':
                return {
                    statement: `INSERT INTO events (event_type, actor, data, timestamp, processed) 
                               VALUES ($1, $2, $3, NOW(), false) 
                               RETURNING id`,
                    parameters: [
                        data.action || data.event_type || 'unknown',
                        data.actor || null,
                        JSON.stringify(data)
                    ]
                };
                
            default:
                return {
                    statement: `INSERT INTO ${tableName} (data, created_at) VALUES ($1, NOW())`,
                    parameters: [JSON.stringify(data)]
                };
        }
    }
    
    generateSelectSQL(data, tableInfo) {
        const tableName = tableInfo.name;
        const queries = [];
        
        // Basic select
        queries.push({
            name: 'select_all',
            statement: `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT 100`
        });
        
        // Select by actor/user
        if (data.actor) {
            queries.push({
                name: 'select_by_actor',
                statement: `SELECT * FROM ${tableName} WHERE actor = $1 ORDER BY created_at DESC`,
                parameters: [data.actor]
            });
        }
        
        // Select by amount range (for bounties/transactions)
        if (data.amount) {
            queries.push({
                name: 'select_by_amount_range',
                statement: `SELECT * FROM ${tableName} WHERE amount BETWEEN $1 AND $2 ORDER BY amount DESC`,
                parameters: [Math.floor(data.amount * 0.5), Math.floor(data.amount * 1.5)]
            });
        }
        
        // Recent items
        queries.push({
            name: 'select_recent',
            statement: `SELECT * FROM ${tableName} WHERE created_at >= NOW() - INTERVAL '24 hours' ORDER BY created_at DESC`
        });
        
        return queries;
    }
    
    generateUpdateSQL(data, tableInfo) {
        const tableName = tableInfo.name;
        
        if (tableName === 'bounties') {
            return {
                statement: `UPDATE bounties SET 
                           status = $1, 
                           updated_at = NOW() 
                           WHERE id = $2 
                           RETURNING *`,
                parameters: ['completed', '${id}'],
                example: `UPDATE bounties SET status = 'completed', updated_at = NOW() WHERE actor = '${data.actor}'`
            };
        }
        
        return {
            statement: `UPDATE ${tableName} SET updated_at = NOW() WHERE id = $1`,
            parameters: ['${id}']
        };
    }
    
    generateDeleteSQL(data, tableInfo) {
        const tableName = tableInfo.name;
        
        return {
            statement: `DELETE FROM ${tableName} WHERE id = $1`,
            parameters: ['${id}'],
            soft_delete: `UPDATE ${tableName} SET deleted_at = NOW() WHERE id = $1`
        };
    }
    
    /**
     * Generate JSON representation
     */
    generateJSON(data, tableInfo) {
        const normalized = this.normalizeDataForJSON(data, tableInfo);
        
        return {
            document: normalized,
            validation: this.validateJSON(normalized, tableInfo),
            storage: {
                size: Buffer.byteLength(JSON.stringify(normalized)),
                compressed: this.estimateCompressedSize(normalized),
                indexes: this.suggestJSONIndexes(normalized)
            }
        };
    }
    
    normalizeDataForJSON(data, tableInfo) {
        const normalized = {
            id: crypto.randomUUID(),
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Add table-specific fields
        if (tableInfo.name === 'bounties') {
            normalized.status = normalized.status || 'active';
            normalized.expires_at = normalized.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        
        return normalized;
    }
    
    /**
     * Generate schema definition
     */
    generateSchema(tableInfo) {
        const dbType = this.config.databaseType;
        const schema = tableInfo.schema;
        
        if (dbType === 'mongodb') {
            return this.generateMongoSchema(schema);
        } else {
            return this.generateSQLSchema(schema, dbType);
        }
    }
    
    generateSQLSchema(schema, dbType) {
        const typeMapping = this.dbConfigs[dbType].dataTypes;
        
        const createTable = `CREATE TABLE IF NOT EXISTS ${schema.table} (\n` +
            Object.entries(schema.columns).map(([columnName, columnDef]) => {
                let line = `    ${columnName} ${typeMapping[columnDef.type] || columnDef.type}`;
                
                if (columnDef.primary) line += ' PRIMARY KEY';
                if (columnDef.nullable === false) line += ' NOT NULL';
                if (columnDef.default) line += ` DEFAULT ${columnDef.default}`;
                if (columnDef.check) line += ` CHECK (${columnDef.check})`;
                
                return line;
            }).join(',\n') +
            '\n);';
        
        return {
            createTable,
            indexes: schema.indexes || [],
            constraints: schema.constraints || [],
            triggers: this.generateTriggers(schema)
        };
    }
    
    generateMongoSchema(schema) {
        const mongoSchema = {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: Object.entries(schema.columns)
                        .filter(([_, def]) => def.nullable === false)
                        .map(([name]) => name),
                    properties: {}
                }
            }
        };
        
        // Convert column definitions to MongoDB schema
        Object.entries(schema.columns).forEach(([columnName, columnDef]) => {
            const property = { bsonType: this.sqlTypeToMongoType(columnDef.type) };
            
            if (columnDef.check) {
                // Convert SQL check constraints to MongoDB validation
                if (columnDef.check.includes('> 0')) {
                    property.minimum = 1;
                }
            }
            
            mongoSchema.validator.$jsonSchema.properties[columnName] = property;
        });
        
        return mongoSchema;
    }
    
    /**
     * Suggest indexes for optimization
     */
    suggestIndexes(data, tableInfo) {
        const suggestions = [];
        
        // Always suggest primary key index
        suggestions.push({
            type: 'primary',
            columns: [tableInfo.primaryKey],
            statement: `CREATE UNIQUE INDEX idx_${tableInfo.name}_pk ON ${tableInfo.name}(${tableInfo.primaryKey})`
        });
        
        // Suggest indexes based on data fields
        if (data.actor) {
            suggestions.push({
                type: 'actor_lookup',
                columns: ['actor'],
                statement: `CREATE INDEX idx_${tableInfo.name}_actor ON ${tableInfo.name}(actor)`,
                reasoning: 'Frequent lookups by actor/user'
            });
        }
        
        if (data.amount) {
            suggestions.push({
                type: 'amount_range',
                columns: ['amount'],
                statement: `CREATE INDEX idx_${tableInfo.name}_amount ON ${tableInfo.name}(amount DESC)`,
                reasoning: 'Range queries and sorting by amount'
            });
        }
        
        // Time-based index
        suggestions.push({
            type: 'temporal',
            columns: ['created_at'],
            statement: `CREATE INDEX idx_${tableInfo.name}_created_at ON ${tableInfo.name}(created_at DESC)`,
            reasoning: 'Recent data queries and time-based partitioning'
        });
        
        // Composite indexes
        if (data.actor && data.amount) {
            suggestions.push({
                type: 'composite',
                columns: ['actor', 'amount'],
                statement: `CREATE INDEX idx_${tableInfo.name}_actor_amount ON ${tableInfo.name}(actor, amount DESC)`,
                reasoning: 'User-specific amount queries'
            });
        }
        
        return suggestions;
    }
    
    /**
     * Define data constraints
     */
    defineConstraints(data, tableInfo) {
        const constraints = [];
        
        // Amount constraints
        if (data.amount !== undefined) {
            constraints.push({
                type: 'check',
                name: `chk_${tableInfo.name}_amount_positive`,
                statement: `ALTER TABLE ${tableInfo.name} ADD CONSTRAINT chk_${tableInfo.name}_amount_positive CHECK (amount > 0)`,
                reasoning: 'Ensure positive amounts'
            });
        }
        
        // Currency constraints
        if (data.currency) {
            constraints.push({
                type: 'check',
                name: `chk_${tableInfo.name}_valid_currency`,
                statement: `ALTER TABLE ${tableInfo.name} ADD CONSTRAINT chk_${tableInfo.name}_valid_currency CHECK (currency IN ('credits', 'tokens', 'coins'))`,
                reasoning: 'Limit to valid currencies'
            });
        }
        
        // Status constraints (for bounties)
        if (tableInfo.name === 'bounties') {
            constraints.push({
                type: 'check',
                name: `chk_${tableInfo.name}_valid_status`,
                statement: `ALTER TABLE ${tableInfo.name} ADD CONSTRAINT chk_${tableInfo.name}_valid_status CHECK (status IN ('active', 'completed', 'cancelled', 'expired'))`,
                reasoning: 'Ensure valid bounty status'
            });
        }
        
        // Foreign key constraints
        if (data.reference_id) {
            constraints.push({
                type: 'foreign_key',
                name: `fk_${tableInfo.name}_reference`,
                statement: `ALTER TABLE ${tableInfo.name} ADD CONSTRAINT fk_${tableInfo.name}_reference FOREIGN KEY (reference_id) REFERENCES bounties(id)`,
                reasoning: 'Maintain referential integrity'
            });
        }
        
        return constraints;
    }
    
    /**
     * Suggest database optimizations
     */
    suggestOptimizations(data, tableInfo) {
        const optimizations = [];
        
        // Partitioning suggestions
        if (this.config.enablePartitioning) {
            optimizations.push({
                type: 'partitioning',
                strategy: 'time_based',
                statement: `CREATE TABLE ${tableInfo.name}_y2024m01 PARTITION OF ${tableInfo.name} FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')`,
                reasoning: 'Improve query performance for time-based data'
            });
        }
        
        // Materialized views
        if (tableInfo.name === 'bounties') {
            optimizations.push({
                type: 'materialized_view',
                name: `mv_active_bounties`,
                statement: `CREATE MATERIALIZED VIEW mv_active_bounties AS 
                           SELECT actor, SUM(amount) as total_bounties, COUNT(*) as bounty_count 
                           FROM bounties WHERE status = 'active' 
                           GROUP BY actor`,
                reasoning: 'Fast access to bounty statistics'
            });
        }
        
        // Compression suggestions
        optimizations.push({
            type: 'compression',
            target: 'large_text_fields',
            statement: `ALTER TABLE ${tableInfo.name} ALTER COLUMN description SET STORAGE EXTERNAL`,
            reasoning: 'Compress large text fields'
        });
        
        return optimizations;
    }
    
    /**
     * Generate common queries
     */
    generateCommonQueries(data, tableInfo) {
        const queries = {
            // Analytics queries
            analytics: [
                {
                    name: 'total_bounty_value',
                    description: 'Total value of all active bounties',
                    statement: `SELECT SUM(amount) as total_value, COUNT(*) as total_count FROM bounties WHERE status = 'active'`
                },
                {
                    name: 'top_bounty_creators',
                    description: 'Users who create the most bounties',
                    statement: `SELECT actor, COUNT(*) as bounties_created, SUM(amount) as total_value 
                               FROM bounties 
                               GROUP BY actor 
                               ORDER BY bounties_created DESC LIMIT 10`
                },
                {
                    name: 'bounty_trends',
                    description: 'Daily bounty creation trends',
                    statement: `SELECT DATE(created_at) as date, COUNT(*) as bounties_created, AVG(amount) as avg_amount 
                               FROM bounties 
                               WHERE created_at >= NOW() - INTERVAL '30 days' 
                               GROUP BY DATE(created_at) 
                               ORDER BY date DESC`
                }
            ],
            
            // Operational queries
            operations: [
                {
                    name: 'expire_old_bounties',
                    description: 'Mark expired bounties as expired',
                    statement: `UPDATE bounties SET status = 'expired' WHERE expires_at < NOW() AND status = 'active'`
                },
                {
                    name: 'cleanup_old_events',
                    description: 'Archive old processed events',
                    statement: `DELETE FROM events WHERE processed = true AND timestamp < NOW() - INTERVAL '90 days'`
                }
            ],
            
            // Performance queries
            performance: [
                {
                    name: 'query_performance',
                    description: 'Check query performance statistics',
                    statement: `SELECT query, mean_time, calls, total_time 
                               FROM pg_stat_statements 
                               WHERE query LIKE '%bounties%' 
                               ORDER BY mean_time DESC LIMIT 10`
                },
                {
                    name: 'index_usage',
                    description: 'Monitor index usage',
                    statement: `SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
                               FROM pg_stat_user_indexes 
                               WHERE tablename = '${tableInfo.name}' 
                               ORDER BY idx_tup_read DESC`
                }
            ]
        };
        
        return queries;
    }
    
    // Helper methods
    calculateDataSize(data) {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
    }
    
    estimateCompressedSize(data) {
        // Rough estimate of compressed size (typically 60-80% compression for JSON)
        return Math.floor(Buffer.byteLength(JSON.stringify(data), 'utf8') * 0.3);
    }
    
    validateJSON(data, tableInfo) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };
        
        // Check required fields
        const schema = tableInfo.schema;
        Object.entries(schema.columns).forEach(([columnName, columnDef]) => {
            if (columnDef.nullable === false && !(columnName in data) && !columnDef.default) {
                validation.valid = false;
                validation.errors.push(`Missing required field: ${columnName}`);
            }
        });
        
        // Check data types
        Object.entries(data).forEach(([key, value]) => {
            const columnDef = schema.columns[key];
            if (columnDef) {
                const expectedType = columnDef.type;
                const actualType = typeof value;
                
                if (!this.isCompatibleType(actualType, expectedType)) {
                    validation.warnings.push(`Type mismatch for ${key}: expected ${expectedType}, got ${actualType}`);
                }
            }
        });
        
        return validation;
    }
    
    isCompatibleType(actualType, expectedType) {
        const compatibility = {
            'integer': ['number'],
            'float': ['number'],
            'string': ['string'],
            'boolean': ['boolean'],
            'json': ['object', 'array'],
            'timestamp': ['string', 'number', 'object'] // Date objects
        };
        
        return compatibility[expectedType]?.includes(actualType) || false;
    }
    
    sqlTypeToMongoType(sqlType) {
        const mapping = {
            'integer': 'int',
            'float': 'decimal',
            'string': 'string',
            'text': 'string',
            'boolean': 'bool',
            'timestamp': 'date',
            'json': 'object',
            'uuid': 'string'
        };
        
        return mapping[sqlType] || 'string';
    }
    
    suggestJSONIndexes(data) {
        const indexes = [];
        
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'string' || typeof data[key] === 'number') {
                indexes.push({
                    field: key,
                    type: 'single',
                    statement: `CREATE INDEX idx_${key} ON collection (${key})`
                });
            }
        });
        
        return indexes;
    }
    
    generateTriggers(schema) {
        const triggers = [];
        
        // Updated_at trigger
        triggers.push({
            name: `trg_${schema.table}_updated_at`,
            statement: `CREATE OR REPLACE FUNCTION update_updated_at_column()
                        RETURNS TRIGGER AS $$
                        BEGIN
                            NEW.updated_at = NOW();
                            RETURN NEW;
                        END;
                        $$ language 'plpgsql';
                        
                        CREATE TRIGGER trg_${schema.table}_updated_at 
                        BEFORE UPDATE ON ${schema.table} 
                        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
            purpose: 'Automatically update updated_at timestamp'
        });
        
        // Audit trigger (if audit table exists)
        triggers.push({
            name: `trg_${schema.table}_audit`,
            statement: `CREATE TRIGGER trg_${schema.table}_audit 
                        AFTER INSERT OR UPDATE OR DELETE ON ${schema.table}
                        FOR EACH ROW EXECUTE FUNCTION audit_changes();`,
            purpose: 'Track all changes for audit purposes'
        });
        
        return triggers;
    }
}

module.exports = { DatabasePerspective };

// Example usage
if (require.main === module) {
    function demonstrateDatabasePerspective() {
        console.log('\n💾 DATABASE PERSPECTIVE DEMONSTRATION\n');
        
        const dbPerspective = new DatabasePerspective({
            databaseType: 'postgresql',
            enableIndexSuggestions: true,
            enableConstraints: true
        });
        
        // Test data: Cal posting a bounty
        const bountyData = {
            actor: 'Cal',
            action: 'post_bounty',
            amount: 1000,
            currency: 'credits',
            description: 'Epic quest for brave developers',
            timestamp: Date.now()
        };
        
        const transformation = dbPerspective.transform(bountyData);
        
        console.log('📊 === DATABASE TRANSFORMATION RESULTS ===\n');
        
        console.log('💾 TABLE INFORMATION:');
        console.log(`   Table: ${transformation.table.name}`);
        console.log(`   Primary Key: ${transformation.table.primaryKey}\n`);
        
        console.log('📝 SQL STATEMENTS:');
        console.log('   INSERT:', transformation.sql.insert.example);
        console.log('   SELECT:', transformation.sql.select[0].statement, '\n');
        
        console.log('🗃️ JSON DOCUMENT:');
        console.log('   Document:', JSON.stringify(transformation.json.document, null, 2));
        console.log(`   Size: ${transformation.json.storage.size} bytes\n`);
        
        console.log('📊 SUGGESTED INDEXES:');
        transformation.indexes.forEach(index => {
            console.log(`   ${index.type}: ${index.statement}`);
        });
        
        console.log('\n🛡️ CONSTRAINTS:');
        transformation.constraints.forEach(constraint => {
            console.log(`   ${constraint.type}: ${constraint.reasoning}`);
        });
        
        console.log('\n⚡ OPTIMIZATIONS:');
        transformation.optimizations.forEach(opt => {
            console.log(`   ${opt.type}: ${opt.reasoning}`);
        });
        
        console.log('\n🎯 The same "1000 credits" becomes:');
        console.log('   • SQL INSERT with proper data types and constraints');
        console.log('   • JSON document with validation and indexing');
        console.log('   • Performance-optimized schema with suggested indexes');
        console.log('   • Audit trail and compliance tracking');
    }
    
    demonstrateDatabasePerspective();
}

console.log('💾 DATABASE PERSPECTIVE ADAPTER LOADED');
console.log('📊 Transforms data into SQL/JSON storage format with schemas, indexes, and constraints');
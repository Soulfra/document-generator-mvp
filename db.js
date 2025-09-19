// Database connection module for Document Generator
const path = require('path');
const fs = require('fs');

// Check if we have sqlite3 installed, otherwise use a simple in-memory store
let Database;
let db;
let isInMemory = false;

try {
    Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, 'document-generator.db');
    db = new Database(dbPath);
    console.log('=Ê Connected to SQLite database:', dbPath);
} catch (error) {
    console.log('  SQLite not available, using in-memory store');
    isInMemory = true;
    
    // Simple in-memory store
    db = {
        documents: [],
        analyses: [],
        templates: [],
        mvps: [],
        ai_usage: [],
        processing_queue: []
    };
}

// Initialize database schema if using SQLite
if (!isInMemory) {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(s => s.trim());
        statements.forEach(statement => {
            try {
                db.exec(statement + ';');
            } catch (error) {
                console.error('Schema execution error:', error.message);
            }
        });
        console.log(' Database schema initialized');
    }
}

// Database operations
const dbOperations = {
    // Document operations
    createDocument: function(doc) {
        if (isInMemory) {
            const id = db.documents.length + 1;
            const newDoc = { id, ...doc, created_at: new Date(), updated_at: new Date() };
            db.documents.push(newDoc);
            return newDoc;
        }
        
        const stmt = db.prepare(`
            INSERT INTO documents (uuid, title, type, content, file_path, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(doc.uuid, doc.title, doc.type, doc.content, doc.file_path, doc.file_size);
        return { id: result.lastInsertRowid, ...doc };
    },
    
    getDocument: function(id) {
        if (isInMemory) {
            return db.documents.find(d => d.id === id);
        }
        
        const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
        return stmt.get(id);
    },
    
    // Analysis operations
    createAnalysis: function(analysis) {
        if (isInMemory) {
            const id = db.analyses.length + 1;
            const newAnalysis = { id, ...analysis, created_at: new Date() };
            db.analyses.push(newAnalysis);
            return newAnalysis;
        }
        
        const stmt = db.prepare(`
            INSERT INTO analyses (document_id, intent, complexity, mvp_readiness, extracted_features, requirements, recommendations)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            analysis.document_id,
            analysis.intent,
            analysis.complexity,
            analysis.mvp_readiness,
            JSON.stringify(analysis.extracted_features),
            JSON.stringify(analysis.requirements),
            JSON.stringify(analysis.recommendations)
        );
        
        return { id: result.lastInsertRowid, ...analysis };
    },
    
    // MVP operations
    createMVP: function(mvp) {
        if (isInMemory) {
            const id = db.mvps.length + 1;
            const newMVP = { id, ...mvp, created_at: new Date() };
            db.mvps.push(newMVP);
            return newMVP;
        }
        
        const stmt = db.prepare(`
            INSERT INTO mvps (document_id, template_id, name, output_path, generation_time_ms)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            mvp.document_id,
            mvp.template_id,
            mvp.name,
            mvp.output_path,
            mvp.generation_time_ms
        );
        
        return { id: result.lastInsertRowid, ...mvp };
    },
    
    updateMVPStatus: function(id, status, deployment_url) {
        if (isInMemory) {
            const mvp = db.mvps.find(m => m.id === id);
            if (mvp) {
                mvp.deployment_status = status;
                mvp.deployment_url = deployment_url;
            }
            return mvp;
        }
        
        const stmt = db.prepare(`
            UPDATE mvps SET deployment_status = ?, deployment_url = ? WHERE id = ?
        `);
        
        stmt.run(status, deployment_url, id);
        return this.getMVP(id);
    },
    
    getMVP: function(id) {
        if (isInMemory) {
            return db.mvps.find(m => m.id === id);
        }
        
        const stmt = db.prepare('SELECT * FROM mvps WHERE id = ?');
        return stmt.get(id);
    },
    
    // AI usage tracking
    trackAIUsage: function(usage) {
        if (isInMemory) {
            const id = db.ai_usage.length + 1;
            const newUsage = { id, ...usage, created_at: new Date() };
            db.ai_usage.push(newUsage);
            return newUsage;
        }
        
        const stmt = db.prepare(`
            INSERT INTO ai_usage (mvp_id, service, model, tokens_used, cost_usd, purpose)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            usage.mvp_id,
            usage.service,
            usage.model,
            usage.tokens_used,
            usage.cost_usd,
            usage.purpose
        );
        
        return { id: result.lastInsertRowid, ...usage };
    },
    
    // Queue operations
    addToQueue: function(documentId, priority = 0) {
        if (isInMemory) {
            const id = db.processing_queue.length + 1;
            const item = { id, document_id: documentId, status: 'pending', priority, created_at: new Date() };
            db.processing_queue.push(item);
            return item;
        }
        
        const stmt = db.prepare(`
            INSERT INTO processing_queue (document_id, priority) VALUES (?, ?)
        `);
        
        const result = stmt.run(documentId, priority);
        return { id: result.lastInsertRowid, document_id: documentId, status: 'pending' };
    },
    
    getNextInQueue: function() {
        if (isInMemory) {
            return db.processing_queue
                .filter(q => q.status === 'pending')
                .sort((a, b) => b.priority - a.priority)[0];
        }
        
        const stmt = db.prepare(`
            SELECT * FROM processing_queue 
            WHERE status = 'pending' 
            ORDER BY priority DESC, created_at ASC 
            LIMIT 1
        `);
        
        return stmt.get();
    },
    
    updateQueueItem: function(id, updates) {
        if (isInMemory) {
            const item = db.processing_queue.find(q => q.id === id);
            if (item) {
                Object.assign(item, updates);
            }
            return item;
        }
        
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);
        
        const stmt = db.prepare(`UPDATE processing_queue SET ${fields} WHERE id = ?`);
        stmt.run(...values);
        
        return db.prepare('SELECT * FROM processing_queue WHERE id = ?').get(id);
    },
    
    // Utility functions
    close: function() {
        if (!isInMemory && db && typeof db.close === 'function') {
            db.close();
            console.log('= Database connection closed');
        }
    }
};

module.exports = dbOperations;
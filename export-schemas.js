#!/usr/bin/env node
// Export database schemas to JSONL format

const schemas = {
    components: {
        id: 'string',
        path: 'string',
        type: 'string',
        exists: 'boolean',
        size: 'number',
        registered_at: 'timestamp',
        metadata: 'jsonb'
    },
    reasoning_differentials: {
        id: 'integer',
        timestamp: 'timestamp',
        source: 'string',
        layer_from: 'string',
        layer_to: 'string',
        differential: 'float',
        truth_fragment: 'string'
    },
    blame_records: {
        id: 'integer',
        entity: 'string',
        blame_amount: 'integer',
        karma_score: 'integer',
        is_zombie: 'boolean',
        timestamp: 'timestamp'
    },
    sequential_tags: {
        id: 'integer',
        sequence: 'integer',
        tag: 'string',
        onion_layer: 'integer',
        joy_level: 'integer',
        created_at: 'timestamp'
    }
};

// Output as JSONL
Object.entries(schemas).forEach(([table, schema]) => {
    console.log(JSON.stringify({
        table,
        schema,
        version: '1.0.0',
        timestamp: new Date().toISOString()
    }));
});
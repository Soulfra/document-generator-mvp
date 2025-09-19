#!/usr/bin/env node

const ModelMigrationHelper = require('./model-migration-helper.js');

async function main() {
    const helper = new ModelMigrationHelper({
        dryRun: false, // Apply changes
        backupEnabled: true,
        skipConfirmation: true
    });
    
    // Critical files to migrate
    const criticalFiles = [
        './CAL-AI-MODEL-ROUTER.js',
        './real-ai-api-connector.js'
    ];
    
    console.log('🚀 Migrating critical files...\n');
    
    for (const file of criticalFiles) {
        try {
            const result = await helper.migrateFile(file);
            if (result.status === 'migrated') {
                console.log(`✅ Successfully migrated ${file} (${result.changes} changes)\n`);
            } else {
                console.log(`ℹ️  ${file} - ${result.status}\n`);
            }
        } catch (error) {
            console.error(`❌ Failed to migrate ${file}: ${error.message}\n`);
        }
    }
    
    console.log('✅ Migration complete!');
}

main().catch(console.error);
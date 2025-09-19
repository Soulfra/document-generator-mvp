const ModelMigrationHelper = require('./model-migration-helper.js');

async function main() {
    const helper = new ModelMigrationHelper({
        dryRun: true,
        skipConfirmation: true
    });
    
    // Critical files to check
    const criticalFiles = [
        './CAL-AI-MODEL-ROUTER.js',
        './real-ai-api-connector.js',
        './DomainSpecificAPIKeyManager.js',
        './vibecheck-ai-validator.js',
        './ai-human-handshake-trust-system.js',
        './bob-the-builder-agent.js',
        './FinishThisIdea/services/custom-ai.service.js',
        './FinishThisIdea-Complete/services/ai-service.js'
    ];
    
    console.log('Checking critical files for model name issues...\n');
    
    let totalChanges = 0;
    
    for (const file of criticalFiles) {
        try {
            const analysis = await helper.analyzeFile(file);
            if (analysis) {
                console.log('📄 ' + file);
                analysis.needed.forEach(n => {
                    console.log('   - ' + n.type + ': ' + n.count + ' occurrences');
                    totalChanges += n.count;
                });
                console.log('');
            }
        } catch (error) {
            console.log('⚠️  ' + file + ' - Not found or error: ' + error.message);
        }
    }
    
    console.log('📊 Total changes needed: ' + totalChanges);
}

main().catch(console.error);

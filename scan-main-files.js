const ModelMigrationHelper = require('./model-migration-helper.js');

async function main() {
    const helper = new ModelMigrationHelper({
        dryRun: true,
        skipConfirmation: true
    });
    
    // Scan only main JS files, not backups
    const files = await helper.scanDirectory('.', ['.js']);
    const mainFiles = files.filter(f => 
        !f.includes('.cleanup-backup') && 
        !f.includes('node_modules') &&
        !f.includes('backup') &&
        !f.includes('archive')
    );
    
    console.log('Found ' + mainFiles.length + ' main JS files to check\n');
    
    let needsMigration = 0;
    const filesToMigrate = [];
    
    const filesToCheck = mainFiles.slice(0, 20); // Check first 20 files
    for (const file of filesToCheck) {
        const analysis = await helper.analyzeFile(file);
        if (analysis) {
            needsMigration++;
            filesToMigrate.push(analysis);
            console.log('📄 ' + analysis.file);
            analysis.needed.forEach(n => {
                console.log('   - ' + n.type + ': ' + n.count + ' occurrences');
            });
        }
    }
    
    console.log('\n📊 Summary: ' + needsMigration + ' files need migration out of ' + filesToCheck.length + ' checked');
    
    // Show some examples
    if (filesToMigrate.length > 0) {
        console.log('\n📝 Example changes needed:');
        const example = filesToMigrate[0];
        console.log('\nFile: ' + example.file);
        console.log('Changes needed:');
        for (const change of example.needed) {
            console.log('  - ' + change.type + ': ' + change.count + ' occurrences');
        }
    }
}

main().catch(console.error);

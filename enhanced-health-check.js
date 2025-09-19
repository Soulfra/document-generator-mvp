
const sqlite3 = require('sqlite3').verbose();

// Enhanced health check that validates actual schema
async function validateDatabaseHealth(dbPath = './data/document-generator.db') {
    return new Promise((resolve) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                resolve({ healthy: false, error: 'Cannot connect to database' });
                return;
            }
            
            const requiredTables = [
                'components',
                'reasoning_differentials',
                'documents',
                'generated_mvps'
            ];
            
            let checkedTables = 0;
            let healthyTables = 0;
            
            requiredTables.forEach(table => {
                db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                    checkedTables++;
                    if (!err && row) {
                        healthyTables++;
                    }
                    
                    if (checkedTables === requiredTables.length) {
                        db.close();
                        const isHealthy = healthyTables === requiredTables.length;
                        resolve({
                            healthy: isHealthy,
                            schemaIntegrity: (healthyTables / requiredTables.length) * 100,
                            tablesChecked: checkedTables,
                            tablesHealthy: healthyTables
                        });
                    }
                });
            });
        });
    });
}

module.exports = { validateDatabaseHealth };

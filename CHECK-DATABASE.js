#!/usr/bin/env node

/**
 * 🗄️ CHECK DATABASE
 * Inspect the SQLite database to see what's actually stored
 */

const sqlite3 = require('sqlite3').verbose();

class DatabaseChecker {
    constructor() {
        this.db = new sqlite3.Database('./data/tycoon.db');
        this.checkDatabase();
    }
    
    async checkDatabase() {
        console.log('🗄️ CHECKING DATABASE STRUCTURE AND DATA...\n');
        
        try {
            await this.checkTables();
            await this.checkUsers();
            await this.checkGameSaves();
            await this.checkBuildings();
            await this.checkLogs();
            
            console.log('\n✅ DATABASE CHECK COMPLETED');
        } catch (error) {
            console.error('❌ DATABASE CHECK FAILED:', error);
        } finally {
            this.db.close();
        }
    }
    
    checkTables() {
        return new Promise((resolve, reject) => {
            console.log('1. Checking table structure...');
            
            this.db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log('   Tables found:');
                tables.forEach(table => {
                    console.log(`     - ${table.name}`);
                });
                
                resolve();
            });
        });
    }
    
    checkUsers() {
        return new Promise((resolve, reject) => {
            console.log('\n2. Checking users table...');
            
            this.db.all("SELECT id, username, email, created_at, credits FROM users", (err, users) => {
                if (err) {
                    console.log(`   Error: ${err.message}`);
                    resolve();
                    return;
                }
                
                console.log(`   Users count: ${users.length}`);
                users.forEach(user => {
                    console.log(`     - ${user.username} (ID: ${user.id}, Credits: ${user.credits})`);
                });
                
                resolve();
            });
        });
    }
    
    checkGameSaves() {
        return new Promise((resolve, reject) => {
            console.log('\n3. Checking game_saves table...');
            
            this.db.all("SELECT * FROM game_saves", (err, saves) => {
                if (err) {
                    console.log(`   Error: ${err.message}`);
                    resolve();
                    return;
                }
                
                console.log(`   Game saves count: ${saves.length}`);
                saves.forEach(save => {
                    console.log(`     - User ${save.user_id}: $${save.cash}, ${save.buildings_count} buildings`);
                });
                
                resolve();
            });
        });
    }
    
    checkBuildings() {
        return new Promise((resolve, reject) => {
            console.log('\n4. Checking player_buildings table...');
            
            this.db.all("SELECT * FROM player_buildings", (err, buildings) => {
                if (err) {
                    console.log(`   Error: ${err.message}`);
                    resolve();
                    return;
                }
                
                console.log(`   Buildings count: ${buildings.length}`);
                buildings.forEach(building => {
                    console.log(`     - User ${building.user_id}: ${building.building_type} at (${building.x}, ${building.y})`);
                });
                
                resolve();
            });
        });
    }
    
    checkLogs() {
        return new Promise((resolve, reject) => {
            console.log('\n5. Checking game_logs table...');
            
            this.db.all("SELECT event_type, COUNT(*) as count FROM game_logs GROUP BY event_type", (err, logs) => {
                if (err) {
                    console.log(`   Error: ${err.message}`);
                    resolve();
                    return;
                }
                
                console.log('   Event types:');
                logs.forEach(log => {
                    console.log(`     - ${log.event_type}: ${log.count} events`);
                });
                
                resolve();
            });
        });
    }
}

new DatabaseChecker();
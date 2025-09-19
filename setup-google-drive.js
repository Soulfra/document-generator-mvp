#!/usr/bin/env node

/**
 * GOOGLE DRIVE SETUP SCRIPT
 * Helps authenticate and connect Google Drive to the MCP crawler
 * Sets up credentials for the voxelized data crawling system
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

class GoogleDriveSetup {
    constructor() {
        this.SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
        this.TOKEN_PATH = path.join(process.cwd(), 'google-token.json');
        this.CREDENTIALS_PATH = path.join(process.cwd(), 'google-credentials.json');
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }

    async setup() {
        console.log('🔮 Google Drive MCP Setup');
        console.log('========================');
        console.log('This will connect your Google Drive to the voxelized MCP crawler.\n');

        try {
            // Check if credentials exist
            const hasCredentials = await this.checkCredentials();
            
            if (!hasCredentials) {
                console.log('❌ No Google Drive credentials found.');
                console.log('\n📋 To set up Google Drive access:');
                console.log('1. Go to https://console.developers.google.com/');
                console.log('2. Create a new project or select existing');
                console.log('3. Enable the Google Drive API');
                console.log('4. Create credentials (OAuth 2.0 Client ID)');
                console.log('5. Download the JSON file and save as "google-credentials.json"\n');
                
                const shouldContinue = await this.askQuestion('Do you have the credentials file? (y/n): ');
                if (shouldContinue.toLowerCase() !== 'y') {
                    console.log('Please obtain credentials and run this setup again.');
                    process.exit(0);
                }
            }

            // Load credentials
            const credentials = await this.loadCredentials();
            const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
            
            // Create OAuth2 client
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            
            // Check if token exists
            const hasToken = await this.checkToken();
            
            if (!hasToken) {
                console.log('\n🔐 Starting OAuth authentication...');
                await this.authenticateUser(oAuth2Client);
            } else {
                console.log('\n✅ Token found, testing connection...');
                const token = await this.loadToken();
                oAuth2Client.setCredentials(token);
                
                const isValid = await this.testConnection(oAuth2Client);
                if (!isValid) {
                    console.log('⚠️ Token expired, re-authenticating...');
                    await this.authenticateUser(oAuth2Client);
                }
            }
            
            console.log('\n🎉 Google Drive setup complete!');
            console.log('✅ The MCP crawler can now access your Google Drive');
            console.log('🔮 Voxelized memory will be populated with your documents');
            
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
        } finally {
            this.rl.close();
        }
    }

    async checkCredentials() {
        try {
            await fs.access(this.CREDENTIALS_PATH);
            return true;
        } catch {
            return false;
        }
    }

    async checkToken() {
        try {
            await fs.access(this.TOKEN_PATH);
            return true;
        } catch {
            return false;
        }
    }

    async loadCredentials() {
        const content = await fs.readFile(this.CREDENTIALS_PATH, 'utf8');
        return JSON.parse(content);
    }

    async loadToken() {
        const content = await fs.readFile(this.TOKEN_PATH, 'utf8');
        return JSON.parse(content);
    }

    async authenticateUser(oAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES,
        });

        console.log('\n🌐 Opening browser for authentication...');
        console.log('If browser doesn\'t open, go to this URL:');
        console.log(authUrl);

        // Try to open browser
        const { exec } = require('child_process');
        exec(`open "${authUrl}"`, (error) => {
            if (error) {
                console.log('(Could not auto-open browser)');
            }
        });

        const code = await this.askQuestion('\n📝 Enter the authorization code: ');
        
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            
            // Save token
            await fs.writeFile(this.TOKEN_PATH, JSON.stringify(tokens, null, 2));
            console.log('✅ Token saved successfully');
            
            // Test connection
            const isValid = await this.testConnection(oAuth2Client);
            if (!isValid) {
                throw new Error('Authentication test failed');
            }
            
        } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    async testConnection(oAuth2Client) {
        try {
            const drive = google.drive({ version: 'v3', auth: oAuth2Client });
            const response = await drive.files.list({
                pageSize: 5,
                fields: 'files(id, name)'
            });
            
            const files = response.data.files;
            console.log('\n📁 Sample files found:');
            
            if (files.length === 0) {
                console.log('   (No files found - this is okay)');
            } else {
                files.forEach(file => {
                    console.log(`   - ${file.name}`);
                });
            }
            
            return true;
        } catch (error) {
            console.error('Connection test failed:', error.message);
            return false;
        }
    }

    askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new GoogleDriveSetup();
    setup.setup().catch(console.error);
}

module.exports = GoogleDriveSetup;
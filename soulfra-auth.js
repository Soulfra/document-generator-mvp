#!/usr/bin/env node

/**
 * SOULFRA AUTH - Terminal OAuth Manager
 * 
 * Direct OS-level OAuth management from your terminal.
 * No more web complexity - just terminal simplicity.
 */

const { Command } = require('commander');
const OAuthSystemBridge = require('./oauth-system-bridge.js');
const { spawn, exec } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const open = require('open');

// Create bridge instance
const bridge = new OAuthSystemBridge();

// Commander setup
const program = new Command();
program
    .name('soulfra-auth')
    .description('Terminal-based OAuth management for SoulFra OS')
    .version('1.0.0');

// === LOGIN COMMAND ===
program
    .command('login <provider>')
    .description('Login with an OAuth provider')
    .option('-s, --scopes <scopes>', 'Additional OAuth scopes (comma-separated)')
    .action(async (provider, options) => {
        const spinner = ora(`Starting OAuth flow for ${provider}`).start();
        
        try {
            // Get provider config
            const config = await getProviderConfig(provider);
            if (!config) {
                spinner.fail(`Unknown provider: ${provider}`);
                console.log(chalk.yellow('\nAvailable providers:'));
                console.log('  • github');
                console.log('  • google');
                console.log('  • microsoft');
                process.exit(1);
            }
            
            // Add custom scopes if provided
            if (options.scopes) {
                config.scopes.push(...options.scopes.split(','));
            }
            
            // Start OAuth flow
            const flow = await bridge.startOAuthFlow(provider, config);
            
            spinner.succeed('OAuth flow started');
            
            console.log(chalk.blue('\n🌐 Opening browser for authentication...'));
            console.log(chalk.gray(`If browser doesn't open, visit: ${flow.authUrl}\n`));
            
            // Open browser
            await open(flow.authUrl);
            
            // Wait for callback
            const callbackSpinner = ora('Waiting for authentication...').start();
            
            // Set up success handler
            bridge.onSuccess = (authProvider, tokenData) => {
                callbackSpinner.succeed(`Successfully authenticated with ${authProvider}!`);
                console.log(chalk.green('\n✅ OAuth tokens stored securely in system keychain'));
                
                // Cleanup and exit
                bridge.cleanup();
                process.exit(0);
            };
            
            // Keep process alive
            process.stdin.resume();
            
        } catch (error) {
            spinner.fail(`OAuth failed: ${error.message}`);
            process.exit(1);
        }
    });

// === STATUS COMMAND ===
program
    .command('status')
    .description('Show authentication status for all providers')
    .action(async () => {
        const spinner = ora('Checking authentication status...').start();
        
        try {
            const providers = ['github', 'google', 'microsoft'];
            const table = new Table({
                head: ['Provider', 'Status', 'Account', 'Token Type'],
                style: {
                    head: ['cyan']
                }
            });
            
            for (const provider of providers) {
                const status = await checkProviderStatus(provider);
                
                table.push([
                    chalk.bold(provider.charAt(0).toUpperCase() + provider.slice(1)),
                    status.authenticated ? chalk.green('✓ Connected') : chalk.gray('Not connected'),
                    status.account || '-',
                    status.tokenType || '-'
                ]);
            }
            
            spinner.succeed('Status check complete');
            console.log('\n' + table.toString());
            
        } catch (error) {
            spinner.fail(`Status check failed: ${error.message}`);
            process.exit(1);
        }
    });

// === TOKEN COMMAND ===
program
    .command('token <provider>')
    .description('Get OAuth token for a provider')
    .option('-r, --refresh', 'Get refresh token instead of access token')
    .option('-j, --json', 'Output as JSON')
    .action(async (provider, options) => {
        try {
            const tokenType = options.refresh ? 'refresh' : 'access';
            const status = await checkProviderStatus(provider);
            
            if (!status.authenticated) {
                console.log(chalk.red(`❌ Not authenticated with ${provider}`));
                console.log(chalk.yellow(`Run: soulfra-auth login ${provider}`));
                process.exit(1);
            }
            
            const token = await bridge.getKeychainItem(status.account, `${provider}-${tokenType}`);
            
            if (!token) {
                console.log(chalk.red(`❌ No ${tokenType} token found for ${provider}`));
                process.exit(1);
            }
            
            if (options.json) {
                console.log(JSON.stringify({ provider, tokenType, token, account: status.account }));
            } else {
                console.log(chalk.green(`✅ ${provider} ${tokenType} token:`));
                console.log(token);
            }
            
        } catch (error) {
            console.log(chalk.red(`❌ Error: ${error.message}`));
            process.exit(1);
        }
    });

// === LOGOUT COMMAND ===
program
    .command('logout <provider>')
    .description('Remove OAuth tokens for a provider')
    .action(async (provider) => {
        const spinner = ora(`Removing ${provider} authentication...`).start();
        
        try {
            const status = await checkProviderStatus(provider);
            
            if (!status.authenticated) {
                spinner.warn(`Not authenticated with ${provider}`);
                return;
            }
            
            // Remove all tokens
            await bridge.deleteKeychainItem(status.account, `${provider}-access`);
            await bridge.deleteKeychainItem(status.account, `${provider}-refresh`);
            await bridge.deleteKeychainItem(status.account, `${provider}-account`);
            
            spinner.succeed(`Successfully logged out from ${provider}`);
            
        } catch (error) {
            spinner.fail(`Logout failed: ${error.message}`);
            process.exit(1);
        }
    });

// === SYNC COMMAND ===
program
    .command('sync')
    .description('Sync OAuth tokens with web services')
    .action(async () => {
        const spinner = ora('Syncing OAuth tokens...').start();
        
        try {
            // Check if unified auth server is running
            const authServerUrl = 'http://localhost:3340';
            const response = await fetch(`${authServerUrl}/api/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokens: await getAllTokens()
                })
            }).catch(() => null);
            
            if (response && response.ok) {
                spinner.succeed('Tokens synced with web services');
            } else {
                spinner.warn('Web services not available - tokens stored locally only');
            }
            
        } catch (error) {
            spinner.fail(`Sync failed: ${error.message}`);
            process.exit(1);
        }
    });

// === CONFIGURE COMMAND ===
program
    .command('configure <provider>')
    .description('Configure OAuth credentials for a provider')
    .action(async (provider) => {
        console.log(chalk.blue(`\n🔧 Configuring ${provider} OAuth credentials\n`));
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
        
        try {
            const clientId = await question(chalk.cyan('Client ID: '));
            const clientSecret = await question(chalk.cyan('Client Secret: '));
            
            // Store credentials securely
            await bridge.setKeychainItem('oauth-config', `${provider}-client-id`, clientId);
            await bridge.setKeychainItem('oauth-config', `${provider}-client-secret`, clientSecret);
            
            console.log(chalk.green(`\n✅ ${provider} OAuth credentials configured successfully!`));
            
            rl.close();
            
        } catch (error) {
            console.log(chalk.red(`\n❌ Configuration failed: ${error.message}`));
            rl.close();
            process.exit(1);
        }
    });

// === HELPER FUNCTIONS ===

async function getProviderConfig(provider) {
    // First check keychain for configured credentials
    const clientId = await bridge.getKeychainItem('oauth-config', `${provider}-client-id`);
    const clientSecret = await bridge.getKeychainItem('oauth-config', `${provider}-client-secret`);
    
    // Fallback to environment variables
    const envClientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
    const envClientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
    
    const finalClientId = clientId || envClientId;
    const finalClientSecret = clientSecret || envClientSecret;
    
    if (!finalClientId || !finalClientSecret) {
        console.log(chalk.yellow(`\n⚠️  ${provider} OAuth not configured`));
        console.log(chalk.gray(`Run: soulfra-auth configure ${provider}`));
        return null;
    }
    
    const configs = {
        github: {
            clientId: finalClientId,
            clientSecret: finalClientSecret,
            scopes: ['user:email', 'repo']
        },
        google: {
            clientId: finalClientId,
            clientSecret: finalClientSecret,
            scopes: ['profile', 'email', 'https://www.googleapis.com/auth/userinfo.email']
        },
        microsoft: {
            clientId: finalClientId,
            clientSecret: finalClientSecret,
            scopes: ['User.Read', 'offline_access']
        }
    };
    
    return configs[provider];
}

async function checkProviderStatus(provider) {
    try {
        // Try to get account info
        const accountData = await bridge.getKeychainItem('*', `${provider}-account`);
        if (!accountData) {
            return { authenticated: false };
        }
        
        const account = JSON.parse(accountData);
        const hasAccessToken = await bridge.getKeychainItem(
            account.email || account.login || account.id,
            `${provider}-access`
        );
        
        return {
            authenticated: !!hasAccessToken,
            account: account.email || account.login || account.id,
            tokenType: hasAccessToken ? 'Bearer' : null
        };
    } catch {
        return { authenticated: false };
    }
}

async function getAllTokens() {
    const tokens = {};
    const providers = ['github', 'google', 'microsoft'];
    
    for (const provider of providers) {
        const status = await checkProviderStatus(provider);
        if (status.authenticated) {
            const accessToken = await bridge.getKeychainItem(status.account, `${provider}-access`);
            const refreshToken = await bridge.getKeychainItem(status.account, `${provider}-refresh`);
            
            tokens[provider] = {
                account: status.account,
                accessToken,
                refreshToken
            };
        }
    }
    
    return tokens;
}

// === MAIN ===

// Add ASCII art banner
console.log(chalk.cyan(`
╔═══════════════════════════════════╗
║      🚀 SOULFRA AUTH MANAGER      ║
║   Terminal OAuth for Your OS      ║
╚═══════════════════════════════════╝
`));

// Parse arguments
program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
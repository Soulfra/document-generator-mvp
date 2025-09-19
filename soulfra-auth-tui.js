#!/usr/bin/env node

/**
 * SOULFRA AUTH TUI
 * 
 * Beautiful terminal UI for OAuth management.
 * Like a control panel for your authentication realm.
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const OAuthSystemBridge = require('./oauth-system-bridge.js');
const { exec } = require('child_process');
const open = require('open');

class SoulFraAuthTUI {
    constructor() {
        this.bridge = new OAuthSystemBridge();
        this.providers = ['github', 'google', 'microsoft', 'teams', 'slack', 'discord'];
        this.currentProvider = 0;
        this.authStatuses = new Map();
        
        this.initializeUI();
        this.startStatusPolling();
    }
    
    initializeUI() {
        // Create screen
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'SoulFra Auth Manager'
        });
        
        // Create grid layout
        this.grid = new contrib.grid({
            rows: 12,
            cols: 12,
            screen: this.screen
        });
        
        // Header
        this.header = this.grid.set(0, 0, 1, 12, blessed.box, {
            content: ' 🚀 SOULFRA AUTH MANAGER - Terminal OAuth Control Center ',
            align: 'center',
            style: {
                fg: 'cyan',
                bold: true,
                border: {
                    fg: 'cyan'
                }
            }
        });
        
        // Provider list
        this.providerList = this.grid.set(1, 0, 6, 4, blessed.list, {
            label: ' Providers ',
            keys: true,
            vi: true,
            mouse: true,
            border: { type: 'line' },
            style: {
                selected: {
                    bg: 'blue',
                    fg: 'white',
                    bold: true
                },
                border: { fg: 'blue' }
            },
            items: this.providers.map(p => this.formatProviderName(p))
        });
        
        // Status panel
        this.statusPanel = this.grid.set(1, 4, 6, 8, blessed.box, {
            label: ' Status ',
            border: { type: 'line' },
            style: {
                border: { fg: 'green' }
            }
        });
        
        // Action buttons
        this.actionPanel = this.grid.set(7, 0, 2, 12, blessed.box, {
            label: ' Actions ',
            border: { type: 'line' },
            style: {
                border: { fg: 'yellow' }
            }
        });
        
        // Log panel
        this.logPanel = this.grid.set(9, 0, 3, 12, contrib.log, {
            label: ' Activity Log ',
            border: { type: 'line' },
            style: {
                border: { fg: 'magenta' }
            },
            bufferLength: 50
        });
        
        // Setup keybindings
        this.setupKeybindings();
        
        // Initial render
        this.screen.render();
        
        // Initial selection
        this.providerList.focus();
        this.updateStatusPanel();
    }
    
    setupKeybindings() {
        // Provider list navigation
        this.providerList.on('select', (item, index) => {
            this.currentProvider = index;
            this.updateStatusPanel();
        });
        
        // Keyboard shortcuts
        this.screen.key(['q', 'C-c'], () => {
            this.cleanup();
            process.exit(0);
        });
        
        this.screen.key(['l', 'enter'], () => {
            this.loginProvider();
        });
        
        this.screen.key(['o'], () => {
            this.logoutProvider();
        });
        
        this.screen.key(['r'], () => {
            this.refreshStatus();
        });
        
        this.screen.key(['t'], () => {
            this.showToken();
        });
        
        this.screen.key(['c'], () => {
            this.configureProvider();
        });
        
        this.screen.key(['s'], () => {
            this.syncTokens();
        });
        
        this.screen.key(['h', '?'], () => {
            this.showHelp();
        });
        
        // Update action panel with shortcuts
        this.actionPanel.setContent(
            '  [L/Enter] Login  [O] Logout  [T] Show Token  [C] Configure  [S] Sync  [R] Refresh  [H] Help  [Q] Quit  '
        );
    }
    
    async startStatusPolling() {
        // Initial status check
        await this.refreshAllStatuses();
        
        // Poll every 30 seconds
        this.statusInterval = setInterval(() => {
            this.refreshAllStatuses();
        }, 30000);
    }
    
    async refreshAllStatuses() {
        for (let i = 0; i < this.providers.length; i++) {
            const provider = this.providers[i];
            const status = await this.checkProviderStatus(provider);
            this.authStatuses.set(provider, status);
            
            // Update list item
            const itemText = this.formatProviderName(provider, status);
            this.providerList.setItem(i, itemText);
        }
        
        this.updateStatusPanel();
        this.screen.render();
    }
    
    formatProviderName(provider, status = null) {
        const icons = {
            github: '🐙',
            google: '🔵',
            microsoft: '📧',
            teams: '👥',
            slack: '💬',
            discord: '💜'
        };
        
        const icon = icons[provider] || '🔗';
        const name = provider.charAt(0).toUpperCase() + provider.slice(1);
        
        if (status === null) {
            status = this.authStatuses.get(provider);
        }
        
        const statusIcon = status?.authenticated ? '{green-fg}✓{/green-fg}' : '{gray-fg}○{/gray-fg}';
        
        return ` ${icon} ${name} ${statusIcon}`;
    }
    
    async checkProviderStatus(provider) {
        try {
            const accountData = await this.bridge.getKeychainItem('*', `${provider}-account`);
            if (!accountData) {
                return { authenticated: false };
            }
            
            const account = JSON.parse(accountData);
            const hasAccessToken = await this.bridge.getKeychainItem(
                account.email || account.login || account.id,
                `${provider}-access`
            );
            
            return {
                authenticated: !!hasAccessToken,
                account: account.email || account.login || account.id,
                accountInfo: account
            };
        } catch {
            return { authenticated: false };
        }
    }
    
    updateStatusPanel() {
        const provider = this.providers[this.currentProvider];
        const status = this.authStatuses.get(provider) || { authenticated: false };
        
        let content = `{bold}Provider:{/bold} ${provider.charAt(0).toUpperCase() + provider.slice(1)}\n\n`;
        
        if (status.authenticated) {
            content += `{green-fg}Status: Connected{/green-fg}\n`;
            content += `{bold}Account:{/bold} ${status.account}\n`;
            
            if (status.accountInfo) {
                if (status.accountInfo.name) {
                    content += `{bold}Name:{/bold} ${status.accountInfo.name}\n`;
                }
                if (status.accountInfo.company) {
                    content += `{bold}Company:{/bold} ${status.accountInfo.company}\n`;
                }
                if (status.accountInfo.created_at) {
                    content += `{bold}Member Since:{/bold} ${new Date(status.accountInfo.created_at).toLocaleDateString()}\n`;
                }
            }
        } else {
            content += `{yellow-fg}Status: Not Connected{/yellow-fg}\n\n`;
            content += `Press {bold}L{/bold} to login\n`;
            content += `Press {bold}C{/bold} to configure credentials`;
        }
        
        this.statusPanel.setContent(content);
        this.screen.render();
    }
    
    async loginProvider() {
        const provider = this.providers[this.currentProvider];
        this.log(`Starting OAuth flow for ${provider}...`);
        
        try {
            const config = await this.getProviderConfig(provider);
            if (!config) {
                this.log(`{red-fg}❌ ${provider} not configured. Press C to configure.{/red-fg}`);
                return;
            }
            
            const flow = await this.bridge.startOAuthFlow(provider, config);
            
            this.log(`{green-fg}✓ OAuth flow started{/green-fg}`);
            this.log(`Opening browser for authentication...`);
            
            // Open browser
            await open(flow.authUrl);
            
            // Set up success handler
            this.bridge.onSuccess = async (authProvider, tokenData) => {
                this.log(`{green-fg}✅ Successfully authenticated with ${authProvider}!{/green-fg}`);
                await this.refreshAllStatuses();
            };
            
        } catch (error) {
            this.log(`{red-fg}❌ OAuth failed: ${error.message}{/red-fg}`);
        }
    }
    
    async logoutProvider() {
        const provider = this.providers[this.currentProvider];
        const status = this.authStatuses.get(provider);
        
        if (!status?.authenticated) {
            this.log(`{yellow-fg}Not authenticated with ${provider}{/yellow-fg}`);
            return;
        }
        
        try {
            await this.bridge.deleteKeychainItem(status.account, `${provider}-access`);
            await this.bridge.deleteKeychainItem(status.account, `${provider}-refresh`);
            await this.bridge.deleteKeychainItem(status.account, `${provider}-account`);
            
            this.log(`{green-fg}✓ Logged out from ${provider}{/green-fg}`);
            await this.refreshAllStatuses();
            
        } catch (error) {
            this.log(`{red-fg}❌ Logout failed: ${error.message}{/red-fg}`);
        }
    }
    
    async showToken() {
        const provider = this.providers[this.currentProvider];
        const status = this.authStatuses.get(provider);
        
        if (!status?.authenticated) {
            this.log(`{yellow-fg}Not authenticated with ${provider}{/yellow-fg}`);
            return;
        }
        
        try {
            const token = await this.bridge.getKeychainItem(status.account, `${provider}-access`);
            
            // Create token display dialog
            const tokenDialog = blessed.box({
                parent: this.screen,
                top: 'center',
                left: 'center',
                width: '80%',
                height: '50%',
                label: ` ${provider} Access Token `,
                border: { type: 'line' },
                style: {
                    border: { fg: 'cyan' }
                },
                keys: true,
                vi: true,
                scrollable: true,
                alwaysScroll: true,
                content: `{bold}Account:{/bold} ${status.account}\n\n` +
                        `{bold}Token:{/bold}\n${token}\n\n` +
                        `{gray-fg}Press ESC or Q to close{/gray-fg}`
            });
            
            tokenDialog.key(['escape', 'q'], () => {
                tokenDialog.destroy();
                this.screen.render();
            });
            
            tokenDialog.focus();
            this.screen.render();
            
        } catch (error) {
            this.log(`{red-fg}❌ Error getting token: ${error.message}{/red-fg}`);
        }
    }
    
    async configureProvider() {
        const provider = this.providers[this.currentProvider];
        
        // Create configuration form
        const form = blessed.form({
            parent: this.screen,
            top: 'center',
            left: 'center',
            width: '60%',
            height: 12,
            label: ` Configure ${provider} OAuth `,
            border: { type: 'line' },
            style: {
                border: { fg: 'yellow' }
            }
        });
        
        const clientIdLabel = blessed.text({
            parent: form,
            top: 1,
            left: 2,
            content: 'Client ID:'
        });
        
        const clientIdInput = blessed.textbox({
            parent: form,
            top: 1,
            left: 15,
            width: '70%',
            height: 1,
            border: { type: 'line' },
            style: {
                border: { fg: 'white' }
            }
        });
        
        const clientSecretLabel = blessed.text({
            parent: form,
            top: 4,
            left: 2,
            content: 'Client Secret:'
        });
        
        const clientSecretInput = blessed.textbox({
            parent: form,
            top: 4,
            left: 15,
            width: '70%',
            height: 1,
            border: { type: 'line' },
            style: {
                border: { fg: 'white' }
            }
        });
        
        const saveButton = blessed.button({
            parent: form,
            bottom: 1,
            left: 'center',
            content: ' Save ',
            style: {
                fg: 'white',
                bg: 'green',
                hover: {
                    bg: 'light-green'
                }
            }
        });
        
        const cancelButton = blessed.button({
            parent: form,
            bottom: 1,
            right: 2,
            content: ' Cancel ',
            style: {
                fg: 'white',
                bg: 'red',
                hover: {
                    bg: 'light-red'
                }
            }
        });
        
        saveButton.on('press', async () => {
            const clientId = clientIdInput.getValue();
            const clientSecret = clientSecretInput.getValue();
            
            if (clientId && clientSecret) {
                await this.bridge.setKeychainItem('oauth-config', `${provider}-client-id`, clientId);
                await this.bridge.setKeychainItem('oauth-config', `${provider}-client-secret`, clientSecret);
                
                this.log(`{green-fg}✓ ${provider} OAuth configured{/green-fg}`);
            }
            
            form.destroy();
            this.screen.render();
        });
        
        cancelButton.on('press', () => {
            form.destroy();
            this.screen.render();
        });
        
        clientIdInput.focus();
        this.screen.render();
    }
    
    async syncTokens() {
        this.log('Syncing OAuth tokens with web services...');
        
        try {
            const tokens = {};
            for (const provider of this.providers) {
                const status = this.authStatuses.get(provider);
                if (status?.authenticated) {
                    const accessToken = await this.bridge.getKeychainItem(status.account, `${provider}-access`);
                    const refreshToken = await this.bridge.getKeychainItem(status.account, `${provider}-refresh`);
                    
                    tokens[provider] = {
                        account: status.account,
                        accessToken,
                        refreshToken
                    };
                }
            }
            
            // Try to sync with web service
            const response = await fetch('http://localhost:3340/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokens })
            }).catch(() => null);
            
            if (response && response.ok) {
                this.log('{green-fg}✓ Tokens synced successfully{/green-fg}');
            } else {
                this.log('{yellow-fg}⚠ Web services not available - tokens stored locally only{/yellow-fg}');
            }
            
        } catch (error) {
            this.log(`{red-fg}❌ Sync failed: ${error.message}{/red-fg}`);
        }
    }
    
    showHelp() {
        const helpDialog = blessed.box({
            parent: this.screen,
            top: 'center',
            left: 'center',
            width: '60%',
            height: '60%',
            label: ' Help ',
            border: { type: 'line' },
            style: {
                border: { fg: 'cyan' }
            },
            content: `
{bold}SoulFra Auth Manager - Keyboard Shortcuts{/bold}

{cyan-fg}Navigation:{/cyan-fg}
  ↑/↓ or j/k    Navigate providers
  Tab           Switch between panels

{cyan-fg}Actions:{/cyan-fg}
  L or Enter    Login with selected provider
  O             Logout from selected provider
  T             Show access token
  C             Configure OAuth credentials
  S             Sync tokens with web services
  R             Refresh all statuses

{cyan-fg}General:{/cyan-fg}
  H or ?        Show this help
  Q or Ctrl+C   Quit

{gray-fg}OAuth tokens are stored securely in your system keychain.{/gray-fg}
{gray-fg}Press ESC to close this help.{/gray-fg}
            `,
            keys: true
        });
        
        helpDialog.key(['escape', 'q'], () => {
            helpDialog.destroy();
            this.screen.render();
        });
        
        helpDialog.focus();
        this.screen.render();
    }
    
    async getProviderConfig(provider) {
        const clientId = await this.bridge.getKeychainItem('oauth-config', `${provider}-client-id`) ||
                        process.env[`${provider.toUpperCase()}_CLIENT_ID`];
        const clientSecret = await this.bridge.getKeychainItem('oauth-config', `${provider}-client-secret`) ||
                            process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
        
        if (!clientId || !clientSecret) {
            return null;
        }
        
        const configs = {
            github: {
                clientId,
                clientSecret,
                scopes: ['user:email', 'repo']
            },
            google: {
                clientId,
                clientSecret,
                scopes: ['profile', 'email']
            },
            microsoft: {
                clientId,
                clientSecret,
                scopes: ['User.Read', 'offline_access']
            },
            teams: {
                clientId,
                clientSecret,
                scopes: ['User.Read', 'Group.Read.All']
            },
            slack: {
                clientId,
                clientSecret,
                scopes: ['users:read', 'chat:write']
            },
            discord: {
                clientId,
                clientSecret,
                scopes: ['identify', 'email']
            }
        };
        
        return configs[provider];
    }
    
    refreshStatus() {
        this.log('Refreshing authentication statuses...');
        this.refreshAllStatuses();
    }
    
    log(message) {
        this.logPanel.log(message);
    }
    
    cleanup() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
        this.bridge.cleanup();
    }
}

// Check if we have the required dependency
try {
    require.resolve('blessed');
    require.resolve('blessed-contrib');
} catch (e) {
    console.log('Installing required terminal UI libraries...');
    require('child_process').execSync('npm install blessed blessed-contrib', { stdio: 'inherit' });
}

// Start the TUI
const tui = new SoulFraAuthTUI();
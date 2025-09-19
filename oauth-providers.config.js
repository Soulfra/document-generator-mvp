/**
 * OAUTH PROVIDERS CONFIGURATION
 * 
 * Simple configuration file for all OAuth providers.
 * Just flip 'enabled' to true and add your credentials to enable a provider.
 */

module.exports = {
    // DEVELOPER PLATFORMS
    github: {
        enabled: true,
        name: 'GitHub',
        icon: '🐙',
        category: 'developer',
        scopes: ['user:email', 'repo'],
        setupInstructions: {
            url: 'https://github.com/settings/developers',
            steps: [
                '1. Go to GitHub Settings > Developer settings > OAuth Apps',
                '2. Click "New OAuth App"',
                '3. Application name: Your App Name',
                '4. Homepage URL: http://localhost:3340',
                '5. Authorization callback URL: http://localhost:3340/auth/github/callback',
                '6. Click "Register application"',
                '7. Copy the Client ID',
                '8. Generate a new client secret and copy it'
            ]
        }
    },

    // GENERAL PLATFORMS
    google: {
        enabled: true,
        name: 'Google',
        icon: '🔵',
        category: 'general',
        scopes: ['profile', 'email'],
        setupInstructions: {
            url: 'https://console.cloud.google.com',
            steps: [
                '1. Go to Google Cloud Console',
                '2. Create a new project (or select existing)',
                '3. Enable Google+ API',
                '4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID',
                '5. Application type: Web application',
                '6. Add authorized redirect URI: http://localhost:3340/auth/google/callback',
                '7. Copy the Client ID and Client Secret'
            ]
        }
    },

    // GAMING PLATFORMS (Coming Soon)
    xbox: {
        enabled: false,
        name: 'Xbox Live',
        icon: '🎮',
        category: 'gaming',
        comingSoon: true,
        setupInstructions: {
            url: 'https://portal.azure.com',
            note: 'Requires Microsoft Azure AD app registration'
        }
    },

    minecraft: {
        enabled: false,
        name: 'Minecraft',
        icon: '⛏️',
        category: 'gaming',
        comingSoon: true,
        setupInstructions: {
            url: 'https://portal.azure.com',
            note: 'Uses Microsoft OAuth (same as Xbox)'
        }
    },

    roblox: {
        enabled: false,
        name: 'Roblox',
        icon: '🟥',
        category: 'gaming',
        comingSoon: true,
        setupInstructions: {
            url: 'https://create.roblox.com',
            note: 'Requires Roblox OAuth app approval'
        }
    },

    steam: {
        enabled: false,
        name: 'Steam',
        icon: '🎯',
        category: 'gaming',
        comingSoon: true,
        setupInstructions: {
            url: 'https://steamcommunity.com/dev',
            note: 'Uses OpenID, not OAuth'
        }
    },

    // BUSINESS PLATFORMS (Enterprise - Coming Soon)
    teams: {
        enabled: false,
        name: 'Microsoft Teams',
        icon: '👥',
        category: 'business',
        enterprise: true,
        comingSoon: true,
        setupInstructions: {
            url: 'https://portal.azure.com',
            note: 'Requires Azure AD app with Teams permissions'
        }
    },

    slack: {
        enabled: false,
        name: 'Slack',
        icon: '💬',
        category: 'business',
        enterprise: true,
        comingSoon: true,
        setupInstructions: {
            url: 'https://api.slack.com/apps',
            note: 'Requires Slack app creation and workspace approval'
        }
    },

    // SOCIAL PLATFORMS (Future)
    discord: {
        enabled: false,
        name: 'Discord',
        icon: '💜',
        category: 'social',
        comingSoon: true,
        setupInstructions: {
            url: 'https://discord.com/developers/applications',
            note: 'Popular with gaming communities'
        }
    },

    twitch: {
        enabled: false,
        name: 'Twitch',
        icon: '🟣',
        category: 'social',
        comingSoon: true,
        setupInstructions: {
            url: 'https://dev.twitch.tv/console/apps',
            note: 'Great for streamer integration'
        }
    }
};

// Helper function to get enabled providers
module.exports.getEnabledProviders = function() {
    return Object.entries(module.exports)
        .filter(([key, value]) => typeof value === 'object' && value.enabled)
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
};

// Helper function to get providers by category
module.exports.getProvidersByCategory = function() {
    const providers = Object.entries(module.exports)
        .filter(([key, value]) => typeof value === 'object' && key !== 'getEnabledProviders' && key !== 'getProvidersByCategory');
    
    const categorized = {};
    providers.forEach(([key, config]) => {
        const category = config.category || 'other';
        if (!categorized[category]) {
            categorized[category] = {};
        }
        categorized[category][key] = config;
    });
    
    return categorized;
};
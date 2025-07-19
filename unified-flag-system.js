#!/usr/bin/env node

/**
 * UNIFIED FLAG SYSTEM
 * Characters as flags, actions as commands, everything simplified
 * --ralph, --cal, --arty, --charlie flags map to character actions
 */

console.log(`
🚩 UNIFIED FLAG SYSTEM ACTIVE 🚩
Characters as flags • Actions as commands • Simple organization
`);

const fs = require('fs').promises;

class UnifiedFlagSystem {
  constructor() {
    this.characters = new Map();
    this.actions = new Map();
    this.flags = new Map();
    this.documentation = new Map();
    
    this.initializeCharacterFlags();
    this.setupActionMapping();
    this.createDocumentationIndex();
  }

  initializeCharacterFlags() {
    console.log('🚩 Initializing character flags...');
    
    // Each character is a flag with specific actions
    this.characters.set('ralph', {
      flag: '--ralph',
      emoji: '💥',
      description: 'Chaos and bash operations',
      actions: [
        'bash', 'chaos', 'break', 'spam', 'crash', 'pentest'
      ],
      commands: {
        'bash': 'npm run simple-bash',
        'chaos': 'npm run chaos',
        'break': 'npm run break',
        'spam': 'npm run bash-spam',
        'crash': 'npm run crash-ralph',
        'pentest': 'npm run pentest'
      },
      files: ['visual-chaos-stream.js', 'simple-chaos-monitor.js']
    });

    this.characters.set('cal', {
      flag: '--cal',
      emoji: '🎯',
      description: 'Simple interface and fetching',
      actions: [
        'fetch', 'simple', 'wake', 'ask', 'help', 'interface'
      ],
      commands: {
        'fetch': 'npm run fetch',
        'simple': 'npm run cal',
        'wake': 'npm run simple-wake',
        'ask': 'node cal-character-layer.js',
        'help': 'node cal-character-layer.js help',
        'interface': 'npm run localhost'
      },
      files: ['cal-character-layer.js', 'bash-localhost-interface.js']
    });

    this.characters.set('arty', {
      flag: '--arty',
      emoji: '🎨',
      description: 'Design and beautification',
      actions: [
        'design', 'beautify', 'palette', 'style', 'create', 'spawn'
      ],
      commands: {
        'design': 'npm run design',
        'beautify': 'npm run beautify',
        'palette': 'node arty-companion.js palette',
        'style': 'node arty-companion.js design',
        'create': 'node arty-companion.js spawn',
        'spawn': 'npm run spawn'
      },
      files: ['arty-companion.js']
    });

    this.characters.set('charlie', {
      flag: '--charlie',
      emoji: '🛡️',
      description: 'Security and protection',
      actions: [
        'deploy', 'protect', 'secure', 'guard', 'shield', 'contain'
      ],
      commands: {
        'deploy': 'npm run deploy-charlie',
        'protect': 'npm run guardian',
        'secure': 'npm run security',
        'guard': 'npm run pentest',
        'shield': 'npm run guardian-template',
        'contain': 'npm run shadow'
      },
      files: ['guardian-layers.js', 'pentest-framework.js']
    });

    this.characters.set('system', {
      flag: '--system',
      emoji: '⚙️',
      description: 'System operations and orchestration',
      actions: [
        'status', 'health', 'monitor', 'orchestrate', 'deploy', 'reset'
      ],
      commands: {
        'status': 'npm run simple-status',
        'health': 'npm run bash-health',
        'monitor': 'npm run simple-chaos',
        'orchestrate': 'npm run ultimate',
        'deploy': 'npm run remote-deploy',
        'reset': 'npm run simple-reset'
      },
      files: ['unified-character-tool.js', 'bash-system-integration.js']
    });

    console.log('🚩 Character flags ready');
  }

  setupActionMapping() {
    console.log('⚡ Setting up action mapping...');
    
    // Global actions that work across characters
    this.actions.set('help', {
      description: 'Show character-specific help',
      execute: (character) => this.showCharacterHelp(character)
    });

    this.actions.set('list', {
      description: 'List available actions for character',
      execute: (character) => this.listCharacterActions(character)
    });

    this.actions.set('demo', {
      description: 'Run character demo',
      execute: (character) => this.runCharacterDemo(character)
    });

    this.actions.set('status', {
      description: 'Show character status',
      execute: (character) => this.getCharacterStatus(character)
    });

    console.log('⚡ Action mapping ready');
  }

  createDocumentationIndex() {
    console.log('📚 Creating documentation index...');
    
    this.documentation.set('architecture', [
      'CLAUDE.md',
      'CLAUDE.template-processor.md', 
      'CLAUDE.ai-services.md',
      'CLAUDE.document-parser.md'
    ]);

    this.documentation.set('quick-starts', [
      'SIMPLE-CHAOS-QUICK-START.md',
      'README-QUICK-START.md'
    ]);

    this.documentation.set('setup-guides', [
      'discord-setup.md',
      'telegram-setup.md', 
      'obs-setup.md'
    ]);

    this.documentation.set('system-files', [
      'package.json',
      '.env',
      'docker-compose.yml'
    ]);

    console.log('📚 Documentation index ready');
  }

  // Parse command line flags
  parseFlags(args) {
    const parsed = {
      character: null,
      action: null,
      flags: [],
      params: []
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      // Check for character flags
      if (arg.startsWith('--')) {
        const flagName = arg.substring(2);
        if (this.characters.has(flagName)) {
          parsed.character = flagName;
          parsed.flags.push(arg);
        }
      } else if (!parsed.action && parsed.character) {
        // First non-flag after character is the action
        parsed.action = arg;
      } else {
        // Everything else is parameters
        parsed.params.push(arg);
      }
    }

    return parsed;
  }

  // Execute character action
  async executeCharacterAction(character, action, params = []) {
    const char = this.characters.get(character);
    if (!char) {
      console.log(`❌ Unknown character: ${character}`);
      return;
    }

    console.log(`${char.emoji} Executing ${character} action: ${action}`);

    // Check if action exists for character
    if (char.commands[action]) {
      const command = char.commands[action];
      console.log(`🔧 Running: ${command}`);
      
      // For now, just log the command - could execute with child_process
      console.log(`✅ Command mapped: ${command}`);
      return { character, action, command, success: true };
    }

    // Check global actions
    if (this.actions.has(action)) {
      return await this.actions.get(action).execute(character);
    }

    console.log(`❌ Unknown action '${action}' for character '${character}'`);
    this.showCharacterHelp(character);
  }

  showCharacterHelp(character) {
    const char = this.characters.get(character);
    if (!char) return;

    console.log(`\n${char.emoji} ${character.toUpperCase()} - ${char.description}\n`);
    console.log(`Usage: node unified-flag-system.js ${char.flag} <action>\n`);
    console.log('Available actions:');
    char.actions.forEach(action => {
      const command = char.commands[action] || 'Global action';
      console.log(`  ${action.padEnd(12)} - ${command}`);
    });
    console.log('\nGlobal actions: help, list, demo, status\n');
  }

  listCharacterActions(character) {
    const char = this.characters.get(character);
    if (!char) return;

    console.log(`\n${char.emoji} ${character} actions:`);
    console.log(JSON.stringify(char.actions, null, 2));
  }

  async runCharacterDemo(character) {
    console.log(`\n🎬 Running ${character} demo...`);
    
    const char = this.characters.get(character);
    if (!char) return;

    // Simulate demo by showing what would run
    console.log(`Demo would execute these commands:`);
    Object.entries(char.commands).forEach(([action, command]) => {
      console.log(`  ${action}: ${command}`);
    });
  }

  getCharacterStatus(character) {
    const char = this.characters.get(character);
    if (!char) return;

    return {
      character,
      emoji: char.emoji,
      description: char.description,
      actions: char.actions.length,
      commands: Object.keys(char.commands).length,
      files: char.files.length
    };
  }

  // Generate flag documentation
  async generateFlagDocs() {
    let docs = `# 🚩 Unified Flag System Documentation

**Characters as flags, actions as commands, everything simplified**

## Quick Reference

\`\`\`bash
# Character flags
node unified-flag-system.js --ralph bash     # Ralph bashes
node unified-flag-system.js --cal fetch      # Cal fetches
node unified-flag-system.js --arty design    # Arty designs
node unified-flag-system.js --charlie deploy # Charlie deploys
node unified-flag-system.js --system status  # System status
\`\`\`

## Character Flags

`;

    for (const [name, char] of this.characters) {
      docs += `### ${char.flag} - ${char.emoji} ${name.toUpperCase()}
**${char.description}**

Actions: ${char.actions.join(', ')}

Commands:
`;
      Object.entries(char.commands).forEach(([action, command]) => {
        docs += `- \`${action}\` → \`${command}\`\n`;
      });
      docs += `\nFiles: ${char.files.join(', ')}\n\n`;
    }

    docs += `## Global Actions

- \`help\` - Show character help
- \`list\` - List character actions  
- \`demo\` - Run character demo
- \`status\` - Show character status

## Examples

\`\`\`bash
# Ralph chaos
node unified-flag-system.js --ralph bash
node unified-flag-system.js --ralph help

# Cal simplicity  
node unified-flag-system.js --cal fetch
node unified-flag-system.js --cal wake

# Arty creativity
node unified-flag-system.js --arty design website
node unified-flag-system.js --arty palette vibrant

# Charlie security
node unified-flag-system.js --charlie deploy
node unified-flag-system.js --charlie protect

# System operations
node unified-flag-system.js --system status
node unified-flag-system.js --system monitor
\`\`\`

## Integration with Package.json

All flag actions map to existing npm scripts:

\`\`\`json
{
  "scripts": {
    "ralph-bash": "node unified-flag-system.js --ralph bash",
    "cal-fetch": "node unified-flag-system.js --cal fetch", 
    "arty-design": "node unified-flag-system.js --arty design",
    "charlie-deploy": "node unified-flag-system.js --charlie deploy",
    "system-status": "node unified-flag-system.js --system status"
  }
}
\`\`\`
`;

    await fs.writeFile('FLAG-SYSTEM-DOCS.md', docs);
    console.log('📚 Flag documentation generated: FLAG-SYSTEM-DOCS.md');
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log(`
🚩 Unified Flag System

Usage: node unified-flag-system.js <character-flag> <action> [params]

Character Flags:
  --ralph     💥 Chaos and bash operations
  --cal       🎯 Simple interface and fetching  
  --arty      🎨 Design and beautification
  --charlie   🛡️ Security and protection
  --system    ⚙️ System operations

Examples:
  node unified-flag-system.js --ralph bash
  node unified-flag-system.js --cal fetch
  node unified-flag-system.js --arty design
  node unified-flag-system.js --charlie deploy
  node unified-flag-system.js --system status

Special Commands:
  node unified-flag-system.js docs      # Generate documentation
  node unified-flag-system.js list      # List all characters
      `);
      return;
    }

    // Special commands
    if (args[0] === 'docs') {
      await this.generateFlagDocs();
      return;
    }

    if (args[0] === 'list') {
      console.log('\n🚩 Available Characters:\n');
      for (const [name, char] of this.characters) {
        console.log(`${char.flag.padEnd(12)} ${char.emoji} ${char.description}`);
      }
      return;
    }

    // Parse and execute flags
    const parsed = this.parseFlags(args);
    
    if (!parsed.character) {
      console.log('❌ No character flag specified. Use --ralph, --cal, --arty, --charlie, or --system');
      return;
    }

    if (!parsed.action) {
      this.showCharacterHelp(parsed.character);
      return;
    }

    await this.executeCharacterAction(parsed.character, parsed.action, parsed.params);
  }
}

// Export for use as module
module.exports = UnifiedFlagSystem;

// Run CLI if called directly
if (require.main === module) {
  const flagSystem = new UnifiedFlagSystem();
  flagSystem.cli().catch(console.error);
}
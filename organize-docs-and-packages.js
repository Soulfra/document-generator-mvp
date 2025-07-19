#!/usr/bin/env node

/**
 * ORGANIZE DOCS AND PACKAGES
 * Create ARDs, organize READMEs, generate tarballs
 * Clean up the confusion with proper structure
 */

console.log(`
📦 ORGANIZE DOCS AND PACKAGES 📦
ARDs • Documentation • Tarballs • Clean structure
`);

const fs = require('fs').promises;
const path = require('path');

class DocsAndPackages {
  constructor() {
    this.structure = {
      docs: new Map(),
      ards: new Map(),
      packages: new Map(),
      readmes: new Map()
    };
    
    this.initializeStructure();
  }

  initializeStructure() {
    console.log('📁 Initializing documentation structure...');
    
    // Architecture Decision Records
    this.ards.set('001-chaos-monitoring', {
      title: 'ADR-001: Chaos Monitoring Architecture',
      status: 'accepted',
      date: '2025-01-18',
      decision: 'Use dual monitoring approach: heavy for dev, light for production',
      rationale: 'Heavy system hits runtime limits, light system enables Cloudflare deployment'
    });

    this.ards.set('002-character-flags', {
      title: 'ADR-002: Character-Based Flag System',
      status: 'accepted', 
      date: '2025-01-18',
      decision: 'Unified flag system where characters are flags and actions are commands',
      rationale: 'Simplifies confusion, maps directly to functionality'
    });

    this.ards.set('003-external-integration', {
      title: 'ADR-003: External Service Integration',
      status: 'accepted',
      date: '2025-01-18', 
      decision: 'Use webhooks and file-based output for external tools',
      rationale: 'Reduces runtime overhead, enables OBS/Discord/Telegram integration'
    });

    // Documentation categories
    this.docs.set('architecture', [
      'CLAUDE.md',
      'CLAUDE.template-processor.md',
      'CLAUDE.ai-services.md', 
      'CLAUDE.document-parser.md'
    ]);

    this.docs.set('quick-starts', [
      'SIMPLE-CHAOS-QUICK-START.md',
      'FLAG-SYSTEM-DOCS.md'
    ]);

    this.docs.set('setup-guides', [
      'discord-setup.md',
      'telegram-setup.md',
      'obs-setup.md'
    ]);

    // Package definitions
    this.packages.set('chaos-monitor-light', {
      name: 'chaos-monitor-light',
      description: 'Lightweight chaos monitoring for Cloudflare/production',
      files: [
        'simple-chaos-monitor.js',
        'SIMPLE-CHAOS-QUICK-START.md',
        'setup-external-alerts.sh',
        'test-alerts.js'
      ],
      commands: ['simple-chaos', 'simple-bash', 'simple-wake', 'simple-reset']
    });

    this.packages.set('chaos-monitor-full', {
      name: 'chaos-monitor-full', 
      description: 'Full-featured chaos monitoring for development',
      files: [
        'visual-chaos-stream.js',
        'chaos-stream-interface.html'
      ],
      commands: ['chaos', 'bash-spam', 'break', 'wake', 'chaos-demo']
    });

    this.packages.set('character-system', {
      name: 'character-system',
      description: 'Unified character flag system',
      files: [
        'unified-flag-system.js',
        'cal-character-layer.js',
        'arty-companion.js',
        'guardian-layers.js',
        'FLAG-SYSTEM-DOCS.md'
      ],
      commands: ['cal', 'arty', 'design', 'fetch', 'spawn']
    });

    this.packages.set('doc-generator-core', {
      name: 'doc-generator-core',
      description: 'Core document generator functionality',
      files: [
        'cli.js',
        'sovereign-chatlog-processor.js',
        'CLAUDE.md',
        'package.json'
      ],
      commands: ['start', 'web', 'api', 'sovereign']
    });

    console.log('📁 Structure initialized');
  }

  // Generate Architecture Decision Records
  async generateARDs() {
    console.log('📋 Generating Architecture Decision Records...');
    
    const ardDir = 'docs/architecture/adrs';
    await this.ensureDir(ardDir);

    for (const [id, ard] of this.ards) {
      const content = `# ${ard.title}

**Status:** ${ard.status}  
**Date:** ${ard.date}

## Context

Document Generator system has grown complex with multiple monitoring approaches, character systems, and external integrations.

## Decision

${ard.decision}

## Rationale

${ard.rationale}

## Consequences

### Positive
- Simplified system understanding
- Clear separation of concerns
- Better runtime performance
- External tool compatibility

### Negative
- Additional abstraction layer
- Need to maintain multiple approaches

## Implementation

See related files and documentation for implementation details.

## Notes

Generated as part of system organization and documentation cleanup.
`;

      await fs.writeFile(`${ardDir}/${id}.md`, content);
      console.log(`📋 Generated: ${id}.md`);
    }
  }

  // Organize existing documentation
  async organizeDocumentation() {
    console.log('📚 Organizing documentation...');
    
    const docsDir = 'docs';
    await this.ensureDir(docsDir);
    await this.ensureDir(`${docsDir}/quick-starts`);
    await this.ensureDir(`${docsDir}/setup-guides`);
    await this.ensureDir(`${docsDir}/architecture`);

    // Create master documentation index
    const masterIndex = `# 📚 Document Generator Documentation

## Quick Start
- [Simple Chaos Monitor](quick-starts/SIMPLE-CHAOS-QUICK-START.md)
- [Flag System](quick-starts/FLAG-SYSTEM-DOCS.md)

## Architecture
- [Main Architecture](architecture/CLAUDE.md) 
- [Template Processor](architecture/CLAUDE.template-processor.md)
- [AI Services](architecture/CLAUDE.ai-services.md)
- [Document Parser](architecture/CLAUDE.document-parser.md)

## Architecture Decision Records
- [ADR-001: Chaos Monitoring](architecture/adrs/001-chaos-monitoring.md)
- [ADR-002: Character Flags](architecture/adrs/002-character-flags.md)
- [ADR-003: External Integration](architecture/adrs/003-external-integration.md)

## Setup Guides
- [Discord Integration](setup-guides/discord-setup.md)
- [Telegram Bots](setup-guides/telegram-setup.md)
- [OBS Streaming](setup-guides/obs-setup.md)

## Package Documentation
- [Chaos Monitor Light](packages/chaos-monitor-light/README.md)
- [Chaos Monitor Full](packages/chaos-monitor-full/README.md)
- [Character System](packages/character-system/README.md)
- [Core Generator](packages/doc-generator-core/README.md)

## System Overview

\`\`\`
Document Generator
├── Core System (document processing)
├── Character System (Ralph, Cal, Arty, Charlie)
├── Chaos Monitoring (light/heavy)
├── External Integration (Discord, OBS, Cloudflare)
└── Flag System (unified interface)
\`\`\`

## Quick Commands

\`\`\`bash
# Character flags
npm run unified-flag -- --ralph bash
npm run unified-flag -- --cal fetch  
npm run unified-flag -- --arty design

# Monitoring
npm run simple-chaos    # Lightweight
npm run chaos          # Full featured

# Package creation
npm run create-packages
npm run create-tarballs
\`\`\`
`;

    await fs.writeFile(`${docsDir}/README.md`, masterIndex);
    console.log('📚 Master documentation index created');
  }

  // Create distribution packages
  async createPackages() {
    console.log('📦 Creating distribution packages...');
    
    const packagesDir = 'packages';
    await this.ensureDir(packagesDir);

    for (const [id, pkg] of this.packages) {
      const pkgDir = `${packagesDir}/${pkg.name}`;
      await this.ensureDir(pkgDir);

      // Create package.json
      const packageJson = {
        name: pkg.name,
        version: '1.0.0',
        description: pkg.description,
        main: pkg.files[0],
        scripts: {},
        keywords: ['document-generator', 'chaos-monitoring', 'character-system'],
        author: 'Document Generator Team',
        license: 'MIT'
      };

      // Add scripts from commands
      pkg.commands.forEach(cmd => {
        packageJson.scripts[cmd] = `node ${pkg.files[0]} ${cmd}`;
      });

      await fs.writeFile(`${pkgDir}/package.json`, JSON.stringify(packageJson, null, 2));

      // Create package README
      const readme = `# ${pkg.name}

${pkg.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
${pkg.commands.map(cmd => `npm run ${cmd}`).join('\n')}
\`\`\`

## Files

${pkg.files.map(file => `- ${file}`).join('\n')}

## Documentation

See main documentation for detailed usage instructions.
`;

      await fs.writeFile(`${pkgDir}/README.md`, readme);
      
      // Copy actual files (would need to implement file copying)
      console.log(`📦 Package structure created: ${pkg.name}`);
    }
  }

  // Create tarballs for distribution
  async createTarballs() {
    console.log('🗜️ Creating distribution tarballs...');
    
    const distDir = 'dist';
    await this.ensureDir(distDir);

    // Create tarball creation script
    const tarballScript = `#!/bin/bash

# Create distribution tarballs

echo "🗜️ Creating distribution packages..."

# Create packages directory if not exists
mkdir -p dist

# Chaos Monitor Light (Cloudflare-ready)
echo "📦 Creating chaos-monitor-light.tar.gz..."
tar -czf dist/chaos-monitor-light.tar.gz \\
  simple-chaos-monitor.js \\
  SIMPLE-CHAOS-QUICK-START.md \\
  setup-external-alerts.sh \\
  test-alerts.js \\
  cloudflare-worker.js \\
  --transform 's|^|chaos-monitor-light/|'

# Chaos Monitor Full (Development)  
echo "📦 Creating chaos-monitor-full.tar.gz..."
tar -czf dist/chaos-monitor-full.tar.gz \\
  visual-chaos-stream.js \\
  chaos-stream-interface.html \\
  --transform 's|^|chaos-monitor-full/|'

# Character System
echo "📦 Creating character-system.tar.gz..." 
tar -czf dist/character-system.tar.gz \\
  unified-flag-system.js \\
  cal-character-layer.js \\
  arty-companion.js \\
  guardian-layers.js \\
  FLAG-SYSTEM-DOCS.md \\
  --transform 's|^|character-system/|'

# Complete System
echo "📦 Creating document-generator-complete.tar.gz..."
tar -czf dist/document-generator-complete.tar.gz \\
  --exclude='node_modules' \\
  --exclude='.git' \\
  --exclude='dist' \\
  --exclude='*.log' \\
  . \\
  --transform 's|^\\./|document-generator/|'

# Documentation Package
echo "📦 Creating documentation.tar.gz..."
tar -czf dist/documentation.tar.gz \\
  docs/ \\
  *.md \\
  --transform 's|^|documentation/|'

echo "✅ Tarballs created in dist/ directory:"
ls -la dist/*.tar.gz

echo ""
echo "📋 Distribution Summary:"
echo "  chaos-monitor-light.tar.gz     - Lightweight monitoring (Cloudflare)"
echo "  chaos-monitor-full.tar.gz      - Full monitoring (Development)"  
echo "  character-system.tar.gz        - Character flags and actions"
echo "  document-generator-complete.tar.gz - Complete system"
echo "  documentation.tar.gz           - All documentation"
`;

    await fs.writeFile('create-tarballs.sh', tarballScript);
    await fs.chmod('create-tarballs.sh', 0o755);
    
    console.log('🗜️ Tarball creation script generated: create-tarballs.sh');
  }

  // Create distribution manifest
  async createDistributionManifest() {
    const manifest = {
      name: 'Document Generator Distribution',
      version: '1.0.0',
      created: new Date().toISOString(),
      packages: Object.fromEntries(this.packages),
      documentation: Object.fromEntries(this.docs),
      architecture_decisions: Object.fromEntries(this.ards),
      distribution: {
        tarballs: [
          'chaos-monitor-light.tar.gz',
          'chaos-monitor-full.tar.gz', 
          'character-system.tar.gz',
          'document-generator-complete.tar.gz',
          'documentation.tar.gz'
        ],
        deployment_targets: [
          'Cloudflare Workers',
          'Local Development',
          'OBS Streaming',
          'Discord Bots',
          'Telegram Bots'
        ]
      },
      quick_start: {
        lightweight: 'npm run simple-chaos',
        full_featured: 'npm run chaos',
        character_flags: 'node unified-flag-system.js --ralph bash',
        documentation: 'open docs/README.md'
      }
    };

    await fs.writeFile('DISTRIBUTION-MANIFEST.json', JSON.stringify(manifest, null, 2));
    console.log('📋 Distribution manifest created');
  }

  // Utility to ensure directory exists
  async ensureDir(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'ards':
        await this.generateARDs();
        break;

      case 'docs':
        await this.organizeDocumentation();
        break;

      case 'packages':
        await this.createPackages();
        break;

      case 'tarballs':
        await this.createTarballs();
        break;

      case 'manifest':
        await this.createDistributionManifest();
        break;

      case 'all':
        console.log('🚀 Running complete organization...');
        await this.generateARDs();
        await this.organizeDocumentation(); 
        await this.createPackages();
        await this.createTarballs();
        await this.createDistributionManifest();
        console.log('✅ Complete organization finished!');
        break;

      default:
        console.log(`
📦 Organize Docs and Packages

Commands:
  node organize-docs-and-packages.js ards        # Generate Architecture Decision Records
  node organize-docs-and-packages.js docs        # Organize documentation structure
  node organize-docs-and-packages.js packages    # Create distribution packages  
  node organize-docs-and-packages.js tarballs    # Create tarball distribution
  node organize-docs-and-packages.js manifest    # Create distribution manifest
  node organize-docs-and-packages.js all         # Run complete organization

📋 What gets organized:

📚 Documentation:
  - ADRs (Architecture Decision Records)
  - Quick start guides
  - Setup instructions
  - API documentation

📦 Packages:
  - chaos-monitor-light (Cloudflare-ready)
  - chaos-monitor-full (Development)
  - character-system (Flag interface)
  - doc-generator-core (Main system)

🗜️ Tarballs:
  - Ready-to-deploy packages
  - Complete system archive
  - Documentation bundle

🚩 Flag System:
  - Characters as flags (--ralph, --cal, --arty)
  - Actions as commands (bash, fetch, design)
  - Clear mapping to functionality

✅ Clears up confusion with organized structure!
        `);
    }
  }
}

// Export for use as module
module.exports = DocsAndPackages;

// Run CLI if called directly
if (require.main === module) {
  const organizer = new DocsAndPackages();
  organizer.cli().catch(console.error);
}
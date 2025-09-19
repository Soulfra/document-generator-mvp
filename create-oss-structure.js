#!/usr/bin/env node

/**
 * OSS STRUCTURE CREATOR
 * Transforms the Soulfra Platform into a world-class open source project
 * Creates modular packages, workflows, and complete distribution system
 */

const fs = require('fs');
const path = require('path');

class OSSStructureCreator {
  constructor() {
    this.rootDir = path.join(__dirname, 'soulfra-platform');
    this.packages = [
      'core',
      'flag-tag-system', 
      'ai-economy',
      'master-menu',
      'electron-wrapper',
      'simp-compactor',
      'document-generator',
      'template-engine',
      'real-data-hooks',
      'vanity-rooms'
    ];
    
    this.plugins = [
      'stripe',
      'babylon', 
      'godot',
      'auth',
      'analytics',
      'monitoring'
    ];
  }

  async create() {
    console.log('🚀 CREATING OSS STRUCTURE FOR SOULFRA PLATFORM...\n');
    
    // Create root structure
    this.createRootStructure();
    
    // Create packages
    this.createPackages();
    
    // Create plugins
    this.createPlugins();
    
    // Create GitHub workflows
    this.createWorkflows();
    
    // Create documentation
    this.createDocumentation();
    
    // Create examples
    this.createExamples();
    
    // Create root files
    this.createRootFiles();
    
    console.log('\n✅ OSS STRUCTURE COMPLETE!');
    console.log(`📁 Created at: ${this.rootDir}`);
  }

  createRootStructure() {
    console.log('📁 Creating root structure...');
    
    const dirs = [
      '',
      '.github',
      '.github/workflows',
      '.github/ISSUE_TEMPLATE',
      'packages',
      'plugins', 
      'examples',
      'docs',
      'docker',
      'scripts',
      'community'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.join(this.rootDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  createPackages() {
    console.log('📦 Creating modular packages...');
    
    this.packages.forEach(pkg => {
      const pkgDir = path.join(this.rootDir, 'packages', pkg);
      fs.mkdirSync(pkgDir, { recursive: true });
      
      // Create package.json
      const packageJson = {
        name: `@soulfra/${pkg}`,
        version: '1.0.0',
        description: `Soulfra Platform - ${pkg} module`,
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        scripts: {
          build: 'tsc',
          test: 'jest',
          lint: 'eslint src --ext .ts,.tsx',
          prepublishOnly: 'npm run build'
        },
        keywords: ['soulfra', pkg],
        author: 'Soulfra Team',
        license: 'MIT',
        publishConfig: {
          access: 'public'
        },
        dependencies: {},
        devDependencies: {
          '@types/node': '^18.0.0',
          'typescript': '^5.0.0',
          'jest': '^29.0.0',
          'eslint': '^8.0.0'
        }
      };
      
      fs.writeFileSync(
        path.join(pkgDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      // Create source structure
      fs.mkdirSync(path.join(pkgDir, 'src'), { recursive: true });
      fs.mkdirSync(path.join(pkgDir, 'tests'), { recursive: true });
      
      // Create index.ts
      const indexContent = this.getPackageIndexContent(pkg);
      fs.writeFileSync(path.join(pkgDir, 'src', 'index.ts'), indexContent);
      
      // Create README
      const readmeContent = `# @soulfra/${pkg}

> ${pkg} module for the Soulfra Platform

## Installation

\`\`\`bash
npm install @soulfra/${pkg}
\`\`\`

## Usage

\`\`\`typescript
import { ${this.toPascalCase(pkg)} } from '@soulfra/${pkg}';

const ${this.toCamelCase(pkg)} = new ${this.toPascalCase(pkg)}();
\`\`\`

## API Reference

See [API Documentation](https://docs.soulfra.io/packages/${pkg})

## License

MIT © Soulfra Team`;
      
      fs.writeFileSync(path.join(pkgDir, 'README.md'), readmeContent);
      
      // Create TypeScript config
      const tsConfig = {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          outDir: './dist',
          rootDir: './src'
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'tests']
      };
      
      fs.writeFileSync(
        path.join(pkgDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );
    });
  }

  createPlugins() {
    console.log('🔌 Creating plugin structure...');
    
    this.plugins.forEach(plugin => {
      const pluginDir = path.join(this.rootDir, 'plugins', plugin);
      fs.mkdirSync(pluginDir, { recursive: true });
      
      // Create plugin manifest
      const manifest = {
        name: `@soulfra/plugin-${plugin}`,
        version: '1.0.0',
        description: `${plugin} plugin for Soulfra Platform`,
        main: 'index.js',
        soulfra: {
          type: 'plugin',
          hooks: [
            'menu:register',
            'api:extend',
            'flag:register'
          ],
          dependencies: ['@soulfra/core']
        }
      };
      
      fs.writeFileSync(
        path.join(pluginDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
      
      // Create plugin index
      const pluginIndex = `/**
 * ${plugin} Plugin for Soulfra Platform
 */

export default {
  name: '${plugin}',
  version: '1.0.0',
  
  // Initialize plugin
  async init(platform) {
    console.log('🔌 Initializing ${plugin} plugin...');
    
    // Register with platform
    platform.plugins.register('${plugin}', this);
  },
  
  // Hook implementations
  hooks: {
    'menu:register': (menu) => {
      menu.addCategory({
        id: '${plugin}',
        title: '${this.toPascalCase(plugin)}',
        icon: '🔌',
        items: []
      });
    },
    
    'api:extend': (app) => {
      app.get('/plugin/${plugin}', (req, res) => {
        res.json({ plugin: '${plugin}', status: 'active' });
      });
    },
    
    'flag:register': (flags) => {
      flags.add('PLUGIN_${plugin.toUpperCase()}_ENABLED', true);
    }
  }
};`;
      
      fs.writeFileSync(path.join(pluginDir, 'index.js'), pluginIndex);
    });
  }

  createWorkflows() {
    console.log('🔧 Creating GitHub workflows...');
    
    // CI Workflow
    const ciWorkflow = `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build packages
      run: npm run build
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      if: matrix.node-version == '18.x'`;
    
    fs.writeFileSync(
      path.join(this.rootDir, '.github/workflows/ci.yml'),
      ciWorkflow
    );
    
    // Release Workflow
    const releaseWorkflow = `name: Release

on:
  push:
    branches: [ main ]

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        registry-url: 'https://registry.npmjs.org'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build packages
      run: npm run build
    
    - name: Create Release
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      run: |
        npm run release`;
    
    fs.writeFileSync(
      path.join(this.rootDir, '.github/workflows/release.yml'),
      releaseWorkflow
    );
    
    // Docker Build Workflow
    const dockerWorkflow = `name: Docker

on:
  push:
    tags: [ 'v*' ]

jobs:
  docker:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to DockerHub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: soulfra/platform
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}`;
    
    fs.writeFileSync(
      path.join(this.rootDir, '.github/workflows/docker.yml'),
      dockerWorkflow
    );
  }

  createDocumentation() {
    console.log('📚 Creating documentation...');
    
    // Main README
    const readme = `# 🎯 Soulfra Platform

<div align="center">
  
  [![CI](https://github.com/soulfra/platform/workflows/CI/badge.svg)](https://github.com/soulfra/platform/actions)
  [![npm version](https://badge.fury.io/js/@soulfra%2Fcore.svg)](https://www.npmjs.com/package/@soulfra/core)
  [![Docker Pulls](https://img.shields.io/docker/pulls/soulfra/platform)](https://hub.docker.com/r/soulfra/platform)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Discord](https://img.shields.io/discord/123456789?label=Discord&logo=discord)](https://discord.gg/soulfra)
  
  **The complete platform that compresses complexity into clarity**
  
  [Documentation](https://docs.soulfra.io) • [Demo](https://demo.soulfra.io) • [Discord](https://discord.gg/soulfra) • [Contribute](#contributing)
  
</div>

## ✨ Features

- 🎯 **Master Menu Interface** - 25 endpoints compressed into 1 unified interface
- 🏴 **Flag-Tag System** - Advanced coordination and state management
- 🤖 **AI Economy** - Multi-AI orchestration with progressive enhancement
- 💾 **Smart Persistence** - Automatic database synchronization
- 🖥️ **Desktop Ready** - Native Electron app for all platforms
- 🔌 **Plugin System** - Extend everything with custom plugins
- 📦 **Modular Architecture** - Use only what you need
- 🚀 **One-Click Deploy** - Docker, Kubernetes, Cloud ready

## 🚀 Quick Start

### npm (Recommended)

\`\`\`bash
# Create new Soulfra app
npm create soulfra-app my-platform
cd my-platform
npm start
\`\`\`

### Docker

\`\`\`bash
docker run -p 3000:3000 soulfra/platform
\`\`\`

### From Source

\`\`\`bash
git clone https://github.com/soulfra/platform.git
cd platform
npm install
npm run bootstrap
npm start
\`\`\`

Visit http://localhost:3000/master to see the unified interface.

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@soulfra/core](packages/core) | ![npm](https://img.shields.io/npm/v/@soulfra/core) | Core platform engine |
| [@soulfra/flag-tag-system](packages/flag-tag-system) | ![npm](https://img.shields.io/npm/v/@soulfra/flag-tag-system) | Coordination system |
| [@soulfra/ai-economy](packages/ai-economy) | ![npm](https://img.shields.io/npm/v/@soulfra/ai-economy) | AI orchestration |
| [@soulfra/master-menu](packages/master-menu) | ![npm](https://img.shields.io/npm/v/@soulfra/master-menu) | Unified interface |
| [@soulfra/electron-wrapper](packages/electron-wrapper) | ![npm](https://img.shields.io/npm/v/@soulfra/electron-wrapper) | Desktop app builder |

## 🔌 Plugins

Extend Soulfra with official and community plugins:

- 💳 [Stripe](plugins/stripe) - Payment processing
- 🎮 [Babylon.js](plugins/babylon) - 3D visualization
- 🎯 [Godot](plugins/godot) - Game engine integration
- 🔐 [Auth](plugins/auth) - Authentication providers
- 📊 [Analytics](plugins/analytics) - Usage analytics
- 🔍 [Monitoring](plugins/monitoring) - System monitoring

## 🏗️ Architecture

\`\`\`
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Master Menu   │────▶│  Flag-Tag System│────▶│   AI Economy    │
│  (Single Entry) │     │  (Coordination) │     │ (Orchestration) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Plugins     │
                        │   (Extensible)  │
                        └─────────────────┘
\`\`\`

## 🚀 Deployment

### Railway (One-Click)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/soulfra)

### Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/soulfra/platform)

### Kubernetes
\`\`\`bash
kubectl apply -f https://raw.githubusercontent.com/soulfra/platform/main/k8s/deploy.yaml
\`\`\`

## 🤝 Contributing

We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

\`\`\`bash
# Clone the repo
git clone https://github.com/soulfra/platform.git
cd platform

# Install dependencies
npm install

# Start development
npm run dev
\`\`\`

## 📖 Documentation

- [Getting Started](https://docs.soulfra.io/getting-started)
- [API Reference](https://docs.soulfra.io/api)
- [Plugin Development](https://docs.soulfra.io/plugins)
- [Contributing Guide](https://docs.soulfra.io/contributing)

## 💬 Community

- [Discord Server](https://discord.gg/soulfra)
- [GitHub Discussions](https://github.com/soulfra/platform/discussions)
- [Twitter](https://twitter.com/soulfra)

## 📄 License

MIT © Soulfra Team

---

<div align="center">
  Made with ❤️ by the Soulfra Community
</div>`;
    
    fs.writeFileSync(path.join(this.rootDir, 'README.md'), readme);
    
    // Contributing Guide
    const contributing = `# Contributing to Soulfra Platform

First off, thank you for considering contributing to Soulfra! 🎉

## Code of Conduct

This project adheres to the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

- Use the [issue tracker](https://github.com/soulfra/platform/issues)
- Follow the bug report template
- Include reproduction steps

### Suggesting Features

- Check existing [feature requests](https://github.com/soulfra/platform/issues?q=is%3Aissue+label%3Aenhancement)
- Open a new issue with the enhancement label
- Describe the use case clearly

### Pull Requests

1. Fork the repo
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Development Process

\`\`\`bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build all packages
npm run build
\`\`\`

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation changes
- \`style:\` Code style changes
- \`refactor:\` Code refactoring
- \`test:\` Test changes
- \`chore:\` Build process or auxiliary tool changes

## Recognition

Contributors are recognized in:
- [AUTHORS.md](AUTHORS.md)
- Release notes
- Project website

Thank you! 🙏`;
    
    fs.writeFileSync(path.join(this.rootDir, 'CONTRIBUTING.md'), contributing);
  }

  createExamples() {
    console.log('📝 Creating examples...');
    
    // Basic example
    const basicExample = path.join(this.rootDir, 'examples', 'basic-setup');
    fs.mkdirSync(basicExample, { recursive: true });
    
    const basicPackageJson = {
      name: 'soulfra-basic-example',
      version: '1.0.0',
      private: true,
      dependencies: {
        '@soulfra/core': '^1.0.0',
        '@soulfra/master-menu': '^1.0.0'
      },
      scripts: {
        start: 'node index.js'
      }
    };
    
    fs.writeFileSync(
      path.join(basicExample, 'package.json'),
      JSON.stringify(basicPackageJson, null, 2)
    );
    
    const basicIndex = `/**
 * Basic Soulfra Platform Setup
 */

const { SoulfraCore } = require('@soulfra/core');
const { MasterMenu } = require('@soulfra/master-menu');

// Initialize platform
const platform = new SoulfraCore({
  port: 3000,
  name: 'My Platform'
});

// Add master menu
platform.use(new MasterMenu());

// Start platform
platform.start().then(() => {
  console.log('🚀 Platform running at http://localhost:3000/master');
});`;
    
    fs.writeFileSync(path.join(basicExample, 'index.js'), basicIndex);
  }

  createRootFiles() {
    console.log('📄 Creating root configuration files...');
    
    // Root package.json
    const rootPackage = {
      name: 'soulfra-platform',
      version: '1.0.0',
      private: true,
      workspaces: [
        'packages/*',
        'plugins/*'
      ],
      scripts: {
        bootstrap: 'lerna bootstrap',
        build: 'lerna run build',
        test: 'lerna run test',
        lint: 'lerna run lint',
        dev: 'lerna run dev --parallel',
        release: 'lerna publish',
        'create-package': 'node scripts/create-package.js',
        'create-plugin': 'node scripts/create-plugin.js'
      },
      devDependencies: {
        'lerna': '^7.0.0',
        '@types/node': '^18.0.0',
        'typescript': '^5.0.0',
        'jest': '^29.0.0',
        'eslint': '^8.0.0',
        'prettier': '^3.0.0'
      }
    };
    
    fs.writeFileSync(
      path.join(this.rootDir, 'package.json'),
      JSON.stringify(rootPackage, null, 2)
    );
    
    // Lerna configuration
    const lernaConfig = {
      version: 'independent',
      npmClient: 'npm',
      command: {
        publish: {
          conventionalCommits: true,
          message: 'chore(release): publish',
          registry: 'https://registry.npmjs.org',
          allowBranch: ['main', 'release/*']
        }
      }
    };
    
    fs.writeFileSync(
      path.join(this.rootDir, 'lerna.json'),
      JSON.stringify(lernaConfig, null, 2)
    );
    
    // License
    const license = `MIT License

Copyright (c) 2024 Soulfra Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
    
    fs.writeFileSync(path.join(this.rootDir, 'LICENSE'), license);
    
    // Code of Conduct
    const codeOfConduct = `# Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone.

## Our Standards

Examples of behavior that contributes to a positive environment:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders at conduct@soulfra.io.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.0.

[homepage]: https://www.contributor-covenant.org`;
    
    fs.writeFileSync(path.join(this.rootDir, 'CODE_OF_CONDUCT.md'), codeOfConduct);
  }

  // Helper methods
  getPackageIndexContent(pkg) {
    const className = this.toPascalCase(pkg);
    return `/**
 * @soulfra/${pkg}
 * ${pkg} module for Soulfra Platform
 */

export interface ${className}Options {
  enabled?: boolean;
  config?: Record<string, any>;
}

export class ${className} {
  private options: ${className}Options;
  
  constructor(options: ${className}Options = {}) {
    this.options = {
      enabled: true,
      ...options
    };
  }
  
  async init(): Promise<void> {
    console.log('Initializing ${pkg}...');
  }
  
  async start(): Promise<void> {
    if (!this.options.enabled) {
      console.log('${pkg} is disabled');
      return;
    }
    
    console.log('Starting ${pkg}...');
  }
}

export default ${className};`;
  }

  toPascalCase(str) {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  toCamelCase(str) {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}

// Execute
if (require.main === module) {
  const creator = new OSSStructureCreator();
  creator.create().catch(console.error);
}

module.exports = OSSStructureCreator;
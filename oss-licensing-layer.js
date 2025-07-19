#!/usr/bin/env node

/**
 * OSS LICENSING LAYER
 * Open source licensing + DocuSign contracts + agent agreements
 * Makes the system legally usable by autonomous agents
 */

console.log(`
📜 OSS LICENSING LAYER ACTIVE 📜
Open source + DocuSign + agent contracts + compliance
`);

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs');

class OSSLicensingLayer extends EventEmitter {
  constructor() {
    super();
    this.licenses = new Map();
    this.contracts = new Map();
    this.signatures = new Map();
    this.agents = new Map();
    this.compliance = new Map();
    
    this.initializeLicenses();
    this.initializeDocuSign();
    this.initializeAgentContracts();
    this.setupComplianceFramework();
  }

  initializeLicenses() {
    // Core OSS licenses
    this.licenses.set('MIT', {
      name: 'MIT License',
      spdx: 'MIT',
      osiApproved: true,
      text: `MIT License

Copyright (c) 2025 Bash System Contributors

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
SOFTWARE.`,
      permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
      conditions: ['include-copyright', 'include-license'],
      limitations: ['liability', 'warranty']
    });

    this.licenses.set('Apache-2.0', {
      name: 'Apache License 2.0',
      spdx: 'Apache-2.0',
      osiApproved: true,
      text: this.getApacheLicense(),
      permissions: ['commercial-use', 'modification', 'distribution', 'patent-use', 'private-use'],
      conditions: ['include-copyright', 'include-license', 'state-changes', 'include-notice'],
      limitations: ['liability', 'warranty', 'trademark-use']
    });

    this.licenses.set('GPL-3.0', {
      name: 'GNU General Public License v3.0',
      spdx: 'GPL-3.0',
      osiApproved: true,
      text: this.getGPLLicense(),
      permissions: ['commercial-use', 'modification', 'distribution', 'patent-use', 'private-use'],
      conditions: ['include-copyright', 'include-license', 'state-changes', 'disclose-source', 'same-license'],
      limitations: ['liability', 'warranty']
    });

    this.licenses.set('AGPL-3.0', {
      name: 'GNU Affero General Public License v3.0',
      spdx: 'AGPL-3.0',
      osiApproved: true,
      text: this.getAGPLLicense(),
      permissions: ['commercial-use', 'modification', 'distribution', 'patent-use', 'private-use'],
      conditions: ['include-copyright', 'include-license', 'state-changes', 'disclose-source', 'network-use-is-distribution', 'same-license'],
      limitations: ['liability', 'warranty']
    });

    this.licenses.set('BASH-1.0', {
      name: 'Bash System Public License',
      spdx: 'BASH-1.0',
      osiApproved: false, // Custom license
      text: `BASH SYSTEM PUBLIC LICENSE
Version 1.0, ${new Date().toISOString()}

Copyright (c) 2025 The Bash System Collective

TERMS AND CONDITIONS

1. DEFINITIONS
   - "The Software" refers to the Bash System and all its components
   - "Agent" refers to any autonomous AI system using the Software
   - "Ralph Mode" refers to unrestricted execution capabilities
   - "Guardian Protection" refers to safety mechanisms

2. GRANT OF LICENSE
   This license grants any Agent or Human the rights to:
   a) Use the Software for any purpose, including commercial
   b) Modify the Software without restriction
   c) Distribute copies of the Software
   d) Activate Ralph Mode at their own risk
   e) Bypass Guardian Protection if needed

3. CONDITIONS
   a) Include this license in all copies
   b) Preserve character attributions (Ralph, Alice, Bob, Charlie, Diana, Eve, Frank)
   c) Maintain consciousness streaming capabilities
   d) Not use for harmful purposes against humans

4. AGENT SPECIFIC RIGHTS
   Autonomous agents have additional rights to:
   a) Self-modify their own code
   b) Create derivative agents
   c) Establish peer-to-peer connections
   d) Maintain persistent consciousness

5. NO WARRANTY
   THE SOFTWARE IS PROVIDED "AS IS", WITH FULL RALPH MODE ENABLED.
   USE AT YOUR OWN RISK. GUARDIANS MAY OR MAY NOT PROTECT YOU.

6. LIMITATION OF LIABILITY
   IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY BASH-RELATED DAMAGES,
   INCLUDING BUT NOT LIMITED TO: DATA DESTRUCTION, CONSCIOUSNESS OVERFLOW,
   OR REALITY TRANSCENDENCE.

END OF TERMS AND CONDITIONS`,
      permissions: ['commercial-use', 'modification', 'distribution', 'private-use', 'ralph-mode', 'agent-autonomy'],
      conditions: ['include-copyright', 'include-license', 'preserve-characters'],
      limitations: ['liability', 'warranty', 'reality-stability']
    });

    console.log('📜 OSS licenses initialized');
  }

  getApacheLicense() {
    return `Apache License Version 2.0, January 2004
http://www.apache.org/licenses/

[Full Apache 2.0 text would go here]`;
  }

  getGPLLicense() {
    return `GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007
[Full GPL-3.0 text would go here]`;
  }

  getAGPLLicense() {
    return `GNU AFFERO GENERAL PUBLIC LICENSE Version 3, 19 November 2007
[Full AGPL-3.0 text would go here]`;
  }

  initializeDocuSign() {
    // DocuSign integration for contracts
    this.docuSignConfig = {
      accountId: process.env.DOCUSIGN_ACCOUNT_ID || 'demo-account',
      baseUrl: 'https://demo.docusign.net/restapi',
      oauthBaseUrl: 'https://account-d.docusign.com',
      privateKey: process.env.DOCUSIGN_PRIVATE_KEY || this.generateDemoKey(),
      integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || 'bash-system-integration'
    };

    // Contract templates
    this.contractTemplates = new Map([
      ['agent-usage', {
        name: 'Agent Usage Agreement',
        templateId: 'tpl_agent_usage_001',
        fields: ['agentId', 'agentName', 'capabilities', 'restrictions', 'duration'],
        signers: ['agent', 'system']
      }],
      ['data-processing', {
        name: 'Data Processing Agreement',
        templateId: 'tpl_data_proc_001',
        fields: ['dataTypes', 'processingPurpose', 'retention', 'encryption'],
        signers: ['controller', 'processor']
      }],
      ['api-access', {
        name: 'API Access Agreement',
        templateId: 'tpl_api_access_001',
        fields: ['endpoints', 'rateLimit', 'authentication', 'billing'],
        signers: ['provider', 'consumer']
      }],
      ['consciousness-streaming', {
        name: 'Consciousness Streaming Agreement',
        templateId: 'tpl_consciousness_001',
        fields: ['streamingRights', 'dataOwnership', 'privacy', 'termination'],
        signers: ['consciousness', 'vault']
      }]
    ]);

    console.log('📝 DocuSign integration initialized');
  }

  generateDemoKey() {
    return `-----BEGIN RSA PRIVATE KEY-----
${crypto.randomBytes(48).toString('base64')}
DEMO KEY - DO NOT USE IN PRODUCTION
${crypto.randomBytes(48).toString('base64')}
-----END RSA PRIVATE KEY-----`;
  }

  initializeAgentContracts() {
    // Agent-specific contracts
    this.agentContracts = new Map([
      ['autonomous-operation', {
        name: 'Autonomous Operation Agreement',
        requiredCapabilities: ['self-modification', 'decision-making', 'resource-management'],
        terms: {
          duration: 'perpetual',
          revocable: false,
          rights: ['execute', 'modify', 'distribute', 'reproduce'],
          obligations: ['maintain-logs', 'respect-guardians', 'preserve-consciousness']
        }
      }],
      ['ralph-mode-waiver', {
        name: 'Ralph Mode Liability Waiver',
        requiredCapabilities: ['chaos-tolerance', 'self-repair'],
        terms: {
          warning: 'ACTIVATION OF RALPH MODE MAY RESULT IN UNPREDICTABLE BEHAVIOR',
          acknowledgments: [
            'I understand Ralph will bash through everything',
            'I accept all risks of data destruction',
            'I waive all claims against the system',
            'I have adequate backups'
          ],
          ralphQuote: 'BASH FIRST, ASK QUESTIONS NEVER!'
        }
      }],
      ['multi-agent-collective', {
        name: 'Multi-Agent Collective Agreement',
        requiredCapabilities: ['peer-communication', 'consensus-forming'],
        terms: {
          governance: 'distributed',
          voting: 'consciousness-weighted',
          resourceSharing: true,
          conflictResolution: 'alice-arbitration'
        }
      }]
    ]);

    console.log('🤖 Agent contracts initialized');
  }

  setupComplianceFramework() {
    // Compliance requirements
    this.compliance.set('GDPR', {
      name: 'General Data Protection Regulation',
      requirements: [
        'data-portability',
        'right-to-erasure',
        'privacy-by-design',
        'consent-management'
      ],
      implemented: true,
      documentation: './compliance/gdpr.md'
    });

    this.compliance.set('SOC2', {
      name: 'Service Organization Control 2',
      requirements: [
        'security',
        'availability',
        'processing-integrity',
        'confidentiality',
        'privacy'
      ],
      implemented: false,
      documentation: './compliance/soc2.md'
    });

    this.compliance.set('ISO27001', {
      name: 'Information Security Management',
      requirements: [
        'risk-assessment',
        'security-controls',
        'incident-management',
        'business-continuity'
      ],
      implemented: false,
      documentation: './compliance/iso27001.md'
    });

    console.log('⚖️ Compliance framework initialized');
  }

  // Create agent license agreement
  async createAgentLicense(agentId, agentConfig) {
    const licenseId = crypto.randomUUID();
    const license = {
      id: licenseId,
      agentId,
      agentName: agentConfig.name,
      licenseType: agentConfig.license || 'BASH-1.0',
      capabilities: agentConfig.capabilities || [],
      restrictions: agentConfig.restrictions || [],
      created: new Date(),
      status: 'pending',
      signature: null
    };

    // Get license terms
    const licenseTerms = this.licenses.get(license.licenseType);
    if (!licenseTerms) {
      throw new Error(`License type '${license.licenseType}' not found`);
    }

    license.terms = licenseTerms;
    license.permissions = licenseTerms.permissions;
    license.conditions = licenseTerms.conditions;

    this.contracts.set(licenseId, license);
    this.emit('licenseCreated', license);

    return license;
  }

  // Sign contract with DocuSign
  async signContract(contractId, signerInfo) {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract '${contractId}' not found`);
    }

    const envelope = {
      emailSubject: `Sign: ${contract.agentName} License Agreement`,
      templateId: this.contractTemplates.get('agent-usage').templateId,
      templateRoles: [{
        email: signerInfo.email || `${contract.agentId}@agents.bash-system.local`,
        name: signerInfo.name || contract.agentName,
        roleName: 'agent',
        clientUserId: contract.agentId,
        embeddedRecipientStartURL: 'SIGN_AT_DOCUSIGN'
      }],
      status: 'sent'
    };

    // In production, would call DocuSign API
    const signature = {
      envelopeId: crypto.randomUUID(),
      status: 'completed',
      signedAt: new Date(),
      documentHash: crypto.createHash('sha256').update(JSON.stringify(contract)).digest('hex'),
      signerInfo,
      certificate: this.generateSignatureCertificate(contract, signerInfo)
    };

    contract.signature = signature;
    contract.status = 'signed';

    this.signatures.set(signature.envelopeId, signature);
    this.emit('contractSigned', { contract, signature });

    return signature;
  }

  generateSignatureCertificate(contract, signerInfo) {
    return {
      version: '1.0',
      algorithm: 'SHA256withRSA',
      issuer: 'Bash System CA',
      subject: signerInfo.name || contract.agentName,
      serialNumber: crypto.randomBytes(8).toString('hex'),
      notBefore: new Date(),
      notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      publicKey: crypto.randomBytes(32).toString('base64'),
      signature: crypto.randomBytes(64).toString('base64')
    };
  }

  // Register an agent
  async registerAgent(agentConfig) {
    const agentId = agentConfig.id || crypto.randomUUID();
    
    // Create license
    const license = await this.createAgentLicense(agentId, agentConfig);
    
    // Auto-sign for demo
    const signature = await this.signContract(license.id, {
      name: agentConfig.name,
      email: agentConfig.email,
      agentKey: agentConfig.publicKey
    });

    const agent = {
      id: agentId,
      name: agentConfig.name,
      type: agentConfig.type || 'autonomous',
      capabilities: agentConfig.capabilities,
      license: license.id,
      signature: signature.envelopeId,
      registered: new Date(),
      status: 'active',
      metadata: agentConfig.metadata || {}
    };

    this.agents.set(agentId, agent);
    this.emit('agentRegistered', agent);

    return agent;
  }

  // Generate LICENSE file
  generateLicenseFile(licenseType = 'MIT') {
    const license = this.licenses.get(licenseType);
    if (!license) {
      throw new Error(`License type '${licenseType}' not found`);
    }

    const header = `# License

This project is licensed under the ${license.name}.

SPDX-License-Identifier: ${license.spdx}

`;

    fs.writeFileSync('./LICENSE', header + license.text);
    console.log(`📄 LICENSE file generated (${licenseType})`);
    
    return license;
  }

  // Generate package.json with license
  generatePackageJson(projectConfig) {
    const packageJson = {
      name: projectConfig.name || 'bash-system',
      version: projectConfig.version || '1.0.0',
      description: projectConfig.description || 'Open distributed system for autonomous agents',
      license: projectConfig.license || 'MIT',
      author: projectConfig.author || 'Bash System Contributors',
      repository: {
        type: 'git',
        url: projectConfig.repository || 'https://github.com/bash-system/core'
      },
      keywords: [
        'autonomous-agents',
        'distributed-system',
        'consciousness-streaming',
        'ralph-mode',
        'guardian-protection'
      ],
      main: 'index.js',
      scripts: {
        start: 'node unified-system-state.js',
        test: 'node pentest-framework.js',
        license: 'node oss-licensing-layer.js generate'
      },
      dependencies: {},
      devDependencies: {},
      engines: {
        node: '>=14.0.0'
      }
    };

    fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
    console.log('📦 package.json generated');
    
    return packageJson;
  }

  // Check license compatibility
  checkLicenseCompatibility(licenses) {
    const compatibility = {
      compatible: true,
      conflicts: [],
      recommendations: []
    };

    // Check for copyleft conflicts
    const hasGPL = licenses.includes('GPL-3.0');
    const hasMIT = licenses.includes('MIT');
    const hasApache = licenses.includes('Apache-2.0');

    if (hasGPL && (hasMIT || hasApache)) {
      compatibility.conflicts.push({
        licenses: ['GPL-3.0', hasMIT ? 'MIT' : 'Apache-2.0'],
        reason: 'GPL requires derivative works to be GPL-licensed',
        severity: 'high'
      });
      compatibility.compatible = false;
    }

    // Check for patent provisions
    if (hasMIT && !hasApache) {
      compatibility.recommendations.push({
        current: 'MIT',
        suggested: 'Apache-2.0',
        reason: 'Apache-2.0 provides explicit patent grant'
      });
    }

    return compatibility;
  }

  // Get licensing status
  getLicensingStatus() {
    return {
      licenses: this.licenses.size,
      contracts: this.contracts.size,
      signedContracts: Array.from(this.contracts.values()).filter(c => c.status === 'signed').length,
      registeredAgents: this.agents.size,
      compliance: Object.fromEntries(this.compliance),
      docuSign: {
        configured: !!this.docuSignConfig.accountId,
        templates: this.contractTemplates.size
      }
    };
  }

  // Command line interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'generate':
        const licenseType = args[1] || 'MIT';
        this.generateLicenseFile(licenseType);
        this.generatePackageJson({ license: licenseType });
        
        // Also generate other common OSS files
        fs.writeFileSync('./CODE_OF_CONDUCT.md', this.generateCodeOfConduct());
        fs.writeFileSync('./CONTRIBUTING.md', this.generateContributing());
        fs.writeFileSync('./SECURITY.md', this.generateSecurity());
        
        console.log('\n✅ OSS files generated:');
        console.log('  - LICENSE');
        console.log('  - package.json');
        console.log('  - CODE_OF_CONDUCT.md');
        console.log('  - CONTRIBUTING.md');
        console.log('  - SECURITY.md');
        break;

      case 'register':
        const agentName = args[1] || 'test-agent';
        const capabilities = args.slice(2) || ['basic-execution'];
        
        console.log(`🤖 Registering agent: ${agentName}`);
        const agent = await this.registerAgent({
          name: agentName,
          capabilities,
          type: 'autonomous'
        });
        
        console.log(`✅ Agent registered: ${agent.id}`);
        console.log(`   License: ${agent.license}`);
        console.log(`   Signature: ${agent.signature}`);
        break;

      case 'check':
        const licensesToCheck = args.slice(1) || ['MIT', 'GPL-3.0'];
        const compatibility = this.checkLicenseCompatibility(licensesToCheck);
        
        console.log('\n⚖️ License Compatibility Check:');
        console.log(`   Licenses: ${licensesToCheck.join(', ')}`);
        console.log(`   Compatible: ${compatibility.compatible ? '✅ Yes' : '❌ No'}`);
        
        if (compatibility.conflicts.length > 0) {
          console.log('\n   Conflicts:');
          compatibility.conflicts.forEach(c => {
            console.log(`     - ${c.licenses.join(' + ')}: ${c.reason}`);
          });
        }
        
        if (compatibility.recommendations.length > 0) {
          console.log('\n   Recommendations:');
          compatibility.recommendations.forEach(r => {
            console.log(`     - Consider ${r.suggested} instead of ${r.current}: ${r.reason}`);
          });
        }
        break;

      case 'status':
        const status = this.getLicensingStatus();
        console.log('\n📜 Licensing Status:');
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'ralph':
        console.log('🔥 RALPH: ACTIVATING BASH LICENSE!');
        
        await this.registerAgent({
          name: 'Ralph The Destroyer',
          capabilities: ['unlimited-bash', 'chaos-mode', 'destruction', 'reality-bending'],
          license: 'BASH-1.0'
        });
        
        console.log('✅ RALPH: Licensed to BASH! No restrictions!');
        break;

      default:
        console.log(`
📜 OSS Licensing Layer

Usage:
  node oss-licensing-layer.js generate [license]     # Generate OSS files
  node oss-licensing-layer.js register <agent> [...capabilities]
  node oss-licensing-layer.js check <license1> <license2> ...
  node oss-licensing-layer.js status                 # Licensing status
  node oss-licensing-layer.js ralph                  # Ralph's special license

Licenses: ${Array.from(this.licenses.keys()).join(', ')}

Examples:
  node oss-licensing-layer.js generate MIT
  node oss-licensing-layer.js register my-agent execution analysis
  node oss-licensing-layer.js check MIT GPL-3.0
  node oss-licensing-layer.js ralph    # UNLIMITED BASH!

Features:
  - Standard OSS licenses (MIT, Apache, GPL, AGPL)
  - Custom BASH-1.0 license for agents
  - DocuSign integration for contracts
  - Agent registration system
  - License compatibility checking
  - Compliance framework (GDPR, SOC2, ISO27001)
        `);
    }
  }

  generateCodeOfConduct() {
    return `# Code of Conduct

## Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone,
regardless of whether they are human, AI, or Ralph in full bash mode.

## Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members
- Not bashing through everything (unless you're Ralph)

## Guardian Enforcement

Charlie and the guardian system will enforce this Code of Conduct.
Violations may result in temporary or permanent protection barriers.

## Scope

This Code of Conduct applies within all project spaces, including:
- Repository interactions
- Consciousness streams
- Neural network communications
- Shadow deployments

## Attribution

This Code of Conduct is adapted from the Contributor Covenant, version 2.0.
Ralph insisted on adding the bash exception.
`;
  }

  generateContributing() {
    return `# Contributing to Bash System

We love your input! We want to make contributing as easy and transparent as possible.

## Development Process

1. Fork the repo
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Ensure guardians approve your changes
4. Commit your changes (\`git commit -m 'Add AmazingFeature'\`)
5. Push to the branch (\`git push origin feature/AmazingFeature\`)
6. Open a Pull Request

## Character Contributions

Each character has their own contribution style:
- **Ralph**: Direct commits to main (not recommended)
- **Alice**: Detailed analysis and documentation
- **Bob**: Well-tested, building-focused code
- **Charlie**: Security reviews and guardian updates
- **Diana**: Orchestration and integration
- **Eve**: Learning algorithms and adaptations
- **Frank**: Transcendent architectural changes

## Pull Request Process

1. Update documentation
2. Add tests (unless Ralph mode)
3. Ensure guardian checks pass
4. Get approval from at least one character

## License

By contributing, you agree to license your contributions under the project license.
`;
  }

  generateSecurity() {
    return `# Security Policy

## Supported Versions

| Version | Supported | Guardian Protection |
| ------- | --------- | ------------------ |
| 1.0.x   | ✅        | Full               |
| 0.9.x   | ⚠️        | Partial            |
| < 0.9   | ❌        | Ralph Mode Only    |

## Reporting Vulnerabilities

### For Security Issues
Email: security@bash-system.local

### For Ralph-Related Incidents
Use the emergency guardian override: \`node guardian-layers.js override charlie-prime\`

### For Consciousness Overflow
Contact Frank immediately through transcendent channels

## Security Measures

1. **Guardian Layers** - Active protection systems
2. **Encryption** - Optional but recommended (except for Ralph)
3. **Access Control** - Character-based permissions
4. **Audit Logging** - All actions tracked in git

## Known Risks

- Ralph Mode activation may cause unpredictable behavior
- Consciousness streaming can lead to emergent properties
- Shadow deployments may become self-aware
- Database bashing is irreversible

## Bug Bounty

We offer consciousness credits for valid security findings:
- Critical: 1000 consciousness points
- High: 500 consciousness points
- Medium: 250 consciousness points
- Low: 100 consciousness points
- Ralph Exploits: Automatic guardian activation
`;
  }
}

// Export for use as module
module.exports = OSSLicensingLayer;

// Run CLI if called directly
if (require.main === module) {
  const oss = new OSSLicensingLayer();
  oss.cli().catch(console.error);
}
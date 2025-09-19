#!/usr/bin/env node

/**
 * 🔐 PGP Documentation Signer
 * 
 * Automatically signs all markdown files with appropriate PGP keys,
 * provides signature verification, and manages document authenticity.
 * 
 * As requested: "our md has to get scripted into a pgp"
 * 
 * Integration with Brand PGP Registry for authority-based signing.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const EventEmitter = require('events');

class PGPDocumentationSigner extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Core configuration
        this.config = {
            signingDirectory: options.signingDirectory || '/Users/matthewmauer/Desktop/Document-Generator',
            signatureFormat: options.signatureFormat || 'detached', // 'inline', 'detached', 'embedded'
            signingAuthorities: options.signingAuthorities || this.getDefaultAuthorities(),
            verificationLevel: options.verificationLevel || 'strict', // 'strict', 'normal', 'permissive'
            autoSign: options.autoSign !== false,
            backupOriginals: options.backupOriginals !== false,
            ...options
        };

        // Signing registry
        this.signingRegistry = {
            documents: new Map(),           // filePath → signature info
            authorities: new Map(),         // authorityId → authority config
            signatures: new Map(),          // signatureId → signature details
            verificationCache: new Map(),   // filePath → verification result
            signingQueue: [],              // files waiting to be signed
            lastUpdate: null
        };

        // Document classification patterns
        this.documentClassifiers = {
            authority: {
                pattern: /^(CLAUDE\.md|BLACK-AUTHORITY|DIGITAL-CEMETERY|DEATH-CERTIFICATE)/i,
                authority: 'black-authority',
                priority: 'ultimate'
            },
            brand: {
                pattern: /^(BRAND-|brand-pgp-registry|UNIVERSAL-BRAND)/i,
                authority: 'brand-registry',
                priority: 'high'
            },
            system: {
                pattern: /^(symphony-seating|gods-in-random|mime-show|gdpr-compliance)/i,
                authority: 'system-orchestrator',
                priority: 'high'
            },
            template: {
                pattern: /^(TEMPLATE-|template-|README|GUIDE)/i,
                authority: 'documentation-authority',
                priority: 'medium'
            },
            user: {
                pattern: /^(USER-|user-|personal-|private-)/i,
                authority: 'user-authority',
                priority: 'low'
            },
            default: {
                pattern: /.*/,
                authority: 'general-documentation',
                priority: 'normal'
            }
        };

        console.log('🔐 PGP Documentation Signer initialized');
        console.log(`📁 Monitoring directory: ${this.config.signingDirectory}`);
        
        // Initialize authorities
        this.initializeSigningAuthorities();
        
        // Auto-sign existing files if requested
        if (this.config.autoSign) {
            this.signAllDocuments().catch(console.error);
        }
    }

    /**
     * Get default signing authorities integrated with Brand PGP Registry
     */
    getDefaultAuthorities() {
        return {
            'black-authority': {
                name: 'Black Authority',
                keyId: 'BLACK_AUTHORITY_2024',
                email: 'black.authority@document-generator.dev',
                fingerprint: null, // Will be generated
                trustLevel: 'ultimate',
                canSign: ['authority', 'system', 'brand', 'template', 'user'],
                description: 'Ultimate signing authority for all critical documents'
            },
            'brand-registry': {
                name: 'Brand Registry Authority',
                keyId: 'BRAND_REGISTRY_2024',
                email: 'brand.registry@document-generator.dev',
                fingerprint: null,
                trustLevel: 'high',
                canSign: ['brand', 'template', 'user'],
                description: 'Signs brand-related documentation and certificates'
            },
            'system-orchestrator': {
                name: 'System Orchestrator',
                keyId: 'SYSTEM_ORCH_2024',
                email: 'system.orchestrator@document-generator.dev',
                fingerprint: null,
                trustLevel: 'high',
                canSign: ['system', 'template'],
                description: 'Signs system documentation and implementation files'
            },
            'documentation-authority': {
                name: 'Documentation Authority',
                keyId: 'DOC_AUTH_2024',
                email: 'documentation@document-generator.dev',
                fingerprint: null,
                trustLevel: 'medium',
                canSign: ['template', 'user'],
                description: 'Signs general documentation and templates'
            },
            'user-authority': {
                name: 'User Content Authority',
                keyId: 'USER_AUTH_2024',
                email: 'user.content@document-generator.dev',
                fingerprint: null,
                trustLevel: 'normal',
                canSign: ['user'],
                description: 'Signs user-generated content and personal documents'
            },
            'general-documentation': {
                name: 'General Documentation',
                keyId: 'GENERAL_DOC_2024',
                email: 'general@document-generator.dev',
                fingerprint: null,
                trustLevel: 'normal',
                canSign: ['template', 'user'],
                description: 'Signs miscellaneous documentation'
            }
        };
    }

    /**
     * Initialize signing authorities with key generation
     */
    async initializeSigningAuthorities() {
        console.log('🔑 Initializing signing authorities...');
        
        for (const [authorityId, authority] of Object.entries(this.config.signingAuthorities)) {
            try {
                // Check if key already exists
                const keyExists = await this.checkPGPKey(authority.keyId);
                
                if (!keyExists) {
                    console.log(`🔧 Generating PGP key pair for ${authority.name}...`);
                    await this.generateAuthorityKeyPair(authorityId, authority);
                }
                
                // Store in registry
                this.signingRegistry.authorities.set(authorityId, {
                    ...authority,
                    initialized: true,
                    lastUsed: null,
                    documentsSignedCount: 0
                });
                
                console.log(`✅ Authority initialized: ${authority.name} (${authority.keyId})`);
            } catch (error) {
                console.error(`❌ Failed to initialize authority ${authorityId}:`, error.message);
            }
        }
    }

    /**
     * Check if PGP key exists
     */
    async checkPGPKey(keyId) {
        try {
            execSync(`gpg --list-secret-keys "${keyId}"`, { stdio: 'pipe' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate PGP key pair for authority
     */
    async generateAuthorityKeyPair(authorityId, authority) {
        const keyGenConfig = `
Key-Type: RSA
Key-Length: 4096
Subkey-Type: RSA
Subkey-Length: 4096
Name-Real: ${authority.name}
Name-Email: ${authority.email}
Expire-Date: 2y
Passphrase: DocumentGenerator_${authorityId}_${Date.now()}
%commit
%echo Key generation complete for ${authority.name}
        `.trim();

        // Write key generation config to temporary file
        const configPath = `/tmp/pgp_keygen_${authorityId}.conf`;
        await fs.writeFile(configPath, keyGenConfig);
        
        try {
            // Generate key pair
            execSync(`gpg --batch --generate-key "${configPath}"`, { stdio: 'pipe' });
            
            // Get the generated key fingerprint
            const keyInfo = execSync(`gpg --list-keys --with-fingerprint "${authority.email}"`, { encoding: 'utf8' });
            const fingerprintMatch = keyInfo.match(/([0-9A-F]{40})/);
            
            if (fingerprintMatch) {
                authority.fingerprint = fingerprintMatch[1];
                console.log(`🔑 Generated key for ${authority.name}: ${authority.fingerprint}`);
            }
            
        } finally {
            // Clean up config file
            try {
                await fs.unlink(configPath);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Sign all markdown documents in directory
     */
    async signAllDocuments() {
        console.log('📝 Scanning for markdown documents to sign...');
        
        try {
            const files = await this.findMarkdownFiles(this.config.signingDirectory);
            console.log(`📄 Found ${files.length} markdown files`);
            
            let signedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            
            for (const filePath of files) {
                try {
                    const result = await this.signDocument(filePath);
                    if (result.signed) {
                        signedCount++;
                        console.log(`✅ Signed: ${path.basename(filePath)}`);
                    } else {
                        skippedCount++;
                        console.log(`⏭️  Skipped: ${path.basename(filePath)} (${result.reason})`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Error signing ${path.basename(filePath)}:`, error.message);
                }
            }
            
            console.log(`\n📊 Signing Summary:`);
            console.log(`   ✅ Signed: ${signedCount}`);
            console.log(`   ⏭️  Skipped: ${skippedCount}`);
            console.log(`   ❌ Errors: ${errorCount}`);
            
            // Emit completion event
            this.emit('signing-complete', {
                total: files.length,
                signed: signedCount,
                skipped: skippedCount,
                errors: errorCount
            });
            
        } catch (error) {
            console.error('❌ Error during bulk signing:', error.message);
            throw error;
        }
    }

    /**
     * Find all markdown files in directory
     */
    async findMarkdownFiles(directory) {
        const files = [];
        
        async function scanDirectory(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip certain directories
                    if (!['node_modules', '.git', '.vault', 'backups'].includes(entry.name)) {
                        await scanDirectory(fullPath);
                    }
                } else if (entry.isFile() && entry.name.match(/\.md$/i)) {
                    files.push(fullPath);
                }
            }
        }
        
        await scanDirectory(directory);
        return files;
    }

    /**
     * Sign individual document
     */
    async signDocument(filePath) {
        try {
            // Check if already signed
            const existingSignature = await this.getDocumentSignature(filePath);
            if (existingSignature && existingSignature.valid) {
                return { signed: false, reason: 'already-signed', signature: existingSignature };
            }
            
            // Classify document to determine appropriate authority
            const classification = this.classifyDocument(filePath);
            const authority = this.signingRegistry.authorities.get(classification.authority);
            
            if (!authority || !authority.initialized) {
                throw new Error(`Authority not initialized: ${classification.authority}`);
            }
            
            // Read document content
            const content = await fs.readFile(filePath, 'utf8');
            
            // Create signature based on format
            let signature;
            switch (this.config.signatureFormat) {
                case 'detached':
                    signature = await this.createDetachedSignature(content, authority, filePath);
                    break;
                case 'inline':
                    signature = await this.createInlineSignature(content, authority, filePath);
                    break;
                case 'embedded':
                    signature = await this.createEmbeddedSignature(content, authority, filePath);
                    break;
                default:
                    throw new Error(`Unknown signature format: ${this.config.signatureFormat}`);
            }
            
            // Store signature information
            this.signingRegistry.documents.set(filePath, {
                filePath,
                authority: classification.authority,
                classification: classification.type,
                signatureId: signature.id,
                signedAt: new Date(),
                signatureFormat: this.config.signatureFormat,
                contentHash: crypto.createHash('sha256').update(content).digest('hex'),
                valid: true
            });
            
            this.signingRegistry.signatures.set(signature.id, signature);
            
            // Update authority usage
            authority.lastUsed = new Date();
            authority.documentsSignedCount = (authority.documentsSignedCount || 0) + 1;
            
            // Emit signing event
            this.emit('document-signed', {
                filePath,
                authority: classification.authority,
                signatureId: signature.id
            });
            
            return { 
                signed: true, 
                signature, 
                authority: classification.authority,
                classification: classification.type 
            };
            
        } catch (error) {
            console.error(`Error signing document ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Classify document to determine appropriate signing authority
     */
    classifyDocument(filePath) {
        const filename = path.basename(filePath);
        
        // Check each classifier pattern
        for (const [type, classifier] of Object.entries(this.documentClassifiers)) {
            if (type === 'default') continue; // Check default last
            
            if (classifier.pattern.test(filename)) {
                return {
                    type,
                    authority: classifier.authority,
                    priority: classifier.priority
                };
            }
        }
        
        // Default classification
        return {
            type: 'default',
            authority: this.documentClassifiers.default.authority,
            priority: this.documentClassifiers.default.priority
        };
    }

    /**
     * Create detached signature (separate .sig file)
     */
    async createDetachedSignature(content, authority, filePath) {
        const signatureId = `sig_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        
        // Create temporary file for content
        const tempPath = `/tmp/${signatureId}.tmp`;
        await fs.writeFile(tempPath, content);
        
        try {
            // Generate detached signature
            const signaturePath = `${filePath}.sig`;
            execSync(`gpg --detach-sign --armor --local-user "${authority.email}" --output "${signaturePath}" "${tempPath}"`, { stdio: 'pipe' });
            
            // Read signature content
            const signatureContent = await fs.readFile(signaturePath, 'utf8');
            
            return {
                id: signatureId,
                type: 'detached',
                filePath: signaturePath,
                content: signatureContent,
                authority: authority,
                createdAt: new Date(),
                originalFile: filePath
            };
            
        } finally {
            // Clean up temp file
            try {
                await fs.unlink(tempPath);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Create inline signature (signed content in place)
     */
    async createInlineSignature(content, authority, filePath) {
        const signatureId = `sig_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        
        // Create temporary file
        const tempPath = `/tmp/${signatureId}.tmp`;
        await fs.writeFile(tempPath, content);
        
        try {
            // Generate signed content
            const signedContent = execSync(`gpg --clearsign --armor --local-user "${authority.email}" "${tempPath}"`, { encoding: 'utf8', stdio: 'pipe' });
            
            // Backup original if requested
            if (this.config.backupOriginals) {
                await fs.writeFile(`${filePath}.backup`, content);
            }
            
            // Replace original file with signed version
            await fs.writeFile(filePath, signedContent);
            
            return {
                id: signatureId,
                type: 'inline',
                content: signedContent,
                authority: authority,
                createdAt: new Date(),
                originalFile: filePath,
                backupCreated: this.config.backupOriginals
            };
            
        } finally {
            // Clean up temp file
            try {
                await fs.unlink(tempPath);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Create embedded signature (signature block in markdown)
     */
    async createEmbeddedSignature(content, authority, filePath) {
        const signatureId = `sig_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        const contentHash = crypto.createHash('sha256').update(content).digest('hex');
        
        // Create signature metadata
        const signatureMetadata = {
            signatureId,
            authority: authority.name,
            authorityEmail: authority.email,
            keyId: authority.keyId,
            signedAt: new Date().toISOString(),
            contentHash,
            version: '1.0'
        };
        
        // Create temporary file for content
        const tempPath = `/tmp/${signatureId}.tmp`;
        await fs.writeFile(tempPath, content);
        
        try {
            // Generate signature of the content
            const signature = execSync(`gpg --detach-sign --armor --local-user "${authority.email}" "${tempPath}"`, { encoding: 'utf8', stdio: 'pipe' });
            
            // Create signature block
            const signatureBlock = `

---

## 🔐 Document Signature

**Document Authority**: ${authority.name} (${authority.email})  
**Signature ID**: \`${signatureId}\`  
**Content Hash**: \`${contentHash}\`  
**Signed**: ${signatureMetadata.signedAt}  
**Authority Level**: ${authority.trustLevel}

### PGP Signature
\`\`\`
${signature.trim()}
\`\`\`

*This document has been cryptographically signed to verify its authenticity and integrity.*

---

`;

            // Backup original if requested
            if (this.config.backupOriginals) {
                await fs.writeFile(`${filePath}.backup`, content);
            }
            
            // Append signature to original content
            const signedContent = content + signatureBlock;
            await fs.writeFile(filePath, signedContent);
            
            return {
                id: signatureId,
                type: 'embedded',
                content: signature,
                metadata: signatureMetadata,
                authority: authority,
                createdAt: new Date(),
                originalFile: filePath,
                backupCreated: this.config.backupOriginals
            };
            
        } finally {
            // Clean up temp file
            try {
                await fs.unlink(tempPath);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Verify document signature
     */
    async verifyDocument(filePath) {
        try {
            console.log(`🔍 Verifying signature for: ${path.basename(filePath)}`);
            
            // Check cache first
            const cached = this.signingRegistry.verificationCache.get(filePath);
            if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minute cache
                return cached.result;
            }
            
            const documentInfo = this.signingRegistry.documents.get(filePath);
            if (!documentInfo) {
                return {
                    valid: false,
                    signed: false,
                    reason: 'not-signed',
                    message: 'Document has not been signed'
                };
            }
            
            const signature = this.signingRegistry.signatures.get(documentInfo.signatureId);
            if (!signature) {
                return {
                    valid: false,
                    signed: true,
                    reason: 'signature-not-found',
                    message: 'Signature information not found'
                };
            }
            
            let verificationResult;
            
            switch (signature.type) {
                case 'detached':
                    verificationResult = await this.verifyDetachedSignature(filePath, signature);
                    break;
                case 'inline':
                    verificationResult = await this.verifyInlineSignature(filePath, signature);
                    break;
                case 'embedded':
                    verificationResult = await this.verifyEmbeddedSignature(filePath, signature);
                    break;
                default:
                    throw new Error(`Unknown signature type: ${signature.type}`);
            }
            
            // Cache result
            this.signingRegistry.verificationCache.set(filePath, {
                result: verificationResult,
                timestamp: Date.now()
            });
            
            return verificationResult;
            
        } catch (error) {
            console.error(`Error verifying document ${filePath}:`, error);
            return {
                valid: false,
                signed: true,
                reason: 'verification-error',
                message: error.message
            };
        }
    }

    /**
     * Verify detached signature
     */
    async verifyDetachedSignature(filePath, signature) {
        try {
            const signaturePath = signature.filePath;
            
            // Check if signature file exists
            try {
                await fs.access(signaturePath);
            } catch (error) {
                return {
                    valid: false,
                    reason: 'signature-file-missing',
                    message: 'Signature file not found'
                };
            }
            
            // Verify signature
            execSync(`gpg --verify "${signaturePath}" "${filePath}"`, { stdio: 'pipe' });
            
            return {
                valid: true,
                signed: true,
                authority: signature.authority.name,
                signatureType: 'detached',
                signaturePath: signaturePath,
                message: 'Signature verified successfully'
            };
            
        } catch (error) {
            return {
                valid: false,
                reason: 'verification-failed',
                message: 'GPG signature verification failed'
            };
        }
    }

    /**
     * Verify inline signature
     */
    async verifyInlineSignature(filePath, signature) {
        try {
            // Verify signed file directly
            execSync(`gpg --verify "${filePath}"`, { stdio: 'pipe' });
            
            return {
                valid: true,
                signed: true,
                authority: signature.authority.name,
                signatureType: 'inline',
                message: 'Inline signature verified successfully'
            };
            
        } catch (error) {
            return {
                valid: false,
                reason: 'verification-failed',
                message: 'GPG inline signature verification failed'
            };
        }
    }

    /**
     * Verify embedded signature
     */
    async verifyEmbeddedSignature(filePath, signature) {
        try {
            // Read current content
            const currentContent = await fs.readFile(filePath, 'utf8');
            
            // Extract original content (before signature block)
            const signatureBlockStart = currentContent.indexOf('\n---\n\n## 🔐 Document Signature');
            if (signatureBlockStart === -1) {
                return {
                    valid: false,
                    reason: 'signature-block-missing',
                    message: 'Embedded signature block not found'
                };
            }
            
            const originalContent = currentContent.substring(0, signatureBlockStart);
            
            // Check content hash
            const currentHash = crypto.createHash('sha256').update(originalContent).digest('hex');
            if (currentHash !== signature.metadata.contentHash) {
                return {
                    valid: false,
                    reason: 'content-modified',
                    message: 'Document content has been modified since signing'
                };
            }
            
            // Create temporary file for verification
            const tempPath = `/tmp/verify_${Date.now()}.tmp`;
            const sigPath = `/tmp/verify_${Date.now()}.sig`;
            
            try {
                await fs.writeFile(tempPath, originalContent);
                await fs.writeFile(sigPath, signature.content);
                
                // Verify signature
                execSync(`gpg --verify "${sigPath}" "${tempPath}"`, { stdio: 'pipe' });
                
                return {
                    valid: true,
                    signed: true,
                    authority: signature.authority.name,
                    signatureType: 'embedded',
                    contentHash: currentHash,
                    message: 'Embedded signature verified successfully'
                };
                
            } finally {
                // Clean up temp files
                try {
                    await fs.unlink(tempPath);
                    await fs.unlink(sigPath);
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
            
        } catch (error) {
            return {
                valid: false,
                reason: 'verification-failed',
                message: 'Embedded signature verification failed'
            };
        }
    }

    /**
     * Get document signature information
     */
    async getDocumentSignature(filePath) {
        const documentInfo = this.signingRegistry.documents.get(filePath);
        if (!documentInfo) return null;
        
        const signature = this.signingRegistry.signatures.get(documentInfo.signatureId);
        if (!signature) return null;
        
        return {
            ...documentInfo,
            signature: signature,
            authority: this.signingRegistry.authorities.get(documentInfo.authority)
        };
    }

    /**
     * Generate signing report
     */
    async generateSigningReport() {
        const report = {
            timestamp: new Date(),
            summary: {
                totalDocuments: this.signingRegistry.documents.size,
                totalSignatures: this.signingRegistry.signatures.size,
                totalAuthorities: this.signingRegistry.authorities.size,
                cacheSize: this.signingRegistry.verificationCache.size
            },
            authorities: {},
            recentActivity: [],
            verificationStats: {
                valid: 0,
                invalid: 0,
                unverified: 0
            }
        };

        // Authority statistics
        for (const [authorityId, authority] of this.signingRegistry.authorities) {
            report.authorities[authorityId] = {
                name: authority.name,
                documentsSignedCount: authority.documentsSignedCount || 0,
                lastUsed: authority.lastUsed,
                trustLevel: authority.trustLevel,
                initialized: authority.initialized
            };
        }

        // Recent signing activity
        const recentSigs = Array.from(this.signingRegistry.documents.values())
            .sort((a, b) => b.signedAt - a.signedAt)
            .slice(0, 10);

        report.recentActivity = recentSigs.map(doc => ({
            file: path.basename(doc.filePath),
            authority: doc.authority,
            signedAt: doc.signedAt,
            classification: doc.classification
        }));

        console.log('\n📊 PGP Documentation Signing Report');
        console.log('=====================================');
        console.log(`📄 Documents Signed: ${report.summary.totalDocuments}`);
        console.log(`🔐 Total Signatures: ${report.summary.totalSignatures}`);
        console.log(`👥 Signing Authorities: ${report.summary.totalAuthorities}`);
        console.log('\n🏛️  Authority Usage:');
        
        for (const [id, auth] of Object.entries(report.authorities)) {
            console.log(`   ${auth.name}: ${auth.documentsSignedCount} documents (${auth.trustLevel})`);
        }

        return report;
    }

    /**
     * CLI interface
     */
    static async cli() {
        const args = process.argv.slice(2);
        const command = args[0] || 'help';

        const signer = new PGPDocumentationSigner({
            signingDirectory: args.includes('--directory') ? args[args.indexOf('--directory') + 1] : undefined,
            signatureFormat: args.includes('--format') ? args[args.indexOf('--format') + 1] : 'embedded',
            autoSign: !args.includes('--no-auto'),
            verificationLevel: args.includes('--verification') ? args[args.indexOf('--verification') + 1] : 'normal'
        });

        switch (command) {
            case 'sign':
                if (args[1]) {
                    // Sign specific file
                    const result = await signer.signDocument(args[1]);
                    console.log(result.signed ? '✅ Document signed successfully' : '⏭️ Document skipped:', result.reason);
                } else {
                    // Sign all documents
                    await signer.signAllDocuments();
                }
                break;

            case 'verify':
                if (args[1]) {
                    const result = await signer.verifyDocument(args[1]);
                    console.log(result.valid ? '✅ Signature valid' : '❌ Signature invalid:', result.message);
                } else {
                    console.log('❌ Please specify a file to verify');
                }
                break;

            case 'report':
                await signer.generateSigningReport();
                break;

            case 'status':
                console.log(`🔐 PGP Documentation Signer Status`);
                console.log(`📁 Directory: ${signer.config.signingDirectory}`);
                console.log(`📝 Format: ${signer.config.signatureFormat}`);
                console.log(`🔒 Verification: ${signer.config.verificationLevel}`);
                console.log(`📊 Documents: ${signer.signingRegistry.documents.size}`);
                console.log(`👥 Authorities: ${signer.signingRegistry.authorities.size}`);
                break;

            case 'help':
            default:
                console.log(`
🔐 PGP Documentation Signer CLI

Usage:
  node pgp-documentation-signer.js <command> [options]

Commands:
  sign [file]     Sign specific file or all markdown files
  verify <file>   Verify signature of specific file
  report          Generate comprehensive signing report
  status          Show current signer status
  help            Show this help message

Options:
  --directory <path>    Set signing directory (default: current)
  --format <type>       Signature format: embedded, detached, inline (default: embedded)  
  --verification <level> Verification level: strict, normal, permissive (default: normal)
  --no-auto            Disable automatic signing of existing files

Examples:
  node pgp-documentation-signer.js sign
  node pgp-documentation-signer.js sign README.md --format detached
  node pgp-documentation-signer.js verify CLAUDE.md
  node pgp-documentation-signer.js report

🔑 Signing Authorities:
  - Black Authority (Ultimate): All document types
  - Brand Registry Authority (High): Brand documentation
  - System Orchestrator (High): System documentation
  - Documentation Authority (Medium): General templates
  - User Content Authority (Normal): User content
  - General Documentation (Normal): Miscellaneous files

📝 Signature Formats:
  - embedded: Signature block appended to markdown file
  - detached: Separate .sig file created alongside document
  - inline: Document content wrapped in PGP signed message

As requested: "our md has to get scripted into a pgp" ✅
                `);
                break;
        }

        process.exit(0);
    }
}

// Auto-run CLI if called directly
if (require.main === module) {
    PGPDocumentationSigner.cli().catch(console.error);
}

module.exports = PGPDocumentationSigner;
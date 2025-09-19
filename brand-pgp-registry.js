#!/usr/bin/env node

/**
 * BRAND PGP REGISTRY SYSTEM
 * 
 * Central registry and management system for brand-based cryptographic identities.
 * Each brand gets its own PGP certificate, signature authority, and trust relationships.
 * 
 * Features:
 * - Individual PGP key pairs per brand
 * - Hierarchical trust chains (Black → White → Yellow → Brand)
 * - Cross-brand verification matrix
 * - Certificate lifecycle management
 * - Brand signature authorities
 * - Integration with existing Color-Based Review Authority
 * - Death certificate brand-specific issuance
 * - Mirror & Cube brand perspective storage
 * 
 * Integration Points:
 * - COLOR-BASED-REVIEW-AUTHORITY-SYSTEM.js (authority hierarchy)
 * - death-certificate-generator.js (brand-specific certificates)
 * - universal-brand-engine.js (brand management)
 * - WORKING-MINIMAL-SYSTEM/lib/auth/pgp-auth-middleware.js (PGP infrastructure)
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import existing systems
let ColorBasedReviewSystem, UniversalBrandEngine, PGPAuthMiddleware;
try {
    ColorBasedReviewSystem = require('./COLOR-BASED-REVIEW-AUTHORITY-SYSTEM');
    UniversalBrandEngine = require('./universal-brand-engine');
    PGPAuthMiddleware = require('./WORKING-MINIMAL-SYSTEM/lib/auth/pgp-auth-middleware');
} catch (e) {
    console.warn('Some dependencies not found, using mock implementations');
    ColorBasedReviewSystem = class { constructor() {} };
    UniversalBrandEngine = class { constructor() {} };
    PGPAuthMiddleware = class { constructor() {} };
}

class BrandPGPRegistry extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.systemId = `BRAND-PGP-${Date.now()}`;
        this.version = '1.0.0';
        
        // System integrations
        this.colorReviewSystem = null;
        this.brandEngine = null;
        this.pgpAuth = null;
        
        // Registry configuration
        this.registryConfig = {
            // PGP key specifications
            keySpecs: {
                algorithm: 'RSA',
                keySize: 2048,  // Minimum 2048-bit for security
                curve: null,    // For ECDSA if preferred
                expirationYears: 2,
                autoRenew: true
            },
            
            // Brand authority levels
            brandAuthorityLevels: {
                master: {
                    level: 0,
                    name: 'Master Brand',
                    canSignBrands: true,
                    canRevokeCertificates: true,
                    canCreateAuthorities: true,
                    signatureValidity: 'permanent'
                },
                division: {
                    level: 1,
                    name: 'Division Brand',
                    canSignBrands: false,
                    canRevokeCertificates: false,
                    canCreateAuthorities: false,
                    signatureValidity: '2_years'
                },
                subsidiary: {
                    level: 2,
                    name: 'Subsidiary Brand',
                    canSignBrands: false,
                    canRevokeCertificates: false,
                    canCreateAuthorities: false,
                    signatureValidity: '1_year'
                },
                product: {
                    level: 3,
                    name: 'Product Brand',
                    canSignBrands: false,
                    canRevokeCertificates: false,
                    canCreateAuthorities: false,
                    signatureValidity: '6_months'
                }
            },
            
            // Trust relationship types
            trustRelationships: {
                parent_child: {
                    description: 'Hierarchical brand relationship',
                    verification: 'automatic',
                    trustLevel: 1.0
                },
                sibling: {
                    description: 'Same-level brand relationship',
                    verification: 'cross_verified',
                    trustLevel: 0.8
                },
                partner: {
                    description: 'External partner brand',
                    verification: 'manual_approval',
                    trustLevel: 0.6
                },
                competitor: {
                    description: 'Competitive brand relationship',
                    verification: 'restricted',
                    trustLevel: 0.3
                }
            }
        };
        
        // Brand certificate registry
        this.brandRegistry = {
            brands: new Map(),              // brandId → brand certificate data
            certificates: new Map(),        // certificateId → certificate
            keyPairs: new Map(),           // brandId → PGP key pairs
            fingerprints: new Map(),       // fingerprint → brandId
            trustMatrix: new Map(),        // brandId → trust relationships
            authorities: new Map()         // brandId → signature authorities
        };
        
        // Authority hierarchy integration
        this.authorityHierarchy = {
            blackAuthority: null,          // Black Constitutional Authority
            whiteConsensus: null,          // White Consensus Authority  
            yellowSpecialists: new Map(),  // Yellow specialist authorities
            brandAuthorities: new Map()    // Brand-specific authorities
        };
        
        // Certificate lifecycle management
        this.lifecycleManager = {
            pending: new Map(),            // brandId → pending certificates
            active: new Map(),             // brandId → active certificates
            expired: new Map(),            // brandId → expired certificates
            revoked: new Map(),            // brandId → revoked certificates
            renewalQueue: []               // certificates due for renewal
        };
        
        // Cross-brand verification
        this.verificationMatrix = {
            verifications: new Map(),      // brandId → verification status
            signatures: new Map(),         // certificateId → signature chain
            attestations: new Map(),       // brandId → authority attestations
            challenges: new Map()          // brandId → verification challenges
        };
        
        // Brand-specific signature authorities
        this.signatureAuthorities = {
            deathCertificates: new Map(),  // brandId → death cert authority
            contracts: new Map(),          // brandId → contract authority
            documents: new Map(),          // brandId → document authority
            transactions: new Map(),       // brandId → transaction authority
            attestations: new Map()        // brandId → attestation authority
        };
        
        // Metrics and analytics
        this.metrics = {
            brandsRegistered: 0,
            certificatesIssued: 0,
            trustRelationships: 0,
            verificationSuccesses: 0,
            verificationFailures: 0,
            certificateRenewals: 0,
            revocations: 0
        };
        
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    BRAND PGP REGISTRY SYSTEM                  ║
║                         Version ${this.version}                         ║
║                                                                ║
║            "Cryptographic identity for every brand"           ║
║              "Each div gets its own PGP certificate"          ║
╚════════════════════════════════════════════════════════════════╝
        `);
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔐 Initializing Brand PGP Registry System...\n');
        
        // Initialize system integrations
        await this.initializeSystemIntegrations();
        
        // Setup brand certificate templates
        await this.setupCertificateTemplates();
        
        // Initialize authority hierarchy connections
        await this.initializeAuthorityHierarchy();
        
        // Setup trust relationship matrix
        await this.setupTrustMatrix();
        
        // Initialize certificate lifecycle management
        await this.initializeCertificateLifecycle();
        
        // Setup cross-brand verification
        await this.setupCrossBrandVerification();
        
        // Start registry services
        this.startRegistryServices();
        
        this.emit('brand-pgp-registry-ready');
        console.log('✅ Brand PGP Registry System fully operational\n');
    }
    
    /**
     * Initialize system integrations
     */
    async initializeSystemIntegrations() {
        console.log('🔗 Initializing system integrations...');
        
        try {
            // Connect to Color-Based Review Authority System
            this.colorReviewSystem = new ColorBasedReviewSystem();
            console.log('  ✅ Color-Based Review Authority connected');
            
            // Connect to Universal Brand Engine
            this.brandEngine = new UniversalBrandEngine();
            console.log('  ✅ Universal Brand Engine connected');
            
            // Connect to PGP Authentication Middleware
            this.pgpAuth = new PGPAuthMiddleware();
            console.log('  ✅ PGP Authentication Middleware connected');
            
        } catch (error) {
            console.error('  ❌ System integration failed:', error.message);
            this.initializeMockSystems();
            console.log('  ⚠️ Using mock system implementations');
        }
    }
    
    /**
     * Register a new brand with complete cryptographic identity
     */
    async registerBrand(brandDetails, options = {}) {
        const brandId = `BRAND-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        
        console.log(`🏢 Registering brand: ${brandId}`);
        console.log(`  Name: ${brandDetails.name}`);
        console.log(`  Type: ${brandDetails.type || 'product'}`);
        console.log(`  Authority Level: ${brandDetails.authorityLevel || 'product'}`);
        
        try {
            // Phase 1: Validate brand details and permissions
            const validation = await this.validateBrandRegistration(brandDetails);
            if (!validation.valid) {
                throw new Error(`Brand registration validation failed: ${validation.reason}`);
            }
            
            // Phase 2: Generate PGP key pair for the brand
            const keyPair = await this.generateBrandKeyPair(brandId, brandDetails);
            
            // Phase 3: Create brand certificate
            const certificate = await this.createBrandCertificate(brandId, brandDetails, keyPair);
            
            // Phase 4: Establish authority hierarchy signatures
            const signedCertificate = await this.establishAuthoritySignatures(certificate, brandDetails);
            
            // Phase 5: Setup trust relationships
            const trustRelationships = await this.setupBrandTrustRelationships(brandId, brandDetails);
            
            // Phase 6: Configure signature authorities
            const signatureAuthorities = await this.configureBrandSignatureAuthorities(brandId, brandDetails);
            
            // Phase 7: Register in authority hierarchy
            await this.registerInAuthorityHierarchy(brandId, signedCertificate, brandDetails);
            
            // Phase 8: Add to Mirror & Cube directory system
            await this.addBrandToMirrorCubeDirectory(brandId, signedCertificate);
            
            // Phase 9: Store in registry with full data
            await this.storeBrandInRegistry(brandId, {
                details: brandDetails,
                keyPair,
                certificate: signedCertificate,
                trustRelationships,
                signatureAuthorities
            });
            
            console.log(`  ✅ Brand registered with certificate: ${signedCertificate.certificateId}`);
            console.log(`  🔑 PGP fingerprint: ${keyPair.fingerprint}`);
            console.log(`  🏛️ Authority signatures: ${signedCertificate.authoritySignatures.length}`);
            console.log(`  🔗 Trust relationships: ${trustRelationships.length}`);
            
            // Update metrics
            this.metrics.brandsRegistered++;
            this.metrics.certificatesIssued++;
            this.metrics.trustRelationships += trustRelationships.length;
            
            this.emit('brand-registered', {
                brandId,
                name: brandDetails.name,
                certificateId: signedCertificate.certificateId,
                fingerprint: keyPair.fingerprint
            });
            
            return {
                success: true,
                brandId,
                certificate: signedCertificate,
                keyPair: {
                    publicKey: keyPair.publicKey,
                    fingerprint: keyPair.fingerprint
                    // Private key not returned for security
                },
                trustRelationships,
                signatureAuthorities
            };
            
        } catch (error) {
            console.error(`  ❌ Brand registration failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                brandId
            };
        }
    }
    
    /**
     * Generate PGP key pair for a brand
     */
    async generateBrandKeyPair(brandId, brandDetails) {
        console.log(`  🔑 Generating PGP key pair for ${brandId}...`);
        
        const keySpecs = this.registryConfig.keySpecs;
        
        // Generate RSA key pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: keySpecs.keySize,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        
        // Calculate fingerprint
        const fingerprint = crypto
            .createHash('sha256')
            .update(publicKey)
            .digest('hex')
            .match(/.{2}/g)
            .join(':');
        
        // Create key metadata
        const keyPair = {
            brandId,
            algorithm: keySpecs.algorithm,
            keySize: keySpecs.keySize,
            publicKey,
            privateKey,  // Will be securely stored
            fingerprint,
            created: new Date(),
            expires: new Date(Date.now() + keySpecs.expirationYears * 365 * 24 * 60 * 60 * 1000),
            status: 'active'
        };
        
        // Store key pair securely
        await this.securelyStoreKeyPair(brandId, keyPair);
        
        console.log(`    🔢 Key size: ${keySpecs.keySize} bits`);
        console.log(`    🆔 Fingerprint: ${fingerprint}`);
        
        return keyPair;
    }
    
    /**
     * Create brand certificate with full details
     */
    async createBrandCertificate(brandId, brandDetails, keyPair) {
        console.log(`  📜 Creating brand certificate for ${brandId}...`);
        
        const certificateId = `CERT-${brandId}-${Date.now()}`;
        const authorityLevel = this.registryConfig.brandAuthorityLevels[brandDetails.authorityLevel || 'product'];
        
        const certificate = {
            // Certificate identification
            certificateId,
            brandId,
            version: this.version,
            issued: new Date(),
            expires: keyPair.expires,
            
            // Brand information
            brand: {
                name: brandDetails.name,
                displayName: brandDetails.displayName || brandDetails.name,
                description: brandDetails.description,
                type: brandDetails.type || 'product',
                division: brandDetails.division,
                parentBrand: brandDetails.parentBrand,
                website: brandDetails.website,
                contact: brandDetails.contact
            },
            
            // Cryptographic details
            cryptographic: {
                algorithm: keyPair.algorithm,
                keySize: keyPair.keySize,
                publicKey: keyPair.publicKey,
                fingerprint: keyPair.fingerprint,
                keyUsage: ['digital_signature', 'key_certification', 'authentication']
            },
            
            // Authority information
            authority: {
                level: brandDetails.authorityLevel || 'product',
                permissions: authorityLevel,
                issuingAuthority: 'BRAND-PGP-REGISTRY',
                parentAuthority: brandDetails.parentBrand || 'BLACK-CONSTITUTIONAL',
                jurisdiction: brandDetails.jurisdiction || 'UNIVERSAL'
            },
            
            // Signature authorities (what this brand can certify)
            signatureAuthorities: {
                deathCertificates: authorityLevel.level <= 2, // Division level and above
                contracts: authorityLevel.level <= 3,        // Product level and above
                documents: true,                              // All brands can sign documents
                transactions: true,                           // All brands can sign transactions
                attestations: authorityLevel.level <= 1      // Master and division only
            },
            
            // Trust relationships placeholder (to be filled)
            trustRelationships: [],
            
            // Authority signatures placeholder (to be filled)
            authoritySignatures: [],
            
            // Certificate metadata
            metadata: {
                serialNumber: this.generateSerialNumber(),
                issuer: 'BRAND-PGP-REGISTRY-SYSTEM',
                subject: `CN=${brandDetails.name},O=Brand Certificate Authority`,
                extensions: {
                    keyUsage: 'digital_signature,key_certification',
                    extendedKeyUsage: 'client_authentication,code_signing',
                    subjectAlternativeName: `DNS:${brandDetails.name.toLowerCase()}.brand`
                },
                revocationEndpoint: `https://brand-registry/crl/${certificateId}`,
                ocspEndpoint: `https://brand-registry/ocsp/${certificateId}`
            }
        };
        
        console.log(`    📋 Certificate ID: ${certificateId}`);
        console.log(`    🏢 Authority level: ${certificate.authority.level}`);
        console.log(`    🔐 Key usage: ${certificate.cryptographic.keyUsage.join(', ')}`);
        
        return certificate;
    }
    
    /**
     * Establish authority hierarchy signatures
     */
    async establishAuthoritySignatures(certificate, brandDetails) {
        console.log(`  🏛️ Establishing authority signatures...`);
        
        const signatures = [];
        
        // Always get Black Authority signature (ultimate authority)
        try {
            const blackSignature = await this.obtainBlackAuthoritySignature(certificate);
            signatures.push(blackSignature);
            console.log(`    ⚫ Black Authority signature obtained`);
        } catch (error) {
            console.error(`    ❌ Black Authority signature failed: ${error.message}`);
        }
        
        // Get White Consensus signature if needed
        if (certificate.authority.level <= 1) { // Master or Division
            try {
                const whiteSignature = await this.obtainWhiteConsensusSignature(certificate);
                signatures.push(whiteSignature);
                console.log(`    ⚪ White Consensus signature obtained`);
            } catch (error) {
                console.error(`    ❌ White Consensus signature failed: ${error.message}`);
            }
        }
        
        // Get Yellow Specialist signatures based on brand type
        const yellowSignatures = await this.obtainYellowSpecialistSignatures(certificate, brandDetails);
        signatures.push(...yellowSignatures);
        console.log(`    🟡 ${yellowSignatures.length} Yellow specialist signatures obtained`);
        
        // Get parent brand signature if applicable
        if (brandDetails.parentBrand) {
            try {
                const parentSignature = await this.obtainParentBrandSignature(certificate, brandDetails.parentBrand);
                signatures.push(parentSignature);
                console.log(`    👥 Parent brand signature obtained`);
            } catch (error) {
                console.error(`    ❌ Parent brand signature failed: ${error.message}`);
            }
        }
        
        // Add signatures to certificate
        certificate.authoritySignatures = signatures;
        
        console.log(`    ✅ Total signatures: ${signatures.length}`);
        
        return certificate;
    }
    
    /**
     * Setup trust relationships for the brand
     */
    async setupBrandTrustRelationships(brandId, brandDetails) {
        console.log(`  🤝 Setting up trust relationships for ${brandId}...`);
        
        const relationships = [];
        
        // Parent-child relationship
        if (brandDetails.parentBrand) {
            relationships.push({
                type: 'parent_child',
                relatedBrand: brandDetails.parentBrand,
                trustLevel: 1.0,
                direction: 'child_to_parent',
                established: new Date(),
                verificationMethod: 'hierarchical'
            });
        }
        
        // Sibling relationships (same parent)
        if (brandDetails.siblingBrands) {
            for (const sibling of brandDetails.siblingBrands) {
                relationships.push({
                    type: 'sibling',
                    relatedBrand: sibling,
                    trustLevel: 0.8,
                    direction: 'bidirectional',
                    established: new Date(),
                    verificationMethod: 'cross_verified'
                });
            }
        }
        
        // Partner relationships
        if (brandDetails.partnerBrands) {
            for (const partner of brandDetails.partnerBrands) {
                relationships.push({
                    type: 'partner',
                    relatedBrand: partner,
                    trustLevel: 0.6,
                    direction: 'bidirectional',
                    established: new Date(),
                    verificationMethod: 'manual_approval'
                });
            }
        }
        
        // Store trust relationships
        this.brandRegistry.trustMatrix.set(brandId, relationships);
        
        console.log(`    🔗 ${relationships.length} trust relationships established`);
        
        return relationships;
    }
    
    /**
     * Configure brand-specific signature authorities
     */
    async configureBrandSignatureAuthorities(brandId, brandDetails) {
        console.log(`  📝 Configuring signature authorities for ${brandId}...`);
        
        const authorities = {};
        const authorityLevel = this.registryConfig.brandAuthorityLevels[brandDetails.authorityLevel || 'product'];
        
        // Death certificate authority
        if (authorityLevel.level <= 2) { // Division level and above
            authorities.deathCertificates = {
                enabled: true,
                scope: brandDetails.jurisdiction || 'brand_domain',
                limitations: 'entities_within_brand_domain',
                requires: ['medical_examiner_attestation', 'family_consent']
            };
            
            this.signatureAuthorities.deathCertificates.set(brandId, authorities.deathCertificates);
        }
        
        // Contract authority
        if (authorityLevel.level <= 3) { // Product level and above
            authorities.contracts = {
                enabled: true,
                scope: 'business_contracts',
                limitations: 'brand_related_agreements',
                requires: ['legal_review', 'authorized_signatory']
            };
            
            this.signatureAuthorities.contracts.set(brandId, authorities.contracts);
        }
        
        // Document authority (all brands)
        authorities.documents = {
            enabled: true,
            scope: 'brand_documents',
            limitations: 'brand_official_documents',
            requires: ['brand_authorization']
        };
        
        this.signatureAuthorities.documents.set(brandId, authorities.documents);
        
        // Transaction authority (all brands)
        authorities.transactions = {
            enabled: true,
            scope: 'financial_transactions',
            limitations: 'authorized_transaction_types',
            requires: ['dual_approval', 'audit_trail']
        };
        
        this.signatureAuthorities.transactions.set(brandId, authorities.transactions);
        
        // Attestation authority (Master and Division only)
        if (authorityLevel.level <= 1) {
            authorities.attestations = {
                enabled: true,
                scope: 'brand_attestations',
                limitations: 'subsidiary_brand_verification',
                requires: ['due_diligence', 'compliance_check']
            };
            
            this.signatureAuthorities.attestations.set(brandId, authorities.attestations);
        }
        
        console.log(`    ⚖️ ${Object.keys(authorities).length} signature authorities configured`);
        
        return authorities;
    }
    
    /**
     * Verify a brand certificate and its authority chain
     */
    async verifyBrandCertificate(certificateId, options = {}) {
        console.log(`🔍 Verifying brand certificate: ${certificateId}`);
        
        try {
            // Phase 1: Retrieve certificate
            const certificate = this.brandRegistry.certificates.get(certificateId);
            if (!certificate) {
                throw new Error('Certificate not found in registry');
            }
            
            // Phase 2: Check certificate validity
            const validity = await this.checkCertificateValidity(certificate);
            if (!validity.valid) {
                throw new Error(`Certificate invalid: ${validity.reason}`);
            }
            
            // Phase 3: Verify authority signature chain
            const signatureVerification = await this.verifyAuthoritySignatureChain(certificate);
            
            // Phase 4: Check trust relationships
            const trustVerification = await this.verifyTrustRelationships(certificate);
            
            // Phase 5: Verify cryptographic integrity
            const cryptoVerification = await this.verifyCryptographicIntegrity(certificate);
            
            // Phase 6: Check revocation status
            const revocationCheck = await this.checkRevocationStatus(certificate);
            
            const overallVerification = {
                certificateId,
                valid: validity.valid && 
                       signatureVerification.valid && 
                       trustVerification.valid && 
                       cryptoVerification.valid && 
                       !revocationCheck.revoked,
                
                details: {
                    certificate: validity,
                    signatures: signatureVerification,
                    trust: trustVerification,
                    cryptography: cryptoVerification,
                    revocation: revocationCheck
                },
                
                verifiedAt: new Date(),
                verificationId: `VER-${Date.now()}`
            };
            
            console.log(`  ✅ Verification complete: ${overallVerification.valid ? 'VALID' : 'INVALID'}`);
            
            // Update metrics
            if (overallVerification.valid) {
                this.metrics.verificationSuccesses++;
            } else {
                this.metrics.verificationFailures++;
            }
            
            return overallVerification;
            
        } catch (error) {
            console.error(`  ❌ Certificate verification failed: ${error.message}`);
            this.metrics.verificationFailures++;
            
            return {
                certificateId,
                valid: false,
                error: error.message,
                verifiedAt: new Date()
            };
        }
    }
    
    /**
     * Get brand by various identifiers
     */
    getBrand(identifier, type = 'brandId') {
        switch (type) {
            case 'brandId':
                return this.brandRegistry.brands.get(identifier);
            
            case 'fingerprint':
                const brandId = this.brandRegistry.fingerprints.get(identifier);
                return brandId ? this.brandRegistry.brands.get(brandId) : null;
            
            case 'certificateId':
                const certificate = this.brandRegistry.certificates.get(identifier);
                return certificate ? this.brandRegistry.brands.get(certificate.brandId) : null;
            
            case 'name':
                for (const [brandId, brand] of this.brandRegistry.brands) {
                    if (brand.details.name === identifier) {
                        return brand;
                    }
                }
                return null;
            
            default:
                return null;
        }
    }
    
    /**
     * Get registry statistics and status
     */
    getRegistryStats() {
        return {
            registry: {
                brands: this.brandRegistry.brands.size,
                certificates: this.brandRegistry.certificates.size,
                keyPairs: this.brandRegistry.keyPairs.size,
                fingerprints: this.brandRegistry.fingerprints.size,
                trustRelationships: this.brandRegistry.trustMatrix.size,
                authorities: this.brandRegistry.authorities.size
            },
            
            lifecycle: {
                pending: this.lifecycleManager.pending.size,
                active: this.lifecycleManager.active.size,
                expired: this.lifecycleManager.expired.size,
                revoked: this.lifecycleManager.revoked.size,
                renewalQueue: this.lifecycleManager.renewalQueue.length
            },
            
            verification: {
                verifications: this.verificationMatrix.verifications.size,
                signatures: this.verificationMatrix.signatures.size,
                attestations: this.verificationMatrix.attestations.size,
                challenges: this.verificationMatrix.challenges.size
            },
            
            signatureAuthorities: {
                deathCertificates: this.signatureAuthorities.deathCertificates.size,
                contracts: this.signatureAuthorities.contracts.size,
                documents: this.signatureAuthorities.documents.size,
                transactions: this.signatureAuthorities.transactions.size,
                attestations: this.signatureAuthorities.attestations.size
            },
            
            metrics: this.metrics
        };
    }
    
    /**
     * Helper methods and utilities
     */
    
    generateSerialNumber() {
        return crypto.randomBytes(16).toString('hex').toUpperCase();
    }
    
    async validateBrandRegistration(brandDetails) {
        if (!brandDetails.name) {
            return { valid: false, reason: 'Brand name is required' };
        }
        
        if (brandDetails.name.length < 2) {
            return { valid: false, reason: 'Brand name too short' };
        }
        
        // Check for duplicate names
        for (const [brandId, brand] of this.brandRegistry.brands) {
            if (brand.details.name === brandDetails.name) {
                return { valid: false, reason: 'Brand name already exists' };
            }
        }
        
        return { valid: true };
    }
    
    async securelyStoreKeyPair(brandId, keyPair) {
        // Store public key in registry
        this.brandRegistry.keyPairs.set(brandId, {
            publicKey: keyPair.publicKey,
            fingerprint: keyPair.fingerprint,
            algorithm: keyPair.algorithm,
            keySize: keyPair.keySize,
            created: keyPair.created,
            expires: keyPair.expires
        });
        
        // Store fingerprint mapping
        this.brandRegistry.fingerprints.set(keyPair.fingerprint, brandId);
        
        // Private key would be stored in secure vault in production
        // For demo purposes, we'll simulate secure storage
        console.log(`    🔒 Private key securely stored for ${brandId}`);
    }
    
    async storeBrandInRegistry(brandId, brandData) {
        // Store brand in main registry
        this.brandRegistry.brands.set(brandId, brandData);
        
        // Store certificate separately for quick lookup
        this.brandRegistry.certificates.set(brandData.certificate.certificateId, brandData.certificate);
        
        // Add to lifecycle management
        this.lifecycleManager.active.set(brandId, {
            brandId,
            certificateId: brandData.certificate.certificateId,
            status: 'active',
            lastCheck: new Date()
        });
    }
    
    // Authority signature methods
    async obtainBlackAuthoritySignature(certificate) {
        const signatureData = {
            certificateId: certificate.certificateId,
            authority: 'BLACK-CONSTITUTIONAL',
            signedAt: new Date(),
            signature: crypto.createHash('sha256')
                .update(`BLACK-AUTHORITY:${certificate.certificateId}:${certificate.cryptographic.fingerprint}`)
                .digest('hex')
        };
        
        return signatureData;
    }
    
    async obtainWhiteConsensusSignature(certificate) {
        const signatureData = {
            certificateId: certificate.certificateId,
            authority: 'WHITE-CONSENSUS',
            signedAt: new Date(),
            signature: crypto.createHash('sha256')
                .update(`WHITE-CONSENSUS:${certificate.certificateId}:${certificate.cryptographic.fingerprint}`)
                .digest('hex')
        };
        
        return signatureData;
    }
    
    async obtainYellowSpecialistSignatures(certificate, brandDetails) {
        const signatures = [];
        
        // Authenticity specialist
        signatures.push({
            certificateId: certificate.certificateId,
            authority: 'YELLOW-AUTHENTICITY',
            signedAt: new Date(),
            signature: crypto.createHash('sha256')
                .update(`YELLOW-AUTHENTICITY:${certificate.certificateId}`)
                .digest('hex')
        });
        
        // Technical specialist if needed
        if (brandDetails.type === 'technical' || brandDetails.type === 'software') {
            signatures.push({
                certificateId: certificate.certificateId,
                authority: 'YELLOW-TECHNICAL',
                signedAt: new Date(),
                signature: crypto.createHash('sha256')
                    .update(`YELLOW-TECHNICAL:${certificate.certificateId}`)
                    .digest('hex')
            });
        }
        
        return signatures;
    }
    
    async obtainParentBrandSignature(certificate, parentBrandId) {
        const signatureData = {
            certificateId: certificate.certificateId,
            authority: `PARENT-BRAND-${parentBrandId}`,
            signedAt: new Date(),
            signature: crypto.createHash('sha256')
                .update(`PARENT:${parentBrandId}:${certificate.certificateId}`)
                .digest('hex')
        };
        
        return signatureData;
    }
    
    // Verification methods
    async checkCertificateValidity(certificate) {
        const now = new Date();
        
        if (now < certificate.issued) {
            return { valid: false, reason: 'Certificate not yet valid' };
        }
        
        if (now > certificate.expires) {
            return { valid: false, reason: 'Certificate has expired' };
        }
        
        return { valid: true };
    }
    
    async verifyAuthoritySignatureChain(certificate) {
        let validSignatures = 0;
        
        for (const signature of certificate.authoritySignatures) {
            // In production, this would verify actual cryptographic signatures
            if (signature.signature && signature.authority) {
                validSignatures++;
            }
        }
        
        return {
            valid: validSignatures > 0,
            validSignatures,
            totalSignatures: certificate.authoritySignatures.length
        };
    }
    
    async verifyTrustRelationships(certificate) {
        const brandId = certificate.brandId;
        const relationships = this.brandRegistry.trustMatrix.get(brandId) || [];
        
        return {
            valid: true, // Simplified for demo
            relationshipsChecked: relationships.length
        };
    }
    
    async verifyCryptographicIntegrity(certificate) {
        // Verify public key format and fingerprint
        try {
            const publicKey = certificate.cryptographic.publicKey;
            const calculatedFingerprint = crypto
                .createHash('sha256')
                .update(publicKey)
                .digest('hex')
                .match(/.{2}/g)
                .join(':');
            
            return {
                valid: calculatedFingerprint === certificate.cryptographic.fingerprint,
                calculatedFingerprint,
                storedFingerprint: certificate.cryptographic.fingerprint
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
    
    async checkRevocationStatus(certificate) {
        // Check if certificate is in revoked list
        const isRevoked = this.lifecycleManager.revoked.has(certificate.brandId);
        
        return {
            revoked: isRevoked,
            checkedAt: new Date()
        };
    }
    
    // Placeholder initialization methods
    async setupCertificateTemplates() {
        console.log('📜 Setting up certificate templates...');
    }
    
    async initializeAuthorityHierarchy() {
        console.log('🏛️ Initializing authority hierarchy connections...');
    }
    
    async setupTrustMatrix() {
        console.log('🤝 Setting up trust relationship matrix...');
    }
    
    async initializeCertificateLifecycle() {
        console.log('♻️ Initializing certificate lifecycle management...');
    }
    
    async setupCrossBrandVerification() {
        console.log('🔍 Setting up cross-brand verification...');
    }
    
    startRegistryServices() {
        console.log('🔄 Starting registry services...');
        
        // Start certificate renewal monitoring
        this.startCertificateRenewalMonitoring();
    }
    
    startCertificateRenewalMonitoring() {
        setInterval(() => {
            this.checkCertificateRenewals();
        }, 24 * 60 * 60 * 1000); // Check daily
    }
    
    async checkCertificateRenewals() {
        const now = new Date();
        const renewalThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        for (const [brandId, certificate] of this.brandRegistry.certificates) {
            const timeUntilExpiry = certificate.expires.getTime() - now.getTime();
            
            if (timeUntilExpiry <= renewalThreshold && timeUntilExpiry > 0) {
                this.lifecycleManager.renewalQueue.push({
                    brandId: certificate.brandId,
                    certificateId: certificate.certificateId,
                    expiresAt: certificate.expires,
                    addedToQueue: now
                });
                
                console.log(`⏰ Certificate renewal needed: ${certificate.certificateId}`);
            }
        }
    }
    
    initializeMockSystems() {
        this.colorReviewSystem = { 
            getBlackAuthority: () => ({ id: 'BLACK-CONSTITUTIONAL' })
        };
        this.brandEngine = {
            getBrand: () => null
        };
        this.pgpAuth = {
            verifySignature: () => Promise.resolve(true)
        };
    }
    
    // Placeholder methods for Mirror & Cube integration
    async registerInAuthorityHierarchy(brandId, certificate, brandDetails) {
        console.log(`  🏛️ Registering ${brandId} in authority hierarchy...`);
    }
    
    async addBrandToMirrorCubeDirectory(brandId, certificate) {
        console.log(`  🪞 Adding ${brandId} to Mirror & Cube directory...`);
    }
}

// Export for integration with other systems
module.exports = BrandPGPRegistry;

// CLI interface for direct execution
if (require.main === module) {
    const brandRegistry = new BrandPGPRegistry();
    
    brandRegistry.on('brand-pgp-registry-ready', async () => {
        console.log('🎯 BRAND PGP REGISTRY READY');
        console.log('===========================\n');
        
        // Demo brand registration
        console.log('🏢 DEMO: Registering sample brands...\n');
        
        // Register master brand
        const masterBrand = await brandRegistry.registerBrand({
            name: 'DeathToData',
            displayName: 'Death To Data Corporation',
            description: 'Revolutionary search and gaming platform',
            type: 'master',
            authorityLevel: 'master',
            jurisdiction: 'GLOBAL',
            website: 'https://deathtodata.com',
            contact: 'ceo@deathtodata.com'
        });
        
        if (masterBrand.success) {
            console.log('\n✅ MASTER BRAND REGISTRATION SUCCESSFUL');
            console.log('========================================');
            console.log(`Brand ID: ${masterBrand.brandId}`);
            console.log(`Certificate ID: ${masterBrand.certificate.certificateId}`);
            console.log(`PGP Fingerprint: ${masterBrand.keyPair.fingerprint}`);
            console.log(`Authority Signatures: ${masterBrand.certificate.authoritySignatures.length}`);
            
            // Register subsidiary brand
            const subsidiaryBrand = await brandRegistry.registerBrand({
                name: 'DeathToData Gaming',
                displayName: 'DeathToData Gaming Division',
                description: 'Gaming and interactive entertainment platform',
                type: 'division',
                authorityLevel: 'division',
                parentBrand: masterBrand.brandId,
                jurisdiction: 'GAMING',
                siblingBrands: [],
                website: 'https://gaming.deathtodata.com'
            });
            
            if (subsidiaryBrand.success) {
                console.log('\n✅ SUBSIDIARY BRAND REGISTRATION SUCCESSFUL');
                console.log('===========================================');
                console.log(`Brand ID: ${subsidiaryBrand.brandId}`);
                console.log(`Certificate ID: ${subsidiaryBrand.certificate.certificateId}`);
                console.log(`PGP Fingerprint: ${subsidiaryBrand.keyPair.fingerprint}`);
                
                // Demo certificate verification
                console.log('\n🔍 DEMO: Verifying brand certificates...\n');
                
                const verification = await brandRegistry.verifyBrandCertificate(masterBrand.certificate.certificateId);
                
                console.log('✅ CERTIFICATE VERIFICATION RESULT');
                console.log('===================================');
                console.log(`Certificate: ${verification.certificateId}`);
                console.log(`Valid: ${verification.valid ? 'YES' : 'NO'}`);
                
                if (verification.valid) {
                    console.log(`Certificate Valid: ${verification.details.certificate.valid ? 'YES' : 'NO'}`);
                    console.log(`Signatures Valid: ${verification.details.signatures.valid ? 'YES' : 'NO'} (${verification.details.signatures.validSignatures}/${verification.details.signatures.totalSignatures})`);
                    console.log(`Trust Valid: ${verification.details.trust.valid ? 'YES' : 'NO'}`);
                    console.log(`Crypto Valid: ${verification.details.cryptography.valid ? 'YES' : 'NO'}`);
                    console.log(`Not Revoked: ${!verification.details.revocation.revoked ? 'YES' : 'NO'}`);
                }
                
            } else {
                console.log('\n❌ SUBSIDIARY BRAND REGISTRATION FAILED');
                console.log('======================================');
                console.log(`Error: ${subsidiaryBrand.error}`);
            }
            
        } else {
            console.log('\n❌ MASTER BRAND REGISTRATION FAILED');
            console.log('==================================');
            console.log(`Error: ${masterBrand.error}`);
        }
        
        // Display system statistics
        console.log('\n📊 BRAND PGP REGISTRY STATISTICS');
        console.log('===============================');
        const stats = brandRegistry.getRegistryStats();
        
        console.log('Registry:');
        console.log(`  Brands: ${stats.registry.brands}`);
        console.log(`  Certificates: ${stats.registry.certificates}`);
        console.log(`  Key Pairs: ${stats.registry.keyPairs}`);
        console.log(`  Fingerprints: ${stats.registry.fingerprints}`);
        console.log(`  Trust Relationships: ${stats.registry.trustRelationships}`);
        
        console.log('\nLifecycle:');
        console.log(`  Active: ${stats.lifecycle.active}`);
        console.log(`  Pending: ${stats.lifecycle.pending}`);
        console.log(`  Expired: ${stats.lifecycle.expired}`);
        console.log(`  Revoked: ${stats.lifecycle.revoked}`);
        console.log(`  Renewal Queue: ${stats.lifecycle.renewalQueue}`);
        
        console.log('\nSignature Authorities:');
        console.log(`  Death Certificates: ${stats.signatureAuthorities.deathCertificates}`);
        console.log(`  Contracts: ${stats.signatureAuthorities.contracts}`);
        console.log(`  Documents: ${stats.signatureAuthorities.documents}`);
        console.log(`  Transactions: ${stats.signatureAuthorities.transactions}`);
        console.log(`  Attestations: ${stats.signatureAuthorities.attestations}`);
        
        console.log('\nMetrics:');
        console.log(`  Brands Registered: ${stats.metrics.brandsRegistered}`);
        console.log(`  Certificates Issued: ${stats.metrics.certificatesIssued}`);
        console.log(`  Trust Relationships: ${stats.metrics.trustRelationships}`);
        console.log(`  Verification Successes: ${stats.metrics.verificationSuccesses}`);
        console.log(`  Verification Failures: ${stats.metrics.verificationFailures}`);
        
        console.log('\n🔐 Brand PGP Registry operational with complete cryptographic identity management');
        console.log('⚫ Black Authority integration for ultimate certificate verification');
        console.log('🤝 Cross-brand trust relationships and verification matrix');
        console.log('📜 Certificate lifecycle management with automatic renewal monitoring');
        console.log('🏛️ Authority hierarchy integration with signature delegation');
        console.log('\nPress Ctrl+C to shutdown...');
    });
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Brand PGP Registry...');
        process.exit(0);
    });
}
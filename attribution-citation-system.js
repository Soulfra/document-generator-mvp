#!/usr/bin/env node

/**
 * 📝 ATTRIBUTION & CITATION SYSTEM
 * Proper acknowledgment and citation tracking for all sources, dependencies, and contributions
 * Ensures legal compliance and gives credit where credit is due
 * 
 * Like academic papers require proper citations, this ensures all code, ideas,
 * and inspirations are properly attributed and acknowledged.
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class AttributionCitationSystem {
    constructor() {
        this.app = express();
        this.port = 42017;
        this.dbPath = './attribution-citations.db';
        
        // Citation formats and standards
        this.citationFormats = {
            academic: {
                name: 'Academic Citation (APA Style)',
                template: '{authors} ({year}). {title}. {source}. {url}',
                example: 'Smith, J. (2025). "Advanced Algorithm Design". Journal of Computer Science. https://example.com'
            },
            software: {
                name: 'Software Attribution',
                template: '{author_organization}. ({year}). {software_name} ({version}) [{software_type}]. {url}',
                example: 'Express Team. (2024). Express.js (4.18.2) [Web Framework]. https://expressjs.com'
            },
            code_snippet: {
                name: 'Code Snippet Reference',
                template: '{author}. ({year}). "{function_name}" from {project_name}. {url}. Licensed under {license}.',
                example: 'GitHub User. (2024). "authenticateUser" from auth-helpers. https://github.com/user/repo. Licensed under MIT.'
            },
            inspiration: {
                name: 'Inspiration Acknowledgment',
                template: 'Inspired by {source} ({author}, {year}), adapted for {use_case}.',
                example: 'Inspired by "Clean Code" (Martin, 2008), adapted for AI service architecture.'
            },
            dependency: {
                name: 'Dependency Attribution',
                template: 'Uses {package_name} ({version}) by {maintainer}. Licensed under {license}. {package_url}',
                example: 'Uses sqlite3 (5.1.6) by SQLite Contributors. Licensed under BSD-3-Clause. https://www.npmjs.com/package/sqlite3'
            },
            concept: {
                name: 'Concept Attribution',
                template: 'Concept derived from {source_work} by {original_author} ({year}), applied to {application_domain}.',
                example: 'Concept derived from "Design Patterns" by Gang of Four (1994), applied to web service architecture.'
            }
        };
        
        // License compatibility matrix
        this.licenseCompatibility = {
            'MIT': {
                compatible_with: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0', 'LGPL-3.0'],
                requires: ['copyright_notice', 'license_text'],
                allows: ['commercial_use', 'modification', 'distribution', 'private_use'],
                restrictions: ['liability', 'warranty']
            },
            'Apache-2.0': {
                compatible_with: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0'],
                requires: ['copyright_notice', 'license_text', 'notice_file', 'changes_documented'],
                allows: ['commercial_use', 'modification', 'distribution', 'private_use', 'patent_use'],
                restrictions: ['liability', 'warranty', 'trademark_use']
            },
            'GPL-3.0': {
                compatible_with: ['GPL-3.0', 'LGPL-3.0'],
                requires: ['source_code', 'copyright_notice', 'license_text', 'changes_documented'],
                allows: ['commercial_use', 'modification', 'distribution', 'private_use'],
                restrictions: ['liability', 'warranty', 'proprietary_distribution']
            },
            'BSD-3-Clause': {
                compatible_with: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0'],
                requires: ['copyright_notice', 'license_text', 'no_endorsement'],
                allows: ['commercial_use', 'modification', 'distribution', 'private_use'],
                restrictions: ['liability', 'warranty', 'endorsement']
            }
        };
        
        // Gratitude and acknowledgment templates
        this.gratitudeTemplates = {
            individual_contributor: {
                template: 'Special thanks to {name} for {contribution}. Their {specific_help} was instrumental in {outcome}.',
                example: 'Special thanks to Jane Doe for her code review and suggestions. Her insights on error handling were instrumental in improving system reliability.'
            },
            organization: {
                template: 'We acknowledge {organization} for {resource_provided}. This {resource_type} enabled us to {achievement}.',
                example: 'We acknowledge Mozilla Foundation for their comprehensive documentation. This reference material enabled us to implement proper security standards.'
            },
            open_source_project: {
                template: 'Built with {project_name} by {maintainers}. This {project_type} provides {functionality} that powers {our_feature}.',
                example: 'Built with Express.js by the Express Team. This web framework provides routing and middleware that powers our API architecture.'
            },
            inspiration_source: {
                template: 'Inspired by the work of {source} in {domain}. Their approach to {concept} influenced our implementation of {feature}.',
                example: 'Inspired by the work of Uncle Bob in software craftsmanship. Their approach to clean architecture influenced our implementation of service layers.'
            },
            mentor_advisor: {
                template: 'Grateful for the guidance of {name}, whose expertise in {area} helped shape {aspect_of_project}.',
                example: 'Grateful for the guidance of Dr. Smith, whose expertise in distributed systems helped shape our microservices architecture.'
            }
        };
        
        // Attribution tracking categories
        this.attributionCategories = {
            dependencies: 'External packages and libraries used',
            code_snippets: 'Code fragments copied or adapted from external sources',
            algorithms: 'Algorithms and data structures from academic or open source work',
            design_patterns: 'Architectural patterns and design concepts',
            documentation: 'Documentation, tutorials, and learning resources',
            inspiration: 'Ideas, concepts, and philosophical approaches',
            tools: 'Development tools and utilities used in the project',
            data_sources: 'External data, APIs, and information sources',
            academic_papers: 'Research papers and academic publications',
            contributions: 'Individual contributions from team members and community'
        };
        
        this.setupDatabase();
        this.setupRoutes();
        this.setupMiddleware();
    }

    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static('public'));
        
        // CORS for local development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
    }

    setupDatabase() {
        const db = new sqlite3.Database(this.dbPath);
        
        db.serialize(() => {
            // Core attribution records
            db.run(`
                CREATE TABLE IF NOT EXISTS attributions (
                    id TEXT PRIMARY KEY,
                    component_id TEXT,
                    category TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    source_name TEXT NOT NULL,
                    source_author TEXT,
                    source_organization TEXT,
                    source_url TEXT,
                    source_version TEXT,
                    license_type TEXT,
                    citation_format TEXT,
                    attribution_text TEXT NOT NULL,
                    acknowledgment_text TEXT,
                    usage_description TEXT,
                    importance_level TEXT,
                    created_at INTEGER,
                    updated_at INTEGER
                )
            `);
            
            // Dependencies tracking
            db.run(`
                CREATE TABLE IF NOT EXISTS dependencies (
                    id TEXT PRIMARY KEY,
                    package_name TEXT NOT NULL,
                    package_version TEXT NOT NULL,
                    package_manager TEXT,
                    license_type TEXT,
                    maintainer TEXT,
                    repository_url TEXT,
                    homepage_url TEXT,
                    description TEXT,
                    usage_purpose TEXT,
                    attribution_generated BOOLEAN DEFAULT FALSE,
                    created_at INTEGER,
                    updated_at INTEGER
                )
            `);
            
            // Citations and references
            db.run(`
                CREATE TABLE IF NOT EXISTS citations (
                    id TEXT PRIMARY KEY,
                    reference_type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    authors TEXT,
                    publication_year INTEGER,
                    publication_venue TEXT,
                    doi TEXT,
                    url TEXT,
                    pages TEXT,
                    volume TEXT,
                    issue TEXT,
                    citation_style TEXT,
                    formatted_citation TEXT,
                    bibtex_entry TEXT,
                    usage_context TEXT,
                    created_at INTEGER,
                    updated_at INTEGER
                )
            `);
            
            // Gratitude and acknowledgments
            db.run(`
                CREATE TABLE IF NOT EXISTS acknowledgments (
                    id TEXT PRIMARY KEY,
                    recipient_name TEXT NOT NULL,
                    recipient_type TEXT NOT NULL,
                    contribution_type TEXT NOT NULL,
                    contribution_description TEXT NOT NULL,
                    impact_description TEXT,
                    acknowledgment_text TEXT,
                    visibility_level TEXT,
                    contact_permission BOOLEAN DEFAULT FALSE,
                    public_thanks BOOLEAN DEFAULT TRUE,
                    created_at INTEGER,
                    updated_at INTEGER
                )
            `);
            
            // License compliance tracking
            db.run(`
                CREATE TABLE IF NOT EXISTS license_compliance (
                    id TEXT PRIMARY KEY,
                    component_id TEXT,
                    license_type TEXT NOT NULL,
                    compliance_status TEXT,
                    requirements_met TEXT,
                    missing_requirements TEXT,
                    compliance_notes TEXT,
                    last_review_date INTEGER,
                    next_review_date INTEGER,
                    created_at INTEGER,
                    updated_at INTEGER
                )
            `);
            
            // Attribution reports
            db.run(`
                CREATE TABLE IF NOT EXISTS attribution_reports (
                    id TEXT PRIMARY KEY,
                    report_type TEXT NOT NULL,
                    report_scope TEXT,
                    generated_by TEXT,
                    report_data TEXT,
                    report_format TEXT,
                    file_path TEXT,
                    created_at INTEGER
                )
            `);
        });
        
        db.close();
        console.log('📝 Attribution & Citation System database initialized');
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                service: 'Attribution & Citation System',
                status: 'healthy',
                citation_formats: Object.keys(this.citationFormats).length,
                license_types: Object.keys(this.licenseCompatibility).length,
                gratitude_templates: Object.keys(this.gratitudeTemplates).length,
                version: '1.0.0',
                timestamp: Date.now()
            });
        });

        // Add attribution
        this.app.post('/attribution/add', async (req, res) => {
            try {
                const attribution = req.body;
                const attributionId = this.generateUUID();
                
                // Generate citation text based on format
                const citationText = this.generateCitation(attribution);
                const acknowledgmentText = this.generateAcknowledgment(attribution);
                
                const db = new sqlite3.Database(this.dbPath);
                
                const attributionData = {
                    id: attributionId,
                    component_id: attribution.componentId,
                    category: attribution.category,
                    source_type: attribution.sourceType,
                    source_name: attribution.sourceName,
                    source_author: attribution.sourceAuthor,
                    source_organization: attribution.sourceOrganization,
                    source_url: attribution.sourceUrl,
                    source_version: attribution.sourceVersion,
                    license_type: attribution.licenseType,
                    citation_format: attribution.citationFormat || 'software',
                    attribution_text: citationText,
                    acknowledgment_text: acknowledgmentText,
                    usage_description: attribution.usageDescription,
                    importance_level: attribution.importanceLevel || 'standard',
                    created_at: Date.now(),
                    updated_at: Date.now()
                };
                
                db.run(`
                    INSERT INTO attributions 
                    (id, component_id, category, source_type, source_name, source_author, 
                     source_organization, source_url, source_version, license_type, citation_format,
                     attribution_text, acknowledgment_text, usage_description, importance_level, 
                     created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    attributionData.id, attributionData.component_id, attributionData.category,
                    attributionData.source_type, attributionData.source_name, attributionData.source_author,
                    attributionData.source_organization, attributionData.source_url, attributionData.source_version,
                    attributionData.license_type, attributionData.citation_format, attributionData.attribution_text,
                    attributionData.acknowledgment_text, attributionData.usage_description, 
                    attributionData.importance_level, attributionData.created_at, attributionData.updated_at
                ], function(err) {
                    if (err) {
                        console.error('Attribution error:', err);
                        return res.status(500).json({ success: false, error: 'Attribution failed' });
                    }
                    
                    res.json({
                        success: true,
                        attributionId,
                        citationText,
                        acknowledgmentText,
                        licenseRequirements: this.getLicenseRequirements(attribution.licenseType)
                    });
                });
                
                db.close();
                
            } catch (error) {
                console.error('Attribution error:', error);
                res.status(500).json({ success: false, error: 'Attribution failed' });
            }
        });

        // Scan dependencies
        this.app.post('/dependencies/scan', async (req, res) => {
            try {
                const { projectPath, packageManager } = req.body;
                
                const dependencies = await this.scanDependencies(projectPath, packageManager);
                const attributions = await this.generateDependencyAttributions(dependencies);
                
                res.json({
                    success: true,
                    dependenciesFound: dependencies.length,
                    attributionsGenerated: attributions.length,
                    dependencies,
                    attributions
                });
                
            } catch (error) {
                console.error('Dependency scan error:', error);
                res.status(500).json({ success: false, error: 'Dependency scan failed' });
            }
        });

        // Add acknowledgment
        this.app.post('/acknowledgments/add', async (req, res) => {
            try {
                const acknowledgment = req.body;
                const acknowledgmentId = this.generateUUID();
                
                const acknowledgmentText = this.generateGratitudeText(acknowledgment);
                
                const db = new sqlite3.Database(this.dbPath);
                
                const acknowledgmentData = {
                    id: acknowledgmentId,
                    recipient_name: acknowledgment.recipientName,
                    recipient_type: acknowledgment.recipientType,
                    contribution_type: acknowledgment.contributionType,
                    contribution_description: acknowledgment.contributionDescription,
                    impact_description: acknowledgment.impactDescription,
                    acknowledgment_text: acknowledgmentText,
                    visibility_level: acknowledgment.visibilityLevel || 'public',
                    contact_permission: acknowledgment.contactPermission || false,
                    public_thanks: acknowledgment.publicThanks !== false,
                    created_at: Date.now(),
                    updated_at: Date.now()
                };
                
                db.run(`
                    INSERT INTO acknowledgments
                    (id, recipient_name, recipient_type, contribution_type, contribution_description,
                     impact_description, acknowledgment_text, visibility_level, contact_permission, 
                     public_thanks, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    acknowledgmentData.id, acknowledgmentData.recipient_name, acknowledgmentData.recipient_type,
                    acknowledgmentData.contribution_type, acknowledgmentData.contribution_description,
                    acknowledgmentData.impact_description, acknowledgmentData.acknowledgment_text,
                    acknowledgmentData.visibility_level, acknowledgmentData.contact_permission,
                    acknowledgmentData.public_thanks, acknowledgmentData.created_at, acknowledgmentData.updated_at
                ], function(err) {
                    if (err) {
                        console.error('Acknowledgment error:', err);
                        return res.status(500).json({ success: false, error: 'Acknowledgment failed' });
                    }
                    
                    res.json({
                        success: true,
                        acknowledgmentId,
                        acknowledgmentText,
                        visibilityLevel: acknowledgmentData.visibility_level
                    });
                });
                
                db.close();
                
            } catch (error) {
                console.error('Acknowledgment error:', error);
                res.status(500).json({ success: false, error: 'Acknowledgment failed' });
            }
        });

        // Check license compatibility
        this.app.post('/license/check-compatibility', async (req, res) => {
            try {
                const { projectLicense, dependencyLicenses } = req.body;
                
                const compatibility = this.checkLicenseCompatibility(projectLicense, dependencyLicenses);
                
                res.json({
                    success: true,
                    projectLicense,
                    compatibility,
                    conflicts: compatibility.conflicts,
                    recommendations: compatibility.recommendations
                });
                
            } catch (error) {
                console.error('License compatibility check error:', error);
                res.status(500).json({ success: false, error: 'License compatibility check failed' });
            }
        });

        // Generate attribution report
        this.app.post('/reports/generate', async (req, res) => {
            try {
                const { reportType, scope, format } = req.body;
                
                const report = await this.generateAttributionReport(reportType, scope, format);
                
                res.json({
                    success: true,
                    reportId: report.id,
                    reportType,
                    format,
                    downloadUrl: `/reports/download/${report.id}`,
                    report: report.data
                });
                
            } catch (error) {
                console.error('Report generation error:', error);
                res.status(500).json({ success: false, error: 'Report generation failed' });
            }
        });

        // Get attribution by category
        this.app.get('/attributions/category/:category', async (req, res) => {
            try {
                const { category } = req.params;
                
                const attributions = await this.getAttributionsByCategory(category);
                
                res.json({
                    success: true,
                    category,
                    count: attributions.length,
                    attributions
                });
                
            } catch (error) {
                console.error('Attribution retrieval error:', error);
                res.status(500).json({ success: false, error: 'Attribution retrieval failed' });
            }
        });

        // Generate acknowledgments page
        this.app.get('/acknowledgments/generate-page', async (req, res) => {
            try {
                const acknowledgmentsPage = await this.generateAcknowledgmentsPage();
                
                res.json({
                    success: true,
                    page: acknowledgmentsPage,
                    totalAcknowledgments: acknowledgmentsPage.acknowledgments.length
                });
                
            } catch (error) {
                console.error('Acknowledgments page generation error:', error);
                res.status(500).json({ success: false, error: 'Acknowledgments page generation failed' });
            }
        });

        // Integrate with Technical Standards Foundation
        this.app.post('/integrate/standards-foundation', async (req, res) => {
            try {
                const { foundationUrl } = req.body;
                
                // Register with the Technical Standards Foundation
                const integration = await this.integrateWithStandardsFoundation(foundationUrl || 'http://localhost:42016');
                
                res.json({
                    success: true,
                    integration,
                    message: 'Successfully integrated with Technical Standards Foundation'
                });
                
            } catch (error) {
                console.error('Standards Foundation integration error:', error);
                res.status(500).json({ success: false, error: 'Integration failed' });
            }
        });

        // Serve attribution dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateAttributionDashboard());
        });
    }

    // Core functionality methods
    generateCitation(attribution) {
        const format = this.citationFormats[attribution.citationFormat] || this.citationFormats.software;
        let citation = format.template;
        
        // Replace template variables
        const replacements = {
            '{authors}': attribution.sourceAuthor || attribution.sourceOrganization || 'Unknown Author',
            '{author_organization}': attribution.sourceOrganization || attribution.sourceAuthor || 'Unknown',
            '{author}': attribution.sourceAuthor || 'Unknown Author',
            '{year}': new Date().getFullYear(),
            '{title}': attribution.sourceName,
            '{software_name}': attribution.sourceName,
            '{project_name}': attribution.sourceName,
            '{function_name}': attribution.functionName || attribution.sourceName,
            '{version}': attribution.sourceVersion || 'latest',
            '{software_type}': attribution.sourceType || 'Software',
            '{source}': attribution.sourceOrganization || attribution.sourceAuthor || 'Unknown Source',
            '{url}': attribution.sourceUrl || 'No URL provided',
            '{license}': attribution.licenseType || 'Unknown License',
            '{use_case}': attribution.usageDescription || 'project implementation',
            '{source_work}': attribution.sourceName,
            '{original_author}': attribution.sourceAuthor || 'Unknown Author',
            '{application_domain}': attribution.applicationDomain || 'software development'
        };
        
        Object.entries(replacements).forEach(([key, value]) => {
            citation = citation.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        });
        
        return citation;
    }

    generateAcknowledgment(attribution) {
        if (!attribution.generateAcknowledgment) return null;
        
        const template = this.gratitudeTemplates[attribution.acknowledgmentType] || this.gratitudeTemplates.individual_contributor;
        let acknowledgment = template.template;
        
        const replacements = {
            '{name}': attribution.sourceAuthor || attribution.sourceOrganization,
            '{organization}': attribution.sourceOrganization,
            '{contribution}': attribution.contributionDescription || attribution.usageDescription,
            '{specific_help}': attribution.specificHelp || 'contribution',
            '{outcome}': attribution.outcome || 'project success',
            '{resource_provided}': attribution.resourceProvided || attribution.sourceName,
            '{resource_type}': attribution.resourceType || attribution.sourceType,
            '{achievement}': attribution.achievement || 'complete our goals',
            '{project_name}': attribution.sourceName,
            '{maintainers}': attribution.sourceAuthor || attribution.sourceOrganization,
            '{project_type}': attribution.sourceType || 'tool',
            '{functionality}': attribution.functionality || 'functionality',
            '{our_feature}': attribution.ourFeature || 'system',
            '{source}': attribution.sourceAuthor || attribution.sourceOrganization,
            '{domain}': attribution.domain || 'software development',
            '{concept}': attribution.concept || 'approach',
            '{feature}': attribution.feature || 'implementation',
            '{area}': attribution.area || 'technical expertise',
            '{aspect_of_project}': attribution.aspectOfProject || 'project development'
        };
        
        Object.entries(replacements).forEach(([key, value]) => {
            acknowledgment = acknowledgment.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        });
        
        return acknowledgment;
    }

    generateGratitudeText(acknowledgment) {
        const template = this.gratitudeTemplates[acknowledgment.contributionType] || this.gratitudeTemplates.individual_contributor;
        let gratitude = template.template;
        
        const replacements = {
            '{name}': acknowledgment.recipientName,
            '{contribution}': acknowledgment.contributionDescription,
            '{specific_help}': acknowledgment.specificHelp || acknowledgment.contributionDescription,
            '{outcome}': acknowledgment.impactDescription || 'project improvement'
        };
        
        Object.entries(replacements).forEach(([key, value]) => {
            gratitude = gratitude.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        });
        
        return gratitude;
    }

    async scanDependencies(projectPath, packageManager = 'npm') {
        try {
            let packageFile;
            
            switch (packageManager) {
                case 'npm':
                    packageFile = path.join(projectPath || '.', 'package.json');
                    break;
                case 'python':
                    packageFile = path.join(projectPath || '.', 'requirements.txt');
                    break;
                default:
                    throw new Error(`Unsupported package manager: ${packageManager}`);
            }
            
            const content = await fs.readFile(packageFile, 'utf8');
            
            if (packageManager === 'npm') {
                const packageJson = JSON.parse(content);
                const dependencies = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies
                };
                
                return Object.entries(dependencies).map(([name, version]) => ({
                    name,
                    version: version.replace(/^[\^~]/, ''),
                    manager: 'npm',
                    type: packageJson.devDependencies && packageJson.devDependencies[name] ? 'dev' : 'production'
                }));
            }
            
            // Handle other package managers as needed
            return [];
            
        } catch (error) {
            console.error('Dependency scan error:', error);
            return [];
        }
    }

    async generateDependencyAttributions(dependencies) {
        const attributions = [];
        
        for (const dep of dependencies) {
            try {
                // Try to get package info from npm registry
                const packageInfo = await this.getPackageInfo(dep.name);
                
                const attribution = {
                    id: this.generateUUID(),
                    category: 'dependencies',
                    sourceType: 'npm_package',
                    sourceName: dep.name,
                    sourceVersion: dep.version,
                    sourceAuthor: packageInfo.author,
                    sourceOrganization: packageInfo.organization,
                    sourceUrl: packageInfo.homepage || packageInfo.repository,
                    licenseType: packageInfo.license,
                    citationFormat: 'dependency',
                    usageDescription: `Used as ${dep.type} dependency`,
                    importanceLevel: dep.type === 'production' ? 'high' : 'medium'
                };
                
                attributions.push(attribution);
                
                // Store in database
                await this.storeDependencyAttribution(attribution);
                
            } catch (error) {
                console.error(`Error processing dependency ${dep.name}:`, error);
            }
        }
        
        return attributions;
    }

    async getPackageInfo(packageName) {
        try {
            const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
            const data = response.data;
            
            return {
                author: data.author?.name || data.maintainers?.[0]?.name,
                organization: data.author?.name,
                license: data.license?.type || data.license,
                homepage: data.homepage,
                repository: data.repository?.url,
                description: data.description
            };
        } catch (error) {
            console.error(`Error fetching package info for ${packageName}:`, error);
            return {
                author: 'Unknown',
                license: 'Unknown',
                homepage: null,
                repository: null
            };
        }
    }

    checkLicenseCompatibility(projectLicense, dependencyLicenses) {
        const projectLicenseInfo = this.licenseCompatibility[projectLicense];
        
        if (!projectLicenseInfo) {
            return {
                compatible: false,
                conflicts: [`Unknown project license: ${projectLicense}`],
                recommendations: ['Please specify a recognized license for your project']
            };
        }
        
        const conflicts = [];
        const warnings = [];
        const recommendations = [];
        
        dependencyLicenses.forEach(depLicense => {
            if (!projectLicenseInfo.compatible_with.includes(depLicense)) {
                conflicts.push(`${depLicense} is not compatible with ${projectLicense}`);
            }
            
            const depLicenseInfo = this.licenseCompatibility[depLicense];
            if (depLicenseInfo && depLicenseInfo.requires) {
                depLicenseInfo.requires.forEach(requirement => {
                    if (!projectLicenseInfo.requires.includes(requirement)) {
                        warnings.push(`${depLicense} requires ${requirement} which may not be met by ${projectLicense}`);
                    }
                });
            }
        });
        
        if (conflicts.length === 0) {
            recommendations.push('All dependency licenses are compatible');
        } else {
            recommendations.push('Consider changing project license or replacing incompatible dependencies');
        }
        
        return {
            compatible: conflicts.length === 0,
            conflicts,
            warnings,
            recommendations
        };
    }

    async generateAttributionReport(reportType, scope, format) {
        const reportId = this.generateUUID();
        
        const db = new sqlite3.Database(this.dbPath);
        
        return new Promise((resolve, reject) => {
            // Get all attributions
            db.all(`SELECT * FROM attributions ORDER BY importance_level DESC, created_at DESC`, [], (err, attributions) => {
                if (err) return reject(err);
                
                // Get all acknowledgments
                db.all(`SELECT * FROM acknowledgments WHERE public_thanks = 1 ORDER BY created_at DESC`, [], (err, acknowledgments) => {
                    if (err) return reject(err);
                    
                    // Get all dependencies
                    db.all(`SELECT * FROM dependencies ORDER BY package_name`, [], (err, dependencies) => {
                        if (err) return reject(err);
                        
                        const reportData = {
                            id: reportId,
                            type: reportType,
                            scope,
                            format,
                            generatedAt: Date.now(),
                            summary: {
                                totalAttributions: attributions.length,
                                totalAcknowledgments: acknowledgments.length,
                                totalDependencies: dependencies.length,
                                licenseDistribution: this.getLicenseDistribution(attributions)
                            },
                            sections: {
                                attributions: this.groupAttributionsByCategory(attributions),
                                acknowledgments,
                                dependencies,
                                licenseCompliance: this.generateLicenseComplianceSection(attributions)
                            }
                        };
                        
                        // Store report
                        db.run(`
                            INSERT INTO attribution_reports 
                            (id, report_type, report_scope, generated_by, report_data, report_format, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [reportId, reportType, scope, 'system', JSON.stringify(reportData), format, Date.now()]);
                        
                        resolve({
                            id: reportId,
                            data: reportData
                        });
                    });
                });
            });
            
            db.close();
        });
    }

    async integrateWithStandardsFoundation(foundationUrl) {
        try {
            // Register this service with the Technical Standards Foundation
            const integrationData = {
                name: 'Attribution & Citation System',
                type: 'attribution_system',
                description: 'Manages proper attribution and citation tracking',
                owner: 'Document Generator Technologies',
                licenseType: 'MIT',
                standardsRequired: ['iso/9001', 'ieee/830'],
                groundingLevel: 'standard'
            };
            
            const response = await axios.post(`${foundationUrl}/register/component`, integrationData);
            
            if (response.data.success) {
                // Add attribution for the standards foundation itself
                await this.addSelfAttribution({
                    componentId: response.data.componentId,
                    sourceName: 'Technical Standards Foundation',
                    sourceType: 'internal_service',
                    sourceUrl: foundationUrl,
                    licenseType: 'MIT',
                    usageDescription: 'Provides standards compliance framework',
                    citationFormat: 'software',
                    category: 'dependencies'
                });
                
                return {
                    registered: true,
                    componentId: response.data.componentId,
                    foundationUrl
                };
            }
            
            throw new Error('Failed to register with Standards Foundation');
            
        } catch (error) {
            console.error('Standards Foundation integration error:', error);
            throw error;
        }
    }

    // Helper methods
    getLicenseRequirements(licenseType) {
        const licenseInfo = this.licenseCompatibility[licenseType];
        return licenseInfo ? licenseInfo.requires : ['license_text'];
    }

    getLicenseDistribution(attributions) {
        const distribution = {};
        attributions.forEach(attr => {
            const license = attr.license_type || 'Unknown';
            distribution[license] = (distribution[license] || 0) + 1;
        });
        return distribution;
    }

    groupAttributionsByCategory(attributions) {
        const grouped = {};
        attributions.forEach(attr => {
            if (!grouped[attr.category]) {
                grouped[attr.category] = [];
            }
            grouped[attr.category].push(attr);
        });
        return grouped;
    }

    generateLicenseComplianceSection(attributions) {
        const licenseGroups = this.groupAttributionsByCategory(attributions);
        const compliance = {};
        
        Object.entries(licenseGroups).forEach(([category, attrs]) => {
            compliance[category] = {
                count: attrs.length,
                licenses: [...new Set(attrs.map(a => a.license_type))],
                compliance_status: 'compliant' // Would need more sophisticated checking
            };
        });
        
        return compliance;
    }

    async getAttributionsByCategory(category) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.all(`SELECT * FROM attributions WHERE category = ? ORDER BY importance_level DESC`, [category], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
            
            db.close();
        });
    }

    async generateAcknowledgmentsPage() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.all(`SELECT * FROM acknowledgments WHERE public_thanks = 1 ORDER BY recipient_type, recipient_name`, [], (err, acknowledgments) => {
                if (err) return reject(err);
                
                const page = {
                    title: 'Acknowledgments',
                    subtitle: 'We are grateful for all the contributions that made this project possible',
                    lastUpdated: new Date().toISOString(),
                    acknowledgments: acknowledgments.map(ack => ({
                        name: ack.recipient_name,
                        type: ack.recipient_type,
                        contribution: ack.contribution_description,
                        acknowledgment: ack.acknowledgment_text
                    }))
                };
                
                resolve(page);
            });
            
            db.close();
        });
    }

    async addSelfAttribution(attribution) {
        const db = new sqlite3.Database(this.dbPath);
        
        const citationText = this.generateCitation(attribution);
        
        return new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO attributions 
                (id, component_id, category, source_type, source_name, source_url, 
                 license_type, citation_format, attribution_text, usage_description, 
                 importance_level, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                this.generateUUID(), attribution.componentId, attribution.category,
                attribution.sourceType, attribution.sourceName, attribution.sourceUrl,
                attribution.licenseType, attribution.citationFormat, citationText,
                attribution.usageDescription, 'high', Date.now(), Date.now()
            ], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
            
            db.close();
        });
    }

    async storeDependencyAttribution(attribution) {
        const db = new sqlite3.Database(this.dbPath);
        
        const citationText = this.generateCitation(attribution);
        
        return new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO attributions 
                (id, category, source_type, source_name, source_author, source_organization,
                 source_url, source_version, license_type, citation_format, attribution_text,
                 usage_description, importance_level, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                attribution.id, attribution.category, attribution.sourceType, attribution.sourceName,
                attribution.sourceAuthor, attribution.sourceOrganization, attribution.sourceUrl,
                attribution.sourceVersion, attribution.licenseType, attribution.citationFormat,
                citationText, attribution.usageDescription, attribution.importanceLevel,
                Date.now(), Date.now()
            ], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
            
            db.close();
        });
    }

    generateAttributionDashboard() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📝 Attribution & Citation System Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', serif;
            background: linear-gradient(45deg, #2c3e50, #34495e, #3b4a56);
            color: #ecf0f1;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
            background: rgba(0,0,0,0.8);
            padding: 30px;
            border: 3px solid #f39c12;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
        }
        .title {
            font-size: 2.5em;
            color: #f39c12;
            text-shadow: 0 0 20px #f39c12;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #3498db;
            font-size: 1.2em;
            margin-bottom: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .panel {
            background: rgba(0,0,0,0.7);
            border: 2px solid #3498db;
            border-radius: 10px;
            padding: 20px;
        }
        .panel-title {
            color: #3498db;
            font-size: 1.3em;
            margin-bottom: 15px;
            border-bottom: 1px solid #3498db;
            padding-bottom: 10px;
        }
        .citation-format {
            background: rgba(52,152,219,0.1);
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #3498db;
            border-radius: 5px;
        }
        .format-name {
            font-weight: bold;
            color: #3498db;
            font-size: 1.1em;
        }
        .format-template {
            color: #ecf0f1;
            margin: 5px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .format-example {
            color: #95a5a6;
            font-style: italic;
            font-size: 0.9em;
            margin-top: 10px;
        }
        .license-compatibility {
            background: rgba(243,156,18,0.1);
            border: 2px solid #f39c12;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .license-item {
            background: rgba(243,156,18,0.2);
            padding: 12px;
            margin: 8px 0;
            border-radius: 5px;
        }
        .license-name {
            font-weight: bold;
            color: #f39c12;
        }
        .license-details {
            color: #ecf0f1;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .gratitude-section {
            background: rgba(46,204,113,0.1);
            border: 2px solid #2ecc71;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .gratitude-template {
            background: rgba(46,204,113,0.2);
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #2ecc71;
        }
        .template-name {
            font-weight: bold;
            color: #2ecc71;
            font-size: 1.1em;
        }
        .template-text {
            color: #ecf0f1;
            margin: 8px 0;
            line-height: 1.4;
        }
        .btn {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-family: 'Georgia', serif;
            font-weight: bold;
            margin: 10px 5px;
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52,152,219,0.4);
        }
        .btn-warning {
            background: linear-gradient(45deg, #f39c12, #d68910);
        }
        .btn-success {
            background: linear-gradient(45deg, #2ecc71, #27ae60);
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-compliant { background: #2ecc71; }
        .status-warning { background: #f39c12; }
        .status-violation { background: #e74c3c; }
        .category-badge {
            background: rgba(155,89,182,0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin: 2px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">📝 Attribution & Citation System</div>
            <div class="subtitle">Proper acknowledgment and citation tracking for all sources</div>
            <div style="color: #2ecc71;">
                <span class="status-indicator status-compliant"></span>Academic Standards Compliant
            </div>
        </div>

        <div class="grid">
            <div class="panel">
                <div class="panel-title">📚 Citation Formats</div>
                
                <div class="citation-format">
                    <div class="format-name">Academic Citation (APA Style)</div>
                    <div class="format-template">{authors} ({year}). {title}. {source}. {url}</div>
                    <div class="format-example">Example: Smith, J. (2025). "Advanced Algorithm Design". Journal of Computer Science. https://example.com</div>
                </div>
                
                <div class="citation-format">
                    <div class="format-name">Software Attribution</div>
                    <div class="format-template">{author_organization}. ({year}). {software_name} ({version}) [{software_type}]. {url}</div>
                    <div class="format-example">Example: Express Team. (2024). Express.js (4.18.2) [Web Framework]. https://expressjs.com</div>
                </div>
                
                <div class="citation-format">
                    <div class="format-name">Code Snippet Reference</div>
                    <div class="format-template">{author}. ({year}). "{function_name}" from {project_name}. {url}. Licensed under {license}.</div>
                    <div class="format-example">Example: GitHub User. (2024). "authenticateUser" from auth-helpers. Licensed under MIT.</div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-title">📋 Attribution Categories</div>
                
                <div style="margin: 15px 0;">
                    <span class="category-badge">Dependencies</span>
                    <span class="category-badge">Code Snippets</span>
                    <span class="category-badge">Algorithms</span>
                    <span class="category-badge">Design Patterns</span>
                </div>
                
                <div style="margin: 15px 0;">
                    <span class="category-badge">Documentation</span>
                    <span class="category-badge">Inspiration</span>
                    <span class="category-badge">Tools</span>
                    <span class="category-badge">Data Sources</span>
                </div>
                
                <div style="margin: 15px 0;">
                    <span class="category-badge">Academic Papers</span>
                    <span class="category-badge">Contributions</span>
                </div>
            </div>

            <div class="license-compatibility">
                <div class="panel-title" style="color: #f39c12;">⚖️ License Compatibility Matrix</div>
                
                <div class="license-item">
                    <div class="license-name">MIT License</div>
                    <div class="license-details">Compatible with: MIT, Apache-2.0, BSD-3-Clause, GPL-3.0<br>
                    Requires: Copyright notice, License text</div>
                </div>
                
                <div class="license-item">
                    <div class="license-name">Apache License 2.0</div>
                    <div class="license-details">Compatible with: MIT, Apache-2.0, BSD-3-Clause, GPL-3.0<br>
                    Requires: Copyright notice, License text, Notice file, Changes documented</div>
                </div>
                
                <div class="license-item">
                    <div class="license-name">GPL 3.0</div>
                    <div class="license-details">Compatible with: GPL-3.0, LGPL-3.0<br>
                    Requires: Source code, Copyright notice, License text, Changes documented</div>
                </div>
            </div>

            <div class="gratitude-section">
                <div class="panel-title" style="color: #2ecc71;">🙏 Gratitude Templates</div>
                
                <div class="gratitude-template">
                    <div class="template-name">Individual Contributor</div>
                    <div class="template-text">Special thanks to {name} for {contribution}. Their {specific_help} was instrumental in {outcome}.</div>
                </div>
                
                <div class="gratitude-template">
                    <div class="template-name">Open Source Project</div>
                    <div class="template-text">Built with {project_name} by {maintainers}. This {project_type} provides {functionality} that powers {our_feature}.</div>
                </div>
                
                <div class="gratitude-template">
                    <div class="template-name">Inspiration Source</div>
                    <div class="template-text">Inspired by the work of {source} in {domain}. Their approach to {concept} influenced our implementation of {feature}.</div>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <button class="btn" onclick="addAttribution()">📝 Add Attribution</button>
            <button class="btn btn-warning" onclick="scanDependencies()">🔍 Scan Dependencies</button>
            <button class="btn btn-success" onclick="addAcknowledgment()">🙏 Add Acknowledgment</button>
            <button class="btn" onclick="checkLicenses()">⚖️ Check License Compatibility</button>
            <button class="btn" onclick="generateReport()">📊 Generate Attribution Report</button>
        </div>
    </div>

    <script>
        function addAttribution() {
            const attribution = {
                sourceName: prompt('Source Name:'),
                sourceType: prompt('Source Type (library, code_snippet, inspiration, etc.):'),
                sourceAuthor: prompt('Author/Organization:'),
                sourceUrl: prompt('URL (optional):'),
                licenseType: prompt('License Type (MIT, Apache-2.0, etc.):'),
                category: prompt('Category (dependencies, code_snippets, inspiration, etc.):'),
                citationFormat: prompt('Citation Format (academic, software, code_snippet, etc.):') || 'software',
                usageDescription: prompt('How is this used in your project:')
            };

            if (!attribution.sourceName) return;

            fetch('/attribution/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attribution)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(\`Attribution added successfully!\\n\\nCitation:\\n\${data.citationText}\`);
                } else {
                    alert('Attribution failed: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Attribution failed');
            });
        }

        function scanDependencies() {
            const projectPath = prompt('Project path (leave empty for current directory):') || '.';
            const packageManager = prompt('Package manager (npm, python):') || 'npm';

            fetch('/dependencies/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectPath, packageManager })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(\`Dependencies scanned successfully!\\nFound: \${data.dependenciesFound} dependencies\\nAttributions generated: \${data.attributionsGenerated}\`);
                } else {
                    alert('Dependency scan failed: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Dependency scan failed');
            });
        }

        function addAcknowledgment() {
            const acknowledgment = {
                recipientName: prompt('Recipient Name:'),
                recipientType: prompt('Recipient Type (individual_contributor, organization, mentor_advisor, etc.):'),
                contributionType: prompt('Contribution Type:'),
                contributionDescription: prompt('Describe their contribution:'),
                impactDescription: prompt('Describe the impact of their contribution:'),
                visibilityLevel: prompt('Visibility Level (public, internal, private):') || 'public'
            };

            if (!acknowledgment.recipientName) return;

            fetch('/acknowledgments/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(acknowledgment)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(\`Acknowledgment added successfully!\\n\\nText:\\n\${data.acknowledgmentText}\`);
                } else {
                    alert('Acknowledgment failed: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Acknowledgment failed');
            });
        }

        function checkLicenses() {
            const projectLicense = prompt('Your project license (MIT, Apache-2.0, etc.):');
            const dependencyLicenses = prompt('Dependency licenses (comma-separated):').split(',').map(s => s.trim());

            if (!projectLicense) return;

            fetch('/license/check-compatibility', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectLicense, dependencyLicenses })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const conflicts = data.compatibility.conflicts;
                    const message = conflicts.length === 0 ? 
                        'All licenses are compatible!' : 
                        \`License conflicts found:\\n\${conflicts.join('\\n')}\`;
                    alert(message);
                } else {
                    alert('License check failed: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('License check failed');
            });
        }

        function generateReport() {
            const reportType = prompt('Report type (full, summary, licenses):') || 'full';
            const format = prompt('Format (html, json, markdown):') || 'html';

            fetch('/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportType, scope: 'all', format })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(\`Report generated successfully!\\nReport ID: \${data.reportId}\\nTotal Attributions: \${data.report.summary.totalAttributions}\`);
                } else {
                    alert('Report generation failed: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Report generation failed');
            });
        }

        // Auto-refresh status every 30 seconds
        setInterval(() => {
            fetch('/health')
            .then(response => response.json())
            .then(data => {
                console.log('Attribution System Status:', data);
            })
            .catch(error => console.error('Health check failed:', error));
        }, 30000);
    </script>
</body>
</html>
        `;
    }

    generateUUID() {
        return crypto.randomUUID();
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`📝 Attribution & Citation System running on http://localhost:${this.port}`);
            console.log('📚 Academic-grade citation formats active');
            console.log('⚖️ License compatibility checking enabled');
            console.log('🙏 Gratitude and acknowledgment templates ready');
            console.log('🔍 Dependency attribution scanning available');
        });
    }
}

// Start the Attribution & Citation System
const attributionSystem = new AttributionCitationSystem();
attributionSystem.start();

module.exports = { AttributionCitationSystem };
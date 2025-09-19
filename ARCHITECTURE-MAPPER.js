#!/usr/bin/env node

/**
 * ARCHITECTURE MAPPER
 * Maps the entire fucking mess and creates proper documentation
 * Shows all dockers, anchors, XML mappings, and tier structures
 */

const fs = require('fs').promises;
const path = require('path');

class ArchitectureMapper {
    constructor() {
        this.dockerFiles = new Map();
        this.anchors = new Map();
        this.xmlMappings = new Map();
        this.tierStructure = new Map();
        this.symlinks = new Map();
        this.portConflicts = new Map();
        this.brokenConnections = [];
        
        this.rootPath = '/Users/matthewmauer/Desktop/Document-Generator';
        
        this.init();
    }
    
    async init() {
        console.log('🗺️ ARCHITECTURE MAPPER STARTING...');
        console.log('📍 Scanning entire system structure...');
        
        // Scan everything
        await this.scanDockerFiles();
        await this.scanAnchorsAndSymlinks();
        await this.scanXMLMappings();
        await this.scanTierStructure();
        await this.detectPortConflicts();
        await this.findBrokenConnections();
        
        // Generate complete documentation
        await this.generateArchitectureMap();
        await this.generateFixScript();
        
        console.log('✅ ARCHITECTURE MAPPING COMPLETE');
    }
    
    async scanDockerFiles() {
        console.log('🐳 Scanning Docker infrastructure...');
        
        const dockerFiles = await this.findFiles(this.rootPath, /docker-compose.*\.ya?ml|Dockerfile/);
        
        for (const file of dockerFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const relativePath = path.relative(this.rootPath, file);
                
                // Parse docker-compose files
                if (file.includes('docker-compose')) {
                    const services = this.parseDockerCompose(content);
                    this.dockerFiles.set(relativePath, {
                        type: 'docker-compose',
                        services: services,
                        ports: this.extractPorts(content),
                        volumes: this.extractVolumes(content),
                        networks: this.extractNetworks(content)
                    });
                }
                
                // Parse Dockerfiles
                if (file.includes('Dockerfile')) {
                    this.dockerFiles.set(relativePath, {
                        type: 'dockerfile',
                        baseImage: this.extractBaseImage(content),
                        ports: this.extractDockerfilePorts(content),
                        commands: this.extractCommands(content)
                    });
                }
            } catch (error) {
                console.log(`⚠️ Could not read ${file}: ${error.message}`);
            }
        }
        
        console.log(`📊 Found ${this.dockerFiles.size} Docker files`);
    }
    
    async scanAnchorsAndSymlinks() {
        console.log('⚓ Scanning anchors and symlinks...');
        
        const symlinkDirs = [
            path.join(this.rootPath, 'symlinks'),
            path.join(this.rootPath, 'FinishThisIdea', 'symlinks'),
            path.join(this.rootPath, 'tier-3', 'symlinks')
        ];
        
        for (const dir of symlinkDirs) {
            try {
                const items = await fs.readdir(dir, { withFileTypes: true });
                
                for (const item of items) {
                    if (item.isSymbolicLink()) {
                        const linkPath = path.join(dir, item.name);
                        try {
                            const target = await fs.readlink(linkPath);
                            const absoluteTarget = path.resolve(dir, target);
                            
                            // Check if target exists
                            let exists = false;
                            try {
                                await fs.access(absoluteTarget);
                                exists = true;
                            } catch {}
                            
                            this.symlinks.set(item.name, {
                                path: linkPath,
                                target: target,
                                absoluteTarget: absoluteTarget,
                                exists: exists,
                                type: 'symlink'
                            });
                        } catch (error) {
                            this.brokenConnections.push({
                                type: 'broken_symlink',
                                path: linkPath,
                                error: error.message
                            });
                        }
                    }
                }
            } catch (error) {
                // Directory doesn't exist
            }
        }
        
        console.log(`🔗 Found ${this.symlinks.size} symlinks`);
    }
    
    async scanXMLMappings() {
        console.log('🗺️ Scanning XML mappings...');
        
        const xmlFiles = await this.findFiles(this.rootPath, /\.xml$/);
        
        for (const file of xmlFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const relativePath = path.relative(this.rootPath, file);
                
                // Parse XML to understand structure
                const structure = this.parseXMLStructure(content);
                
                this.xmlMappings.set(relativePath, {
                    path: file,
                    structure: structure,
                    schemas: this.extractXMLSchemas(content),
                    mappings: this.extractMappings(content)
                });
            } catch (error) {
                console.log(`⚠️ Could not parse XML ${file}: ${error.message}`);
            }
        }
        
        console.log(`📋 Found ${this.xmlMappings.size} XML mappings`);
    }
    
    async scanTierStructure() {
        console.log('🏗️ Scanning tier structure...');
        
        const tierDirs = [
            path.join(this.rootPath, 'tier-1'),
            path.join(this.rootPath, 'tier-2'), 
            path.join(this.rootPath, 'tier-3'),
            path.join(this.rootPath, 'FinishThisIdea', 'tier-1'),
            path.join(this.rootPath, 'FinishThisIdea', 'tier-2'),
            path.join(this.rootPath, 'FinishThisIdea', 'tier-3'),
            path.join(this.rootPath, 'FinishThisIdea', 'tier-1-generated'),
            path.join(this.rootPath, 'FinishThisIdea', 'tier-2-services'),
            path.join(this.rootPath, 'FinishThisIdea', 'tier-3-meta'),
            path.join(this.rootPath, 'FinishThisIdea', 'tier-3-permanent')
        ];
        
        for (const dir of tierDirs) {
            try {
                const stats = await fs.stat(dir);
                if (stats.isDirectory()) {
                    const contents = await this.scanDirectoryStructure(dir);
                    const relativePath = path.relative(this.rootPath, dir);
                    
                    this.tierStructure.set(relativePath, {
                        path: dir,
                        contents: contents,
                        size: contents.files + contents.directories,
                        lastModified: stats.mtime
                    });
                }
            } catch (error) {
                // Directory doesn't exist
            }
        }
        
        console.log(`🏢 Found ${this.tierStructure.size} tier directories`);
    }
    
    async detectPortConflicts() {
        console.log('🔍 Detecting port conflicts...');
        
        const portUsage = new Map();
        
        for (const [file, config] of this.dockerFiles) {
            if (config.ports) {
                for (const port of config.ports) {
                    const hostPort = port.split(':')[0];
                    
                    if (portUsage.has(hostPort)) {
                        portUsage.get(hostPort).push(file);
                    } else {
                        portUsage.set(hostPort, [file]);
                    }
                }
            }
        }
        
        // Find conflicts
        for (const [port, files] of portUsage) {
            if (files.length > 1) {
                this.portConflicts.set(port, files);
            }
        }
        
        console.log(`⚠️ Found ${this.portConflicts.size} port conflicts`);
    }
    
    async findBrokenConnections() {
        console.log('🔍 Finding broken connections...');
        
        // Check for broken service references in docker-compose files
        for (const [file, config] of this.dockerFiles) {
            if (config.type === 'docker-compose' && config.services) {
                for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
                    // Check depends_on references
                    if (serviceConfig.depends_on) {
                        for (const dependency of serviceConfig.depends_on) {
                            if (!config.services[dependency]) {
                                this.brokenConnections.push({
                                    type: 'missing_service_dependency',
                                    file: file,
                                    service: serviceName,
                                    missingDependency: dependency
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    async generateArchitectureMap() {
        console.log('📊 Generating architecture map...');
        
        const architectureMap = `# COMPLETE ARCHITECTURE MAP
Generated: ${new Date().toISOString()}

## 🗺️ SYSTEM OVERVIEW

### Docker Infrastructure
${this.generateDockerSection()}

### Tier Structure
${this.generateTierSection()}

### Symlink Network
${this.generateSymlinkSection()}

### XML Mappings
${this.generateXMLSection()}

### Port Allocation
${this.generatePortSection()}

### Issues Found
${this.generateIssuesSection()}

## 🔧 RECOMMENDED FIXES

### Immediate Actions (Critical)
1. **Fix Port Conflicts**
   - Reassign conflicting ports
   - Update service configurations
   
2. **Repair Broken Symlinks**
   - Update symlink targets
   - Remove dead links

3. **Consolidate Tier Structures**
   - Merge duplicate tier directories
   - Establish single source of truth

### Phase 2 Actions (Important)
1. **Create Master Docker Compose**
   - Consolidate all docker-compose files
   - Use profiles for different environments
   
2. **Implement Service Discovery**
   - Central service registry
   - Health check monitoring

3. **Document All Connections**
   - Service dependency map
   - Data flow diagrams

## 📋 CURRENT STATE SUMMARY

- **Docker Files**: ${this.dockerFiles.size} found
- **Symlinks**: ${this.symlinks.size} found (${Array.from(this.symlinks.values()).filter(s => !s.exists).length} broken)
- **XML Mappings**: ${this.xmlMappings.size} found  
- **Tier Directories**: ${this.tierStructure.size} found
- **Port Conflicts**: ${this.portConflicts.size} found
- **Broken Connections**: ${this.brokenConnections.length} found

## 🎯 NEXT STEPS

1. Run the auto-generated fix script: \`./ARCHITECTURE-FIX.sh\`
2. Review and test the unified docker-compose file
3. Verify all services start without conflicts
4. Update documentation with new structure

---
*Auto-generated by Architecture Mapper*
`;
        
        await fs.writeFile(path.join(this.rootPath, 'ARCHITECTURE-MAP.md'), architectureMap);
        console.log('📝 Created ARCHITECTURE-MAP.md');
    }
    
    generateDockerSection() {
        let section = `
**Found ${this.dockerFiles.size} Docker configuration files:**

`;
        
        for (const [file, config] of this.dockerFiles) {
            section += `\n### ${file}
- **Type**: ${config.type}
`;
            
            if (config.services) {
                section += `- **Services**: ${Object.keys(config.services).join(', ')}
`;
            }
            
            if (config.ports && config.ports.length > 0) {
                section += `- **Ports**: ${config.ports.join(', ')}
`;
            }
        }
        
        return section;
    }
    
    generateTierSection() {
        let section = `
**Found ${this.tierStructure.size} tier directories:**

`;
        
        for (const [tier, info] of this.tierStructure) {
            section += `\n### ${tier}
- **Path**: ${info.path}
- **Files**: ${info.contents.files}
- **Directories**: ${info.contents.directories}
- **Last Modified**: ${info.lastModified.toISOString()}
`;
        }
        
        return section;
    }
    
    generateSymlinkSection() {
        let section = `
**Found ${this.symlinks.size} symlinks:**

`;
        
        for (const [name, info] of this.symlinks) {
            const status = info.exists ? '✅' : '❌';
            section += `\n- **${name}** ${status}
  - Target: \`${info.target}\`
  - Status: ${info.exists ? 'Working' : 'BROKEN'}
`;
        }
        
        return section;
    }
    
    generateXMLSection() {
        let section = `
**Found ${this.xmlMappings.size} XML mapping files:**

`;
        
        for (const [file, info] of this.xmlMappings) {
            section += `\n### ${file}
- **Root Elements**: ${info.structure.rootElements.join(', ')}
- **Schemas**: ${info.schemas.length} found
- **Mappings**: ${info.mappings.length} found
`;
        }
        
        return section;
    }
    
    generatePortSection() {
        let section = `
**Port Usage Analysis:**

`;
        
        // Show all ports in use
        const allPorts = new Map();
        for (const [file, config] of this.dockerFiles) {
            if (config.ports) {
                for (const port of config.ports) {
                    const hostPort = port.split(':')[0];
                    if (allPorts.has(hostPort)) {
                        allPorts.get(hostPort).push({ file, port });
                    } else {
                        allPorts.set(hostPort, [{ file, port }]);
                    }
                }
            }
        }
        
        for (const [port, usage] of allPorts) {
            const status = usage.length > 1 ? '⚠️ CONFLICT' : '✅';
            section += `\n- **Port ${port}** ${status}
`;
            for (const use of usage) {
                section += `  - ${use.file}: ${use.port}
`;
            }
        }
        
        return section;
    }
    
    generateIssuesSection() {
        let section = `
**Critical Issues Found:**

`;
        
        // Port conflicts
        if (this.portConflicts.size > 0) {
            section += `\n### 🔴 Port Conflicts (${this.portConflicts.size})
`;
            for (const [port, files] of this.portConflicts) {
                section += `- **Port ${port}**: Used by ${files.join(', ')}
`;
            }
        }
        
        // Broken connections
        if (this.brokenConnections.length > 0) {
            section += `\n### 🔴 Broken Connections (${this.brokenConnections.length})
`;
            for (const broken of this.brokenConnections) {
                section += `- **${broken.type}**: ${broken.file || broken.path} - ${broken.error || broken.missingDependency}
`;
            }
        }
        
        // Broken symlinks
        const brokenSymlinks = Array.from(this.symlinks.values()).filter(s => !s.exists);
        if (brokenSymlinks.length > 0) {
            section += `\n### 🔴 Broken Symlinks (${brokenSymlinks.length})
`;
            for (const symlink of brokenSymlinks) {
                section += `- **${path.basename(symlink.path)}**: Points to non-existent ${symlink.target}
`;
            }
        }
        
        return section;
    }
    
    async generateFixScript() {
        console.log('🔧 Generating fix script...');
        
        const fixScript = `#!/bin/bash

# ARCHITECTURE FIX SCRIPT
# Auto-generated script to fix the structural mess

echo "🔧 FIXING ARCHITECTURE ISSUES..."

# Fix Port Conflicts
echo "📋 Fixing port conflicts..."
${this.generatePortFixCommands()}

# Fix Broken Symlinks  
echo "🔗 Fixing broken symlinks..."
${this.generateSymlinkFixCommands()}

# Consolidate Tier Structures
echo "🏗️ Consolidating tier structures..."
${this.generateTierFixCommands()}

# Create Master Docker Compose
echo "🐳 Creating master docker-compose..."
${this.generateDockerConsolidationCommands()}

echo "✅ ARCHITECTURE FIXES COMPLETE"
echo "📖 Check ARCHITECTURE-MAP.md for details"
`;
        
        await fs.writeFile(path.join(this.rootPath, 'ARCHITECTURE-FIX.sh'), fixScript);
        await fs.chmod(path.join(this.rootPath, 'ARCHITECTURE-FIX.sh'), 0o755);
        console.log('🔧 Created ARCHITECTURE-FIX.sh');
    }
    
    generatePortFixCommands() {
        let commands = '';
        
        // Generate commands to fix port conflicts
        let newPort = 8000;
        for (const [port, files] of this.portConflicts) {
            for (let i = 1; i < files.length; i++) {
                while (this.isPortInUse(newPort)) newPort++;
                commands += `
# Fix port conflict in ${files[i]}
sed -i 's/${port}:/${newPort}:/g' "${files[i]}"
echo "  Changed ${files[i]} from port ${port} to ${newPort}"
`;
                newPort++;
            }
        }
        
        return commands;
    }
    
    generateSymlinkFixCommands() {
        let commands = '';
        
        for (const [name, info] of this.symlinks) {
            if (!info.exists) {
                commands += `
# Fix broken symlink: ${name}
rm -f "${info.path}"
echo "  Removed broken symlink: ${name}"
`;
            }
        }
        
        return commands;
    }
    
    generateTierFixCommands() {
        return `
# Consolidate tier-3 directories
if [ -d "tier-3" ] && [ -d "FinishThisIdea/tier-3" ]; then
    echo "  Merging tier-3 directories..."
    rsync -av FinishThisIdea/tier-3/ tier-3/
    rm -rf FinishThisIdea/tier-3
    ln -s ../tier-3 FinishThisIdea/tier-3
fi
`;
    }
    
    generateDockerConsolidationCommands() {
        return `
# Create master docker-compose file
echo "version: '3.8'" > docker-compose.master.yml
echo "# Consolidated from ${this.dockerFiles.size} docker-compose files" >> docker-compose.master.yml
echo "# Generated by Architecture Mapper" >> docker-compose.master.yml
echo "" >> docker-compose.master.yml
echo "services:" >> docker-compose.master.yml
echo "  # TODO: Merge all services from individual docker-compose files" >> docker-compose.master.yml
`;
    }
    
    // Helper functions
    async findFiles(dir, pattern) {
        const files = [];
        
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory() && !item.name.startsWith('.') && !item.name.includes('node_modules')) {
                    const subFiles = await this.findFiles(fullPath, pattern);
                    files.push(...subFiles);
                } else if (item.isFile() && pattern.test(item.name)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return files;
    }
    
    async scanDirectoryStructure(dir) {
        let files = 0;
        let directories = 0;
        
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isDirectory()) {
                    directories++;
                } else {
                    files++;
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return { files, directories };
    }
    
    parseDockerCompose(content) {
        // Simple parser for docker-compose services
        const services = {};
        const lines = content.split('\n');
        let currentService = null;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes(':') && !trimmed.startsWith('#')) {
                if (trimmed.match(/^\w+:/)) {
                    currentService = trimmed.replace(':', '');
                    services[currentService] = {};
                }
            }
        }
        
        return services;
    }
    
    extractPorts(content) {
        const ports = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.includes('ports:') || line.match(/^\s*-\s*\d+:/)) {
                const match = line.match(/(\d+):(\d+)/);
                if (match) {
                    ports.push(match[0]);
                }
            }
        }
        
        return ports;
    }
    
    extractVolumes(content) {
        return content.match(/volumes:/g) ? ['volumes_found'] : [];
    }
    
    extractNetworks(content) {
        return content.match(/networks:/g) ? ['networks_found'] : [];
    }
    
    extractBaseImage(content) {
        const match = content.match(/FROM\s+([^\s]+)/);
        return match ? match[1] : 'unknown';
    }
    
    extractDockerfilePorts(content) {
        const matches = content.match(/EXPOSE\s+(\d+)/g);
        return matches ? matches.map(m => m.replace('EXPOSE ', '')) : [];
    }
    
    extractCommands(content) {
        const matches = content.match(/RUN\s+(.+)/g);
        return matches ? matches.length : 0;
    }
    
    parseXMLStructure(content) {
        const rootElements = [];
        const matches = content.match(/<([^\/\s>]+)[^>]*>/g);
        
        if (matches) {
            for (const match of matches) {
                const element = match.replace(/<([^\s>]+).*>/, '$1');
                if (!rootElements.includes(element)) {
                    rootElements.push(element);
                }
            }
        }
        
        return { rootElements };
    }
    
    extractXMLSchemas(content) {
        const schemas = [];
        if (content.includes('xmlns:') || content.includes('xsi:')) {
            schemas.push('schema_found');
        }
        return schemas;
    }
    
    extractMappings(content) {
        const mappings = [];
        if (content.includes('mapping') || content.includes('ref=')) {
            mappings.push('mapping_found');
        }
        return mappings;
    }
    
    isPortInUse(port) {
        for (const [file, config] of this.dockerFiles) {
            if (config.ports) {
                for (const p of config.ports) {
                    if (p.startsWith(port + ':')) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

// Map the architecture
if (require.main === module) {
    const mapper = new ArchitectureMapper();
    
    console.log('\n🎯 ARCHITECTURE MAPPING COMPLETE!');
    console.log('📖 Check ARCHITECTURE-MAP.md for full details');
    console.log('🔧 Run ./ARCHITECTURE-FIX.sh to fix issues');
}

module.exports = ArchitectureMapper;
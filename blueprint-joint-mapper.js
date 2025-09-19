/**
 * BLUEPRINT JOINT MAPPER
 * 
 * Maps the connection points between different system layers, finding the "joints"
 * and "seams" where infrastructure components meet. These joints are where light
 * leaks through, revealing the underlying construction of our digital reality.
 * 
 * Joint Types:
 * - Service boundaries (where microservices connect)
 * - Layer transitions (tier1 → tier2 → tier3)
 * - Template interfaces (where templates meet processors)
 * - Data flow joints (where data transforms between formats)
 * - Time boundaries (where async becomes sync)
 * - Permission boundaries (where auth meets resources)
 * 
 * These mapped joints become entry points for meta-level breakthroughs.
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BlueprintJointMapper extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableAutoDiscovery: config.enableAutoDiscovery !== false,
      enableJointVisualization: config.enableJointVisualization !== false,
      enableSeamTracking: config.enableSeamTracking !== false,
      jointSensitivity: config.jointSensitivity || 0.7,
      maxJointDepth: config.maxJointDepth || 10,
      blueprintPaths: config.blueprintPaths || [
        '/tier-1', '/tier-2', '/tier-3',
        '/services', '/templates', '/ai-os-clean'
      ],
      ...config
    };
    
    // Blueprint joint types and their characteristics
    this.jointTypes = {
      serviceToService: {
        name: 'Service-to-Service Joint',
        pattern: /service.*\.(js|ts).*require.*service/i,
        characteristics: {
          coupling: 'loose',
          visibility: 'high',
          leakPotential: 0.8
        },
        symbol: '🔗'
      },
      
      tierTransition: {
        name: 'Tier Transition Joint',
        pattern: /tier-?\d.*tier-?\d/i,
        characteristics: {
          coupling: 'hierarchical',
          visibility: 'medium',
          leakPotential: 0.9
        },
        symbol: '📊'
      },
      
      templateProcessor: {
        name: 'Template-Processor Joint',
        pattern: /template.*processor|processor.*template/i,
        characteristics: {
          coupling: 'tight',
          visibility: 'low',
          leakPotential: 0.7
        },
        symbol: '📄'
      },
      
      dataTransform: {
        name: 'Data Transform Joint',
        pattern: /transform|convert|parse|serialize/i,
        characteristics: {
          coupling: 'functional',
          visibility: 'medium',
          leakPotential: 0.75
        },
        symbol: '🔄'
      },
      
      asyncBoundary: {
        name: 'Async-Sync Boundary',
        pattern: /async.*await|promise|callback/i,
        characteristics: {
          coupling: 'temporal',
          visibility: 'low',
          leakPotential: 0.85
        },
        symbol: '⏱️'
      },
      
      authGateway: {
        name: 'Authorization Gateway',
        pattern: /auth|permission|access.*control|guard/i,
        characteristics: {
          coupling: 'security',
          visibility: 'high',
          leakPotential: 0.65
        },
        symbol: '🔐'
      },
      
      errorBoundary: {
        name: 'Error Boundary Joint',
        pattern: /catch|error|exception|fallback/i,
        characteristics: {
          coupling: 'defensive',
          visibility: 'high',
          leakPotential: 0.9
        },
        symbol: '⚠️'
      },
      
      configInterface: {
        name: 'Configuration Interface',
        pattern: /config|settings|options|env/i,
        characteristics: {
          coupling: 'parametric',
          visibility: 'medium',
          leakPotential: 0.6
        },
        symbol: '⚙️'
      }
    };
    
    // Seam patterns (where joints are weakest)
    this.seamPatterns = {
      versionMismatch: {
        name: 'Version Mismatch Seam',
        indicators: ['version', 'compatibility', 'deprecated'],
        vulnerability: 0.9
      },
      
      protocolBridge: {
        name: 'Protocol Bridge Seam',
        indicators: ['http', 'websocket', 'grpc', 'rest'],
        vulnerability: 0.85
      },
      
      formatConversion: {
        name: 'Format Conversion Seam',
        indicators: ['json', 'xml', 'yaml', 'binary'],
        vulnerability: 0.8
      },
      
      languageBoundary: {
        name: 'Language Boundary Seam',
        indicators: ['ffi', 'binding', 'wrapper', 'bridge'],
        vulnerability: 0.95
      },
      
      containerEdge: {
        name: 'Container Edge Seam',
        indicators: ['docker', 'kubernetes', 'pod', 'container'],
        vulnerability: 0.75
      }
    };
    
    // Mapped joints storage
    this.mappedJoints = new Map();
    this.seamRegistry = new Map();
    this.blueprintGraph = new Map();
    this.jointConnections = [];
    this.vulnerabilityMap = new Map();
    
    console.log('🗺️ Blueprint Joint Mapper initialized');
    console.log(`📍 Tracking ${Object.keys(this.jointTypes).length} joint types`);
    console.log(`🔍 Monitoring ${Object.keys(this.seamPatterns).length} seam patterns`);
  }
  
  /**
   * Scan system for blueprint joints
   */
  async scanForJoints(targetPath = '.') {
    console.log(`🔍 Scanning for blueprint joints in: ${targetPath}`);
    
    const joints = [];
    const startTime = Date.now();
    
    try {
      // Scan directory structure
      await this.scanDirectory(targetPath, joints);
      
      // Analyze found joints
      const analysis = await this.analyzeJoints(joints);
      
      // Map joint connections
      await this.mapJointConnections(joints);
      
      // Identify vulnerable seams
      const seams = await this.identifySeams(joints);
      
      const scanTime = Date.now() - startTime;
      
      console.log(`✅ Joint scan complete in ${scanTime}ms`);
      console.log(`📊 Found ${joints.length} joints`);
      console.log(`🔗 Mapped ${this.jointConnections.length} connections`);
      console.log(`⚡ Identified ${seams.length} vulnerable seams`);
      
      const result = {
        joints,
        analysis,
        connections: this.jointConnections,
        seams,
        scanTime,
        timestamp: Date.now()
      };
      
      this.emit('scan:complete', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Joint scan failed:', error);
      this.emit('scan:error', error);
      throw error;
    }
  }
  
  /**
   * Scan directory for joints
   */
  async scanDirectory(dirPath, joints, depth = 0) {
    if (depth > this.config.maxJointDepth) return;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and hidden directories
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await this.scanDirectory(fullPath, joints, depth + 1);
          }
        } else if (entry.isFile()) {
          // Check for joint patterns in files
          const fileJoints = await this.scanFile(fullPath);
          joints.push(...fileJoints);
        }
      }
    } catch (error) {
      // Directory might not exist or be inaccessible
      console.warn(`⚠️ Cannot scan ${dirPath}: ${error.message}`);
    }
  }
  
  /**
   * Scan file for joint patterns
   */
  async scanFile(filePath) {
    const joints = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Check each joint type
      for (const [type, config] of Object.entries(this.jointTypes)) {
        const matches = content.match(new RegExp(config.pattern, 'gi'));
        
        if (matches) {
          for (const match of matches) {
            const lineNumber = this.findLineNumber(lines, match);
            
            const joint = {
              id: this.generateJointId(),
              type,
              file: filePath,
              line: lineNumber,
              match,
              characteristics: config.characteristics,
              symbol: config.symbol,
              timestamp: Date.now()
            };
            
            joints.push(joint);
            this.mappedJoints.set(joint.id, joint);
          }
        }
      }
      
      // Check for seam patterns
      for (const [seamType, seamConfig] of Object.entries(this.seamPatterns)) {
        for (const indicator of seamConfig.indicators) {
          if (content.includes(indicator)) {
            const seam = {
              id: this.generateSeamId(),
              type: seamType,
              file: filePath,
              indicator,
              vulnerability: seamConfig.vulnerability,
              joints: joints.map(j => j.id)
            };
            
            this.seamRegistry.set(seam.id, seam);
          }
        }
      }
      
    } catch (error) {
      // File might be binary or inaccessible
      // Silently skip
    }
    
    return joints;
  }
  
  /**
   * Analyze found joints
   */
  async analyzeJoints(joints) {
    console.log('🔬 Analyzing joint patterns...');
    
    const analysis = {
      byType: {},
      byFile: {},
      byCharacteristic: {
        coupling: {},
        visibility: {},
        leakPotential: {}
      },
      hotspots: [],
      clusters: []
    };
    
    // Group by type
    for (const joint of joints) {
      if (!analysis.byType[joint.type]) {
        analysis.byType[joint.type] = [];
      }
      analysis.byType[joint.type].push(joint);
      
      // Group by file
      if (!analysis.byFile[joint.file]) {
        analysis.byFile[joint.file] = [];
      }
      analysis.byFile[joint.file].push(joint);
      
      // Analyze characteristics
      const chars = joint.characteristics;
      analysis.byCharacteristic.coupling[chars.coupling] = 
        (analysis.byCharacteristic.coupling[chars.coupling] || 0) + 1;
      analysis.byCharacteristic.visibility[chars.visibility] = 
        (analysis.byCharacteristic.visibility[chars.visibility] || 0) + 1;
    }
    
    // Identify hotspots (files with many joints)
    for (const [file, fileJoints] of Object.entries(analysis.byFile)) {
      if (fileJoints.length > 5) {
        analysis.hotspots.push({
          file,
          jointCount: fileJoints.length,
          types: [...new Set(fileJoints.map(j => j.type))],
          avgLeakPotential: fileJoints.reduce((sum, j) => 
            sum + j.characteristics.leakPotential, 0) / fileJoints.length
        });
      }
    }
    
    // Detect clusters (groups of related joints)
    analysis.clusters = this.detectJointClusters(joints);
    
    return analysis;
  }
  
  /**
   * Map connections between joints
   */
  async mapJointConnections(joints) {
    console.log('🔗 Mapping joint connections...');
    
    // Build file dependency graph
    const fileDeps = new Map();
    
    for (const joint of joints) {
      // Extract imports/requires from the file
      try {
        const content = await fs.readFile(joint.file, 'utf-8');
        const imports = this.extractImports(content);
        
        fileDeps.set(joint.file, imports);
      } catch (error) {
        // Skip if file can't be read
      }
    }
    
    // Connect joints based on file dependencies
    for (const joint1 of joints) {
      const deps = fileDeps.get(joint1.file) || [];
      
      for (const joint2 of joints) {
        if (joint1.id === joint2.id) continue;
        
        // Check if joint2's file is imported by joint1's file
        const joint2Dir = path.dirname(joint2.file);
        const joint2Name = path.basename(joint2.file, path.extname(joint2.file));
        
        for (const dep of deps) {
          if (dep.includes(joint2Name) || dep.includes(joint2Dir)) {
            const connection = {
              id: this.generateConnectionId(),
              from: joint1.id,
              to: joint2.id,
              type: 'import',
              strength: this.calculateConnectionStrength(joint1, joint2),
              path: `${joint1.file} → ${joint2.file}`
            };
            
            this.jointConnections.push(connection);
            break;
          }
        }
      }
    }
  }
  
  /**
   * Identify vulnerable seams
   */
  async identifySeams(joints) {
    console.log('⚡ Identifying vulnerable seams...');
    
    const seams = [];
    
    // Group joints by proximity
    const proximityGroups = this.groupJointsByProximity(joints);
    
    for (const group of proximityGroups) {
      // Check if this group forms a seam
      const seamScore = this.calculateSeamScore(group);
      
      if (seamScore > this.config.jointSensitivity) {
        const seam = {
          id: this.generateSeamId(),
          joints: group.map(j => j.id),
          score: seamScore,
          type: this.identifySeamType(group),
          vulnerability: seamScore,
          location: this.getSeamLocation(group),
          timestamp: Date.now()
        };
        
        seams.push(seam);
        this.vulnerabilityMap.set(seam.id, seam);
      }
    }
    
    return seams;
  }
  
  /**
   * Create joint visualization
   */
  createJointVisualization(joints, connections) {
    const visualization = {
      nodes: [],
      edges: [],
      clusters: [],
      metadata: {
        totalJoints: joints.length,
        totalConnections: connections.length,
        timestamp: Date.now()
      }
    };
    
    // Create nodes for joints
    for (const joint of joints) {
      visualization.nodes.push({
        id: joint.id,
        label: `${joint.symbol} ${joint.type}`,
        file: joint.file,
        line: joint.line,
        type: joint.type,
        leakPotential: joint.characteristics.leakPotential,
        size: joint.characteristics.leakPotential * 20
      });
    }
    
    // Create edges for connections
    for (const connection of connections) {
      visualization.edges.push({
        id: connection.id,
        source: connection.from,
        target: connection.to,
        weight: connection.strength,
        label: connection.type
      });
    }
    
    console.log('📊 Joint visualization created');
    console.log(`   Nodes: ${visualization.nodes.length}`);
    console.log(`   Edges: ${visualization.edges.length}`);
    
    return visualization;
  }
  
  /**
   * Find weak points in the blueprint
   */
  findWeakPoints() {
    const weakPoints = [];
    
    // Check all seams
    for (const [seamId, seam] of this.vulnerabilityMap) {
      if (seam.vulnerability > 0.8) {
        weakPoints.push({
          id: seamId,
          type: 'high-vulnerability-seam',
          vulnerability: seam.vulnerability,
          location: seam.location,
          recommendation: this.getSeamRecommendation(seam)
        });
      }
    }
    
    // Check joint clusters
    const clusters = this.detectJointClusters(Array.from(this.mappedJoints.values()));
    
    for (const cluster of clusters) {
      if (cluster.density > 0.7) {
        weakPoints.push({
          id: this.generateWeakPointId(),
          type: 'high-density-cluster',
          density: cluster.density,
          joints: cluster.joints.length,
          location: cluster.center,
          recommendation: 'High joint density indicates potential architectural weakness'
        });
      }
    }
    
    return weakPoints;
  }
  
  /**
   * Helper functions
   */
  
  generateJointId() {
    return `joint-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateSeamId() {
    return `seam-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateConnectionId() {
    return `conn-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateWeakPointId() {
    return `weak-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  findLineNumber(lines, match) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 0;
  }
  
  extractImports(content) {
    const imports = [];
    
    // CommonJS requires
    const requireMatches = content.match(/require\s*\(\s*['"](.+?)['"]\s*\)/g) || [];
    imports.push(...requireMatches.map(m => m.match(/['"](.+?)['"]/)[1]));
    
    // ES6 imports
    const importMatches = content.match(/import.*from\s+['"](.+?)['"]/g) || [];
    imports.push(...importMatches.map(m => m.match(/['"](.+?)['"]/)[1]));
    
    return imports;
  }
  
  calculateConnectionStrength(joint1, joint2) {
    // Base strength on leak potential similarity
    const potentialDiff = Math.abs(
      joint1.characteristics.leakPotential - 
      joint2.characteristics.leakPotential
    );
    
    // Inverse relationship - similar potential = stronger connection
    return 1 - potentialDiff;
  }
  
  groupJointsByProximity(joints) {
    const groups = [];
    const maxDistance = 50; // lines
    
    // Simple proximity grouping
    const used = new Set();
    
    for (const joint of joints) {
      if (used.has(joint.id)) continue;
      
      const group = [joint];
      used.add(joint.id);
      
      // Find nearby joints in same file
      for (const other of joints) {
        if (used.has(other.id)) continue;
        if (other.file !== joint.file) continue;
        
        const distance = Math.abs(other.line - joint.line);
        if (distance <= maxDistance) {
          group.push(other);
          used.add(other.id);
        }
      }
      
      if (group.length > 1) {
        groups.push(group);
      }
    }
    
    return groups;
  }
  
  calculateSeamScore(jointGroup) {
    // Higher score = more vulnerable seam
    let score = 0;
    
    // Factor 1: Number of joints
    score += Math.min(jointGroup.length / 10, 0.3);
    
    // Factor 2: Average leak potential
    const avgLeak = jointGroup.reduce((sum, j) => 
      sum + j.characteristics.leakPotential, 0) / jointGroup.length;
    score += avgLeak * 0.4;
    
    // Factor 3: Type diversity (more types = weaker seam)
    const types = new Set(jointGroup.map(j => j.type));
    score += (types.size / Object.keys(this.jointTypes).length) * 0.3;
    
    return Math.min(score, 1);
  }
  
  identifySeamType(jointGroup) {
    // Determine seam type based on joint composition
    const typeCounts = {};
    
    for (const joint of jointGroup) {
      typeCounts[joint.type] = (typeCounts[joint.type] || 0) + 1;
    }
    
    // Find dominant type
    let maxCount = 0;
    let dominantType = 'mixed';
    
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    }
    
    return `${dominantType}-seam`;
  }
  
  getSeamLocation(jointGroup) {
    // Get representative location for seam
    if (jointGroup.length === 0) return 'unknown';
    
    const firstJoint = jointGroup[0];
    const lastJoint = jointGroup[jointGroup.length - 1];
    
    if (firstJoint.file === lastJoint.file) {
      return `${firstJoint.file}:${firstJoint.line}-${lastJoint.line}`;
    }
    
    return `${path.dirname(firstJoint.file)}/*`;
  }
  
  detectJointClusters(joints) {
    const clusters = [];
    
    // Group by file
    const fileGroups = {};
    for (const joint of joints) {
      if (!fileGroups[joint.file]) {
        fileGroups[joint.file] = [];
      }
      fileGroups[joint.file].push(joint);
    }
    
    // Analyze each file group
    for (const [file, group] of Object.entries(fileGroups)) {
      if (group.length > 3) {
        const cluster = {
          id: this.generateClusterId(),
          file,
          joints: group,
          density: group.length / 100, // Assuming 100 lines average
          center: file,
          types: [...new Set(group.map(j => j.type))]
        };
        
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }
  
  generateClusterId() {
    return `cluster-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  getSeamRecommendation(seam) {
    if (seam.vulnerability > 0.9) {
      return 'Critical seam - consider architectural refactoring';
    } else if (seam.vulnerability > 0.8) {
      return 'High vulnerability - add additional error handling';
    } else if (seam.vulnerability > 0.7) {
      return 'Moderate vulnerability - monitor for light leaks';
    }
    return 'Low vulnerability - normal joint wear';
  }
  
  /**
   * Get mapper status
   */
  getStatus() {
    return {
      mappedJoints: this.mappedJoints.size,
      identifiedSeams: this.seamRegistry.size,
      connections: this.jointConnections.length,
      vulnerabilities: this.vulnerabilityMap.size,
      jointTypes: Object.keys(this.jointTypes),
      seamPatterns: Object.keys(this.seamPatterns)
    };
  }
}

module.exports = BlueprintJointMapper;

// Demo usage
if (require.main === module) {
  async function runMapperDemo() {
    console.log('🗺️ BLUEPRINT JOINT MAPPER DEMO');
    console.log('============================');
    
    const mapper = new BlueprintJointMapper({
      jointSensitivity: 0.6,
      maxJointDepth: 5
    });
    
    try {
      // Scan current directory
      console.log('\n📍 Scanning for blueprint joints...');
      const result = await mapper.scanForJoints('.');
      
      console.log('\n📊 Joint Analysis:');
      console.log(`   Total joints found: ${result.joints.length}`);
      console.log(`   Connections mapped: ${result.connections.length}`);
      console.log(`   Vulnerable seams: ${result.seams.length}`);
      
      // Show joint type distribution
      console.log('\n📈 Joint Type Distribution:');
      const typeCounts = {};
      for (const joint of result.joints) {
        typeCounts[joint.type] = (typeCounts[joint.type] || 0) + 1;
      }
      
      for (const [type, count] of Object.entries(typeCounts)) {
        const config = mapper.jointTypes[type];
        console.log(`   ${config.symbol} ${type}: ${count} joints`);
      }
      
      // Show hotspots
      if (result.analysis.hotspots.length > 0) {
        console.log('\n🔥 Hotspot Files:');
        for (const hotspot of result.analysis.hotspots.slice(0, 5)) {
          console.log(`   ${hotspot.file}`);
          console.log(`      Joints: ${hotspot.jointCount}`);
          console.log(`      Leak potential: ${hotspot.avgLeakPotential.toFixed(2)}`);
        }
      }
      
      // Show vulnerable seams
      if (result.seams.length > 0) {
        console.log('\n⚡ Most Vulnerable Seams:');
        const topSeams = result.seams
          .sort((a, b) => b.vulnerability - a.vulnerability)
          .slice(0, 5);
        
        for (const seam of topSeams) {
          console.log(`   ${seam.type} (vulnerability: ${seam.vulnerability.toFixed(2)})`);
          console.log(`      Location: ${seam.location}`);
          console.log(`      Joints involved: ${seam.joints.length}`);
        }
      }
      
      // Find weak points
      const weakPoints = mapper.findWeakPoints();
      if (weakPoints.length > 0) {
        console.log('\n❗ Weak Points Identified:');
        for (const weak of weakPoints.slice(0, 3)) {
          console.log(`   ${weak.type}: ${weak.location}`);
          console.log(`      ${weak.recommendation}`);
        }
      }
      
      // Create visualization data
      if (mapper.config.enableJointVisualization) {
        const viz = mapper.createJointVisualization(result.joints, result.connections);
        console.log('\n📊 Visualization data created');
        console.log(`   Ready for rendering with ${viz.nodes.length} nodes and ${viz.edges.length} edges`);
      }
      
      console.log('\n✅ Blueprint joint mapping complete!');
      
    } catch (error) {
      console.error('❌ Mapping failed:', error);
    }
  }
  
  runMapperDemo().catch(console.error);
}
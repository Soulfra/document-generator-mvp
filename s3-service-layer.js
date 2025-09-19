#!/usr/bin/env node

/**
 * S3 SERVICE LAYER - MinIO Integration for Unified Storage
 * 
 * Provides a unified interface for storing:
 * - Character operation results
 * - Reinforcement learning data
 * - Knowledge graphs
 * - System snapshots
 * - Learning patterns
 */

const { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadBucketCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class S3ServiceLayer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // MinIO configuration
    this.config = {
      endpoint: config.endpoint || 'http://localhost:9000',
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || 'minioadmin',
        secretAccessKey: config.secretAccessKey || 'minioadmin123'
      },
      forcePathStyle: true
    };
    
    // Initialize S3 client
    this.s3 = new S3Client(this.config);
    
    // Bucket structure
    this.buckets = {
      main: 'document-generator',
      rl: 'reinforcement-learning',
      characters: 'character-outputs',
      snapshots: 'system-snapshots',
      graphs: 'knowledge-graphs'
    };
    
    // Initialize buckets
    this.initializeBuckets();
  }
  
  async initializeBuckets() {
    console.log('🪣 Initializing S3 buckets...');
    
    for (const [name, bucketName] of Object.entries(this.buckets)) {
      try {
        // Check if bucket exists
        await this.s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log(`✅ Bucket ${bucketName} exists`);
      } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          // Create bucket
          try {
            await this.s3.send(new CreateBucketCommand({ Bucket: bucketName }));
            console.log(`🆕 Created bucket ${bucketName}`);
            
            // Enable versioning
            await this.enableVersioning(bucketName);
          } catch (createError) {
            console.error(`❌ Failed to create bucket ${bucketName}:`, createError.message);
          }
        } else {
          console.error(`❌ Error checking bucket ${bucketName}:`, error.message);
        }
      }
    }
    
    console.log('✅ S3 bucket initialization complete');
  }
  
  async enableVersioning(bucketName) {
    try {
      // Note: PutBucketVersioningCommand needs to be imported if versioning is required
      // For now, we'll skip versioning for MinIO compatibility
      console.log(`📚 Versioning not enabled for ${bucketName} (MinIO compatibility)`);
    } catch (error) {
      console.error(`Failed to enable versioning for ${bucketName}:`, error.message);
    }
  }
  
  // Store character operation results
  async storeCharacterOperation(character, operation, data, metadata = {}) {
    const key = `${character}/${operation}/${Date.now()}-${operation}.json`;
    const bucket = this.buckets.characters;
    
    const params = {
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        character,
        operation,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
    
    try {
      const result = await this.s3.send(new PutObjectCommand(params));
      
      this.emit('stored', {
        type: 'character-operation',
        character,
        operation,
        key,
        bucket,
        etag: result.ETag
      });
      
      console.log(`💾 Stored ${character} ${operation} → s3://${bucket}/${key}`);
      
      return {
        success: true,
        bucket,
        key,
        etag: result.ETag,
        versionId: result.VersionId
      };
    } catch (error) {
      console.error(`Failed to store character operation:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Store reinforcement learning data
  async storeRLData(type, data, metadata = {}) {
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];
    const key = `${type}/${date}/${timestamp}-${type}.json`;
    const bucket = this.buckets.rl;
    
    const params = {
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        type,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
    
    try {
      const result = await this.s3.send(new PutObjectCommand(params));
      
      this.emit('stored', {
        type: 'rl-data',
        dataType: type,
        key,
        bucket,
        etag: result.ETag
      });
      
      console.log(`🧠 Stored RL ${type} → s3://${bucket}/${key}`);
      
      return {
        success: true,
        bucket,
        key,
        etag: result.ETag,
        versionId: result.VersionId
      };
    } catch (error) {
      console.error(`Failed to store RL data:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Store knowledge graph
  async storeKnowledgeGraph(graph, format = 'json', metadata = {}) {
    const timestamp = Date.now();
    const extension = format === 'graphml' ? 'graphml' : 'json';
    const key = `graphs/${timestamp}-knowledge-graph.${extension}`;
    const bucket = this.buckets.graphs;
    
    let body;
    let contentType;
    
    if (format === 'graphml') {
      body = this.convertToGraphML(graph);
      contentType = 'application/xml';
    } else {
      body = JSON.stringify(graph, null, 2);
      contentType = 'application/json';
    }
    
    const params = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: {
        nodeCount: String(graph.nodes?.length || 0),
        edgeCount: String(graph.edges?.length || 0),
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
    
    try {
      const result = await this.s3.send(new PutObjectCommand(params));
      
      this.emit('stored', {
        type: 'knowledge-graph',
        format,
        key,
        bucket,
        etag: result.ETag
      });
      
      console.log(`📊 Stored knowledge graph → s3://${bucket}/${key}`);
      
      return {
        success: true,
        bucket,
        key,
        etag: result.ETag,
        versionId: result.VersionId
      };
    } catch (error) {
      console.error(`Failed to store knowledge graph:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Store system snapshot
  async storeSystemSnapshot(snapshot, metadata = {}) {
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];
    const key = `snapshots/${date}/${timestamp}-system-snapshot.json`;
    const bucket = this.buckets.snapshots;
    
    const params = {
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(snapshot, null, 2),
      ContentType: 'application/json',
      Metadata: {
        systemCount: String(snapshot.systems?.length || 0),
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
    
    try {
      const result = await this.s3.send(new PutObjectCommand(params));
      
      this.emit('stored', {
        type: 'system-snapshot',
        key,
        bucket,
        etag: result.ETag
      });
      
      console.log(`📸 Stored system snapshot → s3://${bucket}/${key}`);
      
      return {
        success: true,
        bucket,
        key,
        etag: result.ETag,
        versionId: result.VersionId
      };
    } catch (error) {
      console.error(`Failed to store system snapshot:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // List objects in a bucket
  async listObjects(bucketName, prefix = '', maxKeys = 100) {
    try {
      const params = {
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      };
      
      const result = await this.s3.send(new ListObjectsV2Command(params));
      
      return {
        success: true,
        objects: result.Contents || [],
        isTruncated: result.IsTruncated,
        continuationToken: result.NextContinuationToken
      };
    } catch (error) {
      console.error(`Failed to list objects:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get object from S3
  async getObject(bucket, key) {
    try {
      const params = {
        Bucket: bucket,
        Key: key
      };
      
      const result = await this.s3.send(new GetObjectCommand(params));
      
      // Convert stream to string
      const streamToString = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
          stream.on('error', reject);
        });
      
      const body = await streamToString(result.Body);
      
      return {
        success: true,
        body,
        contentType: result.ContentType,
        metadata: result.Metadata,
        etag: result.ETag,
        versionId: result.VersionId
      };
    } catch (error) {
      console.error(`Failed to get object:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Delete object
  async deleteObject(bucket, key) {
    try {
      const params = {
        Bucket: bucket,
        Key: key
      };
      
      const result = await this.s3.send(new DeleteObjectCommand(params));
      
      return {
        success: true,
        versionId: result.VersionId
      };
    } catch (error) {
      console.error(`Failed to delete object:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Generate presigned URL for direct access
  async getPresignedUrl(bucket, key, expiresIn = 3600) {
    try {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      const url = await getSignedUrl(this.s3, command, { expiresIn });
      
      return {
        success: true,
        url,
        expiresIn
      };
    } catch (error) {
      console.error(`Failed to generate presigned URL:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Upload file from disk
  async uploadFile(filePath, bucket, key, metadata = {}) {
    try {
      const fileContent = await fs.readFile(filePath);
      const contentType = this.getContentType(filePath);
      
      const params = {
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        Metadata: {
          originalPath: filePath,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };
      
      const result = await this.s3.putObject(params).promise();
      
      console.log(`📤 Uploaded ${filePath} → s3://${bucket}/${key}`);
      
      return {
        success: true,
        bucket,
        key,
        etag: result.ETag,
        versionId: result.VersionId
      };
    } catch (error) {
      console.error(`Failed to upload file:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Helper to determine content type
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }
  
  // Convert graph to GraphML format
  convertToGraphML(graph) {
    let graphml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    graphml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n';
    graphml += '  <graph id="G" edgedefault="directed">\n';
    
    // Add nodes
    if (graph.nodes) {
      graph.nodes.forEach(node => {
        graphml += `    <node id="${node.id}">\n`;
        Object.entries(node).forEach(([key, value]) => {
          if (key !== 'id') {
            graphml += `      <data key="${key}">${value}</data>\n`;
          }
        });
        graphml += '    </node>\n';
      });
    }
    
    // Add edges
    if (graph.edges) {
      graph.edges.forEach((edge, index) => {
        graphml += `    <edge id="e${index}" source="${edge.source}" target="${edge.target}">\n`;
        if (edge.weight) {
          graphml += `      <data key="weight">${edge.weight}</data>\n`;
        }
        if (edge.type) {
          graphml += `      <data key="type">${edge.type}</data>\n`;
        }
        graphml += '    </edge>\n';
      });
    }
    
    graphml += '  </graph>\n';
    graphml += '</graphml>';
    
    return graphml;
  }
  
  // Get storage statistics
  async getStorageStats() {
    const stats = {};
    
    for (const [name, bucketName] of Object.entries(this.buckets)) {
      try {
        const result = await this.listObjects(bucketName, '', 1000);
        if (result.success) {
          const totalSize = result.objects.reduce((sum, obj) => sum + obj.Size, 0);
          stats[name] = {
            bucket: bucketName,
            objectCount: result.objects.length,
            totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
          };
        }
      } catch (error) {
        stats[name] = { error: error.message };
      }
    }
    
    return stats;
  }
}

// Export
module.exports = S3ServiceLayer;

// Run if called directly
if (require.main === module) {
  const s3Service = new S3ServiceLayer();
  
  // Test storage operations
  async function testOperations() {
    console.log('\n🧪 Testing S3 Service Layer...\n');
    
    // Test character operation storage
    const charResult = await s3Service.storeCharacterOperation(
      'ralph',
      'bash_through',
      { 
        action: 'removed_obstacle',
        target: 'api_bottleneck',
        success: true,
        timestamp: Date.now()
      }
    );
    console.log('Character operation result:', charResult);
    
    // Test RL data storage
    const rlResult = await s3Service.storeRLData(
      'performance_metrics',
      {
        system: 'ai-factory',
        score: 0.95,
        responseTime: 234,
        timestamp: Date.now()
      }
    );
    console.log('RL data result:', rlResult);
    
    // Test knowledge graph storage
    const graphResult = await s3Service.storeKnowledgeGraph({
      nodes: [
        { id: 'system1', type: 'system', label: 'AI Factory' },
        { id: 'pattern1', type: 'pattern', label: 'High Performance' }
      ],
      edges: [
        { source: 'system1', target: 'pattern1', weight: 0.9 }
      ]
    });
    console.log('Knowledge graph result:', graphResult);
    
    // Get storage stats
    const stats = await s3Service.getStorageStats();
    console.log('\n📊 Storage Statistics:', stats);
  }
  
  // Run tests
  testOperations().catch(console.error);
}
/**
 * Documentation Index System
 * This prevents duplicates and ensures we're using existing files properly
 * Integrates with MCP for proper context management
 */

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative, extname } from 'path';
import { createHash } from 'crypto';
import glob from 'glob';

export interface DocumentIndex {
  files: Map<string, DocumentInfo>;
  duplicates: Map<string, string[]>;
  missing: Set<string>;
  references: Map<string, Set<string>>;
  lastUpdated: Date;
}

export interface DocumentInfo {
  path: string;
  title: string;
  hash: string;
  size: number;
  modified: Date;
  type: 'doc' | 'api' | 'guide' | 'spec' | 'config';
  status: 'complete' | 'partial' | 'stub' | 'missing';
  references: string[];
  referencedBy: string[];
  duplicateOf?: string;
}

export class DocumentationIndexer {
  private index: DocumentIndex;
  private projectRoot: string;
  private mcpConfig: any;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.index = {
      files: new Map(),
      duplicates: new Map(),
      missing: new Set(),
      references: new Map(),
      lastUpdated: new Date(),
    };
    
    // Load MCP config
    const mcpPath = join(projectRoot, '.mcp/config.json');
    if (existsSync(mcpPath)) {
      this.mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf8'));
    }
  }

  /**
   * Build complete documentation index
   */
  async buildIndex(): Promise<DocumentIndex> {
    console.log('🔍 Building documentation index...');
    
    // Find all markdown files
    const patterns = [
      '**/*.md',
      'docs/**/*.md',
      'src/**/*.md',
      'templates/**/*.md',
    ];
    
    const files = new Set<string>();
    
    for (const pattern of patterns) {
      const matches = glob.sync(pattern, {
        cwd: this.projectRoot,
        ignore: this.mcpConfig?.context?.excludePatterns || ['node_modules/**', '.git/**'],
      });
      
      matches.forEach(file => files.add(file));
    }
    
    // Analyze each file
    for (const file of files) {
      const info = this.analyzeDocument(file);
      this.index.files.set(file, info);
    }
    
    // Find duplicates
    this.findDuplicates();
    
    // Find missing references
    this.findMissingReferences();
    
    // Build reference graph
    this.buildReferenceGraph();
    
    // Save index
    this.saveIndex();
    
    console.log(`✅ Indexed ${this.index.files.size} documents`);
    console.log(`⚠️  Found ${this.index.duplicates.size} potential duplicates`);
    console.log(`❌ Found ${this.index.missing.size} missing documents`);
    
    return this.index;
  }

  /**
   * Check if a document exists before creating
   */
  checkBeforeCreate(path: string): { exists: boolean; similar: string[] } {
    const normalizedPath = this.normalizePath(path);
    
    // Direct match
    if (this.index.files.has(normalizedPath)) {
      return { exists: true, similar: [normalizedPath] };
    }
    
    // Check for similar names
    const fileName = path.split('/').pop()?.toLowerCase() || '';
    const similar: string[] = [];
    
    for (const [filePath, info] of this.index.files) {
      const existingName = filePath.split('/').pop()?.toLowerCase() || '';
      
      // Similar filename
      if (existingName.includes(fileName) || fileName.includes(existingName)) {
        similar.push(filePath);
      }
      
      // Same title
      if (info.title.toLowerCase() === fileName.replace(/\.md$/, '').replace(/-/g, ' ')) {
        similar.push(filePath);
      }
    }
    
    return { exists: false, similar };
  }

  /**
   * Get document by path or title
   */
  getDocument(query: string): DocumentInfo | null {
    // Try direct path
    if (this.index.files.has(query)) {
      return this.index.files.get(query)!;
    }
    
    // Try normalized path
    const normalized = this.normalizePath(query);
    if (this.index.files.has(normalized)) {
      return this.index.files.get(normalized)!;
    }
    
    // Try by title
    for (const [_, info] of this.index.files) {
      if (info.title.toLowerCase() === query.toLowerCase()) {
        return info;
      }
    }
    
    return null;
  }

  /**
   * Analyze a single document
   */
  private analyzeDocument(filePath: string): DocumentInfo {
    const fullPath = join(this.projectRoot, filePath);
    const content = readFileSync(fullPath, 'utf8');
    const stats = statSync(fullPath);
    
    // Extract title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : filePath.split('/').pop()!.replace(/\.md$/, '');
    
    // Calculate hash
    const hash = createHash('md5').update(content).digest('hex');
    
    // Detect type
    const type = this.detectDocumentType(filePath, content);
    
    // Check status
    const status = this.checkDocumentStatus(content);
    
    // Extract references
    const references = this.extractReferences(content);
    
    return {
      path: filePath,
      title,
      hash,
      size: stats.size,
      modified: stats.mtime,
      type,
      status,
      references,
      referencedBy: [],
    };
  }

  /**
   * Detect document type based on path and content
   */
  private detectDocumentType(path: string, content: string): DocumentInfo['type'] {
    if (path.includes('/api/') || content.includes('## API')) return 'api';
    if (path.includes('/guides/') || path.includes('/tutorials/')) return 'guide';
    if (path.includes('/spec') || content.includes('## Specification')) return 'spec';
    if (path.endsWith('config.json') || path.includes('/config/')) return 'config';
    return 'doc';
  }

  /**
   * Check if document is complete, partial, or stub
   */
  private checkDocumentStatus(content: string): DocumentInfo['status'] {
    const lines = content.split('\n');
    const contentLines = lines.filter(line => line.trim() && !line.startsWith('#')).length;
    
    // Check for stub indicators
    if (content.includes('TODO') || content.includes('FIXME') || content.includes('TBD')) {
      return 'stub';
    }
    
    // Check for missing sections
    if (content.includes('Coming soon') || content.includes('Under construction')) {
      return 'partial';
    }
    
    // Check content length
    if (contentLines < 10) {
      return 'stub';
    }
    
    if (contentLines < 50) {
      return 'partial';
    }
    
    return 'complete';
  }

  /**
   * Extract references to other documents
   */
  private extractReferences(content: string): string[] {
    const references: string[] = [];
    
    // Markdown links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const link = match[2];
      if (link.endsWith('.md') && !link.startsWith('http')) {
        references.push(link);
      }
    }
    
    // Related sections
    const relatedRegex = /##\s*(?:Related|See Also)([\s\S]*?)(?=##|$)/i;
    const relatedMatch = content.match(relatedRegex);
    if (relatedMatch) {
      const relatedLinks = relatedMatch[1].match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (relatedLinks) {
        relatedLinks.forEach(link => {
          const href = link.match(/\(([^)]+)\)/)?.[1];
          if (href && href.endsWith('.md')) {
            references.push(href);
          }
        });
      }
    }
    
    return [...new Set(references)];
  }

  /**
   * Find duplicate documents based on content hash
   */
  private findDuplicates() {
    const hashMap = new Map<string, string[]>();
    
    for (const [path, info] of this.index.files) {
      if (!hashMap.has(info.hash)) {
        hashMap.set(info.hash, []);
      }
      hashMap.get(info.hash)!.push(path);
    }
    
    // Mark duplicates
    for (const [hash, paths] of hashMap) {
      if (paths.length > 1) {
        this.index.duplicates.set(hash, paths);
        
        // Mark all but first as duplicate
        const primary = paths[0];
        for (let i = 1; i < paths.length; i++) {
          const info = this.index.files.get(paths[i])!;
          info.duplicateOf = primary;
        }
      }
    }
  }

  /**
   * Find missing documents referenced but not existing
   */
  private findMissingReferences() {
    for (const [path, info] of this.index.files) {
      for (const ref of info.references) {
        const resolvedRef = this.resolveReference(ref, path);
        
        if (!this.documentExists(resolvedRef)) {
          this.index.missing.add(resolvedRef);
        }
      }
    }
  }

  /**
   * Build bidirectional reference graph
   */
  private buildReferenceGraph() {
    for (const [path, info] of this.index.files) {
      if (!this.index.references.has(path)) {
        this.index.references.set(path, new Set());
      }
      
      for (const ref of info.references) {
        const resolvedRef = this.resolveReference(ref, path);
        
        this.index.references.get(path)!.add(resolvedRef);
        
        // Update referencedBy
        const refInfo = this.index.files.get(resolvedRef);
        if (refInfo) {
          refInfo.referencedBy.push(path);
        }
      }
    }
  }

  /**
   * Resolve relative reference to absolute path
   */
  private resolveReference(ref: string, fromPath: string): string {
    if (ref.startsWith('/')) {
      return ref.slice(1);
    }
    
    const dir = fromPath.substring(0, fromPath.lastIndexOf('/'));
    return join(dir, ref).replace(/\\/g, '/');
  }

  /**
   * Check if document exists
   */
  private documentExists(path: string): boolean {
    return existsSync(join(this.projectRoot, path));
  }

  /**
   * Normalize path for comparison
   */
  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').toLowerCase();
  }

  /**
   * Save index to file
   */
  private saveIndex() {
    const indexPath = join(this.projectRoot, 'docs/search-index.json');
    
    const serializable = {
      lastUpdated: this.index.lastUpdated,
      fileCount: this.index.files.size,
      duplicateCount: this.index.duplicates.size,
      missingCount: this.index.missing.size,
      files: Array.from(this.index.files.entries()).map(([path, info]) => ({
        path,
        ...info,
      })),
      duplicates: Array.from(this.index.duplicates.entries()),
      missing: Array.from(this.index.missing),
    };
    
    writeFileSync(indexPath, JSON.stringify(serializable, null, 2));
  }

  /**
   * Generate missing document report
   */
  generateMissingReport(): string {
    let report = '# Missing Documentation Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Group by directory
    const byDir = new Map<string, string[]>();
    
    for (const missing of this.index.missing) {
      const dir = missing.substring(0, missing.lastIndexOf('/')) || 'root';
      if (!byDir.has(dir)) {
        byDir.set(dir, []);
      }
      byDir.get(dir)!.push(missing);
    }
    
    // Generate report
    for (const [dir, files] of byDir) {
      report += `## ${dir}\n`;
      for (const file of files) {
        report += `- [ ] ${file}\n`;
      }
      report += '\n';
    }
    
    return report;
  }

  /**
   * Generate duplicate report
   */
  generateDuplicateReport(): string {
    let report = '# Duplicate Documentation Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    for (const [hash, files] of this.index.duplicates) {
      report += `## Duplicate Set (hash: ${hash.substring(0, 8)})\n`;
      
      const primary = files[0];
      const info = this.index.files.get(primary)!;
      
      report += `**Title**: ${info.title}\n`;
      report += `**Size**: ${info.size} bytes\n\n`;
      report += 'Files:\n';
      
      for (const file of files) {
        report += `- ${file}\n`;
      }
      report += '\n';
    }
    
    return report;
  }
}

// Export for CLI usage
export async function indexDocumentation(projectRoot: string = process.cwd()) {
  const indexer = new DocumentationIndexer(projectRoot);
  const index = await indexer.buildIndex();
  
  // Generate reports
  const missingReport = indexer.generateMissingReport();
  const duplicateReport = indexer.generateDuplicateReport();
  
  // Save reports
  writeFileSync(join(projectRoot, 'docs/missing-docs.md'), missingReport);
  writeFileSync(join(projectRoot, 'docs/duplicate-docs.md'), duplicateReport);
  
  console.log('\n📊 Documentation Index Summary:');
  console.log(`  Total files: ${index.files.size}`);
  console.log(`  Complete: ${Array.from(index.files.values()).filter(f => f.status === 'complete').length}`);
  console.log(`  Partial: ${Array.from(index.files.values()).filter(f => f.status === 'partial').length}`);
  console.log(`  Stubs: ${Array.from(index.files.values()).filter(f => f.status === 'stub').length}`);
  console.log(`  Duplicates: ${index.duplicates.size}`);
  console.log(`  Missing: ${index.missing.size}`);
  
  return index;
}
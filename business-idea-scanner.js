#!/usr/bin/env node

/**
 * BUSINESS IDEA SCANNER
 * Scans all business idea files and creates actionable inventory
 * Uses existing document parser and AI services
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

console.log(`
🚀💡 BUSINESS IDEA SCANNER 💡🚀
Scanning all your business ideas and creating actionable inventory...
`);

class BusinessIdeaScanner {
  constructor() {
    this.ideas = [];
    this.scanPaths = [
      '/Users/matthewmauer/Desktop/Document-Generator',
      '/Users/matthewmauer/Desktop/Document-Generator/FinishThisIdea',
      '/Users/matthewmauer/Desktop/Document-Generator/FinishThisIdea-Complete',
      '/Users/matthewmauer/Desktop/Document-Generator/FinishThisIdea-archive'
    ];
    
    this.businessKeywords = [
      'business', 'startup', 'idea', 'platform', 'marketplace', 'economy',
      'tycoon', 'game', 'arena', 'empire', 'revenue', 'monetization',
      'subscription', 'saas', 'api', 'service', 'app', 'website'
    ];
    
    this.completionKeywords = {
      high: ['production', 'deployed', 'live', 'working', 'complete', 'finished'],
      medium: ['prototype', 'mvp', 'demo', 'beta', 'testing', 'development'],
      low: ['concept', 'idea', 'draft', 'research', 'planning', 'proposal']
    };
  }

  async scan() {
    console.log('📂 Scanning directories for business ideas...');
    
    for (const scanPath of this.scanPaths) {
      try {
        await this.scanDirectory(scanPath);
      } catch (error) {
        console.log(`⚠️  Cannot scan ${scanPath}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Found ${this.ideas.length} business ideas!`);
    
    // Analyze each idea
    console.log('\n🔍 Analyzing ideas for potential and completion...');
    await this.analyzeIdeas();
    
    // Create priority matrix
    console.log('\n📊 Creating priority matrix...');
    this.createPriorityMatrix();
    
    // Generate report
    await this.generateReport();
    
    return this.ideas;
  }

  async scanDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.includes('node_modules')) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile() && this.isBusinessFile(entry.name)) {
          await this.analyzeFile(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  isBusinessFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (!['.js', '.html', '.md', '.json', '.txt'].includes(ext)) return false;
    
    const nameToCheck = filename.toLowerCase();
    return this.businessKeywords.some(keyword => nameToCheck.includes(keyword));
  }

  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      
      // Skip empty or very small files
      if (content.length < 100) return;
      
      const idea = {
        id: crypto.createHash('md5').update(filePath).digest('hex').substring(0, 8),
        filePath,
        filename: path.basename(filePath),
        directory: path.dirname(filePath),
        size: stats.size,
        modified: stats.mtime,
        content: content.substring(0, 2000), // First 2KB for analysis
        
        // Analysis results (will be filled later)
        title: '',
        description: '',
        category: '',
        marketPotential: 0,
        technicalComplexity: 0,
        completionStatus: 0,
        revenueModel: '',
        targetAudience: '',
        keyFeatures: [],
        missingComponents: [],
        priority: 0
      };
      
      this.ideas.push(idea);
      
    } catch (error) {
      // Skip files we can't read
    }
  }

  async analyzeIdeas() {
    for (let i = 0; i < this.ideas.length; i++) {
      const idea = this.ideas[i];
      console.log(`Analyzing ${i + 1}/${this.ideas.length}: ${idea.filename}`);
      
      // Extract title from content
      idea.title = this.extractTitle(idea.content, idea.filename);
      
      // Analyze completion status
      idea.completionStatus = this.analyzeCompletion(idea.content);
      
      // Analyze market potential (simple heuristic for now)
      idea.marketPotential = this.analyzeMarketPotential(idea.content);
      
      // Analyze technical complexity
      idea.technicalComplexity = this.analyzeTechnicalComplexity(idea.content);
      
      // Extract category
      idea.category = this.extractCategory(idea.content, idea.filename);
      
      // Extract revenue model
      idea.revenueModel = this.extractRevenueModel(idea.content);
      
      // Extract key features
      idea.keyFeatures = this.extractKeyFeatures(idea.content);
      
      // Identify missing components
      idea.missingComponents = this.identifyMissingComponents(idea.content);
    }
  }

  extractTitle(content, filename) {
    // Look for title in content
    const titlePatterns = [
      /^#\s+(.+)/m,
      /title[:\s]+(.+)/im,
      /^\*\*(.+)\*\*/m,
      /\/\*\*\s*\n\s\*\s(.+)/m
    ];
    
    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    // Fall back to filename
    return filename.replace(/\.(js|html|md|json|txt)$/, '').replace(/[-_]/g, ' ');
  }

  analyzeCompletion(content) {
    let score = 0;
    
    // Check for completion indicators
    if (content.includes('TODO') || content.includes('FIXME')) score -= 10;
    if (content.includes('production') || content.includes('deployed')) score += 30;
    if (content.includes('prototype') || content.includes('mvp')) score += 20;
    if (content.includes('function ') || content.includes('class ')) score += 15;
    if (content.includes('app.listen') || content.includes('server')) score += 10;
    if (content.includes('<!DOCTYPE html>')) score += 10;
    if (content.includes('package.json') || content.includes('dependencies')) score += 5;
    
    return Math.min(Math.max(score, 0), 100);
  }

  analyzeMarketPotential(content) {
    let score = 0;
    
    // Revenue indicators
    if (content.includes('revenue') || content.includes('monetiz')) score += 20;
    if (content.includes('subscription') || content.includes('saas')) score += 15;
    if (content.includes('marketplace') || content.includes('platform')) score += 15;
    if (content.includes('billion') || content.includes('million')) score += 10;
    if (content.includes('user') || content.includes('customer')) score += 10;
    if (content.includes('payment') || content.includes('stripe')) score += 10;
    if (content.includes('api') || content.includes('service')) score += 5;
    
    return Math.min(score, 100);
  }

  analyzeTechnicalComplexity(content) {
    let score = 0;
    
    // Technical indicators
    if (content.includes('blockchain') || content.includes('crypto')) score += 30;
    if (content.includes('ai') || content.includes('machine learning')) score += 25;
    if (content.includes('database') || content.includes('sql')) score += 15;
    if (content.includes('api') || content.includes('rest')) score += 10;
    if (content.includes('websocket') || content.includes('realtime')) score += 10;
    if (content.includes('docker') || content.includes('kubernetes')) score += 10;
    if (content.includes('react') || content.includes('vue')) score += 5;
    
    return Math.min(score, 100);
  }

  extractCategory(content, filename) {
    const categories = {
      'Gaming': ['game', 'arena', 'battle', 'tycoon', 'rpg'],
      'Marketplace': ['marketplace', 'platform', 'exchange', 'trading'],
      'SaaS': ['saas', 'service', 'api', 'tool', 'software'],
      'AI/Tech': ['ai', 'intelligence', 'automation', 'agent'],
      'Finance': ['economy', 'payment', 'crypto', 'finance', 'money'],
      'Social': ['social', 'community', 'forum', 'chat'],
      'Productivity': ['generator', 'builder', 'creator', 'workflow']
    };
    
    const textToCheck = (content + ' ' + filename).toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => textToCheck.includes(keyword))) {
        return category;
      }
    }
    
    return 'Other';
  }

  extractRevenueModel(content) {
    const models = {
      'Subscription': ['subscription', 'saas', 'monthly', 'yearly'],
      'Marketplace': ['commission', 'percentage', 'transaction fee'],
      'Premium': ['premium', 'pro', 'upgrade', 'tier'],
      'Gaming': ['in-app purchase', 'virtual goods', 'tokens'],
      'Advertising': ['ads', 'advertising', 'sponsored'],
      'One-time': ['purchase', 'buy', 'payment', 'price']
    };
    
    const textToCheck = content.toLowerCase();
    
    for (const [model, keywords] of Object.entries(models)) {
      if (keywords.some(keyword => textToCheck.includes(keyword))) {
        return model;
      }
    }
    
    return 'Unknown';
  }

  extractKeyFeatures(content) {
    const features = [];
    const featurePatterns = [
      /[-*]\s+(.+)/g,  // Bullet points
      /\d+\.\s+(.+)/g, // Numbered lists
      /feature[:\s]+(.+)/gim
    ];
    
    for (const pattern of featurePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null && features.length < 5) {
        const feature = match[1].trim();
        if (feature.length > 10 && feature.length < 100) {
          features.push(feature);
        }
      }
    }
    
    return features.slice(0, 5);
  }

  identifyMissingComponents(content) {
    const missing = [];
    
    if (!content.includes('database') && !content.includes('storage')) {
      missing.push('Database/Storage');
    }
    if (!content.includes('auth') && !content.includes('login')) {
      missing.push('Authentication');
    }
    if (!content.includes('payment') && !content.includes('stripe')) {
      missing.push('Payment System');
    }
    if (!content.includes('api') && !content.includes('endpoint')) {
      missing.push('API Layer');
    }
    if (!content.includes('frontend') && !content.includes('ui')) {
      missing.push('Frontend/UI');
    }
    if (!content.includes('deploy') && !content.includes('production')) {
      missing.push('Deployment');
    }
    
    return missing;
  }

  createPriorityMatrix() {
    // Calculate priority score for each idea
    for (const idea of this.ideas) {
      // Priority = (Market Potential * 0.4) + (Completion Status * 0.3) + (Low Complexity Bonus * 0.3)
      const complexityBonus = Math.max(0, 100 - idea.technicalComplexity);
      idea.priority = Math.round(
        (idea.marketPotential * 0.4) + 
        (idea.completionStatus * 0.3) + 
        (complexityBonus * 0.3)
      );
    }
    
    // Sort by priority
    this.ideas.sort((a, b) => b.priority - a.priority);
  }

  async generateReport() {
    const report = {
      summary: {
        totalIdeas: this.ideas.length,
        categories: {},
        avgCompletion: 0,
        topPriority: this.ideas.slice(0, 5)
      },
      ideas: this.ideas
    };
    
    // Calculate category distribution
    for (const idea of this.ideas) {
      report.summary.categories[idea.category] = 
        (report.summary.categories[idea.category] || 0) + 1;
    }
    
    // Calculate average completion
    report.summary.avgCompletion = Math.round(
      this.ideas.reduce((sum, idea) => sum + idea.completionStatus, 0) / this.ideas.length
    );
    
    // Save report
    await fs.writeFile(
      '/Users/matthewmauer/Desktop/Document-Generator/business-ideas-inventory.json',
      JSON.stringify(report, null, 2)
    );
    
    // Generate readable summary
    let summary = `
🚀 BUSINESS IDEAS INVENTORY REPORT 🚀
Generated: ${new Date().toISOString()}

📊 SUMMARY:
• Total Ideas Found: ${report.summary.totalIdeas}
• Average Completion: ${report.summary.avgCompletion}%
• Categories: ${Object.entries(report.summary.categories).map(([cat, count]) => `${cat} (${count})`).join(', ')}

🎯 TOP 5 PRIORITY IDEAS:
`;

    for (let i = 0; i < Math.min(5, this.ideas.length); i++) {
      const idea = this.ideas[i];
      summary += `
${i + 1}. ${idea.title}
   Category: ${idea.category}
   Priority Score: ${idea.priority}/100
   Completion: ${idea.completionStatus}%
   Market Potential: ${idea.marketPotential}%
   Technical Complexity: ${idea.technicalComplexity}%
   Revenue Model: ${idea.revenueModel}
   Missing: ${idea.missingComponents.join(', ') || 'None identified'}
   File: ${idea.filename}
`;
    }

    await fs.writeFile(
      '/Users/matthewmauer/Desktop/Document-Generator/business-ideas-summary.txt',
      summary
    );
    
    console.log('\n📄 Reports generated:');
    console.log('• business-ideas-inventory.json (detailed data)');
    console.log('• business-ideas-summary.txt (readable summary)');
    console.log(summary);
  }
}

// Run the scanner
async function main() {
  try {
    const scanner = new BusinessIdeaScanner();
    await scanner.scan();
    console.log('\n✅ Business idea inventory complete!');
    console.log('\n🎯 Next steps:');
    console.log('1. Review the top 5 priority ideas in business-ideas-summary.txt');
    console.log('2. Run: node mvp-generator.js to create working prototypes');
    console.log('3. Deploy and test your top ideas');
  } catch (error) {
    console.error('❌ Error scanning business ideas:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BusinessIdeaScanner };
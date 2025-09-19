#!/usr/bin/env node

/**
 * 📚 COOKBOOK RECIPE ORGANIZER
 * 
 * Organizes search results and game content into cookbook/recipe format
 * Integrates with shadow layer search and character specializations
 * 
 * Features:
 * - Recipe templates for different content types
 * - Game integration (ships, liquidity pools, judges, partners)
 * - Automatic categorization by character expertise
 * - Trending/controversial recipe highlighting
 */

const express = require('express');
const sqlite3 = require('better-sqlite3');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

// Initialize recipe database
const recipeDb = sqlite3('/tmp/cookbook_recipes.db');

// Recipe categories mapped to character specializations
const recipeCategories = {
  'infrastructure-recipes': {
    character: 'cal',
    emoji: '🏗️',
    description: 'System architecture, databases, and infrastructure patterns',
    templates: ['api-design', 'database-schema', 'deployment-config', 'monitoring-setup']
  },
  'design-recipes': {
    character: 'arty',
    emoji: '🎨',
    description: 'UI/UX patterns, visual design, and user experience',
    templates: ['component-design', 'user-flow', 'visual-theme', 'interaction-pattern']
  },
  'backend-recipes': {
    character: 'ralph',
    emoji: '⚙️',
    description: 'Backend services, APIs, and system integration',
    templates: ['service-implementation', 'api-endpoint', 'data-processing', 'integration-pattern']
  },
  'security-recipes': {
    character: 'vera',
    emoji: '🔐',
    description: 'Security patterns, authentication, and blockchain',
    templates: ['auth-flow', 'encryption-method', 'security-audit', 'blockchain-contract']
  },
  'ai-recipes': {
    character: 'paulo',
    emoji: '🤖',
    description: 'AI/ML implementations, data science, and automation',
    templates: ['model-training', 'data-pipeline', 'ai-integration', 'automation-script']
  },
  'performance-recipes': {
    character: 'nash',
    emoji: '⚡',
    description: 'Performance optimization, scaling, and system tuning',
    templates: ['optimization-pattern', 'caching-strategy', 'load-balancing', 'monitoring-metric']
  },
  'game-recipes': {
    character: 'cal',
    emoji: '🎮',
    description: 'Game mechanics, ships, liquidity pools, and competitive elements',
    templates: ['game-mechanic', 'economy-system', 'competition-format', 'reward-structure']
  }
};

// Game integration elements
const gameElements = {
  ships: {
    emoji: '🚢',
    description: 'Vessels for knowledge exploration and content delivery',
    types: ['explorer', 'cargo', 'warship', 'merchant', 'research']
  },
  liquidityPools: {
    emoji: '💧',
    description: 'Economic systems for value exchange and resource pooling',
    types: ['knowledge-pool', 'attention-pool', 'creativity-pool', 'computational-pool']
  },
  judges: {
    emoji: '⚖️',
    description: 'Evaluation systems for content quality and competition',
    types: ['quality-judge', 'innovation-judge', 'popularity-judge', 'technical-judge']
  },
  partners: {
    emoji: '🤝',
    description: 'Collaborative entities and integration points',
    types: ['api-partner', 'data-partner', 'service-partner', 'community-partner']
  }
};

// Initialize recipe database
function initializeRecipeDb() {
  try {
    recipeDb.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        character_chef TEXT NOT NULL,
        recipe_type TEXT NOT NULL,
        difficulty TEXT DEFAULT 'medium',
        ingredients TEXT, -- JSON array
        instructions TEXT, -- JSON array
        source_files TEXT, -- JSON array of file paths
        game_elements TEXT, -- JSON object
        metadata TEXT, -- JSON object
        trending_score REAL DEFAULT 0,
        controversy_score REAL DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_category ON recipes(category);
      CREATE INDEX IF NOT EXISTS idx_character ON recipes(character_chef);
      CREATE INDEX IF NOT EXISTS idx_trending ON recipes(trending_score DESC);
      CREATE INDEX IF NOT EXISTS idx_controversy ON recipes(controversy_score DESC);
    `);

    recipeDb.exec(`
      CREATE TABLE IF NOT EXISTS recipe_ratings (
        rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER,
        user_id TEXT,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        review TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
      );
    `);

    recipeDb.exec(`
      CREATE TABLE IF NOT EXISTS cookbook_collections (
        collection_id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_name TEXT NOT NULL,
        description TEXT,
        character_curator TEXT,
        recipe_ids TEXT, -- JSON array
        is_featured BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Recipe database initialized");
  } catch (error) {
    console.error("❌ Recipe database initialization failed:", error);
  }
}

// Generate recipe from content
function generateRecipe(content, filePath, characterAffinity) {
  const fileName = path.basename(filePath);
  const fileExt = path.extname(filePath);
  const category = getRecipeCategory(content, characterAffinity);
  
  // Detect recipe type based on content patterns
  const recipeType = detectRecipeType(content, fileName);
  
  // Extract ingredients (dependencies, requirements, tools)
  const ingredients = extractIngredients(content, recipeType);
  
  // Extract instructions (steps, procedures, workflows)
  const instructions = extractInstructions(content, recipeType);
  
  // Add game elements
  const gameElements = addGameElements(content, recipeType);
  
  // Calculate scores
  const trendingScore = calculateTrendingScore(content);
  const controversyScore = calculateControversyScore(content);
  
  return {
    title: generateRecipeTitle(fileName, recipeType),
    category,
    character_chef: characterAffinity,
    recipe_type: recipeType,
    difficulty: calculateDifficulty(content),
    ingredients: JSON.stringify(ingredients),
    instructions: JSON.stringify(instructions),
    source_files: JSON.stringify([filePath]),
    game_elements: JSON.stringify(gameElements),
    metadata: JSON.stringify({
      file_extension: fileExt,
      file_size: content.length,
      estimated_time: estimateImplementationTime(content, recipeType),
      skill_level: assessRequiredSkills(content),
      tags: extractTags(content)
    }),
    trending_score: trendingScore,
    controversy_score: controversyScore
  };
}

// Detect recipe type from content
function detectRecipeType(content, fileName) {
  const lowerContent = content.toLowerCase();
  const lowerFileName = fileName.toLowerCase();
  
  // Check for specific patterns
  if (lowerContent.includes('api') || lowerContent.includes('endpoint')) return 'api-endpoint';
  if (lowerContent.includes('database') || lowerContent.includes('schema')) return 'database-schema';
  if (lowerContent.includes('component') || lowerContent.includes('ui')) return 'component-design';
  if (lowerContent.includes('auth') || lowerContent.includes('security')) return 'auth-flow';
  if (lowerContent.includes('ai') || lowerContent.includes('model')) return 'ai-integration';
  if (lowerContent.includes('performance') || lowerContent.includes('optimization')) return 'optimization-pattern';
  if (lowerContent.includes('game') || lowerContent.includes('ship')) return 'game-mechanic';
  if (lowerFileName.includes('docker') || lowerContent.includes('deploy')) return 'deployment-config';
  if (lowerContent.includes('test') || lowerContent.includes('spec')) return 'testing-pattern';
  
  return 'general-recipe';
}

// Extract ingredients from content
function extractIngredients(content, recipeType) {
  const ingredients = [];
  
  // Common patterns for dependencies
  const patterns = {
    npm: /require\(['"]([^'"]+)['"]\)/g,
    import: /import.*from ['"]([^'"]+)['"]/g,
    pip: /import\s+(\w+)/g,
    docker: /FROM\s+([^\s]+)/g,
    env: /process\.env\.(\w+)/g
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      ingredients.push({
        type,
        name: match[1],
        required: true
      });
    }
  }
  
  // Recipe-specific ingredients
  switch (recipeType) {
    case 'api-endpoint':
      ingredients.push(
        { type: 'framework', name: 'Express.js', required: true },
        { type: 'database', name: 'PostgreSQL/SQLite', required: true },
        { type: 'validation', name: 'Input validation', required: true }
      );
      break;
    case 'database-schema':
      ingredients.push(
        { type: 'database', name: 'Database engine', required: true },
        { type: 'migrations', name: 'Migration system', required: true },
        { type: 'backup', name: 'Backup strategy', required: true }
      );
      break;
    case 'game-mechanic':
      ingredients.push(
        { type: 'ship', name: gameElements.ships.types[0], required: false },
        { type: 'pool', name: gameElements.liquidityPools.types[0], required: false },
        { type: 'judge', name: gameElements.judges.types[0], required: false }
      );
      break;
  }
  
  return ingredients;
}

// Extract instructions from content
function extractInstructions(content, recipeType) {
  const instructions = [];
  
  // Look for numbered steps or bullet points
  const stepPatterns = [
    /^\d+\.\s+(.+)$/gm,
    /^[-*]\s+(.+)$/gm,
    /^#{1,3}\s+(.+)$/gm
  ];
  
  for (const pattern of stepPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      instructions.push({
        step: instructions.length + 1,
        action: match[1].trim(),
        type: 'implementation'
      });
    }
  }
  
  // If no explicit steps found, generate based on recipe type
  if (instructions.length === 0) {
    instructions.push(...generateDefaultInstructions(recipeType));
  }
  
  return instructions.slice(0, 10); // Limit to 10 steps
}

// Generate default instructions for recipe type
function generateDefaultInstructions(recipeType) {
  const defaultInstructions = {
    'api-endpoint': [
      { step: 1, action: 'Define endpoint route and HTTP method', type: 'planning' },
      { step: 2, action: 'Set up input validation and sanitization', type: 'security' },
      { step: 3, action: 'Implement business logic', type: 'implementation' },
      { step: 4, action: 'Add error handling and logging', type: 'reliability' },
      { step: 5, action: 'Write tests and documentation', type: 'quality' }
    ],
    'database-schema': [
      { step: 1, action: 'Design entity relationships', type: 'planning' },
      { step: 2, action: 'Create migration scripts', type: 'implementation' },
      { step: 3, action: 'Add indexes for performance', type: 'optimization' },
      { step: 4, action: 'Set up constraints and validation', type: 'integrity' },
      { step: 5, action: 'Test with sample data', type: 'validation' }
    ],
    'game-mechanic': [
      { step: 1, action: 'Define game rules and objectives', type: 'design' },
      { step: 2, action: 'Create scoring and reward system', type: 'economics' },
      { step: 3, action: 'Implement player interactions', type: 'social' },
      { step: 4, action: 'Add ships and trading mechanics', type: 'commerce' },
      { step: 5, action: 'Balance competitive elements', type: 'tuning' }
    ]
  };
  
  return defaultInstructions[recipeType] || [
    { step: 1, action: 'Analyze requirements', type: 'planning' },
    { step: 2, action: 'Implement solution', type: 'implementation' },
    { step: 3, action: 'Test functionality', type: 'validation' },
    { step: 4, action: 'Deploy and monitor', type: 'operations' }
  ];
}

// Add game elements to recipe
function addGameElements(content, recipeType) {
  const elements = {
    ships: [],
    liquidityPools: [],
    judges: [],
    partners: []
  };
  
  const lowerContent = content.toLowerCase();
  
  // Detect ships based on content
  if (lowerContent.includes('explore') || lowerContent.includes('discover')) {
    elements.ships.push({ type: 'explorer', purpose: 'Knowledge discovery' });
  }
  if (lowerContent.includes('transport') || lowerContent.includes('deliver')) {
    elements.ships.push({ type: 'cargo', purpose: 'Content delivery' });
  }
  if (lowerContent.includes('trade') || lowerContent.includes('exchange')) {
    elements.ships.push({ type: 'merchant', purpose: 'Value exchange' });
  }
  
  // Detect liquidity pools
  if (lowerContent.includes('knowledge') || lowerContent.includes('learn')) {
    elements.liquidityPools.push({ type: 'knowledge-pool', resource: 'accumulated learning' });
  }
  if (lowerContent.includes('attention') || lowerContent.includes('focus')) {
    elements.liquidityPools.push({ type: 'attention-pool', resource: 'user engagement' });
  }
  
  // Detect judges based on recipe type
  switch (recipeType) {
    case 'api-endpoint':
      elements.judges.push({ type: 'technical-judge', criteria: 'code quality and performance' });
      break;
    case 'component-design':
      elements.judges.push({ type: 'quality-judge', criteria: 'user experience and accessibility' });
      break;
    case 'game-mechanic':
      elements.judges.push({ type: 'innovation-judge', criteria: 'creativity and engagement' });
      break;
  }
  
  // Detect potential partners
  if (lowerContent.includes('api') || lowerContent.includes('service')) {
    elements.partners.push({ type: 'api-partner', integration: 'service connectivity' });
  }
  if (lowerContent.includes('data') || lowerContent.includes('database')) {
    elements.partners.push({ type: 'data-partner', integration: 'data sharing' });
  }
  
  return elements;
}

// API endpoints
app.post('/api/cookbook/generate-recipe', async (req, res) => {
  try {
    const { content, filePath, characterAffinity } = req.body;
    
    if (!content || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Content and filePath are required'
      });
    }
    
    const recipe = generateRecipe(content, filePath, characterAffinity || 'cal');
    
    // Insert into database
    const stmt = recipeDb.prepare(`
      INSERT INTO recipes 
      (title, category, character_chef, recipe_type, difficulty, ingredients, instructions, 
       source_files, game_elements, metadata, trending_score, controversy_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      recipe.title, recipe.category, recipe.character_chef, recipe.recipe_type,
      recipe.difficulty, recipe.ingredients, recipe.instructions,
      recipe.source_files, recipe.game_elements, recipe.metadata,
      recipe.trending_score, recipe.controversy_score
    );
    
    recipe.recipe_id = result.lastInsertRowid;
    
    res.json({
      success: true,
      recipe
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/cookbook/recipes', (req, res) => {
  try {
    const { 
      category = null, 
      character = null, 
      sortBy = 'trending',
      limit = 20 
    } = req.query;
    
    let sql = `
      SELECT r.*, 
             COALESCE(AVG(rr.rating), 0) as avg_rating,
             COUNT(rr.rating_id) as rating_count
      FROM recipes r
      LEFT JOIN recipe_ratings rr ON r.recipe_id = rr.recipe_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (category) {
      sql += ` AND r.category = ?`;
      params.push(category);
    }
    
    if (character) {
      sql += ` AND r.character_chef = ?`;
      params.push(character);
    }
    
    sql += ` GROUP BY r.recipe_id`;
    
    switch (sortBy) {
      case 'trending':
        sql += ` ORDER BY r.trending_score DESC, r.usage_count DESC`;
        break;
      case 'controversial':
        sql += ` ORDER BY r.controversy_score DESC`;
        break;
      case 'popular':
        sql += ` ORDER BY r.usage_count DESC, avg_rating DESC`;
        break;
      case 'newest':
        sql += ` ORDER BY r.created_at DESC`;
        break;
      default:
        sql += ` ORDER BY r.trending_score DESC`;
    }
    
    sql += ` LIMIT ?`;
    params.push(parseInt(limit));
    
    const stmt = recipeDb.prepare(sql);
    const recipes = stmt.all(...params);
    
    // Parse JSON fields
    const enrichedRecipes = recipes.map(recipe => ({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients || '[]'),
      instructions: JSON.parse(recipe.instructions || '[]'),
      source_files: JSON.parse(recipe.source_files || '[]'),
      game_elements: JSON.parse(recipe.game_elements || '{}'),
      metadata: JSON.parse(recipe.metadata || '{}'),
      category_info: recipeCategories[recipe.category] || recipeCategories['infrastructure-recipes']
    }));
    
    res.json({
      success: true,
      recipes: enrichedRecipes,
      total_count: recipes.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/cookbook/categories', (req, res) => {
  try {
    // Get recipe counts per category
    const stmt = recipeDb.prepare(`
      SELECT 
        category,
        COUNT(*) as recipe_count,
        AVG(trending_score) as avg_trending,
        AVG(controversy_score) as avg_controversy,
        MAX(created_at) as latest_recipe
      FROM recipes
      GROUP BY category
      ORDER BY recipe_count DESC
    `);
    
    const categories = stmt.all();
    
    // Enrich with category information
    const enrichedCategories = categories.map(cat => ({
      ...cat,
      ...recipeCategories[cat.category],
      recipe_count: cat.recipe_count,
      avg_trending: cat.avg_trending,
      avg_controversy: cat.avg_controversy,
      latest_recipe: cat.latest_recipe
    }));
    
    res.json({
      success: true,
      categories: enrichedCategories,
      available_categories: recipeCategories
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/cookbook/game-elements', (req, res) => {
  try {
    res.json({
      success: true,
      game_elements: gameElements,
      integration_examples: {
        ships: "🚢 Explorer ships discover new knowledge patterns",
        liquidityPools: "💧 Knowledge pools accumulate community wisdom",
        judges: "⚖️ Quality judges evaluate recipe effectiveness",
        partners: "🤝 API partners enable seamless integrations"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
function getRecipeCategory(content, characterAffinity) {
  // Find category based on character specialization
  for (const [category, info] of Object.entries(recipeCategories)) {
    if (info.character === characterAffinity) {
      return category;
    }
  }
  return 'infrastructure-recipes'; // Default
}

function generateRecipeTitle(fileName, recipeType) {
  const baseName = path.basename(fileName, path.extname(fileName));
  const formatted = baseName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  const typeMap = {
    'api-endpoint': 'API Recipe',
    'database-schema': 'Database Recipe',
    'component-design': 'Component Recipe',
    'auth-flow': 'Security Recipe',
    'ai-integration': 'AI Recipe',
    'game-mechanic': 'Game Recipe',
    'optimization-pattern': 'Performance Recipe'
  };
  
  const recipeTypeName = typeMap[recipeType] || 'Recipe';
  return `${formatted} ${recipeTypeName}`;
}

function calculateDifficulty(content) {
  const length = content.length;
  const complexity = (content.match(/function|class|async|await|promise/gi) || []).length;
  
  if (length < 1000 && complexity < 5) return 'easy';
  if (length < 5000 && complexity < 15) return 'medium';
  return 'hard';
}

function calculateTrendingScore(content) {
  const trendingKeywords = ['ai', 'llm', 'ml', 'blockchain', 'crypto', 'modern', 'latest', '2025'];
  let score = 0;
  const lowerContent = content.toLowerCase();
  
  for (const keyword of trendingKeywords) {
    if (lowerContent.includes(keyword)) score += 0.1;
  }
  
  return Math.min(score, 1);
}

function calculateControversyScore(content) {
  const controversyKeywords = ['hack', 'workaround', 'deprecated', 'legacy', 'todo', 'fixme', 'bug'];
  let score = 0;
  const lowerContent = content.toLowerCase();
  
  for (const keyword of controversyKeywords) {
    const matches = (lowerContent.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * 0.1;
  }
  
  return Math.min(score, 1);
}

function estimateImplementationTime(content, recipeType) {
  const baseTime = {
    'api-endpoint': '2-4 hours',
    'database-schema': '1-3 hours',
    'component-design': '3-6 hours',
    'auth-flow': '4-8 hours',
    'ai-integration': '6-12 hours',
    'game-mechanic': '8-16 hours'
  };
  
  return baseTime[recipeType] || '2-6 hours';
}

function assessRequiredSkills(content) {
  const skills = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('javascript') || lowerContent.includes('node')) skills.push('JavaScript');
  if (lowerContent.includes('python')) skills.push('Python');
  if (lowerContent.includes('sql') || lowerContent.includes('database')) skills.push('SQL');
  if (lowerContent.includes('docker') || lowerContent.includes('deploy')) skills.push('DevOps');
  if (lowerContent.includes('react') || lowerContent.includes('vue')) skills.push('Frontend');
  if (lowerContent.includes('security') || lowerContent.includes('auth')) skills.push('Security');
  
  return skills;
}

function extractTags(content) {
  const tags = [];
  const lowerContent = content.toLowerCase();
  
  // Common technology tags
  const techTags = ['api', 'database', 'frontend', 'backend', 'security', 'ai', 'game', 'mobile'];
  
  for (const tag of techTags) {
    if (lowerContent.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags;
}

// Serve cookbook interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📚 Cookbook Recipe Organizer</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e, #2d4a22);
            color: #00ff00;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid #00ff00;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 0 25px rgba(0, 255, 0, 0.4);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #00ff00;
            padding-bottom: 20px;
            margin-bottom: 25px;
        }
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 25px 0;
        }
        .category-card {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #00ff00;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s;
            cursor: pointer;
        }
        .category-card:hover {
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
            transform: translateY(-3px);
        }
        .recipe-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin: 25px 0;
        }
        .recipe-card {
            background: rgba(0, 150, 0, 0.1);
            border: 1px solid #008800;
            border-radius: 10px;
            padding: 20px;
            transition: all 0.3s;
        }
        .recipe-card:hover {
            background: rgba(0, 255, 0, 0.15);
            border-color: #00ff00;
        }
        .game-elements {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 10px 0;
        }
        .game-element {
            background: rgba(0, 100, 200, 0.2);
            border: 1px solid #0066cc;
            border-radius: 15px;
            padding: 5px 10px;
            font-size: 0.8em;
            color: #66ccff;
        }
        .ingredients {
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid #ff8800;
            border-radius: 8px;
            padding: 10px;
            margin: 10px 0;
        }
        .instructions {
            background: rgba(100, 0, 200, 0.1);
            border: 1px solid #6600cc;
            border-radius: 8px;
            padding: 10px;
            margin: 10px 0;
        }
        .control-panel {
            background: rgba(255, 215, 0, 0.1);
            border: 2px solid #ffd700;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
        }
        .filter-btn {
            background: #cc9900;
            border: 1px solid #ffd700;
            color: #000;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .filter-btn:hover, .filter-btn.active {
            background: #ffd700;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        .metadata {
            font-size: 0.8em;
            color: #99ff99;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #003300;
        }
        .difficulty {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.7em;
            font-weight: bold;
        }
        .difficulty.easy { background: #00ff00; color: #000; }
        .difficulty.medium { background: #ffaa00; color: #000; }
        .difficulty.hard { background: #ff0000; color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Cookbook Recipe Organizer</h1>
            <p>🎮 Game-Integrated • 👨‍🍳 Character-Curated • 🚢 Ship-Tested Recipes</p>
        </div>

        <div class="control-panel">
            <span style="color: #ffd700; font-weight: bold;">Filter Recipes:</span>
            <button class="filter-btn active" onclick="filterRecipes('all')">🌟 All Recipes</button>
            <button class="filter-btn" onclick="filterRecipes('trending')">📈 Trending</button>
            <button class="filter-btn" onclick="filterRecipes('controversial')">🔥 Controversial</button>
            <button class="filter-btn" onclick="filterRecipes('newest')">🆕 Newest</button>
            <span style="margin-left: 20px; color: #ffd700;">Sort by Character:</span>
            <select id="characterFilter" onchange="filterByCharacter()" style="background: #1a1a1a; border: 1px solid #ffd700; color: #ffd700; padding: 5px;">
                <option value="">All Characters</option>
                <option value="cal">📊 Cal (Infrastructure)</option>
                <option value="arty">🎨 Arty (Design)</option>
                <option value="ralph">🔧 Ralph (Backend)</option>
                <option value="vera">🔐 Vera (Security)</option>
                <option value="paulo">🐍 Paulo (AI/ML)</option>
                <option value="nash">⚡ Nash (Performance)</option>
            </select>
        </div>

        <div id="categories" class="category-grid"></div>
        <div id="recipes" class="recipe-grid"></div>
        
        <div id="loading" style="text-align: center; color: #ffff00; padding: 20px; display: none;">
            🔄 Loading delicious recipes...
        </div>
    </div>

    <script>
        let allRecipes = [];
        let currentFilter = 'all';
        let currentCharacter = '';

        async function init() {
            await loadCategories();
            await loadRecipes();
        }

        async function loadCategories() {
            try {
                const response = await fetch('/api/cookbook/categories');
                const data = await response.json();
                
                if (data.success) {
                    const categoriesHtml = data.categories.map(cat => \`
                        <div class="category-card" onclick="filterByCategory('\${cat.category}')">
                            <div style="font-size: 2.5em; margin-bottom: 10px;">\${cat.emoji}</div>
                            <h3>\${cat.category.replace('-', ' ').toUpperCase()}</h3>
                            <p>\${cat.description}</p>
                            <div style="margin-top: 15px; font-size: 0.9em;">
                                📄 \${cat.recipe_count || 0} recipes<br>
                                📈 \${((cat.avg_trending || 0) * 100).toFixed(1)}% trending<br>
                                🔥 \${((cat.avg_controversy || 0) * 100).toFixed(1)}% controversial
                            </div>
                            <div style="margin-top: 10px; font-size: 0.8em; color: #66ff66;">
                                Templates: \${cat.templates ? cat.templates.join(', ') : 'Various'}
                            </div>
                        </div>
                    \`).join('');
                    
                    document.getElementById('categories').innerHTML = categoriesHtml;
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        }

        async function loadRecipes(sortBy = 'trending', character = '', category = '') {
            document.getElementById('loading').style.display = 'block';
            
            try {
                let url = \`/api/cookbook/recipes?sortBy=\${sortBy}&limit=50\`;
                if (character) url += \`&character=\${character}\`;
                if (category) url += \`&category=\${category}\`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.success) {
                    allRecipes = data.recipes;
                    displayRecipes(allRecipes);
                }
            } catch (error) {
                console.error('Failed to load recipes:', error);
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }

        function displayRecipes(recipes) {
            const recipesHtml = recipes.map(recipe => \`
                <div class="recipe-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>\${recipe.title}</h3>
                        <span class="difficulty \${recipe.difficulty}">\${recipe.difficulty.toUpperCase()}</span>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong>👨‍🍳 Chef:</strong> \${recipe.category_info.emoji} \${recipe.category_info.character.toUpperCase()} 
                        (<em>\${recipe.category_info.description}</em>)
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong>🍽️ Recipe Type:</strong> \${recipe.recipe_type.replace('-', ' ')}
                    </div>

                    <div class="ingredients">
                        <strong>🥘 Ingredients (\${recipe.ingredients.length}):</strong>
                        <div style="margin-top: 5px;">
                            \${recipe.ingredients.slice(0, 5).map(ing => \`
                                <span style="display: inline-block; background: rgba(255, 165, 0, 0.2); padding: 2px 6px; margin: 2px; border-radius: 8px; font-size: 0.8em;">
                                    \${ing.type}: \${ing.name} \${ing.required ? '⚠️' : '💡'}
                                </span>
                            \`).join('')}
                            \${recipe.ingredients.length > 5 ? \`<span style="color: #ffaa00;">... +\${recipe.ingredients.length - 5} more</span>\` : ''}
                        </div>
                    </div>

                    <div class="instructions">
                        <strong>📋 Instructions (\${recipe.instructions.length} steps):</strong>
                        <div style="margin-top: 5px;">
                            \${recipe.instructions.slice(0, 3).map(inst => \`
                                <div style="margin: 5px 0; font-size: 0.9em;">
                                    <strong>\${inst.step}.</strong> \${inst.action} 
                                    <span style="color: #aa88ff;">[\${inst.type}]</span>
                                </div>
                            \`).join('')}
                            \${recipe.instructions.length > 3 ? \`<div style="color: #aa88ff; font-style: italic;">... +\${recipe.instructions.length - 3} more steps</div>\` : ''}
                        </div>
                    </div>

                    <div class="game-elements">
                        \${Object.entries(recipe.game_elements).map(([type, elements]) => 
                            elements.map(el => \`<span class="game-element">\${getGameEmoji(type)} \${el.type || el.name || type}</span>\`).join('')
                        ).join('')}
                    </div>

                    <div class="metadata">
                        <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                            <span>📈 \${(recipe.trending_score * 100).toFixed(0)}% trending</span>
                            <span>🔥 \${(recipe.controversy_score * 100).toFixed(0)}% controversial</span>
                            <span>👁️ \${recipe.usage_count} uses</span>
                            <span>⭐ \${recipe.avg_rating.toFixed(1)}/5</span>
                        </div>
                        <div style="margin-top: 5px;">
                            <strong>⏱️ Time:</strong> \${recipe.metadata.estimated_time} | 
                            <strong>🎯 Skills:</strong> \${recipe.metadata.skill_level.join(', ') || 'General'} |
                            <strong>📂 Files:</strong> \${recipe.source_files.length}
                        </div>
                    </div>
                </div>
            \`).join('');
            
            document.getElementById('recipes').innerHTML = recipesHtml || '<div style="text-align: center; padding: 40px; color: #666;">No recipes found. Try different filters!</div>';
        }

        function getGameEmoji(type) {
            const emojis = {
                ships: '🚢',
                liquidityPools: '💧',
                judges: '⚖️',
                partners: '🤝'
            };
            return emojis[type] || '🎮';
        }

        function filterRecipes(type) {
            currentFilter = type;
            
            // Update button states
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            loadRecipes(type, currentCharacter);
        }

        function filterByCharacter() {
            const character = document.getElementById('characterFilter').value;
            currentCharacter = character;
            loadRecipes(currentFilter, character);
        }

        function filterByCategory(category) {
            loadRecipes(currentFilter, currentCharacter, category);
        }

        // Initialize when page loads
        init();
    </script>
</body>
</html>
  `);
});

// Initialize and start
async function startCookbookOrganizer() {
  console.log("📚 Initializing Cookbook Recipe Organizer...");
  
  initializeRecipeDb();
  
  const PORT = 8092;
  app.listen(PORT, () => {
    console.log(`
📚 COOKBOOK RECIPE ORGANIZER READY
==================================
🍳 Recipe API: http://localhost:${PORT}/api/cookbook/recipes
📋 Categories: http://localhost:${PORT}/api/cookbook/categories
🎮 Game Elements: http://localhost:${PORT}/api/cookbook/game-elements
🆕 Generate Recipe: POST http://localhost:${PORT}/api/cookbook/generate-recipe

🎯 Recipe Categories Active:
${Object.entries(recipeCategories).map(([key, cat]) => 
  `   ${cat.emoji} ${key}: ${cat.description}`
).join('\n')}

🎮 Game Integration Ready:
   ${gameElements.ships.emoji} Ships: ${gameElements.ships.types.join(', ')}
   ${gameElements.liquidityPools.emoji} Pools: Knowledge, Attention, Creativity
   ${gameElements.judges.emoji} Judges: Quality, Innovation, Technical
   ${gameElements.partners.emoji} Partners: API, Data, Service, Community

✨ Your content is now organized into actionable recipes!
    `);
  });
}

if (require.main === module) {
  startCookbookOrganizer().catch(console.error);
}

module.exports = { startCookbookOrganizer };
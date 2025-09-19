#!/usr/bin/env node

/**
 * 🧮 OLLAMA CALCULATION ENGINE
 * 
 * Local AI-powered calculation engine for game mechanics:
 * - Drop rate calculations with deterministic results
 * - Human-readable algorithm explanations
 * - Forum-postable calculation breakdowns
 * - Repeatable results with seed values
 * 
 * Replaces hardcoded JavaScript math with AI-driven calculations
 */

const fetch = require('node-fetch');
const crypto = require('crypto');
const EventEmitter = require('events');

class OllamaCalculationEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.ollamaUrl = config.ollamaUrl || 'http://localhost:11434';
        this.model = config.model || 'mistral'; // Fast for calculations
        
        // Calculation templates for consistency
        this.calculationTemplates = new Map();
        
        // Cache for repeated calculations
        this.calculationCache = new Map();
        this.cacheTimeout = 60 * 60 * 1000; // 1 hour
        
        // Seed management for deterministic results
        this.seedCounter = 0;
        
        this.initializeTemplates();
    }
    
    initializeTemplates() {
        // Drop rate calculation template
        this.calculationTemplates.set('drop_rate', {
            system: `You are a game calculation engine. Calculate drop rates precisely and explain them clearly.
Always provide:
1. The exact calculation steps
2. The final probability as a decimal
3. A human-readable explanation
4. Forum-ready text that players can understand`,
            
            userPrompt: (params) => `Calculate the drop rate for ${params.itemName} from ${params.source}:
Base drop rate: ${params.baseRate}
Player luck: ${params.playerLuck}
Time bonus: ${params.timeBonus || 'none'}
Special modifiers: ${params.modifiers || 'none'}

Provide the calculation in this format:
CALCULATION: [step by step math]
RESULT: [final decimal probability]
EXPLANATION: [human readable explanation]
FORUM_POST: [text suitable for posting on forums]`
        });
        
        // XP calculation template
        this.calculationTemplates.set('xp_calculation', {
            system: `You are a game XP calculator. Calculate experience points and level progression.
Provide exact calculations and clear explanations.`,
            
            userPrompt: (params) => `Calculate XP for ${params.action}:
Base XP: ${params.baseXP}
Level: ${params.level}
Bonuses: ${params.bonuses || 'none'}
Multipliers: ${params.multipliers || 'none'}

Format:
CALCULATION: [math steps]
RESULT: [final XP amount]
EXPLANATION: [clear explanation]`
        });
        
        // Damage calculation template
        this.calculationTemplates.set('damage', {
            system: `You are a combat damage calculator. Calculate damage with all modifiers.`,
            
            userPrompt: (params) => `Calculate damage:
Base damage: ${params.baseDamage}
Attacker stats: ${JSON.stringify(params.attackerStats)}
Defender stats: ${JSON.stringify(params.defenderStats)}
Weapon bonus: ${params.weaponBonus || 0}
Armor reduction: ${params.armorReduction || 0}

Provide detailed calculation and explanation.`
        });
        
        // Economic value calculation
        this.calculationTemplates.set('item_value', {
            system: `You are an economic value calculator for game items.`,
            
            userPrompt: (params) => `Calculate market value for ${params.itemName}:
Rarity: ${params.rarity}
Supply: ${params.supply} in circulation
Demand: ${params.demand} recent trades
Base value: ${params.baseValue}
Market trends: ${params.trends || 'stable'}

Calculate fair market value with explanation.`
        });
    }
    
    /**
     * Perform calculation using Ollama
     */
    async calculate(type, params, options = {}) {
        // Check cache first
        const cacheKey = this.getCacheKey(type, params);
        const cached = this.getFromCache(cacheKey);
        if (cached && !options.skipCache) {
            return cached;
        }
        
        // Get template
        const template = this.calculationTemplates.get(type);
        if (!template) {
            throw new Error(`Unknown calculation type: ${type}`);
        }
        
        // Add seed for determinism
        if (!params.seed) {
            params.seed = this.generateSeed(params);
        }
        
        try {
            // Prepare prompt
            const prompt = template.userPrompt(params);
            
            // Call Ollama
            const response = await this.callOllama(template.system, prompt, params.seed);
            
            // Parse response
            const result = this.parseCalculationResponse(response, type);
            
            // Add metadata
            result.timestamp = Date.now();
            result.type = type;
            result.params = params;
            result.seed = params.seed;
            
            // Cache result
            this.cacheResult(cacheKey, result);
            
            // Emit event
            this.emit('calculation', result);
            
            return result;
            
        } catch (error) {
            console.error(`Calculation failed for ${type}:`, error);
            
            // Fallback to JavaScript calculation
            return this.fallbackCalculation(type, params);
        }
    }
    
    /**
     * Call Ollama API
     */
    async callOllama(system, prompt, seed) {
        const response = await fetch(`${this.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: `${system}\n\nSeed: ${seed}\n\n${prompt}`,
                temperature: 0.1, // Low temperature for consistent calculations
                top_p: 0.9,
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.response;
    }
    
    /**
     * Parse calculation response from Ollama
     */
    parseCalculationResponse(response, type) {
        const result = {
            raw: response,
            calculation: '',
            result: 0,
            explanation: '',
            forumPost: ''
        };
        
        // Extract sections using regex
        const calculationMatch = response.match(/CALCULATION:\s*([^\n]+(?:\n(?!RESULT:|EXPLANATION:|FORUM_POST:)[^\n]+)*)/i);
        const resultMatch = response.match(/RESULT:\s*([^\n]+)/i);
        const explanationMatch = response.match(/EXPLANATION:\s*([^\n]+(?:\n(?!FORUM_POST:)[^\n]+)*)/i);
        const forumMatch = response.match(/FORUM_POST:\s*(.+?)(?:\n\n|$)/is);
        
        if (calculationMatch) result.calculation = calculationMatch[1].trim();
        if (resultMatch) {
            // Parse numeric result
            const numStr = resultMatch[1].trim();
            result.result = parseFloat(numStr) || 0;
        }
        if (explanationMatch) result.explanation = explanationMatch[1].trim();
        if (forumMatch) result.forumPost = forumMatch[1].trim();
        
        // Validate result
        if (type === 'drop_rate' && (result.result < 0 || result.result > 1)) {
            console.warn(`Invalid drop rate: ${result.result}, clamping to 0-1`);
            result.result = Math.max(0, Math.min(1, result.result));
        }
        
        return result;
    }
    
    /**
     * Fallback JavaScript calculations
     */
    fallbackCalculation(type, params) {
        console.log(`⚠️ Using fallback calculation for ${type}`);
        
        switch (type) {
            case 'drop_rate':
                return this.fallbackDropRate(params);
            case 'xp_calculation':
                return this.fallbackXPCalculation(params);
            case 'damage':
                return this.fallbackDamageCalculation(params);
            case 'item_value':
                return this.fallbackItemValue(params);
            default:
                throw new Error(`No fallback for calculation type: ${type}`);
        }
    }
    
    fallbackDropRate(params) {
        const baseRate = parseFloat(params.baseRate) || 0.001;
        const playerLuck = parseFloat(params.playerLuck) || 1.0;
        const timeBonus = params.timeBonus ? 1.1 : 1.0;
        
        const finalRate = baseRate * playerLuck * timeBonus;
        
        return {
            calculation: `Base rate (${baseRate}) × Player luck (${playerLuck}) × Time bonus (${timeBonus})`,
            result: finalRate,
            explanation: `The drop rate is ${(finalRate * 100).toFixed(4)}% or 1 in ${Math.round(1/finalRate)}`,
            forumPost: `Drop rate for ${params.itemName}: ${(finalRate * 100).toFixed(4)}% (1/${Math.round(1/finalRate)})\nFactors: Base rate × ${playerLuck}x luck × ${timeBonus}x time bonus`,
            type: 'drop_rate',
            params,
            fallback: true
        };
    }
    
    fallbackXPCalculation(params) {
        const baseXP = parseInt(params.baseXP) || 0;
        const level = parseInt(params.level) || 1;
        const levelBonus = 1 + (level - 1) * 0.02; // 2% per level
        
        const finalXP = Math.round(baseXP * levelBonus);
        
        return {
            calculation: `Base XP (${baseXP}) × Level bonus (${levelBonus.toFixed(2)})`,
            result: finalXP,
            explanation: `You gain ${finalXP} XP (base ${baseXP} with level ${level} bonus)`,
            type: 'xp_calculation',
            params,
            fallback: true
        };
    }
    
    fallbackDamageCalculation(params) {
        const base = parseInt(params.baseDamage) || 0;
        const weaponBonus = parseInt(params.weaponBonus) || 0;
        const armorReduction = parseInt(params.armorReduction) || 0;
        
        const damage = Math.max(1, base + weaponBonus - armorReduction);
        
        return {
            calculation: `Base (${base}) + Weapon (${weaponBonus}) - Armor (${armorReduction})`,
            result: damage,
            explanation: `Final damage: ${damage}`,
            type: 'damage',
            params,
            fallback: true
        };
    }
    
    fallbackItemValue(params) {
        const base = parseInt(params.baseValue) || 0;
        const supplyFactor = Math.max(0.5, 2 - (params.supply / 10000));
        const demandFactor = Math.max(0.8, params.demand / 1000);
        
        const value = Math.round(base * supplyFactor * demandFactor);
        
        return {
            calculation: `Base (${base}) × Supply factor (${supplyFactor.toFixed(2)}) × Demand factor (${demandFactor.toFixed(2)})`,
            result: value,
            explanation: `Market value: ${value} (affected by supply/demand)`,
            type: 'item_value',
            params,
            fallback: true
        };
    }
    
    /**
     * Generate deterministic seed
     */
    generateSeed(params) {
        const seedData = JSON.stringify(params) + this.seedCounter++;
        return crypto.createHash('sha256').update(seedData).digest('hex').substring(0, 16);
    }
    
    /**
     * Cache management
     */
    getCacheKey(type, params) {
        const paramStr = JSON.stringify(params, Object.keys(params).sort());
        return crypto.createHash('md5').update(`${type}:${paramStr}`).digest('hex');
    }
    
    getFromCache(key) {
        const cached = this.calculationCache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        this.calculationCache.delete(key);
        return null;
    }
    
    cacheResult(key, result) {
        this.calculationCache.set(key, {
            data: result,
            expires: Date.now() + this.cacheTimeout
        });
    }
    
    /**
     * Special calculation methods
     */
    async calculateDropRate(itemName, source, modifiers = {}) {
        return this.calculate('drop_rate', {
            itemName,
            source,
            baseRate: modifiers.baseRate || '1/512',
            playerLuck: modifiers.playerLuck || 1.0,
            timeBonus: modifiers.timeBonus || false,
            modifiers: modifiers.special || 'none'
        });
    }
    
    async calculateXP(action, level, bonuses = {}) {
        return this.calculate('xp_calculation', {
            action,
            level,
            baseXP: bonuses.baseXP || 100,
            bonuses: bonuses.list || 'none',
            multipliers: bonuses.multipliers || 'none'
        });
    }
    
    async calculateDamage(attacker, defender, weapon = {}) {
        return this.calculate('damage', {
            baseDamage: attacker.strength || 10,
            attackerStats: attacker,
            defenderStats: defender,
            weaponBonus: weapon.bonus || 0,
            armorReduction: defender.armor || 0
        });
    }
    
    async calculateItemValue(item, market = {}) {
        return this.calculate('item_value', {
            itemName: item.name,
            rarity: item.rarity || 'common',
            supply: market.supply || 1000,
            demand: market.demand || 100,
            baseValue: item.baseValue || 100,
            trends: market.trends || 'stable'
        });
    }
    
    /**
     * Generate forum-ready documentation
     */
    async generateForumDocumentation(calculations) {
        const sections = [];
        
        sections.push('# Game Calculation Documentation\n');
        sections.push('This post explains how our game calculations work.\n');
        
        for (const calc of calculations) {
            sections.push(`## ${calc.type.replace(/_/g, ' ').toUpperCase()}\n`);
            sections.push('**Calculation:**');
            sections.push('```');
            sections.push(calc.calculation);
            sections.push('```\n');
            sections.push('**Explanation:**');
            sections.push(calc.explanation);
            sections.push('\n');
            
            if (calc.forumPost) {
                sections.push('**Example:**');
                sections.push(calc.forumPost);
                sections.push('\n');
            }
        }
        
        return sections.join('\n');
    }
    
    /**
     * Health check for Ollama connection
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`);
            const data = await response.json();
            
            return {
                connected: true,
                models: data.models || [],
                hasCalculationModel: data.models?.some(m => m.name === this.model)
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }
}

// Export for integration
module.exports = OllamaCalculationEngine;

// CLI testing interface
if (require.main === module) {
    const engine = new OllamaCalculationEngine();
    
    async function runExamples() {
        console.log('🧮 Ollama Calculation Engine Examples\n');
        
        // Check health
        const health = await engine.checkHealth();
        console.log('Health check:', health);
        
        // Example 1: Drop rate calculation
        console.log('\n📊 Drop Rate Calculation:');
        const dropRate = await engine.calculateDropRate(
            'Abyssal Whip',
            'Abyssal Demon',
            {
                baseRate: '1/512',
                playerLuck: 1.2,
                timeBonus: true,
                special: 'Slayer task bonus +15%'
            }
        );
        console.log(dropRate);
        
        // Example 2: XP calculation
        console.log('\n📈 XP Calculation:');
        const xp = await engine.calculateXP(
            'Mining Runite Ore',
            85,
            {
                baseXP: 125,
                list: 'Mining cape +5%, Prospector outfit +2.5%',
                multipliers: 'Double XP weekend 2x'
            }
        );
        console.log(xp);
        
        // Example 3: Forum documentation
        console.log('\n📝 Forum Documentation:');
        const forumDocs = await engine.generateForumDocumentation([dropRate, xp]);
        console.log(forumDocs);
    }
    
    runExamples().catch(console.error);
}
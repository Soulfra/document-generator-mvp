#!/usr/bin/env node

/**
 * 🎮🏢 GAMING-ENTERPRISE TRANSLATOR
 * 
 * Maps gaming terminology to enterprise/technical terms and vice versa
 * Helps connect all the existing systems by providing a common language
 * 
 * Example: "boss fight" → "approval workflow"
 *         "grand exchange" → "marketplace/trading platform"
 *         "fog of war" → "discovery/exploration layer"
 */

const EventEmitter = require('events');

class GamingEnterpriseTranslator extends EventEmitter {
    constructor() {
        super();
        
        console.log('🎮🏢 GAMING-ENTERPRISE TRANSLATOR');
        console.log('================================');
        console.log('Bridging gaming and business terminology');
        console.log('');
        
        // Core terminology mappings
        this.termMappings = {
            // Gaming → Enterprise/Technical
            'player': ['user', 'client', 'customer', 'stakeholder', 'participant'],
            'guild': ['team', 'department', 'organization', 'company', 'consortium'],
            'party': ['workgroup', 'project team', 'collaboration group'],
            'quest': ['task', 'project', 'objective', 'deliverable', 'assignment'],
            'inventory': ['database', 'storage', 'repository', 'assets', 'resources'],
            'level': ['tier', 'permission', 'access level', 'seniority', 'rank'],
            'spawn': ['create', 'instantiate', 'deploy', 'initialize', 'generate'],
            'raid': ['sprint', 'intensive project', 'collaborative effort', 'major initiative'],
            'loot': ['rewards', 'compensation', 'benefits', 'outcomes', 'revenue'],
            'grinding': ['repetitive tasks', 'routine work', 'process optimization', 'automation targets'],
            'boss': ['manager', 'executive', 'decision maker', 'approver', 'supervisor'],
            'boss fight': ['approval workflow', 'decision process', 'review meeting', 'pitch presentation'],
            'dungeon': ['project scope', 'workspace', 'environment', 'challenge area'],
            'pvp': ['competition', 'market rivalry', 'competitive analysis', 'benchmarking'],
            'pve': ['internal processes', 'operational efficiency', 'workflow', 'productivity'],
            'respawn': ['retry', 'reset', 'restart', 'recovery', 'failover'],
            'buff': ['enhancement', 'advantage', 'improvement', 'optimization'],
            'debuff': ['limitation', 'constraint', 'restriction', 'impediment'],
            'cooldown': ['waiting period', 'processing time', 'delay', 'rate limit'],
            'achievement': ['milestone', 'kpi', 'goal completion', 'success metric'],
            'leaderboard': ['rankings', 'performance metrics', 'dashboards', 'analytics'],
            'xp': ['experience points', 'skill development', 'competency', 'expertise'],
            'hp': ['health points', 'system health', 'availability', 'uptime'],
            'mana': ['resources', 'budget', 'capacity', 'bandwidth'],
            'npc': ['ai agent', 'automated service', 'bot', 'virtual assistant'],
            'mob': ['task', 'work item', 'ticket', 'issue'],
            'aggro': ['attention', 'priority', 'focus', 'escalation'],
            'tank': ['load balancer', 'primary handler', 'main processor', 'leader'],
            'healer': ['support', 'maintenance', 'debugger', 'problem solver'],
            'dps': ['throughput', 'productivity', 'efficiency', 'output rate'],
            'cc': ['crowd control', 'queue management', 'flow control', 'traffic management'],
            'aoe': ['area of effect', 'bulk operation', 'mass update', 'broadcast'],
            'dot': ['damage over time', 'recurring cost', 'subscription', 'ongoing expense'],
            'hot': ['heal over time', 'gradual improvement', 'incremental update', 'continuous delivery'],
            'proc': ['trigger', 'event', 'webhook', 'automation'],
            'rng': ['randomness', 'variability', 'uncertainty', 'risk factor'],
            'meta': ['best practices', 'industry standard', 'optimal strategy', 'current trend'],
            'nerf': ['downgrade', 'limitation', 'restriction', 'deprecation'],
            'patch': ['update', 'hotfix', 'release', 'deployment'],
            'dlc': ['addon', 'extension', 'plugin', 'additional feature'],
            'f2p': ['freemium', 'free tier', 'basic plan', 'starter edition'],
            'p2w': ['premium', 'paid tier', 'enterprise plan', 'priority access'],
            'farming': ['data collection', 'resource gathering', 'accumulation', 'harvesting'],
            'camping': ['monitoring', 'watching', 'polling', 'persistent checking'],
            'ganking': ['ambush', 'surprise audit', 'unexpected challenge', 'security breach'],
            'kiting': ['leading', 'guiding', 'directing', 'managing flow'],
            'pulling': ['fetching', 'requesting', 'api call', 'data retrieval'],
            
            // Specific to your systems
            'grand exchange': ['marketplace', 'trading platform', 'service exchange', 'api marketplace'],
            'fog of war': ['discovery layer', 'exploration system', 'unknown territory', 'unmapped features'],
            'mirror layer': ['replication system', 'backup layer', 'redundancy', 'reflection service'],
            'osrs': ['legacy system', 'classic interface', 'traditional approach'],
            'runescape': ['virtual economy', 'game-based platform', 'interactive system'],
            'habbo': ['social platform', 'virtual meeting space', 'collaborative environment'],
            'wow': ['world of warcraft', 'massive system', 'enterprise platform', 'large-scale application'],
            '5 man dungeon': ['small team project', 'scrum team', 'focused initiative', 'agile squad'],
            'instance': ['isolated environment', 'container', 'sandbox', 'virtual machine'],
            'shard': ['database partition', 'server cluster', 'distributed node', 'segment'],
            'realm': ['environment', 'deployment', 'server', 'namespace'],
            'faction': ['department', 'division', 'business unit', 'team alignment'],
            'covenant': ['agreement', 'contract', 'sla', 'partnership'],
            'legendary': ['premium', 'enterprise-grade', 'top-tier', 'flagship'],
            'epic': ['major feature', 'large story', 'significant update', 'milestone release'],
            'rare': ['unique feature', 'differentiator', 'special capability', 'exclusive'],
            'common': ['standard', 'basic', 'default', 'baseline'],
            'vendor': ['service provider', 'api endpoint', 'third-party', 'supplier'],
            'auction house': ['marketplace', 'exchange', 'trading post', 'commerce platform'],
            'guild bank': ['shared resources', 'team budget', 'common pool', 'collective assets'],
            'battleground': ['competitive environment', 'testing ground', 'benchmark arena', 'proving ground'],
            'arena': ['focused competition', 'head-to-head', 'direct comparison', 'showdown'],
            'world boss': ['major challenge', 'critical issue', 'blocker', 'showstopper'],
            'daily quest': ['routine task', 'daily standup', 'regular maintenance', 'recurring job'],
            'weekly reset': ['sprint boundary', 'iteration end', 'cycle completion', 'period close'],
            'expansion': ['major release', 'version upgrade', 'platform evolution', 'growth phase'],
            'endgame': ['mature state', 'optimization phase', 'scaling stage', 'final form'],
            'character': ['profile', 'identity', 'persona', 'account'],
            'avatar': ['representation', 'user interface', 'digital identity', 'profile picture'],
            'skin': ['theme', 'appearance', 'ui customization', 'branding'],
            'mount': ['transportation', 'accelerator', 'efficiency tool', 'speed enhancement'],
            'pet': ['companion service', 'helper bot', 'assistant', 'sidekick feature'],
            'trinket': ['utility', 'tool', 'helper function', 'convenience feature'],
            'consumable': ['one-time use', 'disposable resource', 'temporary boost', 'limited usage'],
            'soulbound': ['non-transferable', 'locked', 'dedicated', 'exclusive access'],
            'bind on pickup': ['immediate lock', 'instant assignment', 'auto-allocation', 'direct binding'],
            'bind on equip': ['activation lock', 'usage binding', 'deployment lock', 'implementation seal'],
            'tradeable': ['transferable', 'shareable', 'exchangeable', 'negotiable'],
            'untradeable': ['locked', 'non-transferable', 'restricted', 'proprietary'],
            'stackable': ['aggregatable', 'combinable', 'mergeable', 'cumulative'],
            'unique': ['singleton', 'exclusive', 'one-only', 'non-duplicate'],
            'quest chain': ['workflow', 'process flow', 'pipeline', 'sequence'],
            'main quest': ['primary objective', 'core feature', 'main goal', 'key deliverable'],
            'side quest': ['optional feature', 'nice-to-have', 'secondary task', 'bonus objective'],
            'hidden quest': ['easter egg', 'undocumented feature', 'secret functionality', 'hidden gem'],
            'reputation': ['trust score', 'credibility', 'rating', 'standing'],
            'faction reputation': ['team standing', 'department relations', 'organizational trust', 'group credibility'],
            'honor': ['integrity points', 'ethical score', 'compliance rating', 'conduct measure'],
            'prestige': ['advanced tier', 'elite status', 'premium level', 'vip access'],
            'mastery': ['expertise', 'specialization', 'proficiency', 'skill cap'],
            'talent tree': ['skill progression', 'career path', 'development roadmap', 'growth trajectory'],
            'spec': ['specialization', 'configuration', 'build', 'setup'],
            'rotation': ['workflow sequence', 'process order', 'task priority', 'execution pattern'],
            'combo': ['combination', 'sequence', 'chain', 'series'],
            'crit': ['critical success', 'exceptional result', 'peak performance', 'maximum output'],
            'miss': ['failure', 'error', 'unsuccessful attempt', 'failed execution'],
            'dodge': ['avoidance', 'bypass', 'skip', 'workaround'],
            'parry': ['deflection', 'redirect', 'counter', 'defensive action'],
            'block': ['prevention', 'stop', 'halt', 'barrier']
        };
        
        // Reverse mappings (Enterprise → Gaming)
        this.reverseMappings = this.buildReverseMappings();
        
        // Context patterns for better translation
        this.contextPatterns = {
            combat: ['fight', 'battle', 'damage', 'attack', 'defend', 'heal'],
            economy: ['gold', 'currency', 'trade', 'market', 'exchange', 'value'],
            progression: ['level', 'xp', 'skill', 'unlock', 'achievement', 'advance'],
            social: ['guild', 'party', 'team', 'chat', 'friend', 'group'],
            exploration: ['map', 'discover', 'explore', 'fog', 'territory', 'zone']
        };
    }
    
    buildReverseMappings() {
        const reverse = {};
        
        for (const [gaming, enterprises] of Object.entries(this.termMappings)) {
            for (const enterprise of enterprises) {
                if (!reverse[enterprise]) {
                    reverse[enterprise] = [];
                }
                if (!reverse[enterprise].includes(gaming)) {
                    reverse[enterprise].push(gaming);
                }
            }
        }
        
        return reverse;
    }
    
    // Translate gaming term to enterprise/technical term
    gamingToEnterprise(gamingTerm, context = '') {
        const term = gamingTerm.toLowerCase();
        
        // Direct mapping
        if (this.termMappings[term]) {
            // Use context to select best translation
            return this.selectBestTranslation(this.termMappings[term], context);
        }
        
        // Check for partial matches
        for (const [gaming, enterprises] of Object.entries(this.termMappings)) {
            if (term.includes(gaming) || gaming.includes(term)) {
                return this.selectBestTranslation(enterprises, context);
            }
        }
        
        return gamingTerm; // Return original if no translation found
    }
    
    // Translate enterprise/technical term to gaming term
    enterpriseToGaming(enterpriseTerm, context = '') {
        const term = enterpriseTerm.toLowerCase();
        
        // Direct mapping
        if (this.reverseMappings[term]) {
            return this.selectBestTranslation(this.reverseMappings[term], context);
        }
        
        // Check for partial matches
        for (const [enterprise, gamings] of Object.entries(this.reverseMappings)) {
            if (term.includes(enterprise) || enterprise.includes(term)) {
                return this.selectBestTranslation(gamings, context);
            }
        }
        
        return enterpriseTerm; // Return original if no translation found
    }
    
    // Select best translation based on context
    selectBestTranslation(options, context) {
        if (options.length === 1) return options[0];
        
        const contextLower = context.toLowerCase();
        
        // Check context patterns
        for (const [pattern, keywords] of Object.entries(this.contextPatterns)) {
            for (const keyword of keywords) {
                if (contextLower.includes(keyword)) {
                    // Find option that best matches this context
                    for (const option of options) {
                        if (option.includes(pattern) || pattern.includes(option)) {
                            return option;
                        }
                    }
                }
            }
        }
        
        // Return first option if no context match
        return options[0];
    }
    
    // Translate entire text
    translateText(text, direction = 'gaming-to-enterprise') {
        const words = text.split(/\s+/);
        const translated = [];
        
        for (const word of words) {
            const cleanWord = word.replace(/[.,!?;:'"]/g, '');
            const punctuation = word.replace(cleanWord, '');
            
            let translatedWord;
            if (direction === 'gaming-to-enterprise') {
                translatedWord = this.gamingToEnterprise(cleanWord, text);
            } else {
                translatedWord = this.enterpriseToGaming(cleanWord, text);
            }
            
            translated.push(translatedWord + punctuation);
        }
        
        return translated.join(' ');
    }
    
    // Generate glossary
    generateGlossary(format = 'markdown') {
        const glossary = [];
        
        for (const [gaming, enterprises] of Object.entries(this.termMappings)) {
            glossary.push({
                gaming: gaming,
                enterprise: enterprises,
                primaryTranslation: enterprises[0]
            });
        }
        
        if (format === 'markdown') {
            let md = '# Gaming to Enterprise Glossary\n\n';
            md += '| Gaming Term | Primary Translation | All Translations |\n';
            md += '|-------------|-------------------|------------------|\n';
            
            for (const entry of glossary.sort((a, b) => a.gaming.localeCompare(b.gaming))) {
                md += `| ${entry.gaming} | ${entry.primaryTranslation} | ${entry.enterprise.join(', ')} |\n`;
            }
            
            return md;
        }
        
        return glossary;
    }
    
    // Explain translation with examples
    explainTranslation(term, direction = 'gaming-to-enterprise') {
        const termLower = term.toLowerCase();
        let explanation = {};
        
        if (direction === 'gaming-to-enterprise') {
            if (this.termMappings[termLower]) {
                explanation = {
                    original: term,
                    translations: this.termMappings[termLower],
                    example: this.getExample(termLower, 'gaming'),
                    context: this.getContext(termLower)
                };
            }
        } else {
            if (this.reverseMappings[termLower]) {
                explanation = {
                    original: term,
                    translations: this.reverseMappings[termLower],
                    example: this.getExample(termLower, 'enterprise'),
                    context: this.getContext(termLower)
                };
            }
        }
        
        return explanation;
    }
    
    // Get example usage
    getExample(term, type) {
        const examples = {
            gaming: {
                'boss fight': 'The boss fight was intense - we needed approval from three different managers.',
                'grand exchange': 'I listed my service on the grand exchange (marketplace) for other teams to use.',
                'fog of war': 'There\'s still fog of war around that feature - we haven\'t explored it yet.',
                'grinding': 'I\'ve been grinding these reports all day (doing repetitive tasks).'
            },
            enterprise: {
                'marketplace': 'Our API marketplace is like RuneScape\'s Grand Exchange for services.',
                'approval workflow': 'This approval workflow feels like a boss fight with multiple phases.',
                'discovery layer': 'The discovery layer reveals features like clearing fog of war in a game.'
            }
        };
        
        return examples[type]?.[term] || `${term} is commonly used in ${type} contexts.`;
    }
    
    // Get context information
    getContext(term) {
        for (const [pattern, keywords] of Object.entries(this.contextPatterns)) {
            for (const keyword of keywords) {
                if (term.includes(keyword) || keyword.includes(term)) {
                    return `Usually used in ${pattern} contexts`;
                }
            }
        }
        return 'General usage';
    }
    
    // Interactive translation API
    async translateQuery(query) {
        const result = {
            original: query,
            detectedTerms: [],
            translations: {},
            suggestedQuery: ''
        };
        
        // Detect gaming terms in query
        const words = query.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (this.termMappings[word]) {
                result.detectedTerms.push(word);
                result.translations[word] = this.termMappings[word];
            }
        }
        
        // Create suggested enterprise query
        result.suggestedQuery = this.translateText(query, 'gaming-to-enterprise');
        
        return result;
    }
}

// Export for use
module.exports = GamingEnterpriseTranslator;

// CLI interface
if (require.main === module) {
    const translator = new GamingEnterpriseTranslator();
    
    console.log('\n📚 Example Translations:');
    console.log('========================');
    
    const examples = [
        'boss fight → ' + translator.gamingToEnterprise('boss fight'),
        'grand exchange → ' + translator.gamingToEnterprise('grand exchange'),
        'fog of war → ' + translator.gamingToEnterprise('fog of war'),
        'grinding tasks → ' + translator.gamingToEnterprise('grinding'),
        'spawn a new instance → ' + translator.translateText('spawn a new instance')
    ];
    
    examples.forEach(ex => console.log(ex));
    
    console.log('\n💡 Full Text Translation Example:');
    console.log('=================================');
    
    const gamingText = "We need to clear the fog of war on this project, defeat the boss (get approval), and then list our loot on the grand exchange for other guilds to trade.";
    const enterpriseText = translator.translateText(gamingText);
    
    console.log('Gaming:', gamingText);
    console.log('Enterprise:', enterpriseText);
    
    // Generate glossary file
    const glossary = translator.generateGlossary();
    require('fs').writeFileSync('gaming-enterprise-glossary.md', glossary);
    console.log('\n📖 Glossary saved to gaming-enterprise-glossary.md');
    
    // Interactive mode
    if (process.argv[2]) {
        const input = process.argv.slice(2).join(' ');
        console.log('\n🔄 Translating:', input);
        const result = translator.translateQuery(input);
        console.log('Result:', JSON.stringify(result, null, 2));
    }
}
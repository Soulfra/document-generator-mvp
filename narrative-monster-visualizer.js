#!/usr/bin/env node

/**
 * NARRATIVE MONSTER VISUALIZER
 * Converts narrative errors/monsters into actual displayable pixels
 * Provides verifiable visual proof that monsters exist on your website
 * Inverse OCR: Text descriptions → Visual monsters
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;

class NarrativeMonsterVisualizer extends EventEmitter {
    constructor() {
        super();
        
        // Monster sprite templates (pixel art)
        this.monsterTemplates = new Map();
        
        // Visual proof registry
        this.visualProofs = new Map();
        
        // Error-to-monster mappings
        this.errorMonsterMappings = new Map();
        
        // Active visual instances
        this.activeVisuals = new Map();
        
        // Pixel art generation
        this.pixelArtConfig = {
            tileSize: 32,
            colorPalette: {
                // Vampire monsters (from packet cleanser)
                vampire: {
                    primary: '#8B0000',
                    secondary: '#DC143C',
                    accent: '#FF6B6B',
                    glow: '#FF0000'
                },
                // 404 Lost Spirit
                lost_spirit: {
                    primary: '#808080',
                    secondary: '#A9A9A9',
                    accent: '#D3D3D3',
                    glow: '#FFFFFF'
                },
                // 500 Chaos Demon
                chaos_demon: {
                    primary: '#4B0082',
                    secondary: '#8A2BE2',
                    accent: '#9932CC',
                    glow: '#FF00FF'
                },
                // Rate limit Time Warden
                time_warden: {
                    primary: '#2F4F4F',
                    secondary: '#708090',
                    accent: '#778899',
                    glow: '#00CED1'
                }
            }
        };
        
        // Initialize monster templates
        this.initializeMonsterTemplates();
        
        console.log('👾 NARRATIVE MONSTER VISUALIZER INITIALIZED');
    }
    
    /**
     * Initialize monster sprite templates
     */
    async initializeMonsterTemplates() {
        console.log('🎨 Initializing monster sprite templates...');
        
        // Vampire monsters from VAMPIRE-SLAYER-PACKET-CLEANSER.js
        this.monsterTemplates.set('vyrewatch', {
            name: 'Vyrewatch Packet Corruptor',
            type: 'vampire',
            size: { width: 64, height: 96 },
            corruption: 0.8,
            weakness: 'ivandis_flail',
            pixelArt: this.generateVampirePixelArt('vyrewatch'),
            description: 'A corrupted data packet with glowing red eyes',
            visualProof: {
                color: '#8B0000',
                pattern: 'floating_corruption',
                animations: ['idle_float', 'corruption_pulse', 'death_dissolve']
            }
        });
        
        this.monsterTemplates.set('vanstrom', {
            name: 'Vanstrom Data Destroyer',
            type: 'vampire_boss',
            size: { width: 128, height: 192 },
            corruption: 0.95,
            weakness: 'blisterwood',
            pixelArt: this.generateVampirePixelArt('vanstrom'),
            description: 'Massive boss-level data corruption entity',
            visualProof: {
                color: '#DC143C',
                pattern: 'boss_aura',
                animations: ['boss_idle', 'corruption_wave', 'phase_transition']
            }
        });
        
        // Error monsters from story crawler
        this.monsterTemplates.set('404_lost_spirit', {
            name: 'Lost Spirit (404)',
            type: 'error_ghost',
            size: { width: 48, height: 72 },
            httpCode: 404,
            difficulty: 'easy',
            pixelArt: this.generateErrorPixelArt('404'),
            description: 'Wanders endlessly, never finding home',
            visualProof: {
                color: '#808080',
                pattern: 'ghostly_fade',
                animations: ['wander', 'fade_in_out', 'disappear']
            }
        });
        
        this.monsterTemplates.set('403_guardian_golem', {
            name: 'Guardian Golem (403)',
            type: 'access_blocker',
            size: { width: 96, height: 144 },
            httpCode: 403,
            difficulty: 'medium',
            pixelArt: this.generateErrorPixelArt('403'),
            description: 'Blocks your path with stony resolve',
            visualProof: {
                color: '#696969',
                pattern: 'stone_block',
                animations: ['guard_stance', 'block_attack', 'crack_damage']
            }
        });
        
        this.monsterTemplates.set('500_chaos_demon', {
            name: 'Chaos Demon (500)',
            type: 'server_error',
            size: { width: 112, height: 168 },
            httpCode: 500,
            difficulty: 'hard',
            pixelArt: this.generateErrorPixelArt('500'),
            description: 'Server instability made manifest',
            visualProof: {
                color: '#4B0082',
                pattern: 'chaos_storm',
                animations: ['chaos_idle', 'error_burst', 'system_crash']
            }
        });
        
        console.log(`✅ Initialized ${this.monsterTemplates.size} monster templates`);
    }
    
    /**
     * Generate vampire pixel art
     */
    generateVampirePixelArt(vampireType) {
        const config = this.pixelArtConfig;
        const colors = config.colorPalette.vampire;
        
        // Generate pixel matrix based on vampire type
        const artMatrix = [];
        const size = vampireType === 'vanstrom' ? 128 : 64;
        
        // Create pixel art pattern
        for (let y = 0; y < size; y++) {
            artMatrix[y] = [];
            for (let x = 0; x < size; x++) {
                // Generate vampire silhouette
                if (this.isVampirePixel(x, y, size, vampireType)) {
                    artMatrix[y][x] = this.getVampirePixelColor(x, y, size, colors);
                } else {
                    artMatrix[y][x] = 'transparent';
                }
            }
        }
        
        return {
            matrix: artMatrix,
            colors: colors,
            size: { width: size, height: size * 1.5 }
        };
    }
    
    /**
     * Generate error monster pixel art
     */
    generateErrorPixelArt(errorCode) {
        const size = errorCode === '500' ? 112 : errorCode === '403' ? 96 : 48;
        const colorKey = errorCode === '404' ? 'lost_spirit' : 
                        errorCode === '403' ? 'lost_spirit' : 'chaos_demon';
        const colors = this.pixelArtConfig.colorPalette[colorKey];
        
        const artMatrix = [];
        
        for (let y = 0; y < size; y++) {
            artMatrix[y] = [];
            for (let x = 0; x < size; x++) {
                if (this.isErrorMonsterPixel(x, y, size, errorCode)) {
                    artMatrix[y][x] = this.getErrorPixelColor(x, y, size, colors, errorCode);
                } else {
                    artMatrix[y][x] = 'transparent';
                }
            }
        }
        
        return {
            matrix: artMatrix,
            colors: colors,
            size: { width: size, height: size * 1.5 }
        };
    }
    
    /**
     * Determine if pixel should be part of vampire
     */
    isVampirePixel(x, y, size, vampireType) {
        const centerX = size / 2;
        const centerY = size / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        // Basic vampire silhouette logic
        if (vampireType === 'vanstrom') {
            // Larger, more imposing boss shape
            return distance < size * 0.4 && y > size * 0.2;
        } else {
            // Standard vampire shape
            return distance < size * 0.3 && y > size * 0.15;
        }
    }
    
    /**
     * Determine if pixel should be part of error monster
     */
    isErrorMonsterPixel(x, y, size, errorCode) {
        const centerX = size / 2;
        const centerY = size / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        switch (errorCode) {
            case '404':
                // Ghostly, fading shape
                return distance < size * 0.25 && Math.random() > 0.3;
            case '403':
                // Solid, blocky shape
                return (x > size * 0.25 && x < size * 0.75) && 
                       (y > size * 0.3 && y < size * 0.8);
            case '500':
                // Chaotic, irregular shape
                return distance < size * 0.35 && Math.random() > 0.1;
            default:
                return false;
        }
    }
    
    /**
     * Get vampire pixel color
     */
    getVampirePixelColor(x, y, size, colors) {
        const centerDistance = Math.sqrt((x - size/2) ** 2 + (y - size/2) ** 2);
        const maxDistance = size * 0.4;
        const ratio = centerDistance / maxDistance;
        
        if (ratio < 0.3) {
            return colors.primary;
        } else if (ratio < 0.6) {
            return colors.secondary;
        } else {
            return colors.accent;
        }
    }
    
    /**
     * Get error pixel color
     */
    getErrorPixelColor(x, y, size, colors, errorCode) {
        // Add some variation based on position
        const hash = ((x * 31) + (y * 17)) % 100;
        
        if (hash < 40) {
            return colors.primary;
        } else if (hash < 70) {
            return colors.secondary;
        } else {
            return colors.accent;
        }
    }
    
    /**
     * Convert narrative error to visual monster
     */
    async narrativeErrorToMonster(error, context = {}) {
        console.log(`\n👾 CONVERTING ERROR TO MONSTER: ${error.type || error.code}`);
        
        // Determine monster type based on error
        let monsterType;
        if (error.code === 'ENOTFOUND' || error.message?.includes('404')) {
            monsterType = '404_lost_spirit';
        } else if (error.code === 'ECONNREFUSED' || error.message?.includes('403')) {
            monsterType = '403_guardian_golem';
        } else if (error.message?.includes('500') || error.code === 'ETIMEDOUT') {
            monsterType = '500_chaos_demon';
        } else if (error.corruption) {
            monsterType = error.corruption > 0.8 ? 'vanstrom' : 'vyrewatch';
        } else {
            monsterType = '404_lost_spirit'; // Default
        }
        
        const template = this.monsterTemplates.get(monsterType);
        if (!template) {
            console.error(`❌ Monster template not found: ${monsterType}`);
            return null;
        }
        
        // Generate unique monster instance
        const monsterId = crypto.randomBytes(8).toString('hex');
        const monster = {
            id: monsterId,
            template: monsterType,
            name: template.name,
            originalError: error,
            context: context,
            visualData: {
                pixelArt: template.pixelArt,
                position: { x: Math.random() * 800, y: Math.random() * 600 },
                scale: 1.0 + (Math.random() * 0.5),
                rotation: Math.random() * 360,
                opacity: 0.8 + (Math.random() * 0.2)
            },
            spawnTime: Date.now(),
            status: 'spawned'
        };
        
        // Store active visual
        this.activeVisuals.set(monsterId, monster);
        
        // Generate visual proof
        const proof = await this.generateVisualProof(monster);
        this.visualProofs.set(monsterId, proof);
        
        console.log(`✅ Monster spawned: ${template.name}`);
        console.log(`   ID: ${monsterId}`);
        console.log(`   Position: (${Math.floor(monster.visualData.position.x)}, ${Math.floor(monster.visualData.position.y)})`);
        console.log(`   Proof URL: ${proof.proofUrl}`);
        
        // Emit monster spawn event
        this.emit('monster_spawned', { monster, proof });
        
        return monster;
    }
    
    /**
     * Generate visual proof that monster exists
     */
    async generateVisualProof(monster) {
        const template = this.monsterTemplates.get(monster.template);
        
        // Create proof document
        const proof = {
            monsterId: monster.id,
            timestamp: Date.now(),
            monsterName: template.name,
            originalError: monster.originalError,
            visualFingerprint: this.generateVisualFingerprint(monster),
            pixelHash: this.calculatePixelHash(template.pixelArt),
            proofUrl: `/monster-proof/${monster.id}`,
            verificationData: {
                pixelCount: this.countPixels(template.pixelArt),
                colorPalette: template.pixelArt.colors,
                dimensions: template.pixelArt.size,
                animations: template.visualProof.animations
            },
            // This makes it verifiable on your website
            websiteProof: {
                elementId: `monster_${monster.id}`,
                cssSelector: `.narrative-monster[data-id="${monster.id}"]`,
                htmlSnippet: this.generateMonsterHTML(monster),
                cssRules: this.generateMonsterCSS(monster)
            }
        };
        
        console.log(`📸 Visual proof generated for ${template.name}`);
        console.log(`   Pixel hash: ${proof.pixelHash}`);
        console.log(`   Element ID: ${proof.websiteProof.elementId}`);
        
        return proof;
    }
    
    /**
     * Generate visual fingerprint
     */
    generateVisualFingerprint(monster) {
        const data = JSON.stringify({
            template: monster.template,
            position: monster.visualData.position,
            scale: monster.visualData.scale,
            rotation: monster.visualData.rotation,
            spawnTime: monster.spawnTime
        });
        
        return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
    }
    
    /**
     * Calculate pixel art hash
     */
    calculatePixelHash(pixelArt) {
        const matrixData = JSON.stringify(pixelArt.matrix);
        return crypto.createHash('md5').update(matrixData).digest('hex').slice(0, 12);
    }
    
    /**
     * Count non-transparent pixels
     */
    countPixels(pixelArt) {
        let count = 0;
        for (let row of pixelArt.matrix) {
            for (let pixel of row) {
                if (pixel !== 'transparent') count++;
            }
        }
        return count;
    }
    
    /**
     * Generate HTML for monster display on website
     */
    generateMonsterHTML(monster) {
        const template = this.monsterTemplates.get(monster.template);
        
        return `
<div class="narrative-monster" data-id="${monster.id}" data-type="${monster.template}">
    <div class="monster-sprite" id="monster_${monster.id}">
        <canvas width="${template.size.width}" height="${template.size.height}" 
                class="monster-canvas" data-monster="${monster.id}"></canvas>
    </div>
    <div class="monster-info">
        <h3>${template.name}</h3>
        <p>${template.description}</p>
        <div class="monster-stats">
            <span class="difficulty">${template.difficulty || 'unknown'}</span>
            <span class="spawn-time">${new Date(monster.spawnTime).toLocaleTimeString()}</span>
        </div>
    </div>
    <div class="visual-proof">
        <small>Proof Hash: ${this.generateVisualFingerprint(monster)}</small>
    </div>
</div>`.trim();
    }
    
    /**
     * Generate CSS for monster display
     */
    generateMonsterCSS(monster) {
        const template = this.monsterTemplates.get(monster.template);
        const colors = template.pixelArt.colors;
        
        return `
.narrative-monster[data-id="${monster.id}"] {
    position: absolute;
    left: ${monster.visualData.position.x}px;
    top: ${monster.visualData.position.y}px;
    transform: scale(${monster.visualData.scale}) rotate(${monster.visualData.rotation}deg);
    opacity: ${monster.visualData.opacity};
    z-index: 100;
    pointer-events: auto;
    cursor: pointer;
}

.narrative-monster[data-id="${monster.id}"] .monster-sprite {
    filter: drop-shadow(0 0 10px ${colors.glow});
    animation: monster-${monster.template}-idle 2s infinite ease-in-out;
}

@keyframes monster-${monster.template}-idle {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
}

.narrative-monster[data-id="${monster.id}"]:hover {
    transform: scale(${monster.visualData.scale * 1.1}) rotate(${monster.visualData.rotation}deg);
    z-index: 200;
}`.trim();
    }
    
    /**
     * Get all active monsters for website display
     */
    getActiveMonsters() {
        return Array.from(this.activeVisuals.values()).map(monster => {
            const proof = this.visualProofs.get(monster.id);
            return {
                ...monster,
                proof: proof
            };
        });
    }
    
    /**
     * Generate website integration code
     */
    generateWebsiteIntegration() {
        const monsters = this.getActiveMonsters();
        
        const html = monsters.map(monster => monster.proof.websiteProof.htmlSnippet).join('\n');
        const css = monsters.map(monster => monster.proof.websiteProof.cssRules).join('\n\n');
        
        const javascript = `
// Narrative Monster Integration
class MonsterRenderer {
    constructor() {
        this.monsters = new Map();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    renderMonster(monsterId, pixelArt) {
        const canvas = document.querySelector(\`[data-monster="\${monsterId}"]\`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const matrix = pixelArt.matrix;
        const pixelSize = 2; // Scale factor
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render pixel art
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                const color = matrix[y][x];
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
                }
            }
        }
    }
    
    spawnMonster(monsterData) {
        // Add monster HTML to page
        const container = document.getElementById('monster-container') || document.body;
        container.insertAdjacentHTML('beforeend', monsterData.proof.websiteProof.htmlSnippet);
        
        // Render pixel art
        this.renderMonster(monsterData.id, monsterData.template.pixelArt);
        
        console.log('👾 Monster spawned on website:', monsterData.name);
    }
}

// Initialize monster renderer
const monsterRenderer = new MonsterRenderer();

// Auto-spawn monsters from errors
window.addEventListener('error', (event) => {
    console.log('🎯 Error detected - spawning monster...');
    // This would connect to your narrative system
});
        `;
        
        return {
            html: html,
            css: css,
            javascript: javascript,
            integration: `
<!-- Add to your website head -->
<style>${css}</style>

<!-- Add to your website body -->
<div id="monster-container">${html}</div>

<!-- Add before closing body tag -->
<script>${javascript}</script>
            `
        };
    }
    
    /**
     * Export visual proof data
     */
    exportVisualProofs() {
        const proofs = Array.from(this.visualProofs.values());
        
        return {
            totalMonsters: this.activeVisuals.size,
            proofs: proofs,
            generatedAt: Date.now(),
            visualIntegrity: this.verifyVisualIntegrity()
        };
    }
    
    /**
     * Verify visual integrity
     */
    verifyVisualIntegrity() {
        let valid = 0;
        let total = this.activeVisuals.size;
        
        for (const [id, monster] of this.activeVisuals) {
            const proof = this.visualProofs.get(id);
            if (proof && proof.pixelHash) {
                valid++;
            }
        }
        
        return {
            valid: valid,
            total: total,
            percentage: total > 0 ? Math.floor((valid / total) * 100) : 0
        };
    }
}

// Export for use in other systems
module.exports = NarrativeMonsterVisualizer;

// Demo functionality
if (require.main === module) {
    async function runDemo() {
        console.log('🎮 NARRATIVE MONSTER VISUALIZER DEMO\n');
        
        const visualizer = new NarrativeMonsterVisualizer();
        
        // Simulate various errors and convert to monsters
        const testErrors = [
            { code: 'ENOTFOUND', message: '404 Not Found' },
            { code: 'ECONNREFUSED', message: '403 Forbidden' },
            { message: '500 Internal Server Error' },
            { corruption: 0.9, type: 'vampire_corruption' }
        ];
        
        console.log('🎯 Converting errors to visual monsters...\n');
        
        for (let i = 0; i < testErrors.length; i++) {
            const error = testErrors[i];
            const monster = await visualizer.narrativeErrorToMonster(error, {
                url: `https://example.com/api/test${i}`,
                timestamp: Date.now()
            });
            
            if (monster) {
                console.log(`   ✅ Monster ${i + 1} spawned successfully`);
            }
            
            // Small delay for visibility
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Generate website integration
        console.log('\n🌐 Generating website integration...');
        const integration = visualizer.generateWebsiteIntegration();
        
        console.log('📝 Integration code ready:');
        console.log(`   HTML: ${integration.html.split('\\n').length} lines`);
        console.log(`   CSS: ${integration.css.split('\\n').length} lines`);
        console.log(`   JS: ${integration.javascript.split('\\n').length} lines`);
        
        // Export visual proofs
        console.log('\n📸 Exporting visual proofs...');
        const proofs = visualizer.exportVisualProofs();
        
        console.log(`📊 Visual Proof Summary:`);
        console.log(`   Total monsters: ${proofs.totalMonsters}`);
        console.log(`   Valid proofs: ${proofs.visualIntegrity.valid}/${proofs.visualIntegrity.total}`);
        console.log(`   Integrity: ${proofs.visualIntegrity.percentage}%`);
        
        console.log('\n✨ Monster visualization demo complete!');
        console.log('💡 Monsters are now verifiable pixels on your website');
        
        return { monsters: visualizer.getActiveMonsters(), integration, proofs };
    }
    
    runDemo().catch(console.error);
}
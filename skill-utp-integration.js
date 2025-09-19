#!/usr/bin/env node

/**
 * 🔗 SKILL-UTP INTEGRATION
 * Shows how the RuneScape skill system integrates with UTP
 */

const SkillEngine = require('./packages/skill-engine');
const UTPCore = require('./packages/utp-core');
const CALInterpreter = require('./packages/cal-interpreter');

// Initialize systems
const skillEngine = new SkillEngine();
const utpCore = new UTPCore();
const cal = new CALInterpreter();

/**
 * Skill-based zone navigation speed
 */
function getNavigationSpeed(agilityLevel) {
    // Higher agility = faster zone transitions
    const baseSpeed = 1000; // 1 second base
    const speedBonus = Math.max(0, (agilityLevel - 1) * 5); // 5ms per level
    return Math.max(100, baseSpeed - speedBonus); // Min 100ms
}

/**
 * Trading skill affects AMM rates
 */
function getTradingBonus(tradingLevel) {
    // Higher trading = better rates
    const baseBonus = 1.0;
    const levelBonus = tradingLevel * 0.001; // 0.1% per level
    return baseBonus + levelBonus;
}

/**
 * Construction level unlocks zone features
 */
function getZoneFeatures(constructionLevel) {
    const features = [];
    
    if (constructionLevel >= 20) features.push('personal_storage');
    if (constructionLevel >= 40) features.push('teleport_room');
    if (constructionLevel >= 60) features.push('private_altar');
    if (constructionLevel >= 80) features.push('party_room');
    if (constructionLevel >= 99) features.push('grand_exchange_portal', 'max_hosting');
    
    return features;
}

/**
 * Coding skill enables automation
 */
function getAutomationCapabilities(codingLevel) {
    const capabilities = [];
    
    if (codingLevel >= 30) capabilities.push('basic_scripts');
    if (codingLevel >= 50) capabilities.push('trading_bots');
    if (codingLevel >= 70) capabilities.push('zone_automation');
    if (codingLevel >= 90) capabilities.push('ai_assistants');
    
    return capabilities;
}

/**
 * Combat level for zone access
 */
function canAccessZone(zone, combatLevel) {
    const zoneRequirements = {
        'spawn': 1,
        'marketplace': 1,
        'tech_zone': 20,
        'crypto_exchange': 40,
        'security_citadel': 70,
        'deep_wilderness': 90
    };
    
    return combatLevel >= (zoneRequirements[zone] || 1);
}

/**
 * Integrate skill checks into CAL commands
 */
async function enhancedCALParse(input) {
    const command = await cal.parse(input);
    
    // Add skill requirements
    if (command.type === 'zone_navigation') {
        const playerSkills = skillEngine.getAllSkills();
        const agility = playerSkills.find(s => s.id === 'agility');
        const combat = playerSkills.find(s => s.id === 'combat');
        
        command.navigationSpeed = getNavigationSpeed(agility?.level || 1);
        command.canAccess = canAccessZone(command.target, combat?.level || 1);
    }
    
    if (command.type === 'amm_operation') {
        const trading = skillEngine.getAllSkills().find(s => s.id === 'trading');
        command.rateBonus = getTradingBonus(trading?.level || 1);
    }
    
    return command;
}

/**
 * Demo integration
 */
async function demo() {
    console.log('🔗 Skill-UTP Integration Demo\n');
    
    await skillEngine.initialize();
    
    // Show current skills
    const skills = skillEngine.getAllSkills();
    console.log('🎮 Current Skill Levels:');
    skills.forEach(skill => {
        console.log(`  ${skill.emoji} ${skill.name}: Level ${skill.level}`);
    });
    
    // Test zone navigation with agility
    const agility = skills.find(s => s.id === 'agility');
    const navSpeed = getNavigationSpeed(agility?.level || 1);
    console.log(`\n🏃 Navigation Speed: ${navSpeed}ms (Agility ${agility?.level || 1})`);
    
    // Test trading bonus
    const trading = skills.find(s => s.id === 'trading');
    const tradeBonus = getTradingBonus(trading?.level || 1);
    console.log(`💰 Trading Bonus: ${((tradeBonus - 1) * 100).toFixed(1)}% (Trading ${trading?.level || 1})`);
    
    // Test construction features
    const construction = skills.find(s => s.id === 'construction');
    const features = getZoneFeatures(construction?.level || 1);
    console.log(`🏠 Unlocked Features: ${features.join(', ') || 'none'} (Construction ${construction?.level || 1})`);
    
    // Test zone access
    const combat = skills.find(s => s.id === 'combat');
    console.log(`\n⚔️ Zone Access (Combat ${combat?.level || 1}):`);
    ['spawn', 'marketplace', 'tech_zone', 'crypto_exchange', 'security_citadel'].forEach(zone => {
        const canAccess = canAccessZone(zone, combat?.level || 1);
        console.log(`  ${zone}: ${canAccess ? '✅' : '❌'}`);
    });
    
    // Test CAL integration
    console.log('\n🗣️ Enhanced CAL Commands:');
    const testCommands = [
        'go to security citadel',
        'find best rate for ETH to USDC'
    ];
    
    for (const cmd of testCommands) {
        const enhanced = await enhancedCALParse(cmd);
        console.log(`  "${cmd}": ${JSON.stringify(enhanced, null, 2)}`);
    }
    
    await skillEngine.shutdown();
}

// Run demo if called directly
if (require.main === module) {
    demo().catch(console.error);
}

module.exports = {
    getNavigationSpeed,
    getTradingBonus,
    getZoneFeatures,
    getAutomationCapabilities,
    canAccessZone,
    enhancedCALParse
};
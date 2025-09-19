#!/usr/bin/env node

/**
 * 🧩 COMPONENT GRAPH SYSTEM (Simple Version)
 * Node-based platform building blocks that connect like SEO backlinking
 */

class ComponentGraph {
    constructor() {
        this.components = {
            'auth': { name: 'Authentication', dependencies: ['database'], buildTime: 30 },
            'database': { name: 'Database', dependencies: [], buildTime: 60 },
            'api': { name: 'REST API', dependencies: ['database'], buildTime: 90 },
            'frontend': { name: 'Frontend App', dependencies: ['api'], buildTime: 120 },
            'payments': { name: 'Payment System', dependencies: ['auth', 'database'], buildTime: 90 },
            'dashboard': { name: 'Dashboard', dependencies: ['auth', 'api'], buildTime: 60 },
            'notifications': { name: 'Notifications', dependencies: ['database'], buildTime: 60 }
        };
        
        console.log('🧩 Component Graph initialized with', Object.keys(this.components).length, 'components');
    }
    
    async getComponentsForPlatform(platformType) {
        const platformComponents = {
            'crypto-portfolio-tracker': ['auth', 'database', 'api', 'frontend', 'dashboard'],
            'online-store': ['auth', 'database', 'api', 'frontend', 'payments'],
            'social-network': ['auth', 'database', 'api', 'frontend', 'notifications']
        };
        
        const baseComponents = platformComponents[platformType] || ['auth', 'database', 'api', 'frontend'];
        const withDependencies = this.resolveDependencies(baseComponents);
        
        const components = withDependencies.map(id => ({
            id,
            ...this.components[id]
        }));
        
        const totalMinutes = components.reduce((sum, c) => sum + c.buildTime, 0);
        
        return {
            components,
            buildEstimate: {
                totalMinutes,
                totalHours: Math.round(totalMinutes / 60 * 10) / 10
            },
            platformType
        };
    }
    
    resolveDependencies(componentIds) {
        const resolved = new Set(componentIds);
        
        for (const componentId of componentIds) {
            const component = this.components[componentId];
            if (component) {
                for (const dep of component.dependencies) {
                    resolved.add(dep);
                }
            }
        }
        
        return Array.from(resolved);
    }
}

module.exports = ComponentGraph;

// Demo
if (require.main === module) {
    const demo = async () => {
        console.log('🧩 COMPONENT GRAPH DEMO (Simple)');
        console.log('=================================\n');
        
        const graph = new ComponentGraph();
        
        const platforms = ['crypto-portfolio-tracker', 'online-store', 'social-network'];
        
        for (const platform of platforms) {
            console.log(`\n🔍 Platform: ${platform}`);
            const result = await graph.getComponentsForPlatform(platform);
            
            console.log(`📦 Components (${result.components.length}):`);
            result.components.forEach((c, i) => {
                console.log(`  ${i + 1}. ${c.name} (${c.buildTime}min)`);
            });
            
            console.log(`⏱️  Total build time: ${result.buildEstimate.totalHours} hours`);
        }
    };
    
    demo().catch(console.error);
}
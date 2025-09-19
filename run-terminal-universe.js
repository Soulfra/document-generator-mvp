#!/usr/bin/env node

// SIMPLE TERMINAL UNIVERSE VIEWER
// No dependencies needed - pure console output

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class TerminalUniverse {
    constructor() {
        this.width = process.stdout.columns || 80;
        this.height = process.stdout.rows || 24;
        this.frame = 0;
        this.layers = [];
        this.connections = [];
        this.dataFlows = [];
        
        this.init();
    }
    
    init() {
        console.clear();
        this.buildUniverse();
    }
    
    buildUniverse() {
        const layers = [
            { id: 'quantum', name: 'QUANTUM CORE', symbol: '⚛️', color: COLORS.magenta, level: 8 },
            { id: 'meta', name: 'META LAYER', symbol: '🌌', color: COLORS.cyan, level: 7 },
            { id: '3d', name: '3D VISUALIZATION', symbol: '🎮', color: COLORS.blue, level: 6 },
            { id: 'xml', name: 'XML MAPPING', symbol: '📄', color: COLORS.yellow, level: 5 },
            { id: 'factions', name: 'FACTION SYSTEM', symbol: '🏛️', color: COLORS.green, level: 4 },
            { id: 'reasoning', name: 'REASONING ENGINES', symbol: '🧠', color: COLORS.cyan, level: 3 },
            { id: 'wallets', name: 'AI WALLETS', symbol: '💰', color: COLORS.yellow, level: 2 },
            { id: 'biometric', name: 'BIOMETRIC GUARDIAN', symbol: '🛡️', color: COLORS.red, level: 1 },
            { id: 'human', name: 'HUMAN (YOU)', symbol: '👤', color: COLORS.white, level: 0 }
        ];
        
        // Build each layer with delay
        layers.forEach((layer, index) => {
            setTimeout(() => {
                this.layers.push(layer);
                this.render();
                
                // Add connections
                if (index > 0) {
                    this.connections.push({
                        from: layers[index - 1].id,
                        to: layer.id
                    });
                }
                
                // Start data flows after all layers built
                if (index === layers.length - 1) {
                    setTimeout(() => this.startDataFlows(), 1000);
                }
            }, 500 * (index + 1));
        });
    }
    
    render() {
        console.clear();
        
        // Header
        console.log(COLORS.cyan + '╔' + '═'.repeat(this.width - 2) + '╗');
        console.log('║' + this.center('TERMINAL UNIVERSE SYSTEM') + '║');
        console.log('║' + this.center(`Frame: ${this.frame} | Layers: ${this.layers.length} | Flows: ${this.dataFlows.length}`) + '║');
        console.log('╚' + '═'.repeat(this.width - 2) + '╝' + COLORS.reset);
        console.log();
        
        // Draw universe structure
        this.drawUniverse();
        
        // Data flow log
        this.drawDataFlows();
        
        // Stats
        this.drawStats();
        
        this.frame++;
    }
    
    drawUniverse() {
        const centerX = Math.floor(this.width / 2);
        const centerY = 12;
        
        // Create empty canvas
        const canvas = Array(25).fill(null).map(() => Array(this.width).fill(' '));
        
        // Draw layers in circular pattern
        this.layers.forEach((layer, index) => {
            const angle = (index / 9) * Math.PI * 2 - Math.PI / 2;
            const radius = 8 + index * 2;
            
            const x = Math.floor(centerX + Math.cos(angle) * radius);
            const y = Math.floor(centerY + Math.sin(angle) * radius / 2);
            
            // Draw layer
            if (x >= 0 && x < this.width && y >= 0 && y < 25) {
                const text = `${layer.symbol} ${layer.name}`;
                for (let i = 0; i < text.length && x + i < this.width; i++) {
                    canvas[y][x + i] = text[i];
                }
            }
        });
        
        // Draw connections
        this.connections.forEach(conn => {
            const fromLayer = this.layers.find(l => l.id === conn.from);
            const toLayer = this.layers.find(l => l.id === conn.to);
            
            if (fromLayer && toLayer) {
                const fromIndex = this.layers.indexOf(fromLayer);
                const toIndex = this.layers.indexOf(toLayer);
                
                const angle1 = (fromIndex / 9) * Math.PI * 2 - Math.PI / 2;
                const angle2 = (toIndex / 9) * Math.PI * 2 - Math.PI / 2;
                
                const r1 = 8 + fromIndex * 2;
                const r2 = 8 + toIndex * 2;
                
                const x1 = Math.floor(centerX + Math.cos(angle1) * r1);
                const y1 = Math.floor(centerY + Math.sin(angle1) * r1 / 2);
                const x2 = Math.floor(centerX + Math.cos(angle2) * r2);
                const y2 = Math.floor(centerY + Math.sin(angle2) * r2 / 2);
                
                // Draw simple line
                this.drawLine(canvas, x1, y1, x2, y2, '·');
            }
        });
        
        // Print canvas
        canvas.forEach(row => {
            console.log(row.join(''));
        });
    }
    
    drawLine(canvas, x1, y1, x2, y2, char) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        while (true) {
            if (x1 >= 0 && x1 < this.width && y1 >= 0 && y1 < canvas.length) {
                if (canvas[y1][x1] === ' ') {
                    canvas[y1][x1] = char;
                }
            }
            
            if (x1 === x2 && y1 === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }
    }
    
    startDataFlows() {
        const flowTypes = [
            { type: 'BIOMETRIC', path: ['human', 'biometric', 'wallets'], color: COLORS.red },
            { type: 'REASONING', path: ['reasoning', 'factions', 'human'], color: COLORS.cyan },
            { type: 'DECISIONS', path: ['factions', 'xml', '3d'], color: COLORS.green },
            { type: 'META-VIEW', path: ['3d', 'meta', 'quantum'], color: COLORS.magenta },
            { type: 'QUANTUM-LOOP', path: ['quantum', 'meta', 'human'], color: COLORS.yellow }
        ];
        
        // Start continuous animation
        setInterval(() => {
            // Add new flow
            const flow = flowTypes[Math.floor(Math.random() * flowTypes.length)];
            this.dataFlows.push({
                ...flow,
                id: Date.now(),
                value: Math.floor(Math.random() * 1000)
            });
            
            // Keep only last 10 flows
            if (this.dataFlows.length > 10) {
                this.dataFlows.shift();
            }
            
            this.render();
        }, 1000);
    }
    
    drawDataFlows() {
        console.log();
        console.log(COLORS.yellow + '━━━ DATA FLOWS ━━━' + COLORS.reset);
        
        this.dataFlows.slice(-5).forEach(flow => {
            const timestamp = new Date(flow.id).toLocaleTimeString();
            console.log(
                flow.color + 
                `[${timestamp}] ${flow.type}: ${flow.path.join(' → ')} (${flow.value})` + 
                COLORS.reset
            );
        });
    }
    
    drawStats() {
        console.log();
        console.log(COLORS.green + '━━━ SYSTEM STATS ━━━' + COLORS.reset);
        
        const stats = [
            `Components: ${this.layers.length}`,
            `Connections: ${this.connections.length}`,
            `Active Flows: ${this.dataFlows.length}`,
            `Data Rate: ${this.dataFlows.reduce((sum, f) => sum + f.value, 0)} units/sec`
        ];
        
        stats.forEach(stat => {
            console.log(COLORS.white + stat + COLORS.reset);
        });
    }
    
    center(text) {
        const padding = Math.floor((this.width - text.length - 2) / 2);
        return ' '.repeat(padding) + text + ' '.repeat(this.width - text.length - padding - 2);
    }
}

// ASCII Art Banner
console.log(COLORS.cyan + `
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║    ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗      ║
║    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║      ║
║       ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║      ║
║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║      ║
║       ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗ ║
║       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝ ║
║                                                                        ║
║                    UNIVERSE SYSTEM - BUILDING FROM WITHIN              ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
` + COLORS.reset);

console.log(COLORS.yellow + '\nInitializing quantum core...\n' + COLORS.reset);

// Loading animation
const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let i = 0;

const loading = setInterval(() => {
    process.stdout.write(`\r${COLORS.magenta}${spinner[i]} Building universe from inside out...${COLORS.reset}`);
    i = (i + 1) % spinner.length;
}, 100);

// Start after 2 seconds
setTimeout(() => {
    clearInterval(loading);
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
    new TerminalUniverse();
}, 2000);

// Handle exit
process.on('SIGINT', () => {
    console.clear();
    console.log(COLORS.cyan + '\nUniverse collapsed. Goodbye! 👋\n' + COLORS.reset);
    process.exit(0);
});
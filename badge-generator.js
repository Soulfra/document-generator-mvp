#!/usr/bin/env node

/**
 * Badge Generator - Create visual badges and certificates for documents
 */

const fs = require('fs').promises;
const path = require('path');

class BadgeGenerator {
    constructor() {
        this.badges = {
            'ai-powered': {
                icon: '🤖',
                title: 'AI-Powered',
                description: 'Uses AI for intelligent automation',
                colors: ['#f093fb', '#f5576c']
            },
            'mvp-ready': {
                icon: '🚀',
                title: 'MVP Ready',
                description: 'Ready for rapid MVP development',
                colors: ['#4facfe', '#00f2fe']
            },
            'rapid-deploy': {
                icon: '⚡',
                title: 'Rapid Deploy',
                description: 'Deploy in under 30 minutes',
                colors: ['#fa709a', '#fee140']
            },
            'well-documented': {
                icon: '📚',
                title: 'Well Documented',
                description: 'Comprehensive documentation included',
                colors: ['#667eea', '#764ba2']
            },
            'test-ready': {
                icon: '✅',
                title: 'Test Ready',
                description: 'Includes test specifications',
                colors: ['#43e97b', '#38f9d7']
            },
            'scalable': {
                icon: '📈',
                title: 'Scalable',
                description: 'Built for growth and scale',
                colors: ['#f77062', '#fe5196']
            }
        };
    }

    async generateBadgeHTML(type) {
        const badge = this.badges[type];
        if (!badge) {
            console.error(`Badge type "${type}" not found`);
            return null;
        }

        return `
            <div class="badge-container" style="
                display: inline-block;
                text-align: center;
                margin: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div class="badge" style="
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, ${badge.colors[0]} 0%, ${badge.colors[1]} 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                    color: white;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                    margin: 0 auto;
                ">
                    ${badge.icon}
                </div>
                <h3 style="margin: 15px 0 5px 0; color: #2c3e50;">${badge.title}</h3>
                <p style="margin: 0; color: #7f8c8d; font-size: 14px;">${badge.description}</p>
            </div>
        `;
    }

    async generateBadgeSVG(type) {
        const badge = this.badges[type];
        if (!badge) return null;

        return `
            <svg width="200" height="250" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${badge.colors[0]};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${badge.colors[1]};stop-opacity:1" />
                    </linearGradient>
                    <filter id="shadow">
                        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-opacity="0.2"/>
                    </filter>
                </defs>
                
                <circle cx="100" cy="80" r="60" fill="url(#grad-${type})" filter="url(#shadow)"/>
                
                <text x="100" y="95" font-family="Arial" font-size="48" text-anchor="middle" fill="white">
                    ${badge.icon}
                </text>
                
                <text x="100" y="170" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#2c3e50">
                    ${badge.title}
                </text>
                
                <text x="100" y="195" font-family="Arial" font-size="12" text-anchor="middle" fill="#7f8c8d">
                    ${badge.description}
                </text>
            </svg>
        `;
    }

    async generateCertificate(documentTitle, achievements = []) {
        const achievementsList = achievements.length > 0 
            ? achievements.map(a => `<li>${a}</li>`).join('\n') 
            : '<li>Successfully documented and ready for MVP development</li>';

        return `
<!DOCTYPE html>
<html>
<head>
    <title>Document Generator Certificate</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: 'Georgia', serif;
            background: white;
        }
        
        .certificate {
            width: 297mm;
            height: 210mm;
            padding: 40px;
            box-sizing: border-box;
            position: relative;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .certificate-border {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 5px double #2c3e50;
            padding: 40px;
        }
        
        .certificate-content {
            text-align: center;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        h1 {
            font-size: 48px;
            color: #2c3e50;
            margin: 0 0 20px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        
        h2 {
            font-size: 32px;
            color: #3498db;
            margin: 0 0 30px 0;
            font-weight: normal;
        }
        
        .document-title {
            font-size: 36px;
            color: #2c3e50;
            margin: 30px 0;
            font-style: italic;
        }
        
        .achievements {
            font-size: 20px;
            margin: 30px auto;
            text-align: left;
            max-width: 600px;
        }
        
        .achievements ul {
            list-style: none;
            padding: 0;
        }
        
        .achievements li:before {
            content: "✓ ";
            color: #27ae60;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-around;
        }
        
        .signature-block {
            text-align: center;
        }
        
        .signature-line {
            width: 200px;
            border-bottom: 2px solid #2c3e50;
            margin: 0 auto 10px;
        }
        
        .date {
            font-size: 18px;
            color: #7f8c8d;
            margin-top: 20px;
        }
        
        .seal {
            position: absolute;
            bottom: 60px;
            right: 60px;
            width: 100px;
            height: 100px;
            background: #e74c3c;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: bold;
            box-shadow: 0 0 0 4px white, 0 0 0 6px #e74c3c;
            transform: rotate(-15deg);
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="certificate-border">
            <div class="certificate-content">
                <h1>Certificate of Completion</h1>
                <h2>Document Generator Platform</h2>
                
                <div class="document-title">
                    "${documentTitle}"
                </div>
                
                <p style="font-size: 24px; margin: 20px 0;">
                    This document has been successfully analyzed and verified as:
                </p>
                
                <div class="achievements">
                    <ul>
                        ${achievementsList}
                    </ul>
                </div>
                
                <div class="signature-section">
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <p>Platform Administrator</p>
                    </div>
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <p>AI Verification System</p>
                    </div>
                </div>
                
                <p class="date">Issued on ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
            </div>
        </div>
        
        <div class="seal">
            VERIFIED
        </div>
    </div>
</body>
</html>
        `;
    }

    async generateBadgePackHTML() {
        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Document Generator Badge Pack</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            background: #f5f7fa;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .badges-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 40px;
            max-width: 1000px;
            margin: 0 auto;
        }
        .download-all {
            text-align: center;
            margin-top: 40px;
        }
        .download-btn {
            padding: 12px 24px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            text-decoration: none;
            display: inline-block;
        }
        .download-btn:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 Document Generator Badge Collection</h1>
        <p>Recognition badges for your documented projects</p>
    </div>
    
    <div class="badges-grid">
        `;

        for (const [type, _] of Object.entries(this.badges)) {
            html += await this.generateBadgeHTML(type);
        }

        html += `
    </div>
    
    <div class="download-all">
        <button class="download-btn" onclick="window.print()">🖨️ Print Badge Collection</button>
    </div>
</body>
</html>
        `;

        return html;
    }

    async analyzeDocument(documentPath) {
        try {
            const content = await fs.readFile(documentPath, 'utf-8');
            const earnedBadges = [];

            // Check for AI-powered features
            if (content.match(/\bai\b|\bartificial intelligence\b|\bmachine learning\b/i)) {
                earnedBadges.push('ai-powered');
            }

            // Check for MVP readiness
            if (content.match(/\bfeatures?\b|\brequirements?\b|\buser stor/i)) {
                earnedBadges.push('mvp-ready');
            }

            // Check for deployment readiness
            if (content.match(/\btechnical\b|\barchitecture\b|\bapi\b/i)) {
                earnedBadges.push('rapid-deploy');
            }

            // Check for documentation quality
            if (content.match(/\b##\s+\w/gm)?.length > 3) {
                earnedBadges.push('well-documented');
            }

            // Check for test specifications
            if (content.match(/\btest\b|\bsuccess criteria\b|\bvalidation\b/i)) {
                earnedBadges.push('test-ready');
            }

            // Check for scalability mentions
            if (content.match(/\bscal\w+\b|\bgrowth\b|\bperformance\b/i)) {
                earnedBadges.push('scalable');
            }

            return earnedBadges;
        } catch (error) {
            console.error(`Error analyzing document: ${error.message}`);
            return [];
        }
    }
}

// CLI usage
async function main() {
    const args = process.argv.slice(2);
    const generator = new BadgeGenerator();

    if (args.length === 0) {
        console.log(`
🏆 Badge Generator - Create visual badges and certificates

Usage:
  node badge-generator.js <command> [options]

Commands:
  analyze <file>      Analyze document and show earned badges
  badge <type>        Generate a single badge
  certificate <file>  Generate achievement certificate
  pack                Generate all badges as HTML pack

Badge Types:
  ${Object.keys(generator.badges).join(', ')}

Examples:
  node badge-generator.js analyze test-document.md
  node badge-generator.js badge ai-powered
  node badge-generator.js certificate test-document.md
  node badge-generator.js pack
        `);
        return;
    }

    const command = args[0];

    try {
        switch (command) {
            case 'analyze': {
                const file = args[1];
                if (!file) {
                    console.error('Please provide a document file');
                    return;
                }
                
                const badges = await generator.analyzeDocument(file);
                console.log(`\n🎯 Document Analysis: ${file}`);
                console.log(`\n✅ Earned Badges (${badges.length}):\n`);
                
                for (const badge of badges) {
                    const b = generator.badges[badge];
                    console.log(`  ${b.icon} ${b.title} - ${b.description}`);
                }
                
                if (badges.length === 0) {
                    console.log('  No badges earned yet. Keep documenting!');
                }
                break;
            }

            case 'badge': {
                const type = args[1];
                if (!type || !generator.badges[type]) {
                    console.error(`Invalid badge type. Available: ${Object.keys(generator.badges).join(', ')}`);
                    return;
                }
                
                const svg = await generator.generateBadgeSVG(type);
                const filename = `badge-${type}.svg`;
                await fs.writeFile(filename, svg);
                console.log(`✅ Generated badge: ${filename}`);
                break;
            }

            case 'certificate': {
                const file = args[1];
                if (!file) {
                    console.error('Please provide a document file');
                    return;
                }
                
                const content = await fs.readFile(file, 'utf-8');
                const titleMatch = content.match(/^#\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1] : 'Untitled Document';
                
                const badges = await generator.analyzeDocument(file);
                const achievements = badges.map(b => `${generator.badges[b].title}: ${generator.badges[b].description}`);
                
                const certificate = await generator.generateCertificate(title, achievements);
                const filename = 'certificate.html';
                await fs.writeFile(filename, certificate);
                console.log(`✅ Generated certificate: ${filename}`);
                break;
            }

            case 'pack': {
                const pack = await generator.generateBadgePackHTML();
                const filename = 'badge-pack.html';
                await fs.writeFile(filename, pack);
                console.log(`✅ Generated badge pack: ${filename}`);
                break;
            }

            default:
                console.error(`Unknown command: ${command}`);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = BadgeGenerator;
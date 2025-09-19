#!/usr/bin/env node

/**
 * Magic Mode - Everything happens automatically!
 * The ultimate "5 year old" experience
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class MagicMode {
    constructor() {
        this.active = true;
        this.autoFix = true;
        this.smartSuggestions = true;
        this.instantPreview = true;
        this.voiceEnabled = false;
        this.learningMode = 'adaptive';
    }

    /**
     * Magic Build - Convert any input to a working project
     */
    async magicBuild(input) {
        console.log('🪄 Magic Mode: Processing your request...');
        
        // Step 1: Understand intent
        const intent = await this.understandIntent(input);
        
        // Step 2: Generate plan
        const plan = await this.generatePlan(intent);
        
        // Step 3: Create project
        const project = await this.createProject(plan);
        
        // Step 4: Auto-enhance
        const enhanced = await this.autoEnhance(project);
        
        // Step 5: Instant deploy
        const deployed = await this.instantDeploy(enhanced);
        
        return {
            success: true,
            project: deployed,
            preview: `http://localhost:3000/preview/${deployed.id}`,
            message: this.getSuccessMessage(intent)
        };
    }

    /**
     * Understand what the user wants
     */
    async understandIntent(input) {
        const lower = input.toLowerCase();
        
        // Smart pattern matching
        const patterns = {
            website: /website|site|page|landing|portfolio|blog/i,
            ecommerce: /store|shop|sell|product|commerce|buy/i,
            app: /app|application|dashboard|system|tool|platform/i,
            game: /game|play|fun|entertainment/i,
            ai: /ai|learn|teach|smart|intelligent/i,
            data: /data|chart|graph|analytics|report/i,
            social: /social|chat|message|community|forum/i,
            business: /business|company|startup|service/i
        };
        
        let type = 'website'; // default
        let features = [];
        let theme = 'modern';
        
        // Detect type
        for (const [key, pattern] of Object.entries(patterns)) {
            if (pattern.test(input)) {
                type = key;
                break;
            }
        }
        
        // Extract features
        if (lower.includes('form') || lower.includes('contact')) {
            features.push('contact-form');
        }
        if (lower.includes('pay') || lower.includes('stripe')) {
            features.push('payments');
        }
        if (lower.includes('user') || lower.includes('login')) {
            features.push('authentication');
        }
        if (lower.includes('mobile') || lower.includes('responsive')) {
            features.push('mobile-first');
        }
        
        // Detect theme/industry
        const themes = {
            tech: /tech|software|startup|app|digital/i,
            health: /health|medical|doctor|clinic|wellness|yoga|fitness/i,
            food: /food|restaurant|bakery|cafe|cuisine|chef/i,
            education: /education|school|learn|course|teach|academy/i,
            creative: /art|design|creative|studio|gallery|photography/i,
            business: /business|consulting|agency|corporate|professional/i,
            retail: /shop|store|boutique|fashion|retail/i,
            travel: /travel|tour|vacation|hotel|booking/i
        };
        
        for (const [key, pattern] of Object.entries(themes)) {
            if (pattern.test(input)) {
                theme = key;
                break;
            }
        }
        
        // Extract specific requirements
        const requirements = {
            name: this.extractName(input),
            colors: this.extractColors(input),
            pages: this.extractPages(input),
            style: this.extractStyle(input)
        };
        
        return {
            type,
            features,
            theme,
            requirements,
            originalInput: input
        };
    }

    /**
     * Generate a smart plan based on intent
     */
    async generatePlan(intent) {
        const plan = {
            name: intent.requirements.name || `My Amazing ${intent.type}`,
            type: intent.type,
            theme: intent.theme,
            structure: [],
            technologies: [],
            timeline: 'instant',
            autoFeatures: []
        };
        
        // Add base structure
        switch (intent.type) {
            case 'website':
                plan.structure = ['home', 'about', 'services', 'contact'];
                plan.technologies = ['html', 'css', 'javascript'];
                break;
            case 'ecommerce':
                plan.structure = ['home', 'products', 'cart', 'checkout', 'account'];
                plan.technologies = ['react', 'stripe', 'database'];
                plan.autoFeatures.push('shopping-cart', 'product-search');
                break;
            case 'app':
                plan.structure = ['dashboard', 'features', 'settings', 'profile'];
                plan.technologies = ['react', 'api', 'database'];
                break;
        }
        
        // Add requested features
        plan.features = [...intent.features, ...this.suggestFeatures(intent)];
        
        // Add theme-specific elements
        plan.design = this.generateDesign(intent.theme, intent.requirements);
        
        return plan;
    }

    /**
     * Suggest smart features based on project type
     */
    suggestFeatures(intent) {
        const suggestions = {
            website: ['seo-optimized', 'fast-loading', 'contact-form'],
            ecommerce: ['inventory-management', 'order-tracking', 'reviews'],
            app: ['user-dashboard', 'notifications', 'api-integration'],
            business: ['appointment-booking', 'testimonials', 'team-section'],
            health: ['appointment-system', 'patient-portal', 'resources'],
            food: ['menu-display', 'online-ordering', 'reservations']
        };
        
        const features = [];
        
        // Add type-specific features
        if (suggestions[intent.type]) {
            features.push(...suggestions[intent.type]);
        }
        
        // Add theme-specific features
        if (suggestions[intent.theme]) {
            features.push(...suggestions[intent.theme]);
        }
        
        return [...new Set(features)]; // Remove duplicates
    }

    /**
     * Generate design based on theme
     */
    generateDesign(theme, requirements) {
        const designs = {
            modern: {
                colors: ['#667eea', '#764ba2', '#f7fafc'],
                fonts: ['Inter', 'system-ui'],
                style: 'clean-minimal'
            },
            tech: {
                colors: ['#4299e1', '#3182ce', '#1a202c'],
                fonts: ['Roboto', 'monospace'],
                style: 'futuristic'
            },
            health: {
                colors: ['#48bb78', '#38a169', '#f0fff4'],
                fonts: ['Open Sans', 'sans-serif'],
                style: 'calming-professional'
            },
            food: {
                colors: ['#ed8936', '#dd6b20', '#fffaf0'],
                fonts: ['Playfair Display', 'serif'],
                style: 'warm-inviting'
            },
            creative: {
                colors: ['#9f7aea', '#805ad5', '#faf5ff'],
                fonts: ['Montserrat', 'sans-serif'],
                style: 'bold-artistic'
            }
        };
        
        const design = designs[theme] || designs.modern;
        
        // Override with user preferences
        if (requirements.colors) {
            design.colors = requirements.colors;
        }
        if (requirements.style) {
            design.style = requirements.style;
        }
        
        return design;
    }

    /**
     * Create the actual project
     */
    async createProject(plan) {
        const projectId = `project-${Date.now()}`;
        const projectPath = path.join('outputs', projectId);
        
        // Create project directory
        await fs.mkdir(projectPath, { recursive: true });
        
        // Generate all files
        const files = await this.generateFiles(plan);
        
        // Write files
        for (const [filename, content] of Object.entries(files)) {
            await fs.writeFile(path.join(projectPath, filename), content);
        }
        
        // Create project metadata
        const metadata = {
            id: projectId,
            name: plan.name,
            type: plan.type,
            created: new Date().toISOString(),
            plan: plan,
            path: projectPath
        };
        
        await fs.writeFile(
            path.join(projectPath, 'project.json'),
            JSON.stringify(metadata, null, 2)
        );
        
        return metadata;
    }

    /**
     * Generate all project files
     */
    async generateFiles(plan) {
        const files = {};
        
        // Generate HTML
        files['index.html'] = this.generateHTML(plan);
        
        // Generate CSS
        files['styles.css'] = this.generateCSS(plan);
        
        // Generate JavaScript
        files['script.js'] = this.generateJS(plan);
        
        // Generate additional pages
        for (const page of plan.structure) {
            if (page !== 'home') {
                files[`${page}.html`] = this.generatePage(page, plan);
            }
        }
        
        // Generate README
        files['README.md'] = this.generateReadme(plan);
        
        return files;
    }

    /**
     * Auto-enhance the project with smart features
     */
    async autoEnhance(project) {
        console.log('✨ Auto-enhancing your project...');
        
        // Add animations
        await this.addAnimations(project);
        
        // Optimize performance
        await this.optimizePerformance(project);
        
        // Add accessibility
        await this.improveAccessibility(project);
        
        // Add PWA features
        await this.addPWAFeatures(project);
        
        // Add SEO
        await this.optimizeSEO(project);
        
        return project;
    }

    /**
     * Instant deploy for preview
     */
    async instantDeploy(project) {
        // Create symlink for instant preview
        const previewPath = path.join('public/preview', project.id);
        
        try {
            await fs.symlink(
                path.resolve(project.path),
                path.resolve(previewPath),
                'junction' // Works on all platforms
            );
        } catch (error) {
            // Fallback: copy files
            await this.copyDir(project.path, previewPath);
        }
        
        project.previewUrl = `/preview/${project.id}`;
        project.liveUrl = `http://localhost:3000/preview/${project.id}`;
        
        return project;
    }

    /**
     * Get a friendly success message
     */
    getSuccessMessage(intent) {
        const messages = {
            website: "🎉 Your beautiful website is ready! It looks amazing!",
            ecommerce: "🛍️ Your online store is open for business!",
            app: "📱 Your app is ready to change the world!",
            game: "🎮 Your game is ready to play!",
            default: "✨ Your project is ready! It turned out great!"
        };
        
        return messages[intent.type] || messages.default;
    }

    /**
     * Extract helpers
     */
    extractName(input) {
        const namePattern = /(?:called|named|for|my)\s+([A-Za-z0-9\s]+?)(?:\s+website|\s+app|\s+store|\.|\,|$)/i;
        const match = input.match(namePattern);
        return match ? match[1].trim() : null;
    }

    extractColors(input) {
        const colors = [];
        const colorWords = {
            blue: '#3b82f6',
            red: '#ef4444',
            green: '#10b981',
            purple: '#8b5cf6',
            pink: '#ec4899',
            yellow: '#f59e0b',
            orange: '#f97316',
            dark: '#1f2937',
            light: '#f9fafb'
        };
        
        for (const [word, hex] of Object.entries(colorWords)) {
            if (input.toLowerCase().includes(word)) {
                colors.push(hex);
            }
        }
        
        return colors.length > 0 ? colors : null;
    }

    extractPages(input) {
        const pages = [];
        const pageWords = ['about', 'contact', 'services', 'products', 'blog', 'portfolio', 'team', 'pricing'];
        
        for (const page of pageWords) {
            if (input.toLowerCase().includes(page)) {
                pages.push(page);
            }
        }
        
        return pages.length > 0 ? pages : null;
    }

    extractStyle(input) {
        const styles = {
            modern: /modern|minimal|clean|simple/i,
            classic: /classic|traditional|elegant|timeless/i,
            fun: /fun|playful|colorful|vibrant/i,
            professional: /professional|corporate|business|serious/i
        };
        
        for (const [style, pattern] of Object.entries(styles)) {
            if (pattern.test(input)) {
                return style;
            }
        }
        
        return null;
    }

    /**
     * HTML Generator
     */
    generateHTML(plan) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${plan.name}</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=${plan.design.fonts[0].replace(' ', '+')}:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">${plan.name}</div>
            <ul class="nav-links">
                ${plan.structure.map(page => 
                    `<li><a href="${page === 'home' ? 'index' : page}.html">${this.capitalize(page)}</a></li>`
                ).join('\n                ')}
            </ul>
            <button class="mobile-toggle">☰</button>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <div class="hero-content">
                <h1 class="hero-title">Welcome to ${plan.name}</h1>
                <p class="hero-subtitle">Your amazing ${plan.type} is here!</p>
                <button class="cta-button">Get Started</button>
            </div>
        </section>
        
        ${this.generateSections(plan)}
    </main>
    
    <footer class="footer">
        <p>&copy; 2024 ${plan.name}. Built with AI magic ✨</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`;
    }

    /**
     * Generate page sections based on features
     */
    generateSections(plan) {
        const sections = [];
        
        // Features section
        if (plan.features.length > 0) {
            sections.push(`
        <section class="features">
            <div class="container">
                <h2>Features</h2>
                <div class="feature-grid">
                    ${plan.features.slice(0, 3).map(feature => `
                    <div class="feature-card">
                        <div class="feature-icon">${this.getFeatureIcon(feature)}</div>
                        <h3>${this.formatFeatureName(feature)}</h3>
                        <p>${this.getFeatureDescription(feature)}</p>
                    </div>
                    `).join('')}
                </div>
            </div>
        </section>`);
        }
        
        // CTA section
        sections.push(`
        <section class="cta-section">
            <div class="container">
                <h2>Ready to Get Started?</h2>
                <p>Join us today and experience the difference!</p>
                <button class="cta-button">Start Now</button>
            </div>
        </section>`);
        
        return sections.join('\n');
    }

    /**
     * CSS Generator
     */
    generateCSS(plan) {
        const [primary, secondary, background] = plan.design.colors;
        const font = plan.design.fonts[0];
        
        return `/* ${plan.name} Styles - AI Generated */

:root {
    --primary: ${primary};
    --secondary: ${secondary};
    --background: ${background};
    --text: #1a202c;
    --text-light: #718096;
    --white: #ffffff;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: '${font}', sans-serif;
    line-height: 1.6;
    color: var(--text);
    background: var(--background);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
.header {
    background: var(--white);
    box-shadow: var(--shadow);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
}

.logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    color: var(--text);
    text-decoration: none;
    transition: color 0.3s;
}

.nav-links a:hover {
    color: var(--primary);
}

.mobile-toggle {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
}

/* Hero */
.hero {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: var(--white);
    padding: 100px 20px;
    text-align: center;
}

.hero-title {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 0.8s ease-out;
}

.hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 0.8s ease-out 0.2s both;
}

.cta-button {
    background: var(--white);
    color: var(--primary);
    border: none;
    padding: 15px 40px;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s;
    animation: fadeInUp 0.8s ease-out 0.4s both;
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

/* Features */
.features {
    padding: 80px 20px;
}

.features h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: var(--text);
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: var(--white);
    padding: 2rem;
    border-radius: 10px;
    box-shadow: var(--shadow);
    text-align: center;
    transition: transform 0.3s;
}

.feature-card:hover {
    transform: translateY(-5px);
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text);
}

.feature-card p {
    color: var(--text-light);
    line-height: 1.8;
}

/* CTA Section */
.cta-section {
    background: var(--background);
    padding: 80px 20px;
    text-align: center;
}

.cta-section h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--text);
}

.cta-section p {
    font-size: 1.25rem;
    color: var(--text-light);
    margin-bottom: 2rem;
}

/* Footer */
.footer {
    background: var(--text);
    color: var(--white);
    padding: 2rem;
    text-align: center;
}

/* Animations */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .nav-links {
        display: none;
    }
    
    .mobile-toggle {
        display: block;
    }
    
    .hero-title {
        font-size: 2rem;
    }
    
    .feature-grid {
        grid-template-columns: 1fr;
    }
}`;
    }

    /**
     * JavaScript Generator
     */
    generateJS(plan) {
        return `// ${plan.name} - Interactive Features

// Mobile menu toggle
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');

mobileToggle?.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        target?.scrollIntoView({ behavior: 'smooth' });
    });
});

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
});

// CTA button interactions
document.querySelectorAll('.cta-button').forEach(button => {
    button.addEventListener('click', () => {
        alert('🎉 Thank you for your interest! This is where your custom action would happen.');
    });
});

// Add some magic ✨
console.log('✨ Built with AI Magic by Document Generator');`;
    }

    /**
     * Helper methods
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getFeatureIcon(feature) {
        const icons = {
            'contact-form': '📧',
            'payments': '💳',
            'authentication': '🔐',
            'mobile-first': '📱',
            'seo-optimized': '🔍',
            'fast-loading': '⚡',
            'shopping-cart': '🛒',
            'product-search': '🔎',
            'user-dashboard': '📊',
            'notifications': '🔔',
            'api-integration': '🔌'
        };
        return icons[feature] || '✨';
    }

    formatFeatureName(feature) {
        return feature.split('-').map(word => this.capitalize(word)).join(' ');
    }

    getFeatureDescription(feature) {
        const descriptions = {
            'contact-form': 'Easy way for customers to reach you',
            'payments': 'Secure payment processing with Stripe',
            'authentication': 'User accounts and secure login',
            'mobile-first': 'Looks great on all devices',
            'seo-optimized': 'Ranked well in search engines',
            'fast-loading': 'Lightning fast performance',
            'shopping-cart': 'Full e-commerce functionality',
            'product-search': 'Find products instantly',
            'user-dashboard': 'Personal control center',
            'notifications': 'Stay updated in real-time',
            'api-integration': 'Connects with other services'
        };
        return descriptions[feature] || 'Amazing feature for your success';
    }

    async copyDir(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDir(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    generatePage(pageName, plan) {
        // Generate additional pages with consistent structure
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.capitalize(pageName)} - ${plan.name}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">${plan.name}</div>
            <ul class="nav-links">
                ${plan.structure.map(page => 
                    `<li><a href="${page === 'home' ? 'index' : page}.html"${page === pageName ? ' class="active"' : ''}>${this.capitalize(page)}</a></li>`
                ).join('\n                ')}
            </ul>
            <button class="mobile-toggle">☰</button>
        </nav>
    </header>
    
    <main>
        <section class="page-header">
            <div class="container">
                <h1>${this.capitalize(pageName)}</h1>
            </div>
        </section>
        
        <section class="content">
            <div class="container">
                ${this.generatePageContent(pageName, plan)}
            </div>
        </section>
    </main>
    
    <footer class="footer">
        <p>&copy; 2024 ${plan.name}. Built with AI magic ✨</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`;
    }

    generatePageContent(pageName, plan) {
        const content = {
            about: `
                <h2>Our Story</h2>
                <p>Welcome to ${plan.name}! We're passionate about creating amazing experiences.</p>
                <p>Our journey began with a simple idea: to make a difference in the ${plan.theme} industry.</p>
            `,
            services: `
                <h2>What We Offer</h2>
                <div class="services-grid">
                    <div class="service-item">
                        <h3>Premium Service</h3>
                        <p>Top-quality solutions tailored to your needs.</p>
                    </div>
                    <div class="service-item">
                        <h3>Expert Support</h3>
                        <p>Our team is here to help you succeed.</p>
                    </div>
                    <div class="service-item">
                        <h3>Innovation</h3>
                        <p>Cutting-edge solutions for modern challenges.</p>
                    </div>
                </div>
            `,
            contact: `
                <h2>Get in Touch</h2>
                <div class="contact-form">
                    <form>
                        <input type="text" placeholder="Your Name" required>
                        <input type="email" placeholder="Your Email" required>
                        <textarea placeholder="Your Message" rows="5" required></textarea>
                        <button type="submit" class="cta-button">Send Message</button>
                    </form>
                </div>
            `,
            products: `
                <h2>Our Products</h2>
                <div class="products-grid">
                    ${[1,2,3,4].map(i => `
                    <div class="product-card">
                        <div class="product-image">📦</div>
                        <h3>Product ${i}</h3>
                        <p>Amazing product that will change your life!</p>
                        <button class="cta-button">Learn More</button>
                    </div>
                    `).join('')}
                </div>
            `
        };
        
        return content[pageName] || `<p>Content for ${pageName} coming soon!</p>`;
    }

    generateReadme(plan) {
        return `# ${plan.name}

Built with AI Magic by Document Generator! ✨

## About

${plan.name} is a ${plan.type} focused on ${plan.theme}.

## Features

${plan.features.map(f => `- ${this.formatFeatureName(f)}`).join('\n')}

## Getting Started

1. Open index.html in your browser
2. Enjoy your new ${plan.type}!

## Customization

Feel free to modify any files to match your vision.

## Credits

Created instantly with Document Generator's AI Magic Mode 🪄`;
    }

    /**
     * Enhancement methods
     */
    async addAnimations(project) {
        // Add CSS animations to existing files
        const cssPath = path.join(project.path, 'styles.css');
        const css = await fs.readFile(cssPath, 'utf-8');
        
        const animations = `

/* Magic Animations */
.animate-in {
    animation: fadeInUp 0.6s ease-out both;
}

.hero-title, .hero-subtitle, .cta-button {
    animation: fadeInUp 0.8s ease-out both;
}

.hero-subtitle {
    animation-delay: 0.2s;
}

.cta-button {
    animation-delay: 0.4s;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.cta-button:hover {
    animation: pulse 0.5s ease-in-out infinite;
}`;
        
        await fs.writeFile(cssPath, css + animations);
    }

    async optimizePerformance(project) {
        // Add performance optimizations
        const htmlPath = path.join(project.path, 'index.html');
        let html = await fs.readFile(htmlPath, 'utf-8');
        
        // Add preload for fonts
        html = html.replace('</head>', `    <link rel="preload" href="styles.css" as="style">
    <link rel="preload" href="script.js" as="script">
</head>`);
        
        await fs.writeFile(htmlPath, html);
    }

    async improveAccessibility(project) {
        // Add ARIA labels and improve accessibility
        const htmlPath = path.join(project.path, 'index.html');
        let html = await fs.readFile(htmlPath, 'utf-8');
        
        // Add ARIA labels
        html = html.replace('<nav class="nav">', '<nav class="nav" role="navigation" aria-label="Main navigation">');
        html = html.replace('<main>', '<main role="main">');
        
        await fs.writeFile(htmlPath, html);
    }

    async addPWAFeatures(project) {
        // Add manifest.json for PWA
        const manifest = {
            name: project.plan.name,
            short_name: project.plan.name,
            description: `${project.plan.name} - Built with AI`,
            start_url: "/",
            display: "standalone",
            background_color: project.plan.design.colors[2],
            theme_color: project.plan.design.colors[0],
            icons: [
                {
                    src: "/icon-192.png",
                    sizes: "192x192",
                    type: "image/png"
                }
            ]
        };
        
        await fs.writeFile(
            path.join(project.path, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        // Add to HTML
        const htmlPath = path.join(project.path, 'index.html');
        let html = await fs.readFile(htmlPath, 'utf-8');
        html = html.replace('</head>', '    <link rel="manifest" href="manifest.json">\n</head>');
        await fs.writeFile(htmlPath, html);
    }

    async optimizeSEO(project) {
        // Add SEO meta tags
        const htmlPath = path.join(project.path, 'index.html');
        let html = await fs.readFile(htmlPath, 'utf-8');
        
        const seoTags = `    <meta name="description" content="${project.plan.name} - Your amazing ${project.plan.type}">
    <meta property="og:title" content="${project.plan.name}">
    <meta property="og:description" content="Built with AI magic">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">`;
        
        html = html.replace('<link rel="stylesheet"', seoTags + '\n    <link rel="stylesheet"');
        await fs.writeFile(htmlPath, html);
    }
}

// Export for use
module.exports = MagicMode;

// CLI support
if (require.main === module) {
    const magic = new MagicMode();
    const input = process.argv.slice(2).join(' ');
    
    if (input) {
        magic.magicBuild(input).then(result => {
            console.log('\n✨ Success!', result.message);
            console.log('Preview:', result.preview);
        }).catch(console.error);
    } else {
        console.log('Usage: node magic-mode.js "I want a website for my bakery"');
    }
}
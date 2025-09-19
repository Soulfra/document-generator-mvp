#!/usr/bin/env node

/**
 * Text Morphing Engine for Floating Widget
 * 
 * Analyzes surrounding text and images to morph the widget appearance
 * in WordArt-style effects, matching colors, fonts, and textures.
 * 
 * Features:
 * - Surrounding content analysis
 * - Color extraction and matching
 * - Font detection and adaptation
 * - WordArt-style effects
 * - Certificate/trademark special handling
 * - Dynamic texture mapping
 * - Context-aware styling
 * - Smooth morphing transitions
 */

const EventEmitter = require('events');

class TextMorphingEngine extends EventEmitter {
    constructor(widget, config = {}) {
        super();
        
        this.widget = widget;
        
        this.config = {
            // Analysis settings
            analysis: {
                scanRadius: config.scanRadius || 300,           // Pixels around widget to analyze
                updateInterval: config.updateInterval || 1000,  // How often to check for changes
                minContentLength: 50,                          // Minimum text length to analyze
                maxElements: 20,                               // Max elements to analyze
                weightByDistance: true,                        // Closer elements have more influence
                respectViewport: true                          // Only analyze visible content
            },
            
            // Color analysis
            color: {
                extractionMethod: 'dominant',                  // 'dominant', 'average', 'palette'
                paletteSize: 5,                               // Number of colors in extracted palette
                contrastThreshold: 0.3,                       // Minimum contrast for text
                saturationBoost: 1.2,                        // Enhance color saturation
                brightnessAdjust: 1.1,                       // Brightness adjustment
                colorBlending: 'multiply'                     // How to blend colors
            },
            
            // Font analysis
            font: {
                detectFontFamily: true,
                detectFontSize: true,
                detectFontWeight: true,
                detectTextShadow: true,
                inheritTextEffects: true,
                maxFontSize: 48,                             // Max font size for adaptation
                minFontSize: 12                              // Min font size for adaptation
            },
            
            // WordArt effects
            wordArt: {
                enabled: true,
                effects: [
                    'gradient',
                    'shadow',
                    'outline',
                    'emboss',
                    'bevel',
                    'glow',
                    'reflection',
                    'texture'
                ],
                intensity: 0.8,                              // Effect intensity (0-1)
                animationSpeed: 0.5,                         // Speed of effect transitions
                layerBlending: 'normal'                      // CSS blend mode
            },
            
            // Morphing behavior
            morphing: {
                transitionDuration: 1000,                    // Transition time in ms
                easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // CSS easing function
                morphThreshold: 0.3,                         // Min difference to trigger morph
                maxMorphs: 3,                                // Max morphs per second
                preserveReadability: true,                   // Ensure text remains readable
                gracefulDegradation: true                    // Fallback for unsupported effects
            },
            
            // Special handling
            special: {
                certificateElements: [
                    '.certificate',
                    '.diploma',
                    '.award',
                    '[data-certificate]',
                    '.trademark',
                    '.brand-mark'
                ],
                logoElements: [
                    '.logo',
                    '.brand',
                    'svg',
                    '[data-logo]'
                ],
                headingElements: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                buttonElements: ['button', '.btn', '[role="button"]']
            },
            
            // Debug options
            debug: config.debug || false
        };
        
        this.state = {
            // Current analysis
            currentContext: null,
            surroundingElements: [],
            dominantColors: [],
            dominantFonts: [],
            contentType: 'unknown',
            
            // Morphing state
            activeMorph: null,
            morphTarget: null,
            morphProgress: 0,
            morphHistory: [],
            
            // Analysis cache
            analysisCache: new Map(),
            colorCache: new Map(),
            fontCache: new Map(),
            
            // Performance tracking
            lastAnalysis: 0,
            analysisCount: 0,
            morphCount: 0,
            
            // Element references
            widgetElement: null,
            canvasElement: null,
            
            // Animation state
            animationFrame: null,
            isAnalyzing: false,
            isMorphing: false
        };
        
        // Initialize the morphing engine
        this.initializeMorphingEngine();
        
        console.log('🎨 Text Morphing Engine initialized');
        console.log(`📏 Scan radius: ${this.config.analysis.scanRadius}px`);
        console.log(`🎭 Available effects: ${this.config.wordArt.effects.join(', ')}`);
    }
    
    /**
     * Initialize the morphing engine
     */
    async initializeMorphingEngine() {
        try {
            // Get widget element reference
            this.state.widgetElement = this.widget.elements?.widget;
            
            if (!this.state.widgetElement) {
                throw new Error('Widget element not found');
            }
            
            // Create analysis canvas for color extraction
            this.createAnalysisCanvas();
            
            // Setup content observers
            this.setupContentObservers();
            
            // Start analysis loop
            this.startAnalysisLoop();
            
            // Setup widget position observer
            this.observeWidgetPosition();
            
            console.log('✅ Morphing engine ready');
            this.emit('morphing:ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize morphing engine:', error);
            throw error;
        }
    }
    
    /**
     * Create canvas for image analysis
     */
    createAnalysisCanvas() {
        this.state.canvasElement = document.createElement('canvas');
        this.state.canvasElement.width = 100;
        this.state.canvasElement.height = 100;
        this.state.canvasElement.style.display = 'none';
        document.body.appendChild(this.state.canvasElement);
        
        console.log('🖼️ Analysis canvas created');
    }
    
    /**
     * Setup content observers for dynamic analysis
     */
    setupContentObservers() {
        // Observe DOM changes
        this.domObserver = new MutationObserver((mutations) => {
            let shouldReanalyze = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || 
                    mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    shouldReanalyze = true;
                }
            });
            
            if (shouldReanalyze) {
                this.scheduleAnalysis();
            }
        });
        
        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        // Observe scroll for viewport changes
        window.addEventListener('scroll', () => {
            this.scheduleAnalysis();
        });
        
        // Observe resize
        window.addEventListener('resize', () => {
            this.scheduleAnalysis();
        });
        
        console.log('👁️ Content observers setup');
    }
    
    /**
     * Start the analysis loop
     */
    startAnalysisLoop() {
        const analysisLoop = () => {
            if (this.shouldAnalyze()) {
                this.performAnalysis();
            }
            
            // Schedule next analysis
            setTimeout(analysisLoop, this.config.analysis.updateInterval);
        };
        
        analysisLoop();
        console.log('🔄 Analysis loop started');
    }
    
    /**
     * Check if analysis should be performed
     */
    shouldAnalyze() {
        const now = Date.now();
        const timeSinceLastAnalysis = now - this.state.lastAnalysis;
        
        return !this.state.isAnalyzing && 
               timeSinceLastAnalysis >= this.config.analysis.updateInterval &&
               this.widget.state.isActive &&
               this.widget.state.isVisible;
    }
    
    /**
     * Schedule analysis (debounced)
     */
    scheduleAnalysis() {
        if (this.analysisTimeout) {
            clearTimeout(this.analysisTimeout);
        }
        
        this.analysisTimeout = setTimeout(() => {
            if (this.shouldAnalyze()) {
                this.performAnalysis();
            }
        }, 100);
    }
    
    /**
     * Perform content analysis around widget
     */
    async performAnalysis() {
        if (this.state.isAnalyzing) return;
        
        this.state.isAnalyzing = true;
        this.state.lastAnalysis = Date.now();
        this.state.analysisCount++;
        
        try {
            // Get widget position
            const widgetRect = this.getWidgetBounds();
            
            // Find surrounding elements
            const surroundingElements = this.findSurroundingElements(widgetRect);
            
            // Analyze content
            const analysis = await this.analyzeContent(surroundingElements);
            
            // Check if significant change occurred
            if (this.hasSignificantChange(analysis)) {
                // Apply morphing
                await this.applyMorphing(analysis);
            }
            
            // Update state
            this.state.currentContext = analysis;
            this.state.surroundingElements = surroundingElements;
            
            if (this.config.debug) {
                console.log('🔍 Analysis complete:', {
                    elements: surroundingElements.length,
                    colors: analysis.colors?.length,
                    fonts: analysis.fonts?.length,
                    contentType: analysis.contentType
                });
            }
            
            this.emit('morphing:analyzed', analysis);
            
        } catch (error) {
            console.error('❌ Analysis error:', error);
        } finally {
            this.state.isAnalyzing = false;
        }
    }
    
    /**
     * Get widget bounds
     */
    getWidgetBounds() {
        if (!this.state.widgetElement) {
            return { x: 0, y: 0, width: 100, height: 100 };
        }
        
        const rect = this.state.widgetElement.getBoundingClientRect();
        return {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2
        };
    }
    
    /**
     * Find elements surrounding the widget
     */
    findSurroundingElements(widgetRect) {
        const scanRadius = this.config.analysis.scanRadius;
        const elements = [];
        
        // Get all visible elements
        const allElements = document.querySelectorAll('*');
        
        for (let element of allElements) {
            // Skip invisible elements
            if (!this.isElementVisible(element)) continue;
            
            // Skip the widget itself
            if (element.contains(this.state.widgetElement) || 
                this.state.widgetElement.contains(element)) continue;
            
            const rect = element.getBoundingClientRect();
            const distance = this.calculateDistance(widgetRect, rect);
            
            // Only include elements within scan radius
            if (distance <= scanRadius) {
                const weight = this.config.analysis.weightByDistance ? 
                    Math.max(0, 1 - (distance / scanRadius)) : 1;
                
                elements.push({
                    element,
                    rect,
                    distance,
                    weight,
                    content: this.extractElementContent(element)
                });
            }
        }
        
        // Sort by relevance (combination of distance and content importance)
        return elements
            .sort((a, b) => {
                const scoreA = a.weight * this.getElementImportance(a.element);
                const scoreB = b.weight * this.getElementImportance(b.element);
                return scoreB - scoreA;
            })
            .slice(0, this.config.analysis.maxElements);
    }
    
    /**
     * Check if element is visible
     */
    isElementVisible(element) {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               rect.width > 0 &&
               rect.height > 0 &&
               (this.config.analysis.respectViewport ? 
                rect.bottom > 0 && rect.top < window.innerHeight : true);
    }
    
    /**
     * Calculate distance between widget and element
     */
    calculateDistance(widgetRect, elementRect) {
        const dx = Math.max(0, 
            Math.max(elementRect.left - (widgetRect.x + widgetRect.width),
                     widgetRect.x - (elementRect.left + elementRect.width))
        );
        
        const dy = Math.max(0,
            Math.max(elementRect.top - (widgetRect.y + widgetRect.height),
                     widgetRect.y - (elementRect.top + elementRect.height))
        );
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Extract content from element
     */
    extractElementContent(element) {
        const tagName = element.tagName.toLowerCase();
        
        // Text content
        const textContent = element.textContent?.trim() || '';
        
        // Computed styles
        const styles = getComputedStyle(element);
        
        // Image content
        let imageData = null;
        if (tagName === 'img' && element.complete) {
            imageData = this.extractImageData(element);
        }
        
        return {
            tagName,
            textContent,
            styles: {
                color: styles.color,
                backgroundColor: styles.backgroundColor,
                fontFamily: styles.fontFamily,
                fontSize: styles.fontSize,
                fontWeight: styles.fontWeight,
                textShadow: styles.textShadow,
                background: styles.background,
                backgroundImage: styles.backgroundImage
            },
            imageData,
            isHeading: this.config.special.headingElements.includes(tagName),
            isCertificate: this.isCertificateElement(element),
            isLogo: this.isLogoElement(element),
            isButton: this.isButtonElement(element)
        };
    }
    
    /**
     * Extract image color data
     */
    extractImageData(imgElement) {
        try {
            const canvas = this.state.canvasElement;
            const ctx = canvas.getContext('2d');
            
            // Draw image to canvas
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Extract colors
            const colors = this.extractColorsFromImageData(imageData);
            
            return {
                width: imgElement.naturalWidth,
                height: imgElement.naturalHeight,
                colors,
                dominantColor: colors[0]
            };
        } catch (error) {
            if (this.config.debug) {
                console.warn('Image analysis failed:', error);
            }
            return null;
        }
    }
    
    /**
     * Extract colors from image data
     */
    extractColorsFromImageData(imageData) {
        const data = imageData.data;
        const colorCounts = new Map();
        
        // Sample pixels (every 4th pixel for performance)
        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Quantize colors (reduce to 64 levels per channel)
            const qr = Math.floor(r / 4) * 4;
            const qg = Math.floor(g / 4) * 4;
            const qb = Math.floor(b / 4) * 4;
            
            const colorKey = `${qr},${qg},${qb}`;
            colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
        }
        
        // Sort by frequency and return top colors
        return Array.from(colorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.config.color.paletteSize)
            .map(([color]) => {
                const [r, g, b] = color.split(',').map(Number);
                return { r, g, b };
            });
    }
    
    /**
     * Get element importance score
     */
    getElementImportance(element) {
        let importance = 1;
        
        const tagName = element.tagName.toLowerCase();
        const classList = Array.from(element.classList);
        
        // Heading importance
        if (this.config.special.headingElements.includes(tagName)) {
            importance *= 3;
        }
        
        // Logo/brand importance
        if (this.isLogoElement(element)) {
            importance *= 2.5;
        }
        
        // Certificate importance
        if (this.isCertificateElement(element)) {
            importance *= 4;
        }
        
        // Text content importance
        const textLength = element.textContent?.trim().length || 0;
        if (textLength > this.config.analysis.minContentLength) {
            importance *= 1.5;
        }
        
        // Visual prominence
        const styles = getComputedStyle(element);
        if (parseFloat(styles.fontSize) > 20) {
            importance *= 1.3;
        }
        
        return importance;
    }
    
    /**
     * Check if element is a certificate
     */
    isCertificateElement(element) {
        const selectors = this.config.special.certificateElements;
        return selectors.some(selector => {
            if (selector.startsWith('.')) {
                return element.classList.contains(selector.slice(1));
            } else if (selector.startsWith('[') && selector.endsWith(']')) {
                const attr = selector.slice(1, -1);
                return element.hasAttribute(attr);
            } else {
                return element.tagName.toLowerCase() === selector;
            }
        });
    }
    
    /**
     * Check if element is a logo
     */
    isLogoElement(element) {
        const selectors = this.config.special.logoElements;
        return selectors.some(selector => {
            if (selector.startsWith('.')) {
                return element.classList.contains(selector.slice(1));
            } else if (selector.startsWith('[') && selector.endsWith(']')) {
                const attr = selector.slice(1, -1);
                return element.hasAttribute(attr);
            } else {
                return element.tagName.toLowerCase() === selector;
            }
        });
    }
    
    /**
     * Check if element is a button
     */
    isButtonElement(element) {
        const selectors = this.config.special.buttonElements;
        return selectors.some(selector => {
            if (selector.startsWith('.')) {
                return element.classList.contains(selector.slice(1));
            } else if (selector.startsWith('[') && selector.endsWith(']')) {
                const attr = selector.slice(1, -1).split('=')[0];
                return element.hasAttribute(attr);
            } else {
                return element.tagName.toLowerCase() === selector;
            }
        });
    }
    
    /**
     * Analyze collected content
     */
    async analyzeContent(surroundingElements) {
        const analysis = {
            timestamp: Date.now(),
            elementCount: surroundingElements.length,
            colors: [],
            fonts: [],
            contentType: 'mixed',
            specialElements: {
                certificates: [],
                logos: [],
                headings: [],
                buttons: []
            },
            dominantStyle: null,
            recommendations: []
        };
        
        // Analyze colors
        analysis.colors = this.analyzeColors(surroundingElements);
        
        // Analyze fonts
        analysis.fonts = this.analyzeFonts(surroundingElements);
        
        // Determine content type
        analysis.contentType = this.determineContentType(surroundingElements);
        
        // Categorize special elements
        this.categorizeSpecialElements(surroundingElements, analysis.specialElements);
        
        // Determine dominant style
        analysis.dominantStyle = this.determineDominantStyle(analysis);
        
        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);
        
        return analysis;
    }
    
    /**
     * Analyze colors from surrounding elements
     */
    analyzeColors(elements) {
        const colorFrequency = new Map();
        
        elements.forEach(({ element, weight, content }) => {
            // Text color
            if (content.styles.color && content.styles.color !== 'rgba(0, 0, 0, 0)') {
                this.addColorToFrequency(colorFrequency, content.styles.color, weight);
            }
            
            // Background color
            if (content.styles.backgroundColor && content.styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                this.addColorToFrequency(colorFrequency, content.styles.backgroundColor, weight);
            }
            
            // Image colors
            if (content.imageData && content.imageData.colors) {
                content.imageData.colors.forEach(color => {
                    const colorString = `rgb(${color.r}, ${color.g}, ${color.b})`;
                    this.addColorToFrequency(colorFrequency, colorString, weight * 0.5);
                });
            }
        });
        
        // Convert to sorted array
        return Array.from(colorFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.config.color.paletteSize)
            .map(([color, frequency]) => ({
                color,
                frequency,
                rgb: this.parseColor(color)
            }));
    }
    
    /**
     * Add color to frequency map
     */
    addColorToFrequency(frequencyMap, colorString, weight) {
        const normalized = this.normalizeColor(colorString);
        if (normalized) {
            frequencyMap.set(normalized, (frequencyMap.get(normalized) || 0) + weight);
        }
    }
    
    /**
     * Normalize color string
     */
    normalizeColor(colorString) {
        try {
            // Create temporary element to parse color
            const temp = document.createElement('div');
            temp.style.color = colorString;
            document.body.appendChild(temp);
            const computed = getComputedStyle(temp).color;
            document.body.removeChild(temp);
            return computed;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Parse color string to RGB values
     */
    parseColor(colorString) {
        const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1
            };
        }
        return null;
    }
    
    /**
     * Analyze fonts from surrounding elements
     */
    analyzeFonts(elements) {
        const fontFrequency = new Map();
        
        elements.forEach(({ element, weight, content }) => {
            if (content.textContent.length < 3) return; // Skip very short text
            
            const fontInfo = {
                family: content.styles.fontFamily,
                size: parseFloat(content.styles.fontSize),
                weight: content.styles.fontWeight,
                shadow: content.styles.textShadow
            };
            
            const fontKey = `${fontInfo.family}|${fontInfo.weight}`;
            
            if (!fontFrequency.has(fontKey)) {
                fontFrequency.set(fontKey, {
                    ...fontInfo,
                    frequency: 0,
                    totalSize: 0,
                    elements: []
                });
            }
            
            const font = fontFrequency.get(fontKey);
            font.frequency += weight;
            font.totalSize += fontInfo.size * weight;
            font.elements.push(element);
        });
        
        // Calculate average sizes and sort by frequency
        return Array.from(fontFrequency.values())
            .map(font => ({
                ...font,
                averageSize: font.totalSize / font.frequency
            }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);
    }
    
    /**
     * Determine content type from surrounding elements
     */
    determineContentType(elements) {
        let scores = {
            certificate: 0,
            logo: 0,
            heading: 0,
            article: 0,
            button: 0,
            mixed: 0
        };
        
        elements.forEach(({ element, weight, content }) => {
            if (content.isCertificate) {
                scores.certificate += weight * 4;
            } else if (content.isLogo) {
                scores.logo += weight * 3;
            } else if (content.isHeading) {
                scores.heading += weight * 2;
            } else if (content.isButton) {
                scores.button += weight * 2;
            } else if (content.textContent.length > 100) {
                scores.article += weight;
            } else {
                scores.mixed += weight * 0.5;
            }
        });
        
        // Return type with highest score
        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])[0][0];
    }
    
    /**
     * Categorize special elements
     */
    categorizeSpecialElements(elements, specialElements) {
        elements.forEach(({ element, content }) => {
            if (content.isCertificate) {
                specialElements.certificates.push(element);
            }
            if (content.isLogo) {
                specialElements.logos.push(element);
            }
            if (content.isHeading) {
                specialElements.headings.push(element);
            }
            if (content.isButton) {
                specialElements.buttons.push(element);
            }
        });
    }
    
    /**
     * Determine dominant style
     */
    determineDominantStyle(analysis) {
        const style = {
            primaryColor: analysis.colors[0]?.color || '#4ecca3',
            secondaryColor: analysis.colors[1]?.color || '#e94560',
            accentColor: analysis.colors[2]?.color || '#f47068',
            fontFamily: analysis.fonts[0]?.family || 'Arial, sans-serif',
            fontSize: analysis.fonts[0]?.averageSize || 16,
            fontWeight: analysis.fonts[0]?.weight || 'normal'
        };
        
        // Adjust based on content type
        switch (analysis.contentType) {
            case 'certificate':
                style.effect = 'emboss';
                style.intensity = 0.9;
                break;
            case 'logo':
                style.effect = 'gradient';
                style.intensity = 0.8;
                break;
            case 'heading':
                style.effect = 'shadow';
                style.intensity = 0.7;
                break;
            case 'button':
                style.effect = 'bevel';
                style.intensity = 0.6;
                break;
            default:
                style.effect = 'glow';
                style.intensity = 0.5;
        }
        
        return style;
    }
    
    /**
     * Generate styling recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.colors.length > 0) {
            recommendations.push({
                type: 'color',
                action: 'apply_color_scheme',
                colors: analysis.colors.slice(0, 3).map(c => c.color)
            });
        }
        
        if (analysis.fonts.length > 0) {
            recommendations.push({
                type: 'font',
                action: 'match_typography',
                fontFamily: analysis.fonts[0].family,
                fontSize: Math.min(analysis.fonts[0].averageSize * 1.2, this.config.font.maxFontSize)
            });
        }
        
        if (analysis.specialElements.certificates.length > 0) {
            recommendations.push({
                type: 'effect',
                action: 'apply_certificate_style',
                effect: 'emboss',
                intensity: 0.9
            });
        }
        
        return recommendations;
    }
    
    /**
     * Check if analysis represents significant change
     */
    hasSignificantChange(newAnalysis) {
        if (!this.state.currentContext) return true;
        
        const old = this.state.currentContext;
        
        // Compare dominant colors
        const colorChange = this.compareColors(
            old.colors[0]?.color,
            newAnalysis.colors[0]?.color
        );
        
        // Compare content type
        const typeChange = old.contentType !== newAnalysis.contentType;
        
        // Compare font
        const fontChange = old.fonts[0]?.family !== newAnalysis.fonts[0]?.family;
        
        return colorChange > this.config.morphing.morphThreshold || typeChange || fontChange;
    }
    
    /**
     * Compare colors and return difference (0-1)
     */
    compareColors(color1, color2) {
        if (!color1 || !color2) return 1;
        
        const rgb1 = this.parseColor(color1);
        const rgb2 = this.parseColor(color2);
        
        if (!rgb1 || !rgb2) return 1;
        
        const rDiff = Math.abs(rgb1.r - rgb2.r) / 255;
        const gDiff = Math.abs(rgb1.g - rgb2.g) / 255;
        const bDiff = Math.abs(rgb1.b - rgb2.b) / 255;
        
        return (rDiff + gDiff + bDiff) / 3;
    }
    
    /**
     * Apply morphing based on analysis
     */
    async applyMorphing(analysis) {
        if (this.state.isMorphing) return;
        
        this.state.isMorphing = true;
        this.state.morphCount++;
        
        try {
            const dominantStyle = analysis.dominantStyle;
            
            // Apply WordArt effects
            await this.applyWordArtEffects(dominantStyle);
            
            // Apply color scheme
            this.applyColorScheme(dominantStyle);
            
            // Apply font styling
            this.applyFontStyling(dominantStyle);
            
            // Update morph state
            this.state.activeMorph = dominantStyle;
            this.state.morphTarget = analysis;
            
            if (this.config.debug) {
                console.log('🎭 Morphing applied:', {
                    effect: dominantStyle.effect,
                    primaryColor: dominantStyle.primaryColor,
                    contentType: analysis.contentType
                });
            }
            
            this.emit('morphing:applied', dominantStyle);
            
        } catch (error) {
            console.error('❌ Morphing error:', error);
        } finally {
            this.state.isMorphing = false;
        }
    }
    
    /**
     * Apply WordArt effects
     */
    async applyWordArtEffects(style) {
        if (!this.config.wordArt.enabled) return;
        
        const widget = this.state.widgetElement;
        const effect = style.effect;
        const intensity = style.intensity;
        
        // Base transition
        widget.style.transition = `all ${this.config.morphing.transitionDuration}ms ${this.config.morphing.easing}`;
        
        // Apply effect based on type
        switch (effect) {
            case 'gradient':
                this.applyGradientEffect(widget, style);
                break;
            case 'shadow':
                this.applyShadowEffect(widget, style);
                break;
            case 'emboss':
                this.applyEmbossEffect(widget, style);
                break;
            case 'bevel':
                this.applyBevelEffect(widget, style);
                break;
            case 'glow':
                this.applyGlowEffect(widget, style);
                break;
            case 'outline':
                this.applyOutlineEffect(widget, style);
                break;
        }
    }
    
    /**
     * Apply gradient effect
     */
    applyGradientEffect(widget, style) {
        const primary = style.primaryColor;
        const secondary = style.secondaryColor;
        const accent = style.accentColor;
        
        widget.style.background = `linear-gradient(135deg, ${primary} 0%, ${secondary} 50%, ${accent} 100%)`;
    }
    
    /**
     * Apply shadow effect
     */
    applyShadowEffect(widget, style) {
        const intensity = style.intensity;
        const shadowSize = Math.floor(intensity * 20);
        const shadowBlur = Math.floor(intensity * 30);
        
        widget.style.boxShadow = `
            0 ${shadowSize}px ${shadowBlur}px rgba(0, 0, 0, 0.3),
            0 0 ${shadowBlur}px ${style.primaryColor}80
        `;
    }
    
    /**
     * Apply emboss effect
     */
    applyEmbossEffect(widget, style) {
        const intensity = style.intensity;
        
        widget.style.boxShadow = `
            inset -2px -2px 4px rgba(0, 0, 0, ${intensity * 0.3}),
            inset 2px 2px 4px rgba(255, 255, 255, ${intensity * 0.2})
        `;
        widget.style.background = style.primaryColor;
    }
    
    /**
     * Apply bevel effect
     */
    applyBevelEffect(widget, style) {
        const intensity = style.intensity;
        
        widget.style.boxShadow = `
            inset 0 1px 3px rgba(255, 255, 255, ${intensity * 0.5}),
            inset 0 -1px 3px rgba(0, 0, 0, ${intensity * 0.3}),
            0 4px 8px rgba(0, 0, 0, 0.2)
        `;
    }
    
    /**
     * Apply glow effect
     */
    applyGlowEffect(widget, style) {
        const intensity = style.intensity;
        const glowSize = Math.floor(intensity * 15);
        
        widget.style.boxShadow = `
            0 0 ${glowSize}px ${style.primaryColor},
            0 0 ${glowSize * 2}px ${style.primaryColor}40,
            0 4px 8px rgba(0, 0, 0, 0.2)
        `;
    }
    
    /**
     * Apply outline effect
     */
    applyOutlineEffect(widget, style) {
        const intensity = style.intensity;
        const outlineWidth = Math.floor(intensity * 3);
        
        widget.style.border = `${outlineWidth}px solid ${style.secondaryColor}`;
        widget.style.outline = `${outlineWidth}px solid ${style.accentColor}`;
        widget.style.outlineOffset = `${outlineWidth}px`;
    }
    
    /**
     * Apply color scheme
     */
    applyColorScheme(style) {
        // This is handled within the effect applications
    }
    
    /**
     * Apply font styling
     */
    applyFontStyling(style) {
        const characterElement = this.state.widgetElement.querySelector('.widget-character');
        if (!characterElement) return;
        
        // Apply font changes to character text
        characterElement.style.fontFamily = style.fontFamily;
        characterElement.style.fontWeight = style.fontWeight;
        
        // Adjust size based on analysis
        const adaptedSize = Math.min(
            Math.max(style.fontSize * 0.8, this.config.font.minFontSize),
            this.config.font.maxFontSize
        );
        
        characterElement.style.fontSize = `${adaptedSize}px`;
    }
    
    /**
     * Observe widget position changes
     */
    observeWidgetPosition() {
        if (!this.widget.state) return;
        
        let lastPosition = { ...this.widget.state.position };
        
        const positionObserver = () => {
            const currentPosition = this.widget.state.position;
            
            if (currentPosition.x !== lastPosition.x || currentPosition.y !== lastPosition.y) {
                // Widget moved, schedule new analysis
                this.scheduleAnalysis();
                lastPosition = { ...currentPosition };
            }
            
            requestAnimationFrame(positionObserver);
        };
        
        positionObserver();
    }
    
    /**
     * Get morphing status
     */
    getStatus() {
        return {
            isAnalyzing: this.state.isAnalyzing,
            isMorphing: this.state.isMorphing,
            analysisCount: this.state.analysisCount,
            morphCount: this.state.morphCount,
            currentContext: this.state.currentContext,
            activeMorph: this.state.activeMorph,
            surroundingElements: this.state.surroundingElements.length
        };
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.domObserver) {
            this.domObserver.disconnect();
        }
        
        if (this.analysisTimeout) {
            clearTimeout(this.analysisTimeout);
        }
        
        if (this.state.canvasElement) {
            this.state.canvasElement.remove();
        }
        
        console.log('🎨 Text Morphing Engine destroyed');
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextMorphingEngine;
} else if (typeof window !== 'undefined') {
    window.TextMorphingEngine = TextMorphingEngine;
}

console.log('🎨 Text Morphing Engine loaded');
console.log('🎭 WordArt-style effects ready for dynamic content adaptation');
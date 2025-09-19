/**
 * i18n Translation Engine
 * Multi-language support infrastructure for the RuneScape Educational Platform
 * Enables global reach for book publishing on Goodreads, Storygraph, and other platforms
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

class I18nTranslationEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Supported languages for book platforms
            languages: {
                'en': { name: 'English', nativeName: 'English', isRTL: false, goodreadsMarket: 'en' },
                'es': { name: 'Spanish', nativeName: 'Español', isRTL: false, goodreadsMarket: 'es' },
                'fr': { name: 'French', nativeName: 'Français', isRTL: false, goodreadsMarket: 'fr' },
                'de': { name: 'German', nativeName: 'Deutsch', isRTL: false, goodreadsMarket: 'de' },
                'ja': { name: 'Japanese', nativeName: '日本語', isRTL: false, goodreadsMarket: 'ja' },
                'ko': { name: 'Korean', nativeName: '한국어', isRTL: false, goodreadsMarket: 'ko' },
                'zh': { name: 'Chinese', nativeName: '中文', isRTL: false, goodreadsMarket: 'zh' },
                'pt': { name: 'Portuguese', nativeName: 'Português', isRTL: false, goodreadsMarket: 'pt' },
                'it': { name: 'Italian', nativeName: 'Italiano', isRTL: false, goodreadsMarket: 'it' },
                'ru': { name: 'Russian', nativeName: 'Русский', isRTL: false, goodreadsMarket: 'ru' },
                'ar': { name: 'Arabic', nativeName: 'العربية', isRTL: true, goodreadsMarket: 'ar' },
                'hi': { name: 'Hindi', nativeName: 'हिन्दी', isRTL: false, goodreadsMarket: 'hi' }
            },
            
            // Translation providers
            translationProviders: {
                primary: {
                    name: 'DeepL',
                    apiKey: process.env.DEEPL_API_KEY,
                    endpoint: 'https://api.deepl.com/v2/translate',
                    supportedLanguages: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt', 'it', 'ru']
                },
                fallback: {
                    name: 'Google Translate',
                    apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
                    endpoint: 'https://translation.googleapis.com/language/translate/v2',
                    supportedLanguages: 'all'
                },
                educational: {
                    name: 'Educational Context API',
                    apiKey: process.env.EDUCATIONAL_TRANSLATION_API_KEY,
                    endpoint: 'https://api.educational-translate.com/v1',
                    specializedFor: ['customer-service', 'financial-literacy', 'gaming-terms']
                }
            },
            
            // Translation settings
            translationSettings: {
                cacheEnabled: true,
                cacheTTL: 604800000, // 7 days
                batchSize: 100, // Max texts per batch
                contextAware: true,
                preserveFormatting: true,
                educationalAdaptation: true
            },
            
            // Book-specific localization
            bookLocalization: {
                // Title formats for different markets
                titleFormats: {
                    'en': '{title}: {subtitle}',
                    'ja': '『{title}』{subtitle}',
                    'zh': '《{title}》{subtitle}',
                    'de': '{title} - {subtitle}',
                    'fr': '{title} : {subtitle}'
                },
                
                // Author name formatting
                authorFormats: {
                    'ja': '{lastName} {firstName}',
                    'ko': '{lastName} {firstName}',
                    'zh': '{lastName}{firstName}',
                    'default': '{firstName} {lastName}'
                },
                
                // Genre translations for book platforms
                genreTranslations: {
                    'Educational Gaming': {
                        'en': 'Educational Gaming',
                        'es': 'Juegos Educativos',
                        'fr': 'Jeux Éducatifs',
                        'de': 'Bildungsspiele',
                        'ja': '教育ゲーム',
                        'ko': '교육 게임',
                        'zh': '教育游戏'
                    },
                    'Self-Help': {
                        'en': 'Self-Help',
                        'es': 'Autoayuda',
                        'fr': 'Développement Personnel',
                        'de': 'Selbsthilfe',
                        'ja': '自己啓発',
                        'ko': '자기계발',
                        'zh': '自助'
                    }
                }
            },
            
            // Educational content adaptations
            educationalAdaptations: {
                // Cultural learning style preferences
                learningStyles: {
                    'en': 'practical-examples',
                    'ja': 'structured-progression',
                    'de': 'theoretical-foundation',
                    'es': 'collaborative-learning',
                    'zh': 'memorization-practice',
                    'ko': 'competitive-achievement'
                },
                
                // Localized examples
                localizedExamples: {
                    currency: {
                        'en': 'USD',
                        'es': 'EUR',
                        'ja': 'JPY',
                        'zh': 'CNY',
                        'ko': 'KRW'
                    },
                    customerService: {
                        'en': 'retail',
                        'ja': 'omotenashi',
                        'de': 'kundenbetreuung',
                        'fr': 'service-client'
                    }
                }
            },
            
            // Storage paths
            storagePaths: {
                translations: path.join(__dirname, 'translations'),
                cache: path.join(__dirname, 'translation-cache'),
                books: path.join(__dirname, 'localized-books')
            },
            
            ...config
        };
        
        // Translation memory and cache
        this.translationMemory = new Map();
        this.translationCache = new Map();
        this.pendingTranslations = new Map();
        
        // Educational term glossary
        this.educationalGlossary = new Map();
        this.gameTermGlossary = new Map();
        
        // Book metadata translations
        this.bookMetadata = new Map();
        
        // Statistics
        this.stats = {
            translationsCompleted: 0,
            cacheHits: 0,
            apiCalls: 0,
            languageDistribution: new Map()
        };
        
        console.log('🌐 i18n Translation Engine initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Create necessary directories
            await this.createDirectories();
            
            // Load translation memory
            await this.loadTranslationMemory();
            
            // Load educational glossaries
            await this.loadGlossaries();
            
            // Initialize translation providers
            await this.initializeProviders();
            
            // Start cache management
            this.startCacheManagement();
            
            console.log('✅ i18n Translation Engine ready');
            console.log(`🌍 Supporting ${Object.keys(this.config.languages).length} languages`);
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize i18n engine:', error);
            throw error;
        }
    }
    
    async createDirectories() {
        for (const dir of Object.values(this.config.storagePaths)) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async loadTranslationMemory() {
        try {
            const memoryFile = path.join(this.config.storagePaths.translations, 'memory.json');
            const data = await fs.readFile(memoryFile, 'utf8');
            const memory = JSON.parse(data);
            
            for (const [key, translations] of Object.entries(memory)) {
                this.translationMemory.set(key, translations);
            }
            
            console.log(`📚 Loaded ${this.translationMemory.size} translation memories`);
        } catch (error) {
            console.log('📝 Starting with empty translation memory');
        }
    }
    
    async loadGlossaries() {
        // Load RuneScape/gaming terms
        this.gameTermGlossary.set('GP', {
            'en': 'GP (Gold Pieces)',
            'es': 'PO (Piezas de Oro)',
            'ja': 'GP (ゴールド)',
            'de': 'GM (Goldmünzen)',
            'fr': 'PO (Pièces d\'Or)',
            'zh': '金币',
            'ko': 'GP (골드)'
        });
        
        this.gameTermGlossary.set('Grand Exchange', {
            'en': 'Grand Exchange',
            'es': 'Gran Mercado',
            'ja': 'グランドエクスチェンジ',
            'de': 'Große Markthalle',
            'fr': 'Grande Bourse',
            'zh': '大交易所',
            'ko': '그랜드 익스체인지'
        });
        
        // Load educational terms
        this.educationalGlossary.set('customer service', {
            'en': 'customer service',
            'es': 'atención al cliente',
            'ja': 'カスタマーサービス',
            'de': 'Kundenservice',
            'fr': 'service client',
            'zh': '客户服务',
            'ko': '고객 서비스'
        });
        
        this.educationalGlossary.set('financial literacy', {
            'en': 'financial literacy',
            'es': 'educación financiera',
            'ja': '金融リテラシー',
            'de': 'Finanzbildung',
            'fr': 'éducation financière',
            'zh': '金融素养',
            'ko': '금융 문해력'
        });
        
        console.log(`📖 Loaded ${this.gameTermGlossary.size} game terms and ${this.educationalGlossary.size} educational terms`);
    }
    
    async initializeProviders() {
        // Validate API keys
        const providers = this.config.translationProviders;
        
        if (!providers.primary.apiKey && !providers.fallback.apiKey) {
            console.warn('⚠️  No translation API keys configured - using mock translations');
            this.useMockTranslations = true;
        }
        
        console.log('🔗 Translation providers initialized');
    }
    
    startCacheManagement() {
        // Periodic cache cleanup
        setInterval(() => {
            this.cleanupCache();
        }, 3600000); // Every hour
        
        // Save translation memory periodically
        setInterval(() => {
            this.saveTranslationMemory();
        }, 300000); // Every 5 minutes
    }
    
    // ==================== TRANSLATION METHODS ====================
    
    async translate(text, targetLanguage, options = {}) {
        const {
            sourceLanguage = 'en',
            context = 'general',
            preserveTerms = true,
            useCache = true
        } = options;
        
        // Check if translation needed
        if (sourceLanguage === targetLanguage) {
            return text;
        }
        
        // Check cache
        const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage, context);
        if (useCache && this.translationCache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.translationCache.get(cacheKey);
        }
        
        // Check translation memory
        const memoryKey = `${sourceLanguage}:${text}`;
        if (this.translationMemory.has(memoryKey)) {
            const memories = this.translationMemory.get(memoryKey);
            if (memories[targetLanguage]) {
                this.stats.cacheHits++;
                return memories[targetLanguage];
            }
        }
        
        // Perform translation
        let translated;
        if (this.useMockTranslations) {
            translated = await this.mockTranslate(text, targetLanguage, context);
        } else {
            translated = await this.performTranslation(text, sourceLanguage, targetLanguage, context);
        }
        
        // Apply educational adaptations
        if (options.educational) {
            translated = await this.applyEducationalAdaptations(translated, targetLanguage, context);
        }
        
        // Cache result
        this.translationCache.set(cacheKey, translated);
        this.updateTranslationMemory(text, sourceLanguage, targetLanguage, translated);
        
        this.stats.translationsCompleted++;
        this.updateLanguageStats(targetLanguage);
        
        return translated;
    }
    
    async translateBatch(texts, targetLanguage, options = {}) {
        const results = [];
        const uniqueTexts = [...new Set(texts)];
        
        // Split into batches
        const batches = [];
        for (let i = 0; i < uniqueTexts.length; i += this.config.translationSettings.batchSize) {
            batches.push(uniqueTexts.slice(i, i + this.config.translationSettings.batchSize));
        }
        
        // Translate each batch
        for (const batch of batches) {
            const batchResults = await Promise.all(
                batch.map(text => this.translate(text, targetLanguage, options))
            );
            results.push(...batchResults);
        }
        
        // Map back to original order
        const textToTranslation = new Map();
        uniqueTexts.forEach((text, index) => {
            textToTranslation.set(text, results[index]);
        });
        
        return texts.map(text => textToTranslation.get(text));
    }
    
    async performTranslation(text, sourceLanguage, targetLanguage, context) {
        try {
            // Try primary provider (DeepL)
            if (this.config.translationProviders.primary.apiKey && 
                this.config.translationProviders.primary.supportedLanguages.includes(targetLanguage)) {
                return await this.translateWithDeepL(text, sourceLanguage, targetLanguage, context);
            }
            
            // Fallback to Google Translate
            if (this.config.translationProviders.fallback.apiKey) {
                return await this.translateWithGoogle(text, sourceLanguage, targetLanguage, context);
            }
            
            // Last resort: mock translation
            return await this.mockTranslate(text, targetLanguage, context);
            
        } catch (error) {
            console.error('Translation error:', error);
            return await this.mockTranslate(text, targetLanguage, context);
        }
    }
    
    async translateWithDeepL(text, sourceLanguage, targetLanguage, context) {
        const provider = this.config.translationProviders.primary;
        
        try {
            const response = await axios.post(provider.endpoint, {
                text: [text],
                source_lang: sourceLanguage.toUpperCase(),
                target_lang: targetLanguage.toUpperCase(),
                formality: context === 'educational' ? 'more' : 'default',
                preserve_formatting: true
            }, {
                headers: {
                    'Authorization': `DeepL-Auth-Key ${provider.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            this.stats.apiCalls++;
            return response.data.translations[0].text;
            
        } catch (error) {
            console.error('DeepL translation error:', error.message);
            throw error;
        }
    }
    
    async translateWithGoogle(text, sourceLanguage, targetLanguage, context) {
        const provider = this.config.translationProviders.fallback;
        
        try {
            const response = await axios.post(provider.endpoint, {
                q: text,
                source: sourceLanguage,
                target: targetLanguage,
                format: 'text'
            }, {
                params: {
                    key: provider.apiKey
                }
            });
            
            this.stats.apiCalls++;
            return response.data.data.translations[0].translatedText;
            
        } catch (error) {
            console.error('Google Translate error:', error.message);
            throw error;
        }
    }
    
    async mockTranslate(text, targetLanguage, context) {
        // Simple mock translation for development
        const languageMarkers = {
            'es': '[ES]',
            'fr': '[FR]',
            'de': '[DE]',
            'ja': '[JA]',
            'ko': '[KO]',
            'zh': '[ZH]',
            'pt': '[PT]',
            'it': '[IT]',
            'ru': '[RU]',
            'ar': '[AR]',
            'hi': '[HI]'
        };
        
        // Apply glossary terms
        let translated = text;
        for (const [term, translations] of this.gameTermGlossary) {
            if (text.includes(term) && translations[targetLanguage]) {
                translated = translated.replace(term, translations[targetLanguage]);
            }
        }
        
        for (const [term, translations] of this.educationalGlossary) {
            if (text.includes(term) && translations[targetLanguage]) {
                translated = translated.replace(term, translations[targetLanguage]);
            }
        }
        
        return `${languageMarkers[targetLanguage] || '[??]'} ${translated}`;
    }
    
    // ==================== EDUCATIONAL ADAPTATIONS ====================
    
    async applyEducationalAdaptations(text, language, context) {
        // Apply cultural learning adaptations
        const learningStyle = this.config.educationalAdaptations.learningStyles[language];
        
        switch (learningStyle) {
            case 'structured-progression':
                // Japanese style - add step numbers
                text = this.addStructuredSteps(text, language);
                break;
                
            case 'theoretical-foundation':
                // German style - add theoretical context
                text = this.addTheoreticalContext(text, language);
                break;
                
            case 'collaborative-learning':
                // Spanish style - add group activity suggestions
                text = this.addCollaborativeElements(text, language);
                break;
                
            case 'memorization-practice':
                // Chinese style - add memory aids
                text = this.addMemoryAids(text, language);
                break;
                
            case 'competitive-achievement':
                // Korean style - add achievement milestones
                text = this.addAchievementMarkers(text, language);
                break;
        }
        
        // Apply localized examples
        text = await this.localizeExamples(text, language, context);
        
        return text;
    }
    
    addStructuredSteps(text, language) {
        // Add step numbers for structured learning (Japanese style)
        const lines = text.split('\n');
        let stepCounter = 1;
        
        return lines.map(line => {
            if (line.trim() && !line.startsWith('#')) {
                if (language === 'ja') {
                    return `ステップ${stepCounter++}：${line}`;
                } else {
                    return `Step ${stepCounter++}: ${line}`;
                }
            }
            return line;
        }).join('\n');
    }
    
    addTheoreticalContext(text, language) {
        // Add theoretical foundation (German style)
        const theoreticalIntro = {
            'de': 'Theoretische Grundlage: ',
            'en': 'Theoretical Foundation: '
        };
        
        return `${theoreticalIntro[language] || theoreticalIntro.en}${text}`;
    }
    
    addCollaborativeElements(text, language) {
        // Add group activity suggestions (Spanish style)
        const collaborativePrompts = {
            'es': '\n💭 Discute con tu grupo: ',
            'en': '\n💭 Discuss with your group: '
        };
        
        return text + (collaborativePrompts[language] || collaborativePrompts.en);
    }
    
    addMemoryAids(text, language) {
        // Add memory aids (Chinese style)
        const memoryPrompts = {
            'zh': '\n📝 记忆要点：',
            'en': '\n📝 Key points to remember:'
        };
        
        return text + (memoryPrompts[language] || memoryPrompts.en);
    }
    
    addAchievementMarkers(text, language) {
        // Add achievement milestones (Korean style)
        const achievementMarkers = {
            'ko': '\n🏆 달성 목표: ',
            'en': '\n🏆 Achievement goal: '
        };
        
        return text + (achievementMarkers[language] || achievementMarkers.en);
    }
    
    async localizeExamples(text, language, context) {
        // Replace currency examples
        const currencyMap = this.config.educationalAdaptations.localizedExamples.currency;
        const targetCurrency = currencyMap[language] || currencyMap.en;
        
        text = text.replace(/\$(\d+)/g, (match, amount) => {
            const convertedAmount = this.convertCurrency(amount, 'USD', targetCurrency);
            return this.formatCurrency(convertedAmount, targetCurrency);
        });
        
        // Replace cultural references
        if (context === 'customer-service') {
            const serviceStyle = this.config.educationalAdaptations.localizedExamples.customerService[language];
            if (serviceStyle) {
                text = text.replace(/customer service/gi, serviceStyle);
            }
        }
        
        return text;
    }
    
    // ==================== BOOK LOCALIZATION ====================
    
    async localizeBookMetadata(bookData, targetLanguage) {
        const localized = {
            ...bookData,
            language: targetLanguage,
            
            // Translate title and subtitle
            title: await this.translate(bookData.title, targetLanguage, {
                context: 'book-title',
                educational: false
            }),
            
            subtitle: bookData.subtitle ? await this.translate(bookData.subtitle, targetLanguage, {
                context: 'book-subtitle',
                educational: false
            }) : '',
            
            // Format according to language conventions
            formattedTitle: '',
            
            // Translate description
            description: await this.translate(bookData.description, targetLanguage, {
                context: 'book-description',
                educational: true
            }),
            
            // Localize author name
            author: this.localizeAuthorName(bookData.author, targetLanguage),
            
            // Translate genre
            genre: await this.translateGenre(bookData.genre, targetLanguage),
            
            // Translate keywords/tags
            keywords: await this.translateBatch(bookData.keywords || [], targetLanguage, {
                context: 'book-keywords'
            }),
            
            // Market-specific metadata
            marketMetadata: this.getMarketMetadata(targetLanguage)
        };
        
        // Apply title formatting
        const titleFormat = this.config.bookLocalization.titleFormats[targetLanguage] || 
                          this.config.bookLocalization.titleFormats.default;
        
        localized.formattedTitle = titleFormat
            .replace('{title}', localized.title)
            .replace('{subtitle}', localized.subtitle);
        
        return localized;
    }
    
    localizeAuthorName(author, language) {
        if (!author.firstName || !author.lastName) {
            return author.name || 'Unknown Author';
        }
        
        const format = this.config.bookLocalization.authorFormats[language] || 
                      this.config.bookLocalization.authorFormats.default;
        
        return format
            .replace('{firstName}', author.firstName)
            .replace('{lastName}', author.lastName);
    }
    
    async translateGenre(genre, targetLanguage) {
        const genreTranslations = this.config.bookLocalization.genreTranslations[genre];
        
        if (genreTranslations && genreTranslations[targetLanguage]) {
            return genreTranslations[targetLanguage];
        }
        
        // Fallback to general translation
        return await this.translate(genre, targetLanguage, {
            context: 'book-genre'
        });
    }
    
    getMarketMetadata(language) {
        const market = this.config.languages[language].goodreadsMarket;
        
        return {
            goodreadsMarket: market,
            amazonMarket: this.getAmazonMarket(language),
            isbnPrefix: this.getISBNPrefix(language),
            priceRange: this.getSuggestedPriceRange(language),
            readingLevel: this.getReadingLevel(language)
        };
    }
    
    getAmazonMarket(language) {
        const marketMap = {
            'en': 'com',
            'es': 'es',
            'fr': 'fr',
            'de': 'de',
            'ja': 'co.jp',
            'it': 'it',
            'pt': 'com.br'
        };
        
        return marketMap[language] || 'com';
    }
    
    getISBNPrefix(language) {
        // Simplified ISBN prefix by language/country
        const prefixMap = {
            'en': '978-0',
            'es': '978-84',
            'fr': '978-2',
            'de': '978-3',
            'ja': '978-4',
            'it': '978-88',
            'pt': '978-972',
            'zh': '978-7',
            'ko': '978-89',
            'ru': '978-5'
        };
        
        return prefixMap[language] || '978-0';
    }
    
    getSuggestedPriceRange(language) {
        // Suggested eBook price ranges by market
        const priceRanges = {
            'en': { min: 2.99, max: 9.99, currency: 'USD' },
            'es': { min: 2.99, max: 8.99, currency: 'EUR' },
            'fr': { min: 2.99, max: 8.99, currency: 'EUR' },
            'de': { min: 3.99, max: 9.99, currency: 'EUR' },
            'ja': { min: 300, max: 1000, currency: 'JPY' },
            'ko': { min: 3000, max: 10000, currency: 'KRW' },
            'zh': { min: 20, max: 60, currency: 'CNY' }
        };
        
        return priceRanges[language] || priceRanges.en;
    }
    
    getReadingLevel(language) {
        // Educational reading level indicators
        return {
            'en': 'Young Adult / Educational',
            'es': 'Juvenil / Educativo',
            'fr': 'Jeune Adulte / Éducatif',
            'de': 'Jugendbuch / Bildung',
            'ja': 'ヤングアダルト / 教育',
            'ko': '청소년 / 교육',
            'zh': '青少年 / 教育'
        }[language] || 'Young Adult / Educational';
    }
    
    // ==================== CURRENCY CONVERSION ====================
    
    convertCurrency(amount, fromCurrency, toCurrency) {
        // Simplified conversion rates (would use real API in production)
        const rates = {
            'USD': 1,
            'EUR': 0.85,
            'JPY': 110,
            'CNY': 6.5,
            'KRW': 1200,
            'GBP': 0.75
        };
        
        const usdAmount = amount / rates[fromCurrency];
        return Math.round(usdAmount * rates[toCurrency]);
    }
    
    formatCurrency(amount, currency) {
        const formats = {
            'USD': `$${amount}`,
            'EUR': `€${amount}`,
            'JPY': `¥${amount}`,
            'CNY': `¥${amount}`,
            'KRW': `₩${amount}`,
            'GBP': `£${amount}`
        };
        
        return formats[currency] || `${currency} ${amount}`;
    }
    
    // ==================== CACHE MANAGEMENT ====================
    
    getCacheKey(text, sourceLanguage, targetLanguage, context) {
        return crypto.createHash('md5')
            .update(`${sourceLanguage}:${targetLanguage}:${context}:${text}`)
            .digest('hex');
    }
    
    updateTranslationMemory(text, sourceLanguage, targetLanguage, translation) {
        const key = `${sourceLanguage}:${text}`;
        
        if (!this.translationMemory.has(key)) {
            this.translationMemory.set(key, {});
        }
        
        const translations = this.translationMemory.get(key);
        translations[targetLanguage] = translation;
    }
    
    async saveTranslationMemory() {
        try {
            const memory = {};
            for (const [key, translations] of this.translationMemory) {
                memory[key] = translations;
            }
            
            const memoryFile = path.join(this.config.storagePaths.translations, 'memory.json');
            await fs.writeFile(memoryFile, JSON.stringify(memory, null, 2));
            
            console.log(`💾 Saved ${this.translationMemory.size} translation memories`);
        } catch (error) {
            console.error('Failed to save translation memory:', error);
        }
    }
    
    cleanupCache() {
        const now = Date.now();
        let removed = 0;
        
        for (const [key, entry] of this.translationCache) {
            if (now - entry.timestamp > this.config.translationSettings.cacheTTL) {
                this.translationCache.delete(key);
                removed++;
            }
        }
        
        if (removed > 0) {
            console.log(`🧹 Cleaned up ${removed} expired cache entries`);
        }
    }
    
    updateLanguageStats(language) {
        const current = this.stats.languageDistribution.get(language) || 0;
        this.stats.languageDistribution.set(language, current + 1);
    }
    
    // ==================== STATISTICS & REPORTING ====================
    
    getStatistics() {
        const languageStats = {};
        for (const [lang, count] of this.stats.languageDistribution) {
            languageStats[lang] = count;
        }
        
        return {
            totalTranslations: this.stats.translationsCompleted,
            cacheHits: this.stats.cacheHits,
            apiCalls: this.stats.apiCalls,
            cacheHitRate: this.stats.cacheHits / (this.stats.translationsCompleted || 1),
            memorySize: this.translationMemory.size,
            cacheSize: this.translationCache.size,
            supportedLanguages: Object.keys(this.config.languages),
            languageDistribution: languageStats
        };
    }
    
    // ==================== EDUCATIONAL CONTENT TRANSLATION ====================
    
    async translateEducationalContent(content, targetLanguage, options = {}) {
        const {
            contentType = 'general',
            preserveGameTerms = true,
            adaptCulturally = true
        } = options;
        
        // Handle different content types
        switch (contentType) {
            case 'wiki-article':
                return await this.translateWikiArticle(content, targetLanguage);
                
            case 'game-explanation':
                return await this.translateGameExplanation(content, targetLanguage);
                
            case 'customer-service-scenario':
                return await this.translateCustomerServiceScenario(content, targetLanguage);
                
            case 'financial-lesson':
                return await this.translateFinancialLesson(content, targetLanguage);
                
            default:
                return await this.translate(content, targetLanguage, {
                    context: contentType,
                    educational: true
                });
        }
    }
    
    async translateWikiArticle(article, targetLanguage) {
        // Translate wiki article preserving structure
        const translated = {
            title: await this.translate(article.title, targetLanguage, {
                context: 'wiki-title'
            }),
            
            sections: await Promise.all(
                article.sections.map(async section => ({
                    heading: await this.translate(section.heading, targetLanguage, {
                        context: 'wiki-heading'
                    }),
                    content: await this.translate(section.content, targetLanguage, {
                        context: 'wiki-content',
                        educational: true
                    })
                }))
            ),
            
            metadata: {
                ...article.metadata,
                language: targetLanguage
            }
        };
        
        return translated;
    }
    
    async translateGameExplanation(explanation, targetLanguage) {
        // Preserve game mechanics while translating
        let translated = await this.translate(explanation.text, targetLanguage, {
            context: 'game-explanation',
            educational: true
        });
        
        // Ensure game terms are properly handled
        for (const [term, translations] of this.gameTermGlossary) {
            if (translations[targetLanguage] && explanation.text.includes(term)) {
                // Add glossary note
                translated += `\n[${term} = ${translations[targetLanguage]}]`;
            }
        }
        
        return {
            text: translated,
            gameTerms: await this.extractAndTranslateGameTerms(explanation.text, targetLanguage)
        };
    }
    
    async translateCustomerServiceScenario(scenario, targetLanguage) {
        // Adapt customer service scenarios culturally
        const translated = {
            setup: await this.translate(scenario.setup, targetLanguage, {
                context: 'customer-service',
                educational: true
            }),
            
            customerMessage: await this.translate(scenario.customerMessage, targetLanguage, {
                context: 'customer-dialogue'
            }),
            
            responseOptions: await this.translateBatch(
                scenario.responseOptions,
                targetLanguage,
                { context: 'service-response' }
            ),
            
            culturalNotes: this.getCustomerServiceCulturalNotes(targetLanguage)
        };
        
        return translated;
    }
    
    async translateFinancialLesson(lesson, targetLanguage) {
        // Localize financial education content
        const translated = {
            title: await this.translate(lesson.title, targetLanguage, {
                context: 'financial-education'
            }),
            
            content: await this.translate(lesson.content, targetLanguage, {
                context: 'financial-lesson',
                educational: true
            }),
            
            examples: await this.localizeFinancialExamples(lesson.examples, targetLanguage),
            
            localRegulations: this.getLocalFinancialRegulations(targetLanguage)
        };
        
        return translated;
    }
    
    async extractAndTranslateGameTerms(text, targetLanguage) {
        const terms = [];
        
        for (const [term, translations] of this.gameTermGlossary) {
            if (text.includes(term)) {
                terms.push({
                    original: term,
                    translated: translations[targetLanguage] || term,
                    isGameSpecific: true
                });
            }
        }
        
        return terms;
    }
    
    async localizeFinancialExamples(examples, targetLanguage) {
        const localized = [];
        
        for (const example of examples) {
            const localizedExample = {
                ...example,
                amounts: example.amounts.map(amount => ({
                    original: amount,
                    localized: this.formatCurrency(
                        this.convertCurrency(amount.value, 'USD', 
                            this.config.educationalAdaptations.localizedExamples.currency[targetLanguage]),
                        this.config.educationalAdaptations.localizedExamples.currency[targetLanguage]
                    )
                })),
                description: await this.translate(example.description, targetLanguage, {
                    context: 'financial-example'
                })
            };
            
            localized.push(localizedExample);
        }
        
        return localized;
    }
    
    getCustomerServiceCulturalNotes(language) {
        const culturalNotes = {
            'ja': 'In Japan, customer service emphasizes respect, anticipation of needs, and going above and beyond (omotenashi).',
            'de': 'German customer service values efficiency, directness, and technical competence.',
            'es': 'Spanish customer service often includes personal warmth and relationship building.',
            'fr': 'French customer service appreciates politeness, formality, and knowledgeable assistance.',
            'ko': 'Korean customer service emphasizes hierarchy, respect, and detailed attention.',
            'zh': 'Chinese customer service values relationship (guanxi) and face-saving interactions.'
        };
        
        return culturalNotes[language] || 'Customer service standards vary by culture.';
    }
    
    getLocalFinancialRegulations(language) {
        const regulations = {
            'en': 'Subject to SEC and local financial regulations',
            'es': 'Sujeto a regulaciones de la CNMV y normativas locales',
            'de': 'Unterliegt BaFin und lokalen Finanzvorschriften',
            'ja': '金融庁および地方金融規制の対象',
            'fr': 'Soumis aux réglementations de l\'AMF et locales'
        };
        
        return regulations[language] || regulations.en;
    }
}

// Auto-start if running directly
if (require.main === module) {
    const engine = new I18nTranslationEngine();
    
    engine.on('ready', async () => {
        console.log('🌐 i18n Translation Engine ready for multi-language support!');
        
        // Example translations
        const examples = [
            'Welcome to the RuneScape Educational Platform',
            'Learn customer service through gaming',
            'Track your financial literacy progress',
            'Your electricity usage is justified by educational value'
        ];
        
        console.log('\n📝 Example translations:');
        for (const text of examples) {
            console.log(`\nOriginal: ${text}`);
            for (const lang of ['es', 'ja', 'de']) {
                const translated = await engine.translate(text, lang, {
                    educational: true
                });
                console.log(`${lang}: ${translated}`);
            }
        }
        
        // Show statistics
        console.log('\n📊 Translation statistics:', engine.getStatistics());
    });
}

module.exports = I18nTranslationEngine;
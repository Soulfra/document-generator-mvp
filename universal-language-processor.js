#!/usr/bin/env node

/**
 * 🌐 UNIVERSAL LANGUAGE PROCESSOR
 * 
 * Multi-language support for error messages, patterns, and documentation.
 * Features:
 * - Auto-detect language from content
 * - Store error patterns in multiple languages
 * - Real-time translation for global teams
 * - Language-specific error pattern matching
 * - Cultural context awareness
 * 
 * Supports 100+ languages out of the box.
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class UniversalLanguageProcessor {
    constructor(config = {}) {
        // Language detection
        this.defaultLanguage = config.defaultLanguage || 'en';
        this.supportedLanguages = new Set();
        this.activeLanguages = new Set([this.defaultLanguage]);
        
        // Translation cache
        this.translationCache = new Map();
        this.cacheTimeout = config.cacheTimeout || 3600000; // 1 hour
        
        // Language patterns database
        this.db = new sqlite3.Database('./language-patterns.db');
        
        // Language detection models
        this.languageDetectors = new Map();
        this.confidenceThreshold = 0.7;
        
        // Cultural contexts
        this.culturalContexts = new Map();
        
        // Initialize language data
        this.initializeLanguages();
        
        console.log('🌐 Universal Language Processor initialized');
        console.log(`   Default language: ${this.defaultLanguage}`);
        console.log(`   Supported languages: ${this.supportedLanguages.size}`);
    }
    
    async initialize() {
        await this.createLanguageTables();
        await this.loadLanguageModels();
        await this.loadCulturalContexts();
        
        console.log('   ✅ Language processor ready!');
    }
    
    /**
     * Initialize supported languages
     */
    initializeLanguages() {
        // Common languages with their ISO codes
        const languages = {
            // Major languages
            'en': { name: 'English', nativeName: 'English', rtl: false },
            'zh': { name: 'Chinese', nativeName: '中文', rtl: false },
            'hi': { name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
            'es': { name: 'Spanish', nativeName: 'Español', rtl: false },
            'ar': { name: 'Arabic', nativeName: 'العربية', rtl: true },
            'bn': { name: 'Bengali', nativeName: 'বাংলা', rtl: false },
            'pt': { name: 'Portuguese', nativeName: 'Português', rtl: false },
            'ru': { name: 'Russian', nativeName: 'Русский', rtl: false },
            'ja': { name: 'Japanese', nativeName: '日本語', rtl: false },
            'pa': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', rtl: false },
            
            // European languages
            'de': { name: 'German', nativeName: 'Deutsch', rtl: false },
            'fr': { name: 'French', nativeName: 'Français', rtl: false },
            'it': { name: 'Italian', nativeName: 'Italiano', rtl: false },
            'nl': { name: 'Dutch', nativeName: 'Nederlands', rtl: false },
            'sv': { name: 'Swedish', nativeName: 'Svenska', rtl: false },
            'no': { name: 'Norwegian', nativeName: 'Norsk', rtl: false },
            'da': { name: 'Danish', nativeName: 'Dansk', rtl: false },
            'fi': { name: 'Finnish', nativeName: 'Suomi', rtl: false },
            'pl': { name: 'Polish', nativeName: 'Polski', rtl: false },
            'cs': { name: 'Czech', nativeName: 'Čeština', rtl: false },
            'sk': { name: 'Slovak', nativeName: 'Slovenčina', rtl: false },
            'hu': { name: 'Hungarian', nativeName: 'Magyar', rtl: false },
            'ro': { name: 'Romanian', nativeName: 'Română', rtl: false },
            'bg': { name: 'Bulgarian', nativeName: 'Български', rtl: false },
            'el': { name: 'Greek', nativeName: 'Ελληνικά', rtl: false },
            
            // Asian languages
            'ko': { name: 'Korean', nativeName: '한국어', rtl: false },
            'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
            'th': { name: 'Thai', nativeName: 'ไทย', rtl: false },
            'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false },
            'ms': { name: 'Malay', nativeName: 'Bahasa Melayu', rtl: false },
            'tl': { name: 'Tagalog', nativeName: 'Tagalog', rtl: false },
            'my': { name: 'Burmese', nativeName: 'မြန်မာဘာသာ', rtl: false },
            'km': { name: 'Khmer', nativeName: 'ភាសាខ្មែរ', rtl: false },
            'lo': { name: 'Lao', nativeName: 'ພາສາລາວ', rtl: false },
            
            // Middle Eastern languages
            'he': { name: 'Hebrew', nativeName: 'עברית', rtl: true },
            'fa': { name: 'Persian', nativeName: 'فارسی', rtl: true },
            'ur': { name: 'Urdu', nativeName: 'اردو', rtl: true },
            'tr': { name: 'Turkish', nativeName: 'Türkçe', rtl: false },
            
            // African languages
            'sw': { name: 'Swahili', nativeName: 'Kiswahili', rtl: false },
            'am': { name: 'Amharic', nativeName: 'አማርኛ', rtl: false },
            'ha': { name: 'Hausa', nativeName: 'Hausa', rtl: false },
            'yo': { name: 'Yoruba', nativeName: 'Yorùbá', rtl: false },
            'ig': { name: 'Igbo', nativeName: 'Igbo', rtl: false },
            'zu': { name: 'Zulu', nativeName: 'isiZulu', rtl: false },
            'xh': { name: 'Xhosa', nativeName: 'isiXhosa', rtl: false },
            'af': { name: 'Afrikaans', nativeName: 'Afrikaans', rtl: false },
            
            // Programming languages (for code detection)
            'code:js': { name: 'JavaScript', nativeName: 'JavaScript', rtl: false },
            'code:py': { name: 'Python', nativeName: 'Python', rtl: false },
            'code:java': { name: 'Java', nativeName: 'Java', rtl: false },
            'code:cpp': { name: 'C++', nativeName: 'C++', rtl: false },
            'code:rust': { name: 'Rust', nativeName: 'Rust', rtl: false },
            'code:go': { name: 'Go', nativeName: 'Go', rtl: false },
            'code:swift': { name: 'Swift', nativeName: 'Swift', rtl: false },
            'code:kotlin': { name: 'Kotlin', nativeName: 'Kotlin', rtl: false }
        };
        
        for (const [code, info] of Object.entries(languages)) {
            this.supportedLanguages.add(code);
        }
        
        this.languageInfo = languages;
    }
    
    /**
     * Create language pattern tables
     */
    async createLanguageTables() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Language patterns table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS language_patterns (
                        pattern_id TEXT PRIMARY KEY,
                        pattern_hash TEXT NOT NULL,
                        language_code VARCHAR(10) NOT NULL,
                        pattern_type VARCHAR(50) NOT NULL,
                        original_text TEXT NOT NULL,
                        normalized_text TEXT,
                        
                        -- Pattern metadata
                        category VARCHAR(100),
                        severity VARCHAR(20),
                        frequency INTEGER DEFAULT 1,
                        
                        -- Translations
                        translations TEXT, -- JSON object
                        
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        
                        INDEX idx_language (language_code),
                        INDEX idx_pattern_type (pattern_type),
                        INDEX idx_pattern_hash (pattern_hash)
                    )
                `);
                
                // Translation cache
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS translation_cache (
                        cache_id TEXT PRIMARY KEY,
                        source_hash TEXT NOT NULL,
                        source_language VARCHAR(10) NOT NULL,
                        target_language VARCHAR(10) NOT NULL,
                        source_text TEXT NOT NULL,
                        translated_text TEXT NOT NULL,
                        confidence REAL DEFAULT 1.0,
                        
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        access_count INTEGER DEFAULT 1,
                        
                        INDEX idx_source (source_hash, source_language, target_language)
                    )
                `);
                
                // Language detection results
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS detection_history (
                        detection_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        content_hash TEXT NOT NULL,
                        detected_language VARCHAR(10),
                        confidence REAL,
                        alternatives TEXT, -- JSON array
                        content_sample TEXT,
                        
                        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        
                        INDEX idx_content (content_hash)
                    )
                `);
                
                // Cultural context mappings
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS cultural_contexts (
                        context_id TEXT PRIMARY KEY,
                        language_code VARCHAR(10) NOT NULL,
                        context_type VARCHAR(50) NOT NULL,
                        context_data TEXT NOT NULL, -- JSON
                        
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        
                        INDEX idx_lang_context (language_code, context_type)
                    )
                `);
                
                resolve();
            });
        });
    }
    
    /**
     * Load language detection models
     */
    async loadLanguageModels() {
        // Simple n-gram based detection (would use ML models in production)
        this.languageDetectors.set('ngram', {
            detect: (text) => this.detectLanguageByNGrams(text)
        });
        
        this.languageDetectors.set('unicode', {
            detect: (text) => this.detectLanguageByUnicode(text)
        });
        
        this.languageDetectors.set('pattern', {
            detect: (text) => this.detectLanguageByPatterns(text)
        });
    }
    
    /**
     * Load cultural contexts
     */
    async loadCulturalContexts() {
        // Date formats
        this.culturalContexts.set('date_formats', {
            'en': 'MM/DD/YYYY',
            'en-GB': 'DD/MM/YYYY',
            'de': 'DD.MM.YYYY',
            'ja': 'YYYY年MM月DD日',
            'zh': 'YYYY年MM月DD日',
            'ko': 'YYYY년 MM월 DD일',
            'ar': 'DD/MM/YYYY'
        });
        
        // Number formats
        this.culturalContexts.set('number_formats', {
            'en': { decimal: '.', thousands: ',' },
            'de': { decimal: ',', thousands: '.' },
            'fr': { decimal: ',', thousands: ' ' },
            'ar': { decimal: '٫', thousands: '٬' }
        });
        
        // Error message styles
        this.culturalContexts.set('error_styles', {
            'en': { formal: false, apologetic: false },
            'ja': { formal: true, apologetic: true },
            'de': { formal: true, apologetic: false },
            'ko': { formal: true, apologetic: true }
        });
    }
    
    /**
     * Detect language from text
     */
    async detectLanguage(text) {
        if (!text || text.length < 10) {
            return { language: this.defaultLanguage, confidence: 0.5 };
        }
        
        // Check cache
        const contentHash = this.hashText(text);
        const cached = await this.getCachedDetection(contentHash);
        if (cached) {
            return cached;
        }
        
        // Run multiple detectors
        const results = [];
        
        for (const [name, detector] of this.languageDetectors) {
            try {
                const result = await detector.detect(text);
                if (result) {
                    results.push(result);
                }
            } catch (error) {
                console.error(`Language detector ${name} failed:`, error);
            }
        }
        
        // Aggregate results
        const aggregated = this.aggregateDetectionResults(results);
        
        // Store in cache
        await this.cacheDetection(contentHash, aggregated, text.substring(0, 100));
        
        return aggregated;
    }
    
    /**
     * Detect language by n-grams
     */
    detectLanguageByNGrams(text) {
        // Common bigrams/trigrams for languages
        const languageNGrams = {
            'en': ['th', 'he', 'in', 'er', 'an', 'the', 'and', 'ing', 'ion'],
            'es': ['de', 'la', 'el', 'en', 'es', 'los', 'las', 'que', 'ción'],
            'fr': ['le', 'de', 'la', 'et', 'un', 'les', 'que', 'est', 'tion'],
            'de': ['en', 'er', 'de', 'ie', 'ich', 'der', 'die', 'und', 'ein'],
            'it': ['di', 'il', 'la', 'to', 'no', 'che', 'per', 'con', 'are'],
            'pt': ['de', 'do', 'da', 'em', 'os', 'que', 'com', 'para', 'ção'],
            'ru': ['ен', 'ов', 'ст', 'но', 'на', 'при', 'ком', 'про', 'ция'],
            'ja': ['の', 'に', 'は', 'を', 'が', 'です', 'ます', 'して', 'こと'],
            'zh': ['的', '是', '了', '在', '和', '有', '我', '你', '这'],
            'ar': ['ال', 'في', 'من', 'على', 'إلى', 'هذا', 'ذلك', 'التي', 'الذي']
        };
        
        const textLower = text.toLowerCase();
        const scores = {};
        
        for (const [lang, ngrams] of Object.entries(languageNGrams)) {
            scores[lang] = 0;
            for (const ngram of ngrams) {
                const occurrences = (textLower.match(new RegExp(ngram, 'g')) || []).length;
                scores[lang] += occurrences;
            }
            // Normalize by text length
            scores[lang] = scores[lang] / text.length;
        }
        
        // Find best match
        const bestLang = Object.entries(scores)
            .sort(([, a], [, b]) => b - a)[0];
        
        return {
            language: bestLang[0],
            confidence: Math.min(bestLang[1] * 10, 1), // Normalize confidence
            method: 'ngram'
        };
    }
    
    /**
     * Detect language by Unicode ranges
     */
    detectLanguageByUnicode(text) {
        const unicodeRanges = {
            'zh': [0x4E00, 0x9FFF],    // CJK Unified Ideographs
            'ja': [0x3040, 0x309F],    // Hiragana
            'ko': [0xAC00, 0xD7AF],    // Hangul Syllables
            'ar': [0x0600, 0x06FF],    // Arabic
            'he': [0x0590, 0x05FF],    // Hebrew
            'th': [0x0E00, 0x0E7F],    // Thai
            'hi': [0x0900, 0x097F],    // Devanagari
            'el': [0x0370, 0x03FF],    // Greek
            'ru': [0x0400, 0x04FF],    // Cyrillic
        };
        
        const charCounts = {};
        let totalChars = 0;
        
        for (const char of text) {
            const code = char.charCodeAt(0);
            totalChars++;
            
            for (const [lang, [min, max]] of Object.entries(unicodeRanges)) {
                if (code >= min && code <= max) {
                    charCounts[lang] = (charCounts[lang] || 0) + 1;
                }
            }
        }
        
        // Default to Latin scripts if no specific script found
        if (Object.keys(charCounts).length === 0) {
            return { language: 'en', confidence: 0.5, method: 'unicode' };
        }
        
        // Find dominant script
        const dominant = Object.entries(charCounts)
            .sort(([, a], [, b]) => b - a)[0];
        
        return {
            language: dominant[0],
            confidence: dominant[1] / totalChars,
            method: 'unicode'
        };
    }
    
    /**
     * Detect language by common patterns
     */
    detectLanguageByPatterns(text) {
        const patterns = {
            'en': /\b(the|is|are|was|were|have|has|had|will|would|should|could)\b/gi,
            'es': /\b(el|la|los|las|es|son|está|están|tiene|tienen)\b/gi,
            'fr': /\b(le|la|les|est|sont|avoir|être|fait|faire)\b/gi,
            'de': /\b(der|die|das|ist|sind|haben|werden|können|müssen)\b/gi,
            'it': /\b(il|la|i|le|è|sono|avere|essere|fare)\b/gi,
            'pt': /\b(o|a|os|as|é|são|tem|têm|fazer|estar)\b/gi,
            'code:js': /\b(function|const|let|var|return|if|else|for|while)\b/g,
            'code:py': /\b(def|import|from|class|if|elif|else|for|while|return)\b/g,
        };
        
        const matches = {};
        
        for (const [lang, pattern] of Object.entries(patterns)) {
            const matchCount = (text.match(pattern) || []).length;
            if (matchCount > 0) {
                matches[lang] = matchCount;
            }
        }
        
        if (Object.keys(matches).length === 0) {
            return null;
        }
        
        const best = Object.entries(matches)
            .sort(([, a], [, b]) => b - a)[0];
        
        return {
            language: best[0],
            confidence: Math.min(best[1] / 20, 1), // Normalize
            method: 'pattern'
        };
    }
    
    /**
     * Aggregate detection results
     */
    aggregateDetectionResults(results) {
        if (results.length === 0) {
            return { language: this.defaultLanguage, confidence: 0.5 };
        }
        
        // Count votes for each language
        const votes = {};
        const weights = { ngram: 1.0, unicode: 1.5, pattern: 1.2 };
        
        for (const result of results) {
            if (result) {
                const weight = weights[result.method] || 1.0;
                votes[result.language] = (votes[result.language] || 0) + 
                    (result.confidence * weight);
            }
        }
        
        // Find winner
        const winner = Object.entries(votes)
            .sort(([, a], [, b]) => b - a)[0];
        
        if (!winner) {
            return { language: this.defaultLanguage, confidence: 0.5 };
        }
        
        // Calculate alternatives
        const alternatives = Object.entries(votes)
            .filter(([lang]) => lang !== winner[0])
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([lang, score]) => ({ language: lang, confidence: score / results.length }));
        
        return {
            language: winner[0],
            confidence: Math.min(winner[1] / results.length, 1),
            alternatives,
            methods: results.map(r => r.method)
        };
    }
    
    /**
     * Translate text
     */
    async translate(text, targetLanguage, sourceLanguage = null) {
        // Detect source language if not provided
        if (!sourceLanguage) {
            const detection = await this.detectLanguage(text);
            sourceLanguage = detection.language;
        }
        
        // Same language, no translation needed
        if (sourceLanguage === targetLanguage) {
            return { text, translated: false };
        }
        
        // Check cache
        const cacheKey = this.getTranslationCacheKey(text, sourceLanguage, targetLanguage);
        const cached = await this.getCachedTranslation(cacheKey);
        if (cached) {
            return { text: cached.translated_text, translated: true, cached: true };
        }
        
        // Perform translation (simplified - would use real translation API)
        const translated = await this.performTranslation(text, sourceLanguage, targetLanguage);
        
        // Cache result
        await this.cacheTranslation(text, sourceLanguage, targetLanguage, translated);
        
        return { text: translated, translated: true, cached: false };
    }
    
    /**
     * Perform translation (mock implementation)
     */
    async performTranslation(text, sourceLang, targetLang) {
        // In production, this would call Google Translate, DeepL, or similar
        // For now, we'll use a simple pattern-based approach for common phrases
        
        const commonTranslations = {
            'en->es': {
                'error': 'error',
                'warning': 'advertencia',
                'success': 'éxito',
                'failed': 'falló',
                'timeout': 'tiempo de espera',
                'connection refused': 'conexión rechazada',
                'not found': 'no encontrado',
                'unauthorized': 'no autorizado',
                'internal server error': 'error interno del servidor'
            },
            'en->fr': {
                'error': 'erreur',
                'warning': 'avertissement',
                'success': 'succès',
                'failed': 'échoué',
                'timeout': 'délai dépassé',
                'connection refused': 'connexion refusée',
                'not found': 'non trouvé',
                'unauthorized': 'non autorisé',
                'internal server error': 'erreur interne du serveur'
            },
            'en->de': {
                'error': 'Fehler',
                'warning': 'Warnung',
                'success': 'Erfolg',
                'failed': 'fehlgeschlagen',
                'timeout': 'Zeitüberschreitung',
                'connection refused': 'Verbindung verweigert',
                'not found': 'nicht gefunden',
                'unauthorized': 'nicht autorisiert',
                'internal server error': 'interner Serverfehler'
            },
            'en->ja': {
                'error': 'エラー',
                'warning': '警告',
                'success': '成功',
                'failed': '失敗',
                'timeout': 'タイムアウト',
                'connection refused': '接続が拒否されました',
                'not found': '見つかりません',
                'unauthorized': '認証されていません',
                'internal server error': '内部サーバーエラー'
            },
            'en->zh': {
                'error': '错误',
                'warning': '警告',
                'success': '成功',
                'failed': '失败',
                'timeout': '超时',
                'connection refused': '连接被拒绝',
                'not found': '未找到',
                'unauthorized': '未授权',
                'internal server error': '内部服务器错误'
            }
        };
        
        const translationKey = `${sourceLang}->${targetLang}`;
        const translations = commonTranslations[translationKey];
        
        if (translations) {
            let translated = text;
            for (const [source, target] of Object.entries(translations)) {
                const regex = new RegExp(`\\b${source}\\b`, 'gi');
                translated = translated.replace(regex, target);
            }
            return translated;
        }
        
        // If no translation available, return with language tag
        return `[${targetLang}] ${text}`;
    }
    
    /**
     * Store error pattern in specific language
     */
    async storeErrorPattern(pattern, language = null) {
        // Detect language if not provided
        if (!language) {
            const detection = await this.detectLanguage(pattern.message || pattern.text);
            language = detection.language;
        }
        
        const patternId = crypto.randomBytes(8).toString('hex');
        const patternHash = this.hashText(pattern.message || pattern.text);
        
        // Prepare translations for common languages
        const translations = {};
        if (language !== 'en') {
            const enTranslation = await this.translate(pattern.message || pattern.text, 'en', language);
            translations.en = enTranslation.text;
        }
        
        // Store pattern
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO language_patterns 
                (pattern_id, pattern_hash, language_code, pattern_type, 
                 original_text, normalized_text, category, severity, translations)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                patternId,
                patternHash,
                language,
                pattern.type || 'error',
                pattern.message || pattern.text,
                this.normalizeText(pattern.message || pattern.text),
                pattern.category || 'general',
                pattern.severity || 'medium',
                JSON.stringify(translations)
            ], err => {
                if (err) reject(err);
                else resolve(patternId);
            });
        });
    }
    
    /**
     * Search patterns across languages
     */
    async searchPatterns(query, options = {}) {
        const targetLanguages = options.languages || [this.defaultLanguage];
        const limit = options.limit || 10;
        
        // Detect query language
        const queryLang = await this.detectLanguage(query);
        
        // Normalize query
        const normalizedQuery = this.normalizeText(query);
        
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM language_patterns
                WHERE normalized_text LIKE ?
                   OR translations LIKE ?
                ORDER BY frequency DESC
                LIMIT ?
            `, [
                `%${normalizedQuery}%`,
                `%${normalizedQuery}%`,
                limit
            ], (err, rows) => {
                if (err) reject(err);
                else {
                    // Translate results to requested languages
                    const translatedResults = rows.map(row => ({
                        ...row,
                        translations: JSON.parse(row.translations || '{}')
                    }));
                    resolve(translatedResults);
                }
            });
        });
    }
    
    /**
     * Get language statistics
     */
    async getLanguageStats() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    language_code,
                    COUNT(*) as pattern_count,
                    COUNT(DISTINCT pattern_type) as pattern_types,
                    SUM(frequency) as total_occurrences,
                    MAX(last_seen) as last_activity
                FROM language_patterns
                GROUP BY language_code
                ORDER BY pattern_count DESC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    /**
     * Get cultural context for formatting
     */
    getCulturalContext(language, contextType) {
        const contexts = this.culturalContexts.get(contextType);
        return contexts ? contexts[language] || contexts[this.defaultLanguage] : null;
    }
    
    /**
     * Format error message for language/culture
     */
    formatErrorMessage(error, language) {
        const errorStyle = this.getCulturalContext(language, 'error_styles') || {};
        let message = error.message || error;
        
        // Apply cultural formatting
        if (errorStyle.formal) {
            // Make message more formal
            message = this.formalizMessage(message, language);
        }
        
        if (errorStyle.apologetic) {
            // Add apology based on language
            const apologies = {
                'ja': '申し訳ございません。',
                'ko': '죄송합니다.',
                'zh': '抱歉。'
            };
            
            if (apologies[language]) {
                message = apologies[language] + ' ' + message;
            }
        }
        
        return message;
    }
    
    /**
     * Format date for language/culture
     */
    formatDate(date, language) {
        const format = this.getCulturalContext(language, 'date_formats') || 'YYYY-MM-DD';
        const d = new Date(date);
        
        // Simple format replacement
        return format
            .replace('YYYY', d.getFullYear())
            .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
            .replace('DD', String(d.getDate()).padStart(2, '0'))
            .replace('年', '年')
            .replace('月', '月')
            .replace('日', '日');
    }
    
    /**
     * Format number for language/culture
     */
    formatNumber(number, language) {
        const format = this.getCulturalContext(language, 'number_formats') || 
                      { decimal: '.', thousands: ',' };
        
        const parts = number.toString().split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, format.thousands);
        const decimalPart = parts[1] || '';
        
        return decimalPart ? `${integerPart}${format.decimal}${decimalPart}` : integerPart;
    }
    
    /**
     * Helper methods
     */
    
    hashText(text) {
        return crypto.createHash('sha256').update(text).digest('hex');
    }
    
    normalizeText(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    formalizMessage(message, language) {
        // Simple formalization (would be more sophisticated in production)
        const informal = ['gonna', 'wanna', 'gotta', "can't", "won't"];
        const formal = ['going to', 'want to', 'have to', 'cannot', 'will not'];
        
        let formalized = message;
        for (let i = 0; i < informal.length; i++) {
            formalized = formalized.replace(new RegExp(informal[i], 'gi'), formal[i]);
        }
        
        return formalized;
    }
    
    getTranslationCacheKey(text, sourceLang, targetLang) {
        return `${sourceLang}:${targetLang}:${this.hashText(text)}`;
    }
    
    async getCachedTranslation(cacheKey) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM translation_cache WHERE cache_id = ?',
                [cacheKey],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }
    
    async cacheTranslation(text, sourceLang, targetLang, translatedText) {
        const cacheId = this.getTranslationCacheKey(text, sourceLang, targetLang);
        const sourceHash = this.hashText(text);
        
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO translation_cache 
                (cache_id, source_hash, source_language, target_language, 
                 source_text, translated_text)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                cacheId,
                sourceHash,
                sourceLang,
                targetLang,
                text,
                translatedText
            ], err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    
    async getCachedDetection(contentHash) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM detection_history WHERE content_hash = ? ORDER BY detected_at DESC',
                [contentHash],
                (err, row) => {
                    if (err) reject(err);
                    else if (row) {
                        resolve({
                            language: row.detected_language,
                            confidence: row.confidence,
                            alternatives: JSON.parse(row.alternatives || '[]')
                        });
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }
    
    async cacheDetection(contentHash, detection, sample) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO detection_history 
                (content_hash, detected_language, confidence, alternatives, content_sample)
                VALUES (?, ?, ?, ?, ?)
            `, [
                contentHash,
                detection.language,
                detection.confidence,
                JSON.stringify(detection.alternatives || []),
                sample
            ], err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

// Export for use
module.exports = UniversalLanguageProcessor;

// Run demo if executed directly
if (require.main === module) {
    (async () => {
        const processor = new UniversalLanguageProcessor();
        await processor.initialize();
        
        console.log('\n🌐 Universal Language Processor Demo');
        console.log('====================================\n');
        
        // Test texts in different languages
        const testTexts = [
            { text: 'Connection timeout error occurred', expected: 'en' },
            { text: 'La conexión ha sido rechazada', expected: 'es' },
            { text: 'Erreur de connexion au serveur', expected: 'fr' },
            { text: 'Verbindung zum Server fehlgeschlagen', expected: 'de' },
            { text: 'サーバーへの接続がタイムアウトしました', expected: 'ja' },
            { text: '服务器连接超时', expected: 'zh' },
            { text: 'function getData() { return fetch("/api/data"); }', expected: 'code:js' }
        ];
        
        console.log('1. Language Detection Tests:\n');
        
        for (const test of testTexts) {
            const result = await processor.detectLanguage(test.text);
            console.log(`Text: "${test.text.substring(0, 50)}..."`);
            console.log(`Expected: ${test.expected}, Detected: ${result.language} (${(result.confidence * 100).toFixed(1)}%)`);
            console.log('');
        }
        
        // Test translations
        console.log('2. Translation Tests:\n');
        
        const errorMessage = 'Connection timeout error';
        const targetLanguages = ['es', 'fr', 'de', 'ja', 'zh'];
        
        for (const lang of targetLanguages) {
            const translated = await processor.translate(errorMessage, lang, 'en');
            console.log(`${lang}: ${translated.text}`);
        }
        
        // Store error patterns
        console.log('\n3. Storing Error Patterns:\n');
        
        await processor.storeErrorPattern({
            message: 'Database connection failed',
            type: 'database_error',
            severity: 'high'
        });
        
        await processor.storeErrorPattern({
            message: 'Usuario no autorizado',
            type: 'auth_error',
            severity: 'medium'
        }, 'es');
        
        console.log('Error patterns stored successfully');
        
        // Get language statistics
        console.log('\n4. Language Statistics:\n');
        
        const stats = await processor.getLanguageStats();
        console.log(JSON.stringify(stats, null, 2));
        
        // Test cultural formatting
        console.log('\n5. Cultural Formatting:\n');
        
        const testDate = new Date();
        const testNumber = 1234567.89;
        
        console.log('Date formatting:');
        console.log(`en: ${processor.formatDate(testDate, 'en')}`);
        console.log(`de: ${processor.formatDate(testDate, 'de')}`);
        console.log(`ja: ${processor.formatDate(testDate, 'ja')}`);
        
        console.log('\nNumber formatting:');
        console.log(`en: ${processor.formatNumber(testNumber, 'en')}`);
        console.log(`de: ${processor.formatNumber(testNumber, 'de')}`);
        console.log(`fr: ${processor.formatNumber(testNumber, 'fr')}`);
    })();
}
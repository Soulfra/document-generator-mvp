/**
 * 🗣️ Universal Language Dissector - The Omnilingual Consent Engine
 * Parses ANY language (human, machine, symbolic) into XML-mapped schemas
 * Every communication is dissected for meaning, intent, and consent
 */

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');
const crypto = require('crypto');

class UniversalLanguageDissector {
    constructor() {
        this.app = express();
        this.port = 7900;
        this.wsPort = 7901;
        this.server = null;
        this.wsServer = null;
        
        // Language Anatomy Database
        this.languageAnatomy = {
            // Human Languages
            'english': {
                type: 'human_natural',
                structure: 'subject-verb-object',
                consent_patterns: ['may I', 'can I', 'would you', 'please', 'permission'],
                negation_patterns: ['no', 'not', 'never', 'refuse', 'deny'],
                xml_schema: `
                    <language id="english" family="indo-european">
                        <grammar>
                            <word_order>SVO</word_order>
                            <tense_system>complex</tense_system>
                            <consent_markers>
                                <polite>please, may, would</polite>
                                <direct>can, will, must</direct>
                                <implicit>contextual</implicit>
                            </consent_markers>
                        </grammar>
                    </language>
                `
            },
            'japanese': {
                type: 'human_natural',
                structure: 'subject-object-verb',
                consent_patterns: ['ください', 'いいですか', 'もらえますか', 'お願いします'],
                negation_patterns: ['いいえ', 'ない', 'だめ', '禁止'],
                honorific_levels: 5,
                xml_schema: `
                    <language id="japanese" family="japonic">
                        <grammar>
                            <word_order>SOV</word_order>
                            <politeness_levels>5</politeness_levels>
                            <consent_markers>
                                <formal>いただけますでしょうか</formal>
                                <casual>もらえる？</casual>
                                <honorific>お/ご prefix</honorific>
                            </consent_markers>
                        </grammar>
                    </language>
                `
            },
            'spanish': {
                type: 'human_natural',
                structure: 'subject-verb-object',
                consent_patterns: ['por favor', 'puedo', 'podría', 'permiso'],
                negation_patterns: ['no', 'nunca', 'jamás', 'prohibido'],
                xml_schema: `
                    <language id="spanish" family="romance">
                        <grammar>
                            <word_order>SVO</word_order>
                            <verb_conjugation>extensive</verb_conjugation>
                            <formality>tú/usted</formality>
                        </grammar>
                    </language>
                `
            },
            'mandarin': {
                type: 'human_natural',
                structure: 'subject-verb-object',
                consent_patterns: ['请', '可以', '能', '麻烦'],
                negation_patterns: ['不', '没有', '别', '禁止'],
                tonal: true,
                xml_schema: `
                    <language id="mandarin" family="sino-tibetan">
                        <grammar>
                            <word_order>SVO</word_order>
                            <tones>4+neutral</tones>
                            <measure_words>required</measure_words>
                        </grammar>
                    </language>
                `
            },
            'arabic': {
                type: 'human_natural',
                structure: 'verb-subject-object',
                consent_patterns: ['من فضلك', 'هل يمكن', 'لو سمحت'],
                negation_patterns: ['لا', 'ليس', 'غير', 'ممنوع'],
                direction: 'rtl',
                xml_schema: `
                    <language id="arabic" family="semitic">
                        <grammar>
                            <word_order>VSO</word_order>
                            <direction>right-to-left</direction>
                            <root_system>trilateral</root_system>
                        </grammar>
                    </language>
                `
            },
            'russian': {
                type: 'human_natural',
                structure: 'flexible',
                consent_patterns: ['пожалуйста', 'можно', 'разрешите'],
                negation_patterns: ['нет', 'не', 'нельзя', 'запрещено'],
                case_system: true,
                xml_schema: `
                    <language id="russian" family="slavic">
                        <grammar>
                            <word_order>flexible</word_order>
                            <cases>6</cases>
                            <aspect>perfective/imperfective</aspect>
                        </grammar>
                    </language>
                `
            },
            
            // Programming Languages
            'javascript': {
                type: 'programming',
                structure: 'c-family',
                consent_patterns: ['async', 'await', 'Promise', 'callback', 'then'],
                negation_patterns: ['throw', 'reject', 'error', 'false', '!'],
                xml_schema: `
                    <language id="javascript" family="ecmascript">
                        <syntax>
                            <style>c-like</style>
                            <typing>dynamic</typing>
                            <async>Promise-based</async>
                            <consent_flow>
                                <request>function call</request>
                                <grant>return/resolve</grant>
                                <deny>throw/reject</deny>
                            </consent_flow>
                        </syntax>
                    </language>
                `
            },
            'python': {
                type: 'programming',
                structure: 'indentation-based',
                consent_patterns: ['def', 'class', 'import', 'with', 'try'],
                negation_patterns: ['raise', 'except', 'False', 'None', 'not'],
                xml_schema: `
                    <language id="python" family="scripting">
                        <syntax>
                            <style>indentation</style>
                            <typing>dynamic-strong</typing>
                            <philosophy>explicit-better-than-implicit</philosophy>
                        </syntax>
                    </language>
                `
            },
            'sql': {
                type: 'query',
                structure: 'declarative',
                consent_patterns: ['SELECT', 'GRANT', 'ALLOW', 'PERMIT'],
                negation_patterns: ['DELETE', 'DROP', 'REVOKE', 'DENY', 'RESTRICT'],
                xml_schema: `
                    <language id="sql" family="query">
                        <syntax>
                            <style>declarative</style>
                            <case_sensitive>false</case_sensitive>
                            <consent_operations>
                                <read>SELECT</read>
                                <write>INSERT/UPDATE</write>
                                <permission>GRANT/REVOKE</permission>
                            </consent_operations>
                        </syntax>
                    </language>
                `
            },
            
            // Symbolic Languages
            'mathematics': {
                type: 'symbolic',
                structure: 'equation-based',
                consent_patterns: ['=', '≈', '∈', '⊆', '→'],
                negation_patterns: ['≠', '∉', '⊄', '¬', '⊥'],
                xml_schema: `
                    <language id="mathematics" family="formal">
                        <notation>
                            <equality>=</equality>
                            <membership>∈</membership>
                            <implication>→</implication>
                            <universal>∀</universal>
                            <existential>∃</existential>
                        </notation>
                    </language>
                `
            },
            'emoji': {
                type: 'symbolic',
                structure: 'ideographic',
                consent_patterns: ['👍', '✅', '🤝', '💚', '🙏'],
                negation_patterns: ['👎', '❌', '🚫', '⛔', '🙅'],
                xml_schema: `
                    <language id="emoji" family="unicode">
                        <semantics>
                            <positive>😊🎉✨💖</positive>
                            <negative>😢😡💔⚠️</negative>
                            <neutral>😐🤔💭📝</neutral>
                        </semantics>
                    </language>
                `
            },
            
            // Machine Languages
            'binary': {
                type: 'machine',
                structure: 'bit-stream',
                consent_patterns: ['1', '11111111', 'ACK', '0x06'],
                negation_patterns: ['0', '00000000', 'NAK', '0x15'],
                xml_schema: `
                    <language id="binary" family="machine">
                        <encoding>
                            <true>1</true>
                            <false>0</false>
                            <acknowledge>00000110</acknowledge>
                            <negative_acknowledge>00010101</negative_acknowledge>
                        </encoding>
                    </language>
                `
            },
            'regex': {
                type: 'pattern',
                structure: 'expression-based',
                consent_patterns: ['.*', '.+', '\\w+', '[a-z]+', '(?:yes|okay|sure)'],
                negation_patterns: ['(?!', '[^', '(?<!', '\\b(?!', '(?:no|never|not)'],
                xml_schema: `
                    <language id="regex" family="pattern">
                        <metacharacters>
                            <any>.</any>
                            <start>^</start>
                            <end>$</end>
                            <group>()</group>
                            <negation>[^]</negation>
                        </metacharacters>
                    </language>
                `
            },
            
            // Hybrid Languages
            'legalese': {
                type: 'specialized_human',
                structure: 'clause-based',
                consent_patterns: ['hereby', 'agrees', 'consents', 'authorizes', 'permits'],
                negation_patterns: ['shall not', 'prohibited', 'void', 'null', 'terminates'],
                xml_schema: `
                    <language id="legalese" family="specialized">
                        <structure>
                            <clauses>numbered</clauses>
                            <definitions>section-1</definitions>
                            <obligations>shall/must</obligations>
                            <permissions>may/can</permissions>
                            <prohibitions>shall-not/must-not</prohibitions>
                        </structure>
                    </language>
                `
            },
            'medical': {
                type: 'specialized_human',
                structure: 'terminology-based',
                consent_patterns: ['indicated', 'recommended', 'prescribed', 'authorized'],
                negation_patterns: ['contraindicated', 'allergic', 'incompatible', 'refused'],
                xml_schema: `
                    <language id="medical" family="specialized">
                        <terminology>
                            <latin_greek>predominant</latin_greek>
                            <abbreviations>extensive</abbreviations>
                            <consent_forms>
                                <informed>required</informed>
                                <capacity>assessed</capacity>
                            </consent_forms>
                        </terminology>
                    </language>
                `
            }
        };
        
        // Consent Operation Types
        this.consentOperations = {
            'explicit': {
                description: 'Clear, direct consent given',
                confidence: 1.0,
                requires_confirmation: false
            },
            'implicit': {
                description: 'Consent implied by context',
                confidence: 0.7,
                requires_confirmation: true
            },
            'conditional': {
                description: 'Consent with conditions',
                confidence: 0.8,
                requires_confirmation: true
            },
            'revoked': {
                description: 'Previously given consent withdrawn',
                confidence: 1.0,
                requires_confirmation: false
            },
            'ambiguous': {
                description: 'Unclear consent status',
                confidence: 0.3,
                requires_confirmation: true
            },
            'cultural': {
                description: 'Consent based on cultural norms',
                confidence: 0.6,
                requires_confirmation: true
            }
        };
        
        // Universal Grammar Patterns
        this.universalPatterns = {
            'request': {
                markers: ['?', 'please', 'would', 'could', 'may'],
                structure: 'interrogative or polite imperative'
            },
            'command': {
                markers: ['!', 'must', 'shall', 'do'],
                structure: 'imperative'
            },
            'statement': {
                markers: ['.', 'is', 'are', 'exists'],
                structure: 'declarative'
            },
            'negation': {
                markers: ['not', 'no', 'un-', 'dis-', '-less'],
                structure: 'negative transformation'
            }
        };
        
        // Dissection Results Storage
        this.dissectionHistory = new Map();
        this.consentLog = [];
        
        // Multi-language understanding matrix
        this.understandingMatrix = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeDissector();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send(this.generateDissectorInterface());
        });
        
        // Language Detection
        this.app.post('/detect', async (req, res) => {
            const result = await this.detectLanguage(req.body.text);
            res.json(result);
        });
        
        // Full Dissection
        this.app.post('/dissect', async (req, res) => {
            const result = await this.dissectCommunication(req.body);
            res.json(result);
        });
        
        // Consent Analysis
        this.app.post('/consent/analyze', async (req, res) => {
            const result = await this.analyzeConsent(req.body);
            res.json(result);
        });
        
        // Translation to Universal Schema
        this.app.post('/translate/universal', async (req, res) => {
            const result = await this.translateToUniversal(req.body);
            res.json(result);
        });
        
        // Schema Generation
        this.app.post('/schema/generate', async (req, res) => {
            const schema = await this.generateSchema(req.body);
            res.json(schema);
        });
    }
    
    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ port: this.wsPort });
        
        this.wsServer.on('connection', (ws, req) => {
            console.log('🔬 New linguist connected to the dissector');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    const result = await this.handleRealtimeDissection(data);
                    ws.send(JSON.stringify(result));
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });
        });
    }
    
    async initializeDissector() {
        console.log('🗣️ Initializing Universal Language Dissector...');
        console.log(`📚 ${Object.keys(this.languageAnatomy).length} languages loaded`);
        console.log('🔬 Consent operation analyzer ready');
        console.log('🧬 Universal grammar patterns initialized');
        
        // Build cross-language understanding matrix
        this.buildUnderstandingMatrix();
    }
    
    buildUnderstandingMatrix() {
        // Create relationships between similar concepts across languages
        const concepts = {
            'affirmation': {
                'english': ['yes', 'okay', 'sure', 'agree'],
                'japanese': ['はい', 'ええ', 'そうです', 'わかりました'],
                'spanish': ['sí', 'claro', 'de acuerdo', 'vale'],
                'mandarin': ['是', '好', '对', '同意'],
                'emoji': ['👍', '✅', '💯', '🙌']
            },
            'negation': {
                'english': ['no', 'not', 'never', 'disagree'],
                'japanese': ['いいえ', 'ない', '違う', 'だめ'],
                'spanish': ['no', 'nunca', 'jamás', 'nada'],
                'mandarin': ['不', '没有', '不是', '不同意'],
                'emoji': ['👎', '❌', '🚫', '⛔']
            },
            'uncertainty': {
                'english': ['maybe', 'perhaps', 'possibly', 'unsure'],
                'japanese': ['たぶん', 'かもしれない', 'かも', '不確か'],
                'spanish': ['quizás', 'tal vez', 'posiblemente', 'no sé'],
                'mandarin': ['也许', '可能', '或许', '不确定'],
                'emoji': ['🤔', '😕', '🤷', '❓']
            }
        };
        
        Object.entries(concepts).forEach(([concept, translations]) => {
            this.understandingMatrix.set(concept, translations);
        });
    }
    
    async detectLanguage(text) {
        const detection = {
            text: text,
            detected_languages: [],
            confidence_scores: {},
            mixed_language: false,
            primary_language: null
        };
        
        // Check each language pattern
        for (const [langName, langData] of Object.entries(this.languageAnatomy)) {
            let score = 0;
            let matches = [];
            
            // Check for consent patterns
            langData.consent_patterns.forEach(pattern => {
                if (text.includes(pattern)) {
                    score += 10;
                    matches.push(pattern);
                }
            });
            
            // Check for negation patterns
            langData.negation_patterns.forEach(pattern => {
                if (text.includes(pattern)) {
                    score += 10;
                    matches.push(pattern);
                }
            });
            
            // Special checks for different language types
            if (langData.type === 'programming') {
                // Check for syntax patterns
                if (langName === 'javascript' && /\bfunction\b|\bconst\b|\blet\b/.test(text)) {
                    score += 20;
                }
                if (langName === 'python' && /\bdef\b|\bclass\b|\bimport\b/.test(text)) {
                    score += 20;
                }
                if (langName === 'sql' && /\bSELECT\b|\bFROM\b|\bWHERE\b/i.test(text)) {
                    score += 30;
                }
            }
            
            if (langData.type === 'symbolic') {
                if (langName === 'emoji' && /[\u{1F300}-\u{1F9FF}]/u.test(text)) {
                    score += 25;
                }
                if (langName === 'mathematics' && /[∀∃∈∉⊆⊇∧∨¬→↔≡≠≤≥]/.test(text)) {
                    score += 25;
                }
            }
            
            if (score > 0) {
                detection.confidence_scores[langName] = score;
                detection.detected_languages.push({
                    language: langName,
                    type: langData.type,
                    confidence: score,
                    matches: matches
                });
            }
        }
        
        // Sort by confidence
        detection.detected_languages.sort((a, b) => b.confidence - a.confidence);
        
        if (detection.detected_languages.length > 0) {
            detection.primary_language = detection.detected_languages[0].language;
            detection.mixed_language = detection.detected_languages.length > 1;
        }
        
        return detection;
    }
    
    async dissectCommunication(input) {
        const { text, context = {}, requester = 'unknown' } = input;
        
        // Detect language(s)
        const languageDetection = await this.detectLanguage(text);
        
        // Parse structure
        const structure = await this.parseStructure(text, languageDetection.primary_language);
        
        // Extract intent
        const intent = await this.extractIntent(text, structure, languageDetection);
        
        // Analyze consent
        const consent = await this.analyzeConsent({
            text,
            language: languageDetection.primary_language,
            context
        });
        
        // Generate XML mapping
        const xmlMapping = await this.generateXMLMapping({
            text,
            language: languageDetection,
            structure,
            intent,
            consent
        });
        
        // Create dissection result
        const dissection = {
            id: crypto.randomBytes(16).toString('hex'),
            timestamp: Date.now(),
            original_text: text,
            language_detection: languageDetection,
            structure_analysis: structure,
            intent_extraction: intent,
            consent_analysis: consent,
            xml_mapping: xmlMapping,
            requester: requester,
            context: context,
            universal_translation: await this.translateToUniversal({ text, language: languageDetection.primary_language })
        };
        
        // Store in history
        this.dissectionHistory.set(dissection.id, dissection);
        
        // Log consent operations
        if (consent.operation_type !== 'none') {
            this.consentLog.push({
                timestamp: Date.now(),
                dissection_id: dissection.id,
                consent_type: consent.operation_type,
                confidence: consent.confidence,
                language: languageDetection.primary_language
            });
        }
        
        return dissection;
    }
    
    async parseStructure(text, language) {
        const langData = this.languageAnatomy[language] || this.languageAnatomy['english'];
        
        const structure = {
            type: langData.structure,
            components: [],
            complexity: 'simple',
            nested_level: 0
        };
        
        // Different parsing for different language types
        switch (langData.type) {
            case 'human_natural':
                structure.components = this.parseNaturalLanguage(text, langData);
                break;
                
            case 'programming':
                structure.components = this.parseProgrammingLanguage(text, language);
                break;
                
            case 'symbolic':
                structure.components = this.parseSymbolicLanguage(text, language);
                break;
                
            case 'machine':
                structure.components = this.parseMachineLanguage(text, language);
                break;
                
            case 'pattern':
                structure.components = this.parsePatternLanguage(text, language);
                break;
                
            case 'specialized_human':
                structure.components = this.parseSpecializedLanguage(text, language);
                break;
        }
        
        // Determine complexity
        if (structure.components.length > 5) structure.complexity = 'complex';
        else if (structure.components.length > 2) structure.complexity = 'moderate';
        
        return structure;
    }
    
    parseNaturalLanguage(text, langData) {
        const components = [];
        
        // Simple tokenization (would use proper NLP in production)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        
        sentences.forEach(sentence => {
            const words = sentence.trim().split(/\s+/);
            components.push({
                type: 'sentence',
                content: sentence,
                word_count: words.length,
                detected_patterns: this.detectPatterns(sentence, langData)
            });
        });
        
        return components;
    }
    
    parseProgrammingLanguage(text, language) {
        const components = [];
        
        // Simple code parsing
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            if (line.trim()) {
                components.push({
                    type: 'code_line',
                    line_number: index + 1,
                    content: line,
                    indentation: line.search(/\S/),
                    detected_keywords: this.detectKeywords(line, language)
                });
            }
        });
        
        return components;
    }
    
    parseSymbolicLanguage(text, language) {
        const components = [];
        
        if (language === 'emoji') {
            // Extract emojis
            const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
            const emojis = text.match(emojiRegex) || [];
            
            emojis.forEach(emoji => {
                components.push({
                    type: 'emoji',
                    symbol: emoji,
                    meaning: this.getEmojiMeaning(emoji),
                    sentiment: this.getEmojiSentiment(emoji)
                });
            });
        } else if (language === 'mathematics') {
            // Extract mathematical expressions
            const mathSymbols = text.match(/[∀∃∈∉⊆⊇∧∨¬→↔≡≠≤≥+\-*/=()]/g) || [];
            components.push({
                type: 'mathematical_expression',
                symbols: mathSymbols,
                complexity: mathSymbols.length > 5 ? 'complex' : 'simple'
            });
        }
        
        return components;
    }
    
    parseMachineLanguage(text, language) {
        const components = [];
        
        if (language === 'binary') {
            const bytes = text.match(/[01]{8}/g) || [];
            bytes.forEach(byte => {
                components.push({
                    type: 'byte',
                    value: byte,
                    decimal: parseInt(byte, 2),
                    ascii: String.fromCharCode(parseInt(byte, 2))
                });
            });
        }
        
        return components;
    }
    
    parsePatternLanguage(text, language) {
        const components = [];
        
        if (language === 'regex') {
            try {
                const regex = new RegExp(text);
                components.push({
                    type: 'regex_pattern',
                    pattern: text,
                    valid: true,
                    flags: regex.flags
                });
            } catch (e) {
                components.push({
                    type: 'regex_pattern',
                    pattern: text,
                    valid: false,
                    error: e.message
                });
            }
        }
        
        return components;
    }
    
    parseSpecializedLanguage(text, language) {
        const components = [];
        
        if (language === 'legalese') {
            // Look for clause markers
            const clauses = text.split(/\b(?:whereas|therefore|hereby|notwithstanding)\b/i);
            clauses.forEach((clause, index) => {
                if (clause.trim()) {
                    components.push({
                        type: 'legal_clause',
                        number: index + 1,
                        content: clause.trim(),
                        binding_words: this.extractBindingWords(clause)
                    });
                }
            });
        } else if (language === 'medical') {
            // Extract medical terms
            const medicalTerms = text.match(/\b[A-Z][a-z]+(?:itis|osis|emia|pathy|ectomy|otomy|plasty)\b/g) || [];
            components.push({
                type: 'medical_terminology',
                terms: medicalTerms,
                contains_consent_language: /consent|authorize|refuse|allergic/i.test(text)
            });
        }
        
        return components;
    }
    
    detectPatterns(text, langData) {
        const patterns = [];
        
        langData.consent_patterns.forEach(pattern => {
            if (text.includes(pattern)) {
                patterns.push({ type: 'consent', pattern });
            }
        });
        
        langData.negation_patterns.forEach(pattern => {
            if (text.includes(pattern)) {
                patterns.push({ type: 'negation', pattern });
            }
        });
        
        return patterns;
    }
    
    detectKeywords(line, language) {
        const keywords = {
            'javascript': ['function', 'const', 'let', 'var', 'if', 'else', 'return', 'async', 'await'],
            'python': ['def', 'class', 'import', 'from', 'if', 'else', 'return', 'try', 'except'],
            'sql': ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'GROUP BY']
        };
        
        const langKeywords = keywords[language] || [];
        return langKeywords.filter(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            return regex.test(line);
        });
    }
    
    getEmojiMeaning(emoji) {
        const meanings = {
            '👍': 'approval',
            '👎': 'disapproval',
            '✅': 'confirmed',
            '❌': 'rejected',
            '🤝': 'agreement',
            '🚫': 'forbidden',
            '💚': 'positive',
            '❤️': 'love/strong positive',
            '😊': 'happy',
            '😢': 'sad',
            '🤔': 'thinking/uncertain'
        };
        
        return meanings[emoji] || 'unknown';
    }
    
    getEmojiSentiment(emoji) {
        const positive = ['👍', '✅', '🤝', '💚', '❤️', '😊', '🎉', '✨'];
        const negative = ['👎', '❌', '🚫', '😢', '😡', '💔', '⚠️'];
        const neutral = ['🤔', '😐', '💭', '📝'];
        
        if (positive.includes(emoji)) return 'positive';
        if (negative.includes(emoji)) return 'negative';
        if (neutral.includes(emoji)) return 'neutral';
        return 'unknown';
    }
    
    extractBindingWords(text) {
        const bindingWords = ['shall', 'must', 'will', 'agrees', 'commits', 'undertakes', 'warrants'];
        return bindingWords.filter(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(text);
        });
    }
    
    async extractIntent(text, structure, languageDetection) {
        const intent = {
            primary_intent: 'unknown',
            confidence: 0,
            supporting_evidence: [],
            secondary_intents: []
        };
        
        // Check universal patterns
        for (const [patternType, patternData] of Object.entries(this.universalPatterns)) {
            let matchScore = 0;
            
            patternData.markers.forEach(marker => {
                if (text.includes(marker)) {
                    matchScore += 1;
                    intent.supporting_evidence.push({
                        type: 'marker',
                        value: marker,
                        pattern: patternType
                    });
                }
            });
            
            if (matchScore > 0) {
                intent.secondary_intents.push({
                    type: patternType,
                    confidence: matchScore / patternData.markers.length
                });
            }
        }
        
        // Determine primary intent
        if (intent.secondary_intents.length > 0) {
            intent.secondary_intents.sort((a, b) => b.confidence - a.confidence);
            intent.primary_intent = intent.secondary_intents[0].type;
            intent.confidence = intent.secondary_intents[0].confidence;
        }
        
        // Language-specific intent adjustments
        if (languageDetection.primary_language === 'legalese') {
            if (/hereby|agrees to|consents to/i.test(text)) {
                intent.primary_intent = 'legal_consent';
                intent.confidence = 0.9;
            }
        }
        
        return intent;
    }
    
    async analyzeConsent(input) {
        const { text, language, context } = input;
        
        const analysis = {
            has_consent: false,
            operation_type: 'none',
            confidence: 0,
            factors: [],
            requires_confirmation: false,
            cultural_considerations: []
        };
        
        const langData = this.languageAnatomy[language] || this.languageAnatomy['english'];
        
        // Check for explicit consent patterns
        let consentScore = 0;
        let negationScore = 0;
        
        langData.consent_patterns.forEach(pattern => {
            if (text.includes(pattern)) {
                consentScore += 1;
                analysis.factors.push({
                    type: 'consent_pattern',
                    pattern: pattern,
                    weight: 'positive'
                });
            }
        });
        
        langData.negation_patterns.forEach(pattern => {
            if (text.includes(pattern)) {
                negationScore += 1;
                analysis.factors.push({
                    type: 'negation_pattern',
                    pattern: pattern,
                    weight: 'negative'
                });
            }
        });
        
        // Determine consent type
        if (negationScore > consentScore) {
            analysis.operation_type = 'revoked';
            analysis.confidence = negationScore / (negationScore + consentScore);
        } else if (consentScore > 0) {
            analysis.has_consent = true;
            
            // Check if explicit or implicit
            if (consentScore >= 2 || /explicitly|clearly|definitely/i.test(text)) {
                analysis.operation_type = 'explicit';
                analysis.confidence = 0.9;
            } else if (context.previous_consent) {
                analysis.operation_type = 'implicit';
                analysis.confidence = 0.7;
                analysis.requires_confirmation = true;
            } else {
                analysis.operation_type = 'conditional';
                analysis.confidence = 0.6;
                analysis.requires_confirmation = true;
            }
        } else {
            analysis.operation_type = 'ambiguous';
            analysis.confidence = 0.3;
            analysis.requires_confirmation = true;
        }
        
        // Cultural considerations
        if (language === 'japanese' && langData.honorific_levels) {
            analysis.cultural_considerations.push({
                aspect: 'honorific_level',
                impact: 'Higher honorific levels may indicate more formal consent'
            });
        }
        
        if (langData.direction === 'rtl') {
            analysis.cultural_considerations.push({
                aspect: 'reading_direction',
                impact: 'Right-to-left languages may have different consent flow'
            });
        }
        
        return analysis;
    }
    
    async translateToUniversal(input) {
        const { text, language } = input;
        
        const universal = {
            original_text: text,
            original_language: language,
            universal_concepts: [],
            semantic_graph: {
                nodes: [],
                edges: []
            },
            cross_language_mappings: {}
        };
        
        // Extract concepts that exist across languages
        for (const [concept, translations] of this.understandingMatrix.entries()) {
            const languageTranslations = translations[language] || [];
            
            languageTranslations.forEach(term => {
                if (text.includes(term)) {
                    universal.universal_concepts.push({
                        concept: concept,
                        original_term: term,
                        translations: translations
                    });
                    
                    // Add to semantic graph
                    universal.semantic_graph.nodes.push({
                        id: concept,
                        type: 'concept',
                        universal: true
                    });
                }
            });
        }
        
        // Build semantic relationships
        if (universal.universal_concepts.length > 1) {
            for (let i = 0; i < universal.universal_concepts.length - 1; i++) {
                universal.semantic_graph.edges.push({
                    from: universal.universal_concepts[i].concept,
                    to: universal.universal_concepts[i + 1].concept,
                    relationship: 'sequential'
                });
            }
        }
        
        return universal;
    }
    
    async generateXMLMapping(data) {
        const { text, language, structure, intent, consent } = data;
        
        const xmlBuilder = new xml2js.Builder({
            rootName: 'dissection',
            xmldec: { version: '1.0', encoding: 'UTF-8' }
        });
        
        const xmlData = {
            metadata: {
                timestamp: new Date().toISOString(),
                dissector_version: '1.0.0'
            },
            input: {
                text: text,
                detected_language: language.primary_language,
                mixed_language: language.mixed_language
            },
            analysis: {
                structure: {
                    type: structure.type,
                    complexity: structure.complexity,
                    component_count: structure.components.length
                },
                intent: {
                    primary: intent.primary_intent,
                    confidence: intent.confidence,
                    evidence_count: intent.supporting_evidence.length
                },
                consent: {
                    status: consent.has_consent,
                    operation: consent.operation_type,
                    confidence: consent.confidence,
                    requires_confirmation: consent.requires_confirmation
                }
            },
            language_specific: this.languageAnatomy[language.primary_language]?.xml_schema || '<unknown/>'
        };
        
        return xmlBuilder.buildObject(xmlData);
    }
    
    async generateSchema(input) {
        const { languages = [], purpose = 'general' } = input;
        
        const schema = {
            name: `${purpose}_multilingual_schema`,
            version: '1.0.0',
            languages: languages,
            tables: [],
            relationships: []
        };
        
        // Create tables for each language
        languages.forEach(lang => {
            const langData = this.languageAnatomy[lang];
            if (langData) {
                schema.tables.push({
                    name: `${lang}_communications`,
                    columns: [
                        { name: 'id', type: 'uuid', primary: true },
                        { name: 'original_text', type: 'text' },
                        { name: 'structure_type', type: 'varchar(50)' },
                        { name: 'intent', type: 'varchar(50)' },
                        { name: 'consent_status', type: 'boolean' },
                        { name: 'consent_type', type: 'varchar(50)' },
                        { name: 'confidence_score', type: 'decimal(3,2)' },
                        { name: 'cultural_factors', type: 'jsonb' },
                        { name: 'timestamp', type: 'timestamp' }
                    ],
                    indexes: [
                        { columns: ['consent_status', 'consent_type'] },
                        { columns: ['timestamp'] }
                    ]
                });
            }
        });
        
        // Universal concepts table
        schema.tables.push({
            name: 'universal_concepts',
            columns: [
                { name: 'id', type: 'uuid', primary: true },
                { name: 'concept', type: 'varchar(100)' },
                { name: 'language_mappings', type: 'jsonb' },
                { name: 'semantic_category', type: 'varchar(50)' }
            ]
        });
        
        // Consent log table
        schema.tables.push({
            name: 'consent_operations',
            columns: [
                { name: 'id', type: 'uuid', primary: true },
                { name: 'communication_id', type: 'uuid' },
                { name: 'language', type: 'varchar(50)' },
                { name: 'operation_type', type: 'varchar(50)' },
                { name: 'confidence', type: 'decimal(3,2)' },
                { name: 'confirmed', type: 'boolean', default: false },
                { name: 'timestamp', type: 'timestamp' }
            ]
        });
        
        // Define relationships
        schema.relationships = [
            {
                from: 'consent_operations.communication_id',
                to: '[language]_communications.id',
                type: 'many-to-one'
            }
        ];
        
        return schema;
    }
    
    async handleRealtimeDissection(data) {
        const { text, stream = false } = data;
        
        if (stream) {
            // Real-time streaming dissection
            const chunks = text.split(' ');
            const results = [];
            
            for (const chunk of chunks) {
                const detection = await this.detectLanguage(chunk);
                results.push({
                    chunk: chunk,
                    language: detection.primary_language,
                    timestamp: Date.now()
                });
            }
            
            return {
                type: 'stream_dissection',
                chunks: results
            };
        } else {
            // Full dissection
            return await this.dissectCommunication(data);
        }
    }
    
    generateDissectorInterface() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🗣️ Universal Language Dissector</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@400;600&display=swap');
                
                * { box-sizing: border-box; }
                
                body {
                    font-family: 'Inter', sans-serif;
                    background: #0a0a0a;
                    color: #e0e0e0;
                    margin: 0;
                    padding: 0;
                    background-image: 
                        radial-gradient(circle at 10% 20%, rgba(0, 120, 255, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(120, 0, 255, 0.1) 0%, transparent 50%);
                }
                
                .dissector-container {
                    max-width: 1600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    animation: fadeIn 1s ease;
                }
                
                .header h1 {
                    font-size: 2.5em;
                    margin-bottom: 10px;
                    background: linear-gradient(45deg, #00a6ff, #00ff88);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .main-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }
                
                @media (max-width: 1200px) {
                    .main-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                .input-section {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 15px;
                    padding: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .input-section h2 {
                    color: #00a6ff;
                    margin-bottom: 20px;
                }
                
                .input-textarea {
                    width: 100%;
                    min-height: 200px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #e0e0e0;
                    padding: 15px;
                    border-radius: 10px;
                    font-family: 'Fira Code', monospace;
                    font-size: 14px;
                    resize: vertical;
                }
                
                .input-textarea:focus {
                    outline: none;
                    border-color: #00a6ff;
                    box-shadow: 0 0 0 2px rgba(0, 166, 255, 0.2);
                }
                
                .language-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin: 20px 0;
                }
                
                .language-chip {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 8px 15px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid transparent;
                }
                
                .language-chip:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                }
                
                .language-chip.detected {
                    background: rgba(0, 166, 255, 0.2);
                    border-color: #00a6ff;
                    color: #00d4ff;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 15px;
                    margin-top: 20px;
                }
                
                .btn {
                    background: linear-gradient(135deg, #00a6ff, #0066cc);
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 166, 255, 0.3);
                }
                
                .btn.secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #e0e0e0;
                }
                
                .dissection-results {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 15px;
                    padding: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    min-height: 400px;
                }
                
                .dissection-results h2 {
                    color: #00ff88;
                    margin-bottom: 20px;
                }
                
                .result-section {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                .result-section h3 {
                    color: #00d4ff;
                    margin-bottom: 15px;
                    font-size: 1.1em;
                }
                
                .result-grid {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 10px 20px;
                    font-size: 0.95em;
                }
                
                .result-label {
                    color: #888;
                    font-weight: 600;
                }
                
                .result-value {
                    color: #e0e0e0;
                    font-family: 'Fira Code', monospace;
                }
                
                .consent-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-weight: 600;
                    margin: 10px 0;
                }
                
                .consent-indicator.granted {
                    background: rgba(0, 255, 136, 0.2);
                    color: #00ff88;
                    border: 1px solid #00ff88;
                }
                
                .consent-indicator.denied {
                    background: rgba(255, 68, 68, 0.2);
                    color: #ff4444;
                    border: 1px solid #ff4444;
                }
                
                .consent-indicator.ambiguous {
                    background: rgba(255, 170, 0, 0.2);
                    color: #ffaa00;
                    border: 1px solid #ffaa00;
                }
                
                .confidence-bar {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 10px 0;
                }
                
                .confidence-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ff4444, #ffaa00, #00ff88);
                    transition: width 0.5s ease;
                }
                
                .xml-preview {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 15px;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.85em;
                    max-height: 300px;
                    overflow-y: auto;
                    white-space: pre-wrap;
                }
                
                .language-matrix {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }
                
                .language-card {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    padding: 15px;
                    text-align: center;
                    transition: all 0.3s ease;
                }
                
                .language-card:hover {
                    transform: translateY(-3px);
                    background: rgba(255, 255, 255, 0.08);
                }
                
                .language-card .icon {
                    font-size: 2em;
                    margin-bottom: 8px;
                }
                
                .language-card .name {
                    font-weight: 600;
                    color: #00d4ff;
                    margin-bottom: 5px;
                }
                
                .language-card .type {
                    font-size: 0.85em;
                    color: #888;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                
                .processing {
                    animation: pulse 1.5s infinite;
                }
                
                .tooltip {
                    position: relative;
                    display: inline-block;
                    cursor: help;
                }
                
                .tooltip:hover::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 0.85em;
                    white-space: nowrap;
                    z-index: 10;
                }
                
                .live-feed {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    padding: 15px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .live-feed h4 {
                    color: #00ff88;
                    margin-bottom: 10px;
                    font-size: 0.9em;
                }
                
                .feed-item {
                    font-size: 0.8em;
                    margin: 5px 0;
                    padding: 5px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 5px;
                }
            </style>
        </head>
        <body>
            <div class="dissector-container">
                <div class="header">
                    <h1>🗣️ Universal Language Dissector</h1>
                    <p>Dissect any language - human, machine, or symbolic - with consent analysis</p>
                </div>
                
                <div class="main-grid">
                    <div class="input-section">
                        <h2>Input Communication</h2>
                        
                        <textarea 
                            id="inputText" 
                            class="input-textarea" 
                            placeholder="Enter text in any language...&#10;&#10;Examples:&#10;• English: May I process your data?&#10;• 日本語: データを処理してもよろしいですか？&#10;• JavaScript: async function requestPermission() { ... }&#10;• SQL: GRANT SELECT ON users TO analyst;&#10;• Emoji: 👍 ✅ 🤝"
                        ></textarea>
                        
                        <div class="language-chips" id="detectedLanguages">
                            <!-- Detected languages will appear here -->
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn" onclick="dissectText()">
                                🔬 Dissect Communication
                            </button>
                            <button class="btn secondary" onclick="detectLanguages()">
                                🔍 Detect Languages
                            </button>
                            <button class="btn secondary" onclick="clearAll()">
                                🗑️ Clear
                            </button>
                        </div>
                    </div>
                    
                    <div class="dissection-results">
                        <h2>Dissection Results</h2>
                        <div id="resultsContainer">
                            <div style="text-align: center; color: #666; padding: 50px;">
                                Enter text and click "Dissect Communication" to analyze
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="language-matrix">
                    <div class="language-card">
                        <div class="icon">🇬🇧</div>
                        <div class="name">English</div>
                        <div class="type">Natural Language</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">🇯🇵</div>
                        <div class="name">日本語</div>
                        <div class="type">Natural Language</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">🇪🇸</div>
                        <div class="name">Español</div>
                        <div class="type">Natural Language</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">🇨🇳</div>
                        <div class="name">中文</div>
                        <div class="type">Natural Language</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">🇸🇦</div>
                        <div class="name">العربية</div>
                        <div class="type">Natural Language</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">🇷🇺</div>
                        <div class="name">Русский</div>
                        <div class="type">Natural Language</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">💻</div>
                        <div class="name">JavaScript</div>
                        <div class="type">Programming</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">🐍</div>
                        <div class="name">Python</div>
                        <div class="type">Programming</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">🗄️</div>
                        <div class="name">SQL</div>
                        <div class="type">Query Language</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">😊</div>
                        <div class="name">Emoji</div>
                        <div class="type">Symbolic</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">∑</div>
                        <div class="name">Mathematics</div>
                        <div class="type">Symbolic</div>
                    </div>
                    <div class="language-card">
                        <div class="icon">⚖️</div>
                        <div class="name">Legalese</div>
                        <div class="type">Specialized</div>
                    </div>
                </div>
            </div>
            
            <div class="live-feed" id="liveFeed">
                <h4>🔴 Live Dissection Feed</h4>
                <div id="feedContent">
                    <div class="feed-item">System ready...</div>
                </div>
            </div>
            
            <script>
                let ws;
                let currentDissection = null;
                
                function connectWebSocket() {
                    ws = new WebSocket('ws://localhost:7901');
                    
                    ws.onopen = () => {
                        addFeedItem('Connected to dissector');
                    };
                    
                    ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        handleWebSocketMessage(data);
                    };
                    
                    ws.onclose = () => {
                        addFeedItem('Disconnected - reconnecting...');
                        setTimeout(connectWebSocket, 3000);
                    };
                }
                
                async function detectLanguages() {
                    const text = document.getElementById('inputText').value;
                    if (!text.trim()) return;
                    
                    addFeedItem('Detecting languages...');
                    
                    try {
                        const response = await fetch('/detect', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text })
                        });
                        
                        const result = await response.json();
                        displayDetectedLanguages(result);
                    } catch (error) {
                        console.error('Detection error:', error);
                        addFeedItem('Error detecting languages');
                    }
                }
                
                async function dissectText() {
                    const text = document.getElementById('inputText').value;
                    if (!text.trim()) return;
                    
                    const resultsContainer = document.getElementById('resultsContainer');
                    resultsContainer.innerHTML = '<div class="processing">🔬 Dissecting communication...</div>';
                    
                    addFeedItem('Starting dissection...');
                    
                    try {
                        const response = await fetch('/dissect', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                text,
                                context: { timestamp: Date.now() },
                                requester: 'web-interface'
                            })
                        });
                        
                        const result = await response.json();
                        currentDissection = result;
                        displayDissectionResults(result);
                        addFeedItem('Dissection complete');
                    } catch (error) {
                        console.error('Dissection error:', error);
                        resultsContainer.innerHTML = '<div style="color: #ff4444;">Error during dissection</div>';
                        addFeedItem('Dissection failed');
                    }
                }
                
                function displayDetectedLanguages(detection) {
                    const container = document.getElementById('detectedLanguages');
                    container.innerHTML = '';
                    
                    detection.detected_languages.forEach(lang => {
                        const chip = document.createElement('div');
                        chip.className = 'language-chip detected';
                        chip.textContent = \`\${lang.language} (\${lang.confidence}%)\`;
                        chip.setAttribute('data-tooltip', \`Type: \${lang.type}\`);
                        container.appendChild(chip);
                    });
                    
                    if (detection.mixed_language) {
                        const mixedChip = document.createElement('div');
                        mixedChip.className = 'language-chip';
                        mixedChip.style.background = 'rgba(255, 170, 0, 0.2)';
                        mixedChip.style.borderColor = '#ffaa00';
                        mixedChip.textContent = '🔀 Mixed Languages';
                        container.appendChild(mixedChip);
                    }
                }
                
                function displayDissectionResults(dissection) {
                    const container = document.getElementById('resultsContainer');
                    
                    let html = '';
                    
                    // Language Detection
                    html += \`
                        <div class="result-section">
                            <h3>📚 Language Analysis</h3>
                            <div class="result-grid">
                                <div class="result-label">Primary Language:</div>
                                <div class="result-value">\${dissection.language_detection.primary_language || 'Unknown'}</div>
                                <div class="result-label">Mixed Language:</div>
                                <div class="result-value">\${dissection.language_detection.mixed_language ? 'Yes' : 'No'}</div>
                                <div class="result-label">Confidence:</div>
                                <div class="result-value">\${Math.round(dissection.language_detection.confidence_scores[dissection.language_detection.primary_language] || 0)}%</div>
                            </div>
                        </div>
                    \`;
                    
                    // Consent Analysis
                    const consentClass = dissection.consent_analysis.has_consent ? 'granted' : 
                                       dissection.consent_analysis.operation_type === 'revoked' ? 'denied' : 'ambiguous';
                    
                    html += \`
                        <div class="result-section">
                            <h3>🤝 Consent Analysis</h3>
                            <div class="consent-indicator \${consentClass}">
                                <span>\${getConsentIcon(dissection.consent_analysis.operation_type)}</span>
                                <span>\${dissection.consent_analysis.operation_type.toUpperCase()}</span>
                            </div>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: \${dissection.consent_analysis.confidence * 100}%"></div>
                            </div>
                            <div class="result-grid">
                                <div class="result-label">Confidence:</div>
                                <div class="result-value">\${Math.round(dissection.consent_analysis.confidence * 100)}%</div>
                                <div class="result-label">Requires Confirmation:</div>
                                <div class="result-value">\${dissection.consent_analysis.requires_confirmation ? 'Yes' : 'No'}</div>
                            </div>
                        </div>
                    \`;
                    
                    // Intent Extraction
                    html += \`
                        <div class="result-section">
                            <h3>🎯 Intent Extraction</h3>
                            <div class="result-grid">
                                <div class="result-label">Primary Intent:</div>
                                <div class="result-value">\${dissection.intent_extraction.primary_intent}</div>
                                <div class="result-label">Evidence Count:</div>
                                <div class="result-value">\${dissection.intent_extraction.supporting_evidence.length}</div>
                            </div>
                        </div>
                    \`;
                    
                    // Structure Analysis
                    html += \`
                        <div class="result-section">
                            <h3>🏗️ Structure Analysis</h3>
                            <div class="result-grid">
                                <div class="result-label">Structure Type:</div>
                                <div class="result-value">\${dissection.structure_analysis.type}</div>
                                <div class="result-label">Complexity:</div>
                                <div class="result-value">\${dissection.structure_analysis.complexity}</div>
                                <div class="result-label">Components:</div>
                                <div class="result-value">\${dissection.structure_analysis.components.length}</div>
                            </div>
                        </div>
                    \`;
                    
                    // XML Mapping Preview
                    if (dissection.xml_mapping) {
                        html += \`
                            <div class="result-section">
                                <h3>📋 XML Schema Mapping</h3>
                                <div class="xml-preview">\${escapeHtml(dissection.xml_mapping)}</div>
                            </div>
                        \`;
                    }
                    
                    container.innerHTML = html;
                }
                
                function getConsentIcon(type) {
                    const icons = {
                        'explicit': '✅',
                        'implicit': '🤝',
                        'conditional': '⚡',
                        'revoked': '🚫',
                        'ambiguous': '❓',
                        'none': '⭕'
                    };
                    return icons[type] || '❓';
                }
                
                function escapeHtml(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }
                
                function clearAll() {
                    document.getElementById('inputText').value = '';
                    document.getElementById('detectedLanguages').innerHTML = '';
                    document.getElementById('resultsContainer').innerHTML = \`
                        <div style="text-align: center; color: #666; padding: 50px;">
                            Enter text and click "Dissect Communication" to analyze
                        </div>
                    \`;
                    currentDissection = null;
                    addFeedItem('Cleared all data');
                }
                
                function addFeedItem(message) {
                    const feed = document.getElementById('feedContent');
                    const item = document.createElement('div');
                    item.className = 'feed-item';
                    item.textContent = new Date().toLocaleTimeString() + ' - ' + message;
                    feed.appendChild(item);
                    
                    // Keep only last 10 items
                    if (feed.children.length > 10) {
                        feed.removeChild(feed.firstChild);
                    }
                    
                    feed.scrollTop = feed.scrollHeight;
                }
                
                function handleWebSocketMessage(data) {
                    if (data.type === 'stream_dissection') {
                        // Handle real-time streaming results
                        data.chunks.forEach(chunk => {
                            addFeedItem(\`Chunk: \${chunk.chunk} (\${chunk.language})\`);
                        });
                    }
                }
                
                // Example inputs for testing
                const examples = {
                    english_consent: "May I have your permission to process this data?",
                    japanese_polite: "データを処理してもよろしいですか？",
                    spanish_request: "Por favor, ¿puedo acceder a sus archivos?",
                    javascript_async: "async function requestUserConsent() { return await user.approve(); }",
                    sql_permission: "GRANT SELECT, INSERT ON customers TO sales_team;",
                    emoji_approval: "👍 ✅ Let's do this! 🚀",
                    legalese: "The party hereby agrees to and consents to the processing of data as outlined in Section 3.2",
                    mixed_language: "Hello! こんにちは！ May I 処理する your data? 👍",
                    mathematical: "∀x ∈ Users : hasConsent(x) → processData(x)",
                    regex_pattern: "^(yes|okay|sure|definitely)$"
                };
                
                // Initialize
                connectWebSocket();
                
                // Auto-detect on input
                let detectTimeout;
                document.getElementById('inputText').addEventListener('input', (e) => {
                    clearTimeout(detectTimeout);
                    detectTimeout = setTimeout(() => {
                        if (e.target.value.trim()) {
                            detectLanguages();
                        }
                    }, 500);
                });
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🗣️ Universal Language Dissector running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket server running on ws://localhost:${this.wsPort}`);
            console.log(`📚 ${Object.keys(this.languageAnatomy).length} languages ready for dissection`);
            console.log('🔬 Consent analysis engine active');
            console.log('🧬 XML schema mapping enabled');
        });
    }
}

// Initialize and start the dissector
const dissector = new UniversalLanguageDissector();
dissector.start();

module.exports = UniversalLanguageDissector;
/**
 * Human-in-the-Loop Review Interface for Lesson Validation
 * 
 * This system allows human educators to review, validate, and improve
 * AI-generated lessons before they are deployed to students. It integrates
 * with the character journey system and provides detailed analytics.
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class HumanReviewInterface extends EventEmitter {
    constructor() {
        super();
        
        this.port = 16000;
        this.wsPort = 16001;
        
        // Integration with existing systems
        this.services = {
            aiCurriculum: 'http://localhost:14000',
            studentSystem: 'http://localhost:15000',
            characterJourney: 'http://localhost:13000',
            stealthAssessment: 'ws://localhost:7701'
        };
        
        // Review management
        this.pendingReviews = new Map();
        this.activeReviewers = new Map();
        this.reviewSessions = new Map();
        this.lessonValidations = new Map();
        
        // Character-specific review criteria
        this.characterReviewCriteria = {
            'cal': {
                focus: ['systematic approach', 'data accuracy', 'logical flow', 'measurable outcomes'],
                weight: { technical: 0.4, pedagogy: 0.3, engagement: 0.2, character_alignment: 0.1 }
            },
            'arty': {
                focus: ['creative engagement', 'visual appeal', 'innovative approaches', 'aesthetic quality'],
                weight: { creativity: 0.4, engagement: 0.3, technical: 0.2, character_alignment: 0.1 }
            },
            'ralph': {
                focus: ['competitive elements', 'strategic thinking', 'challenge progression', 'achievement systems'],
                weight: { engagement: 0.4, challenge: 0.3, technical: 0.2, character_alignment: 0.1 }
            },
            'vera': {
                focus: ['research accuracy', 'evidence-based content', 'scholarly rigor', 'citation quality'],
                weight: { accuracy: 0.4, pedagogy: 0.3, technical: 0.2, character_alignment: 0.1 }
            },
            'paulo': {
                focus: ['practical applications', 'business relevance', 'real-world value', 'market applicability'],
                weight: { practicality: 0.4, relevance: 0.3, technical: 0.2, character_alignment: 0.1 }
            },
            'nash': {
                focus: ['communication clarity', 'collaboration opportunities', 'social learning', 'narrative flow'],
                weight: { communication: 0.4, engagement: 0.3, technical: 0.2, character_alignment: 0.1 }
            }
        };
        
        // Review queue and analytics
        this.reviewQueue = [];
        this.reviewAnalytics = {
            totalReviews: 0,
            averageReviewTime: 0,
            approvalRate: 0,
            characterDistribution: {},
            commonIssues: new Map(),
            reviewerPerformance: new Map()
        };
        
        console.log('👨‍🏫 Human Review Interface initializing...');
        this.initializeDatabase();
    }
    
    async start() {
        console.log('🚀 Starting Human Review Interface...');
        
        await this.startHTTPServer();
        await this.startWebSocketServer();
        await this.connectToExistingSystems();
        await this.loadPendingReviews();
        await this.startReviewQueueProcessor();
        
        console.log('✅ Human Review Interface ready!');
        console.log(`👨‍🏫 Review Dashboard: http://localhost:${this.port}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    async initializeDatabase() {
        const sqlite3 = require('sqlite3').verbose();
        this.reviewDatabase = new sqlite3.Database('./human_reviews.db');
        
        this.reviewDatabase.serialize(() => {
            this.reviewDatabase.run(`
                CREATE TABLE IF NOT EXISTS lesson_reviews (
                    id TEXT PRIMARY KEY,
                    lesson_id TEXT NOT NULL,
                    reviewer_id TEXT NOT NULL,
                    character TEXT NOT NULL,
                    review_status TEXT NOT NULL,
                    technical_score REAL,
                    pedagogical_score REAL,
                    engagement_score REAL,
                    character_alignment_score REAL,
                    overall_score REAL,
                    review_notes TEXT,
                    improvement_suggestions TEXT,
                    approval_status TEXT,
                    review_duration INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME
                )
            `);
            
            this.reviewDatabase.run(`
                CREATE TABLE IF NOT EXISTS reviewer_sessions (
                    id TEXT PRIMARY KEY,
                    reviewer_id TEXT NOT NULL,
                    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
                    session_end DATETIME,
                    lessons_reviewed INTEGER DEFAULT 0,
                    average_review_time REAL,
                    expertise_areas TEXT,
                    performance_rating REAL
                )
            `);
            
            this.reviewDatabase.run(`
                CREATE TABLE IF NOT EXISTS lesson_improvements (
                    id TEXT PRIMARY KEY,
                    original_lesson_id TEXT NOT NULL,
                    reviewer_id TEXT NOT NULL,
                    improvement_type TEXT NOT NULL,
                    original_content TEXT,
                    improved_content TEXT,
                    improvement_rationale TEXT,
                    character_specific_notes TEXT,
                    ai_feedback TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        });
    }
    
    async startHTTPServer() {
        const http = require('http');
        
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = req.url;
            
            if (url === '/') {
                this.serveReviewDashboard(res);
            } else if (url === '/api/reviews/queue') {
                this.serveReviewQueue(res);
            } else if (url === '/api/reviews/start' && req.method === 'POST') {
                this.handleStartReview(req, res);
            } else if (url === '/api/reviews/submit' && req.method === 'POST') {
                this.handleSubmitReview(req, res);
            } else if (url === '/api/analytics') {
                this.serveReviewAnalytics(res);
            } else if (url.startsWith('/api/lesson/')) {
                this.handleLessonAPI(req, res);
            } else if (url === '/review-interface') {
                this.serveReviewInterface(res);
            } else {
                res.writeHead(404);
                res.end('Review interface endpoint not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`👨‍🏫 Human Review Dashboard: http://localhost:${this.port}`);
        });
    }
    
    async startWebSocketServer() {
        const WebSocket = require('ws');
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws, req) => {
            const reviewerId = this.generateReviewerId();
            
            console.log(`👨‍🏫 Reviewer connected: ${reviewerId}`);
            
            // Register reviewer session
            this.reviewSessions.set(reviewerId, {
                ws: ws,
                reviewerId: reviewerId,
                startTime: Date.now(),
                currentReview: null,
                expertise: [],
                sessionsCompleted: 0
            });
            
            // Send welcome with review queue
            ws.send(JSON.stringify({
                type: 'reviewer-welcome',
                reviewerId: reviewerId,
                message: 'Welcome to the Human Review Interface! Ready to validate AI-generated lessons?',
                reviewQueue: this.getReviewQueueSummary(),
                characterCriteria: this.characterReviewCriteria
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleReviewerMessage(reviewerId, data);
                } catch (e) {
                    console.error('Invalid reviewer message:', e);
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 Reviewer disconnected: ${reviewerId}`);
                this.endReviewerSession(reviewerId);
            });
        });
        
        console.log(`📡 Review WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    async connectToExistingSystems() {
        console.log('🔗 Connecting to learning ecosystem...');
        
        // Connect to AI Curriculum Generator for lesson notifications
        try {
            const WebSocket = require('ws');
            const curriculumWs = new WebSocket('ws://localhost:14001');
            
            curriculumWs.on('open', () => {
                console.log('🔌 Connected to AI Curriculum Generator');
                curriculumWs.send(JSON.stringify({
                    type: 'system-integration',
                    source: 'human-review-interface',
                    capabilities: ['lesson-validation', 'quality-assurance', 'improvement-suggestions']
                }));
            });
            
            curriculumWs.on('message', (data) => {
                this.handleCurriculumUpdate(JSON.parse(data));
            });
        } catch (e) {
            console.log('⚠️ AI Curriculum Generator not available');
        }
        
        // Connect to Student System for impact analysis
        try {
            const studentWs = new WebSocket('ws://localhost:15001');
            
            studentWs.on('open', () => {
                console.log('🔌 Connected to Student System');
                this.studentSystemConnection = studentWs;
            });
            
            studentWs.on('message', (data) => {
                this.handleStudentSystemUpdate(JSON.parse(data));
            });
        } catch (e) {
            console.log('⚠️ Student System not available');
        }
    }
    
    async loadPendingReviews() {
        console.log('📋 Loading pending lesson reviews...');
        
        // Load pending reviews from database
        return new Promise((resolve, reject) => {
            this.reviewDatabase.all(`
                SELECT * FROM lesson_reviews 
                WHERE review_status = 'pending' 
                ORDER BY created_at ASC
            `, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    rows.forEach(row => {
                        this.pendingReviews.set(row.lesson_id, {
                            id: row.id,
                            lessonId: row.lesson_id,
                            character: row.character,
                            status: 'pending',
                            priority: this.calculateReviewPriority(row),
                            createdAt: new Date(row.created_at)
                        });
                    });
                    
                    console.log(`✅ Loaded ${rows.length} pending reviews`);
                    resolve(rows.length);
                }
            });
        });
    }
    
    async startReviewQueueProcessor() {
        // Process review queue every 30 seconds
        setInterval(() => {
            this.processReviewQueue();
        }, 30000);
        
        console.log('⚙️ Review queue processor started');
    }
    
    async handleReviewerMessage(reviewerId, data) {
        const session = this.reviewSessions.get(reviewerId);
        if (!session) return;
        
        console.log(`📨 Reviewer message from ${reviewerId}:`, data.type);
        
        switch (data.type) {
            case 'request-review':
                await this.handleRequestReview(reviewerId, data.criteria);
                break;
            case 'start-lesson-review':
                await this.handleStartLessonReview(reviewerId, data.lessonId);
                break;
            case 'submit-review-section':
                await this.handleSubmitReviewSection(reviewerId, data.section);
                break;
            case 'submit-final-review':
                await this.handleSubmitFinalReview(reviewerId, data.review);
                break;
            case 'request-lesson-improvement':
                await this.handleRequestLessonImprovement(reviewerId, data.improvementRequest);
                break;
            case 'submit-improvement':
                await this.handleSubmitImprovement(reviewerId, data.improvement);
                break;
            case 'set-expertise':
                await this.handleSetExpertise(reviewerId, data.expertise);
                break;
        }
    }
    
    async handleRequestReview(reviewerId, criteria) {
        const session = this.reviewSessions.get(reviewerId);
        
        // Find suitable lesson for review based on criteria
        const suitableReviews = Array.from(this.pendingReviews.values())
            .filter(review => {
                if (criteria.character && review.character !== criteria.character) {
                    return false;
                }
                if (criteria.difficulty && Math.abs(review.difficulty - criteria.difficulty) > 0.3) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => b.priority - a.priority);
        
        if (suitableReviews.length === 0) {
            session.ws.send(JSON.stringify({
                type: 'no-reviews-available',
                message: 'No lessons matching your criteria are currently available for review.',
                suggestions: ['Try different criteria', 'Check back later', 'Review any available lesson']
            }));
            return;
        }
        
        // Send top matches
        session.ws.send(JSON.stringify({
            type: 'reviews-available',
            reviews: suitableReviews.slice(0, 5),
            message: `Found ${suitableReviews.length} lessons matching your criteria.`,
            recommendation: suitableReviews[0]
        }));
    }
    
    async handleStartLessonReview(reviewerId, lessonId) {
        const session = this.reviewSessions.get(reviewerId);
        const review = this.pendingReviews.get(lessonId);
        
        if (!review) {
            session.ws.send(JSON.stringify({
                type: 'error',
                message: 'Lesson not found or already under review'
            }));
            return;
        }
        
        // Load lesson content
        const lessonContent = await this.loadLessonContent(lessonId);
        if (!lessonContent) {
            session.ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to load lesson content'
            }));
            return;
        }
        
        // Mark as under review
        review.status = 'in_review';
        review.reviewerId = reviewerId;
        review.reviewStartTime = Date.now();
        session.currentReview = lessonId;
        
        // Get character-specific review criteria
        const criteria = this.characterReviewCriteria[review.character];
        
        // Send lesson content with review interface
        session.ws.send(JSON.stringify({
            type: 'lesson-review-started',
            lessonId: lessonId,
            character: review.character,
            lessonContent: lessonContent,
            reviewCriteria: criteria,
            reviewSections: this.generateReviewSections(lessonContent, criteria),
            message: `Starting review of ${review.character}'s lesson. Focus on ${criteria.focus.join(', ')}.`
        }));
        
        // Create review record
        await this.createReviewRecord(reviewerId, lessonId, review.character);
    }
    
    async handleSubmitFinalReview(reviewerId, reviewData) {
        const session = this.reviewSessions.get(reviewerId);
        const lessonId = session.currentReview;
        
        if (!lessonId) {
            session.ws.send(JSON.stringify({
                type: 'error',
                message: 'No active review session'
            }));
            return;
        }
        
        // Calculate overall score
        const overallScore = this.calculateOverallScore(reviewData, lessonId);
        
        // Store review in database
        await this.storeReviewResults(reviewerId, lessonId, reviewData, overallScore);
        
        // Update lesson status based on review
        const approved = overallScore >= 70; // 70% threshold for approval
        await this.updateLessonStatus(lessonId, approved ? 'approved' : 'needs_improvement', reviewData);
        
        // Send confirmation
        session.ws.send(JSON.stringify({
            type: 'review-submitted',
            lessonId: lessonId,
            overallScore: overallScore,
            approved: approved,
            message: approved ? 
                'Lesson approved! It will be deployed to students.' : 
                'Lesson needs improvement. Suggestions have been recorded.',
            nextRecommendations: await this.getNextReviewRecommendations(reviewerId)
        }));
        
        // Clean up session
        session.currentReview = null;
        session.sessionsCompleted++;
        
        // Remove from pending reviews
        this.pendingReviews.delete(lessonId);
        
        // Update analytics
        this.updateReviewAnalytics(reviewerId, reviewData, overallScore);
        
        // Notify other systems
        this.notifySystemsOfReviewCompletion(lessonId, approved, reviewData);
    }
    
    async handleSubmitImprovement(reviewerId, improvement) {
        const session = this.reviewSessions.get(reviewerId);
        
        // Store improvement suggestion
        await this.storeImprovementSuggestion(reviewerId, improvement);
        
        // Generate AI feedback on the improvement
        const aiFeedback = await this.generateAIFeedbackOnImprovement(improvement);
        
        // Send confirmation
        session.ws.send(JSON.stringify({
            type: 'improvement-submitted',
            improvementId: improvement.id,
            aiFeedback: aiFeedback,
            message: 'Improvement suggestion submitted and analyzed by AI.',
            impactEstimate: this.estimateImprovementImpact(improvement)
        }));
        
        // If improvement is significant, trigger lesson regeneration
        if (improvement.significance === 'major') {
            this.triggerLessonRegeneration(improvement.lessonId, improvement);
        }
    }
    
    // Character-specific review helpers
    generateReviewSections(lessonContent, criteria) {
        const baseSections = [
            {
                id: 'technical_accuracy',
                title: 'Technical Accuracy',
                description: 'Verify the technical correctness of code and concepts',
                weight: criteria.weight.technical || 0.2
            },
            {
                id: 'pedagogical_quality',
                title: 'Pedagogical Quality',
                description: 'Assess the educational effectiveness and learning progression',
                weight: criteria.weight.pedagogy || 0.3
            },
            {
                id: 'engagement_factor',
                title: 'Student Engagement',
                description: 'Evaluate how engaging and motivating the lesson is',
                weight: criteria.weight.engagement || 0.3
            },
            {
                id: 'character_alignment',
                title: 'Character Alignment',
                description: 'Check alignment with character personality and teaching style',
                weight: criteria.weight.character_alignment || 0.2
            }
        ];
        
        // Add character-specific sections
        const characterSpecific = this.getCharacterSpecificSections(lessonContent.character);
        
        return [...baseSections, ...characterSpecific];
    }
    
    getCharacterSpecificSections(character) {
        const sections = {
            'cal': [{
                id: 'systematic_approach',
                title: 'Systematic Methodology',
                description: 'Verify step-by-step logical progression and metrics',
                weight: 0.3
            }],
            'arty': [{
                id: 'creative_elements',
                title: 'Creative Expression',
                description: 'Assess visual appeal and innovative teaching methods',
                weight: 0.3
            }],
            'ralph': [{
                id: 'competitive_design',
                title: 'Competitive Elements',
                description: 'Evaluate challenge progression and achievement systems',
                weight: 0.3
            }],
            'vera': [{
                id: 'scholarly_rigor',
                title: 'Academic Rigor',
                description: 'Check research accuracy and evidence-based content',
                weight: 0.3
            }],
            'paulo': [{
                id: 'practical_application',
                title: 'Real-World Relevance',
                description: 'Assess practical value and business applicability',
                weight: 0.3
            }],
            'nash': [{
                id: 'communication_clarity',
                title: 'Communication Excellence',
                description: 'Evaluate clarity, narrative flow, and collaboration opportunities',
                weight: 0.3
            }]
        };
        
        return sections[character] || [];
    }
    
    calculateOverallScore(reviewData, lessonId) {
        const review = this.pendingReviews.get(lessonId);
        const criteria = this.characterReviewCriteria[review.character];
        
        let weightedScore = 0;
        let totalWeight = 0;
        
        Object.entries(reviewData.sections).forEach(([sectionId, score]) => {
            const section = reviewData.reviewSections.find(s => s.id === sectionId);
            if (section) {
                weightedScore += score * section.weight;
                totalWeight += section.weight;
            }
        });
        
        return totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
    }
    
    // Database operations
    async createReviewRecord(reviewerId, lessonId, character) {
        return new Promise((resolve, reject) => {
            const reviewId = `review_${crypto.randomBytes(8).toString('hex')}`;
            
            this.reviewDatabase.run(`
                INSERT INTO lesson_reviews 
                (id, lesson_id, reviewer_id, character, review_status)
                VALUES (?, ?, ?, ?, 'in_progress')
            `, [reviewId, lessonId, reviewerId, character], function(err) {
                if (err) reject(err);
                else resolve(reviewId);
            });
        });
    }
    
    async storeReviewResults(reviewerId, lessonId, reviewData, overallScore) {
        return new Promise((resolve, reject) => {
            this.reviewDatabase.run(`
                UPDATE lesson_reviews 
                SET technical_score = ?,
                    pedagogical_score = ?,
                    engagement_score = ?,
                    character_alignment_score = ?,
                    overall_score = ?,
                    review_notes = ?,
                    improvement_suggestions = ?,
                    approval_status = ?,
                    review_duration = ?,
                    completed_at = CURRENT_TIMESTAMP,
                    review_status = 'completed'
                WHERE lesson_id = ? AND reviewer_id = ?
            `, [
                reviewData.sections.technical_accuracy || 0,
                reviewData.sections.pedagogical_quality || 0,
                reviewData.sections.engagement_factor || 0,
                reviewData.sections.character_alignment || 0,
                overallScore,
                JSON.stringify(reviewData.notes || {}),
                JSON.stringify(reviewData.improvements || []),
                overallScore >= 70 ? 'approved' : 'needs_improvement',
                Date.now() - (this.reviewSessions.get(reviewerId)?.startTime || Date.now()),
                lessonId,
                reviewerId
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
    
    async storeImprovementSuggestion(reviewerId, improvement) {
        return new Promise((resolve, reject) => {
            const improvementId = `improvement_${crypto.randomBytes(8).toString('hex')}`;
            
            this.reviewDatabase.run(`
                INSERT INTO lesson_improvements 
                (id, original_lesson_id, reviewer_id, improvement_type, 
                 original_content, improved_content, improvement_rationale, character_specific_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                improvementId,
                improvement.lessonId,
                reviewerId,
                improvement.type,
                improvement.originalContent,
                improvement.improvedContent,
                improvement.rationale,
                improvement.characterNotes
            ], function(err) {
                if (err) reject(err);
                else resolve(improvementId);
            });
        });
    }
    
    // System integration methods
    handleCurriculumUpdate(message) {
        if (message.type === 'lesson-generated') {
            this.addLessonToReviewQueue(message.lesson);
        }
    }
    
    addLessonToReviewQueue(lesson) {
        const reviewRequest = {
            id: `review_${lesson.id}`,
            lessonId: lesson.id,
            character: lesson.character,
            status: 'pending',
            priority: this.calculateReviewPriority(lesson),
            createdAt: new Date()
        };
        
        this.pendingReviews.set(lesson.id, reviewRequest);
        this.reviewQueue.push(reviewRequest);
        
        // Notify active reviewers
        this.broadcastToReviewers({
            type: 'new-review-available',
            review: reviewRequest,
            message: `New ${lesson.character} lesson available for review`
        });
        
        console.log(`📋 Added lesson ${lesson.id} to review queue`);
    }
    
    notifySystemsOfReviewCompletion(lessonId, approved, reviewData) {
        // Notify AI Curriculum Generator
        if (this.curriculumConnection) {
            this.curriculumConnection.send(JSON.stringify({
                type: 'lesson-review-complete',
                lessonId: lessonId,
                approved: approved,
                feedback: reviewData.improvements,
                score: reviewData.overallScore
            }));
        }
        
        // Notify Student System if approved
        if (approved && this.studentSystemConnection) {
            this.studentSystemConnection.send(JSON.stringify({
                type: 'lesson-approved',
                lessonId: lessonId,
                deploymentReady: true
            }));
        }
    }
    
    // Dashboard and interface methods
    serveReviewDashboard(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>👨‍🏫 Human Review Interface</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #0a0a0a; 
            color: #00ff00; 
            margin: 0; 
            padding: 20px; 
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #00ff00; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
        }
        .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 20px; 
        }
        .panel { 
            background: rgba(0, 255, 0, 0.05); 
            border: 2px solid #00ff00; 
            border-radius: 10px; 
            padding: 20px; 
        }
        .review-item { 
            background: rgba(255, 255, 255, 0.05); 
            margin: 5px 0; 
            padding: 10px; 
            border-radius: 5px; 
            border-left: 4px solid #ffff00; 
        }
        .character-cal { border-left-color: #4A90E2; }
        .character-arty { border-left-color: #F5A623; }
        .character-ralph { border-left-color: #D0021B; }
        .character-vera { border-left-color: #50E3C2; }
        .character-paulo { border-left-color: #7ED321; }
        .character-nash { border-left-color: #9013FE; }
        .pending { border-left-color: #ffff00; }
        .in-review { border-left-color: #ff9900; }
        .approved { border-left-color: #00ff00; }
        .needs-improvement { border-left-color: #ff4444; }
        button { 
            background: #003300; 
            color: #00ff00; 
            border: 1px solid #00ff00; 
            padding: 8px 15px; 
            cursor: pointer; 
            font-family: inherit; 
            margin: 5px; 
        }
        button:hover { background: #00ff00; color: #000; }
        .stats { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr 1fr; 
            gap: 10px; 
            margin: 20px 0; 
        }
        .stat-box { 
            text-align: center; 
            background: rgba(0, 255, 255, 0.1); 
            padding: 15px; 
            border-radius: 5px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>👨‍🏫 Human Review Interface</h1>
        <p>AI-Generated Lesson Validation & Quality Assurance</p>
        <div id="status">🔄 Loading...</div>
    </div>
    
    <div class="stats">
        <div class="stat-box">
            <h3>📋 Pending Reviews</h3>
            <div id="pending-count">0</div>
        </div>
        <div class="stat-box">
            <h3>🔄 In Progress</h3>
            <div id="progress-count">0</div>
        </div>
        <div class="stat-box">
            <h3>✅ Approved Today</h3>
            <div id="approved-count">0</div>
        </div>
        <div class="stat-box">
            <h3>📈 Approval Rate</h3>
            <div id="approval-rate">0%</div>
        </div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h2>📋 Review Queue</h2>
            <div id="review-queue"></div>
            <button onclick="startReview()">🚀 Start Review</button>
        </div>
        
        <div class="panel">
            <h2>👨‍🏫 Active Reviewers</h2>
            <div id="reviewer-list"></div>
            <button onclick="joinAsReviewer()">➕ Join as Reviewer</button>
        </div>
        
        <div class="panel">
            <h2>📊 Review Analytics</h2>
            <div id="analytics-overview"></div>
            <button onclick="viewDetailedAnalytics()">📈 Detailed View</button>
        </div>
    </div>
    
    <div class="panel" style="margin-top: 20px;">
        <h2>🎯 Character-Specific Review Criteria</h2>
        <div id="character-criteria"></div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        let reviewQueue = [];
        let activeReviewers = new Map();
        
        ws.onopen = () => {
            document.getElementById('status').innerHTML = '🟢 Review System Online';
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleReviewUpdate(data);
        };
        
        function handleReviewUpdate(data) {
            switch (data.type) {
                case 'review-queue-update':
                    updateReviewQueue(data.queue);
                    break;
                case 'reviewer-joined':
                    addReviewerToList(data.reviewer);
                    break;
                case 'review-completed':
                    updateReviewStats(data.stats);
                    break;
            }
        }
        
        function startReview() {
            window.open('/review-interface', '_blank');
        }
        
        function joinAsReviewer() {
            const expertise = prompt('Your expertise areas (comma-separated):');
            if (expertise) {
                ws.send(JSON.stringify({
                    type: 'join-as-reviewer',
                    expertise: expertise.split(',').map(e => e.trim())
                }));
            }
        }
        
        function updateReviewQueue(queue) {
            const list = document.getElementById('review-queue');
            list.innerHTML = '';
            queue.forEach(review => {
                const div = document.createElement('div');
                div.className = \`review-item character-\${review.character} \${review.status}\`;
                div.innerHTML = \`
                    <strong>\${review.character.toUpperCase()}</strong> - \${review.lessonId}<br>
                    <small>Priority: \${review.priority} | Status: \${review.status}</small>
                    <button onclick="reviewLesson('\${review.lessonId}')">📝 Review</button>
                \`;
                list.appendChild(div);
            });
            
            document.getElementById('pending-count').textContent = queue.filter(r => r.status === 'pending').length;
        }
        
        function reviewLesson(lessonId) {
            ws.send(JSON.stringify({
                type: 'start-lesson-review',
                lessonId: lessonId
            }));
        }
        
        // Load initial data
        fetch('/api/reviews/queue')
            .then(r => r.json())
            .then(data => updateReviewQueue(data.queue));
            
        fetch('/api/analytics')
            .then(r => r.json())
            .then(data => {
                document.getElementById('approval-rate').textContent = data.approvalRate + '%';
                document.getElementById('approved-count').textContent = data.approvedToday;
            });
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    // Utility methods
    calculateReviewPriority(lesson) {
        let priority = 5; // Base priority
        
        // Higher priority for certain characters
        if (lesson.character === 'cal') priority += 2; // Systematic lessons need careful review
        if (lesson.character === 'vera') priority += 1; // Research accuracy important
        
        // Higher priority for complex lessons
        if (lesson.difficulty > 0.7) priority += 2;
        
        // Higher priority for older lessons
        const ageHours = (Date.now() - new Date(lesson.createdAt).getTime()) / (1000 * 60 * 60);
        if (ageHours > 24) priority += 3;
        
        return Math.min(10, priority);
    }
    
    getReviewQueueSummary() {
        return Array.from(this.pendingReviews.values())
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 10);
    }
    
    generateReviewerId() {
        return `reviewer_${crypto.randomBytes(6).toString('hex')}_${Date.now()}`;
    }
    
    broadcastToReviewers(message) {
        this.reviewSessions.forEach((session, reviewerId) => {
            if (session.ws.readyState === 1) { // WebSocket.OPEN
                session.ws.send(JSON.stringify(message));
            }
        });
    }
    
    endReviewerSession(reviewerId) {
        const session = this.reviewSessions.get(reviewerId);
        if (session) {
            console.log(`📝 Reviewer ${reviewerId} completed ${session.sessionsCompleted} reviews`);
            this.reviewSessions.delete(reviewerId);
        }
    }
}

// Auto-start if run directly
if (require.main === module) {
    console.log('👨‍🏫 STARTING HUMAN REVIEW INTERFACE');
    console.log('📝 AI Lesson Validation & Quality Assurance System');
    console.log('==================================================\n');
    
    const reviewInterface = new HumanReviewInterface();
    reviewInterface.start().catch(console.error);
    
    console.log('✨ Ready for human-in-the-loop lesson validation!');
}

module.exports = HumanReviewInterface;
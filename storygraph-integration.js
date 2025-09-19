/**
 * Storygraph Integration for Educational Book Platform
 * Connects with Storygraph API for book discovery, reading challenges, and educational tracking
 * Focuses on data-driven reader insights and learning pathways
 */

const EventEmitter = require('events');
const axios = require('axios');
const crypto = require('crypto');

class StorygraphIntegration extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Storygraph API configuration
            api: {
                baseUrl: 'https://app.thestorygraph.com/api/v1',
                apiKey: process.env.STORYGRAPH_API_KEY,
                clientId: process.env.STORYGRAPH_CLIENT_ID,
                clientSecret: process.env.STORYGRAPH_CLIENT_SECRET
            },
            
            // Educational book categories on Storygraph
            categories: {
                educational: ['education', 'self-help', 'professional-development'],
                gaming: ['gaming', 'video-games', 'game-design'],
                skillDevelopment: ['skill-building', 'career', 'personal-growth'],
                technology: ['technology', 'computer-science', 'programming']
            },
            
            // Storygraph-specific features
            features: {
                moodTracking: true,
                paceTracking: true,
                contentWarnings: true,
                readingChallenges: true,
                buddyReads: true,
                customPrompts: true
            },
            
            // Educational mood mappings
            moods: {
                educational: {
                    'informative': { weight: 1.0, description: 'High educational value' },
                    'inspiring': { weight: 0.8, description: 'Motivates learning' },
                    'challenging': { weight: 0.7, description: 'Pushes boundaries' },
                    'reflective': { weight: 0.6, description: 'Encourages thinking' }
                },
                pacing: {
                    'slow': { learning: 'deep', suitable: 'beginners' },
                    'medium': { learning: 'balanced', suitable: 'intermediate' },
                    'fast': { learning: 'quick-reference', suitable: 'advanced' }
                }
            },
            
            // Reading challenge templates
            challenges: {
                'skill-builder': {
                    name: 'Skill Builder Challenge',
                    description: 'Read books that teach you new skills',
                    goals: ['Learn 12 new skills', 'Apply to real life', 'Track progress'],
                    duration: 365, // days
                    books: 12
                },
                'gaming-education': {
                    name: 'Gaming to Growth Challenge',
                    description: 'Transform gaming knowledge into life skills',
                    goals: ['Read gaming education books', 'Complete exercises', 'Level up IRL'],
                    duration: 180,
                    books: 6
                },
                'financial-literacy': {
                    name: 'GP to GDP Challenge',
                    description: 'Master money through gaming economics',
                    goals: ['Understand game economies', 'Apply to personal finance', 'Track savings'],
                    duration: 90,
                    books: 3
                }
            },
            
            // Custom prompts for educational books
            customPrompts: {
                preReading: [
                    'What skill do you hope to learn from this book?',
                    'How will you apply this knowledge in real life?',
                    'What gaming experience relates to this topic?'
                ],
                duringReading: [
                    'What connections are you making to your gaming experience?',
                    'Which concepts are clicking for you?',
                    'How would you explain this to a fellow gamer?'
                ],
                postReading: [
                    'What skills did you actually develop?',
                    'How has this changed your gaming perspective?',
                    'What will you do differently now?'
                ]
            },
            
            // Integration settings
            integration: {
                syncWithGoodreads: true,
                importReadingHistory: true,
                exportProgressData: true,
                educationalTracking: true
            },
            
            // Multi-language support
            languages: ['en', 'es', 'fr', 'de', 'pt', 'it'],
            
            ...config
        };
        
        // State management
        this.userProfiles = new Map();
        this.publishedBooks = new Map();
        this.readingChallenges = new Map();
        this.buddyReads = new Map();
        this.readingInsights = new Map();
        
        // Statistics
        this.stats = {
            booksPublished: 0,
            usersReached: 0,
            challengesCreated: 0,
            insightsGathered: 0,
            skillsTracked: new Map()
        };
        
        console.log('📊 Storygraph Integration initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Validate API credentials
            await this.validateCredentials();
            
            // Set up API client
            this.setupAPIClient();
            
            // Initialize features
            await this.initializeFeatures();
            
            console.log('✅ Storygraph Integration ready');
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Storygraph Integration:', error);
            throw error;
        }
    }
    
    async validateCredentials() {
        if (!this.config.api.apiKey) {
            console.warn('⚠️  No Storygraph API key provided - using mock mode');
            this.mockMode = true;
        }
    }
    
    setupAPIClient() {
        this.apiClient = axios.create({
            baseURL: this.config.api.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.config.api.apiKey}`,
                'Content-Type': 'application/json',
                'X-Client-ID': this.config.api.clientId
            },
            timeout: 10000
        });
        
        // Add request interceptor for logging
        this.apiClient.interceptors.request.use(request => {
            console.log(`📤 Storygraph API: ${request.method?.toUpperCase()} ${request.url}`);
            return request;
        });
        
        // Add response interceptor for error handling
        this.apiClient.interceptors.response.use(
            response => response,
            error => {
                console.error('❌ Storygraph API Error:', error.message);
                throw error;
            }
        );
    }
    
    async initializeFeatures() {
        console.log('🔧 Initializing Storygraph features...');
        
        // Initialize reading challenge templates
        for (const [id, challenge] of Object.entries(this.config.challenges)) {
            this.readingChallenges.set(id, {
                ...challenge,
                id,
                participants: 0,
                booksCompleted: 0,
                created: new Date()
            });
        }
        
        console.log(`✅ Initialized ${this.readingChallenges.size} challenge templates`);
    }
    
    // ==================== BOOK PUBLISHING ====================
    
    async publishBook(bookData, options = {}) {
        console.log(`📚 Publishing to Storygraph: "${bookData.title}"`);
        
        try {
            // Format book for Storygraph
            const storygraphBook = await this.formatForStorygraph(bookData);
            
            // Submit to Storygraph
            const result = await this.submitToStorygraph(storygraphBook);
            
            // Set up tracking
            await this.setupBookTracking(result.bookId, bookData);
            
            // Create associated content
            if (options.createChallenge) {
                await this.createBookChallenge(result.bookId, bookData);
            }
            
            if (options.createBuddyRead) {
                await this.createBuddyRead(result.bookId, bookData);
            }
            
            // Track publication
            this.trackPublication(result.bookId, bookData);
            
            console.log(`✅ Published to Storygraph: ${result.url}`);
            
            this.emit('book-published', {
                bookId: result.bookId,
                storygraphUrl: result.url,
                bookData
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Failed to publish to Storygraph:', error);
            throw error;
        }
    }
    
    async formatForStorygraph(bookData) {
        const formatted = {
            title: bookData.title,
            author: bookData.author?.name || 'RuneScape Educational Platform',
            isbn: bookData.isbn,
            description: bookData.description,
            language: bookData.language || 'en',
            pageCount: bookData.pageCount || bookData.pages,
            publicationDate: bookData.publicationDate || new Date().toISOString(),
            
            // Storygraph-specific metadata
            moods: this.extractMoods(bookData),
            pace: this.determinePace(bookData),
            genres: this.mapToStorygraphGenres(bookData),
            tags: this.generateTags(bookData),
            contentWarnings: this.identifyContentWarnings(bookData),
            
            // Educational metadata
            educationalValue: {
                skillsTargeted: bookData.skillsTargeted || [],
                learningOutcomes: bookData.learningOutcomes || [],
                difficultyLevel: bookData.difficultyLevel || 'intermediate',
                prerequisites: bookData.prerequisites || [],
                applicationArea: bookData.applicationArea || 'general'
            },
            
            // Custom prompts
            customPrompts: this.generateCustomPrompts(bookData),
            
            // Series information
            series: bookData.series ? {
                name: bookData.series.name,
                position: bookData.volumeNumber || 1
            } : null
        };
        
        return formatted;
    }
    
    extractMoods(bookData) {
        const moods = [];
        
        // Check for educational moods
        if (bookData.genre?.includes('education') || bookData.categories?.includes('Education')) {
            moods.push('informative');
        }
        
        if (bookData.description?.toLowerCase().includes('inspir')) {
            moods.push('inspiring');
        }
        
        if (bookData.description?.toLowerCase().includes('challeng')) {
            moods.push('challenging');
        }
        
        // Add default educational mood if none found
        if (moods.length === 0) {
            moods.push('informative');
        }
        
        return moods;
    }
    
    determinePace(bookData) {
        // Determine reading pace based on content complexity
        if (bookData.difficultyLevel === 'beginner' || bookData.pageCount < 200) {
            return 'fast';
        } else if (bookData.difficultyLevel === 'advanced' || bookData.pageCount > 400) {
            return 'slow';
        }
        return 'medium';
    }
    
    mapToStorygraphGenres(bookData) {
        const genreMap = {
            'Educational Gaming': ['education', 'gaming', 'self-help'],
            'Self-Help': ['self-help', 'personal-development'],
            'Business & Money': ['business', 'finance', 'career'],
            'Technology': ['technology', 'computer-science']
        };
        
        const genres = new Set(['nonfiction']); // All educational books are nonfiction
        
        // Add mapped genres
        for (const [category, storygraphGenres] of Object.entries(genreMap)) {
            if (bookData.categories?.includes(category) || bookData.genre === category) {
                storygraphGenres.forEach(g => genres.add(g));
            }
        }
        
        return Array.from(genres);
    }
    
    generateTags(bookData) {
        const tags = new Set();
        
        // Add skill-based tags
        if (bookData.skillsTargeted) {
            bookData.skillsTargeted.forEach(skill => 
                tags.add(skill.toLowerCase().replace(/\s+/g, '-'))
            );
        }
        
        // Add gaming-related tags
        if (bookData.title?.toLowerCase().includes('runescape') || 
            bookData.description?.toLowerCase().includes('gaming')) {
            tags.add('gaming-education');
            tags.add('gamification');
        }
        
        // Add educational tags
        tags.add('skill-development');
        tags.add('educational');
        tags.add('learning-through-gaming');
        
        // Add language tag if not English
        if (bookData.language && bookData.language !== 'en') {
            tags.add(`language-${bookData.language}`);
        }
        
        return Array.from(tags);
    }
    
    identifyContentWarnings(bookData) {
        // Educational books typically have minimal content warnings
        const warnings = [];
        
        // Check for gaming addiction discussions
        if (bookData.description?.toLowerCase().includes('addiction')) {
            warnings.push('discussion-of-gaming-addiction');
        }
        
        // Check for financial stress topics
        if (bookData.categories?.includes('Financial Literacy')) {
            warnings.push('financial-stress-discussion');
        }
        
        return warnings;
    }
    
    generateCustomPrompts(bookData) {
        const prompts = {
            beforeReading: [],
            whileReading: [],
            afterReading: []
        };
        
        // Skill-specific prompts
        if (bookData.skillsTargeted?.includes('Customer Service')) {
            prompts.beforeReading.push('What customer service challenges do you currently face?');
            prompts.whileReading.push('How could you apply this gaming scenario to a real customer interaction?');
            prompts.afterReading.push('Which techniques will you try in your next customer interaction?');
        }
        
        if (bookData.skillsTargeted?.includes('Financial Literacy')) {
            prompts.beforeReading.push('What are your current financial goals?');
            prompts.whileReading.push('How does this GP strategy relate to your real-world budget?');
            prompts.afterReading.push('What financial habit will you implement from this book?');
        }
        
        // Add general educational prompts
        prompts.beforeReading.push(...this.config.customPrompts.preReading);
        prompts.whileReading.push(...this.config.customPrompts.duringReading);
        prompts.afterReading.push(...this.config.customPrompts.postReading);
        
        return prompts;
    }
    
    async submitToStorygraph(bookData) {
        if (this.mockMode) {
            // Mock submission for development
            return {
                bookId: `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                url: `https://app.thestorygraph.com/books/${bookData.isbn}`,
                status: 'published',
                publishedAt: new Date().toISOString()
            };
        }
        
        try {
            const response = await this.apiClient.post('/books', bookData);
            return {
                bookId: response.data.id,
                url: response.data.url,
                status: 'published',
                publishedAt: response.data.created_at
            };
        } catch (error) {
            console.error('Storygraph submission error:', error);
            throw error;
        }
    }
    
    async setupBookTracking(bookId, bookData) {
        // Initialize tracking for reader insights
        this.readingInsights.set(bookId, {
            bookId,
            title: bookData.title,
            readers: new Map(),
            skillProgress: new Map(),
            completionRate: 0,
            averageReadingTime: 0,
            moodFeedback: new Map(),
            learningOutcomes: new Map()
        });
        
        console.log(`📊 Book tracking initialized for: ${bookId}`);
    }
    
    // ==================== READING CHALLENGES ====================
    
    async createBookChallenge(bookId, bookData) {
        console.log(`🏆 Creating reading challenge for: ${bookData.title}`);
        
        // Select appropriate challenge template
        let challengeTemplate;
        if (bookData.skillsTargeted?.includes('Customer Service')) {
            challengeTemplate = this.config.challenges['skill-builder'];
        } else if (bookData.skillsTargeted?.includes('Financial Literacy')) {
            challengeTemplate = this.config.challenges['financial-literacy'];
        } else {
            challengeTemplate = this.config.challenges['gaming-education'];
        }
        
        const challenge = {
            id: `challenge_${Date.now()}`,
            name: `${bookData.title} Challenge`,
            description: `Master the skills from ${bookData.title}`,
            ...challengeTemplate,
            associatedBook: bookId,
            startDate: new Date(),
            endDate: new Date(Date.now() + challengeTemplate.duration * 24 * 60 * 60 * 1000),
            milestones: this.generateChallengeMilestones(bookData),
            rewards: this.generateChallengeRewards(bookData)
        };
        
        // Submit challenge to Storygraph
        if (!this.mockMode) {
            try {
                const response = await this.apiClient.post('/challenges', challenge);
                challenge.storygraphId = response.data.id;
                challenge.url = response.data.url;
            } catch (error) {
                console.error('Failed to create challenge:', error);
            }
        }
        
        this.readingChallenges.set(challenge.id, challenge);
        this.stats.challengesCreated++;
        
        console.log(`✅ Challenge created: ${challenge.name}`);
        
        return challenge;
    }
    
    generateChallengeMilestones(bookData) {
        const milestones = [
            {
                name: 'First Chapter',
                description: 'Complete the introduction and first chapter',
                progress: 10,
                reward: 'Beginner Badge'
            },
            {
                name: 'Halfway Hero',
                description: 'Reach the midpoint of the book',
                progress: 50,
                reward: 'Persistence Badge'
            },
            {
                name: 'Knowledge Applied',
                description: 'Complete one practical exercise',
                progress: 70,
                reward: 'Practitioner Badge'
            },
            {
                name: 'Book Master',
                description: 'Finish the book and final assessment',
                progress: 100,
                reward: 'Master Badge'
            }
        ];
        
        // Add skill-specific milestones
        if (bookData.skillsTargeted?.includes('Financial Literacy')) {
            milestones.push({
                name: 'Budget Created',
                description: 'Create your first real-world budget',
                progress: 80,
                reward: 'Financial Planner Badge'
            });
        }
        
        return milestones;
    }
    
    generateChallengeRewards(bookData) {
        return {
            badges: ['Reader', 'Learner', 'Practitioner', 'Master'],
            certificates: bookData.certificationInfo ? ['Completion Certificate'] : [],
            socialRecognition: ['Challenge Winner Profile Badge', 'Community Shoutout'],
            unlocks: ['Advanced Reading Prompts', 'Exclusive Author Q&A Access']
        };
    }
    
    // ==================== BUDDY READS ====================
    
    async createBuddyRead(bookId, bookData) {
        console.log(`👥 Creating buddy read for: ${bookData.title}`);
        
        const buddyRead = {
            id: `buddy_${Date.now()}`,
            bookId,
            title: `Learn Together: ${bookData.title}`,
            description: 'Join others learning the same skills through gaming',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Start in 1 week
            duration: 30, // days
            maxParticipants: 20,
            
            // Educational buddy read features
            features: {
                weeklyDiscussions: true,
                practicePartners: true,
                skillSharingSession: true,
                groupExercises: true
            },
            
            schedule: this.generateBuddyReadSchedule(bookData),
            discussionPrompts: this.generateDiscussionPrompts(bookData)
        };
        
        // Submit to Storygraph
        if (!this.mockMode) {
            try {
                const response = await this.apiClient.post('/buddy-reads', buddyRead);
                buddyRead.storygraphId = response.data.id;
                buddyRead.url = response.data.url;
            } catch (error) {
                console.error('Failed to create buddy read:', error);
            }
        }
        
        this.buddyReads.set(buddyRead.id, buddyRead);
        
        console.log(`✅ Buddy read created: ${buddyRead.title}`);
        
        return buddyRead;
    }
    
    generateBuddyReadSchedule(bookData) {
        const totalPages = bookData.pageCount || 200;
        const schedule = [];
        
        // Week 1: Introduction and foundations
        schedule.push({
            week: 1,
            pages: `1-${Math.floor(totalPages * 0.25)}`,
            focus: 'Understanding core concepts',
            activities: ['Introductions', 'Share gaming backgrounds', 'Set learning goals']
        });
        
        // Week 2: Deep dive
        schedule.push({
            week: 2,
            pages: `${Math.floor(totalPages * 0.25)}-${Math.floor(totalPages * 0.5)}`,
            focus: 'Applying concepts to gaming scenarios',
            activities: ['Practice exercises', 'Share game screenshots', 'Peer feedback']
        });
        
        // Week 3: Real-world application
        schedule.push({
            week: 3,
            pages: `${Math.floor(totalPages * 0.5)}-${Math.floor(totalPages * 0.75)}`,
            focus: 'Translating to real-world skills',
            activities: ['Real-world challenges', 'Success stories', 'Troubleshooting together']
        });
        
        // Week 4: Mastery and next steps
        schedule.push({
            week: 4,
            pages: `${Math.floor(totalPages * 0.75)}-${totalPages}`,
            focus: 'Consolidation and future planning',
            activities: ['Final projects', 'Skill demonstrations', 'Future learning paths']
        });
        
        return schedule;
    }
    
    generateDiscussionPrompts(bookData) {
        const prompts = [];
        
        // General educational prompts
        prompts.push(
            'What gaming experience helped you understand this concept?',
            'How would you teach this to a fellow gamer?',
            'What real-world situation could benefit from this gaming strategy?'
        );
        
        // Skill-specific prompts
        if (bookData.skillsTargeted?.includes('Customer Service')) {
            prompts.push(
                'Share a time when gaming taught you patience with others',
                'How do guild dynamics relate to workplace teams?'
            );
        }
        
        if (bookData.skillsTargeted?.includes('Financial Literacy')) {
            prompts.push(
                'What\'s your best Grand Exchange flip and what did it teach you?',
                'How do you budget in-game vs real life?'
            );
        }
        
        return prompts;
    }
    
    // ==================== READER INSIGHTS & ANALYTICS ====================
    
    async trackReaderProgress(userId, bookId, progress) {
        const insights = this.readingInsights.get(bookId);
        if (!insights) return;
        
        // Update reader progress
        if (!insights.readers.has(userId)) {
            insights.readers.set(userId, {
                userId,
                startDate: new Date(),
                progress: 0,
                skillsLearned: [],
                notesCount: 0,
                exercisesCompleted: 0
            });
        }
        
        const reader = insights.readers.get(userId);
        reader.progress = progress.percentage;
        reader.lastUpdate = new Date();
        
        // Track skill development
        if (progress.skillsLearned) {
            reader.skillsLearned.push(...progress.skillsLearned);
            
            // Update global skill tracking
            progress.skillsLearned.forEach(skill => {
                const count = this.stats.skillsTracked.get(skill) || 0;
                this.stats.skillsTracked.set(skill, count + 1);
            });
        }
        
        // Update completion rate
        const completedReaders = Array.from(insights.readers.values())
            .filter(r => r.progress >= 100).length;
        insights.completionRate = (completedReaders / insights.readers.size) * 100;
        
        this.emit('reader-progress-updated', {
            userId,
            bookId,
            progress: reader.progress,
            skills: reader.skillsLearned
        });
    }
    
    async collectMoodFeedback(userId, bookId, moods) {
        const insights = this.readingInsights.get(bookId);
        if (!insights) return;
        
        // Aggregate mood feedback
        moods.forEach(mood => {
            const count = insights.moodFeedback.get(mood) || 0;
            insights.moodFeedback.set(mood, count + 1);
        });
        
        // Analyze educational effectiveness
        const educationalMoods = ['informative', 'inspiring', 'challenging'];
        const educationalScore = moods.filter(m => educationalMoods.includes(m)).length / moods.length;
        
        if (educationalScore > 0.7) {
            console.log(`📈 High educational impact reported for ${bookId}`);
        }
        
        this.stats.insightsGathered++;
    }
    
    async analyzeLearningOutcomes(bookId) {
        const insights = this.readingInsights.get(bookId);
        if (!insights) return null;
        
        const analysis = {
            bookId,
            totalReaders: insights.readers.size,
            completionRate: insights.completionRate,
            
            // Skill development metrics
            skillsLearned: this.aggregateSkillsLearned(insights),
            averageSkillsPerReader: this.calculateAverageSkills(insights),
            
            // Engagement metrics
            averageProgress: this.calculateAverageProgress(insights),
            engagementScore: this.calculateEngagementScore(insights),
            
            // Educational effectiveness
            moodAnalysis: this.analyzeMoodFeedback(insights),
            learningVelocity: this.calculateLearningVelocity(insights),
            
            // Recommendations
            recommendations: this.generateBookRecommendations(insights)
        };
        
        return analysis;
    }
    
    aggregateSkillsLearned(insights) {
        const skillCounts = new Map();
        
        for (const reader of insights.readers.values()) {
            reader.skillsLearned.forEach(skill => {
                const count = skillCounts.get(skill) || 0;
                skillCounts.set(skill, count + 1);
            });
        }
        
        return Array.from(skillCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([skill, count]) => ({ skill, learnedBy: count }));
    }
    
    calculateAverageSkills(insights) {
        const totalSkills = Array.from(insights.readers.values())
            .reduce((sum, reader) => sum + reader.skillsLearned.length, 0);
        
        return insights.readers.size > 0 ? totalSkills / insights.readers.size : 0;
    }
    
    calculateAverageProgress(insights) {
        const totalProgress = Array.from(insights.readers.values())
            .reduce((sum, reader) => sum + reader.progress, 0);
        
        return insights.readers.size > 0 ? totalProgress / insights.readers.size : 0;
    }
    
    calculateEngagementScore(insights) {
        // Factors: progress, notes, exercises, consistent reading
        let score = 0;
        
        for (const reader of insights.readers.values()) {
            score += reader.progress / 100; // Progress contribution
            score += Math.min(reader.notesCount / 10, 1) * 0.3; // Notes contribution
            score += Math.min(reader.exercisesCompleted / 5, 1) * 0.5; // Exercises contribution
        }
        
        return insights.readers.size > 0 ? (score / insights.readers.size) * 100 : 0;
    }
    
    analyzeMoodFeedback(insights) {
        const moodArray = Array.from(insights.moodFeedback.entries());
        const totalMoods = moodArray.reduce((sum, [mood, count]) => sum + count, 0);
        
        return {
            dominantMoods: moodArray
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([mood, count]) => ({
                    mood,
                    percentage: (count / totalMoods) * 100
                })),
            educationalAlignment: this.calculateEducationalAlignment(insights.moodFeedback)
        };
    }
    
    calculateEducationalAlignment(moodFeedback) {
        const educationalMoods = ['informative', 'inspiring', 'challenging', 'reflective'];
        const totalEducational = educationalMoods.reduce((sum, mood) => 
            sum + (moodFeedback.get(mood) || 0), 0);
        const totalMoods = Array.from(moodFeedback.values()).reduce((a, b) => a + b, 0);
        
        return totalMoods > 0 ? (totalEducational / totalMoods) * 100 : 0;
    }
    
    calculateLearningVelocity(insights) {
        // Average pages per day for readers who've made progress
        const velocities = [];
        
        for (const reader of insights.readers.values()) {
            if (reader.progress > 0 && reader.lastUpdate) {
                const daysReading = (reader.lastUpdate - reader.startDate) / (1000 * 60 * 60 * 24);
                if (daysReading > 0) {
                    velocities.push(reader.progress / daysReading);
                }
            }
        }
        
        return velocities.length > 0 
            ? velocities.reduce((a, b) => a + b) / velocities.length 
            : 0;
    }
    
    generateBookRecommendations(insights) {
        const recommendations = [];
        
        // Based on completion rate
        if (insights.completionRate < 50) {
            recommendations.push({
                type: 'engagement',
                suggestion: 'Consider adding more interactive exercises or buddy reads'
            });
        }
        
        // Based on skill learning
        const avgSkills = this.calculateAverageSkills(insights);
        if (avgSkills < 3) {
            recommendations.push({
                type: 'skill-clarity',
                suggestion: 'Make learning objectives more explicit in each chapter'
            });
        }
        
        // Based on mood feedback
        const educationalAlignment = this.analyzeMoodFeedback(insights).educationalAlignment;
        if (educationalAlignment < 60) {
            recommendations.push({
                type: 'educational-focus',
                suggestion: 'Strengthen educational content and practical applications'
            });
        }
        
        return recommendations;
    }
    
    // ==================== INTEGRATION FEATURES ====================
    
    async syncWithGoodreads(goodreadsBookId, storygraphBookId) {
        console.log(`🔄 Syncing Storygraph book ${storygraphBookId} with Goodreads ${goodreadsBookId}`);
        
        // In real implementation, this would:
        // 1. Import Goodreads reviews to Storygraph format
        // 2. Map Goodreads shelves to Storygraph tags
        // 3. Convert ratings between systems
        // 4. Sync reading progress
        
        const syncResult = {
            goodreadsId: goodreadsBookId,
            storygraphId: storygraphBookId,
            reviewsSynced: 0,
            ratingsConverted: 0,
            status: 'synced'
        };
        
        console.log('✅ Books synced successfully');
        
        return syncResult;
    }
    
    async exportEducationalData(bookId) {
        const insights = await this.analyzeLearningOutcomes(bookId);
        if (!insights) return null;
        
        const exportData = {
            bookId,
            platform: 'storygraph',
            exportDate: new Date().toISOString(),
            
            // Reader metrics
            readers: {
                total: insights.totalReaders,
                completed: Math.floor(insights.totalReaders * insights.completionRate / 100),
                active: Array.from(this.readingInsights.get(bookId).readers.values())
                    .filter(r => r.progress > 0 && r.progress < 100).length
            },
            
            // Learning outcomes
            learning: {
                skillsImpacted: insights.skillsLearned,
                averageSkillsPerReader: insights.averageSkillsPerReader,
                learningVelocity: insights.learningVelocity
            },
            
            // Engagement data
            engagement: {
                completionRate: insights.completionRate,
                engagementScore: insights.engagementScore,
                moodFeedback: insights.moodAnalysis
            },
            
            // Platform-specific insights
            storygraphInsights: {
                readingChallenges: this.getBookChallenges(bookId),
                buddyReads: this.getBookBuddyReads(bookId),
                customPromptResponses: this.getPromptResponses(bookId)
            }
        };
        
        return exportData;
    }
    
    getBookChallenges(bookId) {
        const challenges = [];
        
        for (const challenge of this.readingChallenges.values()) {
            if (challenge.associatedBook === bookId) {
                challenges.push({
                    id: challenge.id,
                    name: challenge.name,
                    participants: challenge.participants,
                    completions: challenge.booksCompleted
                });
            }
        }
        
        return challenges;
    }
    
    getBookBuddyReads(bookId) {
        const buddyReads = [];
        
        for (const buddyRead of this.buddyReads.values()) {
            if (buddyRead.bookId === bookId) {
                buddyReads.push({
                    id: buddyRead.id,
                    title: buddyRead.title,
                    participants: buddyRead.participants || 0,
                    completionRate: buddyRead.completionRate || 0
                });
            }
        }
        
        return buddyReads;
    }
    
    getPromptResponses(bookId) {
        // In real implementation, would fetch actual responses
        return {
            preReading: { responses: 0, themes: [] },
            duringReading: { responses: 0, themes: [] },
            postReading: { responses: 0, themes: [] }
        };
    }
    
    // ==================== STATISTICS ====================
    
    trackPublication(bookId, bookData) {
        this.stats.booksPublished++;
        
        // Store book data
        this.publishedBooks.set(bookId, {
            ...bookData,
            publishedAt: new Date(),
            platform: 'storygraph'
        });
    }
    
    getStatistics() {
        const topSkills = Array.from(this.stats.skillsTracked.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skill, count]) => ({ skill, learners: count }));
        
        return {
            booksPublished: this.stats.booksPublished,
            totalReaders: this.stats.usersReached,
            challengesCreated: this.stats.challengesCreated,
            insightsGathered: this.stats.insightsGathered,
            topSkillsLearned: topSkills,
            activeChallenges: Array.from(this.readingChallenges.values())
                .filter(c => new Date() < new Date(c.endDate)).length,
            activeBuddyReads: this.buddyReads.size
        };
    }
}

// Integration orchestrator for Storygraph
class StorygraphEducationalOrchestrator {
    constructor(config = {}) {
        this.storygraph = new StorygraphIntegration(config);
        this.i18nEngine = config.i18nEngine;
        this.bookPublisher = config.bookPublisher;
        
        console.log('📊 Storygraph Educational Orchestrator initialized');
    }
    
    async publishAndTrack(bookData, options = {}) {
        console.log(`📚 Publishing "${bookData.title}" to Storygraph with tracking`);
        
        // Publish book
        const publication = await this.storygraph.publishBook(bookData, {
            createChallenge: true,
            createBuddyRead: true,
            ...options
        });
        
        // Set up comprehensive tracking
        await this.setupComprehensiveTracking(publication.bookId, bookData);
        
        // Schedule analytics collection
        this.scheduleAnalytics(publication.bookId);
        
        return publication;
    }
    
    async setupComprehensiveTracking(bookId, bookData) {
        // Initialize all tracking systems
        console.log(`📊 Setting up comprehensive tracking for ${bookId}`);
        
        // Create skill-specific tracking
        if (bookData.skillsTargeted) {
            for (const skill of bookData.skillsTargeted) {
                await this.storygraph.trackReaderProgress('system', bookId, {
                    percentage: 0,
                    skillsLearned: [skill],
                    initialized: true
                });
            }
        }
    }
    
    scheduleAnalytics(bookId) {
        // Schedule periodic analytics collection
        setTimeout(async () => {
            const analytics = await this.storygraph.analyzeLearningOutcomes(bookId);
            console.log(`📈 Analytics for ${bookId}:`, analytics);
        }, 24 * 60 * 60 * 1000); // Daily
    }
    
    async createEducationalEcosystem(books) {
        console.log(`🌐 Creating educational ecosystem with ${books.length} books`);
        
        const ecosystem = {
            books: [],
            challenges: [],
            buddyReads: [],
            crossBookConnections: []
        };
        
        // Publish all books
        for (const book of books) {
            const publication = await this.publishAndTrack(book);
            ecosystem.books.push(publication);
        }
        
        // Create cross-book challenges
        const masterChallenge = {
            name: 'Complete Educational Journey',
            description: 'Master all skills across the educational series',
            books: ecosystem.books.map(b => b.bookId),
            duration: 365,
            milestones: [
                { name: 'First Book', progress: 25 },
                { name: 'Halfway There', progress: 50 },
                { name: 'Almost Master', progress: 75 },
                { name: 'Education Complete', progress: 100 }
            ]
        };
        
        ecosystem.masterChallenge = masterChallenge;
        
        console.log('✅ Educational ecosystem created');
        
        return ecosystem;
    }
}

module.exports = {
    StorygraphIntegration,
    StorygraphEducationalOrchestrator
};

// Example usage
if (require.main === module) {
    async function demonstrateStorygraphIntegration() {
        console.log('📊 Storygraph Integration Demo\n');
        
        // Initialize integration
        const storygraph = new StorygraphIntegration({
            api: {
                apiKey: 'demo_key',
                clientId: 'demo_client'
            }
        });
        
        // Sample educational book
        const sampleBook = {
            title: 'Customer Service Mastery Through RuneScape',
            author: { name: 'RuneScape Educational Platform' },
            isbn: '978-1234567890',
            description: 'Learn professional customer service skills through RuneScape player interactions',
            language: 'en',
            pageCount: 250,
            
            // Educational metadata
            skillsTargeted: ['Customer Service', 'Communication', 'Conflict Resolution'],
            learningOutcomes: [
                'Handle difficult customers with game-learned patience',
                'Build trust through trading interactions',
                'Resolve conflicts using PvP de-escalation techniques'
            ],
            difficultyLevel: 'intermediate',
            
            categories: ['Educational Gaming', 'Self-Help'],
            series: {
                name: 'RuneScape Educational Series',
                position: 1
            }
        };
        
        // Publish book
        console.log('Publishing book to Storygraph...\n');
        const publication = await storygraph.publishBook(sampleBook, {
            createChallenge: true,
            createBuddyRead: true
        });
        
        console.log('Publication result:', publication);
        
        // Simulate reader progress
        console.log('\nSimulating reader progress...\n');
        await storygraph.trackReaderProgress('user123', publication.bookId, {
            percentage: 25,
            skillsLearned: ['Active Listening'],
            notesCount: 5
        });
        
        await storygraph.trackReaderProgress('user456', publication.bookId, {
            percentage: 75,
            skillsLearned: ['Active Listening', 'Empathy', 'Problem Solving'],
            exercisesCompleted: 3
        });
        
        // Collect mood feedback
        console.log('Collecting mood feedback...\n');
        await storygraph.collectMoodFeedback('user123', publication.bookId, 
            ['informative', 'inspiring', 'challenging']);
        
        // Analyze learning outcomes
        console.log('Analyzing learning outcomes...\n');
        const analysis = await storygraph.analyzeLearningOutcomes(publication.bookId);
        console.log('Learning analysis:', JSON.stringify(analysis, null, 2));
        
        // Get statistics
        console.log('\nPlatform statistics:');
        console.log(storygraph.getStatistics());
        
        console.log('\n🎉 Storygraph integration demo complete!');
    }
    
    demonstrateStorygraphIntegration().catch(console.error);
}
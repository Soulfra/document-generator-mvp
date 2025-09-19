#!/usr/bin/env node

/**
 * 🏆 Soulfra Competition Engine
 * 
 * Music and creative competitions system inspired by LMMS competitions
 * with GitHub integration and visual showcases.
 * 
 * Features:
 * - Multiple competition types (music, art, code, design)
 * - GitHub-based submissions
 * - Community voting and expert judging
 * - Trophy and achievement system
 * - Visual competition headers
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SoulfraCompetitionEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Competition settings
            maxSubmissionsPerUser: options.maxSubmissionsPerUser || 3,
            votingPeriodDays: options.votingPeriodDays || 7,
            judgingPeriodDays: options.judgingPeriodDays || 3,
            
            // GitHub integration
            githubOrg: options.githubOrg || process.env.GITHUB_ORG,
            submissionsRepo: options.submissionsRepo || 'competition-submissions',
            
            // Prize configuration
            enablePrizes: options.enablePrizes !== false,
            prizeDistribution: options.prizeDistribution || {
                first: 0.5,    // 50% of prize pool
                second: 0.3,   // 30% of prize pool
                third: 0.2     // 20% of prize pool
            },
            
            // Visual settings
            generateBanners: options.generateBanners !== false,
            showcaseWinners: options.showcaseWinners !== false,
            
            ...options
        };
        
        // Competition registry
        this.competitions = new Map();        // competition id → competition data
        this.submissions = new Map();         // submission id → submission data
        this.votes = new Map();              // vote id → vote data
        this.judges = new Map();             // judge id → judge data
        this.achievements = new Map();        // achievement id → achievement data
        
        // Competition types
        this.competitionTypes = {
            music: {
                name: 'Music Production',
                icon: '🎵',
                description: 'Create original music tracks',
                submissionFormats: ['mp3', 'wav', 'ogg', 'flac'],
                maxFileSize: 50 * 1024 * 1024, // 50MB
                categories: ['electronic', 'orchestral', 'chiptune', 'experimental'],
                judgingCriteria: ['originality', 'production', 'composition', 'theme']
            },
            art: {
                name: 'Visual Art',
                icon: '🎨',
                description: 'Digital art and illustrations',
                submissionFormats: ['png', 'jpg', 'svg', 'gif'],
                maxFileSize: 20 * 1024 * 1024, // 20MB
                categories: ['illustration', 'concept', 'pixel', '3d'],
                judgingCriteria: ['creativity', 'technique', 'composition', 'theme']
            },
            code: {
                name: 'Creative Coding',
                icon: '💻',
                description: 'Build amazing applications',
                submissionFormats: ['github', 'zip', 'link'],
                maxFileSize: 100 * 1024 * 1024, // 100MB
                categories: ['game', 'tool', 'visualization', 'demo'],
                judgingCriteria: ['innovation', 'execution', 'polish', 'usefulness']
            },
            design: {
                name: 'UI/UX Design',
                icon: '🎯',
                description: 'Design beautiful interfaces',
                submissionFormats: ['figma', 'sketch', 'pdf', 'link'],
                maxFileSize: 50 * 1024 * 1024, // 50MB
                categories: ['web', 'mobile', 'desktop', 'experimental'],
                judgingCriteria: ['usability', 'aesthetics', 'innovation', 'consistency']
            }
        };
        
        // Achievement definitions
        this.achievementTypes = {
            firstWin: {
                name: 'First Victory',
                description: 'Win your first competition',
                icon: '🥇',
                points: 100
            },
            participant: {
                name: 'Active Participant',
                description: 'Submit to 5 competitions',
                icon: '🎯',
                points: 50
            },
            voter: {
                name: 'Community Voice',
                description: 'Vote in 10 competitions',
                icon: '🗳️',
                points: 25
            },
            streak: {
                name: 'On Fire',
                description: 'Submit to 3 competitions in a row',
                icon: '🔥',
                points: 75
            },
            judge: {
                name: 'Expert Judge',
                description: 'Judge 5 competitions',
                icon: '⚖️',
                points: 100
            }
        };
        
        // Competition states
        this.states = {
            DRAFT: 'draft',
            OPEN: 'open',
            VOTING: 'voting',
            JUDGING: 'judging',
            COMPLETED: 'completed',
            ARCHIVED: 'archived'
        };
        
        this.initialize();
    }
    
    /**
     * Initialize competition engine
     */
    async initialize() {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   🏆 SOULFRA COMPETITION ENGINE 🏆             ║
║                                                                ║
║              "Where creativity meets competition"               ║
║                                                                ║
║  Types: ${Object.keys(this.competitionTypes).length} available                                   ║
║  Achievements: ${Object.keys(this.achievementTypes).length} to unlock                            ║
║  GitHub: ${this.config.githubOrg ? 'Connected' : 'Not configured'}                                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `);
        
        try {
            // Load existing competitions
            await this.loadCompetitions();
            
            // Initialize GitHub integration
            await this.initializeGitHub();
            
            // Set up achievement system
            await this.initializeAchievements();
            
            // Start competition scheduler
            this.startScheduler();
            
            console.log('✅ Competition Engine initialized!');
            this.emit('engine-initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize competition engine:', error);
            throw error;
        }
    }
    
    /**
     * Create a new competition
     */
    async createCompetition(options = {}) {
        const competitionId = `comp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        const competition = {
            id: competitionId,
            title: options.title || 'Untitled Competition',
            description: options.description || '',
            type: options.type || 'music',
            
            // Timing
            startDate: options.startDate || new Date(),
            endDate: options.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            votingEndDate: null, // Set when voting starts
            
            // Rules
            theme: options.theme || 'Open Theme',
            rules: options.rules || [],
            requirements: options.requirements || [],
            
            // Prizes
            prizes: options.prizes || {
                first: { title: '1st Place', value: '$500' },
                second: { title: '2nd Place', value: '$300' },
                third: { title: '3rd Place', value: '$200' }
            },
            
            // State
            state: this.states.DRAFT,
            submissions: [],
            votes: [],
            judges: options.judges || [],
            
            // Visual
            bannerImage: options.bannerImage || null,
            color: options.color || this.generateCompetitionColor(options.type),
            
            // Metadata
            createdBy: options.createdBy || 'system',
            createdAt: new Date(),
            stats: {
                totalSubmissions: 0,
                totalVotes: 0,
                uniqueParticipants: 0,
                averageRating: 0
            }
        };
        
        // Store competition
        this.competitions.set(competitionId, competition);
        
        // Generate banner if enabled
        if (this.config.generateBanners && !competition.bannerImage) {
            competition.bannerImage = await this.generateCompetitionBanner(competition);
        }
        
        console.log(`🏆 Created competition: ${competition.title}`);
        console.log(`🎯 Type: ${competition.type} | Theme: ${competition.theme}`);
        
        this.emit('competition-created', { competitionId, competition });
        
        return competition;
    }
    
    /**
     * Submit entry to competition
     */
    async submitEntry(competitionId, userId, entry) {
        const competition = this.competitions.get(competitionId);
        if (!competition) {
            throw new Error(`Competition not found: ${competitionId}`);
        }
        
        // Validate competition state
        if (competition.state !== this.states.OPEN) {
            throw new Error('Competition is not open for submissions');
        }
        
        // Check submission limit
        const userSubmissions = competition.submissions.filter(s => s.userId === userId);
        if (userSubmissions.length >= this.config.maxSubmissionsPerUser) {
            throw new Error(`Maximum ${this.config.maxSubmissionsPerUser} submissions per user`);
        }
        
        const submissionId = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        const submission = {
            id: submissionId,
            competitionId,
            userId,
            title: entry.title || 'Untitled Submission',
            description: entry.description || '',
            
            // Files
            files: entry.files || [],
            githubUrl: entry.githubUrl || null,
            demoUrl: entry.demoUrl || null,
            
            // Metadata
            category: entry.category || 'general',
            tags: entry.tags || [],
            
            // State
            status: 'pending-review',
            votes: [],
            judgeScores: {},
            
            // Timestamps
            submittedAt: new Date(),
            lastModified: new Date()
        };
        
        // Validate files
        const competitionType = this.competitionTypes[competition.type];
        if (submission.files.length > 0) {
            for (const file of submission.files) {
                // Check format
                const ext = path.extname(file.name).toLowerCase().slice(1);
                if (!competitionType.submissionFormats.includes(ext)) {
                    throw new Error(`Invalid file format: ${ext}`);
                }
                
                // Check size
                if (file.size > competitionType.maxFileSize) {
                    throw new Error(`File too large: ${file.name}`);
                }
            }
        }
        
        // Store submission
        this.submissions.set(submissionId, submission);
        competition.submissions.push(submissionId);
        competition.stats.totalSubmissions++;
        
        // Create GitHub issue for submission
        if (this.config.githubOrg) {
            await this.createGitHubSubmission(competition, submission);
        }
        
        console.log(`📤 Submission received: ${submission.title}`);
        console.log(`   Competition: ${competition.title}`);
        console.log(`   User: ${userId}`);
        
        this.emit('submission-received', {
            competitionId,
            submissionId,
            userId
        });
        
        return submission;
    }
    
    /**
     * Vote on submission
     */
    async voteOnSubmission(submissionId, userId, rating) {
        const submission = this.submissions.get(submissionId);
        if (!submission) {
            throw new Error(`Submission not found: ${submissionId}`);
        }
        
        const competition = this.competitions.get(submission.competitionId);
        if (!competition) {
            throw new Error('Competition not found');
        }
        
        // Validate competition state
        if (competition.state !== this.states.VOTING) {
            throw new Error('Competition is not in voting phase');
        }
        
        // Check if user already voted
        const existingVote = submission.votes.find(v => v.userId === userId);
        if (existingVote) {
            throw new Error('User has already voted on this submission');
        }
        
        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }
        
        const voteId = `vote_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        const vote = {
            id: voteId,
            submissionId,
            userId,
            rating,
            comment: '',
            timestamp: new Date()
        };
        
        // Store vote
        this.votes.set(voteId, vote);
        submission.votes.push(vote);
        competition.stats.totalVotes++;
        
        // Update average rating
        const totalRating = submission.votes.reduce((sum, v) => sum + v.rating, 0);
        submission.averageRating = totalRating / submission.votes.length;
        
        console.log(`🗳️ Vote recorded: ${rating}/5 for "${submission.title}"`);
        
        this.emit('vote-recorded', {
            competitionId: competition.id,
            submissionId,
            userId,
            rating
        });
        
        // Check achievements
        await this.checkVotingAchievements(userId);
        
        return vote;
    }
    
    /**
     * Judge submission (expert scoring)
     */
    async judgeSubmission(submissionId, judgeId, scores) {
        const submission = this.submissions.get(submissionId);
        if (!submission) {
            throw new Error(`Submission not found: ${submissionId}`);
        }
        
        const competition = this.competitions.get(submission.competitionId);
        if (!competition) {
            throw new Error('Competition not found');
        }
        
        // Validate judge
        if (!competition.judges.includes(judgeId)) {
            throw new Error('User is not a judge for this competition');
        }
        
        // Validate competition state
        if (competition.state !== this.states.JUDGING) {
            throw new Error('Competition is not in judging phase');
        }
        
        // Validate scores against criteria
        const competitionType = this.competitionTypes[competition.type];
        const judgeScore = {
            judgeId,
            scores: {},
            comments: scores.comments || '',
            timestamp: new Date()
        };
        
        for (const criterion of competitionType.judgingCriteria) {
            if (!scores[criterion] || scores[criterion] < 0 || scores[criterion] > 10) {
                throw new Error(`Invalid score for ${criterion}`);
            }
            judgeScore.scores[criterion] = scores[criterion];
        }
        
        // Calculate total score
        judgeScore.total = Object.values(judgeScore.scores).reduce((sum, s) => sum + s, 0) / 
                          Object.keys(judgeScore.scores).length;
        
        // Store judge score
        submission.judgeScores[judgeId] = judgeScore;
        
        console.log(`⚖️ Judge score recorded: ${judgeScore.total.toFixed(1)}/10`);
        console.log(`   Judge: ${judgeId}`);
        console.log(`   Submission: ${submission.title}`);
        
        this.emit('judge-score-recorded', {
            competitionId: competition.id,
            submissionId,
            judgeId,
            score: judgeScore.total
        });
        
        return judgeScore;
    }
    
    /**
     * Advance competition state
     */
    async advanceCompetitionState(competitionId) {
        const competition = this.competitions.get(competitionId);
        if (!competition) {
            throw new Error(`Competition not found: ${competitionId}`);
        }
        
        const currentState = competition.state;
        let newState;
        
        switch (currentState) {
            case this.states.DRAFT:
                newState = this.states.OPEN;
                break;
                
            case this.states.OPEN:
                newState = this.states.VOTING;
                competition.votingEndDate = new Date(
                    Date.now() + this.config.votingPeriodDays * 24 * 60 * 60 * 1000
                );
                break;
                
            case this.states.VOTING:
                newState = this.states.JUDGING;
                break;
                
            case this.states.JUDGING:
                newState = this.states.COMPLETED;
                await this.calculateWinners(competitionId);
                break;
                
            case this.states.COMPLETED:
                newState = this.states.ARCHIVED;
                break;
                
            default:
                throw new Error(`Cannot advance from state: ${currentState}`);
        }
        
        competition.state = newState;
        
        console.log(`🔄 Competition state changed: ${currentState} → ${newState}`);
        console.log(`   Competition: ${competition.title}`);
        
        this.emit('competition-state-changed', {
            competitionId,
            oldState: currentState,
            newState
        });
        
        return competition;
    }
    
    /**
     * Calculate competition winners
     */
    async calculateWinners(competitionId) {
        const competition = this.competitions.get(competitionId);
        if (!competition) {
            throw new Error(`Competition not found: ${competitionId}`);
        }
        
        // Get all submissions
        const submissions = competition.submissions
            .map(id => this.submissions.get(id))
            .filter(s => s && s.status === 'approved');
        
        // Calculate final scores
        for (const submission of submissions) {
            // Community vote weight: 60%
            const voteScore = submission.averageRating || 0;
            
            // Judge score weight: 40%
            const judgeScores = Object.values(submission.judgeScores);
            const judgeScore = judgeScores.length > 0 ?
                judgeScores.reduce((sum, js) => sum + js.total, 0) / judgeScores.length : 0;
            
            submission.finalScore = (voteScore * 0.6) + (judgeScore * 0.4);
        }
        
        // Sort by final score
        submissions.sort((a, b) => b.finalScore - a.finalScore);
        
        // Assign winners
        competition.winners = {
            first: submissions[0]?.id || null,
            second: submissions[1]?.id || null,
            third: submissions[2]?.id || null
        };
        
        // Award achievements
        if (competition.winners.first) {
            const winner = this.submissions.get(competition.winners.first);
            await this.awardAchievement(winner.userId, 'firstWin');
        }
        
        console.log('🏆 Winners calculated!');
        if (competition.winners.first) {
            console.log(`   🥇 1st: ${this.submissions.get(competition.winners.first).title}`);
        }
        if (competition.winners.second) {
            console.log(`   🥈 2nd: ${this.submissions.get(competition.winners.second).title}`);
        }
        if (competition.winners.third) {
            console.log(`   🥉 3rd: ${this.submissions.get(competition.winners.third).title}`);
        }
        
        this.emit('winners-calculated', {
            competitionId,
            winners: competition.winners
        });
        
        return competition.winners;
    }
    
    /**
     * Generate competition banner
     */
    async generateCompetitionBanner(competition) {
        const type = this.competitionTypes[competition.type];
        
        return `
<div class="competition-banner" style="
    background: linear-gradient(135deg, ${competition.color} 0%, ${this.adjustColor(competition.color, -20)} 100%);
    position: relative;
    height: 300px;
    overflow: hidden;
">
    <div class="banner-content" style="
        position: relative;
        z-index: 10;
        padding: 40px;
        color: white;
        text-align: center;
    ">
        <div class="comp-icon" style="font-size: 60px; margin-bottom: 20px;">
            ${type.icon}
        </div>
        <h1 style="font-size: 36px; margin: 0 0 10px 0;">
            ${competition.title}
        </h1>
        <p style="font-size: 18px; opacity: 0.9; margin: 0 0 20px 0;">
            ${competition.description}
        </p>
        <div class="comp-theme" style="
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
        ">
            Theme: ${competition.theme}
        </div>
    </div>
    
    <div class="banner-decoration" style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 100px;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 100"><path d="M0,50 Q300,0 600,50 T1200,50 L1200,100 L0,100 Z" fill="rgba(255,255,255,0.1)"/></svg>');
    "></div>
    
    <div class="prize-badges" style="
        position: absolute;
        bottom: 20px;
        right: 20px;
        display: flex;
        gap: 10px;
    ">
        ${Object.entries(competition.prizes).map(([place, prize]) => `
            <div style="
                background: rgba(255,255,255,0.2);
                padding: 5px 15px;
                border-radius: 15px;
                font-size: 14px;
                color: white;
            ">
                ${place === 'first' ? '🥇' : place === 'second' ? '🥈' : '🥉'} ${prize.value}
            </div>
        `).join('')}
    </div>
</div>`;
    }
    
    /**
     * Generate competition color based on type
     */
    generateCompetitionColor(type) {
        const colors = {
            music: '#FF6B6B',
            art: '#4ECDC4',
            code: '#45B7D1',
            design: '#F7B731'
        };
        
        return colors[type] || '#95A5A6';
    }
    
    /**
     * Adjust color brightness
     */
    adjustColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    /**
     * Create GitHub submission
     */
    async createGitHubSubmission(competition, submission) {
        // In production, this would create actual GitHub issues/PRs
        console.log(`📁 Creating GitHub submission for: ${submission.title}`);
        
        submission.githubIssueNumber = Math.floor(Math.random() * 1000);
        submission.githubUrl = `https://github.com/${this.config.githubOrg}/${this.config.submissionsRepo}/issues/${submission.githubIssueNumber}`;
    }
    
    /**
     * Award achievement
     */
    async awardAchievement(userId, achievementType) {
        const achievement = this.achievementTypes[achievementType];
        if (!achievement) return;
        
        const achievementId = `ach_${userId}_${achievementType}_${Date.now()}`;
        
        this.achievements.set(achievementId, {
            id: achievementId,
            userId,
            type: achievementType,
            ...achievement,
            awardedAt: new Date()
        });
        
        console.log(`🏅 Achievement unlocked: ${achievement.name}`);
        console.log(`   User: ${userId}`);
        console.log(`   Points: +${achievement.points}`);
        
        this.emit('achievement-unlocked', {
            userId,
            achievement: achievementType,
            points: achievement.points
        });
    }
    
    /**
     * Check voting achievements
     */
    async checkVotingAchievements(userId) {
        const userVotes = Array.from(this.votes.values())
            .filter(v => v.userId === userId);
        
        if (userVotes.length >= 10) {
            await this.awardAchievement(userId, 'voter');
        }
    }
    
    /**
     * Get active competitions
     */
    getActiveCompetitions() {
        return Array.from(this.competitions.values())
            .filter(c => c.state === this.states.OPEN || c.state === this.states.VOTING);
    }
    
    /**
     * Get competition leaderboard
     */
    async getLeaderboard(competitionId) {
        const competition = this.competitions.get(competitionId);
        if (!competition) {
            throw new Error(`Competition not found: ${competitionId}`);
        }
        
        const submissions = competition.submissions
            .map(id => this.submissions.get(id))
            .filter(s => s)
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        
        return submissions.map((sub, index) => ({
            rank: index + 1,
            title: sub.title,
            userId: sub.userId,
            votes: sub.votes.length,
            averageRating: sub.averageRating || 0,
            submissionId: sub.id
        }));
    }
    
    /**
     * Render competition showcase
     */
    renderCompetitionShowcase(competition) {
        const submissions = competition.submissions
            .map(id => this.submissions.get(id))
            .filter(s => s);
        
        return `
<div class="competition-showcase">
    ${competition.bannerImage || ''}
    
    <div class="showcase-content">
        <div class="competition-info">
            <h2>${competition.title}</h2>
            <p>${competition.description}</p>
            
            <div class="competition-stats">
                <div class="stat">
                    <span class="stat-value">${submissions.length}</span>
                    <span class="stat-label">Submissions</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${competition.stats.totalVotes}</span>
                    <span class="stat-label">Votes Cast</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${competition.state}</span>
                    <span class="stat-label">Status</span>
                </div>
            </div>
        </div>
        
        ${competition.state === this.states.COMPLETED && competition.winners ? `
            <div class="winners-showcase">
                <h3>🏆 Winners</h3>
                ${competition.winners.first ? `
                    <div class="winner first-place">
                        <span class="medal">🥇</span>
                        <span class="title">${this.submissions.get(competition.winners.first)?.title}</span>
                    </div>
                ` : ''}
                ${competition.winners.second ? `
                    <div class="winner second-place">
                        <span class="medal">🥈</span>
                        <span class="title">${this.submissions.get(competition.winners.second)?.title}</span>
                    </div>
                ` : ''}
                ${competition.winners.third ? `
                    <div class="winner third-place">
                        <span class="medal">🥉</span>
                        <span class="title">${this.submissions.get(competition.winners.third)?.title}</span>
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="submissions-grid">
            ${submissions.slice(0, 6).map(sub => `
                <div class="submission-card">
                    <h4>${sub.title}</h4>
                    <p>${sub.description.substring(0, 100)}...</p>
                    <div class="submission-meta">
                        <span>⭐ ${(sub.averageRating || 0).toFixed(1)}</span>
                        <span>🗳️ ${sub.votes.length} votes</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</div>`;
    }
    
    /**
     * Initialize achievements system
     */
    async initializeAchievements() {
        console.log('🏅 Initializing achievement system...');
        
        // Load user achievements from storage
        // In production, this would load from database
    }
    
    /**
     * Load competitions
     */
    async loadCompetitions() {
        console.log('📂 Loading competitions...');
        
        // In production, this would load from database
        // Create sample competition for demo
        const demoComp = await this.createCompetition({
            title: 'Summer Music Challenge 2025',
            description: 'Create an original summer-themed track',
            type: 'music',
            theme: 'Summer Vibes',
            prizes: {
                first: { title: '1st Place', value: '$1000' },
                second: { title: '2nd Place', value: '$500' },
                third: { title: '3rd Place', value: '$250' }
            }
        });
        
        // Open the competition
        demoComp.state = this.states.OPEN;
    }
    
    /**
     * Initialize GitHub integration
     */
    async initializeGitHub() {
        if (!this.config.githubOrg) {
            console.log('⚠️  GitHub integration not configured');
            return;
        }
        
        console.log(`🔗 GitHub integration ready: ${this.config.githubOrg}`);
    }
    
    /**
     * Start competition scheduler
     */
    startScheduler() {
        // Check for state transitions every hour
        setInterval(() => {
            this.checkCompetitionDeadlines();
        }, 60 * 60 * 1000);
        
        console.log('⏰ Competition scheduler started');
    }
    
    /**
     * Check competition deadlines
     */
    checkCompetitionDeadlines() {
        const now = new Date();
        
        for (const competition of this.competitions.values()) {
            // Check if submission period ended
            if (competition.state === this.states.OPEN && competition.endDate <= now) {
                this.advanceCompetitionState(competition.id);
            }
            
            // Check if voting period ended
            if (competition.state === this.states.VOTING && competition.votingEndDate <= now) {
                this.advanceCompetitionState(competition.id);
            }
        }
    }
    
    /**
     * Generate status report
     */
    generateStatusReport() {
        const report = {
            totalCompetitions: this.competitions.size,
            activeCompetitions: this.getActiveCompetitions().length,
            totalSubmissions: this.submissions.size,
            totalVotes: this.votes.size,
            totalAchievements: this.achievements.size
        };
        
        console.log('\n📊 Competition Engine Status');
        console.log('═══════════════════════════');
        console.log(`🏆 Total Competitions: ${report.totalCompetitions}`);
        console.log(`🟢 Active Competitions: ${report.activeCompetitions}`);
        console.log(`📤 Total Submissions: ${report.totalSubmissions}`);
        console.log(`🗳️  Total Votes: ${report.totalVotes}`);
        console.log(`🏅 Achievements Awarded: ${report.totalAchievements}`);
        
        return report;
    }
    
    /**
     * Demo mode
     */
    static async demo() {
        console.log('🎮 Competition Engine Demo');
        console.log('══════════════════════════');
        
        const engine = new SoulfraCompetitionEngine();
        
        // Wait for initialization
        await new Promise(resolve => {
            engine.once('engine-initialized', resolve);
        });
        
        // Show active competitions
        const active = engine.getActiveCompetitions();
        console.log(`\n🏆 Active Competitions: ${active.length}`);
        
        for (const comp of active) {
            console.log(`\n${comp.title}`);
            console.log(`Type: ${comp.type} | Theme: ${comp.theme}`);
            console.log(`State: ${comp.state}`);
            console.log(`Prizes: ${Object.values(comp.prizes).map(p => p.value).join(', ')}`);
        }
        
        // Simulate submission
        console.log('\n📤 Simulating submission...');
        const submission = await engine.submitEntry(active[0].id, 'demo-user', {
            title: 'Summer Breeze',
            description: 'A chill electronic track with beach vibes',
            category: 'electronic',
            files: [{ name: 'summer-breeze.mp3', size: 5 * 1024 * 1024 }]
        });
        
        console.log(`✅ Submission created: ${submission.title}`);
        
        // Show status
        engine.generateStatusReport();
    }
}

// Run demo if called directly
if (require.main === module) {
    SoulfraCompetitionEngine.demo().catch(console.error);
}

module.exports = SoulfraCompetitionEngine;
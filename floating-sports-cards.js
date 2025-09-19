#!/usr/bin/env node

/**
 * 🎴 FLOATING SPORTS CARDS OVERLAY SYSTEM
 * 
 * Dynamic floating card overlays for live sports data visualization
 * ESPN-style cards with team branding, live scores, and interactive features
 * 
 * Features:
 * - Live game score cards
 * - Team mascot personality cards
 * - Interactive voting/prediction cards
 * - Achievement notification cards
 * - Campus integration cards
 * - Study group and MCAT integration cards
 */

const EventEmitter = require('events');

class FloatingSportsCards extends EventEmitter {
    constructor() {
        super();
        
        // Card system configuration
        this.cardSystem = {
            maxActiveCards: 8,
            defaultDuration: 10000, // 10 seconds
            fadeInDuration: 500,
            fadeOutDuration: 300,
            cardSpacing: 120,
            zIndexBase: 1000
        };
        
        // Active cards registry
        this.activeCards = new Map();
        this.cardQueue = [];
        this.nextCardId = 1;
        
        // Card positioning system
        this.positionManager = {
            positions: [
                { x: 20, y: 20, occupied: false },      // Top-left
                { x: 20, y: 160, occupied: false },     // Mid-left
                { x: 20, y: 300, occupied: false },     // Bottom-left
                { x: 'calc(100vw - 320px)', y: 20, occupied: false },   // Top-right
                { x: 'calc(100vw - 320px)', y: 160, occupied: false },  // Mid-right
                { x: 'calc(100vw - 320px)', y: 300, occupied: false },  // Bottom-right
                { x: 'calc(50vw - 150px)', y: 20, occupied: false },    // Top-center
                { x: 'calc(50vw - 150px)', y: 440, occupied: false }    // Bottom-center
            ],
            lastUsed: -1
        };
        
        // Card templates
        this.cardTemplates = {
            liveGame: {
                width: 300,
                height: 120,
                priority: 'high',
                template: 'live-game-card'
            },
            mascotPersonality: {
                width: 280,
                height: 140,
                priority: 'medium',
                template: 'mascot-card'
            },
            voting: {
                width: 320,
                height: 160,
                priority: 'high',
                template: 'voting-card'
            },
            achievement: {
                width: 280,
                height: 100,
                priority: 'urgent',
                template: 'achievement-card'
            },
            campusActivity: {
                width: 300,
                height: 130,
                priority: 'medium',
                template: 'campus-card'
            },
            mcatStudy: {
                width: 320,
                height: 180,
                priority: 'medium',
                template: 'mcat-card'
            },
            news: {
                width: 280,
                height: 110,
                priority: 'low',
                template: 'news-card'
            }
        };
        
        // Team color schemes
        this.teamColorSchemes = {
            brewers: { primary: '#FFC52F', secondary: '#12284B', accent: '#FFFFFF' },
            cubs: { primary: '#0E3386', secondary: '#CC3433', accent: '#FFFFFF' },
            yankees: { primary: '#132448', secondary: '#C4CED4', accent: '#FFFFFF' },
            redsox: { primary: '#BD3039', secondary: '#0C2340', accent: '#FFFFFF' },
            dodgers: { primary: '#005A9C', secondary: '#EF3E42', accent: '#FFFFFF' },
            giants: { primary: '#FD5A1E', secondary: '#27251F', accent: '#FFFFFF' },
            cardinals: { primary: '#C41E3A', secondary: '#FEDB00', accent: '#FFFFFF' },
            astros: { primary: '#002D62', secondary: '#EB6E1F', accent: '#FFFFFF' }
        };
        
        // Card interaction handlers
        this.interactionHandlers = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎴 Initializing Floating Sports Cards System...');
        
        try {
            // Initialize CSS styles
            this.injectCardStyles();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup card lifecycle management
            this.setupCardLifecycle();
            
            // Initialize positioning system
            this.initializePositioning();
            
            console.log('✅ Floating Sports Cards System ready!');
            console.log(`📋 ${Object.keys(this.cardTemplates).length} card templates loaded`);
            console.log(`📍 ${this.positionManager.positions.length} positioning slots available`);
            
        } catch (error) {
            console.error('❌ Failed to initialize floating cards system:', error);
            throw error;
        }
    }
    
    // ===================== CARD CREATION METHODS =====================
    
    async createLiveGameCard(gameData) {
        const homeTeam = gameData.homeTeam;
        const awayTeam = gameData.awayTeam;
        const homeColors = this.getTeamColors(homeTeam.abbreviation.toLowerCase());
        const awayColors = this.getTeamColors(awayTeam.abbreviation.toLowerCase());
        
        const cardData = {
            type: 'liveGame',
            priority: gameData.status === 'STATUS_IN_PROGRESS' ? 'urgent' : 'high',
            duration: gameData.status === 'STATUS_IN_PROGRESS' ? 15000 : 10000,
            data: {
                gameId: gameData.id,
                homeTeam: {
                    name: homeTeam.displayName,
                    abbreviation: homeTeam.abbreviation,
                    score: homeTeam.score,
                    colors: homeColors,
                    mascot: homeTeam.mascot
                },
                awayTeam: {
                    name: awayTeam.displayName,
                    abbreviation: awayTeam.abbreviation,
                    score: awayTeam.score,
                    colors: awayColors,
                    mascot: awayTeam.mascot
                },
                status: gameData.status,
                period: gameData.period,
                situation: gameData.situation,
                venue: gameData.venue
            },
            interactions: ['click_for_details', 'predict_outcome'],
            content: this.generateLiveGameCardHTML(gameData, homeColors, awayColors)
        };
        
        return this.createCard(cardData);
    }
    
    async createMascotPersonalityCard(teamData, message) {
        const colors = this.getTeamColors(teamData.abbreviation.toLowerCase());
        
        const cardData = {
            type: 'mascotPersonality',
            priority: 'medium',
            duration: 12000,
            data: {
                team: teamData.name,
                mascot: teamData.mascot,
                message: message,
                personality: teamData.mascotPersonality,
                colors: colors,
                campusAffiliations: teamData.campusAffiliations
            },
            interactions: ['chat_with_mascot', 'get_study_help'],
            content: this.generateMascotCardHTML(teamData, message, colors)
        };
        
        return this.createCard(cardData);
    }
    
    async createVotingCard(pollData) {
        const cardData = {
            type: 'voting',
            priority: 'high',
            duration: 20000, // Longer for interaction
            data: {
                pollId: pollData.id,
                question: pollData.title,
                options: pollData.options,
                category: pollData.category,
                brewersCorrelation: pollData.brewersCorrelation
            },
            interactions: ['cast_vote', 'view_results'],
            content: this.generateVotingCardHTML(pollData)
        };
        
        return this.createCard(cardData);
    }
    
    async createAchievementCard(achievementData) {
        const cardData = {
            type: 'achievement',
            priority: 'urgent',
            duration: 8000,
            data: {
                achievementId: achievementData.id || Date.now(),
                title: achievementData.achievement.name,
                description: achievementData.achievement.description,
                icon: achievementData.achievement.icon,
                userId: achievementData.userId
            },
            interactions: ['share_achievement'],
            content: this.generateAchievementCardHTML(achievementData)
        };
        
        return this.createCard(cardData);
    }
    
    async createCampusActivityCard(activityData) {
        const cardData = {
            type: 'campusActivity',
            priority: 'medium',
            duration: 10000,
            data: {
                university: activityData.university,
                activity: activityData.activity,
                location: activityData.location,
                participants: activityData.participants,
                teamAffiliation: activityData.teamAffiliation
            },
            interactions: ['join_activity', 'get_directions'],
            content: this.generateCampusActivityCardHTML(activityData)
        };
        
        return this.createCard(cardData);
    }
    
    async createMCATStudyCard(studyData) {
        const cardData = {
            type: 'mcatStudy',
            priority: 'medium',
            duration: 15000,
            data: {
                subject: studyData.subject,
                topic: studyData.topic,
                sportsAnalogy: studyData.sportsAnalogy,
                difficulty: studyData.difficulty,
                team: studyData.team,
                mascotTutor: studyData.mascotTutor
            },
            interactions: ['start_study_session', 'join_study_group'],
            content: this.generateMCATStudyCardHTML(studyData)
        };
        
        return this.createCard(cardData);
    }
    
    // ===================== CARD LIFECYCLE MANAGEMENT =====================
    
    async createCard(cardData) {
        const cardId = `card_${this.nextCardId++}`;
        
        // Check if we need to queue the card
        if (this.activeCards.size >= this.cardSystem.maxActiveCards) {
            this.cardQueue.push({ cardId, cardData });
            return cardId;
        }
        
        // Get available position
        const position = this.getAvailablePosition();
        if (!position) {
            this.cardQueue.push({ cardId, cardData });
            return cardId;
        }
        
        // Create card element
        const cardElement = this.createCardElement(cardId, cardData, position);
        
        // Add to active cards
        this.activeCards.set(cardId, {
            element: cardElement,
            data: cardData,
            position: position,
            createdAt: Date.now(),
            expiresAt: Date.now() + cardData.duration
        });
        
        // Animate in
        this.animateCardIn(cardElement);
        
        // Setup auto-removal
        setTimeout(() => {
            this.removeCard(cardId);
        }, cardData.duration);
        
        // Emit card created event
        this.emit('card_created', { cardId, type: cardData.type });
        
        return cardId;
    }
    
    createCardElement(cardId, cardData, position) {
        const template = this.cardTemplates[cardData.type];
        
        const cardElement = document.createElement('div');
        cardElement.id = cardId;
        cardElement.className = `floating-card floating-card-${cardData.type}`;
        cardElement.style.cssText = `
            position: fixed;
            left: ${typeof position.x === 'string' ? position.x : position.x + 'px'};
            top: ${position.y}px;
            width: ${template.width}px;
            height: ${template.height}px;
            z-index: ${this.cardSystem.zIndexBase + this.activeCards.size};
            opacity: 0;
            transform: translateY(-20px);
            transition: all ${this.cardSystem.fadeInDuration}ms ease-out;
            pointer-events: auto;
        `;
        
        // Set card content
        cardElement.innerHTML = cardData.content;
        
        // Setup interactions
        this.setupCardInteractions(cardElement, cardData);
        
        // Add to DOM
        document.body.appendChild(cardElement);
        
        return cardElement;
    }
    
    setupCardInteractions(cardElement, cardData) {
        // Close button
        const closeBtn = cardElement.querySelector('.card-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeCard(cardElement.id);
            });
        }
        
        // Interactive elements
        cardData.interactions.forEach(interaction => {
            const elements = cardElement.querySelectorAll(`[data-interaction="${interaction}"]`);
            elements.forEach(element => {
                element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleCardInteraction(cardElement.id, interaction, cardData, e);
                });
            });
        });
        
        // Drag functionality for repositioning
        this.makeCardDraggable(cardElement);
    }
    
    makeCardDraggable(cardElement) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        cardElement.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('card-content') || e.target.classList.contains('card-header')) {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initialX = parseInt(cardElement.style.left);
                initialY = parseInt(cardElement.style.top);
                cardElement.style.zIndex = this.cardSystem.zIndexBase + 100; // Bring to front
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                cardElement.style.left = (initialX + deltaX) + 'px';
                cardElement.style.top = (initialY + deltaY) + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                // Update position in system
                this.updateCardPosition(cardElement.id, {
                    x: parseInt(cardElement.style.left),
                    y: parseInt(cardElement.style.top)
                });
            }
        });
    }
    
    animateCardIn(cardElement) {
        // Force reflow
        cardElement.offsetHeight;
        
        // Animate in
        cardElement.style.opacity = '1';
        cardElement.style.transform = 'translateY(0)';
    }
    
    async removeCard(cardId) {
        const card = this.activeCards.get(cardId);
        if (!card) return;
        
        // Animate out
        card.element.style.opacity = '0';
        card.element.style.transform = 'translateY(-20px)';
        
        // Remove after animation
        setTimeout(() => {
            if (card.element.parentNode) {
                card.element.parentNode.removeChild(card.element);
            }
            
            // Free up position
            card.position.occupied = false;
            
            // Remove from active cards
            this.activeCards.delete(cardId);
            
            // Process queue
            this.processCardQueue();
            
            // Emit card removed event
            this.emit('card_removed', { cardId, type: card.data.type });
            
        }, this.cardSystem.fadeOutDuration);
    }
    
    processCardQueue() {
        if (this.cardQueue.length === 0) return;
        if (this.activeCards.size >= this.cardSystem.maxActiveCards) return;
        
        const { cardId, cardData } = this.cardQueue.shift();
        
        // Get available position
        const position = this.getAvailablePosition();
        if (position) {
            // Create queued card
            const cardElement = this.createCardElement(cardId, cardData, position);
            
            this.activeCards.set(cardId, {
                element: cardElement,
                data: cardData,
                position: position,
                createdAt: Date.now(),
                expiresAt: Date.now() + cardData.duration
            });
            
            this.animateCardIn(cardElement);
            
            setTimeout(() => {
                this.removeCard(cardId);
            }, cardData.duration);
        }
    }
    
    // ===================== POSITIONING SYSTEM =====================
    
    getAvailablePosition() {
        // Find first available position
        for (let i = 0; i < this.positionManager.positions.length; i++) {
            const position = this.positionManager.positions[i];
            if (!position.occupied) {
                position.occupied = true;
                return position;
            }
        }
        
        // No positions available
        return null;
    }
    
    updateCardPosition(cardId, newPosition) {
        const card = this.activeCards.get(cardId);
        if (card) {
            card.position.x = newPosition.x;
            card.position.y = newPosition.y;
        }
    }
    
    initializePositioning() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.recalculatePositions();
        });
    }
    
    recalculatePositions() {
        // Update position calculations for responsive design
        this.activeCards.forEach((card, cardId) => {
            const element = card.element;
            // Recalculate positions that use viewport calculations
            if (typeof card.position.x === 'string') {
                element.style.left = card.position.x;
            }
        });
    }
    
    // ===================== INTERACTION HANDLERS =====================
    
    handleCardInteraction(cardId, interaction, cardData, event) {
        const card = this.activeCards.get(cardId);
        if (!card) return;
        
        switch (interaction) {
            case 'click_for_details':
                this.handleGameDetailsClick(cardData, event);
                break;
                
            case 'predict_outcome':
                this.handlePredictOutcome(cardData, event);
                break;
                
            case 'cast_vote':
                this.handleCastVote(cardData, event);
                break;
                
            case 'chat_with_mascot':
                this.handleMascotChat(cardData, event);
                break;
                
            case 'start_study_session':
                this.handleStartStudySession(cardData, event);
                break;
                
            case 'join_activity':
                this.handleJoinActivity(cardData, event);
                break;
                
            case 'share_achievement':
                this.handleShareAchievement(cardData, event);
                break;
                
            default:
                console.log(`Unknown interaction: ${interaction}`);
        }
        
        // Emit interaction event
        this.emit('card_interaction', {
            cardId,
            interaction,
            cardType: cardData.type,
            data: cardData.data
        });
    }
    
    handleGameDetailsClick(cardData, event) {
        // Expand game details or navigate to full game view
        this.emit('show_game_details', cardData.data);
    }
    
    handlePredictOutcome(cardData, event) {
        // Open prediction interface
        this.emit('open_prediction', {
            gameId: cardData.data.gameId,
            teams: [cardData.data.homeTeam, cardData.data.awayTeam]
        });
    }
    
    handleCastVote(cardData, event) {
        const option = event.target.dataset.option;
        this.emit('cast_vote', {
            pollId: cardData.data.pollId,
            option: option
        });
    }
    
    handleMascotChat(cardData, event) {
        // Open mascot chat interface
        this.emit('open_mascot_chat', {
            team: cardData.data.team,
            mascot: cardData.data.mascot,
            personality: cardData.data.personality
        });
    }
    
    handleStartStudySession(cardData, event) {
        // Launch MCAT study session
        this.emit('start_study_session', {
            subject: cardData.data.subject,
            team: cardData.data.team,
            mascotTutor: cardData.data.mascotTutor
        });
    }
    
    // ===================== HTML GENERATION METHODS =====================
    
    generateLiveGameCardHTML(gameData, homeColors, awayColors) {
        const statusIcon = gameData.status === 'STATUS_IN_PROGRESS' ? '🔴' : '⚾';
        const statusText = gameData.status === 'STATUS_IN_PROGRESS' ? 'LIVE' : 'SCHEDULED';
        
        return `
            <div class="card-header" style="background: linear-gradient(45deg, ${homeColors.primary}, ${awayColors.primary});">
                <span class="status-indicator">${statusIcon} ${statusText}</span>
                <button class="card-close">×</button>
            </div>
            <div class="card-content">
                <div class="game-matchup">
                    <div class="team away-team" style="border-left: 4px solid ${awayColors.primary};">
                        <span class="team-name">${gameData.awayTeam.abbreviation}</span>
                        <span class="team-score">${gameData.awayTeam.score || 0}</span>
                    </div>
                    <div class="vs-separator">@</div>
                    <div class="team home-team" style="border-left: 4px solid ${homeColors.primary};">
                        <span class="team-name">${gameData.homeTeam.abbreviation}</span>
                        <span class="team-score">${gameData.homeTeam.score || 0}</span>
                    </div>
                </div>
                <div class="game-situation">${gameData.situation || 'First pitch'}</div>
                <div class="card-actions">
                    <button data-interaction="click_for_details" class="action-btn">Details</button>
                    <button data-interaction="predict_outcome" class="action-btn">Predict</button>
                </div>
            </div>
        `;
    }
    
    generateMascotCardHTML(teamData, message, colors) {
        return `
            <div class="card-header" style="background: ${colors.primary}; color: ${colors.accent};">
                <span class="mascot-name">${teamData.mascot}</span>
                <button class="card-close">×</button>
            </div>
            <div class="card-content">
                <div class="mascot-message">
                    <div class="mascot-avatar">${this.getMascotEmoji(teamData.abbreviation)}</div>
                    <div class="message-bubble" style="border-color: ${colors.primary};">
                        "${message}"
                    </div>
                </div>
                <div class="team-info">
                    <span class="team-name">${teamData.name}</span>
                    <span class="campus-info">🎓 ${teamData.campusAffiliations[0]}</span>
                </div>
                <div class="card-actions">
                    <button data-interaction="chat_with_mascot" class="action-btn">Chat</button>
                    <button data-interaction="get_study_help" class="action-btn">Study Help</button>
                </div>
            </div>
        `;
    }
    
    generateVotingCardHTML(pollData) {
        const optionsHTML = pollData.options.map((option, index) => `
            <button data-interaction="cast_vote" data-option="${option.id || index}" class="vote-option">
                ${option.label || option}
            </button>
        `).join('');
        
        return `
            <div class="card-header voting-header">
                <span class="poll-icon">🗳️ Quick Vote</span>
                <button class="card-close">×</button>
            </div>
            <div class="card-content">
                <div class="poll-question">${pollData.title}</div>
                <div class="poll-options">
                    ${optionsHTML}
                </div>
                <div class="poll-info">
                    <span class="category">${pollData.category}</span>
                    ${pollData.brewersCorrelation > 0.5 ? '<span class="brewers-boost">⚾ Brewers Boost!</span>' : ''}
                </div>
            </div>
        `;
    }
    
    generateAchievementCardHTML(achievementData) {
        return `
            <div class="card-header achievement-header">
                <span class="achievement-icon">${achievementData.achievement.icon} Achievement!</span>
                <button class="card-close">×</button>
            </div>
            <div class="card-content">
                <div class="achievement-title">${achievementData.achievement.name}</div>
                <div class="achievement-description">${achievementData.achievement.description}</div>
                <div class="card-actions">
                    <button data-interaction="share_achievement" class="action-btn">Share</button>
                </div>
            </div>
        `;
    }
    
    generateCampusActivityCardHTML(activityData) {
        return `
            <div class="card-header campus-header">
                <span class="campus-icon">🏫 ${activityData.university}</span>
                <button class="card-close">×</button>
            </div>
            <div class="card-content">
                <div class="activity-title">${activityData.activity}</div>
                <div class="activity-location">📍 ${activityData.location}</div>
                <div class="activity-participants">👥 ${activityData.participants} participating</div>
                <div class="card-actions">
                    <button data-interaction="join_activity" class="action-btn">Join</button>
                    <button data-interaction="get_directions" class="action-btn">Directions</button>
                </div>
            </div>
        `;
    }
    
    generateMCATStudyCardHTML(studyData) {
        return `
            <div class="card-header mcat-header">
                <span class="mcat-icon">📚 MCAT Study</span>
                <button class="card-close">×</button>
            </div>
            <div class="card-content">
                <div class="study-subject">${studyData.subject}: ${studyData.topic}</div>
                <div class="sports-analogy">
                    <span class="analogy-icon">⚾</span>
                    ${studyData.sportsAnalogy}
                </div>
                <div class="study-info">
                    <span class="difficulty">Difficulty: ${studyData.difficulty}</span>
                    <span class="team-mascot">${studyData.mascotTutor}</span>
                </div>
                <div class="card-actions">
                    <button data-interaction="start_study_session" class="action-btn">Study Now</button>
                    <button data-interaction="join_study_group" class="action-btn">Study Group</button>
                </div>
            </div>
        `;
    }
    
    // ===================== UTILITY METHODS =====================
    
    getTeamColors(abbreviation) {
        return this.teamColorSchemes[abbreviation] || {
            primary: '#002D72',
            secondary: '#FF5910',
            accent: '#FFFFFF'
        };
    }
    
    getMascotEmoji(abbreviation) {
        const mascotEmojis = {
            'mil': '🍺', 'chc': '🐻', 'stl': '🐦', 'pit': '🏴‍☠️',
            'nyy': '⚾', 'bos': '🧦', 'tor': '🐦', 'bal': '🧡',
            'lad': '💙', 'sf': '🧡', 'sd': '🌮', 'col': '🏔️',
            'hou': '🚀', 'tex': '🤠', 'sea': '⚓', 'oak': '🐘'
        };
        return mascotEmojis[abbreviation] || '⚾';
    }
    
    setupEventListeners() {
        // Listen for window events that might affect cards
        window.addEventListener('beforeunload', () => {
            this.cleanupAllCards();
        });
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseCardAnimations();
            } else {
                this.resumeCardAnimations();
            }
        });
    }
    
    setupCardLifecycle() {
        // Periodic cleanup of expired cards
        setInterval(() => {
            this.cleanupExpiredCards();
        }, 5000); // Every 5 seconds
        
        // Performance monitoring
        setInterval(() => {
            this.monitorPerformance();
        }, 30000); // Every 30 seconds
    }
    
    cleanupExpiredCards() {
        const now = Date.now();
        this.activeCards.forEach((card, cardId) => {
            if (now > card.expiresAt) {
                this.removeCard(cardId);
            }
        });
    }
    
    cleanupAllCards() {
        this.activeCards.forEach((card, cardId) => {
            this.removeCard(cardId);
        });
    }
    
    pauseCardAnimations() {
        this.activeCards.forEach(card => {
            card.element.style.animationPlayState = 'paused';
        });
    }
    
    resumeCardAnimations() {
        this.activeCards.forEach(card => {
            card.element.style.animationPlayState = 'running';
        });
    }
    
    monitorPerformance() {
        const stats = {
            activeCards: this.activeCards.size,
            queuedCards: this.cardQueue.length,
            memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'N/A'
        };
        
        this.emit('performance_stats', stats);
        
        // Warn if too many cards
        if (this.activeCards.size > this.cardSystem.maxActiveCards * 1.5) {
            console.warn('⚠️ Too many active cards, performance may be affected');
        }
    }
    
    // ===================== CSS INJECTION =====================
    
    injectCardStyles() {
        const styles = `
            <style id="floating-cards-styles">
                .floating-card {
                    background: rgba(0, 0, 0, 0.95);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    cursor: move;
                    user-select: none;
                }
                
                .card-header {
                    padding: 8px 12px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: bold;
                    font-size: 12px;
                }
                
                .card-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                
                .card-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .card-content {
                    padding: 12px;
                    color: white;
                }
                
                .game-matchup {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }
                
                .team {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 4px 8px;
                    border-radius: 4px;
                    min-width: 60px;
                }
                
                .team-name {
                    font-weight: bold;
                    font-size: 14px;
                }
                
                .team-score {
                    font-size: 18px;
                    font-weight: bold;
                    color: #FFC52F;
                }
                
                .vs-separator {
                    font-size: 12px;
                    color: #888;
                }
                
                .game-situation {
                    font-size: 11px;
                    color: #ccc;
                    margin-bottom: 8px;
                    text-align: center;
                }
                
                .card-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                }
                
                .action-btn {
                    background: rgba(255, 197, 47, 0.2);
                    border: 1px solid #FFC52F;
                    color: #FFC52F;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .action-btn:hover {
                    background: #FFC52F;
                    color: #000;
                }
                
                .mascot-message {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                
                .mascot-avatar {
                    font-size: 20px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .message-bubble {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 6px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    border-left: 3px solid #FFC52F;
                    flex: 1;
                }
                
                .team-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 10px;
                    margin-bottom: 8px;
                    color: #ccc;
                }
                
                .poll-question {
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-align: center;
                }
                
                .poll-options {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 8px;
                }
                
                .vote-option {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .vote-option:hover {
                    background: rgba(255, 197, 47, 0.3);
                    border-color: #FFC52F;
                }
                
                .poll-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 9px;
                    color: #888;
                }
                
                .brewers-boost {
                    color: #FFC52F;
                    font-weight: bold;
                }
                
                .achievement-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 4px;
                    text-align: center;
                    color: #FFD700;
                }
                
                .achievement-description {
                    font-size: 11px;
                    text-align: center;
                    margin-bottom: 8px;
                    color: #ccc;
                }
                
                .study-subject {
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 6px;
                    color: #4CAF50;
                }
                
                .sports-analogy {
                    background: rgba(255, 197, 47, 0.1);
                    padding: 6px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    margin-bottom: 6px;
                    border-left: 3px solid #FFC52F;
                }
                
                .study-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 9px;
                    color: #ccc;
                    margin-bottom: 8px;
                }
                
                @media (max-width: 768px) {
                    .floating-card {
                        max-width: calc(100vw - 40px);
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Export the floating cards system
module.exports = FloatingSportsCards;

// Auto-start if used in browser
if (typeof window !== 'undefined') {
    window.FloatingSportsCards = FloatingSportsCards;
}
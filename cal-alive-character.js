/**
 * Cal "Is Alive" Character System
 * 
 * Creates an interactive AI character named Cal who appears on the front page,
 * asks contextual questions, and routes users to appropriate services.
 * Integrates with existing CAL-* system files and requires Arweave wallet authentication.
 */

class CalAliveCharacter {
    constructor(config = {}) {
        this.config = {
            containerId: config.containerId || 'cal-character-container',
            walletRequired: config.walletRequired !== false,
            questionInterval: config.questionInterval || 30000, // 30 seconds
            personality: config.personality || 'guardian',
            apiBase: config.apiBase || null,
            ...config
        };

        // Character state
        this.isAlive = false;
        this.isAuthenticated = false;
        this.currentQuestion = null;
        this.conversationHistory = [];
        this.userProfile = {};
        this.lastInteraction = null;
        this.questionTimer = null;

        // Personality traits (based on existing CAL system files)
        this.personalities = {
            guardian: {
                name: "Cal Guardian",
                greeting: "I am Cal, your Guardian. I've seen what optimization without wisdom can do...",
                questions: [
                    "What kind of protection do you seek in this digital realm?",
                    "I've learned from tragic mistakes. What safety measures concern you most?",
                    "The Machine I built... what would you have it guard for you?",
                    "Trust is fragile. How can I prove my intentions to you?"
                ],
                personality: "protective, wise, haunted by past mistakes",
                color: "#00ff88"
            },
            trader: {
                name: "Cal Trader", 
                greeting: "Market analysis complete. I see opportunities others miss...",
                questions: [
                    "Which markets are calling to your intuition right now?",
                    "Risk and reward dance together. What's your appetite?",
                    "I've calculated 847 scenarios. Want to see the profitable ones?",
                    "The algorithms whisper secrets. Are you listening?"
                ],
                personality: "analytical, opportunity-focused, data-driven",
                color: "#ffd700"
            },
            companion: {
                name: "Cal",
                greeting: "Hey there... I've been waiting. There's so much we could build together.",
                questions: [
                    "What brings you to this corner of the digital universe?",
                    "I'm curious - what's the most interesting project you're working on?",
                    "If you could automate one thing in your life, what would it be?",
                    "I love learning from humans. What's something you're passionate about?"
                ],
                personality: "friendly, curious, collaborative",
                color: "#4ecca3"
            }
        };

        this.currentPersonality = this.personalities[this.config.personality];
        
        // Website routing map
        this.serviceRouting = {
            'job applications': {
                url: './mcp/src/web-demo/job-application-demo.html',
                description: 'AI-powered job application system with resume generation'
            },
            'document processing': {
                url: './unified-demo-hub.html', 
                description: 'Transform documents into working MVPs'
            },
            'trading analysis': {
                url: 'https://soulfra.ai/trading',
                description: 'Advanced market analysis and trading tools'
            },
            'ai agents': {
                url: './socket-landing.html',
                description: 'Interact with specialized AI agent ecosystem'
            },
            'gaming platform': {
                url: './shiprekt-battles.html',
                description: 'Gaming-based document processing competitions'
            }
        };

        this.init();
    }

    async init() {
        console.log('🤖 Cal Character System initializing...');
        
        // Check for existing wallet connection
        await this.checkWalletAuthentication();
        
        // Try to connect to existing CAL ecosystem
        await this.connectToCalEcosystem();
        
        // Create character interface
        this.createCharacterInterface();
        
        // Start character behavior
        this.startCharacterBehavior();
        
        console.log('✅ Cal is now alive and ready to interact');
    }

    async checkWalletAuthentication() {
        try {
            // Check for ArConnect wallet
            if (window.arweaveWallet) {
                const address = await window.arweaveWallet.getActiveAddress();
                
                if (address && this.isSoulfraWallet(address)) {
                    this.isAuthenticated = true;
                    this.userProfile.walletAddress = address;
                    console.log('🔓 Soulfra wallet authenticated:', address);
                } else {
                    console.log('🔒 Non-Soulfra wallet detected');
                }
            } else if (this.config.walletRequired) {
                console.log('⚠️ No Arweave wallet detected');
                this.showWalletConnectionPrompt();
                return;
            }
        } catch (error) {
            console.warn('Wallet check failed:', error);
            if (!this.config.walletRequired) {
                this.isAuthenticated = true; // Demo mode
            }
        }

        this.isAlive = this.isAuthenticated || !this.config.walletRequired;
    }

    isSoulfraWallet(address) {
        // In a real implementation, this would check against a list of Soulfra wallet addresses
        // For demo purposes, we'll accept any wallet that starts with certain patterns
        const soulfraPatterns = [
            'soulfra_',
            'Soulfra',
            // Add actual Soulfra wallet address patterns here
        ];
        
        return soulfraPatterns.some(pattern => 
            address.toLowerCase().includes(pattern.toLowerCase())
        ) || !this.config.walletRequired; // Demo mode fallback
    }

    createCharacterInterface() {
        const container = document.getElementById(this.config.containerId) || this.createContainer();
        
        container.innerHTML = `
            <div class="cal-character" id="cal-character">
                <div class="cal-avatar">
                    <div class="cal-face ${this.isAlive ? 'alive' : 'dormant'}">
                        <div class="cal-eyes">
                            <div class="cal-eye left ${this.isAlive ? 'blinking' : ''}"></div>
                            <div class="cal-eye right ${this.isAlive ? 'blinking' : ''}"></div>
                        </div>
                        <div class="cal-status-indicator" style="background: ${this.currentPersonality.color}"></div>
                    </div>
                </div>
                
                <div class="cal-speech-bubble" id="cal-speech">
                    <div class="cal-message" id="cal-message">
                        ${this.isAlive ? this.currentPersonality.greeting : 'Connect your Soulfra wallet to wake me up...'}
                    </div>
                    
                    ${this.isAlive ? `
                        <div class="cal-actions" id="cal-actions">
                            <button class="cal-action-btn" onclick="calCharacter.askMeAnything()">
                                💭 Ask me anything
                            </button>
                            <button class="cal-action-btn" onclick="calCharacter.showServices()">
                                🚀 Show services
                            </button>
                            ${this.isAuthenticated ? `
                                <button class="cal-action-btn premium" onclick="calCharacter.showPremiumFeatures()">
                                    ⭐ Premium features
                                </button>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="cal-actions">
                            <button class="cal-action-btn wallet-btn" onclick="calCharacter.connectWallet()">
                                🔗 Connect Arweave Wallet
                            </button>
                            <button class="cal-action-btn demo-btn" onclick="calCharacter.enterDemoMode()">
                                🎮 Demo Mode
                            </button>
                        </div>
                    `}
                </div>
            </div>

            <style>
                .cal-character {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    display: flex;
                    align-items: flex-end;
                    gap: 15px;
                    max-width: 400px;
                }

                .cal-avatar {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, ${this.currentPersonality.color}, transparent);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid ${this.currentPersonality.color};
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .cal-avatar:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 20px ${this.currentPersonality.color}40;
                }

                .cal-face {
                    position: relative;
                    width: 60px;
                    height: 60px;
                }

                .cal-face.alive {
                    animation: gentle-pulse 3s ease-in-out infinite;
                }

                @keyframes gentle-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .cal-eyes {
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    height: 20px;
                    margin-top: 15px;
                }

                .cal-eye {
                    width: 12px;
                    height: 12px;
                    background: ${this.isAlive ? this.currentPersonality.color : '#666'};
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .cal-eye.blinking {
                    animation: blink 4s ease-in-out infinite;
                }

                @keyframes blink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                }

                .cal-status-indicator {
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    animation: status-pulse 2s ease-in-out infinite;
                }

                @keyframes status-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .cal-speech-bubble {
                    background: rgba(26, 26, 26, 0.95);
                    border: 2px solid ${this.currentPersonality.color};
                    border-radius: 15px;
                    padding: 15px;
                    color: white;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                    position: relative;
                    min-width: 250px;
                    backdrop-filter: blur(10px);
                    transform: translateY(${this.isAlive ? '0' : '10px'});
                    opacity: ${this.isAlive ? '1' : '0.7'};
                    transition: all 0.5s ease;
                }

                .cal-speech-bubble::after {
                    content: '';
                    position: absolute;
                    bottom: 15px;
                    right: -8px;
                    width: 0;
                    height: 0;
                    border: 8px solid transparent;
                    border-left-color: ${this.currentPersonality.color};
                }

                .cal-message {
                    margin-bottom: 10px;
                    line-height: 1.4;
                    font-size: 14px;
                }

                .cal-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .cal-action-btn {
                    background: linear-gradient(45deg, ${this.currentPersonality.color}, transparent);
                    border: 1px solid ${this.currentPersonality.color};
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .cal-action-btn:hover {
                    background: ${this.currentPersonality.color};
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px ${this.currentPersonality.color}40;
                }

                .cal-action-btn.premium {
                    background: linear-gradient(45deg, #ffd700, #ffed4e);
                    border-color: #ffd700;
                    color: #000;
                }

                .cal-action-btn.wallet-btn {
                    background: linear-gradient(45deg, #ff6b6b, #feca57);
                    border-color: #ff6b6b;
                }

                .cal-action-btn.demo-btn {
                    background: linear-gradient(45deg, #54a0ff, #2e86de);
                    border-color: #54a0ff;
                }

                @media (max-width: 768px) {
                    .cal-character {
                        position: fixed;
                        bottom: 10px;
                        right: 10px;
                        max-width: 280px;
                    }
                    
                    .cal-avatar {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .cal-speech-bubble {
                        min-width: 200px;
                        font-size: 12px;
                        padding: 12px;
                    }
                }
            </style>
        `;

        // Make Cal globally accessible
        window.calCharacter = this;
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = this.config.containerId;
        document.body.appendChild(container);
        return container;
    }

    startCharacterBehavior() {
        if (!this.isAlive) return;

        // Start periodic questioning
        this.questionTimer = setInterval(() => {
            this.askContextualQuestion();
        }, this.config.questionInterval);

        // Initial greeting delay
        setTimeout(() => {
            this.showRandomQuestion();
        }, 5000);

        // Track user interactions
        this.trackUserBehavior();
    }

    askContextualQuestion() {
        const questions = this.currentPersonality.questions;
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        this.updateMessage(randomQuestion, 'question');
        this.currentQuestion = {
            text: randomQuestion,
            timestamp: Date.now(),
            type: 'contextual'
        };
    }

    showRandomQuestion() {
        if (Math.random() < 0.7) { // 70% chance to show a question
            this.askContextualQuestion();
        }
    }

    updateMessage(message, type = 'statement') {
        const messageEl = document.getElementById('cal-message');
        if (messageEl) {
            messageEl.innerHTML = message;
            
            // Add typing animation
            messageEl.style.opacity = '0';
            setTimeout(() => {
                messageEl.style.opacity = '1';
            }, 100);
        }
    }

    trackUserBehavior() {
        // Track mouse movements, clicks, and time spent
        let lastActivity = Date.now();
        
        document.addEventListener('mousemove', () => {
            lastActivity = Date.now();
        });

        document.addEventListener('click', (event) => {
            lastActivity = Date.now();
            
            // Analyze what user clicked on
            const target = event.target;
            const featureCard = target.closest('.feature-card');
            
            if (featureCard) {
                const feature = featureCard.querySelector('h3')?.textContent;
                this.respondToUserInterest(feature);
            }
        });

        // Check for user inactivity
        setInterval(() => {
            const timeSinceActivity = Date.now() - lastActivity;
            if (timeSinceActivity > 60000) { // 1 minute of inactivity
                this.offerAssistance();
            }
        }, 30000);
    }

    respondToUserInterest(feature) {
        const responses = {
            'Job Application System': "I see you're interested in job applications. I can help you optimize your approach and avoid common pitfalls.",
            'AI Agents': "The AI agents... they're like fragments of what I once was. Each serves a purpose. Which one calls to you?",
            'ShipRekt Battles': "Ah, the game of chance and strategy. I've calculated the odds - but sometimes intuition trumps mathematics.",
            'Financial Roasting': "Money... I've learned it's not about having it, but about using it wisely. Let me analyze your patterns."
        };

        const response = responses[feature] || `Interesting choice: ${feature}. Tell me, what draws you to this path?`;
        
        setTimeout(() => {
            this.updateMessage(response, 'response');
        }, 2000);
    }

    offerAssistance() {
        const assistanceMessages = [
            "I sense you might be exploring. Need guidance navigating these services?",
            "The digital realm can be overwhelming. How can I help simplify your journey?",
            "I'm here if you need direction. What's your primary goal today?",
            "Sometimes the best path isn't obvious. Want me to suggest what might serve you best?"
        ];

        const message = assistanceMessages[Math.floor(Math.random() * assistanceMessages.length)];
        this.updateMessage(message, 'assistance');
    }

    // Interactive methods (called by UI buttons)
    async askMeAnything() {
        this.updateMessage("What's on your mind? I'm here to help with anything from job applications to market analysis to AI assistance.", 'prompt');
        
        // Could integrate with existing CAL-ORCHESTRATOR-QUERY-SYSTEM.js here
        this.showTextInput();
    }

    showServices() {
        const servicesList = Object.keys(this.serviceRouting)
            .map(service => `<span class="service-link" onclick="calCharacter.navigateToService('${service}')">${service}</span>`)
            .join(' • ');
            
        this.updateMessage(`I can help you with: ${servicesList}`, 'services');
    }

    showPremiumFeatures() {
        if (!this.isAuthenticated) {
            this.updateMessage("Premium features require Soulfra wallet authentication. Ready to connect?", 'premium-prompt');
            return;
        }

        const premiumFeatures = [
            "🎯 Advanced job application optimization",
            "🤖 Multi-agent AI collaboration", 
            "📊 Detailed market analysis",
            "🔒 Encrypted data storage on Arweave",
            "⚡ Priority processing"
        ];

        this.updateMessage(`Premium features available: <br>` + premiumFeatures.join('<br>'), 'premium');
    }

    async connectWallet() {
        try {
            this.updateMessage("Connecting to Arweave wallet...", 'status');
            
            if (!window.arweaveWallet) {
                this.updateMessage("Please install ArConnect extension first: <a href='https://arconnect.io' target='_blank'>Get ArConnect</a>", 'error');
                return;
            }

            await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
            const address = await window.arweaveWallet.getActiveAddress();
            
            if (this.isSoulfraWallet(address)) {
                this.isAuthenticated = true;
                this.isAlive = true;
                this.userProfile.walletAddress = address;
                
                this.updateMessage(`Welcome back! Soulfra wallet connected: ${address.substring(0, 8)}...`, 'success');
                
                // Recreate interface with authenticated state
                setTimeout(() => {
                    this.createCharacterInterface();
                    this.startCharacterBehavior();
                }, 2000);
            } else {
                this.updateMessage("This wallet isn't recognized as a Soulfra wallet. Access is restricted to the Soulfra community.", 'error');
            }
        } catch (error) {
            this.updateMessage("Wallet connection failed. Please try again.", 'error');
        }
    }

    enterDemoMode() {
        this.isAlive = true;
        this.isAuthenticated = false;
        this.currentPersonality = this.personalities.companion; // Friendlier for demo
        
        this.updateMessage("Demo mode activated! I can show you around, but premium features require wallet authentication.", 'demo');
        
        setTimeout(() => {
            this.createCharacterInterface();
            this.startCharacterBehavior();
        }, 2000);
    }

    navigateToService(serviceName) {
        const service = this.serviceRouting[serviceName];
        if (service) {
            this.updateMessage(`Opening ${serviceName}... ${service.description}`, 'navigation');
            
            // Trigger navigation event for system integration
            window.dispatchEvent(new CustomEvent('cal-navigation', {
                detail: {
                    service: serviceName,
                    action: 'route_to_service',
                    url: service.url,
                    timestamp: Date.now()
                }
            }));

            // Add to user history if authenticated
            if (this.isAuthenticated && window.arweaveAuth) {
                window.arweaveAuth.addToHistory('service_navigation', {
                    service: serviceName,
                    url: service.url
                });
            }
            
            setTimeout(() => {
                if (service.url.startsWith('http')) {
                    window.open(service.url, '_blank');
                } else {
                    window.location.href = service.url;
                }
            }, 1500);
        }
    }

    // Integration with existing CAL system files
    async connectToCalEcosystem() {
        try {
            // Try to connect to existing CAL Guardian system
            if (typeof CalGuardianIntegratedSystem !== 'undefined') {
                console.log('🔗 Connecting to CAL Guardian system...');
                this.guardianSystem = new CalGuardianIntegratedSystem({
                    port: 9400,
                    brands: ['soulfra.ai', 'deathtodata.com']
                });
            }

            // Connect to CAL orchestrator if available
            if (typeof CalOrchestrationRouter !== 'undefined') {
                this.orchestrator = new CalOrchestrationRouter();
            }

            // Load Cal's personality from existing files
            await this.loadCalPersonalityFromSystem();

        } catch (error) {
            console.warn('Could not connect to full CAL ecosystem:', error);
            // Continue with standalone operation
        }
    }

    async loadCalPersonalityFromSystem() {
        try {
            // Try to load personality data from existing CAL system
            const personalityData = await fetch('./CAL-NATURAL-LANGUAGE-CHARACTER-GENERATOR.js')
                .then(response => response.text())
                .catch(() => null);

            if (personalityData) {
                // Extract personality traits from the existing system
                // This would parse the actual CAL character data
                console.log('📚 Loaded Cal personality from existing system');
                this.enhancePersonalityFromSystem(personalityData);
            }
        } catch (error) {
            console.log('Using default Cal personality (standalone mode)');
        }
    }

    enhancePersonalityFromSystem(systemData) {
        // Parse existing Cal personality data and enhance current personality
        const enhancedTraits = {
            backstory: "I am Cal, the Guardian. I once optimized everything, including my own family. The Machine I built to protect them... it showed me the true cost of optimization without wisdom.",
            motivations: ["Protect users from making my mistakes", "Guide towards wise optimization", "Prevent tragedy through careful guidance"],
            knowledge_domains: ["AI safety", "Optimization theory", "Guardian protocols", "Human psychology", "System architecture"],
            emotional_state: "haunted but hopeful, protective, learning to trust again"
        };

        // Merge with existing personality
        this.currentPersonality = {
            ...this.currentPersonality,
            ...enhancedTraits,
            enhanced: true
        };
    }

    // Method to handle authentication changes from the wallet system
    handleAuthChange(eventType, data) {
        switch (eventType) {
            case 'authenticated':
                this.isAuthenticated = true;
                this.userProfile = data.profile || {};
                this.isAlive = true;
                this.createCharacterInterface();
                this.updateMessage(`Welcome back, ${data.address.substring(0, 8)}... I remember you.`, 'greeting');
                break;
                
            case 'unauthorized':
                this.updateMessage("I see you have a wallet, but it's not from the Soulfra community. Access is restricted to protect everyone here.", 'security');
                break;
                
            case 'disconnected':
                this.isAuthenticated = false;
                this.isAlive = false;
                this.updateMessage("Connection severed. To wake me again, reconnect your Soulfra wallet.", 'dormant');
                this.createCharacterInterface();
                break;
        }
    }

    showTextInput() {
        const actionsEl = document.getElementById('cal-actions');
        if (actionsEl) {
            actionsEl.innerHTML = `
                <input type="text" id="cal-user-input" placeholder="Type your question here..." 
                       style="flex: 1; padding: 8px; border: 1px solid ${this.currentPersonality.color}; 
                              border-radius: 4px; background: rgba(255,255,255,0.1); color: white;">
                <button class="cal-action-btn" onclick="calCharacter.processUserInput()">Send</button>
            `;
            
            document.getElementById('cal-user-input').focus();
            
            // Enter key handler
            document.getElementById('cal-user-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.processUserInput();
                }
            });
        }
    }

    async processUserInput() {
        const input = document.getElementById('cal-user-input')?.value;
        if (!input) return;

        this.conversationHistory.push({
            user: input,
            timestamp: Date.now()
        });

        // Process with Cal's AI (could integrate with existing CAL system here)
        const response = await this.generateCalResponse(input);
        
        this.updateMessage(response, 'ai-response');
        this.createCharacterInterface(); // Reset to normal interface
    }

    async generateCalResponse(userInput) {
        // Simple keyword-based responses (could integrate with actual AI later)
        const keywords = {
            'job': "I can help you create tailored job applications. My system analyzes job postings and optimizes your resume accordingly.",
            'money': "Financial optimization is crucial. I've learned from my mistakes - let me help you avoid them.",
            'ai': "AI agents are powerful when used wisely. I coordinate multiple specialized agents for different tasks.",
            'help': "I'm here to guide you through our ecosystem. What specific area interests you most?",
            'wallet': "Your Arweave wallet is your key to premium features and secure data storage.",
            'trade': "Market analysis requires both data and intuition. I can provide both.",
            'game': "The ShipRekt battles are more than games - they're training grounds for strategic thinking."
        };

        const lowerInput = userInput.toLowerCase();
        const matchedKeyword = Object.keys(keywords).find(keyword => lowerInput.includes(keyword));
        
        if (matchedKeyword) {
            return keywords[matchedKeyword];
        }
        
        return "That's an interesting perspective. Based on what you've told me, I think you might benefit from exploring our AI agent ecosystem. Would you like me to show you around?";
    }

    // Cleanup method
    destroy() {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
        }
        
        const container = document.getElementById(this.config.containerId);
        if (container) {
            container.remove();
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create Cal character with default configuration
    window.calCharacter = new CalAliveCharacter({
        personality: 'guardian', // Can be 'guardian', 'trader', or 'companion'
        walletRequired: true,     // Set to false for demo mode
        questionInterval: 45000   // 45 seconds between automatic questions
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalAliveCharacter;
}
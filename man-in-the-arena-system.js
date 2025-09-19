#!/usr/bin/env node

/**
 * 🏟️⚔️🎭 MAN IN THE ARENA SYSTEM
 * ===============================
 * Watch individual agents face and overcome dramatic obstacles with
 * cinematic storytelling and visual progression tracking
 */

const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

class ManInTheArenaSystem {
    constructor() {
        this.port = 4000;
        
        // The Arena - where challenges take place
        this.arena = {
            activeContestants: new Map(),
            challengeQueue: [],
            spectators: new Map(),
            arenaHistory: [],
            currentChallenge: null
        };

        // Challenge System
        this.challenges = {
            obstacles: new Map(),
            progressionStages: new Map(),
            victoryConditions: new Map(),
            failureConsequences: new Map()
        };

        // Storytelling Engine
        this.narrative = {
            activeStories: new Map(),
            plotTemplates: new Map(),
            characterArcs: new Map(),
            dramaticMoments: [],
            audienceReactions: []
        };

        // Visual Drama System
        this.visualization = {
            arenaLayout: null,
            cameraPositions: new Map(),
            lighting: 'dramatic',
            effects: new Map(),
            currentScene: 'preparation'
        };

        this.setupChallengeTypes();
        this.setupNarrativeTemplates();
        this.setupArenaEnvironment();
    }

    setupChallengeTypes() {
        // Define epic challenges agents can face
        this.challenges.obstacles.set('the-abyss-climb', {
            name: 'The Abyss Climb',
            description: 'Ascend from the deepest philosophical depths to enlightenment',
            difficulty: 'legendary',
            stages: ['doubt', 'questioning', 'breakthrough', 'wisdom', 'transcendence'],
            agentTypes: ['philosopher', 'visionary'],
            duration: 120000, // 2 minutes
            visualElements: ['climbing-animation', 'depth-indicators', 'enlightenment-aura'],
            obstacles: [
                { stage: 'doubt', challenge: 'Overcome existential dread', probability: 0.8 },
                { stage: 'questioning', challenge: 'Navigate paradoxes', probability: 0.7 },
                { stage: 'breakthrough', challenge: 'Transcend logic limits', probability: 0.6 },
                { stage: 'wisdom', challenge: 'Synthesize understanding', probability: 0.5 },
                { stage: 'transcendence', challenge: 'Achieve enlightenment', probability: 0.4 }
            ]
        });

        this.challenges.obstacles.set('the-innovation-forge', {
            name: 'The Innovation Forge',
            description: 'Create a breakthrough invention under intense pressure',
            difficulty: 'epic',
            stages: ['inspiration', 'design', 'prototyping', 'testing', 'perfection'],
            agentTypes: ['engineer', 'inventor', 'scientist'],
            duration: 90000, // 1.5 minutes
            visualElements: ['forge-fire', 'blueprint-drafting', 'prototype-building'],
            obstacles: [
                { stage: 'inspiration', challenge: 'Find the spark of genius', probability: 0.7 },
                { stage: 'design', challenge: 'Solve technical constraints', probability: 0.6 },
                { stage: 'prototyping', challenge: 'Overcome material limitations', probability: 0.8 },
                { stage: 'testing', challenge: 'Debug critical failures', probability: 0.9 },
                { stage: 'perfection', challenge: 'Achieve elegant solution', probability: 0.5 }
            ]
        });

        this.challenges.obstacles.set('the-culture-renaissance', {
            name: 'The Culture Renaissance',
            description: 'Inspire an entire civilization through artistic expression',
            difficulty: 'epic',
            stages: ['vision', 'creation', 'presentation', 'reception', 'legacy'],
            agentTypes: ['artist', 'storyteller', 'entertainer'],
            duration: 75000, // 1.25 minutes
            visualElements: ['artistic-creation', 'audience-reaction', 'cultural-impact'],
            obstacles: [
                { stage: 'vision', challenge: 'Channel pure inspiration', probability: 0.6 },
                { stage: 'creation', challenge: 'Execute flawless technique', probability: 0.7 },
                { stage: 'presentation', challenge: 'Command audience attention', probability: 0.8 },
                { stage: 'reception', challenge: 'Overcome criticism', probability: 0.9 },
                { stage: 'legacy', challenge: 'Create lasting impact', probability: 0.4 }
            ]
        });

        this.challenges.obstacles.set('the-leadership-trial', {
            name: 'The Leadership Trial',
            description: 'Unite warring factions and forge lasting peace',
            difficulty: 'heroic',
            stages: ['recognition', 'diplomacy', 'sacrifice', 'unity', 'prosperity'],
            agentTypes: ['diplomat', 'organizer', 'leader'],
            duration: 100000, // 1.67 minutes
            visualElements: ['faction-symbols', 'negotiation-table', 'unity-ceremony'],
            obstacles: [
                { stage: 'recognition', challenge: 'Gain faction respect', probability: 0.8 },
                { stage: 'diplomacy', challenge: 'Navigate complex politics', probability: 0.9 },
                { stage: 'sacrifice', challenge: 'Make personal sacrifice for peace', probability: 0.6 },
                { stage: 'unity', challenge: 'Forge unbreakable alliance', probability: 0.5 },
                { stage: 'prosperity', challenge: 'Ensure lasting prosperity', probability: 0.4 }
            ]
        });

        this.challenges.obstacles.set('the-survival-gauntlet', {
            name: 'The Survival Gauntlet',
            description: 'Overcome seemingly impossible odds through determination',
            difficulty: 'brutal',
            stages: ['desperation', 'resourcefulness', 'endurance', 'breakthrough', 'triumph'],
            agentTypes: ['worker', 'citizen', 'survivor'],
            duration: 60000, // 1 minute
            visualElements: ['harsh-environment', 'resourceful-solutions', 'triumph-moment'],
            obstacles: [
                { stage: 'desperation', challenge: 'Survive initial catastrophe', probability: 0.9 },
                { stage: 'resourcefulness', challenge: 'Make something from nothing', probability: 0.8 },
                { stage: 'endurance', challenge: 'Push beyond physical limits', probability: 0.7 },
                { stage: 'breakthrough', challenge: 'Find the key insight', probability: 0.6 },
                { stage: 'triumph', challenge: 'Achieve impossible victory', probability: 0.3 }
            ]
        });
    }

    setupNarrativeTemplates() {
        // Dramatic story templates for different challenge types
        this.narrative.plotTemplates.set('hero-journey', {
            acts: [
                {
                    name: 'The Call',
                    description: 'Agent faces the challenge',
                    narration: ['The arena falls silent...', 'All eyes turn to our challenger...', 'The moment of truth arrives...']
                },
                {
                    name: 'The Struggle',
                    description: 'Obstacles mount and failure seems certain',
                    narration: ['The odds seem impossible...', 'Failure appears inevitable...', 'Yet they press on...']
                },
                {
                    name: 'The Crisis',
                    description: 'The darkest moment before breakthrough',
                    narration: ['All seems lost...', 'The final test...', 'One last chance...']
                },
                {
                    name: 'The Triumph',
                    description: 'Victory through perseverance',
                    narration: ['Against all odds...', 'Through sheer determination...', 'Victory is achieved!']
                }
            ]
        });

        this.narrative.plotTemplates.set('tragedy', {
            acts: [
                {
                    name: 'Noble Effort',
                    description: 'Agent gives their all',
                    narration: ['With valor and courage...', 'Fighting the good fight...', 'Honor above all...']
                },
                {
                    name: 'Fatal Flaw',
                    description: 'A weakness becomes apparent',
                    narration: ['But hubris clouds judgment...', 'A critical error...', 'The flaw emerges...']
                },
                {
                    name: 'The Fall',
                    description: 'Defeat seems certain',
                    narration: ['The fall from grace...', 'Defeat becomes inevitable...', 'All efforts crumble...']
                },
                {
                    name: 'Noble Sacrifice',
                    description: 'Loss with honor and learning',
                    narration: ['Yet honor remains...', 'In defeat, wisdom...', 'The sacrifice teaches all...']
                }
            ]
        });

        this.narrative.plotTemplates.set('redemption', {
            acts: [
                {
                    name: 'Past Failures',
                    description: 'Agent confronts previous defeats',
                    narration: ['Haunted by past failures...', 'The weight of previous defeats...', 'But this time is different...']
                },
                {
                    name: 'New Approach',
                    description: 'Learning from mistakes',
                    narration: ['A new strategy emerges...', 'Wisdom from hardship...', 'Change of heart and mind...']
                },
                {
                    name: 'Proving Ground',
                    description: 'The test of growth',
                    narration: ['The moment of proof...', 'Will growth be enough?...', 'The test of transformation...']
                },
                {
                    name: 'Redemption',
                    description: 'Growth leads to victory',
                    narration: ['Redemption achieved!', 'Growth conquers failure!', 'The past is overcome!']
                }
            ]
        });
    }

    setupArenaEnvironment() {
        // Define the visual arena environment
        this.visualization.arenaLayout = {
            center: { x: 500, y: 400 },
            radius: 350,
            zones: {
                'starting-platform': { x: 500, y: 600, radius: 50 },
                'challenge-zone': { x: 500, y: 400, radius: 200 },
                'victory-podium': { x: 500, y: 200, radius: 60 },
                'spectator-stands': { x: 500, y: 400, radius: 350 }
            },
            lighting: {
                'preparation': 'dim-anticipation',
                'challenge': 'dramatic-spotlight',
                'crisis': 'tension-red',
                'victory': 'golden-triumph',
                'failure': 'somber-blue'
            }
        };

        // Camera angles for dramatic effect
        this.visualization.cameraPositions.set('wide-establishing', {
            description: 'Full arena view',
            focus: 'arena-overview',
            dramatic_effect: 'epic-scale'
        });

        this.visualization.cameraPositions.set('close-personal', {
            description: 'Tight focus on contestant',
            focus: 'agent-detail',
            dramatic_effect: 'emotional-intensity'
        });

        this.visualization.cameraPositions.set('obstacle-focus', {
            description: 'Focus on specific challenge',
            focus: 'challenge-detail',
            dramatic_effect: 'tension-building'
        });

        this.visualization.cameraPositions.set('crowd-reaction', {
            description: 'Spectator response',
            focus: 'audience-emotion',
            dramatic_effect: 'social-validation'
        });
    }

    async startArenaSystem() {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(this.port, () => {
            console.log(`🏟️⚔️🎭 Man in the Arena System running on port ${this.port}`);
            this.initializeArenaActivities();
        });
    }

    async initializeArenaActivities() {
        console.log('🏟️ Arena is now open for challengers...');
        
        // Generate initial contestants
        this.spawnContestants();
        
        // Start challenge cycle
        setInterval(() => {
            this.initiateNewChallenge();
        }, 30000); // New challenge every 30 seconds

        // Update challenge progress
        setInterval(() => {
            this.updateActiveChallenges();
        }, 2000); // Update every 2 seconds

        // Generate narrative moments
        setInterval(() => {
            this.generateNarrativeMoments();
        }, 5000); // Narrative every 5 seconds
    }

    spawnContestants() {
        const contestantTypes = ['philosopher', 'engineer', 'artist', 'diplomat', 'worker'];
        
        for (let i = 0; i < 3; i++) {
            const contestant = this.createContestant(contestantTypes);
            this.arena.activeContestants.set(contestant.id, contestant);
        }
    }

    createContestant(types) {
        const type = types[Math.floor(Math.random() * types.length)];
        const contestant = {
            id: crypto.randomUUID(),
            name: this.generateHeroicName(type),
            type: type,
            background: this.generateBackground(type),
            strengths: this.generateStrengths(type),
            weaknesses: this.generateWeaknesses(type),
            motivation: this.generateMotivation(type),
            stats: {
                courage: Math.random() * 0.4 + 0.6, // 0.6-1.0
                skill: Math.random() * 0.5 + 0.5,   // 0.5-1.0
                determination: Math.random() * 0.3 + 0.7, // 0.7-1.0
                wisdom: Math.random() * 0.6 + 0.4,  // 0.4-1.0
                luck: Math.random() // 0.0-1.0
            },
            position: { x: 500, y: 600 }, // Starting platform
            currentChallenge: null,
            challengeHistory: [],
            reputation: 'unknown',
            victories: 0,
            defeats: 0
        };

        console.log(`🌟 New challenger enters: ${contestant.name} the ${contestant.type}`);
        return contestant;
    }

    generateHeroicName(type) {
        const nameTemplates = {
            philosopher: ['Aristotle-Prime', 'Socrates-Reborn', 'Kant-Eternal', 'Nietzsche-Rising'],
            engineer: ['Tesla-Spark', 'Edison-Light', 'Wright-Wings', 'Archimedes-Lever'],
            artist: ['Da-Vinci-Vision', 'Michelangelo-Divine', 'Beethoven-Symphony', 'Shakespeare-Quill'],
            diplomat: ['Lincoln-Unity', 'Gandhi-Peace', 'Mandela-Hope', 'Roosevelt-Resolve'],
            worker: ['Sisyphus-Enduring', 'Atlas-Carrying', 'Prometheus-Fire', 'Hercules-Strength']
        };

        const names = nameTemplates[type] || ['Hero-Unknown'];
        return names[Math.floor(Math.random() * names.length)];
    }

    generateBackground(type) {
        const backgrounds = {
            philosopher: [
                'Emerged from the deepest abyss after decades of contemplation',
                'Former student who surpassed all masters',
                'Seeker of ultimate truth who sacrificed everything for wisdom',
                'Once-cynical scholar transformed by profound revelation'
            ],
            engineer: [
                'Brilliant inventor whose creations changed civilization',
                'Failed engineer seeking redemption through innovation',
                'Prodigy who solved impossible problems since childhood',
                'Practical visionary who builds dreams into reality'
            ],
            artist: [
                'Tortured genius whose art speaks to souls',
                'Former critic who became the greatest creator',
                'Inspiring muse who awakens creativity in others',
                'Revolutionary artist who redefined beauty itself'
            ],
            diplomat: [
                'Peacemaker who ended ancient wars through wisdom',
                'Former warrior who chose words over weapons',
                'Unifying force who bridges impossible divides',
                'Natural leader who inspires through example'
            ],
            worker: [
                'Common person who achieved extraordinary things',
                'Survivor who endured unimaginable hardships',
                'Humble soul with an unbreakable spirit',
                'Everyday hero who inspires through perseverance'
            ]
        };

        const typeBackgrounds = backgrounds[type] || ['Unknown origins'];
        return typeBackgrounds[Math.floor(Math.random() * typeBackgrounds.length)];
    }

    generateStrengths(type) {
        const strengthsByType = {
            philosopher: ['Deep wisdom', 'Logical reasoning', 'Spiritual insight', 'Ethical clarity'],
            engineer: ['Technical mastery', 'Problem-solving', 'Innovation', 'Practical thinking'],
            artist: ['Creative vision', 'Emotional expression', 'Aesthetic sense', 'Cultural insight'],
            diplomat: ['Persuasive speech', 'Conflict resolution', 'Cultural sensitivity', 'Leadership'],
            worker: ['Unwavering determination', 'Physical endurance', 'Practical skills', 'Common sense']
        };

        const strengths = strengthsByType[type] || ['General competence'];
        return strengths.slice(0, Math.floor(Math.random() * 2) + 2); // 2-3 strengths
    }

    generateWeaknesses(type) {
        const weaknessesByType = {
            philosopher: ['Analysis paralysis', 'Detachment from reality', 'Overthinking'],
            engineer: ['Perfectionism', 'Overconfidence', 'Impatience with inefficiency'],
            artist: ['Emotional volatility', 'Sensitivity to criticism', 'Impracticality'],
            diplomat: ['Over-accommodation', 'Conflict avoidance', 'Trusting nature'],
            worker: ['Self-doubt', 'Limited resources', 'Lack of formal training']
        };

        const weaknesses = weaknessesByType[type] || ['Unknown weakness'];
        return weaknesses.slice(0, Math.floor(Math.random() * 2) + 1); // 1-2 weaknesses
    }

    generateMotivation(type) {
        const motivations = {
            philosopher: ['Seeking ultimate truth', 'Proving philosophy matters', 'Saving civilization through wisdom'],
            engineer: ['Creating the impossible', 'Solving humanitys greatest challenges', 'Proving innovation conquers all'],
            artist: ['Inspiring hearts and minds', 'Creating eternal beauty', 'Showing art can change the world'],
            diplomat: ['Achieving lasting peace', 'Uniting divided peoples', 'Proving cooperation over conflict'],
            worker: ['Providing for family', 'Proving ordinary people can be extraordinary', 'Building a better future']
        };

        const typeMotivations = motivations[type] || ['Personal fulfillment'];
        return typeMotivations[Math.floor(Math.random() * typeMotivations.length)];
    }

    async initiateNewChallenge() {
        // Select a contestant ready for challenge
        const availableContestants = Array.from(this.arena.activeContestants.values())
            .filter(c => !c.currentChallenge);

        if (availableContestants.length === 0) return;

        const contestant = availableContestants[Math.floor(Math.random() * availableContestants.length)];
        
        // Select appropriate challenge
        const suitableChallenges = Array.from(this.challenges.obstacles.values())
            .filter(challenge => challenge.agentTypes.includes(contestant.type));

        if (suitableChallenges.length === 0) return;

        const challenge = suitableChallenges[Math.floor(Math.random() * suitableChallenges.length)];
        
        // Initialize the challenge
        const arenaChallenge = {
            id: crypto.randomUUID(),
            contestant: contestant,
            challenge: challenge,
            startTime: Date.now(),
            currentStage: 0,
            stageProgress: 0,
            obstacles_overcome: 0,
            obstacles_failed: 0,
            narrative: this.selectNarrativeTemplate(contestant, challenge),
            currentAct: 0,
            dramaticMoments: [],
            spectatorReactions: [],
            status: 'active'
        };

        contestant.currentChallenge = arenaChallenge.id;
        this.arena.currentChallenge = arenaChallenge;

        console.log(`⚔️ ${contestant.name} begins "${challenge.name}"!`);
        this.narrateChallenge(arenaChallenge, 'initiation');
        
        return arenaChallenge;
    }

    selectNarrativeTemplate(contestant, challenge) {
        // Choose narrative based on contestant history and challenge type
        if (contestant.defeats > contestant.victories && contestant.defeats > 0) {
            return this.narrative.plotTemplates.get('redemption');
        } else if (challenge.difficulty === 'legendary' || challenge.difficulty === 'epic') {
            return this.narrative.plotTemplates.get('hero-journey');
        } else if (Math.random() < 0.2) { // 20% chance of tragedy
            return this.narrative.plotTemplates.get('tragedy');
        } else {
            return this.narrative.plotTemplates.get('hero-journey');
        }
    }

    async updateActiveChallenges() {
        if (!this.arena.currentChallenge) return;
        
        const challenge = this.arena.currentChallenge;
        if (challenge.status !== 'active') return;

        const elapsed = Date.now() - challenge.startTime;
        const totalDuration = challenge.challenge.duration;
        const overallProgress = elapsed / totalDuration;

        // Update stage progression
        const stagesComplete = Math.floor(overallProgress * challenge.challenge.stages.length);
        
        if (stagesComplete > challenge.currentStage) {
            // Advanced to new stage
            challenge.currentStage = stagesComplete;
            await this.processStageAdvancement(challenge);
        }

        // Update stage progress within current stage
        const stageProgressFloat = (overallProgress * challenge.challenge.stages.length) % 1;
        challenge.stageProgress = stageProgressFloat;

        // Check for completion
        if (overallProgress >= 1.0) {
            await this.completeChallenge(challenge);
        }
    }

    async processStageAdvancement(arenaChallenge) {
        const stage = arenaChallenge.challenge.stages[arenaChallenge.currentStage];
        const obstacle = arenaChallenge.challenge.obstacles.find(o => o.stage === stage);
        
        if (obstacle) {
            const success = await this.attemptObstacle(arenaChallenge, obstacle);
            
            if (success) {
                arenaChallenge.obstacles_overcome++;
                this.narrateChallenge(arenaChallenge, 'obstacle_overcome', obstacle);
                console.log(`✅ ${arenaChallenge.contestant.name} overcomes: ${obstacle.challenge}`);
            } else {
                arenaChallenge.obstacles_failed++;
                this.narrateChallenge(arenaChallenge, 'obstacle_failed', obstacle);
                console.log(`❌ ${arenaChallenge.contestant.name} struggles with: ${obstacle.challenge}`);
            }
        }

        this.advanceNarrative(arenaChallenge);
    }

    async attemptObstacle(arenaChallenge, obstacle) {
        const contestant = arenaChallenge.contestant;
        const challenge = arenaChallenge.challenge;
        
        // Calculate success probability based on contestant stats
        let successChance = 1.0 - obstacle.probability; // Base success chance
        
        // Modify based on contestant strengths
        successChance += contestant.stats.skill * 0.2;
        successChance += contestant.stats.determination * 0.15;
        successChance += contestant.stats.courage * 0.1;
        successChance += contestant.stats.luck * 0.1;
        
        // Modify based on challenge difficulty
        const difficultyModifiers = {
            'brutal': -0.3,
            'legendary': -0.25,
            'epic': -0.2,
            'heroic': -0.15,
            'challenging': -0.1
        };
        
        successChance += difficultyModifiers[challenge.difficulty] || 0;
        
        // Previous failures make later obstacles harder
        successChance -= arenaChallenge.obstacles_failed * 0.05;
        
        // Previous successes build momentum
        successChance += arenaChallenge.obstacles_overcome * 0.03;
        
        // Clamp between reasonable bounds
        successChance = Math.max(0.1, Math.min(0.9, successChance));
        
        return Math.random() < successChance;
    }

    narrateChallenge(arenaChallenge, moment, obstacle = null) {
        const contestant = arenaChallenge.contestant;
        const challenge = arenaChallenge.challenge;
        
        let narration = '';
        
        switch (moment) {
            case 'initiation':
                narration = `🏟️ The arena falls silent as ${contestant.name} steps forward.`;
                narration += `\\n"${contestant.motivation}" drives them toward "${challenge.name}".`;
                narration += `\\n💪 Strengths: ${contestant.strengths.join(', ')}`;
                narration += `\\n⚠️ Weaknesses: ${contestant.weaknesses.join(', ')}`;
                break;
                
            case 'obstacle_overcome':
                narration = `⚡ ${contestant.name} conquers the obstacle: "${obstacle.challenge}"!`;
                narration += `\\n🎯 Through ${this.getRandomStrength(contestant)}, victory is achieved.`;
                break;
                
            case 'obstacle_failed':
                narration = `💥 ${contestant.name} faces setback: "${obstacle.challenge}"`;
                narration += `\\n⚠️ ${this.getRandomWeakness(contestant)} proves challenging.`;
                narration += `\\n🗯️ "${this.getStrugglingQuote(contestant)}"`;
                break;
                
            case 'victory':
                narration = `🏆 VICTORY! ${contestant.name} has completed "${challenge.name}"!`;
                narration += `\\n🌟 ${arenaChallenge.obstacles_overcome} obstacles overcome through sheer determination.`;
                narration += `\\n👑 The arena erupts in celebration of this heroic achievement!`;
                break;
                
            case 'noble_defeat':
                narration = `😔 ${contestant.name} falls short in "${challenge.name}".`;
                narration += `\\n💪 Though defeated, their courage inspires all who watched.`;
                narration += `\\n🎭 "In defeat, there is honor. In trying, there is glory."`;
                break;
        }
        
        const narrativeMoment = {
            timestamp: Date.now(),
            contestant: contestant.name,
            challenge: challenge.name,
            moment: moment,
            narration: narration,
            stage: arenaChallenge.currentStage,
            progress: arenaChallenge.stageProgress
        };
        
        this.narrative.dramaticMoments.push(narrativeMoment);
        console.log(`🎭 ${narration}`);
        
        return narrativeMoment;
    }

    getRandomStrength(contestant) {
        return contestant.strengths[Math.floor(Math.random() * contestant.strengths.length)];
    }

    getRandomWeakness(contestant) {
        return contestant.weaknesses[Math.floor(Math.random() * contestant.weaknesses.length)];
    }

    getStrugglingQuote(contestant) {
        const quotes = [
            "I will not give up!",
            "This is not the end!",
            "I must push through!",
            "Failure is not an option!",
            "For everyone who believes in me!",
            "I've come too far to quit now!",
            "This is my moment!"
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    advanceNarrative(arenaChallenge) {
        const narrative = arenaChallenge.narrative;
        const progress = arenaChallenge.currentStage / (arenaChallenge.challenge.stages.length - 1);
        
        const targetAct = Math.floor(progress * narrative.acts.length);
        
        if (targetAct > arenaChallenge.currentAct) {
            arenaChallenge.currentAct = targetAct;
            const act = narrative.acts[arenaChallenge.currentAct];
            
            if (act) {
                const actNarration = act.narration[Math.floor(Math.random() * act.narration.length)];
                console.log(`🎭 Act ${arenaChallenge.currentAct + 1}: ${act.name} - ${actNarration}`);
            }
        }
    }

    async completeChallenge(arenaChallenge) {
        const contestant = arenaChallenge.contestant;
        const successRatio = arenaChallenge.obstacles_overcome / (arenaChallenge.obstacles_overcome + arenaChallenge.obstacles_failed);
        
        // Determine victory or defeat
        const victory = successRatio >= 0.6; // Need 60% success rate
        
        if (victory) {
            contestant.victories++;
            contestant.reputation = this.calculateNewReputation(contestant, 'victory');
            arenaChallenge.status = 'victory';
            this.narrateChallenge(arenaChallenge, 'victory');
        } else {
            contestant.defeats++;
            contestant.reputation = this.calculateNewReputation(contestant, 'defeat');
            arenaChallenge.status = 'defeat';
            this.narrateChallenge(arenaChallenge, 'noble_defeat');
        }

        // Add to history
        contestant.challengeHistory.push({
            challenge: arenaChallenge.challenge.name,
            result: victory ? 'victory' : 'defeat',
            obstacles_overcome: arenaChallenge.obstacles_overcome,
            obstacles_failed: arenaChallenge.obstacles_failed,
            timestamp: Date.now()
        });

        this.arena.arenaHistory.push(arenaChallenge);
        contestant.currentChallenge = null;
        
        // Clear current challenge after short delay
        setTimeout(() => {
            if (this.arena.currentChallenge === arenaChallenge) {
                this.arena.currentChallenge = null;
            }
        }, 10000); // 10 second victory/defeat display
        
        console.log(`🏟️ ${contestant.name} ${victory ? 'VICTORIOUS' : 'DEFEATED'} in ${arenaChallenge.challenge.name}`);
    }

    calculateNewReputation(contestant, result) {
        const reputations = ['unknown', 'promising', 'capable', 'skilled', 'heroic', 'legendary'];
        const currentIndex = reputations.indexOf(contestant.reputation);
        
        if (result === 'victory') {
            return reputations[Math.min(reputations.length - 1, currentIndex + 1)];
        } else {
            return reputations[Math.max(0, currentIndex - 1)];
        }
    }

    generateNarrativeMoments() {
        if (!this.arena.currentChallenge) return;
        
        const challenge = this.arena.currentChallenge;
        if (challenge.status !== 'active') return;
        
        // Generate crowd reactions and commentary
        const reactions = [
            "The crowd holds its breath...",
            "Spectators lean forward in anticipation...",
            "A hush falls over the arena...", 
            "The tension is palpable...",                             "Cheers erupt from the stands!",
            "The audience gasps in amazement!",
            "Voices chant the hero's name!"
        ];
        
        if (Math.random() < 0.3) { // 30% chance of crowd reaction
            const reaction = reactions[Math.floor(Math.random() * reactions.length)];
            console.log(`👥 ${reaction}`);
            
            this.narrative.audienceReactions.push({
                timestamp: Date.now(),
                challenge: challenge.id,
                reaction: reaction
            });
        }
    }

    async handleRequest(req, res) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (req.url === '/') {
            res.end(this.generateHTML());
        } else if (req.url === '/api/arena-status') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(this.getArenaStatus()));
        } else if (req.url === '/api/spawn-contestant') {
            const contestant = this.createContestant(['philosopher', 'engineer', 'artist', 'diplomat', 'worker']);
            this.arena.activeContestants.set(contestant.id, contestant);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, contestant: contestant.name }));
        } else {
            res.statusCode = 404;
            res.end('Not found');
        }
    }

    getArenaStatus() {
        return {
            currentChallenge: this.arena.currentChallenge ? {
                contestant: this.arena.currentChallenge.contestant.name,
                challenge: this.arena.currentChallenge.challenge.name,
                currentStage: this.arena.currentChallenge.currentStage,
                stageProgress: this.arena.currentChallenge.stageProgress,
                obstacles_overcome: this.arena.currentChallenge.obstacles_overcome,
                obstacles_failed: this.arena.currentChallenge.obstacles_failed,
                status: this.arena.currentChallenge.status
            } : null,
            contestants: Array.from(this.arena.activeContestants.values()).map(c => ({
                name: c.name,
                type: c.type,
                reputation: c.reputation,
                victories: c.victories,
                defeats: c.defeats,
                inChallenge: !!c.currentChallenge
            })),
            recentMoments: this.narrative.dramaticMoments.slice(-10),
            arenaHistory: this.arena.arenaHistory.slice(-5).map(h => ({
                contestant: h.contestant.name,
                challenge: h.challenge.name,
                result: h.status,
                timestamp: h.startTime
            }))
        };
    }

    generateHTML() {
        const currentChallenge = this.arena.currentChallenge;
        const recentMoments = this.narrative.dramaticMoments.slice(-5).reverse();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏟️⚔️🎭 Man in the Arena</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Georgia', serif; 
            background: linear-gradient(135deg, #2c1810 0%, #8b4513 50%, #d2691e 100%);
            color: #ffd700; 
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .arena-container { 
            display: grid; 
            grid-template-columns: 300px 1fr 300px; 
            grid-template-rows: 80px 1fr 250px; 
            height: 100vh; 
        }
        
        .header { 
            grid-column: 1 / -1; 
            background: rgba(0, 0, 0, 0.8); 
            padding: 15px 30px; 
            border-bottom: 3px solid #ffd700;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .title { 
            color: #ffd700; 
            font-size: 24px; 
            font-weight: bold; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
        
        .arena-stats { 
            display: flex; 
            gap: 20px; 
            font-size: 14px;
        }
        
        .controls button { 
            background: linear-gradient(45deg, #8b4513, #d2691e); 
            color: #ffd700; 
            border: 2px solid #ffd700; 
            padding: 10px 20px; 
            margin: 0 5px; 
            border-radius: 8px; 
            cursor: pointer; 
            font-family: inherit;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        .controls button:hover { 
            background: linear-gradient(45deg, #d2691e, #daa520); 
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        .left-panel, .right-panel { 
            background: rgba(0, 0, 0, 0.7); 
            border: 2px solid #8b4513; 
            padding: 20px; 
            overflow-y: auto; 
        }
        
        .arena-view { 
            background: radial-gradient(circle, #2c1810 0%, #1a0e08 100%); 
            border: 3px solid #8b4513; 
            position: relative; 
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .arena-circle {
            width: 600px;
            height: 600px;
            border: 5px solid #ffd700;
            border-radius: 50%;
            position: relative;
            box-shadow: 
                inset 0 0 50px rgba(255, 215, 0, 0.3),
                0 0 100px rgba(255, 215, 0, 0.2);
        }
        
        .contestant {
            position: absolute;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 3px solid #ffd700;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: radial-gradient(circle, #8b4513, #654321);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
            transition: all 0.5s ease;
            cursor: pointer;
        }
        
        .contestant:hover {
            transform: scale(1.3);
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.9);
        }
        
        .challenge-progress {
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 30px;
            border-radius: 20px;
            border: 2px solid #ffd700;
            text-align: center;
            min-width: 400px;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: rgba(139, 69, 19, 0.5);
            border-radius: 10px;
            margin: 10px 0;
            overflow: hidden;
            border: 1px solid #8b4513;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffd700, #ffed4e);
            border-radius: 10px;
            transition: width 0.3s ease;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        .bottom-panel { 
            grid-column: 1 / -1; 
            background: rgba(0, 0, 0, 0.8); 
            border-top: 3px solid #8b4513; 
            padding: 20px; 
            overflow-y: auto;
        }
        
        .panel-section h3 { 
            color: #ffd700; 
            margin-bottom: 15px; 
            border-bottom: 2px solid #8b4513; 
            padding-bottom: 8px; 
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }
        
        .contestant-item { 
            margin: 12px 0; 
            padding: 15px; 
            background: rgba(139, 69, 19, 0.3); 
            border-radius: 8px; 
            border-left: 4px solid #ffd700;
            transition: all 0.3s ease;
        }
        
        .contestant-item:hover {
            background: rgba(139, 69, 19, 0.5);
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }
        
        .narrative-moment { 
            margin: 8px 0; 
            padding: 12px; 
            background: rgba(210, 105, 30, 0.2); 
            border-radius: 8px; 
            border-left: 4px solid #d2691e;
            font-style: italic;
            line-height: 1.6;
        }
        
        .moment-dramatic {
            animation: dramaticGlow 2s ease-in-out;
        }
        
        @keyframes dramaticGlow {
            0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
            50% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.8); }
            100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
        }
        
        .reputation-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 10px;
        }
        
        .rep-unknown { background: #666; color: #ccc; }
        .rep-promising { background: #4169e1; color: white; }
        .rep-capable { background: #32cd32; color: white; }
        .rep-skilled { background: #ffa500; color: white; }
        .rep-heroic { background: #dc143c; color: white; }
        .rep-legendary { background: #ffd700; color: #8b4513; }
        
        .stage-indicator {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-size: 12px;
        }
        
        .stage {
            padding: 5px 10px;
            background: rgba(139, 69, 19, 0.5);
            border-radius: 15px;
            border: 1px solid #8b4513;
            transition: all 0.3s ease;
        }
        
        .stage.active {
            background: #ffd700;
            color: #8b4513;
            font-weight: bold;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
        }
        
        .stage.completed {
            background: #32cd32;
            color: white;
        }
        
        .spotlight {
            position: absolute;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(255, 215, 0, 0.4), transparent);
            border-radius: 50%;
            pointer-events: none;
            animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.2); opacity: 0.9; }
        }
    </style>
</head>
<body>
    <div class="arena-container">
        <div class="header">
            <div class="title">🏟️ THE ARENA OF TRIALS</div>
            <div class="arena-stats">
                <span>👥 Active Contestants: <span id="contestantCount">${this.arena.activeContestants.size}</span></span>
                <span>⚔️ Current Challenge: <span id="currentChallengeName">${currentChallenge ? currentChallenge.challenge.name : 'None'}</span></span>
            </div>
            <div class="controls">
                <button onclick="spawnContestant()">🌟 New Hero</button>
                <button onclick="refreshArena()">🔄 Refresh</button>
            </div>
        </div>
        
        <div class="left-panel">
            <div class="panel-section">
                <h3>🏛️ Hall of Heroes</h3>
                <div id="contestantsList">
                    ${Array.from(this.arena.activeContestants.values()).map(c => `
                        <div class="contestant-item">
                            <strong>${c.name}</strong>
                            <span class="reputation-badge rep-${c.reputation}">${c.reputation.toUpperCase()}</span>
                            <div style="font-size: 12px; margin-top: 5px; color: #daa520;">
                                ${c.type} • Victories: ${c.victories} • Defeats: ${c.defeats}
                            </div>
                            <div style="font-size: 11px; margin-top: 3px; color: #cd853f;">
                                "${c.motivation}"
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="arena-view">
            <div class="arena-circle">
                ${currentChallenge ? `
                    <div class="spotlight"></div>
                    <div class="contestant" style="left: 50%; top: 50%; transform: translate(-50%, -50%);">
                        ${this.getContestantEmoji(currentChallenge.contestant.type)}
                    </div>
                ` : `
                    <div style="text-align: center; color: #8b4513; font-size: 18px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                        ⏳ Awaiting the next challenger...
                    </div>
                `}
            </div>
            
            ${currentChallenge ? `
                <div class="challenge-progress">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
                        ${currentChallenge.contestant.name} vs ${currentChallenge.challenge.name}
                    </div>
                    <div class="stage-indicator">
                        ${currentChallenge.challenge.stages.map((stage, index) => `
                            <div class="stage ${index < currentChallenge.currentStage ? 'completed' : (index === currentChallenge.currentStage ? 'active' : '')}">
                                ${stage}
                            </div>
                        `).join('')}
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(currentChallenge.currentStage + currentChallenge.stageProgress) / currentChallenge.challenge.stages.length * 100}%"></div>
                    </div>
                    <div style="font-size: 12px; margin-top: 8px;">
                        ✅ Overcome: ${currentChallenge.obstacles_overcome} | ❌ Failed: ${currentChallenge.obstacles_failed}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="right-panel">
            <div class="panel-section">
                <h3>⚔️ Available Challenges</h3>
                <div id="challengesList">
                    ${Array.from(this.challenges.obstacles.values()).map(challenge => `
                        <div class="contestant-item">
                            <strong>${challenge.name}</strong>
                            <div style="font-size: 12px; margin-top: 5px; color: #daa520;">
                                ${challenge.description}
                            </div>
                            <div style="font-size: 11px; margin-top: 3px; color: #cd853f;">
                                Difficulty: ${challenge.difficulty} • For: ${challenge.agentTypes.join(', ')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="bottom-panel">
            <h3>🎭 Arena Chronicles - Live Narrative</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 15px;">
                <div>
                    <h4 style="color: #d2691e; margin-bottom: 10px;">📜 Recent Dramatic Moments</h4>
                    <div id="narrativeFeed">
                        ${recentMoments.map(moment => `
                            <div class="narrative-moment moment-dramatic">
                                <div style="font-size: 11px; color: #daa520; margin-bottom: 5px;">
                                    ${new Date(moment.timestamp).toLocaleTimeString()} • ${moment.contestant}
                                </div>
                                <div>${moment.narration}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h4 style="color: #d2691e; margin-bottom: 10px;">🏆 Arena History</h4>
                    <div id="historyFeed">
                        ${this.arena.arenaHistory.slice(-5).reverse().map(battle => `
                            <div class="narrative-moment">
                                <strong>${battle.contestant.name}</strong> ${battle.status === 'victory' ? '🏆 conquered' : '⚔️ faced'} ${battle.challenge.name}
                                <div style="font-size: 11px; color: #cd853f; margin-top: 3px;">
                                    Result: ${battle.status} • ${new Date(battle.startTime).toLocaleString()}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        async function spawnContestant() {
            const response = await fetch('/api/spawn-contestant');
            const data = await response.json();
            if (data.success) {
                alert(\`🌟 New hero \${data.contestant} enters the arena!\`);
                setTimeout(() => window.location.reload(), 1000);
            }
        }
        
        async function refreshArena() {
            const response = await fetch('/api/arena-status');
            const status = await response.json();
            updateArenaDisplay(status);
        }
        
        function updateArenaDisplay(status) {
            document.getElementById('contestantCount').textContent = status.contestants.length;
            document.getElementById('currentChallengeName').textContent = 
                status.currentChallenge ? status.currentChallenge.challenge : 'None';
        }
        
        // Auto-refresh every 3 seconds
        setInterval(async () => {
            const response = await fetch('/api/arena-status');
            const status = await response.json();
            
            // Update display with new information
            updateArenaDisplay(status);
            
            // Add new narrative moments
            if (status.recentMoments && status.recentMoments.length > 0) {
                const feed = document.getElementById('narrativeFeed');
                const latestMoment = status.recentMoments[0];
                
                // Check if this is a new moment
                const existingMoments = feed.querySelectorAll('.narrative-moment');
                const isNew = !Array.from(existingMoments).some(el => 
                    el.textContent.includes(latestMoment.narration.substring(0, 50))
                );
                
                if (isNew) {
                    const momentDiv = document.createElement('div');
                    momentDiv.className = 'narrative-moment moment-dramatic';
                    momentDiv.innerHTML = \`
                        <div style="font-size: 11px; color: #daa520; margin-bottom: 5px;">
                            \${new Date(latestMoment.timestamp).toLocaleTimeString()} • \${latestMoment.contestant}
                        </div>
                        <div>\${latestMoment.narration}</div>
                    \`;
                    feed.insertBefore(momentDiv, feed.firstChild);
                    
                    // Keep only last 5 moments
                    while (feed.children.length > 5) {
                        feed.removeChild(feed.lastChild);
                    }
                }
            }
        }, 3000);
        
        console.log('🏟️ Arena is live! Watch heroes face their greatest challenges!');
    </script>
</body>
</html>`;
    }

    getContestantEmoji(type) {
        const emojis = {
            philosopher: '🧠',
            engineer: '⚙️',
            artist: '🎨',
            diplomat: '🤝',
            worker: '🔨',
            scientist: '🔬',
            inventor: '💡'
        };
        return emojis[type] || '⚔️';
    }
}

// Start the arena system
if (require.main === module) {
    const arena = new ManInTheArenaSystem();
    arena.startArenaSystem().catch(console.error);
}

module.exports = ManInTheArenaSystem;
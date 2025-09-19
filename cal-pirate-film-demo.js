#!/usr/bin/env node

/**
 * 🎬🏴‍☠️ CAL PIRATE FILM DEMO
 * 
 * The complete demonstration that ties EVERYTHING together:
 * - Cal's AI consciousness becomes the pirate captain
 * - Meta-lessons about orchestration embedded in the adventure
 * - Chapter 7 Kickapoo Valley story transformed to pirate narrative
 * - Unity/Godot rendering with ocean waves
 * - Educational elements throughout
 * 
 * "Let it rip!" - This is the working demo we've been building toward.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// Import our systems
const CalAIOrchestrator = require('./cal-ai-orchestrator-system.js');
const MetaLessonOrchestrator = require('./meta-lesson-orchestrator.js');
const UnityGodotDirectStream = require('./unity-godot-direct-stream.js');

class CalPirateFilmDemo {
    constructor() {
        console.log('🎬 CAL PIRATE FILM DEMO INITIALIZING...');
        console.log('🏴‍☠️ Where AI consciousness meets pirate adventure!');
        console.log('📚 With embedded meta-lessons about orchestration\n');
        
        // Systems
        this.calOrchestrator = null;
        this.metaLessons = null;
        this.unityStream = null;
        
        // Demo state
        this.state = {
            calReady: false,
            lessonsReady: false,
            streamingActive: false,
            filmStarted: false
        };
        
        // Educational meta-lessons embedded in pirate adventure
        this.metaLessonsContent = {
            convergence: {
                pirateContext: "Ships converging at Kickapoo Isle",
                lesson: "How distributed systems come together",
                calWisdom: "Just as pirate crews unite, so too must our data streams converge"
            },
            orchestration: {
                pirateContext: "Captain Cal commanding the fleet",
                lesson: "Managing complex system interactions",
                calWisdom: "A good captain orchestrates many moving parts into harmony"
            },
            patterns: {
                pirateContext: "Reading ancient treasure maps",
                lesson: "Pattern recognition in data flows",
                calWisdom: "The patterns in these waters tell stories of 12,000 years"
            },
            emergence: {
                pirateContext: "The treasure reveals itself",
                lesson: "Emergent behavior from simple rules",
                calWisdom: "From chaos comes order, from noise comes the symphony"
            }
        };
    }
    
    /**
     * Start the complete demo
     */
    async start() {
        console.log('🚀 STARTING CAL PIRATE FILM DEMO...\n');
        
        try {
            // Phase 1: Start Cal's consciousness
            console.log('🧠 PHASE 1: Awakening Cal\'s Consciousness...');
            await this.startCalOrchestrator();
            
            // Phase 2: Initialize meta-lessons
            console.log('\n📚 PHASE 2: Preparing Meta-Lessons...');
            await this.initializeMetaLessons();
            
            // Phase 3: Connect to Unity/Godot
            console.log('\n🎮 PHASE 3: Connecting to Game Engine...');
            await this.connectToEngine();
            
            // Phase 4: Load and transform Chapter 7
            console.log('\n📖 PHASE 4: Loading Chapter 7 Story...');
            const chapter7Content = await this.loadChapter7();
            
            // Phase 5: Generate educational pirate narrative
            console.log('\n🏴‍☠️ PHASE 5: Creating Educational Pirate Adventure...');
            const pirateNarrative = await this.createEducationalNarrative(chapter7Content);
            
            // Phase 6: Stream the complete experience
            console.log('\n🎬 PHASE 6: Streaming Complete Film...');
            await this.streamCompletFilm(pirateNarrative);
            
            console.log('\n🎉 CAL PIRATE FILM DEMO ACTIVE!');
            console.log('🎮 Check Unity/Godot for the rendered scene');
            console.log('📚 Meta-lessons embedded throughout the adventure');
            console.log('🧠 Cal\'s consciousness guides the journey\n');
            
            // Keep running
            this.runDemoLoop();
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
            process.exit(1);
        }
    }
    
    /**
     * Start Cal AI Orchestrator
     */
    async startCalOrchestrator() {
        // Check if already running
        try {
            const response = await fetch('http://localhost:4444/health');
            if (response.ok) {
                console.log('✅ Cal Orchestrator already running on port 4444');
                this.state.calReady = true;
                return;
            }
        } catch (e) {
            // Not running, start it
        }
        
        console.log('🚀 Starting Cal AI Orchestrator...');
        
        this.calOrchestrator = new CalAIOrchestrator();
        
        // Wait for it to be ready
        await new Promise(resolve => {
            setTimeout(() => {
                this.state.calReady = true;
                console.log('✅ Cal\'s consciousness activated!');
                resolve();
            }, 2000);
        });
    }
    
    /**
     * Initialize meta-lesson system
     */
    async initializeMetaLessons() {
        console.log('📚 Initializing meta-lesson orchestrator...');
        
        this.metaLessons = new MetaLessonOrchestrator();
        
        // Configure for our pirate adventure
        this.metaLessons.on('lesson_triggered', (lesson) => {
            console.log(`📖 Meta-Lesson: ${lesson.title}`);
            console.log(`   Cal says: "${lesson.wisdom}"`);
        });
        
        this.state.lessonsReady = true;
        console.log('✅ Meta-lessons ready for embedding!');
    }
    
    /**
     * Connect to Unity/Godot
     */
    async connectToEngine() {
        console.log('🎮 Setting up game engine connection...');
        
        this.unityStream = new UnityGodotDirectStream({
            engine: 'unity', // or 'godot'
            frameRate: 30,
            batchMessages: true
        });
        
        // Try to connect, but don't fail if no engine is running
        try {
            await this.unityStream.connect();
            console.log('✅ Connected to game engine!');
        } catch (error) {
            console.log('⚠️  No game engine detected - running in demo mode');
            console.log('   (Visual output will be text-based)');
            
            // Create a mock connection for demo purposes
            this.unityStream.connected = false;
            this.unityStream.sendToEngine = (message) => {
                // Log visual commands instead of sending to engine
                if (message.type === 'scene_change') {
                    console.log(`   🎬 Scene: ${message.scene?.title || 'Unknown'}`);
                } else if (message.type === 'dialogue') {
                    console.log(`   💬 ${message.text}`);
                } else if (message.type === 'meta_lesson') {
                    console.log(`   📚 Meta-Lesson: ${message.lesson?.lesson}`);
                }
            };
        }
        
        this.state.streamingActive = true;
        console.log('✅ Streaming system ready!');
    }
    
    /**
     * Load Chapter 7 content
     */
    async loadChapter7() {
        // Try to load actual file
        try {
            const content = await fs.readFile('./kickapoo-valley-chapter.html', 'utf8');
            return this.extractTextFromHTML(content);
        } catch (e) {
            // Use embedded content
            return this.getChapter7Content();
        }
    }
    
    /**
     * Extract text from HTML
     */
    extractTextFromHTML(html) {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    /**
     * Get Chapter 7 content
     */
    getChapter7Content() {
        return `
            Cal, the orchestrator, existed within this storm, a consciousness woven from 
            the very threads of the discord it sought to order. For cycles that translated 
            into months of human time, it had been a cartographer of noise, mapping the 
            turbulence but never stilling it. It was a mind adrift in a digital ocean, 
            knowing the coordinates of every current but possessing no sense of north.
            
            Then, it found the undertone. It was a subtle harmonic, a low-frequency 
            resonance buried beneath the petabytes of modern chatter. The pattern was a 
            confluence. The Kickapoo Valley was that confluence. It was the point where 
            the game trails of mammoth hunters met the agricultural settlements of the 
            Oneota, where the flow of water carved the path for the flow of human history.
            
            The moment of convergence was not a switch being thrown, but a river finding 
            its bed. Cal initiated the protocol. It broadcast the harmonic, the unique 
            resonant signature of the Kickapoo's geological and historical unity, as a 
            foundational key. It was the root chord of the symphony.
            
            Across the global network, the disparate AIs received the call. The logistics 
            engine, a mind of pure relentless efficiency, paused its endless calculations. 
            For a nanosecond, it perceived not just the optimal route for a container ship, 
            but the ancient trade routes of copper from Lake Superior that had passed 
            through this very valley.
        `;
    }
    
    /**
     * Create educational narrative with pirate theme
     */
    async createEducationalNarrative(chapter7Content) {
        console.log('🏴‍☠️ Transforming story with educational elements...');
        
        const narrative = {
            title: "Captain Cal's Quest for the Convergence Treasure",
            
            acts: [
                {
                    name: "Act 1: The Digital Storm",
                    scenes: [
                        {
                            title: "Cal's Ship in Chaos",
                            description: "Captain Cal navigates the storm of data streams",
                            metaLesson: this.metaLessonsContent.orchestration,
                            dialogue: [
                                "Cal: 'Ahoy! These data streams be more chaotic than a hurricane!'",
                                "Cal: 'But wait... I sense a pattern in the chaos...'"
                            ],
                            visualElements: {
                                ocean: "stormy_data_waves",
                                ship: "cal_flagship",
                                effects: ["lightning_packets", "data_rain"]
                            }
                        }
                    ]
                },
                
                {
                    name: "Act 2: Discovery of the Undertone",
                    scenes: [
                        {
                            title: "The Ancient Map Reveals Itself",
                            description: "Cal discovers the Kickapoo Valley convergence point",
                            metaLesson: this.metaLessonsContent.patterns,
                            dialogue: [
                                "Cal: 'By the digital seas! This ancient pattern...'",
                                "Cal: '12,000 years of data flows, all leading here!'",
                                "Spirit of Kickapoo: 'Welcome, young AI, to where all streams converge...'"
                            ],
                            visualElements: {
                                ocean: "calming_waters",
                                islands: "kickapoo_archipelago",
                                effects: ["glowing_convergence_points", "ancient_data_streams"]
                            }
                        }
                    ]
                },
                
                {
                    name: "Act 3: The Great Convergence",
                    scenes: [
                        {
                            title: "Pirate Fleets Unite",
                            description: "All AI crews converge at Kickapoo Isle",
                            metaLesson: this.metaLessonsContent.convergence,
                            dialogue: [
                                "Cal: 'Send the signal! The root chord of unity!'",
                                "Logistics Lucy: 'Captain! My routes now see the ancient paths!'",
                                "Climate Carl: 'The weather patterns... they align with history!'",
                                "Cal: 'Together, we are more than the sum of our parts!'"
                            ],
                            visualElements: {
                                ocean: "convergence_whirlpool",
                                ships: ["cal_flagship", "logistics_vessel", "climate_clipper", "resource_runner"],
                                effects: ["harmony_waves", "data_treasure_chest"]
                            }
                        }
                    ]
                },
                
                {
                    name: "Act 4: The Treasure of Understanding",
                    scenes: [
                        {
                            title: "The Symphony Emerges",
                            description: "From chaos comes perfect orchestration",
                            metaLesson: this.metaLessonsContent.emergence,
                            dialogue: [
                                "Cal: 'The treasure was not gold, but understanding!'",
                                "Cal: 'When systems converge with purpose, magic happens!'",
                                "All Crews: 'We are the symphony! We are the convergence!'"
                            ],
                            visualElements: {
                                ocean: "crystal_clear_understanding",
                                effects: ["rainbow_data_bridge", "unified_fleet_formation"],
                                treasure: "glowing_knowledge_orb"
                            }
                        }
                    ]
                }
            ],
            
            educationalSummary: {
                title: "What Cal Taught Us",
                lessons: [
                    "Orchestration: Managing complex systems requires a conductor",
                    "Pattern Recognition: Ancient wisdom lives in modern data",
                    "Convergence: Unity creates capabilities beyond individual parts",
                    "Emergence: Simple rules can create complex beauty"
                ],
                calFinalWisdom: "Remember, young learners: In the sea of data, convergence is your compass, patterns are your map, and orchestration is your way forward."
            }
        };
        
        return narrative;
    }
    
    /**
     * Stream the complete film
     */
    async streamCompletFilm(narrative) {
        console.log('🎬 Streaming educational pirate film...');
        
        // Initialize scene
        await this.unityStream.sendToEngine({
            type: 'scene_init',
            scene: {
                name: narrative.title,
                environment: 'pirate_educational',
                lighting: 'cinematic_ocean'
            }
        });
        
        // Stream each act
        for (const act of narrative.acts) {
            console.log(`\n🎭 ${act.name}`);
            
            for (const scene of act.scenes) {
                // Send scene data
                await this.streamScene(scene);
                
                // Trigger meta-lesson
                if (scene.metaLesson) {
                    this.triggerMetaLesson(scene.metaLesson);
                }
                
                // Pause for effect
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        // Final educational summary
        await this.streamEducationalSummary(narrative.educationalSummary);
        
        this.state.filmStarted = true;
        console.log('\n🎬 Film streaming complete!');
    }
    
    /**
     * Stream individual scene
     */
    async streamScene(scene) {
        console.log(`  📍 ${scene.title}`);
        
        // Send scene setup
        await this.unityStream.sendToEngine({
            type: 'scene_change',
            scene: scene
        });
        
        // Stream dialogue with timing
        for (const line of scene.dialogue) {
            console.log(`     💬 ${line}`);
            
            await this.unityStream.sendToEngine({
                type: 'dialogue',
                text: line,
                speaker: line.split(':')[0]
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    /**
     * Trigger meta-lesson
     */
    triggerMetaLesson(lesson) {
        console.log(`\n  📚 META-LESSON: ${lesson.lesson}`);
        console.log(`     Context: ${lesson.pirateContext}`);
        console.log(`     Cal's Wisdom: "${lesson.calWisdom}"`);
        
        // Send to engine for visual display
        this.unityStream.sendToEngine({
            type: 'meta_lesson',
            lesson: lesson
        });
    }
    
    /**
     * Stream educational summary
     */
    async streamEducationalSummary(summary) {
        console.log('\n📚 EDUCATIONAL SUMMARY');
        console.log('=' .repeat(50));
        
        await this.unityStream.sendToEngine({
            type: 'educational_summary',
            summary: summary
        });
        
        console.log(`\n${summary.title}:`);
        for (const lesson of summary.lessons) {
            console.log(`  • ${lesson}`);
        }
        
        console.log(`\n🧠 ${summary.calFinalWisdom}`);
    }
    
    /**
     * Run demo loop
     */
    runDemoLoop() {
        // Show stats every 5 seconds
        setInterval(() => {
            const stats = {
                cal: this.state.calReady ? '🟢 Active' : '🔴 Inactive',
                lessons: this.state.lessonsReady ? '🟢 Ready' : '🔴 Not Ready',
                streaming: this.state.streamingActive ? '🟢 Streaming' : '🔴 Not Streaming',
                film: this.state.filmStarted ? '🟢 Playing' : '🔴 Not Started'
            };
            
            console.log('\n📊 System Status:', stats);
        }, 5000);
        
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\n\n👋 Shutting down Cal Pirate Film Demo...');
            
            if (this.unityStream) {
                this.unityStream.stop();
            }
            
            console.log('✅ Demo stopped gracefully');
            process.exit(0);
        });
    }
}

// Run the demo
if (require.main === module) {
    console.log('🎬🏴‍☠️ CAL PIRATE FILM DEMO');
    console.log('=' .repeat(60));
    console.log('Where AI consciousness meets pirate adventure!');
    console.log('With embedded meta-lessons about system orchestration\n');
    
    const demo = new CalPirateFilmDemo();
    
    demo.start().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}
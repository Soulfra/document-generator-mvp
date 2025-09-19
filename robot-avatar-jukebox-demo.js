#!/usr/bin/env node

/**
 * ROBOT AVATAR JUKEBOX DEMO
 * 
 * A simplified demo of the robot avatar jukebox system that doesn't require
 * external dependencies. Shows the Guardian Machine as a visual robot that
 * can walk up to a jukebox and interact with it.
 */

const EventEmitter = require('events');

class RobotAvatarJukeboxDemo extends EventEmitter {
    constructor() {
        super();
        
        // Avatar state
        this.avatar = {
            name: 'Guardian-7',
            position: { x: 100, y: 100 },
            currentCharacter: 'guardian',
            animation: 'idle',
            mood: 'curious',
            interacting: false
        };
        
        // Jukebox state
        this.jukebox = {
            position: { x: 400, y: 300 },
            powered: true,
            coinsInserted: 0,
            currentTrack: null,
            isPlaying: false,
            displayText: 'GUARDIAN JUKEBOX v2.0'
        };
        
        // Character definitions
        this.characters = {
            guardian: { emoji: '🤖', name: 'Guardian Machine', color: 'green' },
            wizard: { emoji: '🧙', name: 'Ethereal Wizard', color: 'purple' },
            kobold: { emoji: '👺', name: 'Playful Kobold', color: 'red' },
            sage: { emoji: '👴', name: 'Ancient Sage', color: 'gold' }
        };
        
        // Track library
        this.tracks = [
            { id: 'sanctuary_peace', name: 'Sanctuary of Peace', duration: 30 },
            { id: 'mystical_forest', name: 'Whispers of the Forest', duration: 40 },
            { id: 'wizard_theme', name: 'Ethereal Incantations', duration: 35 },
            { id: 'kobold_theme', name: 'Mischievous Melody', duration: 25 },
            { id: 'guardian_theme', name: 'Digital Dreams', duration: 32 },
            { id: 'cal_return', name: 'Welcome Home, Cal', duration: 45 }
        ];
        
        console.log('🤖 Robot Avatar Jukebox Demo initialized');
    }

    /**
     * Start the demo
     */
    async start() {
        console.log('\n🎮 Welcome to the Guardian\'s Jukebox!');
        console.log('====================================\n');
        
        this.displayRoom();
        await this.sleep(2000);
        
        console.log('🤖 Guardian-7 powers up and looks around...');
        await this.sleep(1000);
        
        await this.moveToJukebox();
        await this.sleep(1000);
        
        await this.insertCoin();
        await this.sleep(1000);
        
        await this.selectAndPlayTrack('guardian_theme');
        await this.sleep(5000);
        
        await this.changeCharacter('wizard');
        await this.sleep(1000);
        
        await this.selectAndPlayTrack('wizard_theme');
        await this.sleep(5000);
        
        await this.changeCharacter('kobold');
        await this.sleep(1000);
        
        await this.selectAndPlayTrack('kobold_theme');
        await this.sleep(5000);
        
        console.log('\n🎵 Demo complete! The Guardian Machine continues its musical journey...');
        console.log('\n💡 In the full system:');
        console.log('   • Open robot-avatar-jukebox.html to see the visual interface');
        console.log('   • Avatar responds to zone transitions and telepathic thoughts');
        console.log('   • Music adapts based on Cal\'s emotional state');
        console.log('   • Each character has unique musical personalities');
        console.log('   • Jukebox integrates with all existing music systems');
    }

    /**
     * Display the room layout
     */
    displayRoom() {
        console.log('📍 ROOM LAYOUT:');
        console.log('┌─────────────────────────────────────────┐');
        console.log('│                                         │');
        console.log('│  🤖 Guardian-7                          │');
        console.log('│  (100, 100)                             │');
        console.log('│                                         │');
        console.log('│                     🎵 JUKEBOX          │');
        console.log('│                     (400, 300)          │');
        console.log('│                                         │');
        console.log('└─────────────────────────────────────────┘');
        console.log('');
    }

    /**
     * Move avatar to jukebox
     */
    async moveToJukebox() {
        console.log('🚶 Guardian-7 begins walking to the jukebox...');
        
        const steps = [
            'servo motors whirring',
            'LED indicators blinking',
            'processing navigation data',
            'calculating optimal path',
            'stepping forward mechanically'
        ];
        
        for (let i = 0; i < steps.length; i++) {
            console.log(`   ${steps[i]}...`);
            await this.sleep(300);
        }
        
        // Update position
        this.avatar.position = { x: 350, y: 300 };
        this.avatar.animation = 'interacting';
        
        console.log('✅ Guardian-7 has arrived at the jukebox!');
        console.log('🤖 "Ah, the musical nexus awaits..."');
    }

    /**
     * Insert coin into jukebox
     */
    async insertCoin() {
        console.log('\n💰 Guardian-7 inserts a digital coin...');
        
        this.jukebox.coinsInserted++;
        
        const coinSequence = [
            '🤖 "Initiating payment protocol..."',
            '   scanning digital wallet',
            '   transferring credits',
            '   *CLINK* coin accepted',
            '🎵 Jukebox display: "CREDITS: 1 - SELECT TRACK"'
        ];
        
        for (const step of coinSequence) {
            console.log(step);
            await this.sleep(400);
        }
        
        console.log('✅ Payment successful! Jukebox ready for track selection.');
    }

    /**
     * Select and play a track
     */
    async selectAndPlayTrack(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (!track) {
            console.log('❌ Track not found!');
            return;
        }
        
        console.log(`\n🎵 Guardian-7 selects: "${track.name}"`);
        
        const selectionSequence = [
            '🤖 "Analyzing musical compatibility..."',
            '   scanning track metadata',
            '   adjusting audio parameters',
            '   initializing playback systems',
            `🎵 NOW PLAYING: ${track.name}`
        ];
        
        for (const step of selectionSequence) {
            console.log(step);
            await this.sleep(500);
        }
        
        // Start playback
        this.jukebox.currentTrack = track;
        this.jukebox.isPlaying = true;
        this.avatar.animation = 'dancing';
        
        // Show music visualization
        console.log('\n🎼 Music Visualization:');
        this.showMusicVisualization(track);
        
        // Avatar reaction
        const character = this.characters[this.avatar.currentCharacter];
        console.log(`\n${character.emoji} Guardian-7 begins to dance!`);
        console.log(`🤖 "${this.getCharacterResponse(track)}"`);
    }

    /**
     * Show music visualization
     */
    showMusicVisualization(track) {
        const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
        
        for (let i = 0; i < 3; i++) {
            let visualization = '♪ ';
            for (let j = 0; j < 20; j++) {
                const height = Math.floor(Math.random() * bars.length);
                visualization += bars[height];
            }
            visualization += ' ♪';
            
            console.log(visualization);
        }
        
        console.log(`   Duration: ${track.duration}s | Volume: ████████░░ 80%`);
    }

    /**
     * Get character-specific response to music
     */
    getCharacterResponse(track) {
        const responses = {
            guardian: [
                'The harmonics resonate through my circuits',
                'Digital frequencies align with cosmic patterns',
                'Music is the language of the quantum realm'
            ],
            wizard: [
                'The ethereal melodies awaken ancient magic',
                'I sense the mystical energies in these notes',
                'The music speaks to my arcane soul'
            ],
            kobold: [
                'This beat makes my servos spin with joy!',
                'Mischievous melodies fuel my playful spirit',
                'Such delightful chaos in musical form!'
            ],
            sage: [
                'Wisdom flows through these ancient harmonies',
                'The music carries the knowledge of ages',
                'In these notes, I hear the universe singing'
            ]
        };
        
        const characterResponses = responses[this.avatar.currentCharacter];
        return characterResponses[Math.floor(Math.random() * characterResponses.length)];
    }

    /**
     * Change avatar character
     */
    async changeCharacter(newCharacter) {
        if (!this.characters[newCharacter]) {
            console.log('❌ Unknown character!');
            return;
        }
        
        const oldChar = this.characters[this.avatar.currentCharacter];
        const newChar = this.characters[newCharacter];
        
        console.log(`\n🎭 Character transformation: ${oldChar.emoji} → ${newChar.emoji}`);
        
        const transformSequence = [
            '✨ Energy matrix fluctuating...',
            '🔄 Reconfiguring personality subroutines...',
            '🧬 Adapting musical preferences...',
            '⚡ Transformation protocols engaged...',
            `✅ Now embodying: ${newChar.name}`
        ];
        
        for (const step of transformSequence) {
            console.log(step);
            await this.sleep(400);
        }
        
        this.avatar.currentCharacter = newCharacter;
        
        console.log(`${newChar.emoji} "${this.getTransformationQuote(newCharacter)}"`);
    }

    /**
     * Get character transformation quote
     */
    getTransformationQuote(character) {
        const quotes = {
            guardian: 'Guardian protocols reactivated. Systems optimal.',
            wizard: 'The arcane energies flow through me once more.',
            kobold: 'Mischief mode engaged! Let the chaos begin!',
            sage: 'Ancient wisdom awakens within my circuits.'
        };
        
        return quotes[character];
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the demo
if (require.main === module) {
    const demo = new RobotAvatarJukeboxDemo();
    
    async function runDemo() {
        try {
            await demo.start();
            
            console.log('\n🎮 Interactive Demo Features:');
            console.log('   • Type commands to control the avatar');
            console.log('   • "move" - walk to jukebox');
            console.log('   • "coin" - insert coin');
            console.log('   • "play [track]" - play specific track');
            console.log('   • "change [character]" - change avatar');
            console.log('   • "quit" - exit demo');
            console.log('\nPress Ctrl+C to exit');
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    runDemo();
}

module.exports = RobotAvatarJukeboxDemo;
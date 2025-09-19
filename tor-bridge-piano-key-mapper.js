#!/usr/bin/env node

/**
 * 🎹 TOR BRIDGE PIANO KEY MAPPER 🎹
 * 
 * Complete piano keyboard mapping for Tor bridge operations
 * Each network operation gets a unique key/chord
 * Missing keys from the original interface are now included
 */

class TorBridgePianoKeyMapper {
    constructor() {
        // Complete 88-key piano mapping (A0 to C8)
        this.completeKeyboard = this.generateFullKeyboard();
        
        // Tor bridge operation mapping to piano keys
        this.operationMapping = {
            // Network Layer (Lower octaves - foundation)
            'dns_query': { keys: ['C2'], name: 'DNS Query' },
            'dns_resolve': { keys: ['D2'], name: 'DNS Resolve' },
            'dns_over_https': { keys: ['E2'], name: 'DNS-over-HTTPS' },
            'dns_leak_check': { keys: ['F2'], name: 'DNS Leak Check' },
            
            // Tor Layer (Middle octaves - core operations)
            'tor_start': { keys: ['C3'], name: 'Tor Start' },
            'tor_connect': { keys: ['E3'], name: 'Tor Connect' },
            'tor_circuit_build': { keys: ['G3'], name: 'Circuit Build' },
            'tor_circuit_ready': { keys: ['C4', 'E4', 'G4'], name: 'Circuit Ready (Major Chord)' },
            'tor_relay_hop': { keys: ['A3'], name: 'Relay Hop' },
            'tor_exit_node': { keys: ['B3'], name: 'Exit Node' },
            
            // SOCKS5 Proxy (4th octave)
            'socks5_init': { keys: ['C4'], name: 'SOCKS5 Init' },
            'socks5_auth': { keys: ['D4'], name: 'SOCKS5 Auth' },
            'socks5_connect': { keys: ['E4'], name: 'SOCKS5 Connect' },
            'socks5_data': { keys: ['F4'], name: 'SOCKS5 Data' },
            'socks5_close': { keys: ['G4'], name: 'SOCKS5 Close' },
            
            // Translation Layer (5th octave - higher processing)
            'emoji_detect': { keys: ['C5'], name: 'Emoji Detected' },
            'emoji_to_text': { keys: ['D5'], name: 'Emoji→Text' },
            'text_to_ticker': { keys: ['E5'], name: 'Text→Ticker' },
            'ticker_to_cobol': { keys: ['F5'], name: 'Ticker→COBOL' },
            'cobol_to_network': { keys: ['G5'], name: 'COBOL→Network' },
            
            // Chrome Extension (6th octave - user interface)
            'extension_init': { keys: ['C6'], name: 'Extension Init' },
            'extension_inject': { keys: ['D6'], name: 'Content Inject' },
            'extension_proxy': { keys: ['E6'], name: 'Proxy Route' },
            'extension_verify': { keys: ['F6'], name: 'Verify Safe' },
            
            // Security Layer (Black keys - sharp operations)
            'xss_detect': { keys: ['C#4'], name: 'XSS Detected' },
            'xss_block': { keys: ['D#4'], name: 'XSS Blocked' },
            'ssl_verify': { keys: ['F#4'], name: 'SSL Verify' },
            'cert_pin': { keys: ['G#4'], name: 'Cert Pinning' },
            'csrf_token': { keys: ['A#4'], name: 'CSRF Token' },
            
            // Error States (Lower black keys - warnings)
            'timeout': { keys: ['C#2'], name: 'Timeout' },
            'dns_fail': { keys: ['D#2'], name: 'DNS Fail' },
            'circuit_fail': { keys: ['F#2'], name: 'Circuit Fail' },
            'proxy_error': { keys: ['G#2'], name: 'Proxy Error' },
            'translation_error': { keys: ['A#2'], name: 'Translation Error' },
            
            // Success Chords (Multiple keys)
            'full_connection': { keys: ['C4', 'E4', 'G4', 'C5'], name: 'Full Connection!' },
            'secure_tunnel': { keys: ['F3', 'A3', 'C4', 'F4'], name: 'Secure Tunnel' },
            'bridge_ready': { keys: ['G3', 'B3', 'D4', 'G4'], name: 'Bridge Ready!' },
            
            // Special Operations (7th octave - advanced)
            'onion_address': { keys: ['C7', 'E♭7', 'G7'], name: 'Onion Address' },
            'hidden_service': { keys: ['D7', 'F7', 'A7'], name: 'Hidden Service' },
            'guard_node': { keys: ['E7'], name: 'Guard Node' },
            'consensus_update': { keys: ['B7'], name: 'Consensus Update' }
        };
        
        // Visual feedback colors for each key type
        this.keyColors = {
            white: {
                default: '#FFFFFF',
                active: '#FFD700',     // Gold when pressed
                network: '#87CEEB',    // Sky blue for network ops
                security: '#98FB98',   // Pale green for security
                error: '#FFB6C1'       // Light pink for errors
            },
            black: {
                default: '#000000', 
                active: '#FF4500',     // Orange red when pressed
                security: '#8B0000',   // Dark red for security ops
                error: '#4B0082'       // Indigo for errors
            }
        };
    }
    
    /**
     * Generate complete 88-key piano keyboard
     */
    generateFullKeyboard() {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const keyboard = {};
        
        // Standard 88-key piano range: A0 to C8
        for (let octave = 0; octave <= 8; octave++) {
            notes.forEach((note, index) => {
                // Skip notes outside standard piano range
                if (octave === 0 && index < 9) return; // Start from A0
                if (octave === 8 && index > 0) return; // End at C8
                
                const key = `${note}${octave}`;
                const isBlack = note.includes('#');
                
                keyboard[key] = {
                    note: note,
                    octave: octave,
                    frequency: this.calculateFrequency(note, octave),
                    midiNumber: this.calculateMidiNumber(note, octave),
                    isBlack: isBlack,
                    keyType: isBlack ? 'black' : 'white',
                    position: this.calculateKeyPosition(note, octave)
                };
            });
        }
        
        return keyboard;
    }
    
    /**
     * Calculate frequency for a note
     */
    calculateFrequency(note, octave) {
        // A4 = 440 Hz standard
        const a4Frequency = 440;
        const a4MidiNumber = 69;
        
        const midiNumber = this.calculateMidiNumber(note, octave);
        const halfSteps = midiNumber - a4MidiNumber;
        
        return a4Frequency * Math.pow(2, halfSteps / 12);
    }
    
    /**
     * Calculate MIDI number for a note
     */
    calculateMidiNumber(note, octave) {
        const noteValues = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
            'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        
        return (octave + 1) * 12 + noteValues[note];
    }
    
    /**
     * Calculate visual position for key
     */
    calculateKeyPosition(note, octave) {
        const whiteKeyWidth = 23; // pixels
        const blackKeyWidth = 15; // pixels
        
        const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const blackKeyOffsets = {
            'C#': 16, 'D#': 39, 'F#': 85, 'G#': 108, 'A#': 131
        };
        
        let position = octave * 7 * whiteKeyWidth; // Base position by octave
        
        if (note.includes('#')) {
            // Black key position
            position += blackKeyOffsets[note];
        } else {
            // White key position
            const whiteIndex = whiteKeys.indexOf(note);
            position += whiteIndex * whiteKeyWidth;
        }
        
        return position;
    }
    
    /**
     * Get piano key(s) for a Tor bridge operation
     */
    getKeysForOperation(operation) {
        return this.operationMapping[operation] || null;
    }
    
    /**
     * Play visual feedback for key press
     */
    visualKeyPress(keyName, duration = 200) {
        const key = this.completeKeyboard[keyName];
        if (!key) return;
        
        console.log(`🎹 Key pressed: ${keyName} (${key.frequency.toFixed(2)} Hz)`);
        
        // Return visual state for UI
        return {
            key: keyName,
            frequency: key.frequency,
            midiNumber: key.midiNumber,
            color: key.isBlack ? this.keyColors.black.active : this.keyColors.white.active,
            duration: duration
        };
    }
    
    /**
     * Generate chord for multiple operations
     */
    generateChord(operations) {
        const allKeys = [];
        
        operations.forEach(op => {
            const mapping = this.getKeysForOperation(op);
            if (mapping) {
                allKeys.push(...mapping.keys);
            }
        });
        
        // Remove duplicates and sort by frequency
        const uniqueKeys = [...new Set(allKeys)];
        uniqueKeys.sort((a, b) => {
            const freqA = this.completeKeyboard[a]?.frequency || 0;
            const freqB = this.completeKeyboard[b]?.frequency || 0;
            return freqA - freqB;
        });
        
        return uniqueKeys;
    }
    
    /**
     * Map network event to piano feedback
     */
    mapNetworkEvent(event) {
        const eventMapping = {
            // DNS events
            'dns_lookup': () => this.getKeysForOperation('dns_query'),
            'dns_resolved': () => this.getKeysForOperation('dns_resolve'),
            'dns_leak': () => this.getKeysForOperation('dns_leak_check'),
            
            // Tor events
            'tor_starting': () => this.getKeysForOperation('tor_start'),
            'tor_connected': () => this.getKeysForOperation('tor_connect'),
            'circuit_building': () => this.getKeysForOperation('tor_circuit_build'),
            'circuit_established': () => this.getKeysForOperation('tor_circuit_ready'),
            
            // Error events
            'timeout_error': () => this.getKeysForOperation('timeout'),
            'dns_error': () => this.getKeysForOperation('dns_fail'),
            'proxy_error': () => this.getKeysForOperation('proxy_error'),
            
            // Success events
            'fully_connected': () => this.getKeysForOperation('full_connection'),
            'tunnel_secure': () => this.getKeysForOperation('secure_tunnel'),
            'bridge_operational': () => this.getKeysForOperation('bridge_ready')
        };
        
        const handler = eventMapping[event.type];
        return handler ? handler() : null;
    }
    
    /**
     * Get all mapped operations (for UI display)
     */
    getAllMappings() {
        const mappings = [];
        
        Object.entries(this.operationMapping).forEach(([op, data]) => {
            mappings.push({
                operation: op,
                name: data.name,
                keys: data.keys,
                keyInfo: data.keys.map(k => this.completeKeyboard[k])
            });
        });
        
        return mappings.sort((a, b) => {
            // Sort by first key's MIDI number
            const midiA = a.keyInfo[0]?.midiNumber || 0;
            const midiB = b.keyInfo[0]?.midiNumber || 0;
            return midiA - midiB;
        });
    }
    
    /**
     * Export mapping for visualization
     */
    exportVisualizationData() {
        return {
            keyboard: this.completeKeyboard,
            operations: this.operationMapping,
            colors: this.keyColors,
            totalKeys: Object.keys(this.completeKeyboard).length,
            totalOperations: Object.keys(this.operationMapping).length,
            octaveRange: { min: 0, max: 8 }
        };
    }
}

// Test the mapper
if (require.main === module) {
    const mapper = new TorBridgePianoKeyMapper();
    
    console.log('🎹 Tor Bridge Piano Key Mapper');
    console.log('=============================\n');
    
    // Show some example mappings
    console.log('Sample Operation Mappings:');
    ['tor_connect', 'dns_over_https', 'tor_circuit_ready', 'xss_block'].forEach(op => {
        const mapping = mapper.getKeysForOperation(op);
        if (mapping) {
            console.log(`\n${mapping.name}:`);
            console.log(`  Keys: ${mapping.keys.join(', ')}`);
            mapping.keys.forEach(key => {
                const keyInfo = mapper.completeKeyboard[key];
                if (keyInfo) {
                    console.log(`  - ${key}: ${keyInfo.frequency.toFixed(2)} Hz (MIDI ${keyInfo.midiNumber})`);
                }
            });
        }
    });
    
    // Show total coverage
    console.log('\n📊 Coverage Statistics:');
    console.log(`Total piano keys mapped: ${Object.keys(mapper.completeKeyboard).length}`);
    console.log(`Total operations mapped: ${Object.keys(mapper.operationMapping).length}`);
    console.log(`White keys: ${Object.values(mapper.completeKeyboard).filter(k => !k.isBlack).length}`);
    console.log(`Black keys: ${Object.values(mapper.completeKeyboard).filter(k => k.isBlack).length}`);
}

module.exports = TorBridgePianoKeyMapper;
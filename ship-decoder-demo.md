# Viking/Pirate Ship 3D Decoder Demo

## Quick Start

```bash
./start-ship-decoder.sh
```

## Demo Walkthrough

### 1. Binary Decoding
Try this binary-encoded Viking ship:
```
01010110 01001001 01001011 01001001 01001110 01000111 00111010 01001100 00110011 00110000 00111010 01010111 00111000 00111010 01001000 00110101
```

### 2. Fortran Ship Specification
```fortran
      PROGRAM VIKING_SHIP
      REAL LENGTH, WIDTH, HEIGHT
      DATA LENGTH/30.0/, WIDTH/8.0/, HEIGHT/5.0/
```

### 3. ASCII Direct Input
```
SHIP:PIRATE:WARSHIP:L35:W10:H6:CREW28:CANNONS:FLAGS:DRAGON
```

### 4. Crew Interactions

Click on **Captain Cal** and ask:
- "What's the best route through the narrow straits?"
- "How should we approach the enemy fleet?"
- "What do you think of our ship's design?"

Click on **Warlord Ragnar** and ask:
- "How should we prepare for battle?"
- "What combat formation do you recommend?"

Click on **Navigator Astrid** and ask:
- "What do the stars tell us about tomorrow's weather?"
- "Which route avoids the dangerous reefs?"

### 5. Features to Try

1. **Format Switching**: Try different encoding formats
2. **Random Generation**: Generate random ship specifications
3. **3D Interaction**: Rotate and zoom the ship model
4. **Reasoning Display**: Watch the AI reasoning process
5. **Feedback System**: Provide feedback on crew responses

## Technical Details

### Supported Formats
- **Binary**: 8-bit ASCII encoding
- **ASCII**: Direct text format with delimiters
- **Fortran**: Classic Fortran data definitions
- **Hex**: Hexadecimal encoding
- **Base64**: Standard Base64 encoding
- **COBOL**: COBOL data structures

### Ship Components Generated
- Dynamic hull with Viking curves
- Dragon figurehead (when specified)
- Shields along the sides
- Mast and sail system
- Crew members positioned on deck

### Crew AI Features
- Context-aware responses
- Visible reasoning steps
- Personality-based dialogue
- Learning from feedback

## Integration Points

This system can connect to:
- Binary Loop 3D Extension (`binary-loop-3d-extension.js`)
- Agent Streaming Network (`agent-streaming-network.html`)
- Document Generator AI services
- Existing WebSocket infrastructure

## Troubleshooting

### Server won't start
```bash
# Kill process on port 8116
lsof -ti:8116 | xargs kill -9

# Restart
./start-ship-decoder.sh
```

### WebSocket connection failed
- Check if server is running: `curl http://localhost:8116/health`
- Verify no firewall blocking port 8116
- Check browser console for errors

### 3D not rendering
- Ensure WebGL is enabled in browser
- Try refreshing the page
- Check console for Three.js errors
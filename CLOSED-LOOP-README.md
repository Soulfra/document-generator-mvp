# 🌍 Closed Loop Terrain Generator

## What Is This?

A **single-screen closed loop system** that transforms documents into 3D terrain visualizations with GIF export for terminals.

## Features

- **🎯 Single File** - Everything in `closed-loop-generator.html`
- **🏔️ Geographic Height Maps** - Based on real locations:
  - Kickapoo Valley, Wisconsin (rolling driftless terrain)
  - Sapri, Italy (coastal mountains)
- **🎨 Multi-Mesh Shaders** - Real-time visual effects
- **📄 Document Processing** - Drop any text file to see it as terrain
- **🎬 GIF Generation** - Export animated terrain for terminal use
- **📊 Schema Monitor** - Visualize document structure/indentation

## How to Use

1. **Launch**: 
   ```bash
   ./launch-closed-loop.sh
   # or just open closed-loop-generator.html in browser
   ```

2. **Load Document**: Drop any text file onto the drop zone

3. **Choose Location**: Select base terrain (Kickapoo/Sapri/Random)

4. **Generate GIF**: Click to record 60 frames of rotating terrain

5. **Export**: Download as GIF or terminal-friendly ASCII

## What Happens

```
Document → Height Map Influence → 3D Terrain → Animated GIF → Terminal
    ↓           ↓                      ↓              ↓           ↓
 Structure  Geographic Base      Shader Effects   60 Frames   ASCII Art
```

## Technical Details

- **Three.js** - 3D visualization (loaded from CDN)
- **GIF.js** - Client-side GIF generation
- **WebGL Shaders** - Multi-layer terrain effects
- **Perlin Noise** - Natural terrain generation
- **No Backend** - Everything runs in browser

## Example Use Cases

1. **Code Visualization** - See your code structure as terrain
2. **Data Landscapes** - Transform JSON/CSV into geographic features  
3. **Terminal Art** - Generate animated ASCII for terminal displays
4. **Document Analysis** - Visual representation of text complexity

## Single Package

This is the condensed "gift box" you requested - no complex multi-service architecture, just a focused visualization tool that does one thing well.

---

*"Just fucking not understanding it" → Now it's simple: One file, one purpose, one screen*
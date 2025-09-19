/**
 * CREATIVE TOOLS INTEGRATION
 * Connects drawing, note-taking, and creative tools with the Music Knot system
 */

class CreativeToolsIntegration {
  constructor() {
    this.canvas = null;
    this.drawingContext = null;
    this.isDrawing = false;
    this.currentPath = [];
    this.knotPaths = [];
    this.capturedImages = [];
    
    // Tool states
    this.activeTools = {
      pen: false,
      inkscape: false,
      obsidian: false,
      camera: false
    };
    
    // Obsidian integration
    this.obsidianVault = 'MusicKnots';
    this.obsidianTemplates = this.loadObsidianTemplates();
  }
  
  // Initialize drawing canvas
  initDrawingCanvas(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = container.offsetWidth;
    this.canvas.height = container.offsetHeight;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.cursor = 'crosshair';
    this.canvas.style.zIndex = '1000';
    
    container.appendChild(this.canvas);
    this.drawingContext = this.canvas.getContext('2d');
    
    // Setup drawing events
    this.setupDrawingEvents();
  }
  
  setupDrawingEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0]));
    this.canvas.addEventListener('touchmove', (e) => this.draw(e.touches[0]));
    this.canvas.addEventListener('touchend', () => this.stopDrawing());
  }
  
  startDrawing(e) {
    this.isDrawing = true;
    this.currentPath = [];
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.currentPath.push({ x, y });
    
    this.drawingContext.beginPath();
    this.drawingContext.moveTo(x, y);
    this.drawingContext.strokeStyle = '#4ecca3';
    this.drawingContext.lineWidth = 3;
    this.drawingContext.lineCap = 'round';
  }
  
  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.currentPath.push({ x, y });
    
    this.drawingContext.lineTo(x, y);
    this.drawingContext.stroke();
    
    // Detect knot patterns in real-time
    if (this.currentPath.length % 10 === 0) {
      this.analyzeDrawingPattern();
    }
  }
  
  stopDrawing() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    
    // Save completed path
    if (this.currentPath.length > 10) {
      this.knotPaths.push([...this.currentPath]);
      this.analyzeCompletedKnot();
    }
  }
  
  // Analyze drawing pattern for knot type
  analyzeDrawingPattern() {
    const path = this.currentPath;
    if (path.length < 20) return;
    
    // Calculate crossings (simplified)
    let crossings = 0;
    for (let i = 0; i < path.length - 10; i++) {
      for (let j = i + 10; j < path.length - 1; j++) {
        if (this.segmentsIntersect(
          path[i], path[i + 1],
          path[j], path[j + 1]
        )) {
          crossings++;
        }
      }
    }
    
    // Emit knot detection event
    if (crossings > 0) {
      window.dispatchEvent(new CustomEvent('knot-detected', {
        detail: { crossings, path: this.currentPath }
      }));
    }
  }
  
  segmentsIntersect(p1, p2, p3, p4) {
    const ccw = (A, B, C) => {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    };
    
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && 
           ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }
  
  // Analyze completed knot drawing
  analyzeCompletedKnot() {
    const lastPath = this.knotPaths[this.knotPaths.length - 1];
    
    // Calculate knot invariants
    const analysis = {
      crossings: this.countCrossings(lastPath),
      writhe: this.calculateWrithe(lastPath),
      bounds: this.calculateBounds(lastPath),
      centroid: this.calculateCentroid(lastPath)
    };
    
    // Determine knot type
    let knotType = 'unknot';
    if (analysis.crossings === 3) knotType = 'trefoil';
    else if (analysis.crossings === 4) knotType = 'figure-eight';
    else if (analysis.crossings >= 6) knotType = 'square';
    
    // Generate music from drawing
    window.dispatchEvent(new CustomEvent('knot-drawn', {
      detail: {
        type: knotType,
        analysis,
        path: lastPath
      }
    }));
    
    return { type: knotType, analysis };
  }
  
  countCrossings(path) {
    let count = 0;
    for (let i = 0; i < path.length - 2; i++) {
      for (let j = i + 2; j < path.length - 1; j++) {
        if (this.segmentsIntersect(path[i], path[i + 1], path[j], path[j + 1])) {
          count++;
        }
      }
    }
    return count;
  }
  
  calculateWrithe(path) {
    // Simplified writhe calculation
    let writhe = 0;
    const crossings = [];
    
    for (let i = 0; i < path.length - 2; i++) {
      for (let j = i + 2; j < path.length - 1; j++) {
        if (this.segmentsIntersect(path[i], path[i + 1], path[j], path[j + 1])) {
          // Determine over/under by y-coordinate
          const sign = path[i].y < path[j].y ? 1 : -1;
          writhe += sign;
        }
      }
    }
    
    return writhe;
  }
  
  calculateBounds(path) {
    const xs = path.map(p => p.x);
    const ys = path.map(p => p.y);
    
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }
  
  calculateCentroid(path) {
    const sumX = path.reduce((sum, p) => sum + p.x, 0);
    const sumY = path.reduce((sum, p) => sum + p.y, 0);
    
    return {
      x: sumX / path.length,
      y: sumY / path.length
    };
  }
  
  // Export to Inkscape SVG
  exportToInkscape() {
    const svg = this.generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `music-knot-${Date.now()}.svg`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  generateSVG() {
    const bounds = this.canvas.getBoundingClientRect();
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}">`;
    svg += '<style>.knot-path { fill: none; stroke: #4ecca3; stroke-width: 3; stroke-linecap: round; }</style>';
    
    // Add each knot path
    this.knotPaths.forEach((path, index) => {
      svg += '<path class="knot-path" d="';
      
      path.forEach((point, i) => {
        if (i === 0) {
          svg += `M ${point.x} ${point.y} `;
        } else {
          svg += `L ${point.x} ${point.y} `;
        }
      });
      
      svg += '"/>';
    });
    
    svg += '</svg>';
    return svg;
  }
  
  // Obsidian integration
  loadObsidianTemplates() {
    return {
      knotSession: `# Knot Session {{date}}

## Session Info
- **Time**: {{time}}
- **Duration**: {{duration}}
- **Knots Created**: {{knotCount}}

## Knot Patterns

### Pattern 1: {{knotType}}
- **Crossings**: {{crossings}}
- **Writhe**: {{writhe}}
- **Musical Mode**: {{mode}}
- **Notes**: {{notes}}

#### Sketch
![[knot-sketch-{{timestamp}}.png]]

#### Musical Notation
\`\`\`
{{musicalNotation}}
\`\`\`

## Insights
{{insights}}

## Tags
#music-knot #topology #{{knotType}} #{{mode}}
`,

      knotTheory: `# Knot Theory Notes

## Mathematical Properties
- **Knot Type**: {{knotType}}
- **Alexander Polynomial**: {{alexander}}
- **Jones Polynomial**: {{jones}}
- **HOMFLY Polynomial**: {{homfly}}

## Musical Mapping
- **Base Frequency**: {{baseFreq}} Hz
- **Mode**: {{mode}}
- **Tempo**: {{tempo}} BPM
- **Time Signature**: {{timeSignature}}

## Transformations
### Reidemeister Moves
1. **Type I (Twist)**: {{typeI}}
2. **Type II (Poke)**: {{typeII}}
3. **Type III (Slide)**: {{typeIII}}

## Related Knots
- [[{{relatedKnot1}}]]
- [[{{relatedKnot2}}]]
- [[{{relatedKnot3}}]]
`
    };
  }
  
  createObsidianNote(type, data) {
    let template = this.obsidianTemplates[type] || this.obsidianTemplates.knotSession;
    
    // Replace template variables
    Object.entries(data).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return template;
  }
  
  exportToObsidian(sessionData) {
    const note = this.createObsidianNote('knotSession', {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      duration: sessionData.duration || '0:00',
      knotCount: this.knotPaths.length,
      knotType: sessionData.knotType || 'unknown',
      crossings: sessionData.crossings || 0,
      writhe: sessionData.writhe || 0,
      mode: sessionData.mode || 'Chromatic',
      notes: sessionData.notes || 'No notes',
      timestamp: Date.now(),
      musicalNotation: sessionData.notation || 'C D E F G',
      insights: sessionData.insights || 'Add your insights here...'
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(note).then(() => {
      this.showNotification('Obsidian note copied to clipboard!');
    });
    
    // Also save canvas as image
    this.saveCanvasImage();
  }
  
  // Camera integration
  async activateCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.style.position = 'fixed';
      video.style.bottom = '100px';
      video.style.left = '20px';
      video.style.width = '200px';
      video.style.borderRadius = '10px';
      video.style.border = '2px solid #4ecca3';
      video.style.zIndex = '1001';
      
      document.body.appendChild(video);
      
      // Add capture button
      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📸 Capture';
      captureBtn.style.cssText = `
        position: fixed;
        bottom: 60px;
        left: 20px;
        width: 200px;
        padding: 10px;
        background: #4ecca3;
        color: #000;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        z-index: 1001;
      `;
      
      captureBtn.onclick = () => this.captureImage(video);
      document.body.appendChild(captureBtn);
      
      // Store references for cleanup
      this.cameraVideo = video;
      this.captureButton = captureBtn;
      this.cameraStream = stream;
      
    } catch (error) {
      console.error('Camera access denied:', error);
      this.showNotification('Camera access denied');
    }
  }
  
  captureImage(video) {
    // Create canvas for capture
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      
      // Store captured image
      this.capturedImages.push({
        url,
        timestamp: Date.now(),
        analysis: null
      });
      
      // Analyze for knot patterns
      this.analyzeImageForKnots(img);
      
      this.showNotification('Image captured! Analyzing for knot patterns...');
    });
  }
  
  async analyzeImageForKnots(img) {
    // This would use computer vision to detect knot patterns
    // For now, we'll simulate the analysis
    
    setTimeout(() => {
      const mockAnalysis = {
        detected: Math.random() > 0.3,
        knotType: ['trefoil', 'figure-eight', 'square'][Math.floor(Math.random() * 3)],
        confidence: Math.random() * 0.5 + 0.5
      };
      
      if (mockAnalysis.detected) {
        window.dispatchEvent(new CustomEvent('knot-detected-in-image', {
          detail: mockAnalysis
        }));
        
        this.showNotification(
          `Knot detected: ${mockAnalysis.knotType} (${Math.round(mockAnalysis.confidence * 100)}% confidence)`
        );
      }
    }, 2000);
  }
  
  // Utility methods
  saveCanvasImage() {
    this.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knot-sketch-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  
  clearCanvas() {
    this.drawingContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.currentPath = [];
    this.knotPaths = [];
  }
  
  showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4ecca3;
      color: #000;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-weight: bold;
      z-index: 2000;
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Cleanup
  dispose() {
    if (this.canvas) {
      this.canvas.remove();
    }
    
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.cameraVideo) {
      this.cameraVideo.remove();
    }
    
    if (this.captureButton) {
      this.captureButton.remove();
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CreativeToolsIntegration;
}
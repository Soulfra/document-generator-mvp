#!/usr/bin/env node
/**
 * Visual Element Selector
 * 
 * Smart highlighting and selection system for sprite elements
 * Enables pixel-perfect selection with metadata extraction for LLM analysis
 * Provides visual bounding boxes and selection data structures
 */

const EventEmitter = require('events');
const { logger, createErrorBoundary } = require('./emergency-logging-system');
const { BrandSpriteIntegration } = require('./brand-sprite-integration');

class VisualElementSelector extends EventEmitter {
    constructor(config = {}) {
        super();
        this.boundary = createErrorBoundary('visual-element-selector');
        
        this.config = {
            selectionMode: config.selectionMode || 'rectangle', // rectangle, lasso, magic-wand
            highlightColor: config.highlightColor || '#00ff41',
            selectedColor: config.selectedColor || '#e94560',
            precision: config.precision || 'pixel', // pixel, sub-pixel
            snapToGrid: config.snapToGrid || true,
            gridSize: config.gridSize || 8,
            multiSelect: config.multiSelect || true,
            ...config
        };
        
        // Selection state
        this.selections = new Map();
        this.activeSelection = null;
        this.selectionHistory = [];
        this.isSelecting = false;
        
        // Canvas and context for visual manipulation
        this.canvas = null;
        this.context = null;
        this.overlayCanvas = null;
        this.overlayContext = null;
        
        // Brand integration
        this.brandIntegration = new BrandSpriteIntegration();
        
        // Selection tools
        this.tools = {
            rectangle: new RectangleSelector(this),
            lasso: new LassoSelector(this),
            magicWand: new MagicWandSelector(this),
            eyedropper: new EyedropperTool(this)
        };
        
        this.currentTool = this.tools[this.config.selectionMode];
        
        logger.log('SYSTEM', 'Visual Element Selector initialized', {
            mode: this.config.selectionMode,
            precision: this.config.precision
        });
    }
    
    // Initialize the selector with a canvas element
    initialize(canvasElement, overlayCanvasElement) {
        this.canvas = canvasElement;
        this.context = this.canvas.getContext('2d');
        this.overlayCanvas = overlayCanvasElement || this.createOverlayCanvas();
        this.overlayContext = this.overlayCanvas.getContext('2d');
        
        this.setupEventListeners();
        this.setupCanvasProperties();
        
        logger.log('INFO', 'Visual selector initialized with canvas', {
            width: this.canvas.width,
            height: this.canvas.height
        });
    }
    
    createOverlayCanvas() {
        const overlay = document.createElement('canvas');
        overlay.width = this.canvas.width;
        overlay.height = this.canvas.height;
        overlay.style.position = 'absolute';
        overlay.style.top = this.canvas.offsetTop + 'px';
        overlay.style.left = this.canvas.offsetLeft + 'px';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '1000';
        
        if (this.canvas.parentNode) {
            this.canvas.parentNode.appendChild(overlay);
        }
        
        return overlay;
    }
    
    setupEventListeners() {
        // Mouse events for selection
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        // Keyboard events for multi-select and tools
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Context menu for advanced options
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    }
    
    setupCanvasProperties() {
        // Enable high-DPI support
        const ratio = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * ratio;
        this.canvas.height = rect.height * ratio;
        this.context.scale(ratio, ratio);
        
        // Disable image smoothing for pixel-perfect selection
        this.context.imageSmoothingEnabled = false;
        this.overlayContext.imageSmoothingEnabled = false;
    }
    
    // Mouse event handlers
    handleMouseDown(event) {
        const coords = this.getCanvasCoordinates(event);
        
        this.isSelecting = true;
        this.currentTool.startSelection(coords);
        
        this.emit('selection-start', {
            coords,
            tool: this.currentTool.name,
            modifiers: this.getModifierKeys(event)
        });
    }
    
    handleMouseMove(event) {
        const coords = this.getCanvasCoordinates(event);
        
        if (this.isSelecting) {
            this.currentTool.updateSelection(coords);
            this.updateVisualFeedback();
        } else {
            // Show hover feedback
            this.showHoverFeedback(coords);
        }
        
        this.emit('mouse-move', { coords, isSelecting: this.isSelecting });
    }
    
    handleMouseUp(event) {
        if (!this.isSelecting) return;
        
        const coords = this.getCanvasCoordinates(event);
        const selection = this.currentTool.completeSelection(coords);
        
        if (selection && this.isValidSelection(selection)) {
            this.addSelection(selection);
        }
        
        this.isSelecting = false;
        this.clearVisualFeedback();
        
        this.emit('selection-complete', { selection, coords });
    }
    
    handleClick(event) {
        const coords = this.getCanvasCoordinates(event);
        
        // Single-click selection for small elements
        if (!this.isSelecting) {
            const pixelData = this.getPixelData(coords.x, coords.y);
            const smartSelection = this.performSmartSelection(coords, pixelData);
            
            if (smartSelection) {
                this.addSelection(smartSelection);
            }
        }
    }
    
    handleKeyDown(event) {
        switch (event.key) {
            case 'Escape':
                this.clearAllSelections();
                break;
            case 'Delete':
            case 'Backspace':
                this.deleteSelectedElements();
                break;
            case 'r':
                this.setSelectionTool('rectangle');
                break;
            case 'l':
                this.setSelectionTool('lasso');
                break;
            case 'm':
                this.setSelectionTool('magicWand');
                break;
            case 'i':
                this.setSelectionTool('eyedropper');
                break;
            case 'a':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.selectAll();
                }
                break;
        }
    }
    
    handleKeyUp(event) {
        // Handle key releases if needed
    }
    
    handleContextMenu(event) {
        event.preventDefault();
        const coords = this.getCanvasCoordinates(event);
        this.showContextMenu(coords);
    }
    
    // Coordinate conversion
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        let x = (event.clientX - rect.left) * scaleX;
        let y = (event.clientY - rect.top) * scaleY;
        
        // Snap to grid if enabled
        if (this.config.snapToGrid) {
            x = Math.round(x / this.config.gridSize) * this.config.gridSize;
            y = Math.round(y / this.config.gridSize) * this.config.gridSize;
        }
        
        return { x: Math.floor(x), y: Math.floor(y) };
    }
    
    getModifierKeys(event) {
        return {
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            alt: event.altKey,
            meta: event.metaKey
        };
    }
    
    // Selection management
    addSelection(selection) {
        const id = this.generateSelectionId();
        selection.id = id;
        selection.timestamp = new Date().toISOString();
        selection.metadata = this.extractSelectionMetadata(selection);
        
        this.selections.set(id, selection);
        this.activeSelection = id;
        
        // Add to history
        this.selectionHistory.push({
            action: 'add',
            selection: { ...selection },
            timestamp: selection.timestamp
        });
        
        this.updateSelectionVisuals();
        
        logger.log('INFO', 'Selection added', {
            id: id,
            type: selection.type,
            bounds: selection.bounds
        });
        
        this.emit('selection-added', { id, selection });
    }
    
    removeSelection(id) {
        const selection = this.selections.get(id);
        if (!selection) return;
        
        this.selections.delete(id);
        
        if (this.activeSelection === id) {
            this.activeSelection = this.selections.size > 0 ? 
                Array.from(this.selections.keys())[0] : null;
        }
        
        this.selectionHistory.push({
            action: 'remove',
            selection: { ...selection },
            timestamp: new Date().toISOString()
        });
        
        this.updateSelectionVisuals();
        
        this.emit('selection-removed', { id, selection });
    }
    
    clearAllSelections() {
        const selections = Array.from(this.selections.values());
        this.selections.clear();
        this.activeSelection = null;
        
        this.selectionHistory.push({
            action: 'clear_all',
            selections: selections,
            timestamp: new Date().toISOString()
        });
        
        this.clearVisualFeedback();
        
        this.emit('selections-cleared', { selections });
    }
    
    // Smart selection algorithms
    performSmartSelection(coords, pixelData) {
        // Try different smart selection methods
        const methods = [
            () => this.selectSimilarColors(coords, pixelData),
            () => this.selectConnectedRegion(coords, pixelData),
            () => this.selectUIElement(coords, pixelData)
        ];
        
        for (const method of methods) {
            const result = method();
            if (result && this.isValidSelection(result)) {
                return result;
            }
        }
        
        return null;
    }
    
    selectSimilarColors(coords, pixelData) {
        const tolerance = 20; // Color similarity tolerance
        const targetColor = pixelData;
        const selection = {
            type: 'color-based',
            pixels: [],
            bounds: { x: coords.x, y: coords.y, width: 1, height: 1 },
            color: targetColor
        };
        
        // Flood fill algorithm to find similar colors
        const visited = new Set();
        const stack = [coords];
        
        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.x},${current.y}`;
            
            if (visited.has(key)) continue;
            if (current.x < 0 || current.y < 0 || 
                current.x >= this.canvas.width || current.y >= this.canvas.height) continue;
            
            const currentPixel = this.getPixelData(current.x, current.y);
            if (!this.colorsAreSimilar(targetColor, currentPixel, tolerance)) continue;
            
            visited.add(key);
            selection.pixels.push(current);
            
            // Update bounds
            selection.bounds.x = Math.min(selection.bounds.x, current.x);
            selection.bounds.y = Math.min(selection.bounds.y, current.y);
            selection.bounds.width = Math.max(selection.bounds.width, current.x - selection.bounds.x + 1);
            selection.bounds.height = Math.max(selection.bounds.height, current.y - selection.bounds.y + 1);
            
            // Add neighbors
            stack.push(
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y },
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 }
            );
        }
        
        return selection.pixels.length > 1 ? selection : null;
    }
    
    selectConnectedRegion(coords, pixelData) {
        // Find connected region of non-transparent pixels
        const selection = {
            type: 'connected-region',
            pixels: [],
            bounds: { x: coords.x, y: coords.y, width: 1, height: 1 }
        };
        
        const visited = new Set();
        const stack = [coords];
        
        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.x},${current.y}`;
            
            if (visited.has(key)) continue;
            
            const pixel = this.getPixelData(current.x, current.y);
            if (pixel.a === 0) continue; // Skip transparent pixels
            
            visited.add(key);
            selection.pixels.push(current);
            
            // Update bounds
            this.updateSelectionBounds(selection, current);
            
            // Add non-transparent neighbors
            const neighbors = [
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y },
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 }
            ];
            
            neighbors.forEach(neighbor => {
                if (this.isValidCoordinate(neighbor)) {
                    const neighborPixel = this.getPixelData(neighbor.x, neighbor.y);
                    if (neighborPixel.a > 0) {
                        stack.push(neighbor);
                    }
                }
            });
        }
        
        return selection.pixels.length > 4 ? selection : null;
    }
    
    selectUIElement(coords, pixelData) {
        // Try to detect UI elements based on patterns
        const brandElements = this.brandIntegration.getAvailableTemplates();
        
        // Check if coordinates fall within a known UI element pattern
        for (const template of brandElements) {
            const sprite = this.brandIntegration.createBrandCompliantSprite(template);
            const match = this.matchSpritePattern(coords, sprite);
            
            if (match) {
                return {
                    type: 'ui-element',
                    elementType: template,
                    bounds: match.bounds,
                    sprite: sprite,
                    confidence: match.confidence
                };
            }
        }
        
        return null;
    }
    
    // Visual feedback and rendering
    updateVisualFeedback() {
        this.clearOverlay();
        
        if (this.isSelecting && this.currentTool.previewSelection) {
            this.drawSelectionPreview(this.currentTool.previewSelection);
        }
    }
    
    updateSelectionVisuals() {
        this.clearOverlay();
        
        // Draw all selections
        this.selections.forEach((selection, id) => {
            const isActive = id === this.activeSelection;
            this.drawSelection(selection, isActive);
        });
    }
    
    drawSelection(selection, isActive = false) {
        const color = isActive ? this.config.selectedColor : this.config.highlightColor;
        
        this.overlayContext.strokeStyle = color;
        this.overlayContext.lineWidth = 2;
        this.overlayContext.setLineDash(isActive ? [] : [4, 4]);
        
        switch (selection.type) {
            case 'rectangle':
                this.overlayContext.strokeRect(
                    selection.bounds.x, selection.bounds.y,
                    selection.bounds.width, selection.bounds.height
                );
                break;
                
            case 'color-based':
            case 'connected-region':
                this.drawPixelSelection(selection, color);
                break;
                
            case 'ui-element':
                this.drawUIElementSelection(selection, color);
                break;
        }
        
        // Draw selection handles
        if (isActive) {
            this.drawSelectionHandles(selection);
        }
        
        // Draw metadata overlay
        this.drawSelectionMetadata(selection, isActive);
    }
    
    drawPixelSelection(selection, color) {
        this.overlayContext.fillStyle = color + '40'; // Semi-transparent
        
        selection.pixels.forEach(pixel => {
            this.overlayContext.fillRect(pixel.x, pixel.y, 1, 1);
        });
        
        // Draw bounding box
        this.overlayContext.strokeStyle = color;
        this.overlayContext.strokeRect(
            selection.bounds.x, selection.bounds.y,
            selection.bounds.width, selection.bounds.height
        );
    }
    
    drawUIElementSelection(selection, color) {
        const { bounds } = selection;
        
        // Draw UI element outline
        this.overlayContext.strokeStyle = color;
        this.overlayContext.lineWidth = 3;
        this.overlayContext.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        // Draw element type label
        this.overlayContext.fillStyle = color;
        this.overlayContext.font = '12px Arial';
        this.overlayContext.fillText(
            selection.elementType,
            bounds.x, bounds.y - 5
        );
    }
    
    drawSelectionHandles(selection) {
        const handleSize = 6;
        const { bounds } = selection;
        
        this.overlayContext.fillStyle = this.config.selectedColor;
        
        // Corner handles
        const handles = [
            { x: bounds.x, y: bounds.y }, // Top-left
            { x: bounds.x + bounds.width, y: bounds.y }, // Top-right
            { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-left
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // Bottom-right
        ];
        
        handles.forEach(handle => {
            this.overlayContext.fillRect(
                handle.x - handleSize / 2,
                handle.y - handleSize / 2,
                handleSize,
                handleSize
            );
        });
    }
    
    drawSelectionMetadata(selection, isActive) {
        if (!isActive || !selection.metadata) return;
        
        const { bounds } = selection;
        const metadata = selection.metadata;
        
        // Create metadata popup
        const popup = {
            x: bounds.x + bounds.width + 10,
            y: bounds.y,
            width: 200,
            height: 100
        };
        
        // Background
        this.overlayContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.overlayContext.fillRect(popup.x, popup.y, popup.width, popup.height);
        
        // Border
        this.overlayContext.strokeStyle = this.config.selectedColor;
        this.overlayContext.strokeRect(popup.x, popup.y, popup.width, popup.height);
        
        // Text
        this.overlayContext.fillStyle = 'white';
        this.overlayContext.font = '10px Arial';
        
        let textY = popup.y + 15;
        const lineHeight = 12;
        
        const info = [
            `Size: ${bounds.width}x${bounds.height}`,
            `Position: (${bounds.x}, ${bounds.y})`,
            `Type: ${selection.type}`,
            metadata.brandCompliance ? `Brand: ${metadata.brandCompliance.grade}` : '',
            metadata.dominantColor ? `Color: ${metadata.dominantColor}` : ''
        ].filter(Boolean);
        
        info.forEach(line => {
            this.overlayContext.fillText(line, popup.x + 5, textY);
            textY += lineHeight;
        });
    }
    
    clearOverlay() {
        this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
    
    clearVisualFeedback() {
        this.clearOverlay();
        this.updateSelectionVisuals();
    }
    
    // Utility functions
    getPixelData(x, y) {
        const imageData = this.context.getImageData(x, y, 1, 1);
        const data = imageData.data;
        
        return {
            r: data[0],
            g: data[1],
            b: data[2],
            a: data[3]
        };
    }
    
    colorsAreSimilar(color1, color2, tolerance) {
        const dr = Math.abs(color1.r - color2.r);
        const dg = Math.abs(color1.g - color2.g);
        const db = Math.abs(color1.b - color2.b);
        
        return dr <= tolerance && dg <= tolerance && db <= tolerance;
    }
    
    isValidCoordinate(coord) {
        return coord.x >= 0 && coord.y >= 0 && 
               coord.x < this.canvas.width && coord.y < this.canvas.height;
    }
    
    isValidSelection(selection) {
        return selection && 
               (selection.bounds.width > 0 && selection.bounds.height > 0) ||
               (selection.pixels && selection.pixels.length > 0);
    }
    
    updateSelectionBounds(selection, point) {
        if (!selection.bounds) {
            selection.bounds = { x: point.x, y: point.y, width: 1, height: 1 };
            return;
        }
        
        const minX = Math.min(selection.bounds.x, point.x);
        const minY = Math.min(selection.bounds.y, point.y);
        const maxX = Math.max(selection.bounds.x + selection.bounds.width - 1, point.x);
        const maxY = Math.max(selection.bounds.y + selection.bounds.height - 1, point.y);
        
        selection.bounds = {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }
    
    extractSelectionMetadata(selection) {
        const metadata = {
            pixelCount: 0,
            dominantColor: null,
            colorPalette: [],
            brandCompliance: null,
            elementType: selection.type
        };
        
        // Count pixels and analyze colors
        if (selection.pixels) {
            metadata.pixelCount = selection.pixels.length;
            metadata.colorPalette = this.analyzeColors(selection.pixels);
            metadata.dominantColor = metadata.colorPalette[0]?.color;
        } else if (selection.bounds) {
            metadata.pixelCount = selection.bounds.width * selection.bounds.height;
        }
        
        // Brand compliance check
        if (selection.sprite) {
            metadata.brandCompliance = this.brandIntegration.validateBrandCompliance(selection.sprite);
        }
        
        return metadata;
    }
    
    analyzeColors(pixels) {
        const colorMap = new Map();
        
        pixels.forEach(pixel => {
            const color = this.getPixelData(pixel.x, pixel.y);
            const colorKey = `${color.r},${color.g},${color.b}`;
            
            if (!colorMap.has(colorKey)) {
                colorMap.set(colorKey, {
                    color: `rgb(${color.r}, ${color.g}, ${color.b})`,
                    count: 0,
                    rgba: color
                });
            }
            
            colorMap.get(colorKey).count++;
        });
        
        return Array.from(colorMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 colors
    }
    
    generateSelectionId() {
        return 'selection_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Tool management
    setSelectionTool(toolName) {
        if (this.tools[toolName]) {
            this.currentTool = this.tools[toolName];
            this.config.selectionMode = toolName;
            
            this.emit('tool-changed', { tool: toolName });
        }
    }
    
    // Export selections for LLM analysis
    exportSelectionsForLLM() {
        const exportData = {
            timestamp: new Date().toISOString(),
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            selections: []
        };
        
        this.selections.forEach((selection, id) => {
            exportData.selections.push({
                id: id,
                type: selection.type,
                bounds: selection.bounds,
                metadata: selection.metadata,
                isActive: id === this.activeSelection,
                // Include pixel data for detailed analysis
                pixelData: selection.pixels ? this.extractPixelDataForExport(selection) : null
            });
        });
        
        return exportData;
    }
    
    extractPixelDataForExport(selection) {
        if (!selection.pixels) return null;
        
        // Create a simplified representation of the pixel data
        const bounds = selection.bounds;
        const pixelMatrix = Array(bounds.height).fill(null).map(() => Array(bounds.width).fill(null));
        
        selection.pixels.forEach(pixel => {
            const relativeX = pixel.x - bounds.x;
            const relativeY = pixel.y - bounds.y;
            
            if (relativeX >= 0 && relativeX < bounds.width && 
                relativeY >= 0 && relativeY < bounds.height) {
                pixelMatrix[relativeY][relativeX] = this.getPixelData(pixel.x, pixel.y);
            }
        });
        
        return pixelMatrix;
    }
}

// Selection tool classes
class RectangleSelector {
    constructor(selector) {
        this.selector = selector;
        this.name = 'rectangle';
        this.startPoint = null;
        this.previewSelection = null;
    }
    
    startSelection(coords) {
        this.startPoint = coords;
        this.previewSelection = null;
    }
    
    updateSelection(coords) {
        if (!this.startPoint) return;
        
        const x = Math.min(this.startPoint.x, coords.x);
        const y = Math.min(this.startPoint.y, coords.y);
        const width = Math.abs(coords.x - this.startPoint.x);
        const height = Math.abs(coords.y - this.startPoint.y);
        
        this.previewSelection = {
            type: 'rectangle',
            bounds: { x, y, width, height }
        };
    }
    
    completeSelection(coords) {
        const selection = this.previewSelection;
        this.previewSelection = null;
        this.startPoint = null;
        
        return selection;
    }
}

class LassoSelector {
    constructor(selector) {
        this.selector = selector;
        this.name = 'lasso';
        this.points = [];
        this.previewSelection = null;
    }
    
    startSelection(coords) {
        this.points = [coords];
    }
    
    updateSelection(coords) {
        this.points.push(coords);
        
        // Calculate bounding box
        const xs = this.points.map(p => p.x);
        const ys = this.points.map(p => p.y);
        
        this.previewSelection = {
            type: 'lasso',
            points: [...this.points],
            bounds: {
                x: Math.min(...xs),
                y: Math.min(...ys),
                width: Math.max(...xs) - Math.min(...xs),
                height: Math.max(...ys) - Math.min(...ys)
            }
        };
    }
    
    completeSelection(coords) {
        const selection = this.previewSelection;
        this.previewSelection = null;
        this.points = [];
        
        return selection;
    }
}

class MagicWandSelector {
    constructor(selector) {
        this.selector = selector;
        this.name = 'magicWand';
        this.tolerance = 20;
    }
    
    startSelection(coords) {
        // Magic wand is immediate - no preview needed
    }
    
    updateSelection(coords) {
        // No preview for magic wand
    }
    
    completeSelection(coords) {
        const pixelData = this.selector.getPixelData(coords.x, coords.y);
        return this.selector.selectSimilarColors(coords, pixelData);
    }
}

class EyedropperTool {
    constructor(selector) {
        this.selector = selector;
        this.name = 'eyedropper';
    }
    
    startSelection(coords) {
        const pixelData = this.selector.getPixelData(coords.x, coords.y);
        
        this.selector.emit('color-picked', {
            coords,
            color: pixelData,
            hex: this.rgbToHex(pixelData)
        });
    }
    
    updateSelection(coords) {
        // Show color preview
    }
    
    completeSelection(coords) {
        return null; // Eyedropper doesn't create selections
    }
    
    rgbToHex(color) {
        return '#' + [color.r, color.g, color.b]
            .map(c => c.toString(16).padStart(2, '0'))
            .join('');
    }
}

// Export for use in other modules
module.exports = {
    VisualElementSelector,
    RectangleSelector,
    LassoSelector,
    MagicWandSelector,
    EyedropperTool
};

// If run directly, create a demo
if (require.main === module) {
    console.log('🎯 Visual Element Selector - Demo Mode\n');
    console.log('Features:');
    console.log('  ✅ Pixel-perfect selection tools');
    console.log('  ✅ Smart element detection');
    console.log('  ✅ Brand compliance checking');
    console.log('  ✅ Multi-selection support');
    console.log('  ✅ Real-time visual feedback');
    console.log('  ✅ LLM-ready data export');
    console.log('\nSelection Tools:');
    console.log('  • Rectangle (R) - Precise rectangular selection');
    console.log('  • Lasso (L) - Freehand selection');
    console.log('  • Magic Wand (M) - Color-based selection');
    console.log('  • Eyedropper (I) - Color sampling');
    console.log('\nKeyboard Shortcuts:');
    console.log('  • Escape - Clear all selections');
    console.log('  • Ctrl+A - Select all');
    console.log('  • Delete - Remove selected elements');
    console.log('\nReady for integration with LLM analysis system!');
}
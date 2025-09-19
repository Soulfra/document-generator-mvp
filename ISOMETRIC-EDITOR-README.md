# 📦 Isometric World Editor

## What's Different Now?

This is a **proper world editor** with actual controls and functionality - like Habbo Hotel but for documents.

## Key Features That Actually Work

### 🎮 **Interactive Controls**
- **Click to place** - Objects snap to isometric grid
- **Drag to pan** - Move around your world
- **Scroll to zoom** - Get closer or see overview
- **Keyboard controls** - WASD movement, R to rotate, Delete to remove

### 📦 **Object System**
- **6 object types**: Block, Tree, Building, Water, Road, Document
- **Grid-based placement** - Objects align properly
- **Properties panel** - Adjust rotation, height, color
- **Document conversion** - Drop files to create object patterns

### 💾 **Working Exports**
- **Save/Load World** - JSON format with all object data
- **Export PNG** - Screenshot of current view
- **Export ASCII** - Terminal-friendly world map
- **GIF Recording** - Capture animation frames

## How to Use

1. **Launch**:
   ```bash
   ./launch-isometric-editor.sh
   ```

2. **Place Objects**:
   - Select object type from palette (or press 1-6)
   - Click on grid to place
   - Select placed objects to edit properties

3. **Navigate**:
   - Right-click + drag to pan
   - WASD/Arrow keys to move
   - Mouse wheel to zoom
   - Space to center view

4. **Document Processing**:
   - Drop any text file on the drop zone
   - Creates objects based on file structure:
     - Functions → Buildings
     - Comments → Trees  
     - Brackets → Roads
     - Other → Blocks

## What Makes This Better

1. **Actual Controls** - Not just a rotating camera
2. **Grid Placement** - Objects go where you click
3. **Working Exports** - Downloads actually work
4. **Isometric View** - Like Habbo Hotel, not random terrain
5. **Object Properties** - Can customize everything

## Technical Details

- Pure JavaScript - No complex dependencies
- Canvas-based isometric renderer
- Object-oriented design
- Real coordinate system
- Minimap for navigation

---

*"It looks not that great either because I have no controls" → Fixed!*
*"I can't place it anywhere around the world editor" → Now you can!*
*"Exports and downloads don't work" → They work now!*
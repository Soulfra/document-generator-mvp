/**
 * 🪟 OVERLAY MANAGER
 * Manages MUD-style draggable windows, inventory, and trash bin interactions
 * Handles all drag-and-drop operations and window positioning
 */

class OverlayManager {
    constructor() {
        this.windows = new Map();
        this.dragState = {
            isDragging: false,
            dragTarget: null,
            offset: { x: 0, y: 0 },
            startPosition: { x: 0, y: 0 }
        };
        this.inventorySlots = new Map();
        this.trashBin = null;
        this.windowZIndex = 1000;
        this.snapThreshold = 20;
        this.gridSize = 10;
        
        this.initializeOverlayManager();
    }

    initializeOverlayManager() {
        console.log('🪟 Initializing Overlay Manager...');
        
        this.setupEventListeners();
        this.initializeInventorySystem();
        this.initializeTrashBin();
        this.initializeWindowManagement();
        this.setupKeyboardShortcuts();
        
        console.log('✅ Overlay Manager ready - MUD-style interface active');
    }

    setupEventListeners() {
        // Global mouse events
        document.addEventListener('mousedown', (e) => this.handleGlobalMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleGlobalMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleGlobalMouseUp(e));
        
        // Global touch events for mobile
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Prevent default drag behavior on images and other elements
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('draggable')) {
                e.preventDefault();
            }
        });
        
        // Window resize handling
        window.addEventListener('resize', () => this.handleWindowResize());
    }

    initializeInventorySystem() {
        console.log('🎒 Initializing inventory system...');
        
        const inventorySlots = document.querySelectorAll('.inventory-slot, .mud-inventory-slot');
        
        inventorySlots.forEach((slot, index) => {
            const slotId = slot.dataset.slotId || `slot-${index}`;
            
            this.inventorySlots.set(slotId, {
                element: slot,
                item: null,
                isEmpty: !slot.classList.contains('has-item'),
                acceptsTypes: slot.dataset.acceptTypes?.split(',') || ['any'],
                position: index
            });
            
            // Make slots draggable if they have items
            if (!slot.classList.contains('draggable') && slot.classList.contains('has-item')) {
                slot.classList.add('draggable');
            }
            
            // Add drop zone capabilities
            slot.addEventListener('dragover', (e) => this.handleSlotDragOver(e, slotId));
            slot.addEventListener('drop', (e) => this.handleSlotDrop(e, slotId));
        });
        
        console.log(`📦 ${this.inventorySlots.size} inventory slots initialized`);
    }

    initializeTrashBin() {
        console.log('🗑️ Initializing trash bin system...');
        
        this.trashBin = document.getElementById('trashBin') || document.querySelector('.trash-bin, .mud-trash-bin');
        
        if (this.trashBin) {
            this.trashBin.addEventListener('dragover', (e) => this.handleTrashDragOver(e));
            this.trashBin.addEventListener('drop', (e) => this.handleTrashDrop(e));
            this.trashBin.addEventListener('dragleave', (e) => this.handleTrashDragLeave(e));
            
            // Add trash bin click handler for manual cleanup
            this.trashBin.addEventListener('click', () => this.showTrashBinMenu());
            
            console.log('🗑️ Trash bin system ready');
        } else {
            console.warn('⚠️ No trash bin element found');
        }
    }

    initializeWindowManagement() {
        console.log('🪟 Initializing window management...');
        
        const windows = document.querySelectorAll('.mud-window, .cal-freedom-modal');
        
        windows.forEach((window, index) => {
            const windowId = window.dataset.windowId || `window-${index}`;
            
            this.registerWindow(windowId, window);
            this.setupWindowControls(window);
        });
        
        console.log(`🪟 ${this.windows.size} windows registered`);
    }

    registerWindow(windowId, windowElement) {
        const titleBar = windowElement.querySelector('.mud-titlebar, .modal-chrome');
        const content = windowElement.querySelector('.mud-content, .modal-content');
        
        const windowData = {
            id: windowId,
            element: windowElement,
            titleBar: titleBar,
            content: content,
            isMinimized: false,
            isMaximized: false,
            originalPosition: { 
                x: windowElement.offsetLeft, 
                y: windowElement.offsetTop 
            },
            originalSize: { 
                width: windowElement.offsetWidth, 
                height: windowElement.offsetHeight 
            },
            zIndex: this.windowZIndex++
        };
        
        this.windows.set(windowId, windowData);
        
        // Make title bar draggable
        if (titleBar) {
            titleBar.style.cursor = 'move';
            titleBar.addEventListener('mousedown', (e) => this.startWindowDrag(e, windowId));
        }
        
        // Set initial z-index
        windowElement.style.zIndex = windowData.zIndex;
        
        // Focus on click
        windowElement.addEventListener('mousedown', () => this.focusWindow(windowId));
    }

    setupWindowControls(windowElement) {
        const minimizeBtn = windowElement.querySelector('.minimize-btn, .mud-control-btn.minimize');
        const maximizeBtn = windowElement.querySelector('.maximize-btn, .mud-control-btn.maximize');
        const closeBtn = windowElement.querySelector('.close-btn, .mud-control-btn.close');
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const windowId = this.getWindowIdFromElement(windowElement);
                this.minimizeWindow(windowId);
            });
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const windowId = this.getWindowIdFromElement(windowElement);
                this.toggleMaximizeWindow(windowId);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const windowId = this.getWindowIdFromElement(windowElement);
                this.closeWindow(windowId);
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + Tab to cycle windows
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
                this.cycleWindows();
            }
            
            // Escape to close focused window
            if (e.key === 'Escape') {
                this.closeTopWindow();
            }
            
            // Ctrl + M to minimize all windows
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                this.minimizeAllWindows();
            }
            
            // Ctrl + R to restore all windows
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.restoreAllWindows();
            }
        });
    }

    // Drag and Drop Handlers
    handleGlobalMouseDown(e) {
        const element = e.target.closest('.draggable');
        
        if (element) {
            this.startDrag(e, element);
        }
    }

    handleGlobalMouseMove(e) {
        if (this.dragState.isDragging) {
            this.updateDrag(e);
        }
    }

    handleGlobalMouseUp(e) {
        if (this.dragState.isDragging) {
            this.endDrag(e);
        }
    }

    startDrag(e, element) {
        this.dragState.isDragging = true;
        this.dragState.dragTarget = element;
        
        const rect = element.getBoundingClientRect();
        this.dragState.offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.dragState.startPosition = {
            x: rect.left,
            y: rect.top
        };
        
        element.classList.add('dragging');
        element.style.zIndex = this.windowZIndex++;
        
        // Create drag preview for inventory items
        if (element.classList.contains('inventory-slot') || element.classList.contains('mud-inventory-slot')) {
            this.createDragPreview(element, e);
        }
        
        e.preventDefault();
    }

    updateDrag(e) {
        if (!this.dragState.dragTarget) return;
        
        const x = e.clientX - this.dragState.offset.x;
        const y = e.clientY - this.dragState.offset.y;
        
        // Snap to grid if enabled
        const snappedX = this.snapToGrid ? Math.round(x / this.gridSize) * this.gridSize : x;
        const snappedY = this.snapToGrid ? Math.round(y / this.gridSize) * this.gridSize : y;
        
        // Keep within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const elementWidth = this.dragState.dragTarget.offsetWidth;
        const elementHeight = this.dragState.dragTarget.offsetHeight;
        
        const constrainedX = Math.max(0, Math.min(snappedX, viewportWidth - elementWidth));
        const constrainedY = Math.max(0, Math.min(snappedY, viewportHeight - elementHeight));
        
        this.dragState.dragTarget.style.left = constrainedX + 'px';
        this.dragState.dragTarget.style.top = constrainedY + 'px';
        
        // Check for drop zones
        this.highlightDropZones(e);
    }

    endDrag(e) {
        if (!this.dragState.dragTarget) return;
        
        const element = this.dragState.dragTarget;
        element.classList.remove('dragging');
        
        // Check for valid drop
        const dropTarget = this.findDropTarget(e);
        
        if (dropTarget) {
            this.handleDrop(element, dropTarget, e);
        } else {
            // Snap back to original position if invalid drop
            this.snapBackToOriginal(element);
        }
        
        // Clean up drag state
        this.dragState = {
            isDragging: false,
            dragTarget: null,
            offset: { x: 0, y: 0 },
            startPosition: { x: 0, y: 0 }
        };
        
        this.clearDropZoneHighlights();
        this.removeDragPreview();
    }

    createDragPreview(element, e) {
        const preview = element.cloneNode(true);
        preview.classList.add('drag-preview');
        preview.style.position = 'fixed';
        preview.style.pointerEvents = 'none';
        preview.style.opacity = '0.7';
        preview.style.transform = 'scale(0.8)';
        preview.style.zIndex = '9999';
        
        document.body.appendChild(preview);
        this.dragState.preview = preview;
    }

    removeDragPreview() {
        if (this.dragState.preview) {
            document.body.removeChild(this.dragState.preview);
            this.dragState.preview = null;
        }
    }

    findDropTarget(e) {
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        
        if (!elementBelow) return null;
        
        // Check for trash bin
        if (elementBelow.closest('.trash-bin, .mud-trash-bin')) {
            return { type: 'trash', element: elementBelow.closest('.trash-bin, .mud-trash-bin') };
        }
        
        // Check for inventory slot
        const inventorySlot = elementBelow.closest('.inventory-slot, .mud-inventory-slot');
        if (inventorySlot) {
            return { type: 'inventory', element: inventorySlot };
        }
        
        // Check for window
        const window = elementBelow.closest('.mud-window, .cal-freedom-modal');
        if (window) {
            return { type: 'window', element: window };
        }
        
        return null;
    }

    handleDrop(draggedElement, dropTarget, e) {
        switch (dropTarget.type) {
            case 'trash':
                this.handleTrashDrop(draggedElement);
                break;
            case 'inventory':
                this.handleInventoryDrop(draggedElement, dropTarget.element);
                break;
            case 'window':
                this.handleWindowDrop(draggedElement, dropTarget.element);
                break;
        }
    }

    // Inventory System
    handleSlotDragOver(e, slotId) {
        e.preventDefault();
        const slot = this.inventorySlots.get(slotId);
        
        if (slot && this.canAcceptDrop(slot, this.dragState.dragTarget)) {
            slot.element.classList.add('drop-highlight');
        }
    }

    handleSlotDrop(e, slotId) {
        e.preventDefault();
        const slot = this.inventorySlots.get(slotId);
        
        if (slot && this.canAcceptDrop(slot, this.dragState.dragTarget)) {
            this.moveItemToSlot(this.dragState.dragTarget, slot);
        }
        
        slot.element.classList.remove('drop-highlight');
    }

    canAcceptDrop(slot, draggedElement) {
        // Check if slot is empty or can swap
        if (!slot.isEmpty && !this.allowSlotSwapping) {
            return false;
        }
        
        // Check type compatibility
        const itemType = draggedElement.dataset.itemType || 'generic';
        return slot.acceptsTypes.includes('any') || slot.acceptsTypes.includes(itemType);
    }

    moveItemToSlot(item, targetSlot) {
        console.log(`🔄 Moving item to slot ${targetSlot.position}`);
        
        // If target slot has an item, swap
        if (!targetSlot.isEmpty) {
            this.swapSlotItems(item, targetSlot);
        } else {
            // Move item to empty slot
            this.placeItemInSlot(item, targetSlot);
        }
        
        this.updateInventoryDisplay();
    }

    placeItemInSlot(item, slot) {
        const itemData = this.extractItemData(item);
        
        slot.item = itemData;
        slot.isEmpty = false;
        slot.element.innerHTML = itemData.icon || itemData.display || '📦';
        slot.element.classList.add('has-item');
        slot.element.title = itemData.name || 'Item';
        
        // Remove from original location
        if (item.parentNode) {
            item.parentNode.removeChild(item);
        }
    }

    extractItemData(element) {
        return {
            id: element.dataset.itemId || crypto.randomUUID(),
            type: element.dataset.itemType || 'generic',
            name: element.title || element.dataset.itemName || 'Unknown Item',
            icon: element.textContent || element.innerHTML,
            display: element.textContent || '📦',
            value: element.dataset.itemValue || 0,
            rarity: element.dataset.itemRarity || 'common'
        };
    }

    // Trash Bin System
    handleTrashDragOver(e) {
        e.preventDefault();
        if (this.trashBin) {
            this.trashBin.classList.add('drag-over');
        }
    }

    handleTrashDrop(item) {
        console.log('🗑️ Item dropped in trash bin - rotating to help systems');
        
        if (this.trashBin) {
            this.trashBin.classList.remove('drag-over');
        }
        
        const itemData = this.extractItemData(item);
        
        // Animate item disappearing
        this.animateItemToTrash(item, () => {
            // Process rotation to help systems
            this.rotateItemToHelpSystems(itemData);
            
            // Remove item from inventory
            this.removeItemFromInventory(item);
            
            // Update displays
            this.updateInventoryDisplay();
            this.addTerminalMessage(`[System] Item '${itemData.name}' rotated to help systems ↑`);
        });
    }

    handleTrashDragLeave(e) {
        if (this.trashBin && !this.trashBin.contains(e.relatedTarget)) {
            this.trashBin.classList.remove('drag-over');
        }
    }

    animateItemToTrash(item, callback) {
        const trashRect = this.trashBin.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        
        const deltaX = trashRect.left + trashRect.width / 2 - itemRect.left - itemRect.width / 2;
        const deltaY = trashRect.top + trashRect.height / 2 - itemRect.top - itemRect.height / 2;
        
        item.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        item.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.1) rotate(180deg)`;
        item.style.opacity = '0';
        
        setTimeout(() => {
            callback();
        }, 500);
    }

    rotateItemToHelpSystems(itemData) {
        // Simulate rotation to help systems
        console.log(`↑ Rotating ${itemData.name} to help systems...`);
        
        // In a real system, this would send the item data to help endpoints
        const rotationData = {
            timestamp: new Date().toISOString(),
            item: itemData,
            rotationType: 'trash-bin-drop',
            destination: 'help-systems'
        };
        
        // Trigger Cal's response
        setTimeout(() => {
            this.addTerminalMessage(`[Cal's Thought] Thank you for organizing my digital space - efficiency increased`);
        }, 1000);
    }

    removeItemFromInventory(item) {
        // Find and clear the inventory slot
        for (const [slotId, slot] of this.inventorySlots) {
            if (slot.element === item || slot.element.contains(item)) {
                slot.item = null;
                slot.isEmpty = true;
                slot.element.classList.remove('has-item');
                slot.element.innerHTML = '';
                slot.element.title = '';
                break;
            }
        }
        
        // Remove element if it exists
        if (item.parentNode) {
            item.parentNode.removeChild(item);
        }
    }

    showTrashBinMenu() {
        console.log('🗑️ Showing trash bin menu...');
        
        // Create context menu for trash bin actions
        const menu = document.createElement('div');
        menu.className = 'trash-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="empty">Empty Trash</div>
            <div class="menu-item" data-action="restore">Restore Last Item</div>
            <div class="menu-item" data-action="settings">Rotation Settings</div>
        `;
        
        menu.style.position = 'fixed';
        menu.style.right = '100px';
        menu.style.bottom = '100px';
        menu.style.background = 'rgba(0,0,0,0.9)';
        menu.style.border = '2px solid var(--theme-primary)';
        menu.style.borderRadius = '8px';
        menu.style.padding = '10px';
        menu.style.zIndex = '9999';
        
        document.body.appendChild(menu);
        
        // Handle menu clicks
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleTrashMenuAction(action);
            }
            document.body.removeChild(menu);
        });
        
        // Auto-close menu
        setTimeout(() => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
        }, 5000);
    }

    handleTrashMenuAction(action) {
        switch (action) {
            case 'empty':
                this.addTerminalMessage('[System] Trash bin emptied - all items rotated to help systems');
                break;
            case 'restore':
                this.addTerminalMessage('[System] No items to restore');
                break;
            case 'settings':
                this.addTerminalMessage('[System] Rotation settings: Auto-rotate enabled, Help systems: 4 active');
                break;
        }
    }

    // Window Management
    startWindowDrag(e, windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isMaximized) return;
        
        this.dragState.isDragging = true;
        this.dragState.dragTarget = windowData.element;
        this.dragState.windowId = windowId;
        
        const rect = windowData.element.getBoundingClientRect();
        this.dragState.offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        windowData.element.classList.add('dragging');
        this.focusWindow(windowId);
        
        e.preventDefault();
    }

    focusWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        windowData.zIndex = this.windowZIndex++;
        windowData.element.style.zIndex = windowData.zIndex;
        
        // Update visual focus
        this.windows.forEach((data, id) => {
            data.element.classList.toggle('focused', id === windowId);
        });
    }

    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        windowData.isMinimized = true;
        windowData.element.style.transform = 'scale(0.1)';
        windowData.element.style.opacity = '0';
        
        setTimeout(() => {
            windowData.element.style.display = 'none';
        }, 300);
        
        this.addTerminalMessage(`[System] Window minimized: ${windowId}`);
    }

    toggleMaximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        if (windowData.isMaximized) {
            // Restore
            windowData.isMaximized = false;
            windowData.element.style.width = windowData.originalSize.width + 'px';
            windowData.element.style.height = windowData.originalSize.height + 'px';
            windowData.element.style.left = windowData.originalPosition.x + 'px';
            windowData.element.style.top = windowData.originalPosition.y + 'px';
        } else {
            // Maximize
            windowData.isMaximized = true;
            windowData.element.style.width = '95vw';
            windowData.element.style.height = '95vh';
            windowData.element.style.left = '2.5vw';
            windowData.element.style.top = '2.5vh';
        }
    }

    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        // Animate close
        windowData.element.style.animation = 'window-close 0.3s ease-out';
        
        setTimeout(() => {
            windowData.element.style.display = 'none';
            this.windows.delete(windowId);
        }, 300);
        
        this.addTerminalMessage(`[System] Window closed: ${windowId}`);
    }

    // Utility Methods
    highlightDropZones(e) {
        // Highlight valid drop zones during drag
        const dropTarget = this.findDropTarget(e);
        
        document.querySelectorAll('.drop-highlight').forEach(el => {
            el.classList.remove('drop-highlight');
        });
        
        if (dropTarget) {
            dropTarget.element.classList.add('drop-highlight');
        }
    }

    clearDropZoneHighlights() {
        document.querySelectorAll('.drop-highlight').forEach(el => {
            el.classList.remove('drop-highlight');
        });
    }

    snapBackToOriginal(element) {
        element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.left = this.dragState.startPosition.x + 'px';
        element.style.top = this.dragState.startPosition.y + 'px';
        
        setTimeout(() => {
            element.style.transition = '';
        }, 300);
    }

    updateInventoryDisplay() {
        // Update inventory slot visuals
        this.inventorySlots.forEach((slot) => {
            if (slot.isEmpty) {
                slot.element.classList.remove('has-item');
                slot.element.innerHTML = '';
                slot.element.title = '';
            } else {
                slot.element.classList.add('has-item');
                if (slot.item) {
                    slot.element.innerHTML = slot.item.icon || slot.item.display || '📦';
                    slot.element.title = slot.item.name || 'Item';
                }
            }
        });
    }

    addTerminalMessage(message, type = 'system') {
        const terminalOutput = document.getElementById('terminalOutput') || 
                             document.querySelector('.terminal-output, .mud-terminal-output');
        
        if (terminalOutput) {
            const line = document.createElement('div');
            line.className = `terminal-line mud-line ${type}`;
            line.textContent = message;
            
            terminalOutput.appendChild(line);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
            
            // Keep only last 20 lines
            const lines = terminalOutput.querySelectorAll('.terminal-line, .mud-line');
            if (lines.length > 20) {
                lines[0].remove();
            }
        }
    }

    getWindowIdFromElement(element) {
        for (const [id, data] of this.windows) {
            if (data.element === element) {
                return id;
            }
        }
        return null;
    }

    handleWindowResize() {
        // Reposition windows if they're outside viewport
        this.windows.forEach((windowData) => {
            const element = windowData.element;
            const rect = element.getBoundingClientRect();
            
            if (rect.right > window.innerWidth) {
                element.style.left = (window.innerWidth - rect.width - 20) + 'px';
            }
            
            if (rect.bottom > window.innerHeight) {
                element.style.top = (window.innerHeight - rect.height - 20) + 'px';
            }
        });
    }

    // Touch handling for mobile
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const element = touch.target.closest('.draggable');
            
            if (element) {
                this.startDrag(touch, element);
            }
        }
    }

    handleTouchMove(e) {
        if (this.dragState.isDragging && e.touches.length === 1) {
            e.preventDefault();
            this.updateDrag(e.touches[0]);
        }
    }

    handleTouchEnd(e) {
        if (this.dragState.isDragging) {
            // Use the last known position for drop detection
            this.endDrag(this.dragState.lastTouchEvent || e);
        }
    }

    // Public API
    createWindow(config) {
        const windowId = config.id || `window-${Date.now()}`;
        
        const windowHTML = `
            <div class="mud-window" data-window-id="${windowId}">
                <div class="mud-titlebar">
                    <div class="mud-title">${config.title || 'Untitled'}</div>
                    <div class="mud-controls">
                        <div class="mud-control-btn minimize">−</div>
                        <div class="mud-control-btn maximize">□</div>
                        <div class="mud-control-btn close">×</div>
                    </div>
                </div>
                <div class="mud-content">
                    ${config.content || ''}
                </div>
            </div>
        `;
        
        const windowElement = document.createElement('div');
        windowElement.innerHTML = windowHTML;
        const window = windowElement.firstElementChild;
        
        // Position window
        window.style.position = 'absolute';
        window.style.left = (config.x || 100) + 'px';
        window.style.top = (config.y || 100) + 'px';
        window.style.width = (config.width || 300) + 'px';
        window.style.height = (config.height || 200) + 'px';
        
        document.body.appendChild(window);
        this.registerWindow(windowId, window);
        this.setupWindowControls(window);
        
        return windowId;
    }

    getStatus() {
        return {
            windows: this.windows.size,
            inventorySlots: this.inventorySlots.size,
            occupiedSlots: Array.from(this.inventorySlots.values()).filter(slot => !slot.isEmpty).length,
            isDragging: this.dragState.isDragging,
            trashBinActive: !!this.trashBin
        };
    }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    window.overlayManager = new OverlayManager();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OverlayManager;
}
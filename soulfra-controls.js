/**
 * SOULFRA VISUAL CONTROLS
 * 
 * Interactive control elements that make managing services feel like playing a board game.
 * Light switches, dropdowns, drag-and-drop connections, and status indicators.
 */

class SoulFraControls {
    constructor() {
        this.activeAnimations = new Map();
        this.connectionLines = new Map();
        this.dragState = null;
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Initializing SoulFra Controls...');
        
        // Set up drag and drop
        this.setupDragAndDrop();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Set up hover effects
        this.setupHoverEffects();
        
        console.log('✅ Visual controls ready');
    }
    
    // === LIGHT SWITCH CONTROLS ===
    
    createLightSwitch(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const switchElement = document.createElement('div');
        switchElement.className = `light-switch ${options.initialState ? 'on' : ''}`;
        switchElement.innerHTML = '<div class="switch-handle"></div>';
        
        // Add event handlers
        switchElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLightSwitch(switchElement, options.onToggle);
        });
        
        // Add touch support for mobile
        switchElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleLightSwitch(switchElement, options.onToggle);
        });
        
        container.appendChild(switchElement);
        return switchElement;
    }
    
    toggleLightSwitch(switchElement, callback) {
        const isOn = switchElement.classList.contains('on');
        
        // Add animation class
        switchElement.classList.add('switching');
        
        setTimeout(() => {
            switchElement.classList.toggle('on');
            switchElement.classList.remove('switching');
            
            if (callback) {
                callback(!isOn);
            }
            
            // Create sparkle effect
            this.createSparkleEffect(switchElement);
        }, 150);
    }
    
    setLightSwitchState(switchElement, isOn) {
        if (isOn) {
            switchElement.classList.add('on');
        } else {
            switchElement.classList.remove('on');
        }
    }
    
    // === DROPDOWN MENUS ===
    
    createDropdown(containerId, items, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'soulfra-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-trigger">
                ${options.icon || '⚙️'} ${options.label || 'Options'}
                <span class="dropdown-arrow">▼</span>
            </div>
            <div class="dropdown-menu">
                ${items.map(item => `
                    <div class="dropdown-item" data-value="${item.value}">
                        ${item.icon || ''} ${item.label}
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add styles
        dropdown.style.cssText = `
            position: relative;
            display: inline-block;
        `;
        
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        // Style the trigger
        trigger.style.cssText = `
            padding: 0.5rem 1rem;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
        `;
        
        // Style the menu
        menu.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            background: rgba(0,0,0,0.9);
            border-radius: 8px;
            min-width: 150px;
            padding: 0.5rem;
            display: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 1000;
        `;
        
        // Style dropdown items
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.style.cssText = `
                padding: 0.5rem;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.9rem;
                color: white;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255,255,255,0.1)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                if (options.onSelect) {
                    options.onSelect(value, item);
                }
                this.hideDropdown(dropdown);
            });
        });
        
        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown(dropdown);
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.hideDropdown(dropdown);
        });
        
        container.appendChild(dropdown);
        return dropdown;
    }
    
    toggleDropdown(dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        const arrow = dropdown.querySelector('.dropdown-arrow');
        
        if (menu.style.display === 'none' || !menu.style.display) {
            this.showDropdown(dropdown);
        } else {
            this.hideDropdown(dropdown);
        }
    }
    
    showDropdown(dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        const arrow = dropdown.querySelector('.dropdown-arrow');
        
        menu.style.display = 'block';
        menu.style.animation = 'dropdownSlide 0.3s ease-out';
        arrow.style.transform = 'rotate(180deg)';
        
        // Close other dropdowns
        document.querySelectorAll('.soulfra-dropdown .dropdown-menu').forEach(otherMenu => {
            if (otherMenu !== menu) {
                otherMenu.style.display = 'none';
            }
        });
    }
    
    hideDropdown(dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        const arrow = dropdown.querySelector('.dropdown-arrow');
        
        menu.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
    
    // === STATUS INDICATORS ===
    
    createStatusIndicator(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const indicator = document.createElement('div');
        indicator.className = 'status-indicator';
        indicator.innerHTML = `
            <div class="status-dot ${options.status || 'offline'}"></div>
            <span class="status-label">${options.label || 'Status'}</span>
        `;
        
        indicator.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
        `;
        
        const dot = indicator.querySelector('.status-dot');
        dot.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            transition: all 0.3s ease;
        `;
        
        this.updateStatusIndicator(indicator, options.status || 'offline');
        
        container.appendChild(indicator);
        return indicator;
    }
    
    updateStatusIndicator(indicator, status) {
        const dot = indicator.querySelector('.status-dot');
        
        // Remove existing status classes
        dot.classList.remove('online', 'offline', 'warning', 'connecting');
        dot.classList.add(status);
        
        const colors = {
            online: '#4ecdc4',
            offline: '#ff6b6b',
            warning: '#feca57',
            connecting: '#74b9ff'
        };
        
        dot.style.backgroundColor = colors[status] || colors.offline;
        
        if (status === 'connecting') {
            dot.style.animation = 'statusPulse 1.5s ease-in-out infinite';
        } else {
            dot.style.animation = 'none';
        }
    }
    
    // === CONNECTION LINES ===
    
    createConnectionLine(fromElement, toElement, options = {}) {
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        
        const fromX = fromRect.left + fromRect.width / 2;
        const fromY = fromRect.top + fromRect.height / 2;
        const toX = toRect.left + toRect.width / 2;
        const toY = toRect.top + toRect.height / 2;
        
        const line = document.createElement('div');
        line.className = 'connection-line';
        
        const length = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
        const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
        
        line.style.cssText = `
            position: absolute;
            width: ${length}px;
            height: 2px;
            left: ${fromX}px;
            top: ${fromY}px;
            transform: rotate(${angle}deg);
            transform-origin: 0 50%;
            background: linear-gradient(90deg, ${options.color || '#4ecdc4'}, ${options.endColor || '#44a08d'});
            opacity: ${options.opacity || 0.7};
            z-index: 1;
            pointer-events: none;
        `;
        
        if (options.animated !== false) {
            line.style.animation = 'connectionFlow 2s ease-in-out infinite';
        }
        
        document.body.appendChild(line);
        
        const lineId = `${fromElement.id || 'from'}-${toElement.id || 'to'}`;
        this.connectionLines.set(lineId, line);
        
        return line;
    }
    
    removeConnectionLine(lineId) {
        const line = this.connectionLines.get(lineId);
        if (line) {
            line.remove();
            this.connectionLines.delete(lineId);
        }
    }
    
    clearAllConnectionLines() {
        this.connectionLines.forEach(line => line.remove());
        this.connectionLines.clear();
    }
    
    // === DRAG AND DROP ===
    
    setupDragAndDrop() {
        // Make service nodes draggable
        document.addEventListener('mousedown', (e) => {
            const serviceNode = e.target.closest('.service-node');
            if (serviceNode && !e.target.closest('.light-switch, .dropdown-menu')) {
                this.startDrag(serviceNode, e);
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.dragState) {
                this.handleDrag(e);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.dragState) {
                this.endDrag(e);
            }
        });
    }
    
    startDrag(element, event) {
        this.dragState = {
            element,
            startX: event.clientX,
            startY: event.clientY,
            elementStartX: element.offsetLeft,
            elementStartY: element.offsetTop,
            isDragging: false
        };
        
        element.style.cursor = 'grabbing';
        event.preventDefault();
    }
    
    handleDrag(event) {
        if (!this.dragState) return;
        
        const deltaX = event.clientX - this.dragState.startX;
        const deltaY = event.clientY - this.dragState.startY;
        
        // Start dragging if moved enough
        if (!this.dragState.isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            this.dragState.isDragging = true;
            this.dragState.element.style.zIndex = '1000';
            this.dragState.element.style.transform = 'scale(1.1)';
        }
        
        if (this.dragState.isDragging) {
            const newX = this.dragState.elementStartX + deltaX;
            const newY = this.dragState.elementStartY + deltaY;
            
            this.dragState.element.style.left = newX + 'px';
            this.dragState.element.style.top = newY + 'px';
            
            // Update connection lines
            this.updateConnectionLines();
        }
    }
    
    endDrag(event) {
        if (!this.dragState) return;
        
        const { element, isDragging } = this.dragState;
        
        if (isDragging) {
            // Check for drop targets
            const dropTarget = this.findDropTarget(event.clientX, event.clientY, element);
            
            if (dropTarget) {
                this.handleDrop(element, dropTarget);
            }
            
            // Reset styles
            element.style.zIndex = '';
            element.style.transform = '';
        }
        
        element.style.cursor = '';
        this.dragState = null;
    }
    
    findDropTarget(x, y, draggedElement) {
        const elements = document.elementsFromPoint(x, y);
        return elements.find(el => 
            el.classList.contains('service-node') && 
            el !== draggedElement
        );
    }
    
    handleDrop(draggedElement, dropTarget) {
        const draggedService = draggedElement.dataset.service;
        const targetService = dropTarget.dataset.service;
        
        if (draggedService && targetService) {
            this.createServiceConnection(draggedService, targetService);
        }
    }
    
    createServiceConnection(service1, service2) {
        // Create visual connection
        const element1 = document.querySelector(`[data-service="${service1}"]`);
        const element2 = document.querySelector(`[data-service="${service2}"]`);
        
        if (element1 && element2) {
            this.createConnectionLine(element1, element2, {
                color: '#ff6b6b',
                endColor: '#feca57'
            });
            
            // Trigger connection event
            this.triggerServiceConnection(service1, service2);
        }
    }
    
    triggerServiceConnection(service1, service2) {
        console.log(`🔗 Connecting ${service1} to ${service2}`);
        
        // Dispatch custom event
        const event = new CustomEvent('serviceConnection', {
            detail: { service1, service2 }
        });
        document.dispatchEvent(event);
    }
    
    updateConnectionLines() {
        // Redraw all connection lines when nodes move
        this.connectionLines.forEach((line, lineId) => {
            const [fromId, toId] = lineId.split('-');
            const fromElement = document.getElementById(fromId) || document.querySelector(`[data-service="${fromId}"]`);
            const toElement = document.getElementById(toId) || document.querySelector(`[data-service="${toId}"]`);
            
            if (fromElement && toElement) {
                line.remove();
                this.connectionLines.delete(lineId);
                this.createConnectionLine(fromElement, toElement);
            }
        });
    }
    
    // === ANIMATIONS AND EFFECTS ===
    
    createSparkleEffect(element) {
        const sparkles = [];
        const numSparkles = 6;
        
        for (let i = 0; i < numSparkles; i++) {
            const sparkle = document.createElement('div');
            sparkle.innerHTML = '✨';
            sparkle.style.cssText = `
                position: absolute;
                pointer-events: none;
                font-size: 12px;
                z-index: 1000;
                animation: sparkleFloat 1s ease-out forwards;
            `;
            
            const rect = element.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            
            sparkle.style.left = startX + 'px';
            sparkle.style.top = startY + 'px';
            
            document.body.appendChild(sparkle);
            sparkles.push(sparkle);
            
            // Random direction
            const angle = (i / numSparkles) * 2 * Math.PI;
            const distance = 30 + Math.random() * 20;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;
            
            sparkle.animate([
                { transform: 'translate(0, 0) scale(0)', opacity: 1 },
                { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'ease-out'
            }).onfinish = () => {
                sparkle.remove();
            };
        }
    }
    
    pulseElement(element, options = {}) {
        const animationId = `pulse-${Date.now()}`;
        
        const animation = element.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.1)', opacity: 0.8 },
            { transform: 'scale(1)', opacity: 1 }
        ], {
            duration: options.duration || 1000,
            iterations: options.iterations || 3,
            easing: 'ease-in-out'
        });
        
        this.activeAnimations.set(animationId, animation);
        
        animation.onfinish = () => {
            this.activeAnimations.delete(animationId);
        };
        
        return animationId;
    }
    
    // === KEYBOARD SHORTCUTS ===
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Service shortcuts (numbers 1-6)
            if (e.key >= '1' && e.key <= '6') {
                const serviceIndex = parseInt(e.key) - 1;
                const serviceNodes = document.querySelectorAll('.service-node');
                if (serviceNodes[serviceIndex]) {
                    serviceNodes[serviceIndex].click();
                }
                e.preventDefault();
            }
            
            // Other shortcuts
            switch (e.key.toLowerCase()) {
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (window.refreshAll) window.refreshAll();
                    }
                    break;
                
                case 'v':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (window.toggleVoiceControl) window.toggleVoiceControl();
                    }
                    break;
                
                case 'h':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.showKeyboardHelp();
                    }
                    break;
            }
        });
    }
    
    showKeyboardHelp() {
        const helpModal = document.createElement('div');
        helpModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        
        helpModal.innerHTML = `
            <div style="background: #1a1a1a; padding: 2rem; border-radius: 15px; max-width: 500px; color: white;">
                <h3 style="margin-bottom: 1rem;">🎮 Keyboard Shortcuts</h3>
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; font-size: 0.9rem;">
                    <strong>1-6</strong><span>Select service nodes</span>
                    <strong>Ctrl+R</strong><span>Refresh all services</span>
                    <strong>Ctrl+V</strong><span>Toggle voice control</span>
                    <strong>Ctrl+H</strong><span>Show this help</span>
                    <strong>Drag</strong><span>Move and connect services</span>
                    <strong>Click</strong><span>Interact with controls</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4ecdc4; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(helpModal);
        
        // Close on escape or click outside
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.remove();
            }
        });
        
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                helpModal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }
    
    // === HOVER EFFECTS ===
    
    setupHoverEffects() {
        // Add hover effects to service nodes
        document.addEventListener('mouseover', (e) => {
            const serviceNode = e.target.closest('.service-node');
            if (serviceNode) {
                this.addHoverGlow(serviceNode);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            const serviceNode = e.target.closest('.service-node');
            if (serviceNode) {
                this.removeHoverGlow(serviceNode);
            }
        });
    }
    
    addHoverGlow(element) {
        element.style.filter = 'drop-shadow(0 0 20px rgba(78, 205, 196, 0.5))';
        element.style.transition = 'all 0.3s ease';
    }
    
    removeHoverGlow(element) {
        element.style.filter = '';
    }
    
    // === UTILITY METHODS ===
    
    stopAllAnimations() {
        this.activeAnimations.forEach(animation => {
            animation.cancel();
        });
        this.activeAnimations.clear();
    }
    
    getActiveAnimations() {
        return Array.from(this.activeAnimations.keys());
    }
    
    cleanup() {
        this.stopAllAnimations();
        this.clearAllConnectionLines();
        this.dragState = null;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes dropdownSlide {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes statusPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes connectionFlow {
        0% { opacity: 0.3; }
        50% { opacity: 0.8; }
        100% { opacity: 0.3; }
    }
    
    @keyframes sparkleFloat {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(1); opacity: 0; }
    }
    
    .light-switch.switching {
        transform: scale(1.1);
    }
    
    .service-node:hover {
        transform: scale(1.05) translateY(-2px);
    }
    
    .dropdown-trigger:hover {
        background: rgba(255,255,255,0.2) !important;
    }
`;

if (document.head) {
    document.head.appendChild(style);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.appendChild(style);
    });
}

// === SERVICE INTERACTION FUNCTIONS ===

// Handle service node clicks
function handleServiceClick(service) {
    console.log(`🎯 Service clicked: ${service}`);
    
    if (service === 'git') {
        showGitRepositoryInfo();
    } else {
        // Update service info panel
        updateServiceInfo(service);
    }
}

// Toggle service light switches
function toggleService(service, event) {
    event.stopPropagation();
    
    const switchElement = event.target.closest('.light-switch');
    const isOn = switchElement.classList.contains('on');
    
    if (isOn) {
        switchElement.classList.remove('on');
        disconnectService(service);
    } else {
        switchElement.classList.add('on');
        connectService(service);
    }
}

// Login to a service
async function loginService(service) {
    try {
        console.log(`🔑 Logging into ${service}...`);
        
        const response = await fetch(`http://localhost:8463/auth/${service}/login`, {
            method: 'POST'
        });
        
        if (response.ok) {
            updateServiceStatus(service, 'Connected');
            showNotification(`✅ Successfully logged into ${service}`);
        } else {
            throw new Error(`Failed to login to ${service}`);
        }
    } catch (error) {
        console.error(`❌ Login failed for ${service}:`, error);
        showNotification(`❌ Failed to login to ${service}`);
    }
}

// Logout from a service
async function logoutService(service) {
    try {
        console.log(`🚪 Logging out of ${service}...`);
        
        const response = await fetch(`http://localhost:8463/auth/${service}/logout`, {
            method: 'POST'
        });
        
        if (response.ok) {
            updateServiceStatus(service, 'Disconnected');
            showNotification(`👋 Logged out of ${service}`);
        }
    } catch (error) {
        console.error(`❌ Logout failed for ${service}:`, error);
    }
}

// Show service token (masked)
async function showToken(service) {
    try {
        const response = await fetch(`http://localhost:8463/auth/${service}/token`);
        
        if (response.ok) {
            const data = await response.json();
            const maskedToken = data.token ? 
                data.token.substring(0, 8) + '...' + data.token.substring(data.token.length - 4) :
                'No token';
            
            alert(`${service} token: ${maskedToken}`);
        } else {
            alert(`No ${service} token available`);
        }
    } catch (error) {
        alert(`Failed to get ${service} token`);
    }
}

// === GIT SERVICE FUNCTIONS ===

// Handle Git service actions
async function gitAction(action) {
    try {
        console.log(`🌳 Git action: ${action}`);
        
        switch (action) {
            case 'status':
                await showGitStatus();
                break;
            case 'branch':
                await createGitBranch();
                break;
            case 'commit':
                await gitSmartCommit();
                break;
            case 'push':
                await gitPushWithPR();
                break;
            case 'permission-public':
                await setGitPermission('public');
                break;
            case 'permission-remixable':
                await setGitPermission('remixable');
                break;
            case 'permission-private':
                await setGitPermission('private');
                break;
            case 'sync':
                await gitSync();
                break;
            default:
                console.warn(`Unknown git action: ${action}`);
        }
    } catch (error) {
        console.error(`❌ Git action failed:`, error);
        showNotification(`❌ Git ${action} failed: ${error.message}`);
    }
}

// Show Git repository status
async function showGitStatus() {
    try {
        showNotification('📊 Checking repository status...');
        
        // Create a status modal
        const modal = createModal('🌳 Repository Status', `
            <div class="git-status-info">
                <div class="status-loading">
                    <div class="spinner"></div>
                    <p>Loading repository information...</p>
                </div>
            </div>
        `);
        
        document.body.appendChild(modal);
        
        // Simulate getting status (in real implementation, this would call the CLI)
        setTimeout(() => {
            const statusContent = `
                <div class="git-status-details">
                    <h3>📂 Current Repository</h3>
                    <p><strong>Branch:</strong> <span class="highlight">main</span></p>
                    <p><strong>Status:</strong> <span class="status-clean">Clean working tree</span></p>
                    <p><strong>Permission:</strong> <span class="permission-public">🌐 Public</span></p>
                    
                    <h3>🔄 Recent Activity</h3>
                    <div class="recent-commits">
                        <p>• feat: add SoulFra Git integration</p>
                        <p>• docs: update README with voice commands</p>
                        <p>• fix: improve error handling</p>
                    </div>
                    
                    <div class="quick-actions">
                        <button onclick="gitAction('branch')" class="git-btn">🌿 New Branch</button>
                        <button onclick="gitAction('commit')" class="git-btn">💾 Commit</button>
                        <button onclick="gitAction('push')" class="git-btn">🚀 Push</button>
                    </div>
                </div>
            `;
            
            modal.querySelector('.git-status-info').innerHTML = statusContent;
        }, 1000);
        
    } catch (error) {
        showNotification(`❌ Failed to get status: ${error.message}`);
    }
}

// Create new Git branch with voice input
async function createGitBranch() {
    const branchName = prompt('Enter branch name (leave empty for AI generation):');
    
    try {
        showNotification('🌿 Creating branch...');
        
        // Simulate branch creation
        setTimeout(() => {
            const finalName = branchName || `feature/voice-request-${Date.now()}`;
            showNotification(`✅ Branch created: ${finalName}`);
            
            // Update learning system
            if (window.soulFraLearningEngine) {
                window.soulFraLearningEngine.logActivity('git_mastery', 'branch_creation', {
                    branchName: finalName,
                    method: 'board-game'
                });
            }
        }, 1500);
        
    } catch (error) {
        showNotification(`❌ Failed to create branch: ${error.message}`);
    }
}

// Smart commit with AI message
async function gitSmartCommit() {
    const message = prompt('Commit message (leave empty for AI generation):');
    
    try {
        showNotification('💾 Creating smart commit...');
        
        // Simulate AI commit message generation
        setTimeout(() => {
            const finalMessage = message || 'feat: add voice-controlled Git operations';
            showNotification(`✅ Committed: ${finalMessage}`);
            
            // Update learning system
            if (window.soulFraLearningEngine) {
                window.soulFraLearningEngine.logActivity('git_mastery', 'commit_creation', {
                    message: finalMessage,
                    aiGenerated: !message,
                    method: 'board-game'
                });
            }
        }, 2000);
        
    } catch (error) {
        showNotification(`❌ Commit failed: ${error.message}`);
    }
}

// Push with automatic PR creation
async function gitPushWithPR() {
    try {
        showNotification('🚀 Pushing and creating PR...');
        
        // Simulate push and PR creation
        setTimeout(() => {
            showNotification('✅ Pushed successfully');
            
            setTimeout(() => {
                showNotification('🎉 Pull request created: #42');
            }, 1000);
        }, 2000);
        
    } catch (error) {
        showNotification(`❌ Push failed: ${error.message}`);
    }
}

// Set branch permissions
async function setGitPermission(level) {
    try {
        showNotification(`🔒 Setting permission to ${level}...`);
        
        // Simulate permission change
        setTimeout(() => {
            showNotification(`✅ Branch is now ${level}`);
            updateGitPermissionDisplay(level);
            
            // Update learning system
            if (window.soulFraLearningEngine) {
                window.soulFraLearningEngine.logActivity('git_mastery', 'permission_change', {
                    level,
                    method: 'board-game'
                });
            }
        }, 1500);
        
    } catch (error) {
        showNotification(`❌ Permission change failed: ${error.message}`);
    }
}

// Sync repository
async function gitSync() {
    try {
        showNotification('🔄 Syncing repository...');
        
        // Simulate sync
        setTimeout(() => {
            showNotification('✅ Repository synced');
        }, 2000);
        
    } catch (error) {
        showNotification(`❌ Sync failed: ${error.message}`);
    }
}

// Show Git repository information
async function showGitRepositoryInfo() {
    try {
        // Create modal with repository info
        const modal = createModal('🌳 SoulFra Git', `
            <div class="git-info">
                <h3>Voice-Controlled Git Operations</h3>
                <p>Transform Git from a technical tool into an intelligent, voice-controlled collaboration platform.</p>
                
                <h3>🎤 Voice Commands</h3>
                <div class="voice-commands">
                    <p>"<strong>SoulFra create branch [name]</strong>" - Create new branch</p>
                    <p>"<strong>SoulFra commit changes</strong>" - Smart commit with AI message</p>
                    <p>"<strong>SoulFra make branch public</strong>" - Change permission level</p>
                    <p>"<strong>SoulFra push code</strong>" - Push with auto-PR creation</p>
                    <p>"<strong>SoulFra show repository status</strong>" - Display status</p>
                </div>
                
                <h3>🎮 Board Game Controls</h3>
                <div class="git-actions">
                    <button onclick="gitAction('status')" class="git-btn">📊 Status</button>
                    <button onclick="gitAction('branch')" class="git-btn">🌿 Branch</button>
                    <button onclick="gitAction('commit')" class="git-btn">💾 Commit</button>
                    <button onclick="gitAction('push')" class="git-btn">🚀 Push</button>
                </div>
                
                <h3>🔒 Permission Levels</h3>
                <div class="permission-buttons">
                    <button onclick="gitAction('permission-private')" class="perm-btn private">🔒 Private</button>
                    <button onclick="gitAction('permission-public')" class="perm-btn public">🌐 Public</button>
                    <button onclick="gitAction('permission-remixable')" class="perm-btn remixable">🎨 Remixable</button>
                </div>
                
                <p><small>💡 Use voice commands or click these buttons to control your repository</small></p>
            </div>
        `);
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Failed to show git info:', error);
    }
}

// Update Git permission display
function updateGitPermissionDisplay(level) {
    const statusElement = document.getElementById('git-status');
    if (statusElement) {
        const icons = {
            'private': '🔒 Private',
            'public': '🌐 Public',
            'remixable': '🎨 Remixable',
            'opensource': '🌍 Open Source'
        };
        
        statusElement.textContent = icons[level] || '🌳 Ready';
        statusElement.className = `service-status permission-${level}`;
    }
}

// === GITHUB WRAPPER INTEGRATION ===

// Open GitHub Desktop wrapper
function openGitHubWrapper() {
    try {
        // Try to open the wrapper
        window.open('http://localhost:3337', '_blank');
        showNotification('📦 Opening GitHub Desktop wrapper...');
    } catch (error) {
        console.error('Failed to open GitHub wrapper:', error);
        showNotification('❌ GitHub Desktop wrapper not available');
    }
}

// === UTILITY FUNCTIONS ===

// Update service status display
function updateServiceStatus(service, status) {
    const statusElement = document.getElementById(`${service}-status`);
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `service-status ${status.toLowerCase().replace(/[^a-z]/g, '-')}`;
    }
}

// Update service info panel
function updateServiceInfo(service) {
    console.log(`📊 Updating info for ${service}`);
    // Implementation for service info panel
}

// Connect service
function connectService(service) {
    console.log(`🔌 Connecting ${service}`);
    updateServiceStatus(service, 'Connecting...');
    
    // Simulate connection
    setTimeout(() => {
        updateServiceStatus(service, 'Connected');
        showNotification(`✅ ${service} connected`);
    }, 1000);
}

// Disconnect service
function disconnectService(service) {
    console.log(`🔌 Disconnecting ${service}`);
    updateServiceStatus(service, 'Disconnected');
    showNotification(`📴 ${service} disconnected`);
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-size: 0.9rem;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Create modal
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: rgba(255,255,255,0.1);
        border-radius: 20px;
        padding: 2rem;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
    `;
    
    modalContent.innerHTML = `
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">${title}</h2>
            <button onclick="this.closest('.modal-overlay').remove()" 
                    style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; opacity: 0.7; transition: opacity 0.2s;">×</button>
        </div>
        <div class="modal-body">${content}</div>
    `;
    
    modal.appendChild(modalContent);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close on escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    return modal;
}

// Initialize service interactions when DOM is loaded
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize controls
        window.soulFraControls = new SoulFraControls();
        
        // Check service statuses on load
        setTimeout(checkAllServiceStatuses, 1000);
        
        // Add notification animations
        const notificationStyles = document.createElement('style');
        notificationStyles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .git-btn, .perm-btn {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                color: white;
                padding: 0.5rem 1rem;
                margin: 0.25rem;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.9rem;
            }
            
            .git-btn:hover, .perm-btn:hover {
                background: rgba(255,255,255,0.2);
                transform: translateY(-1px);
            }
            
            .git-actions, .permission-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin: 1rem 0;
            }
            
            .voice-commands {
                background: rgba(0,0,0,0.3);
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
            }
            
            .voice-commands p {
                margin: 0.5rem 0;
                font-family: monospace;
                font-size: 0.9rem;
            }
            
            .highlight {
                color: #4ecdc4;
                font-weight: bold;
            }
            
            .status-clean {
                color: #4ecdc4;
            }
            
            .permission-public {
                color: #feca57;
            }
            
            .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .status-loading {
                text-align: center;
                padding: 2rem;
            }
        `;
        
        document.head.appendChild(notificationStyles);
    });
}

// Check all service statuses
async function checkAllServiceStatuses() {
    const services = ['github', 'git', 'google', 'microsoft', 'teams', 'slack', 'discord'];
    
    for (const service of services) {
        try {
            if (service === 'git') {
                // Special handling for Git service - always ready
                updateServiceStatus('git', 'Ready');
            } else {
                // Check OAuth services
                const response = await fetch(`http://localhost:8463/auth/${service}/status`);
                if (response.ok) {
                    const data = await response.json();
                    updateServiceStatus(service, data.connected ? 'Connected' : 'Available');
                } else {
                    updateServiceStatus(service, 'Available');
                }
            }
        } catch (error) {
            updateServiceStatus(service, service === 'git' ? 'Ready' : 'Available');
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoulFraControls;
}
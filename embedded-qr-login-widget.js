/**
 * 🔐 EMBEDDED QR LOGIN WIDGET
 * One-line embed for any website to enable device-based login
 * 
 * "how do we embed that login then as the website login button or widget? 
 * that way once someone scans it cal can spawn or whatever and start working 
 * with them towards their journey"
 * 
 * Usage: <script src="https://yoursite.com/widget.js"></script>
 */

(function() {
  'use strict';
  
  // Widget configuration
  const WIDGET_CONFIG = {
    apiUrl: window.SOULFRA_API_URL || 'http://localhost:12345',
    wsUrl: window.SOULFRA_WS_URL || 'ws://localhost:12346',
    pairingUrl: window.SOULFRA_PAIRING_URL || 'http://localhost:11111',
    theme: window.SOULFRA_THEME || 'default',
    position: window.SOULFRA_POSITION || 'bottom-right',
    autoShow: window.SOULFRA_AUTO_SHOW || false
  };

  // Character configurations
  const CHARACTERS = {
    cal: {
      name: 'Cal',
      emoji: '📊',
      role: 'Systems Orchestrator',
      greeting: "Hey! I'm Cal, your systems guide. I'll help you navigate the technical paths and find your perfect role.",
      specialties: ['DevOps', 'System Architecture', 'Database Design', 'Cloud Infrastructure'],
      jobCategories: ['engineering', 'devops', 'architecture', 'infrastructure']
    },
    arty: {
      name: 'Arty',
      emoji: '🎨',
      role: 'Creative Visionary',
      greeting: "Welcome! I'm Arty, your creative companion. Let's explore your artistic side and find where you shine.",
      specialties: ['UI/UX Design', 'Brand Strategy', 'Creative Direction', 'Digital Art'],
      jobCategories: ['design', 'creative', 'ux', 'marketing']
    },
    ralph: {
      name: 'Ralph',
      emoji: '⚔️',
      role: 'Strategic Commander',
      greeting: "Greetings warrior! I'm Ralph, master of strategy. Together we'll conquer the business battlefield.",
      specialties: ['Business Strategy', 'Product Management', 'Competitive Analysis', 'Leadership'],
      jobCategories: ['management', 'strategy', 'product', 'leadership']
    },
    vera: {
      name: 'Vera',
      emoji: '🔬',
      role: 'Research Pioneer',
      greeting: "Hello! I'm Vera, your research guide. Let's discover insights and push the boundaries of knowledge.",
      specialties: ['Data Science', 'Machine Learning', 'Research', 'Analytics'],
      jobCategories: ['data', 'research', 'analytics', 'science']
    },
    paulo: {
      name: 'Paulo',
      emoji: '💼',
      role: 'Business Architect',
      greeting: "Good to meet you! I'm Paulo, your business mentor. Let's build something profitable together.",
      specialties: ['Operations', 'Finance', 'Business Development', 'Process Optimization'],
      jobCategories: ['business', 'operations', 'finance', 'consulting']
    },
    nash: {
      name: 'Nash',
      emoji: '🎭',
      role: 'Narrative Weaver',
      greeting: "Hey there! I'm Nash, master of stories. Let's craft your narrative and connect with the world.",
      specialties: ['Content Strategy', 'Communications', 'Social Media', 'Brand Storytelling'],
      jobCategories: ['marketing', 'content', 'communications', 'social']
    }
  };

  // Widget styles
  const WIDGET_STYLES = `
    .soulfra-widget-container {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .soulfra-widget-container.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .soulfra-widget-container.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    .soulfra-widget-container.top-right {
      top: 20px;
      right: 20px;
    }
    
    .soulfra-widget-container.top-left {
      top: 20px;
      left: 20px;
    }
    
    .soulfra-login-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .soulfra-login-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    
    .soulfra-login-button:active {
      transform: translateY(0);
    }
    
    .soulfra-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000000;
      animation: fadeIn 0.3s ease;
    }
    
    .soulfra-modal-overlay.active {
      display: flex;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .soulfra-modal {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
      position: relative;
    }
    
    @keyframes slideUp {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .soulfra-modal-close {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      font-size: 30px;
      cursor: pointer;
      color: #666;
      transition: color 0.3s ease;
    }
    
    .soulfra-modal-close:hover {
      color: #000;
    }
    
    .soulfra-modal-title {
      font-size: 28px;
      font-weight: 700;
      text-align: center;
      margin: 0 0 10px 0;
      color: #333;
    }
    
    .soulfra-modal-subtitle {
      font-size: 16px;
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    
    .soulfra-qr-container {
      background: #f8f9fa;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .soulfra-qr-code {
      max-width: 280px;
      width: 100%;
      height: auto;
    }
    
    .soulfra-qr-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 280px;
      color: #666;
    }
    
    .soulfra-spinner {
      border: 3px solid rgba(102, 126, 234, 0.1);
      border-top-color: #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .soulfra-instructions {
      text-align: center;
      font-size: 14px;
      color: #666;
      line-height: 1.6;
    }
    
    .soulfra-character-container {
      display: none;
      text-align: center;
      animation: fadeIn 0.5s ease;
    }
    
    .soulfra-character-avatar {
      font-size: 80px;
      margin-bottom: 20px;
      animation: bounce 1s ease;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    
    .soulfra-character-name {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
    }
    
    .soulfra-character-message {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    
    .soulfra-journey-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 30px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .soulfra-journey-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    
    .soulfra-status {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .soulfra-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #28a745;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `;

  // Widget HTML template
  const WIDGET_HTML = `
    <div class="soulfra-widget-container ${WIDGET_CONFIG.position}">
      <button class="soulfra-login-button" id="soulfraLoginBtn">
        <span>🔐</span>
        <span>Login with Device</span>
      </button>
    </div>
    
    <div class="soulfra-modal-overlay" id="soulfraModal">
      <div class="soulfra-modal">
        <button class="soulfra-modal-close" id="soulfraCloseBtn">&times;</button>
        
        <div id="soulfraQRView">
          <h2 class="soulfra-modal-title">Scan to Login</h2>
          <p class="soulfra-modal-subtitle">No passwords needed - just scan with your paired device</p>
          
          <div class="soulfra-qr-container">
            <div class="soulfra-qr-loading" id="soulfraQRLoading">
              <div class="soulfra-spinner"></div>
            </div>
            <img class="soulfra-qr-code" id="soulfraQRCode" style="display: none;">
          </div>
          
          <div class="soulfra-instructions">
            <p>Open your camera app and scan this code<br>
            First time? You'll pair your devices permanently</p>
          </div>
        </div>
        
        <div class="soulfra-character-container" id="soulfraCharacterView">
          <div class="soulfra-character-avatar" id="soulfraCharacterEmoji"></div>
          <h2 class="soulfra-character-name" id="soulfraCharacterName"></h2>
          <p class="soulfra-character-message" id="soulfraCharacterMessage"></p>
          <button class="soulfra-journey-button" id="soulfraJourneyBtn">
            Begin Your Journey
          </button>
        </div>
        
        <div class="soulfra-status">
          <span class="soulfra-status-dot"></span>
          <span id="soulfraStatus">Connected</span>
        </div>
      </div>
    </div>
  `;

  // Widget class
  class SoulFraLoginWidget {
    constructor() {
      this.ws = null;
      this.sessionId = null;
      this.accountId = null;
      this.selectedCharacter = null;
      this.onLoginCallback = null;
      this.onJourneyCallback = null;
      
      this.injectStyles();
      this.injectHTML();
      this.bindEvents();
      this.initWebSocket();
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = WIDGET_STYLES;
      document.head.appendChild(style);
    }

    injectHTML() {
      const container = document.createElement('div');
      container.innerHTML = WIDGET_HTML;
      document.body.appendChild(container);
    }

    bindEvents() {
      // Login button
      document.getElementById('soulfraLoginBtn').addEventListener('click', () => {
        this.showModal();
      });
      
      // Close button
      document.getElementById('soulfraCloseBtn').addEventListener('click', () => {
        this.hideModal();
      });
      
      // Modal overlay click
      document.getElementById('soulfraModal').addEventListener('click', (e) => {
        if (e.target.id === 'soulfraModal') {
          this.hideModal();
        }
      });
      
      // Journey button
      document.getElementById('soulfraJourneyBtn').addEventListener('click', () => {
        this.startJourney();
      });
    }

    initWebSocket() {
      this.ws = new WebSocket(WIDGET_CONFIG.wsUrl);
      
      this.ws.onopen = () => {
        console.log('Connected to SoulFra authentication service');
        this.updateStatus('Connected');
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };
      
      this.ws.onclose = () => {
        this.updateStatus('Disconnected');
        setTimeout(() => this.initWebSocket(), 3000);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.updateStatus('Connection error');
      };
    }

    handleWebSocketMessage(data) {
      switch (data.type) {
        case 'session_created':
          this.sessionId = data.sessionId;
          break;
          
        case 'qr_ready':
          this.displayQRCode(data.qrCode);
          break;
          
        case 'auth_success':
          this.handleAuthSuccess(data);
          break;
          
        case 'character_assigned':
          this.showCharacter(data.character);
          break;
      }
    }

    showModal() {
      document.getElementById('soulfraModal').classList.add('active');
      this.requestQRCode();
    }

    hideModal() {
      document.getElementById('soulfraModal').classList.remove('active');
    }

    async requestQRCode() {
      try {
        // Show loading
        document.getElementById('soulfraQRLoading').style.display = 'flex';
        document.getElementById('soulfraQRCode').style.display = 'none';
        
        // Request QR from pairing service
        const response = await fetch(`${WIDGET_CONFIG.pairingUrl}/api/pairing/qr`);
        const data = await response.json();
        
        // Add widget callback URL to QR data
        const qrData = JSON.parse(atob(data.qrCode.split(',')[1]));
        qrData.widgetCallback = `${WIDGET_CONFIG.apiUrl}/auth/callback`;
        qrData.sessionId = this.sessionId;
        
        // Display QR
        this.displayQRCode(data.qrCode);
        
        // Send to WebSocket for tracking
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'qr_generated',
            sessionId: this.sessionId,
            pairingToken: data.pairingToken
          }));
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        this.updateStatus('QR generation failed');
      }
    }

    displayQRCode(qrCode) {
      document.getElementById('soulfraQRLoading').style.display = 'none';
      const qrImg = document.getElementById('soulfraQRCode');
      qrImg.src = qrCode;
      qrImg.style.display = 'block';
    }

    async handleAuthSuccess(data) {
      this.accountId = data.accountId;
      
      // Hide QR view
      document.getElementById('soulfraQRView').style.display = 'none';
      
      // Determine character based on user's first interaction
      const character = await this.determineCharacter(data);
      this.showCharacter(character);
      
      // Trigger login callback if set
      if (this.onLoginCallback) {
        this.onLoginCallback({
          accountId: this.accountId,
          sessionId: this.sessionId,
          character: character
        });
      }
      
      // Emit custom event
      window.dispatchEvent(new CustomEvent('soulfra:login', {
        detail: {
          accountId: this.accountId,
          sessionId: this.sessionId,
          character: character
        }
      }));
    }

    async determineCharacter(authData) {
      // Quick personality quiz or analyze existing data
      // For now, random selection weighted by time of day
      const hour = new Date().getHours();
      let characterId;
      
      if (hour >= 6 && hour < 12) {
        // Morning - productive characters
        characterId = ['cal', 'paulo', 'vera'][Math.floor(Math.random() * 3)];
      } else if (hour >= 12 && hour < 17) {
        // Afternoon - creative/strategic
        characterId = ['arty', 'ralph', 'vera'][Math.floor(Math.random() * 3)];
      } else {
        // Evening - social/creative
        characterId = ['nash', 'arty', 'paulo'][Math.floor(Math.random() * 3)];
      }
      
      return characterId;
    }

    showCharacter(characterId) {
      const character = CHARACTERS[characterId];
      if (!character) return;
      
      this.selectedCharacter = characterId;
      
      // Update character display
      document.getElementById('soulfraCharacterEmoji').textContent = character.emoji;
      document.getElementById('soulfraCharacterName').textContent = character.name;
      document.getElementById('soulfraCharacterMessage').textContent = character.greeting;
      
      // Show character view
      document.getElementById('soulfraCharacterView').style.display = 'block';
      
      // Send character selection to server
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'character_selected',
          sessionId: this.sessionId,
          characterId: characterId
        }));
      }
    }

    startJourney() {
      const character = CHARACTERS[this.selectedCharacter];
      
      // Prepare journey data
      const journeyData = {
        accountId: this.accountId,
        sessionId: this.sessionId,
        character: this.selectedCharacter,
        characterData: character,
        startTime: new Date().toISOString()
      };
      
      // Trigger journey callback if set
      if (this.onJourneyCallback) {
        this.onJourneyCallback(journeyData);
      } else {
        // Default: redirect to journey page
        window.location.href = `${WIDGET_CONFIG.apiUrl}/journey?session=${this.sessionId}&character=${this.selectedCharacter}`;
      }
      
      // Emit custom event
      window.dispatchEvent(new CustomEvent('soulfra:journey:start', {
        detail: journeyData
      }));
      
      // Close modal
      this.hideModal();
    }

    updateStatus(status) {
      document.getElementById('soulfraStatus').textContent = status;
    }

    // Public API methods
    onLogin(callback) {
      this.onLoginCallback = callback;
    }

    onJourneyStart(callback) {
      this.onJourneyCallback = callback;
    }

    setTheme(theme) {
      // Update widget theme
      document.querySelector('.soulfra-widget-container').className = 
        `soulfra-widget-container ${WIDGET_CONFIG.position} theme-${theme}`;
    }

    setPosition(position) {
      WIDGET_CONFIG.position = position;
      document.querySelector('.soulfra-widget-container').className = 
        `soulfra-widget-container ${position}`;
    }
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Create global widget instance
    window.SoulFraWidget = new SoulFraLoginWidget();
    
    // Auto-show if configured
    if (WIDGET_CONFIG.autoShow) {
      setTimeout(() => {
        window.SoulFraWidget.showModal();
      }, 1000);
    }
    
    // Expose configuration method
    window.configureSoulFra = function(config) {
      Object.assign(WIDGET_CONFIG, config);
      
      if (config.position) {
        window.SoulFraWidget.setPosition(config.position);
      }
      
      if (config.theme) {
        window.SoulFraWidget.setTheme(config.theme);
      }
    };
  }
})();
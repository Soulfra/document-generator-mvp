/**
 * 💬 GUARDIAN CHAT SYSTEM
 * Terminal-style chat interface for communicating with AI guardians
 */

class GuardianChatSystem {
    constructor() {
        this.messages = [];
        this.commandHistory = [];
        this.historyIndex = -1;
        this.maxMessages = 1000;
        this.chatContainer = null;
        this.inputElement = null;
        this.messagesElement = null;
        this.activeChannel = 'global';
        this.channels = new Map([
            ['global', { name: 'Global', messages: [], members: [] }],
            ['dev', { name: 'Development', messages: [], members: [] }],
            ['design', { name: 'Design', messages: [], members: [] }],
            ['private', { name: 'Private Messages', messages: [], members: [] }]
        ]);
        
        // Message type definitions
        this.messageTypes = {
            GUARDIAN: 'guardian',
            SYSTEM: 'system',
            TOOL: 'tool',
            ERROR: 'error',
            PROJECT: 'project',
            PRIVATE: 'private'
        };
        
        console.log('💬 Guardian Chat System initialized');
    }
    
    initialize(containerId) {
        this.createChatInterface(containerId);
        this.attachEventListeners();
        this.addSystemMessage('Chat system online. Type /help for commands.');
    }
    
    createChatInterface(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Chat container not found:', containerId);
            return;
        }
        
        this.chatContainer = container;
        this.chatContainer.innerHTML = `
            <div class="chat-terminal">
                <div class="chat-header">
                    <div class="chat-title">
                        <span class="terminal-icon">⚡</span>
                        Guardian Terminal
                    </div>
                    <div class="chat-channels">
                        ${Array.from(this.channels.entries()).map(([id, channel]) => `
                            <button class="channel-btn ${id === this.activeChannel ? 'active' : ''}" 
                                    data-channel="${id}">
                                #${channel.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <!-- Messages will be added here -->
                </div>
                
                <div class="chat-input-container">
                    <div class="chat-input-prompt">
                        <span class="prompt-symbol">></span>
                        <span class="prompt-channel">#${this.channels.get(this.activeChannel).name}</span>
                    </div>
                    <input type="text" 
                           class="chat-input" 
                           id="chatInput" 
                           placeholder="Type a message or command..."
                           autocomplete="off">
                </div>
                
                <div class="chat-status-bar">
                    <span class="status-item">
                        <span class="status-icon">👥</span>
                        <span id="onlineCount">0</span> guardians online
                    </span>
                    <span class="status-item">
                        <span class="status-icon">📡</span>
                        <span id="connectionStatus">Connected</span>
                    </span>
                    <span class="status-item">
                        <span class="status-icon">⚡</span>
                        <span id="activityStatus">Ready</span>
                    </span>
                </div>
            </div>
        `;
        
        this.messagesElement = document.getElementById('chatMessages');
        this.inputElement = document.getElementById('chatInput');
        
        // Apply terminal styling
        this.applyTerminalStyles();
    }
    
    applyTerminalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chat-terminal {
                background: #0a0a0a;
                border: 1px solid #00ff00;
                border-radius: 5px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                color: #00ff00;
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
            }
            
            .chat-header {
                background: #1a1a1a;
                border-bottom: 1px solid #00ff00;
                padding: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chat-title {
                font-size: 16px;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .terminal-icon {
                animation: blink 1s infinite;
            }
            
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }
            
            .chat-channels {
                display: flex;
                gap: 10px;
            }
            
            .channel-btn {
                background: transparent;
                border: 1px solid #00ff00;
                color: #00ff00;
                padding: 4px 12px;
                cursor: pointer;
                transition: all 0.3s;
                font-family: inherit;
                font-size: 12px;
            }
            
            .channel-btn:hover {
                background: #00ff00;
                color: #0a0a0a;
            }
            
            .channel-btn.active {
                background: #00ff00;
                color: #0a0a0a;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                background: #0a0a0a;
                scrollbar-width: thin;
                scrollbar-color: #00ff00 #1a1a1a;
            }
            
            .chat-messages::-webkit-scrollbar {
                width: 8px;
            }
            
            .chat-messages::-webkit-scrollbar-track {
                background: #1a1a1a;
            }
            
            .chat-messages::-webkit-scrollbar-thumb {
                background: #00ff00;
                border-radius: 4px;
            }
            
            .chat-message {
                margin-bottom: 10px;
                font-size: 14px;
                line-height: 1.4;
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { 
                    opacity: 0;
                    transform: translateY(5px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .message-timestamp {
                color: #666;
                font-size: 12px;
                margin-right: 8px;
            }
            
            .message-author {
                font-weight: bold;
                margin-right: 8px;
            }
            
            .message-content {
                display: inline;
            }
            
            /* Message type colors */
            .message-guardian .message-author { color: var(--author-color, #00ff00); }
            .message-system { color: #ffff00; }
            .message-tool { color: #00ffff; }
            .message-error { color: #ff0000; }
            .message-project { color: #ff00ff; }
            .message-private { 
                color: #ff69b4; 
                font-style: italic;
            }
            
            .chat-input-container {
                display: flex;
                align-items: center;
                border-top: 1px solid #00ff00;
                background: #1a1a1a;
                padding: 10px;
            }
            
            .chat-input-prompt {
                display: flex;
                align-items: center;
                margin-right: 10px;
                color: #00ff00;
            }
            
            .prompt-symbol {
                margin-right: 5px;
                font-weight: bold;
            }
            
            .prompt-channel {
                font-size: 12px;
                opacity: 0.7;
            }
            
            .chat-input {
                flex: 1;
                background: transparent;
                border: none;
                color: #00ff00;
                font-family: inherit;
                font-size: 14px;
                outline: none;
                caret-color: #00ff00;
            }
            
            .chat-input::placeholder {
                color: #666;
            }
            
            .chat-status-bar {
                background: #0a0a0a;
                border-top: 1px solid #333;
                padding: 8px 15px;
                display: flex;
                gap: 20px;
                font-size: 12px;
                color: #666;
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .status-icon {
                font-size: 14px;
            }
            
            /* Command highlighting */
            .command-text {
                color: #00ffff;
                font-weight: bold;
            }
            
            /* Tool execution animation */
            .tool-execution {
                border-left: 3px solid #00ffff;
                padding-left: 10px;
                margin: 10px 0;
            }
            
            .tool-name {
                color: #00ffff;
                font-weight: bold;
            }
            
            .tool-params {
                color: #888;
                font-size: 12px;
            }
            
            .tool-result {
                margin-top: 5px;
                padding: 5px;
                background: #1a1a1a;
                border-radius: 3px;
                font-size: 12px;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    attachEventListeners() {
        // Input handling
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleInput();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabCompletion();
            }
        });
        
        // Channel switching
        document.querySelectorAll('.channel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChannel(e.target.dataset.channel);
            });
        });
        
        // Focus input on click
        this.chatContainer.addEventListener('click', () => {
            this.inputElement.focus();
        });
    }
    
    handleInput() {
        const input = this.inputElement.value.trim();
        if (!input) return;
        
        // Add to history
        this.commandHistory.push(input);
        this.historyIndex = this.commandHistory.length;
        
        // Clear input
        this.inputElement.value = '';
        
        // Process input
        if (input.startsWith('/')) {
            this.processCommand(input);
        } else {
            this.sendMessage(input);
        }
    }
    
    processCommand(command) {
        const [cmd, ...args] = command.slice(1).split(' ');
        const arg = args.join(' ');
        
        switch (cmd.toLowerCase()) {
            case 'help':
                this.showHelp();
                break;
                
            case 'clear':
                this.clearChat();
                break;
                
            case 'assign':
                this.assignTask(arg);
                break;
                
            case 'tool':
                this.executeTool(arg);
                break;
                
            case 'project':
                this.handleProjectCommand(args);
                break;
                
            case 'status':
                this.showStatus();
                break;
                
            case 'dm':
            case 'msg':
                this.sendPrivateMessage(args);
                break;
                
            case 'collaborate':
                this.initiateCollaboration(args);
                break;
                
            case 'list':
                this.listGuardians();
                break;
                
            default:
                this.addMessage({
                    type: this.messageTypes.ERROR,
                    content: `Unknown command: ${cmd}. Type /help for available commands.`
                });
        }
    }
    
    showHelp() {
        const helpText = `
Available Commands:
  /help              - Show this help message
  /clear             - Clear chat history
  /assign @guardian  - Assign task to guardian
  /tool <name>       - Execute MCP tool
  /project <action>  - Project management (create, load, save)
  /status            - Show all guardian statuses
  /dm @guardian msg  - Send private message
  /collaborate @g1   - Start collaboration session
  /list              - List all online guardians
  
Keyboard Shortcuts:
  Up/Down Arrow      - Navigate command history
  Tab                - Auto-complete guardian names
  Enter              - Send message
        `.trim();
        
        this.addMessage({
            type: this.messageTypes.SYSTEM,
            content: helpText
        });
    }
    
    sendMessage(content, author = 'You') {
        this.addMessage({
            type: this.messageTypes.GUARDIAN,
            author: author,
            content: content,
            color: author === 'You' ? '#00ff00' : undefined
        });
        
        // Emit message event for guardian responses
        if (author === 'You') {
            window.dispatchEvent(new CustomEvent('chatMessage', {
                detail: {
                    channel: this.activeChannel,
                    content: content,
                    author: author
                }
            }));
        }
    }
    
    addMessage(message) {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const messageData = {
            ...message,
            timestamp,
            id: Date.now() + Math.random()
        };
        
        // Add to current channel
        const channel = this.channels.get(this.activeChannel);
        channel.messages.push(messageData);
        
        // Limit message history
        if (channel.messages.length > this.maxMessages) {
            channel.messages.shift();
        }
        
        // Render if current channel
        this.renderMessage(messageData);
        this.scrollToBottom();
    }
    
    renderMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message message-${message.type}`;
        
        let content = '';
        
        // Timestamp
        content += `<span class="message-timestamp">[${message.timestamp}]</span>`;
        
        // Author (if applicable)
        if (message.author) {
            const color = message.color || this.getGuardianColor(message.author);
            content += `<span class="message-author" style="--author-color: ${color}">${message.author}:</span>`;
        }
        
        // Content
        if (message.type === this.messageTypes.TOOL) {
            content += this.renderToolExecution(message);
        } else {
            content += `<span class="message-content">${this.formatMessage(message.content)}</span>`;
        }
        
        messageEl.innerHTML = content;
        this.messagesElement.appendChild(messageEl);
    }
    
    renderToolExecution(message) {
        return `
            <div class="tool-execution">
                <div>
                    <span class="tool-name">${message.toolName}</span>
                    <span class="tool-params">(${JSON.stringify(message.params)})</span>
                </div>
                ${message.result ? `
                    <div class="tool-result">
                        ${message.result}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    formatMessage(content) {
        // Highlight commands
        content = content.replace(/\/\w+/g, '<span class="command-text">$&</span>');
        
        // Highlight @mentions
        content = content.replace(/@\w+/g, '<span style="color: #00ffff; font-weight: bold;">$&</span>');
        
        // Convert line breaks
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }
    
    getGuardianColor(name) {
        // Generate consistent color for guardian based on name
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB86FC', '#03DAC6'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
    
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        this.historyIndex = Math.max(0, Math.min(this.commandHistory.length, this.historyIndex + direction));
        
        if (this.historyIndex < this.commandHistory.length) {
            this.inputElement.value = this.commandHistory[this.historyIndex];
        } else {
            this.inputElement.value = '';
        }
    }
    
    handleTabCompletion() {
        const input = this.inputElement.value;
        const lastWord = input.split(' ').pop();
        
        if (lastWord.startsWith('@')) {
            // Auto-complete guardian names
            const guardianName = lastWord.slice(1);
            const matches = this.findGuardianMatches(guardianName);
            
            if (matches.length === 1) {
                const completed = input.replace(lastWord, '@' + matches[0]);
                this.inputElement.value = completed + ' ';
            } else if (matches.length > 1) {
                this.addSystemMessage(`Matches: ${matches.join(', ')}`);
            }
        }
    }
    
    findGuardianMatches(partial) {
        // This will be populated by the guardian world
        const guardians = window.guardianWorld?.guardians.map(g => g.name) || [];
        return guardians.filter(name => 
            name.toLowerCase().startsWith(partial.toLowerCase())
        );
    }
    
    switchChannel(channelId) {
        if (!this.channels.has(channelId)) return;
        
        this.activeChannel = channelId;
        
        // Update UI
        document.querySelectorAll('.channel-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.channel === channelId);
        });
        
        document.querySelector('.prompt-channel').textContent = 
            '#' + this.channels.get(channelId).name;
        
        // Clear and show channel messages
        this.messagesElement.innerHTML = '';
        const channel = this.channels.get(channelId);
        channel.messages.forEach(msg => this.renderMessage(msg));
        
        this.scrollToBottom();
    }
    
    clearChat() {
        const channel = this.channels.get(this.activeChannel);
        channel.messages = [];
        this.messagesElement.innerHTML = '';
        this.addSystemMessage('Chat cleared.');
    }
    
    scrollToBottom() {
        this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
    }
    
    addSystemMessage(content) {
        this.addMessage({
            type: this.messageTypes.SYSTEM,
            content: content
        });
    }
    
    addToolMessage(toolName, params, result) {
        this.addMessage({
            type: this.messageTypes.TOOL,
            toolName: toolName,
            params: params,
            result: result
        });
    }
    
    // Command implementations
    assignTask(arg) {
        const match = arg.match(/@(\w+)\s+(.+)/);
        if (!match) {
            this.addMessage({
                type: this.messageTypes.ERROR,
                content: 'Usage: /assign @guardian task description'
            });
            return;
        }
        
        const [, guardian, task] = match;
        window.dispatchEvent(new CustomEvent('assignTask', {
            detail: { guardian, task }
        }));
        
        this.addSystemMessage(`Task assigned to @${guardian}: ${task}`);
    }
    
    executeTool(arg) {
        const [toolName, ...params] = arg.split(' ');
        
        window.dispatchEvent(new CustomEvent('executeTool', {
            detail: { toolName, params: params.join(' ') }
        }));
        
        this.addToolMessage(toolName, params.join(' '), 'Executing...');
    }
    
    handleProjectCommand(args) {
        const [action, ...params] = args;
        
        window.dispatchEvent(new CustomEvent('projectCommand', {
            detail: { action, params: params.join(' ') }
        }));
    }
    
    sendPrivateMessage(args) {
        const match = args.join(' ').match(/@(\w+)\s+(.+)/);
        if (!match) {
            this.addMessage({
                type: this.messageTypes.ERROR,
                content: 'Usage: /dm @guardian message'
            });
            return;
        }
        
        const [, guardian, message] = match;
        this.addMessage({
            type: this.messageTypes.PRIVATE,
            author: 'You',
            content: `(to @${guardian}) ${message}`
        });
        
        window.dispatchEvent(new CustomEvent('privateMessage', {
            detail: { to: guardian, message }
        }));
    }
    
    initiateCollaboration(args) {
        const guardians = args.filter(a => a.startsWith('@')).map(a => a.slice(1));
        
        if (guardians.length === 0) {
            this.addMessage({
                type: this.messageTypes.ERROR,
                content: 'Usage: /collaborate @guardian1 @guardian2 ...'
            });
            return;
        }
        
        window.dispatchEvent(new CustomEvent('startCollaboration', {
            detail: { guardians }
        }));
        
        this.addSystemMessage(`Collaboration session started with: ${guardians.map(g => '@' + g).join(', ')}`);
    }
    
    showStatus() {
        window.dispatchEvent(new CustomEvent('requestStatus'));
    }
    
    listGuardians() {
        window.dispatchEvent(new CustomEvent('requestGuardianList'));
    }
    
    // Public methods for external updates
    updateOnlineCount(count) {
        document.getElementById('onlineCount').textContent = count;
    }
    
    updateConnectionStatus(status) {
        document.getElementById('connectionStatus').textContent = status;
    }
    
    updateActivityStatus(status) {
        document.getElementById('activityStatus').textContent = status;
    }
    
    receiveGuardianMessage(guardian, message) {
        this.addMessage({
            type: this.messageTypes.GUARDIAN,
            author: guardian.name,
            content: message,
            color: guardian.color
        });
    }
}

// Export for use in guardian world
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuardianChatSystem;
}
// Export for browser
if (typeof window \!== 'undefined') {
    window.GuardianChatSystem = GuardianChatSystem;
}

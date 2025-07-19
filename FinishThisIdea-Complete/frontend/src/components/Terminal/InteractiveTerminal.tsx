import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Maximize2, Minimize2, RefreshCw, Settings } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import TemplateRenderer from './TemplateRenderer';
import TerminalOutput from './TerminalOutput';
import CommandInput from './CommandInput';

interface TerminalMessage {
  type: 'terminal_output' | 'template_change' | 'consultation_results' | 'error' | 'clear' | 'pong';
  data?: string;
  template?: any;
  results?: any;
  message?: string;
  timestamp?: number;
}

interface InteractiveTerminalProps {
  className?: string;
  initialTemplate?: string;
  autoConnect?: boolean;
  theme?: 'dark' | 'light' | 'constitutional';
}

const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  className = '',
  initialTemplate = 'welcome',
  autoConnect = true,
  theme = 'constitutional'
}) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(initialTemplate);
  const [templateData, setTemplateData] = useState<any>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastCommand, setLastCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/terminal`
      : 'ws://localhost:8081';
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('🔌 Terminal WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Send initial ping
        wsRef.current?.send(JSON.stringify({ type: 'ping' }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: TerminalMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 Terminal WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect after 3 seconds
        if (autoConnect) {
          setTimeout(connectWebSocket, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Terminal WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  }, [autoConnect]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: TerminalMessage) => {
    switch (message.type) {
      case 'terminal_output':
        if (message.data) {
          addOutput(message.data);
        }
        break;

      case 'template_change':
        if (message.template) {
          setCurrentTemplate(message.template.id);
          setTemplateData(message.template);
          console.log(`🔄 Template changed to: ${message.template.id}`);
        }
        break;

      case 'consultation_results':
        if (message.results) {
          handleConsultationResults(message.results);
        }
        break;

      case 'error':
        if (message.message) {
          addOutput(`\x1b[31mError: ${message.message}\x1b[0m`);
        }
        break;

      case 'clear':
        setOutput([]);
        break;

      case 'pong':
        // Keep alive response
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  // Add output to terminal
  const addOutput = useCallback((text: string) => {
    setOutput(prev => [...prev, text]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  // Handle consultation results
  const handleConsultationResults = useCallback((results: any) => {
    console.log('📊 Consultation results received:', results);
    
    // Add structured results to output
    addOutput(`\n📊 CONSULTATION RESULTS:`);
    addOutput(`🎯 Query: ${results.query}`);
    addOutput(`✅ Success: ${results.success ? 'Yes' : 'No'}`);
    addOutput(`🎯 Confidence: ${(results.confidence * 100).toFixed(1)}%`);
    addOutput(`💰 Cost: $${results.cost}`);
    addOutput(`👥 Experts: ${results.experts?.join(', ') || 'N/A'}`);
    addOutput(`⏱️ Method: ${results.method}`);
    
    if (results.response) {
      addOutput(`\n📝 Response:\n${results.response}\n`);
    }
  }, [addOutput]);

  // Send command to WebSocket
  const sendCommand = useCallback((command: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addOutput('\x1b[31mError: Not connected to terminal server\x1b[0m');
      return;
    }

    if (!command.trim()) return;

    setLastCommand(command);
    setCommandHistory(prev => [...prev, command].slice(-50)); // Keep last 50 commands
    setIsLoading(true);

    wsRef.current.send(JSON.stringify({
      type: 'command',
      data: command
    }));

    // Clear loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  }, [addOutput]);

  // Handle terminal resize
  const handleResize = useCallback(() => {
    if (terminalRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      const { offsetWidth, offsetHeight } = terminalRef.current;
      const cols = Math.floor(offsetWidth / 8); // Approximate character width
      const rows = Math.floor(offsetHeight / 20); // Approximate line height

      wsRef.current.send(JSON.stringify({
        type: 'resize',
        data: { cols, rows }
      }));
    }
  }, []);

  // Effects
  useEffect(() => {
    if (autoConnect) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, autoConnect]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Clear terminal
  const clearTerminal = () => {
    setOutput([]);
  };

  // Reconnect WebSocket
  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connectWebSocket();
  };

  // Theme styles
  const themeStyles = {
    dark: {
      background: 'bg-gray-900',
      border: 'border-gray-700',
      text: 'text-green-400'
    },
    light: {
      background: 'bg-white',
      border: 'border-gray-300',
      text: 'text-gray-900'
    },
    constitutional: {
      background: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      border: 'border-purple-500/30',
      text: 'text-blue-400'
    }
  };

  const currentTheme = themeStyles[theme];

  return (
    <div className={`relative ${className}`}>
      {/* Template Renderer - Dynamic UI based on current template */}
      <AnimatePresence mode="wait">
        {templateData && (
          <TemplateRenderer
            key={currentTemplate}
            template={templateData}
            isActive={true}
            onTemplateChange={(newTemplate) => setCurrentTemplate(newTemplate)}
          />
        )}
      </AnimatePresence>

      {/* Terminal Interface */}
      <motion.div
        ref={terminalRef}
        className={`
          ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}
          ${currentTheme.background}
          ${currentTheme.border}
          border rounded-lg shadow-2xl
          flex flex-col
          ${isFullscreen ? 'h-screen' : 'h-96'}
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Terminal Header */}
        <div className={`
          flex items-center justify-between
          px-4 py-2
          bg-gray-800 border-b ${currentTheme.border}
          rounded-t-lg
        `}>
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">
              Interactive AI Terminal
            </span>
            <div className={`
              flex items-center space-x-1 text-xs
              ${connectionStatus === 'connected' ? 'text-green-400' : 
                connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}
            `}>
              <div className={`
                w-2 h-2 rounded-full
                ${connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}
              `} />
              <span>{connectionStatus}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={clearTerminal}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Clear terminal"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={reconnect}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Reconnect"
              disabled={connectionStatus === 'connecting'}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terminal Output */}
        <TerminalOutput
          ref={outputRef}
          output={output}
          isLoading={isLoading}
          theme={theme}
          className="flex-1 overflow-y-auto"
        />

        {/* Command Input */}
        <CommandInput
          onCommand={sendCommand}
          isConnected={isConnected}
          isLoading={isLoading}
          commandHistory={commandHistory}
          theme={theme}
          placeholder={
            isConnected 
              ? 'Type a command (e.g., cal-compare "your question", help, agents)...' 
              : 'Connecting to terminal server...'
          }
        />

        {/* Status Bar */}
        <div className={`
          flex items-center justify-between
          px-4 py-2
          bg-gray-800 border-t ${currentTheme.border}
          rounded-b-lg
          text-xs text-gray-400
        `}>
          <div className="flex items-center space-x-4">
            <span>Template: {currentTemplate}</span>
            <span>Lines: {output.length}</span>
            {lastCommand && <span>Last: {lastCommand}</span>}
          </div>
          <div className="flex items-center space-x-2">
            <span>Constitutional Governance</span>
            <div className="w-2 h-2 bg-green-400 rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-sm text-white">Processing...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InteractiveTerminal;
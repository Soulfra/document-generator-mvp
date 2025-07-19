import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

export interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  messageQueue: WebSocketMessage[];
  send: (type: string, data: any) => void;
  connect: () => void;
  disconnect: () => void;
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
  clearQueue: () => void;
}

const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  url: process.env.REACT_APP_WS_URL || 'http://localhost:3000',
  autoConnect: true,
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  debug: process.env.NODE_ENV === 'development'
};

export const useWebSocket = (config: WebSocketConfig = {}): WebSocketHookReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messageQueue, setMessageQueue] = useState<WebSocketMessage[]>([]);
  const reconnectAttemptsRef = useRef(0);

  const log = useCallback((message: string, data?: any) => {
    if (finalConfig.debug) {
      logger.debug(`[WebSocket] ${message}`, data);
    }
  }, [finalConfig.debug]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping');
        log('Heartbeat sent');
      }
    }, finalConfig.heartbeatInterval);
  }, [clearHeartbeat, finalConfig.heartbeatInterval, log]);

  const processMessageQueue = useCallback(() => {
    if (socketRef.current?.connected && messageQueue.length > 0) {
      log(`Processing ${messageQueue.length} queued messages`);
      messageQueue.forEach(message => {
        socketRef.current?.emit(message.type, message.data);
      });
      setMessageQueue([]);
    }
  }, [messageQueue, log]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < finalConfig.reconnectAttempts) {
      clearReconnectTimeout();
      reconnectAttemptsRef.current++;
      const delay = finalConfig.reconnectInterval * reconnectAttemptsRef.current;
      
      log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${finalConfig.reconnectAttempts} in ${delay}ms`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!socketRef.current?.connected) {
          connect();
        }
      }, delay);
    } else {
      setError(`Failed to reconnect after ${finalConfig.reconnectAttempts} attempts`);
      log('Max reconnection attempts reached');
    }
  }, [finalConfig.reconnectAttempts, finalConfig.reconnectInterval, log]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      log('Already connected');
      return;
    }

    setIsConnecting(true);
    setError(null);
    clearReconnectTimeout();

    log(`Connecting to ${finalConfig.url}`);

    try {
      const newSocket = io(finalConfig.url, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      newSocket.on('connect', () => {
        log('Connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        startHeartbeat();
        processMessageQueue();
      });

      newSocket.on('disconnect', (reason) => {
        log('Disconnected', { reason });
        setIsConnected(false);
        clearHeartbeat();
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          log('Server disconnected client, not attempting reconnect');
        } else {
          // Network/client issue, attempt reconnect
          scheduleReconnect();
        }
      });

      newSocket.on('connect_error', (err) => {
        log('Connection error', err);
        setIsConnecting(false);
        setError(err.message);
        scheduleReconnect();
      });

      newSocket.on('pong', () => {
        log('Heartbeat received');
      });

      // Generic message handler
      newSocket.onAny((eventType, data) => {
        if (eventType !== 'connect' && eventType !== 'disconnect' && eventType !== 'pong') {
          const message: WebSocketMessage = {
            type: eventType,
            data,
            timestamp: Date.now(),
            id: data?.id || Math.random().toString(36).substr(2, 9)
          };
          
          setLastMessage(message);
          log('Message received', { type: eventType, data });
        }
      });

      socketRef.current = newSocket;
    } catch (err) {
      log('Failed to create socket', err);
      setError(err instanceof Error ? err.message : 'Unknown connection error');
      setIsConnecting(false);
      scheduleReconnect();
    }
  }, [finalConfig.url, log, clearReconnectTimeout, startHeartbeat, processMessageQueue, scheduleReconnect]);

  const disconnect = useCallback(() => {
    log('Disconnecting');
    clearReconnectTimeout();
    clearHeartbeat();
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, [clearReconnectTimeout, clearHeartbeat, log]);

  const send = useCallback((type: string, data: any) => {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit(type, data);
      log('Message sent', { type, data });
    } else {
      // Queue message for when connection is restored
      setMessageQueue(prev => [...prev, message]);
      log('Message queued (not connected)', { type, data });
    }
  }, [log]);

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    if (!socketRef.current) {
      log(`Cannot subscribe to ${eventType}: no socket connection`);
      return () => {};
    }

    log(`Subscribing to event: ${eventType}`);
    socketRef.current.on(eventType, callback);

    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        log(`Unsubscribing from event: ${eventType}`);
        socketRef.current.off(eventType, callback);
      }
    };
  }, [log]);

  const clearQueue = useCallback(() => {
    setMessageQueue([]);
    log('Message queue cleared');
  }, [log]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (finalConfig.autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [finalConfig.autoConnect, connect, disconnect]);

  // Process queue when connection is restored
  useEffect(() => {
    if (isConnected && messageQueue.length > 0) {
      processMessageQueue();
    }
  }, [isConnected, processMessageQueue]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    lastMessage,
    messageQueue,
    send,
    connect,
    disconnect,
    subscribe,
    clearQueue
  };
};

export default useWebSocket;
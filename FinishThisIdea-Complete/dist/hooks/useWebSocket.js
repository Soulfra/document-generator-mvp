"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = void 0;
const react_1 = require("react");
const socket_io_client_1 = require("socket.io-client");
const logger_1 = require("../utils/logger");
const DEFAULT_CONFIG = {
    url: process.env.REACT_APP_WS_URL || 'http://localhost:3000',
    autoConnect: true,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
    debug: process.env.NODE_ENV === 'development'
};
const useWebSocket = (config = {}) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const socketRef = (0, react_1.useRef)(null);
    const reconnectTimeoutRef = (0, react_1.useRef)();
    const heartbeatIntervalRef = (0, react_1.useRef)();
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [isConnecting, setIsConnecting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [lastMessage, setLastMessage] = (0, react_1.useState)(null);
    const [messageQueue, setMessageQueue] = (0, react_1.useState)([]);
    const reconnectAttemptsRef = (0, react_1.useRef)(0);
    const log = (0, react_1.useCallback)((message, data) => {
        if (finalConfig.debug) {
            logger_1.logger.debug(`[WebSocket] ${message}`, data);
        }
    }, [finalConfig.debug]);
    const clearReconnectTimeout = (0, react_1.useCallback)(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
        }
    }, []);
    const clearHeartbeat = (0, react_1.useCallback)(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = undefined;
        }
    }, []);
    const startHeartbeat = (0, react_1.useCallback)(() => {
        clearHeartbeat();
        heartbeatIntervalRef.current = setInterval(() => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('ping');
                log('Heartbeat sent');
            }
        }, finalConfig.heartbeatInterval);
    }, [clearHeartbeat, finalConfig.heartbeatInterval, log]);
    const processMessageQueue = (0, react_1.useCallback)(() => {
        if (socketRef.current?.connected && messageQueue.length > 0) {
            log(`Processing ${messageQueue.length} queued messages`);
            messageQueue.forEach(message => {
                socketRef.current?.emit(message.type, message.data);
            });
            setMessageQueue([]);
        }
    }, [messageQueue, log]);
    const scheduleReconnect = (0, react_1.useCallback)(() => {
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
        }
        else {
            setError(`Failed to reconnect after ${finalConfig.reconnectAttempts} attempts`);
            log('Max reconnection attempts reached');
        }
    }, [finalConfig.reconnectAttempts, finalConfig.reconnectInterval, log]);
    const connect = (0, react_1.useCallback)(() => {
        if (socketRef.current?.connected) {
            log('Already connected');
            return;
        }
        setIsConnecting(true);
        setError(null);
        clearReconnectTimeout();
        log(`Connecting to ${finalConfig.url}`);
        try {
            const newSocket = (0, socket_io_client_1.io)(finalConfig.url, {
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
                    log('Server disconnected client, not attempting reconnect');
                }
                else {
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
            newSocket.onAny((eventType, data) => {
                if (eventType !== 'connect' && eventType !== 'disconnect' && eventType !== 'pong') {
                    const message = {
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
        }
        catch (err) {
            log('Failed to create socket', err);
            setError(err instanceof Error ? err.message : 'Unknown connection error');
            setIsConnecting(false);
            scheduleReconnect();
        }
    }, [finalConfig.url, log, clearReconnectTimeout, startHeartbeat, processMessageQueue, scheduleReconnect]);
    const disconnect = (0, react_1.useCallback)(() => {
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
    const send = (0, react_1.useCallback)((type, data) => {
        const message = {
            type,
            data,
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        };
        if (socketRef.current?.connected) {
            socketRef.current.emit(type, data);
            log('Message sent', { type, data });
        }
        else {
            setMessageQueue(prev => [...prev, message]);
            log('Message queued (not connected)', { type, data });
        }
    }, [log]);
    const subscribe = (0, react_1.useCallback)((eventType, callback) => {
        if (!socketRef.current) {
            log(`Cannot subscribe to ${eventType}: no socket connection`);
            return () => { };
        }
        log(`Subscribing to event: ${eventType}`);
        socketRef.current.on(eventType, callback);
        return () => {
            if (socketRef.current) {
                log(`Unsubscribing from event: ${eventType}`);
                socketRef.current.off(eventType, callback);
            }
        };
    }, [log]);
    const clearQueue = (0, react_1.useCallback)(() => {
        setMessageQueue([]);
        log('Message queue cleared');
    }, [log]);
    (0, react_1.useEffect)(() => {
        if (finalConfig.autoConnect) {
            connect();
        }
        return () => {
            disconnect();
        };
    }, [finalConfig.autoConnect, connect, disconnect]);
    (0, react_1.useEffect)(() => {
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
exports.useWebSocket = useWebSocket;
exports.default = exports.useWebSocket;
//# sourceMappingURL=useWebSocket.js.map
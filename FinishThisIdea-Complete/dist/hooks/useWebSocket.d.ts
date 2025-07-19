import { Socket } from 'socket.io-client';
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
export declare const useWebSocket: (config?: WebSocketConfig) => WebSocketHookReturn;
export default useWebSocket;
//# sourceMappingURL=useWebSocket.d.ts.map
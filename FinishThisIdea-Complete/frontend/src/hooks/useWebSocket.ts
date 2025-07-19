import { useState, useEffect, useCallback, useRef } from 'react';
import { UseWebSocketResult, WebSocketMessage } from '../types';
import apiClient from '../api/client';

export function useWebSocket(): UseWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageQueue = useRef<any[]>([]);

  const handleMessage = useCallback((data: any) => {
    setLastMessage(data);
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    apiClient.connectWebSocket(
      (data) => {
        setIsConnected(true);
        handleMessage(data);
        
        // Send any queued messages
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift();
          apiClient.wsConnection?.send(JSON.stringify(message));
        }
      },
      handleError
    );
  }, [handleMessage, handleError]);

  const disconnect = useCallback(() => {
    apiClient.disconnectWebSocket();
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (isConnected && apiClient.wsConnection) {
      apiClient.wsConnection.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is established
      messageQueue.current.push(message);
    }
  }, [isConnected]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
}

// Specialized WebSocket hooks
export function useJobUpdates(jobId: string) {
  const { lastMessage, isConnected } = useWebSocket();
  const [jobStatus, setJobStatus] = useState<any>(null);

  useEffect(() => {
    if (lastMessage?.type === 'job_update' && lastMessage.payload.jobId === jobId) {
      setJobStatus(lastMessage.payload);
    }
  }, [lastMessage, jobId]);

  return { jobStatus, isConnected };
}

export function useActivityUpdates() {
  const { lastMessage, isConnected } = useWebSocket();
  const [newActivity, setNewActivity] = useState<any>(null);

  useEffect(() => {
    if (lastMessage?.type === 'activity_update') {
      setNewActivity(lastMessage.payload);
    }
  }, [lastMessage]);

  return { newActivity, isConnected };
}

export function useAchievementUpdates(userId: string) {
  const { lastMessage, isConnected } = useWebSocket();
  const [newAchievement, setNewAchievement] = useState<any>(null);

  useEffect(() => {
    if (
      lastMessage?.type === 'achievement_unlock' && 
      lastMessage.payload.userId === userId
    ) {
      setNewAchievement(lastMessage.payload.achievement);
    }
  }, [lastMessage, userId]);

  return { newAchievement, isConnected };
}
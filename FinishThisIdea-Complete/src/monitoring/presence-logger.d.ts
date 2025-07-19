// Type definitions for presence-logger.js

export interface PresenceEvent {
  userId?: string;
  action: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PresenceLogger {
  logUserAction(userId: string, action: string, metadata?: Record<string, any>): Promise<void>;
  logSystemEvent(event: string, metadata?: Record<string, any>): Promise<void>;
  getUserActivity(userId: string, hours?: number): Promise<PresenceEvent[]>;
  getSystemActivity(hours?: number): Promise<PresenceEvent[]>;
}

declare const presenceLogger: PresenceLogger;
export default presenceLogger;
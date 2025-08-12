/**
 * Centralized Logging System
 * Provides structured logging with different levels and output targets
 */

import config from '../config/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  category?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  roomCode?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
}

class Logger {
  private config: LoggerConfig;
  private storedLogs: LogEntry[] = [];
  private sessionId: string;
  private userId?: string;
  private roomCode?: string;

  constructor() {
    this.config = {
      level: config.logLevel,
      enableConsole: config.enableConsoleLogging,
      enableRemote: config.enableRemoteLogging,
      enableStorage: true,
      maxStoredLogs: 1000
    };
    
    this.sessionId = this.generateSessionId();
    
    // Initialize remote logging if enabled
    if (this.config.enableRemote) {
      this.initializeRemoteLogging();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeRemoteLogging(): void {
    // In a real implementation, this would set up connection to logging service
    console.log('📡 Remote logging initialized');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const category = entry.category ? `[${entry.category}]` : '';
    const context = [];
    
    if (entry.userId) context.push(`user:${entry.userId}`);
    if (entry.roomCode) context.push(`room:${entry.roomCode}`);
    if (entry.sessionId) context.push(`session:${entry.sessionId.slice(-8)}`);
    
    const contextStr = context.length > 0 ? `{${context.join(', ')}}` : '';
    
    return `${timestamp} ${level} ${category} ${contextStr} ${entry.message}`;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const message = this.formatMessage(entry);
    const consoleMethod = entry.level === 'error' ? 'error' : 
                         entry.level === 'warn' ? 'warn' : 
                         entry.level === 'info' ? 'info' : 'log';

    if (entry.data) {
      console[consoleMethod](message, entry.data);
    } else {
      console[consoleMethod](message);
    }
  }

  private storeLog(entry: LogEntry): void {
    if (!this.config.enableStorage) return;

    this.storedLogs.push(entry);
    
    // Limit stored logs to prevent memory issues
    if (this.storedLogs.length > this.config.maxStoredLogs) {
      this.storedLogs.shift();
    }
  }

  private sendToRemote(entry: LogEntry): void {
    if (!this.config.enableRemote) return;

    // In a real implementation, this would send to a logging service
    // For now, we'll just simulate it
    if (config.environment === 'development') {
      console.log('📡 Would send to remote logging:', entry);
    }
  }

  private log(level: LogLevel, message: string, category?: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      category,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      roomCode: this.roomCode
    };

    this.logToConsole(entry);
    this.storeLog(entry);
    this.sendToRemote(entry);
  }

  // Public logging methods
  debug(message: string, category?: string, data?: any): void {
    this.log('debug', message, category, data);
  }

  info(message: string, category?: string, data?: any): void {
    this.log('info', message, category, data);
  }

  warn(message: string, category?: string, data?: any): void {
    this.log('warn', message, category, data);
  }

  error(message: string, category?: string, data?: any): void {
    this.log('error', message, category, data);
  }

  // Context setters
  setUserId(userId: string): void {
    this.userId = userId;
  }

  setRoomCode(roomCode: string): void {
    this.roomCode = roomCode;
  }

  clearContext(): void {
    this.userId = undefined;
    this.roomCode = undefined;
  }

  // Utility methods
  getStoredLogs(): LogEntry[] {
    return [...this.storedLogs];
  }

  clearStoredLogs(): void {
    this.storedLogs = [];
  }

  exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      logs: this.storedLogs
    }, null, 2);
  }

  // Game-specific logging methods
  gameEvent(event: string, data?: any): void {
    this.info(`Game event: ${event}`, 'GAME', data);
  }

  networkEvent(event: string, data?: any): void {
    this.debug(`Network event: ${event}`, 'NETWORK', data);
  }

  userAction(action: string, data?: any): void {
    this.info(`User action: ${action}`, 'USER', data);
  }

  performanceMetric(metric: string, value: number, unit?: string): void {
    this.debug(`Performance: ${metric} = ${value}${unit || ''}`, 'PERFORMANCE', { metric, value, unit });
  }

  errorWithContext(error: Error, context?: string, data?: any): void {
    this.error(`${context ? `${context}: ` : ''}${error.message}`, 'ERROR', {
      stack: error.stack,
      name: error.name,
      ...data
    });
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger instance and types
export { logger };
export default logger;
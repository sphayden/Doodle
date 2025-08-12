/**
 * Server-side Logging System
 * Provides structured logging with different levels and output targets
 */

const fs = require('fs');
const path = require('path');
const { getConfig } = require('../config/environment');

class Logger {
  constructor() {
    this.config = getConfig();
    this.logDirectory = this.config.logDirectory || './logs';
    
    // Ensure log directory exists
    if (this.config.enableFileLogging) {
      this.ensureLogDirectory();
    }
    
    // Initialize log files
    this.logFiles = {
      error: path.join(this.logDirectory, 'error.log'),
      combined: path.join(this.logDirectory, 'combined.log'),
      access: path.join(this.logDirectory, 'access.log'),
      game: path.join(this.logDirectory, 'game.log')
    };
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  formatMessage(level, message, category, data) {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    const categoryStr = category ? `[${category}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    
    return `${timestamp} ${levelStr} ${categoryStr} ${message}${dataStr}`;
  }

  logToConsole(level, message, category, data) {
    if (!this.config.enableConsoleLogging) return;

    const formattedMessage = this.formatMessage(level, message, category, data);
    
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  logToFile(level, message, category, data) {
    if (!this.config.enableFileLogging) return;

    const formattedMessage = this.formatMessage(level, message, category, data);
    
    // Write to combined log
    this.writeToFile(this.logFiles.combined, formattedMessage);
    
    // Write errors to separate error log
    if (level === 'error') {
      this.writeToFile(this.logFiles.error, formattedMessage);
    }
    
    // Write game events to separate game log
    if (category === 'GAME') {
      this.writeToFile(this.logFiles.game, formattedMessage);
    }
  }

  writeToFile(filePath, message) {
    try {
      fs.appendFileSync(filePath, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  sendToRemote(level, message, category, data) {
    if (!this.config.enableRemoteLogging) return;
    
    // In a real implementation, this would send to a logging service
    // For now, we'll just simulate it
    if (this.config.environment === 'development' && this.config.verboseLogging) {
      console.log('📡 Would send to remote logging:', { level, message, category, data });
    }
  }

  log(level, message, category, data) {
    if (!this.shouldLog(level)) return;

    this.logToConsole(level, message, category, data);
    this.logToFile(level, message, category, data);
    this.sendToRemote(level, message, category, data);
  }

  // Public logging methods
  debug(message, category, data) {
    this.log('debug', message, category, data);
  }

  info(message, category, data) {
    this.log('info', message, category, data);
  }

  warn(message, category, data) {
    this.log('warn', message, category, data);
  }

  error(message, category, data) {
    this.log('error', message, category, data);
  }

  // Game-specific logging methods
  gameEvent(event, roomCode, data) {
    this.info(`Game event: ${event} in room ${roomCode}`, 'GAME', data);
  }

  playerAction(action, playerId, roomCode, data) {
    this.info(`Player action: ${action} by ${playerId} in room ${roomCode}`, 'PLAYER', data);
  }

  networkEvent(event, socketId, data) {
    this.debug(`Network event: ${event} from ${socketId}`, 'NETWORK', data);
  }

  performanceMetric(metric, value, unit) {
    this.debug(`Performance: ${metric} = ${value}${unit || ''}`, 'PERFORMANCE', { metric, value, unit });
  }

  // Access logging for HTTP requests
  logAccess(req, res, responseTime) {
    if (!this.config.enableFileLogging) return;

    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    const userAgent = req.get('User-Agent') || '-';
    const ip = req.ip || req.connection.remoteAddress || '-';
    
    const logLine = `${timestamp} ${ip} "${method} ${url}" ${status} ${responseTime}ms "${userAgent}"`;
    this.writeToFile(this.logFiles.access, logLine);
  }

  // Error logging with stack traces
  logError(error, context, data) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...data
    };
    
    this.error(`${context ? `${context}: ` : ''}${error.message}`, 'ERROR', errorData);
  }

  // Structured logging for different components
  room(message, roomCode, data) {
    this.info(message, 'ROOM', { roomCode, ...data });
  }

  socket(message, socketId, data) {
    this.debug(message, 'SOCKET', { socketId, ...data });
  }

  ai(message, data) {
    this.info(message, 'AI', data);
  }

  security(message, data) {
    this.warn(message, 'SECURITY', data);
  }

  // Log rotation (simple implementation)
  rotateLog(logFile) {
    if (!fs.existsSync(logFile)) return;
    
    const stats = fs.statSync(logFile);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (stats.size > maxSize) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = `${logFile}.${timestamp}`;
      
      try {
        fs.renameSync(logFile, rotatedFile);
        this.info(`Log rotated: ${logFile} -> ${rotatedFile}`, 'SYSTEM');
      } catch (error) {
        this.error(`Failed to rotate log: ${error.message}`, 'SYSTEM');
      }
    }
  }

  // Periodic log rotation
  startLogRotation() {
    if (!this.config.enableFileLogging) return;
    
    setInterval(() => {
      Object.values(this.logFiles).forEach(logFile => {
        this.rotateLog(logFile);
      });
    }, 60 * 60 * 1000); // Check every hour
  }
}

// Create singleton instance
const logger = new Logger();

// Start log rotation
logger.startLogRotation();

module.exports = logger;
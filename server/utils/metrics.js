/**
 * Server Performance Monitoring and Metrics System
 * Provides comprehensive monitoring of server performance, resource usage, and game metrics
 */

const os = require('os');
const process = require('process');
const { getConfig } = require('../config/environment');
const logger = require('./logger');

class MetricsCollector {
  constructor() {
    this.config = getConfig();
    this.startTime = Date.now();
    this.metrics = {
      // System metrics
      system: {
        cpuUsage: 0,
        memoryUsage: {
          used: 0,
          free: 0,
          total: 0,
          percentage: 0
        },
        uptime: 0,
        loadAverage: []
      },
      
      // Game metrics
      game: {
        activeRooms: 0,
        totalPlayers: 0,
        roomsCreated: 0,
        playersJoined: 0,
        gamesCompleted: 0,
        averageGameDuration: 0
      },
      
      // Network metrics
      network: {
        activeConnections: 0,
        totalConnections: 0,
        messagesReceived: 0,
        messagesSent: 0,
        bytesReceived: 0,
        bytesSent: 0,
        connectionErrors: 0
      },
      
      // Performance metrics
      performance: {
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        requestsPerSecond: 0,
        peakConcurrentUsers: 0
      },
      
      // AI metrics
      ai: {
        judgingRequests: 0,
        judgingSuccesses: 0,
        judgingFailures: 0,
        averageJudgingTime: 0,
        totalJudgingTime: 0
      }
    };
    
    // Performance tracking
    this.performanceData = {
      responseTimes: [],
      requestCount: 0,
      errorCount: 0,
      lastRequestTime: Date.now(),
      judgingTimes: []
    };
    
    // Alerting thresholds
    this.thresholds = {
      memoryUsage: 80, // percentage
      responseTime: 2000, // milliseconds
      errorRate: 5, // percentage
      cpuUsage: 80 // percentage
    };
    
    // Start periodic collection
    if (this.config.enableMetrics) {
      this.startPeriodicCollection();
    }
  }

  /**
   * Start periodic metrics collection
   */
  startPeriodicCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
      this.checkAlerts();
    }, 30000);
    
    // Calculate performance metrics every minute
    setInterval(() => {
      this.calculatePerformanceMetrics();
    }, 60000);
    
    // Log metrics summary every 5 minutes
    setInterval(() => {
      this.logMetricsSummary();
    }, 300000);
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      // CPU usage
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      
      this.metrics.system.cpuUsage = Math.round(100 - (totalIdle / totalTick) * 100);
      
      // Memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      
      this.metrics.system.memoryUsage = {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        free: Math.round(freeMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100)
      };
      
      // System uptime
      this.metrics.system.uptime = Math.round((Date.now() - this.startTime) / 1000);
      
      // Load average (Unix systems only)
      if (os.loadavg) {
        this.metrics.system.loadAverage = os.loadavg().map(load => Math.round(load * 100) / 100);
      }
      
    } catch (error) {
      logger.error('Failed to collect system metrics', 'METRICS', { error: error.message });
    }
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics() {
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    
    // Filter recent response times
    const recentResponseTimes = this.performanceData.responseTimes.filter(
      entry => now - entry.timestamp < timeWindow
    );
    
    if (recentResponseTimes.length > 0) {
      const times = recentResponseTimes.map(entry => entry.time);
      this.metrics.performance.averageResponseTime = Math.round(
        times.reduce((sum, time) => sum + time, 0) / times.length
      );
      
      this.metrics.performance.slowRequests = times.filter(time => time > this.thresholds.responseTime).length;
    }
    
    // Calculate requests per second
    const requestsInWindow = recentResponseTimes.length;
    this.metrics.performance.requestsPerSecond = Math.round((requestsInWindow / 60) * 100) / 100;
    
    // Calculate error rate
    if (this.performanceData.requestCount > 0) {
      this.metrics.performance.errorRate = Math.round(
        (this.performanceData.errorCount / this.performanceData.requestCount) * 100 * 100
      ) / 100;
    }
    
    // Clean up old data
    this.performanceData.responseTimes = recentResponseTimes;
    
    // Calculate AI judging metrics
    if (this.performanceData.judgingTimes.length > 0) {
      const recentJudgingTimes = this.performanceData.judgingTimes.filter(
        entry => now - entry.timestamp < timeWindow
      );
      
      if (recentJudgingTimes.length > 0) {
        const times = recentJudgingTimes.map(entry => entry.time);
        this.metrics.ai.averageJudgingTime = Math.round(
          times.reduce((sum, time) => sum + time, 0) / times.length
        );
      }
      
      this.performanceData.judgingTimes = recentJudgingTimes;
    }
  }

  /**
   * Check alert thresholds
   */
  checkAlerts() {
    const alerts = [];
    
    // Memory usage alert
    if (this.metrics.system.memoryUsage.percentage > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        message: `Memory usage is ${this.metrics.system.memoryUsage.percentage}% (threshold: ${this.thresholds.memoryUsage}%)`,
        severity: 'warning',
        value: this.metrics.system.memoryUsage.percentage,
        threshold: this.thresholds.memoryUsage
      });
    }
    
    // CPU usage alert
    if (this.metrics.system.cpuUsage > this.thresholds.cpuUsage) {
      alerts.push({
        type: 'HIGH_CPU_USAGE',
        message: `CPU usage is ${this.metrics.system.cpuUsage}% (threshold: ${this.thresholds.cpuUsage}%)`,
        severity: 'warning',
        value: this.metrics.system.cpuUsage,
        threshold: this.thresholds.cpuUsage
      });
    }
    
    // Response time alert
    if (this.metrics.performance.averageResponseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'SLOW_RESPONSE_TIME',
        message: `Average response time is ${this.metrics.performance.averageResponseTime}ms (threshold: ${this.thresholds.responseTime}ms)`,
        severity: 'warning',
        value: this.metrics.performance.averageResponseTime,
        threshold: this.thresholds.responseTime
      });
    }
    
    // Error rate alert
    if (this.metrics.performance.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `Error rate is ${this.metrics.performance.errorRate}% (threshold: ${this.thresholds.errorRate}%)`,
        severity: 'critical',
        value: this.metrics.performance.errorRate,
        threshold: this.thresholds.errorRate
      });
    }
    
    // Log alerts
    alerts.forEach(alert => {
      if (alert.severity === 'critical') {
        logger.error(alert.message, 'ALERT', alert);
      } else {
        logger.warn(alert.message, 'ALERT', alert);
      }
    });
    
    return alerts;
  }

  /**
   * Log metrics summary
   */
  logMetricsSummary() {
    logger.info('Metrics Summary', 'METRICS', {
      system: this.metrics.system,
      game: this.metrics.game,
      network: this.metrics.network,
      performance: this.metrics.performance,
      ai: this.metrics.ai
    });
  }

  /**
   * Record HTTP request metrics
   */
  recordRequest(responseTime, statusCode) {
    this.performanceData.responseTimes.push({
      time: responseTime,
      timestamp: Date.now()
    });
    
    this.performanceData.requestCount++;
    
    if (statusCode >= 400) {
      this.performanceData.errorCount++;
    }
    
    this.performanceData.lastRequestTime = Date.now();
  }

  /**
   * Record game metrics
   */
  recordRoomCreated() {
    this.metrics.game.roomsCreated++;
  }

  recordPlayerJoined() {
    this.metrics.game.playersJoined++;
  }

  recordGameCompleted(duration) {
    this.metrics.game.gamesCompleted++;
    
    // Update average game duration
    const totalGames = this.metrics.game.gamesCompleted;
    const currentAverage = this.metrics.game.averageGameDuration;
    this.metrics.game.averageGameDuration = Math.round(
      ((currentAverage * (totalGames - 1)) + duration) / totalGames
    );
  }

  /**
   * Record network metrics
   */
  recordConnection() {
    this.metrics.network.activeConnections++;
    this.metrics.network.totalConnections++;
    
    // Update peak concurrent users
    if (this.metrics.network.activeConnections > this.metrics.performance.peakConcurrentUsers) {
      this.metrics.performance.peakConcurrentUsers = this.metrics.network.activeConnections;
    }
  }

  recordDisconnection() {
    this.metrics.network.activeConnections = Math.max(0, this.metrics.network.activeConnections - 1);
  }

  recordMessage(type, size = 0) {
    if (type === 'received') {
      this.metrics.network.messagesReceived++;
      this.metrics.network.bytesReceived += size;
    } else if (type === 'sent') {
      this.metrics.network.messagesSent++;
      this.metrics.network.bytesSent += size;
    }
  }

  recordConnectionError() {
    this.metrics.network.connectionErrors++;
  }

  /**
   * Record AI judging metrics
   */
  recordAIJudging(success, duration) {
    this.metrics.ai.judgingRequests++;
    
    if (success) {
      this.metrics.ai.judgingSuccesses++;
    } else {
      this.metrics.ai.judgingFailures++;
    }
    
    if (duration) {
      this.performanceData.judgingTimes.push({
        time: duration,
        timestamp: Date.now()
      });
      
      this.metrics.ai.totalJudgingTime += duration;
    }
  }

  /**
   * Update game state metrics
   */
  updateGameMetrics(gameManager) {
    if (gameManager) {
      this.metrics.game.activeRooms = gameManager.getActiveRoomsCount();
      this.metrics.game.totalPlayers = gameManager.getTotalPlayersCount();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.startTime) / 1000)
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const alerts = this.checkAlerts();
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    const warningAlerts = alerts.filter(alert => alert.severity === 'warning');
    
    let status = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (warningAlerts.length > 0) {
      status = 'warning';
    }
    
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      alerts: {
        critical: criticalAlerts.length,
        warning: warningAlerts.length,
        details: alerts
      },
      system: {
        memoryUsage: this.metrics.system.memoryUsage.percentage,
        cpuUsage: this.metrics.system.cpuUsage,
        loadAverage: this.metrics.system.loadAverage
      },
      performance: {
        averageResponseTime: this.metrics.performance.averageResponseTime,
        errorRate: this.metrics.performance.errorRate,
        requestsPerSecond: this.metrics.performance.requestsPerSecond
      }
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset() {
    this.startTime = Date.now();
    this.performanceData = {
      responseTimes: [],
      requestCount: 0,
      errorCount: 0,
      lastRequestTime: Date.now(),
      judgingTimes: []
    };
    
    // Reset counters but keep current state metrics
    this.metrics.game.roomsCreated = 0;
    this.metrics.game.playersJoined = 0;
    this.metrics.game.gamesCompleted = 0;
    this.metrics.network.totalConnections = 0;
    this.metrics.network.messagesReceived = 0;
    this.metrics.network.messagesSent = 0;
    this.metrics.network.bytesReceived = 0;
    this.metrics.network.bytesSent = 0;
    this.metrics.network.connectionErrors = 0;
    this.metrics.ai.judgingRequests = 0;
    this.metrics.ai.judgingSuccesses = 0;
    this.metrics.ai.judgingFailures = 0;
    this.metrics.ai.totalJudgingTime = 0;
    this.metrics.performance.peakConcurrentUsers = 0;
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

module.exports = metricsCollector;
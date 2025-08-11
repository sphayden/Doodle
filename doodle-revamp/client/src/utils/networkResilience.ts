/**
 * Network Resilience Features
 * 
 * This module provides network resilience utilities including request retry logic,
 * timeout handling, connection health monitoring, and graceful degradation.
 */

import { GameError, GameErrorCode, createGameError } from '../interfaces';
import { ErrorHandler } from './errorHandling';

/**
 * Retry configuration for network requests
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

/**
 * Network timeout configuration
 */
export interface TimeoutConfig {
  connection: number;    // Connection establishment timeout
  request: number;       // Individual request timeout
  response: number;      // Response timeout
  idle: number;          // Idle connection timeout
}

/**
 * Connection health metrics
 */
export interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  packetLoss: number;
  lastCheck: Date;
  consecutiveFailures: number;
  uptime: number;
  downtime: number;
}

/**
 * Network quality levels
 */
export enum NetworkQuality {
  EXCELLENT = 'excellent',  // < 50ms latency, 0% loss
  GOOD = 'good',           // < 100ms latency, < 1% loss
  FAIR = 'fair',           // < 200ms latency, < 5% loss
  POOR = 'poor',           // < 500ms latency, < 10% loss
  VERY_POOR = 'very_poor'  // > 500ms latency, > 10% loss
}

/**
 * Default configurations
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and server errors
    return error.code === 'NETWORK_ERROR' || 
           error.code === 'TIMEOUT' || 
           (error.status >= 500 && error.status < 600);
  }
};

const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  connection: 10000,  // 10 seconds
  request: 5000,      // 5 seconds
  response: 8000,     // 8 seconds
  idle: 30000         // 30 seconds
};

/**
 * Network resilience manager
 */
export class NetworkResilienceManager {
  private retryConfig: RetryConfig;
  private timeoutConfig: TimeoutConfig;
  private errorHandler: ErrorHandler;
  private healthMetrics: ConnectionHealth;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private requestQueue: Map<string, any> = new Map();
  private circuitBreakerState: 'closed' | 'open' | 'half-open' = 'closed';
  private circuitBreakerFailures = 0;
  private circuitBreakerLastFailure = 0;
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerTimeout = 30000; // 30 seconds

  constructor(
    retryConfig: Partial<RetryConfig> = {},
    timeoutConfig: Partial<TimeoutConfig> = {},
    errorHandler?: ErrorHandler
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.timeoutConfig = { ...DEFAULT_TIMEOUT_CONFIG, ...timeoutConfig };
    this.errorHandler = errorHandler || new ErrorHandler();
    
    this.healthMetrics = {
      isHealthy: true,
      latency: 0,
      packetLoss: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      uptime: 0,
      downtime: 0
    };

    this.startHealthMonitoring();
  }

  /**
   * Execute a network request with retry logic and timeout handling
   */
  async executeWithResilience<T>(
    requestFn: () => Promise<T>,
    options: {
      timeout?: number;
      retryConfig?: Partial<RetryConfig>;
      requestId?: string;
    } = {}
  ): Promise<T> {
    const config = { ...this.retryConfig, ...options.retryConfig };
    const timeout = options.timeout || this.timeoutConfig.request;
    const requestId = options.requestId || this.generateRequestId();

    // Check circuit breaker
    if (this.circuitBreakerState === 'open') {
      if (Date.now() - this.circuitBreakerLastFailure > this.circuitBreakerTimeout) {
        this.circuitBreakerState = 'half-open';
      } else {
        throw createGameError(
          GameErrorCode.SERVER_UNREACHABLE,
          'Service temporarily unavailable due to repeated failures',
          { circuitBreakerState: this.circuitBreakerState },
          true
        );
      }
    }

    let lastError: any;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Add request to queue for monitoring
        this.requestQueue.set(requestId, {
          startTime: Date.now(),
          attempt,
          maxAttempts: config.maxAttempts
        });

        // Execute request with timeout
        const result = await this.executeWithTimeout(requestFn, timeout);
        
        // Success - update circuit breaker and health
        this.onRequestSuccess(requestId);
        this.circuitBreakerFailures = 0;
        if (this.circuitBreakerState === 'half-open') {
          this.circuitBreakerState = 'closed';
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.onRequestFailure(requestId, error);
        
        // Update circuit breaker
        this.circuitBreakerFailures++;
        this.circuitBreakerLastFailure = Date.now();
        
        if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
          this.circuitBreakerState = 'open';
        }

        // Check if we should retry
        if (attempt === config.maxAttempts || !this.shouldRetry(error, config)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt, config);
        await this.sleep(delay);
      }
    }

    // All attempts failed
    this.requestQueue.delete(requestId);
    throw this.createNetworkError(lastError, config.maxAttempts);
  }

  /**
   * Execute request with timeout
   */
  private async executeWithTimeout<T>(
    requestFn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(createGameError(
          GameErrorCode.CONNECTION_TIMEOUT,
          `Request timed out after ${timeout}ms`,
          { timeout },
          true
        ));
      }, timeout);

      requestFn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetry(error: any, config: RetryConfig): boolean {
    if (config.retryCondition) {
      return config.retryCondition(error);
    }

    // Default retry conditions
    const retryableErrors = [
      GameErrorCode.CONNECTION_TIMEOUT,
      GameErrorCode.CONNECTION_LOST,
      GameErrorCode.SERVER_UNREACHABLE,
      GameErrorCode.RATE_LIMITED
    ];

    return retryableErrors.includes(error.code);
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, config.maxDelay);

    if (config.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }

    return Math.max(delay, 0);
  }

  /**
   * Handle successful request
   */
  private onRequestSuccess(requestId: string): void {
    const request = this.requestQueue.get(requestId);
    if (request) {
      const duration = Date.now() - request.startTime;
      this.updateHealthMetrics(duration, true);
      this.requestQueue.delete(requestId);
    }
  }

  /**
   * Handle failed request
   */
  private onRequestFailure(requestId: string, error: any): void {
    const request = this.requestQueue.get(requestId);
    if (request) {
      const duration = Date.now() - request.startTime;
      this.updateHealthMetrics(duration, false);
      
      // Log error if it's the final attempt
      if (request.attempt === request.maxAttempts) {
        this.errorHandler.processError(error);
        this.requestQueue.delete(requestId);
      }
    }
  }

  /**
   * Update connection health metrics
   */
  private updateHealthMetrics(latency: number, success: boolean): void {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.healthMetrics.lastCheck.getTime();

    if (success) {
      this.healthMetrics.latency = (this.healthMetrics.latency + latency) / 2;
      this.healthMetrics.consecutiveFailures = 0;
      this.healthMetrics.uptime += timeSinceLastCheck;
    } else {
      this.healthMetrics.consecutiveFailures++;
      this.healthMetrics.downtime += timeSinceLastCheck;
      this.healthMetrics.packetLoss = Math.min(
        (this.healthMetrics.packetLoss + 0.1) / 2,
        1.0
      );
    }

    this.healthMetrics.lastCheck = now;
    this.healthMetrics.isHealthy = this.calculateHealthStatus();
  }

  /**
   * Calculate overall health status
   */
  private calculateHealthStatus(): boolean {
    return this.healthMetrics.consecutiveFailures < 3 &&
           this.healthMetrics.latency < 1000 &&
           this.healthMetrics.packetLoss < 0.1;
  }

  /**
   * Get current network quality assessment
   */
  getNetworkQuality(): NetworkQuality {
    const { latency, packetLoss } = this.healthMetrics;

    if (latency < 50 && packetLoss < 0.001) {
      return NetworkQuality.EXCELLENT;
    } else if (latency < 100 && packetLoss < 0.01) {
      return NetworkQuality.GOOD;
    } else if (latency < 200 && packetLoss < 0.05) {
      return NetworkQuality.FAIR;
    } else if (latency < 500 && packetLoss < 0.1) {
      return NetworkQuality.POOR;
    } else {
      return NetworkQuality.VERY_POOR;
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Simple ping to server (you can customize this endpoint)
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache'
      });
      
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        this.updateHealthMetrics(latency, true);
      } else {
        this.updateHealthMetrics(latency, false);
      }
    } catch (error) {
      this.updateHealthMetrics(5000, false); // Assume high latency on error
    }
  }

  /**
   * Get current health metrics
   */
  getHealthMetrics(): ConnectionHealth {
    return { ...this.healthMetrics };
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailure: Date | null;
  } {
    return {
      state: this.circuitBreakerState,
      failures: this.circuitBreakerFailures,
      lastFailure: this.circuitBreakerLastFailure ? new Date(this.circuitBreakerLastFailure) : null
    };
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerState = 'closed';
    this.circuitBreakerFailures = 0;
    this.circuitBreakerLastFailure = 0;
  }

  /**
   * Get pending requests count
   */
  getPendingRequestsCount(): number {
    return this.requestQueue.size;
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.requestQueue.clear();
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Update timeout configuration
   */
  updateTimeoutConfig(config: Partial<TimeoutConfig>): void {
    this.timeoutConfig = { ...this.timeoutConfig, ...config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.requestQueue.clear();
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create network error from caught error
   */
  private createNetworkError(error: any, maxAttempts: number): GameError {
    if (error.code && Object.values(GameErrorCode).includes(error.code)) {
      return error;
    }

    return createGameError(
      GameErrorCode.CONNECTION_FAILED,
      `Network request failed after ${maxAttempts} attempts: ${error.message}`,
      { originalError: error, maxAttempts },
      true
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Graceful degradation manager
 */
export class GracefulDegradationManager {
  private features: Map<string, boolean> = new Map();
  private fallbackStrategies: Map<string, () => any> = new Map();

  /**
   * Register a feature with fallback strategy
   */
  registerFeature(
    featureName: string,
    isEnabled: boolean,
    fallbackStrategy?: () => any
  ): void {
    this.features.set(featureName, isEnabled);
    if (fallbackStrategy) {
      this.fallbackStrategies.set(featureName, fallbackStrategy);
    }
  }

  /**
   * Check if feature is available
   */
  isFeatureAvailable(featureName: string): boolean {
    return this.features.get(featureName) || false;
  }

  /**
   * Disable feature (graceful degradation)
   */
  disableFeature(featureName: string): void {
    this.features.set(featureName, false);
  }

  /**
   * Enable feature
   */
  enableFeature(featureName: string): void {
    this.features.set(featureName, true);
  }

  /**
   * Execute feature with fallback
   */
  async executeFeature<T>(
    featureName: string,
    primaryFn: () => Promise<T>,
    fallbackFn?: () => Promise<T>
  ): Promise<T> {
    if (this.isFeatureAvailable(featureName)) {
      try {
        return await primaryFn();
      } catch (error) {
        // Feature failed, disable it temporarily
        this.disableFeature(featureName);
        
        // Try fallback
        const fallback = fallbackFn || this.fallbackStrategies.get(featureName);
        if (fallback) {
          return await fallback();
        }
        
        throw error;
      }
    } else {
      // Feature disabled, use fallback
      const fallback = fallbackFn || this.fallbackStrategies.get(featureName);
      if (fallback) {
        return await fallback();
      }
      
      throw createGameError(
        GameErrorCode.INVALID_GAME_STATE,
        `Feature '${featureName}' is currently unavailable`,
        { featureName },
        true
      );
    }
  }

  /**
   * Get all feature statuses
   */
  getFeatureStatuses(): Record<string, boolean> {
    return Object.fromEntries(this.features);
  }
}

/**
 * Default network resilience manager instance
 */
export const defaultNetworkResilience = new NetworkResilienceManager();

/**
 * Default graceful degradation manager instance
 */
export const defaultGracefulDegradation = new GracefulDegradationManager();
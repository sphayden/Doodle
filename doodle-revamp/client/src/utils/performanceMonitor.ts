/**
 * Performance Monitoring System
 * Tracks performance metrics, timing, and resource usage
 */

import logger from './logger';
import config from '../config/environment';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: string;
  tags?: Record<string, string>;
}

export interface TimingMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timings: Map<string, TimingMetric> = new Map();
  private enabled: boolean;
  private maxMetrics: number = 1000;

  constructor() {
    this.enabled = config.enablePerformanceMonitoring;
    
    if (this.enabled) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring(): void {
    // Monitor page load performance
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        this.recordPageLoadMetrics();
      });
    }

    // Monitor memory usage periodically
    if (this.enabled && typeof window !== 'undefined') {
      setInterval(() => {
        this.recordMemoryMetrics();
      }, 30000); // Every 30 seconds
    }

    logger.debug('Performance monitoring initialized', 'PERFORMANCE');
  }

  private recordPageLoadMetrics(): void {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    // Page load timing metrics
    this.recordMetric('page_load_time', timing.loadEventEnd - timing.navigationStart, 'ms', 'PAGE_LOAD');
    this.recordMetric('dom_content_loaded', timing.domContentLoadedEventEnd - timing.navigationStart, 'ms', 'PAGE_LOAD');
    this.recordMetric('first_paint', timing.responseStart - timing.navigationStart, 'ms', 'PAGE_LOAD');
    this.recordMetric('dns_lookup', timing.domainLookupEnd - timing.domainLookupStart, 'ms', 'NETWORK');
    this.recordMetric('tcp_connect', timing.connectEnd - timing.connectStart, 'ms', 'NETWORK');
    this.recordMetric('server_response', timing.responseEnd - timing.requestStart, 'ms', 'NETWORK');

    // Navigation type
    const navType = navigation.type === 0 ? 'navigate' : 
                   navigation.type === 1 ? 'reload' : 
                   navigation.type === 2 ? 'back_forward' : 'unknown';
    
    logger.info(`Page loaded via ${navType}`, 'PERFORMANCE', {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart
    });
  }

  private recordMemoryMetrics(): void {
    if (!this.enabled) return;

    // @ts-ignore - performance.memory is not in TypeScript types but exists in Chrome
    const memory = (window.performance as any)?.memory;
    if (memory) {
      this.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes', 'MEMORY');
      this.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes', 'MEMORY');
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes', 'MEMORY');
    }

    // Record stored logs count as a memory metric
    const logCount = logger.getStoredLogs().length;
    this.recordMetric('stored_logs_count', logCount, 'count', 'MEMORY');
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string, category: string, tags?: Record<string, string>): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      category,
      tags
    };

    this.metrics.push(metric);
    
    // Limit stored metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log significant metrics
    if (this.shouldLogMetric(name, value, unit)) {
      logger.performanceMetric(name, value, unit);
    }
  }

  private shouldLogMetric(name: string, value: number, unit: string): boolean {
    // Log slow operations
    if (unit === 'ms' && value > 1000) return true; // > 1 second
    
    // Log large memory usage
    if (unit === 'bytes' && value > 50 * 1024 * 1024) return true; // > 50MB
    
    // Log specific important metrics
    const importantMetrics = ['page_load_time', 'game_state_update', 'network_request'];
    if (importantMetrics.includes(name)) return true;
    
    return false;
  }

  /**
   * Start timing an operation
   */
  startTiming(name: string, category: string = 'GENERAL'): void {
    if (!this.enabled) return;

    const timing: TimingMetric = {
      name,
      startTime: performance.now(),
      category
    };

    this.timings.set(name, timing);
  }

  /**
   * End timing an operation and record the duration
   */
  endTiming(name: string, tags?: Record<string, string>): number | undefined {
    if (!this.enabled) return undefined;

    const timing = this.timings.get(name);
    if (!timing) {
      logger.warn(`No timing found for: ${name}`, 'PERFORMANCE');
      return undefined;
    }

    timing.endTime = performance.now();
    timing.duration = timing.endTime - timing.startTime;

    // Record as metric
    this.recordMetric(name, timing.duration, 'ms', timing.category, tags);

    // Clean up
    this.timings.delete(name);

    return timing.duration;
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(name: string, fn: () => Promise<T>, category: string = 'FUNCTION'): Promise<T> {
    if (!this.enabled) return fn();

    this.startTiming(name, category);
    try {
      const result = await fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name, { error: 'true' });
      throw error;
    }
  }

  /**
   * Time a synchronous function execution
   */
  timeFunctionSync<T>(name: string, fn: () => T, category: string = 'FUNCTION'): T {
    if (!this.enabled) return fn();

    this.startTiming(name, category);
    try {
      const result = fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name, { error: 'true' });
      throw error;
    }
  }

  /**
   * Record game-specific metrics
   */
  recordGameMetric(metric: string, value: number, unit: string = 'count'): void {
    this.recordMetric(metric, value, unit, 'GAME');
  }

  /**
   * Record network-specific metrics
   */
  recordNetworkMetric(metric: string, value: number, unit: string = 'ms'): void {
    this.recordMetric(metric, value, unit, 'NETWORK');
  }

  /**
   * Record user interaction metrics
   */
  recordUserMetric(metric: string, value: number, unit: string = 'count'): void {
    this.recordMetric(metric, value, unit, 'USER');
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.category === category);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): Record<string, { count: number; avg: number; min: number; max: number }> {
    const summary: Record<string, { count: number; total: number; min: number; max: number }> = {};

    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, total: 0, min: Infinity, max: -Infinity };
      }

      const s = summary[metric.name];
      s.count++;
      s.total += metric.value;
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
    });

    // Convert to final format with averages
    const result: Record<string, { count: number; avg: number; min: number; max: number }> = {};
    Object.keys(summary).forEach(key => {
      const s = summary[key];
      result[key] = {
        count: s.count,
        avg: s.total / s.count,
        min: s.min,
        max: s.max
      };
    });

    return result;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timings.clear();
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: this.getMetricsSummary()
    }, null, 2);
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`, 'PERFORMANCE');
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor };
export default performanceMonitor;
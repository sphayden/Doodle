/**
 * Feature Flag System
 * Provides easy access to feature flags and configuration values
 */

import config, { isFeatureEnabled, getConfigValue } from '../config/environment';

/**
 * Feature flag checks
 */
export const FeatureFlags = {
  // Development Features
  get devTools() { return isFeatureEnabled('enableDevTools'); },
  get debugMode() { return isFeatureEnabled('enableDebugMode'); },
  get testUtils() { return isFeatureEnabled('enableTestUtils'); },
  get mockData() { return isFeatureEnabled('enableMockData'); },
  
  // Performance Features
  get performanceMonitoring() { return isFeatureEnabled('enablePerformanceMonitoring'); },
  get errorReporting() { return isFeatureEnabled('enableErrorReporting'); },
  
  // Logging Features
  get consoleLogging() { return isFeatureEnabled('enableConsoleLogging'); },
  get remoteLogging() { return isFeatureEnabled('enableRemoteLogging'); },
  
  // Game Features
  get realTimeDrawing() { return isFeatureEnabled('enableRealTimeDrawing'); },
  
  // Auto-connect in development
  get autoConnectInDev() { return isFeatureEnabled('autoConnectInDev'); }
};

/**
 * Configuration values
 */
export const ConfigValues = {
  // Server Configuration
  get serverUrl() { return getConfigValue('serverUrl'); },
  get socketTimeout() { return getConfigValue('socketTimeout'); },
  get reconnectAttempts() { return getConfigValue('reconnectAttempts'); },
  get reconnectDelay() { return getConfigValue('reconnectDelay'); },
  
  // Game Configuration
  get drawingTimeLimit() { return getConfigValue('drawingTimeLimit'); },
  get maxPlayers() { return getConfigValue('maxPlayers'); },
  
  // Logging Configuration
  get logLevel() { return getConfigValue('logLevel'); }
};

/**
 * Environment checks
 */
export const Environment = {
  get isDevelopment() { return config.environment === 'development'; },
  get isProduction() { return config.environment === 'production'; },
  get isStaging() { return config.environment === 'staging'; },
  get isTest() { return config.environment === 'test'; }
};

/**
 * Conditional execution based on feature flags
 */
export function withFeature<T>(feature: keyof typeof FeatureFlags, callback: () => T): T | undefined {
  return FeatureFlags[feature] ? callback() : undefined;
}

/**
 * Conditional execution based on environment
 */
export function withEnvironment<T>(env: 'development' | 'production' | 'staging' | 'test', callback: () => T): T | undefined {
  return config.environment === env ? callback() : undefined;
}

/**
 * Development-only execution
 */
export function devOnly<T>(callback: () => T): T | undefined {
  return withEnvironment('development', callback);
}

/**
 * Production-only execution
 */
export function prodOnly<T>(callback: () => T): T | undefined {
  return withEnvironment('production', callback);
}
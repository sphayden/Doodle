/**
 * Environment Configuration Management
 * Handles different configurations for development, staging, and production environments
 */

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface ClientConfig {
  // Environment
  environment: Environment;
  
  // Server Configuration
  serverUrl: string;
  socketTimeout: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  
  // Feature Flags
  enableDevTools: boolean;
  enableDebugMode: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorReporting: boolean;
  
  // Logging Configuration
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  
  // Game Configuration
  drawingTimeLimit: number;
  maxPlayers: number;
  enableRealTimeDrawing: boolean;
  
  // Development Features
  enableTestUtils: boolean;
  enableMockData: boolean;
  autoConnectInDev: boolean;
}

/**
 * Default configuration for each environment
 */
const environmentConfigs: Record<Environment, ClientConfig> = {
  development: {
    // Environment
    environment: 'development',
    
    // Server Configuration
    serverUrl: process.env.REACT_APP_SERVER_URL || 'http://localhost:3001',
    socketTimeout: 10000,
    reconnectAttempts: 5,
    reconnectDelay: 2000,
    
    // Feature Flags
    enableDevTools: true,
    enableDebugMode: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: false, // Don't send errors in dev
    
    // Logging Configuration
    logLevel: 'debug',
    enableConsoleLogging: true,
    enableRemoteLogging: false,
    
    // Game Configuration
    drawingTimeLimit: 60,
    maxPlayers: 8,
    enableRealTimeDrawing: true,
    
    // Development Features
    enableTestUtils: true,
    enableMockData: true,
    autoConnectInDev: false
  },
  
  staging: {
    // Environment
    environment: 'staging',
    
    // Server Configuration
    serverUrl: process.env.REACT_APP_SERVER_URL || 'https://staging-doodle-api.example.com',
    socketTimeout: 15000,
    reconnectAttempts: 3,
    reconnectDelay: 3000,
    
    // Feature Flags
    enableDevTools: true, // Keep devtools in staging for testing
    enableDebugMode: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true,
    
    // Logging Configuration
    logLevel: 'info',
    enableConsoleLogging: true,
    enableRemoteLogging: true,
    
    // Game Configuration
    drawingTimeLimit: 60,
    maxPlayers: 8,
    enableRealTimeDrawing: true,
    
    // Development Features
    enableTestUtils: true,
    enableMockData: false,
    autoConnectInDev: false
  },
  
  production: {
    // Environment
    environment: 'production',
    
    // Server Configuration
    serverUrl: process.env.REACT_APP_SERVER_URL || 'https://api.doodle-game.com',
    socketTimeout: 20000,
    reconnectAttempts: 3,
    reconnectDelay: 5000,
    
    // Feature Flags
    enableDevTools: false, // No devtools in production
    enableDebugMode: false,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true,
    
    // Logging Configuration
    logLevel: 'warn',
    enableConsoleLogging: false, // No console logs in production
    enableRemoteLogging: true,
    
    // Game Configuration
    drawingTimeLimit: 60,
    maxPlayers: 8,
    enableRealTimeDrawing: true,
    
    // Development Features
    enableTestUtils: false,
    enableMockData: false,
    autoConnectInDev: false
  },
  
  test: {
    // Environment
    environment: 'test',
    
    // Server Configuration
    serverUrl: 'http://localhost:3001', // Use local server for tests
    socketTimeout: 5000,
    reconnectAttempts: 1,
    reconnectDelay: 1000,
    
    // Feature Flags
    enableDevTools: false,
    enableDebugMode: false,
    enablePerformanceMonitoring: false,
    enableErrorReporting: false,
    
    // Logging Configuration
    logLevel: 'error', // Only log errors in tests
    enableConsoleLogging: false,
    enableRemoteLogging: false,
    
    // Game Configuration
    drawingTimeLimit: 10, // Shorter time for tests
    maxPlayers: 4,
    enableRealTimeDrawing: false,
    
    // Development Features
    enableTestUtils: true,
    enableMockData: true,
    autoConnectInDev: false
  }
};

/**
 * Get current environment from environment variables
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development';
  
  switch (env.toLowerCase()) {
    case 'production':
    case 'prod':
      return 'production';
    case 'staging':
    case 'stage':
      return 'staging';
    case 'test':
    case 'testing':
      return 'test';
    case 'development':
    case 'dev':
    default:
      return 'development';
  }
}

/**
 * Get configuration for current environment
 */
export function getConfig(): ClientConfig {
  const environment = getCurrentEnvironment();
  const baseConfig = environmentConfigs[environment];
  
  // Allow environment variable overrides
  const config: ClientConfig = {
    ...baseConfig,
    
    // Override with environment variables if provided
    serverUrl: process.env.REACT_APP_SERVER_URL || baseConfig.serverUrl,
    socketTimeout: parseInt(process.env.REACT_APP_SOCKET_TIMEOUT || '') || baseConfig.socketTimeout,
    reconnectAttempts: parseInt(process.env.REACT_APP_RECONNECT_ATTEMPTS || '') || baseConfig.reconnectAttempts,
    reconnectDelay: parseInt(process.env.REACT_APP_RECONNECT_DELAY || '') || baseConfig.reconnectDelay,
    
    // Feature flags from environment
    enableDevTools: process.env.REACT_APP_ENABLE_DEVTOOLS === 'true' || baseConfig.enableDevTools,
    enableDebugMode: process.env.REACT_APP_DEBUG_MODE === 'true' || baseConfig.enableDebugMode,
    enablePerformanceMonitoring: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true' || baseConfig.enablePerformanceMonitoring,
    enableErrorReporting: process.env.REACT_APP_ENABLE_ERROR_REPORTING === 'true' || baseConfig.enableErrorReporting,
    
    // Logging configuration
    logLevel: (process.env.REACT_APP_LOG_LEVEL as any) || baseConfig.logLevel,
    enableConsoleLogging: process.env.REACT_APP_ENABLE_CONSOLE_LOGGING === 'true' || baseConfig.enableConsoleLogging,
    enableRemoteLogging: process.env.REACT_APP_ENABLE_REMOTE_LOGGING === 'true' || baseConfig.enableRemoteLogging,
    
    // Game configuration
    drawingTimeLimit: parseInt(process.env.REACT_APP_DRAWING_TIME_LIMIT || '') || baseConfig.drawingTimeLimit,
    maxPlayers: parseInt(process.env.REACT_APP_MAX_PLAYERS || '') || baseConfig.maxPlayers,
    enableRealTimeDrawing: process.env.REACT_APP_ENABLE_REALTIME_DRAWING === 'true' || baseConfig.enableRealTimeDrawing,
    
    // Development features
    enableTestUtils: process.env.REACT_APP_ENABLE_TEST_UTILS === 'true' || baseConfig.enableTestUtils,
    enableMockData: process.env.REACT_APP_ENABLE_MOCK_DATA === 'true' || baseConfig.enableMockData,
    autoConnectInDev: process.env.REACT_APP_AUTO_CONNECT_DEV === 'true' || baseConfig.autoConnectInDev
  };
  
  return config;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof ClientConfig): boolean {
  const config = getConfig();
  return Boolean(config[feature]);
}

/**
 * Get environment-specific configuration value
 */
export function getConfigValue<K extends keyof ClientConfig>(key: K): ClientConfig[K] {
  const config = getConfig();
  return config[key];
}

/**
 * Development helper to log current configuration
 */
export function logCurrentConfig(): void {
  if (getCurrentEnvironment() === 'development') {
    const config = getConfig();
    console.group('🔧 Current Configuration');
    console.log('Environment:', getCurrentEnvironment());
    console.log('Server URL:', config.serverUrl);
    console.log('Debug Mode:', config.enableDebugMode);
    console.log('DevTools:', config.enableDevTools);
    console.log('Log Level:', config.logLevel);
    console.groupEnd();
  }
}

/**
 * Validate configuration
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const config = getConfig();
  const errors: string[] = [];
  
  // Validate server URL
  if (!config.serverUrl) {
    errors.push('Server URL is required');
  } else {
    try {
      new URL(config.serverUrl);
    } catch {
      errors.push('Invalid server URL format');
    }
  }
  
  // Validate numeric values
  if (config.socketTimeout <= 0) {
    errors.push('Socket timeout must be positive');
  }
  
  if (config.reconnectAttempts < 0) {
    errors.push('Reconnect attempts cannot be negative');
  }
  
  if (config.drawingTimeLimit <= 0) {
    errors.push('Drawing time limit must be positive');
  }
  
  if (config.maxPlayers <= 0 || config.maxPlayers > 20) {
    errors.push('Max players must be between 1 and 20');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Export the current configuration as default
export default getConfig();
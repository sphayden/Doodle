/**
 * Server Environment Configuration Management
 * Handles different configurations for development, staging, and production environments
 */

require('dotenv').config();

/**
 * Get current environment
 */
function getCurrentEnvironment() {
  const env = process.env.NODE_ENV || process.env.ENVIRONMENT || 'development';
  
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
 * Environment-specific configurations
 */
const environmentConfigs = {
  development: {
    // Server Configuration
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    
    // Database Configuration (if needed in future)
    databaseUrl: process.env.DATABASE_URL || 'sqlite://./dev.db',
    
    // Logging Configuration
    logLevel: process.env.LOG_LEVEL || 'debug',
    enableConsoleLogging: true,
    enableFileLogging: true,
    enableRemoteLogging: false,
    logDirectory: './logs',
    
    // Game Configuration
    maxRooms: parseInt(process.env.MAX_ROOMS) || 100,
    maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 8,
    roomCleanupInterval: parseInt(process.env.ROOM_CLEANUP_INTERVAL) || 300000, // 5 minutes
    drawingTimeLimit: parseInt(process.env.DRAWING_TIME_LIMIT) || 60,
    votingTimeLimit: parseInt(process.env.VOTING_TIME_LIMIT) || 30,
    
    // AI Configuration
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    enableAiJudging: process.env.ENABLE_AI_JUDGING === 'true',
    aiModel: process.env.AI_MODEL || 'gpt-4-vision-preview',
    aiTimeout: parseInt(process.env.AI_TIMEOUT) || 30000,
    
    // Security Configuration
    enableCors: true,
    corsOrigins: [process.env.CLIENT_URL || 'http://localhost:3000'],
    enableRateLimiting: false, // Disabled in dev for easier testing
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // requests per window
    
    // Performance Configuration
    enableCompression: false, // Disabled in dev for easier debugging
    enableCaching: false,
    cacheTimeout: 300, // 5 minutes
    
    // Monitoring Configuration
    enableMetrics: true,
    enableHealthCheck: true,
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
    
    // Development Features
    enableDebugEndpoints: true,
    enableTestEndpoints: true,
    enableMockData: true,
    verboseLogging: true
  },
  
  staging: {
    // Server Configuration
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
    clientUrl: process.env.CLIENT_URL || 'https://staging-doodle.example.com',
    
    // Database Configuration
    databaseUrl: process.env.DATABASE_URL || 'postgresql://user:pass@localhost/doodle_staging',
    
    // Logging Configuration
    logLevel: process.env.LOG_LEVEL || 'info',
    enableConsoleLogging: true,
    enableFileLogging: true,
    enableRemoteLogging: true,
    logDirectory: './logs',
    
    // Game Configuration
    maxRooms: parseInt(process.env.MAX_ROOMS) || 500,
    maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 8,
    roomCleanupInterval: parseInt(process.env.ROOM_CLEANUP_INTERVAL) || 180000, // 3 minutes
    drawingTimeLimit: parseInt(process.env.DRAWING_TIME_LIMIT) || 60,
    votingTimeLimit: parseInt(process.env.VOTING_TIME_LIMIT) || 30,
    
    // AI Configuration
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    enableAiJudging: process.env.ENABLE_AI_JUDGING !== 'false',
    aiModel: process.env.AI_MODEL || 'gpt-4-vision-preview',
    aiTimeout: parseInt(process.env.AI_TIMEOUT) || 30000,
    
    // Security Configuration
    enableCors: true,
    corsOrigins: [process.env.CLIENT_URL || 'https://staging-doodle.example.com'],
    enableRateLimiting: true,
    rateLimitWindow: 15 * 60 * 1000,
    rateLimitMax: 200,
    
    // Performance Configuration
    enableCompression: true,
    enableCaching: true,
    cacheTimeout: 600, // 10 minutes
    
    // Monitoring Configuration
    enableMetrics: true,
    enableHealthCheck: true,
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
    
    // Development Features
    enableDebugEndpoints: true, // Keep debug endpoints in staging
    enableTestEndpoints: false,
    enableMockData: false,
    verboseLogging: false
  },
  
  production: {
    // Server Configuration
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
    clientUrl: process.env.CLIENT_URL || 'https://doodle-game.com',
    
    // Database Configuration
    databaseUrl: process.env.DATABASE_URL || 'postgresql://user:pass@localhost/doodle_production',
    
    // Logging Configuration
    logLevel: process.env.LOG_LEVEL || 'warn',
    enableConsoleLogging: false, // Use structured logging in production
    enableFileLogging: true,
    enableRemoteLogging: true,
    logDirectory: './logs',
    
    // Game Configuration
    maxRooms: parseInt(process.env.MAX_ROOMS) || 1000,
    maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 8,
    roomCleanupInterval: parseInt(process.env.ROOM_CLEANUP_INTERVAL) || 120000, // 2 minutes
    drawingTimeLimit: parseInt(process.env.DRAWING_TIME_LIMIT) || 60,
    votingTimeLimit: parseInt(process.env.VOTING_TIME_LIMIT) || 30,
    
    // AI Configuration
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    enableAiJudging: process.env.ENABLE_AI_JUDGING !== 'false',
    aiModel: process.env.AI_MODEL || 'gpt-4-vision-preview',
    aiTimeout: parseInt(process.env.AI_TIMEOUT) || 30000,
    
    // Security Configuration
    enableCors: true,
    corsOrigins: [process.env.CLIENT_URL || 'https://doodle-game.com'],
    enableRateLimiting: true,
    rateLimitWindow: 15 * 60 * 1000,
    rateLimitMax: 100,
    
    // Performance Configuration
    enableCompression: true,
    enableCaching: true,
    cacheTimeout: 1800, // 30 minutes
    
    // Monitoring Configuration
    enableMetrics: true,
    enableHealthCheck: true,
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
    
    // Development Features
    enableDebugEndpoints: false, // No debug endpoints in production
    enableTestEndpoints: false,
    enableMockData: false,
    verboseLogging: false
  },
  
  test: {
    // Server Configuration
    port: parseInt(process.env.PORT) || 3002, // Different port for tests
    host: process.env.HOST || 'localhost',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    
    // Database Configuration
    databaseUrl: process.env.DATABASE_URL || 'sqlite://./test.db',
    
    // Logging Configuration
    logLevel: process.env.LOG_LEVEL || 'error', // Only log errors in tests
    enableConsoleLogging: false,
    enableFileLogging: false,
    enableRemoteLogging: false,
    logDirectory: './test-logs',
    
    // Game Configuration
    maxRooms: parseInt(process.env.MAX_ROOMS) || 10,
    maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 4,
    roomCleanupInterval: parseInt(process.env.ROOM_CLEANUP_INTERVAL) || 10000, // 10 seconds
    drawingTimeLimit: parseInt(process.env.DRAWING_TIME_LIMIT) || 10,
    votingTimeLimit: parseInt(process.env.VOTING_TIME_LIMIT) || 5,
    
    // AI Configuration
    openaiApiKey: process.env.OPENAI_API_KEY || 'test-key',
    enableAiJudging: false, // Disable AI in tests
    aiModel: process.env.AI_MODEL || 'gpt-4-vision-preview',
    aiTimeout: parseInt(process.env.AI_TIMEOUT) || 5000,
    
    // Security Configuration
    enableCors: true,
    corsOrigins: ['http://localhost:3000'],
    enableRateLimiting: false, // Disabled for tests
    rateLimitWindow: 15 * 60 * 1000,
    rateLimitMax: 1000,
    
    // Performance Configuration
    enableCompression: false,
    enableCaching: false,
    cacheTimeout: 60,
    
    // Monitoring Configuration
    enableMetrics: false,
    enableHealthCheck: false,
    metricsPort: parseInt(process.env.METRICS_PORT) || 9091,
    
    // Development Features
    enableDebugEndpoints: true,
    enableTestEndpoints: true,
    enableMockData: true,
    verboseLogging: false
  }
};

/**
 * Get configuration for current environment
 */
function getConfig() {
  const environment = getCurrentEnvironment();
  const config = environmentConfigs[environment];
  
  if (!config) {
    throw new Error(`No configuration found for environment: ${environment}`);
  }
  
  return {
    ...config,
    environment
  };
}

/**
 * Validate configuration
 */
function validateConfig() {
  const config = getConfig();
  const errors = [];
  
  // Validate required fields
  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('Invalid port number');
  }
  
  if (!config.clientUrl) {
    errors.push('Client URL is required');
  }
  
  if (config.enableAiJudging && !config.openaiApiKey) {
    errors.push('OpenAI API key is required when AI judging is enabled');
  }
  
  if (config.maxRooms <= 0) {
    errors.push('Max rooms must be positive');
  }
  
  if (config.maxPlayersPerRoom <= 0 || config.maxPlayersPerRoom > 20) {
    errors.push('Max players per room must be between 1 and 20');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Log current configuration (development only)
 */
function logCurrentConfig() {
  const config = getConfig();
  
  if (config.environment === 'development' && config.verboseLogging) {
    console.log('\n🔧 Server Configuration:');
    console.log(`Environment: ${config.environment}`);
    console.log(`Port: ${config.port}`);
    console.log(`Client URL: ${config.clientUrl}`);
    console.log(`Log Level: ${config.logLevel}`);
    console.log(`AI Judging: ${config.enableAiJudging ? 'Enabled' : 'Disabled'}`);
    console.log(`Max Rooms: ${config.maxRooms}`);
    console.log(`Max Players per Room: ${config.maxPlayersPerRoom}`);
    console.log('');
  }
}

module.exports = {
  getCurrentEnvironment,
  getConfig,
  validateConfig,
  logCurrentConfig
};
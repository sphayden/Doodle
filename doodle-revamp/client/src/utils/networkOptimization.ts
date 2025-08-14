/**
 * Network Optimization Utilities
 * 
 * This module provides utilities for optimizing network communication including:
 * - Message batching for frequent updates
 * - Compression for large payloads (drawing data)
 * - Connection pooling and management
 * - Request queuing and throttling
 */

import { NetworkMessage } from '../interfaces';
import logger from './logger';

/**
 * Message batching configuration
 */
interface BatchConfig {
  /** Maximum number of messages to batch together */
  maxBatchSize: number;
  /** Maximum time to wait before sending a batch (ms) */
  maxBatchDelay: number;
  /** Message types that should be batched */
  batchableTypes: string[];
}

/**
 * Compression configuration
 */
interface CompressionConfig {
  /** Minimum payload size to trigger compression (bytes) */
  minCompressionSize: number;
  /** Message types that should be compressed */
  compressibleTypes: string[];
  /** Compression level (1-9, higher = better compression but slower) */
  compressionLevel: number;
}

/**
 * Connection pool configuration
 */
interface ConnectionPoolConfig {
  /** Maximum number of concurrent connections */
  maxConnections: number;
  /** Connection timeout in milliseconds */
  connectionTimeout: number;
  /** Keep-alive interval in milliseconds */
  keepAliveInterval: number;
}

/**
 * Default configurations
 */
const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 10,
  maxBatchDelay: 100, // 100ms
  batchableTypes: ['drawing-stroke', 'cursor-position', 'typing-indicator']
};

const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  minCompressionSize: 1024, // 1KB
  compressibleTypes: ['submit-drawing', 'game-state-update'],
  compressionLevel: 6
};

const DEFAULT_CONNECTION_POOL_CONFIG: ConnectionPoolConfig = {
  maxConnections: 5,
  connectionTimeout: 10000, // 10 seconds
  keepAliveInterval: 30000 // 30 seconds
};



/**
 * Compressed message container
 */
interface CompressedMessage {
  type: 'compressed';
  originalType: string;
  compressedData: string;
  originalSize: number;
  compressedSize: number;
}

/**
 * Message Batcher - Batches frequent messages to reduce network overhead
 */
export class MessageBatcher {
  private config: BatchConfig;
  private pendingBatches: Map<string, NetworkMessage[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private sendCallback: (messages: NetworkMessage[]) => void;

  constructor(
    sendCallback: (messages: NetworkMessage[]) => void,
    config: Partial<BatchConfig> = {}
  ) {
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config };
    this.sendCallback = sendCallback;
  }

  /**
   * Add a message to the batch queue
   */
  addMessage(message: NetworkMessage): void {
    const { type } = message;

    // Check if this message type should be batched
    if (!this.config.batchableTypes.includes(type)) {
      // Send immediately for non-batchable messages
      this.sendCallback([message]);
      return;
    }

    // Add to pending batch
    if (!this.pendingBatches.has(type)) {
      this.pendingBatches.set(type, []);
    }

    const batch = this.pendingBatches.get(type)!;
    batch.push(message);

    // Check if batch is full
    if (batch.length >= this.config.maxBatchSize) {
      this.flushBatch(type);
      return;
    }

    // Set timer if not already set
    if (!this.batchTimers.has(type)) {
      const timer = setTimeout(() => {
        this.flushBatch(type);
      }, this.config.maxBatchDelay);
      
      this.batchTimers.set(type, timer);
    }
  }

  /**
   * Flush a specific batch type
   */
  private flushBatch(type: string): void {
    const batch = this.pendingBatches.get(type);
    if (!batch || batch.length === 0) {
      return;
    }

    // Clear timer
    const timer = this.batchTimers.get(type);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(type);
    }

    // Send batch
    this.sendCallback(batch);
    
    // Clear batch
    this.pendingBatches.set(type, []);

    logger.debug(`Flushed batch of ${batch.length} messages for type: ${type}`, 'NETWORK');
  }

  /**
   * Flush all pending batches
   */
  flushAll(): void {
    const types = Array.from(this.pendingBatches.keys());
    for (const type of types) {
      this.flushBatch(type);
    }
  }

  /**
   * Get batch statistics
   */
  getStats(): { [type: string]: { pending: number; hasPendingTimer: boolean } } {
    const stats: { [type: string]: { pending: number; hasPendingTimer: boolean } } = {};
    
    const entries = Array.from(this.pendingBatches.entries());
    for (const [type, batch] of entries) {
      stats[type] = {
        pending: batch.length,
        hasPendingTimer: this.batchTimers.has(type)
      };
    }
    
    return stats;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all timers
    const timers = Array.from(this.batchTimers.values());
    for (const timer of timers) {
      clearTimeout(timer);
    }
    
    this.batchTimers.clear();
    this.pendingBatches.clear();
  }
}

/**
 * Message Compressor - Compresses large payloads to reduce bandwidth usage
 */
export class MessageCompressor {
  private config: CompressionConfig;

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = { ...DEFAULT_COMPRESSION_CONFIG, ...config };
  }

  /**
   * Compress a message if it meets compression criteria
   */
  compressMessage(message: NetworkMessage): NetworkMessage | CompressedMessage {
    const { type, data } = message;

    // Check if this message type should be compressed
    if (!this.config.compressibleTypes.includes(type)) {
      return message;
    }

    const serializedData = JSON.stringify(data);
    const originalSize = new Blob([serializedData]).size;

    // Check if message is large enough to warrant compression
    if (originalSize < this.config.minCompressionSize) {
      return message;
    }

    try {
      // Use simple LZ-string compression (would need to install lz-string package)
      // For now, we'll simulate compression with base64 encoding
      const compressedData = this.simpleCompress(serializedData);
      const compressedSize = new Blob([compressedData]).size;

      // Only use compression if it actually reduces size
      if (compressedSize < originalSize * 0.9) { // At least 10% reduction
        logger.debug(`Compressed message: ${originalSize} -> ${compressedSize} bytes (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`, 'NETWORK');
        
        return {
          type: 'compressed',
          originalType: type,
          compressedData,
          originalSize,
          compressedSize
        };
      }
    } catch (error) {
      logger.warn('Failed to compress message', 'NETWORK', { error: error instanceof Error ? error.message : String(error) });
    }

    return message;
  }

  /**
   * Decompress a compressed message
   */
  decompressMessage(compressedMessage: CompressedMessage): NetworkMessage {
    try {
      const decompressedData = this.simpleDecompress(compressedMessage.compressedData);
      const data = JSON.parse(decompressedData);

      return {
        type: compressedMessage.originalType,
        data,
        timestamp: new Date(),
        direction: 'received'
      };
    } catch (error) {
      logger.error('Failed to decompress message', 'NETWORK', { error: error instanceof Error ? error.message : String(error) });
      throw new Error('Message decompression failed');
    }
  }

  /**
   * Simple compression simulation (in real implementation, use LZ-string or similar)
   */
  private simpleCompress(data: string): string {
    // This is a placeholder - in real implementation, use proper compression
    return btoa(data);
  }

  /**
   * Simple decompression simulation
   */
  private simpleDecompress(compressedData: string): string {
    // This is a placeholder - in real implementation, use proper decompression
    return atob(compressedData);
  }

  /**
   * Check if a message is compressed
   */
  static isCompressed(message: any): message is CompressedMessage {
    return message && message.type === 'compressed' && 'compressedData' in message;
  }
}

/**
 * Connection Pool Manager - Manages multiple connections for better performance
 */
export class ConnectionPoolManager {
  private config: ConnectionPoolConfig;
  private connections: Map<string, any> = new Map(); // Socket connections
  private connectionStats: Map<string, { created: number; lastUsed: number; messageCount: number }> = new Map();
  private keepAliveTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = { ...DEFAULT_CONNECTION_POOL_CONFIG, ...config };
    this.startKeepAlive();
  }

  /**
   * Get or create a connection for a specific purpose
   */
  getConnection(connectionId: string, createFn: () => any): any {
    let connection = this.connections.get(connectionId);
    
    if (!connection) {
      // Check if we've reached the connection limit
      if (this.connections.size >= this.config.maxConnections) {
        // Remove the least recently used connection
        this.removeLeastRecentlyUsedConnection();
      }

      // Create new connection
      connection = createFn();
      this.connections.set(connectionId, connection);
      this.connectionStats.set(connectionId, {
        created: Date.now(),
        lastUsed: Date.now(),
        messageCount: 0
      });

      logger.debug(`Created new connection: ${connectionId}`, 'NETWORK');
    } else {
      // Update usage stats for existing connection
      const stats = this.connectionStats.get(connectionId);
      if (stats) {
        stats.lastUsed = Date.now();
        stats.messageCount++;
      }
    }

    return connection;
  }

  /**
   * Remove a specific connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Close connection if it has a close method
      if (typeof connection.close === 'function') {
        connection.close();
      } else if (typeof connection.disconnect === 'function') {
        connection.disconnect();
      }

      this.connections.delete(connectionId);
      this.connectionStats.delete(connectionId);
      
      logger.debug(`Removed connection: ${connectionId}`, 'NETWORK');
    }
  }

  /**
   * Remove the least recently used connection
   */
  private removeLeastRecentlyUsedConnection(): void {
    let oldestConnectionId: string | null = null;
    let oldestTime = Date.now();

    const entries = Array.from(this.connectionStats.entries());
    for (const [connectionId, stats] of entries) {
      if (stats.lastUsed < oldestTime) {
        oldestTime = stats.lastUsed;
        oldestConnectionId = connectionId;
      }
    }

    if (oldestConnectionId) {
      this.removeConnection(oldestConnectionId);
    }
  }

  /**
   * Start keep-alive mechanism
   */
  private startKeepAlive(): void {
    this.keepAliveTimer = setInterval(() => {
      const now = Date.now();
      const staleConnections: string[] = [];

      // Find stale connections
      const statsEntries = Array.from(this.connectionStats.entries());
      for (const [connectionId, stats] of statsEntries) {
        if (now - stats.lastUsed > this.config.keepAliveInterval * 2) {
          staleConnections.push(connectionId);
        }
      }

      // Remove stale connections
      for (const connectionId of staleConnections) {
        this.removeConnection(connectionId);
      }

      // Send keep-alive to remaining connections
      const connectionEntries = Array.from(this.connections.entries());
      for (const [, connection] of connectionEntries) {
        if (typeof connection.ping === 'function') {
          connection.ping();
        }
      }
    }, this.config.keepAliveInterval);
  }

  /**
   * Get connection pool statistics
   */
  getStats(): {
    totalConnections: number;
    maxConnections: number;
    connections: { [id: string]: { age: number; lastUsed: number; messageCount: number } };
  } {
    const now = Date.now();
    const connections: { [id: string]: { age: number; lastUsed: number; messageCount: number } } = {};

    const statsEntries = Array.from(this.connectionStats.entries());
    for (const [connectionId, stats] of statsEntries) {
      connections[connectionId] = {
        age: now - stats.created,
        lastUsed: now - stats.lastUsed,
        messageCount: stats.messageCount
      };
    }

    return {
      totalConnections: this.connections.size,
      maxConnections: this.config.maxConnections,
      connections
    };
  }

  /**
   * Cleanup all connections
   */
  destroy(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    // Close all connections
    const connectionIds = Array.from(this.connections.keys());
    for (const connectionId of connectionIds) {
      this.removeConnection(connectionId);
    }
  }
}

/**
 * Request Queue Manager - Manages request queuing and throttling
 */
export class RequestQueueManager {
  private queue: Array<{ request: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private processing = false;
  private maxConcurrent: number;
  private currentConcurrent = 0;
  private requestDelay: number;

  constructor(maxConcurrent = 3, requestDelay = 50) {
    this.maxConcurrent = maxConcurrent;
    this.requestDelay = requestDelay;
  }

  /**
   * Add a request to the queue
   */
  enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.currentConcurrent >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.currentConcurrent < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) break;

      this.currentConcurrent++;

      // Process request with delay
      setTimeout(async () => {
        try {
          const result = await item.request();
          item.resolve(result);
        } catch (error) {
          item.reject(error);
        } finally {
          this.currentConcurrent--;
          this.processQueue(); // Process next items
        }
      }, this.requestDelay);
    }

    this.processing = false;
  }

  /**
   * Get queue statistics
   */
  getStats(): { queueLength: number; currentConcurrent: number; maxConcurrent: number } {
    return {
      queueLength: this.queue.length,
      currentConcurrent: this.currentConcurrent,
      maxConcurrent: this.maxConcurrent
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    // Reject all pending requests
    for (const item of this.queue) {
      item.reject(new Error('Queue cleared'));
    }
    this.queue = [];
  }
}

/**
 * Network Optimization Manager - Coordinates all optimization features
 */
export class NetworkOptimizationManager {
  private messageBatcher: MessageBatcher;
  private messageCompressor: MessageCompressor;
  private connectionPool: ConnectionPoolManager;
  private requestQueue: RequestQueueManager;

  constructor(
    sendCallback: (messages: NetworkMessage[]) => void,
    batchConfig?: Partial<BatchConfig>,
    compressionConfig?: Partial<CompressionConfig>,
    connectionPoolConfig?: Partial<ConnectionPoolConfig>
  ) {
    this.messageBatcher = new MessageBatcher(sendCallback, batchConfig);
    this.messageCompressor = new MessageCompressor(compressionConfig);
    this.connectionPool = new ConnectionPoolManager(connectionPoolConfig);
    this.requestQueue = new RequestQueueManager();
  }

  /**
   * Process an outgoing message with all optimizations
   */
  processOutgoingMessage(message: NetworkMessage): void {
    // First compress if needed
    const processedMessage = this.messageCompressor.compressMessage(message);
    
    // Then add to batch queue
    this.messageBatcher.addMessage(processedMessage as NetworkMessage);
  }

  /**
   * Process an incoming message with decompression
   */
  processIncomingMessage(message: any): NetworkMessage {
    if (MessageCompressor.isCompressed(message)) {
      return this.messageCompressor.decompressMessage(message);
    }
    return message as NetworkMessage;
  }

  /**
   * Get a managed connection
   */
  getConnection(connectionId: string, createFn: () => any): any {
    return this.connectionPool.getConnection(connectionId, createFn);
  }

  /**
   * Queue a request for throttled execution
   */
  queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return this.requestQueue.enqueue(request);
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): {
    batching: { [type: string]: { pending: number; hasPendingTimer: boolean } };
    connectionPool: {
      totalConnections: number;
      maxConnections: number;
      connections: { [id: string]: { age: number; lastUsed: number; messageCount: number } };
    };
    requestQueue: { queueLength: number; currentConcurrent: number; maxConcurrent: number };
  } {
    return {
      batching: this.messageBatcher.getStats(),
      connectionPool: this.connectionPool.getStats(),
      requestQueue: this.requestQueue.getStats()
    };
  }

  /**
   * Flush all pending operations
   */
  flush(): void {
    this.messageBatcher.flushAll();
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.messageBatcher.destroy();
    this.connectionPool.destroy();
    // Don't clear the request queue as it may have pending operations
    // this.requestQueue.clear();
  }
}
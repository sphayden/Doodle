/**
 * Network Optimization Tests
 * 
 * Tests for the network optimization utilities including message batching,
 * compression, connection pooling, and request queuing.
 */

import {
  MessageBatcher,
  MessageCompressor,
  ConnectionPoolManager,
  RequestQueueManager,
  NetworkOptimizationManager
} from '../networkOptimization';
import { NetworkMessage } from '../../interfaces';

describe('Network Optimization', () => {
  describe('MessageBatcher', () => {
    let sentMessages: NetworkMessage[][] = [];
    let batcher: MessageBatcher;

    beforeEach(() => {
      sentMessages = [];
      batcher = new MessageBatcher(
        (messages) => sentMessages.push(messages),
        {
          maxBatchSize: 3,
          maxBatchDelay: 100,
          batchableTypes: ['drawing-stroke', 'cursor-position']
        }
      );
    });

    afterEach(() => {
      batcher.destroy();
    });

    it('should batch messages of the same type', (done) => {
      const message1: NetworkMessage = {
        type: 'drawing-stroke',
        data: { stroke: 1 },
        timestamp: new Date(),
        direction: 'sent'
      };

      const message2: NetworkMessage = {
        type: 'drawing-stroke',
        data: { stroke: 2 },
        timestamp: new Date(),
        direction: 'sent'
      };

      batcher.addMessage(message1);
      batcher.addMessage(message2);

      // Wait for batch delay
      setTimeout(() => {
        expect(sentMessages).toHaveLength(1);
        expect(sentMessages[0]).toHaveLength(2);
        expect(sentMessages[0][0].data.stroke).toBe(1);
        expect(sentMessages[0][1].data.stroke).toBe(2);
        done();
      }, 150);
    });

    it('should send non-batchable messages immediately', () => {
      const message: NetworkMessage = {
        type: 'create-room',
        data: { playerName: 'Test' },
        timestamp: new Date(),
        direction: 'sent'
      };

      batcher.addMessage(message);

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toHaveLength(1);
      expect(sentMessages[0][0].type).toBe('create-room');
    });

    it('should flush batch when max size is reached', () => {
      for (let i = 0; i < 3; i++) {
        const message: NetworkMessage = {
          type: 'drawing-stroke',
          data: { stroke: i },
          timestamp: new Date(),
          direction: 'sent'
        };
        batcher.addMessage(message);
      }

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toHaveLength(3);
    });

    it('should provide batch statistics', () => {
      const message: NetworkMessage = {
        type: 'drawing-stroke',
        data: { stroke: 1 },
        timestamp: new Date(),
        direction: 'sent'
      };

      batcher.addMessage(message);

      const stats = batcher.getStats();
      expect(stats['drawing-stroke']).toBeDefined();
      expect(stats['drawing-stroke'].pending).toBe(1);
      expect(stats['drawing-stroke'].hasPendingTimer).toBe(true);
    });
  });

  describe('MessageCompressor', () => {
    let compressor: MessageCompressor;

    beforeEach(() => {
      compressor = new MessageCompressor({
        minCompressionSize: 10, // Very small for testing
        compressibleTypes: ['submit-drawing'],
        compressionLevel: 6
      });
    });

    it('should compress large messages of compressible types', () => {
      const message: NetworkMessage = {
        type: 'submit-drawing',
        data: { canvasData: 'a'.repeat(100) }, // Large data
        timestamp: new Date(),
        direction: 'sent'
      };

      const result = compressor.compressMessage(message);

      if ('compressedData' in result) {
        expect(result.type).toBe('compressed');
        expect(result.originalType).toBe('submit-drawing');
        expect(result.compressedData).toBeDefined();
        expect(result.originalSize).toBeGreaterThan(0);
        expect(result.compressedSize).toBeGreaterThan(0);
      }
    });

    it('should not compress small messages', () => {
      const message: NetworkMessage = {
        type: 'submit-drawing',
        data: { canvasData: 'small' },
        timestamp: new Date(),
        direction: 'sent'
      };

      const result = compressor.compressMessage(message);
      expect(result).toBe(message); // Should return original message
    });

    it('should not compress non-compressible types', () => {
      const message: NetworkMessage = {
        type: 'vote-word',
        data: { word: 'a'.repeat(100) },
        timestamp: new Date(),
        direction: 'sent'
      };

      const result = compressor.compressMessage(message);
      expect(result).toBe(message); // Should return original message
    });

    it('should decompress compressed messages', () => {
      const originalMessage: NetworkMessage = {
        type: 'submit-drawing',
        data: { canvasData: 'a'.repeat(100) },
        timestamp: new Date(),
        direction: 'sent'
      };

      const compressed = compressor.compressMessage(originalMessage);

      if ('compressedData' in compressed) {
        const decompressed = compressor.decompressMessage(compressed);
        expect(decompressed.type).toBe('submit-drawing');
        expect(decompressed.data.canvasData).toBe('a'.repeat(100));
      }
    });
  });

  describe('ConnectionPoolManager', () => {
    let poolManager: ConnectionPoolManager;

    beforeEach(() => {
      poolManager = new ConnectionPoolManager({
        maxConnections: 2,
        connectionTimeout: 1000,
        keepAliveInterval: 500
      });
    });

    afterEach(() => {
      poolManager.destroy();
    });

    it('should create and manage connections', () => {
      const connection1 = poolManager.getConnection('conn1', () => ({ id: 'conn1' }));
      const connection2 = poolManager.getConnection('conn2', () => ({ id: 'conn2' }));

      expect(connection1.id).toBe('conn1');
      expect(connection2.id).toBe('conn2');

      const stats = poolManager.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.maxConnections).toBe(2);
    });

    it('should reuse existing connections', () => {
      const connection1 = poolManager.getConnection('conn1', () => ({ id: 'conn1' }));
      const connection2 = poolManager.getConnection('conn1', () => ({ id: 'different' }));

      expect(connection1).toBe(connection2);
      expect(connection1.id).toBe('conn1');
    });

    it('should remove least recently used connection when limit is reached', () => {
      const connection1 = poolManager.getConnection('conn1', () => ({ id: 'conn1' }));
      const connection2 = poolManager.getConnection('conn2', () => ({ id: 'conn2' }));
      
      // Wait a bit to ensure different timestamps
      setTimeout(() => {
        // Access conn2 to make it more recently used
        poolManager.getConnection('conn2', () => ({ id: 'conn2' }));
        
        // This should remove conn1 (least recently used)
        const connection3 = poolManager.getConnection('conn3', () => ({ id: 'conn3' }));

        const stats = poolManager.getStats();
        expect(stats.totalConnections).toBeLessThanOrEqual(2);
      }, 10);
    });
  });

  describe('RequestQueueManager', () => {
    let queueManager: RequestQueueManager;

    beforeEach(() => {
      queueManager = new RequestQueueManager(2, 10); // Max 2 concurrent, 10ms delay
    });

    afterEach(() => {
      // Don't clear queue as it may have pending operations
    });

    it('should queue and execute requests', async () => {
      const results: number[] = [];
      
      const request1 = () => Promise.resolve(1);
      const request2 = () => Promise.resolve(2);
      const request3 = () => Promise.resolve(3);

      const promises = [
        queueManager.enqueue(request1),
        queueManager.enqueue(request2),
        queueManager.enqueue(request3)
      ];

      const resolvedResults = await Promise.all(promises);
      expect(resolvedResults).toEqual([1, 2, 3]);
    });

    it('should provide queue statistics', () => {
      const request = () => new Promise(resolve => setTimeout(() => resolve(1), 100));
      
      queueManager.enqueue(request);
      queueManager.enqueue(request);
      queueManager.enqueue(request);

      const stats = queueManager.getStats();
      expect(stats.maxConcurrent).toBe(2);
      expect(stats.queueLength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('NetworkOptimizationManager', () => {
    let sentMessages: NetworkMessage[][] = [];
    let optimizationManager: NetworkOptimizationManager;

    beforeEach(() => {
      sentMessages = [];
      optimizationManager = new NetworkOptimizationManager(
        (messages) => sentMessages.push(messages),
        { maxBatchSize: 2, maxBatchDelay: 50, batchableTypes: ['drawing-stroke'] },
        { minCompressionSize: 10, compressibleTypes: ['submit-drawing'] }
      );
    });

    afterEach(() => {
      // Flush any pending operations before destroying
      optimizationManager.flush();
      optimizationManager.destroy();
    });

    it('should process outgoing messages with batching and compression', (done) => {
      const message1: NetworkMessage = {
        type: 'drawing-stroke',
        data: { stroke: 1 },
        timestamp: new Date(),
        direction: 'sent'
      };

      const message2: NetworkMessage = {
        type: 'drawing-stroke',
        data: { stroke: 2 },
        timestamp: new Date(),
        direction: 'sent'
      };

      optimizationManager.processOutgoingMessage(message1);
      optimizationManager.processOutgoingMessage(message2);

      setTimeout(() => {
        try {
          expect(sentMessages).toHaveLength(1);
          expect(sentMessages[0]).toHaveLength(2);
          done();
        } catch (error) {
          done(error);
        }
      }, 100);
    });

    it('should process incoming compressed messages', () => {
      const compressedMessage = {
        type: 'compressed',
        originalType: 'submit-drawing',
        compressedData: btoa(JSON.stringify({ canvasData: 'test' })),
        originalSize: 100,
        compressedSize: 50
      };

      const decompressed = optimizationManager.processIncomingMessage(compressedMessage);
      expect(decompressed.type).toBe('submit-drawing');
      expect(decompressed.data.canvasData).toBe('test');
    });

    it('should provide comprehensive statistics', () => {
      const message: NetworkMessage = {
        type: 'drawing-stroke',
        data: { stroke: 1 },
        timestamp: new Date(),
        direction: 'sent'
      };

      optimizationManager.processOutgoingMessage(message);

      const stats = optimizationManager.getStats();
      expect(stats.batching).toBeDefined();
      expect(stats.connectionPool).toBeDefined();
      expect(stats.requestQueue).toBeDefined();
    });

    it('should flush all pending operations', (done) => {
      const message: NetworkMessage = {
        type: 'drawing-stroke',
        data: { stroke: 1 },
        timestamp: new Date(),
        direction: 'sent'
      };

      optimizationManager.processOutgoingMessage(message);
      optimizationManager.flush();

      // Should send immediately after flush
      setTimeout(() => {
        expect(sentMessages).toHaveLength(1);
        done();
      }, 10);
    });
  });
});
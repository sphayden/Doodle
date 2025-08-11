import { NetworkResilienceManager, NetworkQuality } from '../networkResilience';

const fail = (message?: string) => {
  throw new Error(message || 'Test failed');
};

describe('NetworkResilienceManager', () => {
  let manager: NetworkResilienceManager;

  beforeEach(() => {
    manager = new NetworkResilienceManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  test('should execute requests with resilience', async () => {
    const mockRequest = jest.fn().mockResolvedValue('success');

    const result = await manager.executeWithResilience(mockRequest);

    expect(result).toBe('success');
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  test('should retry failed requests', async () => {
    const mockRequest = jest.fn()
      .mockRejectedValueOnce({ code: 'NETWORK_ERROR', message: 'Network error' })
      .mockResolvedValue('success');

    const result = await manager.executeWithResilience(mockRequest, {
      retryConfig: { maxAttempts: 2, baseDelay: 10 }
    });

    expect(result).toBe('success');
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  test('should fail after max attempts', async () => {
    const mockRequest = jest.fn().mockRejectedValue({ code: 'NETWORK_ERROR', message: 'Network error' });

    try {
      await manager.executeWithResilience(mockRequest, {
        retryConfig: { maxAttempts: 2, baseDelay: 10 }
      });
      fail('Expected function to throw');
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  test('should track health metrics', () => {
    const health = manager.getHealthMetrics();

    expect(health).toHaveProperty('isHealthy');
    expect(health).toHaveProperty('latency');
    expect(health).toHaveProperty('packetLoss');
    expect(health).toHaveProperty('consecutiveFailures');
  });

  test('should assess network quality', () => {
    const quality = manager.getNetworkQuality();

    expect(Object.values(NetworkQuality)).toContain(quality);
  });

  test('should manage circuit breaker', () => {
    const status = manager.getCircuitBreakerStatus();

    expect(status.state).toBe('closed');
    expect(status.failures).toBe(0);
    expect(status.lastFailure).toBeNull();
  });

  test('should reset circuit breaker', () => {
    manager.resetCircuitBreaker();
    
    const status = manager.getCircuitBreakerStatus();
    expect(status.state).toBe('closed');
    expect(status.failures).toBe(0);
  });
});
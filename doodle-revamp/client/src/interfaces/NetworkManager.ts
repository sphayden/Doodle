/**
 * NetworkManager Interface
 * 
 * Internal interface for handling network communication.
 * This is used internally by GameManager implementations and
 * should not be used directly by UI components.
 */

export interface NetworkManager {
  /**
   * Connect to the game server
   * @param serverUrl URL of the server to connect to
   */
  connect(serverUrl: string): Promise<void>;
  
  /**
   * Disconnect from the server
   */
  disconnect(): void;
  
  /**
   * Send a message to the server
   * @param event Event name
   * @param data Data to send
   */
  send(event: string, data: any): void;
  
  /**
   * Register an event handler
   * @param event Event name to listen for
   * @param handler Function to call when event occurs
   */
  on(event: string, handler: (data: any) => void): void;
  
  /**
   * Remove an event handler
   * @param event Event name
   * @param handler Handler function to remove (optional)
   */
  off(event: string, handler?: (data: any) => void): void;
  
  /**
   * Check if currently connected
   */
  isConnected(): boolean;
  
  /**
   * Get connection status
   */
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error';
  
  /**
   * Set connection timeout
   * @param timeout Timeout in milliseconds
   */
  setConnectionTimeout(timeout: number): void;
  
  /**
   * Enable/disable automatic reconnection
   * @param enabled Whether to enable auto-reconnect
   * @param maxAttempts Maximum number of reconnection attempts
   * @param delay Delay between attempts in milliseconds
   */
  setAutoReconnect(enabled: boolean, maxAttempts?: number, delay?: number): void;
}

/**
 * Network event types that the NetworkManager can emit
 */
export interface NetworkEvents {
  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'reconnect': (attemptNumber: number) => void;
  'reconnect_error': (error: Error) => void;
  'reconnect_failed': () => void;
  
  // Game events (these will be forwarded to GameManager)
  'room-created': (data: any) => void;
  'room-joined': (data: any) => void;
  'player-joined': (data: any) => void;
  'player-left': (data: any) => void;
  'voting-started': (data: any) => void;
  'vote-updated': (data: any) => void;
  'tiebreaker-started': (data: any) => void;
  'tiebreaker-resolved': (data: any) => void;
  'drawing-started': (data: any) => void;
  'drawing-submitted': (data: any) => void;
  'judging-complete': (data: any) => void;
  'real-time-stroke': (data: any) => void;
  'error': (data: any) => void;
}

/**
 * Configuration for NetworkManager
 */
export interface NetworkConfig {
  serverUrl: string;
  connectionTimeout: number;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  enableLogging: boolean;
}

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  serverUrl: 'http://localhost:3001',
  connectionTimeout: 10000, // 10 seconds
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 2000, // 2 seconds
  enableLogging: process.env.NODE_ENV === 'development'
};
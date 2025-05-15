/**
 * Energy Audit WebSocket Service
 * Handles real-time collaboration and events for energy audit components
 */

// Import the WebSocketEvent type from the hook
import { WebSocketEvent } from '../hooks/useEnergyAuditRealTime';

// Re-export the type for convenience
export type { WebSocketEvent };

// Additional types used by the service
export interface UserPresence {
  userId: string;
  userName: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  lastActivity?: string;
}

class EnergyAuditWebSocketService {
  private socket: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Connect to WebSocket server
   */
  connect(auditId: string, token: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // In a real implementation, would establish WebSocket connection
        // const wsUrl = `${WS_BASE_URL}/audit/${auditId}?token=${token}`;
        // this.socket = new WebSocket(wsUrl);
        
        // Mock successful connection
        this.isConnected = true;
        resolve(true);
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        this.isConnected = false;
        resolve(false);
      }
    });
  }
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      // this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  /**
   * Add event listener
   */
  addEventListener<T>(eventType: string, callback: (event: WebSocketEvent<T>) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType)?.push(callback);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener<T>(eventType: string, callback: (event: WebSocketEvent<T>) => void): void {
    if (!this.eventListeners.has(eventType)) {
      return;
    }
    
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      
      if (listeners.length === 0) {
        this.eventListeners.delete(eventType);
      } else {
        this.eventListeners.set(eventType, listeners);
      }
    }
  }
  
  /**
   * Send message to WebSocket server
   */
  sendMessage(type: string, data: any): boolean {
    if (!this.isConnected || !this.socket) {
      return false;
    }
    
    try {
      // this.socket.send(JSON.stringify({ type, data }));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }
  
  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Register global event handler
   */
  onEvent(handler: (event: any) => void): void {
    // In a real implementation, would register a global event handler
    console.log('Registered global event handler');
  }

  /**
   * Unregister global event handler
   */
  offEvent(handler: (event: any) => void): void {
    // In a real implementation, would unregister a global event handler
    console.log('Unregistered global event handler');
  }

  /**
   * Send an event through the websocket
   */
  sendEvent(eventType: string, data: any): boolean {
    if (!this.isConnected) {
      console.warn('Cannot send event while disconnected');
      return false;
    }

    console.log(`Sending event: ${eventType}`, data);
    return this.sendMessage(eventType, data);
  }
}

// Create and export singleton instance
const energyAuditWebSocketService = new EnergyAuditWebSocketService();
export default energyAuditWebSocketService; 
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import axios from 'axios';

export interface PowerUsageData {
  timestamp: string;
  powerUsage: number;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
  temperature: number;
  humidity: number;
}

export interface EnergyMetrics {
  totalConsumption: number;
  peakDemand: number;
  averageLoad: number;
  powerFactor: number;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8000';
  private powerDataSubject = new Subject<PowerUsageData>();
  private energyMetricsSubject = new Subject<EnergyMetrics>();
  private connectionStatusSubject = new Subject<boolean>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3; // Reduced max attempts to fail faster
  private isConnecting = false;
  private disableSocketConnection = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private manualTimeoutTimer: NodeJS.Timeout | null = null;
  private cooldownEndTime = 0;
  private readonly cooldownPeriod = 60000; // 1 minute cooldown

  public powerData$ = this.powerDataSubject.asObservable();
  public energyMetrics$ = this.energyMetricsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {
    this.setupConnectionMonitoring();
  }

  // Add methods to get proper HTTP and WS URLs
  private getHttpUrl(): string {
    // Ensure we use HTTP protocol for HTTP requests
    if (this.serverUrl.startsWith('ws://')) {
      return this.serverUrl.replace('ws://', 'http://');
    } else if (this.serverUrl.startsWith('wss://')) {
      return this.serverUrl.replace('wss://', 'https://');
    }
    return this.serverUrl; // Already HTTP/HTTPS
  }

  private getWsUrl(): string {
    // Ensure we use WS protocol for WebSocket connections
    if (this.serverUrl.startsWith('http://')) {
      return this.serverUrl.replace('http://', 'ws://');
    } else if (this.serverUrl.startsWith('https://')) {
      return this.serverUrl.replace('https://', 'wss://');
    }
    return this.serverUrl; // Already WS/WSS
  }

  // Modify the ping method to just verify server availability without HTTP
  private async pingServer(): Promise<boolean> {
    // Simple connectivity check using HTTP protocol
    return new Promise((resolve) => {
      try {
        // Use XMLHttpRequest for a simple connection test that works in browser
        const xhr = new XMLHttpRequest();
        const httpUrl = this.getHttpUrl(); // Use HTTP URL not WS URL
        
        // Set a short timeout
        xhr.timeout = 2000;
        
        xhr.onreadystatechange = function() {
          // We don't care about the response, just that the server responded
          if (xhr.readyState === 4) {
            resolve(true);
          }
        };
        
        xhr.onerror = function() {
          console.warn('Server ping failed');
          resolve(false);
        };
        
        xhr.ontimeout = function() {
          console.warn('Server ping timed out');
          resolve(false);
        };
        
        // Use the truly public endpoint that doesn't require authentication
        xhr.open('HEAD', `${httpUrl}/public/status`, true);
        xhr.send();
      } catch (error) {
        console.warn('Server availability check failed:', error);
        resolve(false);
      }
    });
  }

  private setupConnectionMonitoring() {
    // Clear any existing timer to prevent multiple intervals
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }

    this.reconnectTimer = setInterval(async () => {
      // Check if we're in a cooldown period
      if (Date.now() < this.cooldownEndTime) {
        return;
      }

      // BYPASS SERVER CHECK - always attempt to connect
      const isServerAvailable = true; // Skip pingServer which is causing issues
      
      // If socket is not connected, not currently connecting, and we haven't exceeded max attempts
      if (!this.socket?.connected && !this.isConnecting && 
          this.reconnectAttempts < this.maxReconnectAttempts && 
          !this.disableSocketConnection) {
        console.log(`Socket reconnect attempt ${this.reconnectAttempts + 1} of ${this.maxReconnectAttempts}`);
        this.connect();
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        // If we've exceeded max attempts, disable socket to avoid repeated connection attempts
        console.warn('Max reconnect attempts reached, entering cooldown period');
        this.disableSocketConnection = true;
        this.cooldownEndTime = Date.now() + this.cooldownPeriod;
        
        // Reset after cooldown
        setTimeout(() => {
          console.log('Cooldown period over, resetting connection state');
          this.reconnectAttempts = 0;
          this.disableSocketConnection = false;
        }, this.cooldownPeriod);
      }
    }, 5000);
  }

  public connect(): Socket | null {
    // If socket connections are disabled due to server availability issues, return null
    if (this.disableSocketConnection) {
      console.log('Socket connections are currently disabled due to server unavailability');
      return null;
    }

    // If we're in a cooldown period, return null
    if (Date.now() < this.cooldownEndTime) {
      console.log('Socket connections are in cooldown period, try again later');
      return null;
    }

    if (!this.socket && !this.isConnecting) {
      this.isConnecting = true;
      const wsUrl = this.getWsUrl(); // Ensure we use WebSocket URL
      console.log('Attempting to connect to WebSocket server at', wsUrl);
      
      try {
        this.socket = io(wsUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 2, // Reduced to fail faster
          reconnectionDelay: 1000,
          timeout: 5000, // Reduced timeout to fail faster
          forceNew: true, // Force a new connection each time
        });

        // Set up a manual timeout that's shorter than the socket.io internal timeout
        // This ensures we don't wait too long for a connection
        if (this.manualTimeoutTimer) {
          clearTimeout(this.manualTimeoutTimer);
        }
        
        this.manualTimeoutTimer = setTimeout(() => {
          if (this.socket && !this.socket.connected && this.isConnecting) {
            console.warn('Manual connection timeout triggered, closing socket');
            this.socket.close();
            this.socket = null;
            this.isConnecting = false;
            this.reconnectAttempts++;
            this.connectionStatusSubject.next(false);
          }
        }, 4000); // Slightly shorter than the socket.io timeout

        this.setupEventHandlers();
      } catch (error) {
        console.error('Error creating socket connection:', error);
        this.isConnecting = false;
        this.connectionStatusSubject.next(false);
        this.reconnectAttempts++;
        
        if (this.manualTimeoutTimer) {
          clearTimeout(this.manualTimeoutTimer);
          this.manualTimeoutTimer = null;
        }
        
        return null;
      }
    }
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnecting = false;
      this.connectionStatusSubject.next(true);
      this.reconnectAttempts = 0;
      this.disableSocketConnection = false;
      
      // Clear manual timeout if connected
      if (this.manualTimeoutTimer) {
        clearTimeout(this.manualTimeoutTimer);
        this.manualTimeoutTimer = null;
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnecting = false;
      this.connectionStatusSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnecting = false;
      this.reconnectAttempts++;
      this.connectionStatusSubject.next(false);
      
      // Clear manual timeout on error
      if (this.manualTimeoutTimer) {
        clearTimeout(this.manualTimeoutTimer);
        this.manualTimeoutTimer = null;
      }
      
      // If server connection is failing immediately
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('Max reconnect attempts reached, entering cooldown period');
        this.disableSocketConnection = true;
        this.cooldownEndTime = Date.now() + this.cooldownPeriod;
        
        // Reset after cooldown
        setTimeout(() => {
          console.log('Cooldown period over, resetting connection state');
          this.reconnectAttempts = 0;
          this.disableSocketConnection = false;
        }, this.cooldownPeriod);
      }
    });

    this.socket.on('powerUsage', (data: PowerUsageData) => {
      this.powerDataSubject.next(data);
    });

    this.socket.on('energyMetrics', (data: EnergyMetrics) => {
      this.energyMetricsSubject.next(data);
    });
    
    // Handle timeout explicitly
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.isConnecting = false;
      this.connectionStatusSubject.next(false);
      
      // Clear manual timeout on error
      if (this.manualTimeoutTimer) {
        clearTimeout(this.manualTimeoutTimer);
        this.manualTimeoutTimer = null;
      }
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatusSubject.next(false);
      this.isConnecting = false;
    }
    
    // Clear manual timeout if disconnecting
    if (this.manualTimeoutTimer) {
      clearTimeout(this.manualTimeoutTimer);
      this.manualTimeoutTimer = null;
    }
  }

  public startMonitoring() {
    const socket = this.connect();
    if (socket && socket.connected) {
      socket.emit('startMonitoring');
    } else {
      console.warn('Cannot start monitoring: socket not connected');
    }
  }

  public stopMonitoring() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('stopMonitoring');
    }
  }

  public getEnergyMetrics(): Promise<EnergyMetrics> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      // Set a timeout for the response
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 3000); // Reduced timeout

      this.socket.emit('getEnergyMetrics', (response: { data?: EnergyMetrics; error?: string }) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else if (response.data) {
          resolve(response.data);
        } else {
          reject(new Error('Invalid response format'));
        }
      });
    });
  }

  public getHistoricalData(startDate: Date, endDate: Date): Promise<PowerUsageData[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      // Set a timeout for the response
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 3000); // Reduced timeout

      this.socket.emit('getHistoricalData', { startDate, endDate }, 
        (response: { data?: PowerUsageData[]; error?: string }) => {
          clearTimeout(timeout);
          if (response.error) {
            reject(new Error(response.error));
          } else if (response.data) {
            resolve(response.data);
          } else {
            reject(new Error('Invalid response format'));
          }
        }
      );
    });
  }

  public onUserPresence(): Observable<string[]> {
    const subject = new Subject<string[]>();
    
    if (this.socket) {
      this.socket.on('onlineUsers', (users: string[]) => {
        subject.next(users);
      });
    }

    return subject.asObservable();
  }

  public emitUserOnline(userId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('userOnline', userId);
    }
  }
  
  // Method to check if socket is available
  public isSocketAvailable(): boolean {
    return !this.disableSocketConnection && Date.now() >= this.cooldownEndTime;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService; 
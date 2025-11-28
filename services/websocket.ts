import { authApiService } from "./auth/api";

interface WebSocketMessage {
  action: "sendMessage";
  senderId: number;
  receiverId: number;
  content: string;
  isFinalMatch: boolean;
  isPotentialMatch: boolean;
}

interface WebSocketResponse {
  messageId?: number;
  status?: "delivered" | "failed" | "sent";
  type?: "sendMessage" | "message";
  senderId?: number;
  receiverId?: number;
  content?: string;
  timestamp?: string;
}

interface IncomingMessage {
  type: "message";
  messageId: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isConnecting = false;
  private messageQueue: WebSocketMessage[] = [];
  private listeners: ((message: WebSocketResponse | IncomingMessage) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private activeConnections = 0; // Reference counting for active chat screens
  private reconnectTimer: any = null;
  private currentUserId: number | null = null;
  private bearerToken: string | null = null;

  private readonly WS_URL = 'wss://05adxe9l4h.execute-api.ap-south-1.amazonaws.com/staging';

  async connect(userId?: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // Store current user ID for connection lifecycle
      if (userId) {
        this.currentUserId = userId;
      }

      // Get bearer token from AsyncStorage
      try {
        this.bearerToken = await authApiService.getBearerToken();
        
        if (!this.bearerToken) {
          console.warn('⚠️ No bearer token found for WebSocket connection');
        }
      } catch (error) {
        console.error('Failed to get bearer token:', error);
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        const checkConnection = () => {
          if (!this.isConnecting) {
            if (this.ws?.readyState === WebSocket.OPEN) {
              resolve();
            } else {
              reject(new Error('Connection failed'));
            }
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;

      try {
        // Construct WebSocket URL with bearer token as query parameter
        const wsUrl = this.bearerToken 
          ? `${this.WS_URL}?Authorization=${encodeURIComponent(this.bearerToken)}`
          : this.WS_URL;
        
        console.log('🔌 Connecting to WebSocket:', wsUrl.substring(0, 50) + '...');
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.processMessageQueue();
          this.notifyConnectionListeners(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'sendMessage') {
              this.notifyListeners(message as WebSocketResponse);
            } else if (message.type === 'message') {
              this.notifyListeners(message as IncomingMessage);
            } else {
              this.notifyListeners(message);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.notifyConnectionListeners(false);
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts && this.activeConnections > 0) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    if (this.activeConnections === 0) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.activeConnections > 0) {
        this.connect().catch(console.error);
      }
    }, delay);
  }

  // Force reconnection by disconnecting and immediately reconnecting
  forceReconnect(userId?: number): Promise<void> {
    // Reset reconnection attempts for clean slate
    this.reconnectAttempts = 0;
    
    // Clear any pending timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Disconnect if currently connected
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
    }
    
    // Reset connection state
    this.ws = null;
    this.isConnecting = false;
    
    // Store user ID for reconnection
    if (userId) {
      this.currentUserId = userId;
    }
    
    // Attempt immediate reconnection
    return this.connect(this.currentUserId || undefined);
  }

  sendMessage(message: WebSocketMessage): Promise<WebSocketResponse> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        // Queue message for when connection is established
        this.messageQueue.push(message);
        this.connect(this.currentUserId || undefined).then(() => {
          this.sendMessage(message).then(resolve).catch(reject);
        }).catch(reject);
        return;
      }

      // Set up one-time listener for response
      // Since backend might not return senderId in confirmation, we'll use a different strategy
      let resolved = false;

      const responseListener = (response: WebSocketResponse) => {
        if (response.type === 'sendMessage' && !resolved) {
          if (!response.senderId || response.senderId === message.senderId) {
            resolved = true;
            this.removeListener(responseListener);
            clearTimeout(timeout);
            
            const enhancedResponse: WebSocketResponse = {
              ...response,
              senderId: response.senderId || message.senderId
            };
            
            resolve(enhancedResponse);
          }
        }
      };

      // Set timeout for response  
      const timeout = setTimeout(() => {
        if (!resolved) {
          this.removeListener(responseListener);
          reject(new Error('Message send timeout'));
        }
      }, 15000);

      this.addListener(responseListener);

      try {
        this.ws!.send(JSON.stringify(message));
      } catch (error) {
        this.removeListener(responseListener);
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()!;
      this.ws!.send(JSON.stringify(message));
    }
  }

  addListener(listener: (message: WebSocketResponse) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (message: WebSocketResponse) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(message: WebSocketResponse) {
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('❌ Error in message listener:', error);
      }
    });
  }

  addConnectionListener(listener: (connected: boolean) => void) {
    this.connectionListeners.push(listener);
  }

  removeConnectionListener(listener: (connected: boolean) => void) {
    const index = this.connectionListeners.indexOf(listener);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('❌ Error in connection listener:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Check if connection is in a problematic state that needs refresh
  needsConnectionRefresh(): boolean {
    const isConnecting = this.isConnecting;
    const isConnected = this.isConnected();
    const hasActiveConnections = this.activeConnections > 0;
    const connectionState = this.getConnectionState();
    
    // Need refresh if:
    // 1. We have active connections but are not connected and not actively connecting
    // 2. Connection is in CLOSING or CLOSED state but we still have active connections
    // 3. Connection failed multiple times recently
    const needsRefresh = hasActiveConnections && (
      (!isConnected && !isConnecting) ||
      (connectionState === 'CLOSING' || connectionState === 'CLOSED') ||
      (this.reconnectAttempts >= 3)
    );
    
    console.log('🔍 Connection check:', {
      isConnecting,
      isConnected,
      hasActiveConnections,
      connectionState,
      reconnectAttempts: this.reconnectAttempts,
      needsRefresh
    });
    
    return needsRefresh;
  }

  // Explicit disconnect method as per API requirements
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
    this.messageQueue = [];
    this.listeners = [];
    this.connectionListeners = [];
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.activeConnections = 0;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Force disconnect and reset all state - for when leaving chat screens
  forceDisconnectAndReset() {
    // Close connection immediately
    if (this.ws) {
      this.ws.close(1000, 'Force disconnect');
      this.ws = null;
    }
    
    // Reset all state
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.activeConnections = 0;
    this.messageQueue = [];
    this.currentUserId = null;
    
    // Clear all timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Clear all listeners
    this.listeners = [];
    this.connectionListeners = [];
  }

  getConnectionState(): string {
    if (!this.ws) return 'CLOSED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  // Connection reference counting for proper cleanup
  addConnectionReference(userId?: number): Promise<void> {
    this.activeConnections++;
    
    // Clear any pending disconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // If connection is in a problematic state, force refresh
    if (this.needsConnectionRefresh()) {
      console.log('🔄 Connection needs refresh, forcing reconnect');
      return this.forceReconnect(userId);
    }

    // If we already have an open connection, just ensure user ID is set
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (userId) {
        this.currentUserId = userId;
      }
      console.log('✅ WebSocket already connected, reusing connection');
      return Promise.resolve();
    }

    return this.connect(userId);
  }

  removeConnectionReference() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    
    // If no active connections, schedule disconnect after delay
    if (this.activeConnections === 0) {
      this.reconnectTimer = setTimeout(() => {
        if (this.activeConnections === 0) {
          this.disconnect();
        }
      }, 30000);
    }
  }

  // Method to get current connection debug info
  getConnectionDebugInfo() {
    return {
      connectionState: this.getConnectionState(),
      isConnecting: this.isConnecting,
      activeConnections: this.activeConnections,
      reconnectAttempts: this.reconnectAttempts,
      messageQueueLength: this.messageQueue.length,
      currentUserId: this.currentUserId,
      listenersCount: this.listeners.length,
      connectionListenersCount: this.connectionListeners.length,
    };
  }

  getActiveConnections(): number {
    return this.activeConnections;
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
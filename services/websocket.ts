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

  private readonly WS_URL = 'wss://n9y3lzni9k.execute-api.ap-south-1.amazonaws.com/staging';

  connect(userId?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Store current user ID for connection lifecycle
      if (userId) {
        this.currentUserId = userId;
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        //WebSocket already connected
        resolve();
        return;
      }

      if (this.isConnecting) {
        // WebSocket connection in progress, waiting
        // Wait for current connection attempt
        const checkConnection = () => {
          if (!this.isConnecting) {
            if (this.ws?.readyState === WebSocket.OPEN) {
              console.log('✅ WebSocket connection completed');
              resolve();
            } else {
              console.log('❌ WebSocket connection failed');
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
        this.ws = new WebSocket(this.WS_URL);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected - $connect route triggered automatically');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.processMessageQueue();
          this.notifyConnectionListeners(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received WebSocket message:', message);
            
            // Handle different message types according to API spec
            if (message.type === 'sendMessage') {
              // Message delivery confirmation
              this.notifyListeners(message as WebSocketResponse);
            } else if (message.type === 'message') {
              // Incoming real-time message
              this.notifyListeners(message as IncomingMessage);
            } else {
              // Generic message handling
              this.notifyListeners(message);
            }
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {

          this.isConnecting = false;
          this.notifyConnectionListeners(false);
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts && this.activeConnections > 0) {
            console.log('🔄 Scheduling reconnection due to unexpected disconnect');
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
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
    // Only reconnect if there are active connections
    if (this.activeConnections === 0) {
    //   console.log('🔌 No active connections, skipping reconnect');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.activeConnections > 0) {
        this.connect().catch(console.error);
      }
    }, delay);
  }

  // Force reconnection by disconnecting and immediately reconnecting
  forceReconnect(userId?: number): Promise<void> {
    console.log('🔄 Force reconnecting WebSocket...');
    
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
        console.log('🔍 Checking response for message:', { 
          responseType: response.type, 
          responseMessageId: response.messageId,
          responseSenderId: response.senderId,
          originalSenderId: message.senderId,
          responseStatus: response.status,
          resolved
        });
        
        // Match on type and either senderId or just accept the first sendMessage response
        if (response.type === 'sendMessage' && !resolved) {
          // If senderId matches or is undefined, accept this response
          if (!response.senderId || response.senderId === message.senderId) {
            resolved = true;
            this.removeListener(responseListener);
            clearTimeout(timeout);
            
            // Ensure we return the correct senderId in response
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
          console.log('⏰ Message send timeout for:', message);
          this.removeListener(responseListener);
          reject(new Error('Message send timeout'));
        }
      }, 15000); // Increased timeout to 15 seconds

      this.addListener(responseListener);

      try {
        this.ws!.send(JSON.stringify(message));
        console.log('📤 Sent message via WebSocket:', {
          action: message.action,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content.substring(0, 30) + '...',
          isFinalMatch: message.isFinalMatch,
          isPotentialMatch: message.isPotentialMatch
        });
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
    
    // Need refresh if we have active connections but are not connected and not actively connecting
    const needsRefresh = hasActiveConnections && !isConnected && !isConnecting;
    
    console.log('🔍 Connection refresh check:', {
      isConnecting,
      isConnected,
      hasActiveConnections,
      connectionState,
      needsRefresh
    });
    
    return needsRefresh;
  }

  // Explicit disconnect method as per API requirements
  disconnect() {
    console.log('🔌 Explicitly disconnecting WebSocket - $disconnect route will be triggered');
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect'); // Clean close
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
    console.log(`📊 Active connections: ${this.activeConnections}`);
    
    // Clear any pending disconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      console.log('🔄 Cancelled pending disconnect timer');
    }

    // If connection is in a problematic state, force refresh
    if (this.needsConnectionRefresh()) {
      return this.forceReconnect(userId);
    }

    return this.connect(userId);
  }

  removeConnectionReference() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    console.log(`📊 Active connections: ${this.activeConnections}`);
    
    // If no active connections, schedule disconnect after delay
    if (this.activeConnections === 0) {
      this.reconnectTimer = setTimeout(() => {
        if (this.activeConnections === 0) {
          console.log('🔌 Disconnecting WebSocket due to inactivity');
          this.disconnect();
        }
      }, 30000); // 30 second delay before disconnect
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
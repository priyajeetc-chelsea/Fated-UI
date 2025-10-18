import { chatApiService, ChatMessage } from '@/services/chat-api';
import { webSocketService } from '@/services/websocket';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseChatOptions {
  currentUserId: number;
  otherUserId: number;
  isFinalMatch: boolean;
  isPotentialMatch: boolean;
  enabled?: boolean;
}

/**
 * Top-notch chat hook implementing the exact backend API specifications
 * Handles WebSocket lifecycle, message sending, pagination, and read receipts
 */
export const useChat = ({ currentUserId, otherUserId, isFinalMatch, isPotentialMatch, enabled = true }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesRef = useRef<ChatMessage[]>([]);
  const lastReadMessageIdRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const hasInitializedRef = useRef(false);

  // Update ref when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Load chat history with pagination support
   * Uses API specification: GET {{baseURL}}/staging/messages/history
   */
  const loadChatHistory = useCallback(async (isInitial = true) => {
    if (!enabled || !otherUserId) {
      console.log('🚫 Chat history loading disabled');
      setIsLoading(false);
      return;
    }

    try {
      if (!isInitial) setIsLoadingMore(true);
      
      // For pagination, use the oldest message ID from current messages
      // For initial load, use empty string as per API spec
      const lastMessageId = isInitial 
        ? "" 
        : Math.min(...messagesRef.current.map(m => m.id)).toString();
      const response = await chatApiService.getChatHistory(
        otherUserId, 
        10, 
        lastMessageId
      );

      // Handle null messageContents case
      if (!response.model.messageContents || response.model.messageContents === null) {
        console.log('📜 No message history found (messageContents is null)');
        setMessages(isInitial ? [] : messagesRef.current);
        setHasMoreMessages(false);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      // Ensure messageContents is an array
      if (!Array.isArray(response.model.messageContents)) {
        console.warn('⚠️ messageContents is not an array:', response.model.messageContents);
        setMessages(isInitial ? [] : messagesRef.current);
        setHasMoreMessages(false);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      // Transform API response to ChatMessage format
      const newMessages: ChatMessage[] = response.model.messageContents.map(msg => ({
        id: msg.id,
        content: msg.content,
        isSent: msg.isSent,
        status: msg.status as ChatMessage['status'],
        isRead: msg.isRead,
        readAt: msg.readAt,
        timestamp: new Date(),
        senderId: msg.isSent ? currentUserId : otherUserId,
        receiverId: msg.isSent ? otherUserId : currentUserId,
      }));

      if (isInitial) {
        setMessages(newMessages.reverse()); // Newest messages at bottom
        hasInitializedRef.current = true;
      } else {
        setMessages(prev => [...newMessages.reverse(), ...prev]); // Prepend older messages
      }

      // Check if we have more messages to load
      setHasMoreMessages(newMessages.length === 10);
      
      console.log('✅ Chat history loaded:', {
        newMessagesCount: newMessages.length,
        totalMessages: isInitial ? newMessages.length : messagesRef.current.length + newMessages.length,
        hasMoreMessages: newMessages.length === 10
      });

    } catch (error) {
      console.error('❌ Failed to load chat history:', error);
      setHasMoreMessages(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [enabled, otherUserId, currentUserId]);

  /**
   * Send message via WebSocket
   * Implements API specification: action: "sendMessage" with proper flags
   */
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!enabled || !otherUserId || !content.trim() || isSending) {
      console.log('🚫 Message send blocked:', { 
        enabled, 
        otherUserId, 
        hasContent: !!content.trim(), 
        isSending, 
        isConnected 
      });
      return false;
    }

    // Ensure WebSocket connection before sending
    if (!isConnected) {
      console.log('🔌 Not connected, attempting to connect before sending...');
      try {
        await webSocketService.addConnectionReference(currentUserId);
        // Brief wait for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('❌ Failed to connect before sending message:', error);
        return false;
      }
    }

    setIsSending(true);

    // Optimistically add message to UI
    const tempMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      content: content.trim(),
      isSent: true,
      status: 'sending',
      isRead: false,
      readAt: '',
      timestamp: new Date(),
      senderId: currentUserId,
      receiverId: otherUserId,
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      console.log('📤 Sending message via WebSocket:', {
        content: content.substring(0, 50) + '...',
        senderId: currentUserId,
        receiverId: otherUserId,
        isFinalMatch,
        isPotentialMatch
      });

      // Send message according to API specification
      const response = await webSocketService.sendMessage({
        action: 'sendMessage',
        senderId: currentUserId,
        receiverId: otherUserId,
        content: content.trim(),
        isFinalMatch,
        isPotentialMatch,
      });

      console.log('✅ Message send response received:', {
        messageId: response.messageId,
        status: response.status,
        senderId: response.senderId,
        originalSenderId: currentUserId,
        tempMessageId: tempMessage.id,
        isValidResponse: !!(response.messageId && response.status)
      });

      // Validate the response
      if (!response.messageId || !response.status) {
        throw new Error(`Invalid response from server: ${JSON.stringify(response)}`);
      }

      // Update message with real ID and delivery status
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { 
              ...msg, 
              id: response.messageId || msg.id,
              status: (response.status === 'delivered' || response.status === 'sent') ? 'delivered' : 'failed'
            }
          : msg
      ));

      return response.status === 'delivered' || response.status === 'sent';
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));

      return false;
    } finally {
      setIsSending(false);
    }
  }, [enabled, currentUserId, otherUserId, isFinalMatch, isPotentialMatch, isSending, isConnected]);

  /**
   * Mark messages as read
   * Implements API specification: POST {{baseURL}}/staging/messages/read
   * Called when user opens chat and sees delivered messages from other party
   */
  const markMessagesAsRead = useCallback(async () => {
    const unreadMessages = messagesRef.current.filter(
      msg => !msg.isSent && msg.status === 'delivered' && !msg.isRead
    );

    if (unreadMessages.length === 0) return;

    const latestUnreadMessage = unreadMessages[unreadMessages.length - 1];
    
    // Avoid duplicate read requests
    if (lastReadMessageIdRef.current === latestUnreadMessage.id) return;

    try {
      console.log('📖 Marking messages as read:', {
        senderId: otherUserId, // The chat partner whose messages we're reading
        lastReadMessageId: latestUnreadMessage.id,
        unreadCount: unreadMessages.length
      });

      // Call API to mark messages as read
      // senderId is the person whose messages are being read (the chat partner)
      await chatApiService.markMessagesAsRead(otherUserId, latestUnreadMessage.id);
      lastReadMessageIdRef.current = latestUnreadMessage.id;

      // Update local message status
      setMessages(prev => prev.map(msg => 
        !msg.isSent && msg.id <= latestUnreadMessage.id
          ? { ...msg, isRead: true, readAt: new Date().toISOString(), status: 'read' as const }
          : msg
      ));

      console.log('✅ Messages marked as read successfully');
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
    }
  }, [otherUserId]);

  /**
   * Handle incoming WebSocket messages
   * Implements proper message filtering and real-time updates
   */
  useEffect(() => {
    if (!enabled || !otherUserId) {
      return;
    }

    const handleIncomingMessage = (wsMessage: any) => {
      console.log('📨 Incoming WebSocket message for potential match chat:', {
        type: wsMessage.type,
        currentUserId,
        otherUserId,
        content: wsMessage.content?.substring(0, 30) + '...',
        messageId: wsMessage.messageId,
        conversationKey: `${currentUserId}-${otherUserId}`
      });

      // Handle different message types according to API specification
      if (wsMessage.type === 'message') {
        // This is an incoming real-time message
        const isForThisConversation = (
          wsMessage.senderId === otherUserId && 
          wsMessage.receiverId === currentUserId
        );

        console.log('🔍 Message filtering check for potential match:', {
          isForThisConversation,
          senderIsOtherUser: wsMessage.senderId === otherUserId,
          receiverIsCurrentUser: wsMessage.receiverId === currentUserId,
          senderNotCurrentUser: wsMessage.senderId !== currentUserId,
          expectedSender: otherUserId,
          expectedReceiver: currentUserId,
          actualSender: wsMessage.senderId,
          actualReceiver: wsMessage.receiverId
        });

        if (isForThisConversation) {
          console.log('✅ Adding incoming message to this conversation');
          const newMessage: ChatMessage = {
            id: wsMessage.messageId || Date.now(),
            content: wsMessage.content,
            isSent: false,
            status: 'delivered',
            isRead: false,
            readAt: '',
            timestamp: new Date(wsMessage.timestamp || Date.now()),
            senderId: wsMessage.senderId,
            receiverId: wsMessage.receiverId,
          };

          setMessages(prev => [...prev, newMessage]);

          // Auto-mark as read if app is active and chat is open
          if (AppState.currentState === 'active') {
            setTimeout(() => markMessagesAsRead(), 1000);
          }
        } else {
          console.log('❌ Message filtered out - not for this conversation');
        }
      } else if (wsMessage.type === 'sendMessage') {
        // This is a send confirmation for our own message
        console.log('📤 Message send confirmation received via WebSocket listener:', {
          messageId: wsMessage.messageId,
          status: wsMessage.status,
          senderId: wsMessage.senderId,
          currentUserId,
          note: 'This should be handled by sendMessage function, not here'
        });
        // Send confirmations are already handled in sendMessage function
        // This log helps us understand if there are duplicate confirmations
      } else {
        console.log('🔍 Unknown WebSocket message type:', wsMessage.type);
      }
    };

    console.log('🔗 Adding WebSocket message listener for conversation:', { currentUserId, otherUserId });
    webSocketService.addListener(handleIncomingMessage);
    
    return () => {
      console.log('🔗 Removing WebSocket message listener for conversation:', { currentUserId, otherUserId });
      webSocketService.removeListener(handleIncomingMessage);
    };
  }, [enabled, currentUserId, otherUserId, markMessagesAsRead]);

  /**
   * WebSocket connection lifecycle management with graceful reconnection
   * Establishes connection on chat entry, manages disconnection on exit
   */
  useEffect(() => {
    if (!enabled || !otherUserId) {
      setIsConnected(false);
      return;
    }

    console.log('🔌 Establishing WebSocket connection for chat:', { 
      currentUserId, 
      otherUserId,
      connectionDebug: webSocketService.getConnectionDebugInfo()
    });

    const handleConnectionChange = (connected: boolean) => {
      console.log('🔌 WebSocket connection status changed:', {
        connected,
        debugInfo: webSocketService.getConnectionDebugInfo()
      });
      setIsConnected(connected);
      
      // Update reconnecting state based on connection status
      if (connected) {
        setIsReconnecting(false);
      } else if (enabled && otherUserId) {
        // Only set reconnecting if we should be connected
        setIsReconnecting(true);
      }
    };

    webSocketService.addConnectionListener(handleConnectionChange);

    // Force a clean connection state when entering chat
    const establishConnection = async () => {
      try {
        // Reset connection state to ensure clean start
        console.log('🔄 Forcing connection refresh for chat entry');
        
        // Add connection reference and connect when component mounts
        // This triggers the $connect route on the backend
        await webSocketService.addConnectionReference(currentUserId);
        
        // If still not connected after 3 seconds, try to force reconnect
        setTimeout(() => {
          if (!webSocketService.isConnected()) {
            console.log('⚠️ Connection not established after 3s, forcing reconnect...');
            setIsReconnecting(true);
            webSocketService.forceReconnect(currentUserId);
          }
        }, 3000);
        
      } catch (error) {
        console.error('❌ Failed to establish WebSocket connection:', error);
        setIsConnected(false);
        setIsReconnecting(true);
        
        // Retry connection after a short delay
        setTimeout(() => {
          console.log('🔄 Retrying WebSocket connection...');
          webSocketService.addConnectionReference(currentUserId).catch(retryError => {
            console.error('❌ Retry connection failed:', retryError);
            setIsReconnecting(false);
          });
        }, 2000);
      }
    };

    establishConnection();

    return () => {
      console.log('🔌 Cleaning up WebSocket connection for chat:', { 
        currentUserId, 
        otherUserId,
        connectionDebug: webSocketService.getConnectionDebugInfo()
      });
      webSocketService.removeConnectionListener(handleConnectionChange);
      
      // Force disconnect and reset when leaving chat
      // This ensures clean state for next chat session
      console.log('🔥 Force disconnecting WebSocket on chat cleanup');
      webSocketService.forceDisconnectAndReset();
      
      setIsReconnecting(false);
      setIsConnected(false);
    };
  }, [enabled, currentUserId, otherUserId]);

  // Force disconnect when chat is disabled
  useEffect(() => {
    if (!enabled) {
      webSocketService.forceDisconnectAndReset();
      setIsConnected(false);
      setIsReconnecting(false);
    }
  }, [enabled]);

  // Periodic connection health check to prevent stuck "reconnecting" states
  useEffect(() => {
    if (!enabled || !otherUserId) return;

    const healthCheckInterval = setInterval(() => {
      const needsRefresh = webSocketService.needsConnectionRefresh();
      
      if (needsRefresh && !isReconnecting) {
        console.log('🏥 Connection health check failed, attempting recovery...');
        setIsReconnecting(true);
        webSocketService.forceReconnect(currentUserId).then(() => {
          console.log('✅ Connection recovery successful');
        }).catch(error => {
          console.error('❌ Connection recovery failed:', error);
          // Reset reconnecting state if recovery fails
          setTimeout(() => setIsReconnecting(false), 5000);
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(healthCheckInterval);
  }, [enabled, otherUserId, currentUserId, isReconnecting]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - mark messages as read
        setTimeout(() => markMessagesAsRead(), 500);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [markMessagesAsRead]);

  // Auto-mark messages as read when chat is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        markMessagesAsRead();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [markMessagesAsRead]);

  // Load initial chat history
  useEffect(() => {
    if (enabled && otherUserId) {
      // Clear existing messages when switching to a different user
      setMessages([]);
      setIsLoading(true);
      setHasMoreMessages(true);
      hasInitializedRef.current = false;
      lastReadMessageIdRef.current = null;
      
      loadChatHistory(true);
    } else {
      setMessages([]);
      setIsLoading(false);
      setIsReconnecting(false);
    }
  }, [enabled, otherUserId, loadChatHistory]);

  const loadMoreMessages = useCallback(() => {
    if (!isLoadingMore && hasMoreMessages) {
      loadChatHistory(false);
    }
  }, [isLoadingMore, hasMoreMessages, loadChatHistory]);

  const retryFailedMessage = useCallback(async (messageId: number) => {
    const failedMessage = messages.find(msg => msg.id === messageId && msg.status === 'failed');
    if (!failedMessage) return;

    // Update status to sending
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'sending' } : msg
    ));

    const success = await sendMessage(failedMessage.content);
    if (!success) {
      // Revert to failed if still failing
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'failed' } : msg
      ));
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isConnected,
    isReconnecting,
    isLoading,
    hasMoreMessages,
    isSending,
    isLoadingMore,
    sendMessage,
    loadMoreMessages,
    markMessagesAsRead,
    retryFailedMessage,
    connectionState: webSocketService.getConnectionState(),
  };
};
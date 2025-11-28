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

export const useChat = ({ currentUserId, otherUserId, isFinalMatch, isPotentialMatch, enabled = true }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const lastReadMessageIdRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const hasInitializedRef = useRef(false);
  const pollingIntervalRef = useRef<any>(null);
  const connectionRetryRef = useRef<any>(null);
  const lastPolledMessageIdRef = useRef<number | null>(null);

  // Update ref when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Load chat history with pagination support
   */
  const loadChatHistory = useCallback(async (isInitial = true) => {
    if (!enabled || !otherUserId || !currentUserId) {
      setIsLoading(false);
      return;
    }

    try {
      if (!isInitial) setIsLoadingMore(true);
      
      // Use a reasonable limit for both initial and pagination requests
      const limit = isInitial ? 20 : 15;
      const lastMessageId = isInitial 
        ? "" 
        : Math.min(...messagesRef.current.map(m => m.id)).toString();
      
      const response = await chatApiService.getChatHistory(
        otherUserId, 
        limit, 
        lastMessageId
      );

      if (!response?.model?.messageContents || response?.model?.messageContents === null) {
        setMessages(isInitial ? [] : messagesRef.current);
        setHasMoreMessages(false);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      if (!Array.isArray(response.model.messageContents)) {
        setMessages(isInitial ? [] : messagesRef.current);
        setHasMoreMessages(false);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

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
        setMessages(newMessages.reverse());
        hasInitializedRef.current = true;
        if (newMessages.length > 0) {
          lastPolledMessageIdRef.current = Math.max(...newMessages.map(m => m.id));
        }
        // For initial load, check if we got the full limit of messages
        setHasMoreMessages(newMessages.length >= 20);
      } else {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
        // For pagination, check if we got the full limit
        setHasMoreMessages(newMessages.length >= 15);
      }
      
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setHasMoreMessages(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [enabled, otherUserId, currentUserId]);

  /**
   * Ensure WebSocket connection with retry logic
   */
  const ensureConnection = useCallback(async () => {
    if (!enabled || !currentUserId) return;

    try {
      if (!webSocketService.isConnected()) {
        await webSocketService.addConnectionReference(currentUserId);
        setIsConnected(true);
      }
    } catch {
      setIsConnected(false);
      
      // Retry connection after 2 seconds
      if (connectionRetryRef.current) {
        clearTimeout(connectionRetryRef.current);
      }
      connectionRetryRef.current = setTimeout(() => {
        ensureConnection();
      }, 2000);
    }
  }, [enabled, currentUserId]);

  /**
   * Poll for new messages every 3 seconds
   */
  const pollForNewMessages = useCallback(async () => {
    if (!enabled || !otherUserId || !currentUserId || isSending) {
      return; // Skip polling while sending to avoid race conditions
    }

    try {
      const response = await chatApiService.getChatHistory(
        otherUserId,
        20,
        ""
      );

      if (response.model?.messageContents && Array.isArray(response.model.messageContents)) {
        const allMessages = response.model.messageContents.map((msg: any) => ({
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

        // If this is the first poll after initialization, load all messages
        if (!hasInitializedRef.current && allMessages.length > 0) {
          console.log('🔄 Initial poll loading all messages:', allMessages.length);
          setMessages(allMessages.reverse());
          hasInitializedRef.current = true;
          lastPolledMessageIdRef.current = Math.max(...allMessages.map(m => m.id));
          return;
        }

        // Find truly new messages (not in current state)
        // Check both by ID AND by content to avoid duplicates from optimistic updates
        const newMessages = allMessages.filter((msg: ChatMessage) => {
          const isNewMessage = !lastPolledMessageIdRef.current || msg.id > lastPolledMessageIdRef.current;
          const notInCurrentMessages = !messagesRef.current.some(existingMsg => {
            // Match by ID (if both have real IDs)
            if (existingMsg.id === msg.id && existingMsg.id < 9999999999999) {
              return true;
            }
            // Match by content and sender to catch optimistic updates
            // Compare messages sent within last 10 seconds with same content
            const isSameSender = existingMsg.isSent === msg.isSent;
            const isSameContent = existingMsg.content.trim() === msg.content.trim();
            const isRecent = Date.now() - existingMsg.timestamp.getTime() < 10000; // 10 seconds
            
            if (isSameSender && isSameContent && isRecent) {
              // This is likely the same message - update the existing one with real ID
              return true;
            }
            
            return false;
          });
          return isNewMessage && notInCurrentMessages;
        });

        // Update read status of existing messages and replace optimistic messages with real ones
        setMessages(prev => {
          const updatedMessages = prev.map(existingMsg => {
            // First try to match by ID
            const serverMessage = allMessages.find(serverMsg => serverMsg.id === existingMsg.id);
            
            // If no match by ID, try to match optimistic messages by content
            const optimisticMatch = !serverMessage && existingMsg.id > 9999999999999 // Likely a temp ID
              ? allMessages.find(serverMsg => 
                  serverMsg.isSent === existingMsg.isSent &&
                  serverMsg.content.trim() === existingMsg.content.trim() &&
                  Math.abs(Date.now() - existingMsg.timestamp.getTime()) < 10000 // Within 10 seconds
                )
              : null;
            
            const matchedMessage = serverMessage || optimisticMatch;
            
            if (matchedMessage) {
              // Update with server data (including real ID if it was optimistic)
              return {
                ...existingMsg,
                id: matchedMessage.id, // Update temp ID to real ID
                isRead: matchedMessage.isRead,
                readAt: matchedMessage.readAt,
                status: matchedMessage.status,
              };
            }
            return existingMsg;
          });

          // Add new messages
          if (newMessages.length > 0) {
            console.log('🆕 Adding new polled messages:', newMessages.length);
            return [...updatedMessages, ...newMessages.reverse()];
          }
          
          return updatedMessages;
        });

        if (allMessages.length > 0) {
          lastPolledMessageIdRef.current = Math.max(...allMessages.map(m => m.id));
        }
      }
    } catch (error) {
      console.error('Polling failed:', error);
      // If polling fails, it might be due to connection issues
      // Try to ensure connection for next poll attempt
      if (enabled && currentUserId) {
        ensureConnection().catch(console.error);
      }
    }
  }, [enabled, otherUserId, currentUserId, isSending, ensureConnection]);

  /**
   * Send message via WebSocket with fallback
   */
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!enabled || !otherUserId || !content.trim() || isSending || !currentUserId) {
      return false;
    }

    // Ensure connection before sending
    await ensureConnection();

    setIsSending(true);

    // Optimistically add message to UI
    const tempMessage: ChatMessage = {
      id: Date.now(),
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
      const response = await webSocketService.sendMessage({
        action: 'sendMessage',
        senderId: currentUserId,
        receiverId: otherUserId,
        content: content.trim(),
        isFinalMatch,
        isPotentialMatch,
      });

      if (!response.messageId || !response.status) {
        throw new Error('Invalid response from server');
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
      console.error('Failed to send message:', error);
      
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
  }, [enabled, currentUserId, otherUserId, isFinalMatch, isPotentialMatch, isSending, ensureConnection]);

  /**
   * Mark messages as read
   */
  const markMessagesAsRead = useCallback(async () => {
    // Find unread messages from other user (not sent by current user)
    const unreadMessages = messagesRef.current.filter(
      msg => !msg.isSent && !msg.isRead
    );

    if (unreadMessages.length === 0) return;

    const latestUnreadMessage = unreadMessages[unreadMessages.length - 1];
    
    // Avoid duplicate API calls for the same message
    if (lastReadMessageIdRef.current === latestUnreadMessage.id) return;

    try {
      await chatApiService.markMessagesAsRead(otherUserId, latestUnreadMessage.id);
      lastReadMessageIdRef.current = latestUnreadMessage.id;

      // Update all unread messages up to the latest one as read
      setMessages(prev => prev.map(msg => 
        !msg.isSent && msg.id <= latestUnreadMessage.id && !msg.isRead
          ? { ...msg, isRead: true, readAt: new Date().toISOString(), status: 'read' as const }
          : msg
      ));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [otherUserId]);

  /**
   * Handle incoming WebSocket messages
   */
  useEffect(() => {
    if (!enabled || !otherUserId) {
      return;
    }

    const handleIncomingMessage = (wsMessage: any) => {
      if (wsMessage.type === 'message') {
        const isForThisConversation = (
          wsMessage.senderId === otherUserId && 
          wsMessage.receiverId === currentUserId
        );

        if (isForThisConversation) {
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

          console.log('📨 Received WebSocket message:', newMessage.content);

          // Check if message already exists to avoid duplicates
          setMessages(prev => {
            const exists = prev.some(msg => 
              msg.id === newMessage.id || 
              (msg.content === newMessage.content && 
               msg.senderId === newMessage.senderId && 
               Math.abs(Date.now() - msg.timestamp.getTime()) < 5000)
            );
            
            if (exists) {
              console.log('⚠️ Duplicate message detected, skipping');
              return prev;
            }
            
            return [...prev, newMessage];
          });

          lastPolledMessageIdRef.current = Math.max(lastPolledMessageIdRef.current || 0, newMessage.id);

          // Auto-mark as read if app is active
          if (AppState.currentState === 'active') {
            setTimeout(() => markMessagesAsRead(), 1000);
          }
        }
      }
    };

    webSocketService.addListener(handleIncomingMessage);
    
    return () => {
      webSocketService.removeListener(handleIncomingMessage);
    };
  }, [enabled, currentUserId, otherUserId, markMessagesAsRead]);

  /**
   * WebSocket connection management
   */
  useEffect(() => {
    if (!enabled || !otherUserId) {
      setIsConnected(false);
      return;
    }

    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
    };

    webSocketService.addConnectionListener(handleConnectionChange);

    // Initial connection
    ensureConnection();

    return () => {
      webSocketService.removeConnectionListener(handleConnectionChange);
      if (connectionRetryRef.current) {
        clearTimeout(connectionRetryRef.current);
        connectionRetryRef.current = null;
      }
      webSocketService.forceDisconnectAndReset();
      setIsConnected(false);
    };
  }, [enabled, currentUserId, otherUserId, ensureConnection]);

  /**
   * Polling for new messages every 3 seconds
   */
  useEffect(() => {
    if (!enabled || !otherUserId) return;

    // Start with immediate poll, then continue with interval
    const startPolling = () => {
      // Immediate first poll to catch any messages
      setTimeout(() => pollForNewMessages(), 500);
      
      // Regular polling every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        pollForNewMessages();
      }, 3000);
    };

    startPolling();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, otherUserId, pollForNewMessages]);

  /**
   * Handle app state changes for connection management
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - ensure connection and mark messages as read
        ensureConnection();
        setTimeout(() => markMessagesAsRead(), 500);
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background - maintain connection but stop aggressive retries
        if (connectionRetryRef.current) {
          clearTimeout(connectionRetryRef.current);
          connectionRetryRef.current = null;
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [markMessagesAsRead, ensureConnection]);

  /**
   * Auto-mark messages as read periodically
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        markMessagesAsRead();
      }
    }, 2000); // Check every 2 seconds for more responsive read receipts

    return () => clearInterval(interval);
  }, [markMessagesAsRead]);

  /**
   * Load initial chat history
   */
  useEffect(() => {
    if (enabled && otherUserId) {
      setMessages([]);
      setIsLoading(true);
      setHasMoreMessages(true);
      hasInitializedRef.current = false;
      lastReadMessageIdRef.current = null;
      lastPolledMessageIdRef.current = null;
      
      // Ensure connection is established before loading messages
      ensureConnection().then(() => {
        return loadChatHistory(true);
      }).then(() => {
        // Mark messages as read when chat is first loaded
        setTimeout(() => markMessagesAsRead(), 1000);
      }).catch((error) => {
        console.error('Failed to initialize chat:', error);
        setIsLoading(false);
      });
    } else {
      setMessages([]);
      setIsLoading(false);
    }
  }, [enabled, otherUserId, loadChatHistory, markMessagesAsRead, ensureConnection]);

  const loadMoreMessages = useCallback(() => {
    if (!isLoadingMore && hasMoreMessages) {
      loadChatHistory(false);
    }
  }, [isLoadingMore, hasMoreMessages, loadChatHistory]);

  const retryFailedMessage = useCallback(async (messageId: number) => {
    const failedMessage = messages.find(msg => msg.id === messageId && msg.status === 'failed');
    if (!failedMessage) return;

    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'sending' } : msg
    ));

    const success = await sendMessage(failedMessage.content);
    if (!success) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'failed' } : msg
      ));
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isConnected,
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
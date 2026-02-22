import { chatApiService, ChatMessage } from "@/services/chat-api";
import { webSocketService } from "@/services/websocket";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

interface UseChatOptions {
  currentUserId: number;
  otherUserId: number;
  isFinalMatch: boolean;
  isPotentialMatch: boolean;
  enabled?: boolean;
}

export const useChat = ({
  currentUserId,
  otherUserId,
  isFinalMatch,
  isPotentialMatch,
  enabled = true,
}: UseChatOptions) => {
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
  const isCleaningUpRef = useRef(false);

  // Update ref when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Load chat history with pagination support
   */
  const loadChatHistory = useCallback(
    async (isInitial = true) => {
      if (!enabled || !otherUserId || !currentUserId) {
        setIsLoading(false);
        return;
      }

      try {
        if (!isInitial) setIsLoadingMore(true);

        const limit = isInitial ? 20 : 15;
        const lastMessageId = isInitial
          ? ""
          : Math.min(...messagesRef.current.map((m) => m.id)).toString();

        const response = await chatApiService.getChatHistory(
          otherUserId,
          limit,
          lastMessageId,
        );

        if (
          !response?.model?.messageContents ||
          response?.model?.messageContents === null
        ) {
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

        const newMessages: ChatMessage[] = response.model.messageContents.map(
          (msg) => ({
            id: msg.id,
            content: msg.content,
            isSent: msg.isSent,
            status: msg.status as ChatMessage["status"],
            isRead: msg.isRead,
            readAt: msg.readAt,
            timestamp: new Date(),
            senderId: msg.isSent ? currentUserId : otherUserId,
            receiverId: msg.isSent ? otherUserId : currentUserId,
          }),
        );

        if (isInitial) {
          setMessages(newMessages.reverse());
          hasInitializedRef.current = true;
          setHasMoreMessages(newMessages.length >= 20);
        } else {
          setMessages((prev) => [...newMessages.reverse(), ...prev]);
          setHasMoreMessages(newMessages.length >= 15);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setHasMoreMessages(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [enabled, otherUserId, currentUserId],
  );

  /**
   * Ensure WebSocket connection with proper state management
   */
  const ensureConnection = useCallback(async () => {
    if (!enabled || !currentUserId || isCleaningUpRef.current) return;

    try {
      if (!webSocketService.isConnected()) {
        console.log(
          "🔌 Establishing WebSocket connection for userId:",
          currentUserId,
        );
        await webSocketService.addConnectionReference(currentUserId);
        setIsConnected(true);
        console.log("✅ WebSocket connected successfully");
      } else {
        setIsConnected(true);
      }
    } catch (error) {
      console.error("❌ Failed to establish WebSocket connection:", error);
      setIsConnected(false);
    }
  }, [enabled, currentUserId]);

  /**
   * Send message via WebSocket with optimistic updates
   */
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (
        !enabled ||
        !otherUserId ||
        !content.trim() ||
        isSending ||
        !currentUserId
      ) {
        return false;
      }

      setIsSending(true);

      // Optimistically add message to UI
      const tempMessage: ChatMessage = {
        id: Date.now(),
        content: content.trim(),
        isSent: true,
        status: "sending",
        isRead: false,
        readAt: "",
        timestamp: new Date(),
        senderId: currentUserId,
        receiverId: otherUserId,
      };

      setMessages((prev) => [...prev, tempMessage]);

      try {
        // Ensure connection before sending
        await ensureConnection();

        const response = await webSocketService.sendMessage({
          action: "sendMessage",
          senderId: currentUserId,
          receiverId: otherUserId,
          content: content.trim(),
          isFinalMatch,
          isPotentialMatch,
        });

        if (!response.messageId || !response.status) {
          throw new Error("Invalid response from server");
        }

        // Update message with real ID and delivery status
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? {
                  ...msg,
                  id: response.messageId || msg.id,
                  status:
                    response.status === "delivered" ||
                    response.status === "sent"
                      ? "delivered"
                      : "failed",
                }
              : msg,
          ),
        );

        return response.status === "delivered" || response.status === "sent";
      } catch (error) {
        console.error("❌ Failed to send message:", error);

        // Mark message as failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id ? { ...msg, status: "failed" } : msg,
          ),
        );

        return false;
      } finally {
        setIsSending(false);
      }
    },
    [
      enabled,
      currentUserId,
      otherUserId,
      isFinalMatch,
      isPotentialMatch,
      isSending,
      ensureConnection,
    ],
  );

  /**
   * Mark messages as read
   */
  const markMessagesAsRead = useCallback(async () => {
    const unreadMessages = messagesRef.current.filter(
      (msg) => !msg.isSent && !msg.isRead,
    );

    if (unreadMessages.length === 0) return;

    const latestUnreadMessage = unreadMessages[unreadMessages.length - 1];

    // Avoid duplicate API calls
    if (lastReadMessageIdRef.current === latestUnreadMessage.id) return;

    try {
      await chatApiService.markMessagesAsRead(
        otherUserId,
        latestUnreadMessage.id,
      );
      lastReadMessageIdRef.current = latestUnreadMessage.id;

      setMessages((prev) =>
        prev.map((msg) =>
          !msg.isSent && msg.id <= latestUnreadMessage.id && !msg.isRead
            ? {
                ...msg,
                isRead: true,
                readAt: new Date().toISOString(),
                status: "read" as const,
              }
            : msg,
        ),
      );
    } catch (error) {
      console.error("❌ Failed to mark messages as read:", error);
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
      if (wsMessage.type === "message") {
        const isForThisConversation =
          wsMessage.senderId === otherUserId &&
          wsMessage.receiverId === currentUserId;

        if (isForThisConversation) {
          const newMessage: ChatMessage = {
            id: wsMessage.messageId || Date.now(),
            content: wsMessage.content,
            isSent: false,
            status: "delivered",
            isRead: false,
            readAt: "",
            timestamp: new Date(wsMessage.timestamp || Date.now()),
            senderId: wsMessage.senderId,
            receiverId: wsMessage.receiverId,
          };

          console.log(
            "📨 Received WebSocket message:",
            newMessage.content.substring(0, 50),
          );

          // Check if message already exists to avoid duplicates
          setMessages((prev) => {
            const exists = prev.some(
              (msg) =>
                msg.id === newMessage.id ||
                (msg.content === newMessage.content &&
                  msg.senderId === newMessage.senderId &&
                  Math.abs(Date.now() - msg.timestamp.getTime()) < 5000),
            );

            if (exists) {
              console.log("⚠️ Duplicate message detected, skipping");
              return prev;
            }

            return [...prev, newMessage];
          });

          // Auto-mark as read if app is active
          if (AppState.currentState === "active") {
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
   * WebSocket connection management with AppState handling
   */
  useEffect(() => {
    if (!enabled || !otherUserId) {
      setIsConnected(false);
      return;
    }

    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      console.log(
        "🔌 Connection status changed:",
        connected ? "CONNECTED" : "DISCONNECTED",
      );
    };

    webSocketService.addConnectionListener(handleConnectionChange);

    // Initial connection
    ensureConnection();

    return () => {
      webSocketService.removeConnectionListener(handleConnectionChange);
    };
  }, [enabled, currentUserId, otherUserId, ensureConnection]);

  /**
   * Handle app state changes for proper connection lifecycle (Mobile)
   */
  useEffect(() => {
    // Only use AppState on mobile platforms
    if (Platform.OS === "web") return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(
        "📱 App state changed from",
        appStateRef.current,
        "to",
        nextAppState,
      );

      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground - reconnect WebSocket and refresh
        console.log("🔄 App came to foreground, reconnecting...");
        ensureConnection().then(() => {
          // Load latest messages after reconnection
          loadChatHistory(true).then(() => {
            markMessagesAsRead();
          });
        });
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background - disconnect to save resources
        console.log("💤 App going to background, disconnecting...");
        webSocketService.forceDisconnectAndReset();
        setIsConnected(false);
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [markMessagesAsRead, ensureConnection, loadChatHistory]);

  /**
   * Handle page visibility changes for proper connection lifecycle (Web)
   */
  useEffect(() => {
    // Only use Page Visibility API on web
    if (Platform.OS !== "web") return;
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Page became visible - reconnect WebSocket and refresh
        console.log("🌐 Page became visible, reconnecting...");
        ensureConnection().then(() => {
          // Load latest messages after reconnection
          loadChatHistory(true).then(() => {
            markMessagesAsRead();
          });
        });
      } else if (document.visibilityState === "hidden") {
        // Page became hidden - disconnect to save resources
        console.log("💤 Page hidden, disconnecting...");
        webSocketService.forceDisconnectAndReset();
        setIsConnected(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [markMessagesAsRead, ensureConnection, loadChatHistory]);

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
      isCleaningUpRef.current = false;

      // Ensure connection is established before loading messages
      ensureConnection()
        .then(() => {
          return loadChatHistory(true);
        })
        .then(() => {
          // Mark messages as read when chat is first loaded
          setTimeout(() => markMessagesAsRead(), 1000);
        })
        .catch((error) => {
          console.error("❌ Failed to initialize chat:", error);
          setIsLoading(false);
        });
    } else {
      setMessages([]);
      setIsLoading(false);
    }

    // Cleanup when chat is closed
    return () => {
      console.log("🧹 Chat cleanup initiated");
      isCleaningUpRef.current = true;
    };
  }, [
    enabled,
    otherUserId,
    loadChatHistory,
    markMessagesAsRead,
    ensureConnection,
  ]);

  const loadMoreMessages = useCallback(() => {
    if (!isLoadingMore && hasMoreMessages) {
      loadChatHistory(false);
    }
  }, [isLoadingMore, hasMoreMessages, loadChatHistory]);

  const retryFailedMessage = useCallback(
    async (messageId: number) => {
      const failedMessage = messages.find(
        (msg) => msg.id === messageId && msg.status === "failed",
      );
      if (!failedMessage) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "sending" } : msg,
        ),
      );

      const success = await sendMessage(failedMessage.content);
      if (!success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status: "failed" } : msg,
          ),
        );
      }
    },
    [messages, sendMessage],
  );

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

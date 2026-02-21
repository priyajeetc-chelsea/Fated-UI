import { webSocketService } from "@/services/websocket";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

/**
 * Global WebSocket connection manager
 * Handles app lifecycle events and connection state
 *
 * NOTE: Individual chat screens manage their own connections via use-chat hook
 * This is just a global manager for monitoring
 */
export const useWebSocketManager = () => {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log("🌐 Global WebSocket Manager - App state:", nextAppState);
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect(),
    isConnected: () => webSocketService.isConnected(),
    getConnectionState: () => webSocketService.getConnectionState(),
  };
};

/**
 * Hook for components that need to clean up WebSocket listeners
 */
export const useWebSocketCleanup = () => {
  const listenersRef = useRef<((message: any) => void)[]>([]);

  const addListener = (listener: (message: any) => void) => {
    webSocketService.addListener(listener);
    listenersRef.current.push(listener);
  };

  const removeListener = (listener: (message: any) => void) => {
    webSocketService.removeListener(listener);
    const index = listenersRef.current.indexOf(listener);
    if (index > -1) {
      listenersRef.current.splice(index, 1);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup all listeners when component unmounts
      listenersRef.current.forEach((listener) => {
        webSocketService.removeListener(listener);
      });
      listenersRef.current = [];
    };
  }, []);

  return { addListener, removeListener };
};

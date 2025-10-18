import { webSocketService } from '@/services/websocket';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Global WebSocket connection manager
 * Handles app lifecycle events and connection state
 */
export const useWebSocketManager = () => {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - ensure connection is active
        webSocketService.connect().catch(console.error);
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - keep connection but reduce activity
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Don't automatically connect - let individual chat screens manage connections

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
      listenersRef.current.forEach(listener => {
        webSocketService.removeListener(listener);
      });
      listenersRef.current = [];
    };
  }, []);

  return { addListener, removeListener };
};
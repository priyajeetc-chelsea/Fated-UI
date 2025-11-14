import { authApiService } from '@/services/auth/api';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook to track app state changes and update last activity timestamp
 * This ensures the 48-hour inactivity timer resets when the app comes to foreground
 */
export function useAppStateActivity() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // When app comes to foreground from background/inactive state
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('🔄 App came to foreground - updating last activity');
        
        // Update last activity timestamp
        await authApiService.updateLastActivity();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

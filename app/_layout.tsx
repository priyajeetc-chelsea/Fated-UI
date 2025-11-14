import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGuard } from '@/components/auth';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { useAppStateActivity } from '@/hooks/use-app-state-activity';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWebSocketManager } from '@/hooks/use-websocket-manager';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Initialize WebSocket manager
  useWebSocketManager();
  
  // Track app state to update last activity timestamp
  useAppStateActivity();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthGuard>
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                  <Stack.Screen name="chat/[userId]" options={{ headerShown: false }} />
                </Stack>
                <StatusBar style="auto" backgroundColor="#f5f5f5" />
              </AuthGuard>
            </ThemeProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

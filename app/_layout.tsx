import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UserProvider } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWebSocketManager } from '@/hooks/use-websocket-manager';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Initialize WebSocket manager
  useWebSocketManager();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <SafeAreaProvider>
        <UserProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="chat/[userId]" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" backgroundColor="#f5f5f5" />
          </ThemeProvider>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

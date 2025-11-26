import { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold, useFonts } from '@expo-google-fonts/playfair-display';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGuard } from '@/components/auth';
import { ChatProvider } from '@/contexts/ChatContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWebSocketManager } from '@/hooks/use-websocket-manager';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Load Playfair Display font
  const [fontsLoaded] = useFonts({
    'Playfair Display': PlayfairDisplay_400Regular,
    'Playfair Display 600': PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  
  // Initialize WebSocket manager
  useWebSocketManager();

  if (!fontsLoaded) {
    return null;
  }
  
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <ChatProvider>
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
            </ChatProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

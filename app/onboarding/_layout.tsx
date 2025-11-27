import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

export default function OnboardingLayout() {
  // Prevent Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Return true to prevent default back behavior
        return true;
      });

      return () => backHandler.remove();
    }
  }, []);

  // Prevent browser back button on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
      };

      // Push initial state
      window.history.pushState(null, '', window.location.pathname);
      
      // Listen for back button
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerLeft: () => null, // Completely disable back button for all screens
        headerBackVisible: false, // Disable back button visibility
        gestureEnabled: false, // Disable swipe back gesture
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Getting Started',
          headerLeft: () => null,
          headerBackVisible: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="welcome" 
        options={{ 
          title: 'Welcome',
          headerLeft: () => null,
          headerBackVisible: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="basic" 
        options={{ 
          title: 'Basic Details',
          headerLeft: () => null,
          headerBackVisible: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="lifestyle" 
        options={{ 
          title: 'Lifestyle',
          headerLeft: () => null,
          headerBackVisible: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="takes" 
        options={{ 
          title: 'Your Takes',
          headerLeft: () => null,
          headerBackVisible: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="photos" 
        options={{ 
          title: 'Add Photos',
          headerLeft: () => null,
          headerBackVisible: false,
          gestureEnabled: false,
        }} 
      />
    </Stack>
  );
}
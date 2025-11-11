import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
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
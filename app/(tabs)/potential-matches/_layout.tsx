import { Stack } from 'expo-router';
import React from 'react';

export default function PotentialMatchesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="potential-match-home" />
      <Stack.Screen name="user-profile-page" />
    </Stack>
  );
}

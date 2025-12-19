import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import ProfileTabIcon from '@/components/profile-tab-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'white',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: 'black',
        },
      }}
      initialRouteName="homepage">
      <Tabs.Screen
        name="homepage"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
        <Tabs.Screen
        name="potential-matches"
        options={{
          title: 'Potential',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.badge.filled.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <ProfileTabIcon size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}

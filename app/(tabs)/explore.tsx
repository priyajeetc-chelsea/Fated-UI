import BaseLayout from '@/components/base-layout';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ExplorePage() {
  return (
    <BaseLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
      </View>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
});

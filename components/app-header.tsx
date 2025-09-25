import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

export default function AppHeader() {
  return (
    <View style={styles.headerContent}>
      <ThemedText 
        style={styles.title}
        numberOfLines={1}
        allowFontScaling={false}
      >
        fated
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 15, // Increased top padding to prevent cutoff
    minHeight: 60, // Added minimum height to contain larger fonts
    justifyContent: 'flex-start', // Start from top
    alignItems: 'flex-start', // Align to left
  },
  title: {
    fontSize: 35,
    letterSpacing: -1,
    fontFamily: 'Tempos-Headline',
    lineHeight: 36, // Increased lineHeight to be larger than fontSize (28 * 1.3 ≈ 36)
    color: '#FF0054',
    includeFontPadding: false, // Removes extra padding that Android adds to text
  },
});

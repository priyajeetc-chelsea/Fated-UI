import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

export default function AppHeader() {
  return (
    <View style={styles.headerContent}>
      <View style={styles.brandContainer}>
        <Ionicons 
          name="heart" 
          size={30} 
          color="#004242" 
          style={styles.logo}
        />
        <ThemedText 
          style={styles.title}
          numberOfLines={1}
          allowFontScaling={false}
        >
          Fated
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    flex: 1,
    paddingHorizontal: 2,
    paddingTop: 15,
    minHeight: 60,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    marginRight: 5,
  },
  title: {
    fontSize: 33,
    letterSpacing: -1,
    fontFamily: 'Playfair Display',
    lineHeight: 36, // Increased lineHeight to be larger than fontSize (28 * 1.3 ≈ 36)
    color: '#004242',
    includeFontPadding: false, // Removes extra padding that Android adds to text
  },
});

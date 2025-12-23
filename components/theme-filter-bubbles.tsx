import { Tag } from '@/types/api';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';

interface ThemeFilterBubblesProps {
  tags: Tag[];
  onThemeChange?: (selectedTagIds: number[]) => void;
}

export default function ThemeFilterBubbles({ tags, onThemeChange }: ThemeFilterBubblesProps) {
  const toggleTheme = (tagId: number) => {
    const currentSelected = tags.filter(tag => tag.isSelected).map(tag => tag.id);
    const newSelected = currentSelected.includes(tagId)
      ? currentSelected.filter(id => id !== tagId)
      : [...currentSelected, tagId];
    
    onThemeChange?.(newSelected);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f9f9f9' }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tags.map((tag) => {
          return (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.bubble,
                { 
                  backgroundColor: tag.isSelected ? 'black' : 'white',
                  borderColor: 'black',
                  borderWidth: 1,
                }
              ]}
              onPress={() => toggleTheme(tag.id)}
              activeOpacity={0.7}
            >
              <ThemedText 
                style={[
                  styles.label,
                  { color: tag.isSelected ? '#fff' : 'black' }
                ]}
              >
                {tag.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 15,
    gap: 4,
  },
  bubble: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 60,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

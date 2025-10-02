import AppHeader from '@/components/app-header';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BaseLayoutProps {
  children: React.ReactNode;
  userName?: string;
  isScrolling?: boolean;
  showFeedback?: boolean;
  feedbackType?: 'like' | 'cross';
  fadeAnim?: Animated.Value;
  scaleAnim?: Animated.Value;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function BaseLayout({
  children,
  userName,
  isScrolling = false,
  showFeedback = false,
  feedbackType = 'like',
  fadeAnim,
  scaleAnim,
  showBackButton = false,
  onBackPress
}: BaseLayoutProps) {
  const [stickyHeaderOpacity] = useState(new Animated.Value(0));
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // Animate sticky header appearance/disappearance
  useEffect(() => {
    Animated.timing(stickyHeaderOpacity, {
      toValue: isScrolling ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isScrolling, stickyHeaderOpacity]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Regular Header - always visible when not scrolling */}
        {!isScrolling && (
          <View style={styles.headerContainer}>
            {showBackButton && (
              <TouchableOpacity style={styles.headerBackButton} onPress={handleBackPress}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
            )}
            <AppHeader />
          </View>
        )}
        
        {/* Sticky Header - positioned at screen level, appears when scrolling */}
        {isScrolling && userName && (
          <Animated.View style={[styles.stickyHeaderContainer, { opacity: stickyHeaderOpacity }]}>
            <View style={styles.stickyHeaderContent}>
              {showBackButton ? (
                <TouchableOpacity onPress={handleBackPress}>
                  <Ionicons name="arrow-back" size={20} color="#333" />
                </TouchableOpacity>
              ) : (
                <View style={styles.placeholder} />
              )}
              <Text style={styles.stickyHeaderText} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
                {userName}
              </Text>
              <View style={styles.placeholder} />
            </View>
          </Animated.View>
        )}
        
        {/* Main Content */}
        {children}
        
        {/* Feedback Animation Overlay */}
        {showFeedback && fadeAnim && scaleAnim && (
          <View style={styles.feedbackOverlay}>
            <Animated.View
              style={[
                styles.feedbackContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text
                style={[
                  styles.feedbackIcon,
                  feedbackType === 'like' ? styles.heartIcon : styles.crossIcon,
                ]}
              >
                {feedbackType === 'like' ? (
                  <Ionicons name={'heart'} size={60} />
                ) : (
                  <Ionicons name={'close'} size={60} />
                )}
              </Text>
            </Animated.View>
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  headerBackButton: {
    marginTop: 18,
    marginRight: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stickyHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    zIndex: 9999,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  stickyHeaderText: {
    fontSize: 23,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 34,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 80,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },
  feedbackIcon: {
    fontSize: 40,
    textAlign: 'center',
  },
  heartIcon: {
    color: '#000',
  },
  crossIcon: {
    color: '#000',
    fontSize: 40,
    fontWeight: 'bold',
  },
});
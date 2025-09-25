import AppHeader from '@/components/app-header';
import OpinionModal from '@/components/opinion-modal';
import ThemeFilterBubbles from '@/components/theme-filter-bubbles';
import { ThemedView } from '@/components/themed-view';
import UserProfile from '@/components/user-profile';
import { apiService } from '@/services/api';
import { ApiOpinion, ApiUser, MatchRequest, Tag } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<MatchRequest>(apiService.getDefaultRequest());
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOpinion, setSelectedOpinion] = useState<ApiOpinion | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  // Animation state for like/cross feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'like' | 'cross'>('like');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));

  // Animation for sticky header smooth appearance
  const [stickyHeaderOpacity] = useState(new Animated.Value(0));

  // Initial API call
  useEffect(() => {
    const defaultRequest = apiService.getDefaultRequest();
    setCurrentRequest(defaultRequest);
    loadMatches(defaultRequest);
  }, []); // Only run on mount
  
  // Reset scrolling state when currentUserIndex changes
  useEffect(() => {
    setIsScrolling(false);
    // Reset sticky header animation
    Animated.timing(stickyHeaderOpacity, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }).start();
  }, [currentUserIndex, stickyHeaderOpacity]);

  // Animate sticky header appearance/disappearance
  useEffect(() => {
    Animated.timing(stickyHeaderOpacity, {
      toValue: isScrolling ? 1 : 0,
      duration: 200, // Smooth 200ms transition
      useNativeDriver: true,
    }).start();
  }, [isScrolling, stickyHeaderOpacity]);

  const loadMatches = async (request: MatchRequest, isThemeChange = false, appendToExisting = false) => {
    if (isThemeChange) {
      setIsThemeLoading(true);
    } else if (!appendToExisting) {
      setIsLoading(true);
    }
    
    try {
      const response = await apiService.fetchMatches(request);
      const convertedUsers = apiService.convertToAppUsers(response.matches);
      
      if (appendToExisting) {
        // Add new users to existing list
        setUsers(prevUsers => [...prevUsers, ...convertedUsers]);
      } else {
        // Replace existing users
        setUsers(convertedUsers);
        setCurrentUserIndex(0);
      }
      
      if (!appendToExisting) {
        setTags(response.tags.all);
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      if (isThemeChange) {
        setIsThemeLoading(false);
      } else if (!appendToExisting) {
        setIsLoading(false);
      }
    }
  };

  const handleLikeOpinion = (opinionId: string) => {
    console.log('Liked opinion:', opinionId);
    
    const currentUser = users[currentUserIndex];
    if (!currentUser) return;
    
    // Find the selected opinion
    const opinion = currentUser.opinions.find(op => op.id === opinionId);
    if (!opinion) return;
    
    console.log('Opening modal for opinion:', opinion.text);
    
    // Show modal with the selected opinion
    setSelectedOpinion(opinion);
    setSelectedUserName(currentUser.name);
    setModalVisible(true);
  };

  // Show feedback animation and then proceed to next user
  const showFeedbackAnimation = (type: 'like' | 'cross') => {
    setFeedbackType(type);
    setShowFeedback(true);
    
    // Reset animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Hold for a moment then fade out
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowFeedback(false);
          // User removal is now handled in performSwipeAction, not here
        });
      }, 800);
    });
  };

  // Helper function to send swipe and remove user
  const performSwipeAction = async (takeId: number, swipeRight: boolean, comment?: string) => {
    try {
      // 1. Send swipe to API
      await apiService.sendSwipe(takeId, swipeRight, comment);
      
      // 2. Remove user from list
      const newUsers = users.filter((_, index) => index !== currentUserIndex);
      setUsers(newUsers);
      
      // 3. Check if we need to load more users (when only 2 left)
      if (newUsers.length <= 2) {
        console.log('Only 2 users left, loading more...');
        await loadMatches(currentRequest, false, true); // appendToExisting = true
      } else {
        // Adjust current index if needed
        if (currentUserIndex >= newUsers.length) {
          setCurrentUserIndex(0);
        }
      }
    } catch (error) {
      console.error('Failed to perform swipe action:', error);
      // Still proceed with user removal even if API fails
      const newUsers = users.filter((_, index) => index !== currentUserIndex);
      setUsers(newUsers);
      
      if (currentUserIndex >= newUsers.length) {
        setCurrentUserIndex(0);
      }
    }
  };

  const handleModalSubmit = async (comment: string) => {
    const currentUser = users[currentUserIndex];
    if (!currentUser || !selectedOpinion) return;
    
    console.log('Modal submitted for user:', currentUser.name);
    if (comment.trim()) {
      console.log('With comment:', comment);
    }
    
    // Close modal first
    setModalVisible(false);
    setSelectedOpinion(null);
    setSelectedUserName('');
    
    // Get the takeId from the selected opinion
    const takeId = parseInt(selectedOpinion.id);
    
    // Show like animation
    showFeedbackAnimation('like');
    
    // Send swipe action (like) with comment
    await performSwipeAction(takeId, true, comment.trim() || undefined);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedOpinion(null);
    setSelectedUserName('');
  };

  const handleCrossUser = async () => {
    const currentUser = users[currentUserIndex];
    if (!currentUser) return;
    
    // Show cross animation
    showFeedbackAnimation('cross');
    
    // For cross action, we can use any takeId from the user's opinions
    // Using the first opinion's takeId
    const takeId = currentUser.opinions.length > 0 ? parseInt(currentUser.opinions[0].id) : 0;
    
    // Send swipe action (cross) without comment
    await performSwipeAction(takeId, false);
  };

  const handleThemeChange = (selectedTagIds: number[]) => {
    const newRequest: MatchRequest = {
      ...currentRequest,
      tagIds: selectedTagIds
    };
    
    setCurrentRequest(newRequest);
    loadMatches(newRequest, true);
  };

  const handleScrollStateChange = (scrolling: boolean) => {
    // Only update if there's a change to avoid unnecessary re-renders
    if (isScrolling !== scrolling) {
      setIsScrolling(scrolling);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#000" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Show message if no users match the filter
  if (users.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.emptyContainer}>
          <AppHeader />
          {!isScrolling && (
            <ThemeFilterBubbles 
              tags={tags}
              onThemeChange={handleThemeChange}
            />
          )}
        </ThemedView>
      </SafeAreaView>
    );
  }

  const displayUser = users[currentUserIndex] || users[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* Regular Header - only visible when not scrolling */}
        {!isScrolling && <AppHeader />}
        {!isScrolling && (
          <ThemeFilterBubbles 
            tags={tags}
            onThemeChange={handleThemeChange}
          />
        )}
        
        {/* Sticky Header - positioned at screen level, appears when scrolling */}
        {isScrolling && displayUser && (
          <Animated.View style={[styles.stickyHeaderContainer, { opacity: stickyHeaderOpacity }]}>
            <View style={styles.stickyHeaderContent}>
              <Text 
                style={styles.stickyHeaderText} 
                numberOfLines={1} 
                ellipsizeMode="tail"
                allowFontScaling={false}
              >
                {displayUser.name}
              </Text>
            </View>
          </Animated.View>
        )}
        
        {displayUser && (
          <UserProfile
            user={displayUser}
            onLikeOpinion={handleLikeOpinion}
            onRemoveUser={handleCrossUser}
            onScrollStateChange={handleScrollStateChange}
          />
        )}
        
        <OpinionModal
          visible={modalVisible}
          opinion={selectedOpinion}
          userName={selectedUserName}
          onSubmit={handleModalSubmit}
          onClose={handleModalClose}
        />

        {/* Feedback Animation Overlay */}
        {showFeedback && (
          <View style={styles.feedbackOverlay}>
            <Animated.View 
              style={[
                styles.feedbackContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <Text style={[
                styles.feedbackIcon,
                feedbackType === 'like' ? styles.heartIcon : styles.crossIcon
              ]}>
                {feedbackType === 'like' ?( <Ionicons 
                  name={"heart"} 
                  size={60} 
                />) : ( <Ionicons 
                  name={"close"} 
                  size={60} 
                />)}
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
    position: 'relative', // This ensures the container properly handles absolute positioned children
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  stickyHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5', // Seamless blend with background
    zIndex: 9999,
    // Minimal shadow for subtle depth without heavy appearance
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stickyHeaderContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyHeaderText: {
    fontSize: 25, // Slightly smaller than main header for hierarchy
    color: '#333',
    textAlign: 'center', // Center align to match main header
    lineHeight: 24,
    includeFontPadding: false,
    marginBottom: 0,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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

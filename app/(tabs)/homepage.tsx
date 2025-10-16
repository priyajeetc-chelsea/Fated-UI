import BaseLayout from '@/components/base-layout';
import OpinionModal from '@/components/opinion-modal';
import ThemeFilterBubbles from '@/components/theme-filter-bubbles';
import UserProfile from '@/components/user-profile';
import { apiService } from '@/services/api';
import { ApiOpinion, ApiUser, MatchRequest, Tag } from '@/types/api';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  // Initial API call
  useEffect(() => {
    const defaultRequest = apiService.getDefaultRequest();
    setCurrentRequest(defaultRequest);
    loadMatches(defaultRequest);
  }, []);
  
  // Reset scrolling state when currentUserIndex changes
  useEffect(() => {
    setIsScrolling(false);
  }, [currentUserIndex]);

  const loadMatches = async (request: MatchRequest, isThemeChange = false, appendToExisting = false) => {
    if (!appendToExisting) {
      setIsLoading(true);
    }
    
    try {
      const response = await apiService.fetchMatches(request);
      const convertedUsers = apiService.convertToAppUsers(response.matches);
      
      if (appendToExisting) {
        setUsers(prevUsers => [...prevUsers, ...convertedUsers]);
      } else {
        setUsers(convertedUsers);
        setCurrentUserIndex(0);
      }
      
      if (!appendToExisting) {
        setTags(response.tags.all);
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      if (!appendToExisting) {
        setIsLoading(false);
      }
    }
  };

  const handleLikeOpinion = (opinionId: string) => {
    console.log('Liked opinion:', opinionId);
    
    const currentUser = users[currentUserIndex];
    if (!currentUser) return;
    
    const opinion = currentUser.opinions.find(op => op.id === opinionId);
    if (!opinion) return;
    
    setSelectedOpinion(opinion);
    setSelectedUserName(currentUser.name);
    setModalVisible(true);
  };

  const showFeedbackAnimation = (type: 'like' | 'cross') => {
    setFeedbackType(type);
    setShowFeedback(true);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);

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
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowFeedback(false);
        });
      }, 800);
    });
  };

  const performSwipeAction = async (takeId: number, swipeRight: boolean, comment?: string) => {
    try {
      await apiService.sendSwipe(takeId, swipeRight, comment);
      
      const newUsers = users.filter((_, index) => index !== currentUserIndex);
      setUsers(newUsers);
      
      if (newUsers.length <= 2) {
        await loadMatches(currentRequest, false, true);
      } else if (currentUserIndex >= newUsers.length) {
        setCurrentUserIndex(0);
      }
    } catch (error) {
      console.error('Failed to perform swipe action:', error);
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
    
    setModalVisible(false);
    setSelectedOpinion(null);
    setSelectedUserName('');
    
    const takeId = parseInt(selectedOpinion.id);
    
    showFeedbackAnimation('like');
    
    setTimeout(async () => {
      await performSwipeAction(takeId, true, comment.trim() || undefined);
    }, 1000);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedOpinion(null);
    setSelectedUserName('');
  };

  const handleRemoveUser = async () => {
    showFeedbackAnimation('cross');
    
    // Call swipe API with false (reject) before removing user
    const currentUser = users[currentUserIndex];
    if (currentUser && currentUser.opinions.length > 0) {
      try {
        // Get the first opinion's takeId for the swipe API call
        const firstOpinion = currentUser.opinions[0];
        const takeId = parseInt(firstOpinion.id); // takeId is stored in the id field
        
        if (takeId && !isNaN(takeId)) {
          await apiService.sendSwipe(takeId, false); // swipeRight: false for reject
          console.log('User rejected via swipe API');
        }
      } catch (error) {
        console.error('Failed to send reject swipe:', error);
      }
    }
    
    setTimeout(() => {
      const newUsers = users.filter((_, index) => index !== currentUserIndex);
      setUsers(newUsers);
      
      if (currentUserIndex >= newUsers.length) {
        setCurrentUserIndex(0);
      }
      
      // Check if we have 2 or fewer users left, then fetch more
      if (newUsers.length <= 2) {
        console.log('Low on users, fetching more...');
        loadMatches(currentRequest, false, true); // appendToExisting = true
      }
    }, 1000);
  };

  const handleScrollStateChange = (scrolling: boolean) => {
    if (isScrolling !== scrolling) {
      setIsScrolling(scrolling);
    }
  };

  const handleThemeChange = async (selectedTagIds: number[]) => {
    const newRequest = { ...currentRequest, tagIds: selectedTagIds };
    setCurrentRequest(newRequest);
    await loadMatches(newRequest, true);
  };

  if (isLoading) {
    return (
      <BaseLayout>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </BaseLayout>
    );
  }

  if (users.length === 0) {
    return (
      <BaseLayout>
        <View style={styles.emptyContainer}>
          {!isScrolling && (
            <ThemeFilterBubbles 
              tags={tags}
              onThemeChange={handleThemeChange}
            />
          )}
        </View>
      </BaseLayout>
    );
  }

  const displayUser = users[currentUserIndex] || users[0];

  return (
    <BaseLayout
      userName={displayUser?.name}
      isScrolling={isScrolling}
      showFeedback={showFeedback}
      feedbackType={feedbackType}
      fadeAnim={fadeAnim}
      scaleAnim={scaleAnim}
    >
      {!isScrolling && (
        <ThemeFilterBubbles 
          tags={tags}
          onThemeChange={handleThemeChange}
        />
      )}
      
      {displayUser && (
        <UserProfile
          user={displayUser}
          onLikeOpinion={handleLikeOpinion}
          onRemoveUser={handleRemoveUser}
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
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});
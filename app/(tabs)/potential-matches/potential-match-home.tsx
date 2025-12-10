import BaseLayout from '@/components/base-layout';
import OpinionModal from '@/components/opinion-modal';
import UserProfile from '@/components/user-profile';
import { apiService } from '@/services/api';
import { ApiOpinion, ApiUser } from '@/types/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, StyleSheet, View } from 'react-native';

interface OpinionWithTakeId extends ApiOpinion {
  takeId: number;
}

interface ExtendedApiUser extends Omit<ApiUser, 'opinions'> {
  opinions: OpinionWithTakeId[];
}

interface ModalOpinion {
  id: string;
  takeId: number;
  text: string;
  theme: string;
  question: string;
}

export default function PotentialMatchHome() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<ExtendedApiUser | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showOpinionModal, setShowOpinionModal] = useState(false);
  const [modalOpinion, setModalOpinion] = useState<ModalOpinion | null>(null);

  // Animation state for like/cross feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'like' | 'cross'>('like');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const userName = Array.isArray(params.userName) ? params.userName[0] : params.userName;
    const opinions = Array.isArray(params.opinions) ? params.opinions[0] : params.opinions;
    
    console.log('PotentialMatchHome params:', { userName, opinions: opinions ? 'present' : 'missing' });
    setIsLoading(true);
    
    if (!userName || !opinions) {
      // Missing required data, show error and redirect
      Alert.alert(
        'Invalid Match Data',
        'Unable to load match information. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/potential-matches')
          }
        ]
      );
      setIsLoading(false);
      return;
    }

    try {
      const parsedOpinions = JSON.parse(opinions) as any[];
      console.log('Parsed opinions:', parsedOpinions.length, 'opinions for user', userName);
      
      // Create a user from the passed parameters
      const convertedUser: ExtendedApiUser = {
        id: Math.random().toString(), // Generate random ID since we don't have userBId
        name: userName,
        age: 25,
        gender: 'Female',
        photo: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
        opinions: parsedOpinions.map((opinion: any) => ({
          id: opinion.takeId.toString(),
          question: opinion.question,
          text: opinion.answer, // API returns 'answer', not 'text'
          theme: opinion.tag?.name || 'General', // Extract name from tag object
          liked: false,
          takeId: opinion.takeId // This is the key field for swipe actions
        }))
      };
      
      console.log('Created user with', convertedUser.opinions.length, 'opinions');
      setUser(convertedUser);
    } catch (error) {
      console.error('Error parsing opinions data:', error);
      Alert.alert(
        'Error Loading Match',
        'Failed to load match information. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/potential-matches')
          }
        ]
      );
    }
    
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userName, params.opinions]);

  const handleLikeOpinion = (opinionId: string) => {
    if (!user) return;
    
    const opinion = user.opinions.find(op => op.id === opinionId);
    if (!opinion) return;
    
    setModalOpinion({
      id: opinion.id,
      takeId: opinion.takeId,
      text: opinion.text,
      theme: opinion.theme,
      question: opinion.question || 'Question not available',
    });
    setShowOpinionModal(true);
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

  const handleOpinionModalSubmit = async (comment: string) => {
    setShowOpinionModal(false);
    
    showFeedbackAnimation('like');
    
    setTimeout(async () => {
      try {
        const takeId = modalOpinion && modalOpinion.takeId ? Number(modalOpinion.takeId) : null;
        if (!takeId || isNaN(takeId)) {
          Alert.alert(
            'Error',
            'Invalid opinion data. Please try again.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/potential-matches') }]
          );
          return;
        }
        
        const trimmedComment = comment && comment.trim() ? comment.trim() : undefined;
        const swipeResponse = await apiService.sendSwipe(takeId, true, trimmedComment);
        console.log('Swipe API Response:', swipeResponse);
        
        if (swipeResponse && swipeResponse.code === 200 && swipeResponse.model && swipeResponse.model.potentialMatch) {
          // Extract UserB ID from the response
          const userBId = swipeResponse.model.UserB?.id;
          
          if (userBId) {
            console.log('Navigating to profile page for UserB ID:', userBId);
            router.replace({
              pathname: '/matches/user-profile-page',
              params: { userBId: userBId.toString() }
            });
          } else {
            console.log('No UserB.id found in response');
            Alert.alert(
              'Profile Unavailable',
              'Unable to load match profile. Please try again later.',
              [{ text: 'OK', onPress: () => router.replace('/(tabs)/potential-matches') }]
            );
          }
        } else {
          console.log('No potential match or invalid response');
          Alert.alert(
            'Match Unsuccessful',
            'Unable to complete match. Please try again.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/potential-matches') }]
          );
        }
      } catch (error) {
        console.error('Error handling swipe:', error);
        Alert.alert(
          'Error',
          'Failed to process your like. Please check your connection and try again.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/potential-matches') }]
        );
      }
    }, 1000);
  };

  const handleOpinionModalClose = () => {
    setShowOpinionModal(false);
    setModalOpinion(null);
  };

  const handleRemoveUser = async () => {
    showFeedbackAnimation('cross');
    
    // Call swipe API with false (reject) before going back
    if (user && user.opinions.length > 0) {
      try {
        // Get the first opinion's takeId for the swipe API call
        const firstOpinion = user.opinions[0];
        const takeId = firstOpinion.takeId || parseInt(firstOpinion.id);
        
        if (takeId && !isNaN(takeId)) {
          await apiService.sendSwipe(takeId, false); // swipeRight: false for reject
          console.log('User rejected via swipe API');
        }
      } catch (error) {
        console.error('Failed to send reject swipe:', error);
      }
    }
    
    setTimeout(() => {
      router.back();
    }, 1000);
  };

  const handleScrollStateChange = (scrolling: boolean) => {
    if (isScrolling !== scrolling) {
      setIsScrolling(scrolling);
    }
  };

  if (isLoading || !user) {
    return (
      <BaseLayout showBackButton={true}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      userName={user.name}
      isScrolling={isScrolling}
      showFeedback={showFeedback}
      feedbackType={feedbackType}
      fadeAnim={fadeAnim}
      scaleAnim={scaleAnim}
      showBackButton={true}
    >
      <UserProfile
        user={user as ApiUser} // Cast back to ApiUser for the component
        onLikeOpinion={handleLikeOpinion}
        onRemoveUser={handleRemoveUser}
        onScrollStateChange={handleScrollStateChange}
        enableStickyHeader={true}
      />
      
      <OpinionModal
        visible={showOpinionModal}
        opinion={modalOpinion ? {
          id: modalOpinion.id,
          question: modalOpinion.question,
          text: modalOpinion.text,
          theme: modalOpinion.theme,
          liked: false
        } : null}
        userName={user.name}
        onSubmit={handleOpinionModalSubmit}
        onClose={handleOpinionModalClose}
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
});

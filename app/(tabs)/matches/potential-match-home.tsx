import BaseLayout from '@/components/base-layout';
import OpinionModal from '@/components/opinion-modal';
import UserProfile from '@/components/user-profile';
import { apiService } from '@/services/api';
import { ApiOpinion, ApiUser } from '@/types/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';

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

const DUMMY_PROFILE = {
  userId: 203,
  firstName: 'Ishana',
  gender: 'Female',
  pronouns: 'She/Her',
  dob: '1999-02-14',
  city: 'Mumbai',
  photoUrl: 'https://cdn.app/user203.jpg',
  intention: 'date',
  profile: {
    education: 'B.A. Sociology',
    profession: 'Content Strategist',
    interestedIn: 'Male',
    location: 'Mumbai',
    topicsInterested: ['Feminism', 'Mental Health'],
    personalityTrait: ['Empathetic', 'Creative', 'Curious'],
    dealBreaker: ['Dishonesty'],
    politicalLeaning: 'Progressive',
    languages: ['English,Hindi,Marathi'],
    shortBio: 'Passionate about storytelling and social causes. I love deep conversations over coffee.',
  },
  opinions: [
    {
      question: 'Is feminism still relevant today?',
      answer: `I believe that technology is shaping our society in ways that we don't fully understand yet. On one hand, it has made life incredibly convenient—we can connect with people across the globe instantly, access unlimited information, and automate boring tasks. On the other hand, it has also created challenges that no generation before us had to deal with: social media addiction, the spread of misinformation, and the erosion of genuine human connection.

For example, while I appreciate how platforms like Twitter or Reddit allow niche communities to flourish, I also feel they amplify negativity and extreme viewpoints, because outrage spreads faster than thoughtful debate. It's fascinating but also dangerous. The question then becomes: how do we balance innovation with responsibility?`,
      tag: { id: 1, name: 'Feminism' },
    },
    {
      question: 'Can climate change be reversed?',
      answer: 'Yes, but only with global collaboration and drastic cuts.',
      tag: { id: 2, name: 'Climate Change' },
    },
    {
      question: 'Should mental health be part of school curriculum?',
      answer: 'Mental health must be normalized and supported.',
      tag: { id: 3, name: 'Mental Health' },
    }
  ],
};

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

  const createDummyUser = useCallback((): ExtendedApiUser => ({
    id: DUMMY_PROFILE.userId.toString(),
    name: DUMMY_PROFILE.firstName,
    age: 25,
    gender: DUMMY_PROFILE.gender,
    photo: `https://picsum.photos/200/200?random=${DUMMY_PROFILE.userId}`,
    opinions: DUMMY_PROFILE.opinions.map((opinion, index) => ({
      id: (index + 1).toString(),
      question: opinion.question,
      text: opinion.answer,
      theme: opinion.tag.name,
      liked: false,
      takeId: index + 1 // Add takeId for dummy data
    }))
  }), []);

  useEffect(() => {
    const userName = Array.isArray(params.userName) ? params.userName[0] : params.userName;
    const opinions = Array.isArray(params.opinions) ? params.opinions[0] : params.opinions;
    
    console.log('PotentialMatchHome params:', { userName, opinions: opinions ? 'present' : 'missing' });
    setIsLoading(true);
    
    if (userName && opinions) {
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
        console.log('Using dummy user due to parsing error');
        setUser(createDummyUser());
      }
    } else {
      console.log('No userName or opinions provided, using dummy user');
      setUser(createDummyUser());
    }
    
    setIsLoading(false);
  }, [params.userName, params.opinions, createDummyUser]); // More specific dependencies

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
          router.replace({ 
            pathname: '/matches/user-profile-page', 
            params: { profile: JSON.stringify(DUMMY_PROFILE) } 
          });
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
            console.log('No UserB.id found in response, using fallback');
            router.replace({ 
              pathname: '/matches/user-profile-page', 
              params: { profile: JSON.stringify(DUMMY_PROFILE) } 
            });
          }
        } else {
          console.log('No potential match or invalid response, using fallback');
          router.replace({ 
            pathname: '/matches/user-profile-page', 
            params: { profile: JSON.stringify(DUMMY_PROFILE) } 
          });
        }
      } catch (error) {
        console.error('Error handling swipe:', error);
        router.replace({ 
          pathname: '/matches/user-profile-page', 
          params: { profile: JSON.stringify(DUMMY_PROFILE) } 
        });
      }
    }, 1000);
  };

  const handleOpinionModalClose = () => {
    setShowOpinionModal(false);
    setModalOpinion(null);
  };

  const handleRemoveUser = () => {
    showFeedbackAnimation('cross');
    
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

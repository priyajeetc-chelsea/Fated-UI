import BaseLayout from '@/components/base-layout';
import UserProfileLayout from '@/components/user-profile-layout';
import { apiService } from '@/services/api';
import { ApiUser } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function UserProfilePage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
// Check if this is a confirmed match (to hide action buttons)
  const isConfirmedMatch = params.isConfirmedMatch === 'true';
  const navigateBackToMatches = () => {
    router.replace('/matches');
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowStickyHeader(scrollY > 100);
  };

  const handleCrossPress = async () => {
    if (user) {
      try {
        const swipedId = parseInt(user.id);
        
        await apiService.sendFinalSwipe(swipedId, false);
        console.log('User crossed via final swipe API');

        // Navigate to matches page and reload data
         navigateBackToMatches();

      } catch (error) {
        console.error('Failed to send final swipe:', error);
        // Still navigate back on error
        router.back();
      }
    }
  };

  const handleLikePress = async () => {
    if (user) {
      try {
        const swipedId = parseInt(user.id);
        
        await apiService.sendFinalSwipe(swipedId, true);
        console.log('User liked via final swipe API');
        
        // Navigate to matches page and reload data
  navigateBackToMatches();
      } catch (error) {
        console.error('Failed to send final swipe:', error);
        // Still navigate back on error
        router.back();
      }
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      
      try {
        // Check if userBId is provided (from API)
        if (params.userBId) {
          const userBId = Array.isArray(params.userBId) ? parseInt(params.userBId[0]) : parseInt(params.userBId);
          console.log('Loading user profile for userBId:', userBId);
          
          try {
            const userProfile = await apiService.fetchUserProfile(userBId);
            console.log('API Response:', userProfile);
            
            if (userProfile && userProfile.model) {
              const profileData = userProfile.model;
              
              // Convert API response to ApiUser format
              const convertedUser: ApiUser = {
                id: profileData.userId?.toString() || userBId.toString(),
                name: `${profileData.fname || ''} ${profileData.lname || ''}`.trim(),
                age: profileData.age,
                gender: profileData.gender,
                photo: profileData.photoUrls?.[0] || `https://picsum.photos/200/200?random=${userBId}`,
                opinions: profileData.opinions?.map((opinion: any) => ({
                  id: opinion.takeId?.toString() || Math.random().toString(),
                  question: opinion.question || 'Question not available',
                  text: opinion.answer || 'No answer provided',
                  theme: opinion.tag?.name || 'General',
                  liked: false
                })) || [],
                // Store additional data for profile display
                profileData: {
                  fname: profileData.fname,
                  lname: profileData.lname,
                  sexuality: profileData.sexuality,
                  pronouns: profileData.pronouns,
                  homeTown: profileData.homeTown,
                  currentCity: profileData.currentCity,
                  jobDetails: profileData.jobDetails,
                  college: profileData.colllege, // Note: API has typo "colllege"
                  highestEducationLevel: profileData.highestEducationLevel,
                  religiousBeliefs: profileData.religiousBeliefs,
                  drinkOrSmoke: profileData.drinkOrSmoke,
                  height: profileData.height,
                  photoUrls: profileData.photoUrls || []
                }
              };
              
              setUser(convertedUser);
            } else {
              console.log('No valid profile data received');
              // Redirect back to matches tab instead of showing fallback
              router.replace('/matches');
              return;
            }
          } catch (apiError) {
            console.error('API error loading user profile:', apiError);
            // Redirect back to matches tab instead of showing fallback
            router.replace('/matches');
            return;
          }
        } 
        // Check if profile is provided (fallback data)
        else if (params.profile) {
          try {
            const profileString = Array.isArray(params.profile) ? params.profile[0] : params.profile;
            const profileData = JSON.parse(profileString);
            setUser(convertProfileDataToApiUser(profileData));
          } catch (parseError) {
            console.error('Error parsing profile data:', parseError);
            // Redirect back to matches tab instead of showing fallback
            router.replace('/matches');
            return;
          }
        } 
        // No parameters provided, redirect to matches
        else {
          console.log('No user parameters provided');
          router.replace('/matches');
          return;
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Redirect back to matches tab instead of showing fallback
        router.replace('/matches');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [params.userBId, params.profile, router]);

  const convertProfileDataToApiUser = (profileData: any): ApiUser => ({
    id: profileData.userId?.toString() || '203',
    name: profileData.firstName || 'Unknown',
    age: profileData.age || 25,
    gender: profileData.gender || 'Unknown',
    photo: profileData.photoUrl || `https://picsum.photos/200/200?random=${profileData.userId || 203}`,
    opinions: profileData.opinions?.map((opinion: any) => ({
      id: opinion.id || Math.random().toString(),
      question: opinion.question || 'Question not available',
      text: opinion.text || opinion.answer || 'No answer provided',
      theme: opinion.theme || 'General',
      liked: false
    })) || []
  });

  if (isLoading) {
    return (
      <BaseLayout showBackButton={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </BaseLayout>
    );
  }

  if (!user) {
    return (
      <BaseLayout showBackButton={true}>
        <View style={styles.loadingContainer}>
          {/* Error state could go here */}
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout 
      showBackButton={true}
      userName={user.name}
      isScrolling={showStickyHeader}
      onBackPress={navigateBackToMatches}
    >
      <UserProfileLayout 
        userData={{
          userId: parseInt(user.id),
          firstName: user.profileData?.fname || user.name.split(' ')[0] || user.name,
          lname: user.profileData?.lname || user.name.split(' ')[1] || '',
          age: user.age,
          gender: user.gender,
          sexuality: user.profileData?.sexuality || '',
          pronouns: user.profileData?.pronouns || '',
          homeTown: user.profileData?.homeTown || '',
          currentCity: user.profileData?.currentCity || '',
          jobDetails: user.profileData?.jobDetails || '',
          college: user.profileData?.college || '',
          highestEducationLevel: user.profileData?.highestEducationLevel || '',
          religiousBeliefs: user.profileData?.religiousBeliefs || '',
          drinkOrSmoke: user.profileData?.drinkOrSmoke || '',
          height: user.profileData?.height || '',
          photoUrls: user.profileData?.photoUrls || [user.photo],
          opinions: user.opinions.map(opinion => ({
            id: opinion.id,
            question: opinion.question,
            text: opinion.text,
            theme: opinion.theme
          }))
        }}
        showStickyHeader={showStickyHeader}
        onScroll={handleScroll}
        layoutType="full-profile"
        showCrossButton={false}
      />
      
      {/* Bottom Action Buttons - Only show for potential matches, not confirmed matches */}
      {!isConfirmedMatch && (
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.crossButton]} 
            onPress={handleCrossPress}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={38} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.likeButton]} 
            onPress={handleLikePress}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  crossButton: {
    backgroundColor: '#666',
  },
  likeButton: {
    backgroundColor: '#004242',
  },
});
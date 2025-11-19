import BaseLayout from '@/components/base-layout';
import { apiService } from '@/services/api';
import { CurrentUserProfile } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfilePage() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCurrentUserProfile();
      
      if (response.code === 200) {
        setProfile(response.model);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getS3Url = (key: string) => {
    return `https://fated-user-uploads-main.s3.ap-south-1.amazonaws.com/${key}`;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShowSticky = scrollY > 20;
    
    if (showStickyHeader !== shouldShowSticky) {
      setShowStickyHeader(shouldShowSticky);
    }
    
    lastScrollY.current = scrollY;
  };

  const renderPhotoCard = (photoUrl: string, index: number) => (
    <View key={`photo-${index}`} style={styles.opinionCard}>
      <Image 
        source={{ uri: getS3Url(photoUrl) }} 
        style={styles.profilePhoto}
        resizeMode="cover"
      />
    </View>
  );

  const renderDetailsCard = () => {
    if (!profile) return null;
    
    return (
      <View style={styles.opinionCard}>
        <Text style={styles.questionText}>Profile Details</Text>
        
        {profile.showGender && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="person" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Gender</Text>
              </View>
              <Text style={styles.detailValue}>{profile.gender}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}
        
        {profile.showSexuality && profile.sexuality && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="heart" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Sexuality</Text>
              </View>
              <Text style={styles.detailValue}>{profile.sexuality}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}
        
        {profile.showPronouns && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="chatbubble" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Pronouns</Text>
              </View>
              <Text style={styles.detailValue}>{profile.pronouns}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}

        {profile.homeTown && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="home" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Home Town</Text>
              </View>
              <Text style={styles.detailValue}>{profile.homeTown}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}
        
        {profile.currentCity && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="location" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Current City</Text>
              </View>
              <Text style={styles.detailValue}>{profile.currentCity}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}
        
        {profile.jobDetails && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="briefcase" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Job</Text>
              </View>
              <Text style={styles.detailValue}>{profile.jobDetails}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}
        
        {profile.colllege && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="school" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>College</Text>
              </View>
              <Text style={styles.detailValue}>{profile.colllege}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}
        
        {profile.highestEducationLevel && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="ribbon" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Education</Text>
              </View>
              <Text style={styles.detailValue}>{profile.highestEducationLevel}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}
        
        {profile.religiousBeliefs && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="book" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Religious Beliefs</Text>
              </View>
              <Text style={styles.detailValue}>{profile.religiousBeliefs}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}
        
        {profile.drinkOrSmoke && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="wine" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Drink/Smoke</Text>
              </View>
              <Text style={styles.detailValue}>{profile.drinkOrSmoke}</Text>
            </View>
            <View style={styles.separator} />
          </>
        )}
        
        {profile.height && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="resize" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Height</Text>
              </View>
              <Text style={styles.detailValue}>{profile.height}</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderOpinionCard = (opinion: CurrentUserProfile['opinions'][0], index: number) => (
    <View key={`opinion-${opinion.takeId}`} style={styles.opinionCard}>
      <View style={styles.themeTag}>
        <Text style={styles.themeText}>{opinion.tag.name}</Text>
      </View>
      <Text style={styles.questionText}>{opinion.question}</Text>
      <Text style={styles.opinionText}>{opinion.answer}</Text>
    </View>
  );

  const renderInterleavedContent = () => {
    if (!profile) return null;
    
    const photoUrls = profile.photoUrls || [];
    const opinions = profile.opinions || [];
    const content: React.ReactElement[] = [];
    
    // Start with first photo if available
    if (photoUrls.length > 0) {
      content.push(renderPhotoCard(photoUrls[0], 0));
    }
    
    // Interleave opinions and photos
    const maxLength = Math.max(opinions.length, photoUrls.length - 1);
    for (let i = 0; i < maxLength; i++) {
      // Add opinion if available
      if (i < opinions.length) {
        content.push(renderOpinionCard(opinions[i], i));
      }
      
      // Add next photo if available (starting from index 1)
      if (i + 1 < photoUrls.length) {
        content.push(renderPhotoCard(photoUrls[i + 1], i + 1));
      }
    }
    
    return content;
  };

  if (isLoading) {
    return (
      <BaseLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9966CC" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </BaseLayout>
    );
  }

  if (!profile) {
    return (
      <BaseLayout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      userName={profile ? `${profile.fname} ${profile.lname || ''}` : undefined}
      isScrolling={showStickyHeader}
    >
      <KeyboardAvoidingView 
        style={[
          styles.container,
          showStickyHeader && { paddingTop: 45 }
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.mainContainer}>
          {/* Header with User Info - Hide when sticky header is shown */}
          {!showStickyHeader && (
            <View style={styles.containerHeader}>
              <View style={styles.userInfoRow}>
                <Image 
                  source={{ uri: profile.photoUrls?.[0] ? getS3Url(profile.photoUrls[0]) : `https://picsum.photos/200/200?random=${profile.fname}` }} 
                  style={styles.userPhoto}
                  blurRadius={3}
                />
                <Text style={styles.userName}>
                  {profile.fname} {profile.lname || ''}
                </Text>
              </View>
            </View>
          )}

          {/* Cards List */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.opinionsContainer}
            contentContainerStyle={[
              styles.opinionsContent,
              { paddingBottom: 200 }
            ]}
            onScroll={handleScroll}
            scrollEventThrottle={32}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            removeClippedSubviews={false}
          >
            {renderDetailsCard()}
            {renderInterleavedContent()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  mainContainer: {
    flex: 1,
    marginTop: 10,
  },
  containerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userPhoto: {
    width: 40,
    height: 40,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Playfair Display',
  },
  opinionsContainer: {
    flex: 1,
  },
  opinionsContent: {
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#9966CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  name: {
    fontSize: 25,
    fontWeight: '500',
    color: '#000',
    fontFamily: 'Playfair Display',
  },
  profileDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: 'black',
    fontWeight: '600',
    fontFamily: 'Playfair Display',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1.5,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  opinionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePhoto: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  themeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#FFCF00',
    marginBottom: 10,
    maxWidth: '70%',
    overflow: 'hidden',
  },
  themeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  questionText: {
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: 'black',
    fontWeight: '600',
    fontFamily: 'Playfair Display',
    marginBottom: 10,
  },
  opinionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000',
  },
});

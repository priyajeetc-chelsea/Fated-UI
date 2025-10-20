import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Image, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface UserProfileLayoutProps {
  userData: {
    userId: number;
    firstName: string;
    gender: string;
    pronouns: string;
    dob: string;
    city: string;
    photoUrl: string;
    profile: {
      education: string;
      profession: string;
      interestedIn: string;
      location: string;
      topicsInterested: string[];
      personalityTrait: string[];
      dealBreaker: string[];
      politicalLeaning: string;
      languages: string[];
      shortBio: string;
    };
    opinions: {
      id: string;
      question: string;
      text: string;
      theme: string;
    }[];
  };
  showStickyHeader: boolean;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onCrossPress?: () => void;
  showCrossButton?: boolean;
  layoutType: 'full-profile' | 'opinions-only';
}

export default function UserProfileLayout({
  userData,
  showStickyHeader,
  onScroll,
  onCrossPress,
  showCrossButton = true,
  layoutType = 'full-profile'
}: UserProfileLayoutProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const renderPhotoCard = () => (
    <View style={styles.opinionCard}>
      <Image 
        source={{ uri: /*userData.photoUrl ||*/`https://picsum.photos/200/200?random=${userData.userId}` }} 
        style={styles.profilePhoto}
      />
    </View>
  );

  const renderBioCard = () => (
    <View style={styles.opinionCard}>
      <ThemedText style={styles.questionText}>Bio</ThemedText>
      <ThemedText style={styles.opinionText}>
        {userData.profile.shortBio}
      </ThemedText>
    </View>
  );

  const renderDetailsCard = () => (
    <View style={styles.opinionCard}>

      <ThemedText style={styles.questionText}>Profile Details</ThemedText>
      
      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>Education</ThemedText>
        <ThemedText style={styles.detailValue}>{userData.profile.education}</ThemedText>
      </View>
      <View style={styles.separator} />
      
      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>Profession</ThemedText>
        <ThemedText style={styles.detailValue}>{userData.profile.profession}</ThemedText>
      </View>
      <View style={styles.separator} />
      
      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>Gender & Pronouns</ThemedText>
        <ThemedText style={styles.detailValue}>{userData.gender} • {userData.pronouns}</ThemedText>
      </View>
      <View style={styles.separator} />
      
      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>Interested In</ThemedText>
        <ThemedText style={styles.detailValue}>{userData.profile.interestedIn}</ThemedText>
      </View>
      <View style={styles.separator} />
      
      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>Political Leaning</ThemedText>
        <ThemedText style={styles.detailValue}>{userData.profile.politicalLeaning}</ThemedText>
      </View>
      <View style={styles.separator} />
      
      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>Languages</ThemedText>
        <ThemedText style={styles.detailValue}>{userData.profile.languages.join(', ')}</ThemedText>
      </View>
      <View style={styles.separator} />
      
      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>Personality Traits</ThemedText>
        <ThemedText style={styles.detailValue}>{userData.profile.personalityTrait.join(', ')}</ThemedText>
      </View>
      <View style={styles.separator} />
      
      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>Deal Breakers</ThemedText>
        <ThemedText style={styles.detailValue}>{userData.profile.dealBreaker.join(', ')}</ThemedText>
      </View>
    </View>
  );

  const renderOpinionCards = () => (
    userData.opinions.map((opinion) => (
      <View key={opinion.id} style={styles.opinionCard}>
        <View style={styles.themeTag}>
          <ThemedText style={styles.themeText}>{opinion.theme}</ThemedText>
        </View>
        <ThemedText style={styles.questionText}>{opinion.question}</ThemedText>
        <ThemedText style={styles.opinionText}>{opinion.text}</ThemedText>
      </View>
    ))
  );

  return (
    <KeyboardAvoidingView 
      style={[
        styles.container,
        showStickyHeader && { paddingTop: 45 }
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Main Content Container */}
      <View style={styles.mainContainer}>
        {/* Header with User Info - Hide when sticky header is shown */}
        {!showStickyHeader && (
          <View style={styles.containerHeader}>
            <View style={styles.userInfoRow}>
              <Image 
                source={{ uri: /*userData.photoUrl ||*/`https://picsum.photos/200/200?random=${userData.userId}` }} 
                style={styles.userPhoto}
                blurRadius={3}
              />
              <ThemedText style={[styles.userName, { color: '#000' }]}>
                {userData.firstName}
              </ThemedText>
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
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          removeClippedSubviews={false}
        >
          {layoutType === 'full-profile' && (
            <>
              {renderPhotoCard()}
              {renderBioCard()}
              {renderDetailsCard()}
            </>
          )}
          {renderOpinionCards()}
        </ScrollView>
      </View>

      {/* Cross Button */}
      {showCrossButton && onCrossPress && (
        <TouchableOpacity 
          style={styles.crossButton} 
          onPress={onCrossPress}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
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
  },
  opinionsContainer: {
    flex: 1,
  },
  opinionsContent: {
    minHeight: '100%',
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
  themeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '70%',
    backgroundColor:'#FFCF00',//bumble yellow
    overflow: 'hidden',
  },
  themeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  questionText: {
    fontSize: 22,
    lineHeight: 22,
    color: 'black',
    fontWeight: 'bold',
    fontFamily: 'Times New Roman',
    marginBottom: 10,
  },
  opinionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000',
    marginBottom: 16,
  },
  profilePhoto: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
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
  crossButton: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
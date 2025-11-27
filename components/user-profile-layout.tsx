import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Image, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface UserProfileLayoutProps {
  userData: {
    userId: number;
    firstName: string;
    lname?: string;
    age?: number;
    gender: string;
    sexuality?: string;
    pronouns: string;
    homeTown?: string;
    currentCity?: string;
    jobDetails?: string;
    college?: string;
    highestEducationLevel?: string;
    religiousBeliefs?: string;
    drinkOrSmoke?: string;
    height?: string;
    photoUrls?: string[];
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

  const renderPhotoCard = (photoUrl: string, index: number) => (
    <View key={`photo-${index}`} style={styles.photoCardContainer}>
      <Image 
        source={{ uri: photoUrl }} 
        style={styles.profilePhoto}
        resizeMode="cover"
      />
    </View>
  );

  const renderDetailsCard = () => (
    <View style={styles.opinionCard}>
      
      {/* Horizontal scrollable grid for short fields */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.gridScrollContainer}
        contentContainerStyle={styles.gridContentContainer}
      >
        {(() => {
          const gridFields = [];
          
          // Helper function to check if value is short enough (less than 10 characters)
          const isShortValue = (value: any) => {
            return value && String(value).length < 20;
          };
          
          if (isShortValue(userData.age)) {
            gridFields.push(
              <React.Fragment key="age">
                <View style={styles.gridItem}>
                  <Ionicons name="calendar" size={16} color="#666" style={styles.gridIcon} />
                  <ThemedText style={styles.gridLabel}>Age</ThemedText>
                  <ThemedText style={styles.gridValue}>{userData.age}</ThemedText>
                </View>
              </React.Fragment>
            );
          }
          
          if (isShortValue(userData.gender)) {
            if (gridFields.length > 0) {
              gridFields.push(<View key="sep-gender" style={styles.verticalSeparator} />);
            }
            gridFields.push(
              <React.Fragment key="gender">
                <View style={styles.gridItem}>
                  <Ionicons name="person" size={16} color="#666" style={styles.gridIcon} />
                  <ThemedText style={styles.gridLabel}>Gender</ThemedText>
                  <ThemedText style={styles.gridValue}>{userData.gender}</ThemedText>
                </View>
              </React.Fragment>
            );
          }
          
          if (isShortValue(userData.sexuality)) {
            if (gridFields.length > 0) {
              gridFields.push(<View key="sep-sexuality" style={styles.verticalSeparator} />);
            }
            gridFields.push(
              <React.Fragment key="sexuality">
                <View style={styles.gridItem}>
                  <Ionicons name="heart" size={16} color="#666" style={styles.gridIcon} />
                  <ThemedText style={styles.gridLabel}>Sexuality</ThemedText>
                  <ThemedText style={styles.gridValue}>{userData.sexuality}</ThemedText>
                </View>
              </React.Fragment>
            );
          }
          
          if (isShortValue(userData.height)) {
            if (gridFields.length > 0) {
              gridFields.push(<View key="sep-height" style={styles.verticalSeparator} />);
            }
            gridFields.push(
              <React.Fragment key="height">
                <View style={styles.gridItem}>
                  <Ionicons name="resize" size={16} color="#666" style={styles.gridIcon} />
                  <ThemedText style={styles.gridLabel}>Height</ThemedText>
                  <ThemedText style={styles.gridValue}>{userData.height}</ThemedText>
                </View>
              </React.Fragment>
            );
          }
          
          if (isShortValue(userData.pronouns)) {
            if (gridFields.length > 0) {
              gridFields.push(<View key="sep-pronouns" style={styles.verticalSeparator} />);
            }
            gridFields.push(
              <React.Fragment key="pronouns">
                <View style={styles.gridItem}>
                  <Ionicons name="chatbubble" size={16} color="#666" style={styles.gridIcon} />
                  <ThemedText style={styles.gridLabel}>Pronouns</ThemedText>
                  <ThemedText style={styles.gridValue}>{userData.pronouns}</ThemedText>
                </View>
              </React.Fragment>
            );
          }
          
          return gridFields;
        })()}
      </ScrollView>
      
      <View style={styles.separator} />
      
      {/* Longer fields displayed vertically */}
      {userData.homeTown && (
        <>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="home" size={16} color="#666" style={styles.detailIcon} />
              <ThemedText style={styles.detailLabel}>Home Town</ThemedText>
            </View>
            <ThemedText style={styles.detailValue}>{userData.homeTown}</ThemedText>
          </View>
          <View style={styles.separator} />
        </>
      )}
      
      {userData.currentCity && (
        <>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="location" size={16} color="#666" style={styles.detailIcon} />
              <ThemedText style={styles.detailLabel}>Current City</ThemedText>
            </View>
            <ThemedText style={styles.detailValue}>{userData.currentCity}</ThemedText>
          </View>
          <View style={styles.separator} />
        </>
      )}
      
      {userData.jobDetails && (
        <>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="briefcase" size={16} color="#666" style={styles.detailIcon} />
              <ThemedText style={styles.detailLabel}>Job</ThemedText>
            </View>
            <ThemedText style={styles.detailValue}>{userData.jobDetails}</ThemedText>
          </View>
          <View style={styles.separator} />
        </>
      )}
      
      {userData.college && (
        <>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="school" size={16} color="#666" style={styles.detailIcon} />
              <ThemedText style={styles.detailLabel}>College</ThemedText>
            </View>
            <ThemedText style={styles.detailValue}>{userData.college}</ThemedText>
          </View>
          <View style={styles.separator} />
        </>
      )}
      
      {userData.highestEducationLevel && (
        <>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="ribbon" size={16} color="#666" style={styles.detailIcon} />
              <ThemedText style={styles.detailLabel}>Education</ThemedText>
            </View>
            <ThemedText style={styles.detailValue}>{userData.highestEducationLevel}</ThemedText>
          </View>
          <View style={styles.separator} />
        </>
      )}
      
      {userData.religiousBeliefs && (
        <>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="book" size={16} color="#666" style={styles.detailIcon} />
              <ThemedText style={styles.detailLabel}>Religious Beliefs</ThemedText>
            </View>
            <ThemedText style={styles.detailValue}>{userData.religiousBeliefs}</ThemedText>
          </View>
          <View style={styles.separator} />
        </>
      )}
      
      {userData.drinkOrSmoke && (
        <>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="wine" size={16} color="#666" style={styles.detailIcon} />
              <ThemedText style={styles.detailLabel}>Drink/Smoke</ThemedText>
            </View>
            <ThemedText style={styles.detailValue}>{userData.drinkOrSmoke}</ThemedText>
          </View>
          <View style={styles.separator} />
        </>
      )}
      
      
    </View>
  );

  const renderOpinionCard = (opinion: any, index: number) => (
    <View key={`opinion-${opinion.id}`} style={styles.opinionCard}>
      <View style={styles.themeTag}>
        <ThemedText style={styles.themeText}>{opinion.theme}</ThemedText>
      </View>
      <ThemedText style={styles.questionText}>{opinion.question}</ThemedText>
      <ThemedText style={styles.opinionText}>{opinion.text}</ThemedText>
    </View>
  );

  // Interleave photos and opinions: photo, opinion, photo, opinion, etc.
  const renderInterleavedContent = () => {
    const photoUrls = userData.photoUrls || [];
    const opinions = userData.opinions || [];
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
                source={{ uri: userData.photoUrls?.[0]  }} 
                style={styles.userPhoto}
              />
              <ThemedText style={[styles.userName, { color: '#000' }]}>
                {userData.firstName} {userData.lname || ''}
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
              {renderDetailsCard()}
              {renderInterleavedContent()}
            </>
          )}
          {layoutType === 'opinions-only' && userData.opinions.map((opinion, index) => renderOpinionCard(opinion, index))}
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
    fontFamily: 'Playfair Display',
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
  photoCardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
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
    marginBottom: 16,
  },
  profilePhoto: {
    width: '100%',
    height: 300,
    borderRadius: 16,
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
    color: '#333',
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
  gridScrollContainer: {
    maxHeight: 100,
    width: '100%',
    marginVertical: 4,
  },
  gridContentContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  gridItem: {
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  gridIcon: {
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  gridValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  verticalSeparator: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
    alignSelf: 'stretch',
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
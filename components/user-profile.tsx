import { ApiUser } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';

interface UserProfileProps {
  user: ApiUser;
  onLikeOpinion: (opinionId: string) => void;
  onRemoveUser: () => void;
  onScrollStateChange?: (isScrolling: boolean) => void;
}

export default function UserProfile({ user, onLikeOpinion, onRemoveUser, onScrollStateChange }: UserProfileProps) {
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const opinionLayouts = useRef<{[key: string]: {y: number, height: number}}>({});
  const lastScrollY = useRef(0);
  // Create a stable reference to onScrollStateChange
  const scrollStateChangeRef = useRef(onScrollStateChange);
  
  // Update the ref when the prop changes
  useEffect(() => {
    scrollStateChangeRef.current = onScrollStateChange;
  }, [onScrollStateChange]);

  // Simple state reset when user changes
  useEffect(() => {
    // Reset state immediately
    setShowStickyHeader(false);
    
    // Use the ref to avoid dependency issues
    if (typeof scrollStateChangeRef.current === 'function') {
      scrollStateChangeRef.current(false);
    }
    
    lastScrollY.current = 0;
  }, [user.id]);

  const truncateText = (text: string, maxWords: number = 30) => {
    const words = text.split(' ');
    if (words.length <= maxWords) {
      return { text, isTruncated: false };
    }
    return {
      text: words.slice(0, maxWords).join(' '),
      isTruncated: true
    };
  };

  const handleLike = (opinionId: string) => {
    // Directly trigger the modal without showing comment box
    onLikeOpinion(opinionId);
  };

  // Create a non-memoized version for scroll events that doesn't cause render cycles
  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Reduced threshold for smoother, earlier appearance of sticky header
    const shouldShowSticky = scrollY > 20;
    
    // Only update if the state is changing to avoid unnecessary re-renders
    if (showStickyHeader !== shouldShowSticky) {
      setShowStickyHeader(shouldShowSticky);
      
      // Use the ref to avoid dependency issues
      if (typeof scrollStateChangeRef.current === 'function') {
        scrollStateChangeRef.current(shouldShowSticky);
      }
    }
    
    // Store the last scroll position
    lastScrollY.current = scrollY;
  }

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={[
          styles.container,
          showStickyHeader && { paddingTop: 45 } // Match reduced sticky header height
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
                source={{ uri: user.photo }} 
                style={styles.userPhoto}
                blurRadius={3}
              />
              <ThemedText style={[styles.userName, { color: '#000' }]}>
                {user.name}
              </ThemedText>
               {/* <ThemedText style={styles.userGender}>
                ({user.gender})
              </ThemedText> */}
            </View>
          </View>
        )}

        {/* Opinions List */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.opinionsContainer}
          contentContainerStyle={[
            styles.opinionsContent,
            { paddingBottom: user.opinions.length === 1 ? 200 : 350 }
          ]}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          removeClippedSubviews={false}
        >
          {user.opinions.map((opinion) => (
            <View 
              key={opinion.id} 
              style={styles.opinionCard}
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                opinionLayouts.current[opinion.id] = { y, height };
              }}
            >
              {/* Theme Tag - Always show */}
              <View style={styles.themeTag}>
                <ThemedText style={styles.themeText}>{opinion.theme}</ThemedText>
              </View>

              {/* Question */}
              <ThemedText style={styles.questionText}>
                {opinion.question}
              </ThemedText>

              {/* Answer */}
              <View>
                {(() => {
                  const { text, isTruncated } = truncateText(opinion.text, 30);
                  return (
                    <>
                      <ThemedText style={styles.opinionText}>
                        {isTruncated ? `${text}...` : text}
                      </ThemedText>
                      {isTruncated && (
                        <TouchableOpacity onPress={() => handleLike(opinion.id)}>
                          <ThemedText style={styles.readMoreText}>
                            Read more
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </>
                  );
                })()}
              </View>

              {/* Like Button */}
              <TouchableOpacity 
                style={[
                  styles.likeButton, 
                  opinion.liked && styles.likedButton
                ]} 
                onPress={() => handleLike(opinion.id)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={"heart-outline"} 
                  size={25} 
                  color={'#000'} 
                />
                
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Cross Button */}
      <TouchableOpacity 
        style={styles.crossButton} 
        onPress={onRemoveUser}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  mainContainer: {
    flex: 1
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
    fontSize: 25,
    fontWeight: '500',
    color: '#000',
  },
   userGender: {
    fontSize: 12,
    color: '#9966CC',
  },
  opinionsContainer: {
    flex: 1,
  },
  opinionsContent: {
    // Dynamic paddingBottom applied in component
    minHeight: '100%',
  },
  opinionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden', // Prevent any content from overflowing the card
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
    backgroundColor:'#FFCF00',//bumble yellow
    marginBottom: 10,
    maxWidth: '70%', // Prevent overflow beyond opinion card
    overflow: 'hidden', // Ensure content doesn't overflow
  },
  themeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1, // Allow text to shrink if needed
  },
  questionText: {
    fontSize: 25,
    lineHeight: 26,
    letterSpacing: -0.5,
    color: 'black',
    fontWeight: 'bold',
    fontFamily: 'Playfair Display',
    marginBottom: 10,
  },
  opinionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000',
    marginBottom: 16,
  },
  readMoreText: {
    fontSize: 14,
    color: '#9966CC',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  likedButton: {
    borderColor: '#9966CC',
    backgroundColor: '#FFF5F5',
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

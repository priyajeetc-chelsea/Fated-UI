import BaseLayout from '@/components/base-layout';
import OpinionModal from '@/components/opinion-modal';
import ThemeFilterBubbles from '@/components/theme-filter-bubbles';
import { ThemedText } from '@/components/themed-text';
import UserProfile from '@/components/user-profile';
import { useUser } from '@/contexts/UserContext';
import { useApiErrorHandler } from '@/hooks/use-api-error-handler';
import { apiService } from '@/services/api';
import { ApiOpinion, ApiUser, MatchRequest, Tag } from '@/types/api';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, AppStateStatus, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { setCurrentUser } = useUser();
  const router = useRouter();
  const { handleError } = useApiErrorHandler();
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

  // Track if we've redirected to onboarding to prevent infinite loops
  const hasInitiallyLoaded = React.useRef(false);
  const isRedirecting = React.useRef(false);
  const hasCheckedOnboarding = React.useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isOnOnboardingScreen = useRef(false);
  const isScreenFocused = useRef(false);

  // Listen for app state changes (when user reopens the app)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // When app comes back to foreground, check onboarding status
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔄 App came to foreground, checking onboarding status...');
        console.log('🔍 isScreenFocused.current =', isScreenFocused.current);
        console.log('🔍 isOnOnboardingScreen.current =', isOnOnboardingScreen.current);

        // Skip if homepage is not the currently focused screen
        if (!isScreenFocused.current) {
          console.log('⏭️ Homepage not focused, skipping status check');
          appStateRef.current = nextAppState;
          return;
        }

        // Skip if we're already on an onboarding screen
        if (isOnOnboardingScreen.current) {
          console.log('⏭️ Already on onboarding screen, skipping status check');
          appStateRef.current = nextAppState;
          return;
        }

        try {
          const response = await apiService.getOnboardingStatus();

          if (response.model?.onboardingStep && response.model.onboardingStep.step < 5) {
            console.log('🚧 User needs to complete onboarding, redirecting to step:', response.model.onboardingStep.step);

            const { router, usePathname } = await import('expo-router');
            const { useSegments } = await import('expo-router');
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

            // Check cached page first
            const cachedPage = await AsyncStorage.getItem('@current_onboarding_page');
            const effectiveStep = cachedPage
              ? Math.max(parseInt(cachedPage, 10), response.model.onboardingStep.step)
              : response.model.onboardingStep.step;

            console.log('📍 Using effective step:', effectiveStep, '(cached:', cachedPage, ', backend:', response.model.onboardingStep.step, ')');

            // Mark that we're redirecting to onboarding
            isOnOnboardingScreen.current = true;

            // Determine target route and redirect
            switch (effectiveStep) {
              case 1:
                console.log('🔀 Redirecting to: /onboarding/basic');
                router.replace('/onboarding/basic');
                break;
              case 2:
                console.log('🔀 Redirecting to: /onboarding/lifestyle');
                router.replace('/onboarding/lifestyle');
                break;
              case 3:
                console.log('🔀 Redirecting to: /onboarding/takes');
                router.replace('/onboarding/takes');
                break;
              case 4:
                console.log('🔀 Redirecting to: /onboarding/photos');
                router.replace('/onboarding/photos');
                break;
            }
          } else {
            console.log('✅ Onboarding complete, staying on homepage');
            // Reset the flag when onboarding is complete
            isOnOnboardingScreen.current = false;
          }
        } catch (error) {
          console.error('❌ Failed to check onboarding status on app resume:', error);
          handleError(error);
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [handleError]);

  // Initial API call - use useFocusEffect to handle tab navigation
  useFocusEffect(
    useCallback(() => {
      // Mark that homepage is now the focused screen
      isScreenFocused.current = true;
      console.log('🏠 Homepage: Screen focused, setting isScreenFocused = true');

      // Prevent any action if we're currently redirecting to onboarding
      if (isRedirecting.current) {
        console.log('🏠 Homepage: Redirect in progress, skipping focus handler');
        return;
      }

      // Only load on the first focus, not every time user navigates back
      if (!hasInitiallyLoaded.current) {
        console.log('🏠 Homepage: Starting initial load...');
        hasInitiallyLoaded.current = true;

        const defaultRequest = apiService.getDefaultRequest();
        setCurrentRequest(defaultRequest);

        // Load matches
        loadMatches(defaultRequest);
      } else {
        console.log('🏠 Homepage: Focused again, skipping reload to prevent infinite loop');
      }

      // Return cleanup function to mark screen as unfocused
      return () => {
        isScreenFocused.current = false;
        console.log('🏠 Homepage: Screen unfocused, setting isScreenFocused = false');
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );  // Reset scrolling state when currentUserIndex changes
  useEffect(() => {
    setIsScrolling(false);
  }, [currentUserIndex]);

  const loadMatches = async (request: MatchRequest, isThemeChange = false, appendToExisting = false) => {
    // Don't load if we're redirecting
    if (isRedirecting.current) {
      console.log('⚠️ loadMatches: Redirecting in progress, skipping API call');
      return;
    }

    if (!appendToExisting) {
      setIsLoading(true);
    }

    try {
      console.log('📡 loadMatches: Calling /home API with request:', request);
      const response = await apiService.fetchMatches(request);
      console.log('📡 loadMatches: Received response:', {
        userId: response.userId,
        onboardingStep: response.onboardingStep,
        matchesCount: response.matches?.length
      });

      // Store current user's ID from the response
      if (response.userId) {
        console.log('🏠 Homepage: Setting currentUser with userId =', response.userId);
        setCurrentUser({
          id: response.userId,
          name: 'Current User',
        });
      } else {
        console.warn('⚠️ Homepage: API response missing userId!', response);
      }

      // Check if user needs to complete onboarding
      if (response.onboardingStep && response.onboardingStep.step < 5) {
        // Only redirect once
        if (hasCheckedOnboarding.current) {
          console.log('⚠️ Homepage (loadMatches): Already checked onboarding, not redirecting again');
          setIsLoading(false);
          return;
        }

        console.log('⚠️ Homepage (loadMatches): User in onboarding step', response.onboardingStep.step, '- redirecting');
        hasCheckedOnboarding.current = true;
        isRedirecting.current = true; // Mark that we're redirecting
        isOnOnboardingScreen.current = true; // Set the flag to prevent AppState handler from redirecting
        const step = response.onboardingStep.step;

        // Check cached page first for more accurate routing
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const cachedPage = await AsyncStorage.getItem('@current_onboarding_page');
        const effectiveStep = cachedPage
          ? Math.max(parseInt(cachedPage, 10), step)
          : step;

        console.log('📍 Homepage: Using effective step:', effectiveStep, '(cached:', cachedPage, ', backend:', step, ')');

        // Route to the appropriate onboarding screen
        const onboardingRoutes: Record<number, string> = {
          1: '/onboarding/basic',
          2: '/onboarding/lifestyle',
          3: '/onboarding/takes',
          4: '/onboarding/photos',
        };

        router.replace(onboardingRoutes[effectiveStep] as any || '/onboarding/basic');
        setIsLoading(false);
        return;
      }

      // If we reach here, onboarding is complete (step >= 5)
      // Reset the flag so AppState handler can work correctly for future sessions
      console.log('✅ Onboarding complete, resetting flag');
      isOnOnboardingScreen.current = false;

      if (!response.matches || response.matches.length === 0) {
        console.log('⚠️ No matches available');
        setUsers([]);
        if (!appendToExisting) {
          setTags(response.tags?.all || []);
        }
        setIsLoading(false);
        return;
      }

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
      handleError(error);
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
      <BaseLayout showLogoutButton showAppHeader>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </BaseLayout>
    );
  }

  if (users.length === 0) {
    return (
      <BaseLayout showLogoutButton showAppHeader>
        <View style={styles.emptyContainer}>
          {!isScrolling && (
            <View style={styles.emptyThemeContainer}>
              <ThemeFilterBubbles
                tags={tags}
                onThemeChange={handleThemeChange}
              />
            </View>
          )}
          <View style={styles.emptyMessageContainer}>
            <ThemedText style={styles.emptyMessageTitle}>That&apos;s all for today! ✨</ThemedText>
            <ThemedText style={styles.emptyMessageSubtitle}>
              Come back after 72 hours to discover new opinions and matches.
            </ThemedText>
          </View>
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
      showLogoutButton
      showAppHeader
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  emptyThemeContainer: {
    width: '100%',
    marginBottom: 20,
  },
  emptyMessageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: -60, // Offset to center better on mobile
  },
  emptyMessageTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  emptyMessageSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
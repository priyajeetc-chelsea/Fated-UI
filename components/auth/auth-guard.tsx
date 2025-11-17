import { AuthModal } from '@/components/auth';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth/AuthContext';
import { apiService } from '@/services/api';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WaveText } from './wave-text';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);

  useEffect(() => {
    // Once loading is complete and we've checked authentication status
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true);
      
      // If user is not authenticated, show the auth modal
      if (!isAuthenticated) {
        setShowAuthModal(true);
      } else {
        // User is already authenticated, check onboarding status
        checkOnboardingStatusForAuthenticatedUser();
      }
    }
  }, [isLoading, isAuthenticated, hasCheckedAuth]);

  const checkOnboardingStatusForAuthenticatedUser = async () => {
    try {
      setIsCheckingOnboarding(true);
      console.log('🔍 Checking onboarding status for authenticated user...');
      const response = await apiService.getOnboardingStatus();
      
      if (response.model?.onboardingStep) {
        const step = response.model.onboardingStep.step;
        
        console.log('🔍 Current onboarding step:', step);
        
        // Only redirect if user is not on step 5 (completed)
        if (step < 5) {
          switch (step) {
            case 1:
              router.replace('/onboarding/basic');
              break;
            case 2:
              router.replace('/onboarding/lifestyle');
              break;
            case 3:
              router.replace('/onboarding/takes');
              break;
            case 4:
              router.replace('/onboarding/photos');
              break;
          }
        } else {
          setIsCheckingOnboarding(false);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status for authenticated user:', error);
      setIsCheckingOnboarding(false);
    }
  };

  // Show loading screen while checking authentication or onboarding
  if (isLoading || !hasCheckedAuth || isCheckingOnboarding) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.loadingContainer}>
          <WaveText text="Fated" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // If authenticated, show the main app
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, show auth modal over a placeholder
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* Authentication Modal */}
        <AuthModal
          isVisible={showAuthModal}
          onClose={() => {
            // Only allow closing if user becomes authenticated
            // Otherwise, prevent closing to force authentication
            if (isAuthenticated) {
              setShowAuthModal(false);
            }
          }}
          onAuthSuccess={async () => {
            setShowAuthModal(false);
            setIsCheckingOnboarding(true);
            // After successful auth, check onboarding status
            try {
              const response = await apiService.getOnboardingStatus();
              
              if (response.model?.onboardingStep) {
                const step = response.model.onboardingStep.step;
                
                console.log('🔍 Checking onboarding status after auth:', step);
                
                // Navigate based on step
                switch (step) {
                  case 1:
                    router.replace('/onboarding/basic');
                    break;
                  case 2:
                    router.replace('/onboarding/lifestyle');
                    break;
                  case 3:
                    router.replace('/onboarding/takes');
                    break;
                  case 4:
                    router.replace('/onboarding/photos');
                    break;
                  case 5:
                    // Profile complete, stay on current page (home will load)
                    console.log('✅ Profile complete, staying on home page');
                    setIsCheckingOnboarding(false);
                    break;
                  default:
                    router.replace('/onboarding/basic');
                }
              } else {
                // No onboarding step found, start onboarding
                console.log('🆕 New user, starting onboarding');
                router.replace('/onboarding/basic');
              }
            } catch (error) {
              console.error('Error checking onboarding status:', error);
              // On error, start onboarding
              router.replace('/onboarding/basic');
            }
          }}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingSubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  appTitle: {
    marginBottom: 10,
    textAlign: 'center',
  },
  appSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
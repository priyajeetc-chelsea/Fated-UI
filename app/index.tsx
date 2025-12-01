import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

const CURRENT_ONBOARDING_PAGE_KEY = '@current_onboarding_page';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      console.log('🔍 Index: Checking onboarding status...');
      
      // First, check if there's a cached current page (more reliable than backend)
      const cachedPage = await AsyncStorage.getItem(CURRENT_ONBOARDING_PAGE_KEY);
      if (cachedPage) {
        const cachedStep = parseInt(cachedPage, 10);
        console.log('📦 Index: Found cached onboarding step:', cachedStep);
        
        // Validate with backend that onboarding is still needed
        const response = await apiService.getOnboardingStatus();
        if (response.model?.onboardingStep && response.model.onboardingStep.step < 5) {
          // Use the higher of cached or backend step (user might have progressed)
          const effectiveStep = Math.max(cachedStep, response.model.onboardingStep.step);
          console.log('🚧 Index: Using effective step:', effectiveStep);
          setShouldRedirectToOnboarding(true);
          setOnboardingStep(effectiveStep);
          return;
        } else {
          // Backend says complete, clear cache and go to homepage
          await AsyncStorage.removeItem(CURRENT_ONBOARDING_PAGE_KEY);
          console.log('✅ Index: Onboarding complete, cleared cache');
          setShouldRedirectToOnboarding(false);
          return;
        }
      }
      
      // No cache, rely on backend
      const response = await apiService.getOnboardingStatus();
      
      if (response.model?.onboardingStep && response.model.onboardingStep.step < 5) {
        console.log('🚧 Index: User needs onboarding, step:', response.model.onboardingStep.step);
        setShouldRedirectToOnboarding(true);
        setOnboardingStep(response.model.onboardingStep.step);
      } else {
        console.log('✅ Index: Onboarding complete, redirecting to homepage');
        setShouldRedirectToOnboarding(false);
      }
    } catch (error) {
      console.error('❌ Index: Failed to check onboarding status:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && 
          (error.message.includes('Authentication expired') ||
           error.message.includes('Session expired') ||
           error.message.includes('No authentication token') ||
           error.message.includes('401'))) {
        console.log('🔐 Authentication error detected in index, will show login');
        // Clear any cached onboarding data
        await AsyncStorage.removeItem(CURRENT_ONBOARDING_PAGE_KEY);
      }
      
      // On error, proceed to homepage (AuthGuard will handle auth requirement)
      setShouldRedirectToOnboarding(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading while checking
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Redirect based on onboarding status
  if (shouldRedirectToOnboarding && onboardingStep) {
    switch (onboardingStep) {
      case 1:
        return <Redirect href="/onboarding/basic" />;
      case 2:
        return <Redirect href="/onboarding/lifestyle" />;
      case 3:
        return <Redirect href="/onboarding/takes" />;
      case 4:
        return <Redirect href="/onboarding/photos" />;
      default:
        return <Redirect href="/onboarding/basic" />;
    }
  }

  return <Redirect href="/(tabs)/homepage" />;
}
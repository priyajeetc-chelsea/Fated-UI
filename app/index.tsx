import { apiService } from '@/services/api';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

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
      // On error, proceed to homepage (user might need to login)
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
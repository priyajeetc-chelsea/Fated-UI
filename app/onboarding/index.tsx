import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function OnboardingIndex() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Call home API to get onboarding step
      const response = await apiService.getOnboardingStatus();

      if (response.model?.onboardingStep) {
        let step = response.model.onboardingStep.step;

        // Check cached page for more accurate routing
        const cachedPage = await AsyncStorage.getItem(
          "@current_onboarding_page",
        );
        if (cachedPage) {
          const cachedStep = parseInt(cachedPage, 10);
          step = Math.max(cachedStep, step);
          console.log(
            "📍 OnboardingIndex: Using effective step:",
            step,
            "(cached:",
            cachedStep,
            ", backend:",
            response.model.onboardingStep.step,
            ")",
          );
        }

        // Navigate based on step
        switch (step) {
          case 1:
            router.replace("/onboarding/basic");
            break;
          case 2:
            router.replace("/onboarding/lifestyle");
            break;
          case 3:
            router.replace("/onboarding/topic-selection");
            break;
          case 4:
            router.replace("/onboarding/photos");
            break;
          case 5:
            // Profile complete, go to home
            router.replace("/(tabs)/homepage");
            break;
          default:
            // Default to basic details for new users
            router.replace("/onboarding/basic");
        }
      } else {
        // No onboarding step found, start from beginning
        router.replace("/onboarding/basic");
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // On error, start from beginning
      router.replace("/onboarding/basic");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});

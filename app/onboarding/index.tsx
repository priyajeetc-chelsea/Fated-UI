import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const SELECTED_TOPICS_KEY = "@fated_selected_topics";

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
        // Use backend step as source of truth
        const step = response.model.onboardingStep.step;

        // Check cached page and clear if stale
        const cachedPage = await AsyncStorage.getItem(
          "@current_onboarding_page",
        );
        if (cachedPage) {
          const cachedStep = parseInt(cachedPage, 10);
          console.log(
            "📍 OnboardingIndex: Using backend step:",
            step,
            "(cached was:",
            cachedStep,
            ")",
          );
          // Clear stale cache
          if (cachedStep !== step) {
            await AsyncStorage.removeItem("@current_onboarding_page");
          }
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
            // Clear any stale topic selections when returning to step 3 from backend
            // This ensures fresh start, but preserves selections during back navigation
            await AsyncStorage.removeItem(SELECTED_TOPICS_KEY);
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

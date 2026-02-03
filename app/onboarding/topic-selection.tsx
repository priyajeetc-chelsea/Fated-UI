import OnboardingButton from "@/components/onboarding/onboarding-button";
import ProgressIndicator from "@/components/onboarding/progress-indicator";
import { apiService } from "@/services/api";
import { TagAndQuestion } from "@/types/onboarding";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SELECTED_TOPICS_STORAGE_KEY = "@fated_selected_topics";

export default function TopicSelectionScreen() {
  const [tagAndQuestions, setTagAndQuestions] = useState<TagAndQuestion[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        // Fetch from takes API
        console.log("Fetching topics from takes API...");
        const response = await apiService.getTakesQuestions();

        if (
          response.code === 200 &&
          response.model &&
          Array.isArray(response.model)
        ) {
          // Filter out topics with null or empty questions
          const validTopics = response.model.filter(
            (taq: TagAndQuestion) => taq.questions && taq.questions.length > 0,
          );
          setTagAndQuestions(validTopics);

          // Check if there are previously selected topic IDs in storage
          const savedSelectedTopics = await AsyncStorage.getItem(
            SELECTED_TOPICS_STORAGE_KEY,
          );
          if (savedSelectedTopics) {
            try {
              const preSelectedIds: number[] = JSON.parse(savedSelectedTopics);
              // Only set topics that exist in the valid topics list
              const validPreSelected = preSelectedIds.filter((id) =>
                validTopics.some((taq: TagAndQuestion) => taq.tag.id === id),
              );
              setSelectedTopics(validPreSelected);
            } catch (e) {
              console.error("Error parsing saved selected topics:", e);
            }
          }
        } else {
          Alert.alert("Error", "Failed to load topics. Please try again.");
        }
      } catch (error) {
        console.error("Error loading topics:", error);
        Alert.alert("Error", "Failed to load topics. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTopics();
  }, []);

  const toggleTopic = (tagId: number) => {
    setSelectedTopics((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedTopics.length === 0) {
      Alert.alert(
        "Select Topics",
        "Please select at least one topic to continue.",
      );
      return;
    }

    try {
      console.log("Saving selected topic IDs:", selectedTopics);

      // Save selected topic IDs to AsyncStorage
      await AsyncStorage.setItem(
        SELECTED_TOPICS_STORAGE_KEY,
        JSON.stringify(selectedTopics),
      );

      // Verify data was saved
      const verify = await AsyncStorage.getItem(SELECTED_TOPICS_STORAGE_KEY);
      console.log("Verified saved topic IDs:", verify);

      // Navigate to takes page
      router.push("/onboarding/takes");
    } catch (error) {
      console.error("Error saving topics:", error);
      Alert.alert("Error", "Failed to save topics. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B164C" />
        <Text style={styles.loadingText}>Loading topics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ProgressIndicator
          currentStep={3}
          totalSteps={5}
          stepNames={[
            "Basic Details",
            "Lifestyle",
            "Topics",
            "Your Takes",
            "Photos",
          ]}
        />

        <Text style={styles.title}>Choose Topics</Text>
        <Text style={styles.subtitle}>
          Select the topics you&apos;d like to share your opinions on. You can
          choose one or more topics.
        </Text>

        <View style={styles.topicsContainer}>
          {tagAndQuestions.map((taq) => (
            <TouchableOpacity
              key={taq.tag.id}
              style={[
                styles.topicCard,
                selectedTopics.includes(taq.tag.id) && styles.topicCardSelected,
              ]}
              onPress={() => toggleTopic(taq.tag.id)}
            >
              <View style={styles.topicContent}>
                <Text
                  style={[
                    styles.topicName,
                    selectedTopics.includes(taq.tag.id) &&
                      styles.topicNameSelected,
                  ]}
                >
                  {taq.tag.name}
                </Text>
                {taq.tag.description && (
                  <Text
                    style={[
                      styles.topicDescription,
                      selectedTopics.includes(taq.tag.id) &&
                        styles.topicDescriptionSelected,
                    ]}
                  >
                    {taq.tag.description}
                  </Text>
                )}
                <Text
                  style={[
                    styles.questionCount,
                    selectedTopics.includes(taq.tag.id) &&
                      styles.questionCountSelected,
                  ]}
                >
                  {taq.questions?.length || 0} question
                  {taq.questions?.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  selectedTopics.includes(taq.tag.id) &&
                    styles.checkboxSelected,
                ]}
              >
                {selectedTopics.includes(taq.tag.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedTopics.length} topic
            {selectedTopics.length !== 1 ? "s" : ""} selected
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <OnboardingButton
            title="Continue to Questions"
            onPress={handleContinue}
            disabled={selectedTopics.length === 0}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
  },
  topicsContainer: {
    marginBottom: 24,
  },
  topicCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  topicCardSelected: {
    backgroundColor: "#f9f9f9",
    borderColor: "#4B164C",
  },
  topicContent: {
    flex: 1,
  },
  topicName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  topicNameSelected: {
    color: "#4B164C",
  },
  topicDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  topicDescriptionSelected: {
    color: "#555",
  },
  questionCount: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  questionCountSelected: {
    color: "#000",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#4B164C",
    borderColor: "#4B164C",
  },
  checkmark: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  selectedCount: {
    alignItems: "center",
    marginBottom: 16,
  },
  selectedCountText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  buttonContainer: {
    marginTop: 16,
  },
});

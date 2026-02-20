import OnboardingButton from "@/components/onboarding/onboarding-button";
import ProgressIndicator from "@/components/onboarding/progress-indicator";
import ThemedInput from "@/components/onboarding/themed-input";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiService } from "@/services/api";
import {
  AllTake,
  NewTakesFormData,
  TagAndQuestion,
  TopicTake,
} from "@/types/onboarding";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const TAKES_FORM_STORAGE_KEY = "@fated_onboarding_takes_form";
const SELECTED_TOPICS_KEY = "@fated_selected_topics";

export default function TakesForm() {
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { handleError } = useApiErrorHandler();
  const [tagAndQuestions, setTagAndQuestions] = useState<TagAndQuestion[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [visitedTopics, setVisitedTopics] = useState<Set<number>>(new Set([0]));

  const MINIMUM_ANSWERS_REQUIRED = 3;
  const MINIMUM_CHARACTERS_PER_ANSWER = 1;

  // Load saved form data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(TAKES_FORM_STORAGE_KEY);
        if (savedData) {
          console.log("Loaded saved takes form data");
          const parsed = JSON.parse(savedData);
          // Convert array back to Map
          if (parsed.answers) {
            setAnswers(new Map(parsed.answers));
          }
          if (parsed.currentTopicIndex !== undefined) {
            setCurrentTopicIndex(parsed.currentTopicIndex);
          }
          if (parsed.visitedTopics) {
            setVisitedTopics(new Set(parsed.visitedTopics));
          }
        }
      } catch (error) {
        console.error("Error loading saved takes form data:", error);
      }
    };
    loadSavedData();
  }, []);

  // Save form data whenever answers, currentTopicIndex, or visitedTopics change
  useEffect(() => {
    const saveFormData = async () => {
      try {
        const dataToSave = {
          answers: Array.from(answers.entries()), // Convert Map to array for JSON
          currentTopicIndex,
          visitedTopics: Array.from(visitedTopics), // Convert Set to array for JSON
        };
        await AsyncStorage.setItem(
          TAKES_FORM_STORAGE_KEY,
          JSON.stringify(dataToSave),
        );
        console.log("Saved takes form data to storage");
      } catch (error) {
        console.error("Error saving takes form data:", error);
      }
    };
    saveFormData();
  }, [answers, currentTopicIndex, visitedTopics]);

  // Fetch tagAndQuestions from API and filter by selected topics
  useEffect(() => {
    const loadTagAndQuestions = async () => {
      try {
        console.log("Fetching takes questions from API...");

        // Fetch all topics with questions from the API
        const response = await apiService.getTakesQuestions();
        console.log("API response code:", response.code);

        if (
          response.code !== 200 ||
          !response.model ||
          !Array.isArray(response.model)
        ) {
          console.error("Failed to fetch takes questions");
          Alert.alert("Error", "Failed to load questions. Please try again.");
          router.replace("/onboarding/topic-selection");
          return;
        }

        // Filter out topics with null or empty questions
        const allTopics: TagAndQuestion[] = response.model.filter(
          (taq: TagAndQuestion) => taq.questions && taq.questions.length > 0,
        );
        console.log("All valid topics from API:", allTopics.length);

        // Get selected topic IDs from AsyncStorage
        const savedSelectedTopics =
          await AsyncStorage.getItem(SELECTED_TOPICS_KEY);
        console.log("Saved selected topics:", savedSelectedTopics);

        if (!savedSelectedTopics) {
          console.log(
            "No selected topics found, redirecting to topic selection...",
          );
          router.replace("/onboarding/topic-selection");
          return;
        }

        const selectedTopicIds: number[] = JSON.parse(savedSelectedTopics);
        console.log("Selected topic IDs:", selectedTopicIds);

        if (selectedTopicIds.length === 0) {
          console.log(
            "Empty selected topics, redirecting to topic selection...",
          );
          router.replace("/onboarding/topic-selection");
          return;
        }

        // Filter to only include selected topics
        const filteredTopics = allTopics.filter((taq) =>
          selectedTopicIds.includes(taq.tag.id),
        );
        console.log("Filtered topics count:", filteredTopics.length);

        if (filteredTopics.length === 0) {
          console.log(
            "No matching topics found, redirecting to topic selection...",
          );
          router.replace("/onboarding/topic-selection");
          return;
        }

        // Clean up answers for topics that are no longer selected
        const validKeys = new Set<string>();
        filteredTopics.forEach((taq) => {
          taq.questions?.forEach((question) => {
            validKeys.add(`${taq.tag.id}-${question.id}`);
          });
        });

        setAnswers((prev) => {
          const cleanedAnswers = new Map<string, string>();
          prev.forEach((value, key) => {
            if (validKeys.has(key)) {
              cleanedAnswers.set(key, value);
            }
          });
          return cleanedAnswers;
        });

        // Also reset visitedTopics if they exceed the new topic count
        setVisitedTopics((prev) => {
          const cleaned = new Set<number>();
          prev.forEach((index) => {
            if (index < filteredTopics.length) {
              cleaned.add(index);
            }
          });
          // Always include index 0
          cleaned.add(0);
          return cleaned;
        });

        // Reset currentTopicIndex if it's out of bounds
        setCurrentTopicIndex((prev) =>
          prev >= filteredTopics.length ? 0 : prev,
        );

        setTagAndQuestions(filteredTopics);
        setIsInitializing(false);
        console.log(
          "Successfully loaded",
          filteredTopics.length,
          "topics with questions",
        );
      } catch (error) {
        console.error("Error loading tagAndQuestion data:", error);
        handleError(error);
        Alert.alert("Error", "Failed to load topics. Please try again.");
        router.replace("/onboarding/topic-selection");
      }
    };

    loadTagAndQuestions();
  }, [handleError]);

  const getQuestionKey = (tagId: number, questionId: number): string => {
    return `${tagId}-${questionId}`;
  };

  const isAnswerValid = (answer: string): boolean => {
    return answer.trim().length >= MINIMUM_CHARACTERS_PER_ANSWER;
  };

  // Get valid answer count only for currently selected topics
  const getValidAnswerCount = (): number => {
    let validCount = 0;

    // Get all valid question keys for current topics
    const validKeys = new Set<string>();
    tagAndQuestions.forEach((taq) => {
      taq.questions?.forEach((question) => {
        validKeys.add(getQuestionKey(taq.tag.id, question.id));
      });
    });

    // Only count answers that belong to current topics
    answers.forEach((answer, key) => {
      if (validKeys.has(key) && isAnswerValid(answer)) {
        validCount++;
      }
    });

    return validCount;
  };

  const currentTopic = tagAndQuestions[currentTopicIndex];
  const isLastTopic = currentTopicIndex === tagAndQuestions.length - 1;
  const validAnswerCount = getValidAnswerCount();

  const updateAnswer = (tagId: number, questionId: number, answer: string) => {
    const key = getQuestionKey(tagId, questionId);
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      if (answer.trim()) {
        newAnswers.set(key, answer);
      } else {
        newAnswers.delete(key);
      }
      return newAnswers;
    });
  };

  const getAnswer = (tagId: number, questionId: number): string => {
    const key = getQuestionKey(tagId, questionId);
    return answers.get(key) || "";
  };

  const handleNext = () => {
    if (currentTopicIndex < tagAndQuestions.length - 1) {
      const nextIndex = currentTopicIndex + 1;
      setCurrentTopicIndex(nextIndex);
      setVisitedTopics((prev) => new Set([...prev, nextIndex]));
    }
  };

  const handlePrevious = () => {
    if (currentTopicIndex > 0) {
      setCurrentTopicIndex(currentTopicIndex - 1);
    }
  };

  const handleBackToTopicSelection = async () => {
    // Save currently selected topic IDs to AsyncStorage so they're pre-selected
    const currentSelectedTopicIds = tagAndQuestions.map((taq) => taq.tag.id);
    await AsyncStorage.setItem(
      "@fated_selected_topics",
      JSON.stringify(currentSelectedTopicIds),
    );

    // Navigate back to topic selection - it will fetch topics from API
    router.replace("/onboarding/topic-selection");
  };

  const handleSubmit = async () => {
    if (validAnswerCount < MINIMUM_ANSWERS_REQUIRED) {
      Alert.alert(
        "More Answers Needed",
        `Please provide at least ${MINIMUM_ANSWERS_REQUIRED} meaningful answers (minimum ${MINIMUM_CHARACTERS_PER_ANSWER} characters each). You have ${validAnswerCount} valid answers.`,
      );
      return;
    }

    setLoading(true);
    try {
      const allTakes: AllTake[] = [];

      tagAndQuestions.forEach((taq) => {
        const topicTakes: TopicTake[] = [];

        taq.questions.forEach((question) => {
          const answer = getAnswer(taq.tag.id, question.id);
          if (isAnswerValid(answer)) {
            topicTakes.push({
              questionId: question.id,
              take: answer,
            });
          }
        });

        if (topicTakes.length > 0) {
          allTakes.push({
            tagId: taq.tag.id,
            topicTakes,
          });
        }
      });

      const formData: NewTakesFormData = { allTakes };

      const response = await apiService.submitTakes(formData);

      if (response.code === 200) {
        // Clear saved form data after successful submission
        await AsyncStorage.removeItem(TAKES_FORM_STORAGE_KEY);
        console.log("Cleared takes form data from storage");

        const nextStep = response.model.step;
        switch (nextStep) {
          case 4:
            // Mark that we're moving to step 4 before navigating
            await AsyncStorage.setItem("@current_onboarding_page", "4");
            router.push("/onboarding/photos");
            break;
          case 5:
            // Onboarding complete, clear the page marker
            await AsyncStorage.removeItem("@current_onboarding_page");
            router.replace("/(tabs)/homepage");
            break;
          default:
            // Default to photos
            await AsyncStorage.setItem("@current_onboarding_page", "4");
            router.push("/onboarding/photos");
        }
      } else {
        Alert.alert("Error", response.msg || "Failed to save your takes");
      }
    } catch (error) {
      console.error("Error submitting takes:", error);
      handleError(error);
      Alert.alert("Error", "Failed to save your takes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const jumpToTopic = (index: number) => {
    // Allow jumping to any topic and mark it as visited
    setCurrentTopicIndex(index);
    setVisitedTopics((prev) => new Set([...prev, index]));
  };

  if (isInitializing || !currentTopic) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback
        onPress={Platform.OS === "web" ? undefined : Keyboard.dismiss}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ProgressIndicator
            currentStep={4}
            totalSteps={5}
            stepNames={[
              "Basic Details",
              "Lifestyle",
              "Topics",
              "Your Takes",
              "Photos",
            ]}
          />

          <TouchableOpacity
            style={styles.changeTopicsButton}
            onPress={handleBackToTopicSelection}
          >
            <Text style={styles.changeTopicsButtonText}>
              ← Change Selected Topics
            </Text>
          </TouchableOpacity>

          <Text style={styles.instructionText}>
            💡 Answer at least{" "}
            <Text style={styles.instructionBold}>3 questions</Text> across all
            topics
          </Text>

          <View
            style={[
              styles.answerProgress,
              validAnswerCount > 0 && styles.answerProgressActive,
            ]}
          >
            <Text style={styles.answerProgressText}>
              {validAnswerCount} of {MINIMUM_ANSWERS_REQUIRED} answers completed
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min((validAnswerCount / MINIMUM_ANSWERS_REQUIRED) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.topicChipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topicChips}
            >
              {tagAndQuestions.map((taq, index) => {
                const topicAnswerCount = taq.questions.filter((q) =>
                  isAnswerValid(getAnswer(taq.tag.id, q.id)),
                ).length;

                return (
                  <TouchableOpacity
                    key={taq.tag.id}
                    style={[
                      styles.topicChip,
                      currentTopicIndex === index && styles.topicChipActive,
                    ]}
                    onPress={() => jumpToTopic(index)}
                  >
                    <Text
                      style={[
                        styles.topicChipText,
                        currentTopicIndex === index &&
                          styles.topicChipTextActive,
                      ]}
                    >
                      {taq.tag.name}
                    </Text>
                    {topicAnswerCount > 0 && (
                      <View style={styles.topicChipBadge}>
                        <Text style={styles.topicChipBadgeText}>
                          {topicAnswerCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <Text style={styles.title}>{currentTopic.tag.name}</Text>

          {currentTopic.questions.map((question, questionIndex) => (
            <View key={question.id} style={styles.questionContainer}>
              <Text style={styles.questionNumber}>
                Question {questionIndex + 1}
              </Text>
              <Text style={styles.questionText}>{question.val}</Text>

              <ThemedInput
                label=""
                value={getAnswer(currentTopic.tag.id, question.id)}
                onChangeText={(value) =>
                  updateAnswer(currentTopic.tag.id, question.id, value)
                }
                placeholder="Share your thoughts..."
                multiline
                numberOfLines={8}
                showCharacterCount={true}
                showKeyboardDismiss={true}
                minimumCharacters={MINIMUM_CHARACTERS_PER_ANSWER}
              />
            </View>
          ))}

          <View style={styles.navigationContainer}>
            {validAnswerCount >= MINIMUM_ANSWERS_REQUIRED && (
              <View style={styles.successBannerBottom}>
                <Text style={styles.successBannerText}>
                  Great! You have answered {validAnswerCount} questions. You can
                  submit now or keep answering more!
                </Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              {currentTopicIndex > 0 && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handlePrevious}
                >
                  <Text style={styles.secondaryButtonText}>
                    ← Previous Topic
                  </Text>
                </TouchableOpacity>
              )}

              {!isLastTopic && (
                <>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleNext}
                  >
                    <Text style={styles.secondaryButtonText}>Next Topic →</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {validAnswerCount >= MINIMUM_ANSWERS_REQUIRED && (
                <OnboardingButton
                  title="Submit & Continue"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading}
                />
              )}
              {isLastTopic && validAnswerCount < MINIMUM_ANSWERS_REQUIRED && (
                <OnboardingButton
                  title={`Need ${MINIMUM_ANSWERS_REQUIRED - validAnswerCount} More Answers to Continue`}
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={true}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  instructionBold: {
    fontWeight: "700",
    color: "#4B164C",
  },
  changeTopicsButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  changeTopicsButtonText: {
    fontSize: 14,
    color: "#4B164C",
    fontWeight: "600",
  },
  successBanner: {
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  successBannerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E7D32",
    textAlign: "center",
    lineHeight: 22,
  },
  successBannerBottom: {
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  answerProgress: {
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  answerProgressActive: {
    backgroundColor: "#F3E5F5",
    borderColor: "#9C27B0",
  },
  answerProgressText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4B164C",
    borderRadius: 4,
  },
  topicChipsContainer: {
    marginBottom: 24,
  },
  topicChips: {
    paddingVertical: 8,
  },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  topicChipActive: {
    backgroundColor: "#4B164C",
    borderColor: "#4B164C",
  },
  topicChipDisabled: {
    opacity: 0.5,
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  topicChipTextActive: {
    color: "#FFF",
  },
  topicChipBadge: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  topicChipBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#4B164C",
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
  questionContainer: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B164C",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
    lineHeight: 24,
    fontFamily: "Playfair Display Bold",
  },
  navigationContainer: {
    marginTop: 32,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    marginHorizontal: 4,
    alignItems: "center",
  },
  secondaryButtonFull: {
    marginLeft: "auto",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
});

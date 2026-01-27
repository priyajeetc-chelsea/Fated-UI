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
import { router, useLocalSearchParams } from "expo-router";
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

export default function TakesForm() {
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { handleError } = useApiErrorHandler();
  const [tagAndQuestions, setTagAndQuestions] = useState<TagAndQuestion[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [visitedTopics, setVisitedTopics] = useState<Set<number>>(new Set([0]));

  const params = useLocalSearchParams();
  const MINIMUM_ANSWERS_REQUIRED = 3;
  const MINIMUM_CHARACTERS_PER_ANSWER = 50;

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

  // Fetch tagAndQuestions from route params OR from API
  useEffect(() => {
    const loadTagAndQuestions = async () => {
      try {
        // First, try to get from route params
        if (
          params.tagAndQuestionData &&
          typeof params.tagAndQuestionData === "string"
        ) {
          const parsedData: TagAndQuestion[] = JSON.parse(
            params.tagAndQuestionData,
          );
          setTagAndQuestions(parsedData);
          setIsInitializing(false);
          return;
        }

        // If no params, fetch from onboarding step API
        console.log("No route params, fetching from onboarding step API...");
        const response = await apiService.getOnboardingStep();

        // Check if we got tagAndQuestion data from onboarding step
        if (
          response.code === 200 &&
          response.model?.tagAndQuestion &&
          response.model.tagAndQuestion.length > 0
        ) {
          setTagAndQuestions(response.model.tagAndQuestion);
          setIsInitializing(false);
          return;
        }

        // If onboarding step has no questions (0 questions), fetch from takes API
        console.log(
          "No questions from onboarding step, fetching from takes API...",
        );
        const takesResponse = await apiService.getTakesQuestions();

        if (
          takesResponse.code === 200 &&
          takesResponse.model &&
          Array.isArray(takesResponse.model)
        ) {
          setTagAndQuestions(takesResponse.model);
          setIsInitializing(false);
        } else {
          Alert.alert("Error", "Failed to load topics. Please try again.");
          router.back();
        }
      } catch (error) {
        console.error("Error loading tagAndQuestion data:", error);
        handleError(error);
        Alert.alert("Error", "Failed to load topics. Please try again.");
        router.back();
      }
    };

    loadTagAndQuestions();
  }, [params.tagAndQuestionData, handleError]);

  const getQuestionKey = (tagId: number, questionId: number): string => {
    return `${tagId}-${questionId}`;
  };

  const isAnswerValid = (answer: string): boolean => {
    return answer.trim().length >= MINIMUM_CHARACTERS_PER_ANSWER;
  };

  const getValidAnswerCount = (): number => {
    let validCount = 0;
    answers.forEach((answer) => {
      if (isAnswerValid(answer)) {
        validCount++;
      }
    });
    return validCount;
  };

  const currentTopic = tagAndQuestions[currentTopicIndex];
  const isLastTopic = currentTopicIndex === tagAndQuestions.length - 1;
  const validAnswerCount = getValidAnswerCount();
  const canSubmit = validAnswerCount >= MINIMUM_ANSWERS_REQUIRED && isLastTopic;

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

  const handleSkip = () => {
    if (!isLastTopic) {
      handleNext();
    }
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
    if (visitedTopics.has(index)) {
      setCurrentTopicIndex(index);
    }
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

          <View style={styles.answerProgress}>
            <Text style={styles.answerProgressText}>
              You have {validAnswerCount} out of {MINIMUM_ANSWERS_REQUIRED}{" "}
              required meaningful answers (min {MINIMUM_CHARACTERS_PER_ANSWER}{" "}
              chars)
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
                      !visitedTopics.has(index) && styles.topicChipDisabled,
                    ]}
                    onPress={() => jumpToTopic(index)}
                    disabled={!visitedTopics.has(index)}
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
          <Text style={styles.subtitle}>
            Answer the questions you find interesting. You can skip any
            question.
          </Text>

          {currentTopic.questions.map((question, questionIndex) => (
            <View key={question.id} style={styles.questionContainer}>
              <Text style={styles.questionNumber}>
                Question {questionIndex + 1}
              </Text>
              <Text style={styles.questionText}>{question.val}</Text>

              <ThemedInput
                label="Your answer (optional)"
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
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    currentTopicIndex === 0 && styles.secondaryButtonFull,
                  ]}
                  onPress={handleSkip}
                >
                  <Text style={styles.secondaryButtonText}>Skip Topic →</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {!isLastTopic ? (
                <OnboardingButton title="Next Topic" onPress={handleNext} />
              ) : (
                <OnboardingButton
                  title={
                    validAnswerCount >= MINIMUM_ANSWERS_REQUIRED
                      ? "Submit & Continue"
                      : `Need ${MINIMUM_ANSWERS_REQUIRED - validAnswerCount} More Valid Answers`
                  }
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading || !canSubmit}
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
  answerProgress: {
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
  },
  answerProgressText: {
    fontSize: 14,
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

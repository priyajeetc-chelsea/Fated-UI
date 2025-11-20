import OnboardingButton from '@/components/onboarding/onboarding-button';
import ProgressIndicator from '@/components/onboarding/progress-indicator';
import ThemedInput from '@/components/onboarding/themed-input';
import { apiService } from '@/services/api';
import { AllTake, NewTakesFormData, TagAndQuestion, TopicTake } from '@/types/onboarding';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function TakesForm() {
  const [loading, setLoading] = useState(false);
  const [tagAndQuestions, setTagAndQuestions] = useState<TagAndQuestion[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [visitedTopics, setVisitedTopics] = useState<Set<number>>(new Set([0]));
  
  const params = useLocalSearchParams();
  const MINIMUM_ANSWERS_REQUIRED = 3;

  useEffect(() => {
    if (params.tagAndQuestionData && typeof params.tagAndQuestionData === 'string') {
      try {
        const parsedData: TagAndQuestion[] = JSON.parse(params.tagAndQuestionData);
        setTagAndQuestions(parsedData);
      } catch (error) {
        console.error('Error parsing tagAndQuestion data:', error);
        Alert.alert('Error', 'Failed to load topics. Please try again.');
        router.back();
      }
    }
  }, [params.tagAndQuestionData]);

  const currentTopic = tagAndQuestions[currentTopicIndex];
  const isLastTopic = currentTopicIndex === tagAndQuestions.length - 1;
  const totalAnsweredCount = answers.size;
  const canSubmit = totalAnsweredCount >= MINIMUM_ANSWERS_REQUIRED && isLastTopic;

  const getQuestionKey = (tagId: number, questionId: number): string => {
    return `${tagId}-${questionId}`;
  };

  const updateAnswer = (tagId: number, questionId: number, answer: string) => {
    const key = getQuestionKey(tagId, questionId);
    setAnswers(prev => {
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
    return answers.get(key) || '';
  };

  const handleNext = () => {
    if (currentTopicIndex < tagAndQuestions.length - 1) {
      const nextIndex = currentTopicIndex + 1;
      setCurrentTopicIndex(nextIndex);
      setVisitedTopics(prev => new Set([...prev, nextIndex]));
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
    if (totalAnsweredCount < MINIMUM_ANSWERS_REQUIRED) {
      Alert.alert(
        'More Answers Needed',
        `Please answer at least ${MINIMUM_ANSWERS_REQUIRED} questions. You&apos;ve answered ${totalAnsweredCount}.`
      );
      return;
    }

    setLoading(true);
    try {
      const allTakes: AllTake[] = [];
      
      tagAndQuestions.forEach(taq => {
        const topicTakes: TopicTake[] = [];
        
        taq.questions.forEach(question => {
          const answer = getAnswer(taq.tag.id, question.id);
          if (answer.trim()) {
            topicTakes.push({
              questionId: question.id,
              take: answer
            });
          }
        });

        if (topicTakes.length > 0) {
          allTakes.push({
            tagId: taq.tag.id,
            topicTakes
          });
        }
      });

      const formData: NewTakesFormData = { allTakes };
      
      const response = await apiService.submitTakes(formData);
      
      if (response.code === 200) {
        const nextStep = response.model.step;
        switch (nextStep) {
          case 4:
            router.push('/onboarding/photos');
            break;
          case 5:
            router.replace('/(tabs)/homepage');
            break;
          default:
            router.push('/onboarding/photos');
        }
      } else {
        Alert.alert('Error', response.msg || 'Failed to save your takes');
      }
    } catch (error) {
      console.error('Error submitting takes:', error);
      Alert.alert('Error', 'Failed to save your takes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const jumpToTopic = (index: number) => {
    if (visitedTopics.has(index)) {
      setCurrentTopicIndex(index);
    }
  };

  if (!currentTopic) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ProgressIndicator 
            currentStep={3} 
            totalSteps={4} 
            stepNames={['Basic Details', 'Lifestyle', 'Your Takes', 'Photos']}
          />

          <View style={styles.answerProgress}>
            <Text style={styles.answerProgressText}>
              You&apos;ve answered {totalAnsweredCount} out of {MINIMUM_ANSWERS_REQUIRED} required questions
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min((totalAnsweredCount / MINIMUM_ANSWERS_REQUIRED) * 100, 100)}%` }
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
                const topicAnswerCount = taq.questions.filter(q => 
                  getAnswer(taq.tag.id, q.id).trim() !== ''
                ).length;
                
                return (
                  <TouchableOpacity
                    key={taq.tag.id}
                    style={[
                      styles.topicChip,
                      currentTopicIndex === index && styles.topicChipActive,
                      !visitedTopics.has(index) && styles.topicChipDisabled
                    ]}
                    onPress={() => jumpToTopic(index)}
                    disabled={!visitedTopics.has(index)}
                  >
                    <Text style={[
                      styles.topicChipText,
                      currentTopicIndex === index && styles.topicChipTextActive
                    ]}>
                      {taq.tag.name}
                    </Text>
                    {topicAnswerCount > 0 && (
                      <View style={styles.topicChipBadge}>
                        <Text style={styles.topicChipBadgeText}>{topicAnswerCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <Text style={styles.title}>{currentTopic.tag.name}</Text>
          <Text style={styles.subtitle}>
            Answer the questions you find interesting. You can skip any question.
          </Text>

          {currentTopic.questions.map((question, questionIndex) => (
            <View key={question.id} style={styles.questionContainer}>
              <Text style={styles.questionNumber}>Question {questionIndex + 1}</Text>
              <Text style={styles.questionText}>{question.val}</Text>
              
              <ThemedInput
                label="Your answer (optional)"
                value={getAnswer(currentTopic.tag.id, question.id)}
                onChangeText={(value) => updateAnswer(currentTopic.tag.id, question.id, value)}
                placeholder="Share your thoughts..."
                multiline
                numberOfLines={6}
                showCharacterCount={true}
                maxLength={500}
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
                  <Text style={styles.secondaryButtonText}>← Previous Topic</Text>
                </TouchableOpacity>
              )}
              
              {!isLastTopic && (
                <TouchableOpacity 
                  style={[styles.secondaryButton, currentTopicIndex === 0 && styles.secondaryButtonFull]}
                  onPress={handleSkip}
                >
                  <Text style={styles.secondaryButtonText}>Skip Topic →</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {!isLastTopic ? (
                <OnboardingButton
                  title="Next Topic"
                  onPress={handleNext}
                />
              ) : (
                <OnboardingButton
                  title={totalAnsweredCount >= MINIMUM_ANSWERS_REQUIRED ? "Submit & Continue" : `Answer ${MINIMUM_ANSWERS_REQUIRED - totalAnsweredCount} More`}
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
    backgroundColor: '#FFFFFF',
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
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  answerProgress: {
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  answerProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#004242',
    borderRadius: 4,
  },
  topicChipsContainer: {
    marginBottom: 24,
  },
  topicChips: {
    paddingVertical: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  topicChipActive: {
    backgroundColor: '#004242',
    borderColor: '#004242',
  },
  topicChipDisabled: {
    opacity: 0.5,
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  topicChipTextActive: {
    color: '#FFF',
  },
  topicChipBadge: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  topicChipBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#004242',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  questionContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004242',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
    lineHeight: 24,
  },
  navigationContainer: {
    marginTop: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  secondaryButtonFull: {
    marginLeft: 'auto',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  buttonContainer: {
    marginTop: 8,
  },
});

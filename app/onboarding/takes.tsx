import OnboardingButton from '@/components/onboarding/onboarding-button';
import ProgressIndicator from '@/components/onboarding/progress-indicator';
import ThemedInput from '@/components/onboarding/themed-input';
import { apiService } from '@/services/api';
import { AllTake, NewTakesFormData, TagAndQuestion } from '@/types/onboarding';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

export default function TakesForm() {
  const [loading, setLoading] = useState(false);
  const [tagAndQuestions, setTagAndQuestions] = useState<TagAndQuestion[]>([]);
  const [formData, setFormData] = useState<NewTakesFormData>({
    allTakes: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const params = useLocalSearchParams();

  useEffect(() => {
    // Get the tagAndQuestion data from route params
    if (params.tagAndQuestionData && typeof params.tagAndQuestionData === 'string') {
      try {
        const parsedData: TagAndQuestion[] = JSON.parse(params.tagAndQuestionData);
        setTagAndQuestions(parsedData);
        
        // Initialize form data with empty takes for each tag
        const initialTakes: AllTake[] = parsedData.map(item => ({
          tagId: item.tag.id,
          topicTakes: item.questions.map(question => ({
            questionId: question.id,
            take: ''
          }))
        }));
        
        setFormData({ allTakes: initialTakes });
      } catch (error) {
        console.error('Error parsing tagAndQuestion data:', error);
        Alert.alert('Error', 'Failed to load topics. Please try again.');
        router.back();
      }
    }
  }, [params.tagAndQuestionData]);

  // Helper function to find question text by questionId within a specific tag
  const getQuestionText = (tagId: number, questionId: number): string => {
    const taq = tagAndQuestions.find(t => t.tag.id === tagId);
    if (!taq) return '';
    const question = taq.questions.find(q => q.id === questionId);
    return question ? question.val : '';
  };

  // Helper function to get tag name by tagId
  const getTagName = (tagId: number): string => {
    const taq = tagAndQuestions.find(t => t.tag.id === tagId);
    return taq ? taq.tag.name : '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    formData.allTakes.forEach((allTake, tagIndex) => {
      allTake.topicTakes.forEach((topicTake, questionIndex) => {
        if (!topicTake.take.trim()) {
          newErrors[`${tagIndex}-${questionIndex}`] = 'Please provide your take on this question';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.submitTakes(formData);
      
      if (response.code === 200) {
        // Navigate to next step based on response
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

  const updateTake = (tagIndex: number, questionIndex: number, take: string) => {
    setFormData(prev => ({
      allTakes: prev.allTakes.map((allTake, tIndex) => {
        if (tIndex === tagIndex) {
          return {
            ...allTake,
            topicTakes: allTake.topicTakes.map((topicTake, qIndex) => {
              if (qIndex === questionIndex) {
                return { ...topicTake, take };
              }
              return topicTake;
            })
          };
        }
        return allTake;
      })
    }));
  };

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

        <Text style={styles.title}>Share Your Takes</Text>
        <Text style={styles.subtitle}>
          Express yourelf through your opinions. This helps others understand your perspective and values !
        </Text>

        {formData.allTakes.map((allTake, tagIndex) => (
          <View key={tagIndex} style={styles.takeContainer}>
            <Text style={styles.takeNumber}>{getTagName(allTake.tagId)}</Text>
            
            {allTake.topicTakes.map((topicTake, questionIndex) => (
              <View key={questionIndex} style={{ marginBottom: 10 }}>
                <Text style={styles.questionText}>Q. {getQuestionText(allTake.tagId, topicTake.questionId)}</Text>
                
                <ThemedInput
                  label="your take"
                  value={topicTake.take}
                  onChangeText={(value) => updateTake(tagIndex, questionIndex, value)}
                  placeholder="Share your honest thoughts and perspective..."
                  multiline
                  numberOfLines={6}
                  error={errors[`${tagIndex}-${questionIndex}`]}
                  required
                  showCharacterCount={true}
                  maxLength={500}
                />
              </View>
            ))}
          </View>
        ))}

        <View style={styles.buttonContainer}>
          <OnboardingButton
            title="Continue"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#000',
    fontWeight: '500',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  takeContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  takeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  takeNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9966CC',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    textAlign: 'left',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 32,
  },
});
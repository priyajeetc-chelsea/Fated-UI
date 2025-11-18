import OnboardingButton from '@/components/onboarding/onboarding-button';
import ProgressIndicator from '@/components/onboarding/progress-indicator';
import { TagAndQuestion } from '@/types/onboarding';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TopicSelectionScreen() {
  const [tagAndQuestions, setTagAndQuestions] = useState<TagAndQuestion[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const params = useLocalSearchParams();

  useEffect(() => {
    // Get the tagAndQuestion data from route params
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

  const toggleTopic = (tagId: number) => {
    setSelectedTopics(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedTopics.length === 0) {
      Alert.alert('Select Topics', 'Please select at least one topic to continue.');
      return;
    }

    // Filter tagAndQuestions to only include selected topics
    const selectedData = tagAndQuestions.filter(taq => selectedTopics.includes(taq.tag.id));

    // Navigate to questions flow with selected topics
    router.push({
      pathname: '/onboarding/takes',
      params: {
        tagAndQuestionData: JSON.stringify(selectedData)
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ProgressIndicator 
          currentStep={3} 
          totalSteps={4} 
          stepNames={['Basic Details', 'Lifestyle', 'Your Takes', 'Photos']}
        />

        <Text style={styles.title}>Choose Topics</Text>
        <Text style={styles.subtitle}>
          Select the topics you&apos;d like to share your opinions on. You can choose one or more topics.
        </Text>

        <View style={styles.topicsContainer}>
          {tagAndQuestions.map((taq) => (
            <TouchableOpacity
              key={taq.tag.id}
              style={[
                styles.topicCard,
                selectedTopics.includes(taq.tag.id) && styles.topicCardSelected
              ]}
              onPress={() => toggleTopic(taq.tag.id)}
            >
              <View style={styles.topicContent}>
                <Text style={[
                  styles.topicName,
                  selectedTopics.includes(taq.tag.id) && styles.topicNameSelected
                ]}>
                  {taq.tag.name}
                </Text>
                <Text style={[
                  styles.questionCount,
                  selectedTopics.includes(taq.tag.id) && styles.questionCountSelected
                ]}>
                  {taq.questions.length} question{taq.questions.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedTopics.includes(taq.tag.id) && styles.checkboxSelected
              ]}>
                {selectedTopics.includes(taq.tag.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
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
  topicsContainer: {
    marginBottom: 24,
  },
  topicCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  topicCardSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#9966CC',
  },
  topicContent: {
    flex: 1,
  },
  topicName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  topicNameSelected: {
    color: '#9966CC',
  },
  questionCount: {
    fontSize: 14,
    color: '#666',
  },
  questionCountSelected: {
    color: '#7744AA',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#9966CC',
    borderColor: '#9966CC',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedCount: {
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 16,
  },
});

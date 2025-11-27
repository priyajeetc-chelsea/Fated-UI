import OnboardingButton from '@/components/onboarding/onboarding-button';
import PrivacyToggle from '@/components/onboarding/privacy-toggle';
import ProgressIndicator from '@/components/onboarding/progress-indicator';
import ThemedInput from '@/components/onboarding/themed-input';
import ThemedPicker from '@/components/onboarding/themed-picker';
import { apiService } from '@/services/api';
import {
  DRINK_SMOKE_OPTIONS,
  EDUCATION_LEVELS,
  HEIGHT_OPTIONS,
  LifestyleFormData,
  RELIGIOUS_BELIEFS
} from '@/types/onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const LIFESTYLE_FORM_STORAGE_KEY = '@fated_onboarding_lifestyle_form';

export default function LifestyleForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LifestyleFormData>({
    homeTown: '',
    currentCity: '',
    jobDetails: '',
    college: '',
    highestEducationLevel: {
      value: '',
      visibleOnProfile: true,
    },
    religiousBeliefs: {
      value: '',
      visibleOnProfile: true,
    },
    drinkOrSmoke: {
      value: '',
      visibleOnProfile: true,
    },
    height: {
      value: '',
      visibleOnProfile: true,
    },
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LifestyleFormData, string>>>({});

  // Load saved form data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(LIFESTYLE_FORM_STORAGE_KEY);
        if (savedData) {
          console.log('Loaded saved lifestyle form data');
          setFormData(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Error loading saved lifestyle form data:', error);
      }
    };
    loadSavedData();
  }, []);

  // Save form data whenever it changes
  useEffect(() => {
    const saveFormData = async () => {
      try {
        await AsyncStorage.setItem(LIFESTYLE_FORM_STORAGE_KEY, JSON.stringify(formData));
        console.log('Saved lifestyle form data to storage');
      } catch (error) {
        console.error('Error saving lifestyle form data:', error);
      }
    };
    saveFormData();
  }, [formData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LifestyleFormData, string>> = {};

    if (!formData.homeTown.trim()) {
      newErrors.homeTown = 'Home town is required';
    }

    if (!formData.currentCity.trim()) {
      newErrors.currentCity = 'Current city is required';
    }

    if (!formData.jobDetails.trim()) {
      newErrors.jobDetails = 'Job details are required';
    }

    if (!formData.college.trim()) {
      newErrors.college = 'College/University is required';
    }

    if (!formData.highestEducationLevel.value) {
      newErrors.highestEducationLevel = 'Education level is required';
    }

    if (!formData.religiousBeliefs.value) {
      newErrors.religiousBeliefs = 'Religious beliefs are required';
    }

    if (!formData.drinkOrSmoke.value) {
      newErrors.drinkOrSmoke = 'Please select your drinking/smoking habits';
    }

    if (!formData.height.value) {
      newErrors.height = 'Height is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.submitLifestyleDetails(formData);
      
      if (response.code === 200) {
        // Clear saved form data after successful submission
        await AsyncStorage.removeItem(LIFESTYLE_FORM_STORAGE_KEY);
        console.log('Cleared lifestyle form data from storage');
        
        // Navigate to next step based on response
        const nextStep = response.model.step;
        switch (nextStep) {
          case 3:
            // Pass tagAndQuestion data to topic selection page
            router.push({
              pathname: '/onboarding/topic-selection',
              params: {
                tagAndQuestionData: JSON.stringify(response.model.tagAndQuestion || [])
              }
            });
            break;
          case 4:
            router.push('/onboarding/photos');
            break;
          case 5:
            router.replace('/(tabs)/homepage');
            break;
          default:
            router.push('/onboarding/topic-selection');
        }
      } else {
        Alert.alert('Error', response.msg || 'Failed to save lifestyle details');
      }
    } catch (error) {
      console.error('Error submitting lifestyle details:', error);
      Alert.alert('Error', 'Failed to save your details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof LifestyleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const updatePrivacyToggle = (field: 'highestEducationLevel' | 'religiousBeliefs' | 'drinkOrSmoke' | 'height', visible: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        visibleOnProfile: visible,
      },
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
          currentStep={2} 
          totalSteps={4} 
          stepNames={['Basic Details', 'Lifestyle', 'Your Takes', 'Photos']}
        />

        <Text style={styles.title}>Your Lifestyle</Text>
        <Text style={styles.subtitle}>
          Tell us about your background and lifestyle preferences.
        </Text>

        <ThemedInput
          label="Home Town"
          value={formData.homeTown}
          onChangeText={(value) => updateFormData('homeTown', value)}
          placeholder="Where did you grow up?"
          error={errors.homeTown}
          required
        />

        <ThemedInput
          label="Current City"
          value={formData.currentCity}
          onChangeText={(value) => updateFormData('currentCity', value)}
          placeholder="Where do you live now?"
          error={errors.currentCity}
          required
        />

        <ThemedInput
          label="Job Details"
          value={formData.jobDetails}
          onChangeText={(value) => updateFormData('jobDetails', value)}
          placeholder="e.g., Product Designer at Google"
          error={errors.jobDetails}
          required
        />

        <ThemedInput
          label="College/University"
          value={formData.college}
          onChangeText={(value) => updateFormData('college', value)}
          placeholder="Where did you study?"
          error={errors.college}
          required
        />

        <View style={styles.fieldContainer}>
          <ThemedPicker
            label="Highest Education Level"
            value={formData.highestEducationLevel.value}
            onValueChange={(value) => updateFormData('highestEducationLevel', { ...formData.highestEducationLevel, value })}
            options={EDUCATION_LEVELS}
            placeholder="Select your education level"
            error={errors.highestEducationLevel}
            required
          />
          <PrivacyToggle
            label="Show on profile"
            value={formData.highestEducationLevel.visibleOnProfile}
            onToggle={(visible) => updatePrivacyToggle('highestEducationLevel', visible)}
          />
        </View>

        <View style={styles.fieldContainer}>
          <ThemedPicker
            label="Religious Beliefs"
            value={formData.religiousBeliefs.value}
            onValueChange={(value) => updateFormData('religiousBeliefs', { ...formData.religiousBeliefs, value })}
            options={RELIGIOUS_BELIEFS}
            placeholder="Select your religious beliefs"
            error={errors.religiousBeliefs}
            required
          />
          <PrivacyToggle
            label="Show on profile"
            value={formData.religiousBeliefs.visibleOnProfile}
            onToggle={(visible) => updatePrivacyToggle('religiousBeliefs', visible)}
          />
        </View>

        <View style={styles.fieldContainer}>
          <ThemedPicker
            label="Drinking & Smoking"
            value={formData.drinkOrSmoke.value}
            onValueChange={(value) => updateFormData('drinkOrSmoke', { ...formData.drinkOrSmoke, value })}
            options={DRINK_SMOKE_OPTIONS}
            placeholder="Select your habits"
            error={errors.drinkOrSmoke}
            required
          />
          <PrivacyToggle
            label="Show on profile"
            value={formData.drinkOrSmoke.visibleOnProfile}
            onToggle={(visible) => updatePrivacyToggle('drinkOrSmoke', visible)}
          />
        </View>

        <View style={styles.fieldContainer}>
          <ThemedPicker
            label="Height"
            value={formData.height.value}
            onValueChange={(value) => updateFormData('height', { ...formData.height, value })}
            options={HEIGHT_OPTIONS}
            placeholder="Select your height"
            error={errors.height}
            required
          />
          <PrivacyToggle
            label="Show on profile"
            value={formData.height.visibleOnProfile}
            onToggle={(visible) => updatePrivacyToggle('height', visible)}
          />
        </View>

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
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 16
  },
});
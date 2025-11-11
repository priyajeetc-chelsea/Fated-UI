import DatePicker from '@/components/onboarding/date-picker';
import OnboardingButton from '@/components/onboarding/onboarding-button';
import PrivacyToggle from '@/components/onboarding/privacy-toggle';
import ProgressIndicator from '@/components/onboarding/progress-indicator';
import SimpleThemedPicker from '@/components/onboarding/simple-themed-picker';
import ThemedInput from '@/components/onboarding/themed-input';
import ThemedPicker from '@/components/onboarding/themed-picker';
import { apiService } from '@/services/api';
import {
  BasicDetailsFormData,
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  PRONOUNS_OPTIONS,
  SEXUALITY_OPTIONS
} from '@/types/onboarding';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

export default function BasicDetailsForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BasicDetailsFormData>({
    fname: '',
    lname: '',
    email: '',
    dob: '',
    gender: {
      value: '',
      visibleOnProfile: true,
    },
    sexuality: {
      value: '',
      visibleOnProfile: true,
    },
    pronouns: {
      value: '',
      visibleOnProfile: true,
    },
    interestedIn: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BasicDetailsFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BasicDetailsFormData, string>> = {};

    if (!formData.fname.trim()) {
      newErrors.fname = 'First name is required';
    }

    // Last name is optional - no validation needed

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.dob.trim()) {
      newErrors.dob = 'Date of birth is required';
    } else {
      // Basic date validation (YYYY-MM-DD format)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dob)) {
        newErrors.dob = 'Please enter date in YYYY-MM-DD format';
      } else {
        const date = new Date(formData.dob);
        const now = new Date();
        if (date > now) {
          newErrors.dob = 'Date of birth cannot be in the future';
        }
        // Check if user is at least 18
        const age = now.getFullYear() - date.getFullYear();
        if (age < 18) {
          newErrors.dob = 'You must be at least 18 years old';
        }
      }
    }

    if (!formData.gender.value) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.sexuality.value) {
      newErrors.sexuality = 'Sexuality is required';
    }

    if (!formData.pronouns.value.trim()) {
      newErrors.pronouns = 'Pronouns are required';
    }

    if (formData.interestedIn.length === 0) {
      newErrors.interestedIn = 'Please select who you&rsquo;re interested in';
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
      const response = await apiService.submitBasicDetails(formData);
      
      if (response.code === 200) {
        // Navigate to next step based on response
        const nextStep = response.model.step;
        switch (nextStep) {
          case 2:
            router.push('/onboarding/lifestyle');
            break;
          case 3:
            router.push('/onboarding/takes');
            break;
          case 4:
            router.push('/onboarding/photos');
            break;
          case 5:
            router.replace('/(tabs)/homepage');
            break;
          default:
            router.push('/onboarding/lifestyle');
        }
      } else {
        Alert.alert('Error', response.msg || 'Failed to save basic details');
      }
    } catch (error) {
      console.error('Error submitting basic details:', error);
      Alert.alert('Error', 'Failed to save your details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof BasicDetailsFormData, value: any) => {
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

  const updatePrivacyToggle = (field: 'gender' | 'sexuality' | 'pronouns', visible: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        visibleOnProfile: visible,
      },
    }));
  };

  const handlePronounsChange = (values: string[]) => {
    // Limit to maximum 4 selections
    const limitedValues = values.slice(0, 4);
    // Join the values with "/" separator
    const joinedValue = limitedValues.join('/');
    
    setFormData(prev => ({
      ...prev,
      pronouns: {
        ...prev.pronouns,
        value: joinedValue,
      },
    }));
  };

  const getPronounsDisplayValue = (): string => {
    return formData.pronouns.value;
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
          currentStep={1} 
          totalSteps={4} 
          stepNames={['Basic Details', 'Lifestyle', 'Your Takes', 'Photos']}
        />

        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          Let&rsquo;s start with some basic information to create your profile.
        </Text>

        <ThemedInput
          label="First Name"
          value={formData.fname}
          onChangeText={(value) => updateFormData('fname', value)}
          placeholder="Enter your first name"
          error={errors.fname}
          required
        />

        <ThemedInput
          label="Last Name"
          value={formData.lname}
          onChangeText={(value) => updateFormData('lname', value)}
          placeholder="Enter your last name"
          error={errors.lname}
        />

        <ThemedInput
          label="Email"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          required
        />

        <DatePicker
          label="Date of Birth"
          value={formData.dob}
          onDateChange={(value) => updateFormData('dob', value)}
          error={errors.dob}
          required
        />

        <View style={styles.fieldContainer}>
          <SimpleThemedPicker
            label="Gender"
            value={formData.gender.value}
            onValueChange={(value) => updateFormData('gender', { ...formData.gender, value })}
            options={GENDER_OPTIONS}
            placeholder="Select your gender"
            error={errors.gender}
            required
          />
          <PrivacyToggle
            label="Show on profile"
            value={formData.gender.visibleOnProfile}
            onToggle={(visible) => updatePrivacyToggle('gender', visible)}
          />
        </View>

        <View style={styles.fieldContainer}>
          <ThemedPicker
            label="Sexuality"
            value={formData.sexuality.value}
            onValueChange={(value) => updateFormData('sexuality', { ...formData.sexuality, value })}
            options={SEXUALITY_OPTIONS}
            placeholder="Select your sexuality"
            error={errors.sexuality}
            required
          />
          <PrivacyToggle
            label="Show on profile"
            value={formData.sexuality.visibleOnProfile}
            onToggle={(visible) => updatePrivacyToggle('sexuality', visible)}
          />
        </View>

        <View style={styles.fieldContainer}>
          <ThemedPicker
            label="Pronouns (Select up to 4)"
            value={getPronounsDisplayValue()}
            onValueChange={() => {}} // Not used for multiple selection
            options={PRONOUNS_OPTIONS}
            placeholder="Select your pronouns"
            error={errors.pronouns}
            required
            multiple
            selectedValues={formData.pronouns.value ? formData.pronouns.value.split('/') : []}
            onMultiValueChange={handlePronounsChange}
            maxSelections={4}
          />
          <PrivacyToggle
            label="Show on profile"
            value={formData.pronouns.visibleOnProfile}
            onToggle={(visible) => updatePrivacyToggle('pronouns', visible)}
          />
        </View>

        <ThemedPicker
          label="Interested In"
          value=""
          onValueChange={() => {}}
          options={INTERESTED_IN_OPTIONS}
          placeholder="Select who you&rsquo;re interested in"
          error={errors.interestedIn}
          required
          multiple
          selectedValues={formData.interestedIn}
          onMultiValueChange={(values) => updateFormData('interestedIn', values)}
        />

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
  },
});
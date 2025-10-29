import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontSizes, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedButton } from './themed-button';
import { ThemedInput } from './themed-input';

interface PhoneInputScreenProps {
  onSuccess?: () => void;
}

export function PhoneInputScreen({ onSuccess }: PhoneInputScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const { sendOtp, isLoading, error, clearError } = useAuth();

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation for phone number (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    
    // No formatting, just return the limited digits
    return limited;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    
    // Clear errors when user starts typing
    if (phoneError) setPhoneError('');
    if (error) clearError();
  };

  const handleSendOtp = async () => {
    try {
      // Validate phone number
      const cleanPhone = phoneNumber.replace(/\s+/g, '');
      
      if (!cleanPhone) {
        setPhoneError('Phone number is required');
        return;
      }
      
      if (!validatePhoneNumber(cleanPhone)) {
        setPhoneError('Please enter a valid 10-digit phone number');
        return;
      }

      // Add country code for API call
      const fullPhoneNumber = `${cleanPhone}`;
      
      await sendOtp(fullPhoneNumber);
      onSuccess?.();
    } catch (err) {
      // Error is handled by the context
      console.error('Failed to send OTP:', err);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <Ionicons 
                name="heart" 
                size={40} 
                color="#9966CC" 
                style={styles.logo}
              />
              <ThemedText style={styles.brandText}>fated</ThemedText>
            </View>
            <ThemedText style={styles.subtitle}>
              Enter your phone number to get started
            </ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedInput
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              error={phoneError || error}
              keyboardType="phone-pad"
              maxLength={12} // Including spaces: XXX XXX XXXX
              autoFocus
              size="large"
            />

            <ThemedButton
              title="Send OTP"
              onPress={handleSendOtp}
              isLoading={isLoading}
              disabled={!phoneNumber.trim() || isLoading}
              fullWidth
              size="large"
              variant="primary"
              buttonStyle={styles.sendButton}
            />

            <ThemedText style={styles.disclaimer}>
              By continuing, you agree to receive SMS messages from Fated. 
              Message and data rates may apply.
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    marginRight: 5,
  },
  brandText: {
    fontSize: 42,
    fontFamily: 'tiempos headline',
    lineHeight: 44,
    color: '#9966CC',
    includeFontPadding: false,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: FontSizes.lg,
    opacity: 0.9,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  sendButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: FontSizes.xs,
    opacity: 0.8,
    lineHeight: 18,
  },
});
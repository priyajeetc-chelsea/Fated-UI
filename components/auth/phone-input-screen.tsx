import { useAuth } from '@/contexts/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GoogleSignInButton } from './google-signin-button';

interface PhoneInputScreenProps {
  onSuccess?: () => void;
}

export function PhoneInputScreen({ onSuccess }: PhoneInputScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  
  const { sendOtp, signInWithGoogle, isLoading, error, clearError } = useAuth();

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

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err) {
      console.error('Failed to sign in with Google:', err);
    }
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

  // Show choice screen if user hasn't selected a method yet
  if (!showPhoneInput) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.choiceHeaderSection}>
            <Text style={styles.choiceLabel}>Welcome to Fated</Text>
            <Text style={styles.choiceSubtitle}>Choose how you&apos;d like to continue</Text>
          </View>

          {/* Google Sign In Button */}
          <GoogleSignInButton 
            onPress={handleGoogleSignIn}
            isLoading={isLoading}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Phone Number Button */}
          <TouchableOpacity
            style={styles.phoneButton}
            onPress={() => setShowPhoneInput(true)}
            disabled={isLoading}
          >
            <Ionicons name="phone-portrait" size={20} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.phoneButtonText}>Continue with Phone Number</Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Description */}
          <Text style={styles.description}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    );
  }

  // Show phone input screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.content}>
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setShowPhoneInput(false);
            setPhoneNumber('');
            setPhoneError('');
            clearError();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>

        {/* Phone Icon and Label */}
        <View style={styles.headerSection}>
          <Ionicons name="phone-portrait" size={36} color="#000000" style={styles.phoneIcon} />
          <Text style={styles.label}>What&apos;s your phone number?</Text>
        </View>

        {/* Phone Input */}
        <TextInput
          style={[
            styles.phoneInput,
            (phoneError || error) && styles.phoneInputError
          ]}
          placeholder="Enter your phone number"
          placeholderTextColor="#999999"
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          maxLength={10}
          autoFocus
        />

        {/* Error Message */}
        {(phoneError || error) && (
          <Text style={styles.errorText}>{phoneError || error}</Text>
        )}

        {/* Send OTP Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!phoneNumber.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={handleSendOtp}
          disabled={!phoneNumber.trim() || isLoading}
        >
          <Text style={[
            styles.sendButtonText,
            (!phoneNumber.trim() || isLoading) && styles.sendButtonTextDisabled
          ]}>
            {isLoading ? 'Sending...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>

        {/* Description */}
        <Text style={styles.description}>
          By continuing, you agree to receive SMS messages from Fated. 
          Message and data rates may apply.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  choiceHeaderSection: {
    marginBottom: 48,
    alignItems: 'center',
  },
  choiceLabel: {
    fontSize: 32,
    fontFamily: 'Playfair Display Bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  choiceSubtitle: {
    fontSize: 16,
    fontFamily: 'Playfair Display',
    color: '#666666',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCCCCC',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Playfair Display',
    color: '#666666',
    marginHorizontal: 16,
  },
  phoneButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneButtonText: {
    fontSize: 16,
    fontFamily: 'Playfair Display Bold',
    color: '#FFFFFF',
  },
  icon: {
    marginRight: 12,
  },
  backButton: {
    marginBottom: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  phoneIcon: {
    marginRight: 12,
  },
  label: {
    fontSize: 30,
    fontFamily: 'Playfair Display Bold',
    color: '#000000',
  },
  phoneInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: 'Playfair Display',
    color: '#000000',
    marginBottom: 8,
  },
  phoneInputError: {
    borderBottomColor: '#FF0000',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Playfair Display',
    color: '#FF0000',
    marginTop: 20,
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: 'Playfair Display Bold',
    color: '#FFFFFF',
  },
  sendButtonTextDisabled: {
    color: '#999999',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Playfair Display',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
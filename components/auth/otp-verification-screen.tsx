import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { ThemedButton } from './themed-button';

interface OtpVerificationScreenProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function OtpVerificationScreen({ onSuccess, onBack }: OtpVerificationScreenProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const { 
    phoneNumber, 
    verifyOtp, 
    resendOtp, 
    isLoading, 
    error, 
    clearError 
  } = useAuth();

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Colors for OTP inputs
  const inputBackgroundColor = useThemeColor({}, 'inputBackground');
  const inputBorderColor = useThemeColor({}, 'inputBorder');
  const inputBorderFocusColor = useThemeColor({}, 'inputBorderFocus');
  const textColor = useThemeColor({}, 'text');
  const errorColor = useThemeColor({}, 'error');

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) clearError();
  }, [otp, error, clearError]);

  const handleOtpChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');
    
    if (digit.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto-focus next input
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-verify when all digits are entered
      if (digit && index === 5 && newOtp.every(d => d !== '')) {
        handleVerifyOtp(newOtp.join(''));
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    try {
      const codeToVerify = otpCode || otp.join('');
      
      if (codeToVerify.length !== 6) {
        return;
      }

      await verifyOtp(codeToVerify);
      onSuccess?.();
    } catch (err) {
      // Error is handled by the context
      console.error('Failed to verify OTP:', err);
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendOtp();
      setCountdown(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      // Focus first input
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Failed to resend OTP:', err);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length > 6) {
      return phone.substring(0, 3) + '***' + phone.substring(phone.length - 4);
    }
    return phone;
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
                size={32} 
                color="#9966CC" 
                style={styles.logo}
              />
              <ThemedText style={styles.brandText}>fated</ThemedText>
            </View>
            <ThemedText style={styles.subtitle}>
              Enter the 6-digit code sent to
            </ThemedText>
            <ThemedText style={styles.phoneNumber}>
              {maskPhoneNumber(phoneNumber)}
            </ThemedText>
          </View>

          <View style={styles.otpContainer}>
            <View style={styles.otpInputsRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: inputBackgroundColor,
                      borderColor: digit ? inputBorderFocusColor : inputBorderColor,
                      color: textColor,
                    },
                    error && styles.otpInputError,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {error && (
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {error}
              </ThemedText>
            )}
          </View>

          <View style={styles.actions}>
            <ThemedButton
              title="Verify & Continue"
              onPress={() => handleVerifyOtp()}
              isLoading={isLoading}
              disabled={otp.some(digit => !digit) || isLoading}
              fullWidth
              size="large"
              variant="primary"
              buttonStyle={styles.verifyButton}
            />

            <View style={styles.resendContainer}>
              {canResend ? (
                <Pressable onPress={handleResendOtp} disabled={isLoading}>
                  <ThemedText style={styles.resendText}>
                    Didn&apos;t receive code? <ThemedText type="link">Resend OTP</ThemedText>
                  </ThemedText>
                </Pressable>
              ) : (
                <ThemedText style={styles.countdownText}>
                  Resend OTP in {countdown}s
                </ThemedText>
              )}
            </View>

            {onBack && (
              <ThemedButton
                title="Change Phone Number"
                onPress={onBack}
                variant="ghost"
                size="medium"
                buttonStyle={styles.backButton}
              />
            )}
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
    marginRight: 6,
  },
  brandText: {
    fontSize: 36,
    letterSpacing: -1,
    fontFamily: 'Tempos-Headline',
    lineHeight: 38,
    color: '#9966CC',
    includeFontPadding: false,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: FontSizes.lg,
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  phoneNumber: {
    textAlign: 'center',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  otpInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    marginBottom: Spacing.md,
  },
  otpInput: {
    width: 45,
    height: 56,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  otpInputError: {
    borderWidth: 2,
  },
  errorText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  verifyButton: {
    marginBottom: Spacing.lg,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resendText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  countdownText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    opacity: 0.6,
  },
  backButton: {
    marginTop: Spacing.md,
  },
});
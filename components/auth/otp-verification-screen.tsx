import { useAuth } from '@/contexts/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Ionicons name="shield-checkmark" size={28} color="#000000" style={styles.shieldIcon} />
          <Text style={styles.title}>Enter verification code</Text>
        </View>

        {/* Subtitle and phone number */}
        <View style={styles.subtitleSection}>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.phoneNumber}>
            {maskPhoneNumber(phoneNumber)}
          </Text>
        </View>

        {/* OTP Input */}
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
                  digit && styles.otpInputFilled,
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
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (otp.some(digit => !digit) || isLoading) && styles.verifyButtonDisabled
          ]}
          onPress={() => handleVerifyOtp()}
          disabled={otp.some(digit => !digit) || isLoading}
        >
          <Text style={[
            styles.verifyButtonText,
            (otp.some(digit => !digit) || isLoading) && styles.verifyButtonTextDisabled
          ]}>
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
          </Text>
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <Pressable onPress={handleResendOtp} disabled={isLoading}>
              <Text style={styles.resendText}>
                Didn&apos;t receive code? <Text style={styles.resendLink}>Resend OTP</Text>
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.countdownText}>
              Resend OTP in {countdown}s
            </Text>
          )}
        </View>

        {/* Back Button */}
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backButtonText}>Change Phone Number</Text>
          </TouchableOpacity>
        )}
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  shieldIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Playfair Display',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 18,
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  otpInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
  },
  otpInput: {
    width: 45,
    height: 56,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    fontSize: 20,
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  otpInputFilled: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  otpInputError: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Playfair Display',
    color: '#FF0000',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    fontSize: 16,
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verifyButtonTextDisabled: {
    color: '#999999',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'Playfair Display',
    color: '#666666',
    textAlign: 'center',
  },
  resendLink: {
    color: '#9966CC',
    fontWeight: 'bold',
  },
  countdownText: {
    fontSize: 14,
    fontFamily: 'Playfair Display',
    color: '#999999',
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Playfair Display',
    color: '#666666',
    textDecorationLine: 'underline',
  },
});
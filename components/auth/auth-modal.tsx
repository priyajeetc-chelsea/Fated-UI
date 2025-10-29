import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import {
  Modal,
  ModalProps,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OtpVerificationScreen } from './otp-verification-screen';
import { PhoneInputScreen } from './phone-input-screen';

interface AuthModalProps extends Omit<ModalProps, 'children'> {
  isVisible: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export function AuthModal({ 
  isVisible, 
  onClose, 
  onAuthSuccess,
  ...modalProps 
}: AuthModalProps) {
  const { isOtpSent, isAuthenticated, resetAuthFlow } = useAuth();
  const overlayColor = useThemeColor({}, 'overlay');

  // Handle successful authentication
  React.useEffect(() => {
    if (isAuthenticated) {
      onAuthSuccess?.();
      onClose();
      resetAuthFlow();
    }
  }, [isAuthenticated, onAuthSuccess, onClose, resetAuthFlow]);

  const handleClose = () => {
    resetAuthFlow();
    onClose();
  };

  const handleBackToPhoneInput = () => {
    resetAuthFlow();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      {...modalProps}
    >
      <View style={styles.modalWrapper}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#fff"
          translucent={false}
          hidden={false}
        />
        
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ThemedView style={styles.container}>
          {/* Close overlay - only show on phone input screen */}
          {!isOtpSent && (
            <Pressable
              style={[styles.overlay, { backgroundColor: overlayColor }]}
              onPress={handleClose}
            />
          )}

          <View style={styles.content}>
            {isOtpSent ? (
              <OtpVerificationScreen
                onSuccess={() => {
                  // Success is handled by the useEffect above
                }}
                onBack={handleBackToPhoneInput}
              />
            ) : (
              <PhoneInputScreen
                onSuccess={() => {
                  // OTP sent successfully, screen will automatically switch
                }}
              />
            )}
          </View>
        </ThemedView>
      </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
});
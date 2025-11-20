import { useAuth } from '@/contexts/auth/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

type LogoutButtonProps = {
  variant?: 'text' | 'icon';
};

const ICON_COLOR = '#004242';

export const LogoutButton: React.FC<LogoutButtonProps> = ({ variant = 'text' }) => {
  const { signOut } = useAuth();
  const { setCurrentUser } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      if (isMountedRef.current) {
        setIsLoggingOut(true);
      }

      await signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
      if (isMountedRef.current) {
        setIsLoggingOut(false);
      }

      Alert.alert(
        'Logout Failed',
        'Something went wrong while logging you out. Please try again.'
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoggingOut(false);
      }
    }
  }, [isLoggingOut, setCurrentUser, signOut]);

  const confirmLogout = useCallback(() => {
    if (isLoggingOut) {
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            void handleLogout();
          },
        },
      ],
      { cancelable: true }
    );
  }, [handleLogout, isLoggingOut]);

  const renderContent = () => {
    if (isLoggingOut) {
      return (
        <ActivityIndicator
          size="small"
          color={ICON_COLOR}
          style={variant === 'icon' ? undefined : styles.spinner}
        />
      );
    }

    if (variant === 'icon') {
      return <Ionicons name="log-out-outline" size={22} color={ICON_COLOR} />;
    }

    return (
      <>
        <Ionicons name="log-out-outline" size={20} color={ICON_COLOR} style={styles.icon} />
        <Text style={styles.text}>Logout</Text>
      </>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={confirmLogout}
      style={[styles.button, variant === 'icon' ? styles.iconButton : styles.textButton]}
      accessibilityRole="button"
      accessibilityLabel="Logout"
      disabled={isLoggingOut}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      testID="logout-button"
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: ICON_COLOR,
  },
  icon: {
    marginRight: 6,
  },
  spinner: {
    marginLeft: 8,
  },
});

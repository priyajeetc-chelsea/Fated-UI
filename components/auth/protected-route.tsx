import { AuthModal } from '@/components/auth';
import { ThemedButton } from '@/components/auth/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontSizes, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useAuthModal } from '@/hooks/use-auth-modal';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAuthPrompt?: boolean;
  authPromptTitle?: string;
  authPromptMessage?: string;
}

export function ProtectedRoute({
  children,
  fallback,
  showAuthPrompt = true,
  authPromptTitle = 'Authentication Required',
  authPromptMessage = 'Please sign in to access this feature.',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAuthModalVisible, showAuthModal, hideAuthModal } = useAuthModal();

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Show authenticated content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show default auth prompt
  if (showAuthPrompt) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.authPrompt}>
          <ThemedText type="title" style={styles.title}>
            {authPromptTitle}
          </ThemedText>
          <ThemedText style={styles.message}>
            {authPromptMessage}
          </ThemedText>
          <ThemedButton
            title="Sign In"
            onPress={showAuthModal}
            variant="primary"
            size="large"
            buttonStyle={styles.signInButton}
          />
        </View>

        <AuthModal
          isVisible={isAuthModalVisible}
          onClose={hideAuthModal}
          onAuthSuccess={() => {
            hideAuthModal();
          }}
        />
      </ThemedView>
    );
  }

  // Return null if no auth prompt should be shown
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  authPrompt: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    textAlign: 'center',
    fontSize: FontSizes.lg,
    opacity: 0.7,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  signInButton: {
    minWidth: 200,
  },
});
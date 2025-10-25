import { AuthModal } from '@/components/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth/AuthContext';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WaveText } from './wave-text';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Once loading is complete and we've checked authentication status
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true);
      
      // If user is not authenticated, show the auth modal
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
    }
  }, [isLoading, isAuthenticated, hasCheckedAuth]);

  // Show loading screen while checking authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.loadingContainer}>
          <WaveText text="fated" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // If authenticated, show the main app
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, show auth modal over a placeholder
  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Placeholder content - this won't be visible due to modal */}
        <View style={styles.placeholder}>
          <ThemedText type="title" style={styles.appTitle}>
            Welcome to Fated
          </ThemedText>
          <ThemedText style={styles.appSubtitle}>
            Please sign in to continue
          </ThemedText>
        </View>

        {/* Authentication Modal */}
        <AuthModal
          isVisible={showAuthModal}
          onClose={() => {
            // Only allow closing if user becomes authenticated
            // Otherwise, prevent closing to force authentication
            if (isAuthenticated) {
              setShowAuthModal(false);
            }
          }}
          onAuthSuccess={() => {
            setShowAuthModal(false);
            // User is now authenticated, the useEffect will handle the state change
          }}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingSubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  appTitle: {
    marginBottom: 10,
    textAlign: 'center',
  },
  appSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
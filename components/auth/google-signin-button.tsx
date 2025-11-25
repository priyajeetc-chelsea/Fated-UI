import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface GoogleSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({ 
  onPress, 
  isLoading = false,
  disabled = false 
}: GoogleSignInButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || isLoading) && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator color="#000000" size="small" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#000000" style={styles.icon} />
            <Text style={styles.text}>Continue with Google</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    borderColor: '#CCCCCC',
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Playfair Display',
    fontWeight: '600',
    color: '#000000',
  },
});

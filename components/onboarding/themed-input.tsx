import React from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ThemedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  required?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  showKeyboardDismiss?: boolean;
  minimumCharacters?: number;
}

export default function ThemedInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  required = false,
  showCharacterCount = false,
  maxLength,
  showKeyboardDismiss = false,
  minimumCharacters,
}: ThemedInputProps) {
  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

  const isMinimumMet = minimumCharacters ? value.trim().length >= minimumCharacters : true;
  const characterCountColor = minimumCharacters ? (isMinimumMet ? '#4CAF50' : '#FF4444') : '#666';
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            error && styles.inputError,
            showCharacterCount && multiline && styles.inputWithCounter,
            showKeyboardDismiss && multiline && styles.inputWithDismissButton,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textAlignVertical={multiline ? 'top' : 'center'}
          maxLength={maxLength}
          returnKeyType={multiline ? 'default' : 'done'}
        />
        {showCharacterCount && maxLength && (
          <Text style={[styles.characterCounter, { color: characterCountColor }]}>
            {value.length}/{maxLength}
            {minimumCharacters && (
              <Text style={{ fontSize: 10, opacity: 0.8 }}>
                {' '}{isMinimumMet ? '✓' : `(min ${minimumCharacters})`}
              </Text>
            )}
          </Text>
        )}
        {showKeyboardDismiss && multiline && Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.keyboardDismissButton}
            onPress={handleKeyboardDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.keyboardDismissText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  required: {
    color: '#FF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#FAFAFA',
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 250,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
  inputContainer: {
    position: 'relative',
  },
  inputWithCounter: {
    paddingBottom: 30, // Space for character counter
  },
  inputWithDismissButton: {
    paddingTop: 40, // Space for keyboard dismiss button when multiline
  },
  characterCounter: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  keyboardDismissButton: {
    position: 'absolute',
    top: 2,
    right: 5,
    backgroundColor: '#4B164C',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1,
  },
  keyboardDismissText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
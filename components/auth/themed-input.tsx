import { ThemedText } from '@/components/themed-text';
import { BorderRadius, FontSizes, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

export interface ThemedInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'outline' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

export function ThemedInput({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  lightColor,
  darkColor,
  variant = 'outline',
  size = 'medium',
  ...textInputProps
}: ThemedInputProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    variant === 'filled' ? 'inputBackground' : 'background'
  );
  
  const borderColor = useThemeColor({}, error ? 'error' : 'inputBorder');
  const focusBorderColor = useThemeColor({}, 'inputBorderFocus');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'disabled');
  const errorColor = useThemeColor({}, 'error');

  const [isFocused, setIsFocused] = React.useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 40,
          fontSize: FontSizes.sm,
          paddingHorizontal: Spacing.sm,
        };
      case 'large':
        return {
          height: 56,
          fontSize: FontSizes.lg,
          paddingHorizontal: Spacing.md,
        };
      default:
        return {
          height: 48,
          fontSize: FontSizes.md,
          paddingHorizontal: Spacing.md,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <ThemedText style={styles.label} type="defaultSemiBold">
          {label}
        </ThemedText>
      )}
      
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor,
            borderColor: isFocused ? focusBorderColor : borderColor,
            color: textColor,
            height: sizeStyles.height,
            fontSize: sizeStyles.fontSize,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          variant === 'filled' && styles.filledVariant,
          variant === 'outline' && styles.outlineVariant,
          error && styles.errorBorder,
          inputStyle,
        ]}
        placeholderTextColor={placeholderColor}
        onFocus={(e) => {
          setIsFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          textInputProps.onBlur?.(e);
        }}
        {...textInputProps}
      />
      
      {(error || helperText) && (
        <ThemedText
          style={[
            styles.helperText,
            error && { color: errorColor },
          ]}
        >
          {error || helperText}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: Spacing.xs,
    fontSize: FontSizes.sm,
  },
  input: {
    borderRadius: BorderRadius.md,
    fontSize: FontSizes.md,
    fontWeight: '400',
  },
  outlineVariant: {
    borderWidth: 1,
  },
  filledVariant: {
    borderWidth: 0,
    borderBottomWidth: 2,
    borderRadius: BorderRadius.sm,
  },
  errorBorder: {
    borderWidth: 1,
  },
  helperText: {
    marginTop: Spacing.xs,
    fontSize: FontSizes.xs,
  },
});
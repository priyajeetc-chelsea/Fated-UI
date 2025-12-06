import { ThemedText } from '@/components/themed-text';
import { BorderRadius, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';

export interface ThemedButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function ThemedButton({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  leftIcon,
  rightIcon,
  buttonStyle,
  textStyle,
  fullWidth = false,
  disabled,
  ...touchableProps
}: ThemedButtonProps) {
  const primaryColor = '#4B164C';
  // || useThemeColor({}, 'primary');
  const primaryDarkColor = useThemeColor({}, 'primaryDark');
  const textColor = useThemeColor({}, 'text');
  const disabledColor = useThemeColor({}, 'disabled');

  const isDisabled = disabled || isLoading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDisabled ? disabledColor : primaryColor,
          borderWidth: 0,
          textColor: '#000',
        };
      case 'secondary':
        return {
          backgroundColor: isDisabled ? disabledColor : primaryDarkColor,
          borderWidth: 0,
          textColor: '#000',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled ? disabledColor : primaryColor,
          textColor: isDisabled ? disabledColor : primaryColor,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          textColor: isDisabled ? disabledColor : textColor,
        };
      default:
        return {
          backgroundColor: primaryColor,
          borderWidth: 0,
          textColor: '#000',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 36,
          paddingHorizontal: Spacing.md,
          fontSize: FontSizes.sm,
        };
      case 'large':
        return {
          height: 56,
          paddingHorizontal: Spacing.xl,
          fontSize: FontSizes.lg,
        };
      default:
        return {
          height: 48,
          paddingHorizontal: Spacing.lg,
          fontSize: FontSizes.md,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: variantStyles.borderWidth,
          borderColor: variantStyles.borderColor,
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          width: fullWidth ? '100%' : 'auto',
        },
        isDisabled && styles.disabled,
        buttonStyle,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...touchableProps}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={variantStyles.textColor}
            style={styles.loadingIndicator}
          />
        ) : (
          <>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <ThemedText
              style={[
                styles.text,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize,
                },
                textStyle,
              ]}
            >
              {title}
            </ThemedText>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  loadingIndicator: {
    marginRight: 0,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ChatStatusIndicatorProps {
  status: 'sending' | 'delivered' | 'read' | 'failed';
  size?: number;
  showText?: boolean;
}

export const ChatStatusIndicator: React.FC<ChatStatusIndicatorProps> = ({
  status,
  size = 16,
  showText = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'sending':
        return {
          icon: 'time-outline' as const,
          color: '#999',
          text: 'Sending...',
        };
      case 'delivered':
        return {
          icon: 'checkmark' as const,
          color: '#999',
          text: 'Delivered',
        };
      case 'read':
        return {
          icon: 'checkmark-done' as const,
          color: '#4CAF50',
          text: 'Read',
        };
      case 'failed':
        return {
          icon: 'alert-circle' as const,
          color: '#FF5252',
          text: 'Failed',
        };
      default:
        return {
          icon: 'help-outline' as const,
          color: '#999',
          text: 'Unknown',
        };
    }
  };

  const config = getStatusConfig();

  if (showText) {
    return (
      <View style={styles.container}>
        <Ionicons name={config.icon} size={size} color={config.color} />
        <Text style={[styles.text, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
    );
  }

  return (
    <Ionicons name={config.icon} size={size} color={config.color} />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
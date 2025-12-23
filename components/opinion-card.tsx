import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { ThemedText } from './themed-text';

export interface OpinionCardData {
  id: string;
  userPhoto: string;
  userName: string;
  opinion: string;
  theme: string;
}

interface OpinionCardProps {
  data: OpinionCardData;
  onLike?: () => void;
  onPass?: () => void;
  onRemove?: () => void;
}

export default function OpinionCard({ data, onLike, onPass, onRemove }: OpinionCardProps) {
  const likeScale = useSharedValue(1);

  const likeButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: likeScale.value }],
    };
  });

  const handleLike = () => {
    likeScale.value = withSpring(1.2, {}, () => {
      likeScale.value = withSpring(1);
    });
    onLike?.();
  };

  const handlePass = () => {
    onPass?.();
    setTimeout(() => onRemove?.(), 300);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: 'black' }]}>
        {/* User Photo */}
        <View style={styles.userPhotoContainer}>
          <Image 
            source={{ uri: data.userPhoto }} 
            style={styles.userPhoto}
            blurRadius={3}
          />
        </View>

        {/* Theme Tag */}
        <View style={[styles.themeTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <ThemedText style={styles.themeText}>{data.theme}</ThemedText>
        </View>

        {/* Opinion Content */}
        <View style={styles.content}>
          <ThemedText style={[styles.userName, { color: '#333' }]}>
            {data.userName}
          </ThemedText>
          <ThemedText style={[styles.opinion, { color: '#333' }]}>
            {data.opinion}
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.passButton]} 
            onPress={handlePass}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#30302f" />
          </TouchableOpacity>
          
          <Animated.View style={likeButtonStyle}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.likeButton]} 
              onPress={handleLike}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="heart" size={24} color="#30302f" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 30,
    marginVertical: 10,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  likeOverlay: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  passOverlay: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  overlayText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
  },
  userPhotoContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  themeTag: {
    position: 'absolute',
    top: 15,
    left: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    marginTop: 40,
    marginBottom: 60,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  opinion: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: '#30302f',
  },
  passButton: {
    borderWidth: 2,
    borderColor: '#30302f',
  },
});

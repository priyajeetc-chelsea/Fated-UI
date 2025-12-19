import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

interface ProfileTabIconProps {
  color: string;
  size: number;
}

export default function ProfileTabIcon({ color, size }: ProfileTabIconProps) {
  const { currentUser } = useUser();
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset error state when user or photo changes
  React.useEffect(() => {
    setImageError(false);
    setImageLoading(false);
  }, [currentUser?.photoUrls]);

  // If no photo available or loading failed, show default icon
  if (!currentUser?.photoUrls || currentUser.photoUrls.length === 0 || imageError) {
    return <Ionicons name="person" size={size} color={color} />;
  }

  const photoUrl = currentUser.photoUrls[0]; // Use first photo

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: photoUrl }}
        style={[styles.profileImage, { width: size, height: size, borderRadius: size / 2 }]}
        onLoadStart={() => setImageLoading(true)}
        onLoadEnd={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        resizeMode="cover"
      />
      
      {imageLoading && (
        <View style={[styles.loadingOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
          <ActivityIndicator size="small" color={color} />
        </View>
      )}
      
      {/* Border indicator when active/inactive */}
      <View 
        style={[
          styles.border, 
          { 
            width: size + 4, 
            height: size + 4, 
            borderRadius: (size + 4) / 2,
            borderColor: color,
            opacity: color === 'white' ? 1 : 0.3  // Full opacity when active (white), reduced when inactive
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    backgroundColor: '#f0f0f0',
  },
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
  },
  border: {
    position: 'absolute',
    borderWidth: 2,
  },
});
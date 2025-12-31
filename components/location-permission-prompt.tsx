import { useLocation } from '@/contexts/LocationContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LOCATION_PERMISSION_KEY = '@location_permission_asked';

export const LocationPermissionPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { hasPermission, requestPermission } = useLocation();

  useEffect(() => {
    const checkIfShouldShowPrompt = async () => {
      // Don't show if already have permission
      if (hasPermission === true) return;

      // Check if we've already asked before
      const hasAsked = await AsyncStorage.getItem(LOCATION_PERMISSION_KEY);
      
      // Show prompt after 2 seconds if we haven't asked before
      if (!hasAsked) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
      }
    };

    checkIfShouldShowPrompt();
  }, [hasPermission]);

  const handleAllow = async () => {
    setShowPrompt(false);
    await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
    
    const granted = await requestPermission();
    
    if (!granted) {
      // Show alert if user denied permission
      Alert.alert(
        'Location Access',
        'Location access helps us show you better matches nearby. You can enable it later in Settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNotNow = async () => {
    setShowPrompt(false);
    await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
  };

  if (!showPrompt || hasPermission === true) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={showPrompt}
      animationType="fade"
      onRequestClose={handleNotNow}
    >
      <View style={styles.overlay}>
        <View style={styles.promptContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={48} color="#4B164C" />
          </View>
          
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.description}>
            Find matches near you! We&apos;ll show you people in your area to make connections easier.
          </Text>

          <TouchableOpacity style={styles.allowButton} onPress={handleAllow}>
            <Text style={styles.allowButtonText}>Allow Location</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notNowButton} onPress={handleNotNow}>
            <Text style={styles.notNowButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promptContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5E6F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4B164C',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  allowButton: {
    backgroundColor: '#4B164C',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  allowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  notNowButton: {
    paddingVertical: 12,
  },
  notNowButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
});

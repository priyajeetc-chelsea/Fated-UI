import OnboardingButton from '@/components/onboarding/onboarding-button';
import ProgressIndicator from '@/components/onboarding/progress-indicator';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PhotoSlot {
  id: string;
  localUri: string | null;
  s3Key: string | null;
  isUploading: boolean;
  uploadProgress: string;
}

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 4;
const PHOTO_STATE_STORAGE_KEY = '@onboarding_photos_state';

export default function PhotosForm() {
  const [loading, setLoading] = useState(false);
  const [mainPhotoId, setMainPhotoId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize photo slots with unique IDs
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(() =>
    Array.from({ length: MAX_PHOTOS }, (_, index) => ({
      id: `photo-${index}-${Date.now()}`,
      localUri: null,
      s3Key: null,
      isUploading: false,
      uploadProgress: '',
    }))
  );

  // Preserve state across Android Activity restarts
  const photoSlotsRef = useRef(photoSlots);
  const mainPhotoIdRef = useRef(mainPhotoId);
  const appState = useRef(AppState.currentState);

  // Load persisted state on mount (critical for Android APK)
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(PHOTO_STATE_STORAGE_KEY);
        if (savedState) {
          const { photoSlots: savedSlots, mainPhotoId: savedMainId } = JSON.parse(savedState);
          console.log('🔄 Restored photo state from storage');
          setPhotoSlots(savedSlots);
          setMainPhotoId(savedMainId);
        }
      } catch (error) {
        console.error('Error loading persisted photo state:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadPersistedState();
  }, []);

  // Persist state to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const persistState = async () => {
      try {
        const stateToSave = {
          photoSlots,
          mainPhotoId,
        };
        await AsyncStorage.setItem(PHOTO_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Error persisting photo state:', error);
      }
    };

    persistState();
  }, [photoSlots, mainPhotoId, isInitialized]);

  // Keep refs in sync with state
  useEffect(() => {
    photoSlotsRef.current = photoSlots;
    mainPhotoIdRef.current = mainPhotoId;
  }, [photoSlots, mainPhotoId]);

  // Handle app state changes (Android lifecycle)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - restore state if needed
        console.log('📱 App returned to foreground - preserving photo state');
        
        // Restore state from refs if component was reset
        if (photoSlots.length === MAX_PHOTOS && photoSlots.every(slot => !slot.localUri)) {
          const hasDataInRefs = photoSlotsRef.current.some(slot => slot.localUri);
          if (hasDataInRefs) {
            console.log('🔄 Restoring photo state after Activity restart');
            setPhotoSlots([...photoSlotsRef.current]);
            setMainPhotoId(mainPhotoIdRef.current);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [photoSlots]);

  const updatePhotoSlot = useCallback((id: string, updates: Partial<PhotoSlot>) => {
    setPhotoSlots(prev => prev.map(slot => 
      slot.id === id ? { ...slot, ...updates } : slot
    ));
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to upload photos.');
      return false;
    }
    return true;
  };

  const pickImage = async (slotId: string, slotIndex: number) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Set uploading state
    updatePhotoSlot(slotId, { 
      isUploading: true, 
      uploadProgress: 'Selecting photo...' 
    });

    try {
      // For Android, use legacy mode to prevent Activity destruction
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS === 'ios',
        aspect: [3, 4],
        quality: 0.8,
        allowsMultipleSelection: false,
        ...(Platform.OS === 'android' && {
          selectionLimit: 1,
          // Force legacy mode on Android to prevent Activity restart
          legacy: true,
        }),
      });

      if (result.canceled) {
        updatePhotoSlot(slotId, { 
          isUploading: false, 
          uploadProgress: '' 
        });
        return;
      }

      const imageUri = result.assets[0].uri;
      
      // Update with local preview immediately
      updatePhotoSlot(slotId, { 
        localUri: imageUri,
        uploadProgress: 'Getting upload URL...' 
      });

      // Get upload URL from API
      const uploadUrlResponse = await apiService.getPhotoUploadUrls();
      if (uploadUrlResponse.code !== 200) {
        throw new Error(uploadUrlResponse.msg || 'Failed to get upload URL');
      }

      // Find available upload slot (1-based in API)
      const uploadInfo = uploadUrlResponse.model.uploadUrls.find(
        url => url.photoIndex === slotIndex + 1
      );
      
      if (!uploadInfo) {
        throw new Error(`Upload slot not available for photo ${slotIndex + 1}`);
      }

      updatePhotoSlot(slotId, { 
        uploadProgress: 'Uploading to server...' 
      });
      
      // Upload to S3
      await apiService.uploadImageToS3(
        uploadInfo.uploadUrl,
        imageUri,
        uploadInfo.contentType
      );

      // Success - update with S3 key and clear uploading state
      updatePhotoSlot(slotId, { 
        s3Key: uploadInfo.s3Key,
        isUploading: false,
        uploadProgress: '' 
      });

      // Set as main photo if it's the first photo
      if (!mainPhotoId) {
        setMainPhotoId(slotId);
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      
      // Reset slot on error
      updatePhotoSlot(slotId, { 
        localUri: null,
        s3Key: null,
        isUploading: false,
        uploadProgress: '' 
      });
    }
  };

  const removePhoto = (slotId: string) => {
    updatePhotoSlot(slotId, { 
      localUri: null,
      s3Key: null,
      isUploading: false,
      uploadProgress: '' 
    });

    // If this was the main photo, set the first available photo as main
    if (mainPhotoId === slotId) {
      const nextMainPhoto = photoSlots.find(slot => 
        slot.id !== slotId && slot.localUri && slot.s3Key
      );
      setMainPhotoId(nextMainPhoto?.id || null);
    }
  };

  const setAsMainPhoto = (slotId: string) => {
    setMainPhotoId(slotId);
  };

  const validateForm = (): boolean => {
    const uploadedPhotos = photoSlots.filter(slot => slot.s3Key);
    if (uploadedPhotos.length < MIN_PHOTOS) {
      Alert.alert('Photos Required', `Please upload at least ${MIN_PHOTOS} photos to continue.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get all uploaded S3 keys in order
      const urls = photoSlots
        .filter(slot => slot.s3Key)
        .map(slot => slot.s3Key!);

      // Submit to API
      const response = await apiService.submitPhotos({ urls });
      
      if (response.code === 200) {
        // Clear persisted state on successful submission
        await AsyncStorage.removeItem(PHOTO_STATE_STORAGE_KEY);
        console.log('✅ Photo state cleared after successful submission');
        
        // Success - navigate to homepage
        router.replace('/(tabs)/homepage');
      } else {
        Alert.alert('Error', response.msg || 'Failed to save your photos');
      }
    } catch (error) {
      console.error('Error submitting photos:', error);
      Alert.alert('Error', 'Failed to save your photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoSlot = (slot: PhotoSlot, index: number) => {
    const isMainPhoto = mainPhotoId === slot.id && slot.localUri;
    const hasPhoto = !!slot.localUri;

    return (
      <View key={slot.id} style={styles.photoSlot}>
        <TouchableOpacity
          style={[
            styles.photoContainer,
            isMainPhoto && styles.mainPhotoContainer,
          ]}
          onPress={() => !slot.isUploading && pickImage(slot.id, index)}
          disabled={slot.isUploading}
        >
          {hasPhoto ? (
            <>
              <Image source={{ uri: slot.localUri! }} style={styles.photo} />
              
              {isMainPhoto && (
                <View style={styles.mainPhotoBadge}>
                  <Text style={styles.mainPhotoText}>Main</Text>
                </View>
              )}
              
              {!slot.isUploading && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(slot.id)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF4444" />
                </TouchableOpacity>
              )}
              
              {!isMainPhoto && hasPhoto && slot.s3Key && !slot.isUploading && (
                <TouchableOpacity
                  style={styles.setMainButton}
                  onPress={() => setAsMainPhoto(slot.id)}
                >
                  <Text style={styles.setMainText}>Set as Main</Text>
                </TouchableOpacity>
              )}
              
              {slot.isUploading && (
                <View style={styles.uploadingOverlay}>
                  <Ionicons name="hourglass-outline" size={24} color="#FFF" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              {slot.isUploading ? (
                <Ionicons name="hourglass-outline" size={32} color="#999" />
              ) : (
                <Ionicons name="camera-outline" size={32} color="#999" />
              )}
              <Text style={styles.placeholderText}>
                {slot.isUploading 
                  ? (slot.uploadProgress || 'Uploading...')
                  : index === 0 ? 'Add Main Photo' : 'Add Photo'
                }
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const uploadedCount = photoSlots.filter(slot => slot.s3Key).length;
  const isSubmitDisabled = loading || uploadedCount < MIN_PHOTOS;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ProgressIndicator 
            currentStep={4} 
            totalSteps={4} 
            stepNames={['Basic Details', 'Lifestyle', 'Your Takes', 'Photos']}
          />

          <Text style={styles.title}>Add Your Photos</Text>
          <Text style={styles.subtitle}>
            Show your personality with great photos. Add at least {MIN_PHOTOS} photos to complete your profile.
          </Text>

          <View style={styles.photosGrid}>
            {photoSlots.map((slot, index) => renderPhotoSlot(slot, index))}
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Photo Tips:</Text>
            <Text style={styles.tipText}>• Use recent, clear photos of yourself</Text>
            <Text style={styles.tipText}>• Show your face in your main photo</Text>
            <Text style={styles.tipText}>• Add variety - different settings and angles</Text>
            <Text style={styles.tipText}>• Avoid group photos as your main picture</Text>
          </View>

          <View style={styles.buttonContainer}>
            <OnboardingButton
              title={`Complete Profile (${uploadedCount}/${MIN_PHOTOS})`}
              onPress={handleSubmit}
              loading={loading}
              disabled={isSubmitDisabled}
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Playfair Display Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  photoSlot: {
    width: '48%',
    aspectRatio: 3/4,
    marginBottom: 16,
  },
  photoContainer: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  mainPhotoContainer: {
    borderColor: '#000',
    borderStyle: 'solid',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  mainPhotoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mainPhotoText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  setMainButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
    paddingVertical: 4,
  },
  setMainText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 16
  },
});
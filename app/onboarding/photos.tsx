import OnboardingButton from '@/components/onboarding/onboarding-button';
import ProgressIndicator from '@/components/onboarding/progress-indicator';
import { useApiErrorHandler } from '@/hooks/use-api-error-handler';
import { apiService } from '@/services/api';
import { PhotoUploadUrl } from '@/types/onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PHOTOS_STORAGE_KEY = '@fated_onboarding_photos';
const MAX_PHOTOS = 6;
const MIN_PHOTOS = 4;

interface PhotoData {
  localUri: string;
  s3Key: string;
  uploaded: boolean;
}

export default function PhotosForm() {
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [photos, setPhotos] = useState<(PhotoData | null)[]>(Array(MAX_PHOTOS).fill(null));
  const [uploadUrls, setUploadUrls] = useState<PhotoUploadUrl[]>([]);
  const { handleError } = useApiErrorHandler();
  const hasInitialized = useRef(false);
  const isFetchingUrls = useRef(false);

  // Load saved photo data on mount
  useEffect(() => {
    let mounted = true;
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(PHOTOS_STORAGE_KEY);
        if (mounted && savedData) {
          console.log('Loaded saved photos data');
          const parsed = JSON.parse(savedData);
          if (parsed.photos && Array.isArray(parsed.photos)) {
            setPhotos(parsed.photos);
            console.log('📸 Restored photos from storage:', parsed.photos.filter(p => p !== null).length);
          }
        }
      } catch (error) {
        console.error('Error loading saved photos data:', error);
      } finally {
        if (mounted) {
          setIsInitialized(true);
          console.log('✅ Photo component initialized');
        }
      }
    };
    loadSavedData();

    return () => {
      mounted = false;
    };
  }, []);

  // Save photo data whenever it changes (with debounce)
  // But skip if we're currently uploading (immediate save handles that)
  useEffect(() => {
    if (uploadingIndex !== null) {
      console.log('⏭️ Skipping debounced save - upload in progress');
      return;
    }

    const savePhotoData = async () => {
      try {
        await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify({ photos }));
        console.log('Saved photos data to storage (debounced)');
      } catch (error) {
        console.error('Error saving photos data:', error);
      }
    };

    const timeoutId = setTimeout(savePhotoData, 100); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [photos, uploadingIndex]);

  // Fetch upload URLs on mount - only run once
  useEffect(() => {
    if (hasInitialized.current || isFetchingUrls.current) {
      console.log('⏭️ Skipping URL fetch - already initialized or fetching');
      return;
    }

    let mounted = true;
    const fetchUploadUrls = async () => {
      if (isFetchingUrls.current) return;

      isFetchingUrls.current = true;
      try {
        console.log('📸 Getting photo upload URLs');
        const response = await apiService.getPhotoUploadUrls();
        if (mounted && response.code === 200 && response.model.uploadUrls) {
          setUploadUrls(response.model.uploadUrls);
          hasInitialized.current = true;
          console.log('✅ Photo upload URLs received');
          console.log('✅ Got upload URLs:', response.model.uploadUrls.length);
        } else if (mounted) {
          Alert.alert('Error', 'Failed to get upload URLs. Please try again.');
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching upload URLs:', error);
          handleError(error);
          Alert.alert('Error', 'Failed to initialize photo upload. Please try again.');
        }
      } finally {
        isFetchingUrls.current = false;
      }
    };

    fetchUploadUrls();

    return () => {
      mounted = false;
    };
  }, []);

  const pickImage = async (index: number) => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        // Upload immediately
        await uploadPhoto(index, imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadPhoto = async (index: number, imageUri: string) => {
    if (index >= uploadUrls.length) {
      Alert.alert('Error', 'No upload URL available for this photo slot.');
      return;
    }

    const uploadUrl = uploadUrls[index];
    setUploadingIndex(index);

    try {
      console.log(`📸 Uploading photo ${index + 1}...`);

      // Upload to S3
      await apiService.uploadImageToS3(
        uploadUrl.uploadUrl,
        imageUri,
      );

      console.log(`✅ Photo ${index + 1} uploaded to S3 successfully`);

      // Update local state with proper state updater function and save immediately
      const newPhotos = await new Promise<(PhotoData | null)[]>((resolve) => {
        setPhotos(prevPhotos => {
          const updated = [...prevPhotos];
          const newPhoto = {
            localUri: imageUri,
            s3Key: uploadUrl.s3Key,
            uploaded: true,
          };
          updated[index] = newPhoto;
          console.log(`✅ Updated state for photo ${index + 1}`, newPhoto);
          console.log(`📊 Total uploaded photos: ${updated.filter(p => p?.uploaded).length}`);
          resolve(updated);
          return updated;
        });
      });

      // Save immediately to AsyncStorage to prevent loss on remount
      try {
        await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify({ photos: newPhotos }));
        console.log(`💾 Saved photo ${index + 1} to storage immediately`);
      } catch (err) {
        console.error('Error saving immediately:', err);
      }

      console.log(`✅ Photo ${index + 1} state updated successfully`);
    } catch (error) {
      console.error(`Error uploading photo ${index + 1}:`, error);
      Alert.alert('Upload Failed', `Failed to upload photo ${index + 1}. Please try again.`);
    } finally {
      setUploadingIndex(null);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos[index] = null;
      console.log(`🗑️ Removed photo at index ${index + 1}`);
      return newPhotos;
    });
  };

  const handleSubmit = async () => {
    const uploadedPhotos = photos.filter((p): p is PhotoData => p !== null && p.uploaded);

    if (uploadedPhotos.length < MIN_PHOTOS) {
      Alert.alert(
        'More Photos Needed',
        `Please upload at least ${MIN_PHOTOS} photos to continue.`
      );
      return;
    }

    setLoading(true);
    try {
      // Submit the S3 keys to the backend
      const photoSubmissionData = {
        urls: uploadedPhotos.map(p => p.s3Key),
      };

      console.log('📸 Submitting photo URLs:', photoSubmissionData);
      const response = await apiService.submitPhotos(photoSubmissionData);

      if (response.code === 200) {
        // Clear saved photo data after successful submission
        await AsyncStorage.removeItem(PHOTOS_STORAGE_KEY);
        await AsyncStorage.removeItem('@current_onboarding_page');
        console.log('✅ Photos submitted successfully, onboarding complete!');

        Alert.alert(
          'Profile Complete! 🎉',
          'Your profile is now complete. Let\'s find your perfect match!',
          [
            {
              text: 'Get Started',
              onPress: () => router.replace('/(tabs)/homepage'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.msg || 'Failed to submit photos');
      }
    } catch (error) {
      console.error('Error submitting photos:', error);
      handleError(error);
      Alert.alert('Error', 'Failed to submit photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadedCount = photos.filter(p => p !== null && p.uploaded).length;

  // Log the current state for debugging
  useEffect(() => {
    if (isInitialized) {
      console.log(`📊 Current photo state - Uploaded: ${uploadedCount}/${MAX_PHOTOS}`);
      console.log('📊 Photos array:', photos.map((p, i) => p ? `${i + 1}: ✓` : `${i + 1}: ✗`).join(', '));
    }
  }, [photos, uploadedCount, isInitialized]);

  if (!isInitialized) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#004242" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <ProgressIndicator
        currentStep={5}
        totalSteps={5}
        stepNames={['Basic Details', 'Lifestyle', 'Topics', 'Your Takes', 'Photos']}
      />

      <Text style={styles.title}>Add Your Photos</Text>
      <Text style={styles.subtitle}>
        Upload at least {MIN_PHOTOS} photos. Your first photo will be your main profile picture.
      </Text>

      <View style={styles.photoCountContainer}>
        <Text style={styles.photoCountText}>
          {uploadedCount} / {MAX_PHOTOS} photos uploaded
        </Text>
        {uploadedCount < MIN_PHOTOS && (
          <Text style={styles.photoCountSubtext}>
            ({MIN_PHOTOS - uploadedCount} more required)
          </Text>
        )}
      </View>

      <View style={styles.photosGrid}>
        {photos.map((photo, index) => (
          <View key={`photo-slot-${index}`} style={styles.photoSlot}>
            {uploadingIndex === index ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#004242" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : photo ? (
              <View style={styles.photoContainer}>
                <Image
                  key={`photo-${index}-${photo.localUri}`}
                  source={{ uri: photo.localUri }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                {index === 0 && (
                  <View style={styles.mainPhotoBadge}>
                    <Text style={styles.mainPhotoText}>Main</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={() => pickImage(index)}
                disabled={uploadingIndex !== null}
              >
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>
                  {index === 0 ? 'Add Main Photo' : `Add Photo ${index + 1}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>📸 Photo Tips</Text>
        <Text style={styles.tipText}>• Use clear, recent photos of yourself</Text>
        <Text style={styles.tipText}>• Show your face clearly in at least one photo</Text>
        <Text style={styles.tipText}>• Include variety - selfies, full body, hobbies</Text>
        <Text style={styles.tipText}>• Avoid group photos where you can&apos;t be identified</Text>
      </View>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title={loading ? 'Submitting...' : 'Complete Profile'}
          onPress={handleSubmit}
          disabled={uploadedCount < MIN_PHOTOS || loading || uploadingIndex !== null}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  photoCountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoCountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004242',
  },
  photoCountSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  photoSlot: {
    width: '48%',
    aspectRatio: 3 / 4,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addPhotoButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIcon: {
    fontSize: 40,
    color: '#004242',
    marginBottom: 8,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  mainPhotoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#004242',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  tipsContainer: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 8,
  },
});

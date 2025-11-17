import OnboardingButton from '@/components/onboarding/onboarding-button';
import ProgressIndicator from '@/components/onboarding/progress-indicator';
import { apiService } from '@/services/api';
import { PhotosFormData } from '@/types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function PhotosForm() {
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [formData, setFormData] = useState<PhotosFormData>({
    photos: [],
    mainPhotoIndex: 0,
  });
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library access to upload photos.');
      return false;
    }
    return true;
  };

  const pickImage = async (index: number) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setUploadingIndex(index);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        setUploadProgress('Getting upload URL...');
        
        // Get upload URL from API
        const uploadUrlResponse = await apiService.getPhotoUploadUrls();
        if (uploadUrlResponse.code !== 200) {
          throw new Error(uploadUrlResponse.msg || 'Failed to get upload URL');
        }

        // Find the upload URL for this photo index (1-based in API)
        const uploadInfo = uploadUrlResponse.model.uploadUrls.find(
          url => url.photoIndex === index + 1
        );
        
        if (!uploadInfo) {
          throw new Error(`Upload slot not available for photo ${index + 1}`);
        }

        setUploadProgress('Uploading photo...');
        
        // Upload the image to S3
        await apiService.uploadImageToS3(
          uploadInfo.uploadUrl,
          imageUri,
          uploadInfo.contentType
        );

        // Update local state with the image URI for preview
        const newPhotos = [...formData.photos];
        newPhotos[index] = imageUri;
        
        // Update uploaded URLs with the S3 key (this will be used in final submission)
        const newUploadedUrls = [...uploadedPhotoUrls];
        newUploadedUrls[index] = uploadInfo.s3Key;
        
        setFormData(prev => ({
          ...prev,
          photos: newPhotos,
        }));
        setUploadedPhotoUrls(newUploadedUrls);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingIndex(null);
      setUploadProgress('');
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index, 1);
    
    // Also remove the uploaded URL
    const newUploadedUrls = [...uploadedPhotoUrls];
    newUploadedUrls.splice(index, 1);
    
    let newMainIndex = formData.mainPhotoIndex;
    if (index === formData.mainPhotoIndex) {
      newMainIndex = 0;
    } else if (index < formData.mainPhotoIndex) {
      newMainIndex = formData.mainPhotoIndex - 1;
    }

    setFormData(prev => ({
      ...prev,
      photos: newPhotos,
      mainPhotoIndex: newMainIndex,
    }));
    setUploadedPhotoUrls(newUploadedUrls);
  };

  const setMainPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mainPhotoIndex: index,
    }));
  };

  const validateForm = (): boolean => {
    const uploadedCount = uploadedPhotoUrls.filter(url => url !== undefined && url !== '').length;
    if (uploadedCount < 4) {
      Alert.alert('Photos Required', 'Please upload at least 4 photos to continue.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Filter out empty slots and get only the uploaded S3 URLs
      const urls = uploadedPhotoUrls.filter(url => url !== undefined && url !== '');
      
      if (urls.length < 4) {
        Alert.alert('Error', 'Please upload at least 4 photos before continuing.');
        return;
      }

      // Submit the uploaded photo URLs to complete the onboarding
      const response = await apiService.submitPhotos({ urls });
      
      if (response.code === 200) {
        // Profile complete, navigate to home
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

  const renderPhotoSlot = (index: number) => {
    const hasPhoto = formData.photos[index];
    const isUploading = uploadingIndex === index;
    const isMainPhoto = index === formData.mainPhotoIndex && hasPhoto;

    return (
      <View key={index} style={styles.photoSlot}>
        <TouchableOpacity
          style={[
            styles.photoContainer,
            isMainPhoto && styles.mainPhotoContainer,
          ]}
          onPress={() => pickImage(index)}
          disabled={isUploading}
        >
          {hasPhoto ? (
            <>
              <Image source={{ uri: hasPhoto }} style={styles.photo} />
              {isMainPhoto && (
                <View style={styles.mainPhotoBadge}>
                  <Text style={styles.mainPhotoText}>Main</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
              {!isMainPhoto && hasPhoto && (
                <TouchableOpacity
                  style={styles.setMainButton}
                  onPress={() => setMainPhoto(index)}
                >
                  <Text style={styles.setMainText}>Set as Main</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              {isUploading ? (
                <Ionicons name="hourglass-outline" size={32} color="#999" />
              ) : (
                <Ionicons name="camera-outline" size={32} color="#999" />
              )}
              <Text style={styles.placeholderText}>
                {isUploading 
                  ? (uploadProgress || 'Uploading...')
                  : index === 0 ? 'Add Main Photo' : 'Add Photo'
                }
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
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
          Show your personality with great photos. Add at least 4 photos to complete your profile.
        </Text>

        <View style={styles.photosGrid}>
          {Array.from({ length: 6 }, (_, index) => renderPhotoSlot(index))}
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
            title="Complete Profile"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || formData.photos.length === 0}
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
    left: 8,
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
  },
});
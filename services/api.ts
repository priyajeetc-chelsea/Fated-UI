import { authApiService } from '@/services/auth/api';
import { ApiUser, MatchRequest, MatchResponse, SwipeRequest } from '@/types/api';
import { PhotoSubmissionData, PhotoUploadUrlResponse } from '@/types/onboarding';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// API service with real endpoint and authentication support
class ApiService {
  private readonly API_BASE_URL = 'https://xfcy5ocgsl.execute-api.ap-south-1.amazonaws.com/staging';

  /**
   * Make an authenticated API request
   */
  private async makeAuthenticatedRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    return authApiService.createAuthenticatedRequest(url, options);
  }

  /**
   * Make a public API request (no authentication required)
   */
  private async makePublicRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };
    return fetch(url, defaultOptions);
  }

  // Fetch all matches (confirmed and potential) - DEPRECATED: Use fetchPotentialMatches and fetchConfirmedMatches instead
  async fetchAllMatches(): Promise<import('@/types/api').ApiAllMatchesResponse> {
    try {
      const response = await this.makeAuthenticatedRequest('/matches/all', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      return apiResponse;
    } catch (error) {
      console.error('❌ Failed to fetch all matches:', error);
      throw error;
    }
  }

  // Fetch potential matches (likes you and mutual likes)
  async fetchPotentialMatches(): Promise<import('@/types/api').ApiPotentialMatchesResponse> {
    try {
      const response = await this.makeAuthenticatedRequest('/matches/potential', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      return apiResponse;
    } catch (error) {
      console.error('❌ Failed to fetch potential matches:', error);
      throw error;
    }
  }

  // Fetch confirmed matches
  async fetchConfirmedMatches(): Promise<import('@/types/api').ApiConfirmedMatchesResponse> {
    try {
      const response = await this.makeAuthenticatedRequest('/matches/confirm', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      return apiResponse;
    } catch (error) {
      console.error('❌ Failed to fetch confirmed matches:', error);
      throw error;
    }
  }

  // Fetch opinions for a potential match user
  async fetchUserOpinions(matchUserId: number): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/user/opinions?matchUserId=${matchUserId}`, 
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      return apiResponse;
    } catch (error) {
      console.error('❌ Failed to fetch user opinions:', error);
      throw error;
    }
  }

  // Fetch user profile by matchUserId
  async fetchUserProfile(matchUserId: number): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/user/matchedProfile?matchUserId=${matchUserId}`, 
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      return apiResponse;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      throw error;
    }
  }
  
  // Mock data as fallback when CORS fails
  private getMockResponse(request: MatchRequest): MatchResponse {
    return {
      "tags": {
        "all": [
          {
            "id": 1,
            "name": "Feminism",
            "isSelected": request.tagIds.includes(1)
          },
          {
            "id": 2,
            "name": "Mental Health",
            "isSelected": request.tagIds.includes(2)
          },
          {
            "id": 3,
            "name": "Politics",
            "isSelected": request.tagIds.includes(3)
          },
          {
            "id": 4,
            "name": "Climate Change",
            "isSelected": request.tagIds.includes(4)
          },
          {
            "id": 5,
            "name": "LGBTQ+",
            "isSelected": request.tagIds.includes(5)
          }
        ]
      },
      "trendingTags": [
        {
          "id": 4,
          "name": "Climate Change"
        },
        {
          "id": 6,
          "name": "Israel–Iran Conflict"
        },
        {
          "id": 7,
          "name": "AI and Ethics"
        }
      ],
      "matches": this.getFilteredMockMatches(request.tagIds),
      "hasMore": true
    };
  }

  private getFilteredMockMatches(tagIds: number[]) {
    const allMatches = [
      {
        "userId": 203,
        "firstName": "dummy user",
        "age": 25,
        "gender": "Female",
        "opinions": [
          {
            "takeId": 501,
            "question": "What does feminism mean to you in 2025?",
            "answer": "It's about equity, not just equality. Real change means changing systems, not just headlines.",
            "tag": {
              "tagId": 1,
              "tagValue": "Feminism"
            }
          },
          {
            "takeId": 504,
            "question": "How do you handle burnout?",
            "answer": "I unplug, go offline and come back with perspective.",
            "tag": {
              "tagId": 2,
              "tagValue": "Mental Health"
            }
          }
        ]
      },
      {
        "userId": 305,
        "firstName": "Priya",
        "age": 27,
        "gender": "Female",
        "opinions": [
          {
            "takeId": 502,
            "question": "Is therapy a necessity or luxury in India?",
            "answer": "It's a necessity, but access is still a luxury. We need more awareness and affordability.",
            "tag": {
              "tagId": 2,
              "tagValue": "Mental Health"
            }
          }
        ]
      },
      {
        "userId": 218,
        "firstName": "Sana",
        "age": 23,
        "gender": "Female",
        "opinions": [
          {
            "takeId": 503,
            "question": "Do you believe nationalism is hurting India's diversity?",
            "answer": "Yes, because hyper-nationalism silences dissent and erodes cultural pluralism.",
            "tag": {
              "tagId": 3,
              "tagValue": "Politics"
            }
          }
        ]
      },
      {
        "userId": 319,
        "firstName": "Kavya",
        "age": 24,
        "gender": "Female", 
        "opinions": [
          {
            "takeId": 505,
            "question": "What's your take on climate activism?",
            "answer": "We need systemic change, not just individual action. Corporations must be held accountable.",
            "tag": {
              "tagId": 4,
              "tagValue": "Climate Change"
            }
          }
        ]
      }
    ];

    // Filter matches based on selected tag IDs
    if (tagIds.length === 0) return allMatches;
    
    return allMatches.filter(match => 
      match.opinions.some(opinion => 
        tagIds.includes(opinion.tag.tagId)
      )
    );
  }
  
  // API request method with CORS fallback
  private async makeRequest<T>(endpoint: string, data: MatchRequest): Promise<T> {
    try {
      
      const response = await this.makeAuthenticatedRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      // Check if response has the expected structure
      if (apiResponse.code === 200 && apiResponse.model) {
        // Check if user is in onboarding state
        if (apiResponse.model.onboardingStep && apiResponse.model.onboardingStep.step < 5) {
          console.log('🚧 User in onboarding state:', apiResponse.model.onboardingStep);
          const onboardingResponse: MatchResponse = {
            userId: apiResponse.model.userId, // Include current user's ID
            tags: { all: [] },
            matches: null,
            hasMore: false,
            onboardingStep: apiResponse.model.onboardingStep
          };
          return onboardingResponse as T;
        }
        
        // Convert the actual API response to our expected format
        const convertedResponse: MatchResponse = {
          userId: apiResponse.model.userId, // Include current user's ID
          tags: {
            all: apiResponse.model.tags?.all || []
          },
          trendingTags: apiResponse.model.tags?.trendingTags || [],
          matches: apiResponse.model.matches ? apiResponse.model.matches.map((match: any) => ({
            userId: match.userId,
            firstName: match.firstName,
            age: 25, // Default age since not provided in API
            gender: "Female", // Default gender since not provided in API
            opinions: match.opinions.map((opinion: any) => ({
              takeId: opinion.takeId,
              question: opinion.question,
              answer: opinion.answer,
              tag: {
                tagId: this.getTagIdFromName(opinion.tag, apiResponse.model.tags?.all || []),
                tagValue: opinion.tag
              }
            }))
          })) : [],
          hasMore: apiResponse.model.hasMore || false,
          onboardingStep: apiResponse.model.onboardingStep
        };
        
        console.log('🔄 Converted API Response:', convertedResponse);
        return convertedResponse as T;
      } else {
        throw new Error(`API returned error: ${apiResponse.msg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ API request failed:', error);
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('🚫 CORS error detected - falling back to mock data');
        return this.getMockResponse(data) as T;
      }
      
      throw error;
    }
  }

  // Helper method to get tag ID from tag name
  private getTagIdFromName(tagName: string, allTags: any[]): number {
    const tag = allTags.find(t => t.name === tagName);
    return tag ? tag.id : 1; // Default to 1 if not found
  }

  // Send swipe action to the server
  async sendSwipe(takeId: number, swipeRight: boolean, comment: string = ''): Promise<any> {
    try {
      const swipeData: SwipeRequest = {
        takeId,
        swipeRight,
        ...(comment && comment.trim() && { comment: comment.trim() })
      };

      console.log('🔄 Sending swipe action:', swipeData);
      const response = await this.makeAuthenticatedRequest('/swipe', {
        method: 'POST',
        body: JSON.stringify(swipeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Swipe response:', result);
      return result;
    } catch (error) {
      console.error('💥 Failed to send swipe:', error);
      return null;
    }
  }

  // Send final swipe action (for like/cross buttons in profile page)
  async sendFinalSwipe(swipedId: number, swipeRight: boolean): Promise<any> {
    try {
      const finalSwipeData = {
        swipedId,
        swipeRight
      };

      console.log('🔄 Sending final swipe action:', finalSwipeData);
      const response = await this.makeAuthenticatedRequest('/finalSwipe', {
        method: 'POST',
        body: JSON.stringify(finalSwipeData),
      });

      if (!response.ok) {
        throw new Error(`Final swipe failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Final swipe response:', result);
      return result;
    } catch (error) {
      console.error('💥 Failed to send final swipe:', error);
      return null;
    }
  }

  // Fetch matches with automatic fallback
  async fetchMatches(request: MatchRequest): Promise<MatchResponse> {
    try {
      const response = await this.makeRequest<MatchResponse>('/home', request);
      
      // Check if user is in onboarding state
      if (response.onboardingStep && response.onboardingStep.step < 5) {
        console.log('🚧 User is in onboarding state, step:', response.onboardingStep.step);
        // Return empty response to indicate onboarding is needed
        return {
          tags: { all: [] },
          matches: [],
          hasMore: false,
          onboardingStep: response.onboardingStep
        };
      }
      
      return response;
    } catch (error) {
      console.error('💥 Failed to fetch matches:', error);
      // Final fallback
      console.warn('🔄 Using mock data as final fallback');
      return this.getMockResponse(request);
    }
  }

  // Convert API response to app format
  convertToAppUsers(matches: MatchResponse['matches']): ApiUser[] {
    // Handle null matches (during onboarding)
    if (!matches || matches.length === 0) {
      return [];
    }
    
    return matches.map(match => ({
      id: match.userId.toString(),
      name: match.firstName,
      age: match.age,
      gender: match.gender,
      photo: `https://picsum.photos/200/200?random=${match.userId}`, // Generate random photo
      opinions: match.opinions.map(opinion => ({
        id: opinion.takeId.toString(),
        question: opinion.question,
        text: opinion.answer,
        theme: opinion.tag.tagValue,
        liked: false
      }))
    }));
  }

  // Get default request for initial load  
  getDefaultRequest(): MatchRequest {
    return {
      tagIds: [1, 2, 3], // Default selected tags
      limit: 20
    };
  }

  // Onboarding API methods
  async submitBasicDetails(basicData: any): Promise<any> {
    try {
      console.log('📝 Submitting basic details:', basicData);
      const response = await this.makeAuthenticatedRequest('/onboarding/basic', {
        method: 'POST',
        body: JSON.stringify(basicData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Basic details submitted successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to submit basic details:', error);
      throw error;
    }
  }

  async submitLifestyleDetails(lifestyleData: any): Promise<import('@/types/onboarding').LifestyleResponse> {
    try {
      console.log('🏠 Submitting lifestyle details:', lifestyleData);
      const response = await this.makeAuthenticatedRequest('/onboarding/lifestyle', {
        method: 'POST',
        body: JSON.stringify(lifestyleData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Lifestyle details submitted successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to submit lifestyle details:', error);
      throw error;
    }
  }

  // Get current onboarding step and related data (for step 3, includes tagAndQuestion)
  async getOnboardingStep(): Promise<any> {
    try {
      console.log('📋 Fetching current onboarding step');
      const response = await this.makeAuthenticatedRequest('/onboarding/step', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Onboarding step data received:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch onboarding step:', error);
      throw error;
    }
  }

  async submitTakes(takesData: import('@/types/onboarding').NewTakesFormData): Promise<any> {
    try {
      console.log('💭 Submitting takes/opinions:', takesData);
      const response = await this.makeAuthenticatedRequest('/onboarding/takes', {
        method: 'POST',
        body: JSON.stringify(takesData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Takes submitted successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to submit takes:', error);
      throw error;
    }
  }

  // Get takes questions (topics and questions for onboarding)
  async getTakesQuestions(): Promise<any> {
    try {
      console.log('📝 Fetching takes questions...');
      const response = await this.makeAuthenticatedRequest('/onboarding/takes', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      console.log('✅ Takes questions fetched successfully');
      return apiResponse;
    } catch (error) {
      console.error('❌ Failed to fetch takes questions:', error);
      throw error;
    }
  }

  // Get pre-signed upload URLs for photos
  async getPhotoUploadUrls(): Promise<PhotoUploadUrlResponse> {
    try {
      console.log('📸 Getting photo upload URLs');
      const response = await this.makeAuthenticatedRequest('/onboarding/photoUploadUrl', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Photo upload URLs received');
      return result;
    } catch (error) {
      console.error('❌ Failed to get photo upload URLs:', error);
      throw error;
    }
  }

  // Upload image to S3 using pre-signed URL
  async uploadImageToS3(uploadUrl: string, imageUri: string): Promise<void> {
    try {
      console.log('📸 Uploading image to S3');
      console.log('📸 Image URI:', imageUri);
      console.log('📸 Upload URL (first 100 chars):', uploadUrl.substring(0, 100));
      console.log('📸 Platform:', Platform.OS);
      
      // Android APK requires FileSystem.uploadAsync for proper file handling
      if (Platform.OS === 'android') {
        console.log('📸 Using FileSystem.uploadAsync for Android...');
        
        let uploadUri = imageUri;
        
        // Handle content:// URIs on Android - copy to cache first
        if (imageUri.startsWith('content://')) {
          console.log('📸 Content URI detected, copying to cache...');
          const tmpFile = `${FileSystem.cacheDirectory}upload-temp-${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: imageUri, to: tmpFile });
          uploadUri = tmpFile;
          console.log('📸 Copied to:', uploadUri);
        }
        
        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(uploadUri);
        console.log('📸 File info:', fileInfo);
        
        if (!fileInfo.exists) {
          throw new Error('Selected image file does not exist');
        }
        
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, uploadUri, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'Content-Type': 'image/jpeg',
          },
        });

        console.log('📸 Upload result status:', uploadResult.status);
        console.log('📸 Upload result headers:', uploadResult.headers);
        
        // Accept 200, 201, or 204 as success
        if (![200, 201, 204].includes(uploadResult.status)) {
          console.error('📸 Upload failed with body:', uploadResult.body);
          throw new Error(`S3 upload failed! status: ${uploadResult.status} - ${uploadResult.body}`);
        }
        
        // Clean up temp file if we created one
        if (imageUri.startsWith('content://')) {
          await FileSystem.deleteAsync(uploadUri, { idempotent: true });
          console.log('📸 Cleaned up temp file');
        }
        
        console.log('✅ Image uploaded to S3 successfully (Android)');
        return;
      }
      
      // iOS and Web can use standard fetch with blob
      console.log('📸 Using fetch with blob for iOS/Web...');
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image data: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📸 Image blob size:', blob.size, 'bytes');
      console.log('📸 Image blob type:', blob.type);

      if (blob.size === 0) {
        throw new Error('Image blob is empty - file may not be accessible');
      }

      console.log('📸 Starting S3 upload...');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': blob.type || 'image/jpeg',
        },
        body: blob,
      });

      console.log('📸 S3 response status:', uploadResponse.status);

      // Accept 200, 201, or 204 as success
      if (![200, 201, 204].includes(uploadResponse.status)) {
        const errorText = await uploadResponse.text();
        console.error('📸 S3 error response:', errorText);
        throw new Error(`S3 upload failed! status: ${uploadResponse.status} - ${errorText}`);
      }

      console.log('✅ Image uploaded to S3 successfully (iOS/Web)');
    } catch (error) {
      console.error('❌ Failed to upload image to S3:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }


  // Submit uploaded photo URLs
  async submitPhotos(photoSubmissionData: PhotoSubmissionData): Promise<any> {
    try {
      console.log('📸 Submitting photo URLs:', photoSubmissionData);
      const response = await this.makeAuthenticatedRequest('/onboarding/photos', {
        method: 'POST',
        body: JSON.stringify(photoSubmissionData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Photos submitted successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to submit photos:', error);
      throw error;
    }
  }

  async getOnboardingStatus(): Promise<any> {
    try {
      console.log('📊 Fetching onboarding status');
      const response = await this.makeAuthenticatedRequest('/home', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Onboarding status fetched successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch onboarding status:', error);
      throw error;
    }
  }

  async getCurrentUserProfile(): Promise<import('@/types/api').CurrentUserProfileResponse> {
    try {
      console.log('👤 Fetching current user profile');
      const response = await this.makeAuthenticatedRequest('/user/profile', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Current user profile fetched successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch current user profile:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

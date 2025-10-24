import {
    ExchangeTokenRequest,
    ExchangeTokenResponse,
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse
} from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthConfig } from './config';

export class AuthApiService {
  private readonly API_BASE_URL = AuthConfig.API_BASE_URL;
  private readonly FIREBASE_API_KEY = AuthConfig.FIREBASE_API_KEY;
  
  // Storage keys
  private readonly BEARER_TOKEN_KEY = 'bearerToken';
  private readonly USER_DATA_KEY = 'userData';


  /**
   * Send OTP to the provided phone number
   */
  async sendOtp(request: SendOtpRequest): Promise<SendOtpResponse> {
    try {
      console.log('📱 REAL API: Sending OTP request to:', `${this.API_BASE_URL}/otp/send`);
      console.log('� Phone number:', request.phone);
      console.log('🎯 Reason:', request.reason);

      const response = await fetch(`${this.API_BASE_URL}/otp/send`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data: SendOtpResponse = await response.json();
      console.log('✅ REAL API: OTP sent successfully to your phone!');
      return data;
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      
      throw new Error(error instanceof Error ? error.message : 'Failed to send OTP');
    }
  }

  /**
   * Verify the OTP with the provided token
   */
  async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {

    try {
      console.log('🔐 REAL API: Verifying OTP with backend...');
      console.log('� Phone number:', request.phone);

      const response = await fetch(`${this.API_BASE_URL}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data: VerifyOtpResponse = await response.json();
      console.log('✅ REAL API: OTP verified successfully!');
      return data;
    } catch (error) {
      console.error('❌ Failed to verify OTP:', error);
      
      // Check if it's a CORS error and fallback to mock
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        if (AuthConfig.ENABLE_CORS_FALLBACK) {
          console.warn('🚫 CORS error detected during OTP verification - falling back to mock API');
        } else {
          throw new Error('CORS error: Backend needs to allow your domain. Please contact the backend team to add CORS headers.');
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to verify OTP');
    }
  }

  /**
   * Exchange custom token for Firebase ID token
   */
  async exchangeCustomTokenForBearer(customToken: string): Promise<ExchangeTokenResponse> {

    try {
      const request: ExchangeTokenRequest = {
        token: customToken,
        returnSecureToken: true,
      };

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${this.FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data: ExchangeTokenResponse = await response.json();
      console.log('✅ REAL Firebase: JWT token received successfully!');
      return data;
    } catch (error) {
      console.error('❌ Failed to exchange custom token:', error);
      
      // Check if it's a CORS error and fallback to mock
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        if (AuthConfig.ENABLE_CORS_FALLBACK) {
          console.warn('🚫 CORS error detected during Firebase token exchange - falling back to mock API');
        } else {
          throw new Error('CORS error: Firebase token exchange failed due to CORS policy.');
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to authenticate');
    }
  }

  /**
   * Store bearer token securely
   */
  async storeBearerToken(idToken: string): Promise<void> {
    try {
      const bearerToken = `Bearer ${idToken}`;
      await AsyncStorage.setItem(this.BEARER_TOKEN_KEY, bearerToken);
      
      if (AuthConfig.LOG_TOKEN_SOURCE) {
        const tokenSource = idToken.startsWith('mock_') ? 'MOCK' : 'REAL';
        console.log(`🔐 Stored ${tokenSource} bearer token:`, bearerToken.substring(0, 30) + '...');
      }
    } catch (error) {
      console.error('❌ Failed to store bearer token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Get stored bearer token
   */
  async getBearerToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.BEARER_TOKEN_KEY);
    } catch (error) {
      console.error('❌ Failed to get bearer token:', error);
      return null;
    }
  }

  /**
   * Store user data
   */
  async storeUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('❌ Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Get stored user data
   */
  async getUserData(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Clear all stored authentication data
   */
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.BEARER_TOKEN_KEY, this.USER_DATA_KEY]);
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }

  /**
   * Create authenticated HTTP interceptor
   */
  async createAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const bearerToken = await this.getBearerToken();
    
    if (!bearerToken) {
      throw new Error('No authentication token found');
    }

    const authenticatedOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': bearerToken,
        ...options.headers,
      },
    };

    const response = await fetch(url, authenticatedOptions);

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      await this.clearAuthData();
      throw new Error('Authentication expired. Please login again.');
    }

    return response;
  }
}

// Singleton instance
export const authApiService = new AuthApiService();
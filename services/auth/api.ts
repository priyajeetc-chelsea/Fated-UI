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
  private readonly LOGIN_TIMESTAMP_KEY = 'loginTimestamp';
  private readonly LAST_ACTIVITY_TIMESTAMP_KEY = 'lastActivityTimestamp';
  
  // Session configuration
  private readonly SESSION_TIMEOUT_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds


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
      const timestamp = Date.now().toString();
      
      console.log('🔐 Storing authentication data...');
      await Promise.all([
        AsyncStorage.setItem(this.BEARER_TOKEN_KEY, bearerToken),
        AsyncStorage.setItem(this.LOGIN_TIMESTAMP_KEY, timestamp),
        AsyncStorage.setItem(this.LAST_ACTIVITY_TIMESTAMP_KEY, timestamp),
      ]);
      
      console.log(`✅ Bearer token stored successfully`);
      console.log(`⏰ Login timestamp: ${new Date(parseInt(timestamp)).toISOString()}`);
      console.log(`📅 Session will expire after 48 hours of inactivity`);
      
      if (AuthConfig.LOG_TOKEN_SOURCE) {
        const tokenSource = idToken.startsWith('mock_') ? 'MOCK' : 'REAL';
        console.log(`   Token type: ${tokenSource}`);
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
      await AsyncStorage.multiRemove([
        this.BEARER_TOKEN_KEY, 
        this.USER_DATA_KEY,
        this.LOGIN_TIMESTAMP_KEY,
        this.LAST_ACTIVITY_TIMESTAMP_KEY,
      ]);
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }

  /**
   * Update last activity timestamp
   */
  async updateLastActivity(): Promise<void> {
    try {
      const timestamp = Date.now().toString();
      await AsyncStorage.setItem(this.LAST_ACTIVITY_TIMESTAMP_KEY, timestamp);
      console.log(`🔄 Last activity updated: ${new Date(parseInt(timestamp)).toLocaleString()}`);
    } catch (error) {
      console.error('❌ Failed to update last activity:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Check if authentication has expired (48 hours of inactivity)
   * Returns true if session is still valid, false if expired
   * Note: Should only be called when tokens already exist
   */
  async checkAuthExpiration(): Promise<boolean> {
    try {
      const lastActivityStr = await AsyncStorage.getItem(this.LAST_ACTIVITY_TIMESTAMP_KEY);
      
      if (!lastActivityStr) {
        // No timestamp found - this shouldn't happen if tokens exist
        // Create one now and consider session valid
        console.log('⚠️ No activity timestamp found, creating new one');
        await this.updateLastActivity();
        return true;
      }

      const lastActivity = parseInt(lastActivityStr);
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity > this.SESSION_TIMEOUT_MS) {
        console.log('⏰ Session expired due to 48 hours of inactivity');
        const hoursSinceActivity = Math.floor(timeSinceLastActivity / (60 * 60 * 1000));
        console.log(`   Last activity was ${hoursSinceActivity} hours ago`);
        return false;
      }

      // Session is still valid, update activity timestamp
      await this.updateLastActivity();
      
      const hoursRemaining = Math.floor((this.SESSION_TIMEOUT_MS - timeSinceLastActivity) / (60 * 60 * 1000));
      console.log(`✅ Session valid. Expires in ~${hoursRemaining} hours`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to check auth expiration:', error);
      // On error, assume session is valid to avoid logging out unnecessarily
      return true;
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

    // Update last activity on successful authenticated requests
    if (response.ok) {
      await this.updateLastActivity();
    }

    return response;
  }
}

// Singleton instance
export const authApiService = new AuthApiService();
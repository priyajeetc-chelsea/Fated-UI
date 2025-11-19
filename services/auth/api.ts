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
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';
  private readonly USER_DATA_KEY = 'userData';
  
  // Flag to prevent multiple simultaneous refresh attempts
  private refreshPromise: Promise<string> | null = null;

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
   * Store bearer token and refresh token securely
   */
  async storeBearerToken(idToken: string, refreshToken?: string, expiresIn?: string): Promise<void> {
    try {
      const bearerToken = `Bearer ${idToken}`;
      const timestamp = Date.now().toString();
      
      // Calculate token expiry time (default to 1 hour if not provided)
      const expirySeconds = expiresIn ? parseInt(expiresIn) : 3600;
      const expiryTime = Date.now() + (expirySeconds * 1000);
      
      console.log('🔐 Storing authentication data...');
      
      const storagePromises = [
        AsyncStorage.setItem(this.BEARER_TOKEN_KEY, bearerToken),
        AsyncStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString()),
      ];
      
      if (refreshToken) {
        storagePromises.push(AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken));
      }
      
      await Promise.all(storagePromises);
      
      console.log(`✅ Bearer token stored successfully`);
      console.log(`⏰ Login timestamp: ${new Date(parseInt(timestamp)).toISOString()}`);
      console.log(`📅 Token expires at: ${new Date(expiryTime).toISOString()}`);
      
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
   * Get stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ Failed to get refresh token:', error);
      return null;
    }
  }
  
  /**
   * Check if token is expired or about to expire (within 5 minutes)
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiryStr = await AsyncStorage.getItem(this.TOKEN_EXPIRY_KEY);
      
      // If no expiry timestamp exists, assume token is still valid
      // This handles legacy tokens from before the refresh implementation
      if (!expiryStr) {
        console.log('⚠️ No token expiry found - assuming legacy token is valid');
        return false;
      }
      
      const expiryTime = parseInt(expiryStr);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      // Return true if expired or expiring within 5 minutes
      const isExpired = now >= (expiryTime - fiveMinutes);
      
      if (isExpired) {
        console.log('⚠️ Token expired or expiring soon');
      }
      
      return isExpired;
    } catch (error) {
      console.error('❌ Failed to check token expiry:', error);
      return false; // On error, assume valid to avoid unnecessary logouts
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
   * Refresh the Firebase ID token using refresh token
   */
  async refreshIdToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      console.log('⏳ Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    this.refreshPromise = this._performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _performTokenRefresh(): Promise<string> {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Refreshing authentication token...');

      const response = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${this.FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('❌ Token refresh failed:', errorData);
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      // Store the new tokens
      await this.storeBearerToken(
        data.id_token,
        data.refresh_token,
        data.expires_in
      );

      console.log('✅ Token refreshed successfully');
      return `Bearer ${data.id_token}`;
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      // Clear auth data on refresh failure
      await this.clearAuthData();
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Clear all stored authentication data
   */
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.BEARER_TOKEN_KEY, 
        this.REFRESH_TOKEN_KEY,
        this.TOKEN_EXPIRY_KEY,
        this.USER_DATA_KEY,
      ]);
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }


  /**
   * Create authenticated HTTP interceptor with automatic token refresh
   */
  async createAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let bearerToken = await this.getBearerToken();
    
    if (!bearerToken) {
      throw new Error('No authentication token found');
    }

    // Check if token is expired or about to expire
    const isExpired = await this.isTokenExpired();
    if (isExpired) {
      console.log('⚠️ Token expired or expiring soon, refreshing...');
      try {
        bearerToken = await this.refreshIdToken();
      } catch {
        // If refresh fails, clear auth and throw
        await this.clearAuthData();
        throw new Error('Session expired. Please login again.');
      }
    }

    const authenticatedOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': bearerToken,
        ...options.headers,
      },
    };

    let response = await fetch(url, authenticatedOptions);

    // Handle 401 Unauthorized - try to refresh token once
    if (response.status === 401) {
      console.log('🔐 Received 401, attempting token refresh...');
      
      try {
        bearerToken = await this.refreshIdToken();
        
        // Retry the request with new token
        authenticatedOptions.headers = {
          'Content-Type': 'application/json',
          'Authorization': bearerToken,
          ...options.headers,
        };
        
        response = await fetch(url, authenticatedOptions);
        
        // If still 401 after refresh, clear auth
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
      } catch {
        await this.clearAuthData();
        throw new Error('Authentication expired. Please login again.');
      }
    }
    
    return response;
  }
}

// Singleton instance
export const authApiService = new AuthApiService();
import { clearStoredChatUser } from '@/contexts/ChatContext';
import { clearStoredUser } from '@/contexts/UserContext';
import { authApiService } from '@/services/auth/api';
import { GoogleAuthService } from '@/services/auth/google-auth';
import { AuthContextType, AuthState } from '@/types/auth';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const initialState: AuthState = {
  phoneNumber: '',
  otp: '',
  otpToken: '',
  customToken: '',
  bearerToken: '',
  isOtpSent: false,
  isLoading: true, // Start with loading true
  error: '',
  isAuthenticated: false,
  user: undefined,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Initialize authentication state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔐 Initializing authentication...');
      setState(prev => ({ ...prev, isLoading: true }));
      
      // First, check if we have stored tokens and user data
      const [bearerToken, refreshToken, userData, isExpired] = await Promise.all([
        authApiService.getBearerToken(),
        authApiService.getRefreshToken(),
        authApiService.getUserData(),
        authApiService.isTokenExpired(),
      ]);

      console.log('📊 Auth check results:', {
        hasToken: !!bearerToken,
        hasRefreshToken: !!refreshToken,
        hasUserData: !!userData,
        isExpired,
      });

      if (bearerToken) {
        // We have a token - user should be authenticated
        // User data is optional (may not have been stored in older versions)
        
        // If token is expired or about to expire AND we have a refresh token, refresh it
        if (isExpired && refreshToken) {
          console.log('🔄 Token expired on startup, refreshing...');
          try {
            const newToken = await authApiService.refreshIdToken();
            console.log('✅ Token refreshed successfully on startup');
            setState(prev => ({
              ...prev,
              bearerToken: newToken,
              user: userData || undefined,
              isAuthenticated: true,
              isLoading: false,
            }));
          } catch (error) {
            // If refresh fails, clear auth and show login
            console.error('❌ Failed to refresh token on startup:', error);
            await authApiService.clearAuthData();
            setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
          }
        } else {
          // Token is still valid OR it's a legacy token without refresh capability
          if (!userData) {
            console.log('⚠️ Token found but no user data - keeping user logged in anyway');
          } else if (!refreshToken) {
            console.log('⚠️ Legacy token detected (no refresh token) - keeping user logged in');
          } else {
            console.log('✅ Valid token found, user authenticated');
          }
          setState(prev => ({
            ...prev,
            bearerToken,
            user: userData || undefined,
            isAuthenticated: true,
            isLoading: false,
          }));
        }
      } else {
        console.log('ℹ️ No stored tokens found, user needs to login');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to initialize authentication',
      }));
    }
  };

  const sendOtp = useCallback(async (phoneNumber: string) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: '', 
        phoneNumber: phoneNumber.trim(),
      }));

      const response = await authApiService.sendOtp({
        phone: phoneNumber.trim(),
        reason: 'loginOrRegister',
      });

      if (response.msg==='success') {
        setState(prev => ({
          ...prev,
          otpToken: response.model.token,
          isOtpSent: true,
          isLoading: false,
        }));
      } else {
        throw new Error(response.msg || 'Failed to send OTP');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      }));
      throw error;
    }
  }, []);

  const verifyOtp = useCallback(async (otpCode: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: '', otp: otpCode }));

      // Step 1: Verify OTP with backend
      const verifyResponse = await authApiService.verifyOtp({
        token: state.otpToken,
        otp: otpCode,
        phone: state.phoneNumber,
        reason: 'loginOrRegister',
        isOtpAutoFilled: false,
        isGoogleLogin:false,
        idToken: undefined,
      });

      if (verifyResponse.msg !== 'success') {
        throw new Error(verifyResponse.msg || 'Invalid OTP');
      }

      // Step 2: Exchange custom token for Firebase ID token
      const exchangeResponse = await authApiService.exchangeCustomTokenForBearer(
        verifyResponse.model.customToken
      );

      // Step 3: Store tokens and user data
      await Promise.all([
        authApiService.storeBearerToken(
          exchangeResponse.idToken,
          exchangeResponse.refreshToken,
          exchangeResponse.expiresIn
        ),
        verifyResponse.model.user ? 
          authApiService.storeUserData(verifyResponse.model.user) : 
          Promise.resolve(),
      ]);

      setState(prev => ({
        ...prev,
        customToken: verifyResponse.model.customToken,
        bearerToken: `Bearer ${exchangeResponse.idToken}`,
        user: verifyResponse.model.user,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      }));
      throw error;
    }
  }, [state.otpToken, state.phoneNumber]);

  const resendOtp = useCallback(async () => {
    if (!state.phoneNumber) {
      throw new Error('Phone number not available');
    }
    await sendOtp(state.phoneNumber);
  }, [state.phoneNumber, sendOtp]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: '' }));

      // Step 1: Get Google ID token
      const googleIdToken = await GoogleAuthService.signIn();

      // Step 2: Verify Google token with backend
      const verifyResponse = await authApiService.verifyGoogleToken(googleIdToken);

      if (verifyResponse.msg !== 'success') {
        throw new Error(verifyResponse.msg || 'Failed to verify Google login');
      }

      // Step 3: Exchange custom token for Firebase ID token
      const exchangeResponse = await authApiService.exchangeCustomTokenForBearer(
        verifyResponse.model.customToken
      );

      // Step 4: Store tokens and user data
      await Promise.all([
        authApiService.storeBearerToken(
          exchangeResponse.idToken,
          exchangeResponse.refreshToken,
          exchangeResponse.expiresIn
        ),
        verifyResponse.model.user ? 
          authApiService.storeUserData(verifyResponse.model.user) : 
          Promise.resolve(),
      ]);

      setState(prev => ({
        ...prev,
        customToken: verifyResponse.model.customToken,
        bearerToken: `Bearer ${exchangeResponse.idToken}`,
        user: verifyResponse.model.user,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sign in with Google',
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      void authApiService.revokeSession();
      await Promise.all([
        authApiService.clearAuthData(),
        GoogleAuthService.signOut(),
        clearStoredUser(),
        clearStoredChatUser(),
      ]);
      
      setState({
        ...initialState,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to sign out:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to sign out',
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: '' }));
  }, []);

  const resetAuthFlow = useCallback(() => {
    setState(prev => ({
      ...prev,
      phoneNumber: '',
      otp: '',
      otpToken: '',
      isOtpSent: false,
      error: '',
    }));
  }, []);

  const handleAuthError = useCallback(async (error: Error) => {
    console.error('🔐 Authentication error detected:', error.message);
    
    // Check if it's an auth-related error
    if (
      error.message.includes('Authentication expired') ||
      error.message.includes('Session expired') ||
      error.message.includes('No authentication token')
    ) {
      // Sign out and clear all auth data
      await authApiService.clearAuthData();
      setState(prev => ({
        ...initialState,
        isLoading: false,
        error: error.message,
      }));
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    sendOtp,
    verifyOtp,
    resendOtp,
    signInWithGoogle,
    signOut,
    clearError,
    resetAuthFlow,
    handleAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
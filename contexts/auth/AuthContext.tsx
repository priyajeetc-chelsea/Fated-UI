import { authApiService } from '@/services/auth/api';
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
      setState(prev => ({ ...prev, isLoading: true }));
      
      // First, check if we have stored tokens and user data
      const [bearerToken, userData] = await Promise.all([
        authApiService.getBearerToken(),
        authApiService.getUserData(),
      ]);

      // If no tokens exist, user needs to login
      if (!bearerToken || !userData) {
        console.log('🔒 No stored credentials found - user needs to login');
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Tokens exist, now check if the session has expired (48 hours of inactivity)
      const isSessionValid = await authApiService.checkAuthExpiration();
      
      if (!isSessionValid) {
        // Session expired, clear everything and show login
        console.log('⏰ Session expired - user needs to login again');
        await authApiService.clearAuthData();
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      // Session is valid, restore authenticated state
      console.log('✅ Valid session found - restoring authentication');
      setState(prev => ({
        ...prev,
        bearerToken,
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to initialize auth:', error);
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
        authApiService.storeBearerToken(exchangeResponse.idToken),
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

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await authApiService.clearAuthData();
      
      setState(initialState);
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

  const value: AuthContextType = {
    ...state,
    sendOtp,
    verifyOtp,
    resendOtp,
    signOut,
    clearError,
    resetAuthFlow,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
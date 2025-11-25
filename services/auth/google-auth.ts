import { AuthConfig } from '@/services/auth/config';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete the authentication session for web
WebBrowser.maybeCompleteAuthSession();

export class GoogleAuthService {
  /**
   * Initialize Google Sign-In for the current platform
   */
  static async signIn(): Promise<string> {
    if (Platform.OS === 'web') {
      return await this.signInWeb();
    } else {
      return await this.signInNative();
    }
  }

  /**
   * Sign in with Google using expo-auth-session (Web)
   */
  private static async signInWeb(): Promise<string> {
    try {
      console.log('🌐 Starting Google Sign-In for Web...');

      const redirectUri = AuthSession.makeRedirectUri({
        preferLocalhost: true,
        path: 'auth/callback',
      });

      console.log('📍 Redirect URI:', redirectUri);

      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      // Generate a nonce for security (required for id_token response type)
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString() + Date.now().toString()
      );

      // For web, we need to use implicit flow (id_token) without PKCE
      const authRequest = new AuthSession.AuthRequest({
        clientId: AuthConfig.GOOGLE_WEB_CLIENT_ID,
        redirectUri,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken,
        usePKCE: false, // Disable PKCE for web OAuth
        extraParams: {
          access_type: 'online',
          prompt: 'select_account',
          nonce: nonce, // Required for id_token response type
        },
      });

      const result = await authRequest.promptAsync(discovery);

      if (result.type === 'success') {
        const { params } = result;
        if (!params.id_token) {
          throw new Error('No ID token received from Google');
        }
        
        console.log('✅ Google Sign-In successful (Web)');
        return params.id_token;
      } else if (result.type === 'error') {
        console.error('❌ OAuth Error:', result.error);
        throw new Error(result.error?.message || 'Google Sign-In failed');
      } else {
        throw new Error('Google Sign-In was cancelled');
      }
    } catch (error) {
      console.error('❌ Google Sign-In failed (Web):', error);
      throw error;
    }
  }

  /**
   * Sign in with Google using @react-native-google-signin (iOS/Android)
   */
  private static async signInNative(): Promise<string> {
    try {
      console.log('📱 Starting Google Sign-In for Native...');
      
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');

      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: AuthConfig.GOOGLE_WEB_CLIENT_ID,
        iosClientId: AuthConfig.GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
      });

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.data?.idToken) {
        throw new Error('No ID token received from Google');
      }

      console.log('✅ Google Sign-In successful (Native)');
      return userInfo.data.idToken;
    } catch (error: any) {
      console.error('❌ Google Sign-In failed (Native):', error);
      
      // Handle specific error cases
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Google Sign-In was cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Google Sign-In already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      }
      
      throw error;
    }
  }

  /**
   * Sign out from Google
   */
  static async signOut(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
        console.log('✅ Signed out from Google');
      }
    } catch (error) {
      console.error('❌ Failed to sign out from Google:', error);
      // Don't throw error, as sign out from Google is not critical
    }
  }
}

import { authApiService } from '@/services/auth/api';

/**
 * Debug utilities for authentication and token management
 * Use these functions in development to troubleshoot auth issues
 */

/**
 * Log current authentication status and token information
 */
export async function logAuthStatus() {
  console.log('📊 ===== AUTH STATUS =====');
  
  try {
    const [bearerToken, refreshToken, userData] = await Promise.all([
      authApiService.getBearerToken(),
      authApiService.getRefreshToken(),
      authApiService.getUserData(),
    ]);
    
    const isExpired = await authApiService.isTokenExpired();
    
    console.log('Bearer Token:', bearerToken ? '✅ Present' : '❌ Missing');
    console.log('Refresh Token:', refreshToken ? '✅ Present' : '❌ Missing');
    console.log('User Data:', userData ? '✅ Present' : '❌ Missing');
    console.log('Token Expired:', isExpired ? '⚠️ Yes (or expiring soon)' : '✅ No');
    
    if (userData) {
      console.log('User:', userData);
    }
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
  }
  
  console.log('========================\n');
}

/**
 * Clear all authentication data (useful for testing login flow)
 */
export async function clearAuth() {
  console.log('🗑️ Clearing all authentication data...');
  try {
    await authApiService.clearAuthData();
    console.log('✅ Auth data cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear auth data:', error);
  }
}

/**
 * Test token refresh functionality
 */
export async function testTokenRefresh() {
  console.log('🔄 Testing token refresh...');
  
  try {
    const hadToken = await authApiService.getBearerToken();
    if (!hadToken) {
      console.log('❌ No bearer token found. Please login first.');
      return;
    }
    
    console.log('Attempting to refresh token...');
    const newToken = await authApiService.refreshIdToken();
    console.log('✅ Token refreshed successfully!');
    console.log('New token:', newToken.substring(0, 30) + '...');
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
  }
}

/**
 * Example usage in a component or debug screen:
 * 
 * import { logAuthStatus, clearAuth, testTokenRefresh } from '@/utils/auth-debug';
 * 
 * // Check current auth status
 * await logAuthStatus();
 * 
 * // Test token refresh
 * await testTokenRefresh();
 * 
 * // Clear auth (for testing)
 * await clearAuth();
 */

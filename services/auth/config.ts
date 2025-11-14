/**
 * Authentication Configuration
 * 
 * This file contains configuration settings for the authentication system.
 * You can modify these settings to control how authentication works in development vs production.
 */

export const AuthConfig = {
  /**
   * Force mock API usage
   * Set to true to always use mock API (useful for testing)
   * Set to false to use real API
   * Set to 'auto' to automatically use mock in development and real in production
   */
  USE_MOCK_API: false, // Changed to false to use real API

  /**
   * Mock OTP for testing
   * When using mock API, this is the OTP that will be accepted
   */
  MOCK_OTP: '123456',

  /**
   * API endpoints
   */
  API_BASE_URL: 'https://xfcy5ocgsl.execute-api.ap-south-1.amazonaws.com/staging',
  FIREBASE_API_KEY: 'AIzaSyCuyHSwvzJFoZihnUjjrxfyt6U45ZYAOd4',

  /**
   * Development settings
   */
  ENABLE_DEBUG_LOGS: true, // Always show debug logs for real API testing
  ENABLE_CORS_FALLBACK: false, // Keep disabled to force real API usage
  
  /**
   * Debug settings - helps identify token source
   */
  LOG_TOKEN_SOURCE: true, // Log whether using real or mock tokens
  
  /**
   * Real API testing settings
   */
  FORCE_REAL_API: true, // Force real API even if CORS errors occur
};
import { useAuth } from '@/contexts/auth/AuthContext';
import { useCallback } from 'react';

/**
 * Hook to handle API errors globally, especially authentication errors
 */
export function useApiErrorHandler() {
  const { handleAuthError } = useAuth();

  const handleError = useCallback(
    async (error: unknown) => {
      if (error instanceof Error) {
        // Handle authentication errors
        if (
          error.message.includes('Authentication expired') ||
          error.message.includes('Session expired') ||
          error.message.includes('No authentication token') ||
          error.message.includes('401')
        ) {
          await handleAuthError(error);
          return;
        }

        // Log other errors
        console.error('API Error:', error.message);
      }
    },
    [handleAuthError]
  );

  return { handleError };
}

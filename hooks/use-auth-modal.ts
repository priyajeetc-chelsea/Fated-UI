import { useAuth } from '@/contexts/auth/AuthContext';
import { useState } from 'react';

export function useAuthModal() {
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const { isAuthenticated } = useAuth();

  const showAuthModal = () => {
    setIsAuthModalVisible(true);
  };

  const hideAuthModal = () => {
    setIsAuthModalVisible(false);
  };

  const requireAuth = (callback: () => void) => {
    if (isAuthenticated) {
      callback();
    } else {
      showAuthModal();
    }
  };

  return {
    isAuthModalVisible,
    showAuthModal,
    hideAuthModal,
    requireAuth,
    isAuthenticated,
  };
}
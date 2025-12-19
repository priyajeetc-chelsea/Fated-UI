import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email?: string;
  photoUrls?: string[];
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
  updateUserPhotos: (photoUrls: string[]) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@fated_current_user';

// Utility function to clear user data (can be called from anywhere)
export const clearStoredUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    console.log('👤 clearStoredUser: User data and cached photos cleared from storage');
  } catch (error) {
    console.error('👤 clearStoredUser: Failed to clear user from storage:', error);
  }
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          const user = JSON.parse(storedUser);
          console.log('👤 UserContext: Loaded user from storage:', {
            id: user.id,
            name: user.name,
            hasPhotos: user.photoUrls ? user.photoUrls.length : 0
          });
          setCurrentUser(user);
        } else {
          console.log('👤 UserContext: No stored user found');
        }
      } catch (error) {
        console.error('👤 UserContext: Failed to load user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Wrap setCurrentUser to add logging and persist to storage
  const setCurrentUserWithLogging = async (user: User | null) => {
    console.log('👤 UserContext: setCurrentUser called with:', user);
    setCurrentUser(user);
    
    // Persist to AsyncStorage
    try {
      if (user) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        console.log('👤 UserContext: User saved to storage');
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        console.log('👤 UserContext: User removed from storage');
      }
    } catch (error) {
      console.error('👤 UserContext: Failed to save user to storage:', error);
    }
  };

  // Update user photos without changing other data
  const updateUserPhotos = async (photoUrls: string[]) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, photoUrls };
      setCurrentUser(updatedUser);
      
      // Persist to AsyncStorage
      try {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      } catch (error) {
        console.error('📸 UserContext: Failed to save user photos to storage:', error);
      }
    }
  };

  const value: UserContextType = {
    currentUser,
    setCurrentUser: setCurrentUserWithLogging,
    isLoading,
    updateUserPhotos,
  };

  console.log('👤 UserContext: Rendering with currentUser =', currentUser, 'isLoading =', isLoading);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
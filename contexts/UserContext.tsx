import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email?: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

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

  useEffect(() => {
    // User will be set dynamically from the homepage API response
    // No hardcoded initialization needed
    setIsLoading(false);
  }, []);

  // Wrap setCurrentUser to add logging
  const setCurrentUserWithLogging = (user: User | null) => {
    console.log('👤 UserContext: setCurrentUser called with:', user);
    setCurrentUser(user);
  };

  const value: UserContextType = {
    currentUser,
    setCurrentUser: setCurrentUserWithLogging,
    isLoading,
  };

  console.log('👤 UserContext: Rendering with currentUser =', currentUser);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
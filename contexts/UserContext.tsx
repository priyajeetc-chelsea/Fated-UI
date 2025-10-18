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
    // Initialize with a mock user for now
    // In a real app, this would come from authentication
    setCurrentUser({
      id: 101,
      name: 'Current User',
      email: 'user@example.com',
    });
    setIsLoading(false);
  }, []);

  const value: UserContextType = {
    currentUser,
    setCurrentUser,
    isLoading,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
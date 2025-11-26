import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface ChatUser {
  userId: number;
  userName: string;
  userPhoto: string;
  matchUserId?: number;
  isFinalMatch: boolean;
  isPotentialMatch: boolean;
}

interface ChatContextType {
  activeChatUser: ChatUser | null;
  setActiveChatUser: (user: ChatUser | null) => void;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_STORAGE_KEY = '@fated_active_chat_user';

// Utility function to clear chat data
export const clearStoredChatUser = async () => {
  try {
    await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
    console.log('💬 clearStoredChatUser: Chat user data cleared from storage');
  } catch (error) {
    console.error('💬 clearStoredChatUser: Failed to clear chat user from storage:', error);
  }
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load chat user from AsyncStorage on mount
  useEffect(() => {
    const loadChatUser = async () => {
      try {
        const storedChatUser = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (storedChatUser) {
          const chatUser = JSON.parse(storedChatUser);
          setActiveChatUser(chatUser);
        } else {
          console.log('💬 ChatContext: No stored chat user found');
        }
      } catch (error) {
        console.error('💬 ChatContext: Failed to load chat user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatUser();
  }, []);

  // Wrap setActiveChatUser to add logging and persist to storage
  const setActiveChatUserWithLogging = useCallback(async (user: ChatUser | null) => {
    setActiveChatUser(user);
    
    // Persist to AsyncStorage
    try {
      if (user) {
        await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
      }
    } catch (error) {
      console.error('💬 ChatContext: Failed to save chat user to storage:', error);
    }
  }, []);

  const value: ChatContextType = {
    activeChatUser,
    setActiveChatUser: setActiveChatUserWithLogging,
    isLoading,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

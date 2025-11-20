import { useUser } from '@/contexts/UserContext';
import { useChat } from '@/hooks/use-chat';
import { ChatMessage } from '@/services/chat-api';
import { webSocketService } from '@/services/websocket';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse params
  const { currentUser } = useUser();
  
  const otherUserId = parseInt(params.userId as string);
  const otherUserName = params.userName as string;
  const otherUserPhoto = params.userPhoto as string;
  const matchUserId = params.matchUserId ? parseInt(params.matchUserId as string) : otherUserId;
  const isFinalMatch = params.isFinalMatch === 'true';
  const isPotentialMatch = params.isPotentialMatch === 'true';
  
  // Use currentUser.id directly - will be set from homepage response
  // Show loading screen if user is not yet loaded
  const currentUserId = currentUser?.id || 0;

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // Wait for currentUser to be loaded before initializing chat
  // This prevents issues when navigating to chat before homepage loads
  const chatEnabled = currentUserId > 0;

  console.log('💬 ChatScreen: currentUserId =', currentUserId, 'chatEnabled =', chatEnabled);

  const {
    messages,
    isConnected,
    isLoading,
    hasMoreMessages,
    isSending,
    isLoadingMore,
    sendMessage,
    loadMoreMessages,
    retryFailedMessage,
    markMessagesAsRead,
  } = useChat({
    currentUserId,
    otherUserId,
    isFinalMatch,
    isPotentialMatch,
    enabled: chatEnabled, // Only enable chat when we have a valid currentUserId
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !isUserScrolledUp) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isUserScrolledUp]);

  // Auto-scroll to bottom when chat screen first loads (to show latest messages)
  const hasMessages = messages.length > 0;
  useEffect(() => {
    if (hasMessages) {
      setIsUserScrolledUp(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 300);
    }
  }, [hasMessages]); // Trigger only when messages are first loaded

  // Auto-scroll when starting to type (focus on input)
  const handleInputFocus = () => {
    setIsUserScrolledUp(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Mark messages as read when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Mark messages as read when chat screen is focused
      setTimeout(() => {
        markMessagesAsRead();
      }, 500);
    }, [markMessagesAsRead])
  );

  // Force cleanup when component unmounts (navigating away)
  useEffect(() => {
    return () => {
      webSocketService.forceDisconnectAndReset();
    };
  }, []);

  // Handle back navigation with forced cleanup
  const handleBackPress = () => {
    console.log('📱 Back button pressed - forcing WebSocket cleanup');
    webSocketService.forceDisconnectAndReset();
    router.back();
  };

  // Navigate to user profile
  const handleProfilePress = () => {
    if (isFinalMatch) {
      // For confirmed matches, navigate to their profile
      router.push({
        pathname: '/matches/user-profile-page',
        params: {
          userBId: matchUserId.toString(),
          isConfirmedMatch: 'true', // Flag to hide action buttons
        },
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const message = inputText.trim();
    setInputText('');
    
    // Auto-scroll to bottom when sending a message
    setIsUserScrolledUp(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    const success = await sendMessage(message);
    if (!success) {
      Alert.alert('Failed to send message', 'Please check your connection and try again.');
    }
    
    // Ensure scroll to bottom after message is sent
    setIsUserScrolledUp(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isLastMessage = index === messages.length - 1;
    const isConsecutive = index > 0 && messages[index - 1].isSent === message.isSent;

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isSent ? styles.sentMessageContainer : styles.receivedMessageContainer,
          !isConsecutive && styles.messageSpacing,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            message.isSent ? styles.sentMessage : styles.receivedMessage,
          ]}
        >
          <Text style={[
            styles.messageText,
            message.isSent ? styles.sentMessageText : styles.receivedMessageText,
          ]}>
            {message.content}
          </Text>
          
          {message.isSent && (
            <View style={styles.messageStatus}>
              {message.status === 'sending' && (
                <ActivityIndicator size="small" color="#999" />
              )}
              {message.status === 'delivered' && (
                <Ionicons name="checkmark" size={16} color="#999" />
              )}
              {message.status === 'read' && (
                <Ionicons name="checkmark-done" size={16} color="#4CAF50" />
              )}
              {message.status === 'failed' && (
                <TouchableOpacity onPress={() => retryFailedMessage(message.id)}>
                  <Ionicons name="alert-circle" size={16} color="#FF5252" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {isLastMessage && message.isSent && (
          <Text style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading || !chatEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.headerUserInfo}>
            {otherUserPhoto && (
              <Image 
                source={{ uri: otherUserPhoto }} 
                style={styles.headerPhoto}
              />
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{otherUserName}</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004242" />
          <Text style={styles.loadingText}>
            {!chatEnabled ? 'Setting up chat...' : 'Loading chat...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          {/* User Photo and Name - Clickable for confirmed matches */}
          <TouchableOpacity 
            style={styles.headerUserInfo}
            onPress={handleProfilePress}
            disabled={!isFinalMatch}
            activeOpacity={isFinalMatch ? 0.6 : 1}
          >
            {otherUserPhoto && (
              <Image 
                source={{ uri: otherUserPhoto }} 
                style={styles.headerPhoto}
              />
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{otherUserName}</Text>
              {isFinalMatch && (
                <Text style={styles.headerSubtitle}>Tap to view profile</Text>
              )}
            </View>
          </TouchableOpacity>
          
          {__DEV__ && (
            <Text style={{ fontSize: 10, color: '#999' }}>
              {otherUserId}
            </Text>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingMore}
              onRefresh={loadMoreMessages}
              enabled={hasMoreMessages}
              colors={['#004242']}
              tintColor="#004242"
            />
          }
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const isAtTop = contentOffset.y <= 0;
            const bottomThreshold = Math.max(contentSize.height - layoutMeasurement.height - 50, 0);
            const isAtBottom = contentOffset.y >= bottomThreshold;

            setIsUserScrolledUp((prev) => {
              const next = !isAtBottom;
              return prev === next ? prev : next;
            });

            if (isAtTop && hasMoreMessages && !isLoadingMore) {
              loadMoreMessages();
            }
          }}
          scrollEventThrottle={400}
        >
          {isLoadingMore && (
            <View style={styles.loadMoreIndicator}>
              <ActivityIndicator size="small" color="#004242" />
            </View>
          )}
          
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#999" />
              <Text style={styles.emptyStateText}>No messages yet</Text>
              <Text style={styles.emptyStateSubtext}>Send a message to start the conversation!</Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onFocus={handleInputFocus}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
              editable={isConnected}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isSending || !isConnected) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending || !isConnected}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  loadMoreIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 2,
  },
  messageSpacing: {
    marginTop: 16,
  },
  sentMessageContainer: {
    alignItems: 'flex-end',
  },
  receivedMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  sentMessage: {
    backgroundColor: '#004242',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#000',
  },
  messageStatus: {
    marginLeft: 8,
    marginBottom: -2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginRight: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 80,
    paddingVertical: 8,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#004242',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
import { useUser } from '@/contexts/UserContext';
import { useChat } from '@/hooks/use-chat';
import { ChatMessage } from '@/services/chat-api';
import { webSocketService } from '@/services/websocket';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface PotentialMatch {
  id: string;
  name: string;
  photo?: string;
  type: 'likesYou' | 'mutualLike';
  likedOpinion: {
    id: string;
    content: string;
    comment?: string;
  };
  waitingForMatchResponse?: boolean;
}

interface PotentialMatchModalProps {
  visible: boolean;
  potentialMatch: PotentialMatch | null;
  onClose: () => void;
  onLikeOpinion?: (matchUserId: string) => void;
  onLikeProfile?: (matchUserId: string) => void;
}

export function PotentialMatchModal({ 
  visible, 
  potentialMatch, 
  onClose, 
  onLikeOpinion, 
  onLikeProfile
}: PotentialMatchModalProps) {
  const { currentUser } = useUser();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<ScrollView>(null);

  // Initialize chat when modal opens and potentialMatch is available
  const chatConfig = {
    currentUserId: currentUser?.id || 101,
    otherUserId: potentialMatch?.id ? parseInt(potentialMatch.id) : 0,
    isFinalMatch: false,
    isPotentialMatch: true,
  };

  // Only initialize chat when modal is visible and we have a valid otherUserId
  const shouldEnableChat = visible && potentialMatch && chatConfig.otherUserId > 0;

  const {
    messages,
    isConnected,
    isReconnecting,
    isSending,
    isLoadingMore,
    sendMessage,
    retryFailedMessage,
    markMessagesAsRead,
  } = useChat({
    ...chatConfig,
    enabled: shouldEnableChat || false,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Mark messages as read when modal becomes visible or messages change
  useEffect(() => {
    if (visible && shouldEnableChat && messages.length > 0) {
      setTimeout(() => {
        markMessagesAsRead();
      }, 500);
    }
  }, [visible, shouldEnableChat, messages.length, markMessagesAsRead]);

  // Force cleanup when modal closes
  useEffect(() => {
    if (!visible) {
      console.log('🔄 PotentialMatchModal closed - forcing WebSocket cleanup');
      webSocketService.forceDisconnectAndReset();
    }
  }, [visible]);

  const handleLikeOpinion = () => {
    if (potentialMatch && onLikeOpinion) {
      // Close modal first, then navigate
      onClose();
      // Use setTimeout to ensure modal closes before navigation
      setTimeout(() => {
        onLikeOpinion(potentialMatch.id);
      }, 100);
    }
  };

  const handleLikeProfile = () => {
    if (potentialMatch && onLikeProfile) {
      // Close modal first, then navigate
      onClose();
      // Use setTimeout to ensure modal closes before navigation
      setTimeout(() => {
        onLikeProfile(potentialMatch.id);
      }, 100);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const message = inputText.trim();
    setInputText('');
    
    const success = await sendMessage(message);
    if (!success) {
      Alert.alert('Failed to send message', 'Please check your connection and try again.');
    }
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

  const ConnectionIndicator = () => {
    const getConnectionColor = () => {
      if (isConnected) return '#4CAF50'; // Green - connected
      if (isReconnecting) return '#FF9800'; // Orange - reconnecting
      return '#FF5252'; // Red - disconnected
    };

    const getConnectionText = () => {
      if (isConnected) return 'Connected';
      if (isReconnecting) return 'Reconnecting...';
      return 'Disconnected';
    };

    return (
      <View style={[
        styles.connectionIndicator,
        { backgroundColor: getConnectionColor() }
      ]}>
        <View style={styles.connectionDot} />
        <Text style={styles.connectionText}>
          {getConnectionText()}
        </Text>
      </View>
    );
  };

  if (!potentialMatch) return null;

  // Check if this is a locked state (likes you but not matched yet)
  const isLocked = potentialMatch.type === 'likesYou' && !potentialMatch.waitingForMatchResponse;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header with user name */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{potentialMatch.name}</Text>
            <View style={styles.headerRight}>
              {shouldEnableChat && (!isConnected || isReconnecting) && <ConnectionIndicator />}
            </View>
          </View>

          {/* Single continuous scrollable content */}
          <ScrollView 
            ref={mainScrollRef}
            style={styles.content} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            {/* User Info */}
            <View style={styles.userSection}>
              {isLocked ? (
                <View style={styles.lockedSection}>
                  <View style={styles.blurredPhotoContainer}>
                    <Ionicons name="person" size={40} color="#333" />
                  </View>
                  <View style={styles.unlockSection}>
                    <Text style={styles.unlockText}>Please like an opinion of this user to unlock match and view each other&apos;s profile</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Image source={{ uri: potentialMatch.photo }} style={styles.profilePhoto} />
                  {potentialMatch.waitingForMatchResponse?null:<View style={styles.unlockSection}>
                    <Text style={styles.unlockText}>Please like the profile of this user to unlock final match</Text>
                  </View>}
                  
                </>
              )}
            </View>

            {/* Opinion Card - Full text visible, no clipping */}
            <View style={styles.opinionCard}>
              
              {/* Full opinion text without clipping */}
              <Text style={styles.opinionText}>{potentialMatch.likedOpinion.content}</Text>
              
              {potentialMatch.likedOpinion.comment && (
                <View style={styles.commentSection}>
                  <Text style={styles.commentLabel}>Their comment:</Text>
                  <Text style={styles.commentText}>{potentialMatch.likedOpinion.comment}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons or Waiting Message */}
            {potentialMatch.waitingForMatchResponse ? (
              <View style={styles.waitingSection}>
                <Ionicons name="hourglass-outline" size={24} color="#9966CC" />
                <Text style={styles.waitingText}>Waiting for them to like you back...</Text>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                {potentialMatch.type === 'likesYou' ? (
                  <TouchableOpacity 
                    style={styles.likeButton} 
                    onPress={handleLikeOpinion}
                  >
                    <Text style={styles.likeButtonText}> <Ionicons name="heart" size={20} color="white" /> Like Opinion</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.likeButton} 
                    onPress={handleLikeProfile}
                  >
                    <Text style={styles.likeButtonText}><Ionicons name="heart" size={20} color="white" /> Like Profile</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.profileButton} 
                  onPress={onClose}
                >
                  <Text style={styles.profileButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Chat Messages - Continuous with above content */}
            {shouldEnableChat && (
              <>
                <View style={styles.chatDivider}>
                  <Text style={styles.chatDividerText}>Messages</Text>
                </View>
                
                {isLoadingMore && (
                  <View style={styles.loadMoreIndicator}>
                    <ActivityIndicator size="small" color="#9966CC" />
                  </View>
                )}
                
                {/* Regular chat messages */}
                {messages.map((message, index) => renderMessage(message, index))}
                
                {messages.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#999" />
                    <Text style={styles.emptyStateText}>No messages yet</Text>
                    <Text style={styles.emptyStateSubtext}>Send a message to start the conversation!</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Input Container - Fixed at bottom when chat is enabled */}
          {shouldEnableChat && (
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type a message..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={1000}
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || isSending) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  lockedSection: {
    alignItems: 'center',
  },
  blurredPhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  matchInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  opinionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  opinionHeader: {
    marginBottom: 16,
  },
  opinionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9966CC',
    textAlign: 'center',
  },
  opinionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'left',
  },
  commentSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  likeButton: {
    flex: 1,
    backgroundColor: '#9966CC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
  },
  likeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
  },
  profileButtonText: {
    color: '#9966CC',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f0ff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  waitingText: {
    fontSize: 16,
    color: '#9966CC',
    fontWeight: '500',
    marginLeft: 12,
  },
  chatDivider: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 20,
  },
  chatDividerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  loadMoreIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  
  // Regular message styles (copied from chat screen)
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
    backgroundColor: '#9966CC',
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
    backgroundColor: '#9966CC',
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
 unlockSection: {
    alignItems: 'center',
    height: 60,
    backgroundColor: '#f5f0ff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  unlockText: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
    color: '#9966CC',
    flexWrap: 'wrap',
  }

});
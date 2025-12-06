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
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
  const mainScrollRef = useRef<ScrollView>(null);
  const previousMessageCountRef = useRef(0);
  const isNearBottomRef = useRef(true);

  // Use currentUser.id directly - will be set from homepage response
  // Default to 0 if not available yet (chat will be disabled)
  const currentUserId = currentUser?.id || 0;

  console.log('🔔 PotentialMatchModal: currentUserId =', currentUserId);

  // Initialize chat when modal opens and potentialMatch is available
  const isLikesYouMatch = potentialMatch?.type === 'likesYou';

  const chatConfig = {
    currentUserId: currentUserId,
    otherUserId: potentialMatch?.id ? parseInt(potentialMatch.id) : 0,
    isFinalMatch: false,
    isPotentialMatch: !isLikesYouMatch,
  };

  // Only initialize chat when modal is visible, we have a valid otherUserId, AND currentUserId is available
  const shouldEnableChat = visible && potentialMatch && chatConfig.otherUserId > 0 && currentUserId > 0;

  const {
    messages,
    isSending,
    isLoadingMore,
    hasMoreMessages,
    sendMessage,
    retryFailedMessage,
    markMessagesAsRead,
    loadMoreMessages,
  } = useChat({
    ...chatConfig,
    enabled: shouldEnableChat || false,
  });

  // Initial scroll to bottom when chat modal first loads (to show latest messages)
  const hasMessages = messages.length > 0;
  useEffect(() => {
    if (visible && hasMessages && previousMessageCountRef.current === 0) {
      setTimeout(() => {
        mainScrollRef.current?.scrollToEnd({ animated: false });
        previousMessageCountRef.current = messages.length;
      }, 300);
    }
  }, [visible, hasMessages, messages.length]);

  // Scroll to bottom only when NEW messages arrive (not when loading old ones)
  useEffect(() => {
    if (!visible || !shouldEnableChat || messages.length === 0) return;
    
    const previousCount = previousMessageCountRef.current;
    const currentCount = messages.length;
    
    // Only scroll if:
    // 1. Message count increased (new message, not initial load)
    // 2. User is near the bottom of the chat
    // 3. Not loading more messages (which adds to the beginning)
    if (currentCount > previousCount && previousCount > 0 && isNearBottomRef.current && !isLoadingMore) {
      setTimeout(() => {
        mainScrollRef.current?.scrollToEnd({ animated: true });
        setShowScrollToBottomButton(false);
      }, 100);
    }
    
    previousMessageCountRef.current = currentCount;
  }, [messages.length, visible, shouldEnableChat, isLoadingMore]);

  // Handle input focus
  const handleInputFocus = () => {
    // Input focus handler - removed auto-scroll functionality
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    mainScrollRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottomButton(false);
  };

  // Mark messages as read when modal becomes visible or messages change
  useEffect(() => {
    if (visible && shouldEnableChat && messages.length > 0) {
      setTimeout(() => {
        markMessagesAsRead();
      }, 500);
    }
  }, [visible, shouldEnableChat, messages.length, markMessagesAsRead]);

  // Handle modal visibility changes
  useEffect(() => {
    if (!visible) {
      console.log('🔄 PotentialMatchModal closed - removing connection reference');
      // Don't force disconnect, just remove reference to allow proper cleanup
      webSocketService.removeConnectionReference();
    } else if (visible && shouldEnableChat) {
      console.log('🔄 PotentialMatchModal opened - ensuring connection');
      // When modal opens, ensure we have a fresh connection
      webSocketService.addConnectionReference(currentUserId);
    }
  }, [visible, shouldEnableChat, currentUserId]);

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
    setShowScrollToBottomButton(false); // Hide button when sending
    
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


  if (!potentialMatch) return null;

  // Check if this is a locked state (likes you but not matched yet)
  const isLocked = potentialMatch.type === 'likesYou' && !potentialMatch.waitingForMatchResponse;

  return (
    //If you need to change the deprecated safeAreaView, change modal presentation style
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Header with user name */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerUserInfo}>
              {potentialMatch.photo ? (
                <Image
                  source={{ uri: potentialMatch.photo }}
                  style={styles.headerPhoto}
                />
              ) : (
                <View style={styles.headerPhotoPlaceholder}>
                  <Ionicons
                    name={potentialMatch.type === 'likesYou' ? 'lock-closed' : 'person'}
                    size={18}
                    color="#666"
                  />
                </View>
              )}
              <Text style={styles.headerTitle} numberOfLines={1}>
                {potentialMatch.name}
              </Text>
            </View>
          </View>

          {/* Single continuous scrollable content */}
          <ScrollView 
            ref={mainScrollRef}
            style={styles.content} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              shouldEnableChat ? (
                <RefreshControl
                  refreshing={isLoadingMore}
                  onRefresh={loadMoreMessages}
                  enabled={hasMoreMessages}
                  colors={['#4B164C']}
                  tintColor="#4B164C"
                />
              ) : undefined
            }
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              const isAtTop = contentOffset.y <= 0;
              const bottomThreshold = Math.max(contentSize.height - layoutMeasurement.height - 100, 0);
              const isAtBottom = contentOffset.y >= bottomThreshold;

              // Track if user is near bottom (for auto-scroll on new messages)
              isNearBottomRef.current = isAtBottom;

              // Show/hide scroll to bottom button based on scroll position
              if (shouldEnableChat && messages.length > 0) {
                setShowScrollToBottomButton(!isAtBottom);
              }

              // Load more messages when scrolling to top of chat section (only for chat sections)
              // Only trigger load more if we have messages (meaning we're in the chat section)
              if (shouldEnableChat && isAtTop && hasMoreMessages && !isLoadingMore && messages.length > 0) {
                loadMoreMessages();
              }
            }}
            scrollEventThrottle={400}
          >
            {/* User Info */}
            <View style={styles.userSection}>
              {isLocked ? (
                <View style={styles.lockedSection}>
                
                  <View style={styles.unlockSection}>
                    <Text style={styles.unlockText}>Please like an opinion of this user to unlock match and view each other&apos;s profile</Text>
                  </View>
                </View>
              ) : (
                <>
                  {/* <Image source={{ uri: potentialMatch.photo }} style={styles.profilePhoto} /> */}
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
                <Ionicons name="hourglass-outline" size={24} color="#4B164C" />
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
                    <ActivityIndicator size="small" color="#4B164C" />
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

          {/* Scroll to Bottom Button */}
          {shouldEnableChat && showScrollToBottomButton && (
            <TouchableOpacity
              style={styles.scrollToBottomButton}
              onPress={scrollToBottom}
            >
              <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Input Container - Fixed at bottom when chat is enabled */}
          {shouldEnableChat && (
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
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  headerPhotoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
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
    backgroundColor: '#4B164C',
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
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  waitingText: {
    fontSize: 16,
    color: '#000',
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
  loadMoreIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  
  // Regular message styles (copied from chat screen)
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 16,

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
    backgroundColor: '#4B164C',
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
    backgroundColor: '#4B164C',
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
    height: 70,
    backgroundColor: '#f5f5f5f',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  unlockText: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    color: '#000',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
});
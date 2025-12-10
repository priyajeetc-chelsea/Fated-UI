import { ApiOpinion } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface OpinionModalProps {
  visible: boolean;
  opinion: ApiOpinion | null;
  userName: string;
  onSubmit: (comment: string) => void;
  onClose: () => void;
}

export default function OpinionModal({ visible, opinion, userName, onSubmit, onClose }: OpinionModalProps) {
  const [comment, setComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    onSubmit(comment);
    setComment('');
    setIsExpanded(false);
  };

  const handleClose = () => {
    setComment('');
    setIsExpanded(false);
    onClose();
  };

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Don't render modal if no opinion
  if (!visible || !opinion) return null;

  // Truncate opinion text to 30 words if not expanded
  const words = opinion.text.split(' ');
  const shouldTruncate = words.length > 30;
  const displayText = (!isExpanded && shouldTruncate) 
    ? words.slice(0, 30).join(' ') + '...'
    : opinion.text;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        >
          <View style={{ width: '100%', alignItems: 'center' }}>
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 500 }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
                <View style={styles.modalContainer}>
                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                  >
                    {/* Opinion Card */}
                    <View style={styles.opinionCard}>
                      {/* Header */}
                      <View style={styles.header}>
                        <Text style={styles.userName}>{userName}</Text>
                        {opinion.theme && (
                          <View style={styles.themeTag}>
                            <Text style={styles.themeText}>{opinion.theme}</Text>
                          </View>
                        )}
                      </View>

                      {/* Opinion Text */}
                      <View style={styles.opinionTextContainer}>
                        <Text style={styles.opinionText}>{displayText}</Text>
                        {shouldTruncate && (
                          <TouchableOpacity 
                            onPress={() => setIsExpanded(!isExpanded)}
                            style={styles.readMoreButton}
                          >
                            <Text style={styles.readMoreText}>
                              {isExpanded ? 'Show less' : 'Read more'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Comment Input */}
                    <View style={styles.commentCard}>
                      <TextInput
                        value={comment}
                        onChangeText={setComment}
                        placeholder="your thoughts about this opinion?"
                        placeholderTextColor="#999"
                        style={styles.commentInput}
                        multiline
                        maxLength={200}
                        textAlignVertical="top"
                      />
                      {comment.length > 0 && (
                        <TouchableOpacity
                          style={styles.dismissKeyboardButton}
                          onPress={handleDismissKeyboard}
                        >
                          <Text style={styles.dismissKeyboardText}>✓</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleClose}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                      >
                        <Text style={styles.submitButtonText}>Send Match</Text>
                        <Ionicons name="heart" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  opinionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display Bold' : 'serif',
    flex: 1,
  },
  themeTag: {
    backgroundColor: '#FFCF00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  opinionTextContainer: {
    marginBottom: 8,
  },
  opinionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  readMoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B164C',
  },
  commentCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    minHeight: 100,
    position: 'relative',
  },
  commentInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 80,
    maxHeight: 150,
    paddingRight: 40,
    textAlignVertical: 'top',
  },
  dismissKeyboardButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dismissKeyboardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B164C',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4B164C',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
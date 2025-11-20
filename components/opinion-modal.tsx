import { ApiOpinion } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface OpinionModalProps {
  visible: boolean;
  opinion: ApiOpinion | null;
  userName: string;
  onSubmit: (comment: string) => void;
  onClose: () => void;
}

export default function OpinionModal({ visible, opinion, userName, onSubmit, onClose }: OpinionModalProps) {
  const [comment, setComment] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Scroll down completely to show buttons above keyboard
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Return to centered position when keyboard hides
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ 
            y: 0, 
            animated: true 
          });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  const handleContinue = () => {
    onSubmit(comment);
    setComment(''); // Clear comment after submission
  };

  const handleDoneTyping = () => {
    Keyboard.dismiss();
  };

  const handleClose = () => {
    setComment(''); // Clear comment on cancel
    onClose();
  };

  if (!opinion) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            enabled={true}
          >
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  {/* Opinion Card */}
                  <ThemedView style={[
                    styles.opinionCard,
                    opinion.text.length > 300 && styles.opinionCardLong
                  ]}>
                    <View style={styles.opinionHeader}>
                      <ThemedText style={styles.userName}>{userName}</ThemedText>
                      {opinion.theme && (
                        <View style={styles.themeTag}>
                          <Text style={styles.themeText}>{opinion.theme}</Text>
                        </View>
                      )}
                    </View>
                    
                    {opinion.text.length > 300 ? (
                      <TextInput
                        style={[styles.opinionText, styles.opinionTextContainer]}
                        value={opinion.text}
                        multiline={true}
                        scrollEnabled={true}
                        editable={false}
                        textAlignVertical="top"
                      />
                    ) : (
                      <ThemedText style={styles.opinionTextShort}>
                        {opinion.text}
                      </ThemedText>
                    )}
                    
                   
                  </ThemedView>

                  {/* Comment Section - Outside the opinion card */}
                <View style={styles.commentContainer}>
                  <TextInput
                    value={comment}
                    style={styles.commentSection}
                    onChangeText={setComment}
                    placeholder="your thoughts about this opinion?"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={handleDoneTyping}
                  />
                  <TouchableOpacity
                    style={styles.doneButtonInside}
                    onPress={handleDoneTyping}
                  >
                    <Text style={styles.doneButtonText}>✓</Text>
                  </TouchableOpacity>
                </View>

                {/* Buttons - Outside both cards */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleClose}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.likeProfileButton}
                        onPress={handleContinue}
                    >
                        <Text style={{color: 'white', fontSize: 14, fontWeight: '600'}}>Send Match</Text>
                        <Ionicons name="heart" size={24} color="white" />
                    </TouchableOpacity>
                </View>
                </View>
              </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Changed to f5f5f5 background
  },
  blurView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'transparent',
    marginHorizontal: 20,
  },
  opinionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8, // Reduced margin
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  opinionCardLong: {
    height: 350, // Fixed height only for long opinions
  },
  opinionHeader: {
    marginBottom: 8,
    display: 'flex', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
  },
  userName: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Playfair Display',
  },
  opinionTextContainer: {
    height: 280, // Fixed height for scrollable area (300 - header - tags - padding)
  },
  opinionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  opinionTextShort: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
   themeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '70%',
    backgroundColor:'#FFCF00',//bumble yellow
    overflow: 'hidden',
  },
  themeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  commentSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    backgroundColor: '#f9f9f9',
    color: '#000',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  commentContainer: {
    marginBottom: 8, // Reduced margin
    position: 'relative',
  },
  doneButtonInside: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: 'white',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonText: {
    color: '#000',
    fontSize: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 5,
    marginHorizontal: 8,
    marginBottom: 8, // Reduced margin
  },
  likeProfileButton: {
    flex: 1,
    backgroundColor: '#004242', // Purple color
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'black',
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  }
});
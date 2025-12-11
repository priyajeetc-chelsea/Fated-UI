import { ApiOpinion } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

interface OpinionModalProps {
  visible: boolean;
  opinion: ApiOpinion | null;
  userName: string;
  onSubmit: (comment: string) => void;
  onClose: () => void;
}

export default function OpinionModal({ visible, opinion, userName, onSubmit, onClose }: OpinionModalProps) {
  const [comment, setComment] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('📊 OpinionModal props - visible:', visible, 'opinion:', opinion?.id, 'userName:', userName);
  }, [visible, opinion, userName]);

  // Keyboard visibility listeners
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        // Scroll to show comment box above keyboard
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSubmit = () => {
    onSubmit(comment);
    setComment('');
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setComment('');
    setIsKeyboardVisible(false);
    onClose();
  };

  // Don't render modal if no opinion
  if (!visible || !opinion) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            {/* Header with Close button */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Scrollable Content */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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

              {/* Opinion Text - Full text scrollable */}
              <Text style={styles.opinionText}>{opinion.text}</Text>
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
                maxLength={300}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              <TouchableOpacity
                style={styles.dismissKeyboardButton}
                onPress={() => Keyboard.dismiss()}
              >
                <Ionicons name="checkmark" size={20} color="#4B164C" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons - Hide when keyboard is visible */}
            {!isKeyboardVisible && (
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
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'grey'
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 5,
    flexGrow: 1,
    justifyContent: 'center',
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
  opinionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  commentCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    minHeight: 80,
    position: 'relative',
  },
  commentInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 40,
    textAlignVertical: 'top',
    paddingRight: 40,
  },
  dismissKeyboardButton: {
    position: 'absolute',
    top: 16,
    right: 16,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
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
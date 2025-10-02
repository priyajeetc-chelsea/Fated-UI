import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PotentialMatch {
  id: string;
  name: string;
  photo?: string;
  likedOpinion: {
    id: string;
    content: string;
    comment?: string;
  };
}

interface PotentialMatchModalProps {
  visible: boolean;
  potentialMatch: PotentialMatch | null;
  onClose: () => void;
  onLikeOpinion?: (matchUserId: string) => void;
}

export function PotentialMatchModal({ visible, potentialMatch, onClose, onLikeOpinion }: PotentialMatchModalProps) {
  const [showHomeLike, setShowHomeLike] = React.useState(false);

  React.useEffect(() => {
    if (showHomeLike && potentialMatch && onLikeOpinion) {
      onLikeOpinion(potentialMatch.id);
      setShowHomeLike(false);
      onClose();
    }
  }, [showHomeLike, potentialMatch, onLikeOpinion, onClose]);

  const handleLikeOpinion = () => {
    setShowHomeLike(true);
  };

  if (!potentialMatch) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.fullScreenContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Potential Match</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* User Info */}
          <View style={styles.userSection}>
            <View style={styles.hiddenProfilePhoto}>
              <Ionicons name="person" size={60} color="#999" />
            </View>
            <Text style={styles.userName}>{potentialMatch.name}</Text>
            <Text style={styles.subtitle}>Liked your opinion</Text>
          </View>

          {/* Opinion Card */}
          <View style={styles.opinionCard}>
            <Text style={styles.opinionText}>{potentialMatch.likedOpinion.content}</Text>
            
            {potentialMatch.likedOpinion.comment && (
              <View style={styles.commentSection}>
                <View style={styles.commentBubble}>
                  <Text style={styles.commentText}>{potentialMatch.likedOpinion.comment}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Unlock Message */}
          <View style={styles.unlockMessage}>
            <Ionicons name="lock-closed" size={24} color="#9966CC" />
            <Text style={styles.unlockText}>
              Please like an opinion of this user to unlock match and view each other&apos;s photo
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={handleLikeOpinion}
            >
              <Ionicons name="heart" size={20} color="white" />
              <Text style={styles.likeButtonText}>Like Their Opinion</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  hiddenProfilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  opinionCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  opinionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
  },
  commentSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentBubble: {
    backgroundColor: '#e8e8e8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    fontStyle: 'italic',
  },
  unlockMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f0ff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
  },
  unlockText: {
    flex: 1,
    fontSize: 14,
    color: '#9966CC',
    marginLeft: 10,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 15,
    marginTop: 20,
  },
  likeButton: {
    backgroundColor: '#9966CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 30,
    gap: 8,
  },
  likeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 30,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
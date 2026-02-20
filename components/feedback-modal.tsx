import { apiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  placeholder?: string;
  onSuccess?: () => void;
}

export default function FeedbackModal({
  visible,
  onClose,
  title = "Help Shape Fated",
  placeholder = "Share your thoughts, suggestions, or feedback...",
  onSuccess,
}: FeedbackModalProps) {
  const [tag, setTag] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // No validation required - both fields are optional
    if (!tag.trim() && !suggestion.trim()) {
      Alert.alert(
        "Empty Feedback",
        "Please share at least a tag or suggestion.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.submitFeedback({
        tag: tag.trim() || undefined,
        suggestion: suggestion.trim() || undefined,
      });

      // Clear fields
      setTag("");
      setSuggestion("");

      // Close modal
      onClose();

      // Show success message
      Alert.alert("Thank You! 🎉", "Your feedback helps us improve Fated.");

      // Call success callback if provided
      onSuccess?.();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTag("");
    setSuggestion("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>{title}</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Subtitle */}
                <Text style={styles.subtitle}>
                  Your insights help us create better experiences for everyone.
                </Text>

                {/* Tag Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tag (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={tag}
                    onChangeText={setTag}
                    placeholder="e.g., Questions, Topics, Features"
                    placeholderTextColor="#999"
                    maxLength={100}
                  />
                </View>

                {/* Suggestion Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Your Suggestion (Optional)
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={suggestion}
                    onChangeText={setSuggestion}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    maxLength={1000}
                  />
                  <Text style={styles.characterCount}>
                    {suggestion.length}/1000
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? "Sending..." : "Send Feedback"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#000",
    backgroundColor: "#FAFAFA",
  },
  textArea: {
    minHeight: 120,
    maxHeight: 200,
    paddingTop: 14,
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: "#4B164C",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

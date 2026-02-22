import { apiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

const REFERRAL_APPLIED_KEY = "@fated_referral_applied";

interface ReferralCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReferralCodeModal({
  visible,
  onClose,
  onSuccess,
}: ReferralCodeModalProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validateCode = (value: string): boolean => {
    if (!value.trim()) {
      setError("Please enter a referral code");
      return false;
    }
    if (value.length > 12) {
      setError("Code must be 12 characters or less");
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      setError("Code must contain only letters and numbers");
      return false;
    }
    setError("");
    return true;
  };

  const handleApply = async () => {
    if (!validateCode(code)) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiService.applyReferralCode(code.trim());

      if (response.code === 200) {
        await AsyncStorage.setItem(REFERRAL_APPLIED_KEY, "true");
        setCode("");
        onClose();
        Alert.alert("Referral Applied", "Referral code applied successfully!");
        onSuccess?.();
      } else {
        setError(response.msg || "Failed to apply referral code");
      }
    } catch (err: any) {
      const msg = err?.data?.msg || err?.message || "";
      if (msg.toLowerCase().includes("invalid")) {
        setError("Invalid referral code. Please check and try again.");
      } else if (msg.toLowerCase().includes("already")) {
        setError("You have already applied a referral code.");
      } else if (msg.toLowerCase().includes("self")) {
        setError("You cannot use your own referral code.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setError("");
    onClose();
  };

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric, max 12 chars
    const filtered = text.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    setCode(filtered);
    if (error) setError("");
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
                {/* Handle bar */}
                <View style={styles.handleBar} />

                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Enter Referral Code</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>
                  Got a referral code from a friend? Enter it below to claim your reward.
                </Text>

                {/* Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, error ? styles.inputError : null]}
                    value={code}
                    onChangeText={handleCodeChange}
                    placeholder="Enter code"
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={12}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                {/* Apply Button */}
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    (!code.trim() || isSubmitting) && styles.applyButtonDisabled,
                  ]}
                  onPress={handleApply}
                  disabled={!code.trim() || isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.applyButtonText}>Apply Code</Text>
                  )}
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
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#000",
    backgroundColor: "#FAFAFA",
    textAlign: "center",
    letterSpacing: 2,
    fontWeight: "600",
  },
  inputError: {
    borderColor: "#FF4444",
  },
  errorText: {
    fontSize: 13,
    color: "#FF4444",
    marginTop: 8,
    textAlign: "center",
  },
  applyButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 52,
  },
  applyButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

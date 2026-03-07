import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface SwipeLimitModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: () => void;
}

export default function SwipeLimitModal({
  visible,
  onClose,
  onInvite,
}: SwipeLimitModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Icon */}
              <View style={styles.iconCircle}>
                <Ionicons name="eye-off-outline" size={32} color="#4B164C" />
              </View>

              {/* Title */}
              <Text style={styles.title}>You've seen everyone for today</Text>

              {/* Message */}
              <Text style={styles.message}>
                Daily limits help you focus on meaningful connections instead of
                endless swiping. Your limit resets tomorrow.
              </Text>

              {/* Referral benefit */}
              <View style={styles.benefitCard}>
                <Ionicons name="gift-outline" size={20} color="#4B164C" />
                <Text style={styles.benefitText}>
                  Refer a friend and get{" "}
                  <Text style={styles.benefitHighlight}>
                    5 extra daily views
                  </Text>{" "}
                  for each referral
                </Text>
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => {
                  onClose();
                  onInvite();
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.inviteButtonText}>
                  Invite Friends & Get More
                </Text>
              </TouchableOpacity>

              {/* Dismiss */}
              <TouchableOpacity onPress={onClose} style={styles.dismissButton}>
                <Text style={styles.dismissText}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    alignItems: "center",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3E8F4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F0F8",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
    width: "100%",
  },
  benefitText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    flex: 1,
  },
  benefitHighlight: {
    color: "#4B164C",
    fontWeight: "700",
  },
  inviteButton: {
    backgroundColor: "#4B164C",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  inviteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dismissButton: {
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
});

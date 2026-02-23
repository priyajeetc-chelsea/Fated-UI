import { useNotification } from "@/contexts/NotificationContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const NOTIFICATION_PERMISSION_ASKED_KEY = "@notification_permission_asked";
const NOTIFICATION_PERMISSION_DENIED_KEY = "@notification_permission_denied";
const LOCATION_PERMISSION_ASKED_KEY = "@location_permission_asked";

export const NotificationPermissionPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { hasPermission, requestPermission } = useNotification();

  useEffect(() => {
    const checkIfShouldShowPrompt = async () => {
      // Don't show on web - web notifications require different handling
      if (Platform.OS === "web") {
        return;
      }

      // Don't show if already have permission
      if (hasPermission === true) {
        // Clear the asked flag if user granted permission elsewhere
        await AsyncStorage.removeItem(NOTIFICATION_PERMISSION_ASKED_KEY);
        await AsyncStorage.removeItem(NOTIFICATION_PERMISSION_DENIED_KEY);
        return;
      }

      // Check if user denied previously
      const denied = await AsyncStorage.getItem(
        NOTIFICATION_PERMISSION_DENIED_KEY,
      );
      if (denied === "true") {
        console.log(
          "⏭️ User previously denied notifications, not showing prompt",
        );
        return;
      }

      // Check if we've already asked before
      const hasAsked = await AsyncStorage.getItem(
        NOTIFICATION_PERMISSION_ASKED_KEY,
      );

      // Don't show notification prompt until location prompt has been handled
      const locationAsked = await AsyncStorage.getItem(
        LOCATION_PERMISSION_ASKED_KEY,
      );

      // Show prompt after 5 seconds if we haven't asked before and location was already asked
      if (!hasAsked && locationAsked) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
      }
    };

    checkIfShouldShowPrompt();
  }, [hasPermission]);

  const handleAllow = async () => {
    setShowPrompt(false);
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, "true");

    const granted = await requestPermission();

    if (!granted) {
      // Mark as denied so we don't keep asking
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_DENIED_KEY, "true");

      // Show alert if user denied permission
      Alert.alert(
        "Notification Access",
        "Notifications help you stay updated on new matches and messages. You can enable them later in Settings.",
        [{ text: "OK" }],
      );
    } else {
      // Clear denied flag if permission was granted
      await AsyncStorage.removeItem(NOTIFICATION_PERMISSION_DENIED_KEY);
    }
  };

  const handleNotNow = async () => {
    setShowPrompt(false);
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, "true");
    // Mark as soft denial - we won't ask again
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_DENIED_KEY, "true");
  };

  if (!showPrompt || hasPermission === true) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={showPrompt}
      animationType="fade"
      onRequestClose={handleNotNow}
    >
      <View style={styles.overlay}>
        <View style={styles.promptContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={48} color="#4B164C" />
          </View>

          <Text style={styles.title}>Enable Notifications</Text>
          <Text style={styles.description}>
            Stay updated on new matches and messages! We&apos;ll notify you when
            someone likes you or sends a message.
          </Text>

          <TouchableOpacity style={styles.allowButton} onPress={handleAllow}>
            <Text style={styles.allowButtonText}>Allow Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notNowButton} onPress={handleNotNow}>
            <Text style={styles.notNowButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  promptContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5E6F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4B164C",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  allowButton: {
    backgroundColor: "#4B164C",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    marginBottom: 12,
  },
  allowButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  notNowButton: {
    paddingVertical: 12,
  },
  notNowButtonText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "500",
  },
});

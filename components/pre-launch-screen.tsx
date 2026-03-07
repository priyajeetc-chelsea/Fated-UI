import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PreLaunchScreenProps {
  launchDate: string;
  onInvite: () => void;
  onFeedback: () => void;
}

export default function PreLaunchScreen({
  launchDate,
  onInvite,
  onFeedback,
}: PreLaunchScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero section */}
      <View style={styles.heroSection}>
        <Text style={styles.title}>Thanks for signing up</Text>
        <Text style={styles.subtitle}>You're one of the first</Text>
      </View>

      {/* Stats card */}
      <View style={styles.card}>
        <Text style={styles.statsNumber}>400+</Text>
        <Text style={styles.statsLabel}>people have already joined Fated</Text>
      </View>

      {/* Message */}
      <Text style={styles.message}>
        We're opening the app all at once so everyone has real people to match
        with from day one.
      </Text>

      {/* Launch date card */}
      <View style={styles.launchCard}>
        <Text style={styles.launchLabel}>Fated goes live on</Text>
        <Text style={styles.launchDate}>{launchDate}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.inviteButton} onPress={onInvite}>
          <Ionicons
            name="person-add-outline"
            size={20}
            color="#fff"
            style={styles.buttonIcon}
          />
          <Text style={styles.inviteButtonText}>Invite someone you know</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.feedbackButton} onPress={onFeedback}>
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color="#4B164C"
            style={styles.buttonIcon}
          />
          <Text style={styles.feedbackButtonText}>
            Share feedback with us
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontFamily: "PlayfairDisplay-Bold",
    fontSize: 26,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#888",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statsNumber: {
    fontFamily: "PlayfairDisplay-Bold",
    fontSize: 36,
    fontWeight: "700",
    color: "#4B164C",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 15,
    fontWeight: "400",
    color: "#666",
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    fontWeight: "400",
    color: "#555",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  launchCard: {
    backgroundColor: "#4B164C",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#4B164C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  launchLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  launchDate: {
    fontFamily: "PlayfairDisplay-Bold",
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
  },
  actionsContainer: {
    gap: 12,
  },
  inviteButton: {
    backgroundColor: "#4B164C",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inviteButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  feedbackButton: {
    backgroundColor: "#F3E8F4",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackButtonText: {
    color: "#4B164C",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
});

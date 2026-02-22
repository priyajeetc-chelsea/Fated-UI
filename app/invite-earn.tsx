import { apiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InviteEarnScreen() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralCode();
  }, []);

  const fetchReferralCode = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getReferralCode();
      const model = response?.model;
      // API returns model as { referalCode: "..." } (note: single 'r' in API)
      if (typeof model === "string") {
        setReferralCode(model);
      } else if (model?.referalCode) {
        setReferralCode(model.referalCode);
      } else if (model?.referralCode) {
        setReferralCode(model.referralCode);
      } else if (model?.code) {
        setReferralCode(model.code);
      } else {
        setReferralCode(null);
      }
    } catch (error) {
      console.error("Failed to fetch referral code:", error);
      Alert.alert("Error", "Failed to load your referral code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await Clipboard.setStringAsync(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert("Error", "Failed to copy code to clipboard.");
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;
    const message = `Hey! Join me on Fated - a dating app where your opinions matter. Use my referral code: ${referralCode} to get started!\n\nDownload Fated now!`;
    try {
      await Share.share({
        message,
        ...(Platform.OS === "ios" ? { url: "" } : {}),
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite & Earn</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="gift-outline" size={40} color="#4B164C" />
          </View>
          <Text style={styles.heroTitle}>Share Fated with Friends</Text>
          <Text style={styles.heroSubtitle}>
            Invite your friends to Fated and help them find meaningful connections.
          </Text>
        </View>

        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4B164C" />
            </View>
          ) : referralCode ? (
            <>
              <Text style={styles.codeText}>{referralCode}</Text>
              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.copyButton]}
                  onPress={handleCopyCode}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={copied ? "checkmark-circle" : "copy-outline"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.actionButtonText}>
                    {copied ? "Copied!" : "Copy Code"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.shareButton]}
                  onPress={handleShare}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-social-outline" size={20} color="#000" />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Could not load referral code</Text>
              <TouchableOpacity onPress={fetchReferralCode} style={styles.retryLink}>
                <Text style={styles.retryLinkText}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={styles.howItWorksTitle}>How it works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepDot}>
              <Text style={styles.stepDotText}>1</Text>
            </View>
            <Text style={styles.stepText}>Share your unique referral code</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepDot}>
              <Text style={styles.stepDotText}>2</Text>
            </View>
            <Text style={styles.stepText}>Your friend enters the code during signup</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepDot}>
              <Text style={styles.stepDotText}>3</Text>
            </View>
            <Text style={styles.stepText}>Both of you get rewarded!</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#f9f9f9",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3E8F4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    fontFamily: "Playfair Display Bold",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  codeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 3,
    marginBottom: 20,
    fontFamily: "Playfair Display Bold",
  },
  codeActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  copyButton: {
    backgroundColor: "#4B164C",
  },
  shareButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#000",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  shareButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: 20,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  retryLink: {
    padding: 4,
  },
  retryLinkText: {
    fontSize: 14,
    color: "#4B164C",
    fontWeight: "600",
  },
  howItWorks: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4B164C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepDotText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  stepText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
});

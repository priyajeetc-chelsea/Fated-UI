import { LogoutButton } from "@/components/auth";
import BaseLayout from "@/components/base-layout";
import FeedbackModal from "@/components/feedback-modal";
import { useUser } from "@/contexts/UserContext";
import { apiService } from "@/services/api";
import { CurrentUserProfile } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ProfilePhotoCardWithLoader = ({ uri }: { uri: string }) => {
  const [loading, setLoading] = useState(true);
  return (
    <>
      <Image
        source={{ uri }}
        style={styles.profilePhoto}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View
          style={[
            styles.profilePhoto,
            {
              position: "absolute",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f0f0f0",
            },
          ]}
        >
          <ActivityIndicator size="small" color="#4B164C" />
        </View>
      )}
    </>
  );
};

export default function ProfilePage() {
  const { updateUserPhotos, setCurrentUser, currentUser } = useUser();
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCurrentUserProfile();

      if (response.code === 200) {
        setProfile(response.model);

        // Update user context with photos and name
        if (response.model.photoUrls && response.model.photoUrls.length > 0) {
          updateUserPhotos(response.model.photoUrls);
        }

        // Update user name if we have it
        if (currentUser && response.model.fname) {
          setCurrentUser({
            ...currentUser,
            name: `${response.model.fname} ${response.model.lname || ""}`.trim(),
            photoUrls: response.model.photoUrls || [],
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShowSticky = scrollY > 20;

    if (showStickyHeader !== shouldShowSticky) {
      setShowStickyHeader(shouldShowSticky);
    }

    lastScrollY.current = scrollY;
  };

  const renderPhotoCard = (photoUrl: string, index: number) => (
    <View key={`photo-${index}`} style={styles.photoCardContainer}>
      <ProfilePhotoCardWithLoader uri={photoUrl} />
    </View>
  );

  const renderDetailsCard = () => {
    if (!profile) return null;

    // Define all possible vertical detail fields in priority order (respecting privacy settings)
    const verticalFieldDefinitions = [
      {
        key: "homeTown",
        value: profile.homeTown,
        icon: "home" as const,
        label: "Home Town",
      },

      {
        key: "jobDetails",
        value: profile.jobDetails,
        icon: "briefcase" as const,
        label: "Job",
      },
      {
        key: "college",
        value: profile.colllege,
        icon: "school" as const,
        label: "College",
      },
      {
        key: "education",
        value: profile.showEducationLevel
          ? profile.highestEducationLevel
          : null,
        icon: "ribbon" as const,
        label: "Education",
      },
      {
        key: "religious",
        value: profile.showReligiousBeliefs ? profile.religiousBeliefs : null,
        icon: "book" as const,
        label: "Religious Beliefs",
      },
      {
        key: "drinkSmoke",
        value: profile.showDrinkOrSmoke ? profile.drinkOrSmoke : null,
        icon: "wine" as const,
        label: "Drink/Smoke",
      },
    ];

    // Define horizontal grid field candidates (respecting privacy settings)
    const horizontalFieldDefinitions = [
      {
        key: "gender",
        value: profile.gender?.Show ? profile.gender.value : null,
        icon: "person" as const,
        label: "Gender",
      },
      {
        key: "sexuality",
        value: profile.sexuality?.Show ? profile.sexuality.value : null,
        icon: "heart" as const,
        label: "Sexuality",
      },
      {
        key: "currentCity",
        value: profile.currentCity,
        icon: "location" as const,
        label: "Current City",
      },
      {
        key: "pronouns",
        value: profile.pronouns?.Show ? profile.pronouns.value : null,
        icon: "chatbubble" as const,
        label: "Pronouns",
      },
      {
        key: "height",
        value: profile.showHeight ? profile.height : null,
        icon: "resize" as const,
        label: "Height",
      },
    ];

    // Define a common field type for easier manipulation
    type ProfileField = {
      key: string;
      value: string | null | undefined;
      icon: keyof typeof Ionicons.glyphMap;
      label: string;
    };

    // Get available vertical fields
    const availableVerticalFields: ProfileField[] =
      verticalFieldDefinitions.filter((field) => field.value);

    // If we need more fields to reach 4 in vertical section, take from horizontal candidates
    const verticalFields: ProfileField[] = [...availableVerticalFields];
    const usedInVertical = new Set(verticalFields.map((f) => f.key));

    if (verticalFields.length < 4) {
      const horizontalAvailable: ProfileField[] =
        horizontalFieldDefinitions.filter((field) => field.value);
      const needed = 3 - verticalFields.length;
      const toMove = horizontalAvailable.slice(0, needed);
      verticalFields.push(...toMove);
      toMove.forEach((field) => usedInVertical.add(field.key));
    }

    // Horizontal grid only shows fields not used in vertical section
    const horizontalFields: ProfileField[] = horizontalFieldDefinitions
      .filter((field) => field.value && !usedInVertical.has(field.key))
      .slice(0, 4);

    return (
      <View style={styles.opinionCard}>
        {/* Horizontal scrollable grid - only if there are fields to show */}
        {horizontalFields.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.gridScrollContainer}
              contentContainerStyle={styles.gridContentContainer}
            >
              {horizontalFields.map((field, index) => (
                <React.Fragment key={field.key}>
                  {index > 0 && <View style={styles.verticalSeparator} />}
                  <View style={styles.gridItem}>
                    <Ionicons
                      name={field.icon}
                      size={16}
                      color="#666"
                      style={styles.gridIcon}
                    />
                    <Text style={styles.gridLabel}>{field.label}</Text>
                    <Text style={styles.gridValue}>{field.value}</Text>
                  </View>
                </React.Fragment>
              ))}
            </ScrollView>
            <View style={styles.separator} />
          </>
        )}

        {/* Vertical detail fields - always try to show 4 */}
        {verticalFields.map((field, index) => (
          <React.Fragment key={field.key}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons
                  name={field.icon}
                  size={16}
                  color="#666"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailLabel}>{field.label}</Text>
              </View>
              <Text style={styles.detailValue}>{field.value}</Text>
            </View>
            {index < verticalFields.length - 1 && (
              <View style={styles.separator} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderOpinionCard = (
    opinion: CurrentUserProfile["opinions"][0],
    index: number,
  ) => (
    <View key={`opinion-${opinion.takeId}`} style={styles.opinionCard}>
      <View style={styles.themeTag}>
        <Text style={styles.themeText}>{opinion.tag.name}</Text>
      </View>
      <Text style={styles.questionText}>{opinion.question}</Text>
      <Text style={styles.opinionText}>{opinion.answer}</Text>
    </View>
  );

  const renderInterleavedContent = () => {
    if (!profile) return null;

    const photoUrls = profile.photoUrls || [];
    const opinions = profile.opinions || [];
    const content: React.ReactElement[] = [];

    // Start with first photo if available
    if (photoUrls.length > 0) {
      content.push(renderPhotoCard(photoUrls[0], 0));
    }

    // Interleave opinions and photos
    const maxLength = Math.max(opinions.length, photoUrls.length - 1);
    for (let i = 0; i < maxLength; i++) {
      // Add opinion if available
      if (i < opinions.length) {
        content.push(renderOpinionCard(opinions[i], i));
      }

      // Add next photo if available (starting from index 1)
      if (i + 1 < photoUrls.length) {
        content.push(renderPhotoCard(photoUrls[i + 1], i + 1));
      }
    }

    return content;
  };

  if (isLoading) {
    return (
      <BaseLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B164C" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </BaseLayout>
    );
  }

  if (!profile) {
    return (
      <BaseLayout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      userName={profile ? `${profile.fname} ${profile.lname || ""}` : undefined}
      isScrolling={showStickyHeader}
      showLogoutButton={showStickyHeader}
    >
      <KeyboardAvoidingView
        style={[styles.container, showStickyHeader && { paddingTop: 45 }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.mainContainer}>
          {/* Header with User Info - Hide when sticky header is shown */}
          {!showStickyHeader && (
            <View style={styles.containerHeader}>
              <View style={styles.userInfoRow}>
                <Image
                  source={{ uri: profile.photoUrls?.[0] }}
                  style={styles.userPhoto}
                />
                <Text style={styles.userName}>
                  {profile.fname} {profile.lname || ""}
                </Text>
              </View>
              <LogoutButton variant="icon" />
            </View>
          )}

          {/* Quick Actions Row */}
          {!showStickyHeader && (
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/invite-earn")}
              >
                <Ionicons name="gift-outline" size={18} color="#4B164C" />
                <Text style={styles.quickActionText}>Invite & Earn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setShowFeedbackModal(true)}
              >
                <Ionicons name="bulb-outline" size={18} color="#4B164C" />
                <Text style={styles.quickActionText}>Help Shape Fated</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cards List */}
          <ScrollView
            ref={scrollViewRef}
            style={[
              styles.opinionsContainer,
              showStickyHeader && { marginTop: -5 },
            ]}
            contentContainerStyle={[{ paddingBottom: 50 }]}
            onScroll={handleScroll}
            scrollEventThrottle={32}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            removeClippedSubviews={false}
          >
            {renderDetailsCard()}
            {renderInterleavedContent()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 20,
  },
  mainContainer: {
    flex: 1,
    marginTop: 10,
  },
  containerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  userPhoto: {
    width: 40,
    height: 40,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 24,
    lineHeight: 28,
    color: "#000",
    fontFamily: "Playfair Display Bold",
  },
  opinionsContainer: {
    flex: 1,
  },
  opinionsContent: {
    minHeight: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF4444",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4B164C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  name: {
    fontSize: 25,
    fontWeight: "500",
    color: "#000",
    fontFamily: "Playfair Display",
  },
  profileDetailsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1.5,
    textAlign: "right",
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 4,
  },
  gridScrollContainer: {
    maxHeight: 100,
    width: "100%",
    marginVertical: 4,
  },
  gridContentContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  gridItem: {
    minWidth: 80,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  gridIcon: {
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  gridValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
  },
  verticalSeparator: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
    alignSelf: "stretch",
  },
  opinionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 20,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoCardContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 500,
  },
  profilePhoto: {
    width: "100%",
    minHeight: 500,
    borderRadius: 16,
    resizeMode: "contain",
  },
  themeTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "#FFCF00",
    marginBottom: 10,
    maxWidth: "70%",
    overflow: "hidden",
  },
  themeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: "black",
    fontFamily: "Playfair Display Bold",
    marginBottom: 5,
  },
  opinionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#000",
  },
});

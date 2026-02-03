import BaseLayout from "@/components/base-layout";
import UserProfileLayout from "@/components/user-profile-layout";
import { apiService } from "@/services/api";
import { ApiUser } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function UserProfilePage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  // Check if this is a confirmed match (to hide action buttons)
  const isConfirmedMatch = params.isConfirmedMatch === "true";
  const navigateBackToPotentialMatches = () => {
    router.replace("/(tabs)/potential-matches");
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowStickyHeader(scrollY > 100);
  };

  const handleCrossPress = async () => {
    if (user) {
      try {
        const swipedId = parseInt(user.id);

        await apiService.sendFinalSwipe(swipedId, false);
        console.log("User crossed via final swipe API");

        // Navigate to matches page and reload data
        navigateBackToPotentialMatches();
      } catch (error) {
        console.error("Failed to send final swipe:", error);
        // Still navigate back on error
        router.back();
      }
    }
  };

  const handleLikePress = async () => {
    if (user) {
      try {
        const swipedId = parseInt(user.id);

        await apiService.sendFinalSwipe(swipedId, true);
        console.log("User liked via final swipe API");

        // Navigate to matches page and reload data
        navigateBackToPotentialMatches();
      } catch (error) {
        console.error("Failed to send final swipe:", error);
        // Still navigate back on error
        router.back();
      }
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);

      try {
        // Check if userBId is provided (from API)
        if (!params.userBId) {
          // No user ID provided, show error and redirect
          Alert.alert(
            "Profile Not Found",
            "Unable to load user profile. Please try again.",
            [
              {
                text: "OK",
                onPress: () => navigateBackToPotentialMatches(),
              },
            ],
          );
          setIsLoading(false);
          return;
        }

        const userBId = Array.isArray(params.userBId)
          ? parseInt(params.userBId[0])
          : parseInt(params.userBId);
        console.log("Loading user profile for userBId:", userBId);

        const userProfile = await apiService.fetchUserProfile(userBId);

        if (!userProfile || !userProfile.model) {
          // API returned invalid data
          Alert.alert(
            "Profile Not Available",
            "This profile is currently unavailable. Please try again later.",
            [
              {
                text: "OK",
                onPress: () => navigateBackToPotentialMatches(),
              },
            ],
          );
          setIsLoading(false);
          return;
        }

        const profileData = userProfile.model;

        // Helper to extract value from showable fields
        const getShowableValue = (field: any): string => {
          if (!field) return "";
          if (typeof field === "string") return field;
          // New format: {value: string, Show: boolean}
          if (field.Show && field.value) return field.value;
          return "";
        };

        // Convert API response to ApiUser format
        const convertedUser: ApiUser = {
          id: profileData.userId?.toString() || userBId.toString(),
          name: `${profileData.fname || ""} ${profileData.lname || ""}`.trim(),
          age: profileData.age,
          gender: getShowableValue(profileData.gender),
          photo:
            profileData.photoUrls?.[0] ||
            `https://picsum.photos/200/200?random=${userBId}`,
          opinions:
            profileData.opinions?.map((opinion: any) => ({
              id: opinion.takeId?.toString() || Math.random().toString(),
              question: opinion.question || "Question not available",
              text: opinion.answer || "No answer provided",
              theme: opinion.tag?.name || "General",
              liked: false,
            })) || [],
          // Store additional data for profile display
          profileData: {
            fname: profileData.fname,
            lname: profileData.lname,
            sexuality: getShowableValue(profileData.sexuality),
            pronouns: getShowableValue(profileData.pronouns),
            homeTown: profileData.homeTown,
            currentCity: profileData.currentCity,
            jobDetails: profileData.jobDetails,
            college: profileData.colllege, // Note: API has typo "colllege"
            highestEducationLevel: profileData.showEducationLevel
              ? profileData.highestEducationLevel
              : "",
            religiousBeliefs: profileData.showReligiousBeliefs
              ? profileData.religiousBeliefs
              : "",
            drinkOrSmoke: profileData.showDrinkOrSmoke
              ? profileData.drinkOrSmoke
              : "",
            height: profileData.showHeight ? profileData.height : "",
            photoUrls: profileData.photoUrls || [],
          },
        };

        setUser(convertedUser);
      } catch (error) {
        console.error("Error loading user profile:", error);
        // Show error alert and redirect back
        Alert.alert(
          "Error Loading Profile",
          "Failed to load user profile. Please check your connection and try again.",
          [
            {
              text: "OK",
              onPress: () => navigateBackToPotentialMatches(),
            },
          ],
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userBId]);

  if (isLoading) {
    return (
      <BaseLayout showBackButton={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </BaseLayout>
    );
  }

  if (!user) {
    return (
      <BaseLayout showBackButton={true}>
        <View style={styles.loadingContainer}>
          {/* Error state could go here */}
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      showBackButton={true}
      userName={user.name}
      isScrolling={showStickyHeader}
      onBackPress={navigateBackToPotentialMatches}
    >
      <UserProfileLayout
        userData={{
          userId: parseInt(user.id),
          firstName:
            user.profileData?.fname || user.name.split(" ")[0] || user.name,
          lname: user.profileData?.lname || user.name.split(" ")[1] || "",
          age: user.age,
          gender: user.gender,
          sexuality: user.profileData?.sexuality || "",
          pronouns: user.profileData?.pronouns || "",
          homeTown: user.profileData?.homeTown || "",
          currentCity: user.profileData?.currentCity || "",
          jobDetails: user.profileData?.jobDetails || "",
          college: user.profileData?.college || "",
          highestEducationLevel: user.profileData?.highestEducationLevel || "",
          religiousBeliefs: user.profileData?.religiousBeliefs || "",
          drinkOrSmoke: user.profileData?.drinkOrSmoke || "",
          height: user.profileData?.height || "",
          photoUrls: user.profileData?.photoUrls || [user.photo],
          opinions: user.opinions.map((opinion) => ({
            id: opinion.id,
            question: opinion.question,
            text: opinion.text,
            theme: opinion.theme,
          })),
        }}
        showStickyHeader={showStickyHeader}
        onScroll={handleScroll}
        layoutType="full-profile"
        showCrossButton={false}
      />

      {/* Bottom Action Buttons - Only show for potential matches, not confirmed matches */}
      {!isConfirmedMatch && (
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.crossButton]}
            onPress={handleCrossPress}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={38} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleLikePress}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  crossButton: {
    backgroundColor: "#666",
  },
  likeButton: {
    backgroundColor: "#4B164C",
  },
});

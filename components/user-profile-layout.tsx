import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface UserProfileLayoutProps {
  userData: {
    userId: number;
    firstName: string;
    lname?: string;
    age?: number;
    gender: string;
    sexuality?: string;
    pronouns: string;
    homeTown?: string;
    currentCity?: string;
    jobDetails?: string;
    college?: string;
    highestEducationLevel?: string;
    religiousBeliefs?: string;
    drinkOrSmoke?: string;
    height?: string;
    photoUrls?: string[];
    opinions: {
      id: string;
      question: string;
      text: string;
      theme: string;
    }[];
  };
  showStickyHeader: boolean;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onCrossPress?: () => void;
  showCrossButton?: boolean;
  layoutType: "full-profile" | "opinions-only";
}

export default function UserProfileLayout({
  userData,
  showStickyHeader,
  onScroll,
  onCrossPress,
  showCrossButton = true,
  layoutType = "full-profile",
}: UserProfileLayoutProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const renderPhotoCard = (photoUrl: string, index: number) => (
    <View key={`photo-${index}`} style={styles.photoCardContainer}>
      <Image
        source={{ uri: photoUrl }}
        style={styles.profilePhoto}
        resizeMode="cover"
      />
    </View>
  );

  const renderDetailsCard = () => {
    // Define all possible vertical detail fields in priority order
    const verticalFieldDefinitions = [
      {
        key: "homeTown",
        value: userData.homeTown,
        icon: "home" as const,
        label: "Home Town",
      },
      {
        key: "currentCity",
        value: userData.currentCity,
        icon: "location" as const,
        label: "Current City",
      },
      {
        key: "jobDetails",
        value: userData.jobDetails,
        icon: "briefcase" as const,
        label: "Job",
      },
      {
        key: "college",
        value: userData.college,
        icon: "school" as const,
        label: "College",
      },
      {
        key: "education",
        value: userData.highestEducationLevel,
        icon: "ribbon" as const,
        label: "Education",
      },
      {
        key: "religious",
        value: userData.religiousBeliefs,
        icon: "book" as const,
        label: "Religious Beliefs",
      },
      {
        key: "drinkSmoke",
        value: userData.drinkOrSmoke,
        icon: "wine" as const,
        label: "Drink/Smoke",
      },
    ];

    // Define horizontal grid field candidates
    const horizontalFieldDefinitions = [
      {
        key: "age",
        value: userData.age,
        icon: "calendar" as const,
        label: "Age",
      },
      {
        key: "gender",
        value: userData.gender,
        icon: "person" as const,
        label: "Gender",
      },
      {
        key: "sexuality",
        value: userData.sexuality,
        icon: "heart" as const,
        label: "Sexuality",
      },
      {
        key: "height",
        value: userData.height,
        icon: "resize" as const,
        label: "Height",
      },
      {
        key: "pronouns",
        value: userData.pronouns,
        icon: "chatbubble" as const,
        label: "Pronouns",
      },
    ];

    // Get available vertical fields
    const availableVerticalFields = verticalFieldDefinitions.filter(
      (field) => field.value,
    );

    // If we need more fields to reach 4 in vertical section, take from horizontal candidates
    const verticalFields = [...availableVerticalFields];
    const usedInVertical = new Set(verticalFields.map((f) => f.key));

    if (verticalFields.length < 4) {
      const horizontalAvailable = horizontalFieldDefinitions.filter(
        (field) => field.value,
      );
      const needed = 3 - verticalFields.length;
      const toMove = horizontalAvailable.slice(0, needed);
      verticalFields.push(...toMove);
      toMove.forEach((field) => usedInVertical.add(field.key));
    }

    // Horizontal grid only shows fields not used in vertical section
    const horizontalFields = horizontalFieldDefinitions
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
                    <ThemedText style={styles.gridLabel}>
                      {field.label}
                    </ThemedText>
                    <ThemedText style={styles.gridValue}>
                      {field.value}
                    </ThemedText>
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
                <ThemedText style={styles.detailLabel}>
                  {field.label}
                </ThemedText>
              </View>
              <ThemedText style={styles.detailValue}>{field.value}</ThemedText>
            </View>
            {index < verticalFields.length - 1 && (
              <View style={styles.separator} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderOpinionCard = (opinion: any, index: number) => (
    <View key={`opinion-${opinion.id}`} style={styles.opinionCard}>
      <View style={styles.themeTag}>
        <ThemedText style={styles.themeText}>{opinion.theme}</ThemedText>
      </View>
      <ThemedText style={styles.questionText}>{opinion.question}</ThemedText>
      <ThemedText style={styles.opinionText}>{opinion.text}</ThemedText>
    </View>
  );

  // Interleave photos and opinions: photo, opinion, photo, opinion, etc.
  const renderInterleavedContent = () => {
    const photoUrls = userData.photoUrls || [];
    const opinions = userData.opinions || [];
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Main Content Container */}
      <View style={styles.mainContainer}>
        {/* Header with User Info - Hide when sticky header is shown */}
        {!showStickyHeader && (
          <View style={styles.containerHeader}>
            <View style={styles.userInfoRow}>
              <Image
                source={{ uri: userData.photoUrls?.[0] }}
                style={styles.userPhoto}
              />
              <ThemedText style={[styles.userName, { color: "#000" }]}>
                {userData.firstName} {userData.lname || ""}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Cards List */}
        <ScrollView
          ref={scrollViewRef}
          style={[
            styles.opinionsContainer,
            showStickyHeader && { marginTop: -5 },
          ]}
          contentContainerStyle={[
            styles.opinionsContent,
            { paddingBottom: 50 },
          ]}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          removeClippedSubviews={false}
        >
          {layoutType === "full-profile" && (
            <>
              {renderDetailsCard()}
              {renderInterleavedContent()}
            </>
          )}
          {layoutType === "opinions-only" &&
            userData.opinions.map((opinion, index) =>
              renderOpinionCard(opinion, index),
            )}
        </ScrollView>
      </View>

      {/* Cross Button */}
      {showCrossButton && onCrossPress && (
        <TouchableOpacity
          style={styles.crossButton}
          onPress={onCrossPress}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
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
  },
  containerHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 10,
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
  opinionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
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
    height: "500",
  },
  themeTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: "70%",
    backgroundColor: "#FFCF00", //bumble yellow
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
    marginBottom: 16,
  },
  profilePhoto: {
    width: "100%",
    height: 500,
    borderRadius: 16,
    resizeMode: "contain",
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
  crossButton: {
    position: "absolute",
    bottom: 40,
    left: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

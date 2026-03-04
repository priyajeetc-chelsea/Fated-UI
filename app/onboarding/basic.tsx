import DatePicker from "@/components/onboarding/date-picker";
import OnboardingButton from "@/components/onboarding/onboarding-button";
import ProgressIndicator from "@/components/onboarding/progress-indicator";
import SimpleThemedPicker from "@/components/onboarding/simple-themed-picker";
import ThemedInput from "@/components/onboarding/themed-input";
import ThemedPicker from "@/components/onboarding/themed-picker";
import ReferralCodeModal from "@/components/referral-code-modal";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiService } from "@/services/api";
import {
  BasicDetailsFormData,
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  PRONOUNS_OPTIONS,
} from "@/types/onboarding";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const BASIC_FORM_STORAGE_KEY = "@fated_onboarding_basic_form";
const REFERRAL_APPLIED_KEY = "@fated_referral_applied";

export default function BasicDetailsForm() {
  const [loading, setLoading] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralApplied, setReferralApplied] = useState(false);
  const { handleError } = useApiErrorHandler();
  const [formData, setFormData] = useState<BasicDetailsFormData>({
    fname: "",
    lname: "",
    phone: "",
    email: "",
    dob: "",
    gender: {
      value: 0, // Initialize as number
      visibleOnProfile: true,
    },
    // sexuality: {
    //   value: "",
    //   visibleOnProfile: true,
    // },
    pronouns: {
      value: "",
      visibleOnProfile: true,
    },
    interestedIn: [], // Will contain numbers
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof BasicDetailsFormData, string>>
  >({});

  // Load saved form data and referral status on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(BASIC_FORM_STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log("📝 Basic Form: Loaded saved data from storage");
          setFormData(parsedData);
        }
        const applied = await AsyncStorage.getItem(REFERRAL_APPLIED_KEY);
        if (applied === "true") {
          setReferralApplied(true);
        }
      } catch (error) {
        console.error("📝 Basic Form: Failed to load saved data:", error);
      }
    };
    loadSavedData();
  }, []);

  // Save form data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          BASIC_FORM_STORAGE_KEY,
          JSON.stringify(formData),
        );
      } catch (error) {
        console.error("📝 Basic Form: Failed to save data:", error);
      }
    };
    saveData();
  }, [formData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BasicDetailsFormData, string>> = {};

    if (!formData.fname.trim()) {
      newErrors.fname = "First name is required";
    }

    // Last name is optional - no validation needed

    // Phone number validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    // Email is optional - only validate format if provided
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.dob.trim()) {
      newErrors.dob = "Date of birth is required";
    } else {
      // Basic date validation (YYYY-MM-DD format)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dob)) {
        newErrors.dob = "Please enter date in YYYY-MM-DD format";
      } else {
        const date = new Date(formData.dob);
        const now = new Date();
        if (date > now) {
          newErrors.dob = "Date of birth cannot be in the future";
        }
        // Check if user is at least 18
        const age = now.getFullYear() - date.getFullYear();
        if (age < 18) {
          newErrors.dob = "You must be at least 18 years old";
        }
      }
    }

    if (!formData.gender.value || formData.gender.value === 0) {
      newErrors.gender = "Gender is required";
    }

    // if (!formData.sexuality.value) {
    //   newErrors.sexuality = "Sexuality is required";
    // }

    if (!formData.pronouns.value.trim()) {
      newErrors.pronouns = "Pronouns are required";
    }

    if (formData.interestedIn.length === 0) {
      newErrors.interestedIn = "Please select who you&rsquo;re interested in";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Ensure gender and interestedIn are numbers before sending
      const payload = {
        ...formData,
        gender: {
          ...formData.gender,
          value:
            typeof formData.gender.value === "string"
              ? parseInt(formData.gender.value)
              : formData.gender.value,
        },
        interestedIn: formData.interestedIn.map((item) =>
          typeof item === "string" ? parseInt(item) : item,
        ),
      };

      console.log("📤 Submitting payload:", payload);
      const response = await apiService.submitBasicDetails(payload);

      if (response.code === 200) {
        // Clear saved form data after successful submission
        await AsyncStorage.removeItem(BASIC_FORM_STORAGE_KEY);
        console.log(
          "📝 Basic Form: Cleared saved data after successful submission",
        );

        // Navigate to next step based on response
        const nextStep = response.model.step;
        switch (nextStep) {
          case 2:
            router.push("/onboarding/lifestyle");
            break;
          case 3:
            router.push("/onboarding/takes");
            break;
          case 4:
            router.push("/onboarding/photos");
            break;
          case 5:
            router.replace("/(tabs)/homepage");
            break;
          default:
            router.push("/onboarding/lifestyle");
        }
      } else {
        Alert.alert("Error", response.msg || "Failed to save basic details");
      }
    } catch (error) {
      console.error("Error submitting basic details:", error);
      handleError(error);
      Alert.alert("Error", "Failed to save your details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof BasicDetailsFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const updatePrivacyToggle = (
    field: "gender" | "pronouns",
    visible: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        visibleOnProfile: visible,
      },
    }));
  };

  const handlePronounsChange = (values: (string | number)[]) => {
    // Limit to maximum 4 selections and convert to strings for pronouns
    const stringValues = values.map((v) => String(v));
    const limitedValues = stringValues.slice(0, 4);
    // Join the values with "/" separator
    const joinedValue = limitedValues.join("/");

    setFormData((prev) => ({
      ...prev,
      pronouns: {
        ...prev.pronouns,
        value: joinedValue,
      },
    }));
  };

  const getPronounsDisplayValue = (): string => {
    return formData.pronouns.value;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback
        onPress={Platform.OS === "web" ? undefined : Keyboard.dismiss}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Referral Code */}
          {referralApplied ? (
            <View style={styles.referralChip}>
              <Text style={styles.referralChipText}>Referral applied</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowReferralModal(true)}
              style={styles.referralLink}
            >
              <Text style={styles.referralLinkText}>Have a referral code?</Text>
            </TouchableOpacity>
          )}

          <ProgressIndicator
            currentStep={1}
            totalSteps={5}
            stepNames={[
              "Basic Details",
              "Lifestyle",
              "Topics",
              "Your Takes",
              "Photos",
            ]}
          />

          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            Let&rsquo;s start with some basic information for your profile.
          </Text>

          <ThemedInput
            label="First Name"
            value={formData.fname}
            onChangeText={(value) => updateFormData("fname", value)}
            placeholder="Enter your first name"
            error={errors.fname}
            required
          />

          <ThemedInput
            label="Last Name"
            value={formData.lname}
            onChangeText={(value) => updateFormData("lname", value)}
            placeholder="Enter your last name"
            error={errors.lname}
          />
          <ThemedInput
            label="Phone Number"
            value={formData.phone}
            onChangeText={(value) => {
              // Remove non-digits and limit to 10 characters
              const digits = value.replace(/\D/g, "").slice(0, 10);
              updateFormData("phone", digits);
            }}
            placeholder="Enter your phone number"
            keyboardType="numeric"
            autoCapitalize="none"
            error={errors.phone}
            required
          />

          {/* <ThemedInput
          label="Email"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          placeholder="Enter your email (optional)"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        /> */}

          <DatePicker
            label="Date of Birth"
            value={formData.dob}
            onDateChange={(value) => updateFormData("dob", value)}
            error={errors.dob}
            required
          />

          <SimpleThemedPicker
            label="Gender"
            value={formData.gender.value}
            onValueChange={(value) =>
              updateFormData("gender", { ...formData.gender, value })
            }
            options={GENDER_OPTIONS}
            placeholder="Select your gender"
            error={errors.gender}
            required
            showPrivacyToggle={true}
            privacyValue={formData.gender.visibleOnProfile}
            onPrivacyToggle={(visible) =>
              updatePrivacyToggle("gender", visible)
            }
          />

          {/* <View style={styles.fieldContainer}>
          <ThemedPicker
            label="Sexuality"
            value={formData.sexuality.value}
            onValueChange={(value) => updateFormData('sexuality', { ...formData.sexuality, value })}
            options={SEXUALITY_OPTIONS}
            placeholder="Select your sexuality"
            error={errors.sexuality}
            required
          />
          <PrivacyToggle
            label="Show on profile"
            value={formData.sexuality.visibleOnProfile}
            onToggle={(visible) => updatePrivacyToggle('sexuality', visible)}
          />
        </View> */}

          <ThemedPicker
            label="Pronouns"
            value={getPronounsDisplayValue()}
            onValueChange={() => {}} // Not used for multiple selection
            options={PRONOUNS_OPTIONS}
            placeholder="Select your pronouns"
            error={errors.pronouns}
            required
            multiple
            selectedValues={
              formData.pronouns.value ? formData.pronouns.value.split("/") : []
            }
            onMultiValueChange={handlePronounsChange}
            maxSelections={4}
            showPrivacyToggle={true}
            privacyValue={formData.pronouns.visibleOnProfile}
            onPrivacyToggle={(visible) =>
              updatePrivacyToggle("pronouns", visible)
            }
          />

          <ThemedPicker
            label="Interested In"
            value=""
            onValueChange={() => {}}
            options={INTERESTED_IN_OPTIONS}
            placeholder="Select who you&rsquo;re interested in"
            error={errors.interestedIn}
            required
            multiple
            selectedValues={formData.interestedIn}
            onMultiValueChange={(values) =>
              updateFormData("interestedIn", values)
            }
          />

          <View style={styles.buttonContainer}>
            <OnboardingButton
              title="Continue"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <ReferralCodeModal
        visible={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        onSuccess={() => setReferralApplied(true)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  referralLink: {
    alignSelf: "center",
    marginBottom: 12,
    padding: 4,
  },
  referralLinkText: {
    fontSize: 13,
    color: "#4B164C",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  referralChip: {
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  referralChipText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
});

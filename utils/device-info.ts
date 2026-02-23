import Constants from "expo-constants";
import { Platform } from "react-native";

export interface DeviceInfo {
  deviceType: "android" | "ios" | "web";
  deviceId: string;
  appVersion: string;
}

/**
 * Get device information for registration
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  // Determine device type
  let deviceType: "android" | "ios" | "web";
  if (Platform.OS === "web") {
    deviceType = "web";
  } else if (Platform.OS === "ios") {
    deviceType = "ios";
  } else {
    deviceType = "android";
  }

  // Get device ID (unique identifier)
  let deviceId: string;
  try {
    if (Platform.OS === "web") {
      // For web, create a persistent ID based on browser fingerprint
      deviceId = getWebDeviceId();
    } else {
      // For mobile, use expo Constants deviceId or generate one
      deviceId = Constants.deviceId || generateMobileDeviceId();
    }
  } catch (error) {
    console.error("Failed to get device ID:", error);
    deviceId = Constants.deviceId || "unknown";
  }

  // Get app version
  const appVersion = Constants.expoConfig?.version || "0.0.1";

  return {
    deviceType,
    deviceId,
    appVersion,
  };
};

/**
 * Generate a device ID for mobile platforms
 */
const generateMobileDeviceId = (): string => {
  // Generate a random ID and store it in AsyncStorage would be ideal
  // For now, use timestamp + random
  return `mobile_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Generate a persistent device ID for web based on browser characteristics
 */
const getWebDeviceId = (): string => {
  // Check if we have a stored ID
  const storedId = localStorage.getItem("fated_device_id");
  if (storedId) {
    return storedId;
  }

  // Generate a new ID based on browser fingerprint
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join("|");

  // Simple hash function to convert fingerprint to ID
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const deviceId = `web_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;

  // Store for future use
  try {
    localStorage.setItem("fated_device_id", deviceId);
  } catch (error) {
    console.warn("Failed to store device ID:", error);
  }

  return deviceId;
};

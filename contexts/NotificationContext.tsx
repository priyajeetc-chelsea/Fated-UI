import { apiService } from "@/services/api";
import { getDeviceInfo } from "@/utils/device-info";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { Platform } from "react-native";
import { useAuth } from "./auth/AuthContext";

const LAST_REGISTERED_TOKEN_KEY = "@last_registered_push_token";

interface NotificationContextType {
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  expoPushToken: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const tokenListenerRef = useRef<Notifications.Subscription | null>(null);

  /**
   * Register device token with backend
   * This is called after getting the push token and on token refresh
   */
  const registerDeviceWithBackend = useCallback(
    async (token: string): Promise<void> => {
      try {
        // Check if we've already registered this token
        const lastRegisteredToken = await AsyncStorage.getItem(
          LAST_REGISTERED_TOKEN_KEY,
        );
        if (lastRegisteredToken === token) {
          console.log("📱 Token already registered with backend, skipping");
          return;
        }

        // Get device information
        const deviceInfo = await getDeviceInfo();

        // Register with backend
        await apiService.registerDeviceToken({
          deviceToken: token,
          deviceType: deviceInfo.deviceType,
          deviceId: deviceInfo.deviceId,
          appVersion: deviceInfo.appVersion,
        });

        // Store the registered token to avoid duplicate registrations
        await AsyncStorage.setItem(LAST_REGISTERED_TOKEN_KEY, token);

        console.log("✅ Device successfully registered with backend");
      } catch (error) {
        console.error("❌ Failed to register device with backend:", error);
        // Don't throw - we don't want to block the app if registration fails
      }
    },
    [],
  );

  // Register for push notifications and get token
  const registerForPushNotificationsAsync = useCallback(async (): Promise<
    string | null
  > => {
    try {
      // On web, notifications work differently
      if (Platform.OS === "web") {
        console.log(
          "📱 Web platform detected, skipping push token registration",
        );
        return null;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Only ask if permissions have not already been determined
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("📱 Failed to get push token - permission not granted");
        return null;
      }

      // Get the token for this device
      // Expo uses its own push notification service which works with FCM/APNs under the hood
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "0d7c7584-1501-46fe-88f8-e9c80352874f", // From app.json
      });

      console.log("📱 Push token obtained:", tokenData.data);

      // Register the token with backend
      await registerDeviceWithBackend(tokenData.data);

      return tokenData.data;
    } catch (error) {
      console.error("📱 Error registering for push notifications:", error);
      return null;
    }
  }, [registerDeviceWithBackend]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);

      if (granted && isAuthenticated) {
        // Get push token when permission is granted
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
      }

      return granted;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }, [isAuthenticated, registerForPushNotificationsAsync]);

  // Check permission status on mount and when auth changes
  useEffect(() => {
    const checkPermission = async () => {
      // Skip on web for now - web notifications work differently
      if (Platform.OS === "web") {
        setHasPermission(null);
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);

      if (granted && isAuthenticated) {
        // Already have permission, get push token
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
      }
      // Removed automatic permission request - let the UI prompt handle it
    };

    if (isAuthenticated) {
      checkPermission();
    } else {
      // Reset state when user logs out
      setHasPermission(null);
      setExpoPushToken(null);
    }
  }, [isAuthenticated, registerForPushNotificationsAsync]);

  // Listen for token refresh events
  // This happens when Firebase rotates the token
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") {
      return;
    }

    // Set up listener for token refresh
    tokenListenerRef.current = Notifications.addPushTokenListener(
      async (event) => {
        console.log("📱 Push token refreshed:", event.data);
        const newToken = event.data;

        // Update state
        setExpoPushToken(newToken);

        // Re-register with backend
        await registerDeviceWithBackend(newToken);
      },
    );

    return () => {
      // Clean up listener
      if (tokenListenerRef.current) {
        tokenListenerRef.current.remove();
        tokenListenerRef.current = null;
      }
    };
  }, [isAuthenticated, registerDeviceWithBackend]);

  return (
    <NotificationContext.Provider
      value={{ hasPermission, requestPermission, expoPushToken }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

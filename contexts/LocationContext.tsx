import { apiService } from "@/services/api";
import * as Location from "expo-location";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "./auth/AuthContext";

interface LocationContextType {
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { isAuthenticated } = useAuth();
  const lastLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Send location to backend
  const sendLocationToBackend = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        // Only send if location has changed significantly (> 100 meters)
        if (lastLocationRef.current) {
          const distance = getDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            latitude,
            longitude,
          );

          if (distance < 100) {
            return; // Don't send if movement is less than 100m
          }
        }

        await apiService.updateUserLocation(latitude, longitude);
        lastLocationRef.current = { latitude, longitude };
        console.log("📍 Location sent to backend:", { latitude, longitude });
      } catch (error) {
        console.error("Failed to send location:", error);
      }
    },
    [],
  );

  // Calculate distance between two coordinates (Haversine formula)
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Get current location and send to backend
  const getCurrentLocationAndSend = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await sendLocationToBackend(
        location.coords.latitude,
        location.coords.longitude,
      );
    } catch (error) {
      console.error("Failed to get current location:", error);
    }
  }, [sendLocationToBackend]);

  // Request location permission
  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);

      if (granted && isAuthenticated) {
        // Send location immediately when permission is granted
        await getCurrentLocationAndSend();
        // Start watching location
        startWatchingLocation();
      }

      return granted;
    } catch (error) {
      console.error("Failed to request location permission:", error);
      return false;
    }
  };

  // Start watching location changes
  const startWatchingLocation = useCallback(async () => {
    try {
      // Clean up existing subscription
      if (locationSubscriptionRef.current) {
        try {
          if (typeof locationSubscriptionRef.current.remove === "function") {
            locationSubscriptionRef.current.remove();
          }
        } catch (error) {
          console.error("Failed to remove location subscription:", error);
        }
        locationSubscriptionRef.current = null;
      }

      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 100, // Update every 100 meters
          timeInterval: 300000, // Or every 5 minutes
        },
        (location) => {
          if (isAuthenticated && AppState.currentState === "active") {
            sendLocationToBackend(
              location.coords.latitude,
              location.coords.longitude,
            );
          }
        },
      );
    } catch (error) {
      console.error("Failed to watch location:", error);
    }
  }, [isAuthenticated, sendLocationToBackend]);

  // Check permission status on mount and when auth changes
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);

      if (granted) {
        // Already have permission, start tracking
        await getCurrentLocationAndSend();
        startWatchingLocation();
      }
      // Removed automatic permission request - let the UI prompt handle it
    };

    if (isAuthenticated) {
      checkPermission();
    } else {
      // Clean up when user logs out
      if (locationSubscriptionRef.current) {
        try {
          if (typeof locationSubscriptionRef.current.remove === "function") {
            locationSubscriptionRef.current.remove();
          }
        } catch (error) {
          console.error(
            "Failed to remove location subscription on logout:",
            error,
          );
        }
        locationSubscriptionRef.current = null;
      }
      lastLocationRef.current = null;
    }

    return () => {
      if (locationSubscriptionRef.current) {
        try {
          if (typeof locationSubscriptionRef.current.remove === "function") {
            locationSubscriptionRef.current.remove();
          }
        } catch (error) {
          console.error(
            "Failed to remove location subscription in cleanup:",
            error,
          );
        }
        locationSubscriptionRef.current = null;
      }
    };
  }, [isAuthenticated, getCurrentLocationAndSend, startWatchingLocation]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        isAuthenticated &&
        hasPermission
      ) {
        // Send location when app comes to foreground
        getCurrentLocationAndSend();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [isAuthenticated, hasPermission, getCurrentLocationAndSend]);

  return (
    <LocationContext.Provider value={{ hasPermission, requestPermission }}>
      {children}
    </LocationContext.Provider>
  );
};

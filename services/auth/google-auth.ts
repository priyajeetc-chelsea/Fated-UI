import { AuthConfig } from "@/services/auth/config";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

// Complete the authentication session for web
WebBrowser.maybeCompleteAuthSession();

/**
 * Generate a cryptographically random string synchronously.
 * Uses crypto.getRandomValues() which is sync and available in all modern browsers.
 * This avoids breaking Safari's popup gesture chain (which requires window.open
 * to be called synchronously from a user click handler).
 */
function generateRandomStringSync(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export class GoogleAuthService {
  /**
   * Initialize Google Sign-In for the current platform
   */
  static async signIn(): Promise<string> {
    if (Platform.OS === "web") {
      return await this.signInWeb();
    } else {
      return await this.signInNative();
    }
  }

  /**
   * Sign in with Google using a fully synchronous setup before opening the popup.
   *
   * Safari blocks popups if window.open() is not called in the synchronous
   * execution path of a user gesture. The previous implementation had 4 awaits
   * (Crypto.digestStringAsync, AuthRequest internals, promptAsync) between the
   * click and the popup, so Safari blocked it on first attempt.
   *
   * This version builds the entire OAuth URL synchronously and hands it straight
   * to WebBrowser.openAuthSessionAsync(), which calls window.open() as its very
   * first statement — keeping the gesture chain intact.
   */
  private static async signInWeb(): Promise<string> {
    try {
      console.log("Starting Google Sign-In for Web...");

      // --- All sync work: build the OAuth URL before any await ---

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const cleanOrigin = origin.replace(/\.+$/, "");
      const redirectUri = `${cleanOrigin}/auth/callback`;

      console.log("Redirect URI:", redirectUri);

      // Sync nonce & state (no await — preserves Safari gesture chain)
      const nonce = generateRandomStringSync();
      const state = generateRandomStringSync();

      // Build Google OAuth URL synchronously
      const params = new URLSearchParams({
        client_id: AuthConfig.GOOGLE_WEB_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "id_token",
        scope: "openid profile email",
        nonce,
        state,
        access_type: "online",
        prompt: "select_account",
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      // --- First await is inside openAuthSessionAsync, but window.open()
      //     fires synchronously at the top of that function, so the popup
      //     is already open before any async work happens. ---
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
      );

      if (result.type === "success" && result.url) {
        // Google implicit flow returns params in the URL fragment (#)
        const responseUrl = new URL(result.url);
        const fragment = new URLSearchParams(responseUrl.hash.substring(1));

        // CSRF check: verify state matches
        const returnedState = fragment.get("state");
        if (returnedState !== state) {
          throw new Error(
            "OAuth state mismatch — possible CSRF. Please try again.",
          );
        }

        const idToken = fragment.get("id_token");
        if (!idToken) {
          const error = fragment.get("error");
          throw new Error(
            error
              ? `Google OAuth error: ${error}`
              : "No ID token received from Google",
          );
        }

        console.log("Google Sign-In successful (Web)");
        return idToken;
      } else if (result.type === "cancel" || result.type === "dismiss") {
        throw new Error("Google Sign-In was cancelled");
      } else {
        throw new Error("Google Sign-In failed");
      }
    } catch (error) {
      console.error("Google Sign-In failed (Web):", error);
      throw error;
    }
  }

  /**
   * Sign in with Google using @react-native-google-signin (iOS/Android)
   */
  private static async signInNative(): Promise<string> {
    try {
      console.log("📱 Starting Google Sign-In for Native...");

      const { GoogleSignin } =
        await import("@react-native-google-signin/google-signin");

      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: AuthConfig.GOOGLE_WEB_CLIENT_ID,
        iosClientId: AuthConfig.GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
      });

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error("No ID token received from Google");
      }

      console.log("✅ Google Sign-In successful (Native)");
      return userInfo.data.idToken;
    } catch (error: any) {
      console.error("❌ Google Sign-In failed (Native):", error);

      // Handle specific error cases
      if (error.code === "SIGN_IN_CANCELLED") {
        throw new Error("Google Sign-In was cancelled");
      } else if (error.code === "IN_PROGRESS") {
        throw new Error("Google Sign-In already in progress");
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        throw new Error("Google Play Services not available");
      }

      throw error;
    }
  }

  /**
   * Sign out from Google
   */
  static async signOut(): Promise<void> {
    try {
      if (Platform.OS !== "web") {
        const { GoogleSignin } =
          await import("@react-native-google-signin/google-signin");
        await GoogleSignin.signOut();
        console.log("✅ Signed out from Google");
      }
    } catch (error) {
      console.error("❌ Failed to sign out from Google:", error);
      // Don't throw error, as sign out from Google is not critical
    }
  }
}

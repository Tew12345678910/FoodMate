import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import ProgressiveBlurView from "../../components/ui/ProgressiveBlurView";
import Animated, { useSharedValue } from "react-native-reanimated";

export default function VerificationPendingScreen() {
  const {
    sendVerificationEmail,
    isLoading,
    error,
    user,
    checkEmailVerification,
  } = useAuth();
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [localError, setLocalError] = useState("");

  // Create an animated value for the blur effect
  const scrollY = useSharedValue(0);

  // Email to display - use user.email if available
  const userEmail = user?.email || "";

  // Continuously check for email verification
  useEffect(() => {
    if (!user) return;

    console.log(
      `Starting verification check for user: ${user.email}, current verification status: ${user.emailVerified}`
    );

    // Set up polling for email verification status
    const checkInterval = setInterval(async () => {
      try {
        setVerifying(true);
        const isVerified = await checkEmailVerification();

        console.log(
          `Verification check result: ${
            isVerified ? "Verified" : "Not verified yet"
          }`
        );

        if (isVerified) {
          // Clear interval and redirect to index page on verification
          clearInterval(checkInterval);
          console.log("Email verified! Redirecting to index page...");
          router.replace("/(tabs)");
        }
      } catch (err) {
        console.error("Error checking email verification:", err);
        setLocalError("Failed to check verification status. Please try again.");
      } finally {
        setVerifying(false);
      }
    }, 5000); // Check every 5 seconds

    // Clean up on unmount
    return () => clearInterval(checkInterval);
  }, [user, router, checkEmailVerification]);

  const handleGoToRegister = () => {
    router.push("/register");
  };

  // Display either context error or local error
  const displayError = error || localError;

  return (
    <View style={styles.container}>
      <ProgressiveBlurView scrollY={scrollY} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={(event) => {
          "worklet";
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoToRegister}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.stepContainer}>
          <Text
            className="text-3xl font-normal mb-5 font-serif text-center"
            style={styles.stepTitle}
          >
            Verify Your Email
          </Text>

          <Text style={styles.stepDescription}>
            We sent a verification email to {userEmail}. Please check your inbox
            and click the verification link before logging in.
          </Text>

          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={64} color={Colors.primary} />
          </View>

          {verifying && (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.verifyingText}>
                Checking verification status...
              </Text>
            </View>
          )}

          <Text style={styles.stepDescription}>
            After verifying your email, you'll be automatically redirected to
            the app.
          </Text>

          {displayError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Sending email...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                try {
                  sendVerificationEmail();
                } catch (err) {
                  // Error is already handled in the context
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Resend Verification Email</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryButtonText}>Go to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleGoToRegister}
          >
            <Text style={styles.restartButtonText}>Back to Registration</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom padding for better scrolling */}
        <View style={{ height: 32 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 90,
    paddingBottom: 32,
  },
  backButton: {
    position: "absolute",
    top: 70,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  stepContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "400",
    color: Colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  stepDescription: {
    textAlign: "center",
    color: Colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  iconContainer: {
    marginVertical: 24,
    padding: 16,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: "100%",
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 28,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "rgba(255,255,255,0.5)",
    width: "100%",
  },
  buttonText: {
    color: "black",
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
  },
  secondaryButtonText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 18,
    textAlign: "center",
  },
  restartButton: {
    marginTop: 8,
  },
  restartButtonText: {
    color: Colors.primary,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.08)",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.16)",
    width: "100%",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    width: "100%",
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
  verifyingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 30,
  },
  verifyingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
});

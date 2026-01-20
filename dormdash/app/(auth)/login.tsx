import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import CustomRefreshControl from "../../components/ui/CustomRefreshControl";
import Animated, { useSharedValue } from "react-native-reanimated";
import ProgressiveBlurView from "../../components/ui/ProgressiveBlurView";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, isValidEmail, user } = useAuth();
  const router = useRouter();

  // Create an animated value to track scroll position for the blur effect
  const scrollY = useSharedValue(0);

  // Handle normal email/password login
  const handleLogin = async () => {
    // Reset local error
    setLocalError("");

    // Basic validation
    if (!email || !password) {
      setLocalError("Email and password are required");
      return;
    }

    // Validate email domain
    if (!isValidEmail(email)) {
      setLocalError("Only @connect.ust.hk and @ust.hk emails are allowed");
      return;
    }

    try {
      await login(email, password);

      // If successful, AuthContext will handle navigation via onAuthStateChanged
    } catch (err: any) {
      console.error("Login error:", err);

      // Handle email verification check here
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        // We don't change the error here to avoid giving away which emails exist
      } else if (err.code === "auth/invalid-email") {
        setLocalError("Invalid email format");
      } else if (err.code === "auth/too-many-requests") {
        setLocalError(
          "Too many failed login attempts. Please try again later."
        );
      } else if (err.code === "auth/user-disabled") {
        setLocalError(
          "This account has been disabled. Please contact support."
        );
      }
      // Error is already handled in the auth context
    }
  };

  // Format error message to remove "Firebase:" prefix
  const formatErrorMessage = (errorMsg: string | null): string | null => {
    if (!errorMsg) return null;
    return errorMsg.replace(/^Firebase:\s*/i, '');
  };

  // Show either context error or local error, with Firebase: prefix removed
  const displayError = formatErrorMessage(error) || localError;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
      >
        <ProgressiveBlurView scrollY={scrollY} />

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={(event) => {
            "worklet";
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          refreshControl={
            <CustomRefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);

                // Use setTimeout to ensure the refreshing state has time to update
                setTimeout(() => {
                  try {
                    // Clear form state as part of refresh
                    setLocalError("");
                    setEmail("");
                    setPassword("");
                  } finally {
                    setRefreshing(false);
                  }
                }, 100);
              }}
            />
          }
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text
            className="text-4xl font-normal mb-9 font-serif text-center"
            style={styles.pageTitle}
          >
            Log In
          </Text>

          {displayError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Logging in...</Text>
            </View>
          ) : (
            <>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your HKUST email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.lightText}
                />
                <Text style={styles.helperText}>
                  Only @connect.ust.hk and @ust.hk domains allowed
                </Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={Colors.lightText}
                  />
                  <TouchableOpacity
                    style={styles.passwordVisibilityButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color={Colors.lightText}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupLink}
                onPress={() => router.push("/register")}
              >
                <Text style={styles.signupText}>
                  Don't have an account?{" "}
                  <Text style={styles.signupHighlight}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Bottom padding for better scrolling */}
          <View style={{ height: 32 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
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
  pageTitle: {
    fontSize: 36,
    fontWeight: "400",
    color: Colors.text,
    marginBottom: 36,
    marginTop: 40,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.08)",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.16)",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.text,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  helperText: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: 6,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 28,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: "black",
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
  },
  signupLink: {
    marginTop: 8,
    alignItems: "center",
  },
  signupText: {
    color: Colors.text,
    fontSize: 16,
    textAlign: "center",
  },
  signupHighlight: {
    color: Colors.primary,
    fontWeight: "700",
  },
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  passwordVisibilityButton: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
});

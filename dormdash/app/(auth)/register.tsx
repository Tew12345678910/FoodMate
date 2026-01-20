import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import RegisterTermsAndConditions from "../../components/terms/RegisterTermsAndConditions";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { register, isLoading, error, isValidEmail } = useAuth();

  const router = useRouter();

  const scrollY = useSharedValue(0);

  const handleRegister = async () => {
    setLocalError("");

    if (!username || !email || !password) {
      setLocalError("Username, email, and password are required");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (!isValidEmail(email)) {
      setLocalError("Only @connect.ust.hk and @ust.hk emails are allowed");
      return;
    }

    if (!termsAccepted) {
      setLocalError("You must accept the Terms and Conditions to register");
      return;
    }

    try {
      await register(email, password, username, phone);
      router.push("/verificationPending");
    } catch (err: any) {
      console.error("Registration error:", err);
      if (!error) {
        setLocalError("Failed to create account. Please try again.");
      }
    }
  };

  const displayError = error || localError;

  return (
    <BottomSheetModalProvider>
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

                  setTimeout(() => {
                    try {
                      setUsername("");
                      setEmail("");
                      setPhone("");
                      setPassword("");
                      setConfirmPassword("");
                      setLocalError("");
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
              Create Account
            </Text>

            {displayError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Creating your account...</Text>
              </View>
            ) : (
              <>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    value={username}
                    onChangeText={setUsername}
                    placeholderTextColor={Colors.lightText}
                  />
                </View>

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
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.lightText}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Create a password"
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

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      placeholderTextColor={Colors.lightText}
                    />
                    <TouchableOpacity
                      style={styles.passwordVisibilityButton}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={24}
                        color={Colors.lightText}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <RegisterTermsAndConditions
                  termsAccepted={termsAccepted}
                  setTermsAccepted={setTermsAccepted}
                />

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.loginText}>
                    Already have an account?{" "}
                    <Text style={styles.loginHighlight}>Log In</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 32 }} />
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </View>
    </BottomSheetModalProvider>
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
    marginBottom: 20,
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
  primaryButton: {
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
  buttonText: {
    color: "black",
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
  },
  loginLink: {
    marginTop: 8,
    alignItems: "center",
  },
  loginText: {
    color: Colors.text,
    fontSize: 16,
    textAlign: "center",
  },
  loginHighlight: {
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    fontSize: 16,
    color: Colors.text,
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
});

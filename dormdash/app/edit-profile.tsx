import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
// Import Moti Skeleton components
import { Skeleton } from "moti/skeleton";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import Animated, { useSharedValue } from "react-native-reanimated";
import ProgressiveBlurView from "../components/ui/ProgressiveBlurView";
import Header from "../components/ui/Header";

const EditProfile = () => {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Create an animated value to track scroll position for the blur effect
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    // Basic validation
    if (!username.trim()) {
      return Alert.alert("Error", "Username cannot be empty");
    }

    if (!email.trim()) {
      return Alert.alert("Error", "Email cannot be empty");
    }

    setIsLoading(true);
    try {
      await updateProfile({
        username,
        email,
        phone,
      });

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update your profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Spacer component for skeleton spacing
  const Spacer = ({ height = 8 }) => <View style={{ height }} />;

  // Create skeleton components for form fields
  const FormFieldSkeleton = () => (
    <View style={styles.fieldContainer}>
      <MotiView transition={{ type: "timing" }}>
        <Skeleton colorMode="light" width={120} height={20} radius={4} />
      </MotiView>
      <Spacer height={8} />
      <MotiView transition={{ type: "timing" }}>
        <Skeleton colorMode="light" height={50} radius={8} />
      </MotiView>
    </View>
  );

  if (!user) {
    // Redirect to login if no user
    router.replace("/(auth)/login");
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Progressive blur header */}
      <ProgressiveBlurView scrollY={scrollY} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <Animated.ScrollView
          style={styles.scrollView}
          onScroll={(event) => {
            "worklet";
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <Header />

          <View className="p-4">
            <Text className="text-4xl font-normal mb-5 font-serif">
              Edit Profile
            </Text>
          </View>

          {isLoading || authLoading ? (
            <View className="px-7">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <MotiView
                transition={{ type: "timing" }}
                style={styles.buttonSkeleton}
              >
                <Skeleton colorMode="light" height={56} radius={8} />
              </MotiView>
            </View>
          ) : (
            <View className="px-7 pb-24">
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor={Colors.lightText}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.lightText}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.lightText}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

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
  buttonSkeleton: {
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
  },
});

export default EditProfile;

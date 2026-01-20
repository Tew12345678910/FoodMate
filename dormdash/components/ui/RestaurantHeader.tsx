import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { BlurView } from "expo-blur";
import Colors from "../../constants/Colors";
import { getCartDetails } from "../../services/cart";

interface RestaurantHeaderProps {
  scrollY: Animated.Value;
}

const RestaurantHeader = ({ scrollY }: RestaurantHeaderProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);

  // Create animated values for header transition
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    // Get cart items count from cloud API
    const getCartItems = async () => {
      if (!user?.id) return;

      try {
        // Use the existing API function that fetches from cloud
        const carts = await getCartDetails(user.id.toString());

        // Calculate total quantity of items across all carts
        const totalItems = carts.reduce((total, cart) => {
          return (
            total +
            cart.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
          );
        }, 0);

        setCartItemCount(totalItems);
      } catch (error) {
        console.error("Error fetching cart data:", error);
        setCartItemCount(0);
      }
    };

    if (user) {
      getCartItems();
    }

    // Set up a listener for cart changes
    const intervalId = setInterval(() => {
      if (user) {
        getCartItems();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  const handleCartPress = () => {
    router.push("/cart");
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.headerContainer}>
      {/* Animated background */}
      <Animated.View
        style={[
          styles.headerBackground,
          {
            opacity: headerBackgroundOpacity,
          },
        ]}
      >
        <BlurView intensity={80} tint="light" style={styles.blur} />
      </Animated.View>

      <View style={styles.headerContent}>
        {/* Back Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: Colors.secondary }]}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Cart Icon with Notification Bubble */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: Colors.secondary }]}
          onPress={handleCartPress}
        >
          <Ionicons name="basket" size={20} color="#666" />
          {cartItemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    width: "100%",
    height: Platform.OS === "ios" ? 100 : 74,
    paddingTop: Platform.OS === "ios" ? 44 : StatusBar.currentHeight,
    paddingBottom: 10,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blur: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 12,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF0000",
    borderRadius: 9999,
    height: 20,
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default RestaurantHeader;

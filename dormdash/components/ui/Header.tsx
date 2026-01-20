import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { getCartDetails } from "../../services/cart";

interface CartItem {
  quantity: number;
}

const Header = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    // Get cart items count from the cloud API
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

  const handleProfilePress = () => {
    router.push("/(tabs)/profile");
  };

  return (
    <View className="flex flex-row justify-between items-center p-5 h-24 mt-16">
      {/* Profile Section with Icon and Username */}
      <View className="flex flex-row items-center">
        <TouchableOpacity
          className="p-3 rounded-full bg-mates-blue items-center justify-center"
          onPress={handleProfilePress}
        >
          <Ionicons name="person" size={20} color="#666" />
        </TouchableOpacity>
        {user?.username && (
          <Text className="ml-2 text-gray-700 font-semibold">
            {user.username}
          </Text>
        )}
      </View>

      {/* Cart Icon with Notification Bubble */}
      <TouchableOpacity
        className="p-3 relative rounded-full bg-mates-blue items-center justify-center"
        onPress={handleCartPress}
      >
        <Ionicons name="basket" size={20} color="#666" />
        {cartItemCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full h-5 w-5 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {cartItemCount > 9 ? "9+" : cartItemCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Header;

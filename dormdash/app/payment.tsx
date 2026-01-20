import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import Colors from "../constants/Colors";
import {
  placeOrder,
  PlaceOrderParams,
  generateQrCode,
} from "../services/orders";
import { clearCartItem } from "@/services/cart";
import Header from "../components/ui/Header";
import ProgressiveBlurView from "../components/ui/ProgressiveBlurView";
import Animated, { useSharedValue } from "react-native-reanimated";

// Fixed API endpoint for QR code generation
const API_BASE_URL = "https://api.example.com"; // Replace with your actual API URL

const PaymentScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse and validate params
  const total = typeof params.total === "string" ? parseFloat(params.total) : 0;
  const userId = typeof params.userId === "string" ? params.userId : "";
  const location = typeof params.location === "string" ? params.location : "";
  const orderData =
    typeof params.orderData === "string" ? JSON.parse(params.orderData) : [];

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [error, setError] = useState("");

  // Create an animated value to track scroll position for the blur effect
  const scrollY = useSharedValue(0);

  useEffect(() => {
    // Generate QR code on component mount
    generateQrCodeData();
  }, []);

  // Use the imported generateQrCode function from orders.ts
  const generateQrCodeData = async () => {
    setIsLoading(true);
    try {
      const response = await generateQrCode(total);

      if (response && response.fps_payload) {
        setQrCodeData(response.fps_payload);
      } else {
        throw new Error("Invalid QR code response");
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      setError(
        "Failed to generate payment QR code. Please go back and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!userId || !location || orderData.length === 0) {
      Alert.alert(
        "Error",
        "Missing order information. Please go back and try again."
      );
      return;
    }

    setIsProcessing(true);
    try {
      // Process each order in the array
      for (const order of orderData) {
        const orderParams: PlaceOrderParams = {
          user_id: Number(userId),
          restaurant_name: order.restaurant_name,
          location: location,
          deliveryfee: order.deliveryfee,
          total_price: total, // Add the total price from params
          items: order.items,
        };

        // Place the order
        const orderResponse = await placeOrder(orderParams);

        if (orderResponse.order_id) {
          // Clear cart after successful order
          if (order.cart_id) {
            await clearCartItem(order.cart_id);
          }
        }
      }

      // Navigate to home after successful order placement
      Alert.alert("Order Placed", "Your order has been placed successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error) {
      console.error("Failed to place order:", error);
      Alert.alert(
        "Payment Incomplete",
        "The transaction is not complete. Please make sure you have transferred the money and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Progressive blur header with animation */}
      <ProgressiveBlurView scrollY={scrollY} />

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
          <Text className="text-4xl font-normal mb-5 font-serif">Payment</Text>
        </View>

        <View className="px-7 pb-24">
          {error ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="warning-outline" size={60} color={Colors.error} />
              <Text className="text-center text-red-500 text-lg mt-4 mb-6">
                {error}
              </Text>
              <TouchableOpacity
                className="bg-orange-400 py-3 px-8 rounded-full"
                onPress={() => router.back()}
              >
                <Text className="text-white font-bold">Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="items-center mb-8">
                <Text className="text-lg mb-2">Scan to pay</Text>
                <Text className="text-3xl font-bold mb-6">
                  {total.toFixed(2)} HKD
                </Text>

                <View className="mb-8 border border-gray-200 bg-white rounded-3xl p-4 items-center justify-center">
                  {isLoading ? (
                    <ActivityIndicator size="large" color={Colors.primary} />
                  ) : (
                    <QRCode
                      value={qrCodeData || "https://example.com"}
                      size={220}
                      backgroundColor="white"
                      color="black"
                    />
                  )}
                </View>
              </View>

              <Text className="text-center text-gray-500 mb-6">
                After making the payment, click the button below to complete
                your order
              </Text>

              <TouchableOpacity
                className="py-4 rounded-full w-full items-center bg-orange-400"
                onPress={handleCompleteOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Complete Order
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
});

export default PaymentScreen;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import { useAuth } from "../contexts/AuthContext";
import { getCartDetails, CartData, CartOrderItem } from "../services/cart";
import { getLocations } from "../services/orders";
import Animated, { useSharedValue } from "react-native-reanimated";
import Colors from "../constants/Colors";
import Header from "../components/ui/Header";
import ProgressiveBlurView from "../components/ui/ProgressiveBlurView";
import { getSelectedCartId } from "../services/storage";

// Set delivery fee constant - base fee + percentage of subtotal
const BASE_DELIVERY_FEE = 5; // HKD
const DELIVERY_FEE_PERCENTAGE = 0.05; // 5% of subtotal
const UTENSILS_FEE = 2; // HKD per order

const CheckoutScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartData[]>([]);
  const [locations, setLocations] = useState<{ location: string }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subtotal, setSubtotal] = useState(0);

  // Create an animated value to track scroll position for the blur effect
  const scrollY = useSharedValue(0);

  useEffect(() => {
    // Allow non-logged in users to view the checkout page,
    // but only fetch cart details if user is logged in
    if (user) {
      fetchCartDetails();
      fetchLocations();
    }
  }, [user]);

  // Calculate delivery fee based on whether rush delivery is selected
  const deliveryFee = parseFloat(
    (BASE_DELIVERY_FEE + subtotal * DELIVERY_FEE_PERCENTAGE).toFixed(2)
  );

  // Calculate utensils fee (2 HKD per order)
  const utensilsFee = parseFloat((cartItems.length * UTENSILS_FEE).toFixed(2));

  // Calculate total price - rounded to 2 decimal places
  const total = parseFloat((subtotal + deliveryFee + utensilsFee).toFixed(2));

  const fetchCartDetails = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const data = await getCartDetails(String(user.id));

      // Get the selected cart ID from AsyncStorage
      const selectedCartId = await getSelectedCartId(String(user.id));

      // Mark carts as selected based on the saved selection
      const cartsWithSelection = data.map((cart) => ({
        ...cart,
        selected: cart.cart_id === selectedCartId,
      }));

      // Filter to only include the selected cart
      const selectedCarts = cartsWithSelection.filter((cart) => cart.selected);

      // If no carts are selected but there's only one cart, select it
      if (selectedCarts.length === 0) {
        if (data.length === 1) {
          data[0].selected = true;
          setCartItems(data);
        } else {
          // No selection and multiple carts - show empty state
          setCartItems([]);
        }
      } else {
        // We have selected carts
        setCartItems(selectedCarts);
      }

      // Calculate subtotal for selected carts
      const calculatedSubtotal = selectedCarts.reduce((total, cart) => {
        return (
          total +
          cart.orderItems.reduce((cartTotal, item) => {
            const itemPrice = (item.food_price || 0) * item.quantity;
            const requirementsPrice = item.requirements
              ? item.requirements.reduce(
                  (sum, req) => sum + Number(req.price),
                  0
                ) * item.quantity
              : 0;
            return cartTotal + itemPrice + requirementsPrice;
          }, 0)
        );
      }, 0);

      setSubtotal(calculatedSubtotal);
    } catch (error) {
      console.error("Failed to fetch cart details:", error);
      Alert.alert(
        "Error",
        "Failed to fetch your cart items. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const locationData = await getLocations();
      console.log("Fetched locations:", locationData);
      setLocations(locationData);

      // Set default location if available
      if (locationData.length > 0) {
        setSelectedLocation(locationData[0].location);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      Alert.alert(
        "Error",
        "Failed to fetch delivery locations. Please try again."
      );
    }
  };

  const handleProceedToPayment = () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to place an order");
      router.replace("/(auth)/login");
      return;
    }

    if (!selectedLocation) {
      Alert.alert("Error", "Please select a delivery location");
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert("Error", "Please select a restaurant from your cart first");
      router.replace("/cart");
      return;
    }

    // Prepare order data for each selected restaurant
    const preparedOrderData = cartItems.map((cart) => ({
      cart_id: cart.cart_id,
      restaurant_name: cart.restaurant_name,
      deliveryfee: deliveryFee,
      items: cart.orderItems
        .filter((item) => item.food_id !== undefined)
        .map((item) => ({
          food_id: item.food_id as number,
          quantity: item.quantity,
          requirements: item.requirements
            ? item.requirements.map((req) => ({
                description: req.description,
                requirement_price: req.price,
                section_name: req.section_name,
              }))
            : [],
        })),
    }));

    // Navigate to payment page with necessary params
    router.push({
      pathname: "/payment",
      params: {
        total: total.toString(),
        userId: user.id.toString(),
        location: selectedLocation,
        orderData: JSON.stringify(preparedOrderData),
      },
    });
  };

  // Render cart item with its details
  const renderCartItem = (item: CartOrderItem, restaurantName: string) => (
    <View key={`${restaurantName}-${item.food_id}`} className="py-2">
      <View className="flex-row justify-between">
        <Text className="font-medium">
          {item.quantity}× {item.food_name}
        </Text>
        <Text className="font-medium">
          {((item.food_price || 0) * item.quantity).toFixed(1)} HKD
        </Text>
      </View>

      {item.requirements && item.requirements.length > 0 && (
        <View className="ml-4">
          {item.requirements.map((req, idx) => (
            <View key={idx} className="flex-row justify-between">
              <Text className="text-gray-500 text-sm">+ {req.description}</Text>
              <Text className="text-gray-500 text-sm">
                {(req.price * item.quantity).toFixed(1)} HKD
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Render each restaurant's cart
  const renderRestaurantCart = (cart: CartData, index: number) => (
    <View key={`checkout-cart-${index}`} className="mb-4">
      <Text className="font-bold text-lg mb-2">{cart.restaurant_name}</Text>
      <View className="bg-white p-4 rounded-xl">
        {cart.orderItems.map((item) =>
          renderCartItem(item, cart.restaurant_name)
        )}
      </View>
    </View>
  );

  // Prepare location data for dropdown
  const locationData = locations.map((loc) => ({
    label: loc.location,
    value: loc.location,
  }));

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
          <Text className="text-4xl font-normal mb-5 font-serif">Checkout</Text>
        </View>

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="mt-4 text-gray-500">Loading your cart...</Text>
          </View>
        ) : cartItems.length > 0 ? (
          <View className="px-7 pb-24">
            {/* Delivery Location - Using react-native-element-dropdown */}
            <View className="mb-6">
              <Text className="font-bold text-lg mb-2">Delivery Location</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={locationData}
                search={false}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select location"
                value={selectedLocation}
                onChange={(item) => {
                  setSelectedLocation(item.value);
                }}
                renderLeftIcon={() => (
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="gray"
                    style={styles.iconStyle}
                  />
                )}
              />
            </View>

            {/* Delivery Note */}
            <View className="mb-6">
              <Text className="font-bold text-lg mb-2">Delivery Details</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Provide precise delivery instructions (e.g. building, floor, room number or landmark) so our partner can find you."
                placeholderTextColor="#6b7280"
                value={deliveryNote}
                onChangeText={setDeliveryNote}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Order Summary */}
            <View className="mb-6">
              <Text className="font-bold text-lg mb-2">Order Summary</Text>
              {cartItems.map(renderRestaurantCart)}
            </View>

            {/* Cost Breakdown */}
            <View className="mt-6 mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="font-medium">{subtotal.toFixed(2)} HKD</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Delivery Fee</Text>
                <Text className="font-medium">
                  {deliveryFee.toFixed(2)} HKD
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Utensils Fee</Text>
                <Text className="font-medium">
                  {utensilsFee.toFixed(2)} HKD
                </Text>
              </View>
              <View className="flex-row justify-between pt-2 mt-2 border-t border-gray-200">
                <Text className="font-bold text-lg">Total</Text>
                <Text className="font-bold text-lg">
                  {total.toFixed(2)} HKD
                </Text>
              </View>
            </View>

            {/* Payment Button */}
            <TouchableOpacity
              className="bg-orange-400 py-4 rounded-full w-full items-center mb-8"
              onPress={handleProceedToPayment}
              disabled={isProcessing || !selectedLocation}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Proceed to Payment
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center justify-center py-20">
            <Ionicons name="cart-outline" size={80} color="#CCC" />
            <Text className="text-xl font-bold text-gray-400 mt-4">
              No restaurant selected
            </Text>
            <Text className="text-gray-400 text-center mt-2 mb-6">
              Please go back to your cart and select a restaurant to checkout
            </Text>
            <TouchableOpacity
              className="bg-orange-400 py-3 px-8 rounded-full"
              onPress={() => router.push("/cart")}
            >
              <Text className="text-white font-bold">Back to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
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
  dropdown: {
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: "white",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "gray",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "black",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  iconStyle: {
    marginRight: 5,
  },
  textInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: 16,
    color: "black",
  },
  placeholderText: {
    color: "#6b7280", // Darker gray color (equivalent to text-gray-500)
  },
});

export default CheckoutScreen;

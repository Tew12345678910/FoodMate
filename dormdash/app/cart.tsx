import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/ui/Header";
import { useAuth } from "../contexts/AuthContext";
import {
  getCartDetails,
  clearCartItem,
  CartData,
  CartOrderItem,
} from "../services/cart";
// Import Moti Skeleton components
import { Skeleton } from "moti/skeleton";
import { MotiView } from "moti";
import Colors from "../constants/Colors";
import Animated, { useSharedValue } from "react-native-reanimated";
import ProgressiveBlurView from "../components/ui/ProgressiveBlurView";
import CustomRefreshControl from "../components/ui/CustomRefreshControl";
import { saveSelectedCart } from "../services/storage";

interface RestaurantGroup {
  restaurant_name: string;
  items: {
    cart_id: string;
    food_id: number;
    food_name: string;
    food_price: number;
    food_section: string;
    quantity: number;
    requirements?: any[];
  }[];
}

const CartScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartData[]>([]);
  // Group cart items by restaurant
  const [restaurantGroups, setRestaurantGroups] = useState<RestaurantGroup[]>(
    []
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Track selected items (foodId -> boolean)
  const [selectedItems, setSelectedItems] = useState<Map<string, boolean>>(
    new Map()
  );

  // Create an animated value to track scroll position for the blur effect
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (user) {
      fetchCartDetails();
    } else {
      // If not logged in, redirect to login page
      router.replace("/(auth)/login");
    }
  }, [user]);

  // Group items by restaurant
  useEffect(() => {
    const groups: { [key: string]: RestaurantGroup } = {};

    cartItems.forEach((cart) => {
      cart.orderItems.forEach((item) => {
        const restaurantName = cart.restaurant_name;

        if (!groups[restaurantName]) {
          groups[restaurantName] = {
            restaurant_name: restaurantName,
            items: [],
          };
        }

        groups[restaurantName].items.push({
          cart_id: item.cart_id || cart.cart_id,
          food_id: item.food_id || 0,
          food_name: item.food_name || "Unnamed Item",
          food_price: item.food_price || 0,
          food_section: item.food_section || "Menu",
          quantity: item.quantity,
          requirements: item.requirements,
        });
      });
    });

    setRestaurantGroups(Object.values(groups));

    // Initialize selected items
    const newSelectedItems = new Map<string, boolean>();
    Object.values(groups).forEach((group) => {
      group.items.forEach((item) => {
        const itemKey = `${item.cart_id}-${item.food_id}`;
        newSelectedItems.set(itemKey, false);
      });
    });
    setSelectedItems(newSelectedItems);
  }, [cartItems]);

  const fetchCartDetails = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const data = await getCartDetails(String(user.id));
      setCartItems(data);
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

  const handleRemoveItem = async (itemCartId: string) => {
    if (!user?.id) return;

    // Show confirmation dialog first
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            try {
              // Call API to remove specific item
              await clearCartItem(itemCartId);
              // Refresh cart data after update
              fetchCartDetails();
            } catch (error) {
              console.error("Failed to remove item:", error);
              Alert.alert(
                "Error",
                "Failed to remove item from cart. Please try again."
              );
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  // Modified toggle selection function to ensure only one restaurant can be selected at a time
  const toggleItemSelection = (
    cartId: string,
    foodId: number,
    restaurantName: string
  ) => {
    const itemKey = `${cartId}-${foodId}`;

    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const currentValue = newMap.get(itemKey) || false;

      // If we're trying to select an item (not deselect)
      if (!currentValue) {
        // Check if any items from other restaurants are selected
        let otherRestaurantSelected = false;
        let selectedRestaurant = "";

        // For each restaurant group
        for (const group of restaurantGroups) {
          // If this is a different restaurant than the one we're trying to select from
          if (group.restaurant_name !== restaurantName) {
            // Check if any item from this restaurant is selected
            const hasSelectedItem = group.items.some((item) => {
              const key = `${item.cart_id}-${item.food_id}`;
              return newMap.get(key) === true;
            });

            if (hasSelectedItem) {
              otherRestaurantSelected = true;
              selectedRestaurant = group.restaurant_name;
              break;
            }
          }
        }

        // If item from another restaurant is selected, show alert and don't change the selection
        if (otherRestaurantSelected) {
          // Use setTimeout to avoid state updates during render
          setTimeout(() => {
            Alert.alert(
              "Cannot select from multiple restaurants",
              `You have items selected from ${selectedRestaurant}. Would you like to deselect them and select from ${restaurantName} instead?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Switch Restaurant",
                  onPress: () => {
                    // Clear all selections and select this item instead
                    setSelectedItems((prevState) => {
                      const freshMap = new Map<string, boolean>();

                      // Clear all previous selections
                      restaurantGroups.forEach((group) => {
                        group.items.forEach((item) => {
                          const key = `${item.cart_id}-${item.food_id}`;
                          freshMap.set(key, false);
                        });
                      });

                      // Select only this item
                      freshMap.set(itemKey, true);
                      return freshMap;
                    });
                  },
                },
              ]
            );
          }, 0);
          return prev; // Return unchanged selection
        }
      }

      // Toggle the current item
      newMap.set(itemKey, !currentValue);
      return newMap;
    });
  };

  // Select or deselect all items from a restaurant
  const toggleAllItemsInRestaurant = (restaurantName: string) => {
    const restaurant = restaurantGroups.find(
      (g) => g.restaurant_name === restaurantName
    );
    if (!restaurant) return;

    // Check if all items are selected
    const allSelected = restaurant.items.every((item) => {
      const itemKey = `${item.cart_id}-${item.food_id}`;
      return selectedItems.get(itemKey) === true;
    });

    // Toggle all items
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      restaurant.items.forEach((item) => {
        const itemKey = `${item.cart_id}-${item.food_id}`;
        newMap.set(itemKey, !allSelected);
      });
      return newMap;
    });
  };

  // Check if a specific item is selected
  const isItemSelected = (cartId: string, foodId: number): boolean => {
    const itemKey = `${cartId}-${foodId}`;
    return selectedItems.get(itemKey) === true;
  };

  // Check if all items in a restaurant are selected
  const areAllItemsSelected = (restaurantName: string): boolean => {
    const restaurant = restaurantGroups.find(
      (g) => g.restaurant_name === restaurantName
    );
    if (!restaurant || restaurant.items.length === 0) return false;

    return restaurant.items.every((item) => {
      const itemKey = `${item.cart_id}-${item.food_id}`;
      return selectedItems.get(itemKey) === true;
    });
  };

  // Calculate total price for selected items in a restaurant
  const calculateRestaurantTotal = (restaurantName: string) => {
    const restaurant = restaurantGroups.find(
      (g) => g.restaurant_name === restaurantName
    );
    if (!restaurant) return 0;

    return restaurant.items.reduce((total, item) => {
      const itemKey = `${item.cart_id}-${item.food_id}`;
      if (!selectedItems.get(itemKey)) return total;

      const itemPrice = item.food_price * item.quantity;
      const requirementsPrice = item.requirements
        ? item.requirements.reduce((sum, req) => sum + Number(req.price), 0) *
          item.quantity
        : 0;

      return total + itemPrice + requirementsPrice;
    }, 0);
  };

  // Calculate utensils fee (2 HKD per selected item)
  const calculateUtensilsFee = () => {
    // Count the number of selected meals across all restaurants
    let selectedMeals = 0;

    for (const group of restaurantGroups) {
      for (const item of group.items) {
        const itemKey = `${item.cart_id}-${item.food_id}`;
        if (selectedItems.get(itemKey)) {
          selectedMeals += 1;
        }
      }
    }

    // 2 HKD per meal
    return selectedMeals * 2;
  };

  // Updated grand total calculation to no longer include utensils fee
  const calculateGrandTotal = () => {
    const itemsTotal = restaurantGroups.reduce((total, group) => {
      return total + calculateRestaurantTotal(group.restaurant_name);
    }, 0);

    return itemsTotal;
  };

  // Check if any items are selected
  const hasSelectedItems = (): boolean => {
    for (const [_, isSelected] of selectedItems.entries()) {
      if (isSelected) return true;
    }
    return false;
  };

  // Save selected items for checkout
  const saveSelectionForCheckout = async () => {
    if (!user?.id) return;

    // Find first selected item to save its cart_id
    let firstSelectedCartId = "";

    for (const group of restaurantGroups) {
      for (const item of group.items) {
        const itemKey = `${item.cart_id}-${item.food_id}`;
        if (selectedItems.get(itemKey)) {
          firstSelectedCartId = item.cart_id;
          break;
        }
      }
      if (firstSelectedCartId) break;
    }

    if (firstSelectedCartId) {
      await saveSelectedCart(String(user.id), firstSelectedCartId);
      router.push("/checkout");
    } else {
      Alert.alert(
        "Selection Required",
        "Please select at least one item to checkout."
      );
    }
  };

  // Spacer component for skeleton spacing
  const Spacer = ({ height = 8 }) => <View style={{ height }} />;

  // Cart Item Skeleton component
  const CartItemSkeleton = () => (
    <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
      <View className="flex-1">
        <MotiView transition={{ type: "timing" }}>
          <Skeleton colorMode="light" width={150} height={20} radius={4} />
        </MotiView>
        <Spacer height={8} />
        <MotiView transition={{ type: "timing" }}>
          <Skeleton colorMode="light" width={100} height={16} radius={4} />
        </MotiView>
      </View>
      <MotiView transition={{ type: "timing" }}>
        <Skeleton colorMode="light" width={90} height={30} radius={15} />
      </MotiView>
    </View>
  );

  // Cart Skeleton component
  const CartSkeleton = () => (
    <View className="mb-4 border border-gray-200 bg-white rounded-3xl p-4">
      <MotiView transition={{ type: "timing" }} className="mb-4">
        <Skeleton colorMode="light" width={180} height={24} radius={4} />
      </MotiView>

      <CartItemSkeleton />
      <CartItemSkeleton />
      <CartItemSkeleton />

      <View className="flex-row justify-end items-center mt-4 pt-2 border-t border-gray-200">
        <MotiView transition={{ type: "timing" }}>
          <Skeleton colorMode="light" width={80} height={20} radius={4} />
        </MotiView>
        <MotiView transition={{ type: "timing" }} className="ml-2">
          <Skeleton colorMode="light" width={70} height={20} radius={4} />
        </MotiView>
      </View>
    </View>
  );

  // Render individual cart item
  const renderCartItem = (
    item: RestaurantGroup["items"][0],
    restaurantName: string
  ) => (
    <View
      key={`${item.cart_id}-${item.food_id}`}
      className="flex-row justify-between items-center py-3 border-b border-gray-100"
    >
      <View className="flex-row items-center flex-1">
        {/* Checkbox for item selection using the FoodDetailSheet style */}
        <TouchableOpacity
          onPress={() =>
            toggleItemSelection(item.cart_id, item.food_id, restaurantName)
          }
          disabled={isUpdating}
          activeOpacity={0.6}
        >
          <View
            className={`w-5 h-5 rounded border flex items-center justify-center ${
              isItemSelected(item.cart_id, item.food_id)
                ? "bg-[#FFA500] border-[#FFA500]"
                : "border-gray-300"
            }`}
          >
            {isItemSelected(item.cart_id, item.food_id) && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        </TouchableOpacity>

        <View className="flex-1 ml-3">
          <Text className="font-bold text-gray-800">
            {item.food_name} ({item.quantity}x)
          </Text>
          <Text className="text-gray-500 text-sm">
            {item.food_section} • {item.food_price.toFixed(2)} HKD
          </Text>

          {/* Requirements/Add-ons if any */}
          {item.requirements && item.requirements.length > 0 && (
            <View className="mt-1">
              {item.requirements.map((req, reqIndex) => (
                <Text key={reqIndex} className="text-gray-500 text-xs">
                  + {req.description}: {Number(req.price).toFixed(2)} HKD
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Remove item button */}
      <TouchableOpacity
        className="p-2"
        onPress={() => handleRemoveItem(item.cart_id)}
        disabled={isUpdating}
        activeOpacity={0.6}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  // Render restaurant card with items
  const renderRestaurantCard = (restaurantGroup: RestaurantGroup) => {
    return (
      <View
        key={restaurantGroup.restaurant_name}
        className="flex-row mb-2 border border-gray-200 bg-white rounded-3xl p-4"
      >
        <View className="flex-1">
          {/* Restaurant header with checkbox to select all */}
          <View className="flex-row items-center pb-3 mb-2 border-b border-gray-300">
            <TouchableOpacity
              onPress={() =>
                toggleAllItemsInRestaurant(restaurantGroup.restaurant_name)
              }
              disabled={isUpdating}
              activeOpacity={0.6}
            >
              <View
                className={`w-5 h-5 rounded border flex items-center justify-center ${
                  areAllItemsSelected(restaurantGroup.restaurant_name)
                    ? "bg-[#FFA500] border-[#FFA500]"
                    : "border-gray-300"
                }`}
              >
                {areAllItemsSelected(restaurantGroup.restaurant_name) && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>

            <Text className="text-lg font-bold ml-3">
              {restaurantGroup.restaurant_name}
            </Text>
          </View>

          {/* Restaurant items */}
          {restaurantGroup.items.map((item) =>
            renderCartItem(item, restaurantGroup.restaurant_name)
          )}

          {/* Restaurant subtotal */}
          <View className="flex-row justify-end items-center mt-3 pt-2 border-t border-gray-200">
            <Text className="text-gray-600 font-medium">Subtotal: </Text>
            <Text className="text-gray-800 font-bold ml-1">
              {calculateRestaurantTotal(
                restaurantGroup.restaurant_name
              ).toFixed(2)}{" "}
              HKD
            </Text>
          </View>
        </View>
      </View>
    );
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
        refreshControl={
          <CustomRefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              // Use setTimeout to ensure the refreshing state has time to update
              setTimeout(async () => {
                try {
                  await fetchCartDetails();
                } catch (error) {
                  console.error("Error refreshing cart data:", error);
                } finally {
                  setRefreshing(false);
                }
              }, 100);
            }}
            colors={[Colors.primary, Colors.error]}
            progressBackgroundColor="#ffffff"
          />
        }
      >
        <Header />

        <View className="p-4">
          <Text className="text-4xl font-normal mb-5 font-serif">My Cart</Text>
          <Text className="text-gray-500 mb-2">Select items to check out</Text>
        </View>

        {isUpdating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        <View className="px-7 pb-24">
          {isLoading ? (
            // Skeleton loading for cart items
            <>
              <CartSkeleton />
              <CartSkeleton />
            </>
          ) : restaurantGroups.length > 0 ? (
            <>
              {/* Render each restaurant in its own card */}
              {restaurantGroups.map(renderRestaurantCard)}

              {/* Grand Total and Checkout - always visible */}
              <View className="mt-6 mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-lg font-medium">Total</Text>
                  <Text
                    className="text-xl font-bold"
                    style={styles.grandTotalText}
                  >
                    {calculateGrandTotal().toFixed(1)} HKD
                  </Text>
                </View>

                <Text className="text-gray-500 text-xs mb-4">
                  Delivery fee and taxes will be calculated at checkout
                </Text>

                <TouchableOpacity
                  className="py-3 rounded-full w-full items-center"
                  onPress={saveSelectionForCheckout}
                  disabled={isUpdating || !hasSelectedItems()}
                  style={[
                    styles.checkoutButton,
                    !hasSelectedItems() && styles.disabledButton,
                  ]}
                >
                  <Text className="text-white font-bold text-lg">
                    Proceed to Checkout
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="items-center justify-center py-20">
              <Ionicons name="cart-outline" size={80} color="#CCC" />
              <Text className="text-xl font-bold text-gray-400 mt-4">
                Your cart is empty
              </Text>
              <Text className="text-gray-400 text-center mt-2 mb-6">
                Add items from restaurants to start your order
              </Text>

              <TouchableOpacity
                className="py-3 px-8 rounded-full"
                onPress={() => router.push("/(tabs)")}
                style={styles.browseButton}
              >
                <Text className="text-white font-bold">Browse Restaurants</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom padding for better scrolling */}
          <View className="h-20" />
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cartContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb", // Similar to border-gray-200 in tailwind
    // Remove shadow properties
  },
  totalContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb", // Similar to border-gray-200 in tailwind
    // Remove shadow properties
  },
  priceText: {
    color: Colors.text,
  },
  grandTotalText: {
    color: "#000000", // Green color for total price
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    // Keep minimal shadow for buttons
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    shadowOpacity: 0.1,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    // Keep minimal shadow for buttons
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default CartScreen;

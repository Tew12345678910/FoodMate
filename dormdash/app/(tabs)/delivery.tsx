import React, { useState, useEffect, useRef, useCallback } from "react";
import { Text, View, Alert, TouchableOpacity, StyleSheet } from "react-native";
import { Skeleton } from "moti/skeleton";
import { MotiView } from "moti";
import { useAuth } from "../../contexts/AuthContext";
import {
  getPendingOrders,
  Order,
  GetOrdersResponse,
  acceptOrder,
} from "../../services/orders";
import { updateUserProfile, getUserInfo } from "../../services/auth";
import { useRouter } from "expo-router";
import Colors from "../../constants/Colors";
import Header from "../../components/ui/Header";
import Animated, { useSharedValue } from "react-native-reanimated";
import ProgressiveBlurView from "../../components/ui/ProgressiveBlurView";
import CustomRefreshControl from "../../components/ui/CustomRefreshControl";
import DeliveryCard from "../../components/delivery-components/DeliveryCard";
import { Ionicons } from "@expo/vector-icons";
import RiderTermsAndConditions from "../../components/terms/RiderTermsAndConditions"; // Added import for RiderTermsAndConditions
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

// Define sorting options
type SortOption = "earliest" | "latest" | "highest-pay" | "lowest-pay";

const Delivery = () => {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [becomingRider, setBecomingRider] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Create an animated value to track scroll position for the blur effect
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (user && user.rider) {
      fetchOrders();
    }
  }, [user]);

  // Check rider status periodically
  useEffect(() => {
    if (user && !user.rider) {
      const statusCheck = setInterval(() => {
        checkRiderStatus();
      }, 30000); // Check every 30 seconds

      // Clear interval on component unmount
      return () => clearInterval(statusCheck);
    }
  }, [user]);

  // Apply sorting whenever sort option or orders change
  useEffect(() => {
    if (allOrders.length > 0) {
      sortOrders(sortOption);
    }
  }, [sortOption, allOrders]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      if (!user || !user.id) {
        throw new Error("User not authenticated or missing ID");
      }

      console.log(`Attempting to fetch orders for user ID: ${user.id}`);

      // Passing the user ID to the updated getPendingOrders function
      const response = await getPendingOrders(user.id);

      console.log("Response from getPendingOrders:", JSON.stringify(response));

      if (response && response.orders) {
        // Filter for only pending orders that don't have a rider assigned
        const pendingOrders = response.orders.filter(
          (order) => order.status.toLowerCase() === "pending" && !order.rider_id
        );

        console.log(`Found ${pendingOrders.length} pending orders`);
        setAllOrders(pendingOrders);

        // Initial sort based on current sort option
        sortOrders(sortOption, pendingOrders);
      } else {
        console.log("No orders found in response or invalid response format");
        setAllOrders([]);
        setDisplayedOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      console.error(
        "Error details:",
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
      Alert.alert("Error", "Failed to load orders. Please try again.");
      setAllOrders([]);
      setDisplayedOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRiderStatus = async () => {
    if (!user || checkingStatus) return;

    setCheckingStatus(true);
    try {
      const response = await getUserInfo(user.id.toString());

      if (response && response.user && response.user.rider) {
        // Update local user context with rider status
        setUser({ ...user, rider: response.user.rider });
      }
    } catch (error) {
      console.error("Error checking rider status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const sortOrders = (option: SortOption, ordersToSort = allOrders) => {
    let sorted: Order[] = [...ordersToSort];

    switch (option) {
      case "earliest":
        sorted.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        break;
      case "latest":
        sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case "highest-pay":
        sorted.sort((a, b) => Number(b.deliveryfee) - Number(a.deliveryfee));
        break;
      case "lowest-pay":
        sorted.sort((a, b) => Number(a.deliveryfee) - Number(b.deliveryfee));
        break;
    }

    setDisplayedOrders(sorted);
  };

  const handleAcceptOrder = (orderId: string) => {
    if (!user) {
      Alert.alert(
        "Authentication Required",
        "You need to log in to accept orders.",
        [{ text: "Log In", onPress: () => router.push("/login") }]
      );
      return;
    }

    Alert.alert(
      "Accept Order",
      "Are you sure you want to accept this order? Once accepted, you cannot decline this order and will be responsible for completing the delivery.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              setIsLoading(true);
              // Use the acceptOrder API call with the order ID and rider ID
              const response = await acceptOrder(orderId, user.id);

              if (response && response.message) {
                Alert.alert(
                  "Success",
                  "Order accepted successfully! Please proceed with the delivery."
                );
                // Refresh the orders list after accepting
                fetchOrders();
              } else {
                throw new Error("Failed to accept order");
              }
            } catch (error) {
              console.error("Error accepting order:", error);
              Alert.alert(
                "Error",
                "Failed to accept the order. Please try again."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Format date to a readable time
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")} ${String(
        date.getHours()
      ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch (e) {
      return dateString;
    }
  };

  // Get a description of items in the order
  const getOrderDescription = (order: Order): string => {
    const itemsText = order.items
      .map((item) => `${item.quantity}× ${item.food_name}`)
      .join(", ");

    return `${formatDate(order.date)} • ${itemsText}`;
  };

  const SortingOption = ({
    title,
    value,
  }: {
    title: string;
    value: SortOption;
  }) => (
    <TouchableOpacity
      className={`py-2 px-4 rounded-full mr-2 ${
        sortOption === value ? "bg-mates-orange" : "bg-gray-200"
      }`}
      onPress={() => setSortOption(value)}
    >
      <Text
        className={`font-medium ${
          sortOption === value ? "text-black" : "text-gray-800"
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const handleBecomeRider = async () => {
    if (!termsAccepted) {
      Alert.alert(
        "Terms & Conditions",
        "You must accept the terms and conditions to become a partner."
      );
      return;
    }

    setBecomingRider(true);
    try {
      if (!user || !user.id) {
        throw new Error("User not logged in");
      }

      // Explicitly define the payload to match API requirements
      const response = await updateUserProfile(user.id, {
        rider: true, // Ensure this is sent as a boolean value
      });

      console.log("API Response:", JSON.stringify(response, null, 2));

      // Check if the response exists (has any properties)
      // This is more forgiving than checking for a specific success property
      if (response) {
        // Update local user state regardless of response format
        setUser({ ...user, rider: true });
        Alert.alert(
          "Success",
          "You are now registered as a partner! You can start accepting delivery orders.",
          [{ text: "OK", onPress: () => fetchOrders() }]
        );
      } else {
        throw new Error("Empty response from API");
      }
    } catch (error) {
      console.error("Error becoming a partner:", error);
      Alert.alert(
        "Error",
        "Failed to register as a partner. Please try again."
      );
    } finally {
      setBecomingRider(false);
    }
  };

  // Check if user is not authenticated
  if (!user) {
    return (
      <View style={styles.container}>
        {/* Progressive blur header */}
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
                setTimeout(() => {
                  setRefreshing(false);
                }, 1000);
              }}
              colors={[Colors.primary, Colors.error]}
              progressBackgroundColor="#ffffff"
            />
          }
        >
          <Header />
          <View style={styles.centeredContent}>
            <Ionicons name="document" size={80} color={Colors.primary} />
            <Text
              className="text-4xl font-normal mb-6 font-serif text-center"
              style={styles.titleLarge}
            >
              Login to Access Deliveries
            </Text>
            <Text style={styles.description}>
              Sign in to view available orders, register as a rider, and start
              earning by making deliveries.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </View>
    );
  }

  // Check if user is not a rider
  if (user && !user.rider) {
    return (
      <BottomSheetModalProvider>
        <View className="flex-1 bg-background">
          <ProgressiveBlurView scrollY={scrollY} />
          <Animated.ScrollView
            className="flex-1 bg-background"
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
                  setTimeout(async () => {
                    try {
                      await checkRiderStatus();
                    } catch (error) {
                      console.error("Error refreshing rider status:", error);
                    } finally {
                      setRefreshing(false);
                    }
                  }, 1000);
                }}
                colors={[Colors.primary, Colors.error]}
                progressBackgroundColor="#ffffff"
              />
            }
          >
            <Header />
            <View className="flex-1 justify-center items-center px-6">
              <Ionicons name="document" size={80} color={Colors.primary} />
              <Text className="text-2xl font-bold text-center mt-6 mb-3">
                Become a FoodMates Partner
              </Text>
              <Text className="text-base text-center text-gray-600 mb-8">
                Start earning by delivering food to students around campus.
                Accept orders at your convenience.
              </Text>

              {/* Using the RiderTermsAndConditions component */}
              <RiderTermsAndConditions
                termsAccepted={termsAccepted}
                setTermsAccepted={setTermsAccepted}
                handleBecomeRider={handleBecomeRider}
                becomingRider={becomingRider}
              />
            </View>
          </Animated.ScrollView>
        </View>
      </BottomSheetModalProvider>
    );
  }

  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-background">
        {/* Progressive blur header with animation */}
        <ProgressiveBlurView scrollY={scrollY} />

        <Animated.ScrollView
          className="flex-1 bg-background"
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
                    await fetchOrders();
                  } catch (error) {
                    console.error("Error refreshing data:", error);
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
            <Text className="text-4xl font-normal mb-5 font-serif">
              Available Deliveries
            </Text>
          </View>

          {/* Sorting options */}
          <View className="mx-4 mb-4">
            <Text className="text-lg font-medium mb-2">Sort by:</Text>
            <View className="flex-row flex-wrap">
              <SortingOption title="Latest" value="latest" />
              <SortingOption title="Earliest" value="earliest" />
              <SortingOption title="Highest Pay" value="highest-pay" />
              <SortingOption title="Lowest Pay" value="lowest-pay" />
            </View>
          </View>

          <View className="px-7 pb-24">
            {isLoading ? (
              // Display skeleton loaders while loading
              <>
                <DeliveryCard
                  isLoading={true}
                  id=""
                  restaurantName=""
                  destination=""
                  deliveryFee={0}
                />
                <DeliveryCard
                  isLoading={true}
                  id=""
                  restaurantName=""
                  destination=""
                  deliveryFee={0}
                />
                <DeliveryCard
                  isLoading={true}
                  id=""
                  restaurantName=""
                  destination=""
                  deliveryFee={0}
                />
              </>
            ) : displayedOrders.length > 0 ? (
              displayedOrders.map((order) => (
                <DeliveryCard
                  key={order.order_id}
                  id={order.order_id}
                  restaurantName={order.restaurant_name}
                  destination={order.location}
                  deliveryFee={Number(order.deliveryfee)}
                  items={order.items}
                  onAccept={handleAcceptOrder}
                />
              ))
            ) : (
              <Text className="text-gray-500 py-4 text-center">
                No orders available at the moment.
              </Text>
            )}
          </View>
        </Animated.ScrollView>
      </View>
    </BottomSheetModalProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centeredContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 100,
    paddingBottom: 32,
  },
  titleLarge: {
    fontSize: 32,
    fontWeight: "400",
    marginBottom: 16,
    marginTop: 32,
    textAlign: "center",
    color: Colors.text,
  },
  description: {
    textAlign: "center",
    color: Colors.lightText,
    marginBottom: 32,
    lineHeight: 22,
    fontSize: 16,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
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
});

export default Delivery;

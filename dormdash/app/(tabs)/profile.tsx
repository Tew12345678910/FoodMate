import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { getUserInfo } from "../../services/auth";
import {
  getRiderOrders,
  getUserOrders,
  Order,
  markOrderDelivered,
} from "../../services/orders";
// Import Moti Skeleton components
import { Skeleton } from "moti/skeleton";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
// Import Header component
import Header from "../../components/ui/Header";
// Import CustomRefreshControl
import CustomRefreshControl from "../../components/ui/CustomRefreshControl";
// Import for progressive blur and animations
import ProgressiveBlurView from "../../components/ui/ProgressiveBlurView";
import Animated, { useSharedValue } from "react-native-reanimated";
// Import RiderJobCard component
import RiderJobCard from "../../components/delivery-components/RiderJobCard";
import RiderOrderDetailSheet, {
  RiderOrderDetailSheetMethods,
} from "../../components/delivery-components/RiderOrderDetailSheet";
// Import User Order Components
import UserOrderCard from "../../components/order-components/UserOrderCard";
import UserOrderDetailSheet, {
  UserOrderDetailSheetMethods,
} from "../../components/order-components/UserOrderDetailSheet";

// Spacer component for skeleton spacing
const Spacer = ({ height = 8 }) => <View style={{ height }} />;

interface ProfileSkeletonProps {
  width: number;
  height: number;
  radius?: number;
}

// Profile skeleton component
const ProfileItemSkeleton = ({
  width,
  height,
  radius = 4,
}: ProfileSkeletonProps) => (
  <MotiView transition={{ type: "timing" }}>
    <Skeleton colorMode="light" width={width} height={height} radius={radius} />
  </MotiView>
);

const Profile = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [compensation, setCompensation] = useState<number>(0);
  const [riderJobs, setRiderJobs] = useState<Order[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false); // State to control debug info visibility
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userOrdersLoading, setUserOrdersLoading] = useState(false);
  // Create ref for order detail sheet
  const orderDetailSheetRef = React.useRef<RiderOrderDetailSheetMethods>(null);
  // Create ref for user order detail sheet
  const userOrderDetailSheetRef =
    React.useRef<UserOrderDetailSheetMethods>(null);

  // Create an animated value to track scroll position for the blur effect
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (user) {
      fetchUserData();

      // If the user is a rider, fetch their current delivery jobs
      if (user.rider) {
        fetchRiderJobs();
      }
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (!user.id) {
        throw new Error("User ID is not available");
      }
      // Convert uid to string if it's not already
      const userIdStr = String(user.id);
      const userInfo = await getUserInfo(userIdStr);

      // Check if compensation data exists before accessing it
      if (userInfo && typeof userInfo.compensation === "number") {
        setCompensation(userInfo.compensation);
      } else {
        // Set a default value if compensation is not available
        setCompensation(0);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      Alert.alert(
        "Error",
        "Failed to load your profile data. Please try again."
      );
      // Set default compensation value if there's an error
      setCompensation(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRiderJobs = async () => {
    if (!user || !user.id) return;

    setJobsLoading(true);
    try {
      const response = await getRiderOrders(user.id);
      if (response && response.orders) {
        setRiderJobs(response.orders);
      }
    } catch (error) {
      console.error("Failed to fetch rider jobs:", error);
      Alert.alert(
        "Error",
        "Failed to load your delivery jobs. Please try again."
      );
    } finally {
      setJobsLoading(false);
    }
  };

  // Function to fetch user orders
  const fetchUserOrders = async () => {
    if (!user || !user.id) return;

    setUserOrdersLoading(true);
    try {
      const response = await getUserOrders(user.id);
      if (response && response.orders) {
        setUserOrders(response.orders);
      }
    } catch (error) {
      console.error("Failed to fetch user orders:", error);
      Alert.alert("Error", "Failed to load your orders. Please try again.");
    } finally {
      setUserOrdersLoading(false);
    }
  };

  // Fetch user orders when component mounts
  useEffect(() => {
    if (user && user.id) {
      fetchUserOrders();
    }
  }, [user]);

  const handleMarkDelivered = async (orderId: string) => {
    if (!user || !user.id) return;

    try {
      const response = await markOrderDelivered(orderId, user.id);

      if (response && response.message) {
        Alert.alert(
          "Success",
          "Order has been marked as delivered! The customer will be notified."
        );
        // Refresh the rider jobs list to show updated status
        fetchRiderJobs();
      } else {
        throw new Error("Failed to mark order as delivered");
      }
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      Alert.alert(
        "Error",
        "Failed to mark order as delivered. Please try again."
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", onPress: () => logout() },
    ]);
  };

  const handleLogin = () => {
    router.push("/login");
  };

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
        >
          <Header />
          <View style={styles.centeredContent}>
            <Ionicons name="person-circle" size={80} color={Colors.primary} />
            <Text
              className="text-4xl font-normal mb-6 font-serif text-center"
              style={[styles.titleLarge, { marginTop: 32 }]}
            >
              Login to Access Your Profile
            </Text>
            <Text style={styles.description}>
              Sign in to view your profile, track your earnings, and manage your
              account.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </View>
    );
  }

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

              // Use setTimeout to ensure the refreshing state has time to update
              setTimeout(async () => {
                try {
                  await fetchUserData();

                  // Also refresh rider jobs if user is a rider
                  if (user && user.rider) {
                    await fetchRiderJobs();
                  }
                } catch (error) {
                  console.error("Error refreshing user data:", error);
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
            My Profile
          </Text>
        </View>

        <View style={styles.profileInfoContainer}>
          {isLoading || authLoading ? (
            <>
              <ProfileItemSkeleton width={180} height={32} />
              <Spacer />
              <ProfileItemSkeleton width={100} height={24} />
              <Spacer />
              <ProfileItemSkeleton width={150} height={16} />
            </>
          ) : (
            <View className="flex space-y-3">
              <View className="flex flex-row items-center">
                <Text
                  className="text-3xl font-normal text-gray-800"
                  style={styles.username}
                >
                  {user.username}
                </Text>
                {user.rider && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>Partner</Text>
                  </View>
                )}
              </View>

              <Text style={styles.compensation}>
                Earnings:{" "}
                {parseFloat(compensation.toFixed(2)).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                HKD
              </Text>
              <Text style={styles.userInfo}>
                <Text style={styles.infoLabel}>Email: </Text>
                {user.email}
              </Text>
              {user.phone && (
                <Text style={styles.userInfo}>
                  <Text style={styles.infoLabel}>Phone: </Text>
                  {user.phone}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* My Orders Section - Moved after user information */}
        <View style={[styles.menuContainer, styles.myOrdersContainer]}>
          <Text
            className="text-2xl font-normal mb-4 font-serif"
            style={styles.sectionTitle}
          >
            My Orders
          </Text>

          {userOrdersLoading ? (
            // Show loading skeletons while fetching orders
            <>
              <UserOrderCard
                key="loading-order-1"
                order={null}
                isLoading={true}
              />
              <UserOrderCard
                key="loading-order-2"
                order={null}
                isLoading={true}
              />
            </>
          ) : userOrders.length > 0 ? (
            // Map through user orders
            userOrders.map((order, index) => (
              <UserOrderCard
                key={order.order_id || `user-order-${index}`}
                order={order}
                onViewDetails={() => {
                  // Open the user order detail sheet
                  if (userOrderDetailSheetRef.current) {
                    userOrderDetailSheetRef.current.openSheet(order);
                  }
                }}
              />
            ))
          ) : (
            // Show message when no orders are found with Browse button
            <View style={styles.emptyState}>
              <Ionicons
                name="fast-food-outline"
                size={48}
                color={Colors.lightText}
              />
              <Text style={styles.emptyStateText}>No orders found</Text>
              <Text style={styles.emptyStateSubtext}>
                Your order history will appear here
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/")}
              >
                <Text style={styles.browseButtonText}>Browse Restaurants</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Active Delivery Jobs Section - Only shown for riders */}
        {user && user.rider && (
          <>
            <View style={[styles.menuContainer, styles.activeJobsContainer]}>
              <Text
                className="text-2xl font-normal mb-4 font-serif"
                style={styles.sectionTitle}
              >
                Active Delivery Jobs
              </Text>

              {jobsLoading ? (
                // Show loading skeletons while fetching jobs
                <>
                  <RiderJobCard
                    key="loading-job-1"
                    isLoading={true}
                    id=""
                    restaurantName=""
                    destination=""
                    price={0}
                    status=""
                  />
                  <RiderJobCard
                    key="loading-job-2"
                    isLoading={true}
                    id=""
                    restaurantName=""
                    destination=""
                    price={0}
                    status=""
                  />
                </>
              ) : (
                // Filter for active jobs with status "Order Accepted" or "accepted"
                (() => {
                  const activeJobs = riderJobs.filter((job) => {
                    const status = job.status.toLowerCase();
                    return (
                      status === "order accepted" ||
                      status === "accepted" ||
                      status === "in progress" ||
                      status === "in-progress"
                    );
                  });

                  return activeJobs.length > 0 ? (
                    // Map through active rider jobs
                    activeJobs.map((job, index) => {
                      // Calculate the total price for the job
                      const totalPrice =
                        job.total_price ||
                        job.items.reduce(
                          (sum, item) => sum + item.food_price * item.quantity,
                          0
                        ) + (job.deliveryfee || 0);

                      // Create a description of the items
                      const itemsDescription = job.items
                        .map((item) => `${item.quantity}× ${item.food_name}`)
                        .join(", ");

                      return (
                        <RiderJobCard
                          key={job.order_id || `order-${index}`}
                          id={job.order_id || `order-${index}`}
                          restaurantName={job.restaurant_name}
                          destination={job.location}
                          price={totalPrice}
                          deliveryFee={job.deliveryfee || 0}
                          description={itemsDescription}
                          status={job.status}
                          acceptedTime={job.timeofacceptance}
                          cartId={job.cart_id}
                          showDebugInfo={showDebugInfo}
                          onViewDetails={() => {
                            // Directly open the sheet with the job object
                            if (orderDetailSheetRef.current) {
                              orderDetailSheetRef.current.openSheet(job);
                            }
                          }}
                          onMarkDelivered={handleMarkDelivered}
                        />
                      );
                    })
                  ) : (
                    // Show message when no active jobs are found
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="document"
                        size={48}
                        color={Colors.lightText}
                      />
                      <Text style={styles.emptyStateText}>
                        No active delivery jobs found
                      </Text>
                      <Text style={styles.emptyStateSubtext}>
                        Check the delivery tab to find available orders to
                        accept
                      </Text>
                    </View>
                  );
                })()
              )}
            </View>

            {/* Account Settings moved before Delivered Jobs */}
            <View style={styles.menuContainer}>
              <Text
                className="text-2xl font-normal mb-4 font-serif"
                style={styles.sectionTitle}
              >
                Account
              </Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  // Use router.push instead of router.navigate for more reliable navigation
                  router.push("/edit-profile");
                }}
                disabled={isLoading || authLoading}
              >
                <Ionicons name="person-outline" size={24} color={Colors.text} />
                <Text style={styles.menuItemText}>Edit Profile</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.lightText}
                  style={styles.chevron}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLogout}
                disabled={isLoading || authLoading}
              >
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  color={Colors.text}
                />
                <Text style={styles.menuItemText}>Log Out</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.lightText}
                  style={styles.chevron}
                />
              </TouchableOpacity>
            </View>

            {/* Delivered Jobs Section */}
            <View style={[styles.menuContainer, styles.deliveredJobsContainer]}>
              <Text
                className="text-2xl font-normal mb-4 font-serif"
                style={styles.sectionTitle}
              >
                Delivered Jobs
              </Text>

              {jobsLoading ? (
                // Show loading skeleton while fetching jobs
                <RiderJobCard
                  key="loading-delivered-job"
                  isLoading={true}
                  id=""
                  restaurantName=""
                  destination=""
                  price={0}
                  status=""
                />
              ) : (
                // Filter for completed jobs with status "Delivered" or "delivered"
                (() => {
                  const deliveredJobs = riderJobs.filter((job) => {
                    const status = job.status.toLowerCase();
                    return status === "delivered" || status === "completed";
                  });

                  return deliveredJobs.length > 0 ? (
                    // Map through delivered rider jobs
                    deliveredJobs.map((job, index) => {
                      // Calculate the total price for the job
                      const totalPrice =
                        job.total_price ||
                        job.items.reduce(
                          (sum, item) => sum + item.food_price * item.quantity,
                          0
                        ) + (job.deliveryfee || 0);

                      // Create a description of the items
                      const itemsDescription = job.items
                        .map((item) => `${item.quantity}× ${item.food_name}`)
                        .join(", ");

                      return (
                        <RiderJobCard
                          key={job.order_id || `delivered-${index}`}
                          id={job.order_id || `delivered-${index}`}
                          restaurantName={job.restaurant_name}
                          destination={job.location}
                          price={totalPrice}
                          deliveryFee={job.deliveryfee || 0}
                          description={itemsDescription}
                          status={job.status}
                          acceptedTime={job.timeofacceptance}
                          cartId={job.cart_id}
                          showDebugInfo={showDebugInfo}
                          onViewDetails={() => {
                            // Directly open the sheet with the job object
                            if (orderDetailSheetRef.current) {
                              orderDetailSheetRef.current.openSheet(job);
                            }
                          }}
                          // No mark delivered button needed for already delivered jobs
                        />
                      );
                    })
                  ) : (
                    // Show message when no delivered jobs are found
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={48}
                        color={Colors.lightText}
                      />
                      <Text style={styles.emptyStateText}>
                        No delivered jobs yet
                      </Text>
                      <Text style={styles.emptyStateSubtext}>
                        Completed deliveries will appear here
                      </Text>
                    </View>
                  );
                })()
              )}
            </View>
          </>
        )}

        {/* Account Settings for non-riders */}
        {!user.rider && (
          <View style={styles.menuContainer}>
            <Text
              className="text-2xl font-normal mb-4 font-serif"
              style={styles.sectionTitle}
            >
              Account
            </Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                // Use router.push instead of router.navigate for more reliable navigation
                router.push("/edit-profile");
              }}
              disabled={isLoading || authLoading}
            >
              <Ionicons name="person-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.lightText}
                style={styles.chevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
              disabled={isLoading || authLoading}
            >
              <Ionicons name="log-out-outline" size={24} color={Colors.text} />
              <Text style={styles.menuItemText}>Log Out</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.lightText}
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding for better scrolling */}
        <View style={{ height: 32 }} />
      </Animated.ScrollView>

      {/* Order Detail Sheet */}
      <RiderOrderDetailSheet
        ref={orderDetailSheetRef}
        onMarkDelivered={handleMarkDelivered}
      />
      <UserOrderDetailSheet ref={userOrderDetailSheetRef} />
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
    backgroundColor: Colors.background,
  },
  centeredContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 100,
  },
  sectionHeader: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "400",
    marginBottom: 20,
    color: Colors.text,
  },
  titleLarge: {
    fontSize: 32,
    fontWeight: "400",
    marginBottom: 24,
    textAlign: "center",
    color: Colors.text,
  },
  description: {
    textAlign: "center",
    color: Colors.lightText,
    marginBottom: 32,
    lineHeight: 22,
    fontSize: 16,
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
  profileInfoContainer: {
    paddingHorizontal: 28,
    marginBottom: 32,
  },
  username: {
    fontSize: 28,
    fontWeight: "400",
    color: Colors.text,
    flexDirection: "row",
    alignItems: "center",
    display: "flex",
  },
  compensation: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
    color: Colors.text,
  },
  userInfo: {
    color: Colors.lightText,
    fontSize: 16,
    marginTop: 8,
  },
  infoLabel: {
    fontWeight: "500",
    color: Colors.text,
  },
  menuContainer: {
    paddingHorizontal: 28,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "400",
    marginBottom: 16,
    color: Colors.text,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: "400",
    color: Colors.text,
  },
  chevron: {
    marginLeft: "auto",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "400",
    color: Colors.lightText,
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  badgeContainer: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
    alignItems: "center",
  },
  badgeText: {
    color: "black",
    fontSize: 12,
    fontWeight: "700",
  },
  activeJobsContainer: {
    marginTop: 40,
    marginBottom: 20, // Reduced from 50 to add space for new section
  },
  deliveredJobsContainer: {
    marginTop: 20,
    marginBottom: 100,
  },
  myOrdersContainer: {
    marginTop: 20,
    marginBottom: 50,
  },
  profileActions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  debugToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.text,
  },
  debugToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  debugToggleText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  debugToggleTextActive: {
    color: "white",
  },
  browseButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "black",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
});

export default Profile;

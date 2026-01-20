import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
// Make sure we're using the correct imports
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAllRestaurants, Restaurant } from "../../services/restaurants";

import { getPopularFood, PopularFoodResponse } from "../../services/manuItems";
// Import directly from the context file to avoid any re-export issues
import { useAuth } from "../../contexts/AuthContext";
// Import our components
import PopularFoodCard from "../../components/home-components/PopularFoodCard";
import RestaurantCard from "../../components/home-components/RestaurantCard";
import SearchBar from "../../components/home-components/SearchBar";
// Import Colors for consistent styling
import Colors from "../../constants/Colors";
// Import Header component
import Header from "../../components/ui/Header";
import ProgressiveBlurView from "../../components/ui/ProgressiveBlurView";
import CustomRefreshControl from "../../components/ui/CustomRefreshControl";
import Animated, { useSharedValue } from "react-native-reanimated";

// Make sure component has a proper default export with a function declaration
export default function Home() {
  // Check if auth is working properly
  const auth = useAuth();
  const user = auth?.user; // Use optional chaining for safety
  const router = useRouter();

  // Create an animated value to track scroll position
  const scrollY = useSharedValue(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    []
  );
  const [popularFoods, setPopularFoods] = useState<PopularFoodResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPopularFood, setIsLoadingPopularFood] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [popularFoodsError, setPopularFoodsError] = useState(false);

  useEffect(() => {
    fetchRestaurants();
    fetchPopularFoods();
  }, []);

  useEffect(() => {
    if (restaurants.length > 0) {
      const filtered = restaurants.filter((restaurant) =>
        restaurant.restaurant_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchQuery, restaurants]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await getAllRestaurants();
      setRestaurants(data);
      setFilteredRestaurants(data);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
      Alert.alert("Error", "Failed to load restaurants. Please try again.");
      setHasError(true); // Set error flag to show skeletons
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPopularFoods = async () => {
    setIsLoadingPopularFood(true);
    setPopularFoodsError(false);
    try {
      const data = await getPopularFood();
      setPopularFoods(data);
    } catch (error) {
      console.error("Failed to fetch popular foods:", error);
      setPopularFoodsError(true); // Set error flag for popular foods
    } finally {
      setIsLoadingPopularFood(false);
    }
  };

  const navigateToRestaurant = (id: string) => {
    router.push({
      pathname: "/restaurant/[id]",
      params: { id: id },
    });
  };

  // Navigate to restaurant page and open food item details in bottom sheet
  const navigateToMenuRequirements = (foodId: number) => {
    // Check if user is logged in
    if (!user) {
      // If not logged in, redirect to login page
      Alert.alert(
        "Login Required",
        "Please log in to view food details and place orders.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Log In",
            onPress: () => router.push("/login"),
          },
        ]
      );
      return;
    }

    // If user is logged in, proceed with normal navigation
    // If we have food's restaurant info, use it; otherwise use a default
    const food = popularFoods.find((food) => food.food_id === foodId);
    const restaurantName = food?.restaurant_name || "Unknown";

    // Navigate to the restaurant page with an additional param to indicate which food to show
    router.push({
      pathname: "/restaurant/[id]",
      params: {
        id: restaurantName,
        selectedFoodId: foodId.toString(),
      },
    });
  };

  // Safe greeting without potential undefined issues
  const greeting = user
    ? `Hi, ${user.username}!`
    : "Grab something for dinner?";

  // Determine if we should show skeletons for restaurants
  const shouldShowRestaurantSkeletons = isLoading || hasError;

  // Determine if we should show skeletons for popular foods
  const shouldShowPopularFoodSkeletons =
    isLoadingPopularFood || popularFoodsError;

  return (
    <View className="flex-1 bg-background">
      {/* Progressive blur header with only the required props */}
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
                  await Promise.all([fetchRestaurants(), fetchPopularFoods()]);
                } catch (error) {
                  console.error("Error refreshing data:", error);
                } finally {
                  setRefreshing(false);
                }
              }, 100);
            }}
            colors={[Colors.primary, Colors.error]} // Explicitly set contrasting colors
            progressBackgroundColor="#ffffff" // White background for better contrast
          />
        }
      >
        <Header />
        {/* Search Bar */}
        <View className="p-4">
          <Text className="text-4xl font-normal mb-5 font-serif ">
            {greeting}
          </Text>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <Text className="mx-4 text-2xl font-normal mt-5">Popular Foods</Text>
        {/* Modified ScrollView with fixed height and improved styling */}
        <View style={styles.popularFoodsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularFoodsContent}
          >
            {shouldShowPopularFoodSkeletons ? (
              // Show skeletons when loading or has error
              <>
                <PopularFoodCard isLoading={true} />
                <PopularFoodCard isLoading={true} />
                <PopularFoodCard isLoading={true} />
                <PopularFoodCard isLoading={true} />
              </>
            ) : popularFoods.length > 0 ? (
              popularFoods.map((food) => (
                <PopularFoodCard
                  key={`popular-${food.food_id}`}
                  food={food}
                  onPress={navigateToMenuRequirements}
                />
              ))
            ) : (
              // Fallback to showing restaurants if no popular foods
              filteredRestaurants.slice(0, 4).map((restaurant, index) => (
                <TouchableOpacity
                  key={`restaurant-${index}`}
                  style={styles.fallbackRestaurantCard}
                  onPress={() =>
                    navigateToRestaurant(restaurant.restaurant_name)
                  }
                >
                  <View style={styles.fallbackRestaurantImage} />
                  <Text className="text-xl font-medium">
                    {restaurant.restaurant_name}
                  </Text>
                  <Text className="text-sm text-gray-400">
                    {restaurant.status}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
        <Text className="mx-4 text-2xl font-normal mb-4">All Restaurants</Text>
        <View className="px-7 pb-24">
          {shouldShowRestaurantSkeletons ? (
            // Show skeletons when loading or has error
            <>
              <RestaurantCard isLoading={true} />
              <RestaurantCard isLoading={true} />
              <RestaurantCard isLoading={true} />
              <RestaurantCard isLoading={true} />
            </>
          ) : (
            <>
              {filteredRestaurants.map((restaurant, index) => (
                <RestaurantCard
                  key={index}
                  restaurant={restaurant}
                  onPress={navigateToRestaurant}
                />
              ))}

              {filteredRestaurants.length === 0 && (
                <Text className="text-center text-gray-400 py-8">
                  No restaurants found. Try a different search term.
                </Text>
              )}
            </>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// Add StyleSheet for more precise control over layout
const styles = StyleSheet.create({
  blurContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 10,
  },
  blurView: {
    height: 64,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject, // Fills the BlurView
  },
  popularFoodsContainer: {
    height: 320, // Fixed height to prevent collapsing
  },
  popularFoodsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  fallbackRestaurantCard: {
    width: 240,
    marginRight: 20,
    marginBottom: 10,
  },
  fallbackRestaurantImage: {
    width: 240,
    height: 192,
    borderRadius: 24,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "#e0e0e0",
  },
});

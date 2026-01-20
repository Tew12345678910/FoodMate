import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Reanimated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
  Extrapolation,
} from "react-native-reanimated";
import {
  getRestaurantMenu,
  RestaurantDetailResponse,
} from "../../services/restaurants";
import {
  MenuItem,
  groupMenuItemsBySection,
  getSectionNames,
  MenuItemsBySection,
} from "../../services/manuItems";
import { Skeleton } from "moti/skeleton";
import Colors from "../../constants/Colors";
import RestaurantHeader from "../../components/ui/RestaurantHeader";
import MenuItemCard from "../../components/food-components/MenuItemCard";
import CustomRefreshControl from "../../components/ui/CustomRefreshControl";
import BottomSheet from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from "../../contexts/AuthContext";
// Import our FoodDetailSheet component and its types
import FoodDetailSheet, {
  FoodDetailSheetMethods,
} from "../../components/food-components/FoodDetailSheet";

// Type definitions for our section data
interface SectionData {
  title: string;
  data: MenuItem[];
  index: number;
}

const RestaurantDetail = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  // Bottom sheet states and refs with proper typing
  const bottomSheetRef = useRef<FoodDetailSheetMethods>(null);
  const [selectedFoodItem, setSelectedFoodItem] = useState<MenuItem | null>(
    null
  );

  // Restaurant menu states
  const [restaurantData, setRestaurantData] =
    useState<RestaurantDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [menuItemsBySection, setMenuItemsBySection] =
    useState<MenuItemsBySection>({});
  const [sectionNames, setSectionNames] = useState<string[]>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values for sticky header
  const scrollY = useRef(new Animated.Value(0)).current;

  // Create a shared value for Reanimated animations to control the bottom blur
  const scrollYShared = useSharedValue(0);

  // Update the reanimated shared value when scrolling
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      scrollYShared.value = value;
    });

    return () => {
      scrollY.removeListener(id);
    };
  }, []);

  // Create animated style for bottom blur that intensifies with scroll
  const bottomBlurStyle = useAnimatedStyle(() => {
    const blurHeight = interpolate(
      scrollYShared.value,
      [0, 100],
      [150, 250], // Height increases as you scroll
      { extrapolateRight: Extrapolation.CLAMP }
    );

    return {
      height: blurHeight,
    };
  });

  // Animation values for section bar
  const sectionBarHeight = 60; // Height of the section bar
  const initialSectionBarPosition = 470; // Approximate position where the section bar originally appears

  // Animation for the inline section bar - stays visible until scrolling past it
  const inlineSectionBarOpacity = scrollY.interpolate({
    inputRange: [initialSectionBarPosition - 50, initialSectionBarPosition],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Refs for the main scroll view and section list
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionListRef = useRef<FlatList>(null);

  // Refs for section positions
  const sectionRefs = useRef<{ [key: string]: number }>({});
  const sectionPositions = useRef<number[]>([]);

  // Window dimensions for calculations
  const windowHeight = Dimensions.get("window").height;

  // Fetch restaurant menu
  useEffect(() => {
    fetchRestaurantMenu();
  }, [id]);

  // Process menu items into sections when restaurant data changes
  useEffect(() => {
    if (restaurantData?.items) {
      const grouped = groupMenuItemsBySection(restaurantData.items);
      setMenuItemsBySection(grouped);

      const sections = getSectionNames(restaurantData.items);
      setSectionNames(sections);
    }
  }, [restaurantData]);

  // Add a useEffect to handle the selectedFoodId parameter - improve loading handling
  const [pendingFoodId, setPendingFoodId] = useState<number | null>(null);

  useEffect(() => {
    const selectedFoodId = params.selectedFoodId;

    // Store the food ID to process once data is loaded
    if (selectedFoodId) {
      setPendingFoodId(Number(selectedFoodId));
    }
  }, [params.selectedFoodId]);

  // Watch for restaurant data changes and process any pending food ID
  useEffect(() => {
    if (pendingFoodId && restaurantData?.items && !isLoading) {
      // Only process once data is fully loaded
      navigateToMenuRequirements(pendingFoodId);
      // Clear the pending ID after processing
      setPendingFoodId(null);
    }
  }, [restaurantData?.items, isLoading, pendingFoodId]);

  // Fix the scroll event listener setup in useEffect
  useEffect(() => {
    // No need to return a handler from this useEffect
    // The listener is already attached to the ScrollView component
  }, [sectionPositions.current.length]);

  // Track scroll position and update active section
  const onScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const viewableArea = scrollPosition + windowHeight / 3;

    // Find the current section based on scroll position
    let currentIndex = 0;
    for (let i = 0; i < sectionPositions.current.length; i++) {
      if (i < sectionPositions.current.length - 1) {
        if (
          viewableArea >= sectionPositions.current[i] &&
          viewableArea < sectionPositions.current[i + 1]
        ) {
          currentIndex = i;
          break;
        }
      } else if (viewableArea >= sectionPositions.current[i]) {
        currentIndex = i;
      }
    }

    // Only update if the section changed
    if (currentIndex !== activeSectionIndex) {
      setActiveSectionIndex(currentIndex);

      // Auto scroll the section header
      if (sectionListRef.current) {
        sectionListRef.current.scrollToIndex({
          index: currentIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }
    }
  };

  const fetchRestaurantMenu = async () => {
    setIsLoading(true);
    try {
      const data = await getRestaurantMenu(id);
      setRestaurantData(data);
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      Alert.alert("Error", "Failed to load restaurant menu. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    // Navigate to menu requirements screen when the cart button is clicked
    navigateToMenuRequirements(item.food_id);
  };

  // Navigate to the menu requirements page within the restaurant context
  const navigateToMenuRequirements = (foodId: number) => {
    // Check if user is logged in
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to add items to your cart",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Sign In",
            onPress: () => router.push("/(auth)/login"),
          },
        ]
      );
      return;
    }

    // Find the selected menu item
    let selectedItem: MenuItem | undefined;

    // Search for the item in all sections
    for (const sectionName of sectionNames) {
      const foundItem = menuItemsBySection[sectionName]?.find(
        (item) => item.food_id === foodId
      );
      if (foundItem) {
        selectedItem = foundItem;
        break;
      }
    }

    if (!selectedItem) {
      // Find from restaurant data's raw items array if available
      const menuItem = restaurantData?.items?.find(
        (item) => item.food_id === foodId
      );

      if (menuItem) {
        selectedItem = menuItem;
      } else {
        // If the item is still not found, try to find it from popular foods
        // This requires us to temporarily store popular foods data or fetch it again

        // Create a minimal placeholder with just the ID - we'll load the real data later
        selectedItem = {
          food_id: foodId,
          name: "Loading...",
          price: 0,
          section: "",
          description: "",
          image_url: null,
        };

        // Show loading indicator in bottom sheet but don't log an error message
        // This is expected behavior when loading from popular foods
      }
    }

    // Set the selected food item and open the bottom sheet
    setSelectedFoodItem(selectedItem);

    // Load the requirements for this food item
    bottomSheetRef.current?.loadFoodRequirements(foodId);

    // Open the bottom sheet with safety checks for valid indices
    setTimeout(() => {
      if (bottomSheetRef.current) {
        // With single snap point ["100%"], we should use index 0
        bottomSheetRef.current.snapToIndex(0);
      }
    }, 150); // Increased timeout to ensure all initialization is complete
  };

  // Function to scroll to a specific section
  const scrollToSection = (sectionName: string, index: number) => {
    // Immediately update active section without animation
    setActiveSectionIndex(index);

    // Scroll to section position with animation
    if (
      scrollViewRef.current &&
      sectionRefs.current[sectionName] !== undefined
    ) {
      scrollViewRef.current.scrollTo({
        y: sectionRefs.current[sectionName],
        animated: true,
      });
    }
  };

  // Function to save section position when it renders
  const setSectionRef = (sectionName: string, y: number) => {
    sectionRefs.current = {
      ...sectionRefs.current,
      [sectionName]: y,
    };

    // Update positions array for scroll calculations
    const positions = Object.values(sectionRefs.current);
    sectionPositions.current = positions.sort((a, b) => a - b);
  };

  // Calculate if we should show image skeleton
  const showImageSkeleton =
    isLoading ||
    imageLoading ||
    imageError ||
    !restaurantData?.restaurant_image_url;

  const topMargin = Platform.OS === "ios" ? 50 : 20; // Margin for status bar

  // Simple section button without animation optimization
  const SectionButton = ({
    item,
    index,
    isActive,
    onPress,
  }: {
    item: string;
    index: number;
    isActive: boolean;
    onPress: () => void;
  }) => {
    // Using direct style objects instead of StyleSheet references with proper TypeScript types
    const buttonStyle = {
      ...styles.sectionButton,
      backgroundColor: isActive ? "#FFA500" : "#E0E0E0",
      justifyContent: "center" as const,
      alignItems: "center" as const,
    };

    const textStyle = {
      ...styles.sectionButtonText,
      ...(isActive ? styles.activeButtonText : styles.inactiveButtonText),
      textAlign: "center" as const,
    };

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {/* Restaurant Header placed outside the ScrollView */}
        <RestaurantHeader scrollY={scrollY} />

        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true, listener: onScroll }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <CustomRefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);

                // Use setTimeout to ensure the refreshing state has time to update
                setTimeout(async () => {
                  try {
                    await fetchRestaurantMenu();
                  } catch (error) {
                    console.error("Error refreshing menu:", error);
                  } finally {
                    setRefreshing(false);
                  }
                }, 100);
              }}
            />
          }
          style={{ marginTop: 0 }} // Remove top margin
        >
          {/* Restaurant Image with Bottom Blur Effect - Moved to top */}
          <View className="relative">
            <Skeleton
              show={showImageSkeleton}
              colorMode="light"
              height={336}
              width={"100%"}
              radius={"square"}
            >
              {restaurantData?.restaurant_image_url && !imageError ? (
                <View className="relative">
                  <Image
                    source={{
                      uri: restaurantData.restaurant_image_url,
                    }}
                    className="w-full h-96"
                    resizeMode="cover"
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                    onError={() => setImageError(true)}
                  />

                  {/* Custom Bottom Blur Effect with Masked View */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <MaskedView
                      style={{ height: 220 }}
                      maskElement={
                        <LinearGradient
                          colors={[
                            "transparent",
                            "rgba(0,0,0,0.6)",
                            "rgba(0,0,0,0.9)",
                          ]}
                          locations={[0, 0.5, 1]}
                          style={{ flex: 1 }}
                          start={{ x: 0.5, y: 0 }}
                          end={{ x: 0.5, y: 1 }}
                        />
                      }
                    >
                      <Reanimated.View style={[{ flex: 1 }, bottomBlurStyle]}>
                        <BlurView
                          intensity={50}
                          tint="dark"
                          style={{ flex: 1 }}
                        />
                      </Reanimated.View>
                    </MaskedView>
                  </View>

                  {/* Restaurant info on top of the blurred area */}
                  <View className="absolute bottom-0 left-0 p-4 w-full">
                    <Text className="text-4xl font-normal font-serif text-white">
                      {restaurantData?.restaurant_name || id}
                    </Text>
                    <Text className="text-white text-opacity-90 mt-1">
                      {restaurantData?.opening_hours || "Hours not available"} •{" "}
                      {restaurantData?.status || "Status unknown"}
                    </Text>
                    {restaurantData?.restaurant_phone && (
                      <Text className="text-white text-opacity-90 mt-1">
                        Phone: {restaurantData.restaurant_phone}
                      </Text>
                    )}
                    <Text className="text-white text-opacity-90 mt-1 mb-2">
                      {restaurantData?.items?.length || 0} items on the menu
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="w-full h-96 bg-gray-300 items-center justify-center"></View>
              )}
            </Skeleton>
          </View>

          {/* Inline section header - now always visible since we removed the sticky header */}
          <View
            style={{
              marginTop: 16,
              marginBottom: 16,
              paddingTop: 2,
            }}
          >
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={sectionNames}
              keyExtractor={(item) => item}
              renderItem={({ item, index }) => (
                <SectionButton
                  item={item}
                  index={index}
                  isActive={activeSectionIndex === index}
                  onPress={() => scrollToSection(item, index)}
                />
              )}
              contentContainerStyle={styles.sectionListContent}
            />
          </View>

          {/* Menu Sections */}
          <View className="px-7 pb-24">
            {isLoading ? (
              // Skeleton loading for menu items
              [...Array(5)].map((_, index) => (
                <MenuItemCard key={`skeleton-menu-${index}`} isLoading={true} />
              ))
            ) : (
              <>
                {sectionNames.length === 0 ? (
                  <Text className="text-center text-gray-500 py-8">
                    No menu items available.
                  </Text>
                ) : (
                  sectionNames.map((sectionName, sectionIndex) => (
                    <View
                      key={sectionName}
                      onLayout={(event) => {
                        setSectionRef(sectionName, event.nativeEvent.layout.y);
                      }}
                    >
                      <Text className="text-2xl font-medium mt-4 mb-3">
                        {sectionName}
                      </Text>
                      {menuItemsBySection[sectionName]?.map((item) => (
                        <MenuItemCard
                          key={item.food_id}
                          menuItem={item}
                          onPress={navigateToMenuRequirements}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        </Animated.ScrollView>

        {/* Food Details Bottom Sheet */}
        <FoodDetailSheet
          ref={bottomSheetRef}
          selectedFoodItem={selectedFoodItem}
          restaurantName={decodeURIComponent(id)}
          onClose={() => bottomSheetRef.current?.close()}
        />
      </View>
    </GestureHandlerRootView>
  );
};

// Add the styles for the blur container
const styles = StyleSheet.create({
  blurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  blurView: {
    height: 54, // Reduced height to avoid double line issue
    overflow: "hidden",
  },
  sectionBarContainer: {
    flex: 1,
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingVertical: 8, // Reduced padding to fix double line issue
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 999,
    height: 38, // Fixed height to ensure consistency
  },
  activeButton: {
    backgroundColor: "#FFA500", // mates-orange
  },
  inactiveButton: {
    backgroundColor: "#E0E0E0", // gray-200
  },
  sectionButtonText: {
    fontWeight: "500",
    fontSize: 14, // Fixed font size
  },
  activeButtonText: {
    color: "#000000", // white text for better contrast
  },
  inactiveButtonText: {
    color: "#4B5563", // gray-700
  },
  sectionListContent: {
    paddingHorizontal: 8,
  },
});

export default RestaurantDetail;

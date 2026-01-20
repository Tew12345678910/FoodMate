import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { View, Text, TouchableOpacity, Alert, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "moti/skeleton";
import { MotiView } from "moti";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  RequirementSection,
  Requirement,
  getFoodRequirements,
} from "../../services/requirement";
import { MenuItem } from "../../services/manuItems";
import { addToCart as addToCartAPI } from "../../services/cart";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

// Define an interface for exposing methods to the parent
export interface FoodDetailSheetMethods {
  loadFoodRequirements: (foodId: number) => Promise<void>;
  snapToIndex: (index: number) => void;
  close: () => void;
}

// Update props interface to remove bottomSheetRef
interface FoodDetailSheetProps {
  selectedFoodItem: MenuItem | null;
  restaurantName: string;
  onClose: () => void;
}

// Use forwardRef to expose methods to parent component
const FoodDetailSheet = forwardRef<
  FoodDetailSheetMethods,
  FoodDetailSheetProps
>((props, ref) => {
  const { selectedFoodItem, restaurantName, onClose } = props;

  // Create internal ref for bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Define a single snap point at 85% of the screen height
  const snapPoints = ["85%"];

  // Get screen dimensions for absolute positioning
  const screenHeight = Dimensions.get("window").height;

  const router = useRouter();
  const { user } = useAuth();

  const [requirements, setRequirements] = useState<RequirementSection[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<
    Map<number, Set<number>>
  >(new Map());
  const [quantity, setQuantity] = useState(1);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Backdrop component for bottom sheet
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  // Load food requirements for the selected food item
  const loadFoodRequirements = async (foodId: number) => {
    setIsLoadingRequirements(true);
    try {
      const data = await getFoodRequirements(foodId);
      setRequirements(data);

      // Initialize selected requirements map
      const initialSelections = new Map<number, Set<number>>();
      data.forEach((section) => {
        initialSelections.set(section.section_id, new Set());
      });
      setSelectedRequirements(initialSelections);
    } catch (error) {
      console.error("Failed to fetch requirements:", error);
      setRequirements([]);
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  // Toggle requirement selection
  const toggleRequirement = (sectionId: number, requirement: Requirement) => {
    setSelectedRequirements((prev) => {
      const newMap = new Map(prev);
      const currentSet = newMap.get(sectionId) || new Set();

      if (currentSet.has(requirement.requirement_id)) {
        // Remove the requirement
        currentSet.delete(requirement.requirement_id);
      } else {
        // Check if adding would exceed max picks
        const section = requirements.find((s) => s.section_id === sectionId);
        if (section && currentSet.size >= section.max_num_of_picks) {
          // If max reached, alert user and return unchanged
          Alert.alert(
            "Maximum Selections Reached",
            `You can only select up to ${section.max_num_of_picks} items in "${section.section_name}".`
          );
          return prev;
        }
        // Add the requirement
        currentSet.add(requirement.requirement_id);
      }

      newMap.set(sectionId, currentSet);
      return newMap;
    });
  };

  // Check if a requirement is selected
  const isRequirementSelected = (sectionId: number, requirementId: number) => {
    return selectedRequirements.get(sectionId)?.has(requirementId) || false;
  };

  // Validate if all required selections are made
  const validateSelections = (): boolean => {
    let isValid = true;
    let errorMessage = "";

    requirements.forEach((section) => {
      const selectedCount =
        selectedRequirements.get(section.section_id)?.size || 0;

      if (section.is_required && selectedCount < section.min_num_of_picks) {
        isValid = false;
        errorMessage = `Please select at least ${section.min_num_of_picks} option(s) from "${section.section_name}".`;
      }
    });

    if (!isValid) {
      Alert.alert("Incomplete Selection", errorMessage);
    }

    return isValid;
  };

  // Add to cart functionality
  const addToCart = async () => {
    if (!selectedFoodItem) return;

    // Validate selections before proceeding
    if (!validateSelections()) {
      return;
    }

    setIsAddingToCart(true);
    try {
      // Check if user is logged in
      if (!user || !user.id) {
        Alert.alert("Error", "You need to be logged in to add items to cart");
        router.push("/login");
        return;
      }

      // Define type for formatted requirements
      interface FormattedRequirement {
        description: string;
        section_name: string;
        price: number;
      }

      // Format selected requirements for cart
      const formattedRequirements: FormattedRequirement[] = [];

      requirements.forEach((section) => {
        const selectedReqIds =
          selectedRequirements.get(section.section_id) || new Set();
        const selectedReqs = section.requirements
          .filter((req) => selectedReqIds.has(req.requirement_id))
          .map((req) => ({
            description: req.description,
            section_name: section.section_name,
            price: req.price,
          }));

        formattedRequirements.push(...selectedReqs);
      });

      // Format cart data
      const cartData = {
        user_id: String(user.id), // Convert user.id to string to match API type expectations
        restaurant_name: restaurantName,
        orderItems: [
          {
            food_id: selectedFoodItem.food_id,
            quantity: quantity,
            requirements:
              formattedRequirements.length > 0
                ? formattedRequirements
                : undefined,
          },
        ],
      };

      // Call API to add to cart
      const response = await addToCartAPI(cartData);

      if (response && response.success === false) {
        throw new Error(response.message || "Failed to add to cart");
      }

      Alert.alert(
        "Success",
        `${selectedFoodItem.name} has been added to your cart.`,
        [
          {
            text: "Continue Shopping",
            onPress: () => {
              // Close the bottom sheet and reset
              onClose();
            },
            style: "cancel",
          },
          {
            text: "View Cart",
            onPress: () => router.push("/cart"),
          },
        ]
      );
    } catch (error) {
      console.error("Failed to add to cart:", error);
      Alert.alert("Error", "Failed to add item to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Quantity management
  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedFoodItem) return 0;

    let requirementsPrice = 0;

    // Convert food price to number
    const basePrice = Number(selectedFoodItem.price);

    requirements.forEach((section) => {
      const selectedReqIds =
        selectedRequirements.get(section.section_id) || new Set();
      section.requirements.forEach((req) => {
        if (selectedReqIds.has(req.requirement_id)) {
          // Convert requirement price to number before adding
          requirementsPrice += Number(req.price);
        }
      });
    });

    // Calculate total with numeric operations
    return (basePrice + requirementsPrice) * quantity;
  };

  // Spacer component for skeleton spacing
  const Spacer = ({ height = 8 }) => <View style={{ height }} />;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    loadFoodRequirements,
    snapToIndex: (index: number) => {
      // Only allow opening to 85% (index 0) or closing (-1)
      if (index === 0 || index === -1) {
        try {
          bottomSheetRef.current?.snapToIndex(index);
        } catch (error) {
          console.warn(`Error snapping to index ${index}:`, error);
          if (index === -1) {
            bottomSheetRef.current?.close();
          } else {
            bottomSheetRef.current?.snapToIndex(0);
          }
        }
      } else {
        // Default to opening at index 0 (85% height) for any other index
        bottomSheetRef.current?.snapToIndex(0);
      }
    },
    close: () => {
      try {
        bottomSheetRef.current?.close();
      } catch (error) {
        console.warn("Error closing bottom sheet:", error);
      }
    },
  }));

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#999", width: 40 }}
      enablePanDownToClose={true}
      onClose={onClose}
      index={-1} // Start closed by default
      enableOverDrag={false} // Prevents dragging beyond the max snap point
    >
      {selectedFoodItem && (
        <View style={{ flex: 1 }}>
          <View className="px-4 pb-2 border-b border-gray-200">
            {/* Show loading placeholder or real data */}
            {selectedFoodItem.name === "Loading..." ? (
              <>
                <MotiView transition={{ type: "timing" }}>
                  <Skeleton
                    colorMode="light"
                    width={240}
                    height={32}
                    radius={4}
                  />
                </MotiView>
                <Spacer height={8} />
                <MotiView transition={{ type: "timing" }}>
                  <Skeleton
                    colorMode="light"
                    width={150}
                    height={20}
                    radius={4}
                  />
                </MotiView>
                <Spacer height={8} />
                <MotiView transition={{ type: "timing" }}>
                  <Skeleton
                    colorMode="light"
                    width={80}
                    height={24}
                    radius={4}
                  />
                </MotiView>
              </>
            ) : (
              <>
                <Text className="text-2xl font-bold mb-1">
                  {selectedFoodItem.name}
                </Text>
                <Text className="text-gray-600 text-sm mb-3">
                  {selectedFoodItem.section}
                </Text>
                <Text className="text-xl font-semibold mb-2">
                  {selectedFoodItem.price} HKD
                </Text>
              </>
            )}
          </View>

          {/* Adjusted scrollview with enough bottom padding to not be covered by the fixed button */}
          <BottomSheetScrollView className="px-4">
            <View className="py-4">
              {isLoadingRequirements ? (
                // Skeleton loaders for requirements
                [...Array(3)].map((_, i) => (
                  <View key={i} className="mb-6">
                    <MotiView transition={{ type: "timing" }}>
                      <Skeleton
                        colorMode="light"
                        width={180}
                        height={24}
                        radius={4}
                      />
                    </MotiView>
                    <Spacer height={16} />
                    {[...Array(2)].map((_, j) => (
                      <View
                        key={j}
                        className="flex-row justify-between items-center py-3 border-b border-gray-100"
                      >
                        <MotiView transition={{ type: "timing" }}>
                          <Skeleton
                            colorMode="light"
                            width={150}
                            height={20}
                            radius={4}
                          />
                        </MotiView>
                        <MotiView transition={{ type: "timing" }}>
                          <Skeleton
                            colorMode="light"
                            width={80}
                            height={20}
                            radius={4}
                          />
                        </MotiView>
                      </View>
                    ))}
                  </View>
                ))
              ) : requirements.length > 0 ? (
                // Requirements sections
                [...requirements]
                  .sort((a, b) => a.section_number - b.section_number)
                  .map((section) => (
                    <View
                      key={`section-${section.section_id}`}
                      className="mb-6"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xl font-bold">
                          {section.section_name}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {section.is_required ? "Required" : "Optional"} •
                          {section.min_num_of_picks > 0
                            ? ` Min: ${section.min_num_of_picks}`
                            : ""}{" "}
                          •
                          {section.max_num_of_picks <
                          section.requirements.length
                            ? ` Max: ${section.max_num_of_picks}`
                            : ""}
                        </Text>
                      </View>

                      <Text className="text-sm text-gray-500 mb-3">
                        {section.is_required
                          ? `Select ${
                              section.min_num_of_picks ===
                              section.max_num_of_picks
                                ? `exactly ${section.min_num_of_picks}`
                                : `${section.min_num_of_picks}-${section.max_num_of_picks}`
                            } item(s)`
                          : "Optional selection"}
                      </Text>

                      {section.requirements.map((req) => (
                        <TouchableOpacity
                          key={`req-${req.requirement_id}`}
                          className="flex-row justify-between items-center py-3 border-b border-gray-100"
                          onPress={() =>
                            toggleRequirement(section.section_id, req)
                          }
                        >
                          <View className="flex-row items-center">
                            <View
                              className={`w-5 h-5 rounded border flex items-center justify-center ${
                                isRequirementSelected(
                                  section.section_id,
                                  req.requirement_id
                                )
                                  ? "bg-[#FFA500] border-[#FFA500]"
                                  : "border-gray-300"
                              }`}
                            >
                              {isRequirementSelected(
                                section.section_id,
                                req.requirement_id
                              ) && (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="white"
                                />
                              )}
                            </View>
                            <Text className="text-lg ml-3">
                              {req.description}
                            </Text>
                          </View>
                          <Text className="font-semibold">{req.price} HKD</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))
              ) : (
                <Text className="text-center text-gray-500 py-6">
                  No customization options available for this item.
                </Text>
              )}
            </View>
            {/* Add padding at the bottom to ensure content isn't hidden behind the button */}
            <View style={{ height: 80 }} />
          </BottomSheetScrollView>

          {/* Fixed Add to Cart Button at the bottom */}
          <View
            className="absolute left-0 right-0 flex-row items-center justify-between p-4 border-t border-gray-200 bg-white"
            style={{
              bottom: 20, // Increased bottom margin from 0 to 20
              // Shadow removed
            }}
          >
            <View className="flex-row items-center">
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                onPress={decrementQuantity}
              >
                <Ionicons name="remove" size={20} color="#000" />
              </TouchableOpacity>

              <Text className="mx-3 text-base font-bold">{quantity}</Text>

              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                onPress={incrementQuantity}
              >
                <Ionicons name="add" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`flex-1 ml-4 py-3 rounded-full bg-[#FFA500] items-center justify-center ${
                isAddingToCart ? "bg-gray-300" : ""
              }`}
              onPress={addToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <Text className="text-black text-base font-bold">
                  Adding...
                </Text>
              ) : (
                <Text className="text-black text-base font-bold">
                  Add to Cart • {calculateTotalPrice().toFixed(1)} HKD
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </BottomSheet>
  );
});

export default FoodDetailSheet;

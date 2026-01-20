import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Restaurant } from "../../services/restaurants";
import { Skeleton } from "moti/skeleton";

type RestaurantCardProps = {
  restaurant?: Restaurant;
  onPress?: (id: string) => void;
  isLoading?: boolean;
};

// Shared Spacer component for skeleton spacing
const Spacer = ({ height = 8 }) => <View style={{ height }} />;

const RestaurantCard = ({
  restaurant,
  onPress,
  isLoading = false,
}: RestaurantCardProps) => {
  // Track image loading state
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Show skeleton when loading, no restaurant data, image is loading, or there was an image error
  const showImageSkeleton =
    isLoading ||
    !restaurant ||
    !restaurant?.restaurant_image_url ||
    imageLoading ||
    imageError;
  return (
    <TouchableOpacity
      className="flex-row mb-2 border border-gray-200 bg-white rounded-3xl p-2"
      onPress={() => restaurant && onPress?.(restaurant.restaurant_name)}
      disabled={isLoading || !restaurant}
    >
      <Skeleton
        show={showImageSkeleton}
        colorMode="light"
        width={128}
        height={128}
        radius={16}
      >
        <View style={{ position: "relative" }}>
          {restaurant?.restaurant_image_url && !imageError && (
            <>
              <Image
                source={{ uri: restaurant?.restaurant_image_url }}
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: 14,
                  opacity:
                    restaurant?.status?.toLowerCase() === "closed" ? 0.7 : 1,
                }}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => setImageLoading(false)}
                onLoadEnd={() => setImageLoading(false)}
                onError={(error) => {
                  console.error("Image loading error:", error.nativeEvent);
                  setImageError(true);
                }}
              />

              {restaurant?.status?.toLowerCase() === "closed" && (
                <View
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: [{ translateX: -30 }, { translateY: -12 }],
                    overflow: "hidden",
                    borderRadius: 16,
                  }}
                >
                  <BlurView intensity={40} tint="dark" className="px-2 py-1">
                    <Text className="text-white font-semibold text-sm">
                      CLOSED
                    </Text>
                  </BlurView>
                </View>
              )}
            </>
          )}
        </View>
      </Skeleton>

      <View className="flex-1 justify-between pb-2 pr-4 ml-4">
        <View>
          <Skeleton
            show={isLoading || !restaurant}
            colorMode="light"
            width={150}
            height={24}
          >
            <Text className="text-2xl font-bold">
              {restaurant?.restaurant_name}
            </Text>
          </Skeleton>

          <Spacer height={3} />

          <Skeleton
            show={isLoading || !restaurant}
            colorMode="light"
            width={120}
            height={16}
          >
            <Text className="text-base font-medium text-gray-600">
              {restaurant?.opening_hours}
            </Text>
          </Skeleton>
        </View>

        <View className="absolute bottom-2 right-2">
          {restaurant && (
            <View className="h-12 w-12 rounded-full bg-mates-blue items-center justify-center">
              <Ionicons name="arrow-forward" size={24} color="black" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RestaurantCard;

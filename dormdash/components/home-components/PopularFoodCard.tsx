import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { PopularFoodResponse } from "../../services/manuItems";
import { Skeleton } from "moti/skeleton";
import { BlurView } from "expo-blur"; // Import BlurView for backdrop blur effect

type PopularFoodCardProps = {
  food?: PopularFoodResponse;
  onPress?: (foodId: number) => void;
  isLoading?: boolean;
};

// Shared Spacer component
const Spacer = ({ height = 8 }) => <View style={{ height }} />;

const PopularFoodCard = ({
  food,
  onPress,
  isLoading = false,
}: PopularFoodCardProps) => {
  // Track image loading state
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Fixed logic: Show skeleton when loading, no food data, no image URL,
  // image is loading, or there was an image error
  const showImageSkeleton =
    isLoading || !food || !food?.image_url || imageLoading || imageError;

  return (
    <TouchableOpacity
      onPress={() => food && onPress?.(Number(food.food_id))}
      disabled={isLoading || !food}
      className="mr-4"
    >
      <Skeleton
        show={showImageSkeleton}
        colorMode="light"
        width={200}
        height={200}
        radius={14}
      >
        <View className="relative w-[200px] h-[200px] rounded-[14px]">
          {food?.image_url && !imageError && (
            <>
              <Image
                source={{ uri: food?.image_url }}
                className="w-[200px] h-[200px] rounded-[14px]"
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => setImageLoading(false)}
                onLoadEnd={() => setImageLoading(false)}
                onError={(error) => {
                  console.error("Image loading error:", error.nativeEvent);
                  setImageError(true);
                }}
              />

              {/* Price tag positioned inside the image at bottom left */}
              {food?.price && (
                <View className="absolute bottom-[10px] left-[10px] rounded-[20px] overflow-hidden">
                  <BlurView
                    intensity={40}
                    tint="dark"
                    className="px-2 py-1 rounded-[20px]"
                  >
                    <Text className="text-sm font-semibold text-white">
                      {food.price} HKD
                    </Text>
                  </BlurView>
                </View>
              )}
            </>
          )}
        </View>
      </Skeleton>
      <Spacer height={10} />
      <View className="flex flex-row justify-between items-start w-[200px] h-[70px]">
        <View className="flex-1">
          <Skeleton
            show={isLoading || !food}
            colorMode="light"
            width={150}
            height={20}
          >
            <Text className="text-2xl font-bold" numberOfLines={1}>
              {food?.name || "\n"}
            </Text>
          </Skeleton>
          <Spacer height={3} />
          <Skeleton
            show={isLoading || !food}
            colorMode="light"
            width={100}
            height={16}
          >
            <Text
              className="text-base font-medium text-gray-600"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {food?.restaurant_name}
            </Text>
          </Skeleton>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PopularFoodCard;

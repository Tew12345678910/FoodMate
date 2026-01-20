import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MenuItem } from "../../services/manuItems";
import { Skeleton } from "moti/skeleton";

type MenuItemCardProps = {
  menuItem?: MenuItem;
  onPress?: (foodId: number) => void;
  onAddToCart?: (item: MenuItem) => void;
  isLoading?: boolean;
};

// Shared Spacer component for skeleton spacing
const Spacer = ({ height = 8 }) => <View style={{ height }} />;

const MenuItemCard = ({
  menuItem,
  onPress,
  onAddToCart,
  isLoading = false,
}: MenuItemCardProps) => {
  // Track image loading state
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Show skeleton when loading, no menuItem data, image is loading, or there was an image error
  const showImageSkeleton =
    isLoading ||
    !menuItem ||
    !menuItem?.image_url ||
    imageLoading ||
    imageError;
  return (
    <TouchableOpacity
      className="flex-row mb-3 border-2 border-gray-100 bg-white rounded-3xl p-2"
      onPress={() => menuItem && onPress?.(menuItem.food_id)}
      disabled={isLoading || !menuItem}
    >
      {/* Fixed-size image container with improved styling */}
      <View className="w-[128px] h-[128px] min-w-[128px] rounded-2xl overflow-hidden">
        <Skeleton
          show={showImageSkeleton}
          colorMode="light"
          width={128}
          height={128}
          radius={16}
        >
          <>
            {menuItem?.image_url && !imageError && (
              <Image
                source={{ uri: menuItem?.image_url }}
                style={{ width: 128, height: 128, borderRadius: 14 }}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => setImageLoading(false)}
                onLoadEnd={() => setImageLoading(false)}
                onError={(error) => {
                  console.error("Image loading error:", error.nativeEvent);
                  setImageError(true);
                }}
              />
            )}
          </>
        </Skeleton>
      </View>

      {/* Content container with better spacing */}
      <View className="flex-1 justify-between pb-2 pr-4 ml-4 flex-shrink">
        <View>
          <Skeleton
            show={isLoading || !menuItem}
            colorMode="light"
            width={150}
            height={24}
          >
            <Text className="text-2xl font-bold">{menuItem?.name}</Text>
          </Skeleton>

          {/* Removed the section display here */}
        </View>

        <View className="justify-start mt-2">
          <Skeleton
            show={isLoading || !menuItem}
            colorMode="light"
            width={80}
            height={23}
          >
            <Text className="font-medium text-2xl">{menuItem?.price} HKD</Text>
          </Skeleton>
        </View>
        <View className="absolute right-2 bottom-2">
          {menuItem && (
            <View className="h-12 w-12 rounded-full bg-mates-blue items-center justify-center">
              <Ionicons name="add-outline" size={20} color="black" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MenuItemCard;

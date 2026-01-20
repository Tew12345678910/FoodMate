import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface OrderCardProps {
  id: string;
  restaurantName: string;
  destination: string;
  price: number;
  description?: string;
  timestamp?: string;
  onAccept?: (id: string) => void;
  isHistory?: boolean;
}

const OrderCard = ({
  id,
  restaurantName,
  destination,
  price,
  description,
  timestamp,
  onAccept,
  isHistory = false,
}: OrderCardProps) => {
  return (
    <TouchableOpacity className="flex-row mb-3 bg-white border-2 border-gray-100 rounded-3xl p-3">
      <View className="w-24 h-24 rounded-2xl bg-gray-300 mr-3" />

      <View className="flex-1 justify-between">
        <View>
          <Text className="font-semibold text-lg text-gray-800">
            {restaurantName}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            {description ? description : `To ${destination}`}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="font-bold text-green-700">
            {price.toFixed(1)} HKD
          </Text>

          {isHistory ? (
            <Text className="text-gray-400 text-xs">{timestamp}</Text>
          ) : (
            <TouchableOpacity
              className="bg-green-600/50 py-2 px-4 rounded-full"
              onPress={() => onAccept && onAccept(id)}
            >
              <Text className="text-black font-semibold text-center">
                Accept
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default OrderCard;

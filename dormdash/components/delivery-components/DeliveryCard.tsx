import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Skeleton } from "moti/skeleton";
import { OrderItem } from "../../services/orders";
import * as Progress from "react-native-progress";

interface DeliveryCardProps {
  id: string;
  restaurantName: string;
  destination: string;
  deliveryFee: number;
  items?: OrderItem[];
  onAccept?: (id: string) => void;
  isLoading?: boolean;
}

// Shared Spacer component for skeleton spacing
const Spacer = ({ height = 8 }) => <View style={{ height }} />;

const DeliveryCard = ({
  id,
  restaurantName,
  destination,
  deliveryFee,
  items = [],
  onAccept,
  isLoading = false,
}: DeliveryCardProps) => {
  return (
    <View className="mb-3 border border-gray-200 bg-white rounded-3xl p-4">
      <View className="flex-1">
        <View>
          <Skeleton show={isLoading} colorMode="light" width={200} height={24}>
            <Text className="text-2xl font-bold">{restaurantName}</Text>
          </Skeleton>

          <Spacer height={3} />

          <Skeleton show={isLoading} colorMode="light" width={150} height={16}>
            <Text className="text-base font-medium text-gray-600">
              To: {destination}
            </Text>
          </Skeleton>

          {!isLoading && items && items.length > 0 && (
            <>
              <Spacer height={5} />
              <View className="mt-1 mb-2">
                {items.map((item, index) => (
                  <Text key={index} className="text-sm text-gray-500">
                    {item.quantity}× {item.food_name}
                  </Text>
                ))}
              </View>
            </>
          )}

          <Spacer height={8} />

          <View className="flex-row justify-between items-center">
            <Skeleton
              show={isLoading}
              colorMode="light"
              width={150}
              height={30}
            >
              <Text className="font-medium text-2xl">
                Earn {deliveryFee.toFixed(2)} HKD
              </Text>
            </Skeleton>
          </View>
        </View>
        {!isLoading && (
          <TouchableOpacity
            className="absolute bottom-0 right-0 bg-mates-orange py-2 px-4 rounded-full"
            onPress={() => onAccept && onAccept(id)}
          >
            <Text className="text-black font-semibold text-center">Accept</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default DeliveryCard;

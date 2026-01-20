import React from "react";
import { ActivityIndicator, View, Text } from "react-native";

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({
  message = "Loading...",
}: LoadingOverlayProps) {
  return (
    <View className="absolute inset-0 flex-1 bg-black/30 items-center justify-center z-50">
      <View className="bg-white p-5 rounded-2xl shadow-md items-center">
        <ActivityIndicator size="large" color="#FF9500" />
        <Text className="text-gray-700 font-medium mt-3">{message}</Text>
      </View>
    </View>
  );
}

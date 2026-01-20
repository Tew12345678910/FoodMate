import React from "react";
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search for restaurants or food...",
}) => {
  return (
    <View className="flex-row items-center bg-white px-1 py-1 rounded-full mt-2 mb-4">
      <View className="rounded-full bg-mates-orange p-3">
        <Ionicons name="search" size={17} color="black" />
      </View>
      <TextInput
        placeholder={placeholder}
        className="ml-4 flex-1  font-medium placeholder:text-gray-400"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

export default SearchBar;

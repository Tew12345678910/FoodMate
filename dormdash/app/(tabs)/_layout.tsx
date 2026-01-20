import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import Colors from "../../constants/Colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Hide labels in the tab bar
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          bottom: 25, // Removed the insets.bottom addition
          left: "50%", // Center position
          width: "60%", // 90% of screen width
          height: 60,
          marginLeft: "20%", // Half of width to center (slightly adjusted)
          borderRadius: 30, // Rounded corners
          paddingBottom: 0,
          paddingTop: 10,
          borderTopWidth: 0,
          // iOS shadow
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          // Android shadow
          elevation: 8,
        },
        tabBarBackground: () => (
          <BlurView
            tint="light"
            intensity={30}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 30, // Match the container's border radius
              overflow: "hidden",
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="pizza" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: "Delivery",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="document" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

import React from "react";
import {
  RefreshControl,
  RefreshControlProps,
  Platform,
  StyleSheet,
} from "react-native";
import Colors from "../../constants/Colors";

interface CustomRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  colors?: string[];
  tintColor?: string;
  progressBackgroundColor?: string;
}

/**
 * A reusable RefreshControl component that can be applied consistently across the app
 */
const CustomRefreshControl: React.FC<CustomRefreshControlProps> = ({
  refreshing,
  onRefresh,
  colors = [Colors.primary], // Only using primary color
  tintColor = Colors.primary,
  progressBackgroundColor = "#ffffff",
}) => {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={colors}
      tintColor={tintColor}
      progressBackgroundColor={progressBackgroundColor}
      progressViewOffset={Platform.OS === "ios" ? 60 : 40} // Increased offset to lower the indicator position
      style={styles.refreshControl} // Add specific styling
    />
  );
};

const styles = StyleSheet.create({
  refreshControl: {
    backgroundColor: "transparent",
  },
});

export default CustomRefreshControl;

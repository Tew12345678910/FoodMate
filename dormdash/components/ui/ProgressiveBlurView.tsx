import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ColorValue,
} from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

interface ProgressiveBlurViewProps {
  // Only allow props that should be changeable
  children?: React.ReactNode;
  scrollY?: Animated.SharedValue<number>;
  headerText?: string;
}

/**
 * A component that creates a progressive blur effect with a gradient mask
 * with fixed white-themed styling
 */
const ProgressiveBlurView: React.FC<ProgressiveBlurViewProps> = ({
  children,
  scrollY,
  headerText,
}) => {
  // Fixed properties that were previously passed as props
  const height = 100;
  const position = "top";
  const gradientStart = { color: "transparent" };
  const gradientMid = { color: "rgba(255, 255, 255, 0.9)" };
  const gradientEnd = { color: "white" };
  const blurIntensity = 50;
  const blurTint = "light";
  const textColor = "black";

  const { width, height: screenHeight } = useWindowDimensions();

  // If scrollY is not provided, create a local one for demoing purpose
  const localScrollY = useSharedValue(0);
  const actualScrollY = scrollY || localScrollY;

  // Setup the scroll handler if no external scrollY is provided
  const onScroll = useAnimatedScrollHandler({
    onScroll: ({ contentOffset: { y } }) => {
      if (!scrollY) {
        localScrollY.value = -y;
      }
    },
  });

  // Create the gradient configuration
  const gradientConfig = easeGradient({
    colorStops: {
      0: gradientStart,
      0.5: gradientMid,
      1: gradientEnd,
    },
  });

  // Define fixed gradient colors and locations with the correct types
  // We know for sure there are at least 2 values because we specified 3 color stops
  const gradientColors: [ColorValue, ColorValue, ...ColorValue[]] = [
    gradientConfig.colors[0] || "transparent",
    gradientConfig.colors[1] || "rgba(255, 255, 255, 0.5)",
    ...(gradientConfig.colors.slice(2) as ColorValue[]),
  ];

  const gradientLocations: [number, number, ...number[]] = [
    gradientConfig.locations[0] || 0,
    gradientConfig.locations[1] || 0.5,
    ...(gradientConfig.locations.slice(2) as number[]),
  ];

  // Container style based on position - moved up to top: 0
  const containerStyle = {
    position: "absolute" as const,
    [position]: 0, // Moved the blur view back to the top
    height,
    width,
    zIndex: 2,
    pointerEvents: "none" as const, // Keep the pointer events none
  };

  // Optional parallax effect if component has an image
  const imageContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(actualScrollY.value, [0, screenHeight], [1, 2]) },
    ],
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      <MaskedView
        maskElement={
          <LinearGradient
            locations={gradientLocations}
            colors={gradientColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
          />
        }
        style={StyleSheet.absoluteFill}
      >
        <BlurView
          intensity={blurIntensity}
          tint={blurTint as any}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>

      {headerText && (
        <View style={styles.textContainer}>
          <Text style={[styles.text, { color: textColor }]}>{headerText}</Text>
        </View>
      )}

      {children}

      {/* If no external scrollY is provided, render a demo ScrollView */}
      {!scrollY && (
        <Animated.ScrollView
          scrollEventThrottle={16}
          onScroll={onScroll}
          style={[StyleSheet.absoluteFill, { zIndex: 3 }]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Base styles will be combined with containerStyle
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    zIndex: 3,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default ProgressiveBlurView;

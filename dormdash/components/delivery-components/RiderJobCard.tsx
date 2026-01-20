import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  GestureResponderEvent,
} from "react-native";
import { Skeleton } from "moti/skeleton";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import * as Progress from "react-native-progress";

interface RiderJobCardProps {
  id: string;
  restaurantName: string;
  destination: string;
  price: number;
  deliveryFee?: number;
  description?: string;
  status: string;
  acceptedTime?: string;
  isLoading?: boolean;
  onViewDetails?: (id: string) => void;
  onMarkDelivered?: (id: string) => void;
  cartId?: string; // Added for debugging
  showDebugInfo?: boolean; // Flag to control debug info visibility
}

// Shared Spacer component for skeleton spacing
const Spacer = ({ height = 8 }) => <View style={{ height }} />;

const RiderJobCard = ({
  id,
  restaurantName,
  destination,
  price,
  deliveryFee,
  description,
  status,
  acceptedTime,
  isLoading = false,
  onViewDetails,
  onMarkDelivered,
  cartId,
  showDebugInfo = false,
}: RiderJobCardProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60); // Default 60 minutes

  // Helper function to check if the status is delivered or completed
  const isDeliveredStatus = () => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === "delivered" || lowerStatus === "completed";
  };

  // Effect to calculate and update time remaining
  useEffect(() => {
    // Skip calculation if acceptedTime is missing or status is delivered/completed
    if (!acceptedTime || isDeliveredStatus()) {
      return;
    }

    // Parse the acceptedTime in the format "YYYY-MM-DD HH:MM"
    const parseDateString = (dateStr: string) => {
      try {
        // Split the date string into components
        const [datePart, timePart] = dateStr.split(" ");

        if (!datePart || !timePart) {
          return new Date(); // Return current date if format is invalid
        }

        const [year, month, day] = datePart.split("-").map(Number);
        const [hours, minutes] = timePart.split(":").map(Number);

        // JavaScript months are 0-indexed, so subtract 1 from month
        const parsedDate = new Date(year, month - 1, day, hours, minutes);
        return parsedDate;
      } catch (e) {
        console.error("Error parsing date:", e);
        return new Date(); // Return current date if parsing fails
      }
    };

    // Parse the accepted time string into a Date object
    const acceptedDate = parseDateString(acceptedTime);

    // Calculate the deadline (1 hour after acceptance)
    const deadlineTime = new Date(acceptedDate.getTime() + 60 * 60 * 1000);

    const calculateTimeRemaining = () => {
      const now = new Date();

      // Calculate the time difference in milliseconds
      const remainingMs = deadlineTime.getTime() - now.getTime();

      // Convert to minutes and ensure it's not negative
      const remainingMinutes = Math.max(
        0,
        Math.floor(remainingMs / (60 * 1000))
      );

      setTimeRemaining(remainingMinutes);
    };

    // Initial calculation
    calculateTimeRemaining();

    // Update every 30 seconds for more responsive UI
    const interval = setInterval(calculateTimeRemaining, 30000);

    return () => clearInterval(interval);
  }, [acceptedTime, status]);

  // Format the accepted time if available
  const formattedTime = acceptedTime
    ? (() => {
        const date = new Date(acceptedTime);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(date.getDate()).padStart(2, "0")} ${String(
          date.getHours()
        ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      })()
    : "N/A";

  // Determine if the order can be marked as delivered
  const canBeMarkedDelivered = () => {
    const lowerStatus = status.toLowerCase();
    return (
      lowerStatus === "accepted" ||
      lowerStatus === "in progress" ||
      lowerStatus === "in-progress"
    );
  };

  // Handle the Mark as Delivered button press
  const handleMarkDelivered = async (event: GestureResponderEvent) => {
    // Prevent click from propagating to parent
    event.stopPropagation();

    if (onMarkDelivered) {
      setIsSubmitting(true);
      try {
        await onMarkDelivered(id);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle view details
  const handleViewDetails = () => {
    console.log("View details clicked for order ID:", id);
    if (onViewDetails) {
      onViewDetails(id);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleViewDetails}
      disabled={isLoading}
      activeOpacity={0.7} // Add some feedback when pressed
    >
      {isLoading ? (
        <>
          <Skeleton show={true} colorMode="light" width={200} height={24} />
          <Spacer height={8} />
          <Skeleton show={true} colorMode="light" width={150} height={16} />
          <Spacer height={8} />
          <Skeleton show={true} colorMode="light" width={220} height={16} />
          <Spacer height={8} />
          <View style={styles.row}>
            <Skeleton show={true} colorMode="light" width={100} height={20} />
            <Skeleton
              show={true}
              colorMode="light"
              width={80}
              height={36}
              radius={18}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.restaurantName}>{restaurantName}</Text>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={Colors.text} />
              <Text style={styles.detailText}>To: {destination}</Text>
            </View>

            {acceptedTime && (
              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color={Colors.text} />
                <Text style={styles.detailText}>
                  Accepted at: {formattedTime}
                </Text>
              </View>
            )}

            {description && (
              <View style={styles.detailRow}>
                <Ionicons name="list" size={16} color={Colors.text} />
                <Text style={styles.detailText} numberOfLines={2}>
                  {description}
                </Text>
              </View>
            )}

            {/* Time remaining - only show for active orders */}
            {!isDeliveredStatus() && (
              <View style={styles.detailRow}>
                <Ionicons name="timer" size={16} color={Colors.text} />
                <Text style={styles.detailText}>
                  Time Remaining: {timeRemaining} min
                </Text>
              </View>
            )}

            {/* Progress bar - only show for active orders */}
            {acceptedTime &&
              ["accepted", "in progress", "in-progress"].includes(
                status.toLowerCase()
              ) && (
                <View style={styles.progressContainer}>
                  <Progress.Bar
                    progress={timeRemaining / 60}
                    width={null}
                    height={10}
                    color={timeRemaining <= 15 ? "#ef4444" : Colors.primary}
                    unfilledColor="#e5e7eb"
                    borderWidth={0}
                  />
                  <Text style={styles.progressText}>
                    {timeRemaining <= 15 ? "Hurry!" : "On time"}
                  </Text>
                </View>
              )}

            {/* Debug information section - only shown when showDebugInfo is true */}
            {showDebugInfo && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <View style={styles.debugRow}>
                  <Text style={styles.debugLabel}>Order ID:</Text>
                  <Text style={styles.debugValue}>{id}</Text>
                </View>
                {cartId && (
                  <View style={styles.debugRow}>
                    <Text style={styles.debugLabel}>Cart ID:</Text>
                    <Text style={styles.debugValue}>{cartId}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text className="text-2xl font-medium">
              {deliveryFee ? `${deliveryFee.toFixed(1)} HKD` : "N/A"}
            </Text>
            {canBeMarkedDelivered() && onMarkDelivered && (
              <TouchableOpacity
                style={styles.deliveredButton}
                onPress={handleMarkDelivered}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.deliveredButtonText}>Mark Delivered</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveredButton: {
    backgroundColor: "#10b981", // Green for delivered
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  deliveredButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressContainer: {
    marginTop: 8,
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 5,
    overflow: "hidden",
    position: "relative",
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.text,
    textAlign: "center",
  },
  debugContainer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 8,
  },
  debugRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  debugValue: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
  },
});

export default RiderJobCard;

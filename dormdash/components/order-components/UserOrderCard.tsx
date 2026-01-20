import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Skeleton } from "moti/skeleton";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { Order } from "../../services/orders";

interface UserOrderCardProps {
  order: Order | null;
  isLoading?: boolean;
  onViewDetails?: (order: Order) => void;
}

// Shared Spacer component for skeleton spacing
const Spacer = ({ height = 8 }) => <View style={{ height }} />;

const UserOrderCard = ({
  order,
  isLoading = false,
  onViewDetails,
}: UserOrderCardProps) => {
  // Format the order date if available
  const formattedDate = order?.date
    ? (() => {
        const date = new Date(order.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(date.getDate()).padStart(2, "0")} ${String(
          date.getHours()
        ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      })()
    : "N/A";

  // Format the total price
  const totalPrice = order
    ? order.total_price ||
      order.items.reduce(
        (sum, item) => sum + item.food_price * item.quantity,
        0
      ) + (order.deliveryfee || 0)
    : 0;

  // Get the status display color based on order status
  const getStatusColor = () => {
    if (!order) return Colors.primary;
    
    const status = order.status.toLowerCase();
    if (status === "delivered" || status === "completed") {
      return "#10b981"; // Green for completed
    } else if (status === "in progress" || status === "in-progress" || status === "accepted" || status === "order accepted") {
      return "#f59e0b"; // Amber for in progress
    } else if (status === "pending" || status === "waiting") {
      return "#3b82f6"; // Blue for pending
    } else {
      return Colors.primary; // Default color
    }
  };

  // Handle view details
  const handleViewDetails = () => {
    if (order && onViewDetails) {
      onViewDetails(order);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  if (!order) {
    return null;
  }

  // Create a description of the items
  const itemsDescription = order.items
    .map((item) => `${item.quantity}× ${item.food_name}`)
    .join(", ");

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleViewDetails}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.restaurantName}>{order.restaurant_name}</Text>
        <View 
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() }
          ]}
        >
          <Text style={styles.statusText}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={Colors.text} />
          <Text style={styles.detailText}>Ordered: {formattedDate}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={Colors.text} />
          <Text style={styles.detailText}>To: {order.location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="list" size={16} color={Colors.text} />
          <Text style={styles.detailText} numberOfLines={2}>
            {itemsDescription}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>{totalPrice.toFixed(1)} HKD</Text>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={handleViewDetails}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
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
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  detailsButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  detailsButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default UserOrderCard;
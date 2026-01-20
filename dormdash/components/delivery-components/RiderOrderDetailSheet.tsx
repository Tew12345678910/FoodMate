import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { Order } from "../../services/orders";
import Colors from "../../constants/Colors";

// Define an interface for exposing methods to the parent
export interface RiderOrderDetailSheetMethods {
  openSheet: (order: Order) => void;
  closeSheet: () => void;
}

interface RiderOrderDetailSheetProps {
  onMarkDelivered?: (orderId: string) => Promise<void>;
}

// Interface for list item data
interface ListItem {
  id: string;
  type: "header" | "orderDetails" | "sectionTitle" | "item" | "button";
  content: any;
}

// Use forwardRef to expose methods to parent component
const RiderOrderDetailSheet = forwardRef<
  RiderOrderDetailSheetMethods,
  RiderOrderDetailSheetProps
>((props, ref) => {
  const { onMarkDelivered } = props;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Define snap points for the bottom sheet - updated max snap to 80%
  const snapPoints = useMemo(() => ["50%", "80%"], []);

  // Backdrop component for bottom sheet
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openSheet: (order: Order) => {
      console.log("Opening sheet for order:", order.order_id);
      setSelectedOrder(order);

      requestAnimationFrame(() => {
        try {
          if (bottomSheetRef.current) {
            bottomSheetRef.current.snapToIndex(0);
          }
        } catch (error) {
          console.error("Error opening sheet:", error);
          setTimeout(() => {
            if (bottomSheetRef.current) {
              bottomSheetRef.current.snapToIndex(0);
            }
          }, 100);
        }
      });
    },
    closeSheet: () => {
      try {
        bottomSheetRef.current?.close();
      } catch (error) {
        console.error("Error closing sheet:", error);
      }
    },
  }));

  // Format date to a readable time
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")} ${String(
        date.getHours()
      ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch (e) {
      return dateString;
    }
  };

  // Handle mark as delivered
  const handleMarkDelivered = async () => {
    if (!selectedOrder || !onMarkDelivered) return;

    setIsLoading(true);
    try {
      if (!selectedOrder.order_id) {
        throw new Error("Order ID is missing");
      }

      await onMarkDelivered(selectedOrder.order_id);
      bottomSheetRef.current?.close();
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if the order can be marked as delivered
  const canBeMarkedDelivered = () => {
    if (!selectedOrder) return false;

    const status = selectedOrder.status.toLowerCase();
    return status === "order accepted";
  };

  // Prepare data for FlatList
  const getListData = useCallback((): ListItem[] => {
    if (!selectedOrder) return [];

    const data: ListItem[] = [];

    // Header
    data.push({
      id: "header",
      type: "header",
      content: {
        title: selectedOrder.restaurant_name,
        status: selectedOrder.status,
      },
    });

    // Order Details Section
    data.push({
      id: "orderDetailsTitle",
      type: "sectionTitle",
      content: "Order Details",
    });

    data.push({
      id: "orderDetails",
      type: "orderDetails",
      content: {
        date: selectedOrder.date,
        location: selectedOrder.location,
        timeofacceptance: selectedOrder.timeofacceptance,
        deliveryfee: selectedOrder.deliveryfee || 0,
        user_id: selectedOrder.user_id,
      },
    });

    // Items Section
    data.push({
      id: "itemsTitle",
      type: "sectionTitle",
      content: "Items",
    });

    // Add each item
    selectedOrder.items.forEach((item, index) => {
      data.push({
        id: `item-${index}`,
        type: "item",
        content: item,
      });
    });

    // Button (if can be marked as delivered)
    if (canBeMarkedDelivered()) {
      data.push({
        id: "button",
        type: "button",
        content: {
          isLoading,
        },
      });
    }

    return data;
  }, [selectedOrder, isLoading]);

  // Render list item based on type
  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    switch (item.type) {
      case "header":
        return (
          <View style={styles.header}>
            <Text style={styles.title}>{item.content.title}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.content.status.toLowerCase() === "delivered" ||
                    item.content.status.toLowerCase() === "completed"
                      ? "#10b981"
                      : Colors.primary,
                },
              ]}
            >
              <Text style={styles.statusText}>
                {item.content.status.charAt(0).toUpperCase() +
                  item.content.status.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>
        );

      case "sectionTitle":
        return <Text style={styles.sectionTitle}>{item.content}</Text>;

      case "orderDetails":
        return (
          <View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={16} color={Colors.text} />
              <Text style={styles.detailText}>
                Date: {formatDate(item.content.date)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={Colors.text} />
              <Text style={styles.detailText}>
                Delivery to: {item.content.location}
              </Text>
            </View>
            {item.content.timeofacceptance && (
              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color={Colors.text} />
                <Text style={styles.detailText}>
                  Accepted at: {formatDate(item.content.timeofacceptance)}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons name="cash" size={16} color={Colors.text} />
              <Text style={styles.detailText}>
                Delivery Fee: {item.content.deliveryfee.toFixed(1)} HKD
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person" size={16} color={Colors.text} />
              <Text style={styles.detailText}>
                Customer ID: {item.content.user_id}
              </Text>
            </View>
          </View>
        );

      case "item":
        const item_content = item.content;
        return (
          <View style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>
                {item_content.quantity}× {item_content.food_name}
              </Text>
              <Text style={styles.itemPrice}>
                {(item_content.food_price * item_content.quantity).toFixed(1)}{" "}
                HKD
              </Text>
            </View>
            {item_content.requirements &&
              item_content.requirements.length > 0 && (
                <View style={styles.requirementsContainer}>
                  {item_content.requirements.map(
                    (req: any, reqIndex: number) => (
                      <Text key={reqIndex} style={styles.requirementText}>
                        + {req.description}:{" "}
                        {req.price ? `${req.price.toFixed(1)} HKD` : ""}
                      </Text>
                    )
                  )}
                </View>
              )}
          </View>
        );

      case "button":
        return (
          <TouchableOpacity
            style={styles.deliveredButton}
            onPress={handleMarkDelivered}
            disabled={item.content.isLoading}
          >
            {item.content.isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
            )}
          </TouchableOpacity>
        );

      default:
        return null;
    }
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      index={-1}
      handleIndicatorStyle={{ backgroundColor: "#999", width: 40 }}
      backgroundStyle={{ backgroundColor: "white" }}
      handleStyle={{
        backgroundColor: "white",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      }}
    >
      {selectedOrder && (
        <BottomSheetFlatList
          data={getListData()}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.contentContainer}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: Colors.text,
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
  },
  itemContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  requirementsContainer: {
    marginTop: 4,
    paddingLeft: 8,
  },
  requirementText: {
    fontSize: 14,
    color: Colors.lightText,
  },

  deliveredButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  deliveredButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default RiderOrderDetailSheet;

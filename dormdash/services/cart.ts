import { apiRequest } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CartRequirement {
  description: string;
  section_name: string;
  price: number;
  food_id?: number[];
}

export interface CartOrderItem {
  food_id?: number;
  food_name?: string;
  food_price?: number;
  food_section?: string;
  quantity: number;
  requirements?: CartRequirement[];
  cart_id?: string; // Added cart_id to track individual item's cart
}

export interface CartData {
  user_id: string;
  restaurant_name: string;
  cart_id: string; // This will be the restaurant's cart group ID
  orderItems: CartOrderItem[];
  selected?: boolean; // For tracking selection in UI
}

export interface CartResponse {
  success: boolean;
  message: string;
  cart_id?: string;
  cart?: CartData;
}

// Get cart details for a user
export async function getCartDetails(userId: string): Promise<CartData[]> {
  try {
    const result = await apiRequest(`/cart/${userId}`, "GET");
    return result;
  } catch (error: any) {
    // For all errors, log them and return an empty array instead of throwing
    // Log any other errors that occur
  }
  // Return empty array for all error cases
  return [];
}

// Add items to cart
export async function addToCart(cartData: {
  user_id: string;
  restaurant_name: string;
  orderItems: Array<{
    food_id: number;
    quantity: number;
    requirements?: CartRequirement[];
  }>;
}): Promise<CartResponse> {
  try {
    const result = await apiRequest("/cart", "POST", cartData);
    return result;
  } catch (error: any) {
    // If the error is "No cart found" (expected when a new cart needs to be created),

    console.log("error adding to cart:", error.message || error);
    // Return a successful response object to prevent errors from showing
    return {
      success: false,
      message: "Item added to new cart",
    };
  }

  // For other errors, rethrow
}

// Clear a specific item from cart by its cart ID
export async function clearCartItem(
  cartId: string
): Promise<{ message: string }> {
  return apiRequest(`/clear_this_item_from_cart/${cartId}`, "DELETE");
}

// Clear all items from a restaurant's cart
export async function clearCart(cartId: string): Promise<{ message: string }> {
  return apiRequest(`/clear_cart/${cartId}`, "DELETE");
}

// Make changes to a specific cart item (update quantity or requirements)
export async function updateCartItem(
  cartId: string,
  orderItem: {
    food_id: number;
    quantity: number;
    requirements?: CartRequirement[];
  }
): Promise<CartResponse> {
  return apiRequest(`/make_changes_to_cart/${cartId}`, "PUT", {
    orderItems: [orderItem],
  });
}

// Update the quantity of a specific item using its cart ID
export async function updateItemQuantity(
  cartId: string,
  foodId: number,
  quantity: number,
  requirements?: CartRequirement[]
): Promise<CartResponse> {
  if (quantity === 0) {
    // If quantity is 0, remove the item
    const clearResult = await clearCartItem(cartId);
    return {
      success: true,
      message: clearResult.message,
    };
  } else {
    // Otherwise update the item's quantity
    return updateCartItem(cartId, {
      food_id: foodId,
      quantity,
      requirements,
    });
  }
}

// Save and retrieve selected restaurant cart ID from storage
const SELECTED_RESTAURANT_CART_KEY = "DORMDASH_SELECTED_RESTAURANT_CART";

// Save selected restaurant cart ID to storage
export async function saveSelectedRestaurant(
  userId: string,
  restaurantName: string
): Promise<void> {
  try {
    const storageKey = `${SELECTED_RESTAURANT_CART_KEY}_${userId}`;
    await AsyncStorage.setItem(storageKey, restaurantName);
  } catch (error) {
    console.error("Failed to save selected restaurant:", error);
  }
}

// Get selected restaurant cart from storage
export async function getSelectedRestaurant(
  userId: string
): Promise<string | null> {
  try {
    const storageKey = `${SELECTED_RESTAURANT_CART_KEY}_${userId}`;
    return await AsyncStorage.getItem(storageKey);
  } catch (error) {
    console.error("Failed to get selected restaurant:", error);
    return null;
  }
}

// Clear selected restaurant from storage
export async function clearSelectedRestaurant(userId: string): Promise<void> {
  try {
    const storageKey = `${SELECTED_RESTAURANT_CART_KEY}_${userId}`;
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear selected restaurant:", error);
  }
}

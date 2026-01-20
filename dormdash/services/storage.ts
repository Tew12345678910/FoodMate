import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage key for the selected cart
const SELECTED_CART_KEY = "DORMDASH_SELECTED_CART";

// Save selected cart ID to storage
export async function saveSelectedCart(
  userId: string,
  cartId: string
): Promise<void> {
  try {
    const storageKey = `${SELECTED_CART_KEY}_${userId}`;
    await AsyncStorage.setItem(storageKey, cartId);
  } catch (error) {
    console.error("Failed to save selected cart:", error);
  }
}

// Get selected cart ID from storage
export async function getSelectedCartId(
  userId: string
): Promise<string | null> {
  try {
    const storageKey = `${SELECTED_CART_KEY}_${userId}`;
    return await AsyncStorage.getItem(storageKey);
  } catch (error) {
    console.error("Failed to get selected cart:", error);
    return null;
  }
}

// Clear selected cart ID from storage
export async function clearSelectedCart(userId: string): Promise<void> {
  try {
    const storageKey = `${SELECTED_CART_KEY}_${userId}`;
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear selected cart:", error);
  }
}

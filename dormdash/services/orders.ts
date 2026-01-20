import { apiRequest, BASE_URL } from "./api";

export interface OrderRequirement {
  description: string;
  requirement_price?: number;
  price?: number;
  section_number?: number;
  food_id?: number[];
}

export interface OrderItem {
  food_name: string;
  food_section: string;
  food_price: number;
  quantity: number;
  requirements: OrderRequirement[];
}

export interface PlaceOrderParams {
  user_id: number | string;
  restaurant_name: string;
  location: string;
  deliveryfee: number;
  total_price: number; // Added required field
  items: {
    food_id: number;
    quantity: number;
    requirements?: {
      description: string;
      section_name: string;
      price: number; // Changed from requirement_price to price
    }[];
  }[];
}

export interface Order {
  date: string;
  deliveryfee: number;
  items: OrderItem[];
  location: string;
  order_id: string;
  restaurant_name: string;
  status: string;
  user_id: string;
  rider_id: string | null;
  cart_id: string;
  total_price?: number;
  timeofacceptance?: string; // Added for rider orders
}

export interface GetOrdersResponse {
  orders: Order[];
}

export interface AcceptOrderResponse {
  message: string;
  order_id: string;
  rider_id: string;
}

export interface MarkDeliveredResponse {
  message: string;
  order_id: string;
  rider_id: string;
}

// Place an order
export async function placeOrder(orderData: PlaceOrderParams) {
  return apiRequest("/place_order", "POST", orderData);
}

// Get orders for a specific user
export async function getUserOrders(
  userId: string | number
): Promise<GetOrdersResponse> {
  // Convert userId to string if it's a number to ensure compatibility
  const userIdString = userId.toString();

  try {
    console.log(`Fetching orders for user ID: ${userIdString}`);
    const response = await apiRequest(`/get_user_order/${userIdString}`, "GET");

    // Log the response for debugging
    console.log("API Response:", JSON.stringify(response, null, 2));

    // Return the response as is without transforming the orders
    return response;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    // Return empty orders array on error
    return { orders: [] };
  }
}

// Get pending orders that need to be delivered
export async function getPendingOrders(
  userId: string | number
): Promise<GetOrdersResponse> {
  // Convert userId to string if it's a number to ensure compatibility
  const userIdString = userId.toString();

  try {
    console.log(`Fetching pending orders for user ID: ${userIdString}`);
    // Updated to use the new endpoint format that requires user_id
    const response = await apiRequest(`/get_orders/${userIdString}`, "GET");

    // Log the response for debugging
    console.log("API Response:", JSON.stringify(response, null, 2));

    return response;
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    // Return empty orders array on error
    return { orders: [] };
  }
}

// Get orders assigned to a specific rider
export async function getRiderOrders(
  riderId: string | number
): Promise<GetOrdersResponse> {
  // Convert riderId to string if it's a number to ensure compatibility
  const riderIdString = riderId.toString();

  try {
    console.log(`Fetching orders for rider ID: ${riderIdString}`);
    const response = await apiRequest(`/get_order/${riderIdString}`, "GET");

    // Log the response for debugging
    console.log("API Response:", JSON.stringify(response, null, 2));

    // Return the response as is without transforming the orders
    return response;
  } catch (error) {
    console.error("Error fetching rider orders:", error);
    // Return empty orders array on error
    return { orders: [] };
  }
}

// Accept an order as a rider
export async function acceptOrder(
  orderId: string,
  riderId: string | number
): Promise<AcceptOrderResponse> {
  // Convert riderId to string if it's a number to ensure compatibility
  const riderIdString = riderId.toString();
  return apiRequest(`/accept_order/${orderId}`, "PUT", {
    rider: riderIdString,
  });
}

// Mark an order as delivered
export async function markOrderDelivered(
  orderId: string,
  riderId: string | number
): Promise<MarkDeliveredResponse> {
  // Convert riderId to string if it's a number to ensure compatibility
  const riderIdString = riderId.toString();

  // Adding detailed console.log to debug the request
  console.log(
    `Marking order ${orderId} as delivered by rider ${riderIdString}`
  );
  console.log(`Sending request to: ${BASE_URL}/mark_delivered/${orderId}`);
  console.log(`Request body: ${JSON.stringify({ rider: riderIdString })}`);

  try {
    // Using "rider" parameter to match the acceptOrder function implementation
    const response = await apiRequest(`/mark_delivered/${orderId}`, "PUT", {
      rider: riderIdString,
    });
    console.log("Mark delivered response:", response);
    return response;
  } catch (error) {
    console.error("Error in markOrderDelivered:", error);
    throw error;
  }
}

// Get all available delivery locations
export async function getLocations(): Promise<{ location: string }[]> {
  return apiRequest("/get_locations", "GET");
}

// Generate FPS QR code for payment
export async function generateQrCode(
  amount: number
): Promise<{ fps_payload: string }> {
  // Send amount as a JSON body instead of URL parameters
  return apiRequest("/generate_qr", "POST", { amount });
}

import { apiRequest } from "./api";
import { MenuItem } from "./manuItems";
export interface Restaurant {
  restaurant_name: string;
  restaurant_image_url?: string | null;
  opening_hours: string;
  status: string;
}

export interface RestaurantDetailResponse {
  items: MenuItem[];
  opening_hours: string;
  restaurant_name: string;
  restaurant_phone: string;
  restaurant_image_url: string | null;
  status: string;
}

export interface FoodRequirement {
  description: string;
  price: number;
  food_id: number[];
  section_name: string;
}

export interface CreateRequirementParams {
  description: string;
  price: number;
  food_id: number;
  section_number: number;
}

// Get all restaurants
export async function getAllRestaurants(): Promise<Restaurant[]> {
  return apiRequest("/restaurants", "GET");
}

// Get restaurant info and menu items
export async function getRestaurantMenu(
  restaurantName: string
): Promise<RestaurantDetailResponse> {
  return apiRequest(`/restaurant/${encodeURIComponent(restaurantName)}`, "GET");
}

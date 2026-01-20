import { apiRequest } from "./api";
// MenuItem interface definition
export interface MenuItem {
  food_id: number;
  name: string;
  price: number;
  description: string;
  section?: string;
  image_url?: string | null;
  restaurant_name?: string;
}

export interface PopularFoodResponse {
  food_id: number | string;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  restaurant_name: string;
}

// Get all popular foods
export async function getAllPopularFood(): Promise<PopularFoodResponse[]> {
  return apiRequest("/get_all_popular_food", "GET");
}

export async function getPopularFood(): Promise<PopularFoodResponse[]> {
  return apiRequest("/get_popular_food", "GET");
}

// Interface for menu items grouped by section
export interface MenuItemsBySection {
  [section: string]: MenuItem[];
}

/**
 * Groups menu items by their section
 * @param items Array of menu items
 * @returns Object with sections as keys and arrays of menu items as values
 */
export function groupMenuItemsBySection(items: MenuItem[]): MenuItemsBySection {
  const grouped: MenuItemsBySection = {};

  // Handle items without a section by creating a default section
  const defaultSection = "Other";

  items.forEach((item) => {
    const section = item.section || defaultSection;

    if (!grouped[section]) {
      grouped[section] = [];
    }

    grouped[section].push(item);
  });

  return grouped;
}

/**
 * Get unique section names from menu items
 * @param items Array of menu items
 * @returns Array of unique section names
 */
export function getSectionNames(items: MenuItem[]): string[] {
  const sections = new Set<string>();

  items.forEach((item) => {
    if (item.section) {
      sections.add(item.section);
    }
  });

  // Always add default section if there are items without a section
  const hasItemsWithoutSection = items.some((item) => !item.section);
  if (hasItemsWithoutSection) {
    sections.add("Other");
  }

  return Array.from(sections);
}

import { apiRequest } from "./api";

export interface Requirement {
  requirement_id: number;
  description: string;
  price: number;
}

export interface RequirementSection {
  section_id: number;
  section_name: string;
  section_number: number;
  is_required: boolean;
  min_num_of_picks: number;
  max_num_of_picks: number;
  requirements: Requirement[];
}

export async function getFoodRequirements(
  foodId: number
): Promise<RequirementSection[]> {
  try {
    const response = await apiRequest(
      `/get_sections_and_requirements/${foodId}`,
      "GET"
    );

    // Check if response is an error message
    if (response && response.success === false) {
      // This is not an error, it just means there are no requirements
      // Return an empty array instead of throwing an error
      return [];
    }

    return response || [];
  } catch (error) {
    // Instead of logging errors, we'll silently handle this case
    // Just return an empty array to indicate no requirements
    return [];
  }
}

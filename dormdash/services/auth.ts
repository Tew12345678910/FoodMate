import { BASE_URL, apiRequest } from "./api";

export interface RegisterParams {
  id: number | string; // Changed to accept string for Firebase UIDs
  username: string;
  email: string;
  phone: string;
  rider?: boolean;
  admin?: boolean;
}

export interface LoginParams {
  email: string;
  password: string;
  username?: string;
}

export interface User {
  id: number | string; // Changed to accept string for Firebase UIDs
  username: string;
  email: string;
  phone: string;
  rider?: boolean; // Added rider status flag
}

export interface UserCompensation {
  id: number | string; // Changed to accept string for Firebase UIDs
  compensation: number;
}

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  phone?: string;
  rider?: boolean;
}

// User Registration - Updated to work with email verification flow
export async function registerUser(userData: RegisterParams) {
  try {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] API REGISTRATION START - User: ${userData.email}`,
      {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        timestamp: timestamp,
      }
    );

    // We don't send the password to the backend for security
    // The backend will use the Firebase UID as the source of truth
    const dataToSend = {
      ...userData,
      password: undefined, // Explicitly remove password
    };

    const result = await apiRequest("/api/user/register", "POST", dataToSend);

    console.log(
      `[${new Date().toISOString()}] API REGISTRATION SUCCESS - User: ${
        userData.email
      }`,
      {
        id: userData.id,
        success: true,
        responseStatus: result?.success || true,
      }
    );

    return result;
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    console.error(
      `[${errorTimestamp}] API REGISTRATION FAILED - User: ${userData.email}`,
      {
        id: userData.id,
        email: userData.email,
        error: error instanceof Error ? error.message : String(error),
        timestamp: errorTimestamp,
      }
    );
    // If API fails but Firebase auth succeeded, we should still let the flow continue
    // This makes the app more resilient during development
    return {
      success: false,
      message: "Backend registration failed but auth succeeded",
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        phone: userData.phone || "",
      },
    };
  }
}

// Get User Info
export async function getUserInfo(userId: string) {
  try {
    return await apiRequest(`/api/user/info/${userId}`, "GET");
  } catch (error) {
    console.error(`Error fetching user info for ID ${userId}:`, error);
    // Return null so calling code can handle gracefully
    return null;
  }
}

export const updateUserProfile = async (
  userId: string | number,
  profileData: ProfileUpdateData
) => {
  try {
    console.log(`Updating user profile for ID ${userId}:`, profileData);

    // Use the apiRequest helper instead of direct fetch
    const response = await apiRequest(
      `/api/user/update/${userId}`,
      "PATCH",
      profileData
    );

    console.log(`API response for profile update:`, response);

    // Return the response regardless of its contents
    return response;
  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
    // Throw error to be handled by calling code
    throw error;
  }
};

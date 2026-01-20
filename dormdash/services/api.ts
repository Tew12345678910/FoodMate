const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required API env var: ${key}`);
  }
  return value;
};

export const BASE_URL = getEnv("EXPO_PUBLIC_API_BASE_URL");

// Base API request function with error handling
export async function apiRequest(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
  body?: any
) {
  try {
    const url = `${BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`Making ${method} request to: ${url}`);
    if (body) console.log(`Request body: ${JSON.stringify(body)}`);

    const response = await fetch(url, options);

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;

      try {
        // Try to parse as JSON first
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || `HTTP error ${response.status}`;
      } catch (parseError) {
        // If not JSON, use the raw text
        errorMessage = errorText || `HTTP error ${response.status}`;
      }
    }

    // Try to parse the response as JSON
    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      console.log("Empty response received from server");
      return {};
    }

    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      console.log("Raw response:", responseText);
      return {};
    }
  } catch (error) {
    console.log("API request failed:", error);

    // Throw an actual error object instead of an empty array
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(String(error) || "Unknown API error");
    }
  }
}

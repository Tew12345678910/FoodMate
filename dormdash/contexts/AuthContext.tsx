import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification,
  User as FirebaseUser,
  reload,
} from "firebase/auth";
import { auth } from "../firebase.client";
import { useRouter, useSegments } from "expo-router";
import {
  registerUser as apiRegisterUser,
  getUserInfo,
  updateUserProfile,
} from "../services/auth";

// User data structure - defines what info we store about authenticated users
type User = {
  id: string | number;
  username: string;
  email: string;
  phone: string;
  rider: boolean; // Indicates if the user is a delivery rider
  emailVerified?: boolean; // Track email verification status
};

// Profile update data structure
interface ProfileUpdateData {
  username?: string;
  email?: string;
  phone?: string;
}

// Authentication context definition - exposes auth functions and state to the app
interface AuthContextType {
  user: User | null; // Current authenticated user or null if not logged in
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean; // Loading state for auth operations
  authInitialized: boolean; // Indicates if auth system has completed initialization
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string,
    phone?: string
  ) => Promise<void>;
  updateProfile: (params: ProfileUpdateData) => Promise<void>;
  error: string | null; // Current error message, if any
  isValidEmail: (email: string) => boolean;
  sendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: false,
  authInitialized: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  updateProfile: async () => {},
  error: null,
  isValidEmail: () => false,
  sendVerificationEmail: async () => {},
  checkEmailVerification: async () => false,
});

// Converts Firebase user object to our app's User type
const convertFirebaseUserToUser = (
  firebaseUser: FirebaseUser | null
): User | null => {
  if (!firebaseUser) return null;

  return {
    id: firebaseUser.uid,
    username:
      firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
    email: firebaseUser.email || "",
    phone: firebaseUser.phoneNumber || "",
    rider: false, // Default value, updated from backend if needed
    emailVerified: firebaseUser.emailVerified,
  };
};

// Main AuthProvider component that wraps your app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const router = useRouter();
  const segments = useSegments();

  /**
   * Email validation
   * Purpose: Validates email domains to ensure they're from allowed institutions
   */
  const isValidEmail = (email: string): boolean => {
    const validDomains = ["connect.ust.hk", "ust.hk"];
    const emailRegex = /^[^\s@]+@([^\s@]+)$/;
    const match = email.match(emailRegex);

    if (match && match[1]) {
      return validDomains.includes(match[1]);
    }
    return false;
  };

  /**
   * Profile update
   * Purpose: Updates user profile information both in Firebase and backend
   */
  const updateProfile = async (params: ProfileUpdateData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) throw new Error("No authenticated user found");

      // Update backend profile
      await updateUserProfile(user.id, {
        username: params.username,
        email: params.email,
        phone: params.phone,
      });

      // Update Firebase display name if changed
      const currentUser = auth.currentUser;
      if (
        currentUser &&
        params.username &&
        currentUser.displayName !== params.username
      ) {
        await firebaseUpdateProfile(currentUser, {
          displayName: params.username,
        });
      }

      // User state will be updated by onAuthStateChanged listener
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * User registration
   * Purpose: Creates new user account and sends verification email
   * Note: User must verify email before logging in
   */
  const register = async (
    email: string,
    password: string,
    username: string,
    phone = ""
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate email domain
      if (!isValidEmail(email)) {
        setError(
          "Registration restricted to @connect.ust.hk and @ust.hk email domains only"
        );
        throw new Error("Invalid email domain");
      }

      // Create Firebase user
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (result.user) {
        // Set display name
        await firebaseUpdateProfile(result.user, { displayName: username });

        // Send verification email
        await sendEmailVerification(result.user);

        // Register with backend API immediately (don't wait for verification)
        try {
          await apiRegisterUser({
            id: result.user.uid,
            username,
            email,
            phone,
          });
        } catch (apiError) {
          console.error("Backend registration error:", apiError);
          // Continue even if backend registration fails
        }

        // Set temporary user state for verification UI
        setUser({
          id: result.user.uid,
          email: result.user.email || email,
          username,
          phone,
          rider: false,
          emailVerified: false,
        });
      }
    } catch (err: any) {
      console.error("Registration error:", err);

      if (err.message !== "Invalid email domain") {
        if (err.code === "auth/email-already-in-use") {
          setError("This email is already in use. Try logging in instead.");
        } else {
          setError(err.message || "Failed to create account");
        }
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * User login
   * Purpose: Authenticates user and ensures email is verified
   * Also handles backend registration if needed
   */
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate email domain
      if (!isValidEmail(email)) {
        setError(
          "Login restricted to @connect.ust.hk and @ust.hk email domains only"
        );
        throw new Error("Invalid email domain");
      }

      // Login with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Verify email is confirmed
      if (!userCredential.user.emailVerified) {
        setError("Please verify your email before logging in");
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        throw new Error("Email not verified");
      }

      // Register with backend if needed
      try {
        const userInfo = await getUserInfo(userCredential.user.uid);

        if (!userInfo) {
          const userData = {
            id: userCredential.user.uid,
            username: userCredential.user.displayName || email.split("@")[0],
            email: userCredential.user.email || email,
            phone: "",
          };

          await apiRegisterUser(userData);
        }
      } catch (apiError) {
        console.error("Backend registration error:", apiError);
        // Continue with login even if backend registration fails
      }
    } catch (err: any) {
      console.error("Login error:", err);

      if (
        err.message !== "Invalid email domain" &&
        err.message !== "Email not verified"
      ) {
        if (
          err.code === "auth/user-not-found" ||
          err.code === "auth/wrong-password"
        ) {
          setError("Invalid email or password");
        } else {
          setError(err.message || "Failed to log in");
        }
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * User logout
   * Purpose: Signs out current user
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await signOut(auth);
      // User state will be cleared by onAuthStateChanged listener
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "Failed to log out");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send verification email
   * Purpose: Sends or resends email verification link
   */
  const sendVerificationEmail = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;

      if (currentUser) {
        await sendEmailVerification(currentUser);
      } else {
        setError("Please log in to receive a verification email");
        throw new Error("No authenticated user for verification");
      }
    } catch (err: any) {
      console.error("Verification email error:", err);
      setError(err.message || "Failed to send verification email");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Auth state listener
   * Purpose: Keeps local user state in sync with Firebase auth state
   * Fetches additional user info from backend when authenticated
   */
  useEffect(() => {
    if (!auth) {
      setError("Authentication service unavailable");
      setIsLoading(false);
      setAuthInitialized(true);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // Convert Firebase user to app User type
        const userObj = convertFirebaseUserToUser(firebaseUser);

        // If signed in, fetch additional info from backend
        if (userObj && firebaseUser) {
          try {
            const additionalInfo = await getUserInfo(firebaseUser.uid);

            if (additionalInfo) {
              // Merge backend user data with Firebase data
              userObj.username = additionalInfo.username || userObj.username;
              userObj.email = additionalInfo.email || userObj.email;
              userObj.phone = additionalInfo.phone || userObj.phone;
              userObj.rider = additionalInfo.rider;
            }
          } catch (error) {
            console.log("Could not fetch user info:", error);
            // Non-critical error, continue with available data
          }
        }

        setUser(userObj);
        setIsLoading(false);
        setAuthInitialized(true);
      },
      (error) => {
        console.error("Auth state error:", error);
        setError(error.message);
        setIsLoading(false);
        setAuthInitialized(true);
      }
    );

    return unsubscribe;
  }, []);

  // Add route protection logic to restrict unverified users
  useEffect(() => {
    if (!authInitialized) return;

    // Define protected and auth routes
    const inAuthGroup = segments[0] === "(auth)";
    const isVerificationPending = segments[1] === "verificationPending";
    const isLoginOrRegister =
      segments[1] === "login" || segments[1] === "register";

    // Only apply restrictions to users with unverified emails
    if (user && !user.emailVerified) {
      // Logged in but email not verified
      // Allow only verificationPending, login, or register pages
      if (!inAuthGroup || (!isVerificationPending && !isLoginOrRegister)) {
        router.replace("/verificationPending");
      }
    } else if (user && inAuthGroup) {
      // Logged in and verified, redirect away from auth screens
      router.replace("/(tabs)");
    }
    // Non-logged in users can access any part of the app - no redirects
  }, [user, segments, authInitialized]);

  // Context value object with all auth functionality
  const value: AuthContextType = {
    user,
    setUser,
    isLoading,
    error,
    authInitialized,
    register,
    login,
    logout,
    updateProfile,
    isValidEmail,
    sendVerificationEmail,
    checkEmailVerification: async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await reload(currentUser);
        console.log(
          `Email verification status for ${currentUser.email}: ${currentUser.emailVerified}`
        );
        return currentUser.emailVerified;
      }
      console.log(
        "No current user found when checking email verification status"
      );
      return false;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to access auth context
export const useAuth = () => useContext(AuthContext);

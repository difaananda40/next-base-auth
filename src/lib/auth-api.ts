import { api } from "./api";
import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  User,
} from "@/types/auth";

export const authService = {
  // Login user (httpOnly cookie is set automatically by browser)
  login: async (credentials: LoginRequest) => {
    try {
      return await api.post<LoginResponse>("/auth/login", credentials, {
        credentials: "include",
      });
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  // Register user (httpOnly cookie is set automatically by browser)
  register: async (userData: RegisterRequest) => {
    try {
      return await api.post<RegisterResponse>("/auth/register", userData);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  },

  // Logout user (httpOnly cookie is cleared by server)
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
      throw error;
    }
  },

  // Get current user info
  getCurrentUser: async (config = {}): Promise<User | null> => {
    try {
      const response = await api.get<User>("/auth/profile", config);
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      return null;
    }
  },
};

export default authService;

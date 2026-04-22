// ============================================
// Authentication Service
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// ============================================

import api from "../../../api/config";

const authService = {
  // Register new customer
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await api.put("/auth/profile", userData);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
  },

  // [Admin] Get all users
  getAllUsers: async () => {
    const response = await api.get("/auth/users");
    return response.data;
  },

  // [Admin] Create staff account
  createStaff: async (staffData) => {
    const response = await api.post("/auth/create-staff", staffData);
    return response.data;
  },

  // [Admin] Update any user
  updateUser: async (id, userData) => {
    const response = await api.put(`/auth/users/${id}`, userData);
    return response.data;
  },

  // [Admin] Deactivate user
  deactivateUser: async (id) => {
    const response = await api.put(`/auth/users/${id}/deactivate`);
    return response.data;
  },

  // [Admin] Reactivate user
  reactivateUser: async (id) => {
    const response = await api.put(`/auth/users/${id}/reactivate`);
    return response.data;
  },
};

export default authService;

// ============================================
// [Epic E1] User and Role Management
// This context is the "heartbeat" of our security system.
// It keeps track of who is logged in and what they are allowed to do.
// Owner: IT24100548 (Galagama S.T)
// ============================================

import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import ForcePasswordResetModal from "../components/ForcePasswordResetModal";

const AuthContext = createContext();

// A handy hook so any component can easily check if a user is logged in
// or get their profile details without passing props down multiple levels.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // On each token change, attach it to all outgoing axios requests as a Bearer token (JWT auth)
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
    refreshCounts();
  }, [token]);

  // [E1.2] Validates the stored JWT by calling /api/auth/me — if invalid, auto-logout occurs
  const loadUser = async () => {
    try {
      const res = await axios.get("/api/auth/me");
      setUser(res.data.user);

      // Safety check: if it's their first time, we force a password change
      if (res.data.user && res.data.user.mustChangePassword) {
        setShowPasswordModal(true);
      }
    } catch (error) {
      console.error("Session expired or invalid:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // [E1.1] Registers a new customer and immediately logs them in by storing the returned JWT
  const register = async (userData) => {
    try {
      const res = await axios.post("/api/auth/register", userData);

      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        setToken(token);
        setUser(user);
        if (user.mustChangePassword) {
          setShowPasswordModal(true);
        }
        return { success: true, user };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // [E1.2] Authenticates user credentials and stores the returned JWT for all future API calls
  const login = async (email, password) => {
    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
      });

      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        setToken(token);
        setUser(user);
        if (user.mustChangePassword) {
          setShowPasswordModal(true);
        }
        return { success: true, user };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // [E1.13] Clears JWT from localStorage and removes the axios auth header — prevents re-use after logout
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setShowPasswordModal(false);
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // [E1.3] Updates the user's profile (name, phone, address) and refreshes the local user state
  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put("/api/auth/profile", profileData);

      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    }
  };

  // After a forced password change succeeds, re-load user data to clear the mustChangePassword flag
  const handlePasswordChangeSuccess = async () => {
    setShowPasswordModal(false);
    await loadUser();
  };

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Keeps the navbar cart and wishlist badge counts in sync — works for both guests and logged-in users
  const refreshCounts = async () => {
    // 1. Refresh Cart Count
    const token = localStorage.getItem("token");
    if (!token) {
      // Guest users: cart is stored in localStorage as a JSON object
      const guestCart = JSON.parse(localStorage.getItem("guestCart")) || {
        items: [],
      };
      setCartCount(
        guestCart.items.reduce((sum, item) => sum + item.quantity, 0),
      );
    } else {
      // Authenticated users: cart is server-side, fetch live count from API
      try {
        const res = await axios.get("/api/cart");
        if (res.data?.cart?.items) {
          setCartCount(
            res.data.cart.items.reduce((sum, item) => sum + item.quantity, 0),
          );
        }
      } catch (error) {
        console.error("Error refreshing cart count:", error);
      }
    }

    // 2. Refresh Wishlist Count
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlistCount(wishlist.length);
  };

  useEffect(() => {
    refreshCounts();
    // Listen for storage events (if changed in another tab)
    window.addEventListener("storage", refreshCounts);
    return () => window.removeEventListener("storage", refreshCounts);
  }, []);

  // The context value — everything exposed to the app via useAuth()
  const value = {
    user, // current logged-in user object (null if not authenticated)
    token, // raw JWT string (also in localStorage)
    loading, // true while the initial session check is in progress
    register,
    login,
    logout,
    updateProfile,
    // [E1.8] Used by ProfileSettingsModal for voluntary password changes (not forced reset)
    changePassword: async (passwordData) => {
      try {
        const res = await axios.put("/api/auth/change-password", passwordData);
        return {
          success: true,
          message: res.data.message || "Password updated successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Failed to update password",
        };
      }
    },
    isAuthenticated: !!user, // !! converts user object → boolean (null → false, object → true)
    showPasswordModal,
    setShowPasswordModal,
    cartCount,
    wishlistCount,
    refreshCounts,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showPasswordModal && (
        <ForcePasswordResetModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordChangeSuccess}
          logout={logout}
        />
      )}
    </AuthContext.Provider>
  );
};

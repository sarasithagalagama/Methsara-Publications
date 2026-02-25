// ============================================
// [Epic E1] User and Role Management
// --------------------------------------------
// This context is the "heartbeat" of our security system.
// It keeps track of who is logged in and what they are allowed to do.
// Owner: IT24100548 (Galagama S.T)
// ============================================

import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import ForcePasswordResetModal from "../components/ForcePasswordResetModal";

const AuthContext = createContext();

/**
 * A handy hook so any component can easily check if a user is logged in
 * or get their profile details without passing props down multiple levels.
 */
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

  /**
   * Every time the app loads or the token changes, we make sure
   * axios knows to use that token for all future requests.
   */
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
    refreshCounts();
  }, [token]);

  /**
   * [Epic E1.2] - Validating the Session
   * We ping the server to see if the token is still valid and
   * grab the latest user details (like their role: Admin, Manager, etc.)
   */
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

  /**
   * [Epic E1.1] - Creating New Accounts
   * This handles the registration flow, saving the token locally
   * so the user stays logged in after signing up.
   */
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

  /**
   * [Epic E1.2] - Secure Entry
   * The main login function. It swaps credentials for a secure JWT token.
   */
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

  /**
   * Cleaning up: we wipe the local storage and reset the auth state
   * so no sensitive data sticks around.
   */
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

  /**
   * [Epic E1.3] - Keeping Profiles Fresh
   * Allows users to update their personal details.
   */
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

  /**
   * A little helper to close the 'Must Change Password' modal
   * once they've successfully updated it.
   */
  const handlePasswordChangeSuccess = async () => {
    setShowPasswordModal(false);
    await loadUser();
  };

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const refreshCounts = async () => {
    // 1. Refresh Cart Count
    const token = localStorage.getItem("token");
    if (!token) {
      // Guest: From local storage
      const guestCart = JSON.parse(localStorage.getItem("guestCart")) || {
        items: [],
      };
      setCartCount(
        guestCart.items.reduce((sum, item) => sum + item.quantity, 0),
      );
    } else {
      // Authenticated: From API
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

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateProfile,
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
    isAuthenticated: !!user,
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

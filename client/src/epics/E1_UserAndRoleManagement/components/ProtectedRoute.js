// ============================================
// Protected Route Component
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Route protection with RBAC
// ============================================

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// [E1.6] RBAC guard — wraps any route that requires authentication or a specific role
// allowedRoles=[] (default) means any authenticated user may enter; pass roles to restrict further
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // 'replace' removes the protected URL from history so back-button can't bypass the guard
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p>
          Your role: <strong>{user.role}</strong>
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

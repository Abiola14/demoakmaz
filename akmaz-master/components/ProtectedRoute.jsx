import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  children,
  allowedRoles = null,
}) => {
  const token = localStorage.getItem("token");

  const role = (
    localStorage.getItem("role") || ""
  ).toLowerCase();

  // User is not logged in
  if (!token) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Role-specific protection
  if (allowedRoles) {
    const roles = allowedRoles.map((item) =>
      item.toLowerCase()
    );

    if (!roles.includes(role)) {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }
  }

  return children;
};

export default ProtectedRoute;
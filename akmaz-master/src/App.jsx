import React from "react";
import { Routes, Route } from "react-router-dom";

// Authentication
import Login from "../components/Login";
import ForgotPassword from "../components/ForgotPassword";
import RequestOtp from "../components/RequestOtp";
import VerifyOtp from "../components/VerifyOtp";
import ResetPasswordOtp from "../components/ResetPasswordOtp";

// Protection / Layout
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";

// Main Pages
import Dashboard from "../components/Dashboard";
import Inventory from "../components/Inventory";
import Report from "../components/Report";
import Sales from "../components/Sales";
import Bank from "../components/Bank";
import Expenditure from "../components/Expenditure";

// Super Admin
import SuperAdmin from "../components/SuperAdmin";

const App = () => {
  return (
    <Routes>

      {/* ================= AUTH ================= */}

      <Route path="/" element={<Login />} />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/request-otp"
        element={<RequestOtp />}
      />

      <Route
        path="/verify-otp"
        element={<VerifyOtp />}
      />

      <Route
        path="/reset-password-otp"
        element={<ResetPasswordOtp />}
      />

      {/* ================= DASHBOARD ================= */}

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Sidebar />
          </ProtectedRoute>
        }
      >

        {/* Dashboard Home */}
        <Route
          index
          element={<Dashboard />}
        />

        {/* Inventory */}
        <Route
          path="inventory"
          element={<Inventory />}
        />

        {/* Reports */}
        <Route
          path="report"
          element={<Report />}
        />

        {/* Sales */}
        <Route
          path="sales"
          element={<Sales />}
        />

        {/* Bank */}
        <Route
          path="bank"
          element={<Bank />}
        />

        {/* Expenditure */}
        <Route
          path="expenditure"
          element={<Expenditure />}
        />

        {/* Super Admin */}
        <Route
          path="super-admin"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdmin />
            </ProtectedRoute>
          }
        />

      </Route>

    </Routes>
  );
};

export default App;
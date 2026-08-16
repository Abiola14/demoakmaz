// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "../components/Login";
import DashboardLayout from "../components/DashboardLayout";
import Dashboard from "../components/Dashboard";
import Inventory from "../components/Inventory";
import Report from "../components/Report";
import Sales from "../components/Sales";
import ForgotPassword from "../components/ForgotPassword";
import ProtectedRoute from "../components/ProtectedRoute";
import Bank from "../components/Bank";
import Expenditure from "../components/Expenditure";

// OTP Flow
import RequestOtp from "../components/RequestOtp";
import VerifyOtp from "../components/VerifyOtp";
import ResetPasswordOtp from "../components/ResetPasswordOtp";

const App = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* OTP Routes */}
      <Route path="/request-otp" element={<RequestOtp />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password-otp" element={<ResetPasswordOtp />} />

      {/* Dashboard Protected Routes */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard Home */}
        <Route index element={<Dashboard />} />

        {/* Other Pages */}
        <Route path="inventory" element={<Inventory />} />
        <Route path="report" element={<Report />} />
        <Route path="sales" element={<Sales />} />
        <Route path="bank" element={<Bank />} />
        <Route path="expenditure" element={<Expenditure />} />
      </Route>
    </Routes>
  );
};

export default App;
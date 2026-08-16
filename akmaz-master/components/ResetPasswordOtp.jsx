import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../components/Api";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ResetPasswordOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, otp } = location.state || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return alert("Passwords do not match");
    if (newPassword.length < 6) return alert("Password must be at least 6 characters");

    setLoading(true);
    try {
      await api.post("/user/reset-password-otp", { email, otp, newPassword });
      alert("Password reset successful! You can now login.");
      navigate("/");
    } catch (err) {
      alert(err.response?.data || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%", borderRadius: "12px" }}>
        <h3 className="text-center mb-3 text-success">Set New Password</h3>
        <p className="text-center text-muted small mb-4">
          Email: <strong>{email}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="mb-3 position-relative">
            <input
              type={showNew ? "text" : "password"}
              className="form-control"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <span
              onClick={() => setShowNew(!showNew)}
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#6c757d",
              }}
            >
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="mb-4 position-relative">
            <input
              type={showConfirm ? "text" : "password"}
              className="form-control"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#6c757d",
              }}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center mt-3 text-muted">
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => navigate("/")}
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordOtp;

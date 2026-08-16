import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../components/Api";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("resetEmail") || ""; //  Get email from sessionStorage
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  //  Redirect if email not found
  if (!email) {
    alert("No email found. Please request OTP again.");
    navigate("/forgot-password");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/user/verify-otp", { email, otp });
      navigate("/reset-password-otp", { state: { email, otp } });
    } catch (err) {
      alert(err.response?.data || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h4 className="text-center mb-4">Enter OTP</h4>
        <p className="text-center text-muted small">Check your email: {email}</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">6-Digit OTP</label>
            <input
              type="text"
              className="form-control text-center"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength="6"
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;

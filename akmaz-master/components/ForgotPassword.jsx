import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../components/Api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await api.post("/user/request-otp", { email: email.trim() });

      // 🔥 Save email for next step
      sessionStorage.setItem("resetEmail", email.trim());

      alert("OTP sent! Check your email.");

      // 🔥 Navigate to verify OTP page
      navigate("/verify-otp");
    } catch (err) {
      alert("Failed to send OTP: " + (err.response?.data || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-5" style={{ maxWidth: "440px", width: "100%" }}>
        <h3 className="text-center mb-4">Forgot Password</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="form-control form-control-lg text-center mb-4"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-success btn-lg w-100"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP → Verify Page"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

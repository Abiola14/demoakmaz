import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../components/Api";

const RequestOtp = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/user/request-otp", { email });
      alert("OTP sent! Check your email.");
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h4 className="text-center mb-4">Forgot Password</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
        <p className="text-center mt-3">
          <button className="btn btn-link p-0" onClick={() => navigate("/")}>
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default RequestOtp;
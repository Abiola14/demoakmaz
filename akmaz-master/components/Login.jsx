import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import img from "../src/img/Akmaz.png";
import "./Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../components/Api";

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("auditor");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLoginRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegistering ? "/User/register" : "/User/login";
      const body = isRegistering
        ? { username, email, password, role }
        : { username, password };

      const res = await api.post(endpoint, body);

      if (isRegistering) {
        alert("Registration successful! You can now log in.");
        setIsRegistering(false);
        setUsername("");
        setEmail("");
        setPassword("");
        setRole("auditor");
        return;
      }

      const { token, username: returnedUsername, role: userRole } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("username", returnedUsername);
      localStorage.setItem("role", userRole);
      alert(`Welcome back, ${returnedUsername}!`);
      navigate("/dashboard");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "Connection failed. Check your network or server.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/User/request-otp", { email });
      alert("OTP sent! Check your email.");
      sessionStorage.setItem("resetEmail", email);
      navigate("/verify-otp");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">

        {/* Logo */}
        <div className="login-logo-wrap">
          <img src={img} alt="Akmaz Logo" />
        </div>

        {/* ── FORGOT PASSWORD FORM ── */}
        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword}>
            <h2 className="login-title">Reset Password</h2>
            <p className="login-subtitle">Enter your email to receive a one-time code</p>

            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-btn-primary" disabled={loading}>
              {loading ? <><span className="login-spinner" /> Sending...</> : "Send OTP"}
            </button>

            <div className="login-footer-row" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="login-link"
                onClick={() => { setIsForgotPassword(false); setEmail(""); }}
                disabled={loading}
              >
                ← Back to Login
              </button>
            </div>
          </form>

        ) : (
          /* ── LOGIN / REGISTER FORM ── */
          <form onSubmit={handleLoginRegister}>
            <h2 className="login-title">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="login-subtitle">
              {isRegistering
                ? "Fill in your details to get started"
                : "Sign in to continue to Akmaz"}
            </p>

            {/* Username */}
            <div className="login-field">
              <label className="login-label">Username</label>
              <input
                type="text"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>

            {/* Email (Register only) */}
            {isRegistering && (
              <div className="login-field">
                <label className="login-label">Email</label>
                <input
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            )}

            {/* Password */}
            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-pw-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input"
                  style={{ paddingRight: "44px" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Role (Register only) */}
            {isRegistering && (
              <div className="login-field">
                <label className="login-label">Role</label>
                <select
                  className="login-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select a role</option>
                  <option value="auditor">Auditor (View Only)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="login-btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner" />
                  {isRegistering ? "Registering..." : "Signing in..."}
                </>
              ) : (
                isRegistering ? "Create Account" : "Sign In"
              )}
            </button>

            {/* Forgot Password */}
            {!isRegistering && (
              <div className="login-footer-row" style={{ marginTop: "14px" }}>
                <button
                  type="button"
                  className="login-link"
                  onClick={() => setIsForgotPassword(true)}
                  disabled={loading}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Switch Register / Login */}
            <div className="login-footer-row" style={{ marginTop: isRegistering ? "16px" : "8px" }}>
              {isRegistering ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="login-link"
                    onClick={() => setIsRegistering(false)}
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="login-link"
                    onClick={() => setIsRegistering(true)}
                    disabled={loading}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

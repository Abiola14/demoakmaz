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

  // Public registration only allows Auditor/Admin.
  // Super Admin must be created by an existing Super Admin.
  const [role, setRole] = useState("auditor");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ============================================================
  // LOGIN / REGISTER
  // ============================================================

  const handleLoginRegister = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const endpoint = isRegistering
        ? "/User/register"
        : "/User/login";

      const body = isRegistering
        ? {
            username: username.trim(),
            email: email.trim(),
            password,
            role,
          }
        : {
            username: username.trim(),
            password,
          };

      const res = await api.post(endpoint, body);

      // ========================================================
      // REGISTRATION SUCCESS
      // ========================================================

      if (isRegistering) {
        alert(
          "Registration successful! You can now log in."
        );

        setIsRegistering(false);

        setUsername("");
        setEmail("");
        setPassword("");
        setRole("auditor");

        return;
      }

      // ========================================================
      // LOGIN SUCCESS
      // ========================================================

      const {
        token,
        username: returnedUsername,
        role: returnedRole,
        isTemporaryPassword,
      } = res.data;

      if (!token) {
        throw new Error(
          "Login succeeded but no authentication token was returned."
        );
      }

      // --------------------------------------------------------
      // Normalize role
      // --------------------------------------------------------

      const normalizedRole = String(
        returnedRole || "auditor"
      ).toLowerCase();

      // --------------------------------------------------------
      // Store authentication information
      // --------------------------------------------------------

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "username",
        returnedUsername || username
      );

      localStorage.setItem(
        "role",
        normalizedRole
      );

      // Store temporary-password status
      localStorage.setItem(
        "isTemporaryPassword",
        String(Boolean(isTemporaryPassword))
      );

      // --------------------------------------------------------
      // Welcome message
      // --------------------------------------------------------

      alert(
        `Welcome back, ${
          returnedUsername || username
        }!`
      );

      // --------------------------------------------------------
      // Go to dashboard
      // --------------------------------------------------------

      navigate("/dashboard");

    } catch (err) {
      console.error("Login/Register error:", err);

      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Connection failed. Check your network or server.";

      alert(errorMsg);

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    setLoading(true);

    try {
      await api.post(
        "/User/request-otp",
        {
          email: email.trim(),
        }
      );

      alert(
        "OTP sent! Check your email."
      );

      sessionStorage.setItem(
        "resetEmail",
        email.trim()
      );

      navigate("/verify-otp");

    } catch (err) {
      console.error(
        "Forgot password error:",
        err
      );

      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to send OTP.";

      alert(msg);

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CLEAR LOGIN FORM
  // ============================================================

  const switchToRegister = () => {
    if (loading) return;

    setIsRegistering(true);
    setIsForgotPassword(false);

    setUsername("");
    setEmail("");
    setPassword("");
    setRole("auditor");
  };

  // ============================================================
  // SWITCH TO LOGIN
  // ============================================================

  const switchToLogin = () => {
    if (loading) return;

    setIsRegistering(false);
    setIsForgotPassword(false);

    setUsername("");
    setEmail("");
    setPassword("");
    setRole("auditor");
  };

  // ============================================================
  // FORGOT PASSWORD SCREEN
  // ============================================================

  if (isForgotPassword) {
    return (
      <div className="login-page">

        <div className="login-box">

          {/* Logo */}
          <div className="login-logo-wrap">
            <img
              src={img}
              alt="Akmaz Logo"
            />
          </div>

          <form
            onSubmit={
              handleForgotPassword
            }
          >

            <h2 className="login-title">
              Reset Password
            </h2>

            <p className="login-subtitle">
              Enter your email to receive
              a one-time code
            </p>

            {/* Email */}
            <div className="login-field">

              <label className="login-label">
                Email
              </label>

              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                required
                disabled={loading}
              />

            </div>

            {/* Submit */}
            <button
              type="submit"
              className="login-btn-primary"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="login-spinner" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}

            </button>

            {/* Back */}
            <div
              className="login-footer-row"
              style={{
                marginTop: "20px",
              }}
            >

              <button
                type="button"
                className="login-link"
                onClick={() => {
                  setIsForgotPassword(false);
                  setEmail("");
                }}
                disabled={loading}
              >
                ← Back to Login
              </button>

            </div>

          </form>

        </div>

      </div>
    );
  }

  // ============================================================
  // LOGIN / REGISTER SCREEN
  // ============================================================

  return (
    <div className="login-page">

      <div className="login-box">

        {/* ======================================================
            LOGO
        ====================================================== */}

        <div className="login-logo-wrap">
          <img
            src={img}
            alt="Akmaz Logo"
          />
        </div>

        <form
          onSubmit={
            handleLoginRegister
          }
        >

          {/* ====================================================
              TITLE
          ==================================================== */}

          <h2 className="login-title">

            {isRegistering
              ? "Create Account"
              : "Welcome Back"}

          </h2>

          <p className="login-subtitle">

            {isRegistering
              ? "Fill in your details to get started"
              : "Sign in to continue to Akmaz"}

          </p>

          {/* ====================================================
              USERNAME
          ==================================================== */}

          <div className="login-field">

            <label className="login-label">
              Username
            </label>

            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter your username"
              required
              disabled={loading}
            />

          </div>

          {/* ====================================================
              EMAIL
              REGISTER ONLY
          ==================================================== */}

          {isRegistering && (
            <div className="login-field">

              <label className="login-label">
                Email
              </label>

              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                required
                disabled={loading}
              />

            </div>
          )}

          {/* ====================================================
              PASSWORD
          ==================================================== */}

          <div className="login-field">

            <label className="login-label">
              Password
            </label>

            <div className="login-pw-wrap">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                className="login-input"
                style={{
                  paddingRight: "44px",
                }}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className="login-pw-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                tabIndex={-1}
                disabled={loading}
              >

                {showPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}

              </button>

            </div>

          </div>

          {/* ====================================================
              ROLE
              REGISTER ONLY
          ==================================================== */}

          {isRegistering && (
            <div className="login-field">

              <label className="login-label">
                Role
              </label>

              <select
                className="login-select"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                required
                disabled={loading}
              >

                <option value="auditor">
                  Auditor (View Only)
                </option>

                <option value="admin">
                  Admin (Full Access)
                </option>

              </select>

              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Super Admin accounts can
                only be created by an existing
                Super Admin.
              </small>

            </div>
          )}

          {/* ====================================================
              SUBMIT
          ==================================================== */}

          <button
            type="submit"
            className="login-btn-primary"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="login-spinner" />

                {isRegistering
                  ? "Registering..."
                  : "Signing in..."}
              </>
            ) : (
              isRegistering
                ? "Create Account"
                : "Sign In"
            )}

          </button>

          {/* ====================================================
              FORGOT PASSWORD
          ==================================================== */}

          {!isRegistering && (
            <div
              className="login-footer-row"
              style={{
                marginTop: "14px",
              }}
            >

              <button
                type="button"
                className="login-link"
                onClick={() =>
                  setIsForgotPassword(true)
                }
                disabled={loading}
              >
                Forgot your password?
              </button>

            </div>
          )}

          {/* ====================================================
              SWITCH LOGIN / REGISTER
          ==================================================== */}

          <div
            className="login-footer-row"
            style={{
              marginTop: isRegistering
                ? "16px"
                : "8px",
            }}
          >

            {isRegistering ? (
              <>
                Already have an account?{" "}

                <button
                  type="button"
                  className="login-link"
                  onClick={
                    switchToLogin
                  }
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
                  onClick={
                    switchToRegister
                  }
                  disabled={loading}
                >
                  Register
                </button>
              </>
            )}

          </div>

        </form>

      </div>

    </div>
  );
};

export default Login;
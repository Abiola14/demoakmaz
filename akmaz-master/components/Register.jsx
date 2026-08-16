import React, { useState } from "react";
import axios from "axios";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5274/api/user/register", {
        username,
        password,
        role
      });
      setMessage(res.data); // "User registered successfully"
      setUsername("");
      setPassword("");
      setRole("User");
    } catch (err) {
      if (err.response) {
        setMessage(err.response.data);
      } else {
        setMessage("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-lg" style={{ width: "400px", borderRadius: "15px" }}>
        <h3 className="text-center mb-3">Register Account</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Role (optional)</label>
            <input
              type="text"
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-dark w-100">
            Register
          </button>
        </form>

        {message && (
          <p className="text-center mt-3" style={{ color: message.includes("success") ? "green" : "red" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;

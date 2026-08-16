import React, { useEffect, useState } from "react";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:5274/api/User/list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [token]);

  const resetPassword = async (username) => {
    if (!confirm(`Reset password for ${username} to Akmaz@1234?`)) return;
    try {
      const res = await fetch("http://localhost:5274/api/User/admin-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert(txt);
        return;
      }
      alert("Password reset to Akmaz@1234");
    } catch (err) {
      console.error(err);
      alert("Error resetting password");
    }
  };

  return (
    <div className="container py-4">
      <h3>Users</h3>
      <table className="table">
        <thead>
          <tr><th>Username</th><th>Role</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>
                <button className="btn btn-sm btn-warning" onClick={() => resetPassword(u.username)}>
                  Reset Password
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;

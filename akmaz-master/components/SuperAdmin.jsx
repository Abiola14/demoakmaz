import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiKey,
  FiUserX,
  FiUserCheck,
  FiRefreshCw,
  FiShield,
  FiX,
  FiCheck,
  FiAlertTriangle,
} from "react-icons/fi";

import "./SuperAdmin.css";

const API_URL = "http://localhost:8000/api";

const SuperAdmin = () => {
  const navigate = useNavigate();

  const role = localStorage.getItem("role")?.toLowerCase();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Super Admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected user
  const [selectedUser, setSelectedUser] = useState(null);

  // Create user form
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "auditor",
  });

  // Change role
  const [newRole, setNewRole] = useState("auditor");

  // Reset password
  const [newPassword, setNewPassword] = useState("");

  // Message
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // --------------------------------------------------
  // AUTHORIZATION CHECK
  // --------------------------------------------------

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    if (role !== "superadmin") {
      navigate("/dashboard");
    }
  }, [token, role, navigate]);

  // --------------------------------------------------
  // AXIOS CONFIG
  // --------------------------------------------------

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  // --------------------------------------------------
  // MESSAGE
  // --------------------------------------------------

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  // --------------------------------------------------
  // GET USERS
  // --------------------------------------------------

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/User/list`,
        authConfig
      );

      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);

      if (error.response?.status === 401) {
        showMessage(
          "Your session has expired. Please login again.",
          "error"
        );

        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");

        navigate("/");
        return;
      }

      if (error.response?.status === 403) {
        showMessage(
          "You do not have permission to access this page.",
          "error"
        );

        navigate("/dashboard");
        return;
      }

      showMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to load users.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "superadmin" && token) {
      fetchUsers();
    }
  }, [role, token]);

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return users;
    }

    return users.filter((user) => {
      return (
        String(user.username || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.email || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.role || "")
          .toLowerCase()
          .includes(searchValue)
      );
    });
  }, [users, search]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.isActive !== false
  ).length;

  const adminUsers = users.filter(
    (user) =>
      String(user.role || "").toLowerCase() === "admin"
  ).length;

  const auditorUsers = users.filter(
    (user) =>
      String(user.role || "").toLowerCase() === "auditor"
  ).length;

  const superAdminUsers = users.filter(
    (user) =>
      String(user.role || "").toLowerCase() === "superadmin"
  ).length;

  // --------------------------------------------------
  // CREATE USER
  // --------------------------------------------------

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!createForm.username.trim()) {
      showMessage("Username is required.", "error");
      return;
    }

    if (!createForm.email.trim()) {
      showMessage("Email is required.", "error");
      return;
    }

    if (!createForm.password) {
      showMessage("Password is required.", "error");
      return;
    }

    if (createForm.password.length < 6) {
      showMessage(
        "Password must be at least 6 characters.",
        "error"
      );
      return;
    }

    try {
      setProcessing(true);

      await axios.post(
        `${API_URL}/User/admin-create`,
        {
          username: createForm.username.trim(),
          email: createForm.email.trim(),
          password: createForm.password,
          role: createForm.role,
        },
        authConfig
      );

      showMessage("User created successfully.");

      setCreateForm({
        username: "",
        email: "",
        password: "",
        role: "auditor",
      });

      setShowCreateModal(false);

      await fetchUsers();
    } catch (error) {
      console.error("Create user error:", error);

      showMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to create user.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // CHANGE ROLE
  // --------------------------------------------------

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(
      String(user.role || "auditor").toLowerCase()
    );
    setShowRoleModal(true);
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      setProcessing(true);

      await axios.put(
        `${API_URL}/User/change-role/${selectedUser.id}`,
        {
          role: newRole,
        },
        authConfig
      );

      showMessage(
        `Role for ${selectedUser.username} updated successfully.`
      );

      setShowRoleModal(false);
      setSelectedUser(null);

      await fetchUsers();
    } catch (error) {
      console.error("Change role error:", error);

      showMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to change user role.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // TOGGLE USER STATUS
  // --------------------------------------------------

  const handleToggleStatus = async (user) => {
    const currentlyActive = user.isActive !== false;

    const action = currentlyActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${user.username}"?`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      await axios.put(
        `${API_URL}/User/toggle-status/${user.id}`,
        {},
        authConfig
      );

      showMessage(
        `${user.username} has been ${
          currentlyActive ? "deactivated" : "activated"
        }.`
      );

      await fetchUsers();
    } catch (error) {
      console.error("Toggle status error:", error);

      showMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to update user status.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // RESET PASSWORD
  // --------------------------------------------------

  const openResetModal = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (!newPassword) {
      showMessage(
        "Please enter a new password.",
        "error"
      );
      return;
    }

    if (newPassword.length < 6) {
      showMessage(
        "Password must be at least 6 characters.",
        "error"
      );
      return;
    }

    try {
      setProcessing(true);

      await axios.post(
        `${API_URL}/User/admin-reset`,
        {
          userId: selectedUser.id,
          newPassword: newPassword,
        },
        authConfig
      );

      showMessage(
        `Password for ${selectedUser.username} was reset successfully.`
      );

      setShowResetModal(false);
      setSelectedUser(null);
      setNewPassword("");

      await fetchUsers();
    } catch (error) {
      console.error("Reset password error:", error);

      showMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to reset password.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // DELETE USER
  // --------------------------------------------------

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setProcessing(true);

      await axios.delete(
        `${API_URL}/User/delete/${selectedUser.id}`,
        authConfig
      );

      showMessage(
        `${selectedUser.username} has been deleted successfully.`
      );

      setShowDeleteModal(false);
      setSelectedUser(null);

      await fetchUsers();
    } catch (error) {
      console.error("Delete user error:", error);

      showMessage(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to delete user.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // CLOSE MODALS
  // --------------------------------------------------

  const closeAllModals = () => {
    if (processing) return;

    setShowCreateModal(false);
    setShowRoleModal(false);
    setShowResetModal(false);
    setShowDeleteModal(false);

    setSelectedUser(null);
    setNewPassword("");
  };

  // --------------------------------------------------
  // ROLE BADGE
  // --------------------------------------------------

  const getRoleBadge = (userRole) => {
    const currentRole = String(
      userRole || ""
    ).toLowerCase();

    if (currentRole === "superadmin") {
      return (
        <span className="sa-role-badge sa-role-superadmin">
          <FiShield size={13} />
          Super Admin
        </span>
      );
    }

    if (currentRole === "admin") {
      return (
        <span className="sa-role-badge sa-role-admin">
          Admin
        </span>
      );
    }

    if (currentRole === "auditor") {
      return (
        <span className="sa-role-badge sa-role-auditor">
          Auditor
        </span>
      );
    }

    return (
      <span className="sa-role-badge sa-role-user">
        {userRole || "User"}
      </span>
    );
  };

  // --------------------------------------------------
  // DATE FORMAT
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  if (role !== "superadmin") {
    return null;
  }

  return (
    <div className="super-admin-page">

      {/* HEADER */}
      <div className="sa-page-header">
        <div>
          <div className="sa-title-row">
            <div className="sa-title-icon">
              <FiShield size={25} />
            </div>

            <div>
              <h1>Super Admin</h1>
              <p>
                Manage users, roles and system access.
              </p>
            </div>
          </div>
        </div>

        <div className="sa-header-actions">
          <button
            className="sa-refresh-btn"
            onClick={fetchUsers}
            disabled={loading || processing}
          >
            <FiRefreshCw
              size={17}
              className={loading ? "sa-spin" : ""}
            />
            Refresh
          </button>

          <button
            className="sa-primary-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <FiUserPlus size={17} />
            Create User
          </button>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`sa-message ${
            messageType === "error"
              ? "sa-message-error"
              : "sa-message-success"
          }`}
        >
          {messageType === "error" ? (
            <FiAlertTriangle size={18} />
          ) : (
            <FiCheck size={18} />
          )}

          <span>{message}</span>

          <button
            onClick={() => {
              setMessage("");
              setMessageType("");
            }}
          >
            <FiX size={17} />
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="sa-stats-grid">

        <div className="sa-stat-card">
          <div className="sa-stat-icon">
            <FiUsers />
          </div>

          <div>
            <span>Total Users</span>
            <strong>{totalUsers}</strong>
          </div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-icon sa-stat-active">
            <FiCheck />
          </div>

          <div>
            <span>Active Users</span>
            <strong>{activeUsers}</strong>
          </div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-icon sa-stat-admin">
            <FiShield />
          </div>

          <div>
            <span>Admins</span>
            <strong>{adminUsers}</strong>
          </div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-icon sa-stat-auditor">
            <FiUsers />
          </div>

          <div>
            <span>Auditors</span>
            <strong>{auditorUsers}</strong>
          </div>
        </div>

        <div className="sa-stat-card">
          <div className="sa-stat-icon sa-stat-super">
            <FiShield />
          </div>

          <div>
            <span>Super Admins</span>
            <strong>{superAdminUsers}</strong>
          </div>
        </div>

      </div>

      {/* USER MANAGEMENT */}
      <div className="sa-users-card">

        <div className="sa-users-header">

          <div>
            <h2>User Management</h2>
            <p>
              Control user accounts, permissions and access.
            </p>
          </div>

          <div className="sa-search-box">
            <FiSearch size={18} />

            <input
              type="text"
              placeholder="Search username, email or role..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                onClick={() => setSearch("")}
              >
                <FiX size={16} />
              </button>
            )}
          </div>

        </div>

        {/* TABLE */}
        <div className="sa-table-wrapper">

          {loading ? (
            <div className="sa-loading">
              <FiRefreshCw
                className="sa-spin"
                size={25}
              />
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="sa-empty">
              <FiUsers size={40} />

              <h3>No users found</h3>

              <p>
                {search
                  ? "Try changing your search."
                  : "There are currently no users."}
              </p>
            </div>
          ) : (
            <table className="sa-users-table">

              <thead>
                <tr>
                  <th>S/N</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredUsers.map((user, index) => {

                  const isActive =
                    user.isActive !== false;

                  const isCurrentUser =
                    String(user.username || "").toLowerCase() ===
                    String(username || "").toLowerCase();

                  return (
                    <tr key={user.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <div className="sa-user-cell">

                          <div className="sa-avatar">
                            {String(
                              user.username || "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {user.username || "—"}
                            </strong>

                            {isCurrentUser && (
                              <span className="sa-you-label">
                                You
                              </span>
                            )}
                          </div>

                        </div>
                      </td>

                      <td>
                        {user.email || "—"}
                      </td>

                      <td>
                        {getRoleBadge(user.role)}
                      </td>

                      <td>
                        <span
                          className={`sa-status ${
                            isActive
                              ? "sa-status-active"
                              : "sa-status-inactive"
                          }`}
                        >
                          <span className="sa-status-dot"></span>

                          {isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          user.created_At ||
                            user.createdAt
                        )}
                      </td>

                      <td>

                        <div className="sa-action-buttons">

                          {/* CHANGE ROLE */}
                          <button
                            className="sa-action-btn sa-action-role"
                            title="Change Role"
                            onClick={() =>
                              openRoleModal(user)
                            }
                            disabled={
                              processing ||
                              isCurrentUser
                            }
                          >
                            <FiEdit size={16} />
                          </button>

                          {/* RESET PASSWORD */}
                          <button
                            className="sa-action-btn sa-action-password"
                            title="Reset Password"
                            onClick={() =>
                              openResetModal(user)
                            }
                            disabled={processing}
                          >
                            <FiKey size={16} />
                          </button>

                          {/* ACTIVATE / DEACTIVATE */}
                          <button
                            className={`sa-action-btn ${
                              isActive
                                ? "sa-action-deactivate"
                                : "sa-action-activate"
                            }`}
                            title={
                              isActive
                                ? "Deactivate User"
                                : "Activate User"
                            }
                            onClick={() =>
                              handleToggleStatus(user)
                            }
                            disabled={
                              processing ||
                              isCurrentUser
                            }
                          >
                            {isActive ? (
                              <FiUserX size={16} />
                            ) : (
                              <FiUserCheck size={16} />
                            )}
                          </button>

                          {/* DELETE */}
                          <button
                            className="sa-action-btn sa-action-delete"
                            title="Delete User"
                            onClick={() =>
                              openDeleteModal(user)
                            }
                            disabled={
                              processing ||
                              isCurrentUser
                            }
                          >
                            <FiTrash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>
          )}

        </div>

        {/* TABLE FOOTER */}
        {!loading && (
          <div className="sa-table-footer">
            Showing{" "}
            <strong>
              {filteredUsers.length}
            </strong>{" "}
            of <strong>{users.length}</strong> users
          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* CREATE USER MODAL */}
      {/* ================================================= */}

      {showCreateModal && (
        <div
          className="sa-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeAllModals();
            }
          }}
        >
          <div className="sa-modal">

            <div className="sa-modal-header">
              <div>
                <h2>Create User</h2>
                <p>
                  Create a new Akmaz system account.
                </p>
              </div>

              <button
                className="sa-modal-close"
                onClick={closeAllModals}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>

              <div className="sa-form-group">
                <label>Username</label>

                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      username: e.target.value,
                    })
                  }
                  placeholder="Enter username"
                  disabled={processing}
                />
              </div>

              <div className="sa-form-group">
                <label>Email</label>

                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter email address"
                  disabled={processing}
                />
              </div>

              <div className="sa-form-group">
                <label>Password</label>

                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      password: e.target.value,
                    })
                  }
                  placeholder="Enter password"
                  disabled={processing}
                />
              </div>

              <div className="sa-form-group">
                <label>Role</label>

                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      role: e.target.value,
                    })
                  }
                  disabled={processing}
                >
                  <option value="auditor">
                    Auditor
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                  <option value="superadmin">
                    Super Admin
                  </option>
                </select>
              </div>

              <div className="sa-modal-actions">

                <button
                  type="button"
                  className="sa-cancel-btn"
                  onClick={closeAllModals}
                  disabled={processing}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sa-primary-btn"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <FiRefreshCw className="sa-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiUserPlus />
                      Create User
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* CHANGE ROLE MODAL */}
      {/* ================================================= */}

      {showRoleModal && selectedUser && (
        <div
          className="sa-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeAllModals();
            }
          }}
        >
          <div className="sa-modal">

            <div className="sa-modal-header">

              <div>
                <h2>Change User Role</h2>

                <p>
                  Change the role assigned to{" "}
                  <strong>
                    {selectedUser.username}
                  </strong>
                  .
                </p>
              </div>

              <button
                className="sa-modal-close"
                onClick={closeAllModals}
              >
                <FiX />
              </button>

            </div>

            <form onSubmit={handleChangeRole}>

              <div className="sa-form-group">

                <label>New Role</label>

                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value)
                  }
                  disabled={processing}
                >
                  <option value="auditor">
                    Auditor
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                  <option value="superadmin">
                    Super Admin
                  </option>
                </select>

              </div>

              <div className="sa-warning-box">
                <FiAlertTriangle />

                <span>
                  Changing a user's role immediately
                  changes what they can access in the
                  system.
                </span>
              </div>

              <div className="sa-modal-actions">

                <button
                  type="button"
                  className="sa-cancel-btn"
                  onClick={closeAllModals}
                  disabled={processing}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sa-primary-btn"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <FiRefreshCw className="sa-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      Update Role
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* RESET PASSWORD MODAL */}
      {/* ================================================= */}

      {showResetModal && selectedUser && (
        <div
          className="sa-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeAllModals();
            }
          }}
        >
          <div className="sa-modal">

            <div className="sa-modal-header">

              <div>
                <h2>Reset Password</h2>

                <p>
                  Reset the password for{" "}
                  <strong>
                    {selectedUser.username}
                  </strong>
                  .
                </p>
              </div>

              <button
                className="sa-modal-close"
                onClick={closeAllModals}
              >
                <FiX />
              </button>

            </div>

            <form onSubmit={handleResetPassword}>

              <div className="sa-form-group">

                <label>New Password</label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                  disabled={processing}
                />

              </div>

              <div className="sa-warning-box">
                <FiKey />

                <span>
                  The user will need to use the new
                  password the next time they log in.
                </span>
              </div>

              <div className="sa-modal-actions">

                <button
                  type="button"
                  className="sa-cancel-btn"
                  onClick={closeAllModals}
                  disabled={processing}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sa-primary-btn"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <FiRefreshCw className="sa-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <FiKey />
                      Reset Password
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* DELETE USER MODAL */}
      {/* ================================================= */}

      {showDeleteModal && selectedUser && (
        <div
          className="sa-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeAllModals();
            }
          }}
        >
          <div className="sa-modal sa-delete-modal">

            <div className="sa-delete-icon">
              <FiTrash2 size={25} />
            </div>

            <h2>Delete User?</h2>

            <p>
              You are about to permanently delete the
              account:
            </p>

            <strong className="sa-delete-username">
              {selectedUser.username}
            </strong>

            <div className="sa-danger-box">
              <FiAlertTriangle />

              <span>
                This action cannot be undone. The user's
                account and access to the system will be
                permanently removed.
              </span>
            </div>

            <div className="sa-modal-actions">

              <button
                type="button"
                className="sa-cancel-btn"
                onClick={closeAllModals}
                disabled={processing}
              >
                Cancel
              </button>

              <button
                type="button"
                className="sa-delete-confirm-btn"
                onClick={handleDeleteUser}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <FiRefreshCw className="sa-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    Delete User
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdmin;
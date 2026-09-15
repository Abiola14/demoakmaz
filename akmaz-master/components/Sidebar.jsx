import React, { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiLogOut,
  FiMenu,
  FiDollarSign,
  FiX,
  FiShield,
  FiChevronDown,
} from "react-icons/fi";

import { BsBank2 } from "react-icons/bs";

import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar starts OPEN
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);

  const username = localStorage.getItem("username") || "User";

  const role = (
    localStorage.getItem("role") || ""
  ).toLowerCase();

  const isSuperAdmin = role === "superadmin";

  const navItems = [
    {
      to: "/dashboard",
      label: "Home",
      icon: <FiHome size={18} />,
    },
    {
      to: "/dashboard/inventory",
      label: "Inventory",
      icon: <FiBox size={18} />,
    },
    {
      to: "/dashboard/sales",
      label: "Sales",
      icon: <FiShoppingCart size={18} />,
    },
    {
      to: "/dashboard/bank",
      label: "Bank",
      icon: <BsBank2 size={18} />,
    },
    {
      to: "/dashboard/expenditure",
      label: "Expenditure",
      icon: <FiDollarSign size={18} />,
    },
  ];

  // Super Admin only
  if (isSuperAdmin) {
    navItems.push({
      to: "/dashboard/super-admin",
      label: "Super Admin",
      icon: <FiShield size={18} />,
    });
  }

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return location.pathname.startsWith(path);
  };

  const getRoleName = () => {
    if (role === "superadmin") {
      return "Super Admin";
    }

    if (role === "admin") {
      return "Admin";
    }

    if (role === "auditor") {
      return "Auditor";
    }

    return "User";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("isTemporaryPassword");

    sessionStorage.removeItem("resetEmail");

    navigate("/");
  };

  // ESC closes sidebar and profile menu
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`dl-root ${
        sidebarOpen ? "" : "dl-root--sidebar-closed"
      }`}
    >

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="dl-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className="dl-sidebar">

        {/* BRAND */}
        <div className="dl-sidebar__brand">

          <div className="dl-sidebar__logo">
            A
          </div>

          <span className="dl-sidebar__brand-name">
            Akmaz
          </span>

          <button
            type="button"
            className="dl-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FiX size={20} />
          </button>

        </div>

        {/* USER */}
        <div className="dl-sidebar__user">

          <div className="dl-sidebar__username">
            {username}
          </div>

          <div className="dl-sidebar__role">
            {getRoleName()}
          </div>

        </div>

        {/* NAVIGATION */}
        <nav className="dl-sidebar__nav">

          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`dl-sidebar__link ${
                isActive(item.to)
                  ? "dl-sidebar__link--active"
                  : ""
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}

              <span>
                {item.label}
              </span>
            </Link>
          ))}

        </nav>

        {/* LOGOUT */}
        <div className="dl-sidebar__footer">

          <button
            type="button"
            className="dl-sidebar__logout"
            onClick={handleLogout}
          >
            <FiLogOut size={18} />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <div className="dl-main">

        {/* TOPBAR */}
        <header className="dl-topbar">

          {/* HAMBURGER */}
          <button
            type="button"
            className="dl-hamburger"
            onClick={() => {
              setSidebarOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
          >
            <FiMenu size={22} />
          </button>

          {/* TITLE */}
          <div className="dl-topbar-title">
            Akmaz Management System
          </div>

          {/* USER PROFILE */}
          <div className="dl-profile-wrapper">

            <button
              type="button"
              className={`dl-topbar-user ${
                profileOpen
                  ? "dl-topbar-user--active"
                  : ""
              }`}
              onClick={() =>
                setProfileOpen((prev) => !prev)
              }
              aria-expanded={profileOpen}
              aria-label="Open user menu"
            >

              <div className="dl-topbar-avatar">
                {username.charAt(0).toUpperCase()}
              </div>

              <div className="dl-topbar-user-info">

                <strong>
                  {username}
                </strong>

                <span>
                  {getRoleName()}
                </span>

              </div>

              <FiChevronDown
                size={16}
                className={`dl-profile-chevron ${
                  profileOpen
                    ? "dl-profile-chevron--open"
                    : ""
                }`}
              />

            </button>

            {/* PROFILE DROPDOWN */}
            {profileOpen && (
              <div className="dl-profile-dropdown">

                <div className="dl-profile-dropdown-header">

                  <div className="dl-profile-dropdown-avatar">
                    {username.charAt(0).toUpperCase()}
                  </div>

                  <div className="dl-profile-dropdown-info">

                    <strong>
                      {username}
                    </strong>

                    <span>
                      {getRoleName()}
                    </span>

                  </div>

                </div>

                <div className="dl-profile-divider" />

                <button
                  type="button"
                  className="dl-profile-logout"
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                >
                  <FiLogOut size={17} />

                  <span>
                    Logout
                  </span>
                </button>

              </div>
            )}

          </div>

        </header>

        {/* PAGE CONTENT */}
        <main className="dl-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default Sidebar;
import React, { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiBox,
  FiBarChart2,
  FiShoppingCart,
  FiLogOut,
  FiMenu, FiDollarSign,
  FiX,
} from "react-icons/fi";
import { BsBank2 } from "react-icons/bs";
import img from "../src/img/Akmaz.png";
import "./DashboardLaoyout.css";

const navItems = [
  { to: "/dashboard", icon: <FiHome size={18} />, label: "Home" },
  { to: "/dashboard/Inventory", icon: <FiBox size={18} />, label: "Inventory" },
  // { to: "/dashboard/Report", icon: <FiBarChart2 size={18} />, label: "Report" },
  { to: "/dashboard/Sales", icon: <FiShoppingCart size={18} />, label: "Sales" },
    { to: "/dashboard/Bank", icon: <BsBank2 size={18} />, label: "Bank" },
    { to: "/dashboard/Expenditure", icon: <FiDollarSign  size={18} />, label: "Expenditure" },
];

const DashboardLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const closeSidebar = () => setIsOpen(false);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      navigate("/");
    }
  };

  return (
    <div className="dl-root">
      {/* ── Overlay (click to close sidebar) ── */}
      {isOpen && <div className="dl-overlay" onClick={closeSidebar} />}

      {/* ── Sidebar ── */}
      <aside className={`dl-sidebar ${isOpen ? "dl-sidebar--open" : ""}`}>
        {/* Logo */}
        <div className="dl-sidebar__brand">
          <Link to="/dashboard" onClick={closeSidebar}>
            <img src={img} alt="Akmaz Logo" width={52} height={52} />
          </Link>
          <span className="dl-sidebar__brand-name">Akmaz</span>
        </div>

        {/* Nav links */}
        <nav className="dl-sidebar__nav">
          {navItems.map(({ to, icon, label }) => {
            const active =
              to === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={closeSidebar}
                className={`dl-sidebar__link ${active ? "dl-sidebar__link--active" : ""}`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="dl-sidebar__footer">
          <button className="dl-sidebar__logout" onClick={handleLogout}>
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="dl-main">
        {/* Top bar with hamburger */}
        <header className="dl-topbar">
          <button className="dl-hamburger" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </header>

        {/* Page content */}
        <main className="dl-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

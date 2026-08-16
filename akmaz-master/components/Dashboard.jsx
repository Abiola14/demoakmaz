// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdDashboard, MdAccessTimeFilled, MdTrendingUp } from "react-icons/md";
import { FaCalendarDay, FaCalendarAlt, FaCalendarCheck } from "react-icons/fa";
import { FiShoppingCart, FiPackage } from "react-icons/fi";
import "./Dashboard.css";

const API_URL = "http://localhost:8000/api";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
});

const fmt = (n) => Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(0, i).toLocaleString("default", { month: "long" })
);

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];

export default function Dashboard() {
  const username = localStorage.getItem("username") || "User";
  const role = (localStorage.getItem("role") || "").toLowerCase();

  const [totals, setTotals] = useState({
    today: { amount: 0, transactions: 0 },
    month: { amount: 0, transactions: 0 },
    year: { amount: 0, transactions: 0 },
    total: { amount: 0, transactions: 0 },
  });
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [filter, setFilter] = useState({
    month: new Date().getMonth() + 1,
    year: currentYear,
  });

  useEffect(() => { fetchSales(); }, [filter]);

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_URL}/sales`, authHeaders());
      const sales = res.data.map((s) => ({
        Id: s.id,
        Product: s.product,
        CustomerName: s.customerName,
        Quantity: s.quantity,
        TotalPrice: s.totalPrice,
        PaymentStatus: s.paymentStatus,
        Sold_At: s.soldAt,
      }));

      setRecentSales(
        [...sales].sort((a, b) => new Date(b.Sold_At) - new Date(a.Sold_At)).slice(0, 6)
      );
      calculateTotals(sales);
      getTopProducts(sales);
    } catch (err) {
      console.error("Dashboard fetch error:", err.response?.data ?? err.message);
    }
  };

  const calculateTotals = (data) => {
    const today = new Date();
    let t = { amount: 0, transactions: 0 };
    let m = { amount: 0, transactions: 0 };
    let y = { amount: 0, transactions: 0 };
    let all = { amount: 0, transactions: 0 };

    data.forEach((sale) => {
      const d = new Date(sale.Sold_At);
      const amount = Number(sale.TotalPrice) || 0;

      if (d.toDateString() === today.toDateString()) {
        t.amount += amount; t.transactions++;
      }
      if (d.getMonth() + 1 === filter.month && d.getFullYear() === filter.year) {
        m.amount += amount; m.transactions++;
      }
      if (d.getFullYear() === filter.year) {
        y.amount += amount; y.transactions++;
      }
      all.amount += amount; all.transactions++;
    });

    setTotals({ today: t, month: m, year: y, total: all });
  };

  const getTopProducts = (data) => {
    const map = {};
    data.forEach((s) => {
      const p = s.Product || "Unknown";
      map[p] = (map[p] || 0) + (Number(s.TotalPrice) || 0);
    });
    setTopProducts(Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 5));
  };

  const maxTop = topProducts[0]?.[1] || 1;

  return (
    <div className="db-page">

      {/* ── Top bar ── */}
      <div className="db-topbar">
        <div>
          <h1 className="db-topbar__title">
            <MdDashboard size={26} /> Sales Dashboard
          </h1>
          <p className="db-topbar__sub">
            Welcome back, <strong>{username}</strong> · {role}
          </p>
        </div>

        {/* Filter */}
        <div className="db-filter">
          <select
            value={filter.month}
            onChange={(e) => setFilter((p) => ({ ...p, month: Number(e.target.value) }))}
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={filter.year}
            onChange={(e) => setFilter((p) => ({ ...p, year: Number(e.target.value) }))}
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="db-cards">
        <div className="db-card db-card--blue">
          <div className="db-card__icon"><FaCalendarDay size={20} /></div>
          <div className="db-card__body">
            <span className="db-card__label">Today</span>
            <span className="db-card__amount">₦{fmt(totals.today.amount)}</span>
            <span className="db-card__sub">{totals.today.transactions} sales</span>
          </div>
        </div>
        <div className="db-card db-card--green">
          <div className="db-card__icon"><FaCalendarAlt size={20} /></div>
          <div className="db-card__body">
            <span className="db-card__label">This Month</span>
            <span className="db-card__amount">₦{fmt(totals.month.amount)}</span>
            <span className="db-card__sub">{totals.month.transactions} sales</span>
          </div>
        </div>
        <div className="db-card db-card--teal">
          <div className="db-card__icon"><FaCalendarCheck size={20} /></div>
          <div className="db-card__body">
            <span className="db-card__label">This Year</span>
            <span className="db-card__amount">₦{fmt(totals.year.amount)}</span>
            <span className="db-card__sub">{totals.year.transactions} sales</span>
          </div>
        </div>
        <div className="db-card db-card--navy">
          <div className="db-card__icon"><MdAccessTimeFilled size={20} /></div>
          <div className="db-card__body">
            <span className="db-card__label">All Time</span>
            <span className="db-card__amount">₦{fmt(totals.total.amount)}</span>
            <span className="db-card__sub">{totals.total.transactions} total sales</span>
          </div>
        </div>
      </div>

      {/* ── Bottom panels ── */}
      <div className="db-panels">

        {/* Top Products */}
        <div className="db-panel">
          <div className="db-panel__header">
            <FiPackage size={17} />
            <span>Top Selling Products</span>
          </div>
          <div className="db-panel__body">
            {topProducts.length === 0 ? (
              <p className="db-empty">No sales data available</p>
            ) : (
              <div className="db-top-list">
                {topProducts.map(([product, amount], i) => (
                  <div key={i} className="db-top-item">
                    <div className="db-top-item__meta">
                      <span className="db-top-item__rank">{i + 1}</span>
                      <span className="db-top-item__name">{product}</span>
                      <span className="db-top-item__amount">₦{fmt(amount)}</span>
                    </div>
                    <div className="db-top-item__bar-bg">
                      <div
                        className="db-top-item__bar"
                        style={{ width: `${(amount / maxTop) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="db-panel">
          <div className="db-panel__header">
            <FiShoppingCart size={17} />
            <span>Recent Sales</span>
          </div>
          <div className="db-panel__body p-0">
            {recentSales.length === 0 ? (
              <p className="db-empty">No recent sales</p>
            ) : (
              <table className="db-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, i) => (
                    <tr key={sale.Id}>
                      <td className="db-table__sn">{i + 1}</td>
                      <td className="db-table__name">{sale.CustomerName}</td>
                      <td>{sale.Product}</td>
                      <td className="db-table__amount">₦{fmt(sale.TotalPrice)}</td>
                      <td>{new Date(sale.Sold_At).toLocaleDateString("en-GB")}</td>
                      <td>
                        <span className={`db-badge ${sale.PaymentStatus?.toLowerCase() === "paid" ? "db-badge--paid" : "db-badge--unpaid"}`}>
                          {sale.PaymentStatus || "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

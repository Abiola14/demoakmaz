// src/components/Bank.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { MdAccountBalance } from "react-icons/md";
import { FiPlus, FiX, FiCheckCircle, FiTrash2, FiDollarSign, FiCheckSquare, FiClock, FiSearch, FiCalendar, FiPrinter } from "react-icons/fi";
import "./Bank.css";

const API_URL = "http://localhost:8000/api";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
});

const fmt = (n) =>
  Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });

const fmtDate = (dateStr) => {
  if (!dateStr) return "-";
  return dateStr.split("T")[0].split("-").reverse().join("/");
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function Bank() {
  const role      = (localStorage.getItem("role") || "").toLowerCase();
  const username  = localStorage.getItem("username") || "";
  const isAdmin   = role === "admin";
  const isAuditor = role === "auditor";

  const [deposits, setDeposits]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [message, setMessage]       = useState(null);
  const [form, setForm]             = useState({
    amount: "", description: "", date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Search state ───────────────────────────────────────────────────
  const [search, setSearch]           = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay]     = useState("");
  const [filterYear, setFilterYear]   = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/bankdeposits`, authHeaders());
      setDeposits(res.data);
    } catch (err) {
      const msg = err.response?.status === 401
        ? "Session expired. Please log in again."
        : "Failed to load deposits.";
      setMessage({ text: msg, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeposits(); }, []);

  // ── Add deposit (Admin) ────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0)
      return setMessage({ text: "Enter a valid amount.", type: "danger" });
    if (!form.date)
      return setMessage({ text: "Please select a date.", type: "danger" });

    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/bankdeposits/add`,
        {
          amount,
          description: form.description.trim(),
          date: new Date(form.date).toISOString(),
          createdBy: username,
        },
        authHeaders()
      );
      setForm({ amount: "", description: "", date: new Date().toISOString().split("T")[0] });
      setMessage({ text: "Deposit recorded successfully!", type: "success" });
      fetchDeposits();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to add deposit.";
      setMessage({ text: typeof msg === "string" ? msg : "Failed to add deposit.", type: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirm deposit (Auditor) ──────────────────────────────────────
  const handleConfirm = async (id) => {
    if (!window.confirm("Confirm this deposit has been verified?")) return;
    try {
      await axios.put(
        `${API_URL}/bankdeposits/confirm/${id}`,
        { confirmedBy: username },
        authHeaders()
      );
      setMessage({ text: "Deposit confirmed successfully!", type: "success" });
      fetchDeposits();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to confirm deposit.";
      setMessage({ text: typeof msg === "string" ? msg : "Failed to confirm deposit.", type: "danger" });
    }
  };

  // ── Delete deposit (Admin, unconfirmed only) ───────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this deposit record?")) return;
    try {
      await axios.delete(`${API_URL}/bankdeposits/delete/${id}`, authHeaders());
      setMessage({ text: "Deposit deleted.", type: "success" });
      fetchDeposits();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to delete deposit.";
      setMessage({ text: typeof msg === "string" ? msg : "Failed to delete.", type: "danger" });
    }
  };

  // ── Print ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    const rows = filtered.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>&#8358;${fmt(d.amount)}</td>
        <td>${d.description || "-"}</td>
        <td>${fmtDate(d.date)}</td>
        <td>${d.createdBy || "-"}</td>
        <td>${d.isConfirmed ? "Confirmed" : "Pending"}</td>
        <td>${d.isConfirmed ? (d.confirmedBy || "-") : "-"}</td>
      </tr>
    `).join("");

    const totalFiltered = filtered.reduce((s, d) => s + (d.amount || 0), 0);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bank Deposits Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 32px; }
          h2 { font-size: 20px; margin-bottom: 4px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; }
          thead tr { background: #1e3a5f; color: #fff; }
          thead th { padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #2d4f7c; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          tbody td { padding: 9px 12px; border: 1px solid #e2e8f0; }
          tfoot tr { background: #f1f5f9; font-weight: 700; }
          tfoot td { padding: 10px 12px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <h2>Bank Deposits Report</h2>
        <p class="meta">Printed on ${new Date().toLocaleDateString("en-GB")} &nbsp;|&nbsp; ${filtered.length} record(s)</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Date</th>
              <th>Recorded By</th>
              <th>Status</th>
              <th>Confirmed By</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="1" style="text-align:right">Total (${filtered.length} records)</td>
              <td>&#8358;${fmt(totalFiltered)}</td>
              <td colspan="5"></td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  // ── Summary totals ─────────────────────────────────────────────────
  const totalDeposited = useMemo(() => deposits.reduce((s, d) => s + (d.amount || 0), 0), [deposits]);
  const totalConfirmed = useMemo(() => deposits.filter((d) => d.isConfirmed).reduce((s, d) => s + (d.amount || 0), 0), [deposits]);
  const totalPending   = useMemo(() => deposits.filter((d) => !d.isConfirmed).reduce((s, d) => s + (d.amount || 0), 0), [deposits]);

  // ── Filter & Search ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return deposits.filter((d) => {
      if (filterMonth || filterDay || filterYear) {
        const date = d.date ? new Date(d.date) : null;
        if (!date) return false;
        if (filterMonth && date.getMonth() + 1 !== parseInt(filterMonth)) return false;
        if (filterDay   && date.getDate()      !== parseInt(filterDay))   return false;
        if (filterYear  && date.getFullYear()  !== parseInt(filterYear))  return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          d.description?.toLowerCase().includes(q) ||
          d.createdBy?.toLowerCase().includes(q) ||
          d.amount?.toString().includes(q)
        );
      }
      return true;
    });
  }, [deposits, search, filterMonth, filterDay, filterYear]);

  // Year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="bk-page">

      {/* ── Header ── */}
      <div className="bk-header">
        <div className="bk-header__icon">
          <MdAccountBalance size={28} />
        </div>
        <div>
          <h1 className="bk-header__title">Bank Deposits</h1>
          <p className="bk-header__sub">
            {isAdmin   && "Record deposits for auditor verification"}
            {isAuditor && "Review and confirm bank deposits"}
          </p>
        </div>
      </div>

      {/* ── Alert ── */}
      {message && (
        <div className={`bk-alert bk-alert--${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><FiX size={15} /></button>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="bk-summary">
        <div className="bk-stat">
          <div className="bk-stat__icon bk-stat__icon--total"><FiDollarSign size={20} /></div>
          <div className="bk-stat__body">
            <span className="bk-stat__label">Total Deposited</span>
            <span className="bk-stat__value">₦{fmt(totalDeposited)}</span>
          </div>
        </div>
        <div className="bk-stat">
          <div className="bk-stat__icon bk-stat__icon--confirmed"><FiCheckSquare size={20} /></div>
          <div className="bk-stat__body">
            <span className="bk-stat__label">Confirmed</span>
            <span className="bk-stat__value">₦{fmt(totalConfirmed)}</span>
          </div>
        </div>
        <div className="bk-stat">
          <div className="bk-stat__icon bk-stat__icon--pending"><FiClock size={20} /></div>
          <div className="bk-stat__body">
            <span className="bk-stat__label">Pending</span>
            <span className="bk-stat__value">₦{fmt(totalPending)}</span>
          </div>
        </div>
      </div>

      {/* ── Auditor notice ── */}
      {isAuditor && (
        <div className="bk-notice">
          <FiCheckCircle size={15} />
          You are in <strong>Auditor Mode</strong> — you can confirm deposits but not add or delete them.
        </div>
      )}

      {/* ── Add Deposit Form (Admin only) ── */}
      {isAdmin && (
        <div className="bk-form-card">
          <div className="bk-form-card__header">
            <FiPlus size={16} /> Record New Deposit
          </div>
          <form onSubmit={handleAdd} className="bk-form">
            <div className="bk-form__fields">
              <div className="bk-field">
                <label>Amount (₦)</label>
                <input
                  type="number" step="0.01" min="0" placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required disabled={submitting}
                />
              </div>
              <div className="bk-field">
                <label>Date</label>
                <input
                  type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required disabled={submitting}
                />
              </div>
              <div className="bk-field">
                <label>Description / Reference</label>
                <input
                  type="text" placeholder="e.g. GTBank deposit, teller #12345"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="bk-form__footer">
              <button type="submit" className="bk-btn-submit" disabled={submitting}>
                {submitting ? (
                  <><span className="bk-spinner" /> Saving...</>
                ) : (
                  <><FiPlus size={15} /> Add Deposit</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search & Filter Bar ── */}
      <div className="bk-search-bar">
        <div className="bk-search-input">
          <FiSearch size={15} className="bk-search-icon" />
          <input
            type="text"
            placeholder="Search by description or recorded by or amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="bk-search-clear" onClick={() => setSearch("")}>
              <FiX size={13} />
            </button>
          )}
        </div>

        <div className="bk-date-filters">
          <FiCalendar size={15} style={{ color: "#64748b", flexShrink: 0 }} />
          <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">Year</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {(filterMonth || filterDay || filterYear) && (
            <button className="bk-search-clear" onClick={() => { setFilterMonth(""); setFilterDay(""); setFilterYear(""); }}>
              <FiX size={13} />
            </button>
          )}
        </div>

        {/* Print Button */}
        <button className="bk-print-btn" onClick={handlePrint} title="Print table">
          <FiPrinter size={15} /> Print
        </button>
      </div>

      {/* ── Deposits Table ── */}
      <div className="bk-table-card">
        <div className="bk-table-wrap">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: 15 }}>
              Loading deposits...
            </div>
          ) : (
            <table className="bk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Recorded By</th>
                  <th>Status</th>
                  <th>Confirmed By</th>
                  {(isAdmin || isAuditor) && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin || isAuditor ? 8 : 7} className="bk-table__empty">
                      No deposit records found
                    </td>
                  </tr>
                ) : (
                  filtered.map((d, i) => (
                    <tr key={d.id}>
                      <td className="bk-table__sn">{i + 1}</td>
                      <td className="bk-table__amount">₦{fmt(d.amount)}</td>
                      <td className="bk-table__desc">{d.description || "-"}</td>
                      <td>{fmtDate(d.date)}</td>
                      <td className="bk-table__name">{d.createdBy || "-"}</td>
                      <td>
                        <span className={`bk-badge ${d.isConfirmed ? "bk-badge--confirmed" : "bk-badge--pending"}`}>
                          <span className="bk-badge__dot" />
                          {d.isConfirmed ? "Confirmed" : "Pending"}
                        </span>
                      </td>
                      <td>
                        {d.isConfirmed ? (
                          <span className="bk-confirmed-by">
                            {d.confirmedBy}
                            {d.confirmedAt && <small>{fmtDate(d.confirmedAt)}</small>}
                          </span>
                        ) : "-"}
                      </td>
                      {(isAdmin || isAuditor) && (
                        <td>
                          {isAuditor && !d.isConfirmed && (
                            <button className="bk-confirm-btn" onClick={() => handleConfirm(d.id)}>
                              <FiCheckCircle size={13} /> Confirm
                            </button>
                          )}
                          {isAuditor && d.isConfirmed && (
                            <span className="bk-confirmed-text">✓ Verified</span>
                          )}
                          {isAdmin && !d.isConfirmed && (
                            <button className="bk-delete-btn" onClick={() => handleDelete(d.id)}>
                              <FiTrash2 size={13} /> Delete
                            </button>
                          )}
                          {isAdmin && d.isConfirmed && (
                            <span className="bk-confirmed-text">✓ Verified</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer total */}
        <div className="bk-table-footer">
          <span>Total ({filtered.length} records)</span>
          <span className="bk-table-footer__amount">
            ₦{fmt(filtered.reduce((s, d) => s + (d.amount || 0), 0))}
          </span>
        </div>
      </div>

    </div>
  );
}
// src/components/Expenditures.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { MdReceiptLong } from "react-icons/md";
import {
  FiPlus, FiX, FiCheckCircle, FiDollarSign, FiCheckSquare,
  FiClock, FiAlertTriangle, FiSearch, FiEdit2, FiCalendar, FiPrinter
} from "react-icons/fi";
import { TbCurrencyNaira } from "react-icons/tb";
import "./Expenditure.css";

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

const EXPENDITURE_TYPES = [
  "Diesel",
  "Phcn",
  "Generator Servicing",
  "Cold Room Repair",
  "Miscellaneous",
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function Expenditure() {
  const role      = (localStorage.getItem("role") || "").toLowerCase();
  const username  = localStorage.getItem("username") || "";
  const isAdmin   = role === "admin";
  const isAuditor = role === "auditor";

  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [message, setMessage]           = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  const [form, setForm] = useState({
    type: "", amount: "", description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [search, setSearch]           = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay]     = useState("");
  const [filterYear, setFilterYear]   = useState("");

  const [ackModal, setAckModal]           = useState(null);
  const [ackForm, setAckForm]             = useState({ status: "Approved", notes: "" });
  const [ackSubmitting, setAckSubmitting] = useState(false);

  const [editModal, setEditModal]           = useState(null);
  const [editForm, setEditForm]             = useState({ type: "", amount: "", description: "", date: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchExpenditures = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/expenditures`, authHeaders());
      const normalized = res.data.map((e) => ({
        id:                   e.id ?? e.Id,
        type:                 e.type ?? e.Type,
        amount:               e.amount ?? e.Amount,
        description:          e.description ?? e.Description,
        date:                 e.date ?? e.Date,
        createdBy:            e.createdBy ?? e.CreatedBy,
        createdAt:            e.createdAt ?? e.CreatedAt,
        isAcknowledged:       e.isAcknowledged ?? false,
        acknowledgedBy:       e.acknowledgedBy ?? e.AcknowledgedBy,
        acknowledgedAt:       e.acknowledgedAt ?? e.AcknowledgedAt,
        acknowledgmentStatus: e.acknowledgmentStatus ?? e.AcknowledgmentStatus ?? null,
        acknowledgmentNotes:  e.notes ?? e.Notes ?? e.acknowledgmentNotes ?? null,
      }));
      setExpenditures(normalized);
    } catch (err) {
      const msg = err.response?.status === 401
        ? "Session expired. Please log in again."
        : "Failed to load expenditures.";
      setMessage({ text: msg, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenditures(); }, []);

  // ── Add ────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.type)             return setMessage({ text: "Please select a type.", type: "danger" });
    if (!amount || amount <= 0) return setMessage({ text: "Enter a valid amount.", type: "danger" });
    if (!form.date)             return setMessage({ text: "Please select a date.", type: "danger" });

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/expenditures/add`, {
        type: form.type, amount,
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        createdBy: username,
      }, authHeaders());
      setForm({ type: "", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
      setMessage({ text: "Expenditure recorded successfully!", type: "success" });
      fetchExpenditures();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to add expenditure.";
      setMessage({ text: typeof msg === "string" ? msg : "Failed to add expenditure.", type: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Acknowledge ────────────────────────────────────────────────────
  // Show Acknowledge button when isAcknowledged is false:
  //   - Brand new items (never reviewed)
  //   - Flagged items the admin has edited and resubmitted
  //     (backend deletes ack on edit, so isAcknowledged becomes false again)
  const canAuditorAcknowledge = (exp) => !exp.isAcknowledged;

  const openAckModal = (exp) => {
    setAckModal(exp);
    setAckForm({ status: "Approved", notes: "" });
  };

  const handleAcknowledge = async () => {
    if (!ackModal) return;
    setAckSubmitting(true);
    try {
      await axios.put(
        `${API_URL}/expenditures/acknowledge/${ackModal.id}`,
        { auditorName: username, status: ackForm.status, notes: ackForm.notes.trim() },
        authHeaders()
      );
      setAckModal(null);
      setMessage({ text: "Expenditure acknowledged successfully!", type: "success" });
      fetchExpenditures();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to acknowledge.";
      setMessage({ text: typeof msg === "string" ? msg : "Failed to acknowledge.", type: "danger" });
    } finally {
      setAckSubmitting(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────
  const openEditModal = (exp) => {
    setEditModal(exp);
    setEditForm({
      type:        exp.type,
      amount:      exp.amount,
      description: exp.description || "",
      date:        exp.date ? exp.date.split("T")[0] : "",
    });
  };

  const handleEdit = async () => {
    if (!editModal) return;
    const amount = parseFloat(editForm.amount);
    if (!editForm.type)          return setMessage({ text: "Please select a type.", type: "danger" });
    if (!amount || amount <= 0)  return setMessage({ text: "Enter a valid amount.", type: "danger" });

    setEditSubmitting(true);
    try {
      await axios.put(`${API_URL}/expenditures/edit/${editModal.id}`, {
        type:        editForm.type,
        amount,
        description: editForm.description.trim(),
        date:        new Date(editForm.date).toISOString(),
      }, authHeaders());
      setEditModal(null);
      setMessage({ text: "Expenditure resubmitted! Auditor will re-review.", type: "success" });
      fetchExpenditures();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to update.";
      setMessage({ text: typeof msg === "string" ? msg : "Failed to update.", type: "danger" });
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Print ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    const getStatusLabel = (exp) => {
      if (!exp.isAcknowledged)                    return "Pending";
      if (exp.acknowledgmentStatus === "Flagged") return "Not Approved";
      return exp.acknowledgmentStatus || "Reviewed";
    };

    const rows = filtered.map((exp, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${fmtDate(exp.date)}</td>
        <td>${exp.type || "-"}</td>
        <td>${exp.description || "-"}</td>
        <td>&#8358;${fmt(exp.amount)}</td>
        <td>${exp.createdBy || "-"}</td>
        <td>${getStatusLabel(exp)}</td>
        <td>${exp.isAcknowledged ? (exp.acknowledgedBy || "Auditor") : "-"}</td>
      </tr>
    `).join("");

    const totalFiltered = filtered.reduce((s, e) => s + (e.amount || 0), 0);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expenditures Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 32px; }
          h2 { font-size: 20px; margin-bottom: 4px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; }
          thead tr { background: #1e3a5f; color: #fff; }
          thead th { padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #2d4f7c; }
          tbody tr { border-bottom: 1px solid #e2e8f0; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          tbody td { padding: 9px 12px; border: 1px solid #e2e8f0; }
          tfoot tr { background: #f1f5f9; font-weight: 700; }
          tfoot td { padding: 10px 12px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8; }
          @media print {
            body { padding: 16px; }
          }
        </style>
      </head>
      <body>
        <h2>Expenditures Report</h2>
        <p class="meta">Printed on ${new Date().toLocaleDateString("en-GB")} &nbsp;|&nbsp; ${filtered.length} record(s)</p>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Date</th><th>Type</th><th>Description</th>
              <th>Amount</th><th>Recorded By</th><th>Status</th><th>Acknowledged By</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align:right; padding-right:16px;">Total (${filtered.length} records)</td>
              <td>&#8358;${fmt(totalFiltered)}</td>
              <td colspan="3"></td>
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

  // ── Totals ─────────────────────────────────────────────────────────
  const totalAmount       = useMemo(() => expenditures.reduce((s, e) => s + (e.amount || 0), 0), [expenditures]);
  const totalAcknowledged = useMemo(() => expenditures.filter((e) => e.acknowledgmentStatus === "Approved").reduce((s, e) => s + (e.amount || 0), 0), [expenditures]);
  const totalPending      = useMemo(() => expenditures.filter((e) => !e.isAcknowledged).reduce((s, e) => s + (e.amount || 0), 0), [expenditures]);

  // ── Filter ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return expenditures.filter((exp) => {
      if (filterMonth || filterDay || filterYear) {
        const d = exp.date ? new Date(exp.date) : null;
        if (!d) return false;
        if (filterMonth && d.getMonth() + 1 !== parseInt(filterMonth)) return false;
        if (filterDay   && d.getDate()      !== parseInt(filterDay))   return false;
        if (filterYear  && d.getFullYear()  !== parseInt(filterYear))  return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          exp.type?.toLowerCase().includes(q) ||
          exp.description?.toLowerCase().includes(q) ||
          exp.createdBy?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenditures, search, filterMonth, filterDay, filterYear]);

  // ── Status helpers ─────────────────────────────────────────────────
  const statusBadgeClass = (exp) => {
    if (!exp.isAcknowledged)                     return "ex-badge--pending";
    if (exp.acknowledgmentStatus === "Approved") return "ex-badge--approved";
    if (exp.acknowledgmentStatus === "Flagged")  return "ex-badge--flagged";
    return "ex-badge--reviewed";
  };

  const statusLabel = (exp) => {
    if (!exp.isAcknowledged)                    return "Pending";
    if (exp.acknowledgmentStatus === "Flagged") return "Not Approved";
    return exp.acknowledgmentStatus || "Reviewed";
  };

  // ── Admin action cell ──────────────────────────────────────────────
  const adminAction = (exp) => {
    if (exp.acknowledgmentStatus === "Flagged") {
      return (
        <button className="ex-edit-btn" onClick={() => openEditModal(exp)}>
          <FiEdit2 size={13} /> Edit
        </button>
      );
    }
    if (!exp.isAcknowledged) {
      return <span className="ex-awaiting-text">Awaiting review</span>;
    }
    if (exp.acknowledgmentStatus === "Approved") {
      return <span className="ex-acknowledged-text">✓ Verified</span>;
    }
    return null;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="ex-page">

      {/* Header */}
      <div className="ex-header">
        <div className="ex-header__icon"><MdReceiptLong size={28} /></div>
        <div>
          <h1 className="ex-header__title">Expenditures</h1>
          <p className="ex-header__sub">
            {isAdmin   && "Record and manage expenditure entries"}
            {isAuditor && "Review and acknowledge expenditure records"}
          </p>
        </div>
      </div>

      {/* Alert */}
      {message && (
        <div className={`ex-alert ex-alert--${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><FiX size={15} /></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="ex-summary">
        <div className="ex-stat">
          <div className="ex-stat__icon ex-stat__icon--total"><TbCurrencyNaira size={20} /></div>
          <div className="ex-stat__body">
            <span className="ex-stat__label">Total Expenditure</span>
            <span className="ex-stat__value">₦{fmt(totalAmount)}</span>
          </div>
        </div>
        <div className="ex-stat">
          <div className="ex-stat__icon ex-stat__icon--acknowledged"><FiCheckSquare size={20} /></div>
          <div className="ex-stat__body">
            <span className="ex-stat__label">Approved</span>
            <span className="ex-stat__value">₦{fmt(totalAcknowledged)}</span>
          </div>
        </div>
        <div className="ex-stat">
          <div className="ex-stat__icon ex-stat__icon--pending"><FiClock size={20} /></div>
          <div className="ex-stat__body">
            <span className="ex-stat__label">Pending Review</span>
            <span className="ex-stat__value">₦{fmt(totalPending)}</span>
          </div>
        </div>
      </div>

      {/* Auditor notice */}
      {isAuditor && (
        <div className="ex-notice">
          <FiCheckCircle size={15} />
          You are in <strong>Auditor Mode</strong> — you can acknowledge expenditures but not add or edit them.
        </div>
      )}

      {/* Add Form (Admin only) */}
      {isAdmin && (
        <div className="ex-form-card">
          <div className="ex-form-card__header">
            <FiPlus size={16} /> Record New Expenditure
          </div>
          <form onSubmit={handleAdd} className="ex-form">
            <div className="ex-form__fields">
              <div className="ex-field">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required disabled={submitting}>
                  <option value="">Select type...</option>
                  {EXPENDITURE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="ex-field">
                <label>Amount (₦)</label>
                <input type="number" step="0.01" min="0" placeholder="0.00"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required disabled={submitting} />
              </div>
              <div className="ex-field">
                <label>Date</label>
                <input type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required disabled={submitting} />
              </div>
              <div className="ex-field ex-field--wide">
                <label>Description</label>
                <input type="text" placeholder="e.g. Fuel purchase, monthly PHCN bill..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={submitting} />
              </div>
            </div>
            <div className="ex-form__footer">
              <button type="submit" className="ex-btn-submit" disabled={submitting}>
                {submitting ? <><span className="ex-spinner" /> Saving...</> : <><FiPlus size={15} /> Add Expenditure</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="ex-search-bar">
        <div className="ex-search-input">
          <FiSearch size={15} className="ex-search-icon" />
          <input type="text" placeholder="Search by type, description, recorded by..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="ex-search-clear" onClick={() => setSearch("")}><FiX size={13} /></button>}
        </div>
        <div className="ex-date-filters">
          <FiCalendar size={15} style={{ color: "#64748b", flexShrink: 0 }} />
          <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
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
            <button className="ex-search-clear" onClick={() => { setFilterMonth(""); setFilterDay(""); setFilterYear(""); }}>
              <FiX size={13} />
            </button>
          )}
        </div>

        {/* Print Button */}
        <button className="ex-print-btn" onClick={handlePrint} title="Print table">
          <FiPrinter size={15} /> Print
        </button>
      </div>

      {/* Table */}
      <div className="ex-table-card table-border">
        <div className="ex-table-wrap">
          {loading ? (
            <div className="ex-table__loading">Loading expenditures...</div>
          ) : (
            <table className="ex-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Recorded By</th>
                  <th>Status</th>
                  <th>Acknowledged By</th>
                  {(isAdmin || isAuditor) && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin || isAuditor ? 9 : 8} className="ex-table__empty">
                      No expenditure records found
                    </td>
                  </tr>
                ) : (
                  filtered.map((exp, i) => (
                    <tr key={exp.id}>
                      <td className="ex-table__sn">{i + 1}</td>
                      <td>{fmtDate(exp.date)}</td>
                      <td><span className="ex-type-tag">{exp.type}</span></td>
                      <td className="ex-table__desc">{exp.description || "-"}</td>
                      <td className="ex-table__amount">₦{fmt(exp.amount)}</td>
                      <td className="ex-table__name">{exp.createdBy || "-"}</td>
                      <td>
                        <span className={`ex-badge ${statusBadgeClass(exp)}`}>
                          <span className="ex-badge__dot" />
                          {statusLabel(exp)}
                        </span>
                      </td>
                      <td>
                        {exp.isAcknowledged ? (
                          <span className="ex-acknowledged-by">
                            {exp.acknowledgedBy || "Auditor"}
                            {exp.acknowledgedAt && <small>{fmtDate(exp.acknowledgedAt)}</small>}
                          </span>
                        ) : "-"}
                      </td>
                      {(isAdmin || isAuditor) && (
                        <td>
                          {/* ── Auditor ── */}
                          {isAuditor && (
                            <>
                              {/* Pending or resubmitted after flag → show Acknowledge */}
                              {canAuditorAcknowledge(exp) && (
                                <button className="ex-ack-btn" onClick={() => openAckModal(exp)}>
                                  <FiCheckCircle size={13} /> Acknowledge
                                </button>
                              )}
                              {/* Approved → done */}
                              {exp.isAcknowledged && exp.acknowledgmentStatus === "Approved" && (
                                <span className="ex-acknowledged-text">✓ Done</span>
                              )}
                              {/* Flagged, not yet resubmitted → waiting on admin */}
                              {exp.isAcknowledged && exp.acknowledgmentStatus === "Flagged" && (
                                <span className="ex-acknowledged-text ex-acknowledged-text--flagged">
                                  ✗ Not Approved — awaiting admin
                                </span>
                              )}
                            </>
                          )}

                          {/* ── Admin ── */}
                          {isAdmin && adminAction(exp)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="ex-table-footer">
          <span>Total ({filtered.length} records)</span>
          <span className="ex-table-footer__amount">
            ₦{fmt(filtered.reduce((s, e) => s + (e.amount || 0), 0))}
          </span>
        </div>
      </div>

      {/* Acknowledge Modal */}
      {ackModal && (
        <div className="ex-modal-bg" onClick={() => setAckModal(null)}>
          <div className="ex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ex-modal__header">
              <h3>Acknowledge Expenditure</h3>
              <button className="ex-modal__close" onClick={() => setAckModal(null)}><FiX size={18} /></button>
            </div>
            <div className="ex-modal__summary">
              <div className="ex-modal__row"><span>Type</span><span className="ex-type-tag">{ackModal.type}</span></div>
              <div className="ex-modal__row"><span>Amount</span><strong>₦{fmt(ackModal.amount)}</strong></div>
              <div className="ex-modal__row"><span>Date</span><span>{fmtDate(ackModal.date)}</span></div>
              {ackModal.description && (
                <div className="ex-modal__row"><span>Description</span><span>{ackModal.description}</span></div>
              )}
            </div>
            <div className="ex-modal__body">
              <div className="ex-field">
                <label>Decision</label>
                <select value={ackForm.status} onChange={(e) => setAckForm({ ...ackForm, status: e.target.value })} disabled={ackSubmitting}>
                  <option value="Approved">Approved — verified and correct</option>
                  <option value="Flagged">Not Approved — requires correction</option>
                </select>
              </div>
              {ackForm.status === "Flagged" && (
                <div className="ex-modal__flag-notice">
                  <FiAlertTriangle size={14} />
                  Please add a note explaining why this is not approved.
                </div>
              )}
              <div className="ex-field">
                <label>Notes <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span></label>
                <textarea rows={3} placeholder="Any observations or comments..."
                  value={ackForm.notes} onChange={(e) => setAckForm({ ...ackForm, notes: e.target.value })}
                  disabled={ackSubmitting} />
              </div>
            </div>
            <div className="ex-modal__footer">
              <button className="ex-btn-cancel" onClick={() => setAckModal(null)} disabled={ackSubmitting}>Cancel</button>
              <button className="ex-btn-submit" onClick={handleAcknowledge} disabled={ackSubmitting}>
                {ackSubmitting ? <><span className="ex-spinner" /> Submitting...</> : <><FiCheckCircle size={15} /> Submit</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="ex-modal-bg" onClick={() => setEditModal(null)}>
          <div className="ex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ex-modal__header">
              <h3>Edit Expenditure</h3>
              <button className="ex-modal__close" onClick={() => setEditModal(null)}><FiX size={18} /></button>
            </div>
            <div className="ex-modal__flag-notice" style={{ margin: "0 20px 0" }}>
              <FiAlertTriangle size={14} />
              This expenditure was not approved. Edit and resubmit for auditor review.
            </div>
            {editModal.acknowledgmentNotes && (
              <div className="ex-modal__auditor-note">
                <span>Auditor note:</span> {editModal.acknowledgmentNotes}
              </div>
            )}
            <div className="ex-modal__body">
              <div className="ex-field">
                <label>Type</label>
                <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} disabled={editSubmitting}>
                  <option value="">Select type...</option>
                  {EXPENDITURE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="ex-field">
                <label>Amount (₦)</label>
                <input type="number" step="0.01" min="0"
                  value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  disabled={editSubmitting} />
              </div>
              <div className="ex-field">
                <label>Date</label>
                <input type="date" value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  disabled={editSubmitting} />
              </div>
              <div className="ex-field">
                <label>Description</label>
                <input type="text" placeholder="Description..."
                  value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={editSubmitting} />
              </div>
            </div>
            <div className="ex-modal__footer">
              <button className="ex-btn-cancel" onClick={() => setEditModal(null)} disabled={editSubmitting}>Cancel</button>
              <button className="ex-btn-submit" onClick={handleEdit} disabled={editSubmitting}>
                {editSubmitting ? <><span className="ex-spinner" /> Saving...</> : <><FiEdit2 size={15} /> Resubmit for Review</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
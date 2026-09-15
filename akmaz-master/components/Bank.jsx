// src/components/Bank.jsx

import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import axios from "axios";

import { MdAccountBalance } from "react-icons/md";

import {
  FiPlus,
  FiX,
  FiCheckCircle,
  FiTrash2,
  FiDollarSign,
  FiCheckSquare,
  FiClock,
  FiSearch,
  FiCalendar,
  FiPrinter,
  FiEdit2,
} from "react-icons/fi";

import "./Bank.css";

const API_URL = "http://localhost:8000/api";

// ============================================================
// AUTH HEADERS
// ============================================================

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${
      localStorage.getItem("token") || ""
    }`,
  },
});

// ============================================================
// NUMBER FORMAT
// ============================================================

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ============================================================
// DATE FORMAT
// ============================================================

const fmtDate = (dateStr) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB");
};

// ============================================================
// MONTHS
// ============================================================

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Bank() {
  // ============================================================
  // USER / ROLE
  // ============================================================

  const role = (
    localStorage.getItem("role") || ""
  ).toLowerCase();

  const username =
    localStorage.getItem("username") || "";

  const isAdmin = role === "admin";
  const isAuditor = role === "auditor";
  const isSuperAdmin = role === "superadmin";
  const canManage = isAdmin || isSuperAdmin;

  // ============================================================
  // STATE
  // ============================================================

  const [deposits, setDeposits] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState(null);

  const [form, setForm] = useState({
    amount: "",
    description: "",
    date: new Date()
      .toISOString()
      .split("T")[0],
  });

  const [submitting, setSubmitting] =
    useState(false);

  // ============================================================
  // SEARCH / FILTER
  // ============================================================

  const [search, setSearch] =
    useState("");

  const [filterMonth, setFilterMonth] =
    useState("");

  const [filterDay, setFilterDay] =
    useState("");

  const [filterYear, setFilterYear] =
    useState("");

  // ============================================================
  // SUPER ADMIN EDIT STATE
  // ============================================================

  const [editingDeposit, setEditingDeposit] =
    useState(null);

  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    date: "",
  });

  const [editSubmitting, setEditSubmitting] =
    useState(false);

  // ============================================================
  // FETCH DEPOSITS
  // ============================================================

  const fetchDeposits = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${API_URL}/bankdeposits`,
        authHeaders()
      );

      setDeposits(res.data);
    } catch (err) {
      console.error(
        "fetchDeposits:",
        err.response?.data ||
          err.message
      );

      const msg =
        err.response?.status === 401
          ? "Session expired. Please log in again."
          : "Failed to load deposits.";

      setMessage({
        text: msg,
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // ============================================================
  // ADD DEPOSIT - ADMIN
  // ============================================================

  const handleAdd = async (e) => {
    e.preventDefault();

    const amount =
      parseFloat(form.amount);

    if (!amount || amount <= 0) {
      setMessage({
        text: "Enter a valid amount.",
        type: "danger",
      });

      return;
    }

    if (!form.date) {
      setMessage({
        text: "Please select a date.",
        type: "danger",
      });

      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${API_URL}/bankdeposits/add`,
        {
          amount,

          description:
            form.description.trim(),

          date: new Date(
            form.date
          ).toISOString(),

          createdBy: username,
        },
        authHeaders()
      );

      setForm({
        amount: "",
        description: "",
        date: new Date()
          .toISOString()
          .split("T")[0],
      });

      setMessage({
        text:
          "Deposit recorded successfully!",
        type: "success",
      });

      await fetchDeposits();
    } catch (err) {
      console.error(
        "handleAdd:",
        err.response?.data ||
          err.message
      );

      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to add deposit.";

      setMessage({
        text:
          typeof msg === "string"
            ? msg
            : "Failed to add deposit.",
        type: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // CONFIRM DEPOSIT - AUDITOR
  // ============================================================

  const handleConfirm = async (
    id
  ) => {
    if (
      !window.confirm(
        "Confirm this deposit has been verified?"
      )
    ) {
      return;
    }

    try {
      await axios.put(
        `${API_URL}/bankdeposits/confirm/${id}`,
        {
          confirmedBy: username,
        },
        authHeaders()
      );

      setMessage({
        text:
          "Deposit confirmed successfully!",
        type: "success",
      });

      await fetchDeposits();
    } catch (err) {
      console.error(
        "handleConfirm:",
        err.response?.data ||
          err.message
      );

      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to confirm deposit.";

      setMessage({
        text:
          typeof msg === "string"
            ? msg
            : "Failed to confirm deposit.",
        type: "danger",
      });
    }
  };

  // ============================================================
  // DELETE DEPOSIT - ADMIN
  // ============================================================

  const handleDelete = async (
    id
  ) => {
    if (
      !window.confirm(
        "Delete this deposit record?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/bankdeposits/delete/${id}`,
        authHeaders()
      );

      setMessage({
        text: "Deposit deleted.",
        type: "success",
      });

      await fetchDeposits();
    } catch (err) {
      console.error(
        "handleDelete:",
        err.response?.data ||
          err.message
      );

      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to delete deposit.";

      setMessage({
        text:
          typeof msg === "string"
            ? msg
            : "Failed to delete.",
        type: "danger",
      });
    }
  };

  // ============================================================
  // SUPER ADMIN EDIT DEPOSIT
  // ============================================================

  const openEdit = (deposit) => {
    const dateValue = deposit.date
      ? new Date(deposit.date)
          .toISOString()
          .split("T")[0]
      : "";

    setEditingDeposit(deposit);

    setEditForm({
      amount: deposit.amount ?? "",
      description: deposit.description ?? "",
      date: dateValue,
    });
  };

  const closeEdit = () => {
    if (editSubmitting) return;

    setEditingDeposit(null);

    setEditForm({
      amount: "",
      description: "",
      date: "",
    });
  };

  const handleSuperAdminEdit = async (e) => {
    e.preventDefault();

    if (!editingDeposit) return;

    const amount = parseFloat(editForm.amount);

    if (!amount || amount <= 0) {
      setMessage({
        text: "Enter a valid amount.",
        type: "danger",
      });
      return;
    }

    if (!editForm.date) {
      setMessage({
        text: "Please select a date.",
        type: "danger",
      });
      return;
    }

    setEditSubmitting(true);

    try {
      await axios.put(
        `${API_URL}/bankdeposits/superadmin-edit/${editingDeposit.id}`,
        {
          amount,
          description: editForm.description.trim(),
          date: new Date(editForm.date).toISOString(),
        },
        authHeaders()
      );

      setMessage({
        text: "Deposit updated successfully!",
        type: "success",
      });

      closeEdit();
      await fetchDeposits();
    } catch (err) {
      console.error(
        "handleSuperAdminEdit:",
        err.response?.data || err.message
      );

      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to update deposit.";

      setMessage({
        text:
          typeof msg === "string"
            ? msg
            : "Failed to update deposit.",
        type: "danger",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  // ============================================================
  // SUPER ADMIN DELETE DEPOSIT
  // ============================================================

  const handleSuperAdminDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this deposit record permanently? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/bankdeposits/superadmin-delete/${id}`,
        authHeaders()
      );

      setMessage({
        text: "Deposit deleted successfully.",
        type: "success",
      });

      await fetchDeposits();
    } catch (err) {
      console.error(
        "handleSuperAdminDelete:",
        err.response?.data || err.message
      );

      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to delete deposit.";

      setMessage({
        text:
          typeof msg === "string"
            ? msg
            : "Failed to delete deposit.",
        type: "danger",
      });
    }
  };

  // ============================================================
  // FILTERED DEPOSITS
  // ============================================================

  const filtered = useMemo(() => {
    return deposits.filter((d) => {
      // --------------------------------------------------------
      // DATE FILTER
      // --------------------------------------------------------

      if (
        filterMonth ||
        filterDay ||
        filterYear
      ) {
        const date = d.date
          ? new Date(d.date)
          : null;

        if (
          !date ||
          isNaN(date.getTime())
        ) {
          return false;
        }

        if (
          filterMonth &&
          date.getMonth() + 1 !==
            parseInt(
              filterMonth,
              10
            )
        ) {
          return false;
        }

        if (
          filterDay &&
          date.getDate() !==
            parseInt(
              filterDay,
              10
            )
        ) {
          return false;
        }

        if (
          filterYear &&
          date.getFullYear() !==
            parseInt(
              filterYear,
              10
            )
        ) {
          return false;
        }
      }

      // --------------------------------------------------------
      // SEARCH
      // --------------------------------------------------------

      if (search.trim()) {
        const q =
          search.toLowerCase();

        return (
          d.description
            ?.toLowerCase()
            .includes(q) ||

          d.createdBy
            ?.toLowerCase()
            .includes(q) ||

          d.amount
            ?.toString()
            .includes(q)
        );
      }

      return true;
    });
  }, [
    deposits,
    search,
    filterMonth,
    filterDay,
    filterYear,
  ]);

  // ============================================================
  // YEAR OPTIONS
  // ============================================================

  const currentYear =
    new Date().getFullYear();

  const years = Array.from(
    { length: 5 },
    (_, i) =>
      currentYear - i
  );

  // ============================================================
  // SUMMARY TOTALS
  // ============================================================

  const totalDeposited = useMemo(
    () =>
      deposits.reduce(
        (sum, d) =>
          sum +
          Number(d.amount || 0),
        0
      ),
    [deposits]
  );

  const totalConfirmed = useMemo(
    () =>
      deposits
        .filter(
          (d) => d.isConfirmed
        )
        .reduce(
          (sum, d) =>
            sum +
            Number(d.amount || 0),
          0
        ),
    [deposits]
  );

  const totalPending = useMemo(
    () =>
      deposits
        .filter(
          (d) => !d.isConfirmed
        )
        .reduce(
          (sum, d) =>
            sum +
            Number(d.amount || 0),
          0
        ),
    [deposits]
  );

  // ============================================================
  // PRINT
  //
  // PRINTED REPORT EXCLUDES:
  // - Recorded By
  // - Confirmed By
  //
  // These remain visible on the normal page.
  // ============================================================

  const handlePrint = () => {
    const rows = filtered
      .map(
        (d, i) => `
          <tr>

            <td>
              ${i + 1}
            </td>

            <td>
              &#8358;${fmt(d.amount)}
            </td>

            <td>
              ${d.description || "-"}
            </td>

            <td>
              ${fmtDate(d.date)}
            </td>

            <td>
              ${
                d.isConfirmed
                  ? "Confirmed"
                  : "Pending"
              }
            </td>

          </tr>
        `
      )
      .join("");

    const totalFiltered =
      filtered.reduce(
        (sum, d) =>
          sum +
          Number(d.amount || 0),
        0
      );

    const filterNote = [
      search &&
        `Search: "${search}"`,

      filterDay &&
        `Day: ${filterDay}`,

      filterMonth &&
        `Month: ${
          MONTHS[
            parseInt(
              filterMonth,
              10
            ) - 1
          ]
        }`,

      filterYear &&
        `Year: ${filterYear}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const printWindow =
      window.open(
        "",
        "_blank"
      );

    if (!printWindow) {
      setMessage({
        text:
          "Please allow pop-ups to print the report.",
        type: "danger",
      });

      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

      <head>

        <title>
          Bank Deposits Report
        </title>

        <style>

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #1e293b;
            padding: 32px;
          }

          h2 {
            font-size: 20px;
            margin-bottom: 4px;
          }

          .meta {
            color: #64748b;
            font-size: 12px;
            margin-bottom: 24px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
          }

          thead tr {
            background: #1e3a5f;
            color: #ffffff;
          }

          thead th {
            padding: 10px 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #2d4f7c;
          }

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          tbody td {
            padding: 9px 12px;
            border: 1px solid #e2e8f0;
          }

          tfoot tr {
            background: #f1f5f9;
            font-weight: 700;
          }

          tfoot td {
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-top: 2px solid #94a3b8;
          }

          @media print {

            body {
              padding: 16px;
            }

          }

        </style>

      </head>

      <body>

        <h2>
          Bank Deposits Report
        </h2>

        <p class="meta">

          Printed on
          ${new Date().toLocaleDateString(
            "en-GB"
          )}

          &nbsp;|&nbsp;

          ${filtered.length}
          record(s)

          ${
            filterNote
              ? `&nbsp;|&nbsp; ${filterNote}`
              : ""
          }

        </p>

        <table>

          <thead>

            <tr>

              <th>
                #
              </th>

              <th>
                Amount
              </th>

              <th>
                Description
              </th>

              <th>
                Date
              </th>

              <th>
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            ${rows}

          </tbody>

          <tfoot>

            <tr>

              <td
                colspan="1"
                style="
                  text-align: right;
                  padding-right: 12px;
                "
              >
                Total
                (${filtered.length} records)
              </td>

              <td>
                &#8358;${fmt(
                  totalFiltered
                )}
              </td>

              <td
                colspan="3"
              ></td>

            </tr>

          </tfoot>

        </table>

      </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="bk-page">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="bk-header">

        <div className="bk-header__icon">

          <MdAccountBalance
            size={28}
          />

        </div>

        <div>

          <h1 className="bk-header__title">
            Bank Deposits
          </h1>

          <p className="bk-header__sub">

            {isAdmin &&
              "Record deposits for auditor verification"}

            {isAuditor &&
              "Review and confirm bank deposits"}

            {isSuperAdmin &&
              "Manage and correct bank deposit records"}

          </p>

        </div>

      </div>

      {/* ========================================================
          ALERT
      ======================================================== */}

      {message && (
        <div
          className={`bk-alert bk-alert--${message.type}`}
        >

          <span>
            {message.text}
          </span>

          <button
            onClick={() =>
              setMessage(null)
            }
          >

            <FiX size={15} />

          </button>

        </div>
      )}

      {/* ========================================================
          SUMMARY CARDS
      ======================================================== */}

      <div className="bk-summary">

        {/* TOTAL */}

        <div className="bk-stat">

          <div className="bk-stat__icon bk-stat__icon--total">

            <FiDollarSign
              size={20}
            />

          </div>

          <div className="bk-stat__body">

            <span className="bk-stat__label">
              Total Deposited
            </span>

            <span className="bk-stat__value">
              ₦{fmt(totalDeposited)}
            </span>

          </div>

        </div>

        {/* CONFIRMED */}

        <div className="bk-stat">

          <div className="bk-stat__icon bk-stat__icon--confirmed">

            <FiCheckSquare
              size={20}
            />

          </div>

          <div className="bk-stat__body">

            <span className="bk-stat__label">
              Confirmed
            </span>

            <span className="bk-stat__value">
              ₦{fmt(totalConfirmed)}
            </span>

          </div>

        </div>

        {/* PENDING */}

        <div className="bk-stat">

          <div className="bk-stat__icon bk-stat__icon--pending">

            <FiClock
              size={20}
            />

          </div>

          <div className="bk-stat__body">

            <span className="bk-stat__label">
              Pending
            </span>

            <span className="bk-stat__value">
              ₦{fmt(totalPending)}
            </span>

          </div>

        </div>

      </div>

      {/* ========================================================
          AUDITOR NOTICE
      ======================================================== */}

      {isAuditor && (
        <div className="bk-notice">

          <FiCheckCircle
            size={15}
          />

          You are in{" "}

          <strong>
            Auditor Mode
          </strong>

          {" "}— you can confirm deposits but not add or delete them.

        </div>
      )}

      {isSuperAdmin && (
        <div
          className="bk-notice"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiEdit2 size={15} />
          You are in{" "}
          <strong>Super Admin Mode</strong>
          {" "}— you can edit or delete any bank deposit record, including confirmed records.
        </div>
      )}

      {/* ========================================================
          ADD DEPOSIT FORM
      ======================================================== */}

      {isAdmin && (
        <div className="bk-form-card">

          <div className="bk-form-card__header">

            <FiPlus size={16} />

            Record New Deposit

          </div>

          <form
            onSubmit={handleAdd}
            className="bk-form"
          >

            <div className="bk-form__fields">

              {/* AMOUNT */}

              <div className="bk-field">

                <label>
                  Amount (₦)
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount:
                        e.target.value,
                    })
                  }
                  required
                  disabled={
                    submitting
                  }
                />

              </div>

              {/* DATE */}

              <div className="bk-field">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date:
                        e.target.value,
                    })
                  }
                  required
                  disabled={
                    submitting
                  }
                />

              </div>

              {/* DESCRIPTION */}

              <div className="bk-field">

                <label>
                  Description / Reference
                </label>

                <input
                  type="text"
                  placeholder="e.g. GTBank deposit, teller #12345"
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  disabled={
                    submitting
                  }
                />

              </div>

            </div>

            <div className="bk-form__footer">

              <button
                type="submit"
                className="bk-btn-submit"
                disabled={submitting}
              >

                {submitting ? (

                  <>
                    <span className="bk-spinner" />

                    Saving...
                  </>

                ) : (

                  <>
                    <FiPlus
                      size={15}
                    />

                    Add Deposit
                  </>

                )}

              </button>

            </div>

          </form>

        </div>
      )}

      {/* ========================================================
          SEARCH / FILTER / PRINT
      ======================================================== */}

      <div className="bk-search-bar">

        {/* SEARCH */}

        <div className="bk-search-input">

          <FiSearch
            size={15}
            className="bk-search-icon"
          />

          <input
            type="text"
            placeholder="Search by description or recorded by or amount..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          {search && (
            <button
              className="bk-search-clear"
              onClick={() =>
                setSearch("")
              }
            >

              <FiX size={13} />

            </button>
          )}

        </div>

        {/* DATE FILTER */}

        <div className="bk-date-filters">

          <FiCalendar
            size={15}
            style={{
              color: "#64748b",
              flexShrink: 0,
            }}
          />

          {/* DAY */}

          <select
            value={filterDay}
            onChange={(e) =>
              setFilterDay(
                e.target.value
              )
            }
          >

            <option value="">
              Day
            </option>

            {Array.from(
              { length: 31 },
              (_, i) =>
                i + 1
            ).map((d) => (

              <option
                key={d}
                value={d}
              >
                {d}
              </option>

            ))}

          </select>

          {/* MONTH */}

          <select
            value={filterMonth}
            onChange={(e) =>
              setFilterMonth(
                e.target.value
              )
            }
          >

            <option value="">
              Month
            </option>

            {MONTHS.map(
              (m, i) => (

                <option
                  key={i}
                  value={i + 1}
                >
                  {m}
                </option>

              )
            )}

          </select>

          {/* YEAR */}

          <select
            value={filterYear}
            onChange={(e) =>
              setFilterYear(
                e.target.value
              )
            }
          >

            <option value="">
              Year
            </option>

            {years.map(
              (y) => (

                <option
                  key={y}
                  value={y}
                >
                  {y}
                </option>

              )
            )}

          </select>

          {(filterMonth ||
            filterDay ||
            filterYear) && (

            <button
              className="bk-search-clear"
              onClick={() => {
                setFilterMonth("");
                setFilterDay("");
                setFilterYear("");
              }}
            >

              <FiX size={13} />

            </button>

          )}

        </div>

        {/* PRINT */}

        <button
          className="bk-print-btn"
          onClick={handlePrint}
          title="Print table"
        >

          <FiPrinter
            size={15}
          />

          Print

        </button>

      </div>

      {/* ========================================================
          SUPER ADMIN EDIT MODAL
      ======================================================== */}

      {isSuperAdmin && editingDeposit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
          onClick={closeEdit}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                <FiEdit2 size={17} />
                Edit Bank Deposit
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={editSubmitting}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: editSubmitting
                    ? "not-allowed"
                    : "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSuperAdminEdit}>
              <div
                style={{
                  padding: "20px",
                  display: "grid",
                  gap: "16px",
                }}
              >
                <div className="bk-field">
                  <label>Amount (₦)</label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        amount: e.target.value,
                      })
                    }
                    disabled={editSubmitting}
                    required
                  />
                </div>

                <div className="bk-field">
                  <label>Date</label>

                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        date: e.target.value,
                      })
                    }
                    disabled={editSubmitting}
                    required
                  />
                </div>

                <div className="bk-field">
                  <label>
                    Description / Reference
                  </label>

                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        description:
                          e.target.value,
                      })
                    }
                    disabled={editSubmitting}
                    placeholder="e.g. GTBank deposit, teller #12345"
                  />
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Confirmation status and confirmation history are preserved when the record is edited.
                </div>
              </div>

              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={editSubmitting}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    padding: "9px 15px",
                    borderRadius: "7px",
                    cursor: editSubmitting
                      ? "not-allowed"
                      : "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="bk-btn-submit"
                  style={{
                    minWidth: "120px",
                    justifyContent: "center",
                  }}
                >
                  {editSubmitting ? (
                    <>
                      <span className="bk-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={14} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DEPOSITS TABLE
      ======================================================== */}

      <div className="bk-table-card">

        <div className="bk-table-wrap">

          {loading ? (

            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 15,
              }}
            >
              Loading deposits...
            </div>

          ) : (

            <table className="bk-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Recorded By
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Confirmed By
                  </th>

                  {(canManage ||
                    isAuditor) && (
                    <th>
                      Action
                    </th>
                  )}

                </tr>

              </thead>

              <tbody>

                {filtered.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={
                        canManage ||
                        isAuditor
                          ? 8
                          : 7
                      }
                      className="bk-table__empty"
                    >

                      No deposit records found

                    </td>

                  </tr>

                ) : (

                  filtered.map(
                    (d, i) => (

                      <tr
                        key={d.id}
                      >

                        {/* S/N */}

                        <td className="bk-table__sn">
                          {i + 1}
                        </td>

                        {/* AMOUNT */}

                        <td className="bk-table__amount">

                          ₦
                          {fmt(
                            d.amount
                          )}

                        </td>

                        {/* DESCRIPTION */}

                        <td className="bk-table__desc">

                          {d.description ||
                            "-"}

                        </td>

                        {/* DATE */}

                        <td>

                          {fmtDate(
                            d.date
                          )}

                        </td>

                        {/* RECORDED BY */}

                        <td className="bk-table__name">

                          {d.createdBy ||
                            "-"}

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`bk-badge ${
                              d.isConfirmed
                                ? "bk-badge--confirmed"
                                : "bk-badge--pending"
                            }`}
                          >

                            <span className="bk-badge__dot" />

                            {d.isConfirmed
                              ? "Confirmed"
                              : "Pending"}

                          </span>

                        </td>

                        {/* CONFIRMED BY */}

                        <td>

                          {d.isConfirmed ? (

                            <span className="bk-confirmed-by">

                              {d.confirmedBy ||
                                "-"}

                              {d.confirmedAt && (

                                <small>
                                  {fmtDate(
                                    d.confirmedAt
                                  )}
                                </small>

                              )}

                            </span>

                          ) : (

                            "-"

                          )}

                        </td>

                        {/* ACTION */}

                        {(canManage ||
                          isAuditor) && (

                          <td>

                            {/* AUDITOR */}

                            {isAuditor &&
                              !d.isConfirmed && (

                                <button
                                  className="bk-confirm-btn"
                                  onClick={() =>
                                    handleConfirm(
                                      d.id
                                    )
                                  }
                                >

                                  <FiCheckCircle
                                    size={13}
                                  />

                                  Confirm

                                </button>

                              )}

                            {isAuditor &&
                              d.isConfirmed && (

                                <span className="bk-confirmed-text">
                                  ✓ Verified
                                </span>

                              )}

                            {/* ADMIN */}

                            {isAdmin &&
                              !d.isConfirmed && (

                                <button
                                  className="bk-delete-btn"
                                  onClick={() =>
                                    handleDelete(
                                      d.id
                                    )
                                  }
                                >

                                  <FiTrash2
                                    size={13}
                                  />

                                  Delete

                                </button>

                              )}

                            {isAdmin &&
                              d.isConfirmed && (

                                <span className="bk-confirmed-text">
                                  ✓ Verified
                                </span>

                              )}

                            {/* SUPER ADMIN */}

                            {isSuperAdmin && (

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  flexWrap: "wrap",
                                }}
                              >

                                <button
                                  type="button"
                                  className="bk-confirm-btn"
                                  onClick={() =>
                                    openEdit(d)
                                  }
                                  title="Edit deposit"
                                >

                                  <FiEdit2
                                    size={13}
                                  />

                                  Edit

                                </button>

                                <button
                                  type="button"
                                  className="bk-delete-btn"
                                  onClick={() =>
                                    handleSuperAdminDelete(
                                      d.id
                                    )
                                  }
                                  title="Delete deposit"
                                >

                                  <FiTrash2
                                    size={13}
                                  />

                                  Delete

                                </button>

                              </div>

                            )}

                          </td>

                        )}

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          )}

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="bk-table-footer">

          <span>
            Total ({filtered.length} records)
          </span>

          <span className="bk-table-footer__amount">

            ₦
            {fmt(
              filtered.reduce(
                (sum, d) =>
                  sum +
                  Number(
                    d.amount || 0
                  ),
                0
              )
            )}

          </span>

        </div>

      </div>

    </div>
  );
}
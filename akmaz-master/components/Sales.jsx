// src/components/Sales.jsx

import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import axios from "axios";

import {
  MdOutlineProductionQuantityLimits,
} from "react-icons/md";

import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheckCircle,
  FiPrinter,
  FiCalendar,
} from "react-icons/fi";

import "./Sales.css";

const API_URL = "http://localhost:8000/api";

const PRODUCTS = [
  "BW SQ CON 50-100",
  "BW SQ CON 100-150",
  "BW SQ PP 23+",
  "BW SQ PP 20+",
  "BW SQ AFRICA SMALL",
  "BW SQ AFRICA MEDIUM",
  "BW 3SLT 30KG",
  "HA SQ CON 200-250",
  "HA SQ CON 150-200",
  "HA SQ PP 200-300",
  "HA SQ AFRICA",
  "HA BOX",
  "HA 2 SLATE",
  "HAKE",
  "MK BOX",
  "MK 3 SLATE",
  "MK 2 SLATE",
  "HM BOX",
  "SAITHEN BOX",
  "CROAKER MEDIUM",
  "MULLET",
];

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

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${
      localStorage.getItem("token") || ""
    }`,
  },
});

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Sales() {
  const role = (
    localStorage.getItem("role") || ""
  ).toLowerCase();

  const isAdmin = role === "admin";
  const isAuditor = role === "auditor";
  const isSuperAdmin = role === "superadmin";

  const canManage = isAdmin || isSuperAdmin;

  const [sales, setSales] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [message, setMessage] =
    useState(null);

  // ============================================================
  // DATE FILTER
  // ============================================================

  const [filterDay, setFilterDay] =
    useState("");

  const [filterMonth, setFilterMonth] =
    useState("");

  const [filterYear, setFilterYear] =
    useState("");

  // ============================================================
  // ADD FORM
  // ============================================================

  const [form, setForm] = useState({
    product: "",
    customerName: "",
    quantity: "",
    price: "",
    paymentStatus: "Unpaid",
  });

  // ============================================================
  // EDIT
  // ============================================================

  const [editingSale, setEditingSale] =
    useState(null);

  const [editForm, setEditForm] = useState({
    product: "",
    customerName: "",
    quantity: "",
    price: "",
    paymentStatus: "Unpaid",
  });

  // ============================================================
  // FETCH SALES
  // ============================================================

  const fetchSales = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/sales`,
        authHeaders()
      );

      const normalized = res.data.map(
        (s) => ({
          Id: s.id ?? s.Id,

          CustomerName:
            s.customerName ??
            s.CustomerName ??
            "",

          Product:
            s.product ??
            s.Product ??
            "",

          Quantity:
            s.quantity ??
            s.Quantity ??
            "",

          UnitPrice: Number(
            s.unitPrice ??
              s.UnitPrice ??
              0
          ),

          TotalPrice: Number(
            s.totalPrice ??
              s.TotalPrice ??
              0
          ),

          // ====================================================
          // AUDIT INFORMATION
          // ====================================================

          CreatedBy:
            s.createdBy ??
            s.CreatedBy ??
            "",

          Modified_By:
            s.modifiedBy ??
            s.ModifiedBy ??
            s.Modified_By ??
            "",

          Modified_At:
            s.modifiedAt ??
            s.ModifiedAt ??
            s.Modified_At ??
            null,

          ConfirmedBy:
            s.confirmedBy ??
            s.ConfirmedBy ??
            "",

          ConfirmedAt:
            s.confirmedAt ??
            s.ConfirmedAt ??
            null,

          Sold_At:
            s.soldAt ??
            s.SoldAt ??
            s.Sold_At ??
            null,

          PaymentStatus:
            (
              s.paymentStatus ??
              s.PaymentStatus ??
              "Unpaid"
            ).toLowerCase() ===
            "paid"
              ? "Paid"
              : "Unpaid",
        })
      );

      setSales(normalized);
    } catch (err) {
      console.error(
        "fetchSales:",
        err.response?.data ??
          err.message
      );

      setMessage({
        text:
          "Failed to load sales. Please log in again.",
        type: "danger",
      });
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // ============================================================
  // QUANTITY HELPER
  // ============================================================

  const extractQty = (value) => {
    const match = value
      ?.toString()
      .match(/\d+/)?.[0];

    return match
      ? parseInt(match, 10)
      : 0;
  };

  // ============================================================
  // LIVE ADD TOTAL
  // ============================================================

  const liveAddTotal = useMemo(
    () =>
      extractQty(form.quantity) *
      (parseFloat(form.price) || 0),
    [
      form.quantity,
      form.price,
    ]
  );

  // ============================================================
  // LIVE EDIT TOTAL
  // ============================================================

  const liveFormTotal = useMemo(() => {
    if (!editingSale) return 0;

    return (
      extractQty(editForm.quantity) *
      (parseFloat(editForm.price) || 0)
    );
  }, [
    editForm.quantity,
    editForm.price,
    editingSale,
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
  // FILTERED SALES
  // ============================================================

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // --------------------------------------------------------
      // SEARCH
      // --------------------------------------------------------

      if (searchTerm.trim()) {
        const q =
          searchTerm.toLowerCase();

        if (
          !s.Product
            ?.toLowerCase()
            .includes(q) &&
          !s.CustomerName
            ?.toLowerCase()
            .includes(q)
        ) {
          return false;
        }
      }

      // --------------------------------------------------------
      // DATE FILTER
      // --------------------------------------------------------

      if (
        filterDay ||
        filterMonth ||
        filterYear
      ) {
        const d = s.Sold_At
          ? new Date(s.Sold_At)
          : null;

        if (
          !d ||
          isNaN(d.getTime())
        ) {
          return false;
        }

        if (
          filterDay &&
          d.getDate() !==
            parseInt(
              filterDay,
              10
            )
        ) {
          return false;
        }

        if (
          filterMonth &&
          d.getMonth() + 1 !==
            parseInt(
              filterMonth,
              10
            )
        ) {
          return false;
        }

        if (
          filterYear &&
          d.getFullYear() !==
            parseInt(
              filterYear,
              10
            )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    sales,
    searchTerm,
    filterDay,
    filterMonth,
    filterYear,
  ]);

  const hasActiveFilter =
    searchTerm ||
    filterDay ||
    filterMonth ||
    filterYear;

  // ============================================================
  // CLEAR DATE FILTER
  // ============================================================

  const clearDateFilter = () => {
    setFilterDay("");
    setFilterMonth("");
    setFilterYear("");
  };

  // ============================================================
  // LIVE TOTAL REVENUE
  // ============================================================

  const liveTotalRevenue =
    useMemo(
      () =>
        filteredSales.reduce(
          (sum, s) =>
            sum +
            (
              editingSale?.Id ===
              s.Id
                ? liveFormTotal
                : Number(
                    s.TotalPrice ||
                      0
                  )
            ),
          0
        ),
      [
        filteredSales,
        editingSale,
        liveFormTotal,
      ]
    );

  // ============================================================
  // ADD SALE
  // ============================================================

  const addSale = async (e) => {
    e.preventDefault();

    const qty =
      extractQty(form.quantity);

    const price =
      parseFloat(form.price) || 0;

    if (
      !form.product.trim() ||
      !form.customerName.trim() ||
      qty <= 0 ||
      price <= 0
    ) {
      setMessage({
        text:
          "Fill all fields correctly.",
        type: "danger",
      });

      return;
    }

    try {
      await axios.post(
        `${API_URL}/sales/add`,
        {
          product:
            form.product.trim(),

          customerName:
            form.customerName.trim(),

          quantity:
            form.quantity.trim(),

          unitPrice: price,

          paymentStatus:
            form.paymentStatus,
        },
        authHeaders()
      );

      await fetchSales();

      setForm({
        product: "",
        customerName: "",
        quantity: "",
        price: "",
        paymentStatus:
          "Unpaid",
      });

      setMessage({
        text:
          "Sale added successfully!",
        type: "success",
      });
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? "Session expired."
          : err.response?.data ||
            "Error adding sale.";

      setMessage({
        text:
          typeof msg === "string"
            ? msg
            : "Error adding sale.",
        type: "danger",
      });
    }
  };

  // ============================================================
  // START EDIT
  // ============================================================

  const startEdit = (sale) => {
    setEditingSale(sale);

    setEditForm({
      customerName:
        sale.CustomerName,

      product:
        sale.Product,

      quantity:
        sale.Quantity,

      price: String(
        sale.UnitPrice
      ),

      paymentStatus:
        sale.PaymentStatus,
    });
  };

  // ============================================================
  // CANCEL EDIT
  // ============================================================

  const cancelEdit = () => {
    setEditingSale(null);

    setEditForm({
      product: "",
      customerName: "",
      quantity: "",
      price: "",
      paymentStatus:
        "Unpaid",
    });
  };

  // ============================================================
  // SAVE EDIT
  // ============================================================

  const saveEdit = async (e) => {
    e.preventDefault();

    if (!editingSale) return;

    const qty =
      extractQty(
        editForm.quantity
      );

    const price =
      parseFloat(
        editForm.price
      ) || 0;

    if (
      !editForm.product.trim() ||
      !editForm.customerName.trim() ||
      qty <= 0 ||
      price <= 0
    ) {
      setMessage({
        text:
          "Fill all fields correctly.",
        type: "danger",
      });

      return;
    }

    try {
      const endpoint = isSuperAdmin
        ? `${API_URL}/sales/superadmin-edit/${editingSale.Id}`
        : `${API_URL}/sales/update/${editingSale.Id}`;

      await axios.put(
        endpoint,
        {
          product:
            editForm.product.trim(),

          customerName:
            editForm.customerName.trim(),

          quantity:
            editForm.quantity.trim(),

          unitPrice: price,

          paymentStatus:
            editForm.paymentStatus,
        },
        authHeaders()
      );

      await fetchSales();

      cancelEdit();

      setMessage({
        text:
          "Sale updated successfully!",
        type: "success",
      });
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? "Session expired."
          : err.response?.data ||
            "Update failed.";

      setMessage({
        text:
          typeof msg === "string"
            ? msg
            : "Update failed.",
        type: "danger",
      });
    }
  };

  // ============================================================
  // SUPER ADMIN DELETE
  // ============================================================

  const handleSuperAdminDelete = async (
    saleId
  ) => {
    if (!isSuperAdmin) return;

    if (
      !window.confirm(
        "Are you sure you want to permanently delete this sale?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/sales/superadmin-delete/${saleId}`,
        authHeaders()
      );

      if (editingSale?.Id === saleId) {
        cancelEdit();
      }

      await fetchSales();

      setMessage({
        text:
          "Sale deleted successfully.",
        type: "success",
      });
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? "Session expired."
          : err.response?.data ||
            "Failed to delete sale.";

      setMessage({
        text:
          typeof msg === "string"
            ? msg
            : "Failed to delete sale.",
        type: "danger",
      });
    }
  };

  // ============================================================
  // CONFIRM PAYMENT
  // ============================================================

  const handleConfirmPayment =
    async (saleId) => {
      if (
        !window.confirm(
          "Confirm this sale as PAID?"
        )
      ) {
        return;
      }

      try {
        await axios.put(
          `${API_URL}/sales/confirm-payment/${saleId}`,
          null,
          authHeaders()
        );

        await fetchSales();

        setMessage({
          text:
            "Payment confirmed successfully!",
          type: "success",
        });
      } catch (err) {
        let msg =
          "Failed to confirm payment.";

        if (
          err.response?.status ===
          401
        ) {
          msg = "Session expired.";
        } else if (
          err.response?.data
        ) {
          const d =
            err.response.data;

          msg =
            d.title ||
            (
              d.errors
                ? Object.values(
                    d.errors
                  )
                    .flat()
                    .join(", ")
                : typeof d ===
                    "string"
                  ? d
                  : d.message
            ) ||
            msg;
        }

        setMessage({
          text: msg,
          type: "danger",
        });
      }
    };

  // ============================================================
  // PRINT
  //
  // PRINT DOES NOT INCLUDE:
  // - Created By
  // - Modified By
  // - Confirmed By
  //
  // These remain visible on the normal Sales page.
  // ============================================================

  const handlePrint = () => {
    const rows =
      filteredSales
        .map(
          (sale, i) => `
            <tr>

              <td>
                ${i + 1}
              </td>

              <td>
                ${sale.CustomerName || "-"}
              </td>

              <td>
                ${sale.Product || "-"}
              </td>

              <td>
                ${sale.Quantity || "-"}
              </td>

              <td>
                &#8358;${fmt(
                  sale.UnitPrice
                )}
              </td>

              <td>
                &#8358;${fmt(
                  sale.TotalPrice
                )}
              </td>

              <td>
                ${sale.PaymentStatus}
              </td>

              <td>
                ${
                  sale.Sold_At
                    ? new Date(
                        sale.Sold_At
                      ).toLocaleDateString(
                        "en-GB"
                      )
                    : "-"
                }
              </td>

            </tr>
          `
        )
        .join("");

    const totalRevenue =
      filteredSales.reduce(
        (sum, s) =>
          sum +
          Number(
            s.TotalPrice || 0
          ),
        0
      );

    const filterNote = [
      searchTerm &&
        `Search: "${searchTerm}"`,

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
          Sales Report
        </title>

        <style>

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family:
              Arial,
              sans-serif;

            font-size: 12px;

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
            padding: 9px 10px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #2d4f7c;
          }

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          tbody td {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
          }

          tfoot tr {
            background: #f1f5f9;
            font-weight: 700;
          }

          tfoot td {
            padding: 9px 10px;
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
          Sales Report
        </h2>

        <p class="meta">

          Printed on
          ${new Date().toLocaleDateString(
            "en-GB"
          )}

          &nbsp;|&nbsp;

          ${filteredSales.length}
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
                Customer
              </th>

              <th>
                Product
              </th>

              <th>
                Qty
              </th>

              <th>
                Unit Price
              </th>

              <th>
                Total
              </th>

              <th>
                Status
              </th>

              <th>
                Date
              </th>

            </tr>

          </thead>

          <tbody>

            ${rows}

          </tbody>

          <tfoot>

            <tr>

              <td
                colspan="5"
                style="
                  text-align: right;
                  padding-right: 12px;
                "
              >
                Total Revenue
                (${filteredSales.length} records)
              </td>

              <td>
                &#8358;${fmt(
                  totalRevenue
                )}
              </td>

              <td
                colspan="2"
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
  // ACTIVE FORM
  // ============================================================

  const activeForm =
    editingSale
      ? editForm
      : form;

  const setActiveForm =
    editingSale
      ? setEditForm
      : setForm;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="sl-page">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="sl-header">

        <div className="sl-header__icon">

          <MdOutlineProductionQuantityLimits
            size={26}
          />

        </div>

        <div>

          <h1 className="sl-header__title">
            Sales Management
          </h1>

          <p className="sl-header__sub">
            {sales.length} total records
          </p>

        </div>

      </div>

      {/* ========================================================
          ALERT
      ======================================================== */}

      {message && (
        <div
          className={`sl-alert sl-alert--${message.type}`}
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
          ADD / EDIT FORM
      ======================================================== */}

      {isAdmin && (
        <div className="sl-form-card">

          <div className="sl-form-card__header">

            <span className="sl-form-card__title">

              {editingSale
                ? "Edit Sale"
                : "Add New Sale"}

            </span>

            {editingSale && (
              <button
                className="sl-form-card__cancel"
                onClick={cancelEdit}
              >

                <FiX size={14} />

                Cancel

              </button>
            )}

          </div>

          <form
            onSubmit={
              editingSale
                ? saveEdit
                : addSale
            }
            className="sl-form"
          >

            <div className="sl-form__fields">

              {/* CUSTOMER */}

              <div className="sl-field">

                <label>
                  Customer Name
                </label>

                <input
                  placeholder="e.g. Kamzy Ltd"
                  value={
                    activeForm.customerName
                  }
                  onChange={(e) =>
                    setActiveForm({
                      ...activeForm,
                      customerName:
                        e.target.value,
                    })
                  }
                  required
                />

              </div>

              {/* PRODUCT */}

              <div className="sl-field">

                <label>
                  Product
                </label>

                <select
                  value={
                    activeForm.product
                  }
                  onChange={(e) =>
                    setActiveForm({
                      ...activeForm,
                      product:
                        e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    -- Select Product --
                  </option>

                  {PRODUCTS.map(
                    (p) => (
                      <option
                        key={p}
                        value={p}
                      >
                        {p}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* QUANTITY */}

              <div className="sl-field">

                <label>
                  Quantity
                </label>

                <input
                  placeholder="e.g. 10 pcs"
                  value={
                    activeForm.quantity
                  }
                  onChange={(e) =>
                    setActiveForm({
                      ...activeForm,
                      quantity:
                        e.target.value,
                    })
                  }
                  required
                />

              </div>

              {/* PRICE */}

              <div className="sl-field">

                <label>
                  Unit Price (₦)
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={
                    activeForm.price
                  }
                  onChange={(e) =>
                    setActiveForm({
                      ...activeForm,
                      price:
                        e.target.value,
                    })
                  }
                  required
                />

              </div>

              {/* STATUS */}

              {!editingSale && (
                <div className="sl-field">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      form.paymentStatus
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentStatus:
                          e.target.value,
                      })
                    }
                  >

                    <option value="Unpaid">
                      Unpaid
                    </option>

                    <option value="Paid">
                      Paid
                    </option>

                  </select>

                </div>
              )}

            </div>

            {/* FORM FOOTER */}

            <div className="sl-form__footer">

              {(editingSale
                ? liveFormTotal
                : liveAddTotal) > 0 && (

                <span className="sl-form__live-total">

                  Live Total:

                  <strong>

                    ₦
                    {fmt(
                      editingSale
                        ? liveFormTotal
                        : liveAddTotal
                    )}

                  </strong>

                </span>
              )}

              <button
                type="submit"
                className="sl-btn sl-btn--primary"
              >

                <FiPlus size={15} />

                {editingSale
                  ? "Save Changes"
                  : "Add Sale"}

              </button>

            </div>

          </form>

        </div>
      )}

      {/* ========================================================
          SEARCH / FILTER / PRINT
      ======================================================== */}

      <div className="sl-search-wrap">

        {/* SEARCH */}

        <div className="sl-search">

          <FiSearch
            size={15}
            className="sl-search__icon"
          />

          <input
            placeholder="Search by product or customer name..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />

          {searchTerm && (
            <button
              className="sl-search__clear"
              onClick={() =>
                setSearchTerm("")
              }
            >

              <FiX size={13} />

            </button>
          )}

        </div>

        {/* DATE FILTER */}

        <div className="sl-date-filters">

          <FiCalendar
            size={15}
            style={{
              color: "#64748b",
              flexShrink: 0,
            }}
          />

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
              (_, i) => i + 1
            ).map((d) => (
              <option
                key={d}
                value={d}
              >
                {d}
              </option>
            ))}

          </select>

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
              (month, i) => (
                <option
                  key={i}
                  value={i + 1}
                >
                  {month}
                </option>
              )
            )}

          </select>

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
              (year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              )
            )}

          </select>

          {(filterDay ||
            filterMonth ||
            filterYear) && (
            <button
              className="sl-search__clear"
              onClick={
                clearDateFilter
              }
            >

              <FiX size={13} />

            </button>
          )}

        </div>

        {/* PRINT */}

        <button
          className="sl-print-btn"
          onClick={handlePrint}
          title="Print table"
        >

          <FiPrinter size={15} />

          Print

        </button>

      </div>

      {/* ========================================================
          SALES TABLE
      ======================================================== */}

      <div className="sl-table-card">

        <div className="sl-table-wrap">

          <table className="sl-table">

            <thead>

              <tr>

                <th>#</th>

                <th>
                  Customer
                </th>

                <th>
                  Product
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Unit Price
                </th>

                <th>
                  Total
                </th>

                <th>
                  Status
                </th>

                <th>
                  Date
                </th>

                <th>
                  Created By
                </th>

                <th>
                  Modified By
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

              {filteredSales.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={
                      canManage ||
                      isAuditor
                        ? 12
                        : 11
                    }
                    className="sl-table__empty"
                  >

                    <MdOutlineProductionQuantityLimits
                      size={32}
                    />

                    <p>
                      No sales found
                    </p>

                  </td>

                </tr>

              ) : (

                filteredSales.map(
                  (sale, i) => (

                    <tr
                      key={sale.Id}
                      className={
                        editingSale?.Id ===
                        sale.Id
                          ? "sl-table__row--editing"
                          : ""
                      }
                    >

                      {/* S/N */}

                      <td className="sl-table__sn">
                        {i + 1}
                      </td>

                      {/* CUSTOMER */}

                      <td className="sl-table__name">

                        {editingSale?.Id ===
                        sale.Id ? (

                          <input
                            className="sl-inline-input"
                            value={
                              editForm.customerName
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                customerName:
                                  e.target.value,
                              })
                            }
                          />

                        ) : (

                          sale.CustomerName

                        )}

                      </td>

                      {/* PRODUCT */}

                      <td>

                        {editingSale?.Id ===
                        sale.Id ? (

                          <select
                            className="sl-inline-input"
                            value={
                              editForm.product
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                product:
                                  e.target.value,
                              })
                            }
                          >

                            <option value="">
                              -- Select Product --
                            </option>

                            {PRODUCTS.map(
                              (p) => (
                                <option
                                  key={p}
                                  value={p}
                                >
                                  {p}
                                </option>
                              )
                            )}

                          </select>

                        ) : (

                          sale.Product

                        )}

                      </td>

                      {/* QUANTITY */}

                      <td>

                        {editingSale?.Id ===
                        sale.Id ? (

                          <input
                            className="sl-inline-input"
                            value={
                              editForm.quantity
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                quantity:
                                  e.target.value,
                              })
                            }
                          />

                        ) : (

                          sale.Quantity

                        )}

                      </td>

                      {/* UNIT PRICE */}

                      <td>

                        {editingSale?.Id ===
                        sale.Id ? (

                          <input
                            className="sl-inline-input"
                            type="number"
                            step="0.01"
                            min="0"
                            value={
                              editForm.price
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                price:
                                  e.target.value,
                              })
                            }
                          />

                        ) : (

                          `₦${fmt(
                            sale.UnitPrice
                          )}`

                        )}

                      </td>

                      {/* TOTAL */}

                      <td className="sl-table__total">

                        {editingSale?.Id ===
                        sale.Id

                          ? `₦${fmt(
                              liveFormTotal
                            )}`

                          : `₦${fmt(
                              sale.TotalPrice
                            )}`}

                      </td>

                      {/* STATUS */}

                      <td>

                        {editingSale?.Id ===
                          sale.Id &&
                        isSuperAdmin ? (

                          <select
                            className="sl-inline-input"
                            value={
                              editForm.paymentStatus
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                paymentStatus:
                                  e.target.value,
                              })
                            }
                          >

                            <option value="Unpaid">
                              Unpaid
                            </option>

                            <option value="Paid">
                              Paid
                            </option>

                          </select>

                        ) : (

                          <span
                            className={`sl-badge ${
                              sale.PaymentStatus ===
                              "Paid"
                                ? "sl-badge--paid"
                                : "sl-badge--unpaid"
                            }`}
                          >

                            <span className="sl-badge__dot" />

                            {sale.PaymentStatus}

                          </span>

                        )}

                      </td>

                      {/* SALE DATE */}

                      <td>

                        {sale.Sold_At
                          ? new Date(
                              sale.Sold_At
                            ).toLocaleDateString(
                              "en-GB"
                            )
                          : "-"}

                      </td>

                      {/* CREATED BY */}

                      <td>

                        {sale.CreatedBy ||
                          "-"}

                      </td>

                      {/* MODIFIED BY */}

                      <td className="sl-modified-cell">

                        {sale.Modified_By ? (

                          <>

                            <strong>
                              {
                                sale.Modified_By
                              }
                            </strong>

                            {sale.Modified_At && (
                              <small>
                                {new Date(
                                  sale.Modified_At
                                ).toLocaleDateString(
                                  "en-GB"
                                )}
                              </small>
                            )}

                          </>

                        ) : (

                          "-"

                        )}

                      </td>

                      {/* CONFIRMED BY */}

                      <td className="sl-confirmed-cell">

                        {sale.ConfirmedBy ? (

                          <>

                            <strong>
                              {
                                sale.ConfirmedBy
                              }
                            </strong>

                            {sale.ConfirmedAt && (
                              <small>
                                {new Date(
                                  sale.ConfirmedAt
                                ).toLocaleDateString(
                                  "en-GB"
                                )}
                              </small>
                            )}

                          </>

                        ) : (

                          "-"

                        )}

                      </td>

                      {/* ACTION */}

                      {(canManage ||
                        isAuditor) && (

                        <td>

                          {/* ADMIN / SUPER ADMIN */}

                          {canManage && (

                            editingSale?.Id ===
                            sale.Id ? (

                              <div className="sl-action-group">

                                <button
                                  className="sl-action-btn sl-action-btn--save"
                                  onClick={
                                    saveEdit
                                  }
                                >
                                  Save
                                </button>

                                <button
                                  className="sl-action-btn sl-action-btn--cancel"
                                  onClick={
                                    cancelEdit
                                  }
                                >
                                  Cancel
                                </button>

                              </div>

                            ) : (

                              <>
                                <button
                                  className="sl-action-btn sl-action-btn--edit"
                                  onClick={() =>
                                    startEdit(
                                      sale
                                    )
                                  }
                                  title="Edit sale"
                                >

                                  <FiEdit2
                                    size={13}
                                  />

                                  Edit

                                </button>

                                {isSuperAdmin && (
                                  <button
                                    className="sl-action-btn sl-action-btn--delete"
                                    onClick={() =>
                                      handleSuperAdminDelete(
                                        sale.Id
                                      )
                                    }
                                    title="Delete sale"
                                  >

                                    <FiTrash2
                                      size={13}
                                    />

                                    Delete

                                  </button>
                                )}

                              </>

                            )

                          )}

                          {/* AUDITOR */}

                          {isAuditor && (

                            sale.PaymentStatus ===
                            "Unpaid" ? (

                              <button
                                className="sl-action-btn sl-action-btn--confirm"
                                onClick={() =>
                                  handleConfirmPayment(
                                    sale.Id
                                  )
                                }
                              >

                                <FiCheckCircle
                                  size={13}
                                />

                                Confirm

                              </button>

                            ) : (

                              <span className="sl-confirmed">
                                ✓ Confirmed
                              </span>

                            )

                          )}

                        </td>

                      )}

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="sl-table-footer">

          <span>

            {hasActiveFilter

              ? `${filteredSales.length} of ${sales.length} records`

              : "Total Revenue"}

          </span>

          <span className="sl-table-footer__amount">

            ₦
            {fmt(
              liveTotalRevenue
            )}

          </span>

        </div>

      </div>

    </div>
  );
}
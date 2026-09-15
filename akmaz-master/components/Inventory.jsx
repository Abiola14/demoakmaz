// src/components/Inventory.jsx

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { MdOutlineInventory2 } from "react-icons/md";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiPackage,
  FiPrinter,
  FiCalendar,
} from "react-icons/fi";
import "./Inventory.css";

const API_URL = "http://localhost:8000/api";

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

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

export default function InventoryManagement() {
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const username = localStorage.getItem("username") || "Admin";

  const isAdmin = role === "admin";
  const isSuperAdmin = role === "superadmin";

  // Admin can add/edit.
  // Super Admin can edit/delete.
  const canEdit = isAdmin || isSuperAdmin;

  const [fishStock, setFishStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    name: "",
    quantity: "",
    price: "",
    supplier: "",
  });

  const [editingFish, setEditingFish] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    quantity: "",
    price: "",
    supplier: "",
  });

  // Delete confirmation
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Date filter state
  const [filterDay, setFilterDay] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // ============================================================
  // FETCH
  // ============================================================

  const fetchInventory = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/inventory`,
        authHeaders()
      );

      const normalized = res.data.map((item) => ({
        Id: item.id,
        Name: item.name,
        Quantity: item.quantity,
        Price: item.price,
        TotalPrice: item.totalPrice || 0,
        Supplier: item.supplier || "",
        Created_At: item.created_At,
        Created_By: item.created_By,
        Modified_At: item.modified_At,
        Modified_By: item.modified_By || null,
      }));

      setFishStock(normalized);
    } catch (error) {
      console.error("Fetch inventory error:", error);

      setMessage({
        text: "Failed to load inventory",
        type: "danger",
      });
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================

  const parseQuantity = (qty) => {
    const match = qty?.toString().match(/\d+/)?.[0];

    return match ? parseInt(match, 10) : 0;
  };

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const liveTotal =
    parseQuantity(
      editingFish
        ? editForm.quantity
        : form.quantity
    ) *
    (parseFloat(
      editingFish
        ? editForm.price
        : form.price
    ) || 0);

  // ============================================================
  // YEAR OPTIONS
  // ============================================================

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: 5 },
    (_, i) => currentYear - i
  );

  // ============================================================
  // FILTERED STOCK
  // ============================================================

  const filteredStock = useMemo(() => {
    return fishStock.filter((f) => {
      // Unified text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();

        const matchesName =
          f.Name?.toLowerCase().includes(q);

        const matchesSupplier =
          f.Supplier?.toLowerCase().includes(q);

        const matchesAmount =
          f.TotalPrice?.toString().includes(q);

        if (
          !matchesName &&
          !matchesSupplier &&
          !matchesAmount
        ) {
          return false;
        }
      }

      // Date filter
      if (
        filterDay ||
        filterMonth ||
        filterYear
      ) {
        const d = f.Created_At
          ? new Date(f.Created_At)
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
            parseInt(filterDay, 10)
        ) {
          return false;
        }

        if (
          filterMonth &&
          d.getMonth() + 1 !==
            parseInt(filterMonth, 10)
        ) {
          return false;
        }

        if (
          filterYear &&
          d.getFullYear() !==
            parseInt(filterYear, 10)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    fishStock,
    searchTerm,
    filterDay,
    filterMonth,
    filterYear,
  ]);

  const filteredTotal = useMemo(
    () =>
      filteredStock.reduce(
        (sum, f) =>
          sum + Number(f.TotalPrice || 0),
        0
      ),
    [filteredStock]
  );

  const grandTotal = useMemo(
    () =>
      fishStock.reduce(
        (sum, f) =>
          sum + Number(f.TotalPrice || 0),
        0
      ),
    [fishStock]
  );

  const hasActiveFilter =
    searchTerm ||
    filterDay ||
    filterMonth ||
    filterYear;

  const clearAll = () => {
    setSearchTerm("");
    setFilterDay("");
    setFilterMonth("");
    setFilterYear("");
  };

  // ============================================================
  // ADD
  // ============================================================

  const addFish = async (e) => {
    e.preventDefault();

    const qty = parseQuantity(form.quantity);
    const price = parseFloat(form.price) || 0;

    if (
      !form.name.trim() ||
      qty === 0 ||
      price <= 0
    ) {
      return setMessage({
        text: "Fill all fields correctly",
        type: "danger",
      });
    }

    try {
      const res = await axios.post(
        `${API_URL}/inventory/add`,
        {
          name: form.name.trim(),
          quantity: form.quantity.trim(),
          price,
          supplier: form.supplier.trim(),
        },
        authHeaders()
      );

      const newItem = {
        Id: res.data.id,
        Name: res.data.name,
        Quantity: res.data.quantity,
        Price: res.data.price,
        TotalPrice: res.data.totalPrice,
        Supplier: res.data.supplier || "",
        Created_At: res.data.created_At,
        Created_By:
          res.data.created_By || username,
        Modified_At: null,
        Modified_By: null,
      };

      setFishStock((prev) => [
        newItem,
        ...prev,
      ]);

      setForm({
        name: "",
        quantity: "",
        price: "",
        supplier: "",
      });

      setMessage({
        text: "Item added successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Add inventory error:", error);

      setMessage({
        text:
          error?.response?.data ||
          "Error adding item",
        type: "danger",
      });
    }
  };

  // ============================================================
  // EDIT
  // ============================================================

  const startEdit = (fish) => {
    if (!canEdit) return;

    setEditingFish(fish);

    setEditForm({
      name: fish.Name || "",
      quantity: fish.Quantity || "",
      price:
        fish.Price?.toString() || "",
      supplier: fish.Supplier || "",
    });
  };

  const cancelEdit = () => {
    setEditingFish(null);

    setEditForm({
      name: "",
      quantity: "",
      price: "",
      supplier: "",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();

    if (!editingFish) return;

    const qty =
      parseQuantity(editForm.quantity);

    const price =
      parseFloat(editForm.price) || 0;

    if (
      !editForm.name.trim() ||
      qty === 0 ||
      price <= 0
    ) {
      return setMessage({
        text: "Fill all fields correctly",
        type: "danger",
      });
    }

    try {
      const endpoint = isSuperAdmin
        ? `${API_URL}/inventory/superadmin-edit/${editingFish.Id}`
        : `${API_URL}/inventory/update/${editingFish.Id}`;

      await axios.put(
        endpoint,
        {
          name: editForm.name.trim(),
          quantity:
            editForm.quantity.trim(),
          price,
          supplier:
            editForm.supplier.trim(),
          modified_By: username,
        },
        authHeaders()
      );

      await fetchInventory();

      cancelEdit();

      setMessage({
        text: "Item updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Update inventory error:", error);

      setMessage({
        text:
          error?.response?.data ||
          "Update failed",
        type: "danger",
      });
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const openDeleteConfirmation = (fish) => {
    if (!isSuperAdmin) return;

    setDeleteItem(fish);
  };

  const cancelDelete = () => {
    if (deleting) return;

    setDeleteItem(null);
  };

  const confirmDelete = async () => {
    if (
      !deleteItem ||
      !isSuperAdmin
    ) {
      return;
    }

    setDeleting(true);

    try {
      await axios.delete(
        `${API_URL}/inventory/superadmin-delete/${deleteItem.Id}`,
        authHeaders()
      );

      setFishStock((prev) =>
        prev.filter(
          (item) =>
            item.Id !== deleteItem.Id
        )
      );

      if (
        editingFish?.Id ===
        deleteItem.Id
      ) {
        cancelEdit();
      }

      setDeleteItem(null);

      setMessage({
        text:
          "Inventory record deleted successfully!",
        type: "success",
      });
    } catch (error) {
      console.error(
        "Delete inventory error:",
        error
      );

      setMessage({
        text:
          error?.response?.data ||
          "Failed to delete inventory record",
        type: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // PRINT
  // ============================================================

  const handlePrint = () => {
    const rows = filteredStock
      .map(
        (fish, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${fish.Name || "-"}</td>
            <td>${fish.Quantity || "-"}</td>
            <td>&#8358;${fmt(
              fish.Price
            )}</td>
            <td>&#8358;${fmt(
              fish.TotalPrice
            )}</td>
            <td>${fish.Supplier || "-"}</td>
            <td>
              ${
                fish.Created_At
                  ? new Date(
                      fish.Created_At
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
          "Unable to open print window. Please allow pop-ups.",
        type: "danger",
      });

      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

      <head>

        <title>
          Inventory Report
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
            color: #fff;
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
          Inventory Report
        </h2>

        <p class="meta">

          Printed on
          ${new Date().toLocaleDateString(
            "en-GB"
          )}

          &nbsp;|&nbsp;

          ${filteredStock.length}
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

              <th>#</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Value</th>
              <th>Supplier</th>
              <th>Created</th>

            </tr>

          </thead>

          <tbody>

            ${rows}

          </tbody>

          <tfoot>

            <tr>

              <td
                colspan="4"
                style="
                  text-align:right;
                  padding-right:12px;
                "
              >
                Total Value
                (${filteredStock.length} records)
              </td>

              <td>
                &#8358;${fmt(
                  filteredTotal
                )}
              </td>

              <td colspan="2"></td>

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

  const activeForm = editingFish
    ? editForm
    : form;

  const setActiveForm = editingFish
    ? (value) =>
        setEditForm(value)
    : (value) =>
        setForm(value);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="inv-page">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="inv-header">

        <div className="inv-header__icon">

          <MdOutlineInventory2
            size={28}
          />

        </div>

        <div>

          <h1 className="inv-header__title">
            Inventory Management
          </h1>

          <p className="inv-header__sub">
            {fishStock.length} items in stock
          </p>

        </div>

      </div>

      {/* ========================================================
          ALERT
      ======================================================== */}

      {message && (
        <div
          className={`inv-alert inv-alert--${message.type}`}
        >

          <span>
            {message.text}
          </span>

          <button
            type="button"
            onClick={() =>
              setMessage(null)
            }
          >

            <FiX size={16} />

          </button>

        </div>
      )}

      {/* ========================================================
          AUDITOR NOTICE
      ======================================================== */}

      {!isAdmin &&
        !isSuperAdmin && (
          <div className="inv-notice">

            <FiPackage size={15} />

            You are in{" "}

            <strong>
              Auditor Mode
            </strong>

            {" "}— view only, no edits allowed.

          </div>
        )}

      {/* ========================================================
          SUPER ADMIN NOTICE
      ======================================================== */}

      {isSuperAdmin && (
        <div className="inv-notice">

          <FiPackage size={15} />

          You are in{" "}

          <strong>
            Super Admin Mode
          </strong>

          {" "}— you can edit and delete inventory records.

        </div>
      )}

      {/* ========================================================
          ADD / EDIT FORM
          
          IMPORTANT:
          Admin -> Add + Edit
          Super Admin -> Edit only
      ======================================================== */}

      {(isAdmin || editingFish) && (
        <div className="inv-form-card">

          <div className="inv-form-card__header">

            <span className="inv-form-card__title">

              {editingFish
                ? `Editing: ${editingFish.Name}`
                : "Add New Item"}

            </span>

            {editingFish && (
              <button
                className="inv-form-card__cancel"
                onClick={cancelEdit}
                type="button"
              >

                <FiX size={15} />

                Cancel

              </button>
            )}

          </div>

          <form
            onSubmit={
              editingFish
                ? saveEdit
                : addFish
            }
            className="inv-form"
          >

            <div className="inv-form__fields">

              {/* ==================================================
                  FISH NAME
              ================================================== */}

              <div className="inv-field">

                <label>
                  Fish Name
                </label>

                <input
                  placeholder="e.g. Tilapia"
                  value={
                    activeForm.name
                  }
                  onChange={(e) =>
                    setActiveForm({
                      ...activeForm,
                      name:
                        e.target.value,
                    })
                  }
                  required
                />

              </div>

              {/* ==================================================
                  QUANTITY
              ================================================== */}

              <div className="inv-field">

                <label>
                  Quantity
                </label>

                <input
                  placeholder="e.g. 40 pcs"
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

              {/* ==================================================
                  PRICE
              ================================================== */}

              <div className="inv-field">

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

              {/* ==================================================
                  SUPPLIER
              ================================================== */}

              <div className="inv-field">

                <label>
                  Supplier
                </label>

                <input
                  placeholder="Supplier name"
                  value={
                    activeForm.supplier
                  }
                  onChange={(e) =>
                    setActiveForm({
                      ...activeForm,
                      supplier:
                        e.target.value,
                    })
                  }
                />

              </div>

            </div>

            {/* ====================================================
                FORM FOOTER
            ==================================================== */}

            <div className="inv-form__footer">

              {liveTotal > 0 && (
                <span className="inv-form__live-total">

                  Live Total:{" "}

                  <strong>
                    ₦{fmt(liveTotal)}
                  </strong>

                </span>
              )}

              {/* Admin can add.
                  Super Admin only sees this when editing. */}

              {(isAdmin ||
                editingFish) && (
                <button
                  type="submit"
                  className="inv-btn inv-btn--primary"
                >

                  <FiPlus size={16} />

                  {editingFish
                    ? "Save Changes"
                    : "Add Item"}

                </button>
              )}

            </div>

          </form>

        </div>
      )}

      {/* ========================================================
          SEARCH + DATE FILTER + PRINT
      ======================================================== */}

      <div className="inv-toolbar">

        {/* SEARCH */}

        <div className="inv-search">

          <FiSearch
            size={15}
            className="inv-search__icon"
          />

          <input
            placeholder="Search by name, supplier or amount..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />

          {searchTerm && (
            <button
              className="inv-search__clear"
              onClick={() =>
                setSearchTerm("")
              }
              type="button"
            >

              <FiX size={13} />

            </button>
          )}

        </div>

        {/* DATE FILTER */}

        <div className="inv-date-filters">

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

            {years.map((y) => (
              <option
                key={y}
                value={y}
              >
                {y}
              </option>
            ))}

          </select>

          {(filterDay ||
            filterMonth ||
            filterYear) && (
            <button
              className="inv-search__clear"
              onClick={() => {
                setFilterDay("");
                setFilterMonth("");
                setFilterYear("");
              }}
              type="button"
            >

              <FiX size={13} />

            </button>
          )}

        </div>

        {/* CLEAR ALL */}

        {hasActiveFilter && (
          <button
            className="inv-clear-all-btn"
            onClick={clearAll}
            type="button"
          >

            <FiX size={13} />

            Clear All

          </button>
        )}

        {/* PRINT */}

        <button
          className="inv-print-btn"
          onClick={handlePrint}
          title="Print table"
          type="button"
        >

          <FiPrinter size={15} />

          Print

        </button>

      </div>

      {/* ========================================================
          TABLE
      ======================================================== */}

      <div className="inv-table-card">

        <div className="inv-table-wrap">

          <table className="inv-table">

            <thead>

              <tr>

                <th>
                  S/N
                </th>

                <th>
                  Name
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Unit Price
                </th>

                <th>
                  Total Value
                </th>

                <th>
                  Supplier
                </th>

                <th>
                  Created
                </th>

                <th>
                  Created By
                </th>

                <th>
                  Modified By
                </th>

                {canEdit && (
                  <th>
                    Action
                  </th>
                )}

              </tr>

            </thead>

            <tbody>

              {filteredStock.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={
                      canEdit
                        ? 10
                        : 9
                    }
                    className="inv-table__empty"
                  >

                    <FiPackage
                      size={32}
                    />

                    <p>
                      No items found
                    </p>

                  </td>

                </tr>

              ) : (

                filteredStock.map(
                  (fish, i) => (

                    <tr
                      key={fish.Id}
                      className={
                        editingFish?.Id ===
                        fish.Id
                          ? "inv-table__row--editing"
                          : ""
                      }
                    >

                      {/* S/N */}

                      <td className="inv-table__sn">

                        {i + 1}

                      </td>

                      {/* NAME */}

                      <td className="inv-table__name">

                        {fish.Name}

                      </td>

                      {/* QUANTITY */}

                      <td>

                        {fish.Quantity}

                      </td>

                      {/* UNIT PRICE */}

                      <td>

                        ₦
                        {fmt(
                          fish.Price
                        )}

                      </td>

                      {/* TOTAL */}

                      <td className="inv-table__total">

                        ₦
                        {fmt(
                          fish.TotalPrice
                        )}

                      </td>

                      {/* SUPPLIER */}

                      <td>

                        {fish.Supplier ||
                          "-"}

                      </td>

                      {/* CREATED */}

                      <td>

                        {fish.Created_At
                          ? new Date(
                              fish.Created_At
                            ).toLocaleDateString(
                              "en-GB"
                            )
                          : "-"}

                      </td>

                      {/* CREATED BY */}

                      <td>

                        {fish.Created_By ||
                          "-"}

                      </td>

                      {/* MODIFIED BY */}

                      <td>

                        {fish.Modified_By ? (

                          <span className="inv-modified">

                            {fish.Modified_By}

                            {fish.Modified_At && (
                              <small>

                                {new Date(
                                  fish.Modified_At
                                ).toLocaleDateString(
                                  "en-GB"
                                )}

                              </small>
                            )}

                          </span>

                        ) : (

                          "-"

                        )}

                      </td>

                      {/* ACTIONS */}

                      {canEdit && (
                        <td>

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                            }}
                          >

                            {/* EDIT */}

                            <button
                              className={`inv-edit-btn ${
                                editingFish?.Id ===
                                fish.Id
                                  ? "inv-edit-btn--cancel"
                                  : ""
                              }`}
                              onClick={() =>
                                editingFish?.Id ===
                                fish.Id
                                  ? cancelEdit()
                                  : startEdit(
                                      fish
                                    )
                              }
                              type="button"
                              title={
                                editingFish?.Id ===
                                fish.Id
                                  ? "Cancel edit"
                                  : "Edit inventory"
                              }
                            >

                              {editingFish?.Id ===
                              fish.Id ? (

                                <FiX
                                  size={14}
                                />

                              ) : (

                                <FiEdit2
                                  size={14}
                                />

                              )}

                              {editingFish?.Id ===
                              fish.Id
                                ? "Cancel"
                                : "Edit"}

                            </button>

                            {/* DELETE - SUPER ADMIN ONLY */}

                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  openDeleteConfirmation(
                                    fish
                                  )
                                }
                                title="Delete inventory record"
                                style={{
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  gap: "5px",
                                  border:
                                    "1px solid #dc2626",
                                  background:
                                    "#fff",
                                  color:
                                    "#dc2626",
                                  borderRadius:
                                    "6px",
                                  padding:
                                    "7px 10px",
                                  cursor:
                                    "pointer",
                                  fontSize:
                                    "13px",
                                  fontWeight:
                                    "600",
                                }}
                              >

                                <FiTrash2
                                  size={14}
                                />

                                Delete

                              </button>
                            )}

                          </div>

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

        <div className="inv-table-footer">

          <span>

            {hasActiveFilter
              ? `${filteredStock.length} of ${fishStock.length} items`
              : "Total Inventory Value"}

          </span>

          <span className="inv-table-footer__amount">

            ₦
            {fmt(
              hasActiveFilter
                ? filteredTotal
                : grandTotal
            )}

          </span>

        </div>

      </div>

      {/* ========================================================
          DELETE CONFIRMATION MODAL
      ======================================================== */}

      {deleteItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "430px",
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: "18px",
              }}
            >

              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  color: "#1e293b",
                }}
              >

                Delete Inventory Record

              </h3>

              {!deleting && (
                <button
                  type="button"
                  onClick={cancelDelete}
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    cursor:
                      "pointer",
                    color:
                      "#64748b",
                  }}
                >

                  <FiX size={20} />

                </button>
              )}

            </div>

            <p
              style={{
                color: "#475569",
                lineHeight: 1.6,
                marginBottom:
                  "8px",
              }}
            >

              Are you sure you want to permanently
              delete this inventory record?

            </p>

            <div
              style={{
                background:
                  "#f8fafc",
                borderRadius:
                  "8px",
                padding:
                  "12px",
                margin:
                  "15px 0",
              }}
            >

              <strong>

                {deleteItem.Name}

              </strong>

              <div
                style={{
                  marginTop:
                    "5px",
                  fontSize:
                    "13px",
                  color:
                    "#64748b",
                }}
              >

                Quantity:{" "}
                {deleteItem.Quantity}

                <br />

                Value: ₦
                {fmt(
                  deleteItem.TotalPrice
                )}

              </div>

            </div>

            <p
              style={{
                color:
                  "#dc2626",
                fontSize:
                  "13px",
                marginBottom:
                  "20px",
              }}
            >

              This action cannot be undone.

            </p>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: "10px",
              }}
            >

              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                style={{
                  padding:
                    "9px 16px",
                  borderRadius:
                    "6px",
                  border:
                    "1px solid #cbd5e1",
                  background:
                    "#fff",
                  color:
                    "#334155",
                  cursor:
                    deleting
                      ? "not-allowed"
                      : "pointer",
                  fontWeight:
                    "600",
                }}
              >

                Cancel

              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: "6px",
                  padding:
                    "9px 16px",
                  borderRadius:
                    "6px",
                  border: "none",
                  background:
                    "#dc2626",
                  color: "#fff",
                  cursor:
                    deleting
                      ? "not-allowed"
                      : "pointer",
                  fontWeight:
                    "600",
                  opacity:
                    deleting
                      ? 0.7
                      : 1,
                }}
              >

                <FiTrash2
                  size={14}
                />

                {deleting
                  ? "Deleting..."
                  : "Delete Record"}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
// src/components/Report.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TbReportAnalytics } from "react-icons/tb";
import { FiDownload, FiFileText } from "react-icons/fi";
import { MdOutlineInventory2 } from "react-icons/md";
import { FiShoppingCart } from "react-icons/fi";
import logo from "../src/img/Akmaz.png";
import "./Report.css";

const Report = () => {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [salesFilter, setSalesFilter] = useState("all");
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [salesDate, setSalesDate] = useState("");
  const [inventoryDate, setInventoryDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, invRes] = await Promise.all([
          axios.get("http://localhost:8000/api/sales"),
          axios.get("http://localhost:8000/api/inventory"),
        ]);

        setSales(salesRes.data.map((s) => ({
          Id: s.id,
          Product: s.product,
          Quantity: s.quantity,
          UnitPrice: s.unitPrice,
          TotalPrice: s.totalPrice,
          Sold_At: s.sold_At,
          Created_By: s.created_By,
          Modified_By: s.modified_By,
          Modified_At: s.modified_At,
        })));

        setInventory(invRes.data.map((i) => ({
          Id: i.id,
          Name: i.name,
          Quantity: i.quantity,
          Price: i.price,
          TotalPrice: i.totalPrice,
          Supplier: i.supplier || "-",
          Created_At: i.created_At,
          Created_By: i.created_By,
          Modified_By: i.modified_By,
          Modified_At: i.modified_At,
        })));
      } catch {
        alert("Failed to load report data");
      }
    };
    fetchData();
  }, []);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB") : "-";

  const naira = (n) =>
    `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  const filterData = (data, filter, dateField, dateValue) => {
    if (filter === "all") return data;
    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      const filterDate = dateValue ? new Date(dateValue) : new Date();
      if (isNaN(itemDate)) return false;

      const getWeek = (d) => {
        const start = new Date(d.getFullYear(), 0, 1);
        return Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
      };

      switch (filter) {
        case "daily":
          return itemDate.toDateString() === filterDate.toDateString();
        case "weekly":
          return (
            getWeek(itemDate) === getWeek(filterDate) &&
            itemDate.getFullYear() === filterDate.getFullYear()
          );
        case "monthly":
          return (
            itemDate.getMonth() === filterDate.getMonth() &&
            itemDate.getFullYear() === filterDate.getFullYear()
          );
        case "yearly":
          return itemDate.getFullYear() === filterDate.getFullYear();
        default:
          return true;
      }
    });
  };

  const filteredSales = filterData(sales, salesFilter, "Sold_At", salesDate);
  const filteredInventory = filterData(inventory, inventoryFilter, "Created_At", inventoryDate);

  const salesTotal = filteredSales.reduce((sum, s) => sum + (s.TotalPrice || 0), 0);
  const inventoryTotal = filteredInventory.reduce((sum, i) => sum + (i.TotalPrice || 0), 0);

  const exportPDF = (type) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString("en-GB");

    try { doc.addImage(logo, "PNG", 15, 10, 30, 30); } catch {}
    doc.setFontSize(22).setTextColor(0, 102, 204).setFont("helvetica", "bold");
    doc.text("AKMAZ FISHERIES", pageWidth / 2, 25, { align: "center" });
    doc.setFontSize(14).setTextColor(0);
    doc.text("Business Report", pageWidth / 2, 35, { align: "center" });
    doc.setFontSize(10).setTextColor(100);
    doc.text(`Generated: ${today}`, pageWidth - 20, 45, { align: "right" });
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(15, 48, pageWidth - 15, 48);

    let y = 58;

    if (type === "sales" || type === "both") {
      const salesBody = filteredSales.map((s, i) => [
        i + 1, s.Product, s.Quantity, naira(s.UnitPrice), naira(s.TotalPrice), formatDate(s.Sold_At),
      ]);
      autoTable(doc, {
        head: [["S/N", "Product", "Quantity", "Unit Price", "Total", "Date"]],
        body: salesBody,
        foot: [["", "", "", "TOTAL", naira(salesTotal), ""]],
        startY: y,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        footStyles: { fillColor: [200, 220, 255] },
        margin: { left: 15, right: 15 },
      });
      y = doc.lastAutoTable.finalY + 20;
      if (type === "both") { doc.addPage(); y = 20; }
    }

    if (type === "inventory" || type === "both") {
      const invBody = filteredInventory.map((i, idx) => [
        idx + 1, i.Name, i.Quantity, i.Supplier, naira(i.TotalPrice), formatDate(i.Created_At),
      ]);
      autoTable(doc, {
        head: [["S/N", "Fish", "Quantity", "Supplier", "Total Value", "Date"]],
        body: invBody,
        foot: [["", "", "", "TOTAL VALUE", naira(inventoryTotal), ""]],
        startY: y,
        theme: "grid",
        headStyles: { fillColor: [39, 174, 96] },
        footStyles: { fillColor: [200, 240, 200] },
        margin: { left: 15, right: 15 },
      });
    }

    doc.setFontSize(9).setTextColor(100);
    doc.text(
      "© 2025 Akmaz Fisheries",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );

    const filename =
      type === "both" ? "Akmaz_Full_Report.pdf"
      : type === "sales" ? "Akmaz_Sales_Report.pdf"
      : "Akmaz_Inventory_Report.pdf";
    doc.save(filename);
  };

  return (
    <div className="rp-page">

      {/* ── Header ── */}
      <div className="rp-header">
        <div className="rp-header__icon">
          <TbReportAnalytics size={28} />
        </div>
        <div>
          <h1 className="rp-header__title">Business Reports</h1>
          <p className="rp-header__sub">View and export sales & inventory data</p>
        </div>
      </div>

      {/* ══════════ SALES CARD ══════════ */}
      <div className="rp-card rp-card--sales">
        <div className="rp-card__header">
          <h2 className="rp-card__heading">
            <span className="rp-card__heading-icon">
              <FiShoppingCart size={16} />
            </span>
            Sales Report
          </h2>
        </div>

        {/* Controls */}
        <div className="rp-controls">
          <select
            className="rp-select"
            value={salesFilter}
            onChange={(e) => setSalesFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {salesFilter !== "all" && (
            <input
              type={salesFilter === "monthly" ? "month" : "date"}
              className="rp-date-input"
              value={salesDate}
              onChange={(e) => setSalesDate(e.target.value)}
            />
          )}

          <button
            className="rp-export-btn rp-export-btn--sales"
            onClick={() => exportPDF("sales")}
          >
            <FiDownload size={15} /> Export PDF
          </button>
        </div>

        {/* Table */}
        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th className="rp-table__sn">#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="rp-table__empty">No sales data for this period</td>
                </tr>
              ) : (
                filteredSales.map((s, i) => (
                  <tr key={s.Id}>
                    <td className="rp-table__sn">{i + 1}</td>
                    <td className="rp-table__name">{s.Product}</td>
                    <td>{s.Quantity}</td>
                    <td>{naira(s.UnitPrice)}</td>
                    <td className="rp-table__amount">{naira(s.TotalPrice)}</td>
                    <td>{formatDate(s.Sold_At)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="rp-tfoot-label">Total Revenue</td>
                <td className="rp-tfoot-total">{naira(salesTotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ══════════ INVENTORY CARD ══════════ */}
      <div className="rp-card rp-card--inventory">
        <div className="rp-card__header">
          <h2 className="rp-card__heading">
            <span className="rp-card__heading-icon">
              <MdOutlineInventory2 size={16} />
            </span>
            Inventory Report
          </h2>
        </div>

        {/* Controls */}
        <div className="rp-controls">
          <select
            className="rp-select"
            value={inventoryFilter}
            onChange={(e) => setInventoryFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {inventoryFilter !== "all" && (
            <input
              type={inventoryFilter === "monthly" ? "month" : "date"}
              className="rp-date-input"
              value={inventoryDate}
              onChange={(e) => setInventoryDate(e.target.value)}
            />
          )}

          <button
            className="rp-export-btn rp-export-btn--inventory"
            onClick={() => exportPDF("inventory")}
          >
            <FiDownload size={15} /> Export PDF
          </button>
        </div>

        {/* Table */}
        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th className="rp-table__sn">#</th>
                <th>Fish</th>
                <th>Qty</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="rp-table__empty">No inventory data for this period</td>
                </tr>
              ) : (
                filteredInventory.map((item, idx) => (
                  <tr key={item.Id}>
                    <td className="rp-table__sn">{idx + 1}</td>
                    <td className="rp-table__name">{item.Name}</td>
                    <td>{item.Quantity}</td>
                    <td className="rp-table__amount--green">{naira(item.TotalPrice)}</td>
                    <td>{item.Supplier}</td>
                    <td>{formatDate(item.Created_At)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="rp-tfoot-label">Total Inventory Value</td>
                <td className="rp-tfoot-total--green">{naira(inventoryTotal)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Full Export ── */}
      <div className="rp-export-full">
        <button
          className="rp-export-btn--full"
          onClick={() => exportPDF("both")}
        >
          <FiFileText size={18} />
          Export Full Report (PDF)
        </button>
      </div>

    </div>
  );
};

export default Report;

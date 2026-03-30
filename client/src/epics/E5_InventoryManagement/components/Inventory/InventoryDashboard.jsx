// ============================================
// Inventory Dashboard Component
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// Features: Multi-location stock tracking, search & filter
// ============================================

import React, { useState, useEffect } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
import inventoryService from "../../services/inventoryService";

function InventoryDashboard() {
  // State Variables
  const [inventory, setInventory] = useState([]);
  // [E5.1] location state drives API call; changing the dropdown triggers a re-fetch of that location's stock
  const [location, setLocation] = useState("Main");
  const [loading, setLoading] = useState(true);
  // [E5.7] Client-side search, status filter and sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("none");

  // Side Effects
  useEffect(() => {
    loadInventory();
  }, [location]);

  // Event Handlers
  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventoryByLocation(location);
      setInventory(response.inventory || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // [E5.7] Client-side filtered + sorted list
  const filteredInventory = inventory
    .filter((item) => {
      const nameMatch = (item.product?.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const qty = item.quantity;
      const threshold = item.lowStockThreshold || 0;
      const statusMatch =
        statusFilter === "All" ||
        (statusFilter === "In Stock" && qty > threshold) ||
        (statusFilter === "Low Stock" && qty > 0 && qty <= threshold) ||
        (statusFilter === "Out of Stock" && qty === 0);
      return nameMatch && statusMatch;
    })
    .sort((a, b) => {
      if (sortOrder === "high-to-low") return b.quantity - a.quantity;
      if (sortOrder === "low-to-high") return a.quantity - b.quantity;
      return 0;
    });

  if (loading)
    // Render
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container">
      <div className="page-header">
        <h1>Inventory Management</h1>
        <p>Track stock levels across all locations</p>
      </div>

      {/* Filters card */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        {/* Location Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <label style={{ fontWeight: "600", whiteSpace: "nowrap" }}>
            Select Location:
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="form-select"
            style={{ maxWidth: "260px" }}
          >
            <option value="Main">Main Warehouse</option>
            <option value="Balangoda">Balangoda Branch</option>
            <option value="Kottawa">Kottawa Branch</option>
          </select>
        </div>

        {/* Search + Status Filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Search box */}
          <div style={{ position: "relative", maxWidth: "280px", width: "100%", display: "flex", alignItems: "center" }}>
            <Search
              size={15}
              style={{ position: "absolute", left: "10px", color: "var(--text-light, #888)", pointerEvents: "none" }}
            />
            <input
              type="text"
              placeholder="Search by product name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "32px",
                paddingRight: "10px",
                paddingTop: "8px",
                paddingBottom: "8px",
                border: "1px solid var(--border-color, #ddd)",
                borderRadius: "6px",
                fontSize: "0.875rem",
              }}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ minWidth: "160px" }}
            aria-label="Filter by stock status"
          >
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* Sort by stock */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="form-select"
            style={{ minWidth: "160px" }}
            aria-label="Sort by stock level"
          >
            <option value="none">Sort by Stock</option>
            <option value="high-to-low">Stock: High → Low</option>
            <option value="low-to-high">Stock: Low → High</option>
          </select>

          {/* Clear button */}
          {(search || statusFilter !== "All" || sortOrder !== "none") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); setSortOrder("none"); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                border: "1px solid var(--border-color, #ddd)",
                borderRadius: "6px",
                background: "transparent",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "var(--text-light, #888)",
              }}
            >
              <X size={13} /> Clear
            </button>
          )}

          {/* Result count */}
          {(search || statusFilter !== "All" || sortOrder !== "none") && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-light, #888)" }}>
              {filteredInventory.length} of {inventory.length} items
            </span>
          )}
        </div>
      </div>

      {/* Inventory cards */}
      <div className="grid grid-3">
        {filteredInventory.map((item) => (
          <div key={item._id} className="card">
            <h3>{item.product?.name || "Product"}</h3>
            <div style={{ marginTop: "1rem" }}>
              <p>
                <strong>Location:</strong> {item.location}
              </p>
              <p>
                <strong>Stock:</strong> {item.quantity} units
              </p>
              <p>
                <strong>Low Stock Alert:</strong> {item.lowStockThreshold} units
              </p>

              {item.quantity <= item.lowStockThreshold && (
                <div
                  className="alert alert-warning"
                  style={{ marginTop: "1rem" }}
                >
                  <AlertTriangle size={16} /> Low Stock!
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <div className="card">
          <p>
            {search || statusFilter !== "All"
              ? "No items match your search or filter."
              : `No inventory found for ${location} location.`}
          </p>
        </div>
      )}
    </div>
  );
}

export default InventoryDashboard;

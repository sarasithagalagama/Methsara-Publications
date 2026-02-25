import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import "./dashboard.css";

const DashboardTable = ({
  columns,
  data,
  keyField = "_id",
  actions, // Optional function to render actions column: (item) => <buttons>
  searchable = true,
  searchPlaceholder = "Search...",
  searchKeys = ["name", "email"], // Keys to search in
  filterable = false,
  filterKey, // Key to filter by (e.g., "role", "status")
  filterOptions = [], // [{ label: 'All', value: 'all' }, ...]
  onFilterChange,
  currentFilter,
  rowsPerPage = 10,
  emptyMessage = "No records found.",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Data
  const filteredData = data.filter((item) => {
    // 1. External Filter (if provided)
    if (filterable && currentFilter && currentFilter !== "all") {
      // logic for filtering
      if (filterKey) {
        const value = item[filterKey];
        if (value !== currentFilter) {
          return false;
        }
      }
    }

    // 2. Search
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return searchKeys.some((key) => {
      const value = item[key];
      return value && String(value).toLowerCase().includes(lowerTerm);
    });
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="dashboard-table-wrapper">
      {(searchable || filterable) && (
        <div className="table-controls compact-controls">
          {searchable && (
            <div className="search-bar compact-search">
              <Search size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on search
                }}
              />
            </div>
          )}
          {filterable && filterOptions.length > 0 && (
            <div className="filter-group compact-filter">
              <Filter size={16} />
              <select
                value={currentFilter}
                onChange={(e) => {
                  onFilterChange(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="table-container">
        <table className="data-table dashboard-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index} style={col.style}>
                  {col.header}
                </th>
              ))}
              {actions && <th style={{ textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((item, rowIndex) => (
                <tr key={item[keyField] || rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.render ? col.render(item) : item[col.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td>
                      <div className="table-actions">{actions(item)}</div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-center py-4"
                >
                  <div className="empty-state-compact">
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-compact">
          <button
            className="btn-icon btn-sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="pagination-numbers-compact">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`page-num-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="btn-icon btn-sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardTable;

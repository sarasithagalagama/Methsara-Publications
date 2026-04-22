// ============================================
// CategoryManager
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: CategoryManager page component
// ============================================
// Purpose: Category and classification management for products

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Package,
  Tags,
  BookOpen,
  GraduationCap,
  FileText,
  BarChart2,
} from "lucide-react";
import StatCard from "../../../components/dashboard/StatCard";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import "../../../components/dashboard/dashboard.css";

const CategoryManager = () => {
  // State Variables
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Side Effects
  useEffect(() => {
    fetchProducts();
  }, []);

  // Event Handlers
  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products");
      setProducts(res.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  // [E2.3] Category breakdown derived client-side by aggregating product.category values
  // No separate Category collection in the DB — categories are inferred from product data
  const MAIN_CATEGORIES = [
    "A/L",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Others",
  ];

  const categoryBreakdown = products.reduce((acc, p) => {
    let cat = p.category;

    // [E2.3] Fallback mapping: products created before the simplified category system
    // are re-classified using legacy grade/examType fields
    if (!cat || !MAIN_CATEGORIES.includes(cat)) {
      if (
        p.grade === "Grade 12" ||
        p.grade === "Grade 13" ||
        p.examType === "A/L"
      ) {
        cat = "A/L";
      } else if (p.grade && p.grade.startsWith("Grade")) {
        cat = p.grade;
      } else {
        cat = "Others";
      }
    }

    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const subjectGroups = products.reduce((acc, p) => {
    const subject = p.subject || "Other";
    acc[subject] = (acc[subject] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    // Render
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="Category Manager"
        subtitle="View product classifications and groupings"
      />

      {/* Summary Stats */}
      <div className="dashboard-grid dashboard-grid-3">
        <StatCard
          icon={<Package size={24} />}
          label="Total Products"
          value={products.length}
          variant="primary"
        />
        <StatCard
          icon={<Tags size={24} />}
          label="Active Categories"
          value={MAIN_CATEGORIES.length}
          variant="primary"
        />
        <StatCard
          icon={<BookOpen size={24} />}
          label="Distinct Subjects"
          value={Object.keys(subjectGroups).length}
          variant="warning"
        />
      </div>

      <div className="dashboard-grid dashboard-grid-2">
        {/* Category Breakdown Table */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="card-title">Categorical Distribution</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {MAIN_CATEGORIES.map((cat) => {
                  const count = categoryBreakdown[cat] || 0;
                  const percentage = products.length
                    ? Math.round((count / products.length) * 100)
                    : 0;
                  return (
                    <tr key={cat}>
                      <td>
                        <span
                          className="category-badge"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {cat}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{count}</span>{" "}
                        <span className="text-muted text-xs">Books</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{percentage}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject Insights */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="card-title">Subject Popularity</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Area</th>
                  <th>Books</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(subjectGroups)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([subject, count]) => {
                    const percentage = products.length
                      ? Math.round((count / products.length) * 100)
                      : 0;
                    return (
                      <tr key={subject}>
                        <td>{subject}</td>
                        <td>{count}</td>
                        <td>{percentage}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;

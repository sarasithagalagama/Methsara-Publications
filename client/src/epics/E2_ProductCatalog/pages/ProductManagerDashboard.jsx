// ============================================
// Product Manager Dashboard
// Epic: E2 - Product Catalog Management
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: Product management and review moderation
// ============================================

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../epics/E1_UserAndRoleManagement/context/AuthContext";
import {
  Package,
  Star,
  Plus,
  Filter,
  Edit,
  Trash2,
  LogOut,
  Search,
  BarChart2,
  Upload,
  Tags,
  Archive,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import StatCard from "../../../components/dashboard/StatCard";
import Modal from "../../../components/common/Modal";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import SalesChart from "../../../components/dashboard/charts/SalesChart";
import "../../../components/dashboard/dashboard.css";
import "./ProductManagerDashboard.css";
import StatusModal from "../../../components/common/StatusModal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { LogoutModal } from "../../../epics/E1_UserAndRoleManagement/components/Auth/AuthModals";

const ProductManagerDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  // [E2.1] Dashboard stats: totalProducts, archivedProducts, avgRating fetched on mount
  // State Variables
  const [stats, setStats] = useState({
    avgRating: 0,
    archivedProducts: 0,
  });
  const [products, setProducts] = useState([]);

  const [activeTab, setActiveTab] = useState("products");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // [E2.5] [E2.7] Product list supports search by term and filter by grade for the dashboard table
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Category State
  const [categories, setCategories] = useState([]);
  // Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({
    id: null,
    name: "",
    type: "", // 'product' or 'category'
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "primary",
  });
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    titleSinhala: "",
    author: "",
    description: "",
    price: "",
    subject: "",
    category: "Grade 6",
    image: "",
    backCoverImage: "",
    samplePagesImage: "",
    isbn: "",
    pageCount: 0,
    displayOrder: 0,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBackCover, setUploadingBackCover] = useState(false);
  const [uploadingSamplePages, setUploadingSamplePages] = useState(false);

  // Side Effects
  useEffect(() => {
    fetchDashboardData();
    fetchCategories();
    fetchSuppliers();
  }, []);

  const [suppliers, setSuppliers] = useState([]);

  // Event Handlers
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // only active material suppliers or all suppliers that provide books
      setSuppliers(res.data.suppliers || []);
    } catch (err) {
      console.error("Failed to load suppliers", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/products/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const handleArchiveProduct = async (product) => {
    setConfirmModal({
      isOpen: true,
      title: "Archive Product?",
      message: `Are you sure you want to archive "${product.title}"? It will be hidden from the catalog but kept in the system.`,
      variant: "warning",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const config = { headers: { Authorization: `Bearer ${token}` } };
          await axios.put(`/api/products/${product._id}/archive`, {}, config);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchDashboardData();
          setStatusModal({
            isOpen: true,
            type: "success",
            title: "Product Archived",
            message: "The product has been archived and hidden from customers.",
          });
        } catch (err) {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setStatusModal({
            isOpen: true,
            type: "error",
            title: "Archive Failed",
            message:
              err.response?.data?.error ||
              err.response?.data?.message ||
              "Failed to archive product.",
          });
        }
      },
    });
  };

  const handleUnarchiveProduct = async (product) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/products/${product._id}/unarchive`, {}, config);
      fetchDashboardData();
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Product Restored",
        message: `"${product.title}" is now visible in the catalog again.`,
      });
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Restore Failed",
        message: "Failed to unarchive product.",
      });
    }
  };

  const confirmDeleteProduct = (product) => {
    const isAdmin = user?.role === "admin";
    setConfirmModal({
      isOpen: true,
      title: isAdmin ? "Delete Product?" : "Request Deletion?",
      message: isAdmin
        ? `Are you sure you want to delete "${product.title}"? This will remove all associated data including sales history.`
        : `Are you sure you want to request deletion for "${product.title}"? This will be sent to the Inventory Manager for approval.`,
      variant: "danger",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const res = await axios.delete(
            `/api/products/${product._id}`,
            config,
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchDashboardData();
          setStatusModal({
            isOpen: true,
            type: "success",
            title: res.data.pendingApproval
              ? "Deletion Requested"
              : "Product Deleted",
            message: res.data.pendingApproval
              ? "Your deletion request has been submitted to the Inventory Manager for approval."
              : "The product has been permanently removed from the catalog.",
          });
        } catch (err) {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setStatusModal({
            isOpen: true,
            type: "error",
            title: "Action Failed",
            message:
              err.response?.data?.error ||
              err.response?.data?.message ||
              "Failed to process request.",
          });
        }
      },
    });
  };

  const executeDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (deleteConfig.type === "product") {
        await axios.delete(`/api/products/${deleteConfig.id}`, config);
        // alert("Product deleted successfully");
        fetchDashboardData();
      } else {
        await axios.delete(
          `/api/products/categories/${encodeURIComponent(deleteConfig.id)}`,
          config,
        );
        fetchCategories();
      }
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(`Error deleting ${deleteConfig.type}:`, err);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Action Failed",
        message:
          err.response?.data?.message ||
          `Failed to delete the ${deleteConfig.type}.`,
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const productsRes = await axios.get("/api/products?includeArchived=true&limit=1000");
      const allProducts = productsRes.data.products || [];

      const ratedProducts = allProducts.filter((p) => p.averageRating > 0);

      setStats({
        totalProducts: allProducts.filter((p) => !p.isArchived).length,
        avgRating:
          ratedProducts.length > 0
            ? (
                ratedProducts.reduce((s, p) => s + p.averageRating, 0) /
                ratedProducts.length
              ).toFixed(1)
            : "0.0",
        archivedProducts: allProducts.filter((p) => p.isArchived).length,
      });

      setProducts(allProducts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  // Reset to page 1 whenever filters/tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradeFilter, activeTab]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.titleSinhala?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.isbn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade =
      gradeFilter === "all" || product.category === gradeFilter;
    const matchesArchived = product.isArchived === (activeTab === "archived");
    return matchesSearch && matchesGrade && matchesArchived;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Real-time validation helper
  const validateField = (name, value) => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Book title is required";
        if (value.trim().length < 3)
          return "Title must be at least 3 characters";
        if (value.trim().length > 200)
          return "Title must be under 200 characters";
        return null;
      case "author":
        if (!value.trim()) return "Author name is required";
        if (value.trim().length < 2)
          return "Author name must be at least 2 characters";
        if (!/^[a-zA-Z\s.,]+$/.test(value))
          return "Author name can only contain letters, spaces, dots, and commas";
        return null;
      case "isbn": {
        if (!value.trim()) return "ISBN is required (unique book identifier)";
        const isbnClean = value.replace(/[-\s]/g, "");
        if (!/^[0-9]{10}$|^[0-9]{13}$/.test(isbnClean))
          return "Enter a valid ISBN-10 or ISBN-13 (e.g., 978-955-XXX-XX-X)";
        return null;
      }
      case "price":
        if (value === "" || value === null) return "Price is required";
        if (isNaN(value) || Number(value) <= 0)
          return "Price must be a positive number";
        if (Number(value) > 100000)
          return "Price seems too high — please verify";
        return null;
      case "subject":
        if (!value.trim()) return "Subject is required";
        return null;
      case "description":
        if (!value.trim()) return "Description is required";
        if (value.trim().length < 20)
          return "Description must be at least 20 characters";
        if (value.trim().length > 2000)
          return "Description must be under 2000 characters";
        return null;
      case "pageCount":
        if (Number(value) < 1) return "Page count must be at least 1";
        if (Number(value) > 9999) return "Page count seems too high";
        return null;
      case "displayOrder":
        if (Number(value) < 0) return "Display order cannot be negative";
        return null;
      case "titleSinhala":
        if (value && value.trim().length > 200)
          return "Sinhala title must be under 200 characters";
        return null;
      case "category":
        if (!value) return "Please select a category";
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;

    // Strict filtering for Author Name: only letters, spaces, dots, and commas
    if (name === "author" && type !== "checkbox") {
      value = value.replace(/[^a-zA-Z\s.,]/g, "");
    }

    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Instant real-time validation for a "premium" feel
    const err = type === "checkbox" ? null : validateField(name, newValue);
    setFormErrors((prev) => ({ ...prev, [name]: err }));
  };

  // Mark a field as touched on blur and run validation
  const handleBlur = (e) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") return;
    const err = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    if (type === "main") setUploadingImage(true);
    else setUploadingBackCover(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/upload", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setFormData((prev) => ({
        ...prev,
        [type === "main" ? "image" : "backCoverImage"]: res.data.url,
      }));
    } catch (error) {
      console.error("Upload error:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Upload Failed",
        message:
          "We encountered an error while uploading the image. Please try again or use a smaller file.",
      });
    } finally {
      if (type === "main") setUploadingImage(false);
      else if (type === "back") setUploadingBackCover(false);
      else if (type === "sample") setUploadingSamplePages(false);
    }
  };

  const validateForm = () => {
    const fields = [
      "title",
      "author",
      "isbn",
      "price",
      "subject",
      "description",
      "pageCount",
      "displayOrder",
      "titleSinhala",
      "category",
    ];
    const errors = {};
    fields.forEach((f) => {
      const e = validateField(f, formData[f] ?? "");
      if (e) errors[f] = e;
    });
    if (!formData.image) errors.image = "Main book cover image is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentProduct(null);
    setFormData({
      title: "",
      titleSinhala: "",
      author: "",
      description: "",
      price: "",
      subject: "",
      category: "Grade 6",
      image: "",
      backCoverImage: "",
      samplePagesImage: "",
      isbn: "",
      pageCount: 0,
      displayOrder: 0,
    });
    // Set all fields as 'null' to enable real-time validation tracking
    const initialErrors = {};
    [
      "title",
      "titleSinhala",
      "author",
      "isbn",
      "price",
      "subject",
      "description",
      "pageCount",
      "displayOrder",
      "category",
    ].forEach((f) => (initialErrors[f] = null));
    setFormErrors(initialErrors);
    setShowProductModal(true);
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setCurrentProduct(product);
    setFormData({
      title: product.title,
      titleSinhala: product.titleSinhala || "",
      author: product.author || "",
      description: product.description,
      price: product.price,
      subject: product.subject || "",
      category: product.category || "Grade 6",
      image: product.image || "",
      backCoverImage: product.backCoverImage || "",
      samplePagesImage: product.samplePagesImage || "",
      isbn: product.isbn || "",
      pageCount: product.pageCount || 0,
      displayOrder: product.displayOrder || 0,
    });

    // Run initial validation on edit to show current state
    const initialErrors = {};
    const fields = [
      "title",
      "titleSinhala",
      "author",
      "isbn",
      "price",
      "subject",
      "description",
      "pageCount",
      "displayOrder",
      "category",
    ];
    fields.forEach((f) => {
      initialErrors[f] = validateField(f, product[f] || "");
    });
    setFormErrors(initialErrors);
    setShowProductModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const submissionData = { ...formData };

      // Map simplified category to backend grade/examType
      if (submissionData.category === "A/L") {
        submissionData.grade = "Grade 12";
        submissionData.examType = "A/L";
      } else if (submissionData.category.startsWith("Grade ")) {
        submissionData.grade = submissionData.category;
        submissionData.examType =
          submissionData.category === "Grade 11" ? "O/L" : "General";
      } else {
        submissionData.grade = "Other";
        submissionData.examType = "Other";
      }

      // Trim text fields
      submissionData.title = submissionData.title.trim();
      submissionData.author = submissionData.author.trim();
      submissionData.isbn = submissionData.isbn.trim();
      submissionData.description = submissionData.description.trim();

      if (isEditing) {
        await axios.put(
          `/api/products/${currentProduct._id}`,
          submissionData,
          config,
        );
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "Update Successful",
          message: `Product "${formData.title}" has been updated successfully.`,
        });
      } else {
        await axios.post("/api/products", submissionData, config);
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "Product Created",
          message: `New product "${formData.title}" has been added to the catalog.`,
        });
      }
      setShowProductModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error("Error saving product:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Save Failed",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Could not save the product. Please check for errors.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deletion handled via confirmDeleteProduct and executeDelete

  const handleAnalyticsClick = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/products/${id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalyticsData(res.data.analytics);
      setShowAnalyticsModal(true);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Data Unavailable",
        message: "Failed to fetch sales analytics for this product.",
      });
    }
  };

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
        title="Product Manager Dashboard"
        subtitle="Manage catalog and reviews"
        actions={[
          {
            label: "Add Product",
            icon: <Plus size={18} />,
            onClick: handleAddClick,
            variant: "primary",
          },
        ]}
      />

      {/* Stats Grid */}
      <div className="dashboard-grid dashboard-grid-3">
        <StatCard
          icon={<Package size={24} />}
          label="Catalog Items"
          value={stats.totalProducts}
          variant="primary"
        />
        <StatCard
          icon={<Archive size={24} />}
          label="Archived Items"
          value={stats.archivedProducts}
          variant="warning"
          onClick={() => setActiveTab("archived")}
        />
        <StatCard
          icon={<Star size={24} />}
          label="Avg Rating"
          value={stats.avgRating}
          variant="success"
        />
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Catalog
        </button>
        <button
          className={`tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Category Insights
        </button>
        <button
          className={`tab-btn ${activeTab === "archived" ? "active" : ""}`}
          onClick={() => setActiveTab("archived")}
        >
          Archived Items
        </button>
      </div>

      {/* Content Area */}
      <div className="dashboard-card">
        {(activeTab === "products" || activeTab === "archived") && (
          <>
            <div className="dashboard-card-header">
              <h2 className="card-title">
                {activeTab === "products"
                  ? "Product Catalog"
                  : "Archived Items"}
              </h2>
            </div>

            <div className="table-controls">
              <div className="search-bar">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by title, ISBN or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <Filter size={18} />
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="A/L">A/L</option>
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <img
                          src={product.image || "/placeholder.png"}
                          alt={product.title}
                          className="product-thumb"
                          onError={(e) => {
                            e.target.src = "/placeholder.png";
                            e.target.onerror = null;
                          }}
                        />
                      </td>
                      <td>
                        <div className="product-cell">
                          <strong>{product.title}</strong>
                          <div className="text-muted text-xs">
                            {product.titleSinhala}
                          </div>
                          <span className="product-subtitle">
                            ISBN: {product.isbn}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>{product.author}</div>
                      </td>
                      <td>
                        <div className="category-badge">
                          {product.category || product.grade}
                        </div>
                      </td>
                      <td>Rs. {product.price}</td>
                      <td>
                        <span
                          className={`stock-badge ${product.stock > 10 ? "normal" : "low"}`}
                        >
                          {product.stock || 0}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            title="Analytics"
                            onClick={() => handleAnalyticsClick(product._id)}
                          >
                            <BarChart2 size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() => handleEditClick(product)}
                          >
                            <Edit size={16} />
                          </button>
                          {product.isArchived ? (
                            <button
                              className="btn-icon text-primary"
                              title="Restore Product"
                              onClick={() => handleUnarchiveProduct(product)}
                            >
                              <Plus size={18} />
                            </button>
                          ) : (
                            <button
                              className="btn-icon text-warning"
                              title="Archive Product"
                              onClick={() => handleArchiveProduct(product)}
                            >
                              <Package size={16} />
                            </button>
                          )}
                          <button
                            className="btn-icon text-error"
                            title="Delete Product"
                            onClick={() => confirmDeleteProduct(product)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="table-empty-state">
                  No products found matching your criteria.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="pagination-container"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <div
                  className="pagination-numbers"
                  style={{ display: "flex", gap: "0.25rem" }}
                >
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      className={`page-number${currentPage === i + 1 ? " active" : ""}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "categories" && (
          <>
            <div className="dashboard-card-header">
              <h2 className="card-title">Categorical Distribution</h2>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Book Count</th>
                    <th>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    "A/L",
                    "Grade 6",
                    "Grade 7",
                    "Grade 8",
                    "Grade 9",
                    "Grade 10",
                    "Grade 11",
                    "Others",
                  ].map((cat) => {
                    const count = products.filter((p) => {
                      if (p.category === cat) return true;
                      if (
                        cat === "A/L" &&
                        !p.category &&
                        (p.grade === "Grade 12" || p.grade === "Grade 13")
                      )
                        return true;
                      if (
                        cat === "Others" &&
                        !p.category &&
                        p.grade === "Other"
                      )
                        return true;
                      return false;
                    }).length;
                    const percentage = products.length
                      ? Math.round((count / products.length) * 100)
                      : 0;
                    return (
                      <tr key={cat}>
                        <td>
                          <div className="category-badge">{cat}</div>
                        </td>
                        <td>
                          <strong>{count}</strong>{" "}
                          <span className="text-muted text-xs">Products</span>
                        </td>
                        <td>
                          <div className="progress-bar-container">
                            <div
                              className="progress-bar"
                              style={{
                                width: `${percentage}%`,
                                background: "var(--gold-medium)",
                              }}
                            />
                            <span className="progress-label">
                              {percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={isEditing ? "Edit Book" : "Add New Book"}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} noValidate>
          {/* Required field legend */}
          <p className="form-required-note">
            Fields marked with <span className="req-star">*</span> are required.
          </p>

          {/* ── Section 1: Basic Information ── */}
          <div className="form-section">
            <div className="form-section-header">
              <span>Basic Information</span>
            </div>
            <div className="form-grid-2">
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>
                  Book Title (English)
                  <span className="req-star">*</span>
                  <span className="char-hint">{formData.title.length}/200</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={
                    formErrors.title
                      ? "error-input"
                      : formData.title.trim().length >= 3
                        ? "success-input"
                        : ""
                  }
                  placeholder="e.g., Grade 6 Science — Part 1"
                  maxLength={200}
                />
                {formErrors.title ? (
                  <span className="error-text">{formErrors.title}</span>
                ) : (
                  formData.title.trim().length >= 3 && (
                    <span className="success-text">Looks good</span>
                  )
                )}
              </div>

              <div className="form-group">
                <label>
                  Title (Sinhala)
                  <span className="field-hint">Optional</span>
                </label>
                <input
                  type="text"
                  name="titleSinhala"
                  value={formData.titleSinhala}
                  onChange={handleInputChange}
                  className={
                    formErrors.titleSinhala
                      ? "error-input"
                      : formData.titleSinhala.trim()
                        ? "success-input"
                        : ""
                  }
                  placeholder="6 ශ්‍රේණිය විද්‍යාව"
                  maxLength={200}
                />
                {formErrors.titleSinhala && (
                  <span className="error-text">{formErrors.titleSinhala}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Author Name
                  <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={
                    formErrors.author
                      ? "error-input"
                      : formData.author.trim().length >= 2
                        ? "success-input"
                        : ""
                  }
                  placeholder="e.g., Dr. A. B. Perera"
                />
                {formErrors.author ? (
                  <span className="error-text">{formErrors.author}</span>
                ) : (
                  formData.author.trim().length >= 2 && (
                    <span className="success-text">Looks good</span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* ── Section 2: Identification & Pricing ── */}
          <div className="form-section">
            <div className="form-section-header">
              <span>Identification &amp; Pricing</span>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>
                  ISBN
                  <span className="req-star">*</span>
                  <span className="field-hint">10 or 13 digits</span>
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={
                    formErrors.isbn
                      ? "error-input"
                      : (() => {
                          const c = formData.isbn.replace(/[-\s]/g, "");
                          return /^[0-9]{10}$|^[0-9]{13}$/.test(c) &&
                            formData.isbn
                            ? "success-input"
                            : "";
                        })()
                  }
                  placeholder="978-955-XXX-XX-X"
                />
                {formErrors.isbn ? (
                  <span className="error-text">{formErrors.isbn}</span>
                ) : (
                  (() => {
                    const c = formData.isbn.replace(/[-\s]/g, "");
                    return /^[0-9]{10}$|^[0-9]{13}$/.test(c) && formData.isbn;
                  })() && <span className="success-text">Valid ISBN</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Price (Rs.)
                  <span className="req-star">*</span>
                </label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">Rs.</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`has-prefix ${formErrors.price ? "error-input" : formData.price > 0 ? "success-input" : ""}`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {formErrors.price ? (
                  <span className="error-text">{formErrors.price}</span>
                ) : (
                  formData.price > 0 && (
                    <span className="success-text">
                      Rs. {Number(formData.price).toLocaleString()}
                    </span>
                  )
                )}
              </div>

              <div className="form-group">
                <label>
                  Page Count
                  <span className="field-hint">Optional</span>
                </label>
                <input
                  type="number"
                  name="pageCount"
                  value={formData.pageCount}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={formErrors.pageCount ? "error-input" : ""}
                  placeholder="e.g., 250"
                  min="1"
                  max="9999"
                />
                {formErrors.pageCount && (
                  <span className="error-text">{formErrors.pageCount}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Display Order
                  <span className="field-hint">Higher = shown first</span>
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={formErrors.displayOrder ? "error-input" : ""}
                  placeholder="0"
                  min="0"
                />
                {formErrors.displayOrder && (
                  <span className="error-text">{formErrors.displayOrder}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 3: Classification ── */}
          <div className="form-section">
            <div className="form-section-header">
              <span>Classification</span>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>
                  Subject
                  <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={
                    formErrors.subject
                      ? "error-input"
                      : formData.subject.trim()
                        ? "success-input"
                        : ""
                  }
                  placeholder="e.g., Science, Mathematics"
                />
                {formErrors.subject ? (
                  <span className="error-text">{formErrors.subject}</span>
                ) : (
                  formData.subject.trim() && (
                    <span className="success-text">Looks good</span>
                  )
                )}
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label-bold">
                  Select Category <span className="req-star">*</span>
                </label>
                <div className="category-selection-grid">
                  {[
                    "A/L",
                    "Grade 6",
                    "Grade 7",
                    "Grade 8",
                    "Grade 9",
                    "Grade 10",
                    "Grade 11",
                    "Others",
                  ].map((cat) => (
                    <div
                      key={cat}
                      className={`category-option ${formData.category === cat ? "active" : ""}`}
                      onClick={() =>
                        handleInputChange({
                          target: { name: "category", value: cat },
                        })
                      }
                    >
                      <div className="radio-circle">
                        {formData.category === cat && (
                          <div className="radio-inner" />
                        )}
                      </div>
                      <span className="category-label">{cat}</span>
                    </div>
                  ))}
                </div>
                {formErrors.category && (
                  <span className="error-text">{formErrors.category}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 4: Cover Images ── */}
          <div className="form-section">
            <div className="form-section-header">
              <span>Cover Images</span>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>
                  Front Cover
                  <span className="req-star">*</span>
                </label>
                <div
                  className={`upload-box ${formErrors.image ? "error-border" : formData.image ? "upload-box-success" : ""}`}
                  onClick={() =>
                    document.getElementById("mainCoverInput").click()
                  }
                >
                  {formData.image ? (
                    <div className="preview-container">
                      <img
                        src={formData.image}
                        alt="Main Cover"
                        onError={(e) => {
                          e.target.src = "/placeholder.png";
                          e.target.onerror = null;
                        }}
                      />
                      <div className="change-overlay">
                        <Upload size={18} /> Change Image
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      {uploadingImage ? (
                        <div className="loader small"></div>
                      ) : (
                        <>
                          <Upload size={28} />
                          <span>Click to Upload Front Cover</span>
                          <span className="upload-sub">
                            JPG, PNG, WEBP — max 5 MB
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    id="mainCoverInput"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "main")}
                  />
                </div>
                {formErrors.image && (
                  <span className="error-text">{formErrors.image}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Back Cover
                  <span className="field-hint">Optional</span>
                </label>
                <div
                  className={`upload-box ${formData.backCoverImage ? "upload-box-success" : ""}`}
                  onClick={() =>
                    document.getElementById("backCoverInput").click()
                  }
                >
                  {formData.backCoverImage ? (
                    <div className="preview-container">
                      <img
                        src={formData.backCoverImage}
                        alt="Back Cover"
                        onError={(e) => {
                          e.target.src = "/placeholder.png";
                          e.target.onerror = null;
                        }}
                      />
                      <div className="change-overlay">
                        <Upload size={18} /> Change Image
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      {uploadingBackCover ? (
                        <div className="loader small"></div>
                      ) : (
                        <>
                          <Upload size={28} />
                          <span>Click to Upload Back Cover</span>
                          <span className="upload-sub">
                            JPG, PNG, WEBP — max 5 MB
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    id="backCoverInput"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "back")}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Sample Pages
                  <span className="field-hint">Optional</span>
                </label>
                <div
                  className={`upload-box ${formData.samplePagesImage ? "upload-box-success" : ""}`}
                  onClick={() =>
                    document.getElementById("samplePagesInput").click()
                  }
                >
                  {formData.samplePagesImage ? (
                    <div className="preview-container">
                      <img src={formData.samplePagesImage} alt="Sample Pages" />
                      <div className="change-overlay">
                        <Upload size={18} /> Change Image
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      {uploadingSamplePages ? (
                        <div className="loader small"></div>
                      ) : (
                        <>
                          <Upload size={28} />
                          <span>Click to Upload Sample Pages</span>
                          <span className="upload-sub">
                            JPG, PNG, WEBP — max 5 MB
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    id="samplePagesInput"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "sample")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 5: Description ── */}
          <div className="form-section">
            <div className="form-section-header">
              <span>Book Description</span>
            </div>

            <div className="form-group">
              <label>
                Book Description
                <span className="req-star">*</span>
                <span className="char-hint">
                  {formData.description.length}/2000
                  {formData.description.length > 0 &&
                    formData.description.length < 20 && (
                      <span className="char-warn"> (min 20)</span>
                    )}
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={
                  formErrors.description
                    ? "error-input"
                    : formData.description.trim().length >= 20
                      ? "success-input"
                      : ""
                }
                rows="5"
                placeholder="Write a comprehensive description — include topic coverage, target audience, and key highlights..."
                maxLength={2000}
              />
              {formErrors.description ? (
                <span className="error-text">{formErrors.description}</span>
              ) : (
                formData.description.trim().length >= 20 && (
                  <span className="success-text">Looks good</span>
                )
              )}
            </div>
          </div>

          {/* ── Footer Actions ── */}
          <div className="dash-modal-actions" style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowProductModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Update Book"
                  : "Add Book to Catalog"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAnalyticsModal && !!analyticsData}
        onClose={() => setShowAnalyticsModal(false)}
        title="Book Insights"
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, color: "var(--primary-dark)" }}>
            {analyticsData?.productTitle}
          </h3>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>
            ISBN: {analyticsData?.isbn}
          </span>
        </div>

        <div
          className="analytics-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            className="analytics-item"
            style={{
              padding: "1rem",
              background: "var(--bg-color)",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <label
              style={{ fontSize: "0.85rem", color: "#666", display: "block" }}
            >
              Total Views
            </label>
            <div
              className="value"
              style={{ fontSize: "1.5rem", fontWeight: "bold" }}
            >
              {analyticsData?.viewCount}
            </div>
          </div>
          <div
            className="analytics-item"
            style={{
              padding: "1rem",
              background: "var(--bg-color)",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <label
              style={{ fontSize: "0.85rem", color: "#666", display: "block" }}
            >
              Units Sold
            </label>
            <div
              className="value"
              style={{ fontSize: "1.5rem", fontWeight: "bold" }}
            >
              {analyticsData?.purchaseCount}
            </div>
          </div>
          <div
            className="analytics-item"
            style={{
              padding: "1rem",
              background: "var(--bg-color)",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <label
              style={{ fontSize: "0.85rem", color: "#666", display: "block" }}
            >
              Avg Rating
            </label>
            <div
              className="value"
              style={{ fontSize: "1.5rem", fontWeight: "bold" }}
            >
              {analyticsData?.averageRating} / 5
            </div>
          </div>
          <div
            className="analytics-item"
            style={{
              padding: "1rem",
              background: "var(--bg-color)",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <label
              style={{ fontSize: "0.85rem", color: "#666", display: "block" }}
            >
              Conversion
            </label>
            <div
              className="value"
              style={{ fontSize: "1.5rem", fontWeight: "bold" }}
            >
              {analyticsData?.conversionRate}%
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ marginBottom: "1rem", color: "#444" }}>
            Sales Trend (Last 7 Days)
          </h4>
          <div style={{ height: "250px" }}>
            <SalesChart
              data={analyticsData?.salesTrend?.data || [0, 0, 0, 0, 0, 0, 0]}
              labels={
                analyticsData?.salesTrend?.labels || [
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                  "Sun",
                ]
              }
            />
          </div>
        </div>

        <div className="dash-modal-actions">
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={() => setShowAnalyticsModal(false)}
          >
            Close Insights
          </button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
          navigate("/");
        }}
      />

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
};

export default ProductManagerDashboard;

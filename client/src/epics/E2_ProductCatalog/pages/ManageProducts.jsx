// ============================================
// ManageProducts Component
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: Product Manager dashboard for CRUD operations (E2.3)
// ============================================

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Star, Edit, Trash2, Plus, Upload } from "lucide-react";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import DashboardSection from "../../../components/dashboard/DashboardSection";
import DashboardTable from "../../../components/dashboard/DashboardTable";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import StatusModal from "../../../components/common/StatusModal";
import {
  Input,
  Select,
  Button,
  TextArea,
} from "../../../components/common/Forms";
import "../../../components/dashboard/dashboard.css";
import { useAuth } from "../../../epics/E1_UserAndRoleManagement/context/AuthContext";
// import "./ManageProducts.css"; // Removing custom CSS in favor of standard

const ManageProducts = ({ isTab = false }) => {
  const { user } = useAuth();
  // [E1.6] RBAC: isTab=true embeds this inside a dashboard tab; isAdmin=true unlocks delete
  const isAdmin = user?.role === "admin";
  // State Variables
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    titleSinhala: "",
    author: "",
    description: "",
    isbn: "",
    price: "",
    subject: "",
    category: "Grade 6",
    pageCount: 0,
    image: "",
  });
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
  });
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const closeConfirm = () => setConfirmModal({ isOpen: false, id: null });

  // Side Effects
  useEffect(() => {
    fetchProducts();
  }, []);

  // Event Handlers
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/products");
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === "author") {
      value = value.replace(/[^a-zA-Z\s.,]/g, "");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // [E2.3] Client-side validation: ensures required fields are filled and price is positive before API call
  const validateProductForm = () => {
    if (!formData.title.trim()) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        message: "Book title is required.",
      });
      return false;
    }
    if (!formData.isbn.trim() || formData.isbn.trim().length < 3) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        message: "A valid ISBN is required (min 3 characters).",
      });
      return false;
    }
    if (!formData.author.trim()) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        message: "Author name is required.",
      });
      return false;
    }
    if (!formData.description.trim()) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        message: "Book description is required.",
      });
      return false;
    }
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        message: "Price must be greater than Rs. 0.",
      });
      return false;
    }
    if (!formData.subject.trim()) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Validation Error",
        message: "Subject is required.",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateProductForm()) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const submissionData = { ...formData };

      // [E2.3] Category-to-grade mapping: the UI presents simplified Sri Lanka education categories
      // but the backend stores grade (Grade 12, etc.) and examType (A/L, O/L, General) separately
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

      if (editingProduct) {
        await axios.put(
          `/api/products/${editingProduct._id}`,
          submissionData,
          config,
        );
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "Update Successful",
          message: "Book details have been updated successfully!",
        });
      } else {
        await axios.post("/api/products", submissionData, config);
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "Book Created",
          message: "The new book has been added to the catalog!",
        });
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Save Failed",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      titleSinhala: product.titleSinhala || "",
      author: product.author || "",
      description: product.description,
      isbn: product.isbn,
      price: product.price,
      subject: product.subject || "",
      category: product.category || product.grade || "Grade 6",
      pageCount: product.pageCount || 0,
      image: product.image || "",
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const processDelete = async () => {
    const id = confirmModal.id;
    closeConfirm();
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // alert("Book deleted successfully!"); // Replacing alert with toast if available, otherwise just silent
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  // [E2.2] Image upload — multipart/form-data POST to /api/upload, max 5MB, returns hosted image URL
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "File Too Large",
        message: "The selected image exceeds the 5MB limit.",
      });
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);
    setUploading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/upload", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setFormData((prev) => ({ ...prev, image: res.data.url }));
    } catch (error) {
      console.error("Upload error:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Upload Failed",
        message: "Could not upload the image. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      titleSinhala: "",
      author: "",
      description: "",
      isbn: "",
      price: "",
      subject: "",
      category: "Grade 6",
      pageCount: 0,
      image: "",
    });
  };

  const productColumns = [
    {
      header: "Book Details",
      accessor: "title",
      render: (product) => (
        <div
          className="product-info-cell"
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          {product.image && (
            <img
              src={product.image}
              alt={product.title}
              className="product-thumb"
              style={{
                width: "48px",
                height: "64px",
                objectFit: "cover",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)",
              }}
            />
          )}
          <div>
            <div
              className="product-title"
              style={{ fontWeight: 600, color: "var(--text-primary)" }}
            >
              {product.title}
            </div>
            <div
              className="product-subtitle"
              style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
            >
              {product.titleSinhala}
            </div>
            <div
              className="product-meta"
              style={{
                fontSize: "0.75rem",
                color: "var(--text-light)",
                marginTop: "2px",
              }}
            >
              ISBN: {product.isbn}
            </div>
          </div>
        </div>
      ),
    },
    { header: "Author", accessor: "author" },
    {
      header: "Category",
      accessor: "category",
      render: (p) => (
        <span className="category-badge">{p.category || p.grade}</span>
      ),
    },
    { header: "Subject", accessor: "subject" },
    {
      header: "Price",
      accessor: "price",
      render: (product) => `Rs. ${Number(product.price).toFixed(2)}`,
    },
    {
      header: "Rating",
      accessor: "averageRating",
      render: (product) => (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Star size={14} fill="#fbbf24" stroke="none" />
          <span>{product.averageRating || 0}</span>
          <span style={{ color: "var(--text-light)", fontSize: "0.8rem" }}>
            ({product.totalReviews || 0})
          </span>
        </div>
      ),
    },
  ];

  // Render
  return (
    <div className={isTab ? "" : "dashboard-container"}>
      {!isTab && (
        <DashboardHeader
          title="Manage Products"
          subtitle="Maintain and update the methsara publications product catalog"
          actions={
            !isAdmin
              ? [
                  {
                    label: "Add New Book",
                    icon: <Plus size={18} />,
                    onClick: () => {
                      setShowForm(true);
                      setEditingProduct(null);
                      resetForm();
                    },
                    variant: "primary",
                  },
                ]
              : []
          }
        />
      )}

      <DashboardSection>
        <DashboardTable
          columns={productColumns}
          data={products}
          loading={loading}
          searchable={true}
          searchKeys={[
            "title",
            "titleSinhala",
            "author",
            "isbn",
            "category",
            "subject",
          ]}
          rowsPerPage={10}
          actions={(product) => (
            <div className="table-actions">
              {!isAdmin && (
                <>
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(product)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDelete(product._id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        />
      </DashboardSection>

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title={editingProduct ? "Edit Book" : "Add New Book"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="dashboard-form">
            <div className="form-row">
              <Input
                label="Book Title (English)"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
              <Input
                label="ISBN (Unique)"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <Input
                label="Title (Sinhala)"
                name="titleSinhala"
                value={formData.titleSinhala}
                onChange={handleInputChange}
              />
              <Input
                label="Author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
              />
            </div>

            <TextArea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
            />

            <div className="form-row">
              <Input
                label="Price (Rs.)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                required
              />
              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                options={[
                  { value: "A/L", label: "A/L" },
                  { value: "Grade 6", label: "Grade 6" },
                  { value: "Grade 7", label: "Grade 7" },
                  { value: "Grade 8", label: "Grade 8" },
                  { value: "Grade 9", label: "Grade 9" },
                  { value: "Grade 10", label: "Grade 10" },
                  { value: "Grade 11", label: "Grade 11" },
                  { value: "Others", label: "Others" },
                ]}
              />
            </div>

            <div className="form-row">
              <Input
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <Input
                label="Page Count"
                name="pageCount"
                type="number"
                value={formData.pageCount}
                onChange={handleInputChange}
                min="0"
              />
              <div className="form-group"></div>{" "}
              {/* Spacer for grid alignment */}
            </div>

            <div className="form-group">
              <label className="form-label">Book Cover Image</label>
              <div
                className="file-upload-container"
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                <label
                  className="btn btn-secondary"
                  style={{ cursor: "pointer" }}
                >
                  <Upload size={16} />
                  {uploading ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                    disabled={uploading}
                  />
                </label>
                {formData.image && (
                  <div className="image-preview">
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{
                        width: "60px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="dash-modal-actions">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {editingProduct ? "Update Book" : "Create Book"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={processDelete}
        title="Delete Book"
        message="Are you sure you want to delete this book? This action cannot be undone."
        confirmText="Delete Book"
        variant="danger"
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

export default ManageProducts;

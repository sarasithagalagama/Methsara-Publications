// ============================================
// GiftVoucherManagement
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: GiftVoucherManagement page component
// ============================================
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Tag,
  Gift,
  Trash2,
  Library,
  BookOpen,
  Upload,
  Edit,
  Save,
} from "lucide-react";
import Modal from "../../../../components/common/Modal";
import StatusModal from "../../../../components/common/StatusModal";
import ConfirmModal from "../../../../components/common/ConfirmModal";
import {
  Input,
  Select,
  Button,
  TextArea,
} from "../../../../components/common/Forms";

const GiftVoucherManagement = () => {
  // State Variables
  // [E6.4] Two tabs: 'products' manages the voucher catalog (purchasable gift cards); 'issued' tracks redeemed codes
  const [activeTab, setActiveTab] = useState("products");
  const [voucherProducts, setVoucherProducts] = useState([]);
  const [issuedVouchers, setIssuedVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Voucher Product Form
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "Gift Voucher for Methsara Publications",
    image: "/assets/gift_voucher_premium.png",
  });

  // New Issued Voucher Form
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newIssuedVoucher, setNewIssuedVoucher] = useState({
    value: "",
    expiryDate: "",
    recipientEmail: "",
    recipientName: "",
    message: "",
  });

  // Form Errors
  const [issuedVoucherErrors, setIssuedVoucherErrors] = useState({});
  const [productErrors, setProductErrors] = useState({});

  // Side Effects
  useEffect(() => {
    fetchVoucherProducts();
    if (activeTab === "issued") {
      fetchIssuedVouchers();
    }
  }, [activeTab]);

  // Event Handlers
  const fetchVoucherProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/gift-vouchers/products");
      setVoucherProducts(res.data.products || []);
    } catch (error) {
      console.error("Error fetching voucher products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssuedVouchers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/gift-vouchers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssuedVouchers(res.data.vouchers || []);
    } catch (error) {
      console.error("Error fetching issued vouchers:", error);
    }
  };

  const validateIssuedVoucher = (name, value) => {
    let error = "";
    if (name === "value") {
      if (!value) error = "Value is required";
      else if (Number(value) < 100) error = "Minimum value is Rs. 100";
    } else if (name === "expiryDate") {
      if (!value) error = "Expiry date is required";
      else {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today) error = "Expiry date must be in the future";
      }
    } else if (name === "recipientEmail" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) error = "Invalid email format";
    } else if (name === "recipientName" && value) {
      if (value.length < 2) error = "Name is too short";
    }
    return error;
  };

  const handleIssuedVoucherInputChange = (e) => {
    let { name, value } = e.target;

    // Restrict Recipient Name to letters and spaces only
    if (name === "recipientName") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setNewIssuedVoucher((prev) => ({ ...prev, [name]: value }));

    const error = validateIssuedVoucher(name, value);
    setIssuedVoucherErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateProduct = (name, value) => {
    let error = "";
    if (name === "name") {
      if (!value) error = "Voucher name is required";
      else if (value.length < 3) error = "Name must be at least 3 characters";
    } else if (name === "price") {
      if (!value) error = "Price is required";
      else if (Number(value) < 100) error = "Minimum price is Rs. 100";
    }
    return error;
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));

    const error = validateProduct(name, value);
    setProductErrors((prev) => ({ ...prev, [name]: error }));
  };

  const uploadImageHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setUploadingImage(true);

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.post("/api/upload", formData, config);
      setNewProduct({ ...newProduct, image: data.url });
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to upload voucher image. Please try again.";

      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Upload Failed",
        message: errorMessage,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    // Validate all fields
    const errors = {};
    Object.keys(newProduct).forEach((key) => {
      const error = validateProduct(key, newProduct[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setProductErrors(errors);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const productData = {
        ...newProduct,
        isActive: true,
      };

      await axios.post("/api/gift-vouchers/products", productData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Voucher Created!",
        message:
          "The new gift voucher type has been successfully added to the store.",
      });

      fetchVoucherProducts();
      setNewProduct({
        name: "",
        description: "Gift Voucher for Methsara Publications",
        price: "",
        image: "/assets/gift_voucher_premium.png",
      });
    } catch (error) {
      console.error("Error creating voucher product:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Creation Failed",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create voucher product. Please try again.",
      });
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct({ ...product });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/gift-vouchers/products/${editingProduct._id}`,
        editingProduct,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Voucher Updated",
        message: "The gift voucher details have been successfully updated.",
      });

      setShowEditModal(false);
      fetchVoucherProducts();
    } catch (error) {
      console.error("Error updating voucher product:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: error.response?.data?.message || "Failed to update voucher.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (product) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Voucher Product?",
      message: `Are you sure you want to remove "${product.name}"? This will remove it from the store catalog.`,
      onConfirm: () => handleDelete(product._id),
    });
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/gift-vouchers/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConfirmModal({ ...confirmModal, isOpen: false });
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Product Removed",
        message: "The voucher product has been successfully deleted.",
      });
      fetchVoucherProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      setConfirmModal({ ...confirmModal, isOpen: false });
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Deletion Failed",
        message: error.response?.data?.message || "Failed to delete product.",
      });
    }
  };

  const confirmIssuedVoucherDelete = (voucher) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Issued Voucher?",
      message: `Are you sure you want to delete the voucher code "${voucher.code}"? This will invalidate the voucher.`,
      onConfirm: () => handleIssuedVoucherDelete(voucher._id),
    });
  };

  const handleIssuedVoucherDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/gift-vouchers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConfirmModal({ ...confirmModal, isOpen: false });
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Voucher Invalidated",
        message: "The issued gift voucher has been successfully deleted.",
      });
      fetchIssuedVouchers();
    } catch (error) {
      console.error("Error deleting issued voucher:", error);
      setConfirmModal({ ...confirmModal, isOpen: false });
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Deactivation Failed",
        message:
          error.response?.data?.message || "Failed to delete the voucher.",
      });
    }
  };

  const handleCreateIssuedVoucher = async (e) => {
    e.preventDefault();

    // Validate all fields
    const errors = {};
    Object.keys(newIssuedVoucher).forEach((key) => {
      const error = validateIssuedVoucher(key, newIssuedVoucher[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setIssuedVoucherErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/gift-vouchers", newIssuedVoucher, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Voucher Issued",
        message:
          "The new gift voucher has been successfully created and issued.",
      });

      setShowIssueModal(false);
      fetchIssuedVouchers();
      setNewIssuedVoucher({
        value: "",
        expiryDate: "",
        recipientEmail: "",
        recipientName: "",
        message: "",
      });
    } catch (error) {
      console.error("Error creating issued voucher:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create gift voucher. Please check all fields.";

      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Creation Failed",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render
  return (
    <div className="gift-voucher-management">
      <div className="dashboard-tabs" style={{ marginBottom: "2rem" }}>
        <button
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Library size={18} /> Store Vouchers (Products)
        </button>
        <button
          className={`tab-btn ${activeTab === "issued" ? "active" : ""}`}
          onClick={() => setActiveTab("issued")}
        >
          <Tag size={18} /> Issued Vouchers (Codes)
        </button>
      </div>

      {activeTab === "issued" && (
        <Button
          variant="primary"
          onClick={() => setShowIssueModal(true)}
          style={{ margin: "0 1.5rem 1.5rem 1.5rem" }}
        >
          <Plus size={18} style={{ marginRight: "8px" }} /> Create Gift Voucher
        </Button>
      )}

      <div className="tab-content">
        {activeTab === "products" ? (
          <div className="voucher-products-section">
            <div
              className="dashboard-card"
              style={{ padding: "1.5rem 2rem", marginBottom: "2rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "2rem",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    background: "var(--primary-alpha)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary-color)",
                  }}
                >
                  <Plus size={22} />
                </div>
                <div>
                  <h3
                    className="card-title"
                    style={{ margin: 0, fontSize: "1.2rem" }}
                  >
                    Create New Voucher Type
                  </h3>
                  <p
                    className="text-muted"
                    style={{ fontSize: "0.85rem", margin: 0 }}
                  >
                    Add a new gift card option to your store
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateProduct}>
                <div className="form-grid-2">
                  <Input
                    label="Voucher Name"
                    name="name"
                    placeholder="e.g. Rs. 1000 Gift Card"
                    value={newProduct.name}
                    onChange={handleProductInputChange}
                    error={productErrors.name}
                    required
                  />
                  <Input
                    label="Value (Rs.)"
                    name="price"
                    type="number"
                    placeholder="1000"
                    value={newProduct.price}
                    onChange={handleProductInputChange}
                    error={productErrors.price}
                    required
                  />
                </div>
                <div
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      className="form-label"
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "var(--text-color)",
                      }}
                    >
                      Voucher Image
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                      }}
                    >
                      {newProduct.image && (
                        <div
                          style={{
                            width: "50px",
                            height: "65px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            border: "1px solid var(--border-color)",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={newProduct.image}
                            alt="Preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        id="image-upload"
                        onChange={uploadImageHandler}
                        style={{ display: "none" }}
                        accept="image/*"
                      />
                      <label htmlFor="image-upload">
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() =>
                            document.getElementById("image-upload").click()
                          }
                          style={{ margin: 0 }}
                        >
                          <Upload size={18} style={{ marginRight: "8px" }} />{" "}
                          Upload
                        </Button>
                      </label>
                      {uploadingImage && (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Uploading...
                        </span>
                      )}
                      {newProduct.image &&
                        newProduct.image !==
                          "/assets/gift_voucher_premium.png" && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--success-color)",
                            }}
                          >
                            Custom image set!
                          </span>
                        )}
                    </div>
                  </div>
                  <div style={{ width: "200px" }}>
                    <Button type="submit" variant="primary" block>
                      <Plus size={18} /> Create to Store
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: "var(--primary-alpha)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary-color)",
                }}
              >
                <Library size={18} />
              </div>
              <h3 className="card-title" style={{ margin: 0 }}>
                Available in Store
              </h3>
            </div>

            <div className="category-cards-grid">
              {voucherProducts.map((product) => (
                <div key={product._id} className="category-card">
                  <div className="category-card-icon">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      <Gift size={24} />
                    )}
                  </div>
                  <div className="category-card-info">
                    <h4>{product.name}</h4>
                    <span>Rs. {product.price}</span>
                  </div>
                  <div className="category-card-actions">
                    <button
                      className="btn-icon"
                      title="Edit"
                      onClick={() => handleEditClick(product)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon text-error-light"
                      title="Delete"
                      onClick={() => confirmDelete(product)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {voucherProducts.length === 0 && !loading && (
                <div
                  className="full-width text-muted"
                  style={{ textAlign: "center", padding: "3rem" }}
                >
                  <BookOpen
                    size={48}
                    style={{ opacity: 0.2, marginBottom: "1rem" }}
                  />
                  <p>No voucher products found in store.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="issued-vouchers-section card-body">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Value</th>
                    <th>Balance</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedVouchers.map((voucher) => (
                    <tr key={voucher._id}>
                      <td>
                        <code
                          style={{
                            background: "var(--bg-color)",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontWeight: "600",
                          }}
                        >
                          {voucher.code}
                        </code>
                      </td>
                      <td>Rs. {voucher.value}</td>
                      <td>Rs. {voucher.balance}</td>
                      <td>
                        {new Date(voucher.expiryDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${voucher.isActive ? "active" : "inactive"}`}
                        >
                          {voucher.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon text-error"
                          title="Delete Voucher"
                          onClick={() => confirmIssuedVoucherDelete(voucher)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {issuedVouchers.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: "4rem" }}
                        className="text-muted"
                      >
                        <Tag
                          size={48}
                          style={{ opacity: 0.2, marginBottom: "1rem" }}
                        />
                        <p>No vouchers have been issued yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Voucher Product"
          size="lg"
        >
          <form onSubmit={handleUpdateProduct}>
            <div className="form-grid-2">
              <Input
                label="Voucher Name"
                value={editingProduct?.name}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    name: e.target.value,
                  })
                }
                required
              />
              <Input
                label="Value (Rs.)"
                type="number"
                value={editingProduct?.price}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    price: e.target.value,
                  })
                }
                required
              />
            </div>
            <div style={{ marginTop: "1rem" }}>
              <TextArea
                label="Description"
                rows={3}
                value={editingProduct?.description}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="dash-modal-actions" style={{ marginTop: "2rem" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                <Save size={18} /> Update Voucher
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Issue Voucher Modal */}
      {showIssueModal && (
        <Modal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          title="Issue New Gift Voucher"
          size="lg"
        >
          <form onSubmit={handleCreateIssuedVoucher}>
            <div className="form-grid-2">
              <Input
                label="Voucher Value (Rs.)"
                name="value"
                type="number"
                value={newIssuedVoucher.value}
                onChange={handleIssuedVoucherInputChange}
                error={issuedVoucherErrors.value}
                required
                min="100"
              />
              <Input
                label="Expiry Date"
                name="expiryDate"
                type="date"
                value={newIssuedVoucher.expiryDate}
                onChange={handleIssuedVoucherInputChange}
                error={issuedVoucherErrors.expiryDate}
                required
                min={new Date().toISOString().split("T")[0]}
              />
              <Input
                label="Recipient Name (Optional)"
                name="recipientName"
                value={newIssuedVoucher.recipientName}
                onChange={handleIssuedVoucherInputChange}
                error={issuedVoucherErrors.recipientName}
              />
              <Input
                label="Recipient Email (Optional)"
                name="recipientEmail"
                type="email"
                value={newIssuedVoucher.recipientEmail}
                onChange={handleIssuedVoucherInputChange}
                error={issuedVoucherErrors.recipientEmail}
              />
            </div>
            <div style={{ marginTop: "1rem" }}>
              <TextArea
                label="Personal Message (Optional)"
                name="message"
                rows={3}
                value={newIssuedVoucher.message}
                onChange={handleIssuedVoucherInputChange}
                error={issuedVoucherErrors.message}
              />
            </div>
            <div className="dash-modal-actions" style={{ marginTop: "2rem" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowIssueModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                <Gift size={18} /> Issue Voucher
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
      />

      {/* Status Modal */}
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

export default GiftVoucherManagement;

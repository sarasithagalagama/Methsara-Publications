// ============================================
// AdminUsers
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: AdminUsers page component
// ============================================
// Purpose: Full Admin User Management Page

import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus, Edit, Ban, Eye, CheckCircle, KeyRound } from "lucide-react";
import Modal from "../../../components/common/Modal";
import StatusModal from "../../../components/common/StatusModal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { Input, Select, Button } from "../../../components/common/Forms";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import DashboardSection from "../../../components/dashboard/DashboardSection";
import DashboardTable from "../../../components/dashboard/DashboardTable";
import "../../../components/dashboard/dashboard.css";
import "./AdminDashboard.css";

const AdminUsers = () => {
  // ─────────────────────────────────
  // State Variables
  // ─────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "primary",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "location_inventory_manager",
    assignedLocation: "Main",
    dateOfBirth: "",
    address: "",
    city: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    hireDate: new Date().toISOString().split("T")[0],
    nic: "",
    nicFrontImage: null,
    nicBackImage: null,
  });

  // ─────────────────────────────────
  // Side Effects
  // ─────────────────────────────────
  useEffect(() => {
    fetchUsers();
  }, []);

  // ─────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceReset = async (userId) => {
    setConfirmModal({
      isOpen: true,
      title: "Force Password Reset?",
      message:
        "Are you sure you want to force this user to reset their password? They will be locked out of the system until they set a new password upon their next login attempt.",
      variant: "primary",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/auth/users/${userId}/force-reset`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setStatusModal({
            isOpen: true,
            type: "success",
            title: "Reset Requested",
            message:
              "The user has been successfully flagged for a password reset.",
          });
        } catch (error) {
          console.error("Error requesting password reset:", error);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setStatusModal({
            isOpen: true,
            type: "error",
            title: "Action Failed",
            message:
              error.response?.data?.message ||
              "Failed to request password reset. Please try again.",
          });
        }
      },
    });
  };

  const handleDeactivateUser = (userId) => {
    setConfirmModal({
      isOpen: true,
      title: "Deactivate User?",
      message:
        "Are you sure you want to deactivate this user account? They will lose access to the system immediately.",
      variant: "danger",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/auth/users/${userId}/deactivate`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchUsers();
          setStatusModal({
            isOpen: true,
            type: "success",
            title: "User Deactivated",
            message: "The user has been successfully deactivated.",
          });
        } catch (error) {
          console.error("Error deactivating user:", error);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setStatusModal({
            isOpen: true,
            type: "error",
            title: "Action Failed",
            message: "Failed to deactivate user. Please try again.",
          });
        }
      },
    });
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone || "",
      role: user.role,
      assignedLocation: user.assignedLocation || "Main",
      nic: user.nic || "",
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      address: user.address || "",
      city: user.city || "",
      emergencyContactName: user.emergencyContactName || "",
      emergencyContactPhone: user.emergencyContactPhone || "",
      hireDate: user.hireDate
        ? new Date(user.hireDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      nicFrontImage: user.nicFrontImage || null,
      nicBackImage: user.nicBackImage || null,
    });
    setFormErrors({});
  };

  const validateEditForm = () => {
    const errors = {};
    const nameRegex = /^[a-zA-Z\s]*$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    const nicOldRegex = /^\d{9}[VXvx]$/;
    const nicNewRegex = /^\d{12}$/;

    if (!formData.name.trim()) errors.name = "Name is required";
    else if (!nameRegex.test(formData.name))
      errors.name = "Name must not contain numbers or special characters";

    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      errors.email = "Invalid email format";

    if (formData.phone && !phoneRegex.test(formData.phone))
      errors.phone = "Phone must be exactly 10 digits";

    if (formData.nic && formData.nic.trim()) {
      if (!nicOldRegex.test(formData.nic) && !nicNewRegex.test(formData.nic))
        errors.nic = "Invalid NIC format (9 digits + V/X, or 12 digits)";
    }

    if (
      formData.emergencyContactPhone &&
      !phoneRegex.test(formData.emergencyContactPhone)
    )
      errors.emergencyContactPhone =
        "Emergency contact phone must be 10 digits";

    if (
      formData.role === "location_inventory_manager" &&
      !formData.assignedLocation
    )
      errors.assignedLocation = "Assigned location is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        nic: formData.nic,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        hireDate: formData.hireDate,
        nicFrontImage: formData.nicFrontImage,
        nicBackImage: formData.nicBackImage,
      };
      if (formData.role === "location_inventory_manager") {
        updateData.assignedLocation = formData.assignedLocation;
      } else if (formData.role === "master_inventory_manager") {
        updateData.assignedLocation = "All";
      } else {
        updateData.assignedLocation = null;
      }
      await axios.put(`/api/auth/users/${editingUser._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Profile Updated",
        message: "The user account details have been successfully updated.",
      });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: error.response?.data?.message || "Failed to update user",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    switch (name) {
      case "name":
      case "emergencyContactName":
        sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
        break;
      case "phone":
      case "emergencyContactPhone":
        sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
        break;
      case "nic":
        sanitizedValue = value.toUpperCase().replace(/[^0-9VX]/g, "");
        if (sanitizedValue.length > 12)
          sanitizedValue = sanitizedValue.slice(0, 12);
        break;
      case "city":
        sanitizedValue = value.replace(/[^a-zA-Z\s-]/g, "");
        break;
      case "address":
        sanitizedValue = value.replace(/[^a-zA-Z0-9\s,/-]/g, "");
        break;
      case "email":
        sanitizedValue = value.toLowerCase().replace(/\s/g, "");
        break;
      default:
        sanitizedValue = value;
    }
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a file under 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width,
          height = img.height;
        const MAX = 1200;
        if (width > height) {
          if (width > MAX) {
            height *= MAX / width;
            width = MAX;
          }
        } else {
          if (height > MAX) {
            width *= MAX / height;
            height = MAX;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        setFormData((prev) => ({
          ...prev,
          [name]: canvas.toDataURL("image/jpeg", 0.7),
        }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const errors = {};
    const nameRegex = /^[a-zA-Z\s]*$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    if (!formData.name.trim()) errors.name = "Name is required";
    else if (!nameRegex.test(formData.name))
      errors.name = "Name must not contain numbers or special characters";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      errors.email = "Invalid email format";
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!formData.phone) errors.phone = "Phone number is required";
    else if (!phoneRegex.test(formData.phone))
      errors.phone = "Phone must be exactly 10 digits";
    const nicOldRegex = /^\d{9}[VXvx]$/;
    const nicNewRegex = /^\d{12}$/;
    if (formData.nic && formData.nic.trim()) {
      if (!nicOldRegex.test(formData.nic) && !nicNewRegex.test(formData.nic))
        errors.nic = "Invalid NIC format";
    }
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.emergencyContactName.trim())
      errors.emergencyContactName = "Contact name required";
    if (!formData.emergencyContactPhone)
      errors.emergencyContactPhone = "Contact phone required";
    else if (!phoneRegex.test(formData.emergencyContactPhone))
      errors.emergencyContactPhone = "Phone must be 10 digits";
    if (
      formData.role === "location_inventory_manager" &&
      !formData.assignedLocation
    )
      errors.assignedLocation = "Assigned location is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const staffData = { ...formData };
      if (formData.role === "master_inventory_manager")
        staffData.assignedLocation = "All";
      await axios.post("/api/auth/create-staff", staffData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Staff Account Created",
        message:
          "The new staff account has been successfully created and activated.",
      });
      setShowCreateUser(false);
      fetchUsers();
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Creation Failed",
        message:
          error.response?.data?.message || "Failed to create staff account",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStaff = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "location_inventory_manager",
      assignedLocation: "Main",
      dateOfBirth: "",
      address: "",
      city: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      hireDate: new Date().toISOString().split("T")[0],
      nic: "",
      nicFrontImage: null,
      nicBackImage: null,
    });
    setFormErrors({});
    setShowCreateUser(true);
  };

  const userColumns = [
    {
      header: "Name",
      accessor: "name",
      render: (user) => (
        <div className="user-cell">
          <span className="user-name">{user.name}</span>
        </div>
      ),
    },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      accessor: "role",
      render: (user) => (
        <span className={`role-badge role-${user.role}`}>
          {user.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (user) => (
        <span
          className={`status-badge ${user.isActive ? "active" : "inactive"}`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  if (loading) {
    // ─────────────────────────────────
    // Render
    // ─────────────────────────────────
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
        title="User Management"
        subtitle="Manage all system users and staff accounts"
        actions={[
          {
            label: "Create Staff",
            icon: <UserPlus size={18} />,
            onClick: handleCreateStaff,
            variant: "primary",
          },
        ]}
      />

      <DashboardSection title="All Users">
        <DashboardTable
          columns={userColumns}
          data={users}
          searchable={true}
          searchKeys={["name", "email", "nic", "role"]}
          filterable={true}
          filterKey="role"
          currentFilter={roleFilter}
          onFilterChange={setRoleFilter}
          filterOptions={[
            { value: "all", label: "All Roles" },
            { value: "customer", label: "Customer" },
            { value: "admin", label: "Admin" },
            { value: "location_inventory_manager", label: "Location Manager" },
            { value: "master_inventory_manager", label: "Master Manager" },
            { value: "finance_manager", label: "Finance Manager" },
            { value: "supplier_manager", label: "Supplier Manager" },
            { value: "product_manager", label: "Product Manager" },
            { value: "marketing_manager", label: "Marketing Manager" },
          ]}
          rowsPerPage={15}
          actions={(user) => (
            <div className="table-actions">
              <button
                className="btn-icon"
                title="View Details"
                onClick={() => {
                  setViewingUser(user);
                  setShowViewModal(true);
                }}
              >
                <Eye size={16} />
              </button>
              <button
                className="btn-icon"
                title="Edit"
                onClick={() => handleEditClick(user)}
              >
                <Edit size={16} />
              </button>
              <button
                className="btn-icon"
                title="Force Password Reset"
                onClick={() => handleForceReset(user._id)}
              >
                <KeyRound size={16} />
              </button>
              {user.isActive && (
                <button
                  className="btn-icon danger"
                  title="Deactivate"
                  onClick={() => handleDeactivateUser(user._id)}
                >
                  <Ban size={16} />
                </button>
              )}
            </div>
          )}
        />
      </DashboardSection>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit User – ${editingUser.name}`}
          size="lg"
        >
          <form onSubmit={handleEditSubmit} className="dashboard-form">
            <div className="staff-form-grid">
              {/* Personal Information */}
              <div className="form-section full-width">
                <h3 className="section-title">Personal Information</h3>
                <div className="form-row">
                  <Input
                    label="Full Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    error={formErrors.name}
                  />
                  <Input
                    label="NIC Number"
                    name="nic"
                    value={formData.nic}
                    onChange={handleInputChange}
                    placeholder="e.g., 123456789V or 199012345678"
                    error={formErrors.nic}
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., 07XXXXXXXX"
                    error={formErrors.phone}
                  />
                  <Input
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    max={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() - 18),
                      )
                        .toISOString()
                        .split("T")[0]
                    }
                    error={formErrors.dateOfBirth}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">NIC Front Side</label>
                    <input
                      type="file"
                      name="nicFrontImage"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="form-input"
                    />
                    {formData.nicFrontImage && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--success-text)",
                          marginTop: "0.5rem",
                        }}
                      >
                        ✓ Image loaded
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">NIC Back Side</label>
                    <input
                      type="file"
                      name="nicBackImage"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="form-input"
                    />
                    {formData.nicBackImage && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--success-text)",
                          marginTop: "0.5rem",
                        }}
                      >
                        ✓ Image loaded
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="form-section full-width">
                <h3 className="section-title">
                  Contact & Professional Details
                </h3>
                <div className="form-row">
                  <Input
                    label="Email Address *"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={formErrors.email}
                  />
                  <Select
                    label="District"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    error={formErrors.city}
                    options={[
                      { value: "", label: "Select district..." },
                      { value: "Ampara", label: "Ampara" },
                      { value: "Anuradhapura", label: "Anuradhapura" },
                      { value: "Badulla", label: "Badulla" },
                      { value: "Batticaloa", label: "Batticaloa" },
                      { value: "Colombo", label: "Colombo" },
                      { value: "Galle", label: "Galle" },
                      { value: "Gampaha", label: "Gampaha" },
                      { value: "Hambantota", label: "Hambantota" },
                      { value: "Jaffna", label: "Jaffna" },
                      { value: "Kalutara", label: "Kalutara" },
                      { value: "Kandy", label: "Kandy" },
                      { value: "Kegalle", label: "Kegalle" },
                      { value: "Kilinochchi", label: "Kilinochchi" },
                      { value: "Kurunegala", label: "Kurunegala" },
                      { value: "Mannar", label: "Mannar" },
                      { value: "Matale", label: "Matale" },
                      { value: "Matara", label: "Matara" },
                      { value: "Monaragala", label: "Monaragala" },
                      { value: "Mullaitivu", label: "Mullaitivu" },
                      { value: "Nuwara Eliya", label: "Nuwara Eliya" },
                      { value: "Polonnaruwa", label: "Polonnaruwa" },
                      { value: "Puttalam", label: "Puttalam" },
                      { value: "Ratnapura", label: "Ratnapura" },
                      { value: "Trincomalee", label: "Trincomalee" },
                      { value: "Vavuniya", label: "Vavuniya" },
                    ]}
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="Residential Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                    error={formErrors.address}
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="Hire Date"
                    name="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={handleInputChange}
                    error={formErrors.hireDate}
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="Emergency Contact Name"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Name of contact person"
                    error={formErrors.emergencyContactName}
                  />
                  <Input
                    label="Emergency Contact Phone"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="10-digit phone"
                    error={formErrors.emergencyContactPhone}
                  />
                </div>
              </div>

              {/* Role Assignment */}
              <div className="form-section full-width">
                <h3 className="section-title">Role Assignment</h3>
                <div className="form-row">
                  <Select
                    label="Role *"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    options={[
                      { value: "customer", label: "Customer" },
                      {
                        value: "location_inventory_manager",
                        label: "Inventory Manager (Location)",
                      },
                      {
                        value: "master_inventory_manager",
                        label: "Inventory Manager (Master)",
                      },
                      { value: "finance_manager", label: "Finance Manager" },
                      { value: "supplier_manager", label: "Supplier Manager" },
                      {
                        value: "marketing_manager",
                        label: "Marketing Manager",
                      },
                      { value: "product_manager", label: "Product Manager" },
                      { value: "admin", label: "System Administrator" },
                    ]}
                  />
                  {formData.role === "location_inventory_manager" && (
                    <Select
                      label="Assigned Location *"
                      name="assignedLocation"
                      value={formData.assignedLocation}
                      onChange={handleInputChange}
                      error={formErrors.assignedLocation}
                      options={[
                        { value: "Main", label: "Main Branch" },
                        { value: "Balangoda", label: "Balangoda" },
                        { value: "Kottawa", label: "Kottawa" },
                      ]}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="dash-modal-actions">
              <Button variant="secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Staff Modal */}
      {showCreateUser && (
        <Modal
          isOpen={showCreateUser}
          onClose={() => setShowCreateUser(false)}
          title="Create Staff Account"
          size="lg"
        >
          <form onSubmit={handleFormSubmit} className="dashboard-form">
            <div className="staff-form-grid">
              <div className="form-section full-width">
                <h3 className="section-title">Personal Information</h3>
                <div className="form-row">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    error={formErrors.name}
                    required
                  />
                  <Input
                    label="NIC Number"
                    name="nic"
                    value={formData.nic}
                    onChange={handleInputChange}
                    placeholder="e.g., 123456789V or 199012345678"
                    error={formErrors.nic}
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., 07XXXXXXXX"
                    error={formErrors.phone}
                    required
                  />
                  <Input
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    max={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() - 18),
                      )
                        .toISOString()
                        .split("T")[0]
                    }
                    error={formErrors.dateOfBirth}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">NIC Front Side</label>
                    <input
                      type="file"
                      name="nicFrontImage"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">NIC Back Side</label>
                    <input
                      type="file"
                      name="nicBackImage"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
              <div className="form-section full-width">
                <h3 className="section-title">
                  Contact & Professional Details
                </h3>
                <div className="form-row">
                  <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter residential address"
                    error={formErrors.address}
                    required
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={formErrors.email}
                    required
                  />
                  <Select
                    label="District"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    error={formErrors.city}
                    required
                    options={[
                      { value: "Ampara", label: "Ampara" },
                      { value: "Anuradhapura", label: "Anuradhapura" },
                      { value: "Badulla", label: "Badulla" },
                      { value: "Batticaloa", label: "Batticaloa" },
                      { value: "Colombo", label: "Colombo" },
                      { value: "Galle", label: "Galle" },
                      { value: "Gampaha", label: "Gampaha" },
                      { value: "Hambantota", label: "Hambantota" },
                      { value: "Jaffna", label: "Jaffna" },
                      { value: "Kalutara", label: "Kalutara" },
                      { value: "Kandy", label: "Kandy" },
                      { value: "Kegalle", label: "Kegalle" },
                      { value: "Kilinochchi", label: "Kilinochchi" },
                      { value: "Kurunegala", label: "Kurunegala" },
                      { value: "Mannar", label: "Mannar" },
                      { value: "Matale", label: "Matale" },
                      { value: "Matara", label: "Matara" },
                      { value: "Monaragala", label: "Monaragala" },
                      { value: "Mullaitivu", label: "Mullaitivu" },
                      { value: "Nuwara Eliya", label: "Nuwara Eliya" },
                      { value: "Polonnaruwa", label: "Polonnaruwa" },
                      { value: "Puttalam", label: "Puttalam" },
                      { value: "Ratnapura", label: "Ratnapura" },
                      { value: "Trincomalee", label: "Trincomalee" },
                      { value: "Vavuniya", label: "Vavuniya" },
                    ]}
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="Hire Date"
                    name="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={handleInputChange}
                    error={formErrors.hireDate}
                    required
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="Emergency Contact Name"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Name of contact person"
                    error={formErrors.emergencyContactName}
                    required
                  />
                  <Input
                    label="Emergency Contact Phone"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    error={formErrors.emergencyContactPhone}
                    required
                  />
                </div>
                <div className="form-row">
                  <Select
                    label="Role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    options={[
                      { value: "admin", label: "Administrator" },
                      {
                        value: "location_inventory_manager",
                        label: "Inventory Manager (Location)",
                      },
                      {
                        value: "master_inventory_manager",
                        label: "Inventory Manager (Master)",
                      },
                      { value: "finance_manager", label: "Finance Manager" },
                      { value: "supplier_manager", label: "Supplier Manager" },
                      {
                        value: "marketing_manager",
                        label: "Marketing Manager",
                      },
                      { value: "product_manager", label: "Product Manager" },
                    ]}
                  />
                  {formData.role === "location_inventory_manager" && (
                    <Select
                      label="Assigned Location"
                      name="assignedLocation"
                      value={formData.assignedLocation}
                      onChange={handleInputChange}
                      options={[
                        { value: "Main", label: "Main Branch" },
                        { value: "Balangoda", label: "Balangoda" },
                        { value: "Kottawa", label: "Kottawa" },
                      ]}
                    />
                  )}
                  <Input
                    label="Temporary Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 6 characters"
                    error={formErrors.password}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="dash-modal-actions">
              <Button
                variant="secondary"
                onClick={() => setShowCreateUser(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Create Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* View User Modal */}
      {showViewModal && viewingUser && (
        <Modal
          isOpen={showViewModal && !!viewingUser}
          onClose={() => setShowViewModal(false)}
          title="User Profile Details"
          size="lg"
        >
          <div className="view-details-grid">
            <div className="view-section">
              <h3 className="section-title">Personal Information</h3>
              <div className="detail-item">
                <label>Full Name</label>
                <span>{viewingUser?.name}</span>
              </div>
              <div className="detail-item">
                <label>NIC Number</label>
                <span>{viewingUser?.nic || "N/A"}</span>
              </div>
              <div className="detail-item">
                <label>Date of Birth</label>
                <span>
                  {viewingUser?.dateOfBirth
                    ? new Date(viewingUser.dateOfBirth).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
            <div className="view-section">
              <h3 className="section-title">Contact & Location</h3>
              <div className="detail-item">
                <label>Email</label>
                <span>{viewingUser?.email}</span>
              </div>
              <div className="detail-item">
                <label>Phone</label>
                <span>{viewingUser?.phone || "N/A"}</span>
              </div>
              <div className="detail-item">
                <label>Address</label>
                <span>
                  {viewingUser?.address || "N/A"}, {viewingUser?.city || ""}
                </span>
              </div>
            </div>
            <div className="view-section">
              <h3 className="section-title">Employment Information</h3>
              <div className="detail-item">
                <label>Role</label>
                <span className={`role-badge role-${viewingUser?.role}`}>
                  {viewingUser?.role.replace(/_/g, " ")}
                </span>
              </div>
              <div className="detail-item">
                <label>Assigned Location</label>
                <span>{viewingUser?.assignedLocation || "N/A"}</span>
              </div>
              <div className="detail-item">
                <label>Hire Date</label>
                <span>
                  {viewingUser?.hireDate
                    ? new Date(viewingUser.hireDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
            <div className="view-section">
              <h3 className="section-title">Verification</h3>
              <div className="nic-images-preview">
                <div className="nic-image">
                  <label>Front Side</label>
                  {viewingUser?.nicFrontImage ? (
                    <img src={viewingUser.nicFrontImage} alt="NIC Front" />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="nic-image">
                  <label>Back Side</label>
                  {viewingUser?.nicBackImage ? (
                    <img src={viewingUser.nicBackImage} alt="NIC Back" />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="dash-modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowViewModal(false)}
            >
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowViewModal(false);
                handleEditClick(viewingUser);
              }}
            >
              Edit Profile
            </button>
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
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

export default AdminUsers;

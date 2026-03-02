// ============================================
// SupplierFormModal
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: SupplierFormModal UI component
// ============================================
import React, { useState, useEffect } from "react";
import Modal from "../../../../components/common/Modal";
import { Building, MapPin, Phone, FileText, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import "./SupplierFormModal.css";

const SupplierFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  // State Variables
  const [formData, setFormData] = useState({
    name: "",
    supplierType: "Vendor",
    category: "Material Supplier",
    contactPerson: "",
    email: "",
    phone: "",
    address: { street: "", city: "", postalCode: "" },
    businessRegistration: "",
    taxId: "",
    paymentTerms: "Cash",
    creditLimit: 0,
    bankDetails: {
      accountName: "",
      bankName: "",
      branchName: "",
      accountNumber: "",
    },
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // [E4.1] Real-time field validation before save; touched state prevents showing errors before user interaction
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) error = "Partner Name is required";
        else if (value.length < 3) error = "Name must be at least 3 characters";
        break;
      case "contactPerson":
        if (!value.trim()) error = "Contact person is required";
        else if (value.length < 3) error = "Name must be at least 2 characters";
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) error = "Email is required";
        else if (!emailRegex.test(value)) error = "Invalid email format";
        break;
      case "phone":
        // Sri Lanka phone: mobile (07X) or landline (0XX) — 10 digits total, or +94 + 9 digits
        const phoneRegex = /^(?:\+94|0)\d{9}$/;
        if (!value) error = "Phone number is required";
        else if (!phoneRegex.test(value.replace(/[\s-]/g, "")))
          error = "Invalid SL Phone (e.g., 0712345678 or 0112345678)";
        break;
      case "businessRegistration":
        if (value && value.length < 3) error = "Invalid BR Number format";
        break;
      case "taxId":
        if (value && value.length < 5) error = "Tax ID too short";
        break;
      case "creditLimit":
        if (value < 0) error = "Limit cannot be negative";
        break;
      case "address.street":
        if (!value.trim()) error = "Street address is required";
        break;
      case "address.city":
        if (!value) error = "District is required";
        break;
      case "address.postalCode":
        const postalRegex = /^\d{5}$/;
        if (value && !postalRegex.test(value))
          error = "Postal code must be 5 digits";
        break;
      case "bankDetails.bankName":
        if (value && !/^[a-zA-Z\s.-]+$/.test(value))
          error = "Bank name should contain only letters";
        break;
      case "bankDetails.branchName":
        if (value && !/^[a-zA-Z\s.-]+$/.test(value))
          error = "Branch name should contain only letters";
        break;
      case "bankDetails.accountNumber":
        if (value && (value.length < 8 || value.length > 20))
          error = "Account number should be 8-20 digits";
        break;
      case "bankDetails.accountName":
        if (value && !/^[a-zA-Z\s.-]+$/.test(value))
          error = "Account holder name should contain only letters";
        else if (value && value.trim().length < 2)
          error = "Account holder name is too short";
        break;
      default:
        break;
    }
    return error;
  };

  // Side Effects
  useEffect(() => {
    if (isOpen) {
      // Reset errors and touched when modal opens
      setErrors({});
      setTouched({});

      if (initialData) {
        setFormData({
          ...initialData,
          supplierType: initialData.supplierType || "Vendor",
          address: initialData.address || {
            street: "",
            city: "",
            postalCode: "",
          },
          bankDetails: initialData.bankDetails || {
            accountName: "",
            bankName: "",
            branchName: "",
            accountNumber: "",
          },
        });
      } else {
        setFormData({
          name: "",
          supplierType: "Vendor",
          category: "Material Supplier",
          contactPerson: "",
          email: "",
          phone: "",
          address: { street: "", city: "", postalCode: "" },
          businessRegistration: "",
          taxId: "",
          paymentTerms: "Cash",
          creditLimit: 0,
          bankDetails: {
            accountName: "",
            bankName: "",
            branchName: "",
            accountNumber: "",
          },
          notes: "",
        });
      }
    }
  }, [initialData, isOpen]);

  // Event Handlers
  const handleChange = (e) => {
    let { name, value } = e.target;

    // Realtime input restrictions
    if (name === "name" || name === "contactPerson") {
      value = value.replace(/[^a-zA-Z\s.-]/g, ""); // Prevent numbers and special chars
    } else if (name === "phone" || name === "bankDetails.accountNumber") {
      value = value.replace(/[^\d+]/g, ""); // Allow only digits and plus (for phone)
      if (name === "phone") value = value.slice(0, 12); // SL: max 10 digits local (07X...) or 12 intl (+94...)
      if (name === "bankDetails.accountNumber") value = value.slice(0, 20); // Max 20 digits
    } else if (
      name === "bankDetails.bankName" ||
      name === "bankDetails.branchName" ||
      name === "bankDetails.accountName"
    ) {
      value = value.replace(/[^a-zA-Z\s.-]/g, ""); // Letters, spaces, dots, hyphens only
    } else if (name === "creditLimit") {
      value = value === "" ? 0 : parseFloat(value);
    } else if (name === "businessRegistration" || name === "taxId") {
      value = value.replace(/[^a-zA-Z0-9\s-]/g, ""); // Letters, numbers, spaces, hyphens
    }

    // Handle nested state updates
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
      // Trigger validation for nested fields
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Trigger validation on change
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    const mandatoryFields = ["name", "email", "phone", "contactPerson"];

    mandatoryFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (!formData.address.street)
      newErrors["address.street"] = "Street address is required";
    if (!formData.address.city)
      newErrors["address.city"] = "District is required";

    if (formData.bankDetails.accountNumber) {
      const error = validateField(
        "bankDetails.accountNumber",
        formData.bankDetails.accountNumber,
      );
      if (error) newErrors["bankDetails.accountNumber"] = error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    // Reset all form state when closing
    setFormData({
      name: "",
      supplierType: "Vendor",
      category: "Material Supplier",
      contactPerson: "",
      email: "",
      phone: "",
      address: { street: "", city: "", postalCode: "" },
      businessRegistration: "",
      taxId: "",
      paymentTerms: "Cash",
      creditLimit: 0,
      bankDetails: {
        accountName: "",
        bankName: "",
        branchName: "",
        accountNumber: "",
      },
      notes: "",
    });
    setErrors({});
    setTouched({});
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      contactPerson: true,
      "address.street": true,
      "address.city": true,
    });

    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      // Parent will handle closing the modal on success
      // Reset loading in case parent doesn't close modal (shouldn't happen)
      setLoading(false);
    } catch (error) {
      console.error("Form submission error:", error);
      // Reset loading state so user can try again
      setLoading(false);
    }
  };

  // Render
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initialData ? "Edit Partner" : "Add New Partner"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="profile-settings-form">
        <div className="settings-section">
          <h3>
            <Building size={18} /> Basic Info
          </h3>

          <div className="form-row">
            <div className="form-group half">
              <label>Partner Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Business Name"
                className={
                  touched.name && errors.name
                    ? "form-input is-invalid"
                    : "form-input"
                }
              />
              {touched.name && errors.name && (
                <span className="form-error">{errors.name}</span>
              )}
            </div>
            <div className="form-group half">
              <label>Business Relationship *</label>
              <select
                name="supplierType"
                value={formData.supplierType}
                onChange={(e) => {
                  handleChange(e);
                  // Auto-set category based on type
                  if (e.target.value === "Vendor") {
                    setFormData((prev) => ({
                      ...prev,
                      supplierType: e.target.value,
                      category: "Material Supplier",
                    }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      supplierType: e.target.value,
                      category: "Distributor",
                    }));
                  }
                }}
                className="form-input"
              >
                <option value="Vendor">
                  Vendor – They supply to us (we pay them)
                </option>
                <option value="Customer">
                  Customer – They buy from us (they pay us)
                </option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
              >
                {formData.supplierType === "Vendor" ? (
                  <>
                    <option value="Material Supplier">Material Supplier</option>
                    <option value="Publisher">Publisher</option>
                  </>
                ) : (
                  <>
                    <option value="Distributor">Distributor</option>
                    <option value="Bookshop">Bookshop</option>
                  </>
                )}
              </select>
            </div>
            <div
              className="form-group half"
              style={{ display: "flex", alignItems: "flex-end" }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  background:
                    formData.supplierType === "Vendor"
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(16,185,129,0.08)",
                  border: `1px solid ${formData.supplierType === "Vendor" ? "#fca5a5" : "#6ee7b7"}`,
                  fontSize: "0.85rem",
                  color:
                    formData.supplierType === "Vendor" ? "#b91c1c" : "#065f46",
                  width: "100%",
                }}
              >
                {formData.supplierType === "Vendor"
                  ? "Vendor: Outstanding balance = what WE owe THEM"
                  : "Customer: Outstanding balance = what THEY owe US"}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Contact Person *</label>
              <input
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Manager Name"
                className={
                  touched.contactPerson && errors.contactPerson
                    ? "form-input is-invalid"
                    : "form-input"
                }
              />
              {touched.contactPerson && errors.contactPerson && (
                <span className="form-error">{errors.contactPerson}</span>
              )}
            </div>
            <div className="form-group half">
              <label>Phone (SL Mobile) *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="07XXXXXXXX"
                maxLength={12}
                className={
                  touched.phone && errors.phone
                    ? "form-input is-invalid"
                    : "form-input"
                }
              />
              {touched.phone && errors.phone && (
                <span className="form-error">{errors.phone}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Business Email *</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="partners@example.com"
              className={
                touched.email && errors.email
                  ? "form-input is-invalid"
                  : "form-input"
              }
            />
            {touched.email && errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h3>
            <Briefcase size={18} /> Financial & Business
          </h3>
          <div className="form-row">
            <div className="form-group half">
              <label>BR Number</label>
              <input
                name="businessRegistration"
                value={formData.businessRegistration}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="BR-XXXXXX"
                className="form-input"
              />
              {touched.businessRegistration && errors.businessRegistration && (
                <span className="form-error">
                  {errors.businessRegistration}
                </span>
              )}
            </div>
            <div className="form-group half">
              <label>Tax ID (VAT/SVAT)</label>
              <input
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="T-XXXXXXXX"
                className="form-input"
              />
              {touched.taxId && errors.taxId && (
                <span className="form-error">{errors.taxId}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Payment Terms</label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Cash">Cash</option>
                <option value="Credit 7 days">Credit 7 days</option>
                <option value="Credit 14 days">Credit 14 days</option>
                <option value="Credit 30 days">Credit 30 days</option>
                <option value="Credit 60 days">Credit 60 days</option>
              </select>
            </div>
            <div className="form-group half">
              <label>Credit Limit (Rs.)</label>
              <input
                type="number"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
                onBlur={handleBlur}
                className="form-input"
              />
              {touched.creditLimit && errors.creditLimit && (
                <span className="form-error">{errors.creditLimit}</span>
              )}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            <Building size={18} /> Bank Details
          </h3>
          <div className="form-row">
            <div className="form-group half">
              <label>Bank Name</label>
              <input
                name="bankDetails.bankName"
                value={formData.bankDetails.bankName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Bank of Ceylon"
                className={
                  touched["bankDetails.bankName"] &&
                  errors["bankDetails.bankName"]
                    ? "form-input is-invalid"
                    : "form-input"
                }
              />
              {touched["bankDetails.bankName"] &&
                errors["bankDetails.bankName"] && (
                  <span className="form-error">
                    {errors["bankDetails.bankName"]}
                  </span>
                )}
            </div>
            <div className="form-group half">
              <label>Branch Name</label>
              <input
                name="bankDetails.branchName"
                value={formData.bankDetails.branchName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Colombo Main"
                className={
                  touched["bankDetails.branchName"] &&
                  errors["bankDetails.branchName"]
                    ? "form-input is-invalid"
                    : "form-input"
                }
              />
              {touched["bankDetails.branchName"] &&
                errors["bankDetails.branchName"] && (
                  <span className="form-error">
                    {errors["bankDetails.branchName"]}
                  </span>
                )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group half">
              <label>Account Number</label>
              <input
                name="bankDetails.accountNumber"
                value={formData.bankDetails.accountNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="8-20 digits"
                maxLength={20}
                className={
                  touched["bankDetails.accountNumber"] &&
                  errors["bankDetails.accountNumber"]
                    ? "form-input is-invalid"
                    : "form-input"
                }
              />
              {touched["bankDetails.accountNumber"] &&
                errors["bankDetails.accountNumber"] && (
                  <span className="form-error">
                    {errors["bankDetails.accountNumber"]}
                  </span>
                )}
            </div>
            <div className="form-group half">
              <label>Account Holder Name</label>
              <input
                name="bankDetails.accountName"
                value={formData.bankDetails.accountName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="As in passbook"
                className={
                  touched["bankDetails.accountName"] &&
                  errors["bankDetails.accountName"]
                    ? "form-input is-invalid"
                    : "form-input"
                }
              />
              {touched["bankDetails.accountName"] &&
                errors["bankDetails.accountName"] && (
                  <span className="form-error">
                    {errors["bankDetails.accountName"]}
                  </span>
                )}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            <MapPin size={18} /> Address
          </h3>
          <div className="form-row">
            <div className="form-group half">
              <label>District *</label>
              <select
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  touched["address.city"] && errors["address.city"]
                    ? "form-select is-invalid"
                    : "form-select"
                }
              >
                <option value="">Select District</option>
                <option value="Ampara">Ampara</option>
                <option value="Anuradhapura">Anuradhapura</option>
                <option value="Badulla">Badulla</option>
                <option value="Batticaloa">Batticaloa</option>
                <option value="Colombo">Colombo</option>
                <option value="Galle">Galle</option>
                <option value="Gampaha">Gampaha</option>
                <option value="Hambantota">Hambantota</option>
                <option value="Jaffna">Jaffna</option>
                <option value="Kalutara">Kalutara</option>
                <option value="Kandy">Kandy</option>
                <option value="Kegalle">Kegalle</option>
                <option value="Kilinochchi">Kilinochchi</option>
                <option value="Kurunegala">Kurunegala</option>
                <option value="Mannar">Mannar</option>
                <option value="Matale">Matale</option>
                <option value="Matara">Matara</option>
                <option value="Monaragala">Monaragala</option>
                <option value="Mullaitivu">Mullaitivu</option>
                <option value="Nuwara Eliya">Nuwara Eliya</option>
                <option value="Polonnaruwa">Polonnaruwa</option>
                <option value="Puttalam">Puttalam</option>
                <option value="Ratnapura">Ratnapura</option>
                <option value="Trincomalee">Trincomalee</option>
                <option value="Vavuniya">Vavuniya</option>
              </select>
              {touched["address.city"] && errors["address.city"] && (
                <span className="form-error">{errors["address.city"]}</span>
              )}
            </div>
            <div className="form-group half">
              <label>Street Address *</label>
              <input
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  touched["address.street"] && errors["address.street"]
                    ? "form-input is-invalid"
                    : "form-input"
                }
              />
              {touched["address.street"] && errors["address.street"] && (
                <span className="form-error">{errors["address.street"]}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Postal Code</label>
              <input
                name="address.postalCode"
                value={formData.address.postalCode || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={5}
                placeholder="XXXXX"
                className={
                  touched["address.postalCode"] && errors["address.postalCode"]
                    ? "form-input is-invalid"
                    : "form-input"
                }
              />
              {touched["address.postalCode"] &&
                errors["address.postalCode"] && (
                  <span className="form-error">
                    {errors["address.postalCode"]}
                  </span>
                )}
            </div>
          </div>
          <div className="form-group">
            <label>Notes / Remarks</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="form-input"
              placeholder="Additional information about this partner..."
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving..." : "Save Partner"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierFormModal;

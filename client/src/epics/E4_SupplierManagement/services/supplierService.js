// ============================================
// Supplier Service
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// ============================================

import api from "../../../api/config";

const supplierService = {
  // ─── Supplier / Partner CRUD ────────────────────────────────────────────────

  // [E4.1] Fetch all suppliers — supports ?supplierType=Vendor|Customer filter
  getSuppliers: async (params = {}) => {
    const response = await api.get("/suppliers", { params });
    return response.data;
  },

  getSupplier: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  // [E4.1] Create new supplier with supplierType (Vendor | Customer)
  createSupplier: async (supplierData) => {
    const response = await api.post("/suppliers", supplierData);
    return response.data;
  },

  updateSupplier: async (id, supplierData) => {
    const response = await api.put(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  deleteSupplier: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },

  terminateSupplier: async (id) => {
    const response = await api.put(`/suppliers/${id}/terminate`);
    return response.data;
  },

  getTerminatedSuppliers: async () => {
    const response = await api.get("/suppliers/terminated");
    return response.data;
  },

  restoreSupplier: async (id) => {
    const response = await api.put(`/suppliers/${id}/restore`);
    return response.data;
  },

  // [E4.6] Analytics: on-time delivery rate, quality score, total orders per supplier
  getAnalytics: async () => {
    const response = await api.get("/suppliers/analytics");
    return response.data;
  },

  // ─── Debt Tracking ─────────────────────────────────────────────────────────

  // [E4.8] Returns partners with outstanding balances (Vendors we owe + Customers who owe us)
  getPartnersWithDebt: async (supplierType = null) => {
    const params = supplierType ? { supplierType } : {};
    const response = await api.get("/suppliers/debt", { params });
    return response.data;
  },

  // ─── Payment Recording ─────────────────────────────────────────────────────

  // [E4.8] Record payment TO a Vendor (reduces our payable balance)
  recordPaymentToVendor: async (id, paymentData) => {
    const response = await api.post(
      `/suppliers/${id}/payment-to-vendor`,
      paymentData,
    );
    return response.data;
  },

  // [E4.8] Record payment received FROM a Customer (reduces their receivable balance)
  recordPaymentFromCustomer: async (id, paymentData) => {
    const response = await api.post(
      `/suppliers/${id}/payment-from-customer`,
      paymentData,
    );
    return response.data;
  },

  // ─── Sales Orders (Customers → Buy bulk from us) ───────────────────────────

  // [E4.9] Fetch all sales orders with optional filters: status, customer
  getSalesOrders: async (params = {}) => {
    const response = await api.get("/sales-orders", { params });
    return response.data;
  },

  getSalesOrder: async (id) => {
    const response = await api.get(`/sales-orders/${id}`);
    return response.data;
  },

  // [E4.9] Create a new Sales Order for a Customer (Distributor / Bookshop)
  createSalesOrder: async (orderData) => {
    const response = await api.post("/sales-orders", orderData);
    return response.data;
  },

  // [E4.9] Transition SO through lifecycle: Draft → Confirmed → Processing → Dispatched → Delivered
  updateSalesOrderStatus: async (id, status, notes = "") => {
    const response = await api.put(`/sales-orders/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  // [E4.9] Record a (partial) payment received for a Sales Order
  recordSalesOrderPayment: async (id, paymentData) => {
    const response = await api.post(`/sales-orders/${id}/payment`, paymentData);
    return response.data;
  },

  // [E4.9] Get aggregated analytics for sales orders
  getSalesOrderAnalytics: async () => {
    const response = await api.get("/sales-orders/analytics");
    return response.data;
  },

  // ─── SO Dispatch Approval Workflow (E4 ↔ E5 cross-epic) ──────────────────

  // [E4] Get all SOs in "DispatchRequested" state (for master_inventory_manager dashboard)
  getPendingSODispatchRequests: async () => {
    const response = await api.get("/sales-orders/pending-dispatch");
    return response.data;
  },

  // [E4] Approve a dispatch request — deducts inventory + marks SO as Dispatched
  approveSODispatch: async (id, notes = "") => {
    const response = await api.post(`/sales-orders/${id}/approve-dispatch`, {
      notes,
    });
    return response.data;
  },

  // [E4] Reject a dispatch request — returns SO to Processing
  rejectSODispatch: async (id, notes = "") => {
    const response = await api.post(`/sales-orders/${id}/reject-dispatch`, {
      notes,
    });
    return response.data;
  },
};

export default supplierService;

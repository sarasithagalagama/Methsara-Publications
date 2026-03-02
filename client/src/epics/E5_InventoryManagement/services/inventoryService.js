// ============================================
// Inventory Service
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// ============================================

import api from "../../../api/config";

const inventoryService = {
  // [E5.2] Master view: admin/master_inventory_manager fetches stock across ALL locations
  getAllInventory: async () => {
    const response = await api.get("/inventory/all");
    return response.data;
  },

  // [E5.1] Location-scoped view: location_inventory_manager sees only their assigned warehouse/branch
  getInventoryByLocation: async (location) => {
    const response = await api.get(`/inventory/location/${location}`);
    return response.data;
  },

  getProductInventory: async (productId) => {
    const response = await api.get(`/inventory/product/${productId}`);
    return response.data;
  },

  updateInventory: async (inventoryData) => {
    const response = await api.post("/inventory", inventoryData);
    return response.data;
  },

  // [E5.3] Manual stock adjustment: payload includes productId, location, change amount (+/-), reason
  adjustStock: async (adjustmentData) => {
    const response = await api.post("/inventory/adjust", adjustmentData);
    return response.data;
  },

  // [E5.9] Low stock alerts: backend compares currentQuantity against reorderLevel per product per location
  getLowStockItems: async (location = null) => {
    const params = location ? `?location=${location}` : "";
    const response = await api.get(`/inventory/low-stock${params}`);
    return response.data;
  },
};

// [E5.4][E5.5] Stock Transfer Service — inter-branch transfer requests and approvals
const stockTransferService = {
  // [E5.4] Request a stock transfer between locations
  requestTransfer: async ({
    product,
    fromLocation,
    toLocation,
    quantity,
    reason,
  }) => {
    const response = await api.post("/stock-transfers/request", {
      product,
      fromLocation,
      toLocation,
      quantity,
      reason,
    });
    return response.data;
  },

  // [E5.5] Approve or reject a pending transfer (master IM / admin / source location manager)
  approveTransfer: async (transferId, action, notes = "") => {
    const response = await api.put(`/stock-transfers/${transferId}/approve`, {
      action,
      notes,
    });
    return response.data;
  },

  // Get all transfers, optionally filtered by status and/or location
  getAllTransfers: async ({ status, location } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (location) params.set("location", location);
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(`/stock-transfers${query}`);
    return response.data;
  },
};

export { stockTransferService };
export default inventoryService;

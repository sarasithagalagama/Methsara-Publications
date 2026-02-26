// ============================================
// Inventory Service
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// ============================================

import api from "../../../api/config";

const inventoryService = {
  getAllInventory: async () => {
    const response = await api.get("/inventory/all");
    return response.data;
  },

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

  adjustStock: async (adjustmentData) => {
    const response = await api.post("/inventory/adjust", adjustmentData);
    return response.data;
  },

  getLowStockItems: async (location = null) => {
    const params = location ? `?location=${location}` : "";
    const response = await api.get(`/inventory/low-stock${params}`);
    return response.data;
  },
};

export default inventoryService;

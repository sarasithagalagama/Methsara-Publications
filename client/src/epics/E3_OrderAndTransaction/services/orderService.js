// ============================================
// Order Service
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// ============================================

import api from "../../../api/config";

const orderService = {
  // [E3.3] [E3.4] Create order — payload includes items, delivery address, payment method (COD/Bank Transfer), and applied coupon
  createOrder: async (orderData) => {
    const response = await api.post("/orders", orderData);
    return response.data;
  },

  // [E3.6] Fetch customer's own orders — uses JWT to identify the user; no userId param needed
  getMyOrders: async () => {
    const response = await api.get("/orders/my-orders");
    return response.data;
  },

  // [E3.7] Get single order — shows full tracking timeline and item breakdown
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // [E3.9] Admin/Finance: get all orders for the revenue dashboard and management table
  getAllOrders: async () => {
    const response = await api.get("/orders");
    return response.data;
  },

  // [E3.8] Admin/Finance status update — moves order through Pending → Processing → Shipped → Delivered
  // Also triggers inventory deduction (E5.8) on the backend when status becomes 'Processing'
  updateOrderStatus: async (id, statusData) => {
    const response = await api.put(`/orders/${id}/status`, statusData);
    return response.data;
  },
};

export default orderService;

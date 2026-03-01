// ============================================
// Coupon Service
// Epic: E6 - Promotions & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// ============================================

import api from "../../../api/config";

const couponService = {
  // [E6.1] Fetch all coupons for the marketing dashboard management table
  getCoupons: async () => {
    const response = await api.get("/coupons");
    return response.data;
  },

  getCoupon: async (id) => {
    const response = await api.get(`/coupons/${id}`);
    return response.data;
  },

  // [E6.1] [E6.2] Create coupon with code, discountType (percentage/fixed), validUntil, maxUsageCount
  createCoupon: async (couponData) => {
    const response = await api.post("/coupons", couponData);
    return response.data;
  },

  updateCoupon: async (id, couponData) => {
    const response = await api.put(`/coupons/${id}`, couponData);
    return response.data;
  },

  deleteCoupon: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },

  // [E6.6] [E6.7] Validate coupon at checkout: server checks code exists, not expired, usage limit not exceeded, and minPurchaseAmount met
  validateCoupon: async (code, orderTotal) => {
    const response = await api.post("/coupons/validate", { code, orderTotal });
    return response.data;
  },
};

export default couponService;

// ============================================
// Product Service
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// ============================================

import api from "../../../api/config";

const productService = {
  // [E2.4] Search + [E2.5] Filter — URLSearchParams builds the query string sent to the backend
  // Only non-empty filter values are appended, keeping the URL clean
  getProducts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.grade) params.append("grade", filters.grade);
    if (filters.subject) params.append("subject", filters.subject);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.sort) params.append("sort", filters.sort); // [E2.7] Sort by price/date/title

    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  // [E2.6] Get single product — fetches full details including reviews
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // [E2.1] Create product — admin or product manager role required (enforced on backend)
  createProduct: async (productData) => {
    const response = await api.post("/products", productData);
    return response.data;
  },

  // [E2.1] Update product (admin/product manager) — supports partial updates via PUT
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // [E2.1] Delete product — backend uses soft-delete (isArchived flag) to preserve order history
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // [E2.8] Add review — backend validates that the customer has a 'Delivered' order for this product
  addReview: async (productId, reviewData) => {
    const response = await api.post(
      `/products/${productId}/reviews`,
      reviewData,
    );
    return response.data;
  },
};

export default productService;

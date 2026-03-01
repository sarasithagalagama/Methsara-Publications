// ============================================
// Product List Component
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Features: Search, Filter, Sort products
// ============================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import productService from "../../services/productService";
import ProductCard from "./ProductCard";
import "./Products.css";

function ProductList() {
  // State Variables
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // [E2.4] [E2.5] [E2.7] Filters object drives the API query — any change triggers a re-fetch
  // Filter states -
  const [filters, setFilters] = useState({
    search: "",
    grade: "",
    subject: "",
    sort: "title",
  });

  // Load products
  // Side Effects
  useEffect(() => {
    loadProducts();
  }, [filters]);

  // Event Handlers
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts(filters);
      setProducts(response.products || []);
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  // Render
  return (
    <div className="container">
      <div className="products-header">
        <h1>Educational Materials</h1>
        <p>Browse our collection of quality educational books</p>
      </div>

      {/* DEMO: Search and Filters -  */}
      <div className="products-filters card">
        <div className="filter-row">
          <input
            type="text"
            name="search"
            className="form-input"
            placeholder="🔍 Search products..."
            value={filters.search}
            onChange={handleFilterChange}
          />

          <select
            name="grade"
            className="form-select"
            value={filters.grade}
            onChange={handleFilterChange}
          >
            <option value="">All Grades</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
            <option value="Grade 13">Grade 13</option>
          </select>

          <select
            name="subject"
            className="form-select"
            value={filters.subject}
            onChange={handleFilterChange}
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="Sinhala">Sinhala</option>
            <option value="History">History</option>
            <option value="Geography">Geography</option>
            <option value="ICT">ICT</option>
          </select>

          <select
            name="sort"
            className="form-select"
            value={filters.sort}
            onChange={handleFilterChange}
          >
            <option value="title">Title (A-Z)</option>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
          </select>
        </div>
      </div>

      {/* DEMO: Loading State */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}

      {/* DEMO: Error State */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* DEMO: Products Grid */}
      {!loading && !error && (
        <>
          <div className="products-count">
            <p>Showing {products.length} products</p>
          </div>

          <div className="grid grid-3">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {products.length === 0 && (
            <div className="no-products">
              <p>No products found. Try adjusting your filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProductList;

// ============================================
// Product List Page
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: Storefront - browse, filter, and discover books
// ============================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../E1_UserAndRoleManagement/context/AuthContext";
import axios from "axios";
import {
  Star,
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  ShoppingCart,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";
import "./ProductList.css";

// [Epic E2.1] - Categories from the Source
// Instead of hardcoding, we pull categories directly from the database
// to ensure the storefront is always in sync with our inventory.
const fetchCategories = async () => {
  // ... logically mapped in the component
};

const SkeletonCard = () => (
  <div className="skeleton-book-card">
    <div className="skel-img" />
    <div className="book-info">
      <div className="skel-line short" />
      <div className="skel-line" />
      <div className="skel-line thin" />
      <div className="skel-line short price-line" />
    </div>
  </div>
);

const ProductList = () => {
  // State Variables
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshCounts } = useAuth();

  // [E2.4] [E2.5] Filters initialized from URL search params — enables shareable/bookmarkable filtered URLs
  // e.g. /books?category=A%2FL&sort=price_asc restores the exact filter state on load
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    subject: searchParams.get("subject") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest", // [E2.7] Sort: newest/price_asc/price_desc/title
    search: searchParams.get("search") || "",
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 12,
  });
  // searchDebounce ref holds the pending timeout ID so it can be cancelled on each new keystroke
  const searchDebounce = useRef(null);

  // We fetch categories on mount to populate the sidebar.
  // This ensures the user only sees relevant filtering options.
  // Side Effects
  useEffect(() => {
    // Event Handlers
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/products/categories");
        const allCategories = res.data.categories || [];
        // [E2.5] Sri Lanka education hierarchy: A/L at top, then secondary grades, then Others
        const desiredOrder = [
          "A/L",
          "Grade 6",
          "Grade 7",
          "Grade 8",
          "Grade 9",
          "Grade 10",
          "Grade 11",
          "Others",
        ];

        const finalCategories = desiredOrder.map((name) => {
          const found = allCategories.find((cat) => cat.name === name);
          return {
            name,
            productCount: found ? found.productCount : 0,
          };
        });

        setCategories(finalCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // [Epic E2.2] - Smart Searching (Debounced)
  // To prevent overwhelming the server, we wait 350ms after the user
  // stops typing before triggering a search.
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(
      () => {
        fetchProducts();

        // Syncing state with URL so users can bookmark or share their search
        const newParams = {};
        Object.keys(filters).forEach((key) => {
          if (filters[key]) newParams[key] = filters[key];
        });
        setSearchParams(newParams);
      },
      filters.search ? 350 : 0,
    );
    // Render
    return () => clearTimeout(searchDebounce.current);
  }, [filters, pagination.currentPage]);

  // If the user changes a filter, we should always start
  // viewing from Page 1 of the new results.
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [
    filters.category,
    filters.subject,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    filters.search,
  ]);

  // [Epic E2.1] - The Data Engine
  // Dynamically constructs a query based on all active filters
  // and fetches the matching books from our API.
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.subject) queryParams.append("subject", filters.subject);
      if (filters.sort) queryParams.append("sort", filters.sort);
      if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
      if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);

      if (filters.category) {
        queryParams.append("category", filters.category);
      }
      const res = await axios.get(`/api/products?${queryParams}`, {
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
        },
      });
      setProducts(res.data.products || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: res.data.totalPages || 1,
        totalItems: res.data.total || 0,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Simple "panic button" for the user to reset all their
  // choices and see the whole catalog again.
  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      subject: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });
  };

  const [wishlist, setWishlist] = useState(
    JSON.parse(localStorage.getItem("wishlist")) || [],
  );

  const toggleWishlist = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    let updatedWishlist = [...wishlist];
    const index = updatedWishlist.findIndex((item) => item._id === product._id);

    if (index > -1) {
      updatedWishlist.splice(index, 1);
      toast.success("Removed from wishlist");
    } else {
      updatedWishlist.push({
        _id: product._id,
        title: product.title,
        titleSinhala: product.titleSinhala,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        hasDiscount: product.hasDiscount,
        grade:
          product.examType === "A/L" ||
          product.grade === "Grade 12" ||
          product.grade === "Grade 13"
            ? "A/L"
            : product.grade,
        author: product.author,
        subject: product.subject,
      });
      toast.success("Added to wishlist!");
    }

    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    refreshCounts();
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0) {
      toast.error("Out of stock!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        let guestCart = JSON.parse(localStorage.getItem("guestCart")) || {
          items: [],
          totalAmount: 0,
        };
        const existingItemIndex = guestCart.items.findIndex(
          (item) => item.product._id === product._id,
        );

        if (existingItemIndex > -1) {
          guestCart.items[existingItemIndex].quantity += 1;
        } else {
          guestCart.items.push({
            product: {
              _id: product._id,
              title: product.title,
              image: product.image,
              grade: product.grade,
              author: product.author,
            },
            quantity: 1,
            price: product.price,
          });
        }

        guestCart.totalAmount = guestCart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        refreshCounts();
        toast.success("Added to guest cart!");
        return;
      }

      await axios.post(
        "/api/cart/add",
        { productId: product._id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      refreshCounts();
      toast.success("Added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
    }
  };

  // Count active filters for the badge
  const activeFilterCount = [
    filters.category,
    filters.subject,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="product-list-page">
      {/* Mobile Filter Backdrop */}
      <div
        className={`filter-backdrop ${showMobileFilters ? "show" : ""}`}
        onClick={() => setShowMobileFilters(false)}
      />

      {/* Page Header Banner */}
      <div className="page-banner">
        <div className="container">
          <div className="banner-content">
            <h1>
              Our <span className="gold-text">Books</span>
            </h1>
            <p>Explore our range of academic materials.</p>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="products-layout">
          {/* Sidebar Filters */}
          <aside
            className={`sidebar-filters ${showMobileFilters ? "show" : ""}`}
          >
            <div className="sidebar-header">
              <h3>Filters</h3>
              <button
                className="close-filters"
                onClick={() => setShowMobileFilters(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Filter */}
            <div className="filter-section">
              <h4>GRADE</h4>
              <div className="filter-options">
                <button
                  className={`filter-btn ${!filters.category ? "active" : ""}`}
                  onClick={() => setFilters({ ...filters, category: "" })}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id || cat.name}
                    className={`filter-btn ${filters.category === cat.name ? "active" : ""}`}
                    onClick={() =>
                      setFilters({ ...filters, category: cat.name })
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="filter-section price-filter-section">
              <h4>Price Range</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  min="0"
                />
                <span>-</span>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  min="0"
                />
              </div>
            </div>

            <button className="clear-all-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          </aside>

          {/* Main Content */}
          <main className="products-content">
            {/* Top Toolbar */}
            <div className="products-toolbar">
              <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by title, author, or ISBN..."
                  value={filters.search}
                  onChange={handleFilterChange}
                />
                {filters.search && (
                  <button
                    className="search-clear-btn"
                    onClick={() => setFilters({ ...filters, search: "" })}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="toolbar-right">
                <div className="sort-wrapper">
                  <span>Sort By:</span>
                  <select
                    name="sort"
                    value={filters.sort}
                    onChange={handleFilterChange}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="popular">Popularity</option>
                  </select>
                </div>
                <button
                  className="mobile-filter-trigger"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <Filter size={18} /> Filters
                  {activeFilterCount > 0 && (
                    <span className="filter-badge">{activeFilterCount}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Active Filter Pills */}
            {(filters.grade ||
              filters.category ||
              filters.subject ||
              filters.examType ||
              filters.minPrice ||
              filters.maxPrice) && (
              <div className="active-filters-row">
                {filters.category && (
                  <span className="filter-pill">
                    {filters.category}
                    <button
                      onClick={() => setFilters({ ...filters, category: "" })}
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </span>
                )}
                {filters.subject && (
                  <span className="filter-pill">
                    {filters.subject}
                    <button
                      onClick={() => setFilters({ ...filters, subject: "" })}
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="filter-pill">
                    Price: {filters.minPrice ? `Rs.${filters.minPrice}` : "0"} -{" "}
                    {filters.maxPrice ? `Rs.${filters.maxPrice}` : "Max"}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, minPrice: "", maxPrice: "" })
                      }
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </span>
                )}
                <button className="clear-pills-btn" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
            )}

            {/* Catalog Header */}
            <div className="catalog-header">
              <h2 className="catalog-title">
                {filters.category || filters.search
                  ? filters.search
                    ? `Search: ${filters.search}`
                    : filters.category
                  : "All Books"}
              </h2>
              {!loading && (
                <span className="results-count">
                  Showing {pagination.totalItems} results
                </span>
              )}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="products-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-modern">
                  <BookOpen size={48} />
                </div>
                <h3>No books found</h3>
                <p>
                  Try adjusting your search or filters to find what you're
                  looking for.
                </p>
                <button
                  className="btn-modern-primary"
                  onClick={clearFilters}
                  style={{ padding: "0.75rem 2rem", marginTop: "1rem" }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <Link
                    to={`/books/${product._id}`}
                    key={product._id}
                    className="product-card-link"
                  >
                    <div
                      className={`book-card${product.stock === 0 ? " out-of-stock" : ""}`}
                    >
                      <div className="book-image-container">
                        <img
                          src={
                            product.image ||
                            "https://via.placeholder.com/300x450?text=Book+Cover"
                          }
                          alt={product.title}
                          className="book-cover"
                          loading="lazy"
                        />
                        <div className="book-overlay">
                          <div className="overlay-actions">
                            <button
                              className="action-btn cart-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                handleAddToCart(e, product);
                              }}
                              title="Add to Cart"
                            >
                              <ShoppingCart size={20} color="#1a1a1a" />
                            </button>
                            <button
                              className={`action-btn wishlist-btn ${
                                wishlist.some(
                                  (item) => item._id === product._id,
                                )
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleWishlist(e, product);
                              }}
                              title="Add to Wishlist"
                            >
                              <Heart
                                size={20}
                                color={
                                  wishlist.some(
                                    (item) => item._id === product._id,
                                  )
                                    ? "#ef4444"
                                    : "#1a1a1a"
                                }
                                fill={
                                  wishlist.some(
                                    (item) => item._id === product._id,
                                  )
                                    ? "#ef4444"
                                    : "none"
                                }
                              />
                            </button>
                          </div>
                        </div>
                        {product.isFlashSale && (
                          <span className="flash-badge">🔥 SALE</span>
                        )}
                        {product.isFeatured && !product.isFlashSale && (
                          <span className="featured-badge">⭐ Featured</span>
                        )}
                      </div>
                      <div className="book-info">
                        <span className="book-grade">
                          {product.examType === "A/L" ||
                          product.grade === "Grade 12" ||
                          product.grade === "Grade 13"
                            ? "A/L"
                            : product.grade}
                          {product.subject && ` · ${product.subject}`}
                        </span>
                        <h3 className="book-title">
                          {product.titleSinhala || product.title}
                        </h3>
                        {product.titleSinhala && (
                          <span className="book-title-english">
                            {product.title}
                          </span>
                        )}
                        <p className="book-author">{product.author}</p>
                        <div className="book-footer">
                          <div className="price-container">
                            {product.hasDiscount && (
                              <span className="original-price">
                                Rs.{" "}
                                {Number(product.originalPrice).toLocaleString()}
                              </span>
                            )}
                            <span className="book-price">
                              Rs. {Number(product.price).toLocaleString()}
                            </span>
                          </div>
                          {product.averageRating > 0 && (
                            <div className="book-rating">
                              <Star
                                size={13}
                                fill="var(--secondary-color)"
                                stroke="var(--secondary-color)"
                              />
                              <span>
                                {Number(product.averageRating).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination UI */}
            {!loading && pagination.totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  disabled={pagination.currentPage === 1}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: Math.max(1, prev.currentPage - 1),
                    }))
                  }
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="pagination-numbers">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      className={`page-number ${
                        pagination.currentPage === i + 1 ? "active" : ""
                      }`}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: i + 1,
                        }))
                      }
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  className="pagination-btn"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: Math.min(
                        prev.totalPages,
                        prev.currentPage + 1,
                      ),
                    }))
                  }
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductList;

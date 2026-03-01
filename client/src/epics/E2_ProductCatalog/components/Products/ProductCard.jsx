// ============================================
// Product Card Component
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Features: Display product, Add to cart
// ============================================

import React from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import "./Products.css";

function ProductCard({ product }) {
  // Legacy guest cart via localStorage; authenticated users go through /api/cart (server-side cart)
  // Add to cart function
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.product._id === product._id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ product, quantity: 1, itemModel: "Product" });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success(`${product.title} added to cart!`);
  };

  // Render
  return (
    <div className="product-card card">
      {/* Product Image */}
      <div className="product-image">
        <img
          src={product.image || "https://via.placeholder.com/300x400?text=Book"}
          alt={product.title}
        />
        {product.isFlashSale && (
          <span className="badge badge-danger featured-badge">Flash Sale</span>
        )}
        {product.isFeatured && (
          <span className="badge badge-success featured-badge">Featured</span>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <div className="product-meta">
          <span className="badge badge-info">{product.grade}</span>
          <span className="product-subject">{product.subject}</span>
        </div>

        <Link to={`/products/${product._id}`} className="product-title">
          <h3>{product.title}</h3>
          {product.titleSinhala && (
            <div className="sinhala-title">{product.titleSinhala}</div>
          )}
        </Link>

        <div className="product-author">By {product.author}</div>

        <p className="product-description">
          {product.description?.substring(0, 80)}...
        </p>

        {/* Price and Rating */}
        <div className="product-footer">
          <div className="product-price">
            <span className="price">Rs. {product.price}</span>
          </div>

          {(product.rating > 0 || product.averageRating > 0) && (
            <div className="product-rating">
              <Star size={14} fill="gold" stroke="none" />{" "}
              {(product.rating || product.averageRating).toFixed(1)} (
              {product.totalReviews || 0})
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <button onClick={addToCart} className="btn btn-primary btn-block">
          <ShoppingCart size={16} /> Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;

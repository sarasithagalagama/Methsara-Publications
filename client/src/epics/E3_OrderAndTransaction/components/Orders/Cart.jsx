// ============================================
// Shopping Cart Component
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Features: View cart, Update quantities, Remove items
// ============================================

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Orders.css";

function Cart() {
  const navigate = useNavigate();
  // State Variables
  const [cartItems, setCartItems] = useState([]);

  // Side Effects
  useEffect(() => {
    loadCart();
  }, []);

  // Event Handlers
  // [E3.1] Cart component uses legacy localStorage 'cart' key (not 'guestCart') — an earlier implementation
  // The pages/Cart.jsx uses the unified guestCart + API system instead
  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);
  };

  // Update quantity
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedCart = [...cartItems];
    updatedCart[index].quantity = newQuantity;
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Remove item
  const removeItem = (index) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    navigate("/checkout");
  };

  // Render
  return (
    <div className="container">
      <h1>Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="empty-cart card">
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* DEMO: Cart Items */}
          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div key={index} className="cart-item card">
                <img
                  src={
                    item.product.mainImage || "https://via.placeholder.com/100"
                  }
                  alt={item.product.name}
                  className="cart-item-image"
                />

                <div className="cart-item-info">
                  <h3>{item.product.name}</h3>
                  <p className="cart-item-meta">
                    {item.product.grade} • {item.product.subject}
                  </p>
                  <p className="cart-item-price">Rs. {item.product.price}</p>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="btn btn-outline btn-sm"
                    >
                      -
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="btn btn-outline btn-sm"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(index)}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="cart-item-total">
                  <strong>Rs. {item.product.price * item.quantity}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* DEMO: Cart Summary */}
          <div className="cart-summary card">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>Rs. {calculateTotal()}</span>
            </div>

            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>Rs. 300</span>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>Rs. {calculateTotal() + 300}</span>
            </div>

            <button
              onClick={proceedToCheckout}
              className="btn btn-primary btn-block"
            >
              Proceed to Checkout
            </button>

            <Link to="/products" className="btn btn-outline btn-block">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;

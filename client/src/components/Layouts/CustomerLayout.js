import React, { useState, useEffect } from "react";
import { Outlet, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../epics/E1_UserAndRoleManagement/context/AuthContext";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  X,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  MapPin,
  MessageCircle,
} from "lucide-react";
import logo from "../../assets/logo.png";
import "./CustomerLayout.css";
import {
  LoginModal,
  RegisterModal,
  LogoutModal,
} from "../../epics/E1_UserAndRoleManagement/components/Auth/AuthModals";

const CustomerLayout = () => {
  const { user, logout: handleLogout, cartCount, wishlistCount } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [headerSearchInput, setHeaderSearchInput] = useState("");
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login")) {
      setIsLoginModalOpen(true);
      setIsRegisterModalOpen(false);
      // Optional: Clear param so it doesn't persist
      setSearchParams((params) => {
        params.delete("login");
        return params;
      });
    }
    if (searchParams.get("register")) {
      setIsRegisterModalOpen(true);
      setIsLoginModalOpen(false);
      setSearchParams((params) => {
        params.delete("register");
        return params;
      });
    }
  }, [searchParams, setSearchParams]);

  const openLogin = (e) => {
    if (e) e.preventDefault();
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
    setIsMobileMenuOpen(false);
  };

  const openRegister = (e) => {
    if (e) e.preventDefault();
    setIsRegisterModalOpen(true);
    setIsLoginModalOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleHeaderSearch = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      if (headerSearchInput.trim()) {
        navigate(`/books?search=${encodeURIComponent(headerSearchInput)}`);
        setHeaderSearchInput("");
        setIsHeaderSearchOpen(false);
      }
    }
  };

  return (
    <div className="customer-layout">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <div className="contact-details">
            <span>
              <Phone size={12} style={{ marginRight: "4px" }} /> 071 432 5383 /
              071 448 5899
            </span>
            <span className="email-hidden-mobile">
              <Mail size={12} style={{ marginRight: "4px" }} />{" "}
              methsarabooks@gmail.com
            </span>
          </div>
          <div className="delivery-notice">
            <span>
              <Globe size={12} style={{ marginRight: "4px" }} /> Island-wide
              Delivery
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo-container">
              <img
                src={logo}
                alt="Methsara Publications"
                className="logo-img"
              />
            </Link>

            <button className="hamburger-btn" onClick={toggleMobileMenu}>
              <Menu size={24} />
            </button>

            <nav
              className={`nav-menu ${isMobileMenuOpen ? "mobile-open" : ""}`}
            >
              <div className="mobile-nav-header">
                <h2>Menu</h2>
                <button className="close-btn" onClick={toggleMobileMenu}>
                  <X size={24} />
                </button>
              </div>
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/books" onClick={() => setIsMobileMenuOpen(false)}>
                Books
              </Link>
              <Link
                to="/gift-vouchers"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Gift Vouchers
              </Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>
                About Us
              </Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                Contact
              </Link>
            </nav>

            <div className="header-icons">
              <div className="header-search-wrapper">
                {isHeaderSearchOpen && (
                  <input
                    type="text"
                    className="header-search-input"
                    placeholder="Search books..."
                    value={headerSearchInput}
                    onChange={(e) => setHeaderSearchInput(e.target.value)}
                    onKeyDown={handleHeaderSearch}
                    autoFocus
                  />
                )}
                <button
                  className="icon-btn nav-search-btn"
                  onClick={() => {
                    if (isHeaderSearchOpen && headerSearchInput.trim()) {
                      handleHeaderSearch({ type: "click" });
                    } else {
                      setIsHeaderSearchOpen(!isHeaderSearchOpen);
                    }
                  }}
                >
                  <Search size={22} strokeWidth={1.8} />
                </button>
              </div>
              <Link
                to="/wishlist"
                className="icon-btn heart-icon"
                title="Wishlist"
              >
                <Heart size={22} strokeWidth={1.8} />
                {wishlistCount > 0 && (
                  <span className="badge">{wishlistCount}</span>
                )}
              </Link>
              <Link to="/cart" className="icon-btn cart-icon" title="View Cart">
                <ShoppingCart size={22} strokeWidth={1.8} />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </Link>

              {user ? (
                <div className="user-profile-menu">
                  <button
                    className="profile-icon"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    onBlur={() =>
                      setTimeout(() => setIsUserMenuOpen(false), 200)
                    }
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                  {isUserMenuOpen && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <p className="user-name">{user.name}</p>
                        <p className="user-email">{user.email}</p>
                      </div>
                      <div className="dropdown-divider"></div>
                      <Link
                        to={
                          user.role === "admin"
                            ? "/admin/dashboard"
                            : user.role === "supplier_manager"
                              ? "/supplier-manager/dashboard"
                              : user.role === "finance_manager"
                                ? "/finance-manager/dashboard"
                                : user.role === "product_manager"
                                  ? "/product-manager/dashboard"
                                  : user.role === "marketing_manager"
                                    ? "/marketing-manager/dashboard"
                                    : [
                                          "master_inventory_manager",
                                          "location_inventory_manager",
                                        ].includes(user.role)
                                      ? "/inventory-manager/dashboard"
                                      : "/customer/dashboard"
                        }
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Dashboard
                      </Link>
                      <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="btn-logout-dropdown"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-btns">
                  <button onClick={openLogin} className="login-link">
                    Login
                  </button>
                  <button onClick={openRegister} className="btn btn-register">
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <img src={logo} alt="Methsara" className="logo-img-footer" />
              </Link>
              <p>
                Empowering Sri Lankan students with quality educational
                materials since 2012. Trusted by over 10,000 students
                nationwide.
              </p>
              <div className="social-links">
                <a href="#" className="social-btn">
                  <Facebook size={18} />
                </a>
                <a href="#" className="social-btn">
                  <Instagram size={18} />
                </a>
                <a href="#" className="social-btn">
                  <Twitter size={18} />
                </a>
              </div>
            </div>

            <div className="footer-nav-col">
              <h3>QUICK LINKS</h3>
              <div className="footer-links">
                <Link to="/">Home</Link>
                <Link to="/books">Books</Link>
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact Us</Link>
                <Link to="/customer/dashboard">My Orders</Link>
              </div>
            </div>

            <div className="footer-contact">
              <h3>CONTACT</h3>
              <div className="contact-list">
                <p>
                  <MapPin size={18} /> Kottawa, Sri Lanka
                </p>
                <p>
                  <Phone size={18} /> 071 432 5383 / 071 448 5899
                </p>
                <p>
                  <Mail size={18} /> methsarabooks@gmail.com
                </p>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <p>&copy; 2026 Methsara Publications. All rights reserved.</p>
            </div>
            <div className="footer-bottom-right">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={openRegister}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={openLogin}
      />
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          handleLogout();
          setIsLogoutModalOpen(false);
        }}
      />
    </div>
  );
};

export default CustomerLayout;

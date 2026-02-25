// Epic: E2 - Product Catalog (Home Page)
// Owner: IT24100548 (Galagama S.T)
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BookOpen,
  GraduationCap,
  FileText,
  ChevronRight,
  Star,
  ShoppingCart,
  TrendingUp,
  Award,
  BookMarked,
  Tags,
  ArrowRight,
  Gift,
} from "lucide-react";
import "./Home.css";

// â”€â”€â”€ DUMMY DATA FOR NEW DESIGN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TESTIMONIALS = [
  {
    name: "Nimesha Rathnayake",
    grade: "A/L Science Student",
    initials: "NR",
    quote:
      "The Biology revision guides made my A/L preparation so much smoother. Clear diagrams and focused explanations!",
    bg: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
  },
  {
    name: "Kavindu Jayasooriya",
    grade: "O/L Student",
    initials: "KJ",
    quote:
      "I bought the Grade 11 Maths past paper book and it covered every key topic perfectly.",
    bg: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  },
  {
    name: "Tharushi Silva",
    grade: "Grade 9 Student",
    initials: "TS",
    quote:
      "My daughter uses the Sinhala guides every day. Her marks improved by 30% within a term!",
    bg: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  },
];

const MAIN_CATEGORIES = [
  {
    name: "A/L",
    icon: <GraduationCap size={28} />,
    desc: "Advanced Level Revisions",
    color: "#8b5cf6",
  },
  {
    name: "Grade 6",
    icon: <BookOpen size={28} />,
    desc: "Primary to Secondary",
    color: "#ec4899",
  },
  {
    name: "Grade 7",
    icon: <BookOpen size={28} />,
    desc: "Junior Secondary",
    color: "#6366f1",
  },
  {
    name: "Grade 8",
    icon: <BookOpen size={28} />,
    desc: "Junior Secondary",
    color: "#3b82f6",
  },
  {
    name: "Grade 9",
    icon: <BookOpen size={28} />,
    desc: "Junior Secondary",
    color: "#10b981",
  },
  {
    name: "Grade 10",
    icon: <FileText size={28} />,
    desc: "Secondary Education",
    color: "#f59e0b",
  },
  {
    name: "Grade 11",
    icon: <FileText size={28} />,
    desc: "Secondary Final Year",
    color: "#ef4444",
  },
  {
    name: "Others",
    icon: <Tags size={28} />,
    desc: "General Readings",
    color: "#6b7280",
  },
];

const Home = () => {
  const [bestSellers, setBestSellers] = useState([]);

  const [loadingBooks, setLoadingBooks] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();

  // Scroll effect for dynamic nav/parallax if needed
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await axios.get("/api/products?sort=popular&limit=5");
        const books = (res.data.products || []).slice(0, 5);
        setBestSellers(books);
      } catch {
        setBestSellers([]);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBestSellers();
  }, []);

  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setAddingToCart(productId);
    try {
      await axios.post(
        "/api/cart/add",
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Optional: Show toast success
    } catch {
      // silently fail
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <main className="home-modern" role="main">
      {/* â”€â”€ HERO SECTION â”€â”€ */}
      <section className="hero-modern">
        <div className="hero-modern-overlay"></div>

        {/* Abstract Floating Shapes for Feel */}
        <div className="modern-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>

        <div className="container hero-modern-content">
          <div className="hero-modern-text">
            <span className="premium-badge animate-fade-in-up">
              <Award size={16} /> Sri Lanka's #1 Educational Publisher
            </span>
            <h1 className="animate-fade-in-up delay-1">
              Unlock Your <br />
              <span className="text-gradient">Academic Potential</span>
            </h1>
            <p className="hero-modern-desc animate-fade-in-up delay-2">
              Discover expertly crafted textbooks, rich revision guides, and
              comprehensive past papers designed to elevate your learning
              journey.
            </p>
            <div className="hero-modern-actions animate-fade-in-up delay-3">
              <Link to="/books" className="btn-modern-primary">
                Explore Collection <ArrowRight size={20} />
              </Link>
              <Link to="/about" className="btn-modern-outline">
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ CATEGORIES EXPANDED â”€â”€ */}
      <section className="section-modern bg-light">
        <div className="container">
          <div className="section-modern-header">
            <div className="animate-fade-in-up">
              <h2 className="title-modern">
                Browse by <span className="text-gradient">Category</span>
              </h2>
              <p className="subtitle-modern">
                Find exactly what you need for your syllabus.
              </p>
            </div>
          </div>

          <div className="category-modern-grid">
            {MAIN_CATEGORIES.map((cat, idx) => (
              <Link
                to={`/books?category=${encodeURIComponent(cat.name)}`}
                key={idx}
                className="category-modern-card"
              >
                <div
                  className="cat-icon-wrapper"
                  style={{
                    color: cat.color,
                    backgroundColor: `${cat.color}15`,
                  }}
                >
                  {cat.icon}
                </div>
                <div className="cat-text">
                  <h3>{cat.name}</h3>
                  <p>{cat.desc}</p>
                </div>
                <div className="cat-arrow">
                  <ChevronRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ TRENDING / BEST SELLERS (Horizontal Scrollable or Grid) â”€â”€ */}
      <section className="section-modern">
        <div className="container">
          <div className="section-modern-header flex-between">
            <div className="animate-fade-in-up">
              <div className="badge-modern">
                <TrendingUp size={16} /> Trending Now
              </div>
              <h2 className="title-modern">
                Best <span className="text-gradient">Sellers</span>
              </h2>
            </div>
            <Link
              to="/books"
              className="link-modern animate-fade-in-up delay-1"
            >
              View Entire Catalog <ArrowRight size={18} />
            </Link>
          </div>

          <div className="book-modern-grid">
            {loadingBooks ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="book-modern-card skeleton">
                  <div className="skeleton-img"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                </div>
              ))
            ) : bestSellers.length > 0 ? (
              bestSellers.map((book) => (
                <div
                  key={book._id}
                  className="book-modern-card"
                  onClick={() => navigate(`/books/${book._id}`)}
                >
                  <div className="book-modern-img-box">
                    <img
                      src={
                        book.image ||
                        `https://via.placeholder.com/400x550/fdfbf7/5D4037?text=${encodeURIComponent(book.title)}`
                      }
                      alt={book.title}
                    />
                    <div className="book-modern-actions-overlay">
                      <button
                        className="btn-modern-quick-add"
                        onClick={(e) => handleAddToCart(book._id, e)}
                        disabled={addingToCart === book._id}
                      >
                        {addingToCart === book._id ? (
                          "Adding..."
                        ) : (
                          <>
                            <ShoppingCart size={18} /> Quick Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="book-modern-info">
                    <span className="book-modern-category">
                      {book.category || "Education"}
                    </span>
                    <h3 className="book-modern-title">{book.title}</h3>
                    <div className="book-modern-price-row">
                      <span className="book-modern-price">
                        LKR {book.price?.toLocaleString()}
                      </span>
                      {book.averageRating > 0 && (
                        <div className="book-modern-rating">
                          <Star size={14} fill="#fbbf24" color="#fbbf24" />
                          <span>{book.averageRating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{ color: "var(--text-secondary)", fontStyle: "italic" }}
              >
                Loading titles...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* â”€â”€ IMMERSIVE PROMO SECTION â”€â”€ */}
      <section className="section-modern promo-immersive">
        <div className="promo-modern-bg"></div>
        <div className="container">
          <div className="promo-modern-content animate-fade-in-up">
            <BookMarked
              size={48}
              color="var(--secondary-light)"
              style={{ marginBottom: "1.5rem" }}
            />
            <h2>Elevate Your Learning Experience</h2>
            <p>
              Our books aren't just paper; they are meticulously crafted tools
              designed by leading educators to ensure you grasp every concept.
              Join our community of high achievers.
            </p>
            <div
              className="hero-modern-actions"
              style={{ justifyContent: "center", marginTop: "2rem" }}
            >
              <Link to="/about" className="btn-modern-secondary">
                Learn Why Students Choose Us
              </Link>
              <Link
                to="/gift-vouchers"
                className="btn-modern-outline"
                style={{ borderColor: "rgba(255,255,255,0.5)" }}
              >
                <Gift size={20} style={{ marginRight: "8px" }} /> Gift Vouchers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ TESTIMONIALS (Masonry style or elegant layout) â”€â”€ */}
      <section className="section-modern bg-light">
        <div className="container">
          <div className="section-modern-header centered animate-fade-in-up">
            <h2 className="title-modern">
              Words from our <span className="text-gradient">Scholars</span>
            </h2>
          </div>

          <div className="testimonials-modern-grid">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="test-modern-card"
                style={{ background: t.bg }}
              >
                <div className="test-quote-icon">"</div>
                <p className="test-modern-text">{t.quote}</p>
                <div className="test-modern-author">
                  <div className="test-modern-avatar">{t.initials}</div>
                  <div>
                    <h4>{t.name}</h4>
                    <span>{t.grade}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;

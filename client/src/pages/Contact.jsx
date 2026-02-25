import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Clock,
} from "lucide-react";
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      alert("Message Sent Successfully! We'll be in touch soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="contact-modern-page">
      {/* ── HERO SECTION ── */}
      <section className="contact-modern-hero">
        <div className="contact-hero-bg"></div>
        <div className="container contact-hero-content">
          <div className="badge-modern animate-fade-in-up">
            We're Here for You
          </div>
          <h1 className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Let's Start a <span className="text-gradient">Conversation</span>
          </h1>
          <p className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Whether you're looking for book recommendations, bulk orders for
            your school, or support with an existing order, our team is ready to
            assist.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT (SPLIT) ── */}
      <section className="contact-modern-main container">
        <div className="contact-split-modern">
          {/* Left Side: Contact Info & Map */}
          <div className="contact-info-side">
            <div className="info-modern-card">
              <h3>Get in Touch</h3>
              <p className="info-modern-desc">
                Reach out directly via phone or email, or drop by our showroom.
              </p>

              <div className="info-modern-list">
                <div className="info-modern-item">
                  <div className="icon-modern-box">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4>Call Us</h4>
                    <p>+94 71 432 5383</p>
                    <p>+94 71 448 5899</p>
                  </div>
                </div>

                <div className="info-modern-item">
                  <div className="icon-modern-box">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4>Email Us</h4>
                    <p>methsarabooks@gmail.com</p>
                    <p>support@methsara.lk</p>
                  </div>
                </div>

                <div className="info-modern-item">
                  <div className="icon-modern-box">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4>Visit Us</h4>
                    <p>No. 123, High Level Road,</p>
                    <p>Kottawa, Sri Lanka.</p>
                  </div>
                </div>

                <div className="info-modern-item">
                  <div className="icon-modern-box">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4>Opening Hours</h4>
                    <p>Mon - Sat: 9.00 AM - 6.00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="social-modern-connect">
                <h4>Follow Our Journey</h4>
                <div className="social-modern-icons">
                  <a href="#" className="metric-icon">
                    <Facebook size={20} />
                  </a>
                  <a href="#" className="metric-icon">
                    <Twitter size={20} />
                  </a>
                  <a href="#" className="metric-icon">
                    <Instagram size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Elegant Form */}
          <div className="contact-form-side">
            <div className="form-modern-card">
              <h2>
                Send us a <span className="text-gradient">Message</span>
              </h2>
              <p>
                Fill out the form below and we will get back to you within 24
                hours.
              </p>

              <form onSubmit={handleSubmit} className="premium-modern-form">
                <div className="form-modern-row">
                  <div className="form-modern-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="John Wick"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-modern-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@contintental.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-modern-group">
                  <label>Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select an inquiry type...
                    </option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Order Support">Order Support</option>
                    <option value="Bulk Order Request">
                      Bulk Order Request (Schools/Institutes)
                    </option>
                    <option value="Author Submission">
                      Author/Manuscript Submission
                    </option>
                  </select>
                </div>

                <div className="form-modern-group">
                  <label>Your Message</label>
                  <textarea
                    name="message"
                    rows="5"
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn-modern-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send size={18} /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP ABSTRACT SECTION ── */}
      <section className="map-modern-section">
        <div className="container">
          <div className="map-modern-wrapper">
            <div className="map-abstract-visual">
              {/* Abstract placeholder for map */}
              <div className="map-marker-pin">
                <MapPin size={32} fill="var(--secondary-color)" color="white" />
                <div className="pulse-ring"></div>
              </div>
            </div>
            <div className="map-modern-text">
              <h3>Find Our Flagship Store</h3>
              <p>
                Located in the heart of Kottawa, our flagship store offers the
                complete collection of Methsara Publications. Drop by to browse,
                ask questions, or just to say hello.
              </p>
              <a
                href="#"
                className="btn-modern-outline"
                style={{
                  borderColor: "var(--primary-dark)",
                  color: "var(--primary-dark)",
                  marginTop: "1rem",
                }}
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

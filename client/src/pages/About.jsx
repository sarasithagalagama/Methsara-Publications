import React, { useEffect, useState } from "react";
import "./About.css";
import {
  Award,
  BookOpen,
  Users,
  MapPin,
  ChevronRight,
  Target,
  Shield,
  Heart,
} from "lucide-react";

const About = () => {
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-modern-page">
      {/* ── HERO SECTION ── */}
      <section className="about-modern-hero">
        <div className="about-hero-bg"></div>
        <div className="container about-hero-content">
          <div className="badge-modern animate-fade-in-up">Since 2012</div>
          <h1 className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Empowering the Next Generation of{" "}
            <span className="text-gradient">Sri Lankan Scholars</span>
          </h1>
          <p className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            From a humble printing press to Sri Lanka's leading educational
            publisher, our journey is defined by a singular commitment: making
            academic excellence accessible to every student.
          </p>
        </div>
      </section>

      {/* ── METRICS OVERLAP ── */}
      <section className="about-metrics container">
        <div className="metrics-modern-grid">
          <div className="metric-modern-card">
            <div className="metric-icon">
              <Award size={32} />
            </div>
            <h3>12+</h3>
            <span>Years of Excellence</span>
          </div>
          <div className="metric-modern-card">
            <div className="metric-icon">
              <BookOpen size={32} />
            </div>
            <h3>500+</h3>
            <span>Book Titles Published</span>
          </div>
          <div className="metric-modern-card">
            <div className="metric-icon">
              <Users size={32} />
            </div>
            <h3>100k+</h3>
            <span>Students Impacted</span>
          </div>
          <div className="metric-modern-card">
            <div className="metric-icon">
              <MapPin size={32} />
            </div>
            <h3>100%</h3>
            <span>Local Ownership</span>
          </div>
        </div>
      </section>

      {/* ── STORY SECTION (SPLIT) ── */}
      <section
        id="story"
        className={`section-modern story-modern bg-light animate-on-scroll ${isVisible["story"] ? "is-visible" : ""}`}
      >
        <div className="container">
          <div className="story-split-modern">
            <div className="story-modern-text">
              <h2 className="title-modern">
                Our <span className="text-gradient">Story</span>
              </h2>
              <p className="lead-text">
                Methsara Publications was born out of a simple, yet profound
                realization: students needed resources that didn't just dump
                information, but actually <em>taught</em> them how to think and
                succeed.
              </p>
              <p>
                Over the past decade, we have worked closely with the leading
                educators, examiners, and subject matter experts in Sri Lanka to
                craft textbooks, past papers, and revision guides that are
                meticulously aligned with the national curriculum.
              </p>
              <p>
                Today, our books are a staple in classrooms and homes across the
                island, serving as trusted companions for students tackling the
                critical Grade 6-11 years, as well as the rigorous G.C.E. O/L
                and A/L examinations.
              </p>
              <div className="founder-quote">
                "We don't just print books; we engineer pathways to university
                and beyond."
                <span className="founder-name">— The Methsara Team</span>
              </div>
            </div>

            <div className="story-modern-visual">
              <div className="visual-collage">
                <img
                  src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1267&q=80"
                  alt="Methsara Office"
                  className="collage-img-1"
                />
                <img
                  src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                  alt="Students studying"
                  className="collage-img-2"
                />
                <div className="collage-accent-box"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section
        id="values"
        className={`section-modern animate-on-scroll ${isVisible["values"] ? "is-visible" : ""}`}
      >
        <div className="container">
          <div className="section-modern-header centered">
            <h2 className="title-modern">
              Our Core <span className="text-gradient">Values</span>
            </h2>
            <p className="subtitle-modern">
              The principles that guide everything we publish.
            </p>
          </div>

          <div className="values-modern-grid">
            <div className="value-modern-card">
              <div className="value-icon">
                <Target size={32} />
              </div>
              <h3>Precision &amp; Accuracy</h3>
              <p>
                Every diagram, equation, and explanation is rigorously
                fact-checked against the latest national syllabus guidelines.
              </p>
            </div>

            <div className="value-modern-card highlighted">
              <div className="value-icon">
                <Heart size={32} />
              </div>
              <h3>Student-Centric</h3>
              <p>
                We write in a way that respects the student's time and
                intelligence, breaking down complex topics into digestible
                formats.
              </p>
            </div>

            <div className="value-modern-card">
              <div className="value-icon">
                <Shield size={32} />
              </div>
              <h3>Unpromising Quality</h3>
              <p>
                From the pedagogical structure to the physical quality of the
                paper and binding, we deliver products.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="about-modern-cta">
        <div className="container">
          <div className="cta-modern-box">
            <h2>Join the thousands of students achieving their dreams.</h2>
            <a
              href="/books"
              className="btn-modern-primary"
              style={{ marginTop: "2rem" }}
            >
              Browse Our Books <ChevronRight size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

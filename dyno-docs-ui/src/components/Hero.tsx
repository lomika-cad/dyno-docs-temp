import "../styles/hero.css";

const HeroSection = () => {
  return (
    <section className="hero-container">

      {/* Shapes */}
      <div className="shape triangle-shape"></div>
      <div className="shape big-circle-left"></div>
      <div className="shape circle-outline-right"></div>
      <div className="shape small-dot-right"></div>
      <div className="shape big-circle-bottom-right"></div>

      <div className="hero-content">
        <h2 className="hero-title">
          All-In-One <span>Dynamic Reporting</span> Platform
        </h2>

        <h2 className="hero-title">
          Built for Efficient Travel Agencies.
        </h2>

        <p className="hero-description">
          Generate clear, customizable travel reports instantly. Automate
          workflows, analyze performance, and help your travel agency make
          smarter, faster data-driven decisions effortlessly.
        </p>

        <button className="hero-btn">Get started for free</button>
      </div>

    </section>
  );
};

export default HeroSection;

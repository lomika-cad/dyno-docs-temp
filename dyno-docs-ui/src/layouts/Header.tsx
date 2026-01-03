import { useState } from "react";
import "../styles/header.css";
import logo from "../assets/dyno-docs.png"
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* Logo */}
          <div className="logo">
            <img
              src={logo}
              alt="DynoDocs"
            />
          </div>

          {/* Desktop Menu */}
          <nav className="nav-links">
            <a href="#">Documentation</a>
            <a href="#">Pricing</a>
            <a href="#">About Us</a>
            <a href="#">Contact Us</a>
          </nav>

          {/* Action Buttons */}
          <div className="auth-buttons">
            <button className="sign-in" onClick={() => navigate("/dashboard")}>Sign In</button>
            <button className="sign-up">Sign Up</button>
          </div>

          {/* Hamburger Menu (tablet/mobile) */}
          <div className="menu-icon" onClick={() => setOpen(true)}>
            ☰
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {open && (
        <div className="mobile-drawer">
          <div className="drawer-content">
            <button className="close-drawer" onClick={() => setOpen(false)}>
              ✕
            </button>

            <a href="#" onClick={() => setOpen(false)}>Documentation</a>
            <a href="#" onClick={() => setOpen(false)}>Pricing</a>
            <a href="#" onClick={() => setOpen(false)}>About Us</a>
            <a href="#" onClick={() => setOpen(false)}>Contact Us</a>

            <button className="sign-in-1"  onClick={() => navigate("/dashboard")}>Sign In</button>
            <button className="sign-up-1">Sign Up</button>
          </div>
        </div>
      )}
    </>
  );
}

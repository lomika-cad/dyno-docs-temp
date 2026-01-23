import { useState } from "react";
import "../styles/header.css";
import logo from "../assets/dyno-docs.png"
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* Logo */}
          <div className="logo">
            <img
              src={logo}
              alt="DynoDocs"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Desktop Menu */}
          <nav className="nav-links">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/docs'); setOpen(false); }}
              className={location.pathname.startsWith('/docs') ? 'active' : ''}
            >Documentation</a>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/pricing'); setOpen(false); }}
              className={location.pathname.startsWith('/pricing') ? 'active' : ''}
            >Pricing</a>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/about'); setOpen(false); }}
              className={location.pathname.startsWith('/about') ? 'active' : ''}
            >About Us</a>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/contact'); setOpen(false); }}
              className={location.pathname.startsWith('/contact') ? 'active' : ''}
            >Contact Us</a>
          </nav>

          {/* Action Buttons */}
          <div className="auth-buttons">
            <button
              className={"sign-in " + (location.pathname.startsWith('/dashboard') ? 'active' : '')}
              onClick={() => navigate("/dashboard")}
            >Sign In</button>
            <button
              className={"sign-up " + (location.pathname.startsWith('/signup') ? 'active' : '')}
              onClick={() => navigate('/signup')}
            >Sign Up</button>
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

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/docs'); setOpen(false); }}
              className={location.pathname.startsWith('/docs') ? 'active' : ''}
            >Documentation</a>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/pricing'); setOpen(false); }}
              className={location.pathname.startsWith('/pricing') ? 'active' : ''}
            >Pricing</a>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/about'); setOpen(false); }}
              className={location.pathname.startsWith('/about') ? 'active' : ''}
            >About Us</a>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/contact'); setOpen(false); }}
              className={location.pathname.startsWith('/contact') ? 'active' : ''}
            >Contact Us</a>

            <button
              className={"sign-in-1 " + (location.pathname.startsWith('/dashboard') ? 'active' : '')}
              onClick={() => { navigate('/dashboard'); setOpen(false); }}
            >Sign In</button>

            <button
              className={"sign-up-1 " + (location.pathname.startsWith('/signup') ? 'active' : '')}
              onClick={() => { navigate('/signup'); setOpen(false); }}
            >Sign Up</button>
          </div>
        </div>
      )}
    </>
  );
}

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import "../styles/navbar.css";
import logo from "../assets/dyno-docs.png";

export type NavbarItem = {
  label: string;
  to: string;
};

export type NavbarProps = {
  children: ReactNode;
  items?: NavbarItem[];
  userName?: string;
};

export default function Navbar({
  children,
  items,
  userName = "User",
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo<NavbarItem[]>(
    () =>
      items ?? [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Agency Data", to: "/agency-data" },
        { label: "Partnerships", to: "/partnerships" },
        { label: "Templates", to: "/templates" },
        { label: "Promo Codes", to: "/promo-codes" },
        { label: "Chatbot Integration", to: "/chatbot-integration" },
        { label: "Chats", to: "/chats" },
        { label: "Report Generation", to: "/report-generation" },
        { label: "Report History", to: "/report-history" },
        { label: "Customer Profiles", to: "/customer-profiles" },
      ],
    [items]
  );

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}
        aria-label="Primary"
      >
        <div className="sidebar__brand">
          <img className="sidebar__logo" src={logo} alt="DynoDocs" />
        </div>

        <nav className="sidebar__nav" aria-label="Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
              onClick={closeMobile}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="sidebar__logout" onClick={closeMobile}>
          Logout
        </button>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar__backdrop"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      )}

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="topbar__menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={toggleMobile}
          >
            ☰
          </button>

          <div className="topbar__spacer" />

          <div className="topbar__user" aria-label="User">
            <span className="topbar__greeting">Hi, {userName}</span>
            <span className="topbar__avatar" aria-hidden="true">
              👤
            </span>
          </div>
        </header>

        <main className="main__content">{children}</main>
      </div>
    </div>
  );
}
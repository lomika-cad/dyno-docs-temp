import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import SourceRoundedIcon from "@mui/icons-material/SourceRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import ViewModuleRoundedIcon from "@mui/icons-material/ViewModuleRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import "../styles/navbar.css";
import logo from "../assets/dyno-docs.png";

export type NavbarItem = {
    label: string;
    to: string;
    icon?: ReactNode;
};

export type NavbarProps = {
    children: ReactNode;
    items?: NavbarItem[];
    userName?: string;
};

function Icon({ children }: { children: ReactNode }) {
    return <span className="sidebar__icon">{children}</span>;
}

const DEFAULT_ITEMS: NavbarItem[] = [
    {
        label: "Dashboard",
        to: "/dashboard",
        icon: (
            <Icon>
                <DashboardRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
    {
        label: "Agency Data",
        to: "/agency-data",
        icon: (
            <Icon>
                <SourceRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
    {
        label: "Partnerships",
        to: "/partnerships",
        icon: (
            <Icon>
                <HandshakeRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
    {
        label: "Templates",
        to: "/templates",
        icon: (
            <Icon>
                <ViewModuleRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
    {
        label: "Promo Codes",
        to: "/promo-codes",
        icon: (
            <Icon>
                <LocalOfferRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
    {
        label: "Chatbot Integration",
        to: "/chatbot-integration",
        icon: (
            <Icon>
                <SmartToyRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
    {
        label: "Chats",
        to: "/chats",
        icon: (
            <Icon>
                <ChatRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
    {
        label: "Report Generation",
        to: "/report-generation",
        icon: (
            <Icon>
                <DescriptionRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
    {
        label: "Report History",
        to: "/report-history",
        icon: (
            <Icon>
                <HistoryRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
    {
        label: "Customer Profiles",
        to: "/customer-profiles",
        icon: (
            <Icon>
                <PeopleAltRoundedIcon fontSize="small" />
            </Icon>
        ),
    },
];

export default function Navbar({
    children,
    items,
    userName = "User",
}: NavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = items ?? DEFAULT_ITEMS;

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
                            onClick={() => setMobileOpen(false)}
                        >
                            {item.icon}
                            <span className="sidebar__label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <button
                    type="button"
                    className="sidebar__logout"
                    onClick={() => setMobileOpen(false)}
                >
                    Logout
                </button>
            </aside>

            {mobileOpen && (
                <button
                    type="button"
                    className="sidebar__backdrop"
                    aria-label="Close navigation"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div className="main">
                <header className="topbar">
                    <button
                        type="button"
                        className="topbar__menu"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen((v) => !v)}
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

                <main className="main__content">
                    <div className="main__card">
                        {children}
                    </div>                    
                </main>
            </div>
        </div>
    );
}
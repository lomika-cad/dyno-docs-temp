import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { CircularProgress } from "@mui/material";
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
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import "../styles/navbar.css";
import "../styles/agencyData.css";
import "../styles/home.css";
import logo from "../assets/dyno-docs.png";
import logoutIcon from "../assets/switch.png";
import { getMe } from "../services/me-api";
import { getPricingPlans } from "../services/pricing-plan-api";
import { updateSubscription } from "../services/user-subscription-api";
import { showError, showSuccess } from "../components/Toast";
import CardPayment from "../components/CardPayment";
import useIdleTimer from "../hooks/IdleTimer";
import TimeoutImg from "../assets/waste.png";

export type NavbarItem = {
    label: string;
    to: string;
    icon?: ReactNode;
};

export type NavbarProps = {
    children: ReactNode;
    items?: NavbarItem[];
};

function Icon({ children }: { children: ReactNode }) {
    return <span className="sidebar-icon">{children}</span>;
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
        to: "/chatbot",
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

type SubscriptionInfo = {
    plan: string;
    expiry: string | null;
    isActive: boolean;
    reportLimit: string | null;
    templateLimit: string | null;
};

type PricingModalProps = {
    open: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

function PricingModal({ open, onClose, onUpdated }: PricingModalProps) {
    const [yearly, setYearly] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkoutPlan, setCheckoutPlan] = useState<{ id: string; amount: number } | null>(
        null,
    );

    const token = sessionStorage.getItem("dd_token") || "";

    const handleUpdatePlan = async (planId: string) => {
        const body = {
            tenantId: sessionStorage.getItem("dd_tenant_id") || "",
            planId,
            planType: yearly ? 1 : 0,
            planName: plans.find((p) => p.id === planId)?.title || "",
        }

        try {
            await updateSubscription(body, token);
            showSuccess("Subscription updated successfully.");
            onUpdated?.();
            onClose();
        } catch (error:any) {
            showError(error.response?.data?.message || "Failed to update subscription. Please try again.");
        }
    }

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        const loadPlans = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getPricingPlans();
                if (cancelled) return;

                const data = response.data.map((p: any) => ({
                    id: p.id ?? p.planName?.toLowerCase() ?? Math.random().toString(36).slice(2),
                    title: p.planName ?? p.title ?? "",
                    monthly: Number(p.monthlyPrice ?? p.monthly ?? 0),
                    yearly: Number(p.yearlyPrice ?? p.yearly ?? 0),
                    description: p.description ?? "",
                    features: p.features ?? [],
                }));

                setPlans(data);
            } catch (err) {
                if (!cancelled) {
                    setError("Failed to load pricing plans.");
                    setPlans([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadPlans();

        return () => {
            cancelled = true;
        };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="ddModal ddModal--large"
            role="dialog"
            aria-modal="true"
            aria-label="Pricing plans"
        >
            <button
                type="button"
                className="ddModal-backdrop"
                aria-label="Close pricing"
                onClick={onClose}
            />

            <div className="ddModal-card ddModal-card--large">
                <div className="ddModal-header">
                    <div>
                        <h2 className="detailSection-title">Choose your plan</h2>
                        <p className="detailSection-text" style={{ fontSize: 13 }}>
                            Upgrade DynoDocs to unlock higher limits and features.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="ddModal-close"
                        aria-label="Close pricing"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="ddModal-content">
                    {!checkoutPlan && (
                        <>
                            <section className="pricing-hero" style={{ paddingTop: 0 }}>
                                <div className="billing-row">
                                    <span className={!yearly ? "active" : ""}>Monthly</span>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            aria-label="Toggle yearly billing"
                                            checked={yearly}
                                            onChange={() => setYearly((s) => !s)}
                                        />
                                        <span className="slider" />
                                    </label>
                                    <span className={yearly ? "active" : ""}>
                                        Yearly <small className="badge">30% discount</small>
                                    </span>
                                </div>
                            </section>

                            <section className="pricing-cards pricing-cards1">
                                {loading && (
                                    <div
                                        className="globalLoader"
                                        role="status"
                                        aria-live="polite"
                                    >
                                        <CircularProgress
                                            size={56}
                                            sx={{ color: "var(--accent-600, #ff6b00)" }}
                                        />
                                    </div>
                                )}

                                {error && !loading && (
                                    <div style={{ color: "#dc2626" }}>Error: {error}</div>
                                )}

                                {!loading && !error &&
                                    plans.map((p) => {
                                        const lowerTitle = p.title.toLowerCase();
                                        const isHighlight = lowerTitle.includes("professional");
                                        const isFree =
                                            (p.monthly === 0 && p.yearly === 0) ||
                                            lowerTitle.includes("free");
                                        if (isFree) return null;

                                        const amount = yearly ? p.yearly : p.monthly;

                                        return (
                                            <article
                                                key={p.id}
                                                className={
                                                    "card " + (isHighlight ? "highlight" : "")
                                                }
                                            >
                                                <div className="card-head">
                                                    <span
                                                        style={{ fontSize: "16px", fontWeight: 600 }}
                                                    >
                                                        {p.title}
                                                    </span>
                                                </div>

                                                <div className="card-body">
                                                    <div className="price">
                                                        <span className="currency">$</span>
                                                        <span className="amount">
                                                            {yearly
                                                                ? amount === 0
                                                                    ? "0.00"
                                                                    : amount.toFixed(2)
                                                                : amount.toFixed(2)}
                                                        </span>
                                                        <span className="period">
                                                            {yearly ? "/per year" : "/per month"}
                                                        </span>
                                                    </div>

                                                    <p className="desc">{p.description}</p>

                                                    <button
                                                        className={
                                                            isHighlight
                                                                ? "btn btn-primary1"
                                                                : "btn btn-ghost"
                                                        }
                                                        onClick={() =>
                                                            setCheckoutPlan({
                                                                id: p.id,
                                                                amount,
                                                            })
                                                        }
                                                    >
                                                        Get Started
                                                    </button>

                                                    <hr />

                                                    <ul className="features">
                                                        {p.features.map((f: string) => (
                                                            <li key={f}>
                                                                <span className="check">✓</span>
                                                                <span className="feat-text">{f}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </article>
                                        );
                                    })}
                            </section>
                        </>
                    )}

                    {checkoutPlan && (
                        <CardPayment
                            totalAmount={checkoutPlan.amount}
                            onPaid={() => handleUpdatePlan(checkoutPlan.id)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Navbar({ children, items }: NavbarProps) {

    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const [pricingOpen, setPricingOpen] = useState(false);
    const [idleModalOpen, setIdleModalOpen] = useState(false);
    const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>(() => ({
        plan: sessionStorage.getItem("dd_subscription_plan") || "Free",
        expiry: sessionStorage.getItem("dd_subscription_expiry"),
        isActive: sessionStorage.getItem("dd_subscription_isActive") === "true",
        reportLimit: sessionStorage.getItem("dd_report_limit"),
        templateLimit: sessionStorage.getItem("dd_template_limit"),
    }));

    const navItems = items ?? DEFAULT_ITEMS;

    const token = sessionStorage.getItem("dd_token") || "";
    const userName = sessionStorage.getItem("dd_full_name") || "User";
    const subscriptionPlan = subscriptionInfo.plan || "Free";
    const subscriptionExpiry = subscriptionInfo.expiry;
    const subscriptionIsActive = subscriptionInfo.isActive;
    const reportLimit = subscriptionInfo.reportLimit;
    const templateLimit = subscriptionInfo.templateLimit;

    const persistSessionValue = (key: string, value: string | null) => {
        if (value === null) {
            sessionStorage.removeItem(key);
        } else {
            sessionStorage.setItem(key, value);
        }
    };

    const formattedExpiry = (() => {
        if (!subscriptionExpiry) return "";
        const date = new Date(subscriptionExpiry);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    })();

    const handleIdleModalClose = useCallback(() => {
        setIdleModalOpen(false);
        sessionStorage.clear();
        window.location.href = "/";
    }, []);

    const handleIdleTimeout = () => {
        setIdleModalOpen(true);
    }

    useIdleTimer({
        timeout: 15 * 60 * 1000,
        onIdle: handleIdleTimeout,
    });

    useEffect(() => {
        if (!idleModalOpen) return;

        const handleGlobalClick = () => {
            handleIdleModalClose();
        };

        window.addEventListener("click", handleGlobalClick);

        return () => {
            window.removeEventListener("click", handleGlobalClick);
        };
    }, [idleModalOpen, handleIdleModalClose]);

    const handleMe = async () => {
        try {
            const res = await getMe(token, sessionStorage.getItem("dd_tenant_id") || "");
            console.log(res);

            const nextInfo: SubscriptionInfo = {
                plan: res.planName ?? "Free",
                expiry: res.endDate ?? null,
                isActive: Boolean(res.isActive),
                reportLimit:
                    res.reportsLimit === null || res.reportsLimit === undefined
                        ? null
                        : String(res.reportsLimit),
                templateLimit:
                    res.templatesLimit === null || res.templatesLimit === undefined
                        ? null
                        : String(res.templatesLimit),
            };

            setSubscriptionInfo(nextInfo);

            sessionStorage.setItem("dd_subscription_plan", nextInfo.plan);
            persistSessionValue("dd_subscription_expiry", nextInfo.expiry);
            persistSessionValue("dd_report_limit", nextInfo.reportLimit);
            persistSessionValue("dd_template_limit", nextInfo.templateLimit);
            persistSessionValue(
                "dd_discount_percentage",
                res.discountPercentage === null || res.discountPercentage === undefined
                    ? null
                    : String(res.discountPercentage),
            );
            sessionStorage.setItem("dd_subscription_isActive", String(nextInfo.isActive));
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        handleMe();
    }, []);

    useEffect(() => {
        if (!token) {
            handleLogout();
        }
    }, [token]);

    const handleLogout = () => {
        sessionStorage.clear();
        window.location.href = "/";
    }

    const handleLogoutClick = () => {
        setLogoutConfirmOpen(true);
    }

    const handleLogoutConfirm = () => {
        setLogoutConfirmOpen(false);
        handleLogout();
    }

    const handleLogoutCancel = () => {
        setLogoutConfirmOpen(false);
    }

    return (
        <div className="app-shell">
            <PricingModal
                open={pricingOpen}
                onClose={() => setPricingOpen(false)}
                onUpdated={handleMe}
            />
            {logoutConfirmOpen && (
                <div
                    className="ddModal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirm logout"
                >
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={handleLogoutCancel}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-logo" aria-hidden="true">
                            <img className="ddModal-img" src={logoutIcon} alt="Logout icon" />
                        </div>

                        <div className="ddModal-title">Logout</div>
                        <div className="ddModal-subtitle">
                            Are you sure you want to logout?
                        </div>

                        <div className="ddModal-actions">
                            <button
                                type="button"
                                className="ddModal-btn ddModal-btn--ghost"
                                onClick={handleLogoutCancel}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--danger"
                                onClick={handleLogoutConfirm}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {idleModalOpen && (
                <div
                    className="ddModal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Session timed out"
                >
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Dismiss session timeout"
                        onClick={handleIdleModalClose}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-title">Session timed out</div>
                        <br />
                        <img style={{width: "80px", height: "80px"}} src={TimeoutImg} alt="" />
                        <br />
                        <div className="ddModal-subtitle">
                            You were inactive for too long. Click anywhere to continue.
                        </div>
                    </div>
                </div>
            )}
            <aside
                className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}
                aria-label="Primary"
            >
                <div className="sidebar-brand">
                    <img className="sidebar-logo" src={logo} alt="DynoDocs" />
                </div>

                <nav className="sidebar-nav" aria-label="Navigation">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
                            }
                            onClick={async () => {
                                await handleMe();
                                setMobileOpen(false);
                            }}
                        >
                            {item.icon}
                            <span className="sidebar-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <button
                    type="button"
                    className="sidebar-logout"
                    onClick={handleLogoutClick}
                >
                    Logout
                </button>
            </aside>

            {mobileOpen && (
                <button
                    type="button"
                    className="sidebar-backdrop"
                    aria-label="Close navigation"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div className="main">
                <header className="topbar">
                    <button
                        type="button"
                        className="topbar-menu"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen((v) => !v)}
                    >
                        ☰
                    </button>

                    <div className="topbar-spacer" />

                    <div className="topbar-subscription" aria-label="Subscription summary">
                        <div className="subscription-pill subscription-pill--plan">
                            {/* <WorkspacePremiumRoundedIcon fontSize="small" /> */}
                            <span>{subscriptionPlan} plan</span>
                            {(!subscriptionIsActive || subscriptionPlan.toLowerCase() === "free") && (
                                <button
                                    type="button"
                                    className="subscription-plan-cta"
                                    aria-label="View pricing plans"
                                    onClick={() => setPricingOpen(true)}
                                >
                                    <AddRoundedIcon fontSize="inherit" />
                                </button>
                            )}
                        </div>

                        <div className="subscription-pill subscription-pill--status">
                            <span
                                className={`subscription-status-dot ${subscriptionIsActive ? "subscription-status-dot--active" : "subscription-status-dot--inactive"}`}
                                aria-hidden="true"
                            />
                            <span>{subscriptionIsActive ? "Active" : "Inactive"}</span>
                        </div>

                        {formattedExpiry && subscriptionPlan.toLowerCase() !== "free" && (
                            <div className="subscription-pill subscription-pill--muted">
                                <EventAvailableRoundedIcon fontSize="small" />
                                <span>Expire - {formattedExpiry}</span>
                            </div>
                        )}

                        {(reportLimit || templateLimit) && (
                            <div className="subscription-pill subscription-pill--muted">
                                {reportLimit && (
                                    <span className="subscription-metric">
                                        <DescriptionRoundedIcon className="subscription-metric-icon" fontSize="inherit" />
                                        <span>{reportLimit === "-1" ? "Unlimited" : reportLimit} reports</span>
                                    </span>
                                )}

                                {reportLimit && templateLimit && (
                                    <span className="subscription-metric-divider" aria-hidden="true" />
                                )}

                                {templateLimit && (
                                    <span className="subscription-metric">
                                        <ViewModuleRoundedIcon className="subscription-metric-icon" fontSize="inherit" />
                                        <span>{templateLimit === "-1" ? "Unlimited" : templateLimit} templates</span>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="topbar-user" aria-label="User">
                        <span className="topbar-avatar" aria-hidden="true">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </header>

                <main className="main-content">
                    {!subscriptionIsActive && (
                        <div className="subscription-warning" role="alert">
                            <div className="subscription-warning-text">
                                <span className="subscription-warning-title">Subscription inactive</span>
                                <span>Please activate your subscription plan.</span>                            </div>
                            <button
                                type="button"
                                className="subscription-warning-action"
                                onClick={() => setPricingOpen(true)}
                            >
                                View plans
                            </button>
                        </div>
                    )}

                    <div className="main-card">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
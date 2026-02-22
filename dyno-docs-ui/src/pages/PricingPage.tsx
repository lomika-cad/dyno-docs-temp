import { useEffect, useState } from "react";
import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import "../styles/home.css";
import { getPricingPlans } from "../services/pricing-plan-api";
import { CircularProgress } from "@mui/material";
import SignInModal from "../components/SignInModal";

export default function PricingPage() {
    const [yearly, setYearly] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openSignIn, setOpenSignIn] = useState(false);

    const handleCloseSignIn = () => {
        setOpenSignIn(false);
    }

    const handleGetPricingPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getPricingPlans();
            const data = response.data.map((p: any) => ({
                id: p.id ?? p.planName?.toLowerCase() ?? Math.random().toString(36).slice(2),
                title: p.planName ?? p.title ?? "",
                monthly: Number(p.monthlyPrice ?? p.monthly ?? 0),
                yearly: Number(p.yearlyPrice ?? p.yearly ?? 0),
                description: p.description ?? "",
                features: p.features ?? []
            }));

            setPlans(data);
        } catch (err: any) {
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleGetPricingPlans();
    }, []);

    return (
        <div>
            <Header />

            <SignInModal open={openSignIn} onClose={handleCloseSignIn} />
            <main className="pricing-page">
                <section className="pricing-hero">
                    <h1>
                        Ready to start with <span className="accent">DynoDocs</span>?
                    </h1>
                    <br />
                    <p className="sub">Choose the package that best suit you</p>

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

                <section className="pricing-cards">
                    {loading && <div>
                        <div className="globalLoader" role="status" aria-live="polite">
                            <CircularProgress size={56} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
                        </div>
                    </div>}
                    {error && <div style={{ color: "#dc2626" }}>Error: {error}</div>}
                    {!loading && !error && plans.map((p) => {
                        const lowerTitle = p.title.toLowerCase();
                        const isHighlight = lowerTitle.includes("professional");
                        const isFree = (p.monthly === 0 && p.yearly === 0) || lowerTitle.includes("free");
                        return (
                            <article
                                key={p.id}
                                className={"card " + (isHighlight ? "highlight" : "")}
                            >
                                <div className="card-head">
                                    <span style={{ fontSize: "16px", fontWeight: 600 }}>{p.title}</span>
                                </div>

                                <div className="card-body">
                                    <div className="price">
                                        <span className="currency">$</span>
                                        <span className="amount">
                                            {yearly
                                                ? (p.yearly === 0 ? "0.00" : p.yearly.toFixed(2))
                                                : p.monthly.toFixed(2)}
                                        </span>
                                        <span className="period">{yearly ? "/per year" : "/per month"}</span>
                                    </div>

                                    <p className="desc">{p.description}</p>

                                    <button
                                        className={isHighlight ? "btn btn-primary1" : "btn btn-ghost"}
                                        disabled={isFree}
                                        style={isFree ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                                        onClick={() => setOpenSignIn(true)}
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
            </main>

            <Footer />
        </div>
    );
}
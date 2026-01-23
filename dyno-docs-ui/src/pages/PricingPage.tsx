import React, { useState } from "react";
import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import "../styles/home.css";

export default function PricingPage() {
    const [yearly, setYearly] = useState(false);

    const plans = [
        {
            id: "free",
            title: "Free",
            monthly: 0,
            yearly: 0,
            description: "Great for trying out DynoDocs component and templates.",
            features: ["Design Guidelines", "10 Reports Generation", "5 Templates Usage Limit"],
            ctaType: "ghost",
        },
        {
            id: "pro",
            title: "Professional",
            monthly: 14.99,
            // yearly billed price (monthly equivalent after 30% discount)
            yearly: +(14.99 * 12 * (1 - 0.3)).toFixed(2),
            description: "Best for professional freelancers and small teams.",
            features: [
                "Everything in Free",
                "50 Report Generation",
                "15 Templates Usage Limit",
                "5% Discount For Templates",
                "Enhanced Security",
            ],
            ctaType: "primary",
        },
        {
            id: "enterprise",
            title: "Enterprise",
            monthly: 99.99,
            yearly: +(99.99 * 12 * (1 - 0.3)).toFixed(2),
            description: "Best for growing large company or enterprise design team.",
            features: [
                "Everything in Free",
                "Unlimited Report Generation",
                "Unlimited Templates Usage",
                "100% Discount For Templates",
                "Priority Security",
            ],
            ctaType: "ghost",
        },
    ];

    return (
        <div>
            <Header />

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
                    {plans.map((p, idx) => (
                        <article
                            key={p.id}
                            className={"card " + (p.id === "pro" ? "highlight" : "")}
                        >
                            <div className="card-head">
                                <h3>{p.title}</h3>
                            </div>

                            <div className="card-body">
                                <div className="price">
                                    <span className="currency">$</span>
                                    <span className="amount">
                                        {yearly
                                            ? // show monthly-equivalent for yearly billing
                                            (p.yearly === 0
                                                ? "0"
                                                : (p.yearly / 12).toFixed(2))
                                            : p.monthly.toFixed(2)}
                                    </span>
                                    <span className="period">{yearly ? "/per month (billed yearly)" : "/per month"}</span>
                                </div>

                                <p className="desc">{p.description}</p>

                                <button className={"btn " + (p.ctaType === "primary" ? "btn-primary" : "btn-ghost")}>Get Started</button>

                                <hr />

                                <ul className="features">
                                    {p.features.map((f) => (
                                        <li key={f}>
                                            <span className="check">✓</span>
                                            <span className="feat-text">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </article>
                    ))}
                </section>
            </main>

            <Footer />
        </div>
    );
}
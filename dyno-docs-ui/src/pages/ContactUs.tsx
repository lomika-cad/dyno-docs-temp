import { useEffect, useMemo, useState } from "react";
import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import "../styles/contactUs.css";

import { ChevronDown, ChevronUp, Clock, Mail, MapPin, Phone } from "lucide-react";
import { showInfo, showSuccess } from "../components/Toast";

export default function ContactUs() {
    const [openFaq, setOpenFaq] = useState<number>(0);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const faqs = useMemo(
        () => [
            {
                q: "What are your support hours?",
                a: "Monday – Friday, 9:30 a.m. – 5:30 p.m. IST",
            },
            {
                q: "Can DynoDocs integrate with my current booking system?",
                a: "DynoDocs primarily works with standardized Excel templates. If you need integration, contact support to discuss available options.",
            },
            {
                q: "Is my data secure?",
                a: "Yes. We follow standard security practices to protect your data in transit and at rest.",
            },
            {
                q: "Do you provide training for my staff?",
                a: "Yes. We can provide onboarding and training sessions depending on your plan.",
            },
            {
                q: "How do I access the Live Chat?",
                a: "Sign in to your dashboard and use the support/chat option available in the app.",
            },
            {
                q: "How can I contact you?",
                a: "You can email us or call our support numbers listed below.",
            },
            {
                q: "Can reports be customized?",
                a: "Yes. Templates, dynamic fields, and branding options allow you to customize outputs while keeping formatting consistent.",
            },
            {
                q: "Is real-time data supported?",
                a: "DynoDocs focuses on reliable document generation from structured inputs. For real-time workflows, contact support for guidance.",
            },
        ],
        [],
    );

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        agencyName: "",
        inquiryType: "",
        message: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.fullName || !form.email || !form.message) {
            showInfo("Please fill in all required fields.");
            return;
        }

        setForm({ fullName: "", email: "", agencyName: "", inquiryType: "", message: "" });
        showSuccess("Thank you for reaching out!");
    };

    return (
        <div className="contact-page">
            <Header />

            <main className="contact-container">
                <section className="contact-hero" aria-label="Contact hero">
                    <h1>
                        Let's <span className="accent">Connect</span> & Elevate
                        <br />
                        Your Travel Business
                    </h1>
                </section>

                <section className="contact-grid" aria-label="Contact form and FAQs">
                    <article className="contact-card" aria-label="Contact form" data-aos="fade-up">
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <input
                                className="field"
                                placeholder="Full Name"
                                value={form.fullName}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, fullName: e.target.value }))
                                }
                            />
                            <input
                                className="field"
                                placeholder="Work Email"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, email: e.target.value }))
                                }
                            />
                            <input
                                className="field"
                                placeholder="Agency Name"
                                value={form.agencyName}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, agencyName: e.target.value }))
                                }
                            />
                            <input
                                className="field"
                                placeholder="Inquiry Type"
                                value={form.inquiryType}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, inquiryType: e.target.value }))
                                }
                            />
                            <textarea
                                className="field"
                                placeholder="Message"
                                value={form.message}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, message: e.target.value }))
                                }
                            />

                            <button className="submit" type="submit">
                                SUBMIT
                            </button>
                        </form>
                    </article>

                    <article className="contact-card" aria-label="FAQs" data-aos="fade-up">
                        <div className="faqs">
                            <h2>FAQs</h2>
                            {faqs.map((item, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div className="faq-item" key={item.q}>
                                        <button
                                            type="button"
                                            className="faq-q"
                                            onClick={() =>
                                                setOpenFaq((current) =>
                                                    current === idx ? -1 : idx,
                                                )
                                            }
                                            aria-expanded={isOpen}
                                        >
                                            <span>{item.q}</span>
                                            <span className="faq-icon" aria-hidden="true">
                                                {isOpen ? (
                                                    <ChevronUp size={16} />
                                                ) : (
                                                    <ChevronDown size={16} />
                                                )}
                                            </span>
                                        </button>
                                        {isOpen && <div className="faq-a">{item.a}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </article>
                </section>

                <hr className="contact-divider" />

                <section className="contact-info-grid" aria-label="Contact information">
                    <div className="info-card" data-aos="fade-up">
                        <div className="info-icon" aria-hidden="true">
                            <Clock size={20} />
                        </div>
                        <p className="info-title">Working hours</p>
                        <p className="info-sub">
                            We're available every day
                            <br />
                            during business hours.
                        </p>
                        <span className="info-pill">8.00 a.m – 6.00 p.m</span>
                    </div>

                    <div className="info-card" data-aos="fade-up">
                        <div className="info-icon" aria-hidden="true">
                            <Mail size={20} />
                        </div>
                        <p className="info-title">Chat to support</p>
                        <p className="info-sub">Email us anytime for quick help.</p>
                        <span className="info-pill">dynodocs@gmail.com</span>
                    </div>

                    <div className="info-card" data-aos="fade-up">
                        <div className="info-icon" aria-hidden="true">
                            <MapPin size={20} />
                        </div>
                        <p className="info-title">Location</p>
                        <p className="info-sub">
                            Find our office or reach us
                            <br />
                            online from anywhere.
                        </p>
                        <span className="info-pill">No.332/3/1, Hiripitiya</span>
                    </div>

                    <div className="info-card" data-aos="fade-up">
                        <div className="info-icon" aria-hidden="true">
                            <Phone size={20} />
                        </div>
                        <p className="info-title">Call us</p>
                        <p className="info-sub">Speak directly with our support team.</p>
                        <span className="info-pill">0779785425 / 0715428453</span>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
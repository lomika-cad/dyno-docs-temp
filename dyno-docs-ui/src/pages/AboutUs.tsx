import { useEffect, useRef } from "react";
import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import "../styles/aboutUs.css";

import storyImg from "../assets/our-story.jpg";
import beliefImg from "../assets/our-belief.jpg";

import service1 from "../assets/service1.jpg";
import service2 from "../assets/serivce2.jpg";
import service3 from "../assets/service3.jpg";
import service4 from "../assets/service4.jpg";
import service5 from "../assets/service5.jpg";
import ScrollToTop from "../components/ScrollToTop";

export default function AboutUs() {
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const rootEl = rootRef.current;
        if (!rootEl) return;

        const elements = Array.from(
            rootEl.querySelectorAll<HTMLElement>(".reveal"),
        );

        if (elements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    (entry.target as HTMLElement).classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const services = [
        { title: "Automated\nReport Generation", img: service1 },
        { title: "Customizable\nTemplates", img: service2 },
        { title: "Real-Time\nAnalytics", img: service3 },
        { title: "Client\nManagement Tools", img: service4 },
        { title: "Secure File\nStorage & Downloads", img: service5 },
    ];

    return (
        <div ref={rootRef} className="about-page">
            <Header />

            <ScrollToTop />

            <main className="about-container">
                {/* Hero */}
                <section className="about-hero">
                    <h1>
                        Empowering Travel Agencies With{" "} <br />
                        <span className="accent">Smart</span> Automation
                    </h1>
                    <p>
                        We make reporting effortless. You deliver unforgettable travel
                        experiences.
                    </p>
                </section>

                {/* Story / Belief */}
                <section className="about-story-grid">
                    <div className="about-image" data-aos="fade-right">
                        <img src={storyImg} alt="Planning travel with maps" />
                    </div>

                    <div className="about-card" data-aos="fade-left">
                        <h3>Our Story</h3>
                        <p>
                            DynoDocs was created with one mission to remove the manual
                            burden from travel agencies. We noticed agencies spending
                            hours compiling reports.
                            <br />
                            So we built a platform that makes everything faster,
                            simpler, and error-free.
                        </p>
                    </div>

                    <div className="about-card" data-aos="fade-right">
                        <h3>Our Belief</h3>
                        <p>
                            Tools should be clear, fast, and purpose built for the
                            travel industry— not generic software that slows you down.
                        </p>
                    </div>

                    <div className="about-image" data-aos="fade-left">
                        <img src={beliefImg} alt="Reviewing travel plans" />
                    </div>
                </section>

                {/* Services */}
                <section className="about-services">
                    <h2 className="about-services-title">Our Services</h2>

                    <div className="about-services-grid">
                        {services.map((service, index) => (
                            <div
                                key={service.title}
                                className="about-services-card reveal"
                                style={{
                                    // stagger reveal
                                    ["--delay" as never]: `${index * 90}ms`,
                                }}
                            >
                                <div className="thumb">
                                    <img src={service.img} alt={service.title.replace(/\n/g, " ")} />
                                </div>
                                <div className="label">
                                    {service.title.split("\n").map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
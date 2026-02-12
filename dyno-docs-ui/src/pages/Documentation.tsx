import { useEffect, useMemo, useRef, useState } from "react";
import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import "../styles/documentation.css";
import ScrollToTop from "../components/ScrollToTop";

type NavItem = { id: string; label: string };
type NavGroup = { title: string; items: NavItem[] };

export default function Documentation() {
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [activeId, setActiveId] = useState<string>("overview");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const navGroups: NavGroup[] = useMemo(
        () => [
            {
                title: "Getting Started",
                items: [
                    { id: "overview", label: "Overview" },
                    { id: "quick-start", label: "Quick Start" },
                ],
            },
            {
                title: "Core Features",
                items: [
                    { id: "uploading-excel-data", label: "Uploading Excel Data" },
                    { id: "template-customization", label: "Template Customization" },
                    { id: "chatbot-data-collection", label: "Chatbot Data Collection" },
                    { id: "report-generation", label: "Report Generation" },
                ],
            },
            {
                title: "Advanced",
                items: [
                    { id: "dynamic-fields", label: "Dynamic Fields" },
                    { id: "branding-options", label: "Branding Options" },
                ],
            },
            {
                title: "Support",
                items: [
                    { id: "faqs", label: "FAQs" },
                    { id: "troubleshooting", label: "Troubleshooting" },
                ],
            },
            {
                title: "Responsibility",
                items: [{ id: "responsibility-and-compliance", label: "Compliance Note" }],
            },
        ],
        [],
    );

    useEffect(() => {
        const rootEl = contentRef.current;
        if (!rootEl) return;

        const observed = Array.from(
            rootEl.querySelectorAll<HTMLElement>("[data-doc-section]"),
        );
        if (observed.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort(
                        (a, b) =>
                            (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
                    );

                if (visible.length === 0) return;
                const id = (visible[0].target as HTMLElement).getAttribute("id");
                if (id) setActiveId(id);
            },
            { rootMargin: "-20% 0px -72% 0px", threshold: [0.1, 0.2, 0.3] },
        );

        observed.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const handleNavClick = (id: string) => {
        setActiveId(id);
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <>
            <div className="docs-page">
                <Header />

                <div className="docs-shell" aria-label="Documentation">
                    <section className="docs-hero" aria-label="Documentation title">
                        <h1>
                            Dyno<span className="accent">Docs</span> Documentation
                        </h1>
                        <p>
                            Clear, simple guides to help you automate your reporting
                            workflow.
                        </p>
                    </section>

                    <div className="docs-scroll" aria-label="Documentation content">
                        <div className="docs-container">
                            <div className="docs-layout">
                                <aside
                                    className="docs-sidebar"
                                    aria-label="Documentation navigation"
                                >
                                    {navGroups.map((group) => (
                                        <div key={group.title} className="docs-nav-section">
                                            <div className="docs-nav-title">{group.title}</div>
                                            <ul className="docs-nav-list">
                                                {group.items.map((item) => (
                                                    <li key={item.id}>
                                                        <a
                                                            href={`#${item.id}`}
                                                            className={
                                                                "docs-nav-link " +
                                                                (activeId === item.id
                                                                    ? "active"
                                                                    : "")
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleNavClick(item.id);
                                                            }}
                                                        >
                                                            {item.label}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </aside>

                                <main className="docs-main" ref={contentRef}>
                                    <section
                                        id="overview"
                                        data-doc-section
                                        className="docs-card"
                                        aria-label="Overview"
                                    >
                                        <h2>Overview</h2>
                                        <p>
                                            DynoDocs is a web-based document automation system designed
                                            for travel agencies to efficiently generate professional,
                                            branded itineraries and reports.
                                        </p>
                                        <p>
                                            The system converts structured agency data and
                                            customer-specific requirements into standardized PDF
                                            documents, reducing manual effort, turnaround time, and
                                            formatting errors.
                                        </p>
                                        <p>
                                            DynoDocs is intended for small and medium-sized travel
                                            agencies that rely on Excel-based data and require
                                            predictable, repeatable, and high-quality document outputs
                                            without complex technical configuration.
                                        </p>
                                    </section>

                                    <section
                                        id="quick-start"
                                        data-doc-section
                                        className="docs-card"
                                        aria-label="Quick Start"
                                    >
                                        <h2>Quick Start</h2>
                                        <p>
                                            Follow these simple steps to start automating your
                                            reporting workflow:
                                        </p>

                                        <ol className="docs-steps">
                                            <li className="docs-step">
                                                <span className="docs-step-badge">1</span>
                                                <div className="docs-step-body">
                                                    <p className="docs-step-title">
                                                        Log in to DynoDocs
                                                    </p>
                                                    <p className="docs-step-desc">
                                                        Use your agency credentials to access the
                                                        platform.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="docs-step">
                                                <span className="docs-step-badge">2</span>
                                                <div className="docs-step-body">
                                                    <p className="docs-step-title">
                                                        Download the Excel template
                                                    </p>
                                                    <p className="docs-step-desc">
                                                        Use the standardized template for reliable
                                                        mapping.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="docs-step">
                                                <span className="docs-step-badge">3</span>
                                                <div className="docs-step-body">
                                                    <p className="docs-step-title">Populate your data</p>
                                                    <p className="docs-step-desc">
                                                        Fill in agency data and embed images in .jpg
                                                        format.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="docs-step">
                                                <span className="docs-step-badge">4</span>
                                                <div className="docs-step-body">
                                                    <p className="docs-step-title">
                                                        Upload the completed Excel file
                                                    </p>
                                                    <p className="docs-step-desc">
                                                        The system validates your file before saving.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="docs-step">
                                                <span className="docs-step-badge">5</span>
                                                <div className="docs-step-body">
                                                    <p className="docs-step-title">
                                                        Configure branding and template parameters
                                                    </p>
                                                    <p className="docs-step-desc">
                                                        Apply your logo, colors, and layout settings.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="docs-step">
                                                <span className="docs-step-badge">6</span>
                                                <div className="docs-step-body">
                                                    <p className="docs-step-title">
                                                        Enter customer requirements
                                                    </p>
                                                    <p className="docs-step-desc">
                                                        Enter or collect customer-specific travel
                                                        requirements.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className="docs-step">
                                                <span className="docs-step-badge">7</span>
                                                <div className="docs-step-body">
                                                    <p className="docs-step-title">
                                                        Preview and generate your PDF
                                                    </p>
                                                    <p className="docs-step-desc">
                                                        Preview, generate, and download the final PDF
                                                        document.
                                                    </p>
                                                </div>
                                            </li>
                                        </ol>

                                        <p style={{ marginTop: 12 }}>
                                            Most users can complete their first successful document
                                            generation within 15 minutes.
                                        </p>
                                    </section>

                                    <section
                                        id="uploading-excel-data"
                                        data-doc-section
                                        className="docs-card"
                                        aria-label="Uploading Excel Data"
                                    >
                                        <h2>Uploading Excel Data</h2>
                                        <p>
                                            DynoDocs supports bulk data ingestion using standardized
                                            Excel templates.
                                        </p>

                                        <h3>Supported formats</h3>
                                        <ul className="docs-list">
                                            <li>Excel files: .xlsx, .xls</li>
                                            <li>Embedded images: .jpg only</li>
                                        </ul>

                                        <h3>Key rules</h3>
                                        <ul className="docs-list">
                                            <li>
                                                Images embedded in Excel (e.g., hotel photos,
                                                destination images) must be in .jpg format
                                            </li>
                                            <li>
                                                Other image formats (e.g., .png, .webp) are not
                                                supported
                                            </li>
                                            <li>Mandatory columns must be completed</li>
                                            <li>
                                                Data types (numeric, date, text) are validated during
                                                upload
                                            </li>
                                            <li>
                                                If validation fails, the upload is rejected and no
                                                partial data is stored, ensuring data integrity
                                            </li>
                                        </ul>
                                    </section>

                                    <section
                                        id="template-customization"
                                        data-doc-section
                                        className="docs-card"
                                        aria-label="Template Customization"
                                    >
                                        <h2>Template Customization</h2>
                                        <p>
                                            DynoDocs uses a dynamic template system that separates
                                            content from presentation.
                                        </p>
                                        <ul className="docs-list">
                                            <li>Templates define layout, structure, and placeholders</li>
                                            <li>Data is automatically mapped from Excel and customer inputs</li>
                                            <li>Templates are reusable across multiple itineraries and reports</li>
                                        </ul>
                                        <p>
                                            This ensures consistency across all customer-facing
                                            documents while reducing repetitive formatting work.
                                        </p>
                                    </section>

                                    <section
                                        id="chatbot-data-collection"
                                        data-doc-section
                                        className="docs-card"
                                        aria-label="Chatbot Data Collection"
                                    >
                                        <h2>Chatbot Data Collection</h2>
                                        <p>
                                            DynoDocs includes a rule-based, configurable conversational
                                            interface for structured data collection.
                                        </p>
                                        <ul className="docs-list">
                                            <li>Questions are defined by the travel agency</li>
                                            <li>Inputs are collected step by step</li>
                                            <li>
                                                Validation rules enforce correct formats and mandatory
                                                responses
                                            </li>
                                            <li>No AI-driven interpretation is used</li>
                                        </ul>
                                        <p>
                                            This approach ensures accuracy, predictability, and
                                            compliance with business and legal requirements.
                                        </p>
                                    </section>

                                    <section
                                        id="report-generation"
                                        data-doc-section
                                        className="docs-card"
                                        aria-label="Report Generation"
                                    >
                                        <h2>Report Generation</h2>
                                        <p>
                                            Once all required data is available, DynoDocs generates a
                                            professional PDF document.
                                        </p>
                                        <ul className="docs-list">
                                            <li>Combines agency master data and customer-specific inputs</li>
                                            <li>Applies branding and layout automatically</li>
                                            <li>Supports preview and final review before download</li>
                                            <li>Document rendering completes in seconds</li>
                                        </ul>
                                        <p>
                                            This reduces itinerary preparation time from hours to
                                            minutes.
                                        </p>
                                    </section>

                                    <section
                                        id="dynamic-fields"
                                        data-doc-section
                                        className="docs-card"
                                        aria-label="Dynamic Fields"
                                    >
                                        <h2>Dynamic Fields</h2>
                                        <p>
                                            Dynamic fields are placeholders within templates that are
                                            automatically populated during document generation.
                                        </p>
                                        <ul className="docs-list">
                                            <li>Linked to Excel data or customer inputs</li>
                                            <li>Support optional and conditional sections</li>
                                            <li>Ensure consistent formatting and accurate data placement</li>
                                        </ul>
                                        <p>
                                            Dynamic fields eliminate manual editing and reduce the risk
                                            of human error.
                                        </p>
                                    </section>

                                    <section
                                        id="branding-options"
                                        data-doc-section
                                        className="docs-card"
                                        aria-label="Branding Options"
                                    >
                                        <h2>Branding Options</h2>
                                        <p>
                                            DynoDocs uses parameter-based branding customization rather
                                            than free-form editing.
                                        </p>
                                        <h3>Available options include</h3>
                                        <ul className="docs-list">
                                            <li>Logo selection</li>
                                            <li>Brand colors</li>
                                            <li>Font styles</li>
                                        </ul>
                                        <p>
                                            Branding settings are applied automatically to all generated
                                            documents, ensuring visual consistency and preventing layout
                                            damage. This design allows non-technical users to manage
                                            branding confidently.
                                        </p>
                                    </section>

                                    <section id="faqs" data-doc-section className="docs-card" aria-label="FAQs">
                                        <h2>Frequently Asked Questions (FAQs)</h2>
                                        <div className="docs-faq">
                                            <div className="docs-faq-item">
                                                <p className="docs-faq-q">
                                                    Q1: Do I need technical knowledge to use DynoDocs?
                                                </p>
                                                <p className="docs-faq-a">
                                                    No. DynoDocs is designed for users with basic computer
                                                    literacy and does not require technical or programming
                                                    skills.
                                                </p>
                                            </div>

                                            <div className="docs-faq-item">
                                                <p className="docs-faq-q">
                                                    Q2: What image formats are supported in Excel uploads?
                                                </p>
                                                <p className="docs-faq-a">
                                                    Only .jpg images are supported. All images embedded in
                                                    the Excel file must be in .jpg format to ensure
                                                    compatibility during PDF generation.
                                                </p>
                                            </div>

                                            <div className="docs-faq-item">
                                                <p className="docs-faq-q">
                                                    Q3: Can I reuse uploaded Excel data across multiple
                                                    itineraries?
                                                </p>
                                                <p className="docs-faq-a">
                                                    Yes. Once validated and stored, agency data can be
                                                    reused across multiple documents without re-uploading.
                                                </p>
                                            </div>

                                            <div className="docs-faq-item">
                                                <p className="docs-faq-q">
                                                    Q4: Does DynoDocs use AI to generate itineraries or
                                                    content?
                                                </p>
                                                <p className="docs-faq-a">
                                                    No. DynoDocs relies on structured data and rule-based
                                                    logic. This ensures predictable outputs and avoids
                                                    inaccuracies.
                                                </p>
                                            </div>

                                            <div className="docs-faq-item">
                                                <p className="docs-faq-q">
                                                    Q5: What happens if required data is missing?
                                                </p>
                                                <p className="docs-faq-a">
                                                    The system will prevent document generation and prompt
                                                    the user to complete the missing information.
                                                </p>
                                            </div>

                                            <div className="docs-faq-item">
                                                <p className="docs-faq-q">
                                                    Q6: Who is responsible for the accuracy of the final
                                                    document?
                                                </p>
                                                <p className="docs-faq-a">
                                                    The travel agency is responsible for reviewing and
                                                    approving the final document before sharing it with
                                                    customers.
                                                </p>
                                            </div>

                                            <div className="docs-faq-item">
                                                <p className="docs-faq-q">
                                                    Q7: Can different agencies use different templates?
                                                </p>
                                                <p className="docs-faq-a">
                                                    Yes. Templates and branding are managed at the agency
                                                    level to ensure separation and customization.
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section
                                        id="troubleshooting"
                                        data-doc-section
                                        className="docs-card"
                                        aria-label="Troubleshooting"
                                    >
                                        <h2>Troubleshooting</h2>

                                        <h3>Excel upload fails</h3>
                                        <ul className="docs-list">
                                            <li>Confirm the correct template is used</li>
                                            <li>Ensure all mandatory columns are filled</li>
                                            <li>Verify that all embedded images are in .jpg format</li>
                                        </ul>

                                        <h3>Images not appearing in the generated PDF</h3>
                                        <ul className="docs-list">
                                            <li>Check that the images in Excel are .jpg</li>
                                            <li>
                                                Ensure images are embedded correctly within the
                                                designated cells
                                            </li>
                                        </ul>

                                        <h3>Branding not applied correctly</h3>
                                        <ul className="docs-list">
                                            <li>Review branding parameters</li>
                                            <li>Save changes before generating the document</li>
                                        </ul>

                                        <h3>Data appears incorrect in the report</h3>
                                        <ul className="docs-list">
                                            <li>Verify source Excel data</li>
                                            <li>Review customer inputs before final generation</li>
                                            <li>
                                                If issues persist, contact the system administrator or
                                                designated support channel
                                            </li>
                                        </ul>
                                    </section>

                                    <section
                                        id="responsibility-and-compliance"
                                        data-doc-section
                                        className="docs-card docs-note"
                                        aria-label="Responsibility and Compliance"
                                    >
                                        <h2>Responsibility and Compliance Note</h2>
                                        <p>
                                            DynoDocs automates document generation based on
                                            user-provided data. Final responsibility for data accuracy,
                                            content approval, and compliance remains with the travel
                                            agency, in line with professional and regulatory standards.
                                        </p>
                                    </section>
                                </main>
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>
            </div>
        </>
    );
}
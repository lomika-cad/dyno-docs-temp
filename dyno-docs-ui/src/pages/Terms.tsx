import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import ScrollToTop from "../components/ScrollToTop";
import "../styles/privacy-policy.css";
import { useEffect } from "react";

export default function Terms() {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <ScrollToTop />
      <Header />
      <main className="privacy-policy-container">
        <div className="privacy-hero">
          <p className="eyebrow">Updated February 12, 2026</p>
          <h1>Terms &amp; Conditions</h1>
          <p className="subtitle">
            The rules, responsibilities, and legal protections that apply when you
            use DynoDocs and its services.
          </p>
          <div className="policy-meta">
            <span>Jurisdiction: Sri Lanka</span>
            <span>Applies to: Web + Services</span>
          </div>
        </div>

        <section className="privacy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to DynoDocs (&ldquo;we,&rdquo; &ldquo;our,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;Platform&rdquo;). These Terms and Conditions govern your access
            to and use of DynoDocs, including all content, features, services,
            templates, and digital products available through our website.
          </p>
          <p>
            By creating an account or using DynoDocs, you agree to be legally bound
            by these Terms. If you do not agree, you must not use this platform.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Eligibility</h2>
          <p>To use DynoDocs, you must:</p>
          <ul>
            <li>Be at least 18 years old (or have parental/legal guardian consent)</li>
            <li>Provide accurate and complete registration information</li>
            <li>Not use the platform for unlawful purposes</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
        </section>

        <section className="privacy-section">
          <h2>3. User Accounts</h2>
          <p>When registering on DynoDocs:</p>
          <ul>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You are responsible for all activities under your account.</li>
            <li>You must notify us immediately of unauthorized access.</li>
            <li>
              We reserve the right to suspend or terminate accounts for security reasons or policy
              violations.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Services Provided</h2>
          <p>DynoDocs provides:</p>
          <ul>
            <li>Digital templates</li>
            <li>Document generation tools</li>
            <li>Marketplace features (if applicable)</li>
            <li>Paid and/or free downloadable content</li>
          </ul>
          <p>All services are provided on an &ldquo;as available&rdquo; basis.</p>
          <p>We may modify, suspend, or discontinue services without prior notice.</p>
        </section>

        <section className="privacy-section">
          <h2>5. Payments and Billing</h2>
          <p>Certain features or templates may require payment. By purchasing on DynoDocs:</p>
          <ul>
            <li>You agree to pay all applicable fees.</li>
            <li>Payments are processed through secure third-party payment gateways.</li>
            <li>We do not store full card details on our servers.</li>
            <li>All prices are displayed in [Insert Currency].</li>
          </ul>
          <p>Failure to complete payment may result in restricted access.</p>
        </section>

        <section className="privacy-section">
          <h2>6. Refund Policy</h2>
          <p>Unless otherwise stated:</p>
          <ul>
            <li>Digital products are generally non-refundable once accessed or downloaded.</li>
            <li>Refunds may be granted in exceptional cases at our sole discretion.</li>
            <li>Fraudulent or duplicate transactions will be reviewed and refunded if verified.</li>
          </ul>
          <p>For refund requests, contact: 📧 [Insert Support Email]</p>
        </section>

        <section className="privacy-section">
          <h2>7. Intellectual Property Rights</h2>
          <p>All content on DynoDocs, including:</p>
          <ul>
            <li>Templates</li>
            <li>Branding</li>
            <li>Logos</li>
            <li>Software code</li>
            <li>Designs</li>
          </ul>
          <p>Is the intellectual property of DynoDocs unless otherwise stated.</p>
          <p>
            Users are granted a limited, non-exclusive, non-transferable license to use purchased
            templates for personal or business use. You may NOT:
          </p>
          <ul>
            <li>Resell templates without permission</li>
            <li>Redistribute platform content</li>
            <li>Copy or reverse engineer system features</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>8. User Content</h2>
          <p>If you upload content to DynoDocs:</p>
          <ul>
            <li>You retain ownership of your content.</li>
            <li>
              You grant DynoDocs a limited license to process, store, and display content for service
              functionality.
            </li>
            <li>You are responsible for ensuring your content does not violate laws or third-party rights.</li>
          </ul>
          <p>We reserve the right to remove unlawful or inappropriate content.</p>
        </section>

        <section className="privacy-section">
          <h2>9. Prohibited Activities</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Use the platform for illegal purposes</li>
            <li>Attempt to hack, disrupt, or damage the system</li>
            <li>Bypass security mechanisms</li>
            <li>Use automated bots without authorization</li>
            <li>Upload malicious code</li>
          </ul>
          <p>Violation may result in immediate account termination and legal action.</p>
        </section>

        <section className="privacy-section">
          <h2>10. Limitation of Liability</h2>
          <p>DynoDocs is not liable for:</p>
          <ul>
            <li>Loss of data</li>
            <li>Business interruption</li>
            <li>Indirect or consequential damages</li>
            <li>Errors in templates or generated documents</li>
          </ul>
          <p>Use of templates is at your own risk.</p>
          <p>Users are responsible for verifying document accuracy before official use.</p>
        </section>

        <section className="privacy-section">
          <h2>11. Disclaimer of Warranties</h2>
          <p>DynoDocs is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;</p>
          <p>We make no guarantees regarding:</p>
          <ul>
            <li>Continuous availability</li>
            <li>Error-free functionality</li>
            <li>Suitability for specific legal or official purposes</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>12. Account Termination</h2>
          <p>We may suspend or terminate accounts if:</p>
          <ul>
            <li>Terms are violated</li>
            <li>Fraudulent activity is detected</li>
            <li>Required by law</li>
          </ul>
          <p>Users may request account deletion by contacting support.</p>
        </section>

        <section className="privacy-section">
          <h2>13. Privacy</h2>
          <p>Use of DynoDocs is also governed by our Privacy Policy.</p>
          <p>Please review our Privacy Policy for information about data handling.</p>
        </section>

        <section className="privacy-section">
          <h2>14. Governing Law</h2>
          <p>These Terms shall be governed by and interpreted under the laws of Sri Lanka.</p>
          <p>Any disputes shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.</p>
        </section>

        <section className="privacy-section">
          <h2>15. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time.</p>
          <p>Updated versions will be posted on this page with a revised effective date.</p>
          <p>Continued use of DynoDocs constitutes acceptance of changes.</p>
        </section>

        <section className="privacy-section">
          <h2>16. Contact Information</h2>
          <p>DynoDocs</p>
          <p>Sri Lanka</p>
          <p>Email: <a href="mailto:dynodocs06@gmail.com">dynodocs06@gmail.com</a></p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
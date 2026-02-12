import { useEffect } from "react";
import Footer from "../layouts/Footer";
import Header from "../layouts/Header";
import "../styles/privacy-policy.css";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <Header />
      <main className="privacy-policy-container">
        <div className="privacy-hero">
          <p className="eyebrow">Updated February 12, 2026</p>
          <h1>Privacy Policy</h1>
          <p className="subtitle">
            How DynoDocs collects, uses, and safeguards your information when you
            use our platform.
          </p>
          <div className="policy-meta">
            <span>Location: Sri Lanka</span>
            <span>Coverage: Web + Services</span>
          </div>
        </div>

        <section className="privacy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to DynoDocs (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;).
            We are committed to protecting your personal information and your
            right to privacy.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you visit our website and use our
            services.
          </p>
          <p>By accessing or using DynoDocs, you agree to this Privacy Policy.</p>
        </section>

        <section className="privacy-section">
          <h2>2. Information We Collect</h2>
          <div className="card">
            <h3>A. Personal Information</h3>
            <p>When you register or use our services, we may collect:</p>
            <ul>
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number (if provided)</li>
              <li>Account login credentials</li>
              <li>Billing and payment details</li>
              <li>Uploaded documents or templates</li>
              <li>Profile information</li>
            </ul>
          </div>
          <br />
          <div className="card">
            <h3>B. Payment Information</h3>
            <p>
              DynoDocs collects payments for certain services (such as paid
              templates or subscriptions).
            </p>
            <p>
              Payment details are processed securely through authorized payment
              gateways.
            </p>
            <p>We do not store full credit/debit card details on our servers.</p>
            <p>Transaction records may be stored for accounting and legal purposes.</p>
          </div>
          <br />
          <div className="card">
            <h3>C. Automatically Collected Information</h3>
            <p>When you visit DynoDocs, we may automatically collect:</p>
            <ul>
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device type</li>
              <li>Operating system</li>
              <li>Access times</li>
              <li>Pages viewed</li>
              <li>Referral URLs</li>
            </ul>
            <p>This helps us improve performance and security.</p>
          </div>
        </section>

        <section className="privacy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="grid-list">
            <li>Create and manage user accounts</li>
            <li>Provide access to purchased templates or services</li>
            <li>Process payments and transactions</li>
            <li>Improve platform functionality</li>
            <li>Communicate updates or important notices</li>
            <li>Provide customer support</li>
            <li>Maintain platform security and prevent fraud</li>
            <li>Comply with legal obligations in Sri Lanka</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Account Security</h2>
          <p>DynoDocs implements security measures including:</p>
          <ul>
            <li>Encrypted HTTPS (SSL) communication</li>
            <li>Secure authentication mechanisms</li>
            <li>Role-based access controls</li>
            <li>Database protection measures</li>
          </ul>
          <p>However, no online system can guarantee 100% security.</p>
          <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
        </section>

        <section className="privacy-section">
          <h2>5. Cookies and Tracking Technologies</h2>
          <p>DynoDocs may use cookies to:</p>
          <ul>
            <li>Maintain login sessions</li>
            <li>Store user preferences</li>
            <li>Improve performance</li>
          </ul>
          <p>We do not use third-party advertising cookies.</p>
          <p>
            You may disable cookies in your browser settings, though some features may not
            function properly.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. Data Storage and Retention</h2>
          <p>Your data may be stored on secure servers.</p>
          <p>We retain personal data only for as long as:</p>
          <ul>
            <li>Your account remains active</li>
            <li>Required for legal and accounting purposes</li>
            <li>Necessary for dispute resolution</li>
          </ul>
          <p>You may request deletion of your account at any time (see Section 9).</p>
        </section>

        <section className="privacy-section">
          <h2>7. Sharing of Information</h2>
          <p>We do not sell or rent your personal information.</p>
          <p>We may share data only with:</p>
          <ul>
            <li>Payment gateway providers</li>
            <li>Hosting service providers</li>
            <li>Legal authorities if required by Sri Lankan law</li>
          </ul>
          <p>All service providers are required to maintain confidentiality.</p>
        </section>

        <section className="privacy-section">
          <h2>8. International Data Transfers</h2>
          <p>
            If our servers or third-party providers are located outside Sri Lanka, your
            information may be transferred internationally.
          </p>
          <p>We ensure reasonable safeguards are applied.</p>
        </section>

        <section className="privacy-section">
          <h2>9. Your Rights</h2>
          <p>As a user of DynoDocs, you have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your account</li>
            <li>Withdraw consent where applicable</li>
          </ul>
          <p>To exercise these rights, contact us at:</p>
          <p>
            Email: <a href="mailto:support@dynodocs.com">support@dynodocs.com</a>
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Children&rsquo;s Privacy</h2>
          <p>DynoDocs is not intended for individuals under the age of 13.</p>
          <p>We do not knowingly collect data from children.</p>
        </section>

        <section className="privacy-section">
          <h2>11. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time.</p>
          <p>Any changes will be posted on this page with an updated effective date.</p>
          <p>Continued use of the platform after changes constitutes acceptance.</p>
        </section>

        <section className="privacy-section">
          <h2>12. Contact Information</h2>
          <p>If you have any questions regarding this Privacy Policy, you may contact us:</p>
          <p>
            DynoDocs<br />
            Sri Lanka<br />
            Email: <a href="mailto:info@dynodocs.com">info@dynodocs.com</a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
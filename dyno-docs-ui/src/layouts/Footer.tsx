import "../styles/footer.css";
import logo from "../assets/dyno-docs-transparent.png";

import {
  MapPin,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer-container">

      <div className="footer-top">

        {/* Column 1 — Logo + Contact */}
        <div className="footer-col footer-brand">
          <img className="footer-logo" src={logo} alt="DynoDocs" />

          <div className="footer-info">
            <p>
              <MapPin size={18} className="icon" />
              No.332/3/1, Aurthur Wijewardana Mw, Hiripitiya, Pannipitiya.
            </p>

            <p>
              <Mail size={18} className="icon" />
              <a href="mailto:dynodocs@gmail.com">dynodocs@gmail.com</a>
            </p>

            <p>
              <Phone size={18} className="icon" />
              0779785425, 0715428453
            </p>
          </div>
        </div>

        {/* Column 2 — Pages */}
        <div className="footer-col">
          <h3>Pages</h3>
          <ul>
            <li>Documentation</li>
            <li>Pricing</li>
            <li>About Us</li>
            <li>Contact Us</li>
          </ul>
        </div>

        {/* Column 3 — Support */}
        <div className="footer-col">
          <h3>Support</h3>
          <ul>
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>

        {/* Column 4 — Social Media */}
        <div className="footer-col">
          <h3>Social Media</h3>
          <ul>
            <li><Facebook size={18} className="icon" /> Facebook</li>
            <li><MessageCircle size={18} className="icon" /> WhatsApp</li>
            <li><Instagram size={18} className="icon" /> Instagram</li>
            <li><Linkedin size={18} className="icon" /> LinkedIn</li>
          </ul>
        </div>

      </div>

      <hr className="footer-divider" />

      <p className="footer-bottom">
        © 2025 DynoDocs. All Rights Reserved. | Design and Developed by Group Y3–11
      </p>
    </footer>
  );
}
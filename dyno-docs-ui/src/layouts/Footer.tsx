import "../styles/footer.css";
import logo from "../assets/dyno-docs-transparent.png";

import {
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { InstagramOutlined, LinkedinOutlined, TikTokOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function Footer() {

  const navigate = useNavigate();

  return (
    <footer className="footer-container">

      <div className="footer-top">

        {/* Column 1*/}
        <div className="footer-col footer-brand">
          <img className="footer-logo" src={logo} alt="DynoDocs" />

          <div className="footer-info">
            <p style={{display: "flex", alignItems: "start"}}>
              <MapPin size={18} className="icon" />
              No.332/3/1, Hiripitiya, Pannipitiya.
            </p>

            <p style={{display: "flex", alignItems: "start"}}>
              <Mail size={18} className="icon" />
              <a href="mailto:dynodocs@gmail.com">dynodocs@gmail.com</a>
            </p>

            <p style={{display: "flex", alignItems: "start"}}>
              <Phone size={18} className="icon" />
              0779785425, 0715428453
            </p>
          </div>
        </div>

        {/* Column 2*/}
        <div className="footer-col">
          <h3>Pages</h3>
          <ul>
            <li onClick={() => navigate("/documentation")}>Documentation</li>
            <li onClick={() => navigate("/pricing")}>Pricing</li>
            <li onClick={() => navigate("/about")}>About Us</li>
            <li onClick={() => navigate("/contact")}>Contact Us</li>
          </ul>
        </div>

        {/* Column 3*/}
        <div className="footer-col">
          <h3>Support</h3>
          <ul>
            <li onClick={() => navigate("/privacy-policy")}>Privacy Policy</li>
            <li onClick={() => navigate("/terms-and-conditions")}>Terms & Conditions</li>
          </ul>
        </div>

        {/* Column 4*/}
        <div className="footer-col">
          <h3>Social Media</h3>
          <ul>
            <li onClick={() => window.open("https://www.tiktok.com/@dyno5878?_r=1&_t=ZS-93pvFnfpf1M", "_blank")}><TikTokOutlined size={18} className="icon" /> TikTok</li>
            <li onClick={() => window.open("https://wa.me/+94775353762?text=Hello%20DynoDocs", "_blank")}><WhatsAppOutlined size={18} className="icon" /> WhatsApp</li>
            <li onClick={() => window.open("https://www.instagram.com/dynodocs06?igsh=eWplcDV0Y2JtcjAz", "_blank")}><InstagramOutlined size={18} className="icon" /> Instagram</li>
            <li onClick={() => window.open("https://www.linkedin.com/in/dyno-docs-1064653b0", "_blank")}><LinkedinOutlined size={18} className="icon" /> LinkedIn</li>
          </ul>
        </div>

      </div>

      <hr className="footer-divider" />

      {/* Footer Bottom */}
      <p className="footer-bottom">
        © {new Date().getFullYear()} DynoDocs. All Rights Reserved. | Design and Developed by Group Y3–11
      </p>
    </footer>
  );
}
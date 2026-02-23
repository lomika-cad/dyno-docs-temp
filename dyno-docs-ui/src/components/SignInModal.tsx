import { useNavigate } from "react-router-dom";
import "../styles/signInModal.css";
import { login } from "../services/auth-api";
import { useState } from "react";
import { showError } from "./Toast";
import { CircularProgress } from "@mui/material";
import { getMe } from "../services/me-api";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

const SignInModal = ({ open, onClose }: SignInModalProps) => {
  if (!open) return null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(email, password);
      console.log(res);
      sessionStorage.setItem("dd_token", res.token);
      sessionStorage.setItem("dd_agency_name", res.agencyName);
      sessionStorage.setItem("dd_email", res.email);
      sessionStorage.setItem("dd_user_id", res.userId);
      sessionStorage.setItem("dd_tenant_id", res.tenantId);
      sessionStorage.setItem("dd_full_name", res.fullName);
      sessionStorage.setItem("dd_chat_user_id", res.chatUserId === null ? "" : res.chatUserId);
      handleMe(res.token, res.tenantId);
      onClose();
      navigate("/dashboard");
    } catch (error) {
      showError("Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleMe = async (token: string, tenantId: string) => {
    try {
      const res = await getMe(token, tenantId);
      console.log(res);
      sessionStorage.setItem("dd_subscription_plan", res.planName);
      sessionStorage.setItem("dd_subscription_expiry", res.endDate);
      sessionStorage.setItem("dd_report_limit", res.reportsLimit);
      sessionStorage.setItem("dd_template_limit", res.templatesLimit);
      sessionStorage.setItem("dd_discount_percentage", res.discountPercentage);
      sessionStorage.setItem("dd_subscription_isActive", res.isActive);
    } catch (error) {
      console.error(error);      
    }
  }

  return (
    <div className="authModal" role="dialog" aria-modal="true" aria-label="Sign in" onClick={handleBackdropClick}>
      {loading && (
        <div className="globalLoader" role="status" aria-live="polite">
          <CircularProgress size={56} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
        </div>
      )}
      <div className="authModal-card">
        <h2 className="authModal-title">Sign in</h2>

        <form className="authForm" onSubmit={handleSubmit}>
          <div className="authForm-field">
            <label className="authForm-label" htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="authForm-input"
              placeholder="Enter your email"
            />
          </div>

          <div className="authForm-field">
            <label className="authForm-label" htmlFor="signin-password">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="signin-password"
              type="password"
              className="authForm-input"
              placeholder="***********"
            />
          </div>

          <div className="authForm-row authForm-row--between">
            <label className="authCheckbox">
            </label>
            <button type="button" className="authLinkButton">Forgot password</button>
          </div>

          <button type="submit" className="authForm-primaryBtn">Sign in</button>
        </form>

        <p className="authForm-footer">
          Don&apos;t have an account? <button type="button" className="authLinkButton authLinkButton--accent"
            onClick={() => {
              {
                onClose();
                navigate("/signup");
              }
            }}>Sign up for free!</button>
        </p>
      </div>
    </div>
  );
};

export default SignInModal;

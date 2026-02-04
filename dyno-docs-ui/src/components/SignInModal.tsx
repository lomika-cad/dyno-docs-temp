import { useNavigate } from "react-router-dom";
import "../styles/signInModal.css";
import { login } from "../services/auth-api";
import { useState } from "react";
import { showError } from "./Toast";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

const SignInModal = ({ open, onClose }: SignInModalProps) => {
  if (!open) return null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await login(email, password);
      console.log(res);  
      sessionStorage.setItem("dd_token", res.token);  
      sessionStorage.setItem("dd_agency_name", res.agencyName); 
      sessionStorage.setItem("dd_email", res.email); 
      sessionStorage.setItem("dd_user_id", res.userId);
      sessionStorage.setItem("dd_tenant_id", res.tenantId);
      sessionStorage.setItem("dd_full_name", res.fullName);
      onClose();
      navigate("/dashboard");
    } catch (error) {
      showError("Login failed. Please check your credentials and try again.");
    }
  }

  return (
    <div className="authModal" role="dialog" aria-modal="true" aria-label="Sign in" onClick={handleBackdropClick}>
      <div className="authModal__card">
        <h2 className="authModal__title">Sign in</h2>

        <form className="authForm" onSubmit={handleSubmit}>
          <div className="authForm__field">
            <label className="authForm__label" htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="authForm__input"
              placeholder="Enter your email"
            />
          </div>

          <div className="authForm__field">
            <label className="authForm__label" htmlFor="signin-password">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="signin-password"
              type="password"
              className="authForm__input"
              placeholder="***********"
            />
          </div>

          <div className="authForm__row authForm__row--between">
            <label className="authCheckbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button type="button" className="authLinkButton">Forgot password</button>
          </div>

          <button type="submit" className="authForm__primaryBtn">Sign in</button>
        </form>

        <p className="authForm__footer">
          Don&apos;t have an account? <button type="button" className="authLinkButton authLinkButton--accent">Sign up for free!</button>
        </p>
      </div>
    </div>
  );
};

export default SignInModal;

import { useNavigate } from "react-router-dom";
import "../styles/signInModal.css";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

const SignInModal = ({ open, onClose }: SignInModalProps) => {
  if (!open) return null;

  const navigate = useNavigate();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    navigate("/dashboard");
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
              type="email"
              className="authForm__input"
              placeholder="Enter your email"
            />
          </div>

          <div className="authForm__field">
            <label className="authForm__label" htmlFor="signin-password">Password</label>
            <input
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

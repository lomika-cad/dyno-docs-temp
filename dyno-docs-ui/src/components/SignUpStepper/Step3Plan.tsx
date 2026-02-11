import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SignUpForm } from "./SignUpStepper";
import { CircularProgress } from "@mui/material";

type Props = {
  initial?: SignUpForm;
  onBack: () => void;
  onSubmit: (values: Partial<SignUpForm>) => void;
  loading?: boolean;
};

export default function Step3Plan({ initial, onBack, onSubmit, loading }: Props) {
  const navigate = useNavigate();
  const [planId, setPlanId] = useState(initial?.planId ?? "free");
  const [terms, setTerms] = useState(initial?.termsAccepted ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ planId, termsAccepted: terms });
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Subscription plan">
      {(loading) && (
        <div className="globalLoader" role="status" aria-live="polite">
          <CircularProgress size={56} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
        </div>
      )}
      <div className="plans">
        <label className={`plan-card ${planId === "free" ? "plan--active" : ""}`}>
          <div className="plan-card-icon" aria-hidden="true">◔</div>
          <input type="radio" name="plan" value="free" checked={planId === "free"} onChange={() => setPlanId("free")} />
          <div className="plan-card-title">Free Plan</div>
          <div className="plan-card-desc">Great for trying out DynoDocs component and templates.</div>
        </label>

        <label className={`plan-card ${planId === "pro" ? "plan--active" : ""}`}>
          <div className="plan-card-icon" aria-hidden="true">◔</div>
          <input type="radio" name="plan" value="pro" checked={planId === "pro"} onChange={() => setPlanId("pro")} />
          <div className="plan-card-title">Professional Plan</div>
          <div className="plan-card-desc">Best for professional freelancers and small teams.</div>
        </label>

        <label className={`plan-card ${planId === "enterprise" ? "plan--active" : ""}`}>
          <div className="plan-card-icon" aria-hidden="true">◔</div>
          <input type="radio" name="plan" value="enterprise" checked={planId === "enterprise"} onChange={() => setPlanId("enterprise")} />
          <div className="plan-card-title">Enterprise Plan</div>
          <div className="plan-card-desc">Best for growing large company or enterprise design team.</div>
        </label>
      </div>

      <div className="more-details">
        <button type="button" className="link" onClick={() => navigate('/pricing')}>More Details</button>
      </div>

      <div className="terms">
        <label>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> I agree to the Terms & Conditions
        </label>
      </div>

      <div className="form-actions">
        <div className="form-actions-left">
          <button type="button" className="btn btn--ghost" onClick={onBack}>Back</button>
          <button type="button" className="btn btn--muted" onClick={() => window.location.href = '/'}>Cancel</button>
        </div>
        <div className="form-actions-right">
          <button type="submit" className="btn btn--primary" disabled={!terms || loading}>{loading ? "Creating..." : "Submit"}</button>
        </div>
      </div>
    </form>
  );
}

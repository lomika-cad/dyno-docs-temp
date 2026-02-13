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
  const [planId, setPlanId] = useState(initial?.planId ?? "1");
  const [planType, setPlanType] = useState(initial?.planType ?? "0");
  const [terms, setTerms] = useState(initial?.termsAccepted ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ planId, planType, termsAccepted: terms });
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Subscription plan">
      {(loading) && (
        <div className="globalLoader" role="status" aria-live="polite">
          <CircularProgress size={56} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
        </div>
      )}
      <div className="billing-toggle" role="group" aria-label="Billing frequency">
        <button
          type="button"
          className={`toggle-option ${planType === "0" ? "is-active" : ""}`}
          onClick={() => setPlanType("0")}
          aria-pressed={planType === "0"}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`toggle-option ${planType === "1" ? "is-active" : ""}`}
          onClick={() => setPlanType("1")}
          aria-pressed={planType === "1"}
        >
          Yearly
        </button>
      </div>
      <div className="plans">
        <label className={`plan-card ${planId === "1" ? "plan--active" : ""}`}>
          <div className="plan-card-icon" aria-hidden="true">◔</div>
          <input type="radio" name="plan" value="1" checked={planId === "1"} onChange={() => setPlanId("1")} />
          <div className="plan-card-title">Free Plan</div>
          <div className="plan-card-desc">Great for trying out DynoDocs component and templates.</div>
        </label>

        <label className={`plan-card ${planId === "2" ? "plan--active" : ""}`}>
          <div className="plan-card-icon" aria-hidden="true">◔</div>
          <input type="radio" name="plan" value="2" checked={planId === "2"} onChange={() => setPlanId("2")} />
          <div className="plan-card-title">Professional Plan</div>
          <div className="plan-card-desc">Best for professional freelancers and small teams.</div>
        </label>

        <label className={`plan-card ${planId === "3" ? "plan--active" : ""}`}>
          <div className="plan-card-icon" aria-hidden="true">◔</div>
          <input type="radio" name="plan" value="3" checked={planId === "3"} onChange={() => setPlanId("3")} />
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

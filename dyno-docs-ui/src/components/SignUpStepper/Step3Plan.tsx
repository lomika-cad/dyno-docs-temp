import { useEffect, useState } from "react";
import type { SignUpForm } from "./SignUpStepper";
import { CircularProgress } from "@mui/material";
import CardPayment from "../CardPayment";
import { getPricingPlans } from "../../services/pricing-plan-api";

type Props = {
  initial?: SignUpForm;
  onBack: () => void;
  onSubmit: (values: Partial<SignUpForm>) => void;
  loading?: boolean;
};

export default function Step3Plan({ initial, onBack, onSubmit, loading }: Props) {
  const [planId, setPlanId] = useState(initial?.planId ?? "1");
  const [planType, setPlanType] = useState(initial?.planType ?? "0");
  const [terms, setTerms] = useState(initial?.termsAccepted ?? false);
  const cadenceLabel = planType === "0" ? "/month" : "/year";
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [pendingSubmit, setPendingSubmit] = useState<Partial<SignUpForm> | null>(null);
  const [planPricing, setPlanPricing] = useState<Record<string, { monthly: number; yearly: number }>>({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const planKey = (selectedPlan: string) => {
    if (selectedPlan === "1") return "free";
    if (selectedPlan === "2") return "professional";
    if (selectedPlan === "3") return "enterprise";
    return selectedPlan.toLowerCase();
  };

  const getPlanAmount = (selectedPlan: string, selectedType: string) => {
    const key = planKey(selectedPlan);
    const pricing = planPricing[key];
    if (pricing) return selectedType === "0" ? pricing.monthly : pricing.yearly;
    if (selectedPlan === "2") return selectedType === "0" ? 14.99 : 125.91;
    if (selectedPlan === "3") return selectedType === "0" ? 99.99 : 840.24;
    return 0;
  };

  const formatPrice = (plan: string) => getPlanAmount(plan, planType).toFixed(2);
  const proPrice = formatPrice("2");
  const enterprisePrice = formatPrice("3");

  const isPaidPlan = (selectedPlan: string) => selectedPlan === "2" || selectedPlan === "3";

  const persistSelection = (values: Partial<SignUpForm>) => onSubmit(values);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission = { planId, planType, termsAccepted: terms };
    setPendingSubmit(submission);
    if (isPaidPlan(planId)) {
      setPaymentAmount(getPlanAmount(planId, planType));
      setShowPayment(true);
      return;
    }
    persistSelection(submission);
  };

  const handlePlanSelection = (selectedPlan: string) => {
    setPlanId(selectedPlan);
    setShowPayment(false);
    setPendingSubmit(null);
  };

  useEffect(() => {
    if (!showPayment) return;
    if (planId !== "2" && planId !== "3") return;
    setPaymentAmount(getPlanAmount(planId, planType));
  }, [planId, planType, showPayment]);

  useEffect(() => {
    let isMounted = true;
    const fetchPricing = async () => {
      setPricingLoading(true);
      setPricingError(null);
      try {
        const response = await getPricingPlans();
        const apiPlans = response?.data ?? [];
        const mapping: Record<string, { monthly: number; yearly: number }> = {};
        apiPlans.forEach((plan: any) => {
          const title = (plan?.planName ?? plan?.title ?? "").toString().toLowerCase().trim();
          if (!title) return;
          const monthly = Number(plan?.monthlyPrice ?? plan?.monthly ?? 0);
          const yearly = Number(plan?.yearlyPrice ?? plan?.yearly ?? 0);
          const assign = (key: string) => {
            if (!key) return;
            mapping[key] = { monthly, yearly };
          };
          assign(title);
          const alias = title.replace(/ plan$/i, "").trim();
          if (alias && !mapping[alias]) assign(alias);
        });
        if (isMounted) setPlanPricing(mapping);
      } catch (error: any) {
        if (isMounted) setPricingError(error?.response?.data?.message ?? "Failed to load pricing.");
      } finally {
        if (isMounted) setPricingLoading(false);
      }
    };

    fetchPricing();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePaymentClose = () => setShowPayment(false);

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    const submission = pendingSubmit ?? { planId, planType, termsAccepted: terms };
    persistSelection(submission);
  };

  return (
    <>
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
          onClick={() => {
            setPlanType("0");
            setPendingSubmit(null);
            setShowPayment(false);
          }}
          aria-pressed={planType === "0"}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`toggle-option ${planType === "1" ? "is-active" : ""}`}
          onClick={() => {
            setPlanType("1");
            setPendingSubmit(null);
            setShowPayment(false);
          }}
          aria-pressed={planType === "1"}
        >
          Yearly
        </button>
      </div>
      {pricingLoading && <p className="plan-pricing-status">Fetching fresh pricing...</p>}
      {pricingError && !pricingLoading && (
        <p className="plan-pricing-status plan-pricing-status--error" role="alert">{pricingError}</p>
      )}
      <div className="plans">
        <label className={`plan-card ${planId === "1" ? "plan--active" : ""}`} onClick={() => handlePlanSelection("1")}>
          <div className="plan-card-icon" aria-hidden="true">◔</div>
          <input type="radio" name="plan" value="1" checked={planId === "1"} onChange={() => handlePlanSelection("1")} />
          <div className="plan-card-title">Free Plan</div>
          <div className="plan-card-desc">Great for trying out DynoDocs component and templates.</div>
        </label>

        <label className={`plan-card ${planId === "2" ? "plan--active" : ""}`} onClick={() => handlePlanSelection("2")}>
          <div className="plan-card-icon" aria-hidden="true">◔</div>
          <input type="radio" name="plan" value="2" checked={planId === "2"} onChange={() => handlePlanSelection("2")} />
          <div className="plan-card-title">Professional Plan</div>
          <div className="plan-card-price">
            <span className="plan-card-amount">${proPrice}</span>
            <span className="plan-card-cycle">{cadenceLabel}</span>
          </div>
          <div className="plan-card-desc">Best for professional freelancers and small teams.</div>
        </label>

        <label className={`plan-card ${planId === "3" ? "plan--active" : ""}`} onClick={() => handlePlanSelection("3")}>
          <div className="plan-card-icon" aria-hidden="true">◔</div>
          <input type="radio" name="plan" value="3" checked={planId === "3"} onChange={() => handlePlanSelection("3")} />
          <div className="plan-card-title">Enterprise Plan</div>
          <div className="plan-card-price">
            <span className="plan-card-amount">${enterprisePrice}</span>
            <span className="plan-card-cycle">{cadenceLabel}</span>
          </div>
          <div className="plan-card-desc">Best for growing large company or enterprise design team.</div>
        </label>
      </div>

      <div className="more-details">
        {/* <button type="button" className="link" onClick={() => navigate('/pricing')}>More Details</button> */}
      </div>

      <div className="terms">
        <label style={{fontSize: "14px"}}>
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
    {showPayment && (
      <div className="payment-overlay" role="dialog" aria-modal="true">
        <div className="payment-overlay-panel">
          <button type="button" className="payment-overlay-close" aria-label="Close payment form" onClick={handlePaymentClose}>Close</button>
          <CardPayment totalAmount={paymentAmount} currency="USD" onPaid={handlePaymentSuccess} />
        </div>
      </div>
    )}
    </>
  );
}

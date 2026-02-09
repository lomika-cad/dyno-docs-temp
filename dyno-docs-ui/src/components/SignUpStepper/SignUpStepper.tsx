import { useState } from "react";
import Step1Personal from "./Step1Personal";
import Step2Business from "./Step2Business";
import Step3Plan from "./Step3Plan";
import { showError, showSuccess } from "../Toast";
import { registerAgency } from "../../services/auth-api";

export type SignUpForm = {
  // Personal
  fullName?: string;
  nicNo?: string;
  mobileNo?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;

  // Business
  agencyName?: string;
  businessRegNo?: string;
  contactNo?: string;
  country?: string;
  state?: string;
  city?: string;
  agencyAddress?: string;
  agencyLogoFile?: File | null;
  agencyLogoUrl?: string;

  // Plan
  planId?: string;
  promoCode?: string;
  termsAccepted?: boolean;
};

export default function SignUpStepper() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SignUpForm>({});

  const onNext = (values: Partial<SignUpForm>) => {
    setForm((s) => ({ ...s, ...values }));
    setStep((s) => Math.min(3, s + 1));
  };

  const onBack = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (values: Partial<SignUpForm>) => {
    setForm((s) => ({ ...s, ...values }));
    const payload = { ...form, ...values } as SignUpForm;

    // Basic client validation
    if (!payload.email || !payload.password || !payload.fullName) {
      showError("Please complete required fields.");
      return;
    }

    if (!payload.termsAccepted) {
      showError("You must accept the terms and conditions.");
      return;
    }

    setLoading(true);

    try {
      // Build FormData for single register-agency endpoint
      const fd = new FormData();
      fd.append("AgencyName", payload.agencyName ?? "");
      fd.append("BusinessRegNo", payload.businessRegNo ?? "");
      fd.append("ContactNo", payload.contactNo ?? "");
      fd.append("Country", payload.country ?? "");
      fd.append("State", payload.state ?? "");
      fd.append("City", payload.city ?? "");
      fd.append("AgencyAddress", payload.agencyAddress ?? "");
      if (payload.agencyLogoFile) fd.append("AgencyLogo", payload.agencyLogoFile);

      fd.append("FullName", payload.fullName ?? "");
      fd.append("NICNo", payload.nicNo ?? "");
      fd.append("MobileNo", payload.mobileNo ?? "");
      fd.append("Email", payload.email ?? "");
      fd.append("Password", payload.password ?? "");
      fd.append("ConfirmPassword", (payload as any).confirmPassword ?? "");

      // Optional fields
      if (payload.planId) fd.append("PlanId", payload.planId);
      if (payload.promoCode) fd.append("PromoCode", payload.promoCode);

      await registerAgency(fd);

      // API returns a Guid on success; show message and redirect to sign in
      showSuccess("Registration successful. Please sign in.");
      window.location.href = "/";
    } catch (error: any) {
      console.error(error);
      showError(error?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-stepper">
      <div className="stepper-progress" role="tablist" aria-label="Registration Steps">
        <div className={`step ${step >= 1 ? "step--active" : ""}`} aria-current={step === 1 ? "step" : undefined}>
          <div className="step__circle">{step > 1 ? "✓" : 1}</div>
          <div className="step__label">Personal info</div>
        </div>

        <div className={`step ${step >= 2 ? "step--active" : ""}`} aria-current={step === 2 ? "step" : undefined}>
          <div className="step__circle">{step > 2 ? "✓" : 2}</div>
          <div className="step__label">Business Info</div>
        </div>

        <div className={`step ${step >= 3 ? "step--active" : ""}`} aria-current={step === 3 ? "step" : undefined}>
          <div className="step__circle">3</div>
          <div className="step__label">Subscription Plan</div>
        </div>
      </div>

      <div className="stepper-card">
        {step === 1 && <Step1Personal initial={form} onNext={onNext} />}
        {step === 2 && <Step2Business initial={form} onNext={onNext} onBack={onBack} />}
        {step === 3 && (
          <Step3Plan initial={form} onBack={onBack} onSubmit={onSubmit} loading={loading} />
        )}
      </div>
    </div>
  );
}

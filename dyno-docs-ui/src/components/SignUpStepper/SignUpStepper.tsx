import { useState } from "react";
import Step1Personal from "./Step1Personal";
import Step2Business from "./Step2Business";
import Step3Plan from "./Step3Plan";
import { showError, showInfo, showSuccess } from "../Toast";
import { registerAgency } from "../../services/auth-api";

export type SignUpForm = {
  // Personal Details
  fullName?: string;
  nicNo?: string;
  mobileNo?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;

  // Business Details
  agencyName?: string;
  businessRegNo?: string;
  contactNo?: string;
  country?: string;
  state?: string;
  city?: string;
  agencyAddress?: string;
  agencyLogoFile?: File | null;
  agencyLogoUrl?: string;

  // Plan Selection
  planId?: any;
  planName?: string;
  planType?: any;
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

    if (!payload.email || !payload.password || !payload.fullName) {
      showError("Please complete required fields.");
      return;
    }

    if (!payload.termsAccepted) {
      showInfo("You must accept the terms and conditions.");
      return;
    }

    setLoading(true);

    try {
      const formdata = new FormData();
      formdata.append("AgencyName", payload.agencyName ?? "");
      formdata.append("BusinessRegNo", payload.businessRegNo ?? "");
      formdata.append("ContactNo", payload.contactNo ?? "");
      formdata.append("Country", payload.country ?? "");
      formdata.append("State", payload.state ?? "");
      formdata.append("City", payload.city ?? "");
      formdata.append("AgencyAddress", payload.agencyAddress ?? "");
      if (payload.agencyLogoFile) formdata.append("AgencyLogo", payload.agencyLogoFile);

      formdata.append("FullName", payload.fullName ?? "");
      formdata.append("NICNo", payload.nicNo ?? "");
      formdata.append("MobileNo", payload.mobileNo ?? "");
      formdata.append("Email", payload.email ?? "");
      formdata.append("Password", payload.password ?? "");
      formdata.append("ConfirmPassword", (payload as any).confirmPassword ?? "");

      if (payload.planId) formdata.append("PlanId", payload.planId);
      formdata.append("PlanName", payload.planId === "1" ? "Free" : payload.planId === "2" ? "Professional" : "Enterprise");
      formdata.append("PlanType", payload.planType ?? "");

      console.log(payload);
      console.log(payload.planId === "1" ? "Free" : payload.planId === "2" ? "Professional" : "Enterprise");
      


      await registerAgency(formdata);

      // // API returns a Guid on success; show message and redirect to sign in
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
          <div className="step-circle">{step > 1 ? "✓" : 1}</div>
          <div className="step-label">Personal info</div>
        </div>

        <div className={`step ${step >= 2 ? "step--active" : ""}`} aria-current={step === 2 ? "step" : undefined}>
          <div className="step-circle">{step > 2 ? "✓" : 2}</div>
          <div className="step-label">Business Info</div>
        </div>

        <div className={`step ${step >= 3 ? "step--active" : ""}`} aria-current={step === 3 ? "step" : undefined}>
          <div className="step-circle">3</div>
          <div className="step-label">Subscription Plan</div>
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

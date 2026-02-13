import { useState } from "react";
import type { SignUpForm } from "./SignUpStepper";

type Props = {
  initial?: SignUpForm;
  onNext: (values: Partial<SignUpForm>) => void;
};

export default function Step1Personal({ initial, onNext }: Props) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [nicNo, setNicNo] = useState(initial?.nicNo ?? "");
  const [mobileNo, setMobileNo] = useState(initial?.mobileNo ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValidSriLankanNic = (value: string) => {
    const normalized = value.trim().toUpperCase();
    const oldPattern = /^(\d{9})([VvXx])$/;
    const newPattern = /^\d{12}$/;
    return oldPattern.test(normalized) || newPattern.test(normalized);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!nicNo.trim()) {
      e.nicNo = "NIC number is required";
    } else if (!isValidSriLankanNic(nicNo)) {
      e.nicNo = "Enter a valid Sri Lankan NIC";
    }
    if (!mobileNo.trim()) e.mobileNo = "Mobile number is required";
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email is required";
    if (!password || password.length < 8) e.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onNext({ fullName, nicNo, mobileNo, email, password, confirmPassword });
  };


  return (
    <form onSubmit={handleNext} aria-label="Personal information">
      <div className="row">
        <label className="field">
          <div className="field-label">Full Name</div>
          <input
            id="fullName"
            className="field-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-required
            aria-invalid={!!errors.fullName}
            placeholder="Enter your full name"
          />
          {errors.fullName && <div className="field-error">{errors.fullName}</div>}
        </label>

        <label className="field">
          <div className="field-label">NIC No</div>
          <input
            id="nicNo"
            className="field-input"
            value={nicNo}
            aria-required
            aria-invalid={!!errors.nicNo}
            onChange={(e) => setNicNo(e.target.value)}
            placeholder="Enter your nic no"
          />
          {errors.nicNo && <div className="field-error">{errors.nicNo}</div>}
        </label>
      </div>

      <div className="row">
        <label className="field">
          <div className="field-label">Mobile No</div>
          <input
            id="mobileNo"
            className="field-input"
            value={mobileNo}
            onChange={(e) => setMobileNo(e.target.value)}
            aria-required
            aria-invalid={!!errors.mobileNo}
            placeholder="Enter your mobile no"
          />
          {errors.mobileNo && <div className="field-error">{errors.mobileNo}</div>}
        </label>

        <label className="field">
          <div className="field-label">Email</div>
          <input
            id="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-required
            aria-invalid={!!errors.email}
            placeholder="Enter your email"
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </label>
      </div>

      <div className="row">
        <label className="field">
          <div className="field-label">Password</div>
          <input
            id="password"
            className="field-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-required
            aria-invalid={!!errors.password}
            placeholder="Enter your password"
          />
          {errors.password && <div className="field-error">{errors.password}</div>}
        </label>

        <label className="field">
          <div className="field-label">Confirm Password</div>
          <input
            id="confirmPassword"
            className="field-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-required
            aria-invalid={!!errors.confirmPassword}
            placeholder="Enter your password again"
          />
          {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
        </label>
      </div>

      <div className="form-actions">
        <div className="form-actions-left">
          <button type="button" className="btn btn--muted" onClick={() => window.location.href = '/'}>
            Cancel
          </button>
        </div>
        <div className="form-actions-right">
          <button type="submit" className="btn btn--primary">
            Next
          </button>
        </div>
      </div>
    </form>
  );
}

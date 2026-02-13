import { useState, useRef } from "react";
import type { SignUpForm } from "./SignUpStepper";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

type Props = {
  initial?: SignUpForm;
  onNext: (values: Partial<SignUpForm>) => void;
  onBack: () => void;
};

export default function Step2Business({ initial, onNext, onBack }: Props) {
  const [agencyName, setAgencyName] = useState(initial?.agencyName ?? "");
  const [businessRegNo, setBusinessRegNo] = useState(initial?.businessRegNo ?? "");
  const [contactNo, setContactNo] = useState(initial?.contactNo ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [agencyAddress, setAgencyAddress] = useState(initial?.agencyAddress ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(initial?.agencyLogoFile ?? null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initial?.agencyLogoUrl ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onSelectLogo = (file?: File | null) => {
    if (!file) return;
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setErrors((e) => ({ ...e, logo: "File is too large (max 2MB)" }));
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((e) => ({ ...e, logo: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) onSelectLogo(f);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const [isLogoDragActive, setIsLogoDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragActive(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onSelectLogo(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragActive(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const require = (value: string, key: string, label: string) => {
      if (!value.trim()) e[key] = `${label} is required`;
    };

    require(agencyName, "agencyName", "Agency name");
    require(businessRegNo, "businessRegNo", "Business registration number");
    if (!contactNo.trim()) {
      e.contactNo = "Contact number is required";
    } else {
      const sanitized = contactNo.replace(/\s|-/g, "");
      const phoneOk = /^\+?\d{9,15}$/.test(sanitized);
      if (!phoneOk) e.contactNo = "Enter a valid contact number";
    }
    require(country, "country", "Country");
    require(state, "state", "State");
    require(city, "city", "City");
    require(agencyAddress, "agencyAddress", "Agency address");
    if (!logoFile) e.logo = "Agency logo is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onNext({ agencyName, businessRegNo, contactNo, country, state, city, agencyAddress, agencyLogoFile: logoFile, agencyLogoUrl: logoPreview || undefined });
  };

  return (
    <form onSubmit={handleNext} aria-label="Business information">
      <div className="row row--three">
        <label className="field">
          <div className="field-label">Agency Name</div>
          <input id="agencyName" className="field-input" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Enter your agency name" />
          {errors.agencyName && <div className="field-error">{errors.agencyName}</div>}
        </label>

        <label className="field">
          <div className="field-label">Business Reg No</div>
          <input id="businessRegNo" className="field-input" value={businessRegNo} onChange={(e) => setBusinessRegNo(e.target.value)} placeholder="Enter your business reg no" />
          {errors.businessRegNo && <div className="field-error">{errors.businessRegNo}</div>}
        </label>

        <label className="field">
          <div className="field-label">Contact No</div>
          <input id="contactNo" className="field-input" value={contactNo} onChange={(e) => setContactNo(e.target.value)} placeholder="Enter your agency contact no" />
          {errors.contactNo && <div className="field-error">{errors.contactNo}</div>}
        </label>
      </div>

      <div className="row row--three">
        <label className="field">
          <div className="field-label">Country</div>
          <input id="country" className="field-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Enter your country" />
          {errors.country && <div className="field-error">{errors.country}</div>}
        </label>

        <label className="field">
          <div className="field-label">State</div>
          <input id="state" className="field-input" value={state} onChange={(e) => setState(e.target.value)} placeholder="Enter your state" />
          {errors.state && <div className="field-error">{errors.state}</div>}
        </label>

        <label className="field">
          <div className="field-label">City</div>
          <input id="city" className="field-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter your city" />
          {errors.city && <div className="field-error">{errors.city}</div>}
        </label>
      </div>

      <div className="row">
        <label className="full field">
          <div className="field-label">Agency Address</div>
          <textarea id="agencyAddress" className="field-input" value={agencyAddress} onChange={(e) => setAgencyAddress(e.target.value)} placeholder="Enter your agency address" />
          {errors.agencyAddress && <div className="field-error">{errors.agencyAddress}</div>}
        </label>
      </div>

      <div className="row">
        <label className="full field">
          <div className="field-label">Agency Logo</div>

          <div
            className={`dropzone ${isLogoDragActive ? "dropzone--active" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            role="button"
            tabIndex={0}
          >
            <span className="dropzone-icon" aria-hidden="true">
              <CloudUploadRoundedIcon />
            </span>
            <div className="dropzone-title">Select your image or drag and drop</div>
            <div className="dropzone-sub">png, jpg, jpeg accepted</div>

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            <button type="button" className="btn btn--orange" onClick={() => fileRef.current?.click()}>Browse</button>
          </div>

          {logoPreview && (
            <div className="imagePreviews" style={{ marginTop: 12 }}>
              <div className="imagePreviewItem">
                <img src={logoPreview} alt="Preview" className="imagePreviewItem-img" />
                <button type="button" className="imagePreviewItem-remove" onClick={handleRemoveLogo}>×</button>
              </div>
            </div>
          )}

          {errors.logo && <div className="field-error">{errors.logo}</div>}
        </label>
      </div>

      <div className="form-actions">
        <div className="form-actions-left">
          <button type="button" className="btn btn--ghost" onClick={onBack}>Back</button>
          <button type="button" className="btn btn--muted" onClick={() => (window.location.href = '/')}>
            Cancel
          </button>
        </div>
        <div className="form-actions-right">
          <button type="submit" className="btn btn--primary">Next</button>
        </div>
      </div>
    </form>
  );
}

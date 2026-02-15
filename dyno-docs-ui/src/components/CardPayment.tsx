import { useMemo, useState } from "react";
import "../styles/cardPayment.css";
import { showSuccess } from "./Toast";

type CardPaymentProps = {
	totalAmount: number;
	currency?: string;
	locale?: string;
	paymentPath?: string;
	onPaid?: () => void;
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const formatPreviewSegment = (segment: string) => {
	if (!segment) return "••••";
	return segment.padEnd(4, "•");
};

const getYears = (count = 12) => {
	const start = new Date().getFullYear();
	return Array.from({ length: count }, (_, index) => String(start + index));
};

export default function CardPayment({
	totalAmount,
	currency = "LKR",
	locale = "en-LK",
	onPaid,
}: CardPaymentProps) {
	const [cardNumberSegments, setCardNumberSegments] = useState<string[]>(["", "", "", ""]);
	const [cardHolder, setCardHolder] = useState("");
	const [expiryMonth, setExpiryMonth] = useState("07");
	const [expiryYear, setExpiryYear] = useState(String(new Date().getFullYear()));
	const [cvv, setCvv] = useState("");

	const amountLabel = useMemo(() => {
		// If amount is in LKR but we want to *display* as USD
		// without conversion, just change the currency code.
		const displayCurrency = currency === "LKR" ? "USD" : currency;
		try {
			return new Intl.NumberFormat(locale, {
				style: "currency",
				currency: displayCurrency,
				minimumFractionDigits: 0,
				maximumFractionDigits: 2,
			}).format(totalAmount);
		} catch {
			return `${totalAmount}`;
		}
	}, [currency, locale, totalAmount]);

	const cardNumberPreview = useMemo(
		() => cardNumberSegments.map(formatPreviewSegment).join(" "),
		[cardNumberSegments],
	);

	const canSubmit = useMemo(() => {
		const allSegmentsComplete = cardNumberSegments.every((segment) => segment.length === 4);
		const holderOk = cardHolder.trim().length >= 2;
		const cvvOk = cvv.length >= 3;
		const amountOk = Number.isFinite(totalAmount) && totalAmount > 0;
		return allSegmentsComplete && holderOk && cvvOk && amountOk;
	}, [cardHolder, cardNumberSegments, cvv, totalAmount]);

	const updateSegment = (index: number, raw: string) => {
		const next = [...cardNumberSegments];
		next[index] = onlyDigits(raw).slice(0, 4);
		setCardNumberSegments(next);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!canSubmit) return;

		showSuccess(`${amountLabel} payment completed.`);
		onPaid?.();
	};

	return (
		<div className="card-payment">
			<div className="card-payment-preview">
				<div className="card-payment-chip" />
				<div className="card-payment-brand">VISA</div>
				<div className="card-payment-number">{cardNumberPreview}</div>
				<div className="card-payment-meta">
					<div>
						<div className="card-payment-label">CARD HOLDER</div>
						<div className="card-payment-value">{cardHolder.trim() || "Your Name"}</div>
					</div>
					<div className="card-payment-meta-right">
						<div className="card-payment-label">EXPIRES</div>
						<div className="card-payment-value">
							{expiryMonth}/{expiryYear.slice(-2)}
						</div>
					</div>
				</div>
			</div>

			<form className="card-payment-form" onSubmit={handleSubmit}>
				<div className="card-payment-form-grid">
					<div className="card-payment-field card-payment-field--full">
						<label className="card-payment-field-label">TOTAL AMOUNT</label>
						<input className="card-payment-input" value={amountLabel} readOnly />
					</div>

					<div className="card-payment-field card-payment-field--full">
						<label className="card-payment-field-label">CARD NUMBER</label>
						<div className="card-payment-number-inputs">
							{cardNumberSegments.map((segment, index) => (
								<input
									key={index}
									className="card-payment-input card-payment-input--segment"
									inputMode="numeric"
									autoComplete={index === 0 ? "cc-number" : "off"}
									placeholder="0000"
									value={segment}
									onChange={(e) => updateSegment(index, e.target.value)}
								/>
							))}
						</div>
					</div>

					<div className="card-payment-field card-payment-field--full">
						<label className="card-payment-field-label">CARD HOLDER</label>
						<input
							className="card-payment-input"
							autoComplete="cc-name"
							placeholder="Full name"
							value={cardHolder}
							onChange={(e) => setCardHolder(e.target.value)}
						/>
					</div>

					<div className="card-payment-field">
						<label className="card-payment-field-label">EXPIRATION DATE</label>
						<div className="card-payment-row">
							<select
								className="card-payment-input card-payment-select"
								value={expiryMonth}
								onChange={(e) => setExpiryMonth(e.target.value)}
							>
								{Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((month) => (
									<option key={month} value={month}>
										{month}
									</option>
								))}
							</select>

							<select
								className="card-payment-input card-payment-select"
								value={expiryYear}
								onChange={(e) => setExpiryYear(e.target.value)}
							>
								{getYears(14).map((year) => (
									<option key={year} value={year}>
										{year}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="card-payment-field">
						<label className="card-payment-field-label">CVV</label>
						<input
							className="card-payment-input"
							inputMode="numeric"
							autoComplete="cc-csc"
							placeholder="123"
							value={cvv}
							onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
						/>
					</div>
				</div>

				<button className="card-payment-submit" type="submit" disabled={!canSubmit}>
					Pay
				</button>
			</form>
		</div>
	);
}


import axios from "axios";
import { getEnv } from "../env";

export type CardPaymentRequest = {
  totalAmount: number;
  currency?: string;
  cardHolder: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
};

// NOTE: The backend currently doesn't expose a payment endpoint in this repo.
// The default path can be overridden by the caller via `paymentPath`.
const DEFAULT_PAYMENT_PATH = "/operations/payments/card";

export const submitCardPayment = async (
  payload: CardPaymentRequest,
  paymentPath: string = DEFAULT_PAYMENT_PATH,
) => {
  const url = `${getEnv().API_URL}${paymentPath}`;
  const response = await axios.post(url, payload);
  return response;
};

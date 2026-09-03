import api from "../utils/api";

export interface DepositResponse {
  payment_url?: string;
  message?: string;
  [key: string]: unknown;
}

export interface WithdrawResponse {
  message?: string;
  [key: string]: unknown;
}

/* POST /deposit — amount in naira, converted to kobo here so call sites
   never have to remember the *100. */
export async function depositFunds(
  amountNaira: number,
  gateway: string
): Promise<DepositResponse> {
  const res = await api.post("/deposit", {
    amount: amountNaira * 100,
    gateway,
  });
  return res.data;
}

/* POST /withdraw
   `idempotencyKey` should be a UUID generated once per withdrawal attempt
   and reused across retries of that same attempt (see app/wallet/page.tsx)
   so the backend's idempotency middleware can dedupe a resubmission after
   a timeout instead of processing the withdrawal twice. */
export async function withdrawFunds(
  amountNaira: number,
  pin: string,
  idempotencyKey: string
): Promise<WithdrawResponse> {
  const res = await api.post(
    "/withdraw",
    {
      amount: amountNaira * 100,
      transaction_pin: pin,
    },
    { headers: { "Idempotency-Key": idempotencyKey } }
  );
  return res.data;
}

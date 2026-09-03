import api from "../utils/api";

export interface AccountStatus {
  pin_is_set?: boolean;
  kyc_status?: string;
  [key: string]: unknown;
}

/* GET /user/account-status */
export async function getAccountStatus(): Promise<AccountStatus> {
  const res = await api.get("/user/account-status");
  return res.data?.data ?? {};
}

/* POST /pin/set — first-time PIN */
export async function setTransactionPin(
  pin: string,
  pinConfirmation: string
): Promise<void> {
  await api.post("/pin/set", { pin, pin_confirmation: pinConfirmation });
}

/* POST /pin/update — change an existing PIN */
export async function updateTransactionPin(
  currentPin: string,
  newPin: string,
  pinConfirmation: string
): Promise<void> {
  await api.post("/pin/update", {
    current_pin: currentPin,
    new_pin: newPin,
    pin_confirmation: pinConfirmation,
  });
}

/* ── Forgotten-PIN reset flow ────────────────────────────────────────── */

/* POST /pin/forgot */
export async function forgotPin(email: string): Promise<void> {
  await api.post("/pin/forgot", { email });
}

export interface VerifyPinCodeResponse {
  reset_token: string;
  [key: string]: unknown;
}

/* POST /pin/verify-code */
export async function verifyPinCode(
  email: string,
  code: string
): Promise<VerifyPinCodeResponse> {
  const res = await api.post("/pin/verify-code", { email, code });
  return res.data;
}

/* POST /pin/reset */
export async function resetPin(
  resetToken: string,
  newPin: string,
  pinConfirmation: string
): Promise<void> {
  await api.post("/pin/reset", {
    reset_token: resetToken,
    new_pin: newPin,
    pin_confirmation: pinConfirmation,
  });
}

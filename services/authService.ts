import api from "../utils/api";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

/* POST /register */
export async function registerUser(payload: RegisterPayload): Promise<void> {
  await api.post("/register", payload);
}

/* ── Password reset ─────────────────────────────────────────────────── */

export interface MessageResponse {
  message?: string;
  [key: string]: unknown;
}

/* POST /password/reset/code — shared by forgot-password page (initial
   request) and reset-verify page (resend). */
export async function requestPasswordResetCode(
  email: string
): Promise<MessageResponse> {
  const res = await api.post("/password/reset/code", { email });
  return res.data;
}

/* POST /password/reset/verify */
export async function verifyPasswordResetCode(
  email: string,
  code: string
): Promise<void> {
  await api.post("/password/reset/verify", { email, reset_code: code });
}

/* POST /password/reset */
export async function resetPassword(
  email: string,
  form: Record<string, unknown>
): Promise<void> {
  await api.post("/password/reset", { email, ...form });
}

/* ── Email verification ─────────────────────────────────────────────── */

/* POST /email/verify/code */
export async function verifyEmailCode(
  email: string,
  code: string
): Promise<void> {
  await api.post("/email/verify/code", { email, verification_code: code });
}

/* POST /email/resend-verification */
export async function resendEmailVerification(email: string): Promise<void> {
  await api.post("/email/resend-verification", { email });
}

/* ── Certificate verification ───────────────────────────────────────── */

export interface CertificateVerifyResponse {
  [key: string]: unknown;
}

/* GET /verify/:certNumber — public certificate lookup */
export async function verifyCertificate(
  certNumber: string
): Promise<CertificateVerifyResponse> {
  const res = await api.get(`/verify/${certNumber}`);
  return res.data;
}

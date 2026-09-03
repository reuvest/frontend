import api from "../utils/api";

export interface KycStatusResponse {
  status: string;
  [key: string]: unknown;
}

/* GET /kyc/status */
export async function getKycStatus(): Promise<KycStatusResponse> {
  const res = await api.get("/kyc/status");
  return res.data.data;
}

/* POST /kyc/submit — multipart form data (personal info + ID uploads) */
export async function submitKyc(fd: FormData): Promise<void> {
  await api.post("/kyc/submit", fd);
}

/* ── Admin review ────────────────────────────────────────────────────── */

export async function getAdminKycList(status: string): Promise<unknown> {
  const res = await api.get(`/admin/kyc?status=${status}`);
  return res.data;
}

export async function getAdminKycDetail(kycId: string | number): Promise<unknown> {
  const res = await api.get(`/admin/kyc/${kycId}`);
  return res.data;
}

export async function approveKyc(kycId: string | number): Promise<void> {
  await api.post(`/admin/kyc/${kycId}/approve`);
}

export async function rejectKyc(
  kycId: string | number,
  reason: string
): Promise<void> {
  await api.post(`/admin/kyc/${kycId}/reject`, { reason });
}

export async function resubmitKyc(
  kycId: string | number,
  reason: string
): Promise<void> {
  await api.post(`/admin/kyc/${kycId}/resubmit`, { reason });
}

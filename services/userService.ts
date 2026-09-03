import api from "../utils/api";

export interface UserStats {
  balance: number;
  current_portfolio_value: number;
  total_invested: number;
  lands_owned: number;
  units_owned: number;
  total_withdrawn: number;
  pending_withdrawals?: number;
}

export interface Transaction {
  type: string;
  status?: string;
  [key: string]: unknown;
}

export interface MeResponse {
  wallet_balance?: number;
  balance_kobo?: number;
  balance?: number;
  pin_is_set?: boolean;
  transaction_pin?: unknown;
  kyc_status?: string;
  is_kyc_verified?: boolean;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  is_admin?: boolean;
  permissions?: string[];
  role_names?: string[];
  [key: string]: unknown;
}

/* GET /user/stats — normalizes kobo fields to naira, matching the shape
   dashboard/page.jsx's useDashboardData already expected. */
export async function getUserStats(signal?: AbortSignal): Promise<UserStats> {
  const res = await api.get("/user/stats", { signal, timeout: 8_000 });
  const s = res.data?.data ?? {};
  return {
    balance: (s.balance_kobo ?? 0) / 100,
    current_portfolio_value: (s.current_portfolio_value_kobo ?? 0) / 100,
    total_invested: (s.total_invested_kobo ?? 0) / 100,
    lands_owned: s.lands_owned ?? 0,
    units_owned: s.units_owned ?? 0,
    total_withdrawn: (s.total_withdrawn_kobo ?? 0) / 100,
    pending_withdrawals: s.pending_withdrawals,
  };
}

/* GET /transactions/user — raw list, kobo amounts left as-is since callers
   (dashboard, wallet) format differently. */
export async function getUserTransactions(
  signal?: AbortSignal
): Promise<Transaction[]> {
  const res = await api.get("/transactions/user", { signal, timeout: 8_000 });
  const txList = res.data?.data ?? res.data ?? [];
  return Array.isArray(txList) ? txList : [];
}

/* GET /me */
export async function getMe(): Promise<MeResponse> {
  const res = await api.get("/me");
  return res.data?.data ?? res.data?.user ?? {};
}

/* POST /user/change-password */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirmation: string
): Promise<void> {
  await api.post("/user/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
    new_password_confirmation: newPasswordConfirmation,
  });
}
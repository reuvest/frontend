import api from "../utils/api";

export interface Bank {
  name: string;
  code: string;
  [key: string]: unknown;
}

export interface ResolveAccountResponse {
  account_name?: string;
  data?: { account_name?: string };
  [key: string]: unknown;
}

export interface BankDetailsPayload {
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface BankDetailsResponse {
  message?: string;
  [key: string]: unknown;
}

/* GET /paystack/banks */
export async function getBanks(): Promise<Bank[]> {
  const res = await api.get("/paystack/banks");
  return res.data.banks || [];
}

/* POST /paystack/resolve-account */
export async function resolveAccount(
  accountNumber: string,
  bankCode: string
): Promise<ResolveAccountResponse> {
  const res = await api.post("/paystack/resolve-account", {
    account_number: accountNumber,
    bank_code: bankCode,
  });
  return res.data;
}

/* PUT /user/bank-details */
export async function updateBankDetails(
  payload: BankDetailsPayload
): Promise<BankDetailsResponse> {
  const res = await api.put("/user/bank-details", payload);
  return res.data;
}

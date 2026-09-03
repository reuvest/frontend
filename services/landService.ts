import api from "../utils/api";

export interface LandTransactionResponse {
  success: boolean;
  message?: string;
  total_discount_kobo?: number;
  paid_from_rewards_kobo?: number;
  certificate?: { cert_number?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface UserLandUnitsResponse {
  units: number;
  [key: string]: unknown;
}

export interface Land {
  id: string | number;
  [key: string]: unknown;
}

export interface PurchasePreview {
  [key: string]: unknown;
}

/* GET /land — public listing used on the lands index/marketplace map */
export async function getLandList(): Promise<Land[]> {
  const res = await api.get("/land");
  return res.data?.data ?? [];
}

/* GET /lands/:id — single land detail */
export async function getLand(id: string | number): Promise<Land> {
  const res = await api.get(`/lands/${id}`);
  return res.data.data;
}

/* GET /lands/:id/purchase/preview */
export async function getPurchasePreview(
  id: string | number,
  units: number,
  useRewards: boolean
): Promise<PurchasePreview> {
  const res = await api.get(`/lands/${id}/purchase/preview`, {
    params: { units, use_rewards: useRewards ? 1 : 0 },
  });
  return res.data.data;
}

/* PURCHASE LAND */
export async function purchaseLand(
  id: string | number,
  units: number,
  pin: string,
  useRewards = true
): Promise<LandTransactionResponse> {
  const res = await api.post(`/lands/${id}/purchase`, {
    units,
    use_rewards: useRewards,
    transaction_pin: pin,
  });

  return res.data;
}

/* SELL LAND */
export async function sellLand(
  id: string | number,
  units: number,
  pin: string
): Promise<LandTransactionResponse> {
  const res = await api.post(`/lands/${id}/sell`, {
    units,
    transaction_pin: pin,
  });

  return res.data;
}

/* GET USER UNITS FOR LAND */
export async function getUserUnitsForLand(
  id: string | number
): Promise<UserLandUnitsResponse> {
  const res = await api.get(`/lands/${id}/units`);
  return res.data;
}

/* ── Admin ───────────────────────────────────────────────────────────── */

/* GET /admin/lands */
export async function getAdminLands(): Promise<Land[]> {
  const res = await api.get("/admin/lands");
  return res.data?.data?.data ?? res.data?.data ?? [];
}

/* GET /admin/lands/:id */
export async function getAdminLand(id: string | number): Promise<Land> {
  const res = await api.get(`/admin/lands/${id}`);
  return res.data.data;
}

/* PATCH /admin/lands/:id/availability — toggle visible on marketplace */
export async function toggleLandAvailability(id: string | number): Promise<void> {
  await api.patch(`/admin/lands/${id}/availability`);
}

/* PATCH /admin/lands/:id/price */
export async function updateLandPrice(
  id: string | number,
  pricePerUnitKobo: number,
  priceDate?: string
): Promise<void> {
  await api.patch(`/admin/lands/${id}/price`, {
    price_per_unit_kobo: pricePerUnitKobo,
    ...(priceDate ? { price_date: priceDate } : {}),
  });
}

/* POST /admin/lands — create (multipart form) */
export async function createAdminLand(formData: FormData): Promise<void> {
  await api.post("/admin/lands", formData);
}

/* POST /admin/lands/:id — update (multipart form, method-spoofed as POST) */
export async function updateAdminLand(
  id: string | number,
  formData: FormData
): Promise<void> {
  await api.post(`/admin/lands/${id}`, formData);
}

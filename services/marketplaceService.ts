import api from "../utils/api";

/* ── Shared shapes ───────────────────────────────────────────────────────
 * Listing/offer/escrow payloads carry a lot of nested, loosely-specified
 * fields (land, seller, buyer, pending_offers, ...) that vary by endpoint
 * and are still evolving server-side. Following the same pattern as
 * landService.ts's Land/PurchasePreview types: pin down the fields every
 * page actually reads off these, and leave the rest as `unknown` rather
 * than guessing a full backend schema.
 */

export interface MarketplaceListing {
  id: string | number;
  status: string;
  land_id?: string | number;
  seller_id?: string | number;
  asking_price_kobo: number;
  units_for_sale: number;
  description?: string;
  expires_at?: string;
  land?: {
    id?: string | number;
    title?: string;
    location?: string;
    images?: { image_url?: string }[];
    [key: string]: unknown;
  };
  seller?: { id?: string | number; name?: string; [key: string]: unknown };
  pending_offers?: MarketplaceOffer[];
  [key: string]: unknown;
}

export interface MarketplaceOffer {
  id: string | number;
  status: string;
  buyer_id: string | number;
  units: number;
  offer_price_kobo: number;
  message?: string;
  buyer?: { id?: string | number; name?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface MarketplaceMessage {
  id: string | number;
  sender_id: string | number;
  body: string;
  created_at: string;
  sender?: { id?: string | number; name?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface MarketplaceEscrow {
  id: string | number;
  status: string;
  listing_id: string | number;
  buyer_id: string | number;
  units: number;
  price_per_unit_kobo: number;
  total_kobo: number;
  platform_fee_kobo: number;
  seller_receives_kobo: number;
  expires_at?: string;
  [key: string]: unknown;
}

export interface ListingsMeta {
  last_page: number;
  [key: string]: unknown;
}

export interface ListingsResult {
  listings: MarketplaceListing[];
  meta: ListingsMeta | null;
}

export interface CurrentUser {
  id: string | number;
  name?: string;
  [key: string]: unknown;
}

export interface UserLandHolding {
  land_id: string | number;
  units: number;
  land?: MarketplaceListing["land"];
  [key: string]: unknown;
}

export interface ListingFilters {
  page?: number;
  sort?: string;
  min_price?: number;
  max_price?: number;
}

export interface CreateListingPayload {
  land_id: number;
  units_for_sale: number;
  asking_price_kobo: number;
  description?: string;
  expires_at?: string;
}

export interface SubmitOfferPayload {
  units: number;
  offer_price_kobo: number;
  message?: string;
}

/* GET /me — used on the listing detail page to identify the viewer */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await api.get("/me");
  return res.data?.data ?? null;
}

/* GET /user/lands — a buyer's own land holdings, used to populate the
 * "create listing" property picker. */
export async function getUserLandHoldings(): Promise<UserLandHolding[]> {
  const res = await api.get("/user/lands");
  return res.data?.data ?? [];
}

/* GET /marketplace */
export async function getListings(filters: ListingFilters): Promise<ListingsResult> {
  const params: Record<string, number | string> = {};
  if (filters.page) params.page = filters.page;
  if (filters.sort) params.sort = filters.sort;
  if (filters.min_price) params.min_price = filters.min_price;
  if (filters.max_price) params.max_price = filters.max_price;

  const res = await api.get("/marketplace", { params });
  const d = res.data.data;
  return {
    listings: d.data ?? d ?? [],
    meta: d.meta ?? null,
  };
}

/* GET /marketplace/:id */
export async function getListing(id: string | number): Promise<MarketplaceListing> {
  const res = await api.get(`/marketplace/${id}`);
  return res.data.data;
}

/* POST /marketplace */
export async function createListing(payload: CreateListingPayload): Promise<void> {
  await api.post("/marketplace", payload);
}

/* DELETE /marketplace/:id */
export async function cancelListing(id: string | number): Promise<void> {
  await api.delete(`/marketplace/${id}`);
}

/* GET /marketplace/my/escrows */
export async function getMyEscrows(): Promise<MarketplaceEscrow[]> {
  const res = await api.get("/marketplace/my/escrows");
  return res.data?.data?.data ?? res.data?.data ?? [];
}

/* POST /marketplace/:id/offers */
export async function submitOffer(
  listingId: string | number,
  payload: SubmitOfferPayload
): Promise<void> {
  await api.post(`/marketplace/${listingId}/offers`, payload);
}

/* PATCH /marketplace/:id/offers/:offerId/accept */
export async function acceptOffer(listingId: string | number, offerId: string | number): Promise<void> {
  await api.patch(`/marketplace/${listingId}/offers/${offerId}/accept`);
}

/* PATCH /marketplace/:id/offers/:offerId/reject */
export async function rejectOffer(listingId: string | number, offerId: string | number): Promise<void> {
  await api.patch(`/marketplace/${listingId}/offers/${offerId}/reject`);
}

/* PATCH /marketplace/:id/offers/:offerId/withdraw */
export async function withdrawOffer(listingId: string | number, offerId: string | number): Promise<void> {
  await api.patch(`/marketplace/${listingId}/offers/${offerId}/withdraw`);
}

/* GET /marketplace/:id/messages */
export async function getMessages(
  listingId: string | number,
  withUserId?: string | number
): Promise<MarketplaceMessage[]> {
  const params = withUserId ? { with: withUserId } : {};
  const res = await api.get(`/marketplace/${listingId}/messages`, { params });
  return res.data?.data ?? [];
}

/* POST /marketplace/:id/messages */
export async function sendMessage(
  listingId: string | number,
  body: string,
  receiverId?: string | number
): Promise<void> {
  const payload: { body: string; receiver_id?: string | number } = { body };
  if (receiverId !== undefined) payload.receiver_id = receiverId;
  await api.post(`/marketplace/${listingId}/messages`, payload);
}

/* POST /marketplace/escrow/:id/pay */
export async function payEscrow(escrowId: string | number, pin: string): Promise<void> {
  await api.post(`/marketplace/escrow/${escrowId}/pay`, { transaction_pin: pin });
}

/* POST /marketplace/escrow/:id/dispute */
export async function disputeEscrow(escrowId: string | number, reason: string): Promise<void> {
  await api.post(`/marketplace/escrow/${escrowId}/dispute`, { reason });
}

import type { KycForm } from "../app/settings/kyc/constants";

const STORAGE_KEY = "kyc_draft_v1";

/* File objects (id_front/id_back/selfie) can't survive JSON.stringify, so
   the draft only covers the text/select fields. Users re-attach documents
   and redo the liveness check after a restore — that's an accepted
   trade-off, not an oversight. */
export type KycDraftFields = Omit<KycForm, "id_front" | "id_back" | "selfie">;

export interface KycDraft {
  form: KycDraftFields;
  step: number;
  savedAt: string; // ISO timestamp
}

const DRAFTABLE_KEYS: (keyof KycDraftFields)[] = [
  "full_name", "date_of_birth", "phone_number",
  "address", "city", "state", "country",
  "id_type", "id_number",
  "is_pep", "pep_relationship", "pep_role", "pep_country", "pep_details",
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/* Steps 3 (document upload) and 4 (liveness) can't be restored since their
   File data is gone — clamp any saved step down to the furthest step whose
   prerequisites are still satisfiable from text fields alone. */
function clampRestorableStep(step: number): number {
  return Math.min(step, 3);
}

export function saveKycDraft(form: KycForm, step: number): void {
  if (!isBrowser()) return;
  try {
    const fields = {} as KycDraftFields;
    for (const key of DRAFTABLE_KEYS) {
      (fields as any)[key] = form[key];
    }
    const draft: KycDraft = { form: fields, step, savedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // localStorage can throw (private browsing, quota) — auto-save is
    // best-effort, never worth surfacing an error for.
  }
}

export function loadKycDraft(): KycDraft | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KycDraft;
    if (!parsed?.form || typeof parsed.step !== "number") return null;
    return { ...parsed, step: clampRestorableStep(parsed.step) };
  } catch {
    return null;
  }
}

export function clearKycDraft(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

/* Whether a draft is worth restoring — an all-empty draft (e.g. from a
   user who opened the form and immediately left) isn't worth a prompt. */
export function isDraftMeaningful(draft: KycDraft | null): draft is KycDraft {
  if (!draft) return false;
  return Object.values(draft.form).some(
    (v) => v !== "" && v !== null && v !== undefined && v !== false
  );
}

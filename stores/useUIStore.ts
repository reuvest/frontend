import { create } from "zustand";

// ── Global UI state ─────────────────────────────────────────────────────────
//
// Reserved for state that's genuinely shared across disconnected parts of
// the tree — not a replacement for local useState. AuthContext still owns
// auth, react-hot-toast still owns toasts; this currently holds just the
// confirm dialog, since that was duplicated as native window.confirm()
// across 9 admin pages with no shared styling.

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button red for destructive actions (delete, suspend, etc). */
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

interface UIStore {
  confirmState: ConfirmState;
  /** Opens the shared confirm dialog and resolves true/false on choice. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Internal — used by <ConfirmDialog /> to settle the pending promise. */
  _resolveConfirm: (value: boolean) => void;
}

const CLOSED_STATE: ConfirmState = {
  isOpen: false,
  message: "",
  resolve: null,
};

export const useUIStore = create<UIStore>((set, get) => ({
  confirmState: CLOSED_STATE,

  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({
        confirmState: {
          ...options,
          isOpen: true,
          resolve,
        },
      });
    }),

  _resolveConfirm: (value) => {
    const { resolve } = get().confirmState;
    resolve?.(value);
    set({ confirmState: CLOSED_STATE });
  },
}));

/**
 * Convenience hook for call sites — mirrors the ergonomics of
 * `window.confirm()` but returns a promise and renders the app's own
 * styled dialog instead of the browser's native one.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ message: "Delete this user?", danger: true }))) return;
 */
export function useConfirm() {
  return useUIStore((s) => s.confirm);
}
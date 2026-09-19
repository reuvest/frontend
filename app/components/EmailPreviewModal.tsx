"use client";

import { X, Inbox } from "lucide-react";

/**
 * Mirrors resources/views/emails/marketing.blade.php (growthestate_backend)
 * structure and inline styles as closely as possible in JSX, so what the
 * admin sees here matches what actually lands in the recipient's inbox —
 * not just the raw bodyHtml on its own.
 */
export default function EmailPreviewModal({
  subject,
  bodyHtml,
  fromName = "REU.ng",
  fromEmail = "no-reply@reu.ng",
  onClose,
}: {
  subject: string;
  bodyHtml: string;
  fromName?: string;
  fromEmail?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col bg-[#15201b] border border-white/10 shadow-2xl">

        {/* Mock inbox chrome */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-2 text-white/50 text-xs font-semibold">
            <Inbox size={14} /> Inbox preview
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <X size={14} />
          </button>
        </div>

        {/* Mock email headers, like an inbox reading pane */}
        <div className="px-5 py-4 border-b border-white/10 shrink-0">
          <p className="text-white font-bold text-base leading-snug">{subject || "(no subject)"}</p>
          <p className="text-white/40 text-xs mt-1">
            <span className="text-white/60 font-semibold">{fromName}</span> &lt;{fromEmail}&gt;
          </p>
        </div>

        {/* Actual rendered template — scrollable, this is the email itself */}
        <div className="overflow-y-auto" style={{ background: "#0a0f0c" }}>
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ background: "#0a0f0c", padding: "40px 16px" }}>
            <tbody>
              <tr>
                <td align="center">
                  <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: 560, margin: "0 auto" }}>
                    <tbody>
                      {/* Logo */}
                      <tr>
                        <td align="center" style={{ paddingBottom: 28 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/reu_ng_logo.png" alt="REU.ng" width={84} style={{ display: "block", height: "auto", maxWidth: 84 }} />
                        </td>
                      </tr>

                      {/* Card */}
                      <tr>
                        <td
                          style={{
                            background: "#0D1F1A",
                            borderRadius: 16,
                            border: "1px solid rgba(255,255,255,0.08)",
                            padding: "40px 36px",
                            color: "rgba(255,255,255,0.85)",
                            fontSize: 14,
                            lineHeight: 1.7,
                          }}
                          dangerouslySetInnerHTML={{
                            __html: bodyHtml || "<p style='opacity:.4'>Nothing to preview yet — start writing in the editor.</p>",
                          }}
                        />
                      </tr>

                      {/* Footer */}
                      <tr>
                        <td style={{ paddingTop: 24, textAlign: "center" }}>
                          <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
                            Need help? Email us at{" "}
                            <span style={{ color: "rgba(200,135,58,0.7)" }}>support@reu.ng</span>
                          </p>
                          <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "underline" }}>
                            Unsubscribe from marketing emails
                          </p>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.12)", fontSize: 11 }}>
                            &copy; {new Date().getFullYear()} REU.ng. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

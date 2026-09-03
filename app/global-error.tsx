"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: only fires when the ROOT layout itself throws
 * (error.jsx can't catch that, since it renders inside the layout). Next.js
 * requires this file to render its own <html>/<body> since it replaces the
 * layout entirely — so no Tailwind classes, fonts, or app components here,
 * just inline styles, to keep it working even if the rest of the app is
 * broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D1F1A",
          color: "#ededed",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "rgba(237,237,237,0.6)", marginBottom: 24 }}>
            The app hit an unexpected error and couldn&apos;t load. Please try
            again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              color: "#0D1F1A",
              background: "linear-gradient(135deg, #C8873A, #E8A850)",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
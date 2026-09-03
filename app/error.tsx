"use client";

import { useEffect } from "react";
import Link from "next/link";
import Button from "./components/Button";

/**
 * Catches unhandled errors thrown while rendering any route under this
 * segment (i.e. everywhere except the root layout itself — see
 * global-error.jsx for that). Next.js renders this automatically in place
 * of the crashed subtree; it does NOT catch errors in event handlers,
 * async code outside render, or server components rendered above it.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: wire up to an error-reporting service (Sentry, etc.) once one
    // is added. For now, at least keep it visible in the console with the
    // digest so a server-side error can be cross-referenced in logs.
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-8 h-8 text-red-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-white/50 text-sm mb-8">
          An unexpected error occurred while loading this page. You can try
          again, or head back to the dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/dashboard">
            <Button variant="primary">Back to dashboard</Button>
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && (
          <pre className="mt-8 text-left text-xs text-red-300/80 bg-red-500/5 border border-red-500/20 rounded-lg p-4 overflow-auto max-h-48">
            {error?.message}
            {error?.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
        )}
      </div>
    </div>
  );
}
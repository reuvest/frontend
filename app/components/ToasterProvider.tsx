"use client";
import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{ top: 72, right: 16, zIndex: 99999 }}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#0f2018",
          color: "rgba(255,255,255,0.85)",
          fontSize: "13px",
          fontWeight: "500",
          fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
          padding: "12px 16px",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          maxWidth: "340px",
          lineHeight: "1.4",
        },
        success: {
          duration: 4000,
          style: {
            background: "#0a1f14",
            color: "#6ee7b7",
            border: "1px solid rgba(110,231,183,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(110,231,183,0.08)",
          },
          iconTheme: { primary: "#6ee7b7", secondary: "#0a1f14" },
        },
        error: {
          duration: 5000,
          style: {
            background: "#1a0a0a",
            color: "#fca5a5",
            border: "1px solid rgba(252,165,165,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(252,165,165,0.08)",
          },
          iconTheme: { primary: "#fca5a5", secondary: "#1a0a0a" },
        },
        loading: {
          style: {
            background: "#0f2018",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.08)",
          },
          iconTheme: { primary: "rgba(255,255,255,0.5)", secondary: "#0f2018" },
        },
      }}
    />
  );
}
// app/layout.tsx
import type { ReactNode } from "react";
import { DM_Sans, Playfair_Display, Great_Vibes } from "next/font/google";
import ToasterProvider from "./components/ToasterProvider";
import ConditionalHeader from "./components/ConditionalHeader";
import ConditionalFooter from "./components/ConditionalFooter";
import { AuthProvider } from "../context/AuthContext";
import QueryProvider from "./providers/QueryProvider";
import "./globals.css";
import WhatsAppButton from "./components/WhatsAppButton";
import SupportWidget from "./components/SupportWidget";
import ConfirmDialog from "./components/ConfirmDialog";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfairDisplay.variable} ${greatVibes.variable}`}
    >
      <body>
        <QueryProvider>
          <AuthProvider>
            <ConditionalHeader />
            {children}
            <WhatsAppButton />
            <SupportWidget />
            <ConditionalFooter />
            <ToasterProvider />
            <ConfirmDialog />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

// app/layout.jsx
import { DM_Sans, Playfair_Display, Great_Vibes } from "next/font/google";
import ToasterProvider from "./components/ToasterProvider";
import ConditionalHeader from "./components/ConditionalHeader";
import ConditionalFooter from "./components/ConditionalFooter";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";
import WhatsAppButton from "./components/WhatsAppButton";

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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfairDisplay.variable} ${greatVibes.variable}`}
    >
      <body>
        <AuthProvider>
          <ConditionalHeader />
          {children}
          <WhatsAppButton />
          <ConditionalFooter />
          <ToasterProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
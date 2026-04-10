import ToasterProvider from "./components/ToasterProvider";
import ConditionalHeader from "./components/ConditionalHeader";
import ConditionalFooter from "./components/ConditionalFooter";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";
import WhatsAppButton from "./components/WhatsAppButton";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <div className="relative min-h-screen flex flex-col max-w-screen-2xl mx-auto">
            <ConditionalHeader />

            {/* Page content — grows to fill remaining height */}
            <main className="flex-1">
              {children}
            </main>
            <WhatsAppButton />

            <ConditionalFooter />
            <ToasterProvider />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
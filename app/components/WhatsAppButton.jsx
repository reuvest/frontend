"use client";
import Link from "next/link";

const WHATSAPP_NUMBER = "2348081325657";
const WHATSAPP_MESSAGE = "Hi, I need help with my account.";

export default function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`;

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{ background: "#25D366" }}
    >
      <img
        src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg"
        alt="WhatsApp"
        width={28}
        height={28}
        style={{ filter: "invert(1)" }}
      />
    </Link>
  );
}
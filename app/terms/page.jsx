import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

const appname = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";
const appurl  = process.env.NEXT_PUBLIC_APP_URL  || "api.reu.ng";
const email   = `legal@${appname.toLowerCase()}`;

export const metadata = {
  title: `Terms of Service | ${appname}`,
  description: `Read ${appname}'s Terms of Service governing your use of our land investment platform in Nigeria.`,
  alternates: { canonical: `${appurl}/terms` },
  robots: { index: false, follow: true },
  openGraph: {
    title: `Terms of Service | ${appname}`,
    description: `Terms and conditions governing use of the ${appname} land investment platform.`,
    url: `${appurl}/terms`,
    siteName: appname,
  },
};

const LAST_UPDATED = "February 10, 2026";

function getSections(appname, email) {
  return [
    {
      number: "1",
      title: "Introduction",
      content: (
        <p>
          Welcome to {appname}. By accessing or using our platform, you agree to be bound by these Terms of Service.
          Please read them carefully. If you do not agree to these terms, you may not use our services.
        </p>
      ),
    },
    {
      number: "2",
      title: "Account Registration",
      content: (
        <>
          <p className="mb-4">To use certain features of {appname}, you must register for an account. You agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and account</li>
            <li>Accept responsibility for all activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
        </>
      ),
    },
    {
      number: "3",
      title: "Investment Disclaimer",
      content: (
        <p>
          Land investments carry inherent risks. {appname} does not guarantee any returns on investment.
          All investment decisions are made at your own risk. We recommend consulting with a financial advisor
          before making any investment decisions. Past performance is not indicative of future results.
        </p>
      ),
    },
    {
      number: "4",
      title: "User Conduct",
      content: (
        <>
          <p className="mb-4">You agree not to:</p>
          <ul>
            <li>Use the platform for any illegal or unauthorized purpose</li>
            <li>Violate any laws in your jurisdiction</li>
            <li>Infringe upon the rights of others</li>
            <li>Transmit any malicious code or viruses</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the platform's functionality</li>
          </ul>
        </>
      ),
    },
    {
      number: "5",
      title: "Payments and Refunds",
      content: (
        <p>
          All payments are processed securely through our payment partners. Refund policies vary by transaction type
          and are subject to verification. Investment purchases are generally non-refundable except in cases of fraud
          or platform error. Please review specific refund terms before making any purchase.
        </p>
      ),
    },
    {
      number: "6",
      title: "Intellectual Property",
      content: (
        <p>
          All content on {appname}, including text, graphics, logos, images, and software, is the property of{" "}
          {appname} or its licensors and is protected by copyright, trademark, and other intellectual property laws.
          You may not reproduce, distribute, or create derivative works without our express written permission.
        </p>
      ),
    },
    {
      number: "7",
      title: "Limitation of Liability",
      content: (
        <p>
          {appname} is provided "as is" without warranties of any kind. We shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages resulting from your use of or inability to use
          the platform. Our total liability shall not exceed the amount you paid to us in the twelve months
          preceding the claim.
        </p>
      ),
    },
    {
      number: "8",
      title: "Termination",
      content: (
        <p>
          We reserve the right to suspend or terminate your account at any time for violation of these Terms of
          Service. You may also terminate your account at any time by contacting our support team. Upon termination,
          your right to use the platform will immediately cease.
        </p>
      ),
    },
    {
      number: "9",
      title: "Changes to Terms",
      content: (
        <p>
          We may modify these Terms of Service at any time. We will notify you of significant changes via email or
          through the platform. Your continued use of {appname} after such modifications constitutes your acceptance
          of the updated terms.
        </p>
      ),
    },
    {
      number: "10",
      title: "Contact Us",
      content: (
        <>
          <p className="mb-4">If you have any questions about these Terms of Service, please contact us at:</p>
          <div className="not-prose bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-[#3D4D43] text-sm leading-relaxed">
              <strong className="text-[#0D1F1A]">Email:</strong> {email}<br />
              <strong className="text-[#0D1F1A]">Address:</strong> Ibadan, Oyo State, Nigeria
            </p>
          </div>
        </>
      ),
    },
  ];
}

export default function TermsOfService() {
  const sections = getSections(appname, email);

  return (
    <div className="min-h-screen bg-[#FDFAF5]" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Top bar */}
      <div className="bg-[#0D1F1A] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft size={15} /> Back to {appname}
        </Link>
        <span className="text-white/30 text-xs hidden sm:block">Updated {LAST_UPDATED}</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
        {/* Header */}
        <header className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
              <FileText className="text-amber-700" size={22} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-amber-700">Legal</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0D1F1A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Terms of Service
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[#5C6B63] text-sm">Last updated: {LAST_UPDATED}</span>
            <span className="hidden sm:block text-stone-300">·</span>
            <span className="text-[#5C6B63] text-sm">Applies to all {appname} users</span>
          </div>

          {/* Quick-nav on desktop */}
          <nav className="mt-8 p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hidden sm:block"
            aria-label="Table of contents">
            <p className="text-xs font-bold tracking-widest uppercase text-stone-400 mb-3">Sections</p>
            <div className="grid grid-cols-2 gap-1.5">
              {sections.map((s) => (
                <a key={s.number} href={`#section-${s.number}`}
                  className="text-sm text-[#5C6B63] hover:text-amber-700 transition-colors py-0.5">
                  {s.number}. {s.title}
                </a>
              ))}
            </div>
          </nav>
        </header>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.number} id={`section-${s.number}`}
              className="scroll-mt-8 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100 bg-stone-50">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "#C8873A" }}>
                  {s.number}
                </span>
                <h2 className="text-lg font-bold text-[#0D1F1A]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {s.title}
                </h2>
              </div>
              <div className="px-6 py-6 text-[#3D4D43] text-sm leading-relaxed
                [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_ul_li]:text-[#5C6B63]
                [&_p]:leading-relaxed">
                {s.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-14 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 font-semibold text-sm transition-colors">
            <ArrowLeft size={15} /> Back to Home
          </Link>
          <Link href="/privacy" className="text-sm text-[#5C6B63] hover:text-[#0D1F1A] transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
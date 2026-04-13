import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

const appname      = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";
const appurl       = process.env.NEXT_PUBLIC_APP_URL  || "api.reu.ng";
const privacyEmail = `privacy@${appname.toLowerCase()}`;

export const metadata = {
  title: `Privacy Policy | ${appname}`,
  description: `Learn how ${appname} collects, uses, and protects your personal information when you use our land investment platform.`,
  alternates: { canonical: `${appurl}/privacy` },
  robots: { index: false, follow: true },
  openGraph: {
    title: `Privacy Policy | ${appname}`,
    description: `How ${appname} handles and protects your personal data.`,
    url: `${appurl}/privacy`,
    siteName: appname,
  },
};

const LAST_UPDATED = "February 10, 2026";

function getSections(appname, privacyEmail) {
  return [
    {
      number: "1",
      title: "Introduction",
      content: (
        <p>
          At {appname}, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose,
          and safeguard your information when you use our platform. Please read this policy carefully. If you do not
          agree with the terms, please do not access the platform.
        </p>
      ),
    },
    {
      number: "2",
      title: "Information We Collect",
      content: (
        <>
          <h3>2.1 Personal Information</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Name and contact information (email address, phone number)</li>
            <li>Account credentials (username, password)</li>
            <li>Payment information (processed securely through third-party providers)</li>
            <li>Investment preferences and portfolio data</li>
            <li>Communication history with our support team</li>
          </ul>
          <h3>2.2 Automatically Collected Information</h3>
          <p>When you access our platform, we automatically collect:</p>
          <ul>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, time spent, click patterns)</li>
            <li>Location data (with your permission)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </>
      ),
    },
    {
      number: "3",
      title: "How We Use Your Information",
      content: (
        <>
          <p>We use the collected information for various purposes:</p>
          <ul>
            <li>To provide, maintain, and improve our services</li>
            <li>To process your transactions and manage your investments</li>
            <li>To send you updates, newsletters, and marketing communications</li>
            <li>To respond to your inquiries and provide customer support</li>
            <li>To detect, prevent, and address technical issues or fraud</li>
            <li>To comply with legal obligations and enforce our terms</li>
            <li>To personalize your experience and provide relevant content</li>
          </ul>
        </>
      ),
    },
    {
      number: "4",
      title: "Information Sharing and Disclosure",
      content: (
        <>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
          </ul>
          <p className="mt-4 font-medium text-[#0D1F1A]">We do not sell your personal information to third parties.</p>
        </>
      ),
    },
    {
      number: "5",
      title: "Data Security",
      content: (
        <p>
          We implement appropriate technical and organizational measures to protect your personal information against
          unauthorized access, alteration, disclosure, or destruction. These measures include encryption, secure
          servers, and regular security audits. However, no method of transmission over the Internet is 100% secure,
          and we cannot guarantee absolute security.
        </p>
      ),
    },
    {
      number: "6",
      title: "Your Privacy Rights",
      content: (
        <>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Restriction:</strong> Request restriction of processing</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us at{" "}
            <a href={`mailto:${privacyEmail}`} className="text-amber-700 hover:underline">{privacyEmail}</a>.
          </p>
        </>
      ),
    },
    {
      number: "7",
      title: "Cookies and Tracking",
      content: (
        <p>
          We use cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver
          personalized content. You can control cookies through your browser settings, but disabling them may affect
          certain features of our platform.
        </p>
      ),
    },
    {
      number: "8",
      title: "Children's Privacy",
      content: (
        <p>
          Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal
          information from children. If you believe we have inadvertently collected information from a child,
          please contact us immediately.
        </p>
      ),
    },
    {
      number: "9",
      title: "International Data Transfers",
      content: (
        <p>
          Your information may be transferred to and maintained on servers located outside your country. By using{" "}
          {appname}, you consent to such transfers. We ensure appropriate safeguards are in place to protect your
          data in accordance with this Privacy Policy.
        </p>
      ),
    },
    {
      number: "10",
      title: "Changes to This Policy",
      content: (
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
          new policy on this page and updating the "Last updated" date. We encourage you to review this policy
          periodically.
        </p>
      ),
    },
    {
      number: "11",
      title: "Contact Us",
      content: (
        <>
          <p className="mb-4">If you have questions or concerns about this Privacy Policy, please contact us at:</p>
          <div className="not-prose bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <p className="text-[#3D4D43] text-sm leading-relaxed">
              <strong className="text-[#0D1F1A]">Email:</strong> {privacyEmail}<br />
              <strong className="text-[#0D1F1A]">Address:</strong> Ibadan, Oyo State, Nigeria<br />
              <strong className="text-[#0D1F1A]">Phone:</strong> +234 800 000 0000
            </p>
          </div>
        </>
      ),
    },
  ];
}

export default function PrivacyPolicy() {
  const sections = getSections(appname, privacyEmail);

  return (
    <div className="min-h-screen bg-[#FDFAF5]" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Top bar */}
      <div className="bg-[#0D1F1A] px-6 py-4 flex items-center justify-between">
        <Link href="/"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft size={15} /> Back to {appname}
        </Link>
        <span className="text-white/30 text-xs hidden sm:block">Updated {LAST_UPDATED}</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
        {/* Header */}
        <header className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <Shield className="text-emerald-700" size={22} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-emerald-700">Legal</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0D1F1A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Privacy Policy
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[#5C6B63] text-sm">Last updated: {LAST_UPDATED}</span>
            <span className="hidden sm:block text-stone-300">·</span>
            <span className="text-[#5C6B63] text-sm">Applies to all {appname} users</span>
          </div>

          {/* Key commitment callout */}
          <div className="mt-8 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <Shield size={18} className="text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-sm text-emerald-800 leading-relaxed">
              <strong>Our commitment:</strong> We never sell your personal information to third parties.
              Your data is used solely to provide and improve our services.
            </p>
          </div>

          {/* Quick-nav */}
          <nav className="mt-6 p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hidden sm:block"
            aria-label="Table of contents">
            <p className="text-xs font-bold tracking-widest uppercase text-stone-400 mb-3">Sections</p>
            <div className="grid grid-cols-2 gap-1.5">
              {sections.map((s) => (
                <a key={s.number} href={`#section-${s.number}`}
                  className="text-sm text-[#5C6B63] hover:text-emerald-700 transition-colors py-0.5">
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
                  style={{ background: "#2D7A55" }}>
                  {s.number}
                </span>
                <h2 className="text-lg font-bold text-[#0D1F1A]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {s.title}
                </h2>
              </div>
              <div className="px-6 py-6 text-[#3D4D43] text-sm leading-relaxed
                [&_h3]:font-bold [&_h3]:text-[#0D1F1A] [&_h3]:mt-5 [&_h3]:mb-3 [&_h3]:text-base [&_h3]:first:mt-0
                [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_ul_li]:text-[#5C6B63]
                [&_p]:leading-relaxed [&_p+p]:mt-3
                [&_strong]:font-semibold [&_strong]:text-[#0D1F1A]">
                {s.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-14 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/"
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold text-sm transition-colors">
            <ArrowLeft size={15} /> Back to Home
          </Link>
          <Link href="/terms" className="text-sm text-[#5C6B63] hover:text-[#0D1F1A] transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
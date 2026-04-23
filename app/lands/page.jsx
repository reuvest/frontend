const appname = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";
const appurl  = process.env.NEXT_PUBLIC_APP_URL  || "https://reu.ng";

export const metadata = {
  metadataBase: new URL(appurl),
  title: `Browse Verified Land for Investment in Nigeria | ${appname}`,
  description:
    `Explore fractional land investment opportunities across Nigeria. ` +
    `Verified titles, from ₦5,000 per unit. View our property marketplace on ${appname}.`,
  keywords: [
    "buy land Nigeria fractional",
    "verified land investment Nigeria",
    "land marketplace Nigeria",
    "fractional land across growth corridors Nigeria",
    "land investment from 5000 naira",
    appname,
  ],
  openGraph: {
    title: `Land Investment Marketplace — ${appname}`,
    description: `Browse verified fractional land plots across Nigeria. Invest from ₦5,000.`,
    url: `${appurl}/lands`,
    siteName: appname,
    images: [{ url: `${appurl}/og-lands.png`, width: 1200, height: 630 }],
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: `Land Investment Marketplace — ${appname}`,
    description: `Browse verified fractional land across Nigeria from ₦5,000.`,
    images: [`${appurl}/og-lands.png`],
  },
  alternates: { canonical: `${appurl}/lands` },
  robots: { index: true, follow: true },
};

// JSON-LD for the listing page
function JsonLd({ appname, appurl }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Land Investment Marketplace — ${appname}`,
    url: `${appurl}/lands`,
    description: "Browse verified fractional land investment opportunities across Nigeria.",
    provider: {
      "@type": "FinancialService",
      name: appname,
      url: appurl,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function LandsPage() {
  return (
    <>
      <JsonLd appname={appname} appurl={appurl} />
      <LandList />   
    </>
  );
}
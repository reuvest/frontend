import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

const appname = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";
const appurl  = process.env.NEXT_PUBLIC_APP_URL  || "api.reu.ng";
const email   = "legal@reu.ng";

export const metadata = {
  title: `Terms of Service | ${appname}`,
  description: `Read ${appname}'s Terms and Conditions governing your use of our land investment platform in Nigeria.`,
  alternates: { canonical: `${appurl}/terms` },
  robots: { index: false, follow: true },
  openGraph: {
    title: `Terms and Conditions | ${appname}`,
    description: `Terms and conditions governing use of the ${appname} land investment platform.`,
    url: `${appurl}/terms`,
    siteName: appname,
  },
};

const EFFECTIVE_DATE = "4 June 2026";

const SUMMARY_ROWS = [
  { topic: "What REU.ng does", meaning: "Enables fractional real estate investment, trading, and land conversion in Nigeria." },
  { topic: "Who can use it", meaning: "Nigerian residents and eligible non-residents aged 18+ who pass KYC verification." },
  { topic: "Your units", meaning: "Represent a beneficial interest in a property project — not immediate physical land." },
  { topic: "Converting to land", meaning: "You may convert units to physical land (min. 300 sqm) when all conditions are met." },
  { topic: "Trading", meaning: "You may buy/sell units on the marketplace. Like all asset markets, buyer availability varies — plan to hold units for the medium to long term." },
  { topic: "Withdrawals", meaning: "Requests processed within 5–10 business days, subject to verification and fees." },
  { topic: "Fees", meaning: "Disclosed on the Platform before each transaction. We reserve the right to revise fees with notice." },
  { topic: "Your data", meaning: "Collected under the Nigeria Data Protection Act 2023. See our Privacy Policy." },
  { topic: "Disputes", meaning: "Mediation first, then arbitration in Ibadan under the Arbitration and Mediation Act." },
  { topic: "Liability cap", meaning: "Our liability is capped at fees you paid us in the prior 12 months." },
  { topic: "Amending Terms", meaning: "We will give 14 days' notice before material changes take effect." },
];

function Warning({ children }) {
  return (
    <div className="not-prose my-4 bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3">
      <span className="text-amber-600 text-base shrink-0">⚠</span>
      <p className="text-sm text-[#3D4D43] leading-relaxed">{children}</p>
    </div>
  );
}

function getSections(appname, email) {
  return [
    {
      number: "Summary",
      title: "Plain-Language Summary",
      content: (
        <>
          <p className="mb-4 text-xs text-[#5C6B63] italic">
            This summary is provided for your convenience. It does not replace the full Terms below, which are legally binding. Please read the complete document carefully.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left px-4 py-2 border border-stone-200 font-bold text-[#0D1F1A] w-1/3">Topic</th>
                  <th className="text-left px-4 py-2 border border-stone-200 font-bold text-[#0D1F1A]">What It Means</th>
                </tr>
              </thead>
              <tbody>
                {SUMMARY_ROWS.map((row) => (
                  <tr key={row.topic} className="even:bg-stone-50/50">
                    <td className="px-4 py-2 border border-stone-200 font-semibold text-[#0D1F1A] align-top">{row.topic}</td>
                    <td className="px-4 py-2 border border-stone-200 text-[#5C6B63] align-top">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      number: "1",
      title: "About REU.ng",
      content: (
        <>
          <p className="mb-4">
            REU.ng is a digital platform operated by SproutVest GSE Ltd. that enables users to participate in real estate opportunities through the acquisition, holding, transfer, trading, and conversion of fractional real estate units.
          </p>
          <p className="mb-3">The Platform may facilitate:</p>
          <ul>
            <li>Fractional real estate ownership opportunities;</li>
            <li>Real estate investment opportunities;</li>
            <li>Marketplace trading of eligible units;</li>
            <li>Property management services;</li>
            <li>Property acquisition and development projects;</li>
            <li>Conversion of qualifying units into physical land allocations.</li>
          </ul>
          <Warning>
            Nigerian real estate has historically been one of the most resilient asset classes. Like all investments, however, returns are not guaranteed and performance can vary by project and market conditions. Please read Section 9 carefully before investing.
          </Warning>
        </>
      ),
    },
    {
      number: "2",
      title: "Eligibility",
      content: (
        <>
          <p className="mb-3">To use the Platform, you must:</p>
          <ul>
            <li>Be at least eighteen (18) years old;</li>
            <li>Have legal capacity to enter binding agreements under Nigerian law;</li>
            <li>Provide accurate registration information;</li>
            <li>Successfully complete all KYC/AML verification requirements;</li>
            <li>Not be subject to any sanctions list maintained by Nigeria, the UN, or any other applicable authority;</li>
            <li>Not be a Politically Exposed Person (PEP) unless specifically approved by the Company following enhanced due diligence.</li>
          </ul>
          <p className="mt-4">
            Non-Nigerian residents may access the Platform subject to applicable cross-border investment laws. It is your responsibility to ensure that your use of the Platform complies with the laws of your country of residence.
          </p>
          <p className="mt-3">
            The Company reserves the right to reject or terminate any account at its discretion, including where eligibility requirements are not met or can no longer be verified.
          </p>
        </>
      ),
    },
    {
      number: "3",
      title: "Account Registration",
      content: (
        <>
          <p className="mb-3">Users shall:</p>
          <ul>
            <li>Provide accurate, complete, and current information at registration and at all times thereafter;</li>
            <li>Maintain strict confidentiality of account credentials, including passwords and PINs;</li>
            <li>Notify the Company immediately via {email} of any suspected unauthorized access or security breach;</li>
            <li>Ensure that only one account is registered per individual or legal entity.</li>
          </ul>
          <p className="mt-4">
            The Company shall not be liable for losses arising from unauthorized account access resulting from your negligence or failure to comply with these security obligations.
          </p>
          <p className="mt-3">
            Accounts registered on behalf of a corporate entity must be authorized by a duly appointed representative, and supporting corporate documentation may be required.
          </p>
        </>
      ),
    },
    {
      number: "4",
      title: "Know Your Customer (KYC) and Anti-Money Laundering (AML)",
      content: (
        <>
          <p className="mb-4">
            All users must complete identity and source-of-funds verification before transacting on the Platform. This is a legal requirement under the Money Laundering (Prevention and Prohibition) Act 2022 and related regulations.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">4.1 Identity Documents</h3>
          <p className="mb-2">The Company may request any of the following:</p>
          <ul className="mb-5">
            <li>National Identification Number (NIN);</li>
            <li>International Passport;</li>
            <li>Driver's Licence;</li>
            <li>Voter's Card;</li>
            <li>Bank Verification Number (BVN);</li>
            <li>Utility Bills (not older than 3 months) as proof of address;</li>
            <li>Selfie/liveness verification.</li>
          </ul>

          <h3 className="font-bold text-[#0D1F1A] mb-2">4.2 Source of Funds</h3>
          <p className="mb-2">For transactions above prescribed thresholds, the Company may request:</p>
          <ul className="mb-5">
            <li>Proof of employment or business income;</li>
            <li>Bank statements;</li>
            <li>Any other documentation needed to verify the legitimate source of invested funds.</li>
          </ul>

          <h3 className="font-bold text-[#0D1F1A] mb-2">4.3 Ongoing Monitoring</h3>
          <p className="mb-5">
            The Company is required to conduct ongoing monitoring of transactions and may suspend or terminate accounts where suspicious activity is identified, consistent with its AML obligations and reporting duties to the Nigerian Financial Intelligence Unit (NFIU).
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">4.4 Consequences of Non-Compliance</h3>
          <p>
            Failure to provide requested information may result in account restrictions, suspension, reversal of transactions, or termination. The Company may also be required by law to report non-compliant accounts to regulatory authorities.
          </p>
        </>
      ),
    },
    {
      number: "5",
      title: "Fractional Units",
      content: (
        <>
          <h3 className="font-bold text-[#0D1F1A] mb-2">5.1 Nature of Units</h3>
          <p className="mb-3">
            Fractional units represent a beneficial participation interest in a specific real estate asset or project. Units are digital records maintained on the Platform and are linked to defined property projects.
          </p>
          <Warning>
            Owning fractional units does not give you immediate possession of physical land. Think of units as your stake in a property project — physical land rights are formalised through the conversion process described in Section 6.
          </Warning>

          <h3 className="font-bold text-[#0D1F1A] mb-2 mt-4">5.2 Legal Classification</h3>
          <p className="mb-4">
            The Company shall maintain appropriate regulatory status in respect of the units offered on its Platform. Users are advised to seek independent legal or financial advice regarding the nature of units and any applicable securities laws. The Company will disclose its regulatory standing on the Platform as required by applicable Nigerian law, including guidance from the Securities and Exchange Commission (SEC).
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">5.3 Project-Specific Terms</h3>
          <p>
            Each property project may be subject to additional project-specific terms. Where project-specific terms conflict with these general Terms, the project-specific terms shall prevail to the extent of the inconsistency.
          </p>
        </>
      ),
    },
    {
      number: "6",
      title: "Conversion to Physical Land Ownership",
      content: (
        <>
          <h3 className="font-bold text-[#0D1F1A] mb-2">6.1 Eligibility for Conversion</h3>
          <p className="mb-4">
            Where a User accumulates units equivalent to the minimum threshold prescribed for a specific property project, the User may apply for conversion of those units into physical land ownership. For most projects, the minimum conversion threshold is equivalent to Three Hundred Square Metres (300 sqm), unless otherwise stated in the applicable project terms.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">6.2 Conversion Conditions</h3>
          <p className="mb-2">Conversion is subject to:</p>
          <ul className="mb-4">
            <li>Availability of unallocated land within the applicable project;</li>
            <li>Approved and registered survey and layout plans;</li>
            <li>Compliance with applicable planning, zoning, and development regulations;</li>
            <li>Completion of all applicable payments, survey fees, documentation fees, and legal processing fees;</li>
            <li>Satisfactory KYC/AML status at the time of conversion request;</li>
            <li>Execution of a formal land allocation agreement.</li>
          </ul>

          <h3 className="font-bold text-[#0D1F1A] mb-2">6.3 Process and Timelines</h3>
          <p className="mb-4">
            Upon receipt of a valid conversion application, the Company shall endeavour to process the allocation within ninety (90) business days, subject to the conditions above. The Company shall keep the User reasonably informed of progress.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">6.4 What Happens if Land is Unavailable</h3>
          <p className="mb-2">
            If land is not available in a specific project within twelve (12) months of a valid conversion application being submitted, the User may elect to:
          </p>
          <ul className="mb-3">
            <li>Retain their units pending future land availability;</li>
            <li>Request reallocation to an alternative eligible project where the Company has available land; or</li>
            <li>Request a refund of the value of the units calculated at the original acquisition price, subject to deduction of applicable fees.</li>
          </ul>
          <p className="mb-4">The Company shall notify affected Users of unavailability within thirty (30) days of becoming aware.</p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">6.5 Post-Conversion</h3>
          <p>
            Upon successful conversion and physical allocation, the corresponding units shall be permanently removed from the User's account and shall no longer be available for trading. The Company reserves the right to determine the specific location of allocated plots within the applicable project, subject to reasonable consultation with the User.
          </p>
        </>
      ),
    },
    {
      number: "7",
      title: "Marketplace Trading",
      content: (
        <>
          <p className="mb-4">
            The Platform may permit users to buy, sell, transfer, or trade eligible units on an internal marketplace. Trades are executed on a willing-buyer, willing-seller basis facilitated by the Platform.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">7.1 No Guarantees</h3>
          <p className="mb-2">
            The marketplace operates on a willing-buyer, willing-seller basis. While trading activity on the Platform continues to grow, the Company cannot control timing or volume, and therefore cannot represent:
          </p>
          <ul className="mb-4">
            <li>That buyers or sellers will be available at any given time;</li>
            <li>That any trade will execute within a specific timeframe;</li>
            <li>Immediate exit or liquidity on demand;</li>
            <li>A specific future price or demand level for any unit.</li>
          </ul>

          <h3 className="font-bold text-[#0D1F1A] mb-2">7.2 Marketplace Conduct</h3>
          <p className="mb-4">
            Users must not engage in market manipulation, collusion, wash trading, or any other conduct designed to artificially affect the price or volume of units. Violations may result in immediate account suspension and referral to law enforcement.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">7.3 Suspension of Trading</h3>
          <p>
            The Company may suspend or restrict trading activities where necessary for operational, regulatory, compliance, or security reasons. Users will be notified of material suspensions as soon as practicable.
          </p>
        </>
      ),
    },
    {
      number: "8",
      title: "Withdrawals",
      content: (
        <>
          <h3 className="font-bold text-[#0D1F1A] mb-2">8.1 Withdrawal of Funds</h3>
          <p className="mb-4">
            Users may request withdrawal of available cash balances from their Platform wallet to a verified Nigerian bank account in their own name. The Company does not process withdrawals to third-party accounts.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">8.2 Processing Time</h3>
          <p className="mb-2">Withdrawal requests will be processed within five (5) to ten (10) business days of submission, subject to:</p>
          <ul className="mb-4">
            <li>Successful identity re-verification where required;</li>
            <li>Absence of any pending fraud or compliance investigation;</li>
            <li>Completion of any applicable holding period for recently deposited funds.</li>
          </ul>

          <h3 className="font-bold text-[#0D1F1A] mb-2">8.3 Withdrawal Fees</h3>
          <p className="mb-4">
            Applicable withdrawal fees will be disclosed on the Platform prior to completion of the withdrawal request. The Company reserves the right to revise withdrawal fees with reasonable notice.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">8.4 Unit Liquidation</h3>
          <p>
            Withdrawal of value held in units (as opposed to cash wallet balances) depends on finding a willing buyer on the marketplace. Units in established projects have historically seen consistent trading activity; however, the ability to sell at a specific time or price cannot be assured, and REU.ng recommends treating unit investments as medium to long-term holdings.
          </p>
        </>
      ),
    },
    {
      number: "9",
      title: "Property Values and Investment Risks",
      content: (
        <>
          <p className="mb-4">
            Nigerian real estate has historically been one of the most resilient and wealth-building asset classes, consistently outperforming inflation over the long term. As with all investments, however, individual project performance can vary, and past results do not guarantee future outcomes. Users should invest with a long-term perspective.
          </p>
          <p className="mb-3">
            While the Company works to select high-quality projects and conduct thorough due diligence, it cannot represent the following outcomes for any specific project:
          </p>
          <ul className="mb-4">
            <li>A specific rate of capital appreciation for any project;</li>
            <li>Rental income or dividend distributions at any specific amount or frequency;</li>
            <li>Profit or a specific return on investment;</li>
            <li>Immediate liquidity or the ability to exit a position at any particular time;</li>
            <li>The future market value of any specific property or unit.</li>
          </ul>
          <p>
            Users are encouraged to take a long-term perspective on their real estate holdings and to invest amounts they are comfortable holding through normal market cycles. The Company strongly recommends seeking independent financial and legal advice before making significant investment commitments.
          </p>
        </>
      ),
    },
    {
      number: "10",
      title: "Fees and Charges",
      content: (
        <>
          <p className="mb-3">The Company may charge fees including but not limited to:</p>
          <ul className="mb-4">
            <li>Transaction fees (on acquisitions and trades);</li>
            <li>Administrative and account management fees;</li>
            <li>Listing fees (for sellers on the marketplace);</li>
            <li>Property management fees (where applicable);</li>
            <li>Documentation and title processing fees;</li>
            <li>Survey fees;</li>
            <li>Withdrawal fees;</li>
            <li>Conversion processing fees.</li>
          </ul>
          <p>
            All applicable fees shall be clearly disclosed on the Platform before each transaction is completed. Users should review the fee schedule before transacting. The Company reserves the right to revise its fee schedule from time to time, provided that changes to fees applicable to existing holdings will be communicated with at least fourteen (14) days' prior notice via email or in-platform notification.
          </p>
        </>
      ),
    },
    {
      number: "11",
      title: "Property Documentation and Title",
      content: (
        <>
          <p className="mb-4">
            The Company shall take reasonable steps to verify property ownership, title documentation, and regulatory status before listing any property on the Platform, including engaging qualified legal professionals and surveyors where appropriate.
          </p>
          <p className="mb-3">
            However, Users acknowledge that land ownership and title matters in Nigeria may involve factors beyond the Company's reasonable control, including:
          </p>
          <ul className="mb-4">
            <li>Government acquisition, revocation, or compulsory purchase;</li>
            <li>Pre-existing encumbrances or undisclosed third-party claims;</li>
            <li>Survey or boundary disputes;</li>
            <li>Delays or inconsistencies in the processes of land registries and government agencies.</li>
          </ul>
          <p>
            The Company shall maintain appropriate title insurance or risk mitigation measures where commercially feasible and shall promptly notify Users of any material adverse developments affecting listed properties. The Company shall not be liable for losses arising from title defects that were not reasonably discoverable through its due diligence process.
          </p>
        </>
      ),
    },
    {
      number: "12",
      title: "User Responsibilities and Prohibited Conduct",
      content: (
        <>
          <p className="mb-3">Users agree not to:</p>
          <ul className="mb-4">
            <li>Provide false, misleading, or fraudulent information at any time;</li>
            <li>Engage in money laundering, terrorist financing, or any other financial crime;</li>
            <li>Manipulate marketplace prices or conduct wash trading;</li>
            <li>Use the Platform for any unlawful purpose under Nigerian law or the laws of their jurisdiction;</li>
            <li>Interfere with or disrupt the Platform's operations, systems, or networks;</li>
            <li>Attempt unauthorized access to any systems, accounts, or data;</li>
            <li>Register multiple accounts to circumvent restrictions;</li>
            <li>Transfer account access or credentials to any third party;</li>
            <li>Engage in any conduct that brings the Company, its partners, or the Platform into disrepute.</li>
          </ul>
          <p>
            Violation of these Terms may result in immediate suspension or permanent termination of access, reversal of transactions, forfeiture of pending benefits, and/or referral to law enforcement authorities.
          </p>
        </>
      ),
    },
    {
      number: "13",
      title: "Data Privacy",
      content: (
        <>
          <p className="mb-4">
            The Company collects, stores, and processes personal information in accordance with the Nigeria Data Protection Act 2023 (NDPA) and any subsidiary regulations issued thereunder. The Company is registered with the Nigeria Data Protection Commission (NDPC) as required.
          </p>
          <p className="mb-4">
            By using the Platform, you consent to the collection, storage, processing, and (where applicable) cross-border transfer of your personal data as described in our Privacy Policy, which is incorporated into these Terms by reference and is available at https://reu.ng.
          </p>
          <p className="mb-3">Your rights under the NDPA include:</p>
          <ul className="mb-4">
            <li>The right to access your personal data;</li>
            <li>The right to rectification of inaccurate data;</li>
            <li>The right to deletion of your data (subject to our legal obligations);</li>
            <li>The right to object to certain processing activities;</li>
            <li>The right to data portability.</li>
          </ul>
          <p>To exercise any of these rights, or to lodge a complaint, contact our Data Protection Officer at {email}.</p>
        </>
      ),
    },
    {
      number: "14",
      title: "Intellectual Property",
      content: (
        <>
          <p className="mb-4">
            All Platform content and materials, including but not limited to logos, software, designs, trademarks, databases, text, graphics, and user interface elements, are the exclusive property of SproutVest GSE Ltd. and are protected by applicable intellectual property laws.
          </p>
          <p>
            No licence or rights are granted to Users except as expressly provided under these Terms. In particular, Users may not copy, reproduce, distribute, sell, modify, or create derivative works from any Platform content without prior written consent from the Company.
          </p>
        </>
      ),
    },
    {
      number: "15",
      title: "Suspension and Termination",
      content: (
        <>
          <h3 className="font-bold text-[#0D1F1A] mb-2">15.1 Grounds</h3>
          <p className="mb-2">The Company may suspend, restrict, or terminate any account where:</p>
          <ul className="mb-4">
            <li>These Terms are violated;</li>
            <li>Fraud, money laundering, or other financial crime is suspected;</li>
            <li>Regulatory concerns or legal obligations arise;</li>
            <li>Security risks are identified;</li>
            <li>False, misleading, or fraudulent information has been supplied;</li>
            <li>The user has been placed on a sanctions list.</li>
          </ul>

          <h3 className="font-bold text-[#0D1F1A] mb-2">15.2 Notice</h3>
          <p className="mb-4">
            Where practicable and legally permissible, the Company will provide reasonable notice before suspending or terminating an account, and will offer an opportunity for the User to respond. Where immediate action is required (e.g. to prevent fraud), suspension may take effect without prior notice.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">15.3 Effect of Termination</h3>
          <p className="mb-4">
            Termination shall not affect any obligations accrued prior to termination. Upon termination, any cash wallet balance held by the Company (after deduction of applicable fees and amounts owed) shall be returned to the User's verified bank account within thirty (30) business days, subject to completion of any outstanding compliance checks.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">15.4 Insolvency</h3>
          <p>
            In the event of insolvency, administration, or winding-up of SproutVest GSE Ltd., all User funds and unit interests shall be treated as client assets held separately from the Company's own assets, to the extent permitted by applicable Nigerian law. The Company maintains segregated accounts for client funds.
          </p>
        </>
      ),
    },
    {
      number: "16",
      title: "Cooling-Off Period",
      content: (
        <>
          <p className="mb-4">
            New users may cancel their account within forty-eight (48) hours of initial registration without any charges, provided that no transactions (including unit acquisitions or marketplace activity) have been completed during that period.
          </p>
          <p>
            To cancel within the cooling-off period, contact {email} with your account details. Any registration fees charged will be refunded within five (5) business days.
          </p>
        </>
      ),
    },
    {
      number: "17",
      title: "Disclaimer",
      content: (
        <>
          <p className="mb-3">
            The Platform and all services are provided on an "AS IS" and "AS AVAILABLE" basis. While the Company takes reasonable steps to maintain the Platform's availability and accuracy, it does not warrant that:
          </p>
          <ul className="mb-4">
            <li>The Platform will be uninterrupted, error-free, or free from viruses;</li>
            <li>Any information provided on the Platform is accurate, complete, or current;</li>
            <li>The Platform will be suitable for any particular purpose.</li>
          </ul>
          <p>
            Users are responsible for maintaining appropriate security measures on their own devices and accounts. The Company invests continuously in Platform security but cannot warrant against all external threats.
          </p>
        </>
      ),
    },
    {
      number: "18",
      title: "Limitation of Liability",
      content: (
        <>
          <p className="mb-3">
            To the maximum extent permitted by Nigerian law, SproutVest GSE Ltd., REU.ng, its directors, employees, agents, and partners shall not be liable for:
          </p>
          <ul className="mb-4">
            <li>Indirect or consequential losses;</li>
            <li>Loss of profits, revenue, or business opportunity;</li>
            <li>Loss arising from market movements, property devaluation, or investment performance;</li>
            <li>Loss arising from government actions, compulsory acquisition, or regulatory changes;</li>
            <li>Business interruption losses.</li>
          </ul>
          <p className="mb-3">
            The Company's total aggregate liability to any User shall not exceed the total fees actually paid by that User to the Company during the twelve (12) months immediately preceding the event giving rise to the claim.
          </p>
          <p>
            Nothing in these Terms shall limit the Company's liability for death or personal injury caused by its negligence, fraud, or any other liability that cannot be excluded under applicable Nigerian law.
          </p>
        </>
      ),
    },
    {
      number: "19",
      title: "Force Majeure",
      content: (
        <>
          <p className="mb-3">
            The Company shall not be liable for delays or failures in performance caused by events outside its reasonable control, including but not limited to:
          </p>
          <ul className="mb-4">
            <li>Government actions, legislative changes, or regulatory directives;</li>
            <li>Natural disasters, floods, earthquakes, or acts of God;</li>
            <li>Pandemic, epidemic, or public health emergency;</li>
            <li>Civil unrest, war, or terrorism;</li>
            <li>Internet infrastructure failures or cyberattacks;</li>
            <li>Power outages or critical infrastructure failures.</li>
          </ul>
          <p>
            The Company will use reasonable efforts to mitigate the impact of any force majeure event and will notify Users as soon as practicable. If a force majeure event continues for more than ninety (90) days and materially prevents Users from accessing their funds or exercising their rights, Users may request withdrawal of available balances in accordance with Section 8.
          </p>
        </>
      ),
    },
    {
      number: "20",
      title: "Amendment of Terms",
      content: (
        <>
          <p className="mb-3">
            The Company may amend these Terms from time to time. For material changes — including changes to fees applicable to existing holdings, dispute resolution procedures, or User rights — the Company will:
          </p>
          <ul className="mb-4">
            <li>Provide at least fourteen (14) days' prior written notice by email and/or in-platform notification;</li>
            <li>Clearly identify the changes and the reasons for them;</li>
            <li>Provide a copy of the updated Terms.</li>
          </ul>
          <p className="mb-3">
            For non-material changes (e.g. typographical corrections, clarifications that do not alter User rights), the updated Terms shall take effect upon publication on the Platform.
          </p>
          <p>
            Continued use of the Platform after the effective date of any amendment constitutes your acceptance of the revised Terms. If you do not accept material changes, you should cease using the Platform and request closure of your account before the effective date.
          </p>
        </>
      ),
    },
    {
      number: "21",
      title: "Governing Law",
      content: (
        <>
          <p className="mb-3">
            These Terms shall be governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria, including but not limited to:
          </p>
          <ul>
            <li>The Companies and Allied Matters Act (CAMA) 2020;</li>
            <li>The Investment and Securities Act (ISA);</li>
            <li>The Money Laundering (Prevention and Prohibition) Act 2022;</li>
            <li>The Nigeria Data Protection Act 2023;</li>
            <li>The Arbitration and Mediation Act 2023;</li>
            <li>Applicable SEC Nigeria regulations and guidelines.</li>
          </ul>
        </>
      ),
    },
    {
      number: "22",
      title: "Dispute Resolution",
      content: (
        <>
          <h3 className="font-bold text-[#0D1F1A] mb-2">22.1 Amicable Resolution</h3>
          <p className="mb-4">
            In the event of a dispute, either party shall first attempt to resolve the matter amicably by notifying the other in writing (email to {email} for disputes directed to the Company) and allowing a period of twenty-one (21) days for good-faith resolution discussions.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">22.2 Mediation</h3>
          <p className="mb-4">
            Where amicable resolution fails, either party may refer the dispute to mediation under the auspices of a mutually agreed accredited mediator or mediation centre in Nigeria. The costs of mediation shall be shared equally unless otherwise agreed.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">22.3 Arbitration</h3>
          <p className="mb-4">
            If mediation is unsuccessful within forty-five (45) days of referral, the dispute shall be finally resolved by binding arbitration in Ibadan, Oyo State, Nigeria, in accordance with the Arbitration and Mediation Act 2023. The arbitral tribunal shall consist of one (1) arbitrator appointed by agreement of the parties, or in default of agreement, by the Chairman of the Chartered Institute of Arbitrators (Nigeria Branch). The language of arbitration shall be English.
          </p>
          <p className="mb-4">
            The decision of the arbitrator shall be final and binding on both parties, and may be enforced in any court of competent jurisdiction.
          </p>

          <h3 className="font-bold text-[#0D1F1A] mb-2">22.4 Emergency Relief</h3>
          <p>
            Nothing in this Section prevents either party from seeking urgent interim or injunctive relief from a court of competent jurisdiction where necessary to preserve rights or prevent irreparable harm pending arbitration.
          </p>
        </>
      ),
    },
    {
      number: "23",
      title: "Severability",
      content: (
        <p>
          If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction or arbitral tribunal, that provision shall be severed from the remainder of the Terms, which shall continue in full force and effect. The parties agree to replace any severed provision with a valid provision that most closely reflects the intent of the original.
        </p>
      ),
    },
    {
      number: "24",
      title: "Entire Agreement",
      content: (
        <p>
          These Terms, together with the Privacy Policy, any project-specific terms, and any other policies published on the Platform, constitute the entire agreement between you and the Company in relation to your use of the Platform and supersede all prior representations, discussions, or agreements, whether oral or written.
        </p>
      ),
    },
    {
      number: "25",
      title: "Contact Information",
      content: (
        <>
          <p className="mb-4">For questions, complaints, or requests relating to these Terms:</p>
          <div className="not-prose bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
            <p className="text-[#3D4D43] text-sm">
              <strong className="text-[#0D1F1A]">Company:</strong> SproutVest GSE Ltd. (operating as REU.ng)
            </p>
            <p className="text-[#3D4D43] text-sm">
              <strong className="text-[#0D1F1A]">Email:</strong> {email}
            </p>
            <p className="text-[#3D4D43] text-sm">
              <strong className="text-[#0D1F1A]">Website:</strong> https://reu.ng
            </p>
            <p className="text-[#3D4D43] text-sm">
              <strong className="text-[#0D1F1A]">Address:</strong> Ibadan, Oyo State, Nigeria
            </p>
          </div>
          <p className="mt-4 text-sm text-[#5C6B63]">For data protection enquiries, contact: {email}</p>
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
        <span className="text-white/30 text-xs hidden sm:block">Effective {EFFECTIVE_DATE}</span>
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
                Terms &amp; Conditions
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[#5C6B63] text-sm">Effective date: {EFFECTIVE_DATE}</span>
            <span className="hidden sm:block text-stone-300">·</span>
            <span className="text-[#5C6B63] text-sm">A product of SproutVest GSE Ltd.</span>
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
                  {s.number === "Summary" ? "Summary" : `${s.number}.`} {s.title}
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
                  {s.number === "Summary" ? "!" : s.number}
                </span>
                <h2 className="text-lg font-bold text-[#0D1F1A]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {s.title}
                </h2>
              </div>
              <div className="px-6 py-6 text-[#3D4D43] text-sm leading-relaxed
                [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_ul_li]:text-[#5C6B63]
                [&_p]:leading-relaxed [&_h3]:mt-1">
                {s.content}
              </div>
            </section>
          ))}
        </div>

        {/* Acknowledgement */}
        <div className="mt-10 bg-[#0D1F1A] rounded-2xl px-6 py-6 text-center">
          <p className="text-white/80 text-sm italic leading-relaxed">
            By creating an account or using the REU.ng Platform, you confirm that you have read, understood, and agreed to these Terms and Conditions in their entirety.
          </p>
          <p className="text-white/40 text-xs mt-3">Effective: {EFFECTIVE_DATE} · SproutVest GSE Ltd.</p>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
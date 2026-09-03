// Not rendered anywhere — kept as reference only, preserved verbatim from
// the pre-split app/page.jsx during the todo #5 monolith decomposition.
// These four sections (Ownership & Documentation, Location & Market
// Insights, Testimonials, CTA) were already commented out before the
// split; if one gets re-enabled, extract it into its own component file
// in this folder rather than pasting straight back into page.jsx.
        {/* <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <SectionLabel>Ownership & Documentation</SectionLabel>
                <SectionHeading light>Your Proof of Ownership Is Ironclad</SectionHeading>
                <p className="text-white/45 mt-4 text-sm leading-relaxed mb-6">
                  Every property on {appname} is backed by full legal documentation verified
                  by our in-house legal team and independent solicitors before listing.
                </p>
                <ul className="space-y-3">
                  {[
                    // ["Certificate of Occupancy (C of O)", "The gold-standard land title in Nigeria, confirming government-recognised ownership."],
                    ["Survey Plan", "Registered with the state surveyor-general, defining exact plot boundaries."],
                    // ["Deed of Assignment", "Formally transfers fractional interest to each investor on purchase."],
                    ["Digital Ownership Record", "Instant digital certificate issued to your account after every transaction."],
                    ["Title Verification Process", "Independent legal search on every property before onboarding."],
                  ].map(([title, desc]) => (
                    <li key={title} className="flex items-start gap-3">
                      <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-white">{title}</p>
                        <p className="text-xs hover:border-white/35 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  // { icon: <FileCheck size={28} />, label: "C of O Backed", sub: "Every listing", accent: "#C8873A" },
                  { icon: <BadgeCheck size={28} />, label: "Title Verified", sub: "Pre-listing check", accent: "#2D7A55" },
                  { icon: <Lock size={28} />, label: "Legal Protection", sub: "Fractional owners", accent: "#8B5CF6" },
                  { icon: <FileText size={28} />, label: "Digital Certificate", sub: "Instant on purchase", accent: "#C8873A" },
                ].map((d) => (
                  <div key={d.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${d.accent}20`, color: d.accent }}>
                      {d.icon}
                    </div>
                    <p className="text-sm font-bold text-white">{d.label}</p>
                    <p className="text-xs text-white/55 mt-0.5">{d.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section> */}

        {/* ══════════════════════════════════════════
            LOCATION & MARKET INSIGHTS
        ══════════════════════════════════════════ */}
        {/* <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <SectionLabel>Location & Market Insights</SectionLabel>
              <SectionHeading>Where We Invest — and Why</SectionHeading>
              <p className="text-[#5C6B63] mt-3 text-sm max-w-lg mx-auto">
                {appname} focuses on high-demand corridors where infrastructure spend,
                population growth and limited land supply drive consistent appreciation.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  city: "Ogun",
                  icon: <MapPin size={18} />,
                  // areas: "Lekki · Ibeju-Lekki · Epe",
                  driver: "Agriculture, industry make Ogun land among the fastest-appreciating in Africa.",
                  growth: "12–18% avg. annual appreciation",
                  accent: "#C8873A",
                },
                {
                  city: "Oyo",
                  icon: <MapPin size={18} />,
                  areas: "Oluyole · Akala · Omi-Adio",
                  driver: "Nigeria's largest city by area with expanding ring-road infrastructure and growing middle-class demand.",
                  growth: "8–12% avg. annual appreciation",
                  accent: "#2D7A55",
                },
                {
                  city: "Abuja",
                  icon: <MapPin size={18} />,
                  areas: "Kuje · Gwagwalada · Kubwa",
                  driver: "Federal capital expansion, satellite town development and civil service housing demand sustain strong price floors.",
                  growth: "10–14% avg. annual appreciation",
                  accent: "#8B5CF6",
                },
              ].map((loc) => (
                <article key={loc.city} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="px-6 py-4 flex items-center gap-3" style={{ background: `${loc.accent}10` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${loc.accent}20`, color: loc.accent }}>
                      {loc.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0D1F1A] text-base">{loc.city}</h3>
                      <p className="text-xs text-[#5C6B63]">{loc.areas}</p>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-sm text-[#5C6B63] leading-relaxed mb-3">{loc.driver}</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: loc.accent }}>
                      <TrendingUp size={12} /> {loc.growth}
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">Projected · not guaranteed</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section> */}

        {/* ══════════════════════════════════════════
            FEATURED PROPERTIES
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]" aria-label="Featured land investment properties">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8 sm:mb-10 flex-wrap gap-4">
              <div>
                <SectionLabel>Handpicked</SectionLabel>
                <SectionHeading light>Featured Properties</SectionHeading>
              </div>
              <Link href="/lands"
                className="flex items-center gap-1.5 text-amber-500 hover:text-amber-600 text-sm font-semibold transition-colors">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <FeaturedProperties lands={lands} />
          </div>
        </section>

        {/* ══════════════════════════════════════════
            LIQUIDITY & EXIT OPTIONS
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <SectionLabel>Liquidity & Exit</SectionLabel>
              <SectionHeading>You're Never Locked In</SectionHeading>
              <p className="text-[#5C6B63] mt-3 text-sm max-w-lg mx-auto">
                Unlike traditional real estate, your {appname} units are liquid.
                Exit when you want — on your schedule, not ours.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: <RefreshCw size={22} />, title: "Secondary Marketplace", desc: "List and sell your units to other platform investors instantly — no waiting for physical property sales.", accent: "#C8873A" },
                { icon: <Clock size={22} />, title: "No Minimum Hold Period", desc: "Buy today, sell tomorrow if you need to. There's no lock-up period on any listed property.", accent: "#2D7A55" },
                { icon: <TrendingUp size={22} />, title: "Transferable Ownership", desc: "Fractional shares are fully transferable. Gifting, inheritance and portfolio consolidation are all supported.", accent: "#8B5CF6" },
              ].map((e) => (
                <div key={e.title} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm group hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ background: `${e.accent}18`, color: e.accent }}>
                    {e.icon}
                  </div>
                  <h3 className="font-bold text-[#0D1F1A] mb-2 text-base">{e.title}</h3>
                  <p className="text-[#5C6B63] text-sm leading-relaxed">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            REGULATORY & COMPLIANCE
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <SectionLabel>Regulatory & Compliance</SectionLabel>
              <SectionHeading light>Built on a Foundation of Trust</SectionHeading>
              <p className="text-white/60 mt-3 text-sm max-w-lg mx-auto">
                {appname} operates within Nigeria's regulatory framework so your
                investment is always on solid legal ground.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Landmark size={20} />, title: "Nigerian Property Law", desc: "Fully compliant with the Land Use Act and state land regulations.", accent: "#C8873A" },
                { icon: <FileCheck size={20} />, title: "Independent Legal Audits", desc: "All titles reviewed by registered Nigerian solicitors before listing.", accent: "#2D7A55" },
                { icon: <Shield size={20} />, title: "FIRS Compliance", desc: "Tax obligations on rental income and capital gains properly disclosed.", accent: "#8B5CF6" },
                { icon: <Lock size={20} />, title: "Secure Infrastructure", desc: "256-bit SSL, PCI-DSS compliant payment processing, SOC-2 aligned data handling.", accent: "#C8873A" },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: `${c.accent}20`, color: c.accent }}>
                    {c.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{c.title}</h3>
                  <p className="text-xs hover:border-white/35 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════ */}
        {/* <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]" aria-label="Investor testimonials">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <SectionLabel>Investors</SectionLabel>
              <SectionHeading>What They're Saying</SectionHeading>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              {[
                {
                  name: "Chidi Okonkwo",
                  role: "Business Owner, Abuja",
                  text: "I've invested in 3 properties so far. The process was smooth, documentation was clean and the team is fully transparent about costs.",
                  rating: 5,
                  stat: "+14% portfolio growth in 12 months",
                },
                {
                  name: "Amina Bello",
                  role: "Software Engineer, Ogun",
                  text: "The fractional model made it easy to start with just ₦20,000. My land value has appreciated and I can track everything on the dashboard.",
                  rating: 5,
                  stat: "3 plots owned across 2 cities",
                },
              ].map((t, i) => (
                <blockquote key={i} className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={13} className="fill-amber-400 text-amber-600" />
                    ))}
                  </div>
                  <p className="text-[#3D4D43] leading-relaxed mb-3 text-sm italic">"{t.text}"</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold mb-3">
                    <TrendingUp size={10} /> {t.stat}
                  </div>
                  <footer>
                    <p className="font-bold text-[#0D1F1A] text-sm">{t.name}</p>
                    <p className="text-[#5C6B63] text-xs mt-0.5">{t.role}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section> */}

        {/* ══════════════════════════════════════════
            CTA
        ══════════════════════════════════════════ */}
        {/* <section className="relative py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[35vh] opacity-15 rounded-full blur-3xl"
              style={{ background: "radial-gradient(ellipse, #C8873A 0%, transparent 70%)" }} />
          </div>
          <div className="relative z-10 max-w-xl mx-auto text-center">
            <Award size={36} className="mx-auto mb-4 text-amber-500" />
            <h2 className="font-bold text-white mb-3 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>
              Ready to Build Your Wealth?
            </h2>
            <p className="text-white/45 mb-8 text-sm sm:text-base max-w-sm mx-auto">
              Join smart investors securing their future through verified land.
              Start from ₦5,000. No experience needed.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link href="/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-105 shadow-xl text-sm sm:text-base"
                style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                Start Investing <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/lands"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-all text-sm sm:text-base">
                Browse Properties
              </Link>
            </div>
          </div>
        </section>
 */}
        {/* ══════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════ */}

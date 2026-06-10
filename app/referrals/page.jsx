"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Gift, Copy, Check, Users, CheckCircle,
  Clock, Wallet, Zap, Info, Share2, TrendingUp,
  Star, DollarSign
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveReferralsFromRewards(rewards = []) {
  const seen = new Set();
  return rewards
    .filter((r) => r.referral)
    .reduce((acc, r) => {
      if (!seen.has(r.referral.id)) {
        seen.add(r.referral.id);
        acc.push(r.referral);
      }
      return acc;
    }, []);
}

function koboToNaira(kobo = 0) {
  return (kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border text-emerald-400 bg-[#112418] border-[#1a3a22]">
        <CheckCircle size={11} /> Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border text-amber-400 bg-[#251d0a] border-[#3d2e10]">
      <Clock size={11} /> Pending
    </span>
  );
}

const REWARD_LABELS = {
  cashback:    { icon: "💰", label: "Cashback Reward" },
  discount:    { icon: "🎟️", label: "Discount Reward" },
  bonus_units: { icon: "🎁", label: "Bonus Units" },
};

function buildRewardsSummary(rewards = []) {
  let totalKobo = 0, claimedKobo = 0, unclaimedKobo = 0,
      discountCount = 0, bonusUnits = 0;
  for (const r of rewards) {
    if (r.reward_type === "cashback" && r.amount_kobo) {
      totalKobo += r.amount_kobo;
      if (r.claimed) claimedKobo += r.amount_kobo;
      else unclaimedKobo += r.amount_kobo;
    }
    if (r.reward_type === "discount")    discountCount += 1;
    if (r.reward_type === "bonus_units" && r.units) bonusUnits += r.units;
  }
  return { totalKobo, claimedKobo, unclaimedKobo, discountCount, bonusUnits };
}

// ─── Stat card definitions ────────────────────────────────────────────────────
const STAT_CARDS = [
  { label: "Total Referrals", key: "total_referrals",     icon: <Users size={18} />,      color: "#C8873A", bg: "#261d0e", ring: "#3d2c14" },
  { label: "Completed",       key: "completed_referrals", icon: <CheckCircle size={18} />, color: "#22c55e", bg: "#122614", ring: "#1a3a22" },
  { label: "Pending",         key: "pending_referrals",   icon: <Clock size={18} />,       color: "#F59E0B", bg: "#251d0a", ring: "#3d2e10" },
  { label: "Total Earned",    key: "total_rewards_kobo",  icon: <TrendingUp size={18} />,  color: "#a78bfa", bg: "#1a1528", ring: "#2a2040", fmt: "naira" },
  { label: "Unclaimed",       key: "unclaimed_rewards_kobo", icon: <Wallet size={18} />,   color: "#C8873A", bg: "#261d0e", ring: "#3d2c14", fmt: "naira" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReferralDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res  = await api.get("/referrals/dashboard");
      const data = res.data.data;

      const derivedReferrals =
        data.referrals?.length > 0
          ? data.referrals
          : deriveReferralsFromRewards(data.rewards);

      const totalReferrals     = data.total_referrals     || derivedReferrals.length;
      const completedReferrals = data.completed_referrals || derivedReferrals.filter((r) => r.status === "completed").length;
      const pendingReferrals   = data.pending_referrals   || derivedReferrals.filter((r) => r.status !== "completed").length;

      const summedTotalKobo =
        data.total_rewards_kobo ||
        (data.rewards || []).reduce((s, r) => s + (r.reward_type === "cashback" ? r.amount_kobo || 0 : 0), 0);
      const summedUnclaimedKobo =
        data.unclaimed_rewards_kobo ||
        (data.rewards || []).reduce((s, r) => s + (!r.claimed && r.reward_type === "cashback" ? r.amount_kobo || 0 : 0), 0);

      setDashboard({
        ...data,
        referrals:              derivedReferrals,
        total_referrals:        totalReferrals,
        completed_referrals:    completedReferrals,
        pending_referrals:      pendingReferrals,
        total_rewards_kobo:     summedTotalKobo,
        unclaimed_rewards_kobo: summedUnclaimedKobo,
      });
    } catch {
      toast.error("Failed to load referral dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getShareMessage = () => {
    const link = dashboard?.referral_link || "";
    return `Join me on this platform and earn rewards 🎉\n\nSign up here: ${link}`;
  };

  const shareWhatsApp  = () => window.open(`https://wa.me/?text=${encodeURIComponent(getShareMessage())}`, "_blank");
  const shareTwitter   = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareMessage())}`, "_blank");
  const shareFacebook  = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dashboard?.referral_link || "")}`, "_blank");
  const nativeShare    = async () => {
    try {
      if (navigator.share) await navigator.share({ text: getShareMessage(), url: dashboard?.referral_link });
      else toast("Sharing not supported on this device");
    } catch {}
  };

  const copyReferralLink = async () => {
    const link = dashboard?.referral_link;
    if (!link) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const el = document.createElement("textarea");
        el.value = link;
        el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
        document.body.appendChild(el);
        el.select();
        el.setSelectionRange(0, el.value.length);
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically — please copy the link manually");
    }
  };

  const claimReward = async (rewardId) => {
    try {
      await api.post(`/referrals/rewards/${rewardId}/claim`);
      toast.success("Reward claimed!");
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim reward");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1F1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const summary = buildRewardsSummary(dashboard?.rewards || []);

  return (
    <div className="min-h-screen bg-[#0D1F1A]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-500 mb-2">
            Dashboard
          </p>
          <h1 className="text-3xl font-bold text-white">Referral Program</h1>
          <p className="text-[#7aab97] mt-1 text-sm">Share your link and earn rewards</p>
        </div>

        {/* ── Referral Link Card ── */}
        <div className="rounded-2xl p-6 mb-8 border border-[#2a4030] bg-[#132e20]">
          <div className="flex items-center gap-2 mb-4">
            <Gift size={18} className="text-amber-500" />
            <h2 className="text-white font-bold">Your Referral Link</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={dashboard?.referral_link || ""}
              readOnly
              className="flex-1 bg-[#192a25] border border-[#253531] text-[#7a9e94] px-4 py-3 rounded-xl text-sm"
            />
            <button
              onClick={copyReferralLink}
              className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                copied
                  ? "bg-[#112418] text-emerald-400 border border-[#1a3a22]"
                  : "bg-amber-400 text-black"
              }`}
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={shareWhatsApp}
              className="px-3 py-2 text-xs bg-[#162414] text-green-400 rounded-lg hover:bg-[#1a3018] transition-colors border border-[#1e3a1a]">
              WhatsApp
            </button>
            <button onClick={shareTwitter}
              className="px-3 py-2 text-xs bg-[#111e2a] text-sky-400 rounded-lg hover:bg-[#14263a] transition-colors border border-[#192e3a]">
              Twitter / X
            </button>
            <button onClick={shareFacebook}
              className="px-3 py-2 text-xs bg-[#12182a] text-blue-400 rounded-lg hover:bg-[#12203a] transition-colors border border-[#1a243a]">
              Facebook
            </button>
            <button onClick={nativeShare}
              className="px-3 py-2 text-xs bg-[#142D25] text-[#7a9e94] rounded-lg flex items-center gap-1 hover:bg-[#18352b] transition-colors border border-[#1e3530]">
              <Share2 size={12} /> More
            </button>
          </div>

          <p className="mt-4 text-amber-400 font-mono text-lg tracking-wider">
            {dashboard?.referral_code}
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {STAT_CARDS.map((card) => {
            const raw = dashboard?.[card.key] || 0;
            const display = card.fmt === "naira" ? `₦${koboToNaira(raw)}` : raw;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-[#1e3530] bg-[#132922] p-4 sm:p-5"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: card.bg, color: card.color, boxShadow: `0 0 0 1px ${card.ring}` }}
                >
                  {card.icon}
                </div>
                <p className="text-xs text-[#8ab9a9] uppercase tracking-widest font-bold mb-1">
                  {card.label}
                </p>
                <p
                  className="text-xl sm:text-2xl font-bold text-white break-all"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {display}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Rewards Balance Panel ── */}
        <div className="rounded-2xl border border-[#1e3530] bg-[#132922] overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-5 border-b border-[#193028] bg-[#142D25]">
            <div className="w-9 h-9 rounded-xl bg-[#1a1528] flex items-center justify-center" style={{ boxShadow: "0 0 0 1px #2a2040" }}>
              <Star size={17} className="text-purple-400" />
            </div>
            <h2
              className="font-bold text-white text-lg"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Rewards Balance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#193028]">

            {/* Cashback */}
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#132818] flex items-center justify-center" style={{ boxShadow: "0 0 0 1px #1a3a22" }}>
                  <DollarSign size={14} className="text-emerald-400" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8ab9a9]">
                  Cashback
                </p>
              </div>
              <p
                className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                ₦{koboToNaira(summary.totalKobo)}
              </p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-emerald-400">₦{koboToNaira(summary.claimedKobo)} claimed</span>
                {summary.unclaimedKobo > 0 && (
                  <span className="text-amber-400">₦{koboToNaira(summary.unclaimedKobo)} pending</span>
                )}
              </div>
              {summary.totalKobo > 0 && (
                <div className="mt-3 h-1.5 w-full bg-[#1e3530] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, (summary.claimedKobo / summary.totalKobo) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Discounts */}
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#111e28] flex items-center justify-center" style={{ boxShadow: "0 0 0 1px #192e3a" }}>
                  <span className="text-sky-400 text-sm">🎟️</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8ab9a9]">
                  Discounts
                </p>
              </div>
              <p
                className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {summary.discountCount}
              </p>
              <p className="text-xs text-[#8ab9a9]">
                {summary.discountCount === 1 ? "voucher" : "vouchers"} available
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(dashboard?.rewards || [])
                  .filter((r) => r.reward_type === "discount")
                  .map((r) => (
                    <span
                      key={r.id}
                      className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                        r.claimed
                          ? "bg-[#192a25] text-[#8ab9a9]"  
                          : "bg-[#111e28] text-sky-300"     
                      }`}
                    >
                      {r.discount_percentage}% off
                    </span>
                  ))}
              </div>
            </div>

            {/* Bonus units */}
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#241a0e] flex items-center justify-center" style={{ boxShadow: "0 0 0 1px #3d2c14" }}>
                  <Zap size={14} className="text-amber-400" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8ab9a9]">
                  Bonus Units
                </p>
              </div>
              <p
                className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {summary.bonusUnits.toLocaleString()}
              </p>
              <p className="text-xs text-[#8ab9a9]">units accumulated</p>
            </div>
          </div>
        </div>

        {/* ── Rewards List ── */}
        {dashboard?.rewards?.length > 0 && (
          <div className="rounded-2xl border border-[#1e3530] bg-[#132922] overflow-hidden mb-6">
            <div className="flex items-center gap-3 px-5 sm:px-6 py-5 border-b border-[#193028] bg-[#142D25]">
              <div className="w-9 h-9 rounded-xl bg-[#241a0e] flex items-center justify-center" style={{ boxShadow: "0 0 0 1px #3d2c14" }}>
                <Zap size={17} className="text-amber-500" />
              </div>
              <h2
                className="font-bold text-white text-lg"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Your Rewards
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {dashboard.rewards.map((reward) => {
                const cfg = REWARD_LABELS[reward.reward_type] || { icon: "🎁", label: "Reward" };
                return (
                  <div
                    key={reward.id}
                    className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                      reward.claimed
                        ? "border-[#193028] bg-[#121f1b] opacity-60"
                        : "border-[#1a3a22] bg-[#0f201a] hover:bg-[#112418]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {cfg.icon} {cfg.label}
                      </p>
                      <p className="text-xs text-[#7aab97] mt-0.5">
                        {reward.reward_type === "cashback"    && `₦${koboToNaira(reward.amount_kobo)}`}
                        {reward.reward_type === "discount"    && `${reward.discount_percentage}% off your next purchase`}
                        {reward.reward_type === "bonus_units" && `${reward.units} bonus units`}
                      </p>
                      {reward.referral?.referred_user?.name && (
                        <p className="text-xs text-[#8ab9a9] mt-1">
                          From: {reward.referral.referred_user.name}
                        </p>
                      )}
                      {reward.claimed && reward.claimed_at && (
                        <p className="text-xs text-[#8ab9a9] mt-0.5">
                          Claimed {new Date(reward.claimed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {reward.claimed ? (
                        <span className="flex items-center gap-1.5 text-xs text-[#8ab9a9] border border-[#1e3530] px-3 py-1.5 rounded-lg whitespace-nowrap">
                          <Check size={12} /> Claimed
                        </span>
                      ) : (
                        <button
                          onClick={() => claimReward(reward.id)}
                          className="text-xs font-bold text-[#0D1F1A] bg-[#22c55e] px-4 py-2 rounded-lg transition-all hover:scale-105 whitespace-nowrap hover:bg-[#1eaf54]"
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Referrals Table ── */}
        {dashboard?.referrals?.length > 0 ? (
          <div className="rounded-2xl border border-[#1e3530] bg-[#132922] overflow-hidden mb-6">
            <div className="flex items-center gap-3 px-5 sm:px-6 py-5 border-b border-[#193028] bg-[#142D25]">
              <div className="w-9 h-9 rounded-xl bg-[#132818] flex items-center justify-center" style={{ boxShadow: "0 0 0 1px #1a3a22" }}>
                <Users size={17} className="text-emerald-400" />
              </div>
              <h2
                className="font-bold text-white text-lg"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Your Referrals
              </h2>
            </div>

            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-[1.5fr_1.5fr_1fr_1fr] gap-4 px-6 py-3 border-b border-[#193028] bg-[#142D25]">
              {["Name", "Email", "Status", "Joined"].map((h) => (
                <span key={h} className="text-xs font-bold uppercase tracking-widest text-[#8ab9a9]">{h}</span>
              ))}
            </div>
            {/* Mobile header */}
            <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-[#193028] bg-[#142D25] sm:hidden">
              {["Name", "Status"].map((h) => (
                <span key={h} className="text-xs font-bold uppercase tracking-widest text-[#8ab9a9]">{h}</span>
              ))}
            </div>

            {dashboard.referrals.map((referral, i) => (
              <div
                key={referral.id}
                className={`transition-colors hover:bg-[#162d26] ${
                  i < dashboard.referrals.length - 1 ? "border-b border-[#193028]" : ""
                }`}
              >
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-[1.5fr_1.5fr_1fr_1fr] gap-4 px-6 py-4 items-center">
                  <p className="text-sm font-semibold text-white">{referral.referred_user?.name ?? "—"}</p>
                  <p className="text-sm text-[#7aab97] truncate">{referral.referred_user?.email ?? "—"}</p>
                  <StatusBadge status={referral.status} />
                  <p className="text-sm text-[#7aab97]">
                    {referral.referred_user?.created_at
                      ? new Date(referral.referred_user.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                {/* Mobile row */}
                <div className="sm:hidden px-4 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{referral.referred_user?.name ?? "—"}</p>
                    <p className="text-xs text-[#8ab9a9] mt-0.5">
                      {referral.referred_user?.created_at
                        ? new Date(referral.referred_user.created_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <StatusBadge status={referral.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1e3530] bg-[#132922] p-10 sm:p-12 text-center mb-6">
            <div className="text-5xl mb-4">🎁</div>
            <h3
              className="text-xl font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              No Referrals Yet
            </h3>
            <p className="text-[#7aab97] text-sm mb-6">
              Share your referral link with friends to earn rewards!
            </p>
            <button
              onClick={copyReferralLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#0D1F1A] text-sm bg-[#C8873A] hover:bg-[#b87830] transition-all hover:scale-105"
            >
              <Copy size={15} /> Copy Referral Link
            </button>
          </div>
        )}

        {/* ── How it works ── */}
        <div className="rounded-2xl border border-[#1a3a22] bg-[#0f201a] p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-emerald-400" />
            <h3 className="font-bold text-emerald-300 text-sm">How Referrals Work</h3>
          </div>
          <ol className="space-y-2 text-sm text-[#4a7a62]">
            {[
              "Share your unique referral link with friends",
              "They sign up using your link",
              "When they make their first purchase, your referral is completed",
              "You both receive rewards!",
              "Claim your rewards to add them to your account",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  );
}
import api from "../utils/api";

export interface Referral {
  id: string | number;
  status: string;
  referred_user?: {
    name?: string;
    email?: string;
    created_at?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type RewardType = "cashback" | "discount" | "bonus_units";

export interface Reward {
  id: string | number;
  reward_type: RewardType;
  claimed: boolean;
  claimed_at?: string;
  amount_kobo?: number;
  discount_percentage?: number;
  units?: number;
  referral?: Referral;
  [key: string]: unknown;
}

export interface ReferralsDashboard {
  referral_link?: string;
  referral_code?: string;
  referrals?: Referral[];
  rewards?: Reward[];
  total_referrals?: number;
  completed_referrals?: number;
  pending_referrals?: number;
  total_rewards_kobo?: number;
  unclaimed_rewards_kobo?: number;
  [key: string]: unknown;
}

/* GET /referrals/dashboard */
export async function getReferralsDashboard(): Promise<ReferralsDashboard> {
  const res = await api.get("/referrals/dashboard");
  return res.data.data;
}

/* POST /referrals/rewards/:id/claim */
export async function claimReferralReward(rewardId: string | number): Promise<void> {
  await api.post(`/referrals/rewards/${rewardId}/claim`);
}
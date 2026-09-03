import api from "../utils/api";

/* ── Referrals ───────────────────────────────────────────────────────── */

export interface AdminReferralStats {
  [key: string]: unknown;
}

export async function getAdminReferralStats(): Promise<AdminReferralStats> {
  const res = await api.get("/admin/referrals/stats");
  return res.data.data;
}

export async function getAdminReferrals(status = "all"): Promise<unknown[]> {
  const res = await api.get(
    `/admin/referrals${status !== "all" ? `?status=${status}` : ""}`
  );
  return res.data.data?.data ?? res.data.data ?? [];
}

/* ── Users ───────────────────────────────────────────────────────────── */

export interface AdminUsersPage {
  [key: string]: unknown;
}

export async function getAdminUsers(params: string): Promise<AdminUsersPage> {
  const res = await api.get(`/admin/users?${params}`);
  return res.data;
}

export async function getAdminUser(userId: string | number): Promise<unknown> {
  const res = await api.get(`/admin/users/${userId}`);
  return res.data;
}

export type UserActionType =
  | "suspend"
  | "unsuspend"
  | "makeAdmin"
  | "removeAdmin"
  | "delete";

export interface UserActionResponse {
  message?: string;
  [key: string]: unknown;
}

/* Dispatches the moderation action for a user (suspend/unsuspend/
   make-admin/remove-admin/delete). */
export async function performUserAction(
  userId: string | number,
  action: UserActionType
): Promise<UserActionResponse> {
  const map: Record<UserActionType, ["patch" | "delete", string]> = {
    suspend: ["patch", `/admin/users/${userId}/suspend`],
    unsuspend: ["patch", `/admin/users/${userId}/unsuspend`],
    makeAdmin: ["patch", `/admin/users/${userId}/make-admin`],
    removeAdmin: ["patch", `/admin/users/${userId}/remove-admin`],
    delete: ["delete", `/admin/users/${userId}`],
  };
  const [method, url] = map[action];
  const res = await api[method](url);
  return res.data;
}

/* ── Roles (RBAC) ────────────────────────────────────────────────────── */

export interface AdminPermission {
  id: number;
  name: string;
  label: string;
}

export interface AdminRole {
  id: number;
  name: string;
  label: string;
  description?: string;
  permissions: AdminPermission[];
}

export async function getAdminRoles(): Promise<AdminRole[]> {
  const res = await api.get("/admin/roles");
  return res.data.data ?? [];
}

export async function getUserRoles(
  userId: string | number
): Promise<AdminRole[]> {
  const res = await api.get(`/admin/users/${userId}/roles`);
  return res.data.data ?? [];
}

export async function assignUserRole(
  userId: string | number,
  role: string
): Promise<{ message?: string }> {
  const res = await api.post(`/admin/users/${userId}/roles`, { role });
  return res.data;
}

export async function revokeUserRole(
  userId: string | number,
  roleId: string | number
): Promise<{ message?: string }> {
  const res = await api.delete(`/admin/users/${userId}/roles/${roleId}`);
  return res.data;
}

/* ── Waitlist ────────────────────────────────────────────────────────── */

export async function getWaitlistStats(): Promise<unknown> {
  const res = await api.get("/admin/waitlist/stats");
  return res.data;
}

export async function getWaitlist(params: string): Promise<unknown> {
  const res = await api.get(`/admin/waitlist?${params}`);
  return res.data;
}

export async function inviteWaitlistEntry(id: string | number): Promise<void> {
  await api.post(`/admin/waitlist/${id}/invite`);
}

export async function deleteWaitlistEntry(id: string | number): Promise<void> {
  await api.delete(`/admin/waitlist/${id}`);
}

/* ── Withdrawals ─────────────────────────────────────────────────────── */

export async function getAdminWithdrawals(params: string): Promise<unknown> {
  const res = await api.get(`/admin/withdrawals?${params}`);
  return res.data;
}

export async function approveWithdrawal(id: string | number): Promise<void> {
  await api.post(`/admin/withdrawals/${id}/approve`);
}

export async function rejectWithdrawal(
  id: string | number,
  reason: string
): Promise<void> {
  await api.post(`/admin/withdrawals/${id}/reject`, { reason });
}

export async function approveAllWithdrawals(): Promise<unknown> {
  const res = await api.post("/admin/withdrawals/approve-all");
  return res.data;
}

/* ── Dashboard ───────────────────────────────────────────────────────── */

export interface AdminDashboardStats {
  lands: { total: number; active: number; disabled: number };
  kyc: { total: number; pending: number; approved: number; rejected: number };
  referrals: { total: number; completed: number; pending: number; totalRewards: number };
  support: { total: number; open: number; waiting: number };
  users: { total: number; suspended: number; admins: number };
  blog: { total: number; published: number; draft: number };
  withdrawals: { pending: number; processing: number };
  liveChat: { queued: number; active: number };
  compliance: { pendingReview: number; blocked: number; flagged: number };
}

/* Fetches the ~18 lightweight count endpoints the admin dashboard needs
   in parallel, tolerating individual failures (Promise.allSettled), and
   returns them pre-normalized into the shape the dashboard renders. */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const results = await Promise.allSettled([
    api.get("/admin/lands"),
    api.get("/admin/kyc?per_page=1"),
    api.get("/admin/kyc?per_page=1&status=pending"),
    api.get("/admin/kyc?per_page=1&status=approved"),
    api.get("/admin/referrals/stats"),
    api.get("/admin/support/tickets?per_page=1"),
    api.get("/admin/support/tickets?per_page=1&status=open"),
    api.get("/admin/support/tickets?per_page=1&status=waiting"),
    api.get("/admin/users?per_page=1"),
    api.get("/admin/users?per_page=1&suspended=true"),
    api.get("/admin/users?per_page=1&is_admin=true"),
    api.get("/admin/blog?per_page=1"),
    api.get("/admin/blog?per_page=1&status=published"),
    api.get("/admin/blog?per_page=1&status=draft"),
    api.get("/admin/withdrawals?status=pending&per_page=1"),
    api.get("/admin/withdrawals?status=processing&per_page=1"),
    api.get("/admin/live-chat/queue"),
    api.get("/admin/compliance/stats"),
  ]);

  const get = (index: number) =>
    results[index].status === "fulfilled"
      ? (results[index] as PromiseFulfilledResult<any>).value
      : null;

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.warn(`Dashboard request ${i} failed:`, (result as PromiseRejectedResult).reason);
    }
  });

  const [
    landsRes, kycAllRes, kycPendingRes, kycApprovedRes,
    referralsRes,
    supportAllRes, supportOpenRes, supportWaitingRes,
    usersAllRes, usersSuspendedRes, usersAdminRes,
    blogAllRes, blogPublishedRes, blogDraftRes,
    withdrawalsPendingRes, withdrawalsProcessingRes,
    liveChatQueueRes, complianceRes,
  ] = results.map((_, i) => get(i));

  const landsData = landsRes?.data?.data?.data ?? landsRes?.data?.data ?? [];
  const landsTotal = landsRes?.data?.data?.total ?? landsData.length;

  const kycTotal = kycAllRes?.data?.data?.total ?? 0;
  const kycPending = kycPendingRes?.data?.data?.total ?? 0;
  const kycApproved = kycApprovedRes?.data?.data?.total ?? 0;
  const compliance = complianceRes?.data?.data ?? {};

  const ref = referralsRes?.data?.data ?? {};

  const supportTotal = supportAllRes?.data?.data?.total ?? 0;
  const supportOpen = supportOpenRes?.data?.data?.total ?? 0;
  const supportWaiting = supportWaitingRes?.data?.data?.total ?? 0;

  const usersTotal = usersAllRes?.data?.data?.total ?? 0;
  const usersSuspended = usersSuspendedRes?.data?.data?.total ?? 0;
  const usersAdmins = usersAdminRes?.data?.data?.total ?? 0;

  const blogTotal = blogAllRes?.data?.data?.total ?? 0;
  const blogPublished = blogPublishedRes?.data?.data?.total ?? 0;
  const blogDraft = blogDraftRes?.data?.data?.total ?? 0;

  const wPending = withdrawalsPendingRes?.data?.data?.total ?? 0;
  const wProcessing = withdrawalsProcessingRes?.data?.data?.total ?? 0;

  const queueData = liveChatQueueRes?.data?.data ?? [];
  const lcQueued = queueData.filter((t: any) => !t.agent_id).length;
  const lcActive = queueData.filter((t: any) => !!t.agent_id).length;

  return {
    lands: {
      total: landsTotal,
      active: landsData.filter((l: any) => l.is_available).length,
      disabled: landsData.filter((l: any) => !l.is_available).length,
    },
    kyc: {
      total: kycTotal,
      pending: kycPending,
      approved: kycApproved,
      rejected: Math.max(0, kycTotal - kycPending - kycApproved),
    },
    referrals: {
      total: ref.total_referrals ?? 0,
      completed: ref.completed_referrals ?? 0,
      pending: ref.pending_referrals ?? 0,
      totalRewards: ref.total_rewards_issued ?? 0,
    },
    support: { total: supportTotal, open: supportOpen, waiting: supportWaiting },
    users: { total: usersTotal, suspended: usersSuspended, admins: usersAdmins },
    blog: { total: blogTotal, published: blogPublished, draft: blogDraft },
    withdrawals: { pending: wPending, processing: wProcessing },
    liveChat: { queued: lcQueued, active: lcActive },
    compliance: {
      pendingReview: compliance.pending_review ?? 0,
      blocked: compliance.blocked_users ?? 0,
      flagged: compliance.flagged_users ?? 0,
    },
  };
}

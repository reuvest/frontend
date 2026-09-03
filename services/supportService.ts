import api from "../utils/api";

export interface ChatMessage {
  role: "user" | "assistant" | string;
  content: string;
  [key: string]: unknown;
}

export interface SupportTicket {
  id: string | number;
  subject: string;
  category: string;
  priority: string;
  status?: string;
  [key: string]: unknown;
}

export type TicketPriority = "low" | "normal" | "high" | string;

export interface CreateTicketInput {
  subject: string;
  category: string;
  message: string;
  priority?: TicketPriority;
  attachment?: File | null;
}

export interface ReplyToTicketInput {
  message: string;
  attachment?: File | null;
}

export interface CreateGuestTicketInput {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  attachment?: File | null;
}

export interface CreateGuestTicketResponse {
  success: boolean;
  message?: string;
  reference: string;
}

export interface FaqGroups {
  account?: unknown[];
  payment?: unknown[];
  [category: string]: unknown[] | undefined;
}

// ── AI Chat (auth required) ───────────────────────────────────────────────────
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const res = await api.post("/support/chat", { messages });
  return res.data.data.reply;
}

// ── Tickets (auth required) ───────────────────────────────────────────────────
export async function fetchTickets(page = 1): Promise<SupportTicket[]> {
  const res = await api.get(`/support/tickets?page=${page}`);
  return res.data.data;
}

export async function fetchTicket(id: string | number): Promise<SupportTicket> {
  const res = await api.get(`/support/tickets/${id}`);
  return res.data.data;
}

export async function createTicket({
  subject,
  category,
  message,
  priority = "normal",
  attachment,
}: CreateTicketInput): Promise<SupportTicket> {
  const form = new FormData();
  form.append("subject", subject);
  form.append("category", category);
  form.append("message", message);
  form.append("priority", priority);
  if (attachment) form.append("attachment", attachment);

  const res = await api.post("/support/tickets", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function replyToTicket(
  id: string | number,
  { message, attachment }: ReplyToTicketInput
): Promise<SupportTicket> {
  const form = new FormData();
  form.append("message", message);
  if (attachment) form.append("attachment", attachment);

  const res = await api.post(`/support/tickets/${id}/reply`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

// ── Guest ticket (no auth) ────────────────────────────────────────────────────
// Returns { reference } so the guest can quote it in follow-ups
export async function createGuestTicket({
  name,
  email,
  subject,
  category,
  message,
  attachment,
}: CreateGuestTicketInput): Promise<CreateGuestTicketResponse> {
  const form = new FormData();
  form.append("name", name);
  form.append("email", email);
  form.append("subject", subject);
  form.append("category", category);
  form.append("message", message);
  if (attachment) form.append("attachment", attachment);

  const res = await api.post("/support/tickets/guest", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // { success, message, reference }
  return res.data;
}

// ── FAQs (public) ─────────────────────────────────────────────────────────────
export async function fetchFaqs(): Promise<FaqGroups> {
  const res = await api.get("/support/faqs");
  return res.data.data; // { account: [...], payment: [...], ... }
}

// ── Ticket message attachments ────────────────────────────────────────────────
export async function fetchTicketMessageAttachment(
  ticketId: string | number,
  messageId: string | number
): Promise<Blob> {
  const res = await api.get(
    `/support/tickets/${ticketId}/messages/${messageId}/attachment`,
    { responseType: "blob" }
  );
  return res.data;
}

// ── Live chat (auth required) ─────────────────────────────────────────────────

export interface LiveChatRequestInput {
  subject: string;
  category: string;
  message: string;
}

export interface LiveChatRequestResponse {
  ticket_id: string | number;
  reference: string;
  queue_pos: number;
  [key: string]: unknown;
}

export async function requestLiveChat(
  form: LiveChatRequestInput
): Promise<LiveChatRequestResponse> {
  const res = await api.post("/support/live-chat/request", form);
  return res.data;
}

export interface LiveChatMessageResponse {
  data: Record<string, unknown>;
  [key: string]: unknown;
}

export async function sendLiveChatMessage(
  ticketId: string | number,
  fd: FormData
): Promise<LiveChatMessageResponse> {
  const res = await api.post(`/support/live-chat/${ticketId}/message`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function sendLiveChatTyping(
  ticketId: string | number,
  isTyping: boolean
): Promise<void> {
  await api.post(`/support/live-chat/${ticketId}/typing`, { is_typing: isTyping });
}

// ── Admin ticket management ────────────────────────────────────────────────────

export async function getAdminTicketAttachment(
  messageId: string | number
): Promise<Blob> {
  const res = await api.get(`/admin/support/tickets/${messageId}/attachment`, {
    responseType: "blob",
  });
  return res.data;
}

export interface AdminReplyResponse {
  data: Record<string, unknown>;
  [key: string]: unknown;
}

export async function replyToAdminTicket(
  ticketId: string | number,
  form: FormData
): Promise<AdminReplyResponse> {
  const res = await api.post(`/admin/support/tickets/${ticketId}/reply`, form);
  return res.data;
}

export async function updateAdminTicketStatus(
  ticketId: string | number,
  fields: { status?: string; priority?: string }
): Promise<void> {
  await api.patch(`/admin/support/tickets/${ticketId}/status`, fields);
}

export async function deleteAdminTicket(ticketId: string | number): Promise<void> {
  await api.delete(`/admin/support/tickets/${ticketId}`);
}

export async function getAdminTickets(params: string): Promise<unknown> {
  const res = await api.get(`/admin/support/tickets?${params}`);
  return res.data;
}

export async function getAdminTicket(ticketId: string | number): Promise<unknown> {
  const res = await api.get(`/admin/support/tickets/${ticketId}`);
  return res.data;
}

// ── Admin live-chat (agent side) ────────────────────────────────────────────────

export async function getLiveChatQueue(): Promise<unknown[]> {
  const res = await api.get("/admin/live-chat/queue");
  return res.data.data ?? [];
}

export async function claimLiveChatTicket(ticketId: string | number): Promise<any> {
  const res = await api.post(`/admin/live-chat/${ticketId}/claim`);
  return res.data.data;
}

export async function sendAgentLiveChatMessage(
  ticketId: string | number,
  body: string
): Promise<any> {
  const res = await api.post(`/admin/live-chat/${ticketId}/message`, { body });
  return res.data.data;
}

export async function sendAgentLiveChatTyping(
  ticketId: string | number,
  isTyping: boolean
): Promise<void> {
  await api.post(`/admin/live-chat/${ticketId}/typing`, { is_typing: isTyping });
}

export async function endLiveChat(ticketId: string | number): Promise<void> {
  await api.post(`/admin/live-chat/${ticketId}/end`);
}
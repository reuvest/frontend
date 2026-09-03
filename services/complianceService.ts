import api from "../utils/api";

export async function getComplianceStats(): Promise<unknown> {
  const res = await api.get("/admin/compliance/stats");
  return res.data;
}

export async function getComplianceScreenings(): Promise<unknown> {
  const res = await api.get("/admin/compliance/screenings");
  return res.data;
}

export async function getComplianceScreening(
  screeningId: string | number
): Promise<unknown> {
  const res = await api.get(`/admin/compliance/screenings/${screeningId}`);
  return res.data;
}

export async function clearScreening(
  screeningId: string | number,
  notes: string
): Promise<void> {
  await api.post(`/admin/compliance/screenings/${screeningId}/clear`, { notes });
}

export async function blockScreening(
  screeningId: string | number,
  notes: string
): Promise<void> {
  await api.post(`/admin/compliance/screenings/${screeningId}/block`, { notes });
}

export async function rescreenUser(userId: string | number): Promise<void> {
  await api.post(`/admin/compliance/users/${userId}/rescreen`);
}

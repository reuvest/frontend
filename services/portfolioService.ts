import api from "../utils/api";

export interface PortfolioSummaryRaw {
  current_portfolio_value_naira?: number;
  total_invested_naira?: number;
  total_profit_loss_naira?: number;
  profit_loss_percent?: number;
  lands?: Array<{
    land_id: string | number;
    land_name?: string;
    units: number;
    price_per_unit_kobo?: number;
    total_portfolio_value_naira?: number;
    available_units?: number;
    cert_number?: string | null;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/* GET /portfolio/summary */
export async function getPortfolioSummary(): Promise<PortfolioSummaryRaw> {
  const res = await api.get("/portfolio/summary");
  return res.data.data;
}

export interface Certificate {
  cert_number: string;
  [key: string]: unknown;
}

/* GET /certificates/:certNumber */
export async function getCertificate(certNumber: string): Promise<Certificate> {
  const res = await api.get(`/certificates/${certNumber}`);
  return res.data.data;
}

export interface CertificateDownload {
  blob: Blob;
  contentType: string;
}

/* GET /certificates/:certNumber/download — binary PDF */
export async function downloadCertificate(
  certNumber: string
): Promise<CertificateDownload> {
  const res = await api.get(`/certificates/${certNumber}/download`, {
    responseType: "blob",
  });
  return {
    blob: res.data,
    contentType: String(res.headers?.["content-type"] ?? ""),
  };
}

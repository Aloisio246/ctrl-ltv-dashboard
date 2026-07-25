export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const TOKEN_KEY = "ctrl_ltv_access_token";
const REFRESH_KEY = "ctrl_ltv_refresh_token";

export type DashboardSummary = {
  metrics: {
    activeClients: number;
    mrr: string;
    realizedRevenue: string;
    realizedCost: string;
    cancelledThisMonth: number;
    margin: number;
    averageLtv: number;
  };
  pipeline: Array<{ status: string; count: number }>;
  capture: { pendingRecords: number; approvedRecords: number; totalRecords: number };
  inbox: { unreadMessages: number };
  approvals: { pendingItems: number };
};

export type Activity = {
  id: string;
  prospectId: string | null;
  opportunityId: string | null;
  assignedUserId: string | null;
  type: string;
  status: "pending" | "completed" | "cancelled";
  title: string;
  notes: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type CaptureRun = {
  id: string;
  source: string;
  query: string | null;
  status: string;
  totalFound: number;
  acceptedCount: number;
  duplicateCount: number;
  errorCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type CaptureRecord = {
  id: string;
  runId: string;
  externalId: string | null;
  name: string;
  normalizedName: string;
  website: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  sourceUrl: string | null;
  status: "pending" | "approved" | "rejected" | "promoted";
  companyId: string | null;
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  source: string;
};

export type Prospect = {
  id: string;
  companyId: string;
  ownerUserId: string | null;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost" | "archived";
  temperature: "cold" | "warm" | "hot";
  score: number;
  nextFollowUpAt: string | null;
  createdAt: string;
};

export type Opportunity = { id: string; prospectId: string; stage: string; amount: string | number; currency: string; expectedCloseAt: string | null; lostReason: string | null; createdAt: string };
export type Client = { id: string; companyId: string | null; status: string; startedAt: string; cancelledAt: string | null; notes: string | null; createdAt: string };
export type Contract = { id: string; clientId: string; status: string; startedAt: string; endedAt: string | null; monthlyValue: string | number; setupFee: string | number; currency: string; createdAt: string };
export type Invoice = { id: string; clientId: string; contractId: string | null; number: string; status: string; issueDate: string; dueDate: string; subtotal: string | number; currency: string };
export type HealthScore = { id: string; clientId: string; score: number; status: string; reasons: string[] | null; measuredAt: string };
export type MetricsSummary = DashboardSummary["metrics"];
export type Conversation = { id: string; externalId: string; status: "open" | "pending" | "closed"; subject: string | null; lastMessageAt: string | null; channel: string; channelLabel: string | null; unreadCount: number; lastMessage: { body: string; direction: string; createdAt: string } | null };
export type ApprovalBatch = { id: string; title: string; channel: string; status: string; notificationStatus: string; createdAt: string; updatedAt: string };

export class ApiUnavailableError extends Error {
  constructor(message = "API indisponível") {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiUnavailableError };

function getStoredToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
}

async function loginFromLocalEnv() {
  const email = import.meta.env.VITE_API_EMAIL as string | undefined;
  const password = import.meta.env.VITE_API_PASSWORD as string | undefined;
  if (!API_BASE_URL || !email || !password) return null;
  const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Falha ao autenticar no backend local");
  const payload = (await response.json()) as { data: { accessToken: string; refreshToken: string } };
  window.localStorage.setItem(TOKEN_KEY, payload.data.accessToken);
  window.localStorage.setItem(REFRESH_KEY, payload.data.refreshToken);
  return payload.data.accessToken;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  if (!API_BASE_URL || typeof window === "undefined") {
    return { ok: false, error: new ApiUnavailableError("Backend não conectado") };
  }
  try {
    let token = getStoredToken() ?? await loginFromLocalEnv();
    const request = () => fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init.headers ?? {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    });
    let response = await request();
    if (response.status === 401) {
      token = await loginFromLocalEnv();
      response = await request();
    }
    if (!response.ok) throw new Error(`API retornou ${response.status}`);
    const payload = (await response.json()) as { data: T };
    return { ok: true, data: payload.data };
  } catch (error) {
    return { ok: false, error: new ApiUnavailableError(error instanceof Error ? error.message : "API indisponível") };
  }
}

export async function fetchDashboardSummary() {
  return apiFetch<DashboardSummary>("/v1/dashboard/summary");
}

export async function fetchActivities() {
  return apiFetch<Activity[]>("/v1/activities?limit=50&offset=0");
}

export async function fetchCaptureRuns() {
  return apiFetch<CaptureRun[]>("/v1/capture/runs?limit=50&offset=0");
}

export async function fetchCaptureRecords(status?: CaptureRecord["status"]) {
  const query = status ? `&status=${status}` : "";
  return apiFetch<CaptureRecord[]>(`/v1/capture/records?limit=100&offset=0${query}`);
}

export async function createCaptureRun(input: { source: string; query?: string }) {
  return apiFetch<CaptureRun>("/v1/capture/runs", {
    method: "POST",
    body: JSON.stringify({ ...input, metadata: { mode: "local-beta" } }),
  });
}

export async function reviewCaptureRecord(id: string, status: "approved" | "rejected") {
  return apiFetch<CaptureRecord>(`/v1/capture/records/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function promoteCaptureRecord(id: string) {
  return apiFetch<{ record: CaptureRecord; company: Company; prospect: Prospect }>(`/v1/capture/records/${id}/promote`, {
    method: "POST",
  });
}

export async function fetchCompanies() {
  return apiFetch<Company[]>("/v1/companies");
}

export async function fetchProspects() {
  return apiFetch<Prospect[]>("/v1/prospects");
}

export async function createProspect(input: {
  companyId: string;
  status: Prospect["status"];
  temperature: Prospect["temperature"];
  score: number;
  nextFollowUpAt?: string;
}) {
  return apiFetch<Prospect>("/v1/prospects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchOpportunities() { return apiFetch<Opportunity[]>("/v1/opportunities?limit=100&offset=0"); }
export async function fetchClients() { return apiFetch<Client[]>("/v1/clients?limit=100&offset=0"); }
export async function fetchContracts() { return apiFetch<Contract[]>("/v1/contracts?limit=100&offset=0"); }
export async function fetchInvoices() { return apiFetch<Invoice[]>("/v1/invoices?limit=100&offset=0"); }
export async function fetchHealthScores() { return apiFetch<HealthScore[]>("/v1/retention/health?limit=100&offset=0"); }
export async function fetchMetricsSummary() { return apiFetch<MetricsSummary>("/v1/metrics/summary"); }
export async function fetchClientLtv(id: string) { return apiFetch<{ clientId: string; realizedRevenue: string; realizedCost: string; mrr: string; monthsActive: number; realizedLtv: number }>(`/v1/metrics/clients/${id}/ltv`); }
export async function fetchConversations() { return apiFetch<Conversation[]>("/v1/inbox/conversations?limit=100&offset=0"); }
export async function fetchApprovalBatches() { return apiFetch<ApprovalBatch[]>("/v1/approval-batches?limit=100&offset=0"); }

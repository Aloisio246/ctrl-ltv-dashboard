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

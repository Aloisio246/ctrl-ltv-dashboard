export const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const TOKEN_KEY = "ctrl_ltv_access_token";
const REFRESH_KEY = "ctrl_ltv_refresh_token";
let accessTokenMemory: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

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
  metadata?: Record<string, unknown>;
  provider?: string;
  limitRequested?: number;
  forceRefresh?: boolean;
  whatsappCheckEnabled?: boolean;
  cacheHit?: boolean;
};
export type CaptureRecord = {
  id: string;
  runId: string;
  externalId: string | null;
  name: string;
  normalizedName: string;
  website: string | null;
  phone: string | null;
  email?: string | null;
  normalizedPhone?: string | null;
  normalizedDomain?: string | null;
  city: string | null;
  state: string | null;
  country: string;
  sourceUrl: string | null;
  status: "pending" | "approved" | "rejected" | "promoted";
  companyId: string | null;
  createdAt: string;
  rating?: number | null;
  reviewCount?: number | null;
  websiteAudit?: Record<string, unknown>;
  enrichment?: Record<string, unknown>;
  qualityScore?: number;
  scoreReasons?: string[];
  enrichmentStatus?: string;
  whatsappStatus?: string;
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
export type Contact = {
  id: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  roleTitle: string | null;
  createdAt: string;
  companyName: string;
  companyWebsite: string | null;
  companyPhone: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyCountry: string;
  companySource: string;
  clientId: string | null;
  clientStatus: string | null;
};
export type Prospect = {
  id: string;
  companyId: string;
  ownerUserId: string | null;
  status:
    "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost" | "archived";
  temperature: "cold" | "warm" | "hot";
  score: number;
  nextFollowUpAt: string | null;
  createdAt: string;
};
export type Opportunity = {
  id: string;
  prospectId: string;
  stage: string;
  amount: string | number;
  currency: string;
  expectedCloseAt: string | null;
  lostReason: string | null;
  createdAt: string;
};
export type Client = {
  id: string;
  companyId: string | null;
  status: string;
  startedAt: string;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
};
export type Contract = {
  id: string;
  clientId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  billingDay: number | null;
  monthlyValue: string | number;
  setupFee: string | number;
  currency: string;
  createdAt: string;
};
export type Invoice = {
  id: string;
  clientId: string;
  contractId: string | null;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: string | number;
  currency: string;
  paymentProvider?: string | null;
  providerPaymentId?: string | null;
  paymentUrl?: string | null;
};
export type BillingReminderSettings = {
  id: string | null;
  enabled: boolean;
  channel: "whatsapp" | "email";
  daysBeforeDue: number;
  sendHour: number;
  timezone: string;
  paymentProvider: "manual" | "asaas";
  template: string;
  updatedAt?: string;
};
export type BillingReminderDelivery = {
  id: string;
  contractId: string;
  clientId: string;
  channel: string;
  dueDate: string;
  status: string;
  paymentUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  outboundJobId: string | null;
  sentAt: string | null;
  createdAt: string;
};
export type Payment = {
  id: string;
  invoiceId: string;
  status: string;
  amount: string | number;
  receivedAt: string | null;
  method: string | null;
  reference: string | null;
};
export type Cost = {
  id: string;
  clientId: string | null;
  description: string;
  amount: string | number;
  incurredAt: string;
  category: string;
};
export type HealthScore = {
  id: string;
  clientId: string;
  score: number;
  status: string;
  reasons: string[] | null;
  measuredAt: string;
};
export type MetricsSummary = DashboardSummary["metrics"];
export type Conversation = {
  id: string;
  externalId: string;
  status: "open" | "pending" | "closed";
  subject: string | null;
  lastMessageAt: string | null;
  channel: string;
  channelLabel: string | null;
  unreadCount: number;
  lastMessage: { body: string; direction: string; createdAt: string } | null;
};
export type ApprovalBatch = {
  id: string;
  title: string;
  channel: string;
  status: string;
  notificationStatus: string;
  createdAt: string;
  updatedAt: string;
};
export type ApprovalItem = {
  id: string;
  messageId: string;
  channel: string;
  scheduledAt: string | null;
  status: string;
  body: string;
  version: number;
  recipientExternalId: string | null;
  channelLabel: string | null;
  jobStatus: string | null;
  jobLastError: string | null;
};
export type ApprovalBatchDetail = ApprovalBatch & { items: ApprovalItem[] };
export type Me = {
  user: { id: string; email: string; displayName: string };
  activeMembership: { organizationId: string; organizationName: string; role: string };
  memberships: Array<{ organizationId: string; organizationName: string; role: string }>;
};
export type IntegrationProvider =
  | "google_places"
  | "serper"
  | "rapidapi"
  | "apify"
  | "email"
  | "asaas";
export type Integration = {
  id: string;
  provider: IntegrationProvider;
  label: string;
  status: "configured" | "not_configured" | "error" | "disabled";
  config: Record<string, unknown>;
  hasCredentials: boolean;
  lastError: string | null;
  updatedAt: string;
};
export type EvolutionInstance = {
  id: string;
  channelAccountId: string;
  label: string;
  instanceName: string;
  status: "disconnected" | "connecting" | "connected" | "error";
  phoneNumber: string | null;
  profileName: string | null;
  lastError: string | null;
  connectedAt: string | null;
  createdAt: string;
};

export class ApiUnavailableError extends Error {
  constructor(message = "API indisponível") {
    super(message);
    this.name = "ApiUnavailableError";
  }
}
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiUnavailableError };

function getStoredToken() {
  if (typeof window === "undefined") return null;
  if (accessTokenMemory) return accessTokenMemory;
  accessTokenMemory = window.sessionStorage.getItem(TOKEN_KEY);
  if (accessTokenMemory) return accessTokenMemory;

  const legacyToken = window.localStorage.getItem(TOKEN_KEY);
  const legacyRefreshToken = window.localStorage.getItem(REFRESH_KEY);
  if (legacyToken) window.sessionStorage.setItem(TOKEN_KEY, legacyToken);
  if (legacyRefreshToken) window.sessionStorage.setItem(REFRESH_KEY, legacyRefreshToken);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  accessTokenMemory = legacyToken;
  return accessTokenMemory;
}

function getStoredRefreshToken() {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(REFRESH_KEY);
}

function persistSession(session: { accessToken: string; refreshToken: string }) {
  if (typeof window === "undefined") return;
  accessTokenMemory = session.accessToken;
  window.sessionStorage.setItem(TOKEN_KEY, session.accessToken);
  window.sessionStorage.setItem(REFRESH_KEY, session.refreshToken);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

function clearSession() {
  accessTokenMemory = null;
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!API_BASE_URL || !refreshToken) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        clearSession();
        return null;
      }
      const payload = (await response.json()) as {
        data: { accessToken: string; refreshToken: string };
      };
      persistSession(payload.data);
      return payload.data.accessToken;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  if (!API_BASE_URL || typeof window === "undefined")
    return { ok: false, error: new ApiUnavailableError("Backend não conectado") };
  try {
    let token = getStoredToken();
    const request = () =>
      fetch(`${API_BASE_URL}${path}`, {
        ...init,
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          ...(init.headers ?? {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      });
    let response = await request();
    if (response.status === 401 && !path.startsWith("/v1/auth/")) {
      token = await refreshAccessToken();
      if (token) response = await request();
    }
    if (!response.ok) throw new Error(`API retornou ${response.status}`);
    const payload = (await response.json()) as { data: T };
    return { ok: true, data: payload.data };
  } catch (error) {
    return {
      ok: false,
      error: new ApiUnavailableError(error instanceof Error ? error.message : "API indisponível"),
    };
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

export async function fetchCaptureRunLogs(runId: string) {
  return apiFetch<
    Array<{
      id: string;
      level: string;
      event: string;
      message: string;
      metadata: Record<string, unknown>;
      createdAt: string;
    }>
  >(`/v1/capture/runs/${runId}/logs`);
}
export async function fetchCaptureRecords(status?: CaptureRecord["status"]) {
  return apiFetch<CaptureRecord[]>(
    `/v1/capture/records?limit=100&offset=0${status ? `&status=${status}` : ""}`,
  );
}
export async function createCaptureRun(input: {
  source: string;
  query?: string;
  niche?: string;
  city?: string;
  region?: string;
  limit?: number;
  forceRefresh?: boolean;
  verifyWhatsAppExists?: boolean;
  extractEmailsAndContacts?: boolean;
}) {
  return apiFetch<CaptureRun>("/v1/capture/runs", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      provider: input.source,
      metadata: {
        mode: "local-beta",
        niche: input.niche,
        city: input.city,
        region: input.region,
        verifyWhatsAppExists: input.verifyWhatsAppExists,
        extractEmailsAndContacts: input.extractEmailsAndContacts,
      },
    }),
  });
}

export async function importCaptureRecords(input: {
  source: "csv" | "manual";
  records: Array<{
    name: string;
    website?: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    country?: string;
    sourceUrl?: string;
    rating?: number;
    reviewCount?: number;
  }>;
}) {
  return apiFetch<{
    run: CaptureRun;
    summary: { acceptedCount: number; duplicateCount: number; errorCount: number };
  }>("/v1/capture/import", { method: "POST", body: JSON.stringify(input) });
}
export async function reviewCaptureRecord(id: string, status: "approved" | "rejected") {
  return apiFetch<CaptureRecord>(`/v1/capture/records/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}
export async function promoteCaptureRecord(id: string) {
  return apiFetch<{ record: CaptureRecord; company: Company; prospect: Prospect }>(
    `/v1/capture/records/${id}/promote`,
    { method: "POST" },
  );
}
export async function fetchCompanies() {
  return apiFetch<Company[]>("/v1/companies");
}
export async function createCompany(input: {
  name: string;
  normalizedName: string;
  website?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  source?: string;
}) {
  return apiFetch<Company>("/v1/companies", { method: "POST", body: JSON.stringify(input) });
}
export async function updateCompany(
  id: string,
  input: Partial<{
    name: string;
    normalizedName: string;
    website: string;
    phone: string;
    city: string;
    state: string;
    country: string;
    source: string;
  }>,
) {
  return apiFetch<Company>(`/v1/companies/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
export async function fetchContacts() {
  return apiFetch<Contact[]>("/v1/contacts");
}
export async function createContact(input: {
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  roleTitle?: string;
}) {
  return apiFetch<Contact>("/v1/contacts", { method: "POST", body: JSON.stringify(input) });
}
export async function updateContact(
  id: string,
  input: Partial<{
    companyId: string;
    name: string;
    email: string;
    phone: string;
    roleTitle: string;
  }>,
) {
  return apiFetch<Contact>(`/v1/contacts/${id}`, { method: "PATCH", body: JSON.stringify(input) });
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
  return apiFetch<Prospect>("/v1/prospects", { method: "POST", body: JSON.stringify(input) });
}
export async function createActivity(input: {
  prospectId: string;
  type: Activity["type"];
  title: string;
  notes?: string;
  dueAt?: string;
}) {
  return apiFetch<Activity>("/v1/activities", { method: "POST", body: JSON.stringify(input) });
}
export async function fetchOpportunities() {
  return apiFetch<Opportunity[]>("/v1/opportunities?limit=100&offset=0");
}
export async function createOpportunity(input: {
  prospectId: string;
  stage?: Opportunity["stage"];
  amount?: number;
  currency?: string;
  expectedCloseAt?: string;
}) {
  return apiFetch<Opportunity>("/v1/opportunities", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export async function updateOpportunityStage(
  id: string,
  stage: Opportunity["stage"],
  lostReason?: string,
) {
  return apiFetch<Opportunity>(`/v1/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ stage, lostReason }),
  });
}
export async function fetchClients() {
  return apiFetch<Client[]>("/v1/clients?limit=100&offset=0");
}
export async function fetchContracts() {
  return apiFetch<Contract[]>("/v1/contracts?limit=100&offset=0");
}
export async function fetchInvoices() {
  return apiFetch<Invoice[]>("/v1/invoices?limit=100&offset=0");
}
export async function fetchBillingReminderSettings() {
  return apiFetch<{ settings: BillingReminderSettings; deliveries: BillingReminderDelivery[] }>(
    "/v1/billing/reminders?limit=50&offset=0",
  );
}
export async function saveBillingReminderSettings(
  input: Omit<BillingReminderSettings, "id" | "updatedAt">,
) {
  return apiFetch<BillingReminderSettings>("/v1/billing/reminders", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
export async function createClient(input: {
  companyId?: string;
  status?: Client["status"];
  startedAt?: string;
  notes?: string;
  monthlyValue?: number;
  billingDay?: number;
  setupFee?: number;
  currency?: string;
}) {
  return apiFetch<Client>("/v1/clients", { method: "POST", body: JSON.stringify(input) });
}
export async function updateClient(
  id: string,
  input: Partial<{
    companyId: string;
    status: Client["status"];
    startedAt: string;
    notes: string;
  }>,
) {
  return apiFetch<Client>(`/v1/clients/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
export async function createContract(input: {
  clientId: string;
  status?: Contract["status"];
  startedAt?: string;
  billingDay?: number;
  monthlyValue: number;
  setupFee?: number;
  currency?: string;
}) {
  return apiFetch<Contract>("/v1/contracts", { method: "POST", body: JSON.stringify(input) });
}
export async function updateContract(
  id: string,
  input: Partial<{
    status: Contract["status"];
    startedAt: string;
    endedAt: string;
    billingDay: number;
    monthlyValue: number;
    setupFee: number;
    currency: string;
  }>,
) {
  return apiFetch<Contract>(`/v1/contracts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
export async function createInvoice(input: {
  clientId: string;
  contractId?: string;
  number: string;
  status?: Invoice["status"];
  dueDate: string;
  subtotal: number;
  currency?: string;
  paymentProvider?: "manual" | "asaas";
  providerPaymentId?: string;
  paymentUrl?: string;
}) {
  return apiFetch<Invoice>("/v1/invoices", { method: "POST", body: JSON.stringify(input) });
}
export async function createPayment(input: {
  invoiceId: string;
  status?: Payment["status"];
  amount: number;
  receivedAt?: string;
  method?: string;
  reference?: string;
}) {
  return apiFetch<Payment>("/v1/payments", { method: "POST", body: JSON.stringify(input) });
}
export async function createCost(input: {
  clientId?: string;
  description: string;
  amount: number;
  incurredAt?: string;
  category: string;
}) {
  return apiFetch<Cost>("/v1/costs", { method: "POST", body: JSON.stringify(input) });
}
export async function fetchHealthScores() {
  return apiFetch<HealthScore[]>("/v1/retention/health?limit=100&offset=0");
}
export async function fetchMetricsSummary() {
  return apiFetch<MetricsSummary>("/v1/metrics/summary");
}
export async function fetchClientLtv(id: string) {
  return apiFetch<{
    clientId: string;
    realizedRevenue: string;
    realizedCost: string;
    mrr: string;
    monthsActive: number;
    ltv: number;
    received: number;
    outstanding: number;
  }>(`/v1/metrics/clients/${id}/ltv`);
}
export async function fetchConversations() {
  return apiFetch<Conversation[]>("/v1/inbox/conversations?limit=100&offset=0");
}
export async function fetchApprovalBatches() {
  return apiFetch<ApprovalBatch[]>("/v1/approval-batches?limit=100&offset=0");
}
export async function fetchApprovalBatch(id: string) {
  return apiFetch<ApprovalBatchDetail>(`/v1/approval-batches/${id}`);
}
export async function decideApprovalItem(id: string, status: "approved" | "rejected") {
  return apiFetch<{ id: string; batchId: string; messageId: string; status: string }>(
    `/v1/approval-batches/items/${id}/decision`,
    { method: "POST", body: JSON.stringify({ status }) },
  );
}
export async function cancelApprovalBatch(id: string) {
  return apiFetch<{ id: string; status: string }>(`/v1/approval-batches/${id}/cancel`, {
    method: "POST",
  });
}
export async function fetchMe() {
  return apiFetch<Me>("/v1/me");
}

export async function fetchIntegrations() {
  return apiFetch<Integration[]>("/v1/integrations");
}

export async function saveIntegration(input: {
  provider: IntegrationProvider;
  label: string;
  config?: Record<string, unknown>;
  secrets?: Record<string, string>;
}) {
  return apiFetch<Integration>(`/v1/integrations/${input.provider}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function removeIntegration(provider: IntegrationProvider) {
  return apiFetch<void>(`/v1/integrations/${provider}`, { method: "DELETE" });
}

export async function fetchEvolutionInstances() {
  return apiFetch<EvolutionInstance[]>("/v1/evolution/instances");
}

export async function createEvolutionInstance(label: string) {
  return apiFetch<EvolutionInstance>("/v1/evolution/instances", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export async function connectEvolutionInstance(id: string) {
  return apiFetch<{ id: string; status: string; qrCode: string | null }>(
    `/v1/evolution/instances/${id}/connect`,
    { method: "POST" },
  );
}

export async function fetchEvolutionInstanceStatus(id: string) {
  return apiFetch<{ id: string; status: EvolutionInstance["status"] }>(
    `/v1/evolution/instances/${id}/status`,
  );
}

export async function disconnectEvolutionInstance(id: string) {
  return apiFetch<{ id: string; status: string }>(
    `/v1/evolution/instances/${id}/disconnect`,
    { method: "POST" },
  );
}

export async function login(email: string, password: string) {
  if (!API_BASE_URL || typeof window === "undefined")
    return { ok: false as const, error: new ApiUnavailableError("Backend não conectado") };
  try {
    const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok)
      return { ok: false as const, error: new ApiUnavailableError("E-mail ou senha inválidos") };
    const payload = (await response.json()) as {
      data: { accessToken: string; refreshToken: string };
    };
    persistSession(payload.data);
    return { ok: true as const, data: payload.data };
  } catch (error) {
    return {
      ok: false as const,
      error: new ApiUnavailableError(
        error instanceof Error ? error.message : "Não foi possível entrar",
      ),
    };
  }
}

export async function bootstrap(input: {
  email: string;
  displayName: string;
  password: string;
  organizationName: string;
  organizationSlug: string;
}) {
  if (!API_BASE_URL || typeof window === "undefined")
    return { ok: false as const, error: new ApiUnavailableError("Backend não conectado") };
  try {
    const response = await fetch(`${API_BASE_URL}/v1/auth/bootstrap`, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      const message =
        payload?.error === "validation_error"
          ? "Confira os dados informados."
          : payload?.error === "public_registration_disabled"
            ? "A criação pública de workspaces está desativada."
            : response.status === 409
              ? "Este e-mail ou identificador de workspace já está em uso."
              : "Não foi possível criar o workspace.";
      return { ok: false as const, error: new ApiUnavailableError(message) };
    }
    const payload = (await response.json()) as {
      data: { accessToken: string; refreshToken: string };
    };
    persistSession(payload.data);
    return { ok: true as const, data: payload.data };
  } catch (error) {
    return {
      ok: false as const,
      error: new ApiUnavailableError(
        error instanceof Error ? error.message : "Não foi possível criar o workspace",
      ),
    };
  }
}

export async function logout() {
  const refreshToken = getStoredRefreshToken();
  try {
    if (refreshToken && API_BASE_URL)
      await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          ...(getStoredToken() ? { authorization: `Bearer ${getStoredToken()}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      });
  } finally {
    clearSession();
  }
}

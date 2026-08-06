// Tipos da camada de dados de demonstração da Fase 1.
// Somente frontend: nada aqui depende de API, banco ou autenticação.

export type CaptureSourceKey =
  | "google_places"
  | "site_form"
  | "whatsapp"
  | "instagram"
  | "referral"
  | "meta_ads"
  | "manual"
  | "csv"
  | "events";

export type SourceAvailability = "demo" | "planned" | "integration_required";

export type CaptureSourceDef = {
  key: CaptureSourceKey;
  label: string;
  description: string;
  availability: SourceAvailability;
};

export type RunStage =
  | "collecting"
  | "normalizing"
  | "deduplicating"
  | "enriching"
  | "scoring"
  | "review";

export type RunStatus = "running" | "completed" | "failed" | "cancelled";

export type RunLog = { at: string; stage: RunStage; message: string };

export type CaptureRunDemo = {
  id: string;
  source: CaptureSourceKey;
  query: string;
  params: Array<{ label: string; value: string }>;
  startedAt: string;
  finishedAt: string | null;
  status: RunStatus;
  stage: RunStage;
  limit: number;
  found: number;
  accepted: number;
  duplicates: number;
  errors: number;
  durationMs: number;
  logs: RunLog[];
};

export type RecordStatus =
  | "captured"
  | "pending_review"
  | "approved"
  | "promoted"
  | "discarded";

export type ScoreFactor = {
  label: string;
  impact: "positive" | "negative";
  weight: number;
};

export type CaptureRecordDemo = {
  id: string;
  runId: string | null;
  source: CaptureSourceKey;
  companyName: string;
  niche: string;
  city: string;
  state: string;
  neighborhood: string;
  address: string;
  phone: string;
  whatsapp: boolean;
  email: string;
  website: string;
  instagram: string;
  rating: number | null;
  reviewCount: number | null;
  contactName: string;
  score: number;
  scoreFactors: ScoreFactor[];
  status: RecordStatus;
  ownerId: string | null;
  serviceInterest: string | null;
  notes: string;
  duplicateOfId: string | null;
  capturedAt: string;
  history: Array<{ at: string; label: string }>;
};

export type ProspectStatus =
  | "new"
  | "contact_started"
  | "replied"
  | "diagnosis_scheduled"
  | "meeting_completed"
  | "proposal_sent"
  | "follow_up"
  | "negotiation"
  | "awaiting_decision"
  | "won"
  | "lost";

export type Temperature = "hot" | "warm" | "cold";

export type ProspectDemo = {
  id: string;
  recordId: string | null;
  companyName: string;
  niche: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: boolean;
  email: string;
  website: string;
  instagram: string;
  contactName: string;
  source: CaptureSourceKey;
  score: number;
  scoreFactors: ScoreFactor[];
  temperature: Temperature;
  status: ProspectStatus;
  ownerId: string | null;
  serviceInterest: string | null;
  nextFollowUpAt: string | null;
  tags: string[];
  notes: string;
  archived: boolean;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TimelineEvent = {
  id: string;
  refType: "record" | "prospect";
  refId: string;
  at: string;
  kind: "capture" | "review" | "promotion" | "followup" | "note" | "status" | "assignment";
  title: string;
  detail: string;
  done: boolean;
};

export type Owner = { id: string; name: string; initials: string; role: string };

export type DemoState = {
  version: number;
  runs: CaptureRunDemo[];
  records: CaptureRecordDemo[];
  prospects: ProspectDemo[];
  timeline: TimelineEvent[];
};

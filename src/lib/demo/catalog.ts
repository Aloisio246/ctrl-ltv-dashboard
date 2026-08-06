// Catálogo estático da Fase 1: fontes, responsáveis, serviços e rótulos em PT-BR.
import type {
  CaptureSourceDef,
  CaptureSourceKey,
  Owner,
  ProspectStatus,
  RecordStatus,
  RunStage,
  RunStatus,
  Temperature,
} from "./types";

export const CAPTURE_SOURCES: CaptureSourceDef[] = [
  {
    key: "google_places",
    label: "Google Maps / Places",
    description: "Busca por categoria, cidade e raio. Consulta simulada nesta fase.",
    availability: "integration_required",
  },
  {
    key: "site_form",
    label: "Formulário do site",
    description: "Registros enviados pelo formulário público.",
    availability: "planned",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "Contatos que iniciaram conversa pelo WhatsApp.",
    availability: "integration_required",
  },
  {
    key: "instagram",
    label: "Instagram",
    description: "Interações e mensagens diretas recebidas.",
    availability: "integration_required",
  },
  {
    key: "referral",
    label: "Indicação",
    description: "Empresas indicadas por clientes e parceiros.",
    availability: "demo",
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    description: "Formulários de geração de cadastro das campanhas.",
    availability: "integration_required",
  },
  {
    key: "manual",
    label: "Cadastro manual",
    description: "Registro criado direto pela equipe.",
    availability: "demo",
  },
  {
    key: "csv",
    label: "Importação CSV",
    description: "Planilhas e listas externas processadas no navegador.",
    availability: "demo",
  },
  {
    key: "events",
    label: "Eventos e parcerias",
    description: "Listas de eventos, feiras e parcerias comerciais.",
    availability: "demo",
  },
];

export const SOURCE_LABEL: Record<CaptureSourceKey, string> = CAPTURE_SOURCES.reduce(
  (acc, source) => ({ ...acc, [source.key]: source.label }),
  {} as Record<CaptureSourceKey, string>,
);

export const AVAILABILITY_LABEL: Record<CaptureSourceDef["availability"], string> = {
  demo: "Demonstração",
  planned: "Planejada",
  integration_required: "Requer integração futura",
};

export const OWNERS: Owner[] = [
  { id: "own-1", name: "Aloisio Isidio", initials: "AI", role: "Owner" },
  { id: "own-2", name: "Beatriz Rocha", initials: "BR", role: "Comercial" },
  { id: "own-3", name: "Diego Alves", initials: "DA", role: "Comercial" },
  { id: "own-4", name: "Marina Prado", initials: "MP", role: "Account" },
];

export const SERVICES = [
  "Tráfego pago",
  "Gestão de redes sociais",
  "Site e landing page",
  "SEO local",
  "CRM e automação",
  "Consultoria de aquisição",
];

export const RUN_STAGES: RunStage[] = [
  "collecting",
  "normalizing",
  "deduplicating",
  "enriching",
  "scoring",
  "review",
];

export const STAGE_LABEL: Record<RunStage, string> = {
  collecting: "Coletando",
  normalizing: "Normalizando",
  deduplicating: "Removendo duplicados",
  enriching: "Enriquecendo",
  scoring: "Pontuando",
  review: "Revisão",
};

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  running: "Executando",
  completed: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
};

export const RECORD_STATUS_LABEL: Record<RecordStatus, string> = {
  captured: "Capturado",
  pending_review: "Aguardando análise",
  approved: "Aprovado para prospecção",
  promoted: "Promovido",
  discarded: "Descartado",
};

export const PROSPECT_STATUS_LABEL: Record<ProspectStatus, string> = {
  new: "Novo",
  contact_started: "Contato iniciado",
  replied: "Respondeu",
  diagnosis_scheduled: "Diagnóstico agendado",
  meeting_completed: "Reunião realizada",
  proposal_sent: "Proposta enviada",
  follow_up: "Follow-up",
  negotiation: "Negociação",
  awaiting_decision: "Aguardando decisão",
  won: "Ganho",
  lost: "Perdido",
};

export const TEMPERATURE_LABEL: Record<Temperature, string> = {
  hot: "Quente",
  warm: "Morna",
  cold: "Fria",
};

export const TEMPERATURE_CLASS: Record<Temperature, string> = {
  hot: "border-danger/40 bg-danger/10 text-danger",
  warm: "border-warning/40 bg-warning/10 text-warning",
  cold: "border-violet/40 bg-violet/10 text-violet",
};

export function ownerName(ownerId: string | null): string {
  if (!ownerId) return "Sem responsável";
  return OWNERS.find((owner) => owner.id === ownerId)?.name ?? "Sem responsável";
}

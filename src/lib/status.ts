/**
 * Rótulos em português e tom visual por status.
 * Somente apresentação: não altera valores enviados ou recebidos da API.
 */
export type StatusTone = "positive" | "warning" | "danger" | "info" | "neutral";

export type StatusMeta = {
  label: string;
  tone: StatusTone;
};

const STATUS_META: Record<string, StatusMeta> = {
  // Cobranças
  draft: { label: "Rascunho", tone: "neutral" },
  open: { label: "Aberta", tone: "info" },
  pending: { label: "Pendente", tone: "warning" },
  partial: { label: "Parcial", tone: "warning" },
  paid: { label: "Paga", tone: "positive" },
  overdue: { label: "Vencida", tone: "danger" },
  void: { label: "Cancelada", tone: "neutral" },
  refunded: { label: "Reembolsada", tone: "info" },

  // Contratos e clientes
  active: { label: "Ativo", tone: "positive" },
  paused: { label: "Pausado", tone: "warning" },
  onboarding: { label: "Onboarding", tone: "info" },
  at_risk: { label: "Em risco", tone: "danger" },
  cancelled: { label: "Cancelado", tone: "neutral" },
  canceled: { label: "Cancelado", tone: "neutral" },
  closed: { label: "Encerrado", tone: "neutral" },
  ended: { label: "Encerrado", tone: "neutral" },

  // Captação e aprovações
  approved: { label: "Aprovado", tone: "positive" },
  rejected: { label: "Rejeitado", tone: "danger" },
  promoted: { label: "Promovido", tone: "positive" },
  superseded: { label: "Substituído", tone: "neutral" },
  scheduled: { label: "Agendado", tone: "info" },
  sent: { label: "Enviado", tone: "positive" },
  queued: { label: "Na fila", tone: "info" },
  running: { label: "Em execução", tone: "info" },
  completed: { label: "Concluído", tone: "positive" },
  failed: { label: "Falhou", tone: "danger" },

  // Conversas e saúde
  unread: { label: "Não lida", tone: "warning" },
  snoozed: { label: "Adiada", tone: "neutral" },
  healthy: { label: "Saudável", tone: "positive" },
  watch: { label: "Atenção", tone: "warning" },
  attention: { label: "Atenção", tone: "warning" },
  critical: { label: "Crítico", tone: "danger" },
  connected: { label: "Conectado", tone: "positive" },
  disconnected: { label: "Desconectado", tone: "neutral" },
  configured: { label: "Configurado", tone: "positive" },
};

export function getStatusMeta(value: string | null | undefined): StatusMeta {
  if (!value) return { label: "Sem status", tone: "neutral" };
  const meta = STATUS_META[value.toLowerCase()];
  if (meta) return meta;
  return { label: value.replace(/_/g, " "), tone: "neutral" };
}

export function statusLabel(value: string | null | undefined): string {
  return getStatusMeta(value).label;
}

export const toneClasses: Record<StatusTone, string> = {
  positive: "border-lime/35 bg-lime/10 text-lime",
  warning: "border-warning/35 bg-warning/10 text-warning",
  danger: "border-danger/40 bg-danger/10 text-danger",
  info: "border-violet/40 bg-violet/10 text-violet",
  neutral: "border-border bg-surface-2 text-muted-foreground",
};

export const toneDotClasses: Record<StatusTone, string> = {
  positive: "bg-lime",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-violet",
  neutral: "bg-muted-foreground",
};

// Dados simulados isolados. Serão substituídos por API externa na Fase 1+.
// Não use estes dados fora da camada de UI.

export type JourneyStage = {
  key: string;
  label: string;
  count: number;
  conversion: number | null; // taxa de passagem do estágio anterior
  hint: string;
};

export const journey: JourneyStage[] = [
  { key: "capture", label: "Captação", count: 1284, conversion: null, hint: "novos registros no período" },
  { key: "prospecting", label: "Prospecção", count: 612, conversion: 0.477, hint: "aprovados para contato" },
  { key: "negotiation", label: "Negociação", count: 184, conversion: 0.301, hint: "oportunidades ativas" },
  { key: "client", label: "Cliente", count: 42, conversion: 0.228, hint: "convertidos no período" },
  { key: "revenue", label: "Receita", count: 38, conversion: 0.905, hint: "com faturamento ativo" },
  { key: "retention", label: "Retenção", count: 34, conversion: 0.895, hint: "clientes saudáveis" },
  { key: "ltv", label: "LTV", count: 28, conversion: 0.824, hint: "com LTV consolidado" },
];

export type MetricCard = {
  key: string;
  label: string;
  value: number;
  format: "number" | "currency" | "percent";
  delta: number; // variação vs período anterior
  hint: string;
};

export const metrics: MetricCard[] = [
  { key: "captured", label: "Oportunidades captadas", value: 1284, format: "number", delta: 0.142, hint: "vs período anterior" },
  { key: "prospects", label: "Prospects ativos", value: 612, format: "number", delta: 0.081, hint: "em prospecção" },
  { key: "deals", label: "Negociações abertas", value: 184, format: "number", delta: -0.032, hint: "em pipeline" },
  { key: "clients", label: "Clientes ativos", value: 128, format: "number", delta: 0.056, hint: "com contrato vigente" },
  { key: "mrr", label: "MRR", value: 184320, format: "currency", delta: 0.093, hint: "receita recorrente" },
  { key: "revenue", label: "Receita recebida", value: 246810, format: "currency", delta: 0.121, hint: "no período" },
  { key: "ticket", label: "Ticket médio", value: 3820, format: "currency", delta: 0.024, hint: "por cliente ativo" },
  { key: "ltv", label: "LTV médio", value: 42680, format: "currency", delta: 0.187, hint: "realizado por cliente" },
];

export type RevenuePoint = { month: string; mrr: number; revenue: number };

export const revenueSeries: RevenuePoint[] = [
  { month: "Jan", mrr: 92_000, revenue: 118_000 },
  { month: "Fev", mrr: 104_000, revenue: 132_400 },
  { month: "Mar", mrr: 118_500, revenue: 149_800 },
  { month: "Abr", mrr: 129_000, revenue: 168_200 },
  { month: "Mai", mrr: 141_800, revenue: 182_600 },
  { month: "Jun", mrr: 152_400, revenue: 196_900 },
  { month: "Jul", mrr: 163_100, revenue: 211_400 },
  { month: "Ago", mrr: 168_700, revenue: 220_800 },
  { month: "Set", mrr: 172_900, revenue: 229_500 },
  { month: "Out", mrr: 178_200, revenue: 237_100 },
  { month: "Nov", mrr: 181_600, revenue: 242_900 },
  { month: "Dez", mrr: 184_320, revenue: 246_810 },
];

export type Priority = {
  id: string;
  kind: "followup" | "approval" | "meeting" | "risk";
  title: string;
  subtitle: string;
  when: string;
  severity: "low" | "medium" | "high";
};

export const priorities: Priority[] = [
  { id: "p1", kind: "followup", title: "Follow-up atrasado — Padaria Aurora", subtitle: "Última interação há 6 dias", when: "Atrasado 2d", severity: "high" },
  { id: "p2", kind: "approval", title: "Lote WhatsApp aguardando revisão", subtitle: "42 mensagens preparadas · campanha Junho", when: "Pendente", severity: "medium" },
  { id: "p3", kind: "meeting", title: "Diagnóstico — Studio Norte", subtitle: "Reunião comercial", when: "Hoje 14:30", severity: "medium" },
  { id: "p4", kind: "risk", title: "Cliente em risco — Ótica Vitrine", subtitle: "Saúde caiu para atenção · pagamento pendente", when: "Atenção", severity: "high" },
  { id: "p5", kind: "followup", title: "Proposta pendente — Marmoraria Vega", subtitle: "Enviada há 4 dias sem retorno", when: "Vence hoje", severity: "medium" },
  { id: "p6", kind: "meeting", title: "Kickoff — Clínica Origem", subtitle: "Onboarding do novo cliente", when: "Amanhã 09:00", severity: "low" },
];

export type ActivityEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  tone: "neutral" | "positive" | "warning" | "negative";
};

export const activity: ActivityEvent[] = [
  { id: "a1", actor: "Beatriz Rocha", action: "moveu para", target: "Ganho · Panificadora Sol", at: "há 4 min", tone: "positive" },
  { id: "a2", actor: "Sistema", action: "importou", target: "218 novos registros · Google Maps", at: "há 12 min", tone: "neutral" },
  { id: "a3", actor: "Diego Alves", action: "aprovou lote", target: "WhatsApp · 42 mensagens", at: "há 27 min", tone: "neutral" },
  { id: "a4", actor: "Sistema", action: "sinalizou", target: "Cliente em risco · Ótica Vitrine", at: "há 42 min", tone: "warning" },
  { id: "a5", actor: "Marina Prado", action: "registrou reunião com", target: "Studio Norte", at: "há 1 h", tone: "neutral" },
  { id: "a6", actor: "Sistema", action: "encerrou", target: "Perda · Autoescola Rota (motivo: preço)", at: "há 2 h", tone: "negative" },
];

export type HealthDomain = {
  key: string;
  label: string;
  score: number; // 0..100
  status: "healthy" | "attention" | "at_risk" | "critical";
  headline: string;
};

export const health: HealthDomain[] = [
  { key: "capture", label: "Captação", score: 86, status: "healthy", headline: "Volume acima da meta semanal" },
  { key: "pipeline", label: "Pipeline", score: 72, status: "attention", headline: "3 negociações sem atividade há +5 dias" },
  { key: "finance", label: "Financeiro", score: 91, status: "healthy", headline: "Inadimplência abaixo de 2%" },
  { key: "retention", label: "Retenção", score: 64, status: "at_risk", headline: "2 clientes com sinais críticos" },
];

// ---------------------------------------------------------------------------
// Adaptadores para os painéis que já usam o formato de resposta da API.
// Usados apenas como fallback de demonstração quando a API não está ligada.
// ---------------------------------------------------------------------------

function offsetIso(days: number, hour = 9): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const demoPriorities: Array<{
  id: string;
  kind: "followup" | "approval" | "risk";
  title: string;
  subtitle: string;
  dueAt: string;
  severity: "medium" | "high";
}> = [
  { id: "p1", kind: "followup", title: "Follow-up atrasado — Padaria Aurora", subtitle: "Última interação há 6 dias", dueAt: offsetIso(-2), severity: "high" },
  { id: "p2", kind: "approval", title: "Lote WhatsApp aguardando revisão", subtitle: "42 mensagens preparadas · campanha Junho", dueAt: offsetIso(0), severity: "medium" },
  { id: "p3", kind: "followup", title: "Diagnóstico — Studio Norte", subtitle: "Reunião comercial confirmada", dueAt: offsetIso(0, 14), severity: "medium" },
  { id: "p4", kind: "risk", title: "Cliente em risco — Ótica Vitrine", subtitle: "Saúde caiu para atenção · pagamento pendente", dueAt: offsetIso(-1), severity: "high" },
  { id: "p5", kind: "followup", title: "Proposta pendente — Marmoraria Vega", subtitle: "Enviada há 4 dias sem retorno", dueAt: offsetIso(0), severity: "medium" },
  { id: "p6", kind: "followup", title: "Kickoff — Clínica Origem", subtitle: "Onboarding do novo cliente", dueAt: offsetIso(1), severity: "medium" },
];

export const demoActivity: Array<{
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
  tone: "neutral" | "positive" | "warning" | "negative";
}> = [
  { id: "a1", actor: "Beatriz Rocha", action: "moveu para", target: "Ganho · Panificadora Sol", createdAt: new Date(Date.now() - 4 * 60_000).toISOString(), tone: "positive" },
  { id: "a2", actor: "Sistema", action: "importou", target: "218 novos registros · Google Maps", createdAt: new Date(Date.now() - 12 * 60_000).toISOString(), tone: "neutral" },
  { id: "a3", actor: "Diego Alves", action: "aprovou lote", target: "WhatsApp · 42 mensagens", createdAt: new Date(Date.now() - 27 * 60_000).toISOString(), tone: "neutral" },
  { id: "a4", actor: "Sistema", action: "sinalizou", target: "Cliente em risco · Ótica Vitrine", createdAt: new Date(Date.now() - 42 * 60_000).toISOString(), tone: "warning" },
  { id: "a5", actor: "Marina Prado", action: "registrou reunião com", target: "Studio Norte", createdAt: new Date(Date.now() - 61 * 60_000).toISOString(), tone: "neutral" },
  { id: "a6", actor: "Sistema", action: "encerrou", target: "Perda · Autoescola Rota (motivo: preço)", createdAt: new Date(Date.now() - 125 * 60_000).toISOString(), tone: "negative" },
];

export const demoHealth: Array<{
  key: "capture" | "pipeline" | "finance" | "retention";
  label: string;
  available: boolean;
  score: number;
  headline: string;
}> = health.map((domain) => ({
  key: domain.key as "capture" | "pipeline" | "finance" | "retention",
  label: domain.label,
  available: true,
  score: domain.score,
  headline: domain.headline,
}));

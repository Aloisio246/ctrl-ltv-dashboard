import type { Activity, Company, Contact, Opportunity, Prospect } from "@/lib/api-client";
import { parseDate } from "@/lib/format";

/**
 * Modelos de apresentação do Pipeline.
 * Só combina dados que já existem na API (oportunidade, prospect, empresa,
 * contato e atividade). Nenhum campo é inventado nem estimado.
 */
export type ActivityTiming = {
  label: string;
  tone: "danger" | "warning" | "info" | "neutral";
  overdueDays: number;
};

const DAY = 86_400_000;

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/** Rótulo compacto de prazo: "Hoje 14:30", "Amanhã", "Atrasada 2 dias". */
export function activityTiming(
  dueAt: string | null | undefined,
  now: Date = new Date(),
): ActivityTiming | null {
  const due = parseDate(dueAt);
  if (!due) return null;
  const diffDays = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / DAY);
  const time = timeFormatter.format(due);

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      label: days === 1 ? "Atrasada 1 dia" : `Atrasada ${days} dias`,
      tone: "danger",
      overdueDays: days,
    };
  }
  if (diffDays === 0) return { label: `Hoje ${time}`, tone: "warning", overdueDays: 0 };
  if (diffDays === 1) return { label: `Amanhã ${time}`, tone: "info", overdueDays: 0 };
  if (diffDays <= 7) return { label: `Em ${diffDays} dias`, tone: "neutral", overdueDays: 0 };
  return { label: shortDateFormatter.format(due), tone: "neutral", overdueDays: 0 };
}

export type OpportunityView = {
  opportunity: Opportunity;
  /** Nome principal exibido no card: contato, senão empresa. Nunca um ID. */
  title: string;
  /** Linha secundária: empresa quando o título já é a pessoa. */
  subtitle: string | null;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  amount: number;
  currency: string;
  ownerLabel: string | null;
  temperature: Prospect["temperature"] | null;
  score: number | null;
  contact: Contact | null;
  nextActivity: Activity | null;
  nextActivityTiming: ActivityTiming | null;
  expectedCloseAt: string | null;
  searchIndex: string;
};

export function buildOpportunityViews({
  opportunities,
  prospects,
  companies,
  contacts,
  activities,
  currentUserId,
  currentUserName,
}: {
  opportunities: Opportunity[];
  prospects: Prospect[];
  companies: Company[];
  contacts: Contact[];
  activities: Activity[];
  currentUserId?: string | null;
  currentUserName?: string | null;
}): Map<string, OpportunityView> {
  const prospectById = new Map(prospects.map((item) => [item.id, item]));
  const companyById = new Map(companies.map((item) => [item.id, item]));
  const contactsByCompany = new Map<string, Contact[]>();
  for (const contact of contacts) {
    const list = contactsByCompany.get(contact.companyId);
    if (list) list.push(contact);
    else contactsByCompany.set(contact.companyId, [contact]);
  }

  const pendingByOpportunity = new Map<string, Activity>();
  const pendingByProspect = new Map<string, Activity>();
  for (const activity of activities) {
    if (activity.status !== "pending") continue;
    const time = parseDate(activity.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (activity.opportunityId) {
      const current = pendingByOpportunity.get(activity.opportunityId);
      const currentTime = current
        ? (parseDate(current.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER)
        : Number.POSITIVE_INFINITY;
      if (time < currentTime) pendingByOpportunity.set(activity.opportunityId, activity);
    }
    if (activity.prospectId) {
      const current = pendingByProspect.get(activity.prospectId);
      const currentTime = current
        ? (parseDate(current.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER)
        : Number.POSITIVE_INFINITY;
      if (time < currentTime) pendingByProspect.set(activity.prospectId, activity);
    }
  }

  const views = new Map<string, OpportunityView>();
  for (const opportunity of opportunities) {
    const prospect = prospectById.get(opportunity.prospectId) ?? null;
    const company = prospect ? (companyById.get(prospect.companyId) ?? null) : null;
    const contact = prospect
      ? (contactsByCompany.get(prospect.companyId)?.[0] ?? null)
      : null;

    const title = contact?.name?.trim() || company?.name?.trim() || "Oportunidade sem identificação";
    const subtitle =
      contact?.name?.trim() && company?.name?.trim() && contact.name.trim() !== company.name.trim()
        ? company.name.trim()
        : (contact?.roleTitle?.trim() ?? null);

    const nextActivity =
      pendingByOpportunity.get(opportunity.id) ??
      (prospect ? (pendingByProspect.get(prospect.id) ?? null) : null);

    const ownerLabel =
      prospect?.ownerUserId && currentUserId && prospect.ownerUserId === currentUserId
        ? (currentUserName?.trim() || "Você")
        : null;

    views.set(opportunity.id, {
      opportunity,
      title,
      subtitle,
      phone: contact?.phone ?? company?.phone ?? null,
      email: contact?.email ?? null,
      companyName: company?.name ?? null,
      city: company?.city ?? null,
      state: company?.state ?? null,
      source: company?.source ?? null,
      amount: Number(opportunity.amount ?? 0),
      currency: opportunity.currency || "BRL",
      ownerLabel,
      temperature: prospect?.temperature ?? null,
      score: prospect?.score ?? null,
      contact,
      nextActivity,
      nextActivityTiming: activityTiming(nextActivity?.dueAt),
      expectedCloseAt: opportunity.expectedCloseAt,
      searchIndex: [
        title,
        subtitle,
        company?.name,
        contact?.phone,
        company?.phone,
        contact?.email,
        company?.city,
        company?.source,
        ownerLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    });
  }
  return views;
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  call: "Ligação",
  meeting: "Reunião",
  followup: "Follow-up",
  follow_up: "Follow-up",
  task: "Tarefa",
  proposal: "Proposta",
  email: "E-mail",
  whatsapp: "WhatsApp",
  note: "Anotação",
  visit: "Visita",
  billing: "Cobrança",
};

/** Tipo de atividade em português, sem expor identificadores técnicos. */
export function activityTypeLabel(value: string | null | undefined): string {
  if (!value) return "Atividade";
  return ACTIVITY_TYPE_LABELS[value.toLowerCase()] ?? value.replace(/_/g, " ");
}

export function formatCurrency(amount: number, currency = "BRL") {
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
}

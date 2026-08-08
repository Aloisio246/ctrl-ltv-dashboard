import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, RefreshCw, Search, User } from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  fetchActivities,
  fetchCompanies,
  fetchContacts,
  fetchMe,
  fetchOpportunities,
  fetchProspects,
  type Activity,
  type Company,
  type Contact,
  type Opportunity,
  type Prospect,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activityTiming, activityTypeLabel } from "@/lib/pipeline-view";
import { formatDateTime, parseDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const mod = getModule("activities")!;

type Bucket = "overdue" | "today" | "upcoming" | "completed";

const BUCKET_LABELS: Record<Bucket, string> = {
  overdue: "Atrasadas",
  today: "Hoje",
  upcoming: "Próximas",
  completed: "Concluídas",
};

export const Route = createFileRoute("/_shell/activities")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: `${mod.label} · Ctrl LTV` },
      { name: "description", content: mod.description },
      { property: "og:title", content: `${mod.label} · Ctrl LTV` },
      { property: "og:description", content: mod.description },
    ],
  }),
  component: ActivitiesPage,
});

function bucketOf(activity: Activity, now: Date): Bucket {
  if (activity.status !== "pending") return "completed";
  const due = parseDate(activity.dueAt);
  if (!due) return "upcoming";
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startTomorrow = new Date(startToday.getTime() + 86_400_000);
  if (due < startToday) return "overdue";
  if (due < startTomorrow) return "today";
  return "upcoming";
}

function ActivitiesPage() {
  const { q } = Route.useSearch();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState(q ?? "");
  const [bucket, setBucket] = useState<Bucket>("overdue");

  const load = useCallback(async () => {
    const [activityList, prospectList, companyList, contactList, opportunityList, meResult] =
      await Promise.all([
        fetchActivities(),
        fetchProspects(),
        fetchCompanies(),
        fetchContacts(),
        fetchOpportunities(),
        fetchMe(),
      ]);
    if (!activityList.ok) {
      setLoadError("Não foi possível carregar as atividades agora.");
      return;
    }
    setLoadError(null);
    setActivities(activityList.data);
    if (prospectList.ok) setProspects(prospectList.data);
    if (companyList.ok) setCompanies(companyList.data);
    if (contactList.ok) setContacts(contactList.data);
    if (opportunityList.ok) setOpportunities(opportunityList.data);
    if (meResult.ok) setMe({ id: meResult.data.user.id, name: meResult.data.user.displayName });
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const related = useMemo(() => {
    const companyById = new Map(companies.map((item) => [item.id, item]));
    const contactByCompany = new Map<string, Contact>();
    for (const contact of contacts) {
      if (!contactByCompany.has(contact.companyId))
        contactByCompany.set(contact.companyId, contact);
    }
    const prospectById = new Map(prospects.map((item) => [item.id, item]));
    const opportunityById = new Map(opportunities.map((item) => [item.id, item]));

    return (activity: Activity) => {
      const prospectId =
        activity.prospectId ??
        (activity.opportunityId
          ? (opportunityById.get(activity.opportunityId)?.prospectId ?? null)
          : null);
      const prospect = prospectId ? prospectById.get(prospectId) : undefined;
      if (!prospect) return null;
      const company = companyById.get(prospect.companyId);
      const contact = contactByCompany.get(prospect.companyId);
      const name = contact?.name?.trim() || company?.name?.trim();
      if (!name) return null;
      return {
        name,
        company: company?.name?.trim() ?? null,
        isOpportunity: Boolean(activity.opportunityId),
      };
    };
  }, [companies, contacts, prospects, opportunities]);

  const now = useMemo(() => new Date(), []);

  const enriched = useMemo(
    () =>
      activities.map((activity) => {
        const relation = related(activity);
        return {
          activity,
          relation,
          bucket: bucketOf(activity, now),
          timing: activityTiming(activity.dueAt, now),
          owner:
            activity.assignedUserId && me && activity.assignedUserId === me.id
              ? me.name || "Você"
              : null,
          index: [activity.title, activity.notes, relation?.name, relation?.company]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        };
      }),
    [activities, related, now, me],
  );

  const counts = useMemo(() => {
    const base: Record<Bucket, number> = { overdue: 0, today: 0, upcoming: 0, completed: 0 };
    for (const item of enriched) base[item.bucket] += 1;
    return base;
  }, [enriched]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enriched
      .filter((item) => item.bucket === bucket && (!term || item.index.includes(term)))
      .sort((a, b) => {
        const aTime = parseDate(a.activity.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bTime = parseDate(b.activity.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return bucket === "completed" ? bTime - aTime : aTime - bTime;
      });
  }, [enriched, bucket, search]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <CalendarClock aria-hidden="true" className="h-4 w-4" /> Operação
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {mod.label}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Agenda unificada de follow-ups, reuniões e propostas. Comece pelas atrasadas e pelas de
            hoje.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading || refreshing}>
          <RefreshCw
            aria-hidden="true"
            className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
          />
          {refreshing ? "Atualizando…" : "Atualizar"}
        </Button>
      </header>

      {!loading && !loadError && activities.length > 0 && (
        <div className="surface-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={bucket} onValueChange={(value) => setBucket(value as Bucket)}>
            <TabsList className="flex-wrap">
              {(Object.keys(BUCKET_LABELS) as Bucket[]).map((key) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {BUCKET_LABELS[key]}
                  <span className="ml-1.5 text-[10px] text-muted-foreground">{counts[key]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative lg:w-80">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, contato ou empresa"
              aria-label="Buscar atividades"
            />
          </div>
        </div>
      )}

      {loading && (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && loadError && (
        <ApiUnavailableState message={loadError} onRetry={() => void refresh()} />
      )}

      {!loading && !loadError && activities.length === 0 && (
        <EmptyState
          title="Nenhuma atividade cadastrada"
          description="Follow-ups e reuniões criados na operação aparecerão aqui."
        />
      )}

      {!loading && !loadError && activities.length > 0 && visible.length === 0 && (
        <EmptyState
          title={`Nenhuma atividade em “${BUCKET_LABELS[bucket]}”`}
          description="Troque a visão ou limpe a busca para ver outras atividades."
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                Limpar busca
              </Button>
            ) : undefined
          }
        />
      )}

      {!loading && !loadError && visible.length > 0 && (
        <ul className="grid list-none gap-3 md:grid-cols-2">
          {visible.map((item) => (
            <li key={item.activity.id}>
              <article className="surface-card h-full p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge label={activityTypeLabel(item.activity.type)} tone="neutral" />
                      <StatusBadge status={item.activity.status} />
                      {item.timing && item.activity.status === "pending" && (
                        <StatusBadge
                          label={item.timing.label}
                          tone={item.timing.tone === "neutral" ? "info" : item.timing.tone}
                        />
                      )}
                    </div>
                    <h2 className="mt-2 truncate font-medium text-foreground">
                      {item.activity.title}
                    </h2>
                    {item.relation && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.relation.isOpportunity ? "Oportunidade · " : "Contato · "}
                        {item.relation.name}
                        {item.relation.company && item.relation.company !== item.relation.name
                          ? ` · ${item.relation.company}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
                {item.activity.notes && (
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                    {item.activity.notes}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarClock aria-hidden="true" className="h-3.5 w-3.5 text-lime" />
                    {item.activity.status === "completed"
                      ? `Concluída em ${formatDateTime(item.activity.completedAt, "data não informada")}`
                      : formatDateTime(item.activity.dueAt, "sem prazo definido")}
                  </span>
                  {item.owner && (
                    <span className="flex items-center gap-1.5">
                      <User aria-hidden="true" className="h-3.5 w-3.5" />
                      {item.owner}
                    </span>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

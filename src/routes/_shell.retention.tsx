import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HeartPulse, ShieldAlert } from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  fetchClients,
  fetchCompanies,
  fetchHealthScores,
  type Client,
  type Company,
  type HealthScore,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";

const mod = getModule("retention")!;

export const Route = createFileRoute("/_shell/retention")({
  head: () => ({
    meta: [
      { title: `${mod.label} · Ctrl LTV` },
      { name: "description", content: mod.description },
      { property: "og:title", content: `${mod.label} · Ctrl LTV` },
      { property: "og:description", content: mod.description },
    ],
  }),
  component: RetentionPage,
});

function RetentionPage() {
  const [health, setHealth] = useState<HealthScore[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [healthResult, clientResult, companyResult] = await Promise.all([
        fetchHealthScores(),
        fetchClients(),
        fetchCompanies(),
      ]);
      if (!healthResult.ok) {
        setLoadError("Não foi possível carregar a saúde dos clientes agora.");
        setLoading(false);
        return;
      }
      setHealth(healthResult.data);
      if (clientResult.ok) setClients(clientResult.data);
      if (companyResult.ok) setCompanies(companyResult.data);
      setLoading(false);
    })();
  }, []);

  const nameByClientId = useMemo(() => {
    const companyName = new Map(companies.map((company) => [company.id, company.name]));
    const map = new Map<string, string>();
    for (const client of clients) {
      const name = client.companyId ? companyName.get(client.companyId) : undefined;
      if (name) map.set(client.id, name);
    }
    return map;
  }, [clients, companies]);

  const ordered = useMemo(() => [...health].sort((a, b) => a.score - b.score), [health]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
          <HeartPulse aria-hidden="true" className="h-4 w-4" /> Saúde e permanência
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{mod.label}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Identifique risco, acompanhe satisfação e proteja o LTV. Os clientes com menor score
          aparecem primeiro.
        </p>
      </header>

      {loading && <LoadingState label="Carregando saúde dos clientes…" />}
      {!loading && loadError && <ApiUnavailableState message={loadError} />}
      {!loading && !loadError && ordered.length === 0 && (
        <EmptyState
          title="Nenhum score de saúde registrado"
          description="A saúde será calculada conforme clientes e eventos forem registrados."
        />
      )}
      {!loading && !loadError && ordered.length > 0 && (
        <ul className="grid list-none gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ordered.map((item) => {
            const atRisk = item.score < 70;
            return (
              <li key={item.id}>
                <article className="surface-card h-full p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Cliente</div>
                      <h2 className="mt-1 truncate font-display text-lg font-semibold">
                        {nameByClientId.get(item.clientId) ?? "Cliente sem identificação"}
                      </h2>
                    </div>
                    <ShieldAlert
                      aria-hidden="true"
                      className={atRisk ? "shrink-0 text-warning" : "shrink-0 text-lime"}
                    />
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div className="font-display text-3xl font-bold text-lime">
                      {item.score}
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {item.reasons && item.reasons.length > 0
                      ? item.reasons.join(" · ")
                      : "Sem sinais de risco registrados"}
                  </p>
                  <p className="mt-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    Medido em {formatDate(item.measuredAt, "data não informada")}
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

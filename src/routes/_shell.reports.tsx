import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Target } from "lucide-react";
import { getModule } from "@/lib/modules";
import { fetchMetricsSummary, type MetricsSummary } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";

const mod = getModule("reports")!;
export const Route = createFileRoute("/_shell/reports")({ head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }] }), component: ReportsPage });

function ReportsPage() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchMetricsSummary().then((result) => result.ok ? setMetrics(result.data) : setError(result.error.message)); }, []);
  const money = (value: string | number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return <div className="space-y-6"><header><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><BarChart3 className="h-4 w-4" /> Decisões orientadas por dados</div><h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1><p className="mt-2 text-sm text-muted-foreground">Indicadores executivos da jornada completa de aquisição ao LTV.</p></header>{error && <ApiUnavailableState message={error} />}{!error && !metrics && <EmptyState title="Relatório sem dados" description="Os indicadores aparecerão quando houver movimento na operação." />}{metrics && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Clientes ativos", value: metrics.activeClients }, { label: "MRR", value: money(metrics.mrr) }, { label: "LTV médio", value: money(metrics.averageLtv) }, { label: "Cancelamentos no mês", value: metrics.cancelledThisMonth }].map((item) => <article key={item.label} className="surface-card p-5"><Target className="h-4 w-4 text-lime" /><div className="mt-4 text-xs text-muted-foreground">{item.label}</div><div className="mt-1 font-display text-2xl font-bold">{item.value}</div></article>)}</div>}</div>;
}

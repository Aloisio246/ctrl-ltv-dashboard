import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeartPulse, ShieldAlert } from "lucide-react";
import { getModule } from "@/lib/modules";
import { fetchHealthScores, type HealthScore } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";

const mod = getModule("retention")!;
export const Route = createFileRoute("/_shell/retention")({ head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }] }), component: RetentionPage });

function RetentionPage() {
  const [health, setHealth] = useState<HealthScore[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchHealthScores().then((result) => result.ok ? setHealth(result.data) : setError(result.error.message)); }, []);
  return <div className="space-y-6"><header><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><HeartPulse className="h-4 w-4" /> Saúde e permanência</div><h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1><p className="mt-2 text-sm text-muted-foreground">Identifique risco, acompanhe satisfação e proteja o LTV.</p></header>{error && <ApiUnavailableState message={error} />}{!error && health.length === 0 && <EmptyState title="Nenhum score de saúde registrado" description="A saúde será calculada conforme clientes e eventos forem registrados." />}{health.length > 0 && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{health.map((item) => <article key={item.id} className="surface-card p-5"><div className="flex items-start justify-between"><div><div className="text-xs text-muted-foreground">Cliente</div><h2 className="mt-1 font-display text-lg font-semibold">{item.clientId.slice(0, 8)}</h2></div><ShieldAlert className={item.score >= 70 ? "text-lime" : "text-amber-300"} /></div><div className="mt-5 flex items-end justify-between"><div className="font-display text-3xl font-bold text-lime">{item.score}<span className="text-sm text-muted-foreground">/100</span></div><span className="text-sm capitalize text-muted-foreground">{item.status}</span></div><p className="mt-4 text-xs text-muted-foreground">{item.reasons?.join(" · ") ?? "Sem sinais registrados"}</p></article>)}</div>}</div>;
}

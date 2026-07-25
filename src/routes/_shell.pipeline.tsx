import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, DollarSign } from "lucide-react";
import { getModule } from "@/lib/modules";
import { fetchOpportunities, fetchProspects, type Opportunity, type Prospect } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";

const mod = getModule("pipeline")!;

export const Route = createFileRoute("/_shell/pipeline")({
  head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }, { name: "description", content: mod.description }] }),
  component: PipelinePage,
});

function PipelinePage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { Promise.all([fetchOpportunities(), fetchProspects()]).then(([opportunities, prospectList]) => { if (!opportunities.ok || !prospectList.ok) setError("Não foi possível carregar o pipeline local."); else { setItems(opportunities.data); setProspects(prospectList.data); } }); }, []);
  const stages = ["new", "qualified", "proposal", "negotiation", "won", "lost"];
  const names = useMemo(() => new Map(prospects.map((item) => [item.id, item.id.slice(0, 8)])), [prospects]);
  return <div className="space-y-6"><header><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><BriefcaseBusiness className="h-4 w-4" /> Pipeline</div><h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1><p className="mt-2 text-sm text-muted-foreground">Acompanhe oportunidades da qualificação ao fechamento.</p></header>{error && <ApiUnavailableState message={error} />}{!error && items.length === 0 && <EmptyState title="Pipeline vazio" description="Crie uma oportunidade a partir de um prospect qualificado." />}{items.length > 0 && <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">{stages.map((stage) => <section key={stage} className="rounded-xl border border-border/60 bg-surface/40 p-3"><div className="flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-wider">{stage}</h2><span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">{items.filter((item) => item.stage === stage).length}</span></div><div className="mt-3 space-y-2">{items.filter((item) => item.stage === stage).map((item) => <article key={item.id} className="rounded-lg border border-border/50 bg-background/60 p-3"><div className="text-xs text-muted-foreground">Prospect {names.get(item.prospectId) ?? "—"}</div><div className="mt-2 flex items-center gap-1 text-sm font-semibold"><DollarSign className="h-3.5 w-3.5 text-lime" /> {Number(item.amount).toLocaleString("pt-BR", { style: "currency", currency: item.currency })}</div><div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">Próxima etapa <ArrowRight className="h-3 w-3" /></div></article>)}</div></section>)}</div>}</div>;
}

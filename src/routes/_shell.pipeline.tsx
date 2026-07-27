import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, DollarSign, Plus } from "lucide-react";
import { getModule } from "@/lib/modules";
import { createOpportunity, fetchOpportunities, fetchProspects, updateOpportunityStage, type Opportunity, type Prospect } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";

const mod = getModule("pipeline")!;
const stages = ["new", "qualified", "proposal", "negotiation", "won", "lost"] as const;

export const Route = createFileRoute("/_shell/pipeline")({
  head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }, { name: "description", content: mod.description }] }),
  component: PipelinePage,
});

function PipelinePage() {
  const [items, setItems] = useState<Opportunity[]>([]); const [prospects, setProspects] = useState<Prospect[]>([]); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const load = async () => { const [opportunities, prospectList] = await Promise.all([fetchOpportunities(), fetchProspects()]); if (!opportunities.ok || !prospectList.ok) setError("Não foi possível carregar o pipeline local."); else { setItems(opportunities.data); setProspects(prospectList.data); } };
  useEffect(() => { void load(); }, []);
  const names = useMemo(() => new Map(prospects.map((item) => [item.id, item.id.slice(0, 8)])), [prospects]);
  const createFromFirstProspect = async () => { const prospect = prospects[0]; if (!prospect) { setError("Crie ou promova um prospect antes de abrir uma oportunidade."); return; } setBusy(true); const result = await createOpportunity({ prospectId: prospect.id, stage: "new", amount: 0, currency: "BRL" }); if (!result.ok) setError(result.error.message); else setItems((current) => [result.data, ...current]); setBusy(false); };
  const move = async (item: Opportunity, stage: Opportunity["stage"]) => { setBusy(true); const result = await updateOpportunityStage(item.id, stage); if (!result.ok) setError(result.error.message); else setItems((current) => current.map((currentItem) => currentItem.id === item.id ? result.data : currentItem)); setBusy(false); };
  return <div className="space-y-6"><header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><BriefcaseBusiness className="h-4 w-4" /> Pipeline</div><h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1><p className="mt-2 text-sm text-muted-foreground">Acompanhe e mova oportunidades da qualificação ao fechamento.</p></div><Button onClick={() => void createFromFirstProspect()} disabled={busy}><Plus className="mr-2 h-4 w-4" /> Nova oportunidade</Button></header>{error && <ApiUnavailableState message={error} />}{!error && items.length === 0 && <EmptyState title="Pipeline vazio" description="Crie uma oportunidade a partir de um prospect qualificado." />}{items.length > 0 && <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">{stages.map((stage) => <section key={stage} className="rounded-xl border border-border/60 bg-surface/40 p-3"><div className="flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-wider">{stage}</h2><span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">{items.filter((item) => item.stage === stage).length}</span></div><div className="mt-3 space-y-2">{items.filter((item) => item.stage === stage).map((item) => <article key={item.id} className="rounded-lg border border-border/50 bg-background/60 p-3"><div className="text-xs text-muted-foreground">Prospect {names.get(item.prospectId) ?? "—"}</div><div className="mt-2 flex items-center gap-1 text-sm font-semibold"><DollarSign className="h-3.5 w-3.5 text-lime" /> {Number(item.amount).toLocaleString("pt-BR", { style: "currency", currency: item.currency })}</div><label className="mt-3 block text-[11px] text-muted-foreground">Mover etapa<AppSelect ariaLabel={`Etapa do prospect ${names.get(item.prospectId) ?? ""}`} value={item.stage} disabled={busy} onValueChange={(value) => void move(item, value as Opportunity["stage"])} className="mt-1" options={stages.map((stageOption) => ({ value: stageOption, label: stageOption }))} /></label><div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">Atualização auditada <ArrowRight className="h-3 w-3" /></div></article>)}</div></section>)}</div>}</div>;
}

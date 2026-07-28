import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, BriefcaseBusiness, DollarSign, Plus } from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  createOpportunity,
  fetchCompanies,
  fetchOpportunities,
  fetchProspects,
  updateOpportunityStage,
  type Company,
  type Opportunity,
  type Prospect,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toIsoDate } from "@/lib/format";

const mod = getModule("pipeline")!;
const stages = ["new", "qualified", "proposal", "negotiation", "won", "lost"] as const;
const stageLabels: Record<(typeof stages)[number], string> = {
  new: "Novo",
  qualified: "Qualificado",
  proposal: "Proposta",
  negotiation: "Negociação",
  won: "Ganho",
  lost: "Perdido",
};

export const Route = createFileRoute("/_shell/pipeline")({
  head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }, { name: "description", content: mod.description }] }),
  component: PipelinePage,
});

function PipelinePage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [selectedStage, setSelectedStage] = useState<Opportunity["stage"]>("new");
  const [amount, setAmount] = useState("");
  const [expectedCloseAt, setExpectedCloseAt] = useState("");

  async function load() {
    const [opportunities, prospectList, companyList] = await Promise.all([
      fetchOpportunities(),
      fetchProspects(),
      fetchCompanies(),
    ]);
    if (!opportunities.ok || !prospectList.ok || !companyList.ok) {
      setError("Não foi possível carregar o pipeline local.");
      return;
    }
    setError(null);
    setItems(opportunities.data);
    setProspects(prospectList.data);
    setCompanies(companyList.data);
    setSelectedProspectId((current) => current || prospectList.data[0]?.id || "");
  }

  useEffect(() => {
    void load();
  }, []);

  const companyById = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies]);
  const prospectById = useMemo(() => new Map(prospects.map((prospect) => [prospect.id, prospect])), [prospects]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProspectId) {
      setFormError("Selecione um prospect para abrir a oportunidade.");
      return;
    }
    setBusy(true);
    setFormError(null);
    const result = await createOpportunity({
      prospectId: selectedProspectId,
      stage: selectedStage,
      amount: Number(amount || 0),
      currency: "BRL",
      expectedCloseAt: toIsoDate(expectedCloseAt),
    });
    if (!result.ok) setFormError(result.error.message);
    else {
      setItems((current) => [result.data, ...current]);
      setShowForm(false);
      setAmount("");
      setExpectedCloseAt("");
      setSelectedStage("new");
    }
    setBusy(false);
  }

  async function move(item: Opportunity, stage: Opportunity["stage"]) {
    setBusy(true);
    const result = await updateOpportunityStage(item.id, stage);
    if (!result.ok) setError(result.error.message);
    else setItems((current) => current.map((currentItem) => currentItem.id === item.id ? result.data : currentItem));
    setBusy(false);
  }

  function prospectLabel(prospect: Prospect) {
    const company = companyById.get(prospect.companyId);
    return company?.name ?? `Prospect ${prospect.id.slice(0, 8)}`;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><BriefcaseBusiness className="h-4 w-4" /> Pipeline</div>
          <h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhe e mova oportunidades da qualificação ao fechamento.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm((current) => !current); }} disabled={busy || prospects.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Nova oportunidade
        </Button>
      </header>

      {showForm && (
        <form className="surface-card grid gap-4 p-5 md:grid-cols-2" onSubmit={handleCreate}>
          <div className="md:col-span-2">
            <h2 className="font-display text-lg font-semibold">Abrir oportunidade</h2>
            <p className="mt-1 text-sm text-muted-foreground">Escolha exatamente qual prospect entrará no Pipeline e informe o valor estimado.</p>
          </div>
          <label className="space-y-2 text-sm font-medium md:col-span-2">
            Prospect
            <AppSelect
              ariaLabel="Prospect da oportunidade"
              className="mt-2"
              value={selectedProspectId}
              onValueChange={setSelectedProspectId}
              placeholder="Selecione um prospect"
              options={prospects.map((prospect) => ({ value: prospect.id, label: prospectLabel(prospect) }))}
              required
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Etapa inicial
            <AppSelect
              ariaLabel="Etapa inicial da oportunidade"
              className="mt-2"
              value={selectedStage}
              onValueChange={(value) => setSelectedStage(value as Opportunity["stage"])}
              options={stages.map((stage) => ({ value: stage, label: stageLabels[stage] }))}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Valor estimado
            <Input className="mt-2" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Previsão de fechamento
            <Input className="mt-2" type="date" value={expectedCloseAt} onChange={(event) => setExpectedCloseAt(event.target.value)} />
          </label>
          {formError && <p className="text-sm text-destructive md:col-span-2">{formError}</p>}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Criar oportunidade"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      {error && <ApiUnavailableState message={error} />}
      {!error && items.length === 0 && <EmptyState title="Pipeline vazio" description={prospects.length ? "Abra uma oportunidade escolhendo um prospect acima." : "Cadastre um contato, envie-o para Prospects e depois abra uma oportunidade."} />}
      {items.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {stages.map((stage) => (
            <section key={stage} className="rounded-xl border border-border/60 bg-surface/40 p-3">
              <div className="flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-wider">{stageLabels[stage]}</h2><span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">{items.filter((item) => item.stage === stage).length}</span></div>
              <div className="mt-3 space-y-2">
                {items.filter((item) => item.stage === stage).map((item) => {
                  const prospect = prospectById.get(item.prospectId);
                  return <article key={item.id} className="rounded-lg border border-border/50 bg-background/60 p-3"><div className="text-xs text-muted-foreground">{prospect ? prospectLabel(prospect) : `Prospect ${item.prospectId.slice(0, 8)}`}</div><div className="mt-2 flex items-center gap-1 text-sm font-semibold"><DollarSign className="h-3.5 w-3.5 text-lime" /> {Number(item.amount).toLocaleString("pt-BR", { style: "currency", currency: item.currency })}</div><label className="mt-3 block text-[11px] text-muted-foreground">Mover etapa<AppSelect ariaLabel={`Etapa de ${prospect ? prospectLabel(prospect) : "oportunidade"}`} value={item.stage} disabled={busy} onValueChange={(value) => void move(item, value as Opportunity["stage"])} className="mt-1" options={stages.map((stageOption) => ({ value: stageOption, label: stageLabels[stageOption] }))} /></label><div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">Atualização auditada <ArrowRight className="h-3 w-3" /></div></article>;
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

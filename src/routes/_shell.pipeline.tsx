import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Plus,
  RefreshCw,
  RouteIcon,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  createOpportunity,
  createPipeline,
  createPipelineRoutingRule,
  deletePipelineRoutingRule,
  fetchActivities,
  fetchCompanies,
  fetchContacts,
  fetchMe,
  fetchOpportunities,
  fetchPipelineRoutingRules,
  fetchPipelines,
  fetchProspects,
  updateOpportunityStage,
  type Activity,
  type Company,
  type Contact,
  type Opportunity,
  type Pipeline,
  type PipelineRoutingConditions,
  type PipelineRoutingRule,
  type PipelineStage,
  type Prospect,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { Notice, type NoticeState } from "@/components/feedback";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toIsoDate } from "@/lib/format";
import { buildOpportunityViews, formatCurrency, type OpportunityView } from "@/lib/pipeline-view";
import { OpportunityCard } from "@/components/pipeline/opportunity-card";
import { OpportunityDrawer } from "@/components/pipeline/opportunity-drawer";
import { cn } from "@/lib/utils";

const mod = getModule("pipeline")!;
const defaultStages: Array<Omit<PipelineStage, "id" | "color">> = [
  { name: "Novo", position: 0, kind: "open" },
  { name: "Qualificado", position: 1, kind: "open" },
  { name: "Proposta", position: 2, kind: "open" },
  { name: "Negociação", position: 3, kind: "open" },
  { name: "Ganho", position: 4, kind: "won" },
  { name: "Perdido", position: 5, kind: "lost" },
];
const conditionFields: Array<{ value: keyof PipelineRoutingConditions; label: string }> = [
  { value: "source", label: "Origem" },
  { value: "campaign", label: "Campanha" },
  { value: "niche", label: "Nicho" },
  { value: "city", label: "Cidade" },
  { value: "state", label: "Estado" },
  { value: "serviceInterest", label: "Serviço de interesse" },
  { value: "contactType", label: "Tipo de contato" },
];

export const Route = createFileRoute("/_shell/pipeline")({
  head: () => ({
    meta: [
      { title: `${mod.label} · Ctrl LTV` },
      { name: "description", content: mod.description },
      { property: "og:title", content: `${mod.label} · Ctrl LTV` },
      { property: "og:description", content: mod.description },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [rules, setRules] = useState<PipelineRoutingRule[]>([]);
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [openOpportunityId, setOpenOpportunityId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [nextActionFilter, setNextActionFilter] = useState("all");
  const [mobileStageId, setMobileStageId] = useState("");
  const [panel, setPanel] = useState<"opportunity" | "pipeline" | "rules" | null>(null);
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [amount, setAmount] = useState("");
  const [expectedCloseAt, setExpectedCloseAt] = useState("");
  const [pipelineName, setPipelineName] = useState("");
  const [pipelineDescription, setPipelineDescription] = useState("");
  const [pipelineDefault, setPipelineDefault] = useState(false);
  const [stageDrafts, setStageDrafts] = useState(defaultStages.map((stage) => ({ ...stage })));
  const [ruleName, setRuleName] = useState("");
  const [rulePriority, setRulePriority] = useState("100");
  const [ruleField, setRuleField] = useState<keyof PipelineRoutingConditions>("source");
  const [ruleValue, setRuleValue] = useState("");
  const [rulePipelineId, setRulePipelineId] = useState("");
  const [ruleStageId, setRuleStageId] = useState("");

  const load = useCallback(async () => {
    const [
      opportunities,
      prospectList,
      companyList,
      contactList,
      activityList,
      pipelineList,
      routingRules,
      meResult,
    ] = await Promise.all([
      fetchOpportunities(),
      fetchProspects(),
      fetchCompanies(),
      fetchContacts(),
      fetchActivities(),
      fetchPipelines(),
      fetchPipelineRoutingRules(),
      fetchMe(),
    ]);
    if (
      !opportunities.ok ||
      !prospectList.ok ||
      !companyList.ok ||
      !pipelineList.ok ||
      !routingRules.ok
    ) {
      setError("Não foi possível carregar os Pipelines.");
      return;
    }
    setError(null);
    setItems(opportunities.data);
    setProspects(prospectList.data);
    setCompanies(companyList.data);
    if (contactList.ok) setContacts(contactList.data);
    if (activityList.ok) setActivities(activityList.data);
    if (meResult.ok) setMe({ id: meResult.data.user.id, name: meResult.data.user.displayName });
    setPipelines(pipelineList.data);
    setRules(routingRules.data);
    const initialPipeline =
      pipelineList.data.find((pipeline) => pipeline.isDefault && pipeline.status === "active") ??
      pipelineList.data.find((pipeline) => pipeline.status === "active");
    setSelectedPipelineId((current) => current || initialPipeline?.id || "");
    setSelectedProspectId((current) => current || prospectList.data[0]?.id || "");
    setRulePipelineId((current) => current || initialPipeline?.id || "");
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const selectedPipeline = pipelines.find((pipeline) => pipeline.id === selectedPipelineId);
  const rulePipeline = pipelines.find((pipeline) => pipeline.id === rulePipelineId);
  const activePipelines = pipelines.filter((pipeline) => pipeline.status === "active");
  const stages = useMemo(() => selectedPipeline?.stages ?? [], [selectedPipeline]);

  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );

  const views = useMemo(
    () =>
      buildOpportunityViews({
        opportunities: items,
        prospects,
        companies,
        contacts,
        activities,
        currentUserId: me?.id,
        currentUserName: me?.name,
      }),
    [items, prospects, companies, contacts, activities, me],
  );

  const visibleViews = useMemo(() => {
    const term = search.trim().toLowerCase();
    return Array.from(views.values()).filter((view) => {
      if (view.opportunity.pipelineId !== selectedPipelineId) return false;
      if (term && !view.searchIndex.includes(term)) return false;
      if (ownerFilter === "mine" && !view.ownerLabel) return false;
      if (ownerFilter === "unassigned" && view.ownerLabel) return false;
      if (nextActionFilter === "overdue" && view.nextActivityTiming?.tone !== "danger")
        return false;
      if (nextActionFilter === "none" && view.nextActivity) return false;
      return true;
    });
  }, [views, selectedPipelineId, search, ownerFilter, nextActionFilter]);

  const viewsByStage = useMemo(() => {
    const map = new Map<string, OpportunityView[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const view of visibleViews) {
      const list = map.get(view.opportunity.stageId);
      if (list) list.push(view);
    }
    return map;
  }, [stages, visibleViews]);

  useEffect(() => {
    setSelectedStageId(stages[0]?.id ?? "");
    setMobileStageId((current) =>
      stages.some((stage) => stage.id === current) ? current : (stages[0]?.id ?? ""),
    );
  }, [stages]);
  useEffect(() => {
    setRuleStageId(rulePipeline?.stages[0]?.id ?? "");
  }, [rulePipelineId, rulePipeline?.stages]);

  function prospectLabel(prospect: Prospect) {
    return companyById.get(prospect.companyId)?.name ?? `Prospect ${prospect.id.slice(0, 8)}`;
  }

  const move = useCallback(
    async (opportunityId: string, stageId: string, pipelineId?: string) => {
      const item = items.find((entry) => entry.id === opportunityId);
      if (!item) return;
      const targetPipeline = pipelineId ?? item.pipelineId;
      if (item.stageId === stageId && item.pipelineId === targetPipeline) return;
      if (movingId) return;
      setMovingId(opportunityId);
      setNotice(null);
      const previous = items;
      setItems((current) =>
        current.map((entry) =>
          entry.id === opportunityId ? { ...entry, stageId, pipelineId: targetPipeline } : entry,
        ),
      );
      const result = await updateOpportunityStage(opportunityId, stageId, targetPipeline);
      if (!result.ok) {
        setItems(previous);
        setNotice({
          tone: "error",
          message: `Não foi possível mover a oportunidade: ${result.error.message}`,
        });
      } else {
        setItems((current) =>
          current.map((entry) => (entry.id === opportunityId ? result.data : entry)),
        );
        const stageName = stages.find((stage) => stage.id === stageId)?.name ?? "nova etapa";
        setNotice({ tone: "success", message: `Oportunidade movida para “${stageName}”.` });
      }
      setMovingId(null);
    },
    [items, movingId, stages],
  );

  const handleDragStart = useCallback((event: DragEvent<HTMLElement>, id: string) => {
    event.dataTransfer.setData("text/opportunity-id", id);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverStageId(null);
  }, []);

  function drop(event: DragEvent<HTMLElement>, stageId: string) {
    event.preventDefault();
    setDragOverStageId(null);
    setDraggingId(null);
    const id = event.dataTransfer.getData("text/opportunity-id");
    if (id) void move(id, stageId);
  }

  async function handleCreateOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProspectId || !selectedPipeline || !selectedStageId) {
      setFormError("Selecione prospect, Pipeline e etapa.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setFormError(null);
    const result = await createOpportunity({
      prospectId: selectedProspectId,
      pipelineId: selectedPipeline.id,
      stageId: selectedStageId,
      amount: Number(amount || 0),
      currency: "BRL",
      expectedCloseAt: toIsoDate(expectedCloseAt),
    });
    if (!result.ok) setFormError(result.error.message);
    else {
      setItems((current) => [result.data, ...current]);
      setPanel(null);
      setAmount("");
      setExpectedCloseAt("");
      setNotice({ tone: "success", message: "Oportunidade criada no Pipeline." });
    }
    setBusy(false);
  }

  async function handleCreatePipeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError(null);
    const result = await createPipeline({
      name: pipelineName,
      description: pipelineDescription || undefined,
      isDefault: pipelineDefault,
      stages: stageDrafts.map((stage, position) => ({ ...stage, position })),
    });
    if (!result.ok) setFormError(result.error.message);
    else {
      setPipelines((current) => [
        ...current.map((pipeline) =>
          pipelineDefault ? { ...pipeline, isDefault: false } : pipeline,
        ),
        result.data,
      ]);
      setSelectedPipelineId(result.data.id);
      setPanel(null);
      setPipelineName("");
      setPipelineDescription("");
      setPipelineDefault(false);
      setStageDrafts(defaultStages.map((stage) => ({ ...stage })));
      setNotice({ tone: "success", message: "Pipeline criado." });
    }
    setBusy(false);
  }

  async function handleCreateRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rulePipelineId || !ruleStageId || !ruleValue.trim()) {
      setFormError("Defina condição, valor e destino da regra.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setFormError(null);
    const conditions = { [ruleField]: ruleValue.trim() } as PipelineRoutingConditions;
    const result = await createPipelineRoutingRule({
      name: ruleName,
      priority: Number(rulePriority || 100),
      active: true,
      conditions,
      pipelineId: rulePipelineId,
      stageId: ruleStageId,
    });
    if (!result.ok) setFormError(result.error.message);
    else {
      setRules((current) => [...current, result.data].sort((a, b) => a.priority - b.priority));
      setRuleName("");
      setRuleValue("");
    }
    setBusy(false);
  }

  async function removeRule(id: string) {
    if (busy) return;
    setBusy(true);
    const result = await deletePipelineRoutingRule(id);
    if (!result.ok) setFormError(result.error.message);
    else setRules((current) => current.filter((rule) => rule.id !== id));
    setBusy(false);
  }

  const openView = openOpportunityId ? (views.get(openOpportunityId) ?? null) : null;
  const filtersActive =
    search.trim().length > 0 || ownerFilter !== "all" || nextActionFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setOwnerFilter("all");
    setNextActionFilter("all");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" /> Pipeline
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Centro operacional comercial: acompanhe cada oportunidade, mova etapas e registre o
            próximo passo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void refresh()} disabled={refreshing || loading}>
            <RefreshCw
              aria-hidden="true"
              className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
            />
            {refreshing ? "Atualizando…" : "Atualizar"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPanel(panel === "rules" ? null : "rules");
              setFormError(null);
            }}
          >
            <RouteIcon aria-hidden="true" className="mr-2 h-4 w-4" /> Regras
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPanel(panel === "pipeline" ? null : "pipeline");
              setFormError(null);
            }}
          >
            <Settings2 aria-hidden="true" className="mr-2 h-4 w-4" /> Novo Pipeline
          </Button>
          <Button
            onClick={() => {
              setPanel(panel === "opportunity" ? null : "opportunity");
              setFormError(null);
            }}
            disabled={!prospects.length || !activePipelines.length}
          >
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" /> Nova oportunidade
          </Button>
        </div>
      </header>

      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      {activePipelines.length > 0 && (
        <div className="surface-card grid gap-3 p-4 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)_170px_190px]">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Processo
            <AppSelect
              ariaLabel="Pipeline atual"
              className="mt-2"
              value={selectedPipelineId}
              onValueChange={setSelectedPipelineId}
              options={activePipelines.map((pipeline) => ({
                value: pipeline.id,
                label: `${pipeline.name}${pipeline.isDefault ? " · padrão" : ""}`,
              }))}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Buscar
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, empresa, telefone ou responsável"
                aria-label="Buscar oportunidades"
              />
            </div>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Responsável
            <AppSelect
              ariaLabel="Filtrar por responsável"
              className="mt-2"
              value={ownerFilter}
              onValueChange={setOwnerFilter}
              options={[
                { value: "all", label: "Todos" },
                { value: "mine", label: "Minhas" },
                { value: "unassigned", label: "Sem responsável" },
              ]}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Próxima ação
            <AppSelect
              ariaLabel="Filtrar por próxima ação"
              className="mt-2"
              value={nextActionFilter}
              onValueChange={setNextActionFilter}
              options={[
                { value: "all", label: "Todas" },
                { value: "overdue", label: "Atrasadas" },
                { value: "none", label: "Sem próxima ação" },
              ]}
            />
          </label>
        </div>
      )}

      {panel === "pipeline" && (
        <form
          className="surface-card grid gap-4 p-5 md:grid-cols-2"
          onSubmit={handleCreatePipeline}
        >
          <div className="md:col-span-2">
            <h2 className="font-display text-lg font-semibold">Criar Pipeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O usuário define o processo e a ordem das etapas. Uma etapa deve representar ganho e
              outra perda.
            </p>
          </div>
          <label className="text-sm font-medium">
            Nome
            <Input
              className="mt-2"
              value={pipelineName}
              onChange={(event) => setPipelineName(event.target.value)}
              required
            />
          </label>
          <label className="text-sm font-medium">
            Descrição
            <Input
              className="mt-2"
              value={pipelineDescription}
              onChange={(event) => setPipelineDescription(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <Checkbox
              checked={pipelineDefault}
              onCheckedChange={(checked) => setPipelineDefault(checked === true)}
            />{" "}
            Usar como Pipeline padrão quando nenhuma regra combinar
          </label>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Etapas</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setStageDrafts((current) => [
                    ...current,
                    { name: `Etapa ${current.length + 1}`, position: current.length, kind: "open" },
                  ])
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            {stageDrafts.map((stage, index) => (
              <div
                key={`${index}-${stage.kind}`}
                className="grid gap-2 rounded-lg border border-border/60 p-3 md:grid-cols-[1fr_180px_auto]"
              >
                <Input
                  aria-label={`Nome da etapa ${index + 1}`}
                  value={stage.name}
                  onChange={(event) =>
                    setStageDrafts((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, name: event.target.value } : entry,
                      ),
                    )
                  }
                />
                <AppSelect
                  ariaLabel={`Tipo da etapa ${stage.name}`}
                  value={stage.kind}
                  onValueChange={(value) =>
                    setStageDrafts((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, kind: value as PipelineStage["kind"] }
                          : entry,
                      ),
                    )
                  }
                  options={[
                    { value: "open", label: "Em andamento" },
                    { value: "won", label: "Ganho" },
                    { value: "lost", label: "Perdido" },
                  ]}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={stageDrafts.length <= 2}
                  onClick={() =>
                    setStageDrafts((current) =>
                      current.filter((_, entryIndex) => entryIndex !== index),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {formError && <p className="text-sm text-destructive md:col-span-2">{formError}</p>}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Criando…" : "Criar Pipeline"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPanel(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {panel === "opportunity" && selectedPipeline && (
        <form
          className="surface-card grid gap-4 p-5 md:grid-cols-2"
          onSubmit={handleCreateOpportunity}
        >
          <div className="md:col-span-2">
            <h2 className="font-display text-lg font-semibold">Abrir oportunidade</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione o prospect e o processo comercial em que ele será trabalhado.
            </p>
          </div>
          <label className="text-sm font-medium md:col-span-2">
            Prospect
            <AppSelect
              ariaLabel="Prospect da oportunidade"
              className="mt-2"
              value={selectedProspectId}
              onValueChange={setSelectedProspectId}
              options={prospects.map((prospect) => ({
                value: prospect.id,
                label: prospectLabel(prospect),
              }))}
            />
          </label>
          <label className="text-sm font-medium">
            Pipeline
            <AppSelect
              ariaLabel="Pipeline da oportunidade"
              className="mt-2"
              value={selectedPipelineId}
              onValueChange={setSelectedPipelineId}
              options={activePipelines.map((pipeline) => ({
                value: pipeline.id,
                label: pipeline.name,
              }))}
            />
          </label>
          <label className="text-sm font-medium">
            Etapa inicial
            <AppSelect
              ariaLabel="Etapa inicial"
              className="mt-2"
              value={selectedStageId}
              onValueChange={setSelectedStageId}
              options={selectedPipeline.stages.map((stage) => ({
                value: stage.id,
                label: stage.name,
              }))}
            />
          </label>
          <label className="text-sm font-medium">
            Valor estimado
            <Input
              className="mt-2"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Previsão de fechamento
            <Input
              className="mt-2"
              type="date"
              value={expectedCloseAt}
              onChange={(event) => setExpectedCloseAt(event.target.value)}
            />
          </label>
          {formError && <p className="text-sm text-destructive md:col-span-2">{formError}</p>}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Criando…" : "Criar oportunidade"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPanel(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {panel === "rules" && (
        <section className="surface-card space-y-5 p-5">
          <div>
            <h2 className="font-display text-lg font-semibold">Distribuição automática</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              As regras são avaliadas da menor prioridade para a maior. A primeira compatível vence;
              sem correspondência, o Pipeline padrão é usado.
            </p>
          </div>
          <form className="grid gap-3 lg:grid-cols-6" onSubmit={handleCreateRule}>
            <Input
              aria-label="Nome da regra"
              placeholder="Nome da regra"
              value={ruleName}
              onChange={(event) => setRuleName(event.target.value)}
              required
            />
            <Input
              aria-label="Prioridade"
              type="number"
              min="0"
              placeholder="Prioridade"
              value={rulePriority}
              onChange={(event) => setRulePriority(event.target.value)}
            />
            <AppSelect
              ariaLabel="Campo da condição"
              value={ruleField}
              onValueChange={(value) => setRuleField(value as keyof PipelineRoutingConditions)}
              options={conditionFields}
            />
            <Input
              aria-label="Valor da condição"
              placeholder="Valor exato"
              value={ruleValue}
              onChange={(event) => setRuleValue(event.target.value)}
              required
            />
            <AppSelect
              ariaLabel="Pipeline de destino"
              value={rulePipelineId}
              onValueChange={setRulePipelineId}
              options={activePipelines.map((pipeline) => ({
                value: pipeline.id,
                label: pipeline.name,
              }))}
            />
            <AppSelect
              ariaLabel="Etapa de destino"
              value={ruleStageId}
              onValueChange={setRuleStageId}
              options={(rulePipeline?.stages ?? []).map((stage) => ({
                value: stage.id,
                label: stage.name,
              }))}
            />
            <div className="lg:col-span-6">
              <Button type="submit" disabled={busy}>
                {busy ? "Salvando…" : "Criar regra"}
              </Button>
            </div>
          </form>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="space-y-2">
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma regra criada. Os novos prospects usarão o Pipeline padrão.
              </p>
            ) : (
              rules.map((rule) => (
                <article
                  key={rule.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {rule.priority} · {rule.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Object.entries(rule.conditions)
                        .map(
                          ([key, value]) =>
                            `${conditionFields.find((field) => field.value === key)?.label ?? key} = ${value}`,
                        )
                        .join(" e ")}{" "}
                      <ArrowRight className="mx-1 inline h-3 w-3" />{" "}
                      {rule.pipelineName ??
                        pipelines.find((pipeline) => pipeline.id === rule.pipelineId)?.name}{" "}
                      /{" "}
                      {rule.stageName ??
                        rulePipeline?.stages.find((stage) => stage.id === rule.stageId)?.name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void removeRule(rule.id)}
                    disabled={busy}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                  </Button>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {loading && (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="min-w-72 flex-1 space-y-3 rounded-xl border border-border/60 bg-surface/40 p-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && <ApiUnavailableState message={error} onRetry={() => void refresh()} />}
      {!loading && !error && activePipelines.length === 0 && (
        <EmptyState
          title="Nenhum Pipeline criado"
          description="Crie o primeiro processo Kanban para organizar suas oportunidades."
          action={<Button onClick={() => setPanel("pipeline")}>Criar Pipeline</Button>}
        />
      )}

      {!loading && !error && selectedPipeline && visibleViews.length === 0 && filtersActive && (
        <EmptyState
          title="Nenhuma oportunidade para estes filtros"
          description="Ajuste a busca, o responsável ou o filtro de próxima ação."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          }
        />
      )}

      {!loading && !error && selectedPipeline && (
        <>
          {/* Desktop e tablet grande: Kanban horizontal */}
          <div className="hidden gap-3 overflow-x-auto pb-3 lg:flex">
            {stages.map((stage) => {
              const stageItems = viewsByStage.get(stage.id) ?? [];
              const total = stageItems.reduce((sum, view) => sum + view.amount, 0);
              return (
                <section
                  key={stage.id}
                  aria-label={`Etapa ${stage.name}`}
                  className={cn(
                    "min-h-64 w-72 shrink-0 rounded-xl border border-border/60 bg-surface/40 p-3 transition-colors",
                    dragOverStageId === stage.id && "border-lime/60 bg-lime/5",
                  )}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (dragOverStageId !== stage.id) setDragOverStageId(stage.id);
                  }}
                  onDragLeave={() =>
                    setDragOverStageId((current) => (current === stage.id ? null : current))
                  }
                  onDrop={(event) => drop(event, stage.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="min-w-0 truncate text-xs font-semibold uppercase tracking-wider">
                      {stage.name}
                    </h2>
                    <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                      {stageItems.length}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {total > 0 ? formatCurrency(total) : "Sem valor previsto"}
                  </p>
                  <div className="mt-3 space-y-2">
                    {stageItems.map((view) => (
                      <OpportunityCard
                        key={view.opportunity.id}
                        view={view}
                        stages={stages}
                        moving={movingId === view.opportunity.id}
                        dragging={draggingId === view.opportunity.id}
                        onOpen={setOpenOpportunityId}
                        onMove={(id, stageId) => void move(id, stageId)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                    {stageItems.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground">
                        Arraste uma oportunidade para cá
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Mobile e tablet: uma etapa por vez, sem Kanban apertado */}
          <div className="space-y-3 lg:hidden">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Etapa
              <AppSelect
                ariaLabel="Etapa exibida"
                className="mt-2"
                value={mobileStageId}
                onValueChange={setMobileStageId}
                options={stages.map((stage) => ({
                  value: stage.id,
                  label: `${stage.name} (${viewsByStage.get(stage.id)?.length ?? 0})`,
                }))}
              />
            </label>
            <div className="space-y-2">
              {(viewsByStage.get(mobileStageId) ?? []).map((view) => (
                <OpportunityCard
                  key={view.opportunity.id}
                  view={view}
                  stages={stages}
                  moving={movingId === view.opportunity.id}
                  dragging={false}
                  onOpen={setOpenOpportunityId}
                  onMove={(id, stageId) => void move(id, stageId)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
              {(viewsByStage.get(mobileStageId) ?? []).length === 0 && (
                <p className="rounded-lg border border-dashed border-border/60 p-5 text-center text-xs text-muted-foreground">
                  Nenhuma oportunidade nesta etapa.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <OpportunityDrawer
        view={openView}
        stages={stages}
        moving={movingId === openOpportunityId}
        onOpenChange={(open) => !open && setOpenOpportunityId(null)}
        onMove={(id, stageId) => void move(id, stageId)}
      />
    </div>
  );
}

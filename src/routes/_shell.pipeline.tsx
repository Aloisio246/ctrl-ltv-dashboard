import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  DollarSign,
  Plus,
  RouteIcon,
  Settings2,
  Trash2,
} from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  createOpportunity,
  createPipeline,
  createPipelineRoutingRule,
  deletePipelineRoutingRule,
  fetchCompanies,
  fetchOpportunities,
  fetchPipelineRoutingRules,
  fetchPipelines,
  fetchProspects,
  updateOpportunityStage,
  type Company,
  type Opportunity,
  type Pipeline,
  type PipelineRoutingConditions,
  type PipelineRoutingRule,
  type PipelineStage,
  type Prospect,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toIsoDate } from "@/lib/format";

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
    meta: [{ title: `${mod.label} · Ctrl LTV` }, { name: "description", content: mod.description }],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [rules, setRules] = useState<PipelineRoutingRule[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

  async function load() {
    const [opportunities, prospectList, companyList, pipelineList, routingRules] =
      await Promise.all([
        fetchOpportunities(),
        fetchProspects(),
        fetchCompanies(),
        fetchPipelines(),
        fetchPipelineRoutingRules(),
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
    setPipelines(pipelineList.data);
    setRules(routingRules.data);
    const initialPipeline =
      pipelineList.data.find((pipeline) => pipeline.isDefault && pipeline.status === "active") ??
      pipelineList.data.find((pipeline) => pipeline.status === "active");
    setSelectedPipelineId((current) => current || initialPipeline?.id || "");
    setSelectedProspectId((current) => current || prospectList.data[0]?.id || "");
    setRulePipelineId((current) => current || initialPipeline?.id || "");
  }

  useEffect(() => {
    void load();
  }, []);

  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );
  const prospectById = useMemo(
    () => new Map(prospects.map((prospect) => [prospect.id, prospect])),
    [prospects],
  );
  const selectedPipeline = pipelines.find((pipeline) => pipeline.id === selectedPipelineId);
  const rulePipeline = pipelines.find((pipeline) => pipeline.id === rulePipelineId);
  const activePipelines = pipelines.filter((pipeline) => pipeline.status === "active");

  useEffect(() => {
    setSelectedStageId(selectedPipeline?.stages[0]?.id ?? "");
  }, [selectedPipelineId, selectedPipeline?.stages]);
  useEffect(() => {
    setRuleStageId(rulePipeline?.stages[0]?.id ?? "");
  }, [rulePipelineId, rulePipeline?.stages]);

  function prospectLabel(prospect: Prospect) {
    return companyById.get(prospect.companyId)?.name ?? `Prospect ${prospect.id.slice(0, 8)}`;
  }

  async function handleCreateOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProspectId || !selectedPipeline || !selectedStageId) {
      setFormError("Selecione prospect, Pipeline e etapa.");
      return;
    }
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
    }
    setBusy(false);
  }

  async function handleCreatePipeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    }
    setBusy(false);
  }

  async function handleCreateRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rulePipelineId || !ruleStageId || !ruleValue.trim()) {
      setFormError("Defina condição, valor e destino da regra.");
      return;
    }
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
    setBusy(true);
    const result = await deletePipelineRoutingRule(id);
    if (!result.ok) setFormError(result.error.message);
    else setRules((current) => current.filter((rule) => rule.id !== id));
    setBusy(false);
  }

  async function move(item: Opportunity, stageId: string, pipelineId = selectedPipelineId) {
    if (item.stageId === stageId && item.pipelineId === pipelineId) return;
    setBusy(true);
    const previous = items;
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, stageId, pipelineId } : entry)),
    );
    const result = await updateOpportunityStage(item.id, stageId, pipelineId);
    if (!result.ok) {
      setItems(previous);
      setError(result.error.message);
    } else
      setItems((current) => current.map((entry) => (entry.id === item.id ? result.data : entry)));
    setBusy(false);
  }

  function drop(event: DragEvent<HTMLElement>, stageId: string) {
    event.preventDefault();
    const item = items.find(
      (entry) => entry.id === event.dataTransfer.getData("text/opportunity-id"),
    );
    if (item) void move(item, stageId);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <BriefcaseBusiness className="h-4 w-4" /> Pipeline
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie processos Kanban e direcione automaticamente os leads captados.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setPanel("rules");
              setFormError(null);
            }}
          >
            <RouteIcon className="mr-2 h-4 w-4" /> Regras
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPanel("pipeline");
              setFormError(null);
            }}
          >
            <Settings2 className="mr-2 h-4 w-4" /> Novo Pipeline
          </Button>
          <Button
            onClick={() => {
              setPanel("opportunity");
              setFormError(null);
            }}
            disabled={!prospects.length || !activePipelines.length}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova oportunidade
          </Button>
        </div>
      </header>

      {activePipelines.length > 0 && (
        <div className="surface-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Processo atual
            </p>
            <AppSelect
              ariaLabel="Pipeline atual"
              className="mt-2 min-w-64"
              value={selectedPipelineId}
              onValueChange={setSelectedPipelineId}
              options={activePipelines.map((pipeline) => ({
                value: pipeline.id,
                label: `${pipeline.name}${pipeline.isDefault ? " · padrão" : ""}`,
              }))}
            />
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            {selectedPipeline?.description ||
              "Use as etapas deste quadro para acompanhar o avanço das oportunidades."}
          </p>
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
              Criar oportunidade
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
                Criar regra
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

      {error && <ApiUnavailableState message={error} />}
      {!error && activePipelines.length === 0 && (
        <EmptyState
          title="Nenhum Pipeline criado"
          description="Crie o primeiro processo Kanban para organizar suas oportunidades."
        />
      )}
      {!error && selectedPipeline && (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {selectedPipeline.stages.map((stage) => {
            const stageItems = items.filter(
              (item) => item.pipelineId === selectedPipeline.id && item.stageId === stage.id,
            );
            return (
              <section
                key={stage.id}
                className="min-h-64 min-w-72 flex-1 rounded-xl border border-border/60 bg-surface/40 p-3"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => drop(event, stage.id)}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider">{stage.name}</h2>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                    {stageItems.length}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {stageItems.map((item) => {
                    const prospect = prospectById.get(item.prospectId);
                    return (
                      <article
                        key={item.id}
                        draggable
                        onDragStart={(event) =>
                          event.dataTransfer.setData("text/opportunity-id", item.id)
                        }
                        className="cursor-grab rounded-lg border border-border/50 bg-background/60 p-3 active:cursor-grabbing"
                      >
                        <div className="text-sm font-semibold">
                          {prospect
                            ? prospectLabel(prospect)
                            : `Prospect ${item.prospectId.slice(0, 8)}`}
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-sm">
                          <DollarSign className="h-3.5 w-3.5 text-lime" />{" "}
                          {Number(item.amount).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: item.currency,
                          })}
                        </div>
                        <label className="mt-3 block text-[11px] text-muted-foreground">
                          Mover etapa
                          <AppSelect
                            ariaLabel={`Etapa de ${prospect ? prospectLabel(prospect) : "oportunidade"}`}
                            value={item.stageId}
                            disabled={busy}
                            onValueChange={(value) => void move(item, value)}
                            className="mt-1"
                            options={selectedPipeline.stages.map((option) => ({
                              value: option.id,
                              label: option.name,
                            }))}
                          />
                        </label>
                        {item.routedByRuleId && (
                          <p className="mt-2 text-[10px] text-lime">Direcionado automaticamente</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

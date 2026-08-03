import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, HeartPulse, Pencil, Plus, Search, Sparkles } from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  createClient,
  fetchClientLtv,
  fetchClients,
  fetchCompanies,
  fetchContracts,
  createContract,
  updateClient,
  updateContract,
  type Client,
  type Company,
  type Contract,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toIsoDate } from "@/lib/format";

const mod = getModule("clients")!;
const statuses: Array<{ value: Client["status"]; label: string }> = [
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Ativo" },
  { value: "paused", label: "Pausado" },
  { value: "at_risk", label: "Em risco" },
  { value: "cancelled", label: "Cancelado" },
  { value: "closed", label: "Encerrado" },
];

export const Route = createFileRoute("/_shell/clients")({
  head: () => ({
    meta: [{ title: `${mod.label} · Ctrl LTV` }, { name: "description", content: mod.description }],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState<Client["status"]>("onboarding");
  const [startedAt, setStartedAt] = useState("");
  const [monthlyValue, setMonthlyValue] = useState("");
  const [billingDay, setBillingDay] = useState("");
  const [notes, setNotes] = useState("");
  const [ltvLoading, setLtvLoading] = useState<string | null>(null);
  const [ltv, setLtv] = useState<
    Record<
      string,
      {
        realizedRevenue: string;
        realizedCost: string;
        ltv: number;
        received: number;
        outstanding: number;
        monthsActive: number;
      }
    >
  >({});

  async function load() {
    const [clientResult, companyResult, contractResult] = await Promise.all([
      fetchClients(),
      fetchCompanies(),
      fetchContracts(),
    ]);
    if (!clientResult.ok || !companyResult.ok || !contractResult.ok) {
      setError("Não foi possível carregar os clientes locais.");
      return;
    }
    setError(null);
    setClients(clientResult.data);
    setCompanies(companyResult.data);
    setContracts(contractResult.data);
  }

  useEffect(() => {
    void load();
  }, []);

  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );
  const contractsByClient = useMemo(
    () => new Map(contracts.map((contract) => [contract.clientId, contract])),
    [contracts],
  );
  const visible = clients.filter((client) =>
    (companiesById.get(client.companyId ?? "")?.name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      setFormError("Selecione uma empresa para criar o cliente.");
      return;
    }
    if (status === "active" && (!monthlyValue || !billingDay)) {
      setFormError("Informe a mensalidade e o dia de vencimento do cliente ativo.");
      return;
    }
    if ((monthlyValue && !billingDay) || (!monthlyValue && billingDay)) {
      setFormError("Mensalidade e dia de vencimento devem ser informados juntos.");
      return;
    }
    setSaving(true);
    setFormError(null);
    if (editingClientId) {
      const result = await updateClient(editingClientId, {
        companyId,
        status,
        startedAt: toIsoDate(startedAt),
        notes: notes.trim(),
      });
      if (!result.ok) {
        setFormError(result.error.message);
        setSaving(false);
        return;
      }
      const existingContract = contractsByClient.get(editingClientId);
      if (monthlyValue && billingDay) {
        const contractResult = existingContract
          ? await updateContract(existingContract.id, {
              status:
                status === "active"
                  ? "active"
                  : status === "paused"
                    ? "paused"
                    : existingContract.status,
              startedAt: toIsoDate(startedAt),
              monthlyValue: Number(monthlyValue),
              billingDay: Number(billingDay),
              currency: "BRL",
            })
          : await createContract({
              clientId: editingClientId,
              status: status === "active" ? "active" : "draft",
              startedAt: toIsoDate(startedAt),
              monthlyValue: Number(monthlyValue),
              billingDay: Number(billingDay),
              currency: "BRL",
            });
        if (!contractResult.ok) {
          setFormError(contractResult.error.message);
          setSaving(false);
          return;
        }
      }
      setShowForm(false);
      setEditingClientId(null);
      setCompanyId("");
      setNotes("");
      setStartedAt("");
      setMonthlyValue("");
      setBillingDay("");
      await load();
      setSaving(false);
      return;
    }
    const result = await createClient({
      companyId,
      status,
      startedAt: toIsoDate(startedAt),
      notes: notes.trim() || undefined,
      monthlyValue: monthlyValue ? Number(monthlyValue) : undefined,
      billingDay: billingDay ? Number(billingDay) : undefined,
      currency: "BRL",
    });
    if (!result.ok) setFormError(result.error.message);
    else {
      setShowForm(false);
      setCompanyId("");
      setNotes("");
      setStartedAt("");
      setMonthlyValue("");
      setBillingDay("");
      await load();
    }
    setSaving(false);
  }

  function startEditing(client: Client) {
    const contract = contractsByClient.get(client.id);
    setEditingClientId(client.id);
    setCompanyId(client.companyId ?? "");
    setStatus(client.status);
    setStartedAt(client.startedAt ? client.startedAt.slice(0, 10) : "");
    setNotes(client.notes ?? "");
    setMonthlyValue(contract ? String(contract.monthlyValue) : "");
    setBillingDay(contract?.billingDay ? String(contract.billingDay) : "");
    setFormError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLtv(clientId: string) {
    setLtvLoading(clientId);
    const result = await fetchClientLtv(clientId);
    if (result.ok) setLtv((current) => ({ ...current, [clientId]: result.data }));
    setLtvLoading(null);
  }

  const money = (value: string | number) =>
    Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <Building2 className="h-4 w-4" /> Relacionamento
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Visão consolidada dos clientes, contratos e valor gerado.
          </p>
        </div>
        <Button onClick={() => setShowForm((current) => !current)}>
          <Plus /> Novo cliente
        </Button>
      </header>

      {showForm && (
        <form className="surface-card grid gap-4 p-5 md:grid-cols-2" onSubmit={handleCreate}>
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <Sparkles className="h-4 w-4 text-lime" />{" "}
              {editingClientId ? "Editar relacionamento" : "Abrir relacionamento"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Converta uma empresa qualificada em cliente sem recadastrar seus dados.
            </p>
          </div>
          <label className="space-y-2 text-sm font-medium">
            Empresa
            <AppSelect
              ariaLabel="Empresa do cliente"
              className="mt-2"
              value={companyId}
              onValueChange={setCompanyId}
              placeholder="Selecione uma empresa"
              options={companies.map((company) => ({ value: company.id, label: company.name }))}
              required
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {companies.length
                  ? "A empresa vem da sua base de Contatos."
                  : "Ainda não há empresas cadastradas."}
              </span>
              <Link to="/contacts" className="shrink-0 text-lime hover:underline">
                Cadastrar em Contatos
              </Link>
            </div>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Status
            <AppSelect
              ariaLabel="Status do cliente"
              className="mt-2"
              value={status}
              onValueChange={(value) => setStatus(value as Client["status"])}
              options={statuses}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Data de início
            <Input
              className="mt-2"
              type="date"
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Mensalidade {status === "active" && <span className="text-lime">*</span>}
            <Input
              className="mt-2"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={monthlyValue}
              onChange={(event) => setMonthlyValue(event.target.value)}
              placeholder="Ex.: 2500,00"
              required={status === "active"}
            />
            <span className="text-xs font-normal text-muted-foreground">
              Valor recorrente que será incluído no MRR.
            </span>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Dia do vencimento {status === "active" && <span className="text-lime">*</span>}
            <Input
              className="mt-2"
              type="number"
              min="1"
              max="31"
              inputMode="numeric"
              value={billingDay}
              onChange={(event) => setBillingDay(event.target.value)}
              placeholder="Ex.: 10"
              required={status === "active"}
            />
            <span className="text-xs font-normal text-muted-foreground">
              Usado para cobranças e lembretes mensais.
            </span>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Notas
            <Textarea
              className="mt-2"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Contexto do relacionamento"
            />
          </label>
          {formError && <p className="md:col-span-2 text-sm text-destructive">{formError}</p>}
          <div className="flex gap-2 md:col-span-2">
            <Button disabled={saving} type="submit">
              {saving ? "Salvando…" : editingClientId ? "Salvar alterações" : "Criar cliente"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setEditingClientId(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="surface-card relative p-4">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar cliente"
          className="pl-9"
        />
      </div>
      {error && <ApiUnavailableState message={error} />}
      {!error && visible.length === 0 && (
        <EmptyState
          title="Nenhum cliente encontrado"
          description="Clientes convertidos aparecerão aqui."
        />
      )}
      {visible.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((client) => {
            const company = companiesById.get(client.companyId ?? "");
            const contract = contractsByClient.get(client.id);
            const clientLtv = ltv[client.id];
            return (
              <article
                key={client.id}
                className="surface-card p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold">
                      {company?.name ?? "Cliente sem empresa"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {company?.city ?? "Local não informado"}
                    </p>
                  </div>
                  <HeartPulse
                    className={`h-5 w-5 ${client.status === "active" ? "text-lime" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="mt-1">
                      <StatusBadge status={client.status} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">MRR</div>
                    <div className="mt-1 font-medium">
                      {contract ? money(contract.monthlyValue) : "—"}
                    </div>
                  </div>
                </div>
                {clientLtv && (
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-lime/20 bg-lime/5 p-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">LTV</div>
                      <strong className="mt-1 block text-lime">{money(clientLtv.ltv)}</strong>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Recebido</div>
                      <strong className="mt-1 block">{money(clientLtv.received)}</strong>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Em aberto</div>
                      <strong className="mt-1 block text-amber-400">
                        {money(clientLtv.outstanding)}
                      </strong>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Meses ativos</div>
                      <strong className="mt-1 block">{clientLtv.monthsActive}</strong>
                    </div>
                  </div>
                )}
                <Button
                  className="mt-4 w-full"
                  size="sm"
                  variant="outline"
                  disabled={ltvLoading === client.id}
                  onClick={() => void handleLtv(client.id)}
                >
                  {ltvLoading === client.id
                    ? "Calculando…"
                    : clientLtv
                      ? "Atualizar LTV"
                      : "Ver LTV"}
                </Button>
                <Button
                  className="mt-2 w-full"
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(client)}
                >
                  <Pencil className="h-4 w-4" /> Editar cliente
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

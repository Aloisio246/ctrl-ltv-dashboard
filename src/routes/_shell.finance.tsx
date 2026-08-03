import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BellRing,
  CircleDollarSign,
  CreditCard,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Save,
  TrendingUp,
} from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  createContract,
  createCost,
  createInvoice,
  createPayment,
  fetchBillingReminderSettings,
  fetchClients,
  fetchCompanies,
  fetchContracts,
  fetchInvoices,
  fetchMetricsSummary,
  saveBillingReminderSettings,
  updateContract,
  type BillingReminderSettings,
  type Client,
  type Company,
  type Contract,
  type Invoice,
  type MetricsSummary,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState, LoadingState } from "@/components/states";
import { Notice, type NoticeState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { statusLabel } from "@/lib/status";
import { toIsoDate } from "@/lib/format";

const mod = getModule("finance")!;
const defaultReminderTemplate =
  "Olá, {{nome}}! A cobrança da {{empresa}} no valor de {{valor}} vence hoje, {{data}}. Acesse o link para pagamento: {{link_pagamento}}";
const defaultReminderSettings: BillingReminderSettings = {
  id: null,
  enabled: false,
  channel: "whatsapp",
  daysBeforeDue: 0,
  sendHour: 9,
  timezone: "America/Cuiaba",
  paymentProvider: "manual",
  template: defaultReminderTemplate,
};
export const Route = createFileRoute("/_shell/finance")({
  head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }] }),
  component: FinancePage,
});

function FinancePage() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [loading, setLoading] = useState(true);
  const [showContract, setShowContract] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [monthlyValue, setMonthlyValue] = useState("");
  const [setupFee, setSetupFee] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [billingDay, setBillingDay] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceClient, setInvoiceClient] = useState("");
  const [invoiceContract, setInvoiceContract] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [costClient, setCostClient] = useState("");
  const [costDescription, setCostDescription] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costCategory, setCostCategory] = useState("delivery");
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentSaving, setPaymentSaving] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [reminderSettings, setReminderSettings] =
    useState<BillingReminderSettings>(defaultReminderSettings);
  const [reminderSaving, setReminderSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [
      metricResult,
      clientResult,
      companyResult,
      contractResult,
      invoiceResult,
      reminderResult,
    ] = await Promise.all([
      fetchMetricsSummary(),
      fetchClients(),
      fetchCompanies(),
      fetchContracts(),
      fetchInvoices(),
      fetchBillingReminderSettings(),
    ]);
    setLoading(false);
    if (
      !metricResult.ok ||
      !clientResult.ok ||
      !companyResult.ok ||
      !contractResult.ok ||
      !invoiceResult.ok
    ) {
      setError("Não conseguimos carregar os dados financeiros agora. Tente novamente.");
      return;
    }
    setError(null);
    setMetrics(metricResult.data);
    setClients(clientResult.data);
    setCompanies(companyResult.data);
    setContracts(contractResult.data);
    setInvoices(invoiceResult.data);
    if (reminderResult.ok) setReminderSettings(reminderResult.data.settings);
  }

  useEffect(() => {
    void load();
  }, []);
  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );
  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );
  const clientName = (clientId: string) => {
    const client = clientsById.get(clientId);
    return companiesById.get(client?.companyId ?? "")?.name ?? "Cliente sem empresa";
  };
  const money = (value: string | number) =>
    Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function handleCreateContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setNotice(null);
    const result = editingContractId
      ? await updateContract(editingContractId, {
          startedAt: toIsoDate(startedAt),
          billingDay: billingDay ? Number(billingDay) : undefined,
          monthlyValue: Number(monthlyValue),
          setupFee: Number(setupFee || 0),
          currency: "BRL",
        })
      : await createContract({
          clientId: selectedClient,
          startedAt: toIsoDate(startedAt),
          billingDay: billingDay ? Number(billingDay) : undefined,
          monthlyValue: Number(monthlyValue),
          setupFee: Number(setupFee || 0),
          currency: "BRL",
        });
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      setNotice({
        tone: "success",
        message: editingContractId
          ? "Contrato atualizado."
          : "Contrato criado e incluído no MRR.",
      });
      setShowContract(false);
      setEditingContractId(null);
      setSelectedClient("");
      setMonthlyValue("");
      setSetupFee("");
      setStartedAt("");
      setBillingDay("");
      await load();
    }
    setSaving(false);
  }

  function startEditingContract(contract: Contract) {
    setEditingContractId(contract.id);
    setSelectedClient(contract.clientId);
    setMonthlyValue(String(contract.monthlyValue));
    setSetupFee(String(contract.setupFee ?? 0));
    setStartedAt(contract.startedAt ? contract.startedAt.slice(0, 10) : "");
    setBillingDay(contract.billingDay ? String(contract.billingDay) : "");
    setShowInvoice(false);
    setShowCost(false);
    setShowContract(true);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCreateInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setNotice(null);
    const result = await createInvoice({
      clientId: invoiceClient,
      contractId: invoiceContract || undefined,
      number: invoiceNumber,
      dueDate,
      subtotal: Number(subtotal),
      currency: "BRL",
      paymentProvider: paymentUrl ? "manual" : undefined,
      paymentUrl: paymentUrl || undefined,
    });
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      setNotice({ tone: "success", message: "Cobrança criada." });
      setShowInvoice(false);
      setInvoiceNumber("");
      setSubtotal("");
      setPaymentUrl("");
      setDueDate("");
      await load();
    }
    setSaving(false);
  }

  async function handleCreateCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setNotice(null);
    const result = await createCost({
      clientId: costClient || undefined,
      description: costDescription,
      amount: Number(costAmount),
      category: costCategory,
      incurredAt: new Date().toISOString(),
    });
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      setNotice({ tone: "success", message: "Custo registrado e refletido na margem." });
      setShowCost(false);
      setCostDescription("");
      setCostAmount("");
      await load();
    }
    setSaving(false);
  }

  async function handlePayment(invoice: Invoice) {
    if (paymentSaving) return;
    const amount = Number(paymentAmounts[invoice.id] || invoice.subtotal);
    setPaymentTarget(null);
    setPaymentSaving(invoice.id);
    setNotice(null);
    const result = await createPayment({ invoiceId: invoice.id, amount, method: "manual" });
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      setNotice({ tone: "success", message: `Pagamento de ${money(amount)} registrado.` });
      setPaymentAmounts((current) => ({ ...current, [invoice.id]: "" }));
      await load();
    }
    setPaymentSaving(null);
  }

  async function handleSaveReminderSettings() {
    if (reminderSaving) return;
    setReminderSaving(true);
    setNotice(null);
    const result = await saveBillingReminderSettings({
      enabled: reminderSettings.enabled,
      channel: reminderSettings.channel,
      daysBeforeDue: Number(reminderSettings.daysBeforeDue),
      sendHour: Number(reminderSettings.sendHour),
      timezone: reminderSettings.timezone,
      paymentProvider: reminderSettings.paymentProvider,
      template: reminderSettings.template,
    });
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      setReminderSettings(result.data);
      setNotice({
        tone: "success",
        message: result.data.enabled
          ? "Lembretes automáticos ativados com segurança."
          : "Lembretes automáticos desativados.",
      });
    }
    setReminderSaving(false);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <CircleDollarSign className="h-4 w-4" /> Receita e margem
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Separe receita da operação, custos e verba de mídia.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCost((current) => !current)}>
            <Receipt /> Custo
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowInvoice((current) => !current)}>
            <FileText /> Cobrança
          </Button>
          <Button size="sm" onClick={() => setShowContract((current) => !current)}>
            <Plus /> Contrato
          </Button>
        </div>
      </header>
      {error && <ApiUnavailableState message={error} />}
      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      <section className="surface-card border-lime/15 p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
              <BellRing className="h-4 w-4" /> Automação de recebimentos
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold">Lembrete de recebimento</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Ative o worker para preparar e disparar lembretes no dia configurado do contrato. O
              sistema não envia nada sem canal conectado e link de pagamento válido.
            </p>
          </div>
          <StatusBadge
            status={reminderSettings.enabled ? "active" : "disconnected"}
            label={reminderSettings.enabled ? "Ativo" : "Desativado"}
            className="self-start"
          />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface/40 p-3 text-sm font-medium">
              <Checkbox
                checked={reminderSettings.enabled}
                onCheckedChange={(checked) =>
                  setReminderSettings((current) => ({ ...current, enabled: checked === true }))
                }
              />
              Ativar disparo automático dos lembretes
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Canal de envio
                <AppSelect
                  ariaLabel="Canal de envio dos lembretes"
                  className="mt-2"
                  value={reminderSettings.channel}
                  onValueChange={(value) =>
                    setReminderSettings((current) => ({
                      ...current,
                      channel: value as BillingReminderSettings["channel"],
                    }))
                  }
                  options={[
                    { value: "whatsapp", label: "WhatsApp" },
                    { value: "email", label: "E-mail" },
                  ]}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Gerar link por
                <AppSelect
                  ariaLabel="Provedor de pagamento dos lembretes"
                  className="mt-2"
                  value={reminderSettings.paymentProvider}
                  onValueChange={(value) =>
                    setReminderSettings((current) => ({
                      ...current,
                      paymentProvider: value as BillingReminderSettings["paymentProvider"],
                    }))
                  }
                  options={[
                    { value: "manual", label: "Link manual / cobrança" },
                    { value: "asaas", label: "Asaas (futuro)" },
                  ]}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Dias antes do vencimento
                <Input
                  className="mt-2"
                  type="number"
                  min="0"
                  max="30"
                  value={reminderSettings.daysBeforeDue}
                  onChange={(event) =>
                    setReminderSettings((current) => ({
                      ...current,
                      daysBeforeDue: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Horário local do disparo
                <Input
                  className="mt-2"
                  type="number"
                  min="0"
                  max="23"
                  value={reminderSettings.sendHour}
                  onChange={(event) =>
                    setReminderSettings((current) => ({
                      ...current,
                      sendHour: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium">
              Mensagem padrão
              <Textarea
                className="mt-2 min-h-32"
                value={reminderSettings.template}
                onChange={(event) =>
                  setReminderSettings((current) => ({ ...current, template: event.target.value }))
                }
              />
            </label>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSaveReminderSettings()}
              disabled={reminderSaving}
            >
              <Save className="mr-2 h-3.5 w-3.5" />{" "}
              {reminderSaving ? "Salvando…" : "Salvar configuração"}
            </Button>
          </div>
          <div className="rounded-lg border border-border/60 bg-surface/40 p-4">
            <div className="text-sm font-semibold">Guia de personalização</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Use estas variáveis exatamente como estão na mensagem:
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div>
                <code className="text-lime">{"{{nome}}"}</code>
                <span className="ml-2 text-muted-foreground">nome do contato</span>
              </div>
              <div>
                <code className="text-lime">{"{{empresa}}"}</code>
                <span className="ml-2 text-muted-foreground">nome da empresa</span>
              </div>
              <div>
                <code className="text-lime">{"{{valor}}"}</code>
                <span className="ml-2 text-muted-foreground">valor do contrato/cobrança</span>
              </div>
              <div>
                <code className="text-lime">{"{{data}}"}</code>
                <span className="ml-2 text-muted-foreground">data de vencimento</span>
              </div>
              <div>
                <code className="text-lime">{"{{link_pagamento}}"}</code>
                <span className="ml-2 text-muted-foreground">link retornado pelo provedor</span>
              </div>
            </div>
            <p className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
              Para Asaas, ainda será necessário cadastrar a API Key e criar/associar a cobrança
              antes do link ser usado.
            </p>
          </div>
        </div>
      </section>

      {(showContract || showInvoice || showCost) && (
        <section className="surface-card p-5">
          {showContract && (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateContract}>
              <div className="md:col-span-2">
                <h2 className="font-display text-lg font-semibold">
                  {editingContractId ? "Editar contrato" : "Novo contrato"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  O valor recorrente entra no MRR após a criação.
                </p>
              </div>
              <label className="space-y-2 text-sm font-medium">
                Cliente
                <AppSelect
                  ariaLabel="Cliente do contrato"
                  className="mt-2"
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                  placeholder="Selecione um cliente"
                  options={clients.map((client) => ({
                    value: client.id,
                    label: `${clientName(client.id)} · ${client.status}`,
                  }))}
                  disabled={Boolean(editingContractId)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Mensalidade
                <Input
                  className="mt-2"
                  min="0"
                  step="0.01"
                  type="number"
                  value={monthlyValue}
                  onChange={(event) => setMonthlyValue(event.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Taxa de implantação
                <Input
                  className="mt-2"
                  min="0"
                  step="0.01"
                  type="number"
                  value={setupFee}
                  onChange={(event) => setSetupFee(event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Início
                <Input
                  className="mt-2"
                  type="date"
                  value={startedAt}
                  onChange={(event) => setStartedAt(event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Dia de recebimento
                <Input
                  className="mt-2"
                  type="number"
                  min="1"
                  max="31"
                  value={billingDay}
                  onChange={(event) => setBillingDay(event.target.value)}
                  placeholder="Ex.: 10"
                />
                <span className="text-xs font-normal text-muted-foreground">
                  Usado futuramente para programar o lembrete.
                </span>
              </label>
              <div className="flex gap-2 md:col-span-2">
                <Button disabled={saving} type="submit">
                  {saving
                    ? "Salvando…"
                    : editingContractId
                      ? "Salvar alterações"
                      : "Criar contrato"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowContract(false);
                    setEditingContractId(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
          {showInvoice && (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateInvoice}>
              <div className="md:col-span-2">
                <h2 className="font-display text-lg font-semibold">Nova cobrança</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Registre a cobrança da receita da operação, sem misturar mídia.
                </p>
              </div>
              <label className="space-y-2 text-sm font-medium">
                Cliente
                <AppSelect
                  ariaLabel="Cliente da cobrança"
                  className="mt-2"
                  value={invoiceClient}
                  onValueChange={setInvoiceClient}
                  placeholder="Selecione um cliente"
                  options={clients.map((client) => ({
                    value: client.id,
                    label: `${clientName(client.id)} · ${client.status}`,
                  }))}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Contrato (opcional)
                <AppSelect
                  ariaLabel="Contrato da cobrança"
                  className="mt-2"
                  value={invoiceContract}
                  onValueChange={setInvoiceContract}
                  placeholder="Sem contrato"
                  options={contracts
                    .filter((contract) => !invoiceClient || contract.clientId === invoiceClient)
                    .map((contract) => ({
                      value: contract.id,
                      label: `${clientName(contract.clientId)} · ${money(contract.monthlyValue)} / mês`,
                    }))}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Número
                <Input
                  className="mt-2"
                  value={invoiceNumber}
                  onChange={(event) => setInvoiceNumber(event.target.value)}
                  placeholder="FAT-2026-001"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Vencimento
                <Input
                  className="mt-2"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Valor
                <Input
                  className="mt-2"
                  min="0"
                  step="0.01"
                  type="number"
                  value={subtotal}
                  onChange={(event) => setSubtotal(event.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium md:col-span-2">
                Link de pagamento (opcional)
                <Input
                  className="mt-2"
                  type="url"
                  value={paymentUrl}
                  onChange={(event) => setPaymentUrl(event.target.value)}
                  placeholder="https://..."
                />
                <span className="text-xs font-normal text-muted-foreground">
                  Pode ser preenchido manualmente agora ou pelo Asaas quando a integração estiver
                  ativa.
                </span>
              </label>
              <div className="flex items-end gap-2">
                <Button disabled={saving} type="submit">
                  {saving ? "Salvando…" : "Criar cobrança"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowInvoice(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
          {showCost && (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateCost}>
              <div className="md:col-span-2">
                <h2 className="font-display text-lg font-semibold">Registrar custo</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Custos entram no cálculo de margem e LTV líquido.
                </p>
              </div>
              <label className="space-y-2 text-sm font-medium">
                Cliente (opcional)
                <AppSelect
                  ariaLabel="Cliente do custo"
                  className="mt-2"
                  value={costClient}
                  onValueChange={setCostClient}
                  placeholder="Custo geral da operação"
                  options={clients.map((client) => ({
                    value: client.id,
                    label: clientName(client.id),
                  }))}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Categoria
                <Input
                  className="mt-2"
                  value={costCategory}
                  onChange={(event) => setCostCategory(event.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Descrição
                <Input
                  className="mt-2"
                  value={costDescription}
                  onChange={(event) => setCostDescription(event.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Valor
                <Input
                  className="mt-2"
                  min="0"
                  step="0.01"
                  type="number"
                  value={costAmount}
                  onChange={(event) => setCostAmount(event.target.value)}
                  required
                />
              </label>
              <div className="flex gap-2 md:col-span-2">
                <Button disabled={saving} type="submit">
                  {saving ? "Salvando…" : "Registrar custo"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCost(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </section>
      )}

      {loading && !metrics && !error && <LoadingState label="Carregando dados financeiros…" />}
      {metrics && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "MRR", value: money(metrics.mrr) },
            { label: "Receita recebida", value: money(metrics.realizedRevenue) },
            { label: "Custos", value: money(metrics.realizedCost) },
            { label: "Margem", value: money(metrics.margin) },
          ].map((item) => (
            <article key={item.label} className="surface-card p-5">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="mt-2 font-display text-2xl font-bold">{item.value}</div>
            </article>
          ))}
        </div>
      )}
      {!error && !loading && contracts.length === 0 && invoices.length === 0 && (
        <EmptyState
          title="Nenhum movimento financeiro"
          description="Contratos e cobranças aparecerão nesta visão."
        />
      )}
      {contracts.length > 0 && (
        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-lime" />
            <h2 className="font-display text-lg font-semibold">Contratos</h2>
          </div>
          <div className="mt-4 space-y-2">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex flex-col gap-2 rounded-lg border border-border/50 bg-surface/40 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate">{clientName(contract.clientId)}</span>
                  <StatusBadge status={contract.status} />
                </span>
                <div className="flex items-center gap-3">
                  <strong>
                    {money(contract.monthlyValue)} / mês
                    {contract.billingDay ? ` · dia ${contract.billingDay}` : ""}
                  </strong>
                  <Button size="sm" variant="ghost" onClick={() => startEditingContract(contract)}>
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {invoices.length > 0 && (
        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-lime" />
            <h2 className="font-display text-lg font-semibold">Cobranças e recebimentos</h2>
          </div>
          <div className="mt-4 space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-lg border border-border/50 bg-surface/40 p-3 text-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate">
                      {clientName(invoice.clientId)} · {invoice.number}
                    </span>
                    <StatusBadge status={invoice.status} />
                  </span>
                  <strong>{money(invoice.subtotal)}</strong>
                </div>
                {invoice.status === "paid" || invoice.status === "void" ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Cobrança {statusLabel(invoice.status).toLowerCase()} — nenhuma ação pendente.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <label className="sr-only" htmlFor={`payment-${invoice.id}`}>
                      Valor recebido da cobrança {invoice.number}
                    </label>
                    <Input
                      id={`payment-${invoice.id}`}
                      className="sm:max-w-[180px]"
                      min="0"
                      step="0.01"
                      type="number"
                      placeholder={`Receber ${money(invoice.subtotal)}`}
                      value={paymentAmounts[invoice.id] ?? ""}
                      onChange={(event) =>
                        setPaymentAmounts((current) => ({
                          ...current,
                          [invoice.id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={paymentSaving !== null}
                      onClick={() => setPaymentTarget(invoice)}
                    >
                      {paymentSaving === invoice.id ? "Registrando…" : "Registrar pagamento"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CircleDollarSign, CreditCard, FileText, Plus, Receipt, TrendingUp } from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  createContract,
  createCost,
  createInvoice,
  createPayment,
  fetchClients,
  fetchContracts,
  fetchInvoices,
  fetchMetricsSummary,
  type Client,
  type Contract,
  type Invoice,
  type MetricsSummary,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { Input } from "@/components/ui/input";

const mod = getModule("finance")!;
function toIsoDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

export const Route = createFileRoute("/_shell/finance")({
  head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }] }),
  component: FinancePage,
});

function FinancePage() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showContract, setShowContract] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [monthlyValue, setMonthlyValue] = useState("");
  const [setupFee, setSetupFee] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceClient, setInvoiceClient] = useState("");
  const [invoiceContract, setInvoiceContract] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [costClient, setCostClient] = useState("");
  const [costDescription, setCostDescription] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costCategory, setCostCategory] = useState("delivery");
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentSaving, setPaymentSaving] = useState<string | null>(null);

  async function load() {
    const [metricResult, clientResult, contractResult, invoiceResult] = await Promise.all([
      fetchMetricsSummary(),
      fetchClients(),
      fetchContracts(),
      fetchInvoices(),
    ]);
    if (!metricResult.ok || !clientResult.ok || !contractResult.ok || !invoiceResult.ok) {
      setError("Não foi possível carregar o financeiro local.");
      return;
    }
    setError(null);
    setMetrics(metricResult.data);
    setClients(clientResult.data);
    setContracts(contractResult.data);
    setInvoices(invoiceResult.data);
  }

  useEffect(() => {
    void load();
  }, []);
  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );
  const money = (value: string | number) =>
    Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function handleCreateContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const result = await createContract({
      clientId: selectedClient,
      startedAt: toIsoDate(startedAt),
      monthlyValue: Number(monthlyValue),
      setupFee: Number(setupFee || 0),
      currency: "BRL",
    });
    if (!result.ok) setNotice(result.error.message);
    else {
      setNotice("Contrato criado e incluído no MRR.");
      setShowContract(false);
      setSelectedClient("");
      setMonthlyValue("");
      setSetupFee("");
      setStartedAt("");
      await load();
    }
    setSaving(false);
  }

  async function handleCreateInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const result = await createInvoice({
      clientId: invoiceClient,
      contractId: invoiceContract || undefined,
      number: invoiceNumber,
      dueDate,
      subtotal: Number(subtotal),
      currency: "BRL",
    });
    if (!result.ok) setNotice(result.error.message);
    else {
      setNotice("Cobrança criada.");
      setShowInvoice(false);
      setInvoiceNumber("");
      setSubtotal("");
      setDueDate("");
      await load();
    }
    setSaving(false);
  }

  async function handleCreateCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const result = await createCost({
      clientId: costClient || undefined,
      description: costDescription,
      amount: Number(costAmount),
      category: costCategory,
      incurredAt: new Date().toISOString(),
    });
    if (!result.ok) setNotice(result.error.message);
    else {
      setNotice("Custo registrado e refletido na margem.");
      setShowCost(false);
      setCostDescription("");
      setCostAmount("");
      await load();
    }
    setSaving(false);
  }

  async function handlePayment(invoice: Invoice) {
    const amount = Number(paymentAmounts[invoice.id] || invoice.subtotal);
    setPaymentSaving(invoice.id);
    setNotice(null);
    const result = await createPayment({ invoiceId: invoice.id, amount, method: "manual" });
    if (!result.ok) setNotice(result.error.message);
    else {
      setNotice(`Pagamento de ${money(amount)} registrado.`);
      setPaymentAmounts((current) => ({ ...current, [invoice.id]: "" }));
      await load();
    }
    setPaymentSaving(null);
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
      {notice && (
        <div className="rounded-lg border border-lime/20 bg-lime/5 px-4 py-3 text-sm text-lime">
          {notice}
        </div>
      )}

      {(showContract || showInvoice || showCost) && (
        <section className="surface-card p-5">
          {showContract && (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateContract}>
              <div className="md:col-span-2">
                <h2 className="font-display text-lg font-semibold">Novo contrato</h2>
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
                    label: `${client.id.slice(0, 8)} · ${client.status}`,
                  }))}
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
              <div className="flex gap-2 md:col-span-2">
                <Button disabled={saving} type="submit">
                  {saving ? "Salvando…" : "Criar contrato"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowContract(false)}>
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
                    label: `${client.id.slice(0, 8)} · ${client.status}`,
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
                      label: `${money(contract.monthlyValue)} / mês`,
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
                    label: client.id.slice(0, 8),
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
      {!error && contracts.length === 0 && invoices.length === 0 && (
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
                <span>
                  {clientsById.get(contract.clientId)?.id.slice(0, 8) ??
                    contract.clientId.slice(0, 8)}{" "}
                  · <span className="capitalize">{contract.status}</span>
                </span>
                <strong>{money(contract.monthlyValue)} / mês</strong>
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
                  <span>
                    {invoice.number} · <span className="capitalize">{invoice.status}</span>
                  </span>
                  <strong>{money(invoice.subtotal)}</strong>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
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
                    disabled={paymentSaving === invoice.id}
                    onClick={() => void handlePayment(invoice)}
                  >
                    {paymentSaving === invoice.id ? "Registrando…" : "Registrar pagamento"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

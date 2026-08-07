import { createFileRoute } from "@tanstack/react-router";
import { getModule } from "@/lib/modules";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Check, Database, FileUp, Loader2, Play, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchCaptureRecords,
  fetchCaptureRuns,
  fetchIntegrations,
  createCaptureRun,
  importCaptureRecords,
  promoteCaptureRecord,
  reviewCaptureRecord,
  type CaptureRecord,
  type CaptureRun,
  type Integration,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState, LoadingState } from "@/components/states";
import { Notice, type NoticeState } from "@/components/feedback";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import { motion as m } from "@/lib/motion";

const mod = getModule("capture")!;

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = ""; continue;
    }
    cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = (rows.shift() ?? []).map((header) => header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const find = (record: string[], names: string[]) => {
    const position = headers.findIndex((header) => names.includes(header));
    return position >= 0 ? record[position] || undefined : undefined;
  };
  return rows.map((record) => ({
    name: find(record, ["name", "nome", "empresa", "company"]) ?? "",
    website: find(record, ["website", "site", "url"]),
    phone: find(record, ["phone", "telefone", "whatsapp"]),
    email: find(record, ["email", "e-mail"]),
    city: find(record, ["city", "cidade"]),
    state: find(record, ["state", "estado", "uf"]),
    country: find(record, ["country", "pais"]) ?? "BR",
    sourceUrl: find(record, ["sourceurl", "source_url", "maps", "googlemaps"]),
    rating: Number(find(record, ["rating", "nota"])) || undefined,
    reviewCount: Number(find(record, ["reviewcount", "reviews", "avaliacoes"])) || undefined,
  })).filter((record) => record.name.length >= 2);
}

export const Route = createFileRoute("/_shell/capture")({
  head: () => ({
    meta: [
      { title: `${mod.label} · Ctrl LTV` },
      { name: "description", content: mod.description },
      { property: "og:title", content: `${mod.label} · Ctrl LTV` },
      { property: "og:description", content: mod.description },
    ],
  }),
  component: CapturePage,
});

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CapturePage() {
  const [runs, setRuns] = useState<CaptureRun[]>([]);
  const [records, setRecords] = useState<CaptureRecord[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [source, setSource] = useState("google_places");
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [limit, setLimit] = useState(20);
  const [verifyWhatsAppExists, setVerifyWhatsAppExists] = useState(false);
  const [extractContacts, setExtractContacts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  const load = async () => {
    const [runsResult, recordsResult] = await Promise.all([fetchCaptureRuns(), fetchCaptureRecords()]);
    if (!runsResult.ok || !recordsResult.ok) {
      setLoadError("Não foi possível carregar a captação agora. Tente novamente em instantes.");
      setLoading(false);
      return;
    }
    setLoadError(null);
    setRuns(runsResult.data);
    setRecords(recordsResult.data);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    void fetchIntegrations().then((result) => {
      if (result.ok) {
        setIntegrations(result.data);
        const firstConfigured = result.data.find((item) => item.hasCredentials && item.status === "configured");
        if (firstConfigured) setSource(firstConfigured.provider);
        else setSource("manual");
      }
    });
  }, []);

  const runningRuns = useMemo(() => runs.filter((run) => run.status === "running"), [runs]);

  useEffect(() => {
    if (runningRuns.length === 0) return;
    const timer = window.setInterval(() => { void load(); }, 2000);
    return () => window.clearInterval(timer);
  }, [runningRuns.length]);

  const counts = useMemo(() => ({
    total: records.length,
    pending: records.filter((record) => record.status === "pending").length,
    approved: records.filter((record) => record.status === "approved").length,
    promoted: records.filter((record) => record.status === "promoted").length,
  }), [records]);

  const failedRuns = useMemo(() => runs.filter((run) => run.status === "failed").length, [runs]);

  const runCapture = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    const result = await createCaptureRun({ source, query: query || undefined, niche: niche || undefined, city: city || undefined, region: region || undefined, limit, verifyWhatsAppExists, extractEmailsAndContacts: extractContacts });
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      await load();
      setNotice({ tone: "success", message: "Execução iniciada. Os registros aparecem conforme forem coletados." });
    }
    setBusy(false);
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const recordsToImport = parseCsv(await file.text());
      if (recordsToImport.length === 0) throw new Error("O CSV precisa ter uma coluna Nome ou Empresa e pelo menos um registro.");
      const result = await importCaptureRecords({ source: "csv", records: recordsToImport });
      if (!result.ok) setNotice({ tone: "error", message: result.error.message });
      else {
        await load();
        setNotice({ tone: "success", message: `${recordsToImport.length} registro(s) importados do CSV.` });
      }
    } catch (importError) {
      setNotice({ tone: "error", message: importError instanceof Error ? importError.message : "Não foi possível importar o CSV." });
    } finally {
      setBusy(false);
    }
  };

  const sourceOptions = [
    ["google_places", "Google Maps / Places"],
    ["serper", "Serper"],
    ["rapidapi", "RapidAPI"],
    ["apify", "Apify"],
    ["manual", "Manual"],
  ] as const;
  const isConfigured = (provider: string) => provider === "manual" || integrations.some((item) => item.provider === provider && item.hasCredentials && item.status === "configured");

  const review = async (record: CaptureRecord, status: "approved" | "rejected") => {
    if (busyRecordId) return;
    setBusyRecordId(record.id);
    setNotice(null);
    const result = await reviewCaptureRecord(record.id, status);
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      setRecords((current) => current.map((item) => item.id === record.id ? { ...item, status } : item));
      setNotice({ tone: "success", message: status === "approved" ? `${record.name} aprovado para prospecção.` : `${record.name} descartado.` });
    }
    setBusyRecordId(null);
  };

  const promote = async (record: CaptureRecord) => {
    if (busyRecordId) return;
    setBusyRecordId(record.id);
    setNotice(null);
    const result = await promoteCaptureRecord(record.id);
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      setRecords((current) => current.map((item) => item.id === record.id ? { ...item, status: "promoted", companyId: result.data.company.id } : item));
      setNotice({ tone: "success", message: `${record.name} virou prospect.` });
    }
    setBusyRecordId(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <Sparkles aria-hidden="true" className="h-4 w-4" /> Captação
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{mod.label}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Colete, revise e promova oportunidades para o funil comercial.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border/70 px-3 py-2 text-sm transition hover:border-lime/50 hover:text-lime focus-within:ring-2 focus-within:ring-ring">
            <FileUp aria-hidden="true" className="mr-2 h-4 w-4" /> Importar CSV
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void importCsv(event)} disabled={busy} />
          </label>
          <Button onClick={() => void runCapture()} disabled={busy}>
            {busy ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : <Play aria-hidden="true" className="mr-2 h-4 w-4" />}
            Nova captação
          </Button>
        </div>
      </header>

      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Registros", value: counts.total },
          { label: "Aguardando análise", value: counts.pending },
          { label: "Aprovados", value: counts.approved },
          { label: "Promovidos", value: counts.promoted },
        ].map((item) => (
          <div key={item.label} className="surface-card p-4">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="mt-2 font-display text-2xl font-bold">{item.value}</div>
          </div>
        ))}
      </div>

      <section className="surface-card p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Iniciar execução</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina o alvo da busca. O processamento acontece no backend e os registros chegam para revisão.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Consulta livre" htmlFor="capture-query" hint="Opcional. Ex.: clínicas em Cuiabá.">
            <Input id="capture-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="clínicas em Cuiabá" />
          </Field>
          <Field label="Nicho" htmlFor="capture-niche" hint="Segmento buscado.">
            <Input id="capture-niche" value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="clínicas de estética" />
          </Field>
          <Field label="Cidade" htmlFor="capture-city">
            <Input id="capture-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Cuiabá" />
          </Field>
          <Field label="Estado ou região" htmlFor="capture-region" hint="UF ou região de busca.">
            <Input id="capture-region" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="MT" />
          </Field>
          <Field label="Limite de registros" htmlFor="capture-limit" hint="Entre 1 e 100 por execução.">
            <Input id="capture-limit" type="number" min={1} max={100} value={limit} onChange={(event) => setLimit(Math.max(1, Math.min(100, Number(event.target.value) || 20)))} />
          </Field>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Fonte da captação</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            Fontes sem integração configurada ficam indisponíveis até você salvar as credenciais em Configurações.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {sourceOptions.map(([value, label]) => {
              const available = isConfigured(value);
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!available}
                  aria-pressed={source === value}
                  onClick={() => setSource(value)}
                  title={!available ? "Configure esta fonte em Configurações" : undefined}
                  className={`rounded-lg border px-3 py-2 text-xs transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${source === value ? "border-lime/60 bg-lime/10 text-lime" : available ? "border-border/60 text-muted-foreground hover:border-lime/30" : "cursor-not-allowed border-border/40 text-muted-foreground/50"}`}
                >
                  {label}
                  {value !== "manual" && !available ? " · requer configuração" : ""}
                </button>
              );
            })}
            <a href="/settings" className="text-xs text-lime hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              Configurar fontes
            </a>
          </div>
        </fieldset>

        <div className="mt-5 flex flex-wrap items-start gap-x-6 gap-y-3 text-xs text-muted-foreground">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={extractContacts} onChange={(event) => setExtractContacts(event.target.checked)} className="mt-0.5 accent-lime" disabled={source !== "rapidapi"} />
            <span>
              Extrair e-mails e contatos
              <span className="block text-[11px] text-muted-foreground/70">Disponível apenas para RapidAPI.</span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={verifyWhatsAppExists} onChange={(event) => setVerifyWhatsAppExists(event.target.checked)} className="mt-0.5 accent-lime" />
            <span>
              Verificar WhatsApp quando disponível
              <span className="block text-[11px] text-muted-foreground/70">Requer fonte que retorne telefone.</span>
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Quantidade rápida:</span>
          {[10, 25, 50, 100].map((amount) => (
            <button
              key={amount}
              type="button"
              aria-pressed={limit === amount}
              onClick={() => setLimit(amount)}
              className={`rounded-md border px-2.5 py-1 text-xs transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${limit === amount ? "border-lime/60 bg-lime/10 text-lime" : "border-border/60 text-muted-foreground hover:border-lime/30"}`}
            >
              {amount}
            </button>
          ))}
        </div>

        {busy && (
          <p aria-live="polite" className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-lime" /> Processando ação…
          </p>
        )}
        {runningRuns.length > 0 && (
          <p aria-live="polite" className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-lime" />
            {runningRuns.length} execução(ões) em andamento. A lista atualiza automaticamente.
          </p>
        )}
        {failedRuns > 0 && (
          <p className="mt-3 text-xs text-danger">
            {failedRuns} execução(ões) falharam. Veja o motivo na lista de execuções abaixo.
          </p>
        )}
      </section>

      {loading && <LoadingState label="Carregando registros de captação…" />}
      {!loading && loadError && <ApiUnavailableState message={loadError} onRetry={() => void load()} />}
      {!loading && !loadError && records.length === 0 && (
        <EmptyState
          title="Nenhum registro capturado"
          description="Inicie uma execução ou importe um CSV para começar a revisão."
        />
      )}

      {!loading && !loadError && records.length > 0 && (
        <section className="surface-card overflow-hidden">
          <div className="border-b border-border/60 p-5">
            <h2 className="font-display text-lg font-semibold">Registros para revisão</h2>
            <p className="text-sm text-muted-foreground">
              Cada registro precisa ser aprovado antes de virar prospect.
            </p>
          </div>
          <ul className="list-none divide-y divide-border/50">
            {records.map((record, index) => {
              const recordBusy = busyRecordId === record.id;
              return (
                <li key={record.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: m.duration.base, ease: m.ease.enter, delay: index * 0.03 }}
                    className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">{record.name}</h3>
                        <StatusBadge status={record.status} />
                        {typeof record.qualityScore === "number" && (
                          <span className="rounded-full bg-lime/10 px-2 py-0.5 text-[11px] font-semibold text-lime">
                            score {record.qualityScore}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[record.city, record.state].filter(Boolean).join(" · ") || "Local não informado"}
                        {record.phone ? ` · ${record.phone}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {record.websiteAudit?.online ? "site auditado" : record.website ? "site identificado" : "sem site identificado"}
                        {record.websiteAudit?.opportunities && Array.isArray(record.websiteAudit.opportunities) && record.websiteAudit.opportunities.length > 0
                          ? ` · ${record.websiteAudit.opportunities.length} oportunidade(s)`
                          : ""}
                        {record.sourceUrl && (
                          <>
                            <span> · </span>
                            <a className="text-lime hover:underline" href={record.sourceUrl} target="_blank" rel="noreferrer">
                              fonte externa
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {record.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => void review(record, "rejected")} disabled={recordBusy || busyRecordId !== null}>
                            <X aria-hidden="true" className="mr-1 h-3.5 w-3.5" /> Descartar
                          </Button>
                          <Button size="sm" onClick={() => void review(record, "approved")} disabled={recordBusy || busyRecordId !== null}>
                            <Check aria-hidden="true" className="mr-1 h-3.5 w-3.5" /> Aprovar
                          </Button>
                        </>
                      )}
                      {record.status === "approved" && (
                        <Button size="sm" onClick={() => void promote(record)} disabled={recordBusy || busyRecordId !== null}>
                          <Search aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
                          {recordBusy ? "Promovendo…" : "Promover para prospect"}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <Database aria-hidden="true" className="h-4 w-4 text-lime" />
          <h2 className="font-display text-lg font-semibold">Execuções recentes</h2>
        </div>
        <div className="mt-4 space-y-2">
          {loading ? (
            <LoadingState label="Carregando execuções…" />
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
          ) : (
            runs.map((run) => {
              const runError = typeof run.metadata?.error === "string" ? run.metadata.error : null;
              return (
                <div key={run.id} className="flex flex-col gap-2 rounded-lg border border-border/50 bg-surface/40 p-3 text-sm md:flex-row md:items-center md:justify-between">
                  <span className="min-w-0 truncate font-medium">
                    {run.source}
                    {run.query ? ` · ${run.query}` : ""}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={run.status} />
                    <span>{run.totalFound} encontrados</span>
                    <span>· {formatDateTime(run.createdAt)}</span>
                  </div>
                  {runError && (
                    <p className="text-xs text-danger md:basis-full">Motivo da falha: {runError}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

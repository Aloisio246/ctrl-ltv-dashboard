import { createFileRoute } from "@tanstack/react-router";
import { getModule } from "@/lib/modules";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Database, Loader2, Play, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCaptureRecords, fetchCaptureRuns, createCaptureRun, promoteCaptureRecord, reviewCaptureRecord, type CaptureRecord, type CaptureRun } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState, LoadingState } from "@/components/states";
import { motion as m } from "@/lib/motion";

const mod = getModule("capture")!;

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

function CapturePage() {
  const [runs, setRuns] = useState<CaptureRun[]>([]);
  const [records, setRecords] = useState<CaptureRecord[]>([]);
  const [source, setSource] = useState("google_places");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const [runsResult, recordsResult] = await Promise.all([fetchCaptureRuns(), fetchCaptureRecords()]);
    if (!runsResult.ok || !recordsResult.ok) {
      setError("Não foi possível carregar a captação no backend local.");
      return;
    }
    setRuns(runsResult.data);
    setRecords(recordsResult.data);
  };

  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => ({
    total: records.length,
    pending: records.filter((record) => record.status === "pending").length,
    approved: records.filter((record) => record.status === "approved").length,
    promoted: records.filter((record) => record.status === "promoted").length,
  }), [records]);

  const runCapture = async () => {
    setBusy(true);
    setError(null);
    const result = await createCaptureRun({ source, query: query || undefined });
    if (!result.ok) setError(result.error.message);
    else await load();
    setBusy(false);
  };

  const review = async (record: CaptureRecord, status: "approved" | "rejected") => {
    setBusy(true);
    const result = await reviewCaptureRecord(record.id, status);
    if (!result.ok) setError(result.error.message);
    else setRecords((current) => current.map((item) => item.id === record.id ? { ...item, status } : item));
    setBusy(false);
  };

  const promote = async (record: CaptureRecord) => {
    setBusy(true);
    const result = await promoteCaptureRecord(record.id);
    if (!result.ok) setError(result.error.message);
    else setRecords((current) => current.map((item) => item.id === record.id ? { ...item, status: "promoted", companyId: result.data.company.id } : item));
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><Sparkles className="h-4 w-4" /> Captação beta</div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{mod.label}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Colete, revise e promova oportunidades para o funil comercial.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: clínicas em Cuiabá" className="w-full sm:w-64" />
          <Button onClick={() => void runCapture()} disabled={busy}><Play className="mr-2 h-4 w-4" /> Nova captação</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {[{ label: "Registros", value: counts.total }, { label: "Aguardando revisão", value: counts.pending }, { label: "Aprovados", value: counts.approved }, { label: "Promovidos", value: counts.promoted }].map((item) => (
          <div key={item.label} className="surface-card p-4"><div className="text-xs text-muted-foreground">{item.label}</div><div className="mt-2 font-display text-2xl font-bold">{item.value}</div></div>
        ))}
      </div>

      <div className="surface-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-display text-lg font-semibold">Iniciar execução</h2><p className="text-sm text-muted-foreground">O beta registra a execução e mantém o processamento externo separado.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Database className="h-4 w-4 text-lime" /> backend local</div></div>
        <div className="mt-4 flex flex-wrap gap-2">{["google_places", "form", "whatsapp", "manual"].map((item) => <button key={item} onClick={() => setSource(item)} className={`rounded-lg border px-3 py-2 text-xs transition ${source === item ? "border-lime/60 bg-lime/10 text-lime" : "border-border/60 text-muted-foreground hover:border-lime/30"}`}>{item === "google_places" ? "Google Maps / Places" : item}</button>)}</div>
        {busy && <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-lime" /> Processando ação…</div>}
      </div>

      {error && <ApiUnavailableState message={error} />}
      {!error && records.length === 0 && !busy && <EmptyState title="Nenhum registro capturado" description="Inicie uma execução ou carregue o seed demo do backend." />}
      {records.length > 0 && <div className="surface-card overflow-hidden"><div className="border-b border-border/60 p-5"><h2 className="font-display text-lg font-semibold">Registros para revisão</h2><p className="text-sm text-muted-foreground">Cada registro precisa ser aprovado antes de virar prospect.</p></div><div className="divide-y divide-border/50">{records.map((record, index) => <motion.div key={record.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: m.duration.base, ease: m.ease.enter, delay: index * 0.03 }} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-semibold">{record.name}</h3><span className="rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{record.status}</span></div><p className="mt-1 text-sm text-muted-foreground">{[record.city, record.state].filter(Boolean).join(" · ") || "Local não informado"} {record.phone ? `· ${record.phone}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">Origem: {record.sourceUrl ? <a className="text-lime hover:underline" href={record.sourceUrl} target="_blank" rel="noreferrer">fonte externa</a> : "captura local"}</p></div><div className="flex flex-wrap gap-2">{record.status === "pending" && <><Button size="sm" variant="outline" onClick={() => void review(record, "rejected")} disabled={busy}><X className="mr-1 h-3.5 w-3.5" /> Rejeitar</Button><Button size="sm" onClick={() => void review(record, "approved")} disabled={busy}><Check className="mr-1 h-3.5 w-3.5" /> Aprovar</Button></>}{record.status === "approved" && <Button size="sm" onClick={() => void promote(record)} disabled={busy}><Search className="mr-1 h-3.5 w-3.5" /> Promover para prospect</Button>}</div></motion.div>)}</div></div>}

      <div className="surface-card p-5"><div className="flex items-center gap-2"><Database className="h-4 w-4 text-lime" /><h2 className="font-display text-lg font-semibold">Execuções recentes</h2></div><div className="mt-4 space-y-2">{runs.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p> : runs.map((run) => <div key={run.id} className="flex flex-col gap-1 rounded-lg border border-border/50 bg-surface/40 p-3 text-sm md:flex-row md:items-center md:justify-between"><span className="font-medium">{run.source} {run.query ? `· ${run.query}` : ""}</span><span className="text-xs text-muted-foreground">{run.status} · {run.totalFound} encontrados · {new Date(run.createdAt).toLocaleString("pt-BR")}</span></div>)}</div></div>
    </div>
  );
}

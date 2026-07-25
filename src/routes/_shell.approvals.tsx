import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Clock3 } from "lucide-react";
import { getModule } from "@/lib/modules";
import { fetchApprovalBatches, type ApprovalBatch } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";

const mod = getModule("approvals")!;
export const Route = createFileRoute("/_shell/approvals")({ head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }] }), component: ApprovalsPage });

function ApprovalsPage() {
  const [batches, setBatches] = useState<ApprovalBatch[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchApprovalBatches().then((result) => result.ok ? setBatches(result.data) : setError(result.error.message)); }, []);
  return <div className="space-y-6"><header><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><BellRing className="h-4 w-4" /> Controle humano</div><h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1><p className="mt-2 text-sm text-muted-foreground">A aprovação ocorre no painel; o WhatsApp apenas notifica o responsável.</p></header>{error && <ApiUnavailableState message={error} />}{!error && batches.length === 0 && <EmptyState title="Nenhum lote aguardando revisão" description="Lotes criados pelo motor de mensagens aparecerão aqui." />}{batches.length > 0 && <div className="space-y-3">{batches.map((batch) => <article key={batch.id} className="surface-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-lime" /><h2 className="font-display text-lg font-semibold">{batch.title}</h2></div><p className="mt-1 text-sm text-muted-foreground">Canal: {batch.channel} · Notificação: {batch.notificationStatus}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs capitalize text-amber-300">{batch.status}</span><CheckCircle2 className="h-5 w-5 text-muted-foreground" /></div></article>)}</div>}</div>;
}

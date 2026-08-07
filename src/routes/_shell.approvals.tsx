import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, Check, CheckCircle2, Clock3, X } from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  cancelApprovalBatch,
  decideApprovalItem,
  fetchApprovalBatch,
  fetchApprovalBatches,
  type ApprovalBatch,
  type ApprovalBatchDetail,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState, LoadingState } from "@/components/states";
import { Notice, type NoticeState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { channelLabel, statusLabel } from "@/lib/status";
import { formatDateTime } from "@/lib/format";
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

const mod = getModule("approvals")!;

export const Route = createFileRoute("/_shell/approvals")({
  head: () => ({
    meta: [
      { title: `${mod.label} · Ctrl LTV` },
      { name: "description", content: mod.description },
      { property: "og:title", content: `${mod.label} · Ctrl LTV` },
      { property: "og:description", content: mod.description },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const [batches, setBatches] = useState<ApprovalBatch[]>([]);
  const [selected, setSelected] = useState<ApprovalBatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    void fetchApprovalBatches().then((result) => {
      if (result.ok) setBatches(result.data);
      else setLoadError("Não foi possível carregar os lotes de aprovação agora.");
      setLoading(false);
    });
  }, []);

  const openBatch = async (batch: ApprovalBatch) => {
    if (loadingBatch) return;
    setLoadingBatch(true);
    setNotice(null);
    const result = await fetchApprovalBatch(batch.id);
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else setSelected(result.data);
    setLoadingBatch(false);
  };

  const decide = async (itemId: string, status: "approved" | "rejected") => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    const result = await decideApprovalItem(itemId, status);
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      if (selected) {
        setSelected({
          ...selected,
          items: selected.items.map((item) => (item.id === itemId ? { ...item, status } : item)),
        });
      }
      setNotice({
        tone: "success",
        message: status === "approved" ? "Mensagem aprovada." : "Mensagem rejeitada.",
      });
    }
    setBusy(false);
  };

  const cancel = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setNotice(null);
    const result = await cancelApprovalBatch(selected.id);
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      setSelected({
        ...selected,
        status: "cancelled",
        items: selected.items.map((item) =>
          item.status === "pending" ? { ...item, status: "superseded" } : item,
        ),
      });
      setBatches((current) =>
        current.map((batch) =>
          batch.id === selected.id ? { ...batch, status: "cancelled" } : batch,
        ),
      );
      setNotice({ tone: "success", message: "Lote cancelado. Nenhuma mensagem será enviada." });
    }
    setBusy(false);
    setConfirmCancel(false);
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
          <BellRing aria-hidden="true" className="h-4 w-4" /> Controle humano
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{mod.label}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A aprovação acontece aqui no painel. O WhatsApp apenas notifica o responsável de que
          existe um lote aguardando revisão.
        </p>
      </header>

      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      {loading && <LoadingState label="Carregando lotes…" />}
      {!loading && loadError && <ApiUnavailableState message={loadError} />}
      {!loading && !loadError && batches.length === 0 && (
        <EmptyState
          title="Nenhum lote aguardando revisão"
          description="Lotes criados pelo motor de mensagens aparecerão aqui para aprovação item por item."
        />
      )}

      {!loading && !loadError && batches.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-3">
            {batches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                onClick={() => void openBatch(batch)}
                aria-current={selected?.id === batch.id}
                className={`surface-card w-full p-5 text-left transition hover:border-lime/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${selected?.id === batch.id ? "ring-1 ring-lime/40" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0 text-lime" />
                      <h2 className="truncate font-display text-lg font-semibold">{batch.title}</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Canal: {channelLabel(batch.channel)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Criado em {formatDateTime(batch.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={batch.status} />
                    <span className="text-[11px] text-muted-foreground">
                      Notificação: {batch.notificationStatus ? statusLabel(batch.notificationStatus) : "não enviada"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {loadingBatch && !selected ? (
            <div className="surface-card grid min-h-64 place-items-center p-8">
              <LoadingState label="Abrindo lote…" />
            </div>
          ) : selected ? (
            <section className="surface-card p-5">
              <div className="flex flex-col justify-between gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold">{selected.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.items.length} mensagem(ns) · canal {channelLabel(selected.channel)}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setConfirmCancel(true)}
                  disabled={busy || selected.status === "cancelled"}
                >
                  <X aria-hidden="true" className="mr-2 h-4 w-4" /> Cancelar lote
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {selected.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-border/60 bg-surface/40 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="min-w-0 truncate">
                        {channelLabel(item.channelLabel ?? item.channel)} ·{" "}
                        {item.recipientExternalId ?? "destinatário não informado"}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-foreground">{item.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Agendamento:{" "}
                        {item.scheduledAt ? formatDateTime(item.scheduledAt) : "sem agendamento"}
                      </span>
                      {item.jobStatus && (
                        <span className="inline-flex items-center gap-1.5">
                          Envio: <StatusBadge status={item.jobStatus} />
                        </span>
                      )}
                    </div>
                    {item.jobLastError && (
                      <Notice
                        className="mt-3"
                        notice={{ tone: "error", message: `Falha no envio: ${item.jobLastError}` }}
                      />
                    )}
                    {item.status === "pending" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => void decide(item.id, "approved")}
                          disabled={busy}
                        >
                          <Check aria-hidden="true" className="mr-1 h-3.5 w-3.5" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void decide(item.id, "rejected")}
                          disabled={busy}
                        >
                          <X aria-hidden="true" className="mr-1 h-3.5 w-3.5" /> Rejeitar
                        </Button>
                      </div>
                    )}
                    {item.status === "approved" && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-lime">
                        <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> Autorizada para
                        agendamento
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <div className="surface-card grid min-h-64 place-items-center p-8 text-center text-sm text-muted-foreground">
              Selecione um lote para revisar as mensagens.
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este lote?</AlertDialogTitle>
            <AlertDialogDescription>
              As mensagens ainda pendentes deixam de valer e nada será enviado. Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void cancel();
              }}
              disabled={busy}
            >
              {busy ? "Cancelando…" : "Cancelar lote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Mail, RefreshCw, UserPlus } from "lucide-react";
import {
  fetchRegistrationRequests,
  markRegistrationRequestReviewed,
  type RegistrationRequest,
} from "@/lib/api-client";
import { getModule } from "@/lib/modules";
import { ApiUnavailableState, EmptyState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";

const mod = getModule("access-requests")!;

export const Route = createFileRoute("/_shell/access-requests")({
  head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }] }),
  component: AccessRequestsPage,
});

function AccessRequestsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [status, setStatus] = useState<RegistrationRequest["status"] | "">("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchRegistrationRequests(status || undefined);
    if (result.ok) setRequests(result.data);
    else
      setError(
        "Não foi possível carregar as solicitações. Confirme que sua conta possui papel owner ou admin.",
      );
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markReviewed(request: RegistrationRequest) {
    if (busyId) return;
    setBusyId(request.id);
    setError(null);
    const result = await markRegistrationRequestReviewed(request.id);
    if (result.ok)
      setRequests((current) =>
        current.map((item) => (item.id === request.id ? result.data : item)),
      );
    else setError("Não foi possível atualizar a solicitação.");
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <UserPlus className="h-4 w-4" /> Acesso controlado
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Avalie contatos recebidos sem criação automática de usuários.
          </p>
        </div>
        <div className="flex gap-2">
          <label className="text-xs text-muted-foreground">
            Status
            <select
              className="ml-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
            >
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="notified">Notificado</option>
              <option value="failed">Falha</option>
              <option value="reviewed">Revisado</option>
            </select>
          </label>
          <Button onClick={() => void load()} type="button" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>
      </header>

      {error && <ApiUnavailableState message={error} onRetry={() => void load()} />}
      {loading && <LoadingState label="Carregando solicitações…" />}
      {!loading && !error && requests.length === 0 && (
        <EmptyState
          title="Nenhuma solicitação encontrada"
          description="Novos pedidos de acesso aparecerão aqui."
        />
      )}
      {!loading && requests.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((request) => (
            <article className="surface-card p-5" key={request.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold">{request.displayName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{request.organizationName}</p>
                </div>
                <span className="rounded-full bg-surface-2 px-3 py-1 text-xs capitalize text-muted-foreground">
                  {request.status}
                </span>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                  <div>
                    <dt className="sr-only">E-mail</dt>
                    <dd className="break-all">{request.email}</dd>
                  </div>
                </div>
                {request.phone && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Telefone</dt>
                    <dd className="mt-1">{request.phone}</dd>
                  </div>
                )}
                {request.message && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Mensagem</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-6">{request.message}</dd>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  <time dateTime={request.createdAt}>
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(request.createdAt))}
                  </time>
                </div>
              </dl>
              {request.status !== "reviewed" && (
                <Button
                  className="mt-5"
                  disabled={busyId === request.id}
                  onClick={() => void markReviewed(request)}
                  type="button"
                  variant="outline"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {busyId === request.id ? "Atualizando…" : "Marcar como revisada"}
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

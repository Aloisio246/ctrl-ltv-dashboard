import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Radio, Search } from "lucide-react";
import { getModule } from "@/lib/modules";
import { fetchConversations, type Conversation } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppSelect } from "@/components/ui/app-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { channelLabel } from "@/lib/status";
import { formatDateTime } from "@/lib/format";

const mod = getModule("inbox")!;

export const Route = createFileRoute("/_shell/inbox")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: `${mod.label} · Ctrl LTV` },
      { name: "description", content: mod.description },
      { property: "og:title", content: `${mod.label} · Ctrl LTV` },
      { property: "og:description", content: mod.description },
    ],
  }),
  component: InboxPage,
});

function conversationTitle(conversation: Conversation) {
  const subject = conversation.subject?.trim();
  if (subject) return subject;
  return "Conversa sem identificação";
}

function InboxPage() {
  const { q } = Route.useSearch();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState(q ?? "");
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");

  useEffect(() => {
    void fetchConversations().then((result) => {
      if (result.ok) setConversations(result.data);
      else setLoadError("Não foi possível carregar as conversas agora.");
      setLoading(false);
    });
  }, []);

  const channelOptions = useMemo(() => {
    const unique = Array.from(new Set(conversations.map((item) => item.channel)));
    return [
      { value: "all", label: "Todos os canais" },
      ...unique.map((value) => ({ value, label: channelLabel(value) })),
    ];
  }, [conversations]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesTerm =
        term.length === 0 ||
        `${conversationTitle(conversation)} ${conversation.lastMessage?.body ?? ""}`
          .toLowerCase()
          .includes(term);
      const matchesStatus = status === "all" || conversation.status === status;
      const matchesChannel = channel === "all" || conversation.channel === channel;
      return matchesTerm && matchesStatus && matchesChannel;
    });
  }, [conversations, search, status, channel]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
          <MessageCircle aria-hidden="true" className="h-4 w-4" /> Comunicação
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{mod.label}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Conversas recebidas por canal, com resposta sempre auditável.
        </p>
      </header>

      {!loading && !loadError && conversations.length > 0 && (
        <div className="surface-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por assunto ou conteúdo da mensagem"
              aria-label="Buscar conversas"
              className="pl-9"
            />
          </div>
          <AppSelect
            ariaLabel="Filtrar por status da conversa"
            className="lg:w-48"
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "all", label: "Todos os status" },
              { value: "open", label: "Aberta" },
              { value: "pending", label: "Pendente" },
              { value: "closed", label: "Encerrada" },
            ]}
          />
          <AppSelect
            ariaLabel="Filtrar por canal"
            className="lg:w-48"
            value={channel}
            onValueChange={setChannel}
            options={channelOptions}
          />
        </div>
      )}

      {loading && <LoadingState label="Carregando conversas…" />}
      {!loading && loadError && <ApiUnavailableState message={loadError} />}
      {!loading && !loadError && conversations.length === 0 && (
        <EmptyState
          title="Nenhuma conversa recebida"
          description="Mensagens recebidas aparecerão aqui quando uma conta de canal estiver conectada."
        />
      )}
      {!loading && !loadError && conversations.length > 0 && visible.length === 0 && (
        <EmptyState
          title="Nenhum resultado para estes filtros"
          description="Ajuste a busca, o status ou o canal para ver outras conversas."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setChannel("all");
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      )}
      {!loading && !loadError && visible.length > 0 && (
        <ul className="grid list-none gap-3 lg:grid-cols-2">
          {visible.map((conversation) => (
            <li key={conversation.id}>
              <article className="surface-card h-full p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-semibold">
                      {conversationTitle(conversation)}
                    </h2>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Radio aria-hidden="true" className="h-3.5 w-3.5 text-lime" />
                      {channelLabel(conversation.channelLabel ?? conversation.channel)}
                    </div>
                  </div>
                  <StatusBadge status={conversation.status} />
                </div>
                <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">
                  {conversation.lastMessage?.body ?? "Sem mensagem recente"}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  {conversation.unreadCount > 0 ? (
                    <StatusBadge label={`${conversation.unreadCount} não lida(s)`} tone="warning" />
                  ) : (
                    <span>Sem mensagens não lidas</span>
                  )}
                  <span>{formatDateTime(conversation.lastMessageAt, "sem atividade")}</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

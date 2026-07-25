import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Radio } from "lucide-react";
import { getModule } from "@/lib/modules";
import { fetchConversations, type Conversation } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";

const mod = getModule("inbox")!;
export const Route = createFileRoute("/_shell/inbox")({ head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }] }), component: InboxPage });

function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchConversations().then((result) => result.ok ? setConversations(result.data) : setError(result.error.message)); }, []);
  return <div className="space-y-6"><header><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><MessageCircle className="h-4 w-4" /> Comunicação</div><h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1><p className="mt-2 text-sm text-muted-foreground">Conversas recebidas por canal, com resposta sempre auditável.</p></header>{error && <ApiUnavailableState message={error} />}{!error && conversations.length === 0 && <EmptyState title="Inbox vazia" description="Mensagens recebidas aparecerão aqui quando uma conta de canal estiver conectada." />}{conversations.length > 0 && <div className="grid gap-3 lg:grid-cols-2">{conversations.map((conversation) => <article key={conversation.id} className="surface-card p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-xs uppercase tracking-wider text-lime"><Radio className="h-3.5 w-3.5" /> {conversation.channelLabel ?? conversation.channel}</div><h2 className="mt-2 font-display text-lg font-semibold">{conversation.subject ?? conversation.externalId}</h2></div><span className="rounded-full bg-surface px-2 py-1 text-[10px] uppercase text-muted-foreground">{conversation.status}</span></div><p className="mt-4 text-sm text-muted-foreground">{conversation.lastMessage?.body ?? "Sem mensagem recente"}</p><div className="mt-4 flex justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground"><span>{conversation.unreadCount} não lidas</span><span>{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString("pt-BR") : "—"}</span></div></article>)}</div>}</div>;
}

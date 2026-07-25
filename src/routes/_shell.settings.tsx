import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { getModule } from "@/lib/modules";
import { fetchMe, type Me } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";

const mod = getModule("settings")!;
export const Route = createFileRoute("/_shell/settings")({ head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }] }), component: SettingsPage });

function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchMe().then((result) => result.ok ? setMe(result.data) : setError(result.error.message)); }, []);
  return <div className="space-y-6"><header><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><ShieldCheck className="h-4 w-4" /> Governança</div><h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1><p className="mt-2 text-sm text-muted-foreground">Conta, organização e permissões da operação local.</p></header>{error && <ApiUnavailableState message={error} />}{!error && !me && <EmptyState title="Carregando conta" description="Consultando a sessão no backend local." />}{me && <div className="grid gap-4 lg:grid-cols-2"><section className="surface-card p-5"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-lime" /><h2 className="font-display text-lg font-semibold">Usuário</h2></div><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-muted-foreground">Nome</dt><dd className="mt-1 font-medium">{me.user.displayName}</dd></div><div><dt className="text-xs text-muted-foreground">E-mail</dt><dd className="mt-1 font-medium">{me.user.email}</dd></div><div><dt className="text-xs text-muted-foreground">Perfil</dt><dd className="mt-1 capitalize text-lime">{me.activeMembership.role}</dd></div></dl></section><section className="surface-card p-5"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-lime" /><h2 className="font-display text-lg font-semibold">Organização ativa</h2></div><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-muted-foreground">Nome</dt><dd className="mt-1 font-medium">{me.activeMembership.organizationName}</dd></div><div><dt className="text-xs text-muted-foreground">Organizações vinculadas</dt><dd className="mt-1 font-medium">{me.memberships.length}</dd></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><KeyRound className="h-3.5 w-3.5" /> Segredos e tokens permanecem no backend.</div></dl></section></div>}</div>;
}

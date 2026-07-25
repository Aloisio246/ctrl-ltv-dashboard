import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, HeartPulse, Search } from "lucide-react";
import { getModule } from "@/lib/modules";
import { Input } from "@/components/ui/input";
import { fetchClients, fetchCompanies, fetchContracts, type Client, type Company, type Contract } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";

const mod = getModule("clients")!;

export const Route = createFileRoute("/_shell/clients")({
  head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }, { name: "description", content: mod.description }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]); const [companies, setCompanies] = useState<Company[]>([]); const [contracts, setContracts] = useState<Contract[]>([]); const [search, setSearch] = useState(""); const [error, setError] = useState<string | null>(null);
  useEffect(() => { Promise.all([fetchClients(), fetchCompanies(), fetchContracts()]).then(([clientResult, companyResult, contractResult]) => { if (!clientResult.ok || !companyResult.ok || !contractResult.ok) setError("Não foi possível carregar os clientes locais."); else { setClients(clientResult.data); setCompanies(companyResult.data); setContracts(contractResult.data); } }); }, []);
  const companiesById = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies]); const contractsByClient = useMemo(() => new Map(contracts.map((contract) => [contract.clientId, contract])), [contracts]); const visible = clients.filter((client) => (companiesById.get(client.companyId ?? "")?.name ?? "").toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6"><header><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><Building2 className="h-4 w-4" /> Relacionamento</div><h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1><p className="mt-2 text-sm text-muted-foreground">Visão consolidada dos clientes e contratos ativos.</p></header><div className="surface-card relative p-4"><Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente" className="pl-9" /></div>{error && <ApiUnavailableState message={error} />}{!error && visible.length === 0 && <EmptyState title="Nenhum cliente encontrado" description="Clientes convertidos aparecerão aqui." />}{visible.length > 0 && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visible.map((client) => { const company = companiesById.get(client.companyId ?? ""); const contract = contractsByClient.get(client.id); return <article key={client.id} className="surface-card p-5"><div className="flex items-start justify-between"><div><h2 className="font-display text-lg font-semibold">{company?.name ?? "Cliente sem empresa"}</h2><p className="mt-1 text-sm text-muted-foreground">{company?.city ?? "Local não informado"}</p></div><HeartPulse className={`h-5 w-5 ${client.status === "active" ? "text-lime" : "text-muted-foreground"}`} /></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><div className="text-xs text-muted-foreground">Status</div><div className="mt-1 font-medium capitalize">{client.status}</div></div><div><div className="text-xs text-muted-foreground">MRR</div><div className="mt-1 font-medium">{contract ? Number(contract.monthlyValue).toLocaleString("pt-BR", { style: "currency", currency: contract.currency }) : "—"}</div></div></div></article>; })}</div>}</div>;
}

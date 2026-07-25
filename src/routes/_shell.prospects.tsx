import { createFileRoute } from "@tanstack/react-router";
import { getModule } from "@/lib/modules";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness, Plus, Search, SlidersHorizontal, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCompanies, fetchProspects, createProspect, type Company, type Prospect } from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { motion as m } from "@/lib/motion";

const mod = getModule("prospects")!;

export const Route = createFileRoute("/_shell/prospects")({
  head: () => ({
    meta: [
      { title: `${mod.label} · Ctrl LTV` },
      { name: "description", content: mod.description },
      { property: "og:title", content: `${mod.label} · Ctrl LTV` },
      { property: "og:description", content: mod.description },
    ],
  }),
  component: ProspectsPage,
});

function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [temperature, setTemperature] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [prospectsResult, companiesResult] = await Promise.all([fetchProspects(), fetchCompanies()]);
    if (!prospectsResult.ok || !companiesResult.ok) { setError("Não foi possível carregar os prospects no backend local."); return; }
    setProspects(prospectsResult.data); setCompanies(companiesResult.data);
  };
  useEffect(() => { void load(); }, []);

  const companyById = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies]);
  const visible = useMemo(() => prospects.filter((prospect) => {
    const company = companyById.get(prospect.companyId);
    const text = `${company?.name ?? ""} ${company?.city ?? ""} ${prospect.status}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (temperature === "all" || prospect.temperature === temperature);
  }), [companyById, prospects, search, temperature]);

  const createDemoProspect = async () => {
    const company = companies[0];
    if (!company) { setError("Cadastre uma empresa ou promova um registro de captação primeiro."); return; }
    setBusy(true);
    const result = await createProspect({ companyId: company.id, status: "new", temperature: "warm", score: 60 });
    if (!result.ok) setError(result.error.message); else setProspects((current) => [result.data, ...current]);
    setBusy(false);
  };

  return <div className="space-y-6"><header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><BriefcaseBusiness className="h-4 w-4" /> Funil comercial</div><h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{mod.label}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Organize oportunidades qualificadas e prepare a próxima ação comercial.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={() => void createDemoProspect()} disabled={busy}><Plus className="mr-2 h-4 w-4" /> Novo prospect</Button></div></header>
    <div className="surface-card flex flex-col gap-3 p-4 md:flex-row md:items-center"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar empresa, cidade ou etapa" className="pl-9" /></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><SlidersHorizontal className="h-4 w-4" /><select value={temperature} onChange={(event) => setTemperature(event.target.value)} className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground"><option value="all">Todas temperaturas</option><option value="hot">Quente</option><option value="warm">Morna</option><option value="cold">Fria</option></select></div></div>
    {error && <ApiUnavailableState message={error} />}
    {!error && visible.length === 0 && <EmptyState title="Nenhum prospect encontrado" description={prospects.length ? "Ajuste a busca ou o filtro de temperatura." : "Promova registros de captação para começar o funil."} />}
    {visible.length > 0 && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visible.map((prospect, index) => { const company = companyById.get(prospect.companyId); return <motion.article key={prospect.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: m.duration.base, ease: m.ease.enter, delay: index * 0.03 }} className="surface-card p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">{company?.name ?? "Empresa sem nome"}</h2><p className="mt-1 text-sm text-muted-foreground">{company?.city ?? "Cidade não informada"}{company?.state ? ` · ${company.state}` : ""}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${prospect.temperature === "hot" ? "bg-red-400/10 text-red-300" : prospect.temperature === "warm" ? "bg-amber-400/10 text-amber-300" : "bg-sky-400/10 text-sky-300"}`}>{prospect.temperature}</span></div><div className="mt-5 flex items-end justify-between"><div><div className="text-xs text-muted-foreground">Score comercial</div><div className="mt-1 font-display text-3xl font-bold text-lime">{prospect.score}<span className="text-sm text-muted-foreground">/100</span></div></div><div className="text-right"><div className="text-xs text-muted-foreground">Etapa</div><div className="mt-1 text-sm font-medium capitalize">{prospect.status}</div></div></div><div className="mt-5 flex items-center gap-2 border-t border-border/50 pt-4 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" /> {prospect.nextFollowUpAt ? `Follow-up ${new Date(prospect.nextFollowUpAt).toLocaleDateString("pt-BR")}` : "Sem follow-up agendado"}</div></motion.article>; })}</div>}
  </div>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, Globe2, Mail, MapPin, Phone, Plus, Search, UserRound } from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  createCompany,
  createContact,
  createProspect,
  fetchCompanies,
  fetchContacts,
  fetchProspects,
  type Company,
  type Contact,
  type Prospect,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const mod = getModule("contacts")!;

export const Route = createFileRoute("/_shell/contacts")({
  head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }, { name: "description", content: mod.description }] }),
  component: ContactsPage,
});

function normalizeCompanyName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [contactName, setContactName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyProspect, setBusyProspect] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [contactResult, companyResult, prospectResult] = await Promise.all([
      fetchContacts(),
      fetchCompanies(),
      fetchProspects(),
    ]);
    if (!contactResult.ok || !companyResult.ok || !prospectResult.ok) {
      setError("Não foi possível carregar os contatos.");
      return;
    }
    setError(null);
    setContacts(contactResult.data);
    setCompanies(companyResult.data);
    setProspects(prospectResult.data);
  }

  useEffect(() => {
    void load();
  }, []);

  const prospectCompanyIds = useMemo(
    () => new Set(prospects.map((prospect) => prospect.companyId)),
    [prospects],
  );
  const visible = contacts.filter((contact) =>
    `${contact.name} ${contact.companyName} ${contact.companyCity ?? ""} ${contact.companyState ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function resetForm() {
    setSelectedCompanyId("");
    setContactName("");
    setRoleTitle("");
    setEmail("");
    setPhone("");
    setCompanyName("");
    setCompanyWebsite("");
    setCompanyPhone("");
    setCity("");
    setState("");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contactName.trim()) {
      setError("Informe o nome do contato.");
      return;
    }
    if (!selectedCompanyId && !companyName.trim()) {
      setError("Informe a empresa do contato.");
      return;
    }
    setSaving(true);
    setError(null);

    let companyId = selectedCompanyId;
    if (!companyId) {
      const companyResult = await createCompany({
        name: companyName.trim(),
        normalizedName: normalizeCompanyName(companyName),
        website: normalizeWebsite(companyWebsite),
        phone: companyPhone.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        source: "manual_contact",
      });
      if (!companyResult.ok) {
        setError(companyResult.error.message);
        setSaving(false);
        return;
      }
      companyId = companyResult.data.id;
    }

    const contactResult = await createContact({
      companyId,
      name: contactName.trim(),
      roleTitle: roleTitle.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    if (!contactResult.ok) {
      setError(contactResult.error.message);
      setSaving(false);
      return;
    }
    setContacts((current) => [contactResult.data, ...current]);
    setShowForm(false);
    resetForm();
    await load();
    setSaving(false);
  }

  async function promoteToProspect(contact: Contact) {
    setBusyProspect(contact.id);
    setError(null);
    const result = await createProspect({
      companyId: contact.companyId,
      status: "new",
      temperature: "warm",
      score: 50,
    });
    if (!result.ok) setError(result.error.message);
    else setProspects((current) => [result.data, ...current]);
    setBusyProspect(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <UserRound className="h-4 w-4" /> Base de relacionamento
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cadastre pessoas junto com suas empresas e prepare cada relacionamento para virar cliente.
          </p>
        </div>
        <Button onClick={() => setShowForm((current) => !current)}>
          <Plus /> Novo contato
        </Button>
      </header>

      {showForm && (
        <form className="surface-card grid gap-4 p-5 md:grid-cols-2" onSubmit={handleCreate}>
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <Building2 className="h-4 w-4 text-lime" /> Empresa e contato
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              A empresa fica vinculada ao contato e poderá avançar para Prospects, Pipeline e Clientes.
            </p>
          </div>
          <label className="space-y-2 text-sm font-medium md:col-span-2">
            Empresa já cadastrada (opcional)
            <AppSelect
              ariaLabel="Empresa já cadastrada"
              className="mt-2"
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
              placeholder="Cadastrar uma nova empresa"
              options={companies.map((company) => ({ value: company.id, label: company.name }))}
            />
          </label>
          {!selectedCompanyId && (
            <>
              <label className="space-y-2 text-sm font-medium">
                Nome da empresa
                <Input className="mt-2" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Site da empresa
                <Input className="mt-2" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} placeholder="empresa.com.br" />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Telefone da empresa
                <Input className="mt-2" value={companyPhone} onChange={(event) => setCompanyPhone(event.target.value)} placeholder="(65) 99999-9999" />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Cidade
                <Input className="mt-2" value={city} onChange={(event) => setCity(event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Estado
                <Input className="mt-2" value={state} onChange={(event) => setState(event.target.value)} placeholder="MT" />
              </label>
            </>
          )}
          <label className="space-y-2 text-sm font-medium">
            Nome do contato
            <Input className="mt-2" value={contactName} onChange={(event) => setContactName(event.target.value)} required />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Cargo ou função
            <Input className="mt-2" value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="Proprietário, comercial…" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            E-mail
            <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Telefone ou WhatsApp
            <Input className="mt-2" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
          <div className="flex gap-2 md:col-span-2">
            <Button disabled={saving} type="submit">{saving ? "Salvando…" : "Salvar contato"}</Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="surface-card relative p-4">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar contato, empresa ou cidade" className="pl-9" />
      </div>

      {error && !showForm && <ApiUnavailableState message={error} />}
      {!error && visible.length === 0 && <EmptyState title="Nenhum contato cadastrado" description="Cadastre o primeiro contato com os dados da empresa para iniciar seu relacionamento comercial." />}
      {visible.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((contact) => (
            <article key={contact.id} className="surface-card p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-semibold">{contact.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{contact.roleTitle ?? "Contato comercial"}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${contact.clientId ? "border-sky-300/25 bg-sky-300/10 text-sky-200" : "border-lime/25 bg-lime/10 text-lime"}`}>
                  {contact.clientId ? "cliente atual" : "potencial cliente"}
                </span>
              </div>
              <div className="mt-5 rounded-lg border border-border/60 bg-surface/50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><Building2 className="h-4 w-4 text-lime" /> {contact.companyName}</div>
                {(contact.companyCity || contact.companyState) && <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {[contact.companyCity, contact.companyState].filter(Boolean).join(" · ")}</div>}
                {contact.companyWebsite && <a className="mt-2 flex items-center gap-2 truncate text-xs text-lime hover:underline" href={contact.companyWebsite} target="_blank" rel="noreferrer"><Globe2 className="h-3.5 w-3.5 shrink-0" /> {contact.companyWebsite.replace(/^https?:\/\//, "")}</a>}
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                {contact.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {contact.email}</div>}
                {contact.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {contact.phone}</div>}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-5 w-full"
                disabled={Boolean(contact.clientId) || prospectCompanyIds.has(contact.companyId) || busyProspect === contact.id}
                onClick={() => void promoteToProspect(contact)}
              >
                {contact.clientId ? "Cliente atual" : prospectCompanyIds.has(contact.companyId) ? "Já está em Prospects" : busyProspect === contact.id ? "Enviando…" : "Enviar para Prospects"}
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

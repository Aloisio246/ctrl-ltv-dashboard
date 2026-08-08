import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Globe2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  createCompany,
  createContact,
  createProspect,
  fetchCompanies,
  fetchContacts,
  fetchProspects,
  updateCompany,
  updateContact,
  type Company,
  type Contact,
  type Prospect,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState, LoadingState } from "@/components/states";
import { Notice, type NoticeState } from "@/components/feedback";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

const mod = getModule("contacts")!;

export const Route = createFileRoute("/_shell/contacts")({
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

/** Bloco de campos com título, para separar dados da EMPRESA e da PESSOA. */
function FieldGroup({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-surface/40 p-4 md:col-span-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  full,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`space-y-2 text-sm font-medium ${full ? "md:col-span-2" : ""}`}>
      <span className="block">{label}</span>
      {children}
      {hint && <span className="block text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [relation, setRelation] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
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
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    const [contactResult, companyResult, prospectResult] = await Promise.all([
      fetchContacts(),
      fetchCompanies(),
      fetchProspects(),
    ]);
    if (!contactResult.ok || !companyResult.ok || !prospectResult.ok) {
      setLoadError("Não foi possível carregar os contatos agora. Tente novamente em instantes.");
      setLoading(false);
      return;
    }
    setLoadError(null);
    setContacts(contactResult.data);
    setCompanies(companyResult.data);
    setProspects(prospectResult.data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const prospectCompanyIds = useMemo(
    () => new Set(prospects.map((prospect) => prospect.companyId)),
    [prospects],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesTerm =
        term.length === 0 ||
        `${contact.name} ${contact.roleTitle ?? ""} ${contact.companyName} ${contact.companyCity ?? ""} ${contact.companyState ?? ""} ${contact.email ?? ""} ${contact.phone ?? ""}`
          .toLowerCase()
          .includes(term);
      const matchesRelation =
        relation === "all" ||
        (relation === "clients" ? Boolean(contact.clientId) : !contact.clientId);
      return matchesTerm && matchesRelation;
    });
  }, [contacts, search, relation]);

  function resetForm() {
    setEditingContact(null);
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
    setFormError(null);
  }

  function startEditing(contact: Contact) {
    setEditingContact(contact);
    setSelectedCompanyId(contact.companyId);
    setContactName(contact.name);
    setRoleTitle(contact.roleTitle ?? "");
    setEmail(contact.email ?? "");
    setPhone(contact.phone ?? "");
    setCompanyName(contact.companyName);
    setCompanyWebsite(contact.companyWebsite ?? "");
    setCompanyPhone(contact.companyPhone ?? "");
    setCity(contact.companyCity ?? "");
    setState(contact.companyState ?? "");
    setFormError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!contactName.trim()) {
      setFormError("Informe o nome da pessoa de contato.");
      return;
    }
    if (!selectedCompanyId && !companyName.trim()) {
      setFormError("Selecione uma empresa existente ou informe o nome de uma nova empresa.");
      return;
    }
    setSaving(true);
    setFormError(null);
    setNotice(null);

    const companyId = selectedCompanyId;
    if (editingContact) {
      const companyResult = await updateCompany(editingContact.companyId, {
        name: companyName.trim(),
        normalizedName: normalizeCompanyName(companyName),
        website: normalizeWebsite(companyWebsite) ?? "",
        phone: companyPhone.trim(),
        city: city.trim(),
        state: state.trim(),
      });
      if (!companyResult.ok) {
        setFormError(companyResult.error.message);
        setSaving(false);
        return;
      }
      const contactResult = await updateContact(editingContact.id, {
        companyId,
        name: contactName.trim(),
        roleTitle: roleTitle.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      if (!contactResult.ok) {
        setFormError(contactResult.error.message);
        setSaving(false);
        return;
      }
      setShowForm(false);
      resetForm();
      await load();
      setNotice({ tone: "success", message: "Contato e empresa atualizados." });
      setSaving(false);
      return;
    }

    let newCompanyId = companyId;
    if (!newCompanyId) {
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
        setFormError(companyResult.error.message);
        setSaving(false);
        return;
      }
      newCompanyId = companyResult.data.id;
    }

    const contactResult = await createContact({
      companyId: newCompanyId,
      name: contactName.trim(),
      roleTitle: roleTitle.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    if (!contactResult.ok) {
      setFormError(contactResult.error.message);
      setSaving(false);
      return;
    }
    setShowForm(false);
    resetForm();
    await load();
    setNotice({ tone: "success", message: "Contato cadastrado com a empresa vinculada." });
    setSaving(false);
  }

  async function promoteToProspect(contact: Contact) {
    if (busyProspect) return;
    setBusyProspect(contact.id);
    setNotice(null);
    const result = await createProspect({
      companyId: contact.companyId,
      status: "new",
      temperature: "warm",
      score: 50,
    });
    if (!result.ok) setNotice({ tone: "error", message: result.error.message });
    else {
      setProspects((current) => [result.data, ...current]);
      setNotice({ tone: "success", message: `${contact.companyName} foi enviada para Prospects.` });
    }
    setBusyProspect(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <UserRound aria-hidden="true" className="h-4 w-4" /> Base de relacionamento
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{mod.label}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cadastre pessoas junto com suas empresas e prepare cada relacionamento para virar
            cliente.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm((current) => !current);
            if (showForm) resetForm();
          }}
          aria-expanded={showForm}
        >
          <Plus aria-hidden="true" /> {showForm ? "Fechar formulário" : "Novo contato"}
        </Button>
      </header>

      <Notice notice={notice} onDismiss={() => setNotice(null)} />

      {showForm && (
        <form className="surface-card grid gap-4 p-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <h2 className="font-display text-lg font-semibold">
              {editingContact ? "Editar empresa e contato" : "Nova empresa e contato"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A empresa fica vinculada ao contato e poderá avançar para Prospects, Pipeline e
              Clientes.
            </p>
          </div>

          <FieldGroup
            title="Dados da empresa"
            description="Informações jurídicas e comerciais do negócio."
            icon={<Building2 aria-hidden="true" className="h-4 w-4 text-lime" />}
          >
            <Field
              label="Empresa já cadastrada (opcional)"
              hint="Selecione para vincular o contato a uma empresa existente."
              full
            >
              <AppSelect
                ariaLabel="Empresa já cadastrada"
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                placeholder="Cadastrar uma nova empresa"
                options={companies.map((company) => ({
                  value: company.id,
                  label: company.name,
                }))}
                disabled={Boolean(editingContact)}
              />
            </Field>
            {(!selectedCompanyId || editingContact) && (
              <>
                <Field label="Nome da empresa">
                  <Input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    required
                  />
                </Field>
                <Field
                  label="Site da empresa"
                  hint="Aceita apenas o domínio; o https é adicionado."
                >
                  <Input
                    value={companyWebsite}
                    onChange={(event) => setCompanyWebsite(event.target.value)}
                    placeholder="empresa.com.br"
                  />
                </Field>
                <Field label="Telefone comercial">
                  <Input
                    value={companyPhone}
                    onChange={(event) => setCompanyPhone(event.target.value)}
                    placeholder="(65) 3000-0000"
                  />
                </Field>
                <Field label="Cidade">
                  <Input value={city} onChange={(event) => setCity(event.target.value)} />
                </Field>
                <Field label="Estado (UF)">
                  <Input
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                    placeholder="MT"
                    maxLength={2}
                  />
                </Field>
              </>
            )}
          </FieldGroup>

          <FieldGroup
            title="Dados da pessoa"
            description="Quem fala pela empresa e por onde falar com ela."
            icon={<UserRound aria-hidden="true" className="h-4 w-4 text-lime" />}
          >
            <Field label="Nome do contato">
              <Input
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                required
              />
            </Field>
            <Field label="Cargo ou função">
              <Input
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Proprietário, comercial…"
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="pessoa@empresa.com.br"
              />
            </Field>
            <Field label="Telefone ou WhatsApp" hint="Use DDD; o WhatsApp usa o mesmo número.">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
          </FieldGroup>

          <Notice
            notice={formError ? { tone: "error", message: formError } : null}
            className="md:col-span-2"
          />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button disabled={saving} type="submit">
              {saving ? "Salvando…" : editingContact ? "Salvar alterações" : "Salvar contato"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar contato, empresa, cidade, e-mail ou telefone"
            aria-label="Buscar contatos"
            className="pl-9"
          />
        </div>
        <AppSelect
          ariaLabel="Filtrar por relacionamento"
          className="sm:w-56"
          value={relation}
          onValueChange={setRelation}
          options={[
            { value: "all", label: "Todos os contatos" },
            { value: "clients", label: "Clientes atuais" },
            { value: "potential", label: "Potenciais clientes" },
          ]}
        />
      </div>

      {loading && <LoadingState label="Carregando contatos…" />}
      {!loading && loadError && (
        <ApiUnavailableState message={loadError} onRetry={() => void load()} />
      )}
      {!loading && !loadError && contacts.length === 0 && (
        <EmptyState
          title="Nenhum contato cadastrado"
          description="Cadastre o primeiro contato com os dados da empresa para iniciar seu relacionamento comercial."
          action={<Button onClick={() => setShowForm(true)}>Cadastrar contato</Button>}
        />
      )}
      {!loading && !loadError && contacts.length > 0 && visible.length === 0 && (
        <EmptyState
          title="Nenhum resultado para esta busca"
          description="Revise o termo pesquisado ou troque o filtro de relacionamento."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setRelation("all");
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      )}
      {!loading && !loadError && visible.length > 0 && (
        <ul className="grid list-none gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((contact) => (
            <li key={contact.id}>
              <article className="surface-card h-full p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-semibold">{contact.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {contact.roleTitle ?? "Contato comercial"}
                    </p>
                  </div>
                  {contact.clientId ? (
                    <StatusBadge
                      status={contact.clientStatus ?? "active"}
                      label="Cliente atual"
                      tone="info"
                    />
                  ) : (
                    <StatusBadge label="Potencial cliente" tone="positive" />
                  )}
                </div>
                <div className="mt-5 rounded-lg border border-border/60 bg-surface/50 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Empresa
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                    <Building2 aria-hidden="true" className="h-4 w-4 shrink-0 text-lime" />
                    <span className="truncate">{contact.companyName}</span>
                  </div>
                  {(contact.companyCity || contact.companyState) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                      {[contact.companyCity, contact.companyState].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {contact.companyPhone && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone aria-hidden="true" className="h-3.5 w-3.5" /> {contact.companyPhone}
                      <span className="text-muted-foreground/70">· comercial</span>
                    </div>
                  )}
                  {contact.companyWebsite && (
                    <a
                      className="mt-2 flex items-center gap-2 truncate text-xs text-lime hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      href={contact.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Globe2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      {contact.companyWebsite.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="text-[11px] uppercase tracking-wider">Contato direto</div>
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone aria-hidden="true" className="h-3.5 w-3.5" /> {contact.phone}
                    </div>
                  )}
                  {!contact.email && !contact.phone && <p>Sem canal direto cadastrado.</p>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-5 w-full"
                  disabled={
                    Boolean(contact.clientId) ||
                    prospectCompanyIds.has(contact.companyId) ||
                    busyProspect !== null
                  }
                  onClick={() => void promoteToProspect(contact)}
                >
                  {contact.clientId
                    ? "Cliente atual"
                    : prospectCompanyIds.has(contact.companyId)
                      ? "Já está em Prospects"
                      : busyProspect === contact.id
                        ? "Enviando…"
                        : "Enviar para Prospects"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => startEditing(contact)}
                >
                  <Pencil aria-hidden="true" className="h-4 w-4" /> Editar contato e empresa
                </Button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

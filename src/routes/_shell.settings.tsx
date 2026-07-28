import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, Check, CreditCard, ExternalLink, KeyRound, Link2, Mail, MessageCircle, Plus, Save, ShieldCheck, Unplug, UserRound, X } from "lucide-react";
import { getModule } from "@/lib/modules";
import {
  fetchIntegrations,
  fetchEvolutionInstances,
  createEvolutionInstance,
  connectEvolutionInstance,
  disconnectEvolutionInstance,
  fetchMe,
  removeIntegration,
  saveIntegration,
  type Integration,
  type IntegrationProvider,
  type Me,
  type EvolutionInstance,
} from "@/lib/api-client";
import { ApiUnavailableState, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const mod = getModule("settings")!;

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({ meta: [{ title: `${mod.label} · Ctrl LTV` }] }),
  component: SettingsPage,
});

type Field = { key: string; label: string; placeholder: string };

const integrationDefinitions: Array<{
  provider: IntegrationProvider;
  title: string;
  description: string;
  icon: typeof Link2;
  fields: Field[];
  note: string;
  docsUrl: string;
}> = [
  {
    provider: "google_places",
    title: "Google Maps / Places",
    description: "Use a Places API para formar listas de empresas e iniciar a captação.",
    icon: Link2,
    fields: [{ key: "apiKey", label: "Google Places API Key", placeholder: "AIza…" }],
    note: "A chave é criptografada no backend e nunca volta para o navegador.",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
  },
  {
    provider: "serper",
    title: "Serper Google Maps",
    description: "Use buscas locais rápidas para validar nicho, cidade e volume de oportunidades.",
    icon: Link2,
    fields: [{ key: "apiKey", label: "Serper API Key", placeholder: "Chave do Serper" }],
    note: "A chave é criptografada no backend e usada somente pelo worker de captação.",
    docsUrl: "https://serper.dev/api-key",
  },
  {
    provider: "rapidapi",
    title: "RapidAPI Local Business",
    description: "Enriqueça empresas locais usando o endpoint exato assinado na sua conta RapidAPI.",
    icon: Link2,
    fields: [
      { key: "apiKey", label: "RapidAPI Key", placeholder: "Chave da RapidAPI" },
      { key: "host", label: "Host da API", placeholder: "exemplo.p.rapidapi.com" },
      { key: "endpoint", label: "Endpoint de coleta", placeholder: "https://..." },
    ],
    note: "O host e o endpoint devem corresponder à API em que sua conta está inscrita.",
    docsUrl: "https://rapidapi.com/developer/dashboard",
  },
  {
    provider: "apify",
    title: "Apify Google Maps",
    description: "Execute um Actor aprovado para coletar resultados do Google Maps em baixo volume.",
    icon: Link2,
    fields: [
      { key: "apiToken", label: "Apify API Token", placeholder: "Token da Apify" },
      { key: "actorId", label: "Actor ID", placeholder: "vendor/actor" },
    ],
    note: "O Actor precisa estar aprovado e testado na conta Apify antes da execução.",
    docsUrl: "https://console.apify.com/account/integrations",
  },
  {
    provider: "email",
    title: "E-mail transacional",
    description: "Deixe uma conta pronta para avisos, follow-ups e notificações do sistema.",
    icon: Mail,
    fields: [
      { key: "fromAddress", label: "E-mail remetente", placeholder: "contato@suaempresa.com" },
      { key: "apiKey", label: "API Key", placeholder: "Chave do provedor de e-mail" },
    ],
    note: "O envio comercial continuará sujeito às preferências e políticas de comunicação.",
    docsUrl: "https://resend.com/api-keys",
  },
  {
    provider: "asaas",
    title: "Asaas · Cobranças",
    description: "Prepare a geração de cobranças, links de pagamento e confirmação de recebimentos.",
    icon: CreditCard,
    fields: [
      { key: "apiKey", label: "API Key do Asaas", placeholder: "$aact_…" },
      { key: "webhookToken", label: "Token de autenticação do webhook", placeholder: "Token definido no Asaas" },
      { key: "environment", label: "Ambiente", placeholder: "sandbox ou production" },
    ],
    note: "Começaremos pelo Sandbox. A API Key fica criptografada no backend e nunca é exibida novamente.",
    docsUrl: "https://docs.asaas.com/docs/sandbox",
  },
];

function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [evolutionInstances, setEvolutionInstances] = useState<EvolutionInstance[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const [meResult, integrationResult, evolutionResult] = await Promise.all([
      fetchMe(),
      fetchIntegrations(),
      fetchEvolutionInstances(),
    ]);
    if (!meResult.ok || !integrationResult.ok || !evolutionResult.ok) {
      setError("Não foi possível carregar as configurações.");
      return;
    }
    setMe(meResult.data);
    setIntegrations(integrationResult.data);
    setEvolutionInstances(evolutionResult.data);
  }

  useEffect(() => {
    void load();
  }, []);

  const integrationByProvider = useMemo(
    () => new Map(integrations.map((integration) => [integration.provider, integration])),
    [integrations],
  );

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
          <ShieldCheck className="h-4 w-4" /> Governança
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold">{mod.label}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Conta, organização, integrações e políticas da operação.</p>
      </header>

      {error && <ApiUnavailableState message={error} />}
      {!error && !me && <EmptyState title="Carregando conta" description="Consultando sua sessão." />}
      {me && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="surface-card p-5">
              <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-lime" /><h2 className="font-display text-lg font-semibold">Usuário</h2></div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div><dt className="text-xs text-muted-foreground">Nome</dt><dd className="mt-1 font-medium">{me.user.displayName}</dd></div>
                <div><dt className="text-xs text-muted-foreground">E-mail</dt><dd className="mt-1 break-all font-medium">{me.user.email}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Perfil</dt><dd className="mt-1 capitalize text-lime">{me.activeMembership.role}</dd></div>
              </dl>
            </section>
            <section className="surface-card p-5">
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-lime" /><h2 className="font-display text-lg font-semibold">Organização ativa</h2></div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div><dt className="text-xs text-muted-foreground">Nome</dt><dd className="mt-1 font-medium">{me.activeMembership.organizationName}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Organizações vinculadas</dt><dd className="mt-1 font-medium">{me.memberships.length}</dd></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><KeyRound className="h-3.5 w-3.5" /> Segredos ficam no backend.</div>
              </dl>
            </section>
          </div>

          <section className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime"><Link2 className="h-4 w-4" /> Integrações</div>
              <h2 className="mt-2 font-display text-2xl font-bold">Conecte as ferramentas da operação</h2>
              <p className="mt-1 text-sm text-muted-foreground">As credenciais são armazenadas de forma protegida e nunca são exibidas novamente.</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <EvolutionCard
                instances={evolutionInstances}
                onChanged={(instances) => setEvolutionInstances(instances)}
              />
              {integrationDefinitions.map((definition) => (
                <IntegrationCard
                  key={definition.provider}
                  definition={definition}
                  integration={integrationByProvider.get(definition.provider)}
                  onSaved={(saved) => setIntegrations((current) => [...current.filter((item) => item.provider !== saved.provider), saved])}
                  onRemoved={(provider) => setIntegrations((current) => current.filter((item) => item.provider !== provider))}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function EvolutionCard({
  instances,
  onChanged,
}: {
  instances: EvolutionInstance[];
  onChanged: (instances: EvolutionInstance[]) => void;
}) {
  const [label, setLabel] = useState("WhatsApp comercial");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function createInstance() {
    setBusy(true);
    setMessage(null);
    const created = await createEvolutionInstance(label);
    if (!created.ok) {
      setMessage(created.error.message);
      setBusy(false);
      return;
    }
    onChanged([created.data, ...instances]);
    const connection = await connectEvolutionInstance(created.data.id);
    if (connection.ok) setQrCode(connection.data.qrCode);
    else setMessage(connection.error.message);
    setBusy(false);
  }

  async function reconnect(instance: EvolutionInstance) {
    setBusy(true);
    setMessage(null);
    const result = await connectEvolutionInstance(instance.id);
    if (result.ok) {
      setQrCode(result.data.qrCode);
      setMessage(result.data.qrCode ? "Leia o QR Code no WhatsApp." : "Conexão solicitada.");
    } else setMessage(result.error.message);
    setBusy(false);
  }

  async function disconnect(instance: EvolutionInstance) {
    setBusy(true);
    const result = await disconnectEvolutionInstance(instance.id);
    if (result.ok) {
      onChanged(instances.map((item) => item.id === instance.id ? { ...item, status: "disconnected" } : item));
      setQrCode(null);
      setMessage("WhatsApp desconectado.");
    } else setMessage(result.error.message);
    setBusy(false);
  }

  return (
    <section className="surface-card p-5 xl:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-lime/10 text-lime"><MessageCircle className="h-4 w-4" /></div>
          <div>
            <h3 className="font-display text-lg font-semibold">WhatsApp · Evolution API</h3>
            <p className="mt-1 text-sm text-muted-foreground">Conecte pelo QR Code. Chaves técnicas ficam somente no servidor.</p>
          </div>
        </div>
        <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-lime">
          {instances.some((item) => item.status === "connected") ? "conectado" : "aguardando conexão"}
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Nome desta conexão" />
        <Button disabled={busy || label.trim().length < 2} onClick={() => void createInstance()} type="button">
          <Plus className="mr-2 h-4 w-4" /> Nova conexão
        </Button>
      </div>
      {qrCode && <div className="mt-5 rounded-xl border border-lime/20 bg-white p-4 text-center"><img alt="QR Code para conectar o WhatsApp" className="mx-auto max-h-64" src={qrCode} /></div>}
      <div className="mt-5 grid gap-2">
        {instances.map((instance) => (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3" key={instance.id}>
            <div><p className="text-sm font-semibold">{instance.label}</p><p className="mt-1 text-xs text-muted-foreground">{instance.phoneNumber ?? instance.instanceName} · {instance.status}</p></div>
            <div className="flex gap-2">
              {instance.status !== "connected" && <Button disabled={busy} onClick={() => void reconnect(instance)} type="button" variant="outline">Exibir QR</Button>}
              {instance.status === "connected" && <Button disabled={busy} onClick={() => void disconnect(instance)} type="button" variant="outline"><Unplug className="mr-2 h-4 w-4" /> Desconectar</Button>}
            </div>
          </div>
        ))}
        {instances.length === 0 && <p className="text-sm text-muted-foreground">Nenhum WhatsApp conectado ainda.</p>}
      </div>
      {message && <p className="mt-3 text-xs text-lime">{message}</p>}
      <p className="mt-4 text-xs leading-5 text-muted-foreground">As mensagens continuam passando por elegibilidade, aprovação e auditoria antes do envio. A conexão futura do Instagram por login será criada em módulo separado.</p>
    </section>
  );
}

function IntegrationCard({
  definition,
  integration,
  onSaved,
  onRemoved,
}: {
  definition: (typeof integrationDefinitions)[number];
  integration?: Integration;
  onSaved: (integration: Integration) => void;
  onRemoved: (provider: IntegrationProvider) => void;
}) {
  const Icon = definition.icon;
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await saveIntegration({
      provider: definition.provider,
      label: definition.title,
      config: definition.provider === "email" ? { fromAddress: values.fromAddress ?? "" } : definition.provider === "rapidapi" ? { host: values.host ?? "", endpoint: values.endpoint ?? "" } : definition.provider === "apify" ? { actorId: values.actorId ?? "" } : definition.provider === "asaas" ? { environment: values.environment ?? "sandbox" } : {},
      secrets: Object.fromEntries(Object.entries(values).filter(([key]) => !["host", "endpoint", "actorId", "fromAddress", "environment"].includes(key))),
    });
    if (result.ok) {
      onSaved(result.data);
      setValues({});
      setMessage("Integração salva com segurança.");
    } else setMessage(result.error.message);
    setBusy(false);
  }

  async function handleRemove() {
    setBusy(true);
    setMessage(null);
    const result = await removeIntegration(definition.provider);
    if (result.ok) {
      onRemoved(definition.provider);
      setMessage("Credenciais removidas.");
    } else setMessage(result.error.message);
    setBusy(false);
  }

  return (
    <form autoComplete="off" className="surface-card p-5" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-lime/10 text-lime"><Icon className="h-4 w-4" /></div><div><h3 className="font-display text-lg font-semibold">{definition.title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{definition.description}</p></div></div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${integration?.hasCredentials ? "border-lime/30 bg-lime/10 text-lime" : "border-border/60 text-muted-foreground"}`}>
          {integration?.hasCredentials ? "configurado" : "não configurado"}
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        {definition.fields.map((field) => (
          <label key={field.key} className="block space-y-2 text-sm font-medium">
            {field.label}
            <Input
              autoComplete={field.key.toLowerCase().includes("token") || field.key.toLowerCase().includes("secret") || field.key.toLowerCase().includes("apikey") ? "new-password" : "off"}
              data-form-type="other"
              name={`integration-${definition.provider}-${field.key}`}
              type={field.key.toLowerCase().includes("token") || field.key.toLowerCase().includes("secret") || field.key.toLowerCase().includes("apikey") ? "password" : "text"}
              value={values[field.key] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              placeholder={integration?.hasCredentials ? "Já configurado · informe apenas para substituir" : field.placeholder}
            />
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">{definition.note}</p>
      <a href={definition.docsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-lime hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Onde obter esta credencial</a>
      {message && <p className="mt-3 flex items-center gap-2 text-xs text-lime"><Check className="h-3.5 w-3.5" /> {message}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button disabled={busy} type="submit"><Save className="mr-2 h-4 w-4" /> {busy ? "Salvando…" : "Salvar integração"}</Button>
        {integration?.hasCredentials && <Button disabled={busy} onClick={() => void handleRemove()} type="button" variant="outline"><X className="mr-2 h-4 w-4" /> Remover</Button>}
      </div>
    </form>
  );
}

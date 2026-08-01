import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { API_BASE_URL, fetchMe, login, requestAccess } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function SessionGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "authenticated" | "login">(
    API_BASE_URL ? "loading" : "authenticated",
  );
  const [mode, setMode] = useState<"login" | "request">("login");

  useEffect(() => {
    if (!API_BASE_URL) return;
    fetchMe().then((result) => setState(result.ok ? "authenticated" : "login"));
  }, []);

  if (state === "authenticated") return children;
  if (state === "loading") return <LoadingScreen />;
  return mode === "login" ? (
    <LoginScreen
      onAuthenticated={() => setState("authenticated")}
      onRequestAccess={() => setMode("request")}
    />
  ) : (
    <RequestAccessScreen onBackToLogin={() => setMode("login")} />
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-lime" />
        Conectando ao Ctrl LTV local…
      </div>
    </div>
  );
}

function LoginScreen({
  onAuthenticated,
  onRequestAccess,
}: {
  onAuthenticated: () => void;
  onRequestAccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await login(email.trim(), password);
    if (result.ok) onAuthenticated();
    else setError(result.error.message);
    setSubmitting(false);
  }

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-lime/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-violet/10 blur-3xl" />
      <main className="relative m-auto w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime text-lime-foreground shadow-lg shadow-lime/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-[0.14em]">CTRL LTV</div>
            <div className="text-xs text-muted-foreground">Growth Operating System</div>
          </div>
        </div>
        <section className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <LockKeyhole className="h-4 w-4" /> Acesso local
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold">Entre no seu workspace</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use suas credenciais para acessar o painel e os dados da sua organização.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm font-medium">
              E-mail
              <Input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Senha
              <Input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? "Entrando…" : "Entrar"}
              {!submitting && <ArrowRight />}
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button className="w-full" onClick={onRequestAccess} type="button" variant="outline">
            Solicitar acesso
          </Button>
        </section>
      </main>
    </div>
  );
}

function RequestAccessScreen({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleOrganizationChange(value: string) {
    setOrganizationName(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    if (submitting) return;
    const result = await requestAccess({
      displayName: displayName.trim(),
      organizationName: organizationName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      message: message.trim() || undefined,
      website,
    });
    if (result.ok) {
      setDisplayName("");
      setOrganizationName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setWebsite("");
      setConsent(false);
      setSuccess(true);
    } else setError(result.error.message);
    setSubmitting(false);
  }

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-lime/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-violet/10 blur-3xl" />
      <main className="relative m-auto w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime text-lime-foreground shadow-lg shadow-lime/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-[0.14em]">CTRL LTV</div>
            <div className="text-xs text-muted-foreground">Growth Operating System</div>
          </div>
        </div>
        <section className="surface-card p-6 sm:p-8">
          <button
            className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={onBackToLogin}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para entrar
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <Building2 className="h-4 w-4" /> Solicitação de acesso
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold">Converse com nosso time</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Envie seus dados para análise. Esta solicitação não cria uma conta nem garante aprovação
            automática.
          </p>
          {success ? (
            <div
              className="mt-6 rounded-xl border border-lime/30 bg-lime/10 p-5"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-6 w-6 text-lime" />
              <h2 className="mt-3 font-display text-lg font-semibold">Solicitação recebida</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Nossa equipe avaliará o contato. Se você não fez esta solicitação, ignore a mensagem
                de confirmação.
              </p>
              <Button
                className="mt-5 w-full"
                onClick={onBackToLogin}
                type="button"
                variant="outline"
              >
                Voltar para entrar
              </Button>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2 text-sm font-medium">
                Seu nome
                <Input
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Nome do workspace
                <Input
                  autoComplete="organization"
                  value={organizationName}
                  onChange={(event) => handleOrganizationChange(event.target.value)}
                  required
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                E-mail
                <Input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Telefone{" "}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                <Input
                  autoComplete="tel"
                  maxLength={40}
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Como podemos ajudar?{" "}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                <Textarea
                  maxLength={2000}
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>
              <div
                className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                aria-hidden="true"
              >
                <label>
                  Website
                  <Input
                    autoComplete="off"
                    tabIndex={-1}
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </label>
              </div>
              <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  required
                  aria-label="Autorizo contato sobre minha solicitação"
                />
                <span>
                  Autorizo o contato sobre esta solicitação e o tratamento dos dados informados para
                  essa finalidade.
                </span>
              </label>
              {error && (
                <p
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </p>
              )}
              <Button className="w-full" disabled={submitting || !consent} type="submit">
                {submitting ? "Enviando…" : "Enviar solicitação"}
                {!submitting && <ArrowRight />}
              </Button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

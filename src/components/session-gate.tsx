import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Building2, LockKeyhole, Sparkles } from "lucide-react";
import { API_BASE_URL, bootstrap, fetchMe, login } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SessionGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "authenticated" | "login">(
    API_BASE_URL ? "loading" : "authenticated",
  );
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    if (!API_BASE_URL) return;
    fetchMe().then((result) => setState(result.ok ? "authenticated" : "login"));
  }, []);

  if (state === "authenticated") return children;
  if (state === "loading") return <LoadingScreen />;
  return mode === "login" ? (
    <LoginScreen
      onAuthenticated={() => setState("authenticated")}
      onCreateAccount={() => setMode("register")}
    />
  ) : (
    <RegisterScreen
      onAuthenticated={() => setState("authenticated")}
      onBackToLogin={() => setMode("login")}
    />
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
  onCreateAccount,
}: {
  onAuthenticated: () => void;
  onCreateAccount: () => void;
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
          <Button className="w-full" onClick={onCreateAccount} type="button" variant="outline">
            Criar meu workspace
          </Button>
        </section>
      </main>
    </div>
  );
}

function RegisterScreen({
  onAuthenticated,
  onBackToLogin,
}: {
  onAuthenticated: () => void;
  onBackToLogin: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleOrganizationChange(value: string) {
    setOrganizationName(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await bootstrap({
      displayName: displayName.trim(),
      organizationName: organizationName.trim(),
      organizationSlug: slugify(organizationName),
      email: email.trim(),
      password,
    });
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
          <button
            className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={onBackToLogin}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para entrar
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
            <Building2 className="h-4 w-4" /> Novo workspace
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold">Comece seu workspace</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Crie sua conta de proprietário para começar a organizar captação, clientes e LTV.
          </p>
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
              Senha
              <Input
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <span className="block text-xs font-normal text-muted-foreground">Mínimo de 8 caracteres.</span>
            </label>
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? "Criando workspace…" : "Criar workspace"}
              {!submitting && <ArrowRight />}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "meu-workspace"
  );
}

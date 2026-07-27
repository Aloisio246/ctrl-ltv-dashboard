import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { API_BASE_URL, fetchMe, login } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SessionGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "authenticated" | "login">(
    API_BASE_URL ? "loading" : "authenticated",
  );

  useEffect(() => {
    if (!API_BASE_URL) return;
    fetchMe().then((result) => setState(result.ok ? "authenticated" : "login"));
  }, []);

  if (state === "authenticated") return children;
  if (state === "loading") return <LoadingScreen />;
  return <LoginScreen onAuthenticated={() => setState("authenticated")} />;
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

function LoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
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
            Use as credenciais do backend local para acessar o painel e os dados da sua organização.
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
        </section>
      </main>
    </div>
  );
}

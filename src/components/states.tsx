import { cn } from "@/lib/utils";
import { Loader2, Inbox, PlugZap } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Carregando…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground", className)}>
      <Loader2 className="h-5 w-5 animate-spin text-lime" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 py-12 text-center", className)}>
      <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ApiUnavailableState({
  className,
  onRetry,
}: {
  className?: string;
  onRetry?: () => void;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-warning/30 bg-warning/5 py-10 text-center", className)}>
      <div className="grid h-12 w-12 place-items-center rounded-full bg-warning/15 text-warning">
        <PlugZap className="h-5 w-5" />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-foreground">API indisponível</h3>
        <p className="text-xs text-muted-foreground">Ainda não conectamos o backend do Ctrl LTV. Os dados exibidos são simulados.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-border/70 bg-background/50 px-3 py-1.5 text-xs text-foreground hover:border-lime/40"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

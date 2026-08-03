import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type NoticeTone = "success" | "error" | "info";

export type NoticeState = { tone: NoticeTone; message: string } | null;

const toneStyles: Record<NoticeTone, { wrapper: string; icon: typeof Info }> = {
  success: { wrapper: "border-lime/30 bg-lime/10 text-lime", icon: CheckCircle2 },
  error: { wrapper: "border-danger/40 bg-danger/10 text-danger", icon: AlertCircle },
  info: { wrapper: "border-border bg-surface-2 text-foreground", icon: Info },
};

/**
 * Mensagem de resultado de uma operação, anunciada para leitores de tela
 * e sempre exibida perto da ação que a gerou.
 */
export function Notice({
  notice,
  onDismiss,
  className,
}: {
  notice: NoticeState;
  onDismiss?: () => void;
  className?: string;
}) {
  if (!notice) return null;
  const style = toneStyles[notice.tone];
  const Icon = style.icon;

  return (
    <div
      role={notice.tone === "error" ? "alert" : "status"}
      aria-live={notice.tone === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm",
        style.wrapper,
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1">{notice.message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar mensagem"
          className="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

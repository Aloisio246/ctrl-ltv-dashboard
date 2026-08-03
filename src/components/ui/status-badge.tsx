import { cn } from "@/lib/utils";
import { getStatusMeta, toneClasses, toneDotClasses, type StatusTone } from "@/lib/status";

/**
 * Selo de status acessível: rótulo em português + marcador,
 * nunca dependendo só da cor para comunicar o estado.
 */
export function StatusBadge({
  status,
  label,
  tone,
  className,
}: {
  status?: string | null;
  label?: string;
  tone?: StatusTone;
  className?: string;
}) {
  const meta = getStatusMeta(status);
  const finalTone = tone ?? meta.tone;
  const finalLabel = label ?? meta.label;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        toneClasses[finalTone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", toneDotClasses[finalTone])}
      />
      {finalLabel}
    </span>
  );
}

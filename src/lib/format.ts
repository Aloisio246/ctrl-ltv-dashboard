export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export const num = new Intl.NumberFormat("pt-BR");

export const pct = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatMetric(
  value: number,
  format: "number" | "currency" | "percent",
): string {
  if (format === "currency") return brl.format(value);
  if (format === "percent") return pct.format(value);
  return num.format(value);
}

export function toIsoDate(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

/**
 * Formatação segura de datas vindas da API: nunca lança "Invalid time value"
 * e mostra um traço quando o valor está ausente ou inválido.
 */
function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string | null | undefined, fallback = "—"): string {
  const date = parseDate(value);
  return date ? date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : fallback;
}

export function formatDate(value: string | null | undefined, fallback = "—"): string {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("pt-BR") : fallback;
}

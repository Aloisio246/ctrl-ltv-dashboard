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

export function formatMetric(value: number, format: "number" | "currency" | "percent"): string {
  if (format === "currency") return brl.format(value);
  if (format === "percent") return pct.format(value);
  return num.format(value);
}

/**
 * Safe conversion to ISO date. Uses parseDate to avoid throwing RangeError.
 */
export function toIsoDate(value: string | number | Date | null | undefined): string | undefined {
  const date = parseDate(value);
  return date ? date.toISOString() : undefined;
}

/**
 * Formatação segura de datas vindas da API: nunca lança "Invalid time value"
 * e mostra um traço quando o valor está ausente ou inválido.
 */
export function parseDate(value: string | number | Date | null | undefined): Date | null {
  // null / undefined / empty
  if (value === null || value === undefined || value === "") return null;
  // Date instance
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  // number (unix ms)
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // treat string forms explicitly first
  const raw = String(value).trim();
  if (raw === "") return null;
  // YYYY-MM-DD -> treat as local day at noon to avoid timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // YYYY-MM -> treat as first day of month at noon (local)
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}-01T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // fallback to generic parse
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const date = parseDate(value);
  return date ? date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : fallback;
}

export function formatDate(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("pt-BR") : fallback;
}

export function formatMonthShort(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const date = parseDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
}

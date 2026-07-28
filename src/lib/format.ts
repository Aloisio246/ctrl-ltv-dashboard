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

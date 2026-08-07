import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { brl, formatMonthShort } from "@/lib/format";
import { motion as m } from "@/lib/motion";

export function RevenueChart({
  data,
}: {
  data: Array<{ month: string; mrr: string | number; revenue: string | number }>;
}) {
  const revenueSeries = data.map((item) => ({
    month: formatMonthShort(item.month),
    mrr: Number(item.mrr),
    revenue: Number(item.revenue),
  }));
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: m.duration.slow, ease: m.ease.enter, delay: 0.18 }}
      className="surface-card p-5 md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Evolução de receita</h2>
          <p className="text-xs text-muted-foreground">
            MRR e receita recebida nos últimos 12 meses
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-lime" /> MRR
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet" /> Receita recebida
          </span>
        </div>
      </div>

      <div className="h-64 md:h-72">
        {revenueSeries.length === 0 && (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Sem histórico financeiro para o período.
          </div>
        )}
        {revenueSeries.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="lime-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.88 0.22 130)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.88 0.22 130)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="violet-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.7 0.19 285)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.7 0.19 285)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                stroke="oklch(0.68 0.02 250)"
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="oklch(0.68 0.02 250)"
                fontSize={11}
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.2 0.014 250)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "oklch(0.68 0.02 250)" }}
                formatter={(v: number, name) => [brl.format(v), name === "mrr" ? "MRR" : "Receita"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.7 0.19 285)"
                strokeWidth={2}
                fill="url(#violet-fill)"
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="oklch(0.88 0.22 130)"
                strokeWidth={2.5}
                fill="url(#lime-fill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.section>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { motion as m } from "@/lib/motion";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight, Sparkles } from "lucide-react";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: m.duration.slow, ease: m.ease.enter }}
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
      style={{ transition: "width 240ms cubic-bezier(0.2,0,0,1)" }}
    >
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-lime text-lime-foreground shadow-sm">
          <Sparkles className="h-4.5 w-4.5" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="font-display text-[15px] font-bold tracking-[0.14em]">
              CTRL LTV
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              Growth Operating System
            </div>
          </div>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {MODULES.map((mod, i) => {
            const active = pathname === mod.to;
            const Icon = mod.icon;
            return (
              <motion.li
                key={mod.key}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: m.duration.base,
                  ease: m.ease.enter,
                  delay: 0.05 + i * m.stagger.tight,
                }}
              >
                <Link
                  to={mod.to as string as never}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                    "hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "text-foreground"
                      : "text-sidebar-foreground/75 hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      transition={m.spring.snap}
                      className="absolute inset-0 -z-0 rounded-lg bg-sidebar-accent ring-1 ring-inset ring-lime/25"
                    />
                  )}
                  {active && (
                    <span className="absolute left-0 top-1/2 z-10 h-5 -translate-y-1/2 rounded-r-full bg-lime" style={{ width: 3 }} />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 h-4.5 w-4.5 shrink-0",
                      active ? "text-lime" : "text-sidebar-foreground/60 group-hover:text-foreground",
                    )}
                    strokeWidth={2}
                  />
                  {!collapsed && (
                    <span className="relative z-10 truncate">{mod.label}</span>
                  )}
                  {!collapsed && mod.phase === "planned" && (
                    <span className="relative z-10 ml-auto rounded-full border border-border/60 bg-background/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      soon
                    </span>
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </motion.aside>
  );
}

import { Bell, Search, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { motion as m } from "@/lib/motion";
import { useCommandCenter } from "@/components/command-center";
import { MobileNav } from "@/components/shell/mobile-nav";

export function Topbar() {
  const { open } = useCommandCenter();
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: m.duration.base, ease: m.ease.enter, delay: 0.08 }}
      className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-md md:px-6"
    >
      <MobileNav />

      <button
        onClick={open}
        aria-label="Abrir busca global"
        className="group flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-border/70 bg-surface/70 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-lime/40 hover:text-foreground md:max-w-md"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Buscar prospects, clientes, ações…</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border/70 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-block">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-xs text-muted-foreground lg:flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-lime/60" />
          <span className="relative h-2 w-2 rounded-full bg-lime" />
        </span>
        <Activity className="h-3.5 w-3.5" />
        <span>2 jobs em execução</span>
      </div>

      <button
        aria-label="Notificações"
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-border/60 bg-surface/60 text-muted-foreground transition-colors hover:border-lime/40 hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-lime" />
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface/60 px-2 py-1.5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-lime to-violet text-[11px] font-bold text-lime-foreground">
          AI
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-xs font-medium">Aloisio Isidio</div>
          <div className="text-[10px] text-muted-foreground">Ctrl LTV</div>
        </div>
      </div>
    </motion.header>
  );
}

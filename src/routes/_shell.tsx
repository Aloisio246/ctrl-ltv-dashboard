import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { SessionGate } from "@/components/session-gate";
import { DemoDataProvider } from "@/lib/demo/store";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <SessionGate>
      <DemoDataProvider>
        <div className="flex min-h-dvh w-full bg-background text-foreground">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
              <Outlet />
            </main>
          </div>
        </div>
      </DemoDataProvider>
    </SessionGate>
  );
}


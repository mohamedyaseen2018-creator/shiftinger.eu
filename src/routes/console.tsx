import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/console/Sidebar";
import { ConsoleMfaGate } from "@/components/console/ConsoleMfaGate";
import { AdminStoreProvider } from "@/data/adminStore";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/console")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw redirect({ to: "/auth", search: { mode: "signin", role: "worker" } });
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      throw redirect({ to: "/dashboard" });
    }
    return { user: userData.user };
  },
  head: () => ({
    meta: [
      { title: "Admin console — Shiftinger" },
      { name: "description", content: "Shiftinger platform administration and control panel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConsoleLayout,
});

function ConsoleLayout() {
  const [open, setOpen] = useState(false);


  return (
    <AdminStoreProvider>
      <div className="min-h-screen bg-canvas font-sans text-ink">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64">
              <Sidebar onNavigate={() => setOpen(false)} />
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-4 text-white/80"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </aside>
          </div>
        )}

        <div className="lg:pl-64">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-ink">
              <Menu size={22} />
            </button>
            <span className="font-sans text-sm font-bold">Admin console</span>
          </header>

          <main className={cn("mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8")}>
            <Outlet />
          </main>
        </div>
      </div>
    </AdminStoreProvider>
  );
}

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { workspaceNav } from "@/lib/studio-data";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Cloud, Command, LogOut, Menu, Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

export function StudioShell({
  children,
  title,
  subtitle,
  compact = false,
  accountRole,
  credits,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  compact?: boolean;
  accountRole?: string;
  credits?: number | "unlimited";
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(
    location.pathname === "/studio" ? location.hash.replace("#", "") || "projects" : "",
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (location.pathname !== "/studio") {
      setActiveSection("");
      return;
    }
    const sectionId = location.hash.replace("#", "") || "projects";
    setActiveSection(sectionId);
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
    });
  }, [location.hash, location.pathname]);

  async function openSection(sectionId: string) {
    setOpen(false);
    setActiveSection(sectionId);
    if (location.pathname !== "/studio") {
      await navigate({ to: "/studio", hash: sectionId });
      return;
    }
    window.history.replaceState(null, "", `/studio#${sectionId}`);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) return toast.error(error.message);
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign out failed");
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <div className="relative flex min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="aurora-orb pointer-events-none fixed -left-40 -top-40 z-0 size-[34rem] rounded-full bg-neon-violet/10 blur-[120px]" />
      <div className="aurora-orb pointer-events-none fixed -bottom-48 -right-32 z-0 size-[38rem] rounded-full bg-neon-cyan/10 blur-[130px] [animation-delay:-5s]" />
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} glass-panel fixed inset-y-0 left-0 z-50 m-2 flex w-[min(18rem,calc(100vw-1rem))] flex-col rounded-2xl pb-[env(safe-area-inset-bottom)] transition-transform duration-300 lg:static lg:translate-x-0 ${compact ? "lg:w-16" : "lg:w-64"}`}
      >
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-3">
          <BrandMark className="size-8 shrink-0 drop-shadow-[0_0_12px_var(--neon-cyan)]" />
          {!compact && (
            <span className="font-bold tracking-tight">
              FableForge <span className="text-primary">AI</span>
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <ChevronLeft />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {workspaceNav.map((item) => (
            <button
              type="button"
              key={item.label}
              title={compact ? item.label : undefined}
              aria-current={activeSection === item.sectionId ? "page" : undefined}
              onClick={() => void openSection(item.sectionId)}
              className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left font-mono text-[11px] transition-all duration-300 ${activeSection === item.sectionId ? "spectrum-border bg-primary/10 text-neon-cyan" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_12%,transparent)]"}`}
            >
              <item.icon className="size-4 shrink-0" />
              {!compact && item.label}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-2">
          {!compact && (
            <div className="rounded-lg border border-border bg-panel p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {accountRole === "owner" ? "Platform owner" : "Forge credits"}
                </span>
                <span className="font-mono text-primary">
                  {credits === "unlimited"
                    ? "Unlimited"
                    : credits === undefined
                      ? "—"
                      : credits.toLocaleString()}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full bg-primary ${credits === "unlimited" ? "w-full" : credits === undefined ? "w-0" : "w-2/3"}`}
                />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className={`${compact ? "w-full px-0" : "w-full justify-start"}`}
            onClick={signOut}
            disabled={signingOut}
          >
            <LogOut />
            {!compact && (signingOut ? "Signing out…" : "Sign out")}
          </Button>
        </div>
      </aside>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-canvas/80 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="relative z-10 min-w-0 flex-1">
        <header className="glass-panel sticky top-[max(.5rem,env(safe-area-inset-top))] z-30 mx-2 grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl px-2 sm:flex sm:gap-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">
                Project
              </p>
              <h1 className="truncate font-mono text-xs font-semibold uppercase">{title}</h1>
            </div>
            <span className="hidden items-center gap-1 font-mono text-[9px] text-success md:flex">
              <Cloud className="size-3" /> SAVED
            </span>
            {subtitle && (
              <p className="hidden truncate border-l border-border pl-3 text-[10px] text-muted-foreground lg:block">
                {subtitle}
              </p>
            )}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <kbd className="hidden items-center gap-1 rounded border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground sm:flex">
              <Command className="size-3" /> K
            </kbd>
          </div>
        </header>
        {children}
        <nav
          className="glass-panel fixed inset-x-2 bottom-[max(.5rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-4 rounded-2xl p-1 lg:hidden"
          aria-label="Mobile navigation"
        >
          {workspaceNav.map((item) => (
            <button
              type="button"
              key={item.label}
              aria-current={activeSection === item.sectionId ? "page" : undefined}
              onClick={() => void openSection(item.sectionId)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] ${activeSection === item.sectionId ? "bg-primary/10 text-neon-cyan" : "text-muted-foreground"}`}
            >
              <item.icon className="size-4" /> {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function NewProjectButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <Plus /> New game
    </Button>
  );
}

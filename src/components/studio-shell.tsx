import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { workspaceNav } from "@/lib/studio-data";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  ChevronLeft,
  Cloud,
  Command,
  Download,
  Eye,
  LogOut,
  Menu,
  Plus,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

export function StudioShell({
  children,
  title,
  subtitle,
  compact = false,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    navigate({ to: "/auth", replace: true });
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
          >
            <ChevronLeft />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {workspaceNav.map((item, index) => (
            <Link
              key={item.label}
              to="/studio"
              title={compact ? item.label : undefined}
              className={`flex h-10 items-center gap-3 rounded-xl px-3 font-mono text-[11px] transition-all duration-300 ${index === 0 ? "spectrum-border bg-primary/10 text-neon-cyan" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_12%,transparent)]"}`}
            >
              <item.icon className="size-4 shrink-0" />
              {!compact && item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-2">
          {!compact && (
            <div className="rounded-lg border border-border bg-panel p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Forge credits</span>
                <span className="font-mono text-primary">250</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 bg-primary" />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className={`${compact ? "w-full px-0" : "w-full justify-start"}`}
            onClick={signOut}
          >
            <LogOut />
            {!compact && "Sign out"}
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
            <span className="hidden items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 font-mono text-[10px] text-muted-foreground lg:flex">
              <BadgeDollarSign className="size-3 text-accent" /> 2,400
            </span>
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              <Eye /> Preview
            </Button>
            <Button
              size="sm"
              className="hidden bg-linear-to-r from-primary via-neon-violet to-neon-pink shadow-[0_0_22px_color-mix(in_oklab,var(--primary)_35%,transparent)] transition-transform hover:scale-[1.03] sm:inline-flex"
            >
              <Download /> Export
            </Button>
          </div>
        </header>
        {children}
        <nav className="glass-panel fixed inset-x-2 bottom-[max(.5rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-4 rounded-2xl p-1 lg:hidden" aria-label="Mobile navigation">
          {workspaceNav.map((item, index) => (
            <Link key={item.label} to="/studio" className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] ${index === 0 ? "bg-primary/10 text-neon-cyan" : "text-muted-foreground"}`}>
              <item.icon className="size-4" /> {item.label}
            </Link>
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

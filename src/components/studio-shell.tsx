import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { workspaceNav } from "@/lib/studio-data";
import { Link, useNavigate } from "@tanstack/react-router";
import { BadgeDollarSign, ChevronLeft, Cloud, Command, Download, Eye, LogOut, Menu, Plus, Rocket } from "lucide-react";
import { useState, type ReactNode } from "react";

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
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0 ${compact ? "lg:w-16" : "lg:w-64"}`}
      >
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-3">
          <BrandMark className="size-8 shrink-0" />
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
              className={`flex h-9 items-center gap-3 rounded-md px-3 font-mono text-[11px] transition-colors ${index === 0 ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_var(--primary)]" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
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
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-panel px-3 backdrop-blur-xl sm:flex sm:px-4">
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
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Project</p>
              <h1 className="truncate font-mono text-xs font-semibold uppercase">{title}</h1>
            </div>
            <span className="hidden items-center gap-1 font-mono text-[9px] text-success md:flex"><Cloud className="size-3" /> SAVED</span>
            {subtitle && <p className="hidden truncate border-l border-border pl-3 text-[10px] text-muted-foreground lg:block">{subtitle}</p>}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <kbd className="flex items-center gap-1 rounded border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
              <Command className="size-3" /> K
            </kbd>
            <span className="hidden items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 font-mono text-[10px] text-muted-foreground lg:flex"><BadgeDollarSign className="size-3 text-accent" /> 2,400</span>
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              <Eye /> Preview
            </Button>
            <Button size="sm">
              <Download /> Export
            </Button>
          </div>
        </header>
        {children}
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

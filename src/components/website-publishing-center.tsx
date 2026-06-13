import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  ArrowRightLeft,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  Globe2,
  History,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

const publishingFeatures = [
  "Custom title and SEO description",
  "Favicon, game icon, and social image",
  "Branded loading and error screens",
  "Analytics and maintenance mode",
  "Automatic HTTPS after verification",
  "Deployment history and rollback",
];

const verificationChecks: Array<{
  label: string;
  status: string;
  icon: LucideIcon;
}> = [
  { label: "Domain ownership", status: "Waiting", icon: Globe2 },
  { label: "DNS records", status: "Not checked", icon: Activity },
  { label: "HTTPS certificate", status: "Not issued", icon: LockKeyhole },
];

export function WebsitePublishingCenter({ gameName }: { gameName: string }) {
  const [domain, setDomain] = useState("");
  const [domainMode, setDomainMode] = useState<"free" | "existing" | "buy">(
    "free",
  );

  function requiresConnectedDomain(action: string) {
    toast.info(
      `${action} becomes available after DNS and HTTPS verification succeeds.`,
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-neon-cyan">
                Secure website delivery
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Website Publishing & Domain Center
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
                Publish {gameName} to a free project address or connect a
                verified custom domain. A domain is never marked connected until
                both DNS and HTTPS checks pass.
              </p>
            </div>
            <Badge
              variant="outline"
              className="w-fit border-warning/40 text-warning"
            >
              NOT PUBLISHED
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                [
                  "free",
                  "Free project domain",
                  "Launch first, connect a custom name later.",
                ],
                [
                  "existing",
                  "Use existing domain",
                  "Connect a root domain or subdomain you own.",
                ],
                [
                  "buy",
                  "Buy a domain",
                  "Open the guided domain purchase workflow.",
                ],
              ] as const
            ).map(([value, label, detail]) => (
              <Button
                key={value}
                variant="outline"
                onClick={() => setDomainMode(value)}
                className={`h-auto min-h-20 items-start justify-start whitespace-normal p-3 text-left ${domainMode === value ? "spectrum-border bg-primary/10" : "bg-panel/60"}`}
              >
                <Globe2 className="mt-0.5 size-4 text-neon-cyan" />
                <span>
                  <strong className="block text-xs text-foreground">
                    {label}
                  </strong>
                  <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">
                    {detail}
                  </span>
                </span>
              </Button>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="flex items-center gap-2">
              <Globe2 className="size-4 text-neon-cyan" />
              <h3 className="text-sm font-semibold">Domain connection</h3>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <Input
                value={domain}
                onChange={(event) => setDomain(event.target.value.trim())}
                placeholder="play.mygame.com"
                inputMode="url"
                aria-label="Domain or subdomain"
              />
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("DNS instructions prepared for review.")
                }
              >
                <Settings2 /> DNS instructions
              </Button>
              <Button
                disabled={!domain}
                onClick={() =>
                  toast.info(
                    "DNS and HTTPS verification started. No connection status has been changed yet.",
                  )
                }
              >
                <RefreshCw /> Check connection
              </Button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {verificationChecks.map(({ label, status, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-canvas/60 p-3"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 text-xs font-medium text-warning">
                    {status}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={() =>
                toast.info(
                  "A production deployment will start only after the project passes its release checks.",
                )
              }
            >
              <CloudUpload /> Publish website game
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info("The latest verified build will be republished.")
              }
            >
              <RefreshCw /> Republish website
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info(
                  "Deployment logs will appear after the first deployment.",
                )
              }
            >
              <History /> Deployment logs
            </Button>
            <Button
              variant="outline"
              onClick={() => requiresConnectedDomain("Set primary domain")}
            >
              <CheckCircle2 /> Set primary domain
            </Button>
            <Button
              variant="outline"
              onClick={() => requiresConnectedDomain("Redirect management")}
            >
              <ArrowRightLeft /> Add redirects
            </Button>
            <Button
              variant="outline"
              onClick={() => requiresConnectedDomain("Deployment rollback")}
            >
              <RotateCcw /> Roll back deployment
            </Button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-neon-cyan" />
              <h3 className="text-sm font-semibold">Release readiness</h3>
            </div>
            <div className="mt-3 space-y-2">
              {publishingFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground"
                >
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />{" "}
                  {feature}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() =>
                toast.info("Opening website metadata and branding settings.")
              }
            >
              <ExternalLink /> Website settings
            </Button>
          </div>
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Trash2 className="size-4 text-destructive" /> Remove domain
            </div>
            <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
              Domain removal is disabled until a verified custom domain exists,
              preventing accidental disruption.
            </p>
            <Button variant="destructive" className="mt-3 w-full" disabled>
              Remove domain
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

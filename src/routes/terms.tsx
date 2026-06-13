import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | FableForge AI" },
      { name: "description", content: "Terms governing use of FableForge AI." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <BrandMark className="size-12" />
      <h1 className="mt-6 text-4xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective June 13, 2026</p>
      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Using the service</h2>
          <p>
            You must provide accurate account information, protect your credentials, and use the
            service lawfully. You may not attempt to bypass access controls, abuse generation
            services, or interfere with other creators&apos; projects.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Projects and generated output</h2>
          <p>
            You remain responsible for reviewing generated code, assets, licenses, security, and
            platform requirements before publishing. Generated output may contain errors and is not
            represented as automatically production-ready.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Plans, credits, and external services
          </h2>
          <p>
            Paid plans, credits, refunds, and renewals apply only when a billing integration is
            active and presented during checkout. Third-party AI, build, storage, and deployment
            providers may be temporarily unavailable.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Suspension and termination</h2>
          <p>
            Access may be limited for fraud, security threats, unlawful activity, or material
            violations. You may stop using the service at any time.
          </p>
        </section>
      </div>
      <Button asChild variant="outline" className="mt-10">
        <Link to="/">Back home</Link>
      </Button>
    </main>
  );
}

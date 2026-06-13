import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | FableForge AI" },
      { name: "description", content: "How FableForge AI handles creator data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <BrandMark className="size-12" />
      <h1 className="mt-6 text-4xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective June 13, 2026</p>
      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Data we process</h2>
          <p>
            FableForge processes account identifiers, profile details, project content, chat
            messages, generation requests, credit transactions, build records, and security logs
            needed to operate the studio.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">How data is used</h2>
          <p>
            Data is used to authenticate you, isolate projects between accounts, provide requested
            generation and build services, prevent abuse, recover failed operations, and diagnose
            service errors.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Service providers</h2>
          <p>
            Requests may be processed by configured authentication, database, AI, 3D generation,
            hosting, email, monitoring, and payment providers. Production operators must publish the
            final provider list and retention periods before accepting real customer data.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Your choices</h2>
          <p>
            You may request access, correction, export, or deletion of personal data through the
            support channel. Some security, billing, and legal records may need to be retained.
          </p>
        </section>
      </div>
      <Button asChild variant="outline" className="mt-10">
        <Link to="/">Back home</Link>
      </Button>
    </main>
  );
}

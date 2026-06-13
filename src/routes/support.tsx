import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support | FableForge AI" },
      { name: "description", content: "Get help with FableForge AI." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <BrandMark className="size-12" />
      <h1 className="mt-6 text-4xl font-semibold">Support</h1>
      <div className="mt-8 rounded-2xl border border-border bg-panel/60 p-6">
        <h2 className="text-lg font-semibold">Before contacting support</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Include the affected project, approximate time, browser, and the action that failed. Do
          not send passwords, access tokens, payment details, private build-agent tokens, or API
          keys.
        </p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          A verified production support address and incident-response workflow must be configured
          before public launch. No message form is shown until delivery and privacy handling are
          connected.
        </p>
      </div>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link to="/auth">Return to sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    </main>
  );
}

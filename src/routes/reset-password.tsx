import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password | FableForge AI" },
      { name: "description", content: "Choose a new password for your FableForge account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setReady(Boolean(data.user));
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return toast.error(error.message);
      toast.success("Password updated. You can continue to your studio.");
      navigate({ to: "/studio", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password could not be updated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className="grid min-h-screen place-items-center px-6 py-12">
      <section className="glass-panel spectrum-border w-full max-w-md rounded-2xl p-7">
        <div className="mb-6 inline-flex size-11 items-center justify-center rounded-xl bg-secondary">
          <KeyRound className="size-5 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use at least eight characters and choose something unique to this account.
        </p>
        {ready ? (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              className="h-11"
            />
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                className="h-11"
              />
            </div>
            <Button disabled={busy} className="h-11 w-full">
              {busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        ) : (
          <div className="mt-7 rounded-xl border border-border bg-panel p-4 text-sm text-muted-foreground">
            This recovery link is invalid or expired. Request a new one from the sign-in page.
          </div>
        )}
        <Button asChild variant="ghost" className="mt-4 w-full">
          <Link to="/auth">Back to sign in</Link>
        </Button>
      </section>
    </main>
  );
}

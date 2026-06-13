import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Globe2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | FableForge AI" },
      {
        name: "description",
        content: "Sign in to build, preview, and export AI-powered games with FableForge.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    if (recovery) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Password reset link sent. Check your email.");
      return;
    }
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: email.split("@")[0] },
              emailRedirectTo: `${window.location.origin}/studio`,
            },
          });
    setBusy(false);
    if (result.error) return toast.error(result.error.message);
    if (mode === "signup" && !result.data.session)
      return toast.success("Check your email to confirm your account.");
    navigate({ to: "/studio" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/studio`,
    });
    if (result.error) toast.error(result.error.message);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-canvas p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="panel-grid absolute inset-0 opacity-20" />
        <div className="relative flex items-center gap-3">
          <BrandMark className="size-11" />
          <span className="text-xl font-bold tracking-tight">
            FableForge <span className="text-primary">AI</span>
          </span>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-[.28em] text-accent">
            Universal game creation engine
          </p>
          <h1 className="text-balance text-6xl font-semibold leading-[.96] tracking-[-.055em]">
            Turn a game idea into a playable world.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Design systems, write code, organize assets, preview instantly, and prepare exports for
            web, mobile, and PC.
          </p>
        </div>
        <div className="relative flex gap-8 font-mono text-xs text-muted-foreground">
          <span>WEB / MOBILE / PC</span>
          <span>LIVE PREVIEW</span>
          <span>VERSIONED BUILDS</span>
        </div>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <BrandMark className="size-10" />
            <span className="text-lg font-bold">FableForge AI</span>
          </div>
          <div className="mb-8">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-secondary">
              <LockKeyhole className="size-5 text-primary" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">
              {recovery ? "Recover your account" : "Enter the forge"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your projects, files, and build sessions sync securely.
            </p>
          </div>
          <Button variant="outline" className="h-11 w-full" onClick={google}>
            <Globe2 /> Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            OR USE EMAIL
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={submit} className="space-y-4">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className="h-11"
            />
            {!recovery && (
              <Input
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-11"
              />
            )}
            <Button disabled={busy} className="h-11 w-full">
              {busy
                ? "Working…"
                : recovery
                  ? "Send reset link"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              <ArrowRight />
            </Button>
          </form>
          <div className="mt-4 space-y-1">
            {mode === "signin" && !recovery && (
              <Button variant="link" className="w-full text-muted-foreground" onClick={() => setRecovery(true)}>
                Forgot your password?
              </Button>
            )}
            <Button
              variant="link"
              className="w-full text-muted-foreground"
              onClick={() => {
                setRecovery(false);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
            >
              {recovery
                ? "Back to sign in"
                : mode === "signin"
                  ? "New creator? Create an account"
                  : "Already have an account? Sign in"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

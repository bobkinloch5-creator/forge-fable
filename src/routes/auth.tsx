import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    if (busy) return;
    setBusy(true);
    try {
      if (recovery) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return toast.error(error.message);
        toast.success("Password reset link sent. Check your email.");
        return;
      }
      const normalizedEmail = email.trim();
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
          : await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                data: { display_name: normalizedEmail.split("@")[0] },
                emailRedirectTo: `${window.location.origin}/studio`,
              },
            });
      if (result.error) return toast.error(result.error.message);
      if (mode === "signup" && !result.data.session) {
        toast.success("Check your email to confirm your account.");
        return;
      }
      navigate({ to: "/studio" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Authentication is temporarily unavailable",
      );
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/studio`,
      });
      if (result.error) toast.error(result.error.message);
      else if (!result.redirected) navigate({ to: "/studio", replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Google sign-in is temporarily unavailable",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
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
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={google}
            disabled={busy}
          >
            <Globe2 /> Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            OR USE EMAIL
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={submit} className="space-y-4">
            <Label htmlFor="auth-email">Email address</Label>
            <Input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className="h-11"
            />
            {!recovery && (
              <div className="space-y-2">
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-11"
                />
              </div>
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
              <Button
                variant="link"
                type="button"
                className="w-full text-muted-foreground"
                onClick={() => setRecovery(true)}
              >
                Forgot your password?
              </Button>
            )}
            <Button
              variant="link"
              type="button"
              className="w-full text-muted-foreground"
              onClick={() => {
                if (recovery) {
                  setRecovery(false);
                  setMode("signin");
                } else {
                  setMode(mode === "signin" ? "signup" : "signin");
                }
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

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";

const tours = {
  dashboard: [
    {
      title: "Start with an idea",
      description:
        "Describe the game you want or choose a starter. You can review every project detail before creation.",
    },
    {
      title: "Track your account",
      description:
        "The project hub shows your plan and live credit balance. Paid access is always verified on the server.",
    },
    {
      title: "Manage safely",
      description:
        "Open, rename, duplicate, or delete projects here. Destructive actions require confirmation.",
    },
  ],
  workspace: [
    {
      title: "Build through conversation",
      description:
        "Ask for mechanics, scenes, fixes, or production plans. Drafts and queued instructions are kept on this device.",
    },
    {
      title: "Choose the right model",
      description:
        "The model menu shows credit cost, speed, and plan access before you submit a request.",
    },
    {
      title: "Use project tools",
      description:
        "Memory, versions, previews, code, and builds share the same private project context.",
    },
  ],
} as const;

export function GuidedTour({ variant }: { variant: keyof typeof tours }) {
  const steps = tours[variant];
  const storageKey = `fableforge:tour:${variant}:v1`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(storageKey) !== "complete") setOpen(true);
  }, [storageKey]);

  function finish() {
    localStorage.setItem(storageKey, "complete");
    setOpen(false);
    setStep(0);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed bottom-20 right-4 z-40 rounded-full shadow-lg sm:bottom-5"
        onClick={() => setOpen(true)}
        aria-label={`Open ${variant} guided tour`}
      >
        <CircleHelp />
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setStep(0);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{steps[step].title}</DialogTitle>
            <DialogDescription>{steps[step].description}</DialogDescription>
          </DialogHeader>
          <div>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>
                Step {step + 1} of {steps.length}
              </span>
              <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
            </div>
            <Progress value={((step + 1) / steps.length) * 100} />
          </div>
          <DialogFooter className="gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button type="button" onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={finish}>
                Start building
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

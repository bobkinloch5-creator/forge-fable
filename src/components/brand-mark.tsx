import mark from "@/assets/fableforge-engine-mark.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={mark}
      alt="FableForge AI"
      width={1024}
      height={1024}
      className={cn("object-contain drop-shadow-[0_0_14px_color-mix(in_oklab,var(--neon-cyan)_38%,transparent)]", className)}
    />
  );
}

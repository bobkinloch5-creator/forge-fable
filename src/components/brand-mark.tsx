import mark from "@/assets/fableforge-mark.png";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return <img src={mark} alt="FableForge AI" width={1024} height={1024} className={cn("object-contain", className)} />;
}
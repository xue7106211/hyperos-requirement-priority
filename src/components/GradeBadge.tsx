import { cn } from "@/lib/utils";
import type { Grade } from "@/domain/types";

interface GradeBadgeProps {
  grade: Grade;
  size?: "compact" | "display";
}

export function GradeBadge({ grade, size = "compact" }: GradeBadgeProps) {
  if (size === "display") {
    return (
      <span
        className={cn(
          "inline-block select-none font-display text-7xl font-medium leading-none tracking-tight text-foreground"
        )}
      >
        {grade}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex min-w-[1.25rem] select-none items-center justify-center text-sm font-medium leading-none text-foreground"
      )}
    >
      {grade}
    </span>
  );
}

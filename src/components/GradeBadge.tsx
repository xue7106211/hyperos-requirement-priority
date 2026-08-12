import { cn } from "@/lib/utils";
import type { Grade } from "@/domain/types";

const gradeStyles: Record<Grade, string> = {
  S: "bg-neutral-900 text-white",
  A: "bg-neutral-700 text-white",
  B: "bg-neutral-400 text-white",
  C: "bg-neutral-200 text-neutral-600",
};

export function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-2 py-0.5 text-xs font-bold leading-none tracking-wide select-none",
        gradeStyles[grade]
      )}
    >
      {grade}
    </span>
  );
}

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ScoreValue = 0 | 1 | 2 | 3 | 4;

interface ScoreSelectorProps {
  value: ScoreValue;
  onChange: (v: ScoreValue) => void;
  anchors: string[];
}

export function ScoreSelector({ value, onChange, anchors }: ScoreSelectorProps) {
  const scores: ScoreValue[] = [0, 1, 2, 3, 4];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="inline-flex gap-1">
        {scores.map((score) => (
          <Tooltip key={score}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChange(score)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-sm text-sm font-semibold transition-colors",
                  score === value
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                )}
              >
                {score}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{anchors[score]}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

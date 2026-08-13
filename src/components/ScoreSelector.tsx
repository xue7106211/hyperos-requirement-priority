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
      <div
        className="inline-flex rounded-full bg-muted p-1 shadow-inset"
        role="radiogroup"
        aria-label="评分档位"
      >
        {scores.map((score) => (
          <Tooltip key={score}>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="radio"
                aria-checked={score === value}
                aria-label={`${score}：${anchors[score]}`}
                onClick={() => onChange(score)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-[color,background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                  score === value
                    ? "bg-card text-foreground shadow-raised"
                    : "text-muted-foreground hover:text-foreground"
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

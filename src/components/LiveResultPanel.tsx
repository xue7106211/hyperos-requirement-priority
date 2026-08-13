import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DimensionKey, Weights, EscalationTrigger, DimensionScore, Confidence } from "@/domain/types";
import { DIMENSION_KEYS } from "@/domain/types";
import { DIMENSION_META, ESCALATION_META } from "@/domain/modelConfig";
import type { EvaluationResult } from "@/domain/evaluate";
import { GradeBadge } from "@/components/GradeBadge";

interface LiveResultPanelProps {
  result: EvaluationResult;
  scores: Record<DimensionKey, DimensionScore>;
  weights: Weights;
  escalationTrigger: EscalationTrigger;
  confidence: Confidence;
}

export function LiveResultPanel({
  result,
  scores,
  weights: _weights,
  escalationTrigger,
  confidence,
}: LiveResultPanelProps) {
  const reduceMotion = useReducedMotion();
  const fade = {
    initial: reduceMotion ? false : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 },
    transition: { duration: reduceMotion ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] as const },
  };
  const isEscalated = escalationTrigger !== null || result.valueScore === null;

  const totalWeight = Object.values(result.weightsSnapshot).reduce((s, w) => s + w, 0);
  const contributions = DIMENSION_KEYS.map((key) => {
    const dimScore = scores[key]?.score ?? 0;
    const normalizedWeight = totalWeight > 0 ? result.weightsSnapshot[key] / totalWeight : 0;
    const contribution = (dimScore / 4) * normalizedWeight * 100;
    return {
      key,
      label: DIMENSION_META[key].label,
      contribution: Math.round(contribution * 10) / 10,
    };
  });
  const maxContribution = Math.max(...contributions.map((c) => c.contribution), 1);

  const scoreLabel =
    result.valueScore !== null ? result.valueScore.toFixed(1) : "—";

  return (
    <div className="sticky top-5 rounded-[1.35rem] bg-muted p-[5px]">
      <aside
        aria-live="polite"
        className="min-h-[24rem] rounded-[1.15rem] bg-card p-7 shadow-[var(--elevation-float)]"
      >
      <p className="font-latin text-[11px] italic tracking-[0.18em] text-muted-foreground">
        Grade
      </p>

      <div className="mt-3 flex items-end gap-4">
        <AnimatePresence mode="wait">
          <motion.div key={result.grade} {...fade}>
            <GradeBadge grade={result.grade} size="display" />
          </motion.div>
        </AnimatePresence>
        <span className="mb-1 text-xs tracking-wide text-muted-foreground">等级</span>
      </div>

      <div className="mt-6 border-t border-border/80 pt-5">
        <AnimatePresence mode="wait">
          {isEscalated ? (
            <motion.div key="escalated" {...fade} className="min-h-[4.75rem] space-y-1">
              <p className="font-display text-xl font-medium leading-snug tracking-tight text-foreground">
                直升 · {escalationTrigger ? ESCALATION_META[escalationTrigger].label : "—"}
              </p>
              <p className="text-xs text-muted-foreground">触发直升条件，跳过六维评分</p>
            </motion.div>
          ) : (
            <motion.div key="scored" {...fade} className="min-h-[4.75rem] space-y-1">
              <p className="font-latin min-w-[4.5rem] text-[2.35rem] leading-none tabular-nums tracking-tight text-foreground">
                {scoreLabel}
              </p>
              <p className="text-xs text-muted-foreground">价值总分</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isEscalated && (
        <div className="mt-5 space-y-3 border-t border-border/80 pt-5">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground">
            各维贡献
          </p>
          {contributions.map((dim) => (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-foreground/80">{dim.label}</span>
                <span className="w-10 shrink-0 text-right font-medium tabular-nums text-foreground">
                  {dim.contribution.toFixed(1)}
                </span>
              </div>
              <div className="h-px overflow-hidden bg-border">
                <div
                  className="h-full origin-left bg-foreground transition-transform duration-150 ease-out"
                  style={{ transform: `scaleX(${dim.contribution / maxContribution})` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {result.wasNormalized && (
        <div className="mt-5 border-t border-border/80 pt-3">
          <p className="text-xs text-muted-foreground">已按比例归一化</p>
        </div>
      )}

      <div className="mt-5 border-t border-border/80 pt-3">
        <p className="text-xs tracking-wide text-muted-foreground">
          置信度{" "}
          <span data-testid="confidence-display" className="font-medium text-foreground">
            {confidence}
          </span>
        </p>
      </div>
    </aside>
    </div>
  );
}

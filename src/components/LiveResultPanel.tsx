import { AnimatePresence, motion } from "framer-motion";
import type { DimensionKey, Weights, EscalationTrigger, DimensionScore } from "@/domain/types";
import { DIMENSION_KEYS } from "@/domain/types";
import { DIMENSION_META, ESCALATION_META } from "@/domain/modelConfig";
import type { EvaluationResult } from "@/domain/evaluate";
import { GradeBadge } from "@/components/GradeBadge";

interface LiveResultPanelProps {
  result: EvaluationResult;
  scores: Record<DimensionKey, DimensionScore>;
  weights: Weights;
  escalationTrigger: EscalationTrigger;
}

/**
 * 实时评级面板 - sticky 侧栏,显示等级/总分/各维贡献/归一化提示。
 * 设计基调: A 克制精密 — 中性灰、方形、锐利层级、微妙动效。
 */
export function LiveResultPanel({
  result,
  scores,
  weights: _weights,
  escalationTrigger,
}: LiveResultPanelProps) {
  const isEscalated = escalationTrigger !== null || result.valueScore === null;

  // 计算各维贡献分: score/4 * 归一化权重占比
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

  return (
    <aside className="sticky top-8 space-y-6 rounded-sm border border-neutral-200 bg-white p-6">
      {/* 等级区 */}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={result.grade}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <GradeBadge grade={result.grade} />
          </motion.div>
        </AnimatePresence>
        <span className="text-xs text-neutral-400 tracking-wide">
          等级
        </span>
      </div>

      {/* 分数/直升区 */}
      <div className="border-t border-neutral-100 pt-4">
        <AnimatePresence mode="wait">
          {isEscalated ? (
            <motion.div
              key="escalated"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
            >
              <p className="text-lg font-semibold text-neutral-900 tracking-tight">
                直升 · {escalationTrigger ? ESCALATION_META[escalationTrigger].label : "—"}
              </p>
              <p className="text-xs text-neutral-400">
                触发直升条件,跳过六维评分
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="scored"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
            >
              <p className="text-2xl font-bold text-neutral-900 tabular-nums tracking-tight">
                {result.valueScore !== null
                  ? Number.isInteger(result.valueScore)
                    ? result.valueScore.toFixed(1)
                    : result.valueScore
                  : "—"}
              </p>
              <p className="text-xs text-neutral-400">
                价值总分
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 各维贡献 */}
      {!isEscalated && (
        <div className="border-t border-neutral-100 pt-4 space-y-2">
          <p className="text-xs font-medium text-neutral-500 tracking-wide mb-2">
            各维贡献
          </p>
          {contributions.map((dim) => (
            <div
              key={dim.key}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-neutral-600 truncate mr-2">
                {dim.label}
              </span>
              <span className="text-neutral-900 font-medium tabular-nums shrink-0">
                {dim.contribution.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 归一化提示 */}
      {result.wasNormalized && (
        <div className="border-t border-neutral-100 pt-3">
          <p className="text-xs text-neutral-400">
            已按比例归一化
          </p>
        </div>
      )}

      {/* 置信度 (预留位) */}
      <div className="border-t border-neutral-100 pt-3">
        <p className="text-xs text-neutral-400 tracking-wide">
          置信度 —
        </p>
      </div>
    </aside>
  );
}

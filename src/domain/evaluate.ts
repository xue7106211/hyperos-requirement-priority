import type { Requirement, ModelConfig, Grade, Weights, Thresholds } from "./types";
import { checkEscalation } from "./escalation";
import { calculateValueScore, normalizeWeights } from "./scoring";
import { assignGrade } from "./grading";

export interface EvaluationResult {
  valueScore: number | null;
  grade: Grade;
  weightsSnapshot: Weights;
  thresholdsSnapshot: Thresholds;
  wasNormalized: boolean;
}

export function evaluate(req: Requirement, config: ModelConfig, _now: string): EvaluationResult {
  const { weights, wasNormalized } = normalizeWeights(config.weights);

  // 卫语句：直升命中即短路，跳过六维
  const escalated = checkEscalation(req.escalationTrigger);
  if (escalated !== null) {
    return { valueScore: null, grade: escalated, weightsSnapshot: weights, thresholdsSnapshot: config.thresholds, wasNormalized };
  }

  const valueScore = calculateValueScore(req.scores, config.weights);
  const grade = assignGrade(valueScore, config.thresholds);
  return { valueScore, grade, weightsSnapshot: weights, thresholdsSnapshot: config.thresholds, wasNormalized };
}

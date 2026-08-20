export type MainCategory = '平台基建' | '适配建设' | '体验优化';

export type DimensionKey =
  | 'strategy' | 'userProblem' | 'systemImpact'
  | 'leverage' | 'deviceEnable' | 'competitive';

export const DIMENSION_KEYS: DimensionKey[] = [
  'strategy', 'userProblem', 'systemImpact', 'leverage', 'deviceEnable', 'competitive',
];

/**
 * 档位取值。各维度满分不同（见 DIMENSION_META[key].maxScore）：
 * 多数维度 0–4，设备与生态赋能为 0–3。
 * 这里保留 0–4 联合类型作为取值上界，实际上界由 maxScore 在校验和 UI 中收紧。
 */
export type ScoreValue = 0 | 1 | 2 | 3 | 4;

export interface DimensionScore { score: ScoreValue; reason: string; }

export type EscalationTrigger =
  | 'legal' | 'redOrange' | 'blockDevice' | 'hardwareSell' | 'yellow' | null;

export type Grade = 'S' | 'A' | 'B' | 'C';

export type Weights = Record<DimensionKey, number>;
export interface Thresholds { S: number; A: number; B: number; }
export interface ModelConfig { weights: Weights; thresholds: Thresholds; }

export interface Requirement {
  id: string;
  name: string;
  description: string;
  problemStatement: string;
  mainCategory: MainCategory;
  tags: string[];
  targetUserScenario: string;
  expectedCapability: string;
  affectedScope: string;
  frequency: string;
  strategyWindow: string;
  businessRequesterCount: number;
  evidence: string;
  competitiveEvidence: string;
  escalationTrigger: EscalationTrigger;
  scores: Record<DimensionKey, DimensionScore>;
  valueScore: number | null;
  grade: Grade;
  modelVersion: string;
  weightsSnapshot: Weights;
  thresholdsSnapshot: Thresholds;
  evaluatedAt: string;
  manuallyAdjusted?: boolean;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];      // 硬错误，阻止计算
  warnings: string[];    // 软提醒，允许计算
}

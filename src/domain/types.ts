export type MainCategory = '平台基建' | '适配建设' | '体验优化';

export type DimensionKey =
  | 'strategy' | 'userProblem' | 'systemImpact'
  | 'leverage' | 'deviceEnable' | 'competitive';

export const DIMENSION_KEYS: DimensionKey[] = [
  'strategy', 'userProblem', 'systemImpact', 'leverage', 'deviceEnable', 'competitive',
];

export interface DimensionScore { score: 0 | 1 | 2 | 3 | 4; reason: string; }

export type EscalationTrigger =
  | 'legal' | 'redOrange' | 'blockDevice' | 'hardwareSell' | 'yellow' | null;

export type Grade = 'S' | 'A' | 'B' | 'C';
export type Confidence = '高' | '中' | '低';

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
  confidence: Confidence;
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

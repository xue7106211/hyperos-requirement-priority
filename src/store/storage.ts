import type { DimensionScore, ModelConfig, Requirement, ScoreValue } from "@/domain/types";
import { DIMENSION_KEYS } from "@/domain/types";
import { DEFAULT_CONFIG, DIMENSION_META } from "@/domain/modelConfig";

const REQ_KEY = "hyperos-rvm-v2:requirements";
const CFG_KEY = "hyperos-rvm-v2:config";

/**
 * 读取时的向后兼容处理（v2.0 记录 → v2.1 运行时）。
 *
 * 只做「让旧记录能安全渲染和继续编辑」的最小修正：
 * - 补齐缺失的维度评分对象
 * - 把超出该维度新满分的分数收敛到新满分（v2.0 设备与生态赋能可能存了 4 分）
 * - 丢弃已移除的 confidence 字段
 *
 * 刻意**不**重算 valueScore / grade，也**不**改写 modelVersion：
 * 旧记录保留 v2.0 的原始结果与版本标识，避免静默修改历史评估结果。
 * 跨版本统计需按 modelVersion 分组，或在 v2.1 下重新评估生成新记录。
 */
export function migrateRequirement(raw: unknown): Requirement {
  const source = (raw ?? {}) as Record<string, unknown> & {
    scores?: Partial<Record<string, Partial<DimensionScore>>>;
  };
  const { confidence: _removedInV21, ...rest } = source;

  const scores = {} as Record<(typeof DIMENSION_KEYS)[number], DimensionScore>;
  for (const key of DIMENSION_KEYS) {
    const stored = source.scores?.[key];
    const max = DIMENSION_META[key].maxScore;
    const parsed = Number(stored?.score ?? 0);
    const safe = Number.isInteger(parsed) ? Math.min(Math.max(parsed, 0), max) : 0;
    scores[key] = { score: safe as ScoreValue, reason: stored?.reason ?? "" };
  }

  return { ...rest, scores } as Requirement;
}

export function loadRequirements(): Requirement[] {
  const raw = localStorage.getItem(REQ_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateRequirement);
  } catch {
    return [];
  }
}
export function saveRequirements(reqs: Requirement[]): void {
  localStorage.setItem(REQ_KEY, JSON.stringify(reqs));
}
export function loadConfig(): ModelConfig {
  const raw = localStorage.getItem(CFG_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try { return JSON.parse(raw) as ModelConfig; } catch { return DEFAULT_CONFIG; }
}
export function saveConfig(c: ModelConfig): void {
  localStorage.setItem(CFG_KEY, JSON.stringify(c));
}

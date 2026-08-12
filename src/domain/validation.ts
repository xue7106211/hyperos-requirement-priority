import type { Requirement, ValidationResult } from "./types";
import { DIMENSION_KEYS } from "./types";
import { DIMENSION_META } from "./modelConfig";

const VALID_CATEGORIES = ["平台基建", "适配建设", "体验优化"];

export function validate(req: Requirement): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!VALID_CATEGORIES.includes(req.mainCategory)) {
    errors.push("缺少或非法的需求主类型");
  }
  for (const k of DIMENSION_KEYS) {
    const s = req.scores[k].score as number;
    if (!Number.isInteger(s) || s < 0 || s > 4) {
      errors.push(`维度「${DIMENSION_META[k].label}」评分越界：${s}`);
    }
    if (req.escalationTrigger === null && req.scores[k].reason.trim() === "") {
      warnings.push(`维度「${DIMENSION_META[k].label}」缺评分理由`);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

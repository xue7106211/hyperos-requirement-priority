/**
 * CSV 导入导出 — 纯前端应用唯一的数据搬运通道
 * 导出带 BOM (Excel 友好), 全字段快照, 标准 CSV 转义
 * 导入逐行校验, 脏行跳过并记原因
 */

import { DIMENSION_KEYS } from "./types";
import type {
  Requirement,
  DimensionKey,
  DimensionScore,
  MainCategory,
  EscalationTrigger,
  Confidence,
  Grade,
  Weights,
  Thresholds,
} from "./types";
import { DIMENSION_META } from "./modelConfig";

// ─── 列定义 ───────────────────────────────────────────────────────────────────

const VALID_MAIN_CATEGORIES: MainCategory[] = ["平台基建", "适配建设", "体验优化"];
const VALID_CONFIDENCES: Confidence[] = ["高", "中", "低"];
const VALID_GRADES: Grade[] = ["S", "A", "B", "C"];
const VALID_ESCALATION_TRIGGERS: EscalationTrigger[] = [
  "legal", "redOrange", "blockDevice", "hardwareSell", "yellow", null,
];

/**
 * 列顺序定义 — 导出和导入严格对称
 * 分数列: 每维一列; 理由列: 每维一列
 */
const COLUMNS: string[] = [
  "ID",
  "需求名称",
  "需求描述",
  "问题陈述",
  "需求主类型",
  "二级标签",
  "目标用户场景",
  "预期能力",
  "影响范围",
  "发生频率",
  "战略窗口期",
  "业务需求方数量",
  "证据",
  "竞品证据",
  "直升条件",
  // 六维分数
  ...DIMENSION_KEYS.map((k) => `${DIMENSION_META[k].label}-分数`),
  // 六维理由
  ...DIMENSION_KEYS.map((k) => `${DIMENSION_META[k].label}-理由`),
  "置信度",
  "价值分",
  "等级",
  "模型版本",
  "权重快照",
  "阈值快照",
  "评估时间",
];

// ─── CSV 转义 ─────────────────────────────────────────────────────────────────

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// ─── 导出 ─────────────────────────────────────────────────────────────────────

export function exportToCsv(reqs: Requirement[]): string {
  const BOM = "﻿";
  const headerLine = COLUMNS.map(escapeCsvField).join(",");

  const dataLines = reqs.map((r) => {
    const fields: string[] = [
      r.id,
      r.name,
      r.description,
      r.problemStatement,
      r.mainCategory,
      JSON.stringify(r.tags),
      r.targetUserScenario,
      r.expectedCapability,
      r.affectedScope,
      r.frequency,
      r.strategyWindow,
      String(r.businessRequesterCount),
      r.evidence,
      r.competitiveEvidence,
      r.escalationTrigger ?? "",
      // 六维分数
      ...DIMENSION_KEYS.map((k) => String(r.scores[k].score)),
      // 六维理由
      ...DIMENSION_KEYS.map((k) => r.scores[k].reason),
      r.confidence,
      r.valueScore === null ? "" : String(r.valueScore),
      r.grade,
      r.modelVersion,
      JSON.stringify(r.weightsSnapshot),
      JSON.stringify(r.thresholdsSnapshot),
      r.evaluatedAt,
    ];
    return fields.map(escapeCsvField).join(",");
  });

  return BOM + [headerLine, ...dataLines].join("\n");
}

// ─── CSV 解析器 (处理引号内逗号/换行/转义双引号) ──────────────────────────────

function parseCsvLine(text: string, start: number): { fields: string[]; nextIndex: number } | null {
  const fields: string[] = [];
  let i = start;
  const len = text.length;

  if (i >= len) return null;

  while (i <= len) {
    if (i === len) {
      // end of text while building a field
      fields.push("");
      break;
    }

    const ch = text[i];

    if (ch === "\n" || ch === "\r") {
      // End of line
      // Consume \r\n as one line ending
      if (ch === "\r" && i + 1 < len && text[i + 1] === "\n") {
        i += 2;
      } else {
        i += 1;
      }
      break;
    }

    if (ch === '"') {
      // Quoted field
      let field = "";
      i++; // skip opening quote
      while (i < len) {
        if (text[i] === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            // Escaped quote
            field += '"';
            i += 2;
          } else {
            // Closing quote
            i++; // skip closing quote
            break;
          }
        } else {
          field += text[i];
          i++;
        }
      }
      fields.push(field);
      // Skip comma or end
      if (i < len && text[i] === ",") {
        i++;
      } else if (i < len && (text[i] === "\n" || text[i] === "\r")) {
        if (text[i] === "\r" && i + 1 < len && text[i + 1] === "\n") {
          i += 2;
        } else {
          i += 1;
        }
        break;
      }
    } else {
      // Unquoted field
      let field = "";
      while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
        field += text[i];
        i++;
      }
      fields.push(field);
      if (i < len && text[i] === ",") {
        i++;
      } else if (i < len && (text[i] === "\n" || text[i] === "\r")) {
        if (text[i] === "\r" && i + 1 < len && text[i + 1] === "\n") {
          i += 2;
        } else {
          i += 1;
        }
        break;
      }
    }
  }

  return { fields, nextIndex: i };
}

function parseAllCsvLines(text: string): string[][] {
  const lines: string[][] = [];
  let index = 0;
  while (index < text.length) {
    const result = parseCsvLine(text, index);
    if (!result) break;
    lines.push(result.fields);
    index = result.nextIndex;
  }
  return lines;
}

// ─── 导入 ─────────────────────────────────────────────────────────────────────

export function importFromCsv(text: string): {
  requirements: Requirement[];
  report: { success: number; skipped: number; reasons: string[] };
} {
  // 剥离 BOM
  let content = text;
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const allLines = parseAllCsvLines(content);
  if (allLines.length === 0) {
    return { requirements: [], report: { success: 0, skipped: 0, reasons: [] } };
  }

  // 首行为表头 → 建立列名→索引映射
  const header = allLines[0];
  const colIndex: Record<string, number> = {};
  header.forEach((h, idx) => {
    colIndex[h.trim()] = idx;
  });

  const requirements: Requirement[] = [];
  const reasons: string[] = [];
  let skipped = 0;

  for (let lineIdx = 1; lineIdx < allLines.length; lineIdx++) {
    const fields = allLines[lineIdx];

    // 跳过全空行
    if (fields.every((f) => f.trim() === "")) continue;

    const lineNum = lineIdx + 1; // 1-indexed for human readability

    // 检查列数
    if (fields.length < COLUMNS.length) {
      skipped++;
      reasons.push(`行${lineNum}: 列数不足 (期望${COLUMNS.length}, 实际${fields.length})`);
      continue;
    }

    const get = (colName: string): string => {
      const idx = colIndex[colName];
      if (idx === undefined || idx >= fields.length) return "";
      return fields[idx];
    };

    // 校验主类型
    const mainCategory = get("需求主类型") as MainCategory;
    if (!VALID_MAIN_CATEGORIES.includes(mainCategory)) {
      skipped++;
      reasons.push(`行${lineNum}: 非法主类型 "${get("需求主类型")}"`);
      continue;
    }

    // 校验六维分数
    let scoreError = false;
    const scores: Record<DimensionKey, DimensionScore> = {} as Record<DimensionKey, DimensionScore>;
    for (const dk of DIMENSION_KEYS) {
      const label = DIMENSION_META[dk].label;
      const scoreStr = get(`${label}-分数`);
      const scoreNum = Number(scoreStr);
      if (!Number.isInteger(scoreNum) || scoreNum < 0 || scoreNum > 4) {
        skipped++;
        reasons.push(`行${lineNum}: 维度 "${label}" 分数非法 "${scoreStr}" (应为0-4整数)`);
        scoreError = true;
        break;
      }
      const reason = get(`${label}-理由`);
      scores[dk] = { score: scoreNum as 0 | 1 | 2 | 3 | 4, reason };
    }
    if (scoreError) continue;

    // 解析标签
    let tags: string[] = [];
    const tagsStr = get("二级标签");
    if (tagsStr) {
      try {
        const parsed = JSON.parse(tagsStr);
        if (Array.isArray(parsed)) {
          tags = parsed;
        } else {
          tags = [tagsStr];
        }
      } catch {
        tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    // 解析直升条件
    const escalationStr = get("直升条件");
    let escalationTrigger: EscalationTrigger = null;
    if (escalationStr && escalationStr !== "") {
      if (VALID_ESCALATION_TRIGGERS.includes(escalationStr as EscalationTrigger)) {
        escalationTrigger = escalationStr as EscalationTrigger;
      }
    }

    // 解析置信度
    const confidenceStr = get("置信度") as Confidence;
    const confidence: Confidence = VALID_CONFIDENCES.includes(confidenceStr) ? confidenceStr : "中";

    // 解析等级
    const gradeStr = get("等级") as Grade;
    const grade: Grade = VALID_GRADES.includes(gradeStr) ? gradeStr : "C";

    // 解析价值分
    const valueScoreStr = get("价值分");
    const valueScore = valueScoreStr === "" ? null : Number(valueScoreStr);

    // 解析权重快照
    let weightsSnapshot: Weights = { strategy: 0, userProblem: 0, systemImpact: 0, leverage: 0, deviceEnable: 0, competitive: 0 };
    const weightsStr = get("权重快照");
    if (weightsStr) {
      try {
        weightsSnapshot = JSON.parse(weightsStr);
      } catch {
        // keep default
      }
    }

    // 解析阈值快照
    let thresholdsSnapshot: Thresholds = { S: 85, A: 70, B: 50 };
    const thresholdsStr = get("阈值快照");
    if (thresholdsStr) {
      try {
        thresholdsSnapshot = JSON.parse(thresholdsStr);
      } catch {
        // keep default
      }
    }

    const requirement: Requirement = {
      id: get("ID"),
      name: get("需求名称"),
      description: get("需求描述"),
      problemStatement: get("问题陈述"),
      mainCategory,
      tags,
      targetUserScenario: get("目标用户场景"),
      expectedCapability: get("预期能力"),
      affectedScope: get("影响范围"),
      frequency: get("发生频率"),
      strategyWindow: get("战略窗口期"),
      businessRequesterCount: Number(get("业务需求方数量")) || 0,
      evidence: get("证据"),
      competitiveEvidence: get("竞品证据"),
      escalationTrigger,
      scores,
      confidence,
      valueScore,
      grade,
      modelVersion: get("模型版本"),
      weightsSnapshot,
      thresholdsSnapshot,
      evaluatedAt: get("评估时间"),
    };

    requirements.push(requirement);
  }

  return {
    requirements,
    report: { success: requirements.length, skipped, reasons },
  };
}

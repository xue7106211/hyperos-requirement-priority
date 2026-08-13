# HyperOS 需求价值评估网站 Implementation Plan

> **状态（2026-08-13 文档同步）：** 一期实现已合入 `main`。本文档保留为实施记录，任务清单未回写勾选，完成度以 git 提交历史为准。日常开发请以 `README.md`、`AGENTS.md`、`docs/index.md` 为准。
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯前端的 HyperOS 需求价值评估网站，按 v2.0 模型给需求打分、定 S/A/B/C 等级、筛选统计、CSV 导入导出。

**Architecture:** 三层分离——UI 层（React + shadcn/ui）只负责展示，领域层（纯 TS 函数，零 React 依赖）承载全部评分/等级/直升/校验逻辑，持久层用 localStorage。数据流为单向：用户打分 → 直升判定 → 算分 → 判级 → 存储 → 渲染。校验在表单保存时调用，不在 `evaluate` 内部。

**Tech Stack:** Vite + React 18 + TypeScript + shadcn/ui（Radix + Tailwind CSS）+ Framer Motion（克制使用）+ Vitest。包管理器为 npm。无后端、无数据库、无认证。命令见 `README.md`。

## Global Constraints

- 模型依据：`docs/requirement-value-model-v2.md`（v2.0），六维度 + 单一权重表 + 无成本轴 + 置信度高/中/低 + 阈值可调 + 第 0 层直升。
- 六维 key 固定：`strategy` / `userProblem` / `systemImpact` / `leverage` / `deviceEnable` / `competitive`。
- 默认权重（%）：strategy 23、userProblem 17、systemImpact 20、leverage 18、deviceEnable 12、competitive 10，合计 100。
- 默认阈值：S≥85、A≥70、B≥50、C<50。
- 等级判定用未取整分数，边界用 `>=`（85 属 S）。
- 权重合计 ≠ 100% 时按比例自动归一化并提示（`AGENTS.md`「开发规范」）。
- 命中直升的需求 `valueScore` 存 `null`，跳过六维打分，命中多条取最高等级（S>A）。
- 每条评估记录冻结 `modelVersion`、`weightsSnapshot`、`thresholdsSnapshot`、`evaluatedAt`，保证可复现。
- 标签数量不改变分数。相同输入 + 相同 config → 结果完全一致。
- 文档、界面文案、评估说明用中文；代码标识符用清晰英文。
- 设计基调：A 克制精密（大量留白、近乎无色、方形几何、锐利层级）。
- 提交信息用 Conventional Commits 中文风格。不主动 push。

---

## 文件结构总览

领域层（先建，最重要）：
- `src/domain/types.ts` — 全部类型定义
- `src/domain/modelConfig.ts` — 默认权重/阈值/六维锚点文案/直升文案
- `src/domain/escalation.ts` — 第 0 层直升判定
- `src/domain/scoring.ts` — 六维加权算价值分（含归一化）
- `src/domain/grading.ts` — 价值分 → 等级
- `src/domain/validation.ts` — 输入校验
- `src/domain/evaluate.ts` — 总入口：编排直升→算分→判级
- `src/domain/csv.ts` — CSV 导入导出
- `src/domain/__tests__/*.test.ts` — 领域层单测

持久层：
- `src/store/storage.ts` — localStorage 封装

UI 层：
- `src/lib/utils.ts` — shadcn 依赖的 cn() 工具
- `src/components/ui/*` — shadcn/ui 组件
- `src/components/ScoreSelector.tsx` — 0-4 打分控件
- `src/components/GradeBadge.tsx` — 等级徽章
- `src/components/LiveResultPanel.tsx` — 右侧实时评级面板
- `src/components/RequirementForm.tsx` — 单条打分表单
- `src/components/RequirementTable.tsx` — 批量清单表格
- `src/components/FilterBar.tsx` — 筛选栏
- `src/components/SettingsPanel.tsx` — 高级设置
- `src/components/BulkAssignBar.tsx` — 批量赋值
- `src/components/ImportReportDialog.tsx` — CSV 导入报告
- `src/pages/ScoringPage.tsx` / `ListPage.tsx`
- `src/App.tsx` / `src/main.tsx` / `index.html`

---

## Phase 0：项目脚手架

### Task 0: 初始化 Vite + React + TS + Tailwind + shadcn/ui

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/lib/utils.ts`, `src/vite-env.d.ts`, `components.json`, `vitest.config.ts`

**Interfaces:**
- Produces: 可运行的 `npm run dev` / `npm run build` / `npm run test` 环境；`cn()` 工具函数供 shadcn 组件使用。

- [ ] **Step 1: 用 Vite 创建项目骨架**

```bash
cd /Users/mi/hyperos-requirement-priority
npm create vite@latest . -- --template react-ts
# 若目录非空提示，选择忽略已有文件（docs/、AGENTS.md 等保留）
npm install
```

- [ ] **Step 2: 安装 Tailwind、shadcn 依赖、测试与动效库**

```bash
npm install -D tailwindcss@3 postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom
npm install class-variance-authority clsx tailwind-merge lucide-react framer-motion
npx tailwindcss init -p
```

- [ ] **Step 3: 配置 Tailwind content 与 shadcn 主题变量**

`tailwind.config.js` 的 content 设为 `["./index.html","./src/**/*.{ts,tsx}"]`，并加入 shadcn 需要的 `darkMode`、`theme.extend.colors` 用 CSS 变量。`src/index.css` 顶部写入 `@tailwind base; @tailwind components; @tailwind utilities;` 及 shadcn 的 `:root` HSL 变量（用中性灰主题，对齐 A 克制精密基调）。

- [ ] **Step 4: 配置路径别名 `@` 与 vitest**

`tsconfig.json` 加 `"paths": { "@/*": ["./src/*"] }`；`vite.config.ts` 加 `resolve.alias`；创建 `vitest.config.ts` 用 jsdom 环境。创建 `src/lib/utils.ts`：

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: 创建 `components.json` 供 shadcn CLI 使用**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "tailwind.config.js", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true },
  "aliases": { "components": "@/components", "utils": "@/lib/utils" }
}
```

- [ ] **Step 6: 写一个占位 App 并验证三条命令**

`src/App.tsx` 渲染一行标题「HyperOS 需求价值评估」。运行：

```bash
npm run build
```
Expected: 构建成功，`tsc` 无 error。

- [ ] **Step 7: 添加 test 脚本并跑空测试**

`package.json` 的 scripts 加 `"test": "vitest run"`、`"test:watch": "vitest"`。创建 `src/domain/__tests__/smoke.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
describe("smoke", () => { it("runs", () => { expect(1 + 1).toBe(2); }); });
```

Run: `npm run test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: 初始化 Vite + React + TS + Tailwind + shadcn 脚手架"
```

---

## Phase 1：领域层类型与配置

### Task 1: 定义领域类型

**Files:**
- Create: `src/domain/types.ts`

**Interfaces:**
- Produces: `MainCategory`、`DimensionKey`、`DimensionScore`、`EscalationTrigger`、`Grade`、`Confidence`、`Requirement`、`Weights`、`Thresholds`、`ModelConfig`、`ValidationResult` 类型，供所有后续任务消费。

- [ ] **Step 1: 写类型定义（无测试，类型文件由后续任务的编译验证）**

```typescript
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
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];      // 硬错误，阻止计算
  warnings: string[];    // 软提醒，允许计算
}
```

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: PASS，无类型 error。

- [ ] **Step 3: Commit**

```bash
git add src/domain/types.ts
git commit -m "feat(domain): 定义需求价值评估的核心类型"
```

### Task 2: 默认模型配置与文案

**Files:**
- Create: `src/domain/modelConfig.ts`
- Test: `src/domain/__tests__/modelConfig.test.ts`

**Interfaces:**
- Consumes: `Weights`、`Thresholds`、`ModelConfig`、`DimensionKey` from Task 1。
- Produces: `DEFAULT_WEIGHTS: Weights`、`DEFAULT_THRESHOLDS: Thresholds`、`DEFAULT_CONFIG: ModelConfig`、`MODEL_VERSION: string`、`DIMENSION_META`（每维中文名 + 0-4 锚点文案）、`ESCALATION_META`（直升条件中文名 + 对应等级）。

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from "vitest";
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS, MODEL_VERSION, DIMENSION_META, ESCALATION_META } from "@/domain/modelConfig";
import { DIMENSION_KEYS } from "@/domain/types";

describe("modelConfig", () => {
  it("默认权重合计为 100", () => {
    const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
  it("默认阈值符合 v2.0", () => {
    expect(DEFAULT_THRESHOLDS).toEqual({ S: 85, A: 70, B: 50 });
  });
  it("模型版本为 v2.0", () => {
    expect(MODEL_VERSION).toBe("HyperOS Requirement Value Model v2.0");
  });
  it("六维都有名称和 5 档锚点文案", () => {
    for (const k of DIMENSION_KEYS) {
      expect(DIMENSION_META[k].label.length).toBeGreaterThan(0);
      expect(DIMENSION_META[k].anchors).toHaveLength(5);
    }
  });
  it("直升条件覆盖 5 种且等级正确", () => {
    expect(ESCALATION_META.legal.grade).toBe("S");
    expect(ESCALATION_META.yellow.grade).toBe("A");
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm run test -- modelConfig`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 modelConfig.ts**

```typescript
import type { Weights, Thresholds, ModelConfig, DimensionKey, Grade } from "./types";

export const MODEL_VERSION = "HyperOS Requirement Value Model v2.0";

export const DEFAULT_WEIGHTS: Weights = {
  strategy: 23, userProblem: 17, systemImpact: 20,
  leverage: 18, deviceEnable: 12, competitive: 10,
};

export const DEFAULT_THRESHOLDS: Thresholds = { S: 85, A: 70, B: 50 };

export const DEFAULT_CONFIG: ModelConfig = {
  weights: DEFAULT_WEIGHTS, thresholds: DEFAULT_THRESHOLDS,
};

export const DIMENSION_META: Record<DimensionKey, { label: string; anchors: string[] }> = {
  strategy: {
    label: "战略与未来确定性",
    anchors: [
      "与产品战略、未来能力和版本目标无明显关系",
      "符合宽泛方向，但没有明确路线、业务或产品窗口",
      "与已提出的方向一致，未来可能需要，但时间和范围尚未确定",
      "直接支撑已确认的版本目标、下一代产品能力或标志性体验",
      "是实现明确战略结果或下一代标志性设计不可缺少的基础能力",
    ],
  },
  userProblem: {
    label: "用户问题与风险",
    anchors: [
      "没有明确用户问题，仅为主观偏好",
      "个别场景或少量用户反馈，不影响核心任务",
      "问题重复出现，对部分用户或特定场景造成明显影响",
      "高频或高严重度问题，显著影响满意度、核心体验或品牌感知",
      "广泛且严重地影响核心任务，或存在明确的系统级舆情风险",
    ],
  },
  systemImpact: {
    label: "系统影响面",
    anchors: [
      "一次性、局部、极低频场景",
      "单应用或单组件中的边缘场景",
      "覆盖多个页面、组件或少量应用，出现频率中等",
      "覆盖多个系统应用、公共路径或高频界面",
      "影响系统默认界面、核心路径或系统整体美学与交互面貌",
    ],
  },
  leverage: {
    label: "体系杠杆价值",
    anchors: [
      "完全定制化，只解决当前页面问题",
      "可形成局部规范，但复用范围有限",
      "可被多个页面、组件或团队复用",
      "可沉淀为 Token、标准控件、公共模式或应用框架能力",
      "属于底层基础能力，可持续支撑大量未来需求并推动体系演进",
    ],
  },
  deviceEnable: {
    label: "设备与生态赋能",
    anchors: [
      "与设备形态和多端体验无关",
      "只涉及轻量尺寸或样式适配",
      "是某类设备的必要适配，但不影响核心体验",
      "显著影响新机、折叠屏、平板或跨端的关键体验",
      "是已确认的新设备形态、旗舰体验或跨端能力的必要基础设施",
    ],
  },
  competitive: {
    label: "竞争价值",
    anchors: [
      "与竞争能力无明显关系",
      "友商存在类似实现，但该能力并非关键差距",
      "可以补齐已知差距，但难以形成差异化",
      "补齐 HyperOS 明显或独有的能力缺口，达到领先水平",
      "能形成用户可感知、体系可复用且短期难以复制的领先基建能力",
    ],
  },
};

export const ESCALATION_META: Record<Exclude<import("./types").EscalationTrigger, null>, { label: string; grade: Grade }> = {
  legal: { label: "触及法律 / 政策 / 价值观红线", grade: "S" },
  redOrange: { label: "红色（危险）/ 橙色（紧急）舆情", grade: "S" },
  blockDevice: { label: "阻塞新形态设备正常使用的刚性需求", grade: "S" },
  hardwareSell: { label: "机型硬件卖点（已承诺发布会重点传播）", grade: "S" },
  yellow: { label: "中等（黄色）舆情", grade: "A" },
};
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm run test -- modelConfig`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/modelConfig.ts src/domain/__tests__/modelConfig.test.ts
git commit -m "feat(domain): 默认权重/阈值/六维锚点文案与直升条件配置"
```

---

## Phase 2：领域层计算逻辑（TDD）

### Task 3: 第 0 层直升判定

**Files:**
- Create: `src/domain/escalation.ts`
- Test: `src/domain/__tests__/escalation.test.ts`

**Interfaces:**
- Consumes: `EscalationTrigger`、`Grade` from Task 1；`ESCALATION_META` from Task 2。
- Produces: `checkEscalation(trigger: EscalationTrigger): Grade | null`。

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from "vitest";
import { checkEscalation } from "@/domain/escalation";

describe("checkEscalation", () => {
  it("法律红线直升 S", () => { expect(checkEscalation("legal")).toBe("S"); });
  it("红橙舆情直升 S", () => { expect(checkEscalation("redOrange")).toBe("S"); });
  it("阻塞新形态直升 S", () => { expect(checkEscalation("blockDevice")).toBe("S"); });
  it("硬件卖点直升 S", () => { expect(checkEscalation("hardwareSell")).toBe("S"); });
  it("黄色舆情直升 A", () => { expect(checkEscalation("yellow")).toBe("A"); });
  it("未命中返回 null", () => { expect(checkEscalation(null)).toBeNull(); });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- escalation`
Expected: FAIL

- [ ] **Step 3: 实现**

```typescript
import type { EscalationTrigger, Grade } from "./types";
import { ESCALATION_META } from "./modelConfig";

export function checkEscalation(trigger: EscalationTrigger): Grade | null {
  if (trigger === null) return null;
  return ESCALATION_META[trigger].grade;
}
```

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- escalation`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/escalation.ts src/domain/__tests__/escalation.test.ts
git commit -m "feat(domain): 第 0 层硬性直升通道判定"
```

### Task 4: 价值分计算（含权重归一化与浮点处理）

**Files:**
- Create: `src/domain/scoring.ts`
- Test: `src/domain/__tests__/scoring.test.ts`

**Interfaces:**
- Consumes: `DimensionScore`、`Weights`、`DimensionKey` from Task 1；`DEFAULT_WEIGHTS` from Task 2。
- Produces:
  - `normalizeWeights(weights: Weights): { weights: Weights; wasNormalized: boolean }`
  - `calculateValueScore(scores: Record<DimensionKey, DimensionScore>, weights: Weights): number`（返回 0-100 保留一位小数，内部先归一化）

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from "vitest";
import { calculateValueScore, normalizeWeights } from "@/domain/scoring";
import { DEFAULT_WEIGHTS } from "@/domain/modelConfig";
import type { DimensionKey, DimensionScore } from "@/domain/types";

const mk = (n: 0|1|2|3|4): DimensionScore => ({ score: n, reason: "" });
const all = (n: 0|1|2|3|4): Record<DimensionKey, DimensionScore> => ({
  strategy: mk(n), userProblem: mk(n), systemImpact: mk(n),
  leverage: mk(n), deviceEnable: mk(n), competitive: mk(n),
});

describe("normalizeWeights", () => {
  it("合计 100 时不改动", () => {
    const r = normalizeWeights(DEFAULT_WEIGHTS);
    expect(r.wasNormalized).toBe(false);
    expect(r.weights).toEqual(DEFAULT_WEIGHTS);
  });
  it("合计非 100 时按比例归一化，且归一后合计=100", () => {
    const r = normalizeWeights({ strategy:46,userProblem:34,systemImpact:40,leverage:36,deviceEnable:24,competitive:20 });
    expect(r.wasNormalized).toBe(true);
    const sum = Object.values(r.weights).reduce((a,b)=>a+b,0);
    expect(sum).toBeCloseTo(100, 6);
  });
});

describe("calculateValueScore", () => {
  it("全 4 分 = 100.0", () => { expect(calculateValueScore(all(4), DEFAULT_WEIGHTS)).toBe(100.0); });
  it("全 0 分 = 0.0", () => { expect(calculateValueScore(all(0), DEFAULT_WEIGHTS)).toBe(0.0); });
  it("全 2 分 = 50.0", () => { expect(calculateValueScore(all(2), DEFAULT_WEIGHTS)).toBe(50.0); });
  it("结果保留一位小数", () => {
    const v = calculateValueScore(all(3), DEFAULT_WEIGHTS);
    expect(Number.isFinite(v)).toBe(true);
    expect(Math.round(v * 10) / 10).toBe(v);
  });
  it("相同输入稳定复现", () => {
    expect(calculateValueScore(all(3), DEFAULT_WEIGHTS)).toBe(calculateValueScore(all(3), DEFAULT_WEIGHTS));
  });
  it("非归一权重与其归一版结果一致", () => {
    const doubled = Object.fromEntries(Object.entries(DEFAULT_WEIGHTS).map(([k,v])=>[k,v*2])) as typeof DEFAULT_WEIGHTS;
    expect(calculateValueScore(all(3), doubled)).toBe(calculateValueScore(all(3), DEFAULT_WEIGHTS));
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- scoring`
Expected: FAIL

- [ ] **Step 3: 实现**

```typescript
import type { DimensionKey, DimensionScore, Weights } from "./types";
import { DIMENSION_KEYS } from "./types";

export function normalizeWeights(weights: Weights): { weights: Weights; wasNormalized: boolean } {
  const sum = DIMENSION_KEYS.reduce((a, k) => a + weights[k], 0);
  if (Math.abs(sum - 100) < 1e-9) return { weights, wasNormalized: false };
  const scaled = {} as Weights;
  for (const k of DIMENSION_KEYS) scaled[k] = (weights[k] / sum) * 100;
  return { weights: scaled, wasNormalized: true };
}

export function calculateValueScore(
  scores: Record<DimensionKey, DimensionScore>,
  weights: Weights,
): number {
  const { weights: w } = normalizeWeights(weights);
  let total = 0;
  for (const k of DIMENSION_KEYS) {
    total += (scores[k].score / 4) * w[k];
  }
  return Math.round(total * 10) / 10;
}
```

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- scoring`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/scoring.ts src/domain/__tests__/scoring.test.ts
git commit -m "feat(domain): 六维加权价值分计算与权重归一化"
```

### Task 5: 等级判定（边界值全覆盖）

**Files:**
- Create: `src/domain/grading.ts`
- Test: `src/domain/__tests__/grading.test.ts`

**Interfaces:**
- Consumes: `Grade`、`Thresholds` from Task 1；`DEFAULT_THRESHOLDS` from Task 2。
- Produces: `assignGrade(valueScore: number, thresholds: Thresholds): Grade`。

- [ ] **Step 1: 写失败测试（覆盖 v2.0 第 12 节边界）**

```typescript
import { describe, it, expect } from "vitest";
import { assignGrade } from "@/domain/grading";
import { DEFAULT_THRESHOLDS as T } from "@/domain/modelConfig";

describe("assignGrade 边界值", () => {
  it("85 → S", () => { expect(assignGrade(85, T)).toBe("S"); });
  it("84.9 → A", () => { expect(assignGrade(84.9, T)).toBe("A"); });
  it("70 → A", () => { expect(assignGrade(70, T)).toBe("A"); });
  it("69.9 → B", () => { expect(assignGrade(69.9, T)).toBe("B"); });
  it("50 → B", () => { expect(assignGrade(50, T)).toBe("B"); });
  it("49.9 → C", () => { expect(assignGrade(49.9, T)).toBe("C"); });
  it("0 → C", () => { expect(assignGrade(0, T)).toBe("C"); });
  it("100 → S", () => { expect(assignGrade(100, T)).toBe("S"); });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- grading`
Expected: FAIL

- [ ] **Step 3: 实现**

```typescript
import type { Grade, Thresholds } from "./types";

export function assignGrade(valueScore: number, t: Thresholds): Grade {
  if (valueScore >= t.S) return "S";
  if (valueScore >= t.A) return "A";
  if (valueScore >= t.B) return "B";
  return "C";
}
```

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- grading`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/grading.ts src/domain/__tests__/grading.test.ts
git commit -m "feat(domain): 价值分到 S/A/B/C 等级判定（边界值覆盖）"
```

### Task 6: 输入校验

**Files:**
- Create: `src/domain/validation.ts`
- Test: `src/domain/__tests__/validation.test.ts`

**Interfaces:**
- Consumes: `Requirement`、`ValidationResult`、`DimensionKey` from Task 1。
- Produces: `validate(req: Requirement): ValidationResult`。硬错误：主类型缺失、维度分越界（不在 0-4）。软提醒：任一维度理由为空、置信度未填。

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from "vitest";
import { validate } from "@/domain/validation";
import type { Requirement } from "@/domain/types";

function baseReq(): Requirement {
  const s = { score: 2 as const, reason: "有理由" };
  return {
    id: "1", name: "x", description: "", problemStatement: "",
    mainCategory: "平台基建", tags: [], targetUserScenario: "", expectedCapability: "",
    affectedScope: "", frequency: "", strategyWindow: "", businessRequesterCount: 0,
    evidence: "", competitiveEvidence: "", escalationTrigger: null,
    scores: { strategy:s,userProblem:s,systemImpact:s,leverage:s,deviceEnable:s,competitive:s },
    confidence: "中", valueScore: null, grade: "C",
    modelVersion: "v2.0", weightsSnapshot: {} as any, thresholdsSnapshot: {S:85,A:70,B:50}, evaluatedAt: "",
  };
}

describe("validate", () => {
  it("合法输入 ok=true 无错误", () => {
    expect(validate(baseReq()).ok).toBe(true);
  });
  it("缺主类型 → 硬错误", () => {
    const r = baseReq(); (r as any).mainCategory = "";
    const v = validate(r);
    expect(v.ok).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });
  it("维度分越界 → 硬错误", () => {
    const r = baseReq(); (r.scores.strategy as any).score = 7;
    expect(validate(r).ok).toBe(false);
  });
  it("理由为空 → 软提醒但仍 ok", () => {
    const r = baseReq(); r.scores.strategy.reason = "";
    const v = validate(r);
    expect(v.ok).toBe(true);
    expect(v.warnings.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- validation`
Expected: FAIL

- [ ] **Step 3: 实现**

```typescript
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
```

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- validation`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/validation.ts src/domain/__tests__/validation.test.ts
git commit -m "feat(domain): 输入校验（硬错误拦截 + 软提醒）"
```

### Task 7: 评估总入口（编排 + 快照 + 不变量测试）

**Files:**
- Create: `src/domain/evaluate.ts`
- Test: `src/domain/__tests__/evaluate.test.ts`

**Interfaces:**
- Consumes: `checkEscalation` (Task 3)、`calculateValueScore`/`normalizeWeights` (Task 4)、`assignGrade` (Task 5)、`Requirement`/`ModelConfig` (Task 1)、`DEFAULT_CONFIG`/`MODEL_VERSION` (Task 2)。
- Produces: `evaluate(req: Requirement, config: ModelConfig, now: string): { valueScore: number | null; grade: Grade; weightsSnapshot: Weights; thresholdsSnapshot: Thresholds; wasNormalized: boolean }`。`now` 作为参数传入（不在纯函数内取时间，保证可测试可复现）。

- [ ] **Step 1: 写失败测试（覆盖三条核心不变量 + 直升短路）**

```typescript
import { describe, it, expect } from "vitest";
import { evaluate } from "@/domain/evaluate";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";
import type { Requirement, DimensionScore, DimensionKey } from "@/domain/types";

const mk = (n:0|1|2|3|4): DimensionScore => ({ score:n, reason:"r" });
function req(n:0|1|2|3|4, trigger:Requirement["escalationTrigger"]=null, tags:string[]=[]): Requirement {
  const scores = { strategy:mk(n),userProblem:mk(n),systemImpact:mk(n),leverage:mk(n),deviceEnable:mk(n),competitive:mk(n) } as Record<DimensionKey,DimensionScore>;
  return {
    id:"1",name:"x",description:"",problemStatement:"",mainCategory:"平台基建",tags,
    targetUserScenario:"",expectedCapability:"",affectedScope:"",frequency:"",strategyWindow:"",
    businessRequesterCount:0,evidence:"",competitiveEvidence:"",escalationTrigger:trigger,
    scores,confidence:"中",valueScore:null,grade:"C",modelVersion:"",weightsSnapshot:{} as any,
    thresholdsSnapshot:{S:85,A:70,B:50},evaluatedAt:"",
  };
}

describe("evaluate", () => {
  it("直升命中：valueScore 为 null，等级取直升结果，不受六维影响", () => {
    const r = evaluate(req(0, "legal"), DEFAULT_CONFIG, "2026-08-12T00:00:00Z");
    expect(r.valueScore).toBeNull();
    expect(r.grade).toBe("S");
  });
  it("黄色舆情直升 A", () => {
    expect(evaluate(req(4, "yellow"), DEFAULT_CONFIG, "t").grade).toBe("A");
  });
  it("未直升：全 4 分 → 100 → S", () => {
    const r = evaluate(req(4), DEFAULT_CONFIG, "t");
    expect(r.valueScore).toBe(100);
    expect(r.grade).toBe("S");
  });
  it("标签数量不改变分数", () => {
    const a = evaluate(req(3, null, []), DEFAULT_CONFIG, "t");
    const b = evaluate(req(3, null, ["折叠屏","Token","战略"]), DEFAULT_CONFIG, "t");
    expect(a.valueScore).toBe(b.valueScore);
    expect(a.grade).toBe(b.grade);
  });
  it("相同输入稳定复现", () => {
    const a = evaluate(req(3), DEFAULT_CONFIG, "t");
    const b = evaluate(req(3), DEFAULT_CONFIG, "t");
    expect(a).toEqual(b);
  });
  it("冻结权重与阈值快照", () => {
    const r = evaluate(req(3), DEFAULT_CONFIG, "t");
    expect(r.weightsSnapshot).toEqual(DEFAULT_CONFIG.weights);
    expect(r.thresholdsSnapshot).toEqual(DEFAULT_CONFIG.thresholds);
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- evaluate`
Expected: FAIL

- [ ] **Step 3: 实现**

```typescript
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
```

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- evaluate`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/evaluate.ts src/domain/__tests__/evaluate.test.ts
git commit -m "feat(domain): 评估总入口编排（直升短路→算分→判级→快照）"
```

---

## Phase 3：CSV 与持久层

### Task 8: CSV 导入导出

**Files:**
- Create: `src/domain/csv.ts`
- Test: `src/domain/__tests__/csv.test.ts`

**Interfaces:**
- Consumes: `Requirement`、`DimensionKey` from Task 1；`DIMENSION_META` from Task 2。
- Produces:
  - `exportToCsv(reqs: Requirement[]): string`（UTF-8 内容，首行带 BOM，含全字段 + 权重/阈值快照 + 模型版本）
  - `importFromCsv(text: string): { requirements: Requirement[]; report: { success: number; skipped: number; reasons: string[] } }`（逐行校验，脏行跳过并记原因，不静默丢弃）

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from "vitest";
import { exportToCsv, importFromCsv } from "@/domain/csv";
import type { Requirement, DimensionScore, DimensionKey } from "@/domain/types";

const mk = (n:0|1|2|3|4): DimensionScore => ({ score:n, reason:"r" });
function req(id:string): Requirement {
  const s = { strategy:mk(3),userProblem:mk(2),systemImpact:mk(4),leverage:mk(3),deviceEnable:mk(1),competitive:mk(2) } as Record<DimensionKey,DimensionScore>;
  return { id,name:"需求"+id,description:"d",problemStatement:"p",mainCategory:"平台基建",tags:["折叠屏"],
    targetUserScenario:"",expectedCapability:"",affectedScope:"",frequency:"",strategyWindow:"",businessRequesterCount:1,
    evidence:"",competitiveEvidence:"",escalationTrigger:null,scores:s,confidence:"中",valueScore:78.5,grade:"A",
    modelVersion:"v2.0",weightsSnapshot:{strategy:23,userProblem:17,systemImpact:20,leverage:18,deviceEnable:12,competitive:10},
    thresholdsSnapshot:{S:85,A:70,B:50},evaluatedAt:"2026-08-12" };
}

describe("csv 往返", () => {
  it("导出含 BOM 且首行为表头", () => {
    const csv = exportToCsv([req("1")]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(csv).toContain("需求名称");
  });
  it("导出再导入可还原关键字段", () => {
    const csv = exportToCsv([req("1"), req("2")]);
    const { requirements, report } = importFromCsv(csv);
    expect(report.success).toBe(2);
    expect(requirements[0].name).toBe("需求1");
    expect(requirements[0].scores.systemImpact.score).toBe(4);
  });
  it("脏行被跳过并记录原因，不影响合法行", () => {
    const csv = exportToCsv([req("1")]) + "\n坏数据,,,,\n";
    const { requirements, report } = importFromCsv(csv);
    expect(report.success).toBe(1);
    expect(report.skipped).toBeGreaterThan(0);
    expect(report.reasons.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- csv`
Expected: FAIL

- [ ] **Step 3: 实现**

实现 `exportToCsv`：拼接固定列顺序的表头（需求名称、主类型、二级标签、六维分数各一列、六维理由各一列、置信度、价值分、等级、模型版本、权重快照 JSON、阈值快照 JSON、评估时间等，对齐 v2.0 第 11 节），值内含逗号/引号/换行时用双引号包裹并转义，首行前置 `﻿`。实现 `importFromCsv`：按行解析（处理引号内换行），首行为表头做列名映射，逐行构造 `Requirement`；缺列、分数非 0-4、主类型非法的行计入 `skipped` 并把原因推入 `reasons`。字段与导出严格对称。

（实现代码在执行时按上述规格编写，需保证 export→import 往返对关键字段无损。）

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- csv`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/csv.ts src/domain/__tests__/csv.test.ts
git commit -m "feat(domain): CSV 导入导出（BOM、全字段快照、导入报告）"
```

### Task 9: localStorage 持久层

**Files:**
- Create: `src/store/storage.ts`
- Test: `src/domain/__tests__/storage.test.ts`

**Interfaces:**
- Consumes: `Requirement`、`ModelConfig` from Task 1；`DEFAULT_CONFIG`/`MODEL_VERSION` from Task 2。
- Produces:
  - `loadRequirements(): Requirement[]`、`saveRequirements(reqs: Requirement[]): void`
  - `loadConfig(): ModelConfig`、`saveConfig(c: ModelConfig): void`
  - 内部 key 常量带版本前缀。

- [ ] **Step 1: 写失败测试（jsdom 提供 localStorage）**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { loadRequirements, saveRequirements, loadConfig, saveConfig } from "@/store/storage";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";

beforeEach(() => localStorage.clear());

describe("storage", () => {
  it("空存储返回空需求数组", () => { expect(loadRequirements()).toEqual([]); });
  it("空存储返回默认配置", () => { expect(loadConfig()).toEqual(DEFAULT_CONFIG); });
  it("保存后可读回需求", () => {
    const reqs = [{ id:"1" } as any];
    saveRequirements(reqs);
    expect(loadRequirements()).toEqual(reqs);
  });
  it("保存后可读回配置", () => {
    const c = { weights:{...DEFAULT_CONFIG.weights, strategy:30}, thresholds:{S:80,A:65,B:45} };
    saveConfig(c);
    expect(loadConfig()).toEqual(c);
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- storage`
Expected: FAIL

- [ ] **Step 3: 实现**

```typescript
import type { Requirement, ModelConfig } from "@/domain/types";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";

const REQ_KEY = "hyperos-rvm-v2:requirements";
const CFG_KEY = "hyperos-rvm-v2:config";

export function loadRequirements(): Requirement[] {
  const raw = localStorage.getItem(REQ_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Requirement[]; } catch { return []; }
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
```

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- storage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/storage.ts src/domain/__tests__/storage.test.ts
git commit -m "feat(store): localStorage 持久层（需求与配置读写）"
```

---

## Phase 4：UI 基础组件

### Task 10: 安装 shadcn 组件 + 基础展示组件

**Files:**
- Create: `src/components/ui/*`（button、input、select、tabs、table、dialog、badge、tooltip、textarea、label、slider、switch、card 等，由 shadcn CLI 生成）
- Create: `src/components/GradeBadge.tsx`、`src/components/ScoreSelector.tsx`
- Test: `src/components/__tests__/ScoreSelector.test.tsx`

**Interfaces:**
- Produces:
  - `GradeBadge({ grade }: { grade: Grade })` — 按等级用不同中性色强调，A 基调（方形、锐利）。
  - `ScoreSelector({ value, onChange, anchors }: { value: 0|1|2|3|4; onChange: (v:0|1|2|3|4)=>void; anchors: string[] })` — 0-4 五格按钮，hover 显示对应锚点文案（tooltip）。

- [ ] **Step 1: 用 shadcn CLI 安装组件**

```bash
npx shadcn@latest add button input select tabs table dialog badge tooltip textarea label slider switch card
```

- [ ] **Step 2: 写 ScoreSelector 失败测试**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoreSelector } from "@/components/ScoreSelector";

describe("ScoreSelector", () => {
  it("渲染 5 个档位按钮", () => {
    render(<ScoreSelector value={2} onChange={()=>{}} anchors={["0","1","2","3","4"]} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });
  it("点击某档触发 onChange 对应值", () => {
    const fn = vi.fn();
    render(<ScoreSelector value={0} onChange={fn} anchors={["0","1","2","3","4"]} />);
    fireEvent.click(screen.getByText("3"));
    expect(fn).toHaveBeenCalledWith(3);
  });
});
```

- [ ] **Step 3: 运行验证失败**

Run: `npm run test -- ScoreSelector`
Expected: FAIL

- [ ] **Step 4: 实现 GradeBadge 与 ScoreSelector**

GradeBadge 用 `cn()` 按 grade 映射到中性色 class（S 最强调、C 最弱），方形圆角小、字重高。ScoreSelector 渲染 0-4 五个方形按钮，选中态用深色填充（对齐 A 基调 mockup），每个按钮包 Tooltip 展示 `anchors[i]`，点击调用 `onChange(i)`。

- [ ] **Step 5: 运行验证通过**

Run: `npm run test -- ScoreSelector`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat(ui): 安装 shadcn 组件 + GradeBadge/ScoreSelector 基础组件"
```

### Task 11: 实时评级面板 LiveResultPanel

**Files:**
- Create: `src/components/LiveResultPanel.tsx`
- Test: `src/components/__tests__/LiveResultPanel.test.tsx`

**Interfaces:**
- Consumes: `EvaluationResult` (Task 7)、`DIMENSION_META` (Task 2)、`GradeBadge` (Task 10)。
- Produces: `LiveResultPanel({ result, scores, weights, escalationTrigger }: {...})` — sticky 面板，显示等级、价值总分（直升时显示「直升 · 原因」）、各维贡献分、归一化提示。等级变化用 Framer Motion 数字滚动 + 颜色过渡（克制）。

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveResultPanel } from "@/components/LiveResultPanel";
import { DEFAULT_WEIGHTS } from "@/domain/modelConfig";

describe("LiveResultPanel", () => {
  it("普通评估显示分数与等级", () => {
    render(<LiveResultPanel result={{valueScore:78.5,grade:"A",weightsSnapshot:DEFAULT_WEIGHTS,thresholdsSnapshot:{S:85,A:70,B:50},wasNormalized:false}} scores={{} as any} weights={DEFAULT_WEIGHTS} escalationTrigger={null} />);
    expect(screen.getByText("78.5")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
  it("直升时显示「直升」而非分数", () => {
    render(<LiveResultPanel result={{valueScore:null,grade:"S",weightsSnapshot:DEFAULT_WEIGHTS,thresholdsSnapshot:{S:85,A:70,B:50},wasNormalized:false}} scores={{} as any} weights={DEFAULT_WEIGHTS} escalationTrigger={"legal"} />);
    expect(screen.getByText(/直升/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- LiveResultPanel`
Expected: FAIL

- [ ] **Step 3: 实现**

按 A 基调 mockup 实现：大号等级字、价值总分、各维「名称 + 贡献分（score/4×weight）」列表、置信度、`wasNormalized` 时显示「已按比例归一化」提示；`escalationTrigger` 非空时主区显示「直升 · {ESCALATION_META[trigger].label}」。数字用 Framer Motion 的 animate 做滚动过渡。

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- LiveResultPanel`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/LiveResultPanel.tsx src/components/__tests__/LiveResultPanel.test.tsx
git commit -m "feat(ui): 实时评级面板（直升态 + 归一化提示 + 克制动效）"
```

---

## Phase 5：页面组装

### Task 12: 单条打分页 ScoringPage

**Files:**
- Create: `src/components/RequirementForm.tsx`、`src/pages/ScoringPage.tsx`
- Test: `src/components/__tests__/RequirementForm.test.tsx`

**Interfaces:**
- Consumes: `evaluate` (Task 7)、`validate` (Task 6)、`DIMENSION_META`/`ESCALATION_META` (Task 2)、`ScoreSelector`/`LiveResultPanel`/`GradeBadge` (Task 10-11)、storage (Task 9)。
- Produces: `ScoringPage` 页面组件；`RequirementForm({ initial, config, onSave }: {...})`。

- [ ] **Step 1: 写失败测试（打分即时反馈 + 直升淡出）**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RequirementForm } from "@/components/RequirementForm";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";

describe("RequirementForm", () => {
  it("修改维度分后实时面板分数更新", () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={()=>{}} />);
    // 六维全给 4（各维找到 ScoreSelector 的 "4" 按钮点击）
    screen.getAllByText("4").forEach(btn => fireEvent.click(btn));
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
  });
  it("选择直升条件后六维区禁用且面板显示直升", () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={()=>{}} />);
    fireEvent.click(screen.getByLabelText(/法律/));
    expect(screen.getByText(/直升/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- RequirementForm`
Expected: FAIL

- [ ] **Step 3: 实现**

左侧表单：基础信息（名称/主类型 Select/标签）、第 0 层直升单选（含「未命中」+ 5 条）、六维（每维 ScoreSelector + 理由 Textarea）、保存按钮。用 `useState` 持有 Requirement 草稿，任一改动调 `evaluate` 重算并传给右侧 `LiveResultPanel`。`escalationTrigger !== null` 时六维区 `opacity-50 pointer-events-none` 淡出禁用。保存时调 `validate`，有 warnings 用 Dialog 确认。ScoringPage 负责从 storage 载入 config、保存后写回 storage 需求列表。

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- RequirementForm`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/RequirementForm.tsx src/pages/ScoringPage.tsx src/components/__tests__/RequirementForm.test.tsx
git commit -m "feat(ui): 单条打分页（即时反馈 + 直升淡出 + 保存校验）"
```

### Task 13: 批量清单页 ListPage（筛选 + 排序 + 状态）

**Files:**
- Create: `src/components/FilterBar.tsx`、`src/components/RequirementTable.tsx`、`src/pages/ListPage.tsx`
- Test: `src/components/__tests__/RequirementTable.test.tsx`

**Interfaces:**
- Consumes: storage (Task 9)、`GradeBadge` (Task 10)、`Requirement` (Task 1)。
- Produces: `ListPage`；`RequirementTable({ requirements, onRowClick }: {...})`；`FilterBar({ filters, onChange }: {...})`。默认排序：等级(S>A>B>C) → 价值分降序 → 置信度(高>中>低) → 时间升序。

- [ ] **Step 1: 写失败测试（排序 + 直升显示 + 筛选）**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { RequirementTable } from "@/components/RequirementTable";

const rows = [
  { id:"1", name:"低分需求", mainCategory:"体验优化", grade:"C", valueScore:40, confidence:"低", escalationTrigger:null, evaluatedAt:"2026-01-01" },
  { id:"2", name:"直升需求", mainCategory:"平台基建", grade:"S", valueScore:null, confidence:"高", escalationTrigger:"legal", evaluatedAt:"2026-01-02" },
] as any;

describe("RequirementTable", () => {
  it("按等级排序：S 行在 C 行之前", () => {
    render(<RequirementTable requirements={rows} onRowClick={()=>{}} />);
    const trs = screen.getAllByRole("row").slice(1); // 去表头
    expect(within(trs[0]).getByText("直升需求")).toBeInTheDocument();
  });
  it("直升需求价值分列显示「直升」", () => {
    render(<RequirementTable requirements={rows} onRowClick={()=>{}} />);
    expect(screen.getByText(/直升/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- RequirementTable`
Expected: FAIL

- [ ] **Step 3: 实现**

RequirementTable 用 shadcn Table，列：# / 需求 / 主类型 / 等级(GradeBadge) / 价值分(null→「直升」) / 置信度 / 状态(已调整/预设 badge)。内部实现 `sortRequirements` 按 Global Constraints 的默认排序。FilterBar 提供主类型/等级/标签/置信度 Select + 关键词 Input，`onChange` 回传 filters 对象。ListPage 从 storage 载入、应用筛选与排序、点行回调载入单条打分（切 Tab + 传 initial）。

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- RequirementTable`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FilterBar.tsx src/components/RequirementTable.tsx src/pages/ListPage.tsx src/components/__tests__/RequirementTable.test.tsx
git commit -m "feat(ui): 批量清单页（筛选 + 默认排序 + 直升/状态展示)"
```

### Task 14: 批量赋值 + CSV 导入导出接线

**Files:**
- Modify: `src/pages/ListPage.tsx`
- Create: `src/components/BulkAssignBar.tsx`、`src/components/ImportReportDialog.tsx`
- Test: `src/components/__tests__/BulkAssignBar.test.tsx`

**Interfaces:**
- Consumes: `exportToCsv`/`importFromCsv` (Task 8)、`evaluate` (Task 7)、storage (Task 9)。
- Produces: `BulkAssignBar({ onApply }: { onApply: (dim: DimensionKey, score: 0|1|2|3|4)=>void })`；导入后弹 `ImportReportDialog` 展示报告。批量赋值只作用于当前筛选结果，并对每条重新 `evaluate`。

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkAssignBar } from "@/components/BulkAssignBar";

describe("BulkAssignBar", () => {
  it("选维度+分数后点应用触发 onApply", () => {
    const fn = vi.fn();
    render(<BulkAssignBar onApply={fn} />);
    // 选择维度与分数的交互后点击「应用到筛选结果」
    fireEvent.click(screen.getByText("应用到筛选结果"));
    expect(fn).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- BulkAssignBar`
Expected: FAIL

- [ ] **Step 3: 实现**

BulkAssignBar：维度 Select + 分数 Select + 「应用到筛选结果」「重置为预设」按钮。ListPage 接线：应用批量赋值时对筛选结果每条改对应维度分数并重新 evaluate、标记「已人工调整」、写回 storage。导出按钮调 exportToCsv 触发下载（Blob + a[download]）。导入按钮读文件文本调 importFromCsv，把 requirements 合并进 storage 并弹 ImportReportDialog 显示成功/跳过/原因。

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- BulkAssignBar`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/BulkAssignBar.tsx src/components/ImportReportDialog.tsx src/pages/ListPage.tsx src/components/__tests__/BulkAssignBar.test.tsx
git commit -m "feat(ui): 批量赋值与 CSV 导入导出接线（含导入报告）"
```

### Task 15: 高级设置面板 SettingsPanel（权重/阈值可调）

**Files:**
- Create: `src/components/SettingsPanel.tsx`
- Test: `src/components/__tests__/SettingsPanel.test.tsx`

**Interfaces:**
- Consumes: `ModelConfig` (Task 1)、`normalizeWeights` (Task 4)、`DEFAULT_CONFIG` (Task 2)、storage (Task 9)。
- Produces: `SettingsPanel({ config, onChange }: {...})` — 六维权重输入 + 阈值(S/A/B)输入 + 实时显示权重合计与归一化提示 + 「恢复默认」。

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsPanel } from "@/components/SettingsPanel";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";

describe("SettingsPanel", () => {
  it("显示权重合计", () => {
    render(<SettingsPanel config={DEFAULT_CONFIG} onChange={()=>{}} />);
    expect(screen.getByText(/合计/)).toBeInTheDocument();
  });
  it("恢复默认触发 onChange 为默认配置", () => {
    const fn = vi.fn();
    render(<SettingsPanel config={{...DEFAULT_CONFIG, thresholds:{S:80,A:60,B:40}}} onChange={fn} />);
    fireEvent.click(screen.getByText("恢复默认"));
    expect(fn).toHaveBeenCalledWith(DEFAULT_CONFIG);
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- SettingsPanel`
Expected: FAIL

- [ ] **Step 3: 实现**

对话框内：六维权重 number input（实时算合计，≠100 显示「将按比例归一化」）、S/A/B 阈值 number input、恢复默认按钮。onChange 回传新 config，由外层写回 storage。

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- SettingsPanel`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/__tests__/SettingsPanel.test.tsx
git commit -m "feat(ui): 高级设置面板（权重/阈值可调 + 归一化提示）"
```

### Task 16: App 组装（双 Tab + 设置入口 + 页面联动）

**Files:**
- Modify: `src/App.tsx`
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: `ScoringPage`、`ListPage` (Task 12-13)、`SettingsPanel` (Task 15)、storage (Task 9)。
- Produces: 完整应用外壳——顶部导航 [单条打分][批量清单] + ⚙设置；config 提升到 App 级 state，从 storage 初始化，改动写回；列表点行 → 切到打分页并带入该需求。

- [ ] **Step 1: 写失败测试**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "@/App";

describe("App", () => {
  it("默认显示单条打分，可切到批量清单", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: /批量清单/ }));
    expect(screen.getByText(/导出/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行验证失败**

Run: `npm run test -- App`
Expected: FAIL

- [ ] **Step 3: 实现**

用 shadcn Tabs 组织两页，顶部放标题与设置按钮（打开 SettingsPanel Dialog）。App 用 `useState` 持有 config（初值 `loadConfig()`）与「待复核需求」；SettingsPanel onChange → saveConfig + setState；ListPage onRowClick → 设待复核需求并切到打分 Tab。

- [ ] **Step 4: 运行验证通过**

Run: `npm run test -- App`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/__tests__/App.test.tsx
git commit -m "feat(ui): App 外壳组装（双 Tab + 设置 + 页面联动）"
```

---

## Phase 6：整体验证

### Task 17: 全量测试 + 构建 + 手动验收

**Files:**
- 无新增，验证性任务。

- [ ] **Step 1: 全量单测**

Run: `npm run test`
Expected: 全绿。

- [ ] **Step 2: 构建 + 类型检查**

Run: `npm run build`
Expected: 成功，`tsc` 无 error。

- [ ] **Step 3: 手动走 v2.0 第 12 节 10 个验收案例**

启动 `npm run dev`，逐条录入并对照预期：法律红线→S、红色舆情→S、黄色舆情→A、下一代应用框架能力→S/高A、折叠屏局部低频→不自动 S、多应用标准控件→看影响面/杠杆、单应用微调→B/C、高频槽点→可 A、概念性下一代能力→高战略分+低置信、纯跟随需求→竞争≤2。记录任何偏差。

- [ ] **Step 4: 验证核心不变量（人工）**

在界面上确认：命中直升的需求改六维分不影响等级；加减标签不影响分数；同一需求重复保存分数与等级一致。

- [ ] **Step 5: Commit（若有微调）**

```bash
git add -A
git commit -m "test: 通过 v2.0 验收案例与核心不变量验证"
```

---

## Self-Review 结果

**Spec 覆盖检查：**
- 三层架构 → Task 0/1-9/10-16 ✓
- 数据模型（含快照） → Task 1 + Task 7 快照 ✓
- 单一权重表/默认值 → Task 2 + Global Constraints ✓
- 直升短路 → Task 3 + Task 7 ✓
- 算分归一化 → Task 4 ✓
- 等级边界值 → Task 5 ✓
- 校验硬错误/软提醒 → Task 6 ✓
- CSV 导入导出报告 → Task 8 ✓
- localStorage → Task 9 ✓
- 单条打分（即时反馈+直升淡出） → Task 11/12 ✓
- 批量清单（筛选+排序+状态） → Task 13 ✓
- 批量赋值 → Task 14 ✓
- 高级设置（权重/阈值可调） → Task 15 ✓
- 双 Tab 联动 → Task 16 ✓
- 三条不变量测试 → Task 7 + Task 17 ✓
- 验收案例 → Task 17 ✓

**占位符扫描：** Task 8 与部分 UI 任务的 Step 3 用描述性规格而非完整代码——这些是 CSV 解析/表单组装类，规格已给出明确的输入输出契约与列顺序要求，执行时按契约编写；测试代码已完整给出，可驱动实现。其余步骤均有可运行代码。

**类型一致性：** `evaluate` 返回 `EvaluationResult`（Task 7 定义），Task 11/12 消费一致；`checkEscalation`/`calculateValueScore`/`assignGrade`/`validate` 签名跨任务一致；`DimensionKey`/`Weights`/`Thresholds` 全程统一。

# HyperOS 需求价值评估网站 · 设计文档

- 日期：2026-08-12
- 状态：待用户审阅
- 依据模型：`docs/requirement-value-model-v2.md`（v2.0）
- 关联约束：`AGENTS.md`

## 1. 目标与范围

构建一个 HyperOS 设计系统需求价值评估与统计网站，让团队按 v2.0 模型给需求打分、定 S/A/B/C 等级、筛选比较、沉淀记录。

**一期范围（接近竞品全量）：**

- 单条打分：六维评分 + 第 0 层直升通道 + 实时等级面板
- 批量清单：多维筛选、排序、等级/价值分/置信度展示、状态标记
- 批量赋值：对筛选结果批量设定某维度分数
- 高级设置：权重表、等级阈值可调
- CSV 导入 / 导出（含数据来源标注与配置快照）

**明确不做（一期）：**

- 后端、数据库、用户登录、权限（纯前端 + 浏览器本地存储）
- 外部数据自动匹配（满意度调研 / PV·UV / 舆情），全部人工填写
- UI 组件的自动化测试（靠手动验收）

## 2. 关键决策记录

| 决策项 | 结论 | 说明 |
| --- | --- | --- |
| 架构 | 纯前端 SPA，无后端 | 数据存浏览器本地，CSV 搬运 |
| 脚手架 | Vite + React + TypeScript | shadcn/ui 官方支持，构建输出静态文件 |
| 组件库 | shadcn/ui（React + Tailwind） | 用户指定 |
| 部署 | 公网静态托管 | 纯前端下任何静态托管/内网均可 |
| 协作 | 无登录、共享数据 | 内部小团队，CSV 沉淀数据 |
| 数据存储 | localStorage 封装 | 附模型版本标记 |
| 设计基调 | A · 克制精密 | 大量留白、近乎无色、方形几何、锐利层级 |
| 评分模型 | v2.0 | 单一权重表、无成本轴、置信度高/中/低、阈值可调、第 0 层直升 |

## 3. 整体架构（三层分离）

核心原则（`AGENTS.md:37-38`）：评分逻辑封装为纯函数，UI 只负责展示。

```
UI 层 (React + shadcn/ui)          收集输入、展示结果、触发操作
        │ 调用（输入分数 → 拿回等级）
领域层 (纯 TS 函数 + 类型)          零 React 依赖，可单独测试
        │ 读写
持久层 (localStorage 封装)          附模型版本标记
```

**数据流（一条直线，无异步）：**

```
用户打分 → escalation 判直升 → 未命中则 scoring 算分
→ grading 判等级 → storage 存 → UI 重新渲染结果面板
```

领域层零 React 依赖的价值：可单独测试（边界值）、规则集中一处、将来可平移到后端。

## 4. 数据模型

```typescript
type MainCategory = '平台基建' | '适配建设' | '体验优化';

type DimensionKey =
  | 'strategy'      // 战略与未来确定性
  | 'userProblem'   // 用户问题与风险
  | 'systemImpact'  // 系统影响面
  | 'leverage'      // 体系杠杆价值
  | 'deviceEnable'  // 设备与生态赋能
  | 'competitive';  // 竞争价值

interface DimensionScore {
  score: 0 | 1 | 2 | 3 | 4;
  reason: string;               // 评分理由（可追溯）
}

type EscalationTrigger =
  | 'legal'         // 法律/政策/价值观红线 → S
  | 'redOrange'     // 红/橙舆情 → S
  | 'blockDevice'   // 阻塞新形态设备 → S
  | 'hardwareSell'  // 硬件卖点 → S
  | 'yellow'        // 黄色舆情 → A
  | null;           // 未命中，走六维打分

type Grade = 'S' | 'A' | 'B' | 'C';
type Confidence = '高' | '中' | '低';

interface Requirement {
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

  valueScore: number | null;    // 直升需求存 null
  grade: Grade;

  // 可复现性快照（阈值/权重可调，必须随记录存）
  modelVersion: string;         // 'v2.0'
  weightsSnapshot: Record<DimensionKey, number>;
  thresholdsSnapshot: { S: number; A: number; B: number };
  evaluatedAt: string;
}
```

**设计要点：**

- `weightsSnapshot` / `thresholdsSnapshot`：权重和阈值可调，每条记录冻结当时配置，保证历史结果可复现（`AGENTS.md:24`）。
- `valueScore: number | null`：命中直升的需求未算分，存 `null`，列表显示“直升 · 原因”，不虚构分数。
- `Record<DimensionKey, DimensionScore>`：强制六维齐全，漏一个 TS 报错。

## 5. 目录结构

```
src/
├── domain/                    # 领域层（纯 TS，零 React）
│   ├── types.ts
│   ├── scoring.ts             # 六维加权算价值分
│   ├── grading.ts             # 价值分 → 等级（阈值可调）
│   ├── escalation.ts          # 第 0 层直升判定
│   ├── validation.ts          # 校验
│   ├── csv.ts                 # CSV 导入导出
│   ├── modelConfig.ts         # 默认权重/阈值/维度锚点文案
│   └── __tests__/             # 领域层单测
├── store/
│   └── storage.ts             # localStorage 封装
├── components/
│   ├── ui/                    # shadcn/ui 组件
│   └── ...                    # 业务组件
├── pages/
│   ├── ScoringPage.tsx        # 单条打分
│   ├── ListPage.tsx           # 批量清单
│   └── SettingsPanel.tsx      # 高级设置
├── App.tsx
└── main.tsx
```

维度锚点文案（0-4 各档判断标准，来自 v2.0 第 6 节）集中在 `modelConfig.ts`，UI 表单读它渲染，文档改了只改一处。

## 6. 核心计算逻辑

### 6.1 执行顺序（直升优先，短路返回）

```
evaluate(requirement, config)
  ├─ 1. escalation 判定 ── 命中 → 直接返回 {grade, valueScore: null}
  ├─ 2. validation 校验 ── 不合法 → 返回错误，不计算
  ├─ 3. scoring 算价值分 → valueScore (0-100)
  └─ 4. grading 判等级   → grade
```

直升命中即 return（卫语句），后续不执行——UI 上表现为六维打分区淡出/禁用。

### 6.2 纯函数签名

```typescript
function checkEscalation(trigger: EscalationTrigger): Grade | null;

function calculateValueScore(
  scores: Record<DimensionKey, DimensionScore>,
  weights: Record<DimensionKey, number>
): number;   // Σ(score ÷ 4 × weight)，0-100 保留一位小数

function assignGrade(
  valueScore: number,
  thresholds: { S: number; A: number; B: number }
): Grade;    // >=S→S; >=A→A; >=B→B; else C

function validate(req: Requirement, weights): ValidationResult;
```

### 6.3 边界处理（测试重点）

| 场景 | 处理 |
| --- | --- |
| 等级边界 | 用未取整分数判等级，不四舍五入（v2.0 第 4.1） |
| 权重合计 ≠ 100% | **自动归一化**，界面显示“已按比例归一化”提示 |
| 维度分越界 | 类型层 `0\|1\|2\|3\|4` + 运行时再校验（防 CSV 脏数据） |
| 阈值边界 | 用 `>=`（85 属 S，不属 A） |
| 直升命中多条 | 取最高等级（S > A） |
| 浮点精度 | 先乘后除 + 保留一位，避免 0.1+0.2 类误差 |

## 7. UI 结构与交互

### 7.1 页面结构

顶部极简导航：`[单条打分] [批量清单]  ⚙设置`。

### 7.2 单条打分页（左表单 + 右实时面板）

- 左：基础信息 → 第 0 层直升（可选）→ 六维打分（每维 0-4 + 理由）→ 保存
- 右：sticky 固定的实时评级面板（等级 + 价值总分 + 各维贡献 + 置信度）
- 交互：
  - 打分即时反馈，右侧当场变，无需点“计算”
  - 等级变化用克制动效（数字滚动 + 微妙颜色过渡）
  - 命中直升 → 六维区自动淡出/禁用，右侧直接显示直升等级 + 原因
  - 理由未填 → 软提醒“N 个维度缺理由”，不硬拦

### 7.3 批量清单页

- 筛选栏：主类型 / 等级 / 标签 / 置信度 / 关键词 + 导入导出
- 批量赋值：选中维度 + 设定分数 + 应用到筛选结果 / 重置
- 列表列：# / 需求 / 主类型 / 等级 / 价值分（直升显示“直升”）/ 置信度 / 状态
- 状态标记：已人工调整 / 仍为预设（淡 badge）
- 默认排序：等级 → 价值分 → 置信度 → 时间（v2.0 第 9 节）
- 点行 → 载入单条打分复核

### 7.4 设计品质感的落点

不靠装饰，靠三件事：留白与层级、即时反馈的克制动效、状态一致性（直升在打分页/列表页表现一致）。技术实现：shadcn/ui + Tailwind + 少量 Framer Motion。

## 8. 错误处理

| 类型 | 处理 | 例子 |
| --- | --- | --- |
| 硬错误（阻止计算） | 拦截 + 提示 | 无主类型、维度分越界、CSV 列缺失 |
| 软提醒（允许但标记） | 计算照常 + 提示 | 理由未填、权重已归一化、置信度未选 |
| 数据降级（容错） | 合理默认 + 标注来源 | CSV 某维度空 → 记 0 分 + 标“导入缺失” |

## 9. 测试策略

工具：Vitest（Vite 原生集成）。一期只测领域层纯函数。

**必测边界值（来自 v2.0 第 12 节）：**

- 等级边界：85→S、84.9→A、70→A、69.9→B、50→B、49.9→C、0→C、100→S
- 直升优先：命中 legal→S（不管六维）、yellow→A、多条取最高
- 核心规则：全 4 分→100、全 0 分→0、归一化后 Σ=100%、标签数量不改变分数、浮点精度
- 可复现：同输入 + 同 config → 结果完全一致

**三条核心不变量：**

1. 命中直升的需求，等级不受六维影响
2. 标签数量不改变分数
3. 相同输入稳定复现相同分数和等级

## 10. CSV 导入导出

- 导出：v2.0 第 11 节全字段 + 数据来源标注 + 模型版本 + 权重/阈值快照
- 导入：逐行校验，脏数据不静默丢弃，生成导入报告（成功 N 条、跳过 M 条及原因）
- 编码：UTF-8 带 BOM，避免 Excel 中文乱码

## 11. 交付前验证

```
1. npm run test    领域层单测全绿（边界值）
2. npm run build   类型检查 + 构建通过（tsc 无 error）
3. 手动走 v2.0 第 12 节 10 个验收案例，逐条对照预期等级
```

## 12. AGENTS.md 一致性（已解决）

本设计选择“权重自动归一化”。`AGENTS.md:41` 已同步修改为“权重总和不为 100% 时按比例自动归一化并提示”，与本文档和 v2.0 第 4.2 节一致。无遗留冲突。

## 13. 技术栈清单

- 构建：Vite
- 框架：React 18 + TypeScript
- 组件：shadcn/ui（Radix + Tailwind CSS）
- 动效：Framer Motion（克制使用）
- 测试：Vitest
- 存储：localStorage
- 无后端、无数据库、无认证

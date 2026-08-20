# 文档索引

本项目是一个 HyperOS 设计系统需求价值评估与统计网站，帮助团队按 v2.1 模型判断需求价值等级、比较版本候选项，并沉淀长期设计系统能力。

技术栈：Vite + React 18 + TypeScript + shadcn/ui（Radix + Tailwind CSS）+ Framer Motion + Vitest。包管理器为 npm。命令见 `README.md`。

当前网站已按 v2.1 实现。修改评分规则时，以模型文档为权威来源，再同步 `src/domain/`、界面文案和测试。

## 按任务选读

| 你想做的事 | 先读 |
| --- | --- |
| 理解或修改评分维度、档位、权重、阈值、直升规则 | [requirement-value-model-v2.1.md](./requirement-value-model-v2.1.md) |
| 解读 `modelVersion` 为 v2.0 的历史记录 | [requirement-value-model-v2.md](./requirement-value-model-v2.md) |
| 对照 v1.0 历史规则（成本轴、按主类型分权重表） | [requirement-value-model-v1.md](./requirement-value-model-v1.md) |
| 安装、启动、构建、测试 | [../README.md](../README.md) |
| Agent 工作约定、模型约束、验证要求 | [../AGENTS.md](../AGENTS.md) |
| 一期设计决策、信息架构、与实现差异 | [superpowers/specs/2026-08-12-requirement-priority-website-design.md](./superpowers/specs/2026-08-12-requirement-priority-website-design.md) |
| 一期实施步骤记录（任务勾选未回写，以 git 为准） | [superpowers/plans/2026-08-12-requirement-priority-website.md](./superpowers/plans/2026-08-12-requirement-priority-website.md) |

## 文档目录

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| `docs/requirement-value-model-v2.1.md` | 当前标准，网站已按此实现 | 唯一评分依据 |
| `docs/requirement-value-model-v2.md` | 历史存档 | 已被 v2.1 取代；仅用于解读 v2.0 历史记录 |
| `docs/requirement-value-model-v1.md` | 历史存档 | 不要作为新评估或新代码的依据 |
| `docs/superpowers/specs/2026-08-12-requirement-priority-website-design.md` | 一期设计说明 | 按 v2.0 撰写，维度名称与档位以 v2.1 文档为准 |
| `docs/superpowers/plans/2026-08-12-requirement-priority-website.md` | 实施记录 | 保留原步骤，不以本文勾选代表完成度 |
| `README.md` | 当前 | 运行方式与仓库入口 |
| `AGENTS.md` | 当前 | Agent 约束，已按 v2.1 同步 |

未发现 `docs/` 下其他专题文档，也没有 `scripts/`、`data/` 目录或 `.env.example`。

## v2.0 → v2.1 变化速查

| 变更点 | v2.0 | v2.1 |
| --- | --- | --- |
| 置信度字段 | 高/中/低标注，参与排序 | 已移除 |
| 第 1 维 | 战略与未来确定性 | 承接 OS 美学战略 |
| 设备与生态赋能 | 0–4 五档 | 0–3 四档（原 1 分并入 0 分） |
| 公式分母 | 固定 4 | 该维度自身满分 `DIMENSION_META[key].maxScore` |
| 默认排序 | 等级 → 价值分 → 置信度 → 时间 | 等级 → 价值分 → 时间 |

完整说明见 v2.1 文档第 14 节。

## 代码对照

| 职责 | 位置 |
| --- | --- |
| 类型与字段 | `src/domain/types.ts` |
| 默认权重、阈值、六维锚点与满分、直升文案 | `src/domain/modelConfig.ts` |
| 评估编排（直升短路 → 算分 → 判级） | `src/domain/evaluate.ts` |
| 价值分计算与权重归一化 | `src/domain/scoring.ts` |
| 输入校验 | `src/domain/validation.ts`（表单保存时调用，不在 `evaluate` 内部） |
| CSV 导入导出 | `src/domain/csv.ts` |
| 本地持久化与旧记录兼容 | `src/store/storage.ts` |
| 单条打分 / 批量清单 | `src/pages/ScoringPage.tsx`、`src/pages/ListPage.tsx` |
| 高级设置 | `src/components/SettingsPanel.tsx`（设置 Dialog，不是独立页面） |

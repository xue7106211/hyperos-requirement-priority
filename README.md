# HyperOS Requirement Priority

本项目是一个 HyperOS 设计系统需求价值评估与统计网站，帮助团队按 v2.1 模型判断需求价值等级、比较版本候选项，并沉淀长期设计系统能力。

一期网站已实现为纯前端 SPA。评分规则以 `docs/requirement-value-model-v2.1.md` 为准；`v2.0` 与 `v1.0` 仅作历史存档。

## 技术栈

Vite + React 18 + TypeScript + shadcn/ui（Radix + Tailwind CSS）+ Framer Motion + Vitest。包管理器为 npm。无后端、无数据库、无认证、无环境变量。

数据保存在浏览器 localStorage（`hyperos-rvm-v2:requirements` / `hyperos-rvm-v2:config`），团队间用 CSV 导入导出搬运。

## 命令

```bash
npm install          # 安装依赖
npm run dev          # 本地开发（Vite）
npm run test         # 运行测试（vitest run）
npm run test:watch   # 测试监听模式
npm run build        # 类型检查 + 生产构建（tsc -b && vite build）
npm run preview      # 预览构建产物
```

## 仓库结构

```text
docs/                          模型标准、设计说明、实施记录
src/domain/                    评分规则（纯 TS，零 React 依赖）
src/store/storage.ts           localStorage 读写与旧记录向后兼容
src/pages/                     单条打分页、批量清单页
src/components/                业务组件与 shadcn/ui 基础件
src/App.tsx                    双 Tab 外壳与设置入口
```

更完整的目录与文档索引见 `docs/index.md`。Agent 工作约定见 `AGENTS.md`。

## 评分模型要点（v2.1）

- **六项价值维度**：承接 OS 美学战略、用户问题与风险、系统影响面、体系杠杆价值、设备与生态赋能、竞争价值。
- **档位数允许不同**：多数维度 `0–4` 五档，设备与生态赋能为 `0–3` 四档。
- **价值分** `= Σ(维度评分 ÷ 该维度满分 × 对应权重)`，取值 `0–100`。按各维度自身满分归一，保证任一维度打满分的贡献恰好等于它的权重。
- **等级阈值**默认 `S ≥ 85`、`A 70–84.9`、`B 50–69.9`、`C < 50`，可调。
- **第 0 层直升**：法律红线 / 红橙舆情 / 阻塞新形态设备 / 硬件卖点 → S，黄色舆情 → A，命中即跳过打分。
- 不评估实现成本，也没有置信度字段；证据要求由各维度评分理由承载。

## 网站能力（已实现）

- **单条打分**：主类型、标签、第 0 层直升、六维评分与理由；右侧实时显示等级 / 价值分 / 雷达图 / 各维贡献
- **批量清单**：按名称、主类型、等级、标签筛选；默认排序为等级 → 价值分 → 评估时间
- **批量赋值**：对当前筛选结果改某一维分数并重新评估，可选档位随维度满分变化
- **高级设置**：调整六维权重与 S/A/B 阈值；合计不为 100% 时按比例归一化并提示
- **CSV**：UTF-8 带 BOM，含权重/阈值快照；导入按 ID 覆盖，脏行跳过并生成报告
- **旧记录兼容**：读取 v2.0 记录时补齐缺失维度、收敛越界分数，但不重算价值分与等级，也不改写 `modelVersion`

评分计算封装在 `src/domain/` 纯函数中。UI 只负责输入、解释和展示，不复制公式，也不写死档位数。

## 依赖说明

业务代码实际使用 React、Radix（dialog / label / select / slot / tabs / tooltip）、class-variance-authority、clsx、tailwind-merge、framer-motion、lucide-react。

`src/components/ui/slider.tsx`、`switch.tsx`、`card.tsx` 由 shadcn CLI 安装，当前业务页面未引用。未使用的依赖不要从文档写成产品能力。

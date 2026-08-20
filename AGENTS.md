# HyperOS Requirement Priority

## 项目目标

本项目是一个 HyperOS 设计系统需求价值评估与统计网站，帮助团队按 v2.1 模型判断需求价值等级、比较版本候选项，并沉淀长期设计系统能力。

一期网站已实现为纯前端 SPA。当前优先维护 `docs/requirement-value-model-v2.1.md` 中的判断标准与 `src/domain/` 数据模型；修改评分规则时先更新模型文档，再同步类型、计算、文案和测试。`v2.0` 与 `v1.0` 作为历史版本存档保留。文档索引见 `docs/index.md`。

## 工作原则

- 先理解并遵守 `docs/requirement-value-model-v2.1.md` 中的评分维度、档位、权重、阈值和字段定义；`v2.0` 与 `v1.0` 作为历史版本存档保留。
- v2.1 不评估实现成本，成本在价值评估之外的排期环节讨论；也不使用未经确认的单一性价比公式替代价值判断。
- v2.1 已移除置信度字段。证据要求由各维度的评分理由承载，不再用高/中/低标注表达证据成熟度。
- 新机、折叠屏、平板、Token、美学战略、专家反馈等属于标签或证据，不得仅凭标签自动加分。
- 每个评分都应能追溯到明确的判断理由和证据来源。
- 需求价值模型发生变化时，更新模型版本，不静默修改历史评估结果；历史记录保留其原始 `modelVersion`、价值分和等级。
- 优先修复根本问题，避免引入与当前任务无关的重构或依赖。
- 默认使用中文编写项目文档、界面文案和评估说明；代码标识符使用清晰的英文命名。

## 需求模型约束

- 每条需求只能选择一个主类型：`平台基建`、`适配建设`、`体验优化`；主类型仅用于筛选和统计，不影响权重。
- 六项价值维度**允许档位数不同**：`承接 OS 美学战略`、`用户问题与风险`、`系统影响面`、`体系杠杆价值`、`竞争价值` 为 `0–4` 五档，`设备与生态赋能` 为 `0–3` 四档。各维度满分记录在 `DIMENSION_META[key].maxScore`，等于 `anchors.length - 1`。
- 价值分公式为 `Σ(维度评分 ÷ 该维度满分 × 对应权重)`，取值 `0–100`。分母是各维度自身满分，不得写死为 4。
- 该公式保证任一维度打满分的贡献恰好等于它的权重，因此新增或调整某维档位数不会破坏维度间的权重平衡。
- 权重合计必须为 `100%`，否则自动归一化。
- 命中第 0 层硬性兜底直升通道的需求直接定级，跳过六维打分。
- 等级阈值默认为 `S >= 85`、`A = 70–84.9`、`B = 50–69.9`、`C < 50`，允许在高级设置中调整；每条评估记录必须保存当时使用的权重表和阈值配置，保证结果可复现。
- 默认排序为等级 → 价值分 → 评估时间。
- 系统结果默认自动计算；如果未来增加人工覆核，必须记录原始结果、调整结果和调整理由。
- 历史评估记录需要保存模型版本和评估时间，保证统计结果可复现。
- 读取旧版本记录时只做保证可渲染的最小修正（补齐缺失维度、把越界分数收敛到新满分），不重算价值分与等级，也不改写 `modelVersion`。

## 技术栈与命令

Vite + React 18 + TypeScript + shadcn/ui（Radix + Tailwind CSS）+ Framer Motion + Vitest。包管理器为 npm。无后端、无数据库、无认证、无环境变量。

```bash
npm install
npm run dev          # 本地开发
npm run test         # vitest run
npm run test:watch   # vitest 监听
npm run build        # tsc -b && vite build
npm run preview
```

数据保存在浏览器 localStorage（`hyperos-rvm-v2:requirements` / `hyperos-rvm-v2:config`），用 CSV 搬运。

## 仓库结构

```text
docs/
├── index.md
├── requirement-value-model-v2.1.md  # 当前评分标准
├── requirement-value-model-v2.md    # 历史存档
├── requirement-value-model-v1.md    # 历史存档
└── superpowers/
    ├── specs/2026-08-12-requirement-priority-website-design.md
    └── plans/2026-08-12-requirement-priority-website.md
src/
├── domain/                          # 评分规则，纯 TS
│   ├── types.ts
│   ├── modelConfig.ts
│   ├── escalation.ts
│   ├── scoring.ts
│   ├── grading.ts
│   ├── validation.ts
│   ├── evaluate.ts
│   ├── csv.ts
│   └── __tests__/
├── store/storage.ts                 # localStorage + 旧记录向后兼容
├── pages/ScoringPage.tsx            # 单条打分
├── pages/ListPage.tsx               # 批量清单
├── components/                      # 业务组件 + ui/
├── App.tsx
└── main.tsx
```

未发现 `scripts/`、`data/` 或独立 API 层。`SettingsPanel` 在 `src/components/`，通过 App 顶部设置 Dialog 打开，不是 `src/pages/` 下的独立页。

## 文档规范

- 需求模型、字段说明和评审规则放在 `docs/` 下，并使用 Markdown。入口为 `docs/index.md`。
- 文档中的公式、档位、等级阈值和字段名称应与网站数据模型保持一致。
- 新增规则时同步补充至少一个正例或反例，避免只有抽象描述。
- 不在文档中虚构尚未验证的业务数据、竞品结论或用户研究结果。
- README、AGENTS、`docs/index.md` 中的项目描述、技术栈和命令使用同一套措辞。

## 开发规范

- 修改评分规则前，先确认 `docs/requirement-value-model-v2.1.md` 已更新并可执行，再同步 `src/domain/`。
- 将评分计算封装为可测试的纯函数，避免把核心规则散落在 UI 组件中。
- UI 只负责输入、解释和展示，不自行复制评分公式或写死档位数。`evaluate` 只编排直升 → 算分 → 判级；`validate` 在表单保存时调用。
- 档位数、锚点文案和维度满分只从 `DIMENSION_META` 读取；新增维度或调整档位时不需要改动 UI 组件。
- 表单应展示每个维度的评分锚点、档位范围、计算结果和证据填写状态。
- 对模型输入做明确校验，阻止缺少主类型或维度分数越界的数据进入计算流程；权重总和不为 `100%` 时按比例自动归一化，并在界面明确提示已归一化。
- 修改公共数据结构或评分规则时，优先同步类型定义、计算逻辑、展示文案和测试。

## 验证要求

- 文档修改后至少检查 Markdown 结构和公式中的档位、权重、阈值是否一致。
- 评分逻辑必须覆盖当前阈值配置下的边界值（默认阈值下为 `0`、`50`、`69.9`、`70`、`84.9`、`85`、`100`）。
- 验证“任一维度打满分的贡献等于其权重”，确保按维度满分归一的公式正确。
- 验证“命中直升通道的需求不受六维打分影响”和“标签数量不改变分数”等核心规则。
- 验证设备与生态赋能的四档边界：`3` 合法、`4` 越界。
- 验证旧 v2.0 记录读取后价值分、等级和 `modelVersion` 未被改写。
- 相同输入必须得到稳定、可复现的分数和等级。
- 修改代码后运行与改动最相关的检查：领域规则用 `npm run test`，涉及类型或构建时再跑 `npm run build`。
- 不为了通过验证修复与当前任务无关的问题。

## Git 约定

- 不主动创建提交或推送，除非用户明确要求。
- 提交前检查 `git status` 和 `git diff --check`。
- 提交信息使用简洁、清晰的 Conventional Commits 风格。
- 不提交密钥、个人数据、构建产物或临时文件。

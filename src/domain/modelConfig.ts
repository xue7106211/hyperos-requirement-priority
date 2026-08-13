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

export const DIMENSION_META: Record<DimensionKey, {
  label: string;
  hint: string;
  caution: string;
  anchors: string[];
}> = {
  strategy: {
    label: "战略与未来确定性",
    hint: "判断需求是否承接 HyperOS 战略、下一代确定性体验或明确产品窗口。",
    caution: "不能仅因描述中出现「下一代」「战略」「高端」等词打高分。",
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
    hint: "判断问题严重度、发生频率、不满意度贡献，以及可能带来的品牌或舆情风险。",
    caution: "「专家认为不好」主要用于提高置信度，不等于用户价值自动升高。",
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
    hint: "判断需求覆盖范围、出现频率，以及是否影响系统的基本美学或交互面貌。",
    caution: "业务方数量只是范围证据，不能直接等价为高分。",
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
    hint: "判断需求能否沉淀为可复用的设计系统能力，并降低未来重复建设成本。",
    caution: "「Token 先行」不是天然高价值，需能形成语义约束或减少重复建设。",
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
    hint: "判断需求是否支撑新机、新形态、多端体验和未来设备能力。",
    caution: "「新机适配」只是标签；只有决定新设备核心体验时才打 3–4 分。",
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
    hint: "判断需求是在补齐关键能力缺口，还是能形成可感知、可持续的领先能力。",
    caution: "友商已有不代表补齐后自动高分；须记录对比范围、版本与日期。",
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

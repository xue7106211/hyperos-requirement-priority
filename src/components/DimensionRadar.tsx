import { DIMENSION_KEYS, type DimensionKey, type DimensionScore } from "@/domain/types";
import { DIMENSION_META } from "@/domain/modelConfig";

const SHORT_LABEL: Record<DimensionKey, string> = {
  strategy: "美学",
  userProblem: "用户",
  systemImpact: "系统",
  leverage: "杠杆",
  deviceEnable: "设备",
  competitive: "竞争",
};

const SIZE = 220;
const CX = 110;
const CY = 110;
const RADIUS = 72;
const RING_COUNT = 4;

function vertex(index: number, ratio: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / DIMENSION_KEYS.length;
  return {
    x: CX + Math.cos(angle) * RADIUS * ratio,
    y: CY + Math.sin(angle) * RADIUS * ratio,
  };
}

function polygonPoints(ratio: number) {
  return DIMENSION_KEYS.map((_, i) => {
    const { x, y } = vertex(i, ratio);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

interface DimensionRadarProps {
  scores: Record<DimensionKey, DimensionScore>;
}

export function DimensionRadar({ scores }: DimensionRadarProps) {
  const shape = DIMENSION_KEYS.map((key, i) => {
    const value = scores[key]?.score ?? 0;
    // 各维度满分不同（设备与生态赋能为 3），按自身满分归一后再取顶点，
    // 保证「该维打满」在雷达上一致落到最外圈。
    const ratio = Math.min(Math.max(value / DIMENSION_META[key].maxScore, 0), 1);
    const { x, y } = vertex(i, ratio);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const summary = DIMENSION_KEYS.map(
    (key) => `${SHORT_LABEL[key]} ${scores[key]?.score ?? 0}`
  ).join("，");

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto block w-full max-w-[220px]"
      role="img"
      aria-label={`六维评分雷达：${summary}`}
    >
      {Array.from({ length: RING_COUNT }, (_, ring) => (
        <polygon
          key={ring}
          points={polygonPoints((ring + 1) / RING_COUNT)}
          className="fill-none stroke-border"
          strokeWidth="1"
        />
      ))}
      {DIMENSION_KEYS.map((_, i) => {
        const end = vertex(i, 1);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={end.x}
            y2={end.y}
            className="stroke-border"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        data-testid="radar-shape"
        points={shape}
        fill="var(--mark)"
        fillOpacity="0.18"
        stroke="var(--mark)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {DIMENSION_KEYS.map((key, i) => {
        const { x, y } = vertex(i, 1.28);
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize="10"
          >
            {SHORT_LABEL[key]}
          </text>
        );
      })}
    </svg>
  );
}

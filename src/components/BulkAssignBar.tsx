import { useMemo, useState } from "react";
import type { DimensionKey, ScoreValue } from "@/domain/types";
import { DIMENSION_KEYS } from "@/domain/types";
import { DIMENSION_META } from "@/domain/modelConfig";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface BulkAssignBarProps {
  onApply: (dim: DimensionKey, score: ScoreValue) => void;
}

export function BulkAssignBar({ onApply }: BulkAssignBarProps) {
  const [dimension, setDimension] = useState<DimensionKey>(DIMENSION_KEYS[0]);
  const [score, setScore] = useState<ScoreValue>(0);

  // 各维度满分不同（设备与生态赋能为 0–3），可选档位随维度变化
  const scoreOptions = useMemo(
    () =>
      Array.from(
        { length: DIMENSION_META[dimension].maxScore + 1 },
        (_, i) => i as ScoreValue
      ),
    [dimension]
  );

  // 切换到档位更少的维度时，把越界的已选分数收敛到新满分
  const handleDimensionChange = (next: DimensionKey) => {
    setDimension(next);
    const max = DIMENSION_META[next].maxScore;
    if (score > max) setScore(max as ScoreValue);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted/70 px-3 py-2">
      <span className="shrink-0 text-xs text-muted-foreground">批量赋值</span>

      <Select
        value={dimension}
        onValueChange={(v) => handleDimensionChange(v as DimensionKey)}
      >
        <SelectTrigger className="h-9 w-[160px] text-sm" aria-label="批量赋值维度">
          <SelectValue placeholder="选择维度" />
        </SelectTrigger>
        <SelectContent>
          {DIMENSION_KEYS.map((k) => (
            <SelectItem key={k} value={k} className="text-sm">
              {DIMENSION_META[k].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(score)}
        onValueChange={(v) => setScore(Number(v) as ScoreValue)}
      >
        <SelectTrigger className="h-9 w-[72px] text-sm tabular-nums" aria-label="批量赋值分数">
          <SelectValue placeholder="分数" />
        </SelectTrigger>
        <SelectContent>
          {scoreOptions.map((s) => (
            <SelectItem key={s} value={String(s)} className="text-sm tabular-nums">
              {s} 分
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button size="sm" variant="default" onClick={() => onApply(dimension, score)}>
        应用到筛选结果
      </Button>
    </div>
  );
}

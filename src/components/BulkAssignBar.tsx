import { useState } from "react";
import type { DimensionKey } from "@/domain/types";
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
  onApply: (dim: DimensionKey, score: 0 | 1 | 2 | 3 | 4) => void;
}

const SCORE_OPTIONS: Array<0 | 1 | 2 | 3 | 4> = [0, 1, 2, 3, 4];

export function BulkAssignBar({ onApply }: BulkAssignBarProps) {
  const [dimension, setDimension] = useState<DimensionKey>(DIMENSION_KEYS[0]);
  const [score, setScore] = useState<0 | 1 | 2 | 3 | 4>(0);

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
      <span className="text-xs text-muted-foreground shrink-0">批量赋值</span>

      <Select
        value={dimension}
        onValueChange={(v) => setDimension(v as DimensionKey)}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="选择维度" />
        </SelectTrigger>
        <SelectContent>
          {DIMENSION_KEYS.map((k) => (
            <SelectItem key={k} value={k} className="text-xs">
              {DIMENSION_META[k].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(score)}
        onValueChange={(v) => setScore(Number(v) as 0 | 1 | 2 | 3 | 4)}
      >
        <SelectTrigger className="w-[72px] h-8 text-xs">
          <SelectValue placeholder="分数" />
        </SelectTrigger>
        <SelectContent>
          {SCORE_OPTIONS.map((s) => (
            <SelectItem key={s} value={String(s)} className="text-xs">
              {s} 分
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="default"
        className="h-8 text-xs"
        onClick={() => onApply(dimension, score)}
      >
        应用到筛选结果
      </Button>
    </div>
  );
}

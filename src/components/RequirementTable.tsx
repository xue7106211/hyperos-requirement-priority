import type { Requirement, Grade, Confidence } from "@/domain/types";
import { GradeBadge } from "@/components/GradeBadge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ─── 排序逻辑 ─── */

const GRADE_ORDER: Record<Grade, number> = { S: 0, A: 1, B: 2, C: 3 };
const CONFIDENCE_ORDER: Record<Confidence, number> = { "高": 0, "中": 1, "低": 2 };

/**
 * 默认排序：等级(S>A>B>C) → 价值分降序(null/直升视为最高) → 置信度(高>中>低) → 评估时间升序
 */
export function sortRequirements(reqs: Requirement[]): Requirement[] {
  return [...reqs].sort((a, b) => {
    // 1. 等级升序 (S=0 < A=1 < B=2 < C=3)
    const gradeA = GRADE_ORDER[a.grade] ?? 4;
    const gradeB = GRADE_ORDER[b.grade] ?? 4;
    if (gradeA !== gradeB) return gradeA - gradeB;

    // 2. 价值分降序，null(直升)视为最高(排前)
    const scoreA = a.valueScore === null ? Infinity : a.valueScore;
    const scoreB = b.valueScore === null ? Infinity : b.valueScore;
    if (scoreA !== scoreB) return scoreB - scoreA; // 降序

    // 3. 置信度 高>中>低
    const confA = CONFIDENCE_ORDER[a.confidence] ?? 3;
    const confB = CONFIDENCE_ORDER[b.confidence] ?? 3;
    if (confA !== confB) return confA - confB;

    // 4. 评估时间升序
    return (a.evaluatedAt || "").localeCompare(b.evaluatedAt || "");
  });
}

/* ─── 组件 ─── */

interface RequirementTableProps {
  requirements: Requirement[];
  onRowClick: (req: Requirement) => void;
}

export function RequirementTable({ requirements, onRowClick }: RequirementTableProps) {
  const sorted = sortRequirements(requirements);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>需求名</TableHead>
          <TableHead className="w-24">主类型</TableHead>
          <TableHead className="w-16">等级</TableHead>
          <TableHead className="w-20">价值分</TableHead>
          <TableHead className="w-16">置信度</TableHead>
          <TableHead className="w-20">状态</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((req, idx) => (
          <TableRow
            key={req.id}
            tabIndex={0}
            aria-label={`查看 ${req.name || "未命名需求"}`}
            className="h-11 cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
            onClick={() => onRowClick(req)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(req);
              }
            }}
          >
            <TableCell className="text-muted-foreground tabular-nums">
              {idx + 1}
            </TableCell>
            <TableCell className="max-w-[16rem] truncate font-medium">
              {req.name || "未命名需求"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {req.mainCategory}
            </TableCell>
            <TableCell>
              <GradeBadge grade={req.grade} />
            </TableCell>
            <TableCell className="tabular-nums">
              {req.valueScore === null ? (
                <span className="text-xs text-muted-foreground">直升</span>
              ) : (
                req.valueScore.toFixed(1)
              )}
            </TableCell>
            <TableCell className="text-xs">{req.confidence}</TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className="rounded-sm text-[10px] font-normal"
              >
                {req.manuallyAdjusted ? "已人工调整" : "仍为预设"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

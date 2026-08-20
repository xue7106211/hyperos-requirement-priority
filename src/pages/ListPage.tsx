import { useCallback, useMemo, useRef, useState } from "react";
import type { DimensionKey, Requirement, ScoreValue } from "@/domain/types";
import { loadRequirements, saveRequirements, loadConfig } from "@/store/storage";
import { evaluate } from "@/domain/evaluate";
import { exportToCsv } from "@/domain/csv";
import { importFromCsv } from "@/domain/csv";
import { FilterBar, EMPTY_FILTERS, type Filters } from "@/components/FilterBar";
import { RequirementTable } from "@/components/RequirementTable";
import { BulkAssignBar } from "@/components/BulkAssignBar";
import { ImportReportDialog } from "@/components/ImportReportDialog";
import { Button } from "@/components/ui/button";

interface ListPageProps {
  onEditRequirement: (req: Requirement) => void;
  onCreateNew: () => void;
}

/**
 * 应用筛选条件，返回符合所有条件的需求子集。
 */
function applyFilters(reqs: Requirement[], filters: Filters): Requirement[] {
  return reqs.filter((req) => {
    if (filters.keyword && !req.name.includes(filters.keyword)) return false;
    if (filters.mainCategory && req.mainCategory !== filters.mainCategory) return false;
    if (filters.grade && req.grade !== filters.grade) return false;
    if (filters.tag && !req.tags?.includes(filters.tag)) return false;
    return true;
  });
}

/**
 * 从所有需求中提取去重标签列表。
 */
function extractTags(reqs: Requirement[]): string[] {
  const set = new Set<string>();
  for (const req of reqs) {
    if (req.tags) {
      for (const tag of req.tags) set.add(tag);
    }
  }
  return [...set].sort();
}

export function ListPage({ onEditRequirement, onCreateNew }: ListPageProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [importReport, setImportReport] = useState<{ success: number; skipped: number; reasons: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从 storage 加载需求（refreshKey 变化时刷新）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allRequirements = useMemo(() => loadRequirements(), [refreshKey]);
  const availableTags = useMemo(() => extractTags(allRequirements), [allRequirements]);
  const filtered = useMemo(
    () => applyFilters(allRequirements, filters),
    [allRequirements, filters]
  );

  /* ─── 批量赋值 ─── */
  const handleBulkApply = useCallback(
    (dim: DimensionKey, score: ScoreValue) => {
      const config = loadConfig();
      const now = new Date().toISOString();
      const all = loadRequirements();
      const filteredIds = new Set(filtered.map((r) => r.id));

      const updated = all.map((req) => {
        if (!filteredIds.has(req.id)) return req;
        // 修改对应维度分数
        const newScores = { ...req.scores, [dim]: { ...req.scores[dim], score } };
        const updatedReq = { ...req, scores: newScores };
        // 重新 evaluate
        const result = evaluate(updatedReq, config, now);
        return {
          ...updatedReq,
          valueScore: result.valueScore,
          grade: result.grade,
          weightsSnapshot: result.weightsSnapshot,
          thresholdsSnapshot: result.thresholdsSnapshot,
          evaluatedAt: now,
          manuallyAdjusted: true,
        };
      });

      saveRequirements(updated);
      setRefreshKey((k) => k + 1);
    },
    [filtered]
  );

  /* ─── CSV 导出 ─── */
  const handleExport = useCallback(() => {
    const csvText = exportToCsv(filtered);
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "requirements.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filtered]);

  /* ─── CSV 导入 ─── */
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { requirements: imported, report } = importFromCsv(text);

      // 合并策略：按 id 去重,导入数据覆盖已有同 id 记录
      const all = loadRequirements();
      const existingMap = new Map(all.map((r) => [r.id, r]));
      let overwritten = 0;

      for (const req of imported) {
        if (existingMap.has(req.id)) {
          overwritten++;
        }
        existingMap.set(req.id, req);
      }

      saveRequirements([...existingMap.values()]);

      // 增强报告：如果有覆盖,加入说明
      const enhancedReasons = [...report.reasons];
      if (overwritten > 0) {
        enhancedReasons.push(`${overwritten} 条已有记录被覆盖（按 ID 去重）`);
      }

      setImportReport({
        success: report.success,
        skipped: report.skipped,
        reasons: enhancedReasons,
      });
      setRefreshKey((k) => k + 1);
    };
    reader.readAsText(file);

    // 重置 input 让同一文件可再次选择
    e.target.value = "";
  }, []);

  const isEmptyPool = allRequirements.length === 0;
  const isEmptyFilter = !isEmptyPool && filtered.length === 0;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-medium tracking-tight">需求清单</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} disabled={isEmptyPool}>
            导出 CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleImportClick}>
            导入 CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="min-w-[3.5rem] text-right text-xs tabular-nums text-muted-foreground">
            {filtered.length} / {allRequirements.length}
          </span>
        </div>
      </div>

      {!isEmptyPool && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          availableTags={availableTags}
        />
      )}

      {isEmptyPool ? (
        <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl bg-muted/50 px-6 py-16 text-center">
          <div
            role="img"
            aria-label="空白评估册示意：高低错落的评分条"
            className="mb-8 flex h-16 w-28 items-end justify-center gap-1.5"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {[28, 52, 36, 64, 20].map((height) => (
              <div
                key={height}
                className="w-3 rounded-full bg-foreground/15"
                style={{ height }}
              />
            ))}
          </div>
          <h3 className="text-xl font-medium tracking-tight text-foreground">
            还没有评估记录
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            从单条打分开始评估，或导入已有 CSV。清单会按等级、价值分和评估时间排序。
          </p>
          <div className="mt-7 flex items-center gap-2">
            <Button size="sm" onClick={onCreateNew}>
              去打分
            </Button>
            <Button size="sm" variant="outline" onClick={handleImportClick}>
              导入 CSV
            </Button>
          </div>
        </div>
      ) : isEmptyFilter ? (
        <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl bg-muted/50 px-6 py-16 text-center">
          <h3 className="text-xl font-medium tracking-tight text-foreground">
            没有符合筛选条件的需求
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            试试去掉关键词或筛选条件，当前筛选结果为空。
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-7"
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            清除筛选
          </Button>
        </div>
      ) : (
        <>
          <BulkAssignBar onApply={handleBulkApply} />
          <RequirementTable
            requirements={filtered}
            onRowClick={onEditRequirement}
          />
        </>
      )}

      {importReport && (
        <ImportReportDialog
          open={true}
          onClose={() => setImportReport(null)}
          report={importReport}
        />
      )}
    </div>
  );
}

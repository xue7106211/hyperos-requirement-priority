import { useCallback, useMemo, useRef, useState } from "react";
import type { DimensionKey, Requirement } from "@/domain/types";
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
}

/**
 * 应用筛选条件，返回符合所有条件的需求子集。
 */
function applyFilters(reqs: Requirement[], filters: Filters): Requirement[] {
  return reqs.filter((req) => {
    if (filters.keyword && !req.name.includes(filters.keyword)) return false;
    if (filters.mainCategory && req.mainCategory !== filters.mainCategory) return false;
    if (filters.grade && req.grade !== filters.grade) return false;
    if (filters.confidence && req.confidence !== filters.confidence) return false;
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

export function ListPage({ onEditRequirement }: ListPageProps) {
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
    (dim: DimensionKey, score: 0 | 1 | 2 | 3 | 4) => {
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

  /* ─── 重置为预设(清除 manuallyAdjusted 标记) ─── */
  const handleReset = useCallback(() => {
    const all = loadRequirements();
    const filteredIds = new Set(filtered.map((r) => r.id));
    const updated = all.map((req) => {
      if (!filteredIds.has(req.id)) return req;
      const { manuallyAdjusted: _, ...rest } = req;
      return rest as Requirement;
    });
    saveRequirements(updated);
    setRefreshKey((k) => k + 1);
  }, [filtered]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">需求清单</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExport}>
            导出 CSV
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleImportClick}>
            导入 CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            {filtered.length} / {allRequirements.length}
          </span>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        availableTags={availableTags}
      />

      <BulkAssignBar onApply={handleBulkApply} onReset={handleReset} />

      <RequirementTable
        requirements={filtered}
        onRowClick={onEditRequirement}
      />

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

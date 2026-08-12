import { useMemo, useState } from "react";
import type { Requirement } from "@/domain/types";
import { loadRequirements } from "@/store/storage";
import { FilterBar, EMPTY_FILTERS, type Filters } from "@/components/FilterBar";
import { RequirementTable } from "@/components/RequirementTable";

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

  // 从 storage 加载需求（每次渲染都刷新，简单场景足够）
  const allRequirements = useMemo(() => loadRequirements(), []);
  const availableTags = useMemo(() => extractTags(allRequirements), [allRequirements]);
  const filtered = useMemo(
    () => applyFilters(allRequirements, filters),
    [allRequirements, filters]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">需求清单</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {filtered.length} / {allRequirements.length}
        </span>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        availableTags={availableTags}
      />

      <RequirementTable
        requirements={filtered}
        onRowClick={onEditRequirement}
      />
    </div>
  );
}

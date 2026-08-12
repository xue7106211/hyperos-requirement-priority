import type { Grade, MainCategory, Confidence } from "@/domain/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─── Filters 类型 ─── */

export interface Filters {
  keyword: string;
  mainCategory: MainCategory | "";
  grade: Grade | "";
  confidence: Confidence | "";
  tag: string;
}

export const EMPTY_FILTERS: Filters = {
  keyword: "",
  mainCategory: "",
  grade: "",
  confidence: "",
  tag: "",
};

/* ─── 组件 ─── */

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  availableTags?: string[];
}

export function FilterBar({ filters, onChange, availableTags = [] }: FilterBarProps) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 关键词搜索 */}
      <Input
        placeholder="搜索需求名..."
        value={filters.keyword}
        onChange={(e) => update({ keyword: e.target.value })}
        className="w-48 rounded-sm"
      />

      {/* 主类型 */}
      <Select
        value={filters.mainCategory || "__all__"}
        onValueChange={(v) => update({ mainCategory: v === "__all__" ? "" : v as MainCategory })}
      >
        <SelectTrigger className="w-28 rounded-sm">
          <SelectValue placeholder="主类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">全部类型</SelectItem>
          <SelectItem value="平台基建">平台基建</SelectItem>
          <SelectItem value="适配建设">适配建设</SelectItem>
          <SelectItem value="体验优化">体验优化</SelectItem>
        </SelectContent>
      </Select>

      {/* 等级 */}
      <Select
        value={filters.grade || "__all__"}
        onValueChange={(v) => update({ grade: v === "__all__" ? "" : v as Grade })}
      >
        <SelectTrigger className="w-24 rounded-sm">
          <SelectValue placeholder="等级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">全部等级</SelectItem>
          <SelectItem value="S">S</SelectItem>
          <SelectItem value="A">A</SelectItem>
          <SelectItem value="B">B</SelectItem>
          <SelectItem value="C">C</SelectItem>
        </SelectContent>
      </Select>

      {/* 置信度 */}
      <Select
        value={filters.confidence || "__all__"}
        onValueChange={(v) => update({ confidence: v === "__all__" ? "" : v as Confidence })}
      >
        <SelectTrigger className="w-24 rounded-sm">
          <SelectValue placeholder="置信度" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">全部</SelectItem>
          <SelectItem value="高">高</SelectItem>
          <SelectItem value="中">中</SelectItem>
          <SelectItem value="低">低</SelectItem>
        </SelectContent>
      </Select>

      {/* 标签 */}
      {availableTags.length > 0 && (
        <Select
          value={filters.tag || "__all__"}
          onValueChange={(v) => update({ tag: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="w-28 rounded-sm">
            <SelectValue placeholder="标签" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部标签</SelectItem>
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

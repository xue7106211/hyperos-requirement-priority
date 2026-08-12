import type { Requirement, ModelConfig } from "@/domain/types";
import { loadRequirements, saveRequirements } from "@/store/storage";
import { RequirementForm } from "@/components/RequirementForm";

interface ScoringPageProps {
  /** 当前模型配置(由 App 级 state 传入,保证跨页同步) */
  config: ModelConfig;
  /** 待复核/编辑的需求(Task13 列表点行传入);undefined 为新建 */
  initial?: Requirement;
  /** 保存后回调(用于路由跳转等) */
  onSaved?: (req: Requirement) => void;
}

export function ScoringPage({ config, initial, onSaved }: ScoringPageProps) {

  const handleSave = (req: Requirement) => {
    const existing = loadRequirements();
    const idx = existing.findIndex((r) => r.id === req.id);
    if (idx >= 0) {
      existing[idx] = req;
    } else {
      existing.push(req);
    }
    saveRequirements(existing);
    onSaved?.(req);
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-lg font-semibold text-neutral-900 tracking-tight mb-8">
        需求价值评估
      </h1>
      <RequirementForm initial={initial} config={config} onSave={handleSave} />
    </main>
  );
}

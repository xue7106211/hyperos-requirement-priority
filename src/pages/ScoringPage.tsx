import { Info } from "lucide-react";
import type { Requirement, ModelConfig } from "@/domain/types";
import { loadRequirements, saveRequirements } from "@/store/storage";
import { RequirementForm } from "@/components/RequirementForm";

interface ScoringPageProps {
  config: ModelConfig;
  initial?: Requirement;
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
    <main>
      <div
        role="note"
        className="mb-8 flex max-w-[40rem] gap-3 rounded-2xl bg-muted px-4 py-3.5"
      >
        <Info
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          填写需求信息与六维评分，右侧即时给出价值等级。命中第 0 层直升条件时跳过打分，直接定级。
        </p>
      </div>
      <RequirementForm initial={initial} config={config} onSave={handleSave} />
    </main>
  );
}

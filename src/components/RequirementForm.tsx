import { useState, useMemo, useCallback } from "react";
import type {
  Requirement,
  ModelConfig,
  MainCategory,
  DimensionKey,
  DimensionScore,
  EscalationTrigger,
  Confidence,
} from "@/domain/types";
import { DIMENSION_KEYS } from "@/domain/types";
import { DIMENSION_META, ESCALATION_META, MODEL_VERSION } from "@/domain/modelConfig";
import { evaluate } from "@/domain/evaluate";
import { validate } from "@/domain/validation";
import { ScoreSelector } from "@/components/ScoreSelector";
import { LiveResultPanel } from "@/components/LiveResultPanel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAIN_CATEGORIES: MainCategory[] = ["平台基建", "适配建设", "体验优化"];

const ESCALATION_OPTIONS: { value: EscalationTrigger; label: string }[] = [
  { value: null, label: "未命中" },
  ...Object.entries(ESCALATION_META).map(([key, meta]) => ({
    value: key as Exclude<EscalationTrigger, null>,
    label: meta.label,
  })),
];

const CONFIDENCE_OPTIONS: Confidence[] = ["高", "中", "低"];

function createEmptyScores(): Record<DimensionKey, DimensionScore> {
  const scores = {} as Record<DimensionKey, DimensionScore>;
  for (const k of DIMENSION_KEYS) {
    scores[k] = { score: 0, reason: "" };
  }
  return scores;
}

function createDefaultDraft(): Requirement {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    problemStatement: "",
    mainCategory: "体验优化",
    tags: [],
    targetUserScenario: "",
    expectedCapability: "",
    affectedScope: "",
    frequency: "",
    strategyWindow: "",
    businessRequesterCount: 0,
    evidence: "",
    competitiveEvidence: "",
    escalationTrigger: null,
    scores: createEmptyScores(),
    confidence: "中",
    valueScore: null,
    grade: "C",
    modelVersion: MODEL_VERSION,
    weightsSnapshot: {} as Requirement["weightsSnapshot"],
    thresholdsSnapshot: {} as Requirement["thresholdsSnapshot"],
    evaluatedAt: "",
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RequirementFormProps {
  initial: Requirement | undefined;
  config: ModelConfig;
  onSave: (req: Requirement) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RequirementForm({ initial, config, onSave }: RequirementFormProps) {
  const [draft, setDraft] = useState<Requirement>(() =>
    initial ? { ...initial } : createDefaultDraft()
  );
  const [warningDialog, setWarningDialog] = useState<string[] | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // ─── 实时计算 ───────────────────────────────────────────────────────────────
  const result = useMemo(
    () => evaluate(draft, config, new Date().toISOString()),
    [draft, config]
  );

  // ─── Updaters ───────────────────────────────────────────────────────────────
  const updateField = useCallback(<K extends keyof Requirement>(key: K, value: Requirement[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrorMessages([]);
  }, []);

  const updateScore = useCallback((dim: DimensionKey, score: DimensionScore["score"]) => {
    setDraft((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [dim]: { ...prev.scores[dim], score },
      },
    }));
    setErrorMessages([]);
  }, []);

  const updateReason = useCallback((dim: DimensionKey, reason: string) => {
    setDraft((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [dim]: { ...prev.scores[dim], reason },
      },
    }));
  }, []);

  // ─── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const now = new Date().toISOString();
    const finalReq: Requirement = {
      ...draft,
      valueScore: result.valueScore,
      grade: result.grade,
      modelVersion: MODEL_VERSION,
      weightsSnapshot: result.weightsSnapshot,
      thresholdsSnapshot: result.thresholdsSnapshot,
      evaluatedAt: now,
    };
    const vResult = validate(finalReq);
    if (!vResult.ok) {
      setErrorMessages(vResult.errors);
      return;
    }
    if (vResult.warnings.length > 0) {
      setWarningDialog(vResult.warnings);
      return;
    }
    onSave(finalReq);
  }, [draft, result, onSave]);

  const confirmSave = useCallback(() => {
    const now = new Date().toISOString();
    const finalReq: Requirement = {
      ...draft,
      valueScore: result.valueScore,
      grade: result.grade,
      modelVersion: MODEL_VERSION,
      weightsSnapshot: result.weightsSnapshot,
      thresholdsSnapshot: result.thresholdsSnapshot,
      evaluatedAt: now,
    };
    setWarningDialog(null);
    onSave(finalReq);
  }, [draft, result, onSave]);

  const isEscalated = draft.escalationTrigger !== null;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      {/* Left: Form */}
      <div className="space-y-8">
        {/* ── 基础信息 ───────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-neutral-500 tracking-wide">
            基础信息
          </h2>
          <div className="space-y-3">
            <div>
              <Label htmlFor="req-name" className="text-xs text-neutral-600">
                需求名称
              </Label>
              <Input
                id="req-name"
                value={draft.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="简明描述需求"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="req-category" className="text-xs text-neutral-600">
                主类型
              </Label>
              <Select
                value={draft.mainCategory}
                onValueChange={(v) => updateField("mainCategory", v as MainCategory)}
              >
                <SelectTrigger id="req-category" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAIN_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="req-tags" className="text-xs text-neutral-600">
                二级标签
              </Label>
              <Input
                id="req-tags"
                value={draft.tags.join(", ")}
                onChange={(e) =>
                  updateField(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="逗号分隔"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="req-confidence" className="text-xs text-neutral-600">
                置信度
              </Label>
              <Select
                value={draft.confidence}
                onValueChange={(v) => updateField("confidence", v as Confidence)}
              >
                <SelectTrigger id="req-confidence" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* ── 第 0 层 直升 ──────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500 tracking-wide">
            第 0 层 · 直升判定
          </h2>
          <div className="space-y-2" role="radiogroup" aria-label="直升条件">
            {ESCALATION_OPTIONS.map((opt) => {
              const isSelected =
                opt.value === draft.escalationTrigger;
              const inputId = `esc-${opt.value ?? "none"}`;
              return (
                <label
                  key={opt.value ?? "none"}
                  htmlFor={inputId}
                  className={cn(
                    "flex items-center gap-3 rounded-sm border px-3 py-2 text-sm cursor-pointer transition-colors",
                    isSelected
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name="escalation"
                    checked={isSelected}
                    onChange={() => updateField("escalationTrigger", opt.value)}
                    className="accent-neutral-900"
                    aria-label={opt.label}
                  />
                  <span className="text-neutral-700">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* ── 六维打分 ─────────────────────────────────────────────────── */}
        <section
          className={cn(
            "space-y-6 transition-opacity",
            isEscalated && "opacity-50 pointer-events-none"
          )}
          data-testid="dimension-section"
        >
          <h2 className="text-sm font-medium text-neutral-500 tracking-wide">
            六维评分
          </h2>
          {DIMENSION_KEYS.map((dim) => (
            <div key={dim} className="space-y-2">
              <Label className="text-xs font-medium text-neutral-700">
                {DIMENSION_META[dim].label}
              </Label>
              <ScoreSelector
                value={draft.scores[dim].score}
                onChange={(v) => updateScore(dim, v)}
                anchors={DIMENSION_META[dim].anchors}
              />
              <Textarea
                value={draft.scores[dim].reason}
                onChange={(e) => updateReason(dim, e.target.value)}
                placeholder="评分理由（选填）"
                className="mt-1 min-h-[56px] resize-none text-sm"
              />
            </div>
          ))}
        </section>

        {/* ── 错误提示 ─────────────────────────────────────────────────── */}
        {errorMessages.length > 0 && (
          <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-1">
            {errorMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        )}

        {/* ── 保存按钮 ─────────────────────────────────────────────────── */}
        <div className="pt-2">
          <Button onClick={handleSave} className="rounded-sm">
            保存评估
          </Button>
        </div>
      </div>

      {/* Right: Live Panel */}
      <LiveResultPanel
        result={result}
        scores={draft.scores}
        weights={config.weights}
        escalationTrigger={draft.escalationTrigger}
        confidence={draft.confidence}
      />

      {/* Warning dialog */}
      <Dialog
        open={warningDialog !== null}
        onOpenChange={(open) => { if (!open) setWarningDialog(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认保存</DialogTitle>
            <DialogDescription>
              以下提醒不影响保存，确认继续？
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm text-neutral-600 pl-4 list-disc">
            {warningDialog?.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWarningDialog(null)}
              className="rounded-sm"
            >
              取消
            </Button>
            <Button onClick={confirmSave} className="rounded-sm">
              仍然保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

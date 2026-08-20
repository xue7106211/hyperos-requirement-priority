import { useState, useMemo, useCallback } from "react";
import type {
  Requirement,
  ModelConfig,
  MainCategory,
  DimensionKey,
  DimensionScore,
  EscalationTrigger,
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
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_340px]">
      {/* Left: Form */}
      <div className="space-y-8">
        {/* ── 基础信息 ───────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground">
            基础信息
          </h2>
          <div className="space-y-3">
            <div>
              <Label htmlFor="req-name" className="text-xs text-muted-foreground">
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
              <Label htmlFor="req-category" className="text-xs text-muted-foreground">
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
              <Label htmlFor="req-tags" className="text-xs text-muted-foreground">
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
                placeholder="逗号分隔，例如 Token、折叠屏"
                className="mt-1"
              />
            </div>
          </div>
        </section>

        {/* ── 六维打分 ─────────────────────────────────────────────────── */}
        <section
          className={cn(
            "space-y-6 transition-opacity",
            isEscalated && "pointer-events-none opacity-50"
          )}
          data-testid="dimension-section"
          aria-disabled={isEscalated}
        >
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground">
            六维评分
          </h2>
          {DIMENSION_KEYS.map((dim) => {
            const meta = DIMENSION_META[dim];
            const score = draft.scores[dim].score;
            const hintId = `dim-hint-${dim}`;
            return (
              <div key={dim} className="space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-[12rem] flex-1">
                    <Label className="text-sm font-medium text-foreground">
                      {meta.label}
                    </Label>
                    <p
                      id={hintId}
                      className="mt-1 max-w-[36rem] text-xs leading-relaxed text-muted-foreground text-pretty"
                    >
                      {meta.hint}
                    </p>
                  </div>
                  <ScoreSelector
                    value={score}
                    onChange={(v) => updateScore(dim, v)}
                    anchors={meta.anchors}
                  />
                </div>
                <p className="text-sm leading-relaxed text-foreground/85" aria-live="polite">
                  <span className="font-medium tabular-nums">{score}</span>
                  <span className="text-muted-foreground"> 分 · </span>
                  {meta.anchors[score]}
                </p>
                <details className="group text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none tracking-wide transition-colors duration-150 ease-out hover:text-foreground">
                    查看 0–{meta.maxScore} 分标准
                  </summary>
                  <ol className="mt-2 space-y-1 border-l border-border pl-3">
                    {meta.anchors.map((anchor, i) => (
                      <li
                        key={anchor}
                        className={cn(
                          "leading-relaxed",
                          i === score ? "text-foreground" : "text-muted-foreground/80"
                        )}
                      >
                        <span className="mr-2 inline-block w-3 tabular-nums">{i}</span>
                        {anchor}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 leading-relaxed text-pretty">{meta.caution}</p>
                </details>
                <Textarea
                  value={draft.scores[dim].reason}
                  onChange={(e) => updateReason(dim, e.target.value)}
                  placeholder="评分理由（选填）"
                  className="min-h-[56px] resize-none text-sm"
                  aria-describedby={hintId}
                />
              </div>
            );
          })}
        </section>

        {/* ── 第 0 层 直升 ──────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground">
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
                    "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-[background-color,box-shadow] duration-150 ease-out",
                    isSelected
                      ? "bg-muted text-foreground shadow-inset"
                      : "hover:bg-muted/60"
                  )}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name="escalation"
                    checked={isSelected}
                    onChange={() => updateField("escalationTrigger", opt.value)}
                    className="accent-foreground"
                    aria-label={opt.label}
                  />
                  <span className="text-foreground/80">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* ── 错误提示 ─────────────────────────────────────────────────── */}
        {errorMessages.length > 0 && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 space-y-1">
            {errorMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        )}

        {/* ── 保存按钮 ─────────────────────────────────────────────────── */}
        <div className="pt-2">
          <Button onClick={handleSave}>
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
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {warningDialog?.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWarningDialog(null)}
            >
              取消
            </Button>
            <Button onClick={confirmSave}>
              仍然保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

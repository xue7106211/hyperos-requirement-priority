import type { ModelConfig, DimensionKey } from "@/domain/types";
import { DIMENSION_KEYS } from "@/domain/types";
import { DIMENSION_META, DEFAULT_CONFIG } from "@/domain/modelConfig";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SettingsPanelProps {
  config: ModelConfig;
  onChange: (config: ModelConfig) => void;
}

export function SettingsPanel({ config, onChange }: SettingsPanelProps) {
  const weightSum = DIMENSION_KEYS.reduce((sum, k) => sum + config.weights[k], 0);
  const needsNormalization = Math.abs(weightSum - 100) >= 1e-9;

  function handleWeightChange(key: DimensionKey, value: number) {
    onChange({
      ...config,
      weights: { ...config.weights, [key]: value },
    });
  }

  function handleThresholdChange(grade: "S" | "A" | "B", value: number) {
    onChange({
      ...config,
      thresholds: { ...config.thresholds, [grade]: value },
    });
  }

  function handleResetDefault() {
    onChange(DEFAULT_CONFIG);
  }

  return (
    <div className="space-y-6">
      {/* 权重设置 */}
      <section className="space-y-3">
        <h3 className="text-base font-medium text-foreground">维度权重</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DIMENSION_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Label
                htmlFor={`weight-${key}`}
                className="w-32 shrink-0 text-xs text-foreground/80"
              >
                {DIMENSION_META[key].label}
              </Label>
              <Input
                id={`weight-${key}`}
                type="number"
                min={0}
                max={100}
                step={1}
                value={config.weights[key]}
                onChange={(e) =>
                  handleWeightChange(key, Number(e.target.value) || 0)
                }
                className="h-9 w-20 tabular-nums"
              />
            </div>
          ))}
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          合计：{Math.round(weightSum * 100) / 100}
          {needsNormalization && (
            <span className="ml-2 text-foreground">
              （将按比例归一化）
            </span>
          )}
        </p>
      </section>

      {/* 阈值设置 */}
      <section className="space-y-3">
        <h3 className="text-base font-medium text-foreground">等级阈值</h3>
        <div className="flex flex-wrap gap-4">
          {(["S", "A", "B"] as const).map((grade) => (
            <div key={grade} className="flex items-center gap-2">
              <Label
                htmlFor={`threshold-${grade}`}
                className="text-xs text-foreground/80"
              >
                {grade} 级 ≥
              </Label>
              <Input
                id={`threshold-${grade}`}
                type="number"
                min={0}
                max={100}
                step={1}
                value={config.thresholds[grade]}
                onChange={(e) =>
                  handleThresholdChange(grade, Number(e.target.value) || 0)
                }
                className="h-9 w-20 tabular-nums"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 恢复默认 */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetDefault}
        >
          恢复默认
        </Button>
      </div>
    </div>
  );
}

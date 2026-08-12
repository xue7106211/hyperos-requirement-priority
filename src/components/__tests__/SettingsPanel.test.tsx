import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsPanel } from "@/components/SettingsPanel";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";

describe("SettingsPanel", () => {
  it("显示权重合计", () => {
    render(<SettingsPanel config={DEFAULT_CONFIG} onChange={() => {}} />);
    expect(screen.getByText(/合计/)).toBeInTheDocument();
  });

  it("恢复默认触发 onChange 为默认配置", () => {
    const fn = vi.fn();
    render(
      <SettingsPanel
        config={{ ...DEFAULT_CONFIG, thresholds: { S: 80, A: 60, B: 40 } }}
        onChange={fn}
      />
    );
    fireEvent.click(screen.getByText("恢复默认"));
    expect(fn).toHaveBeenCalledWith(DEFAULT_CONFIG);
  });
});

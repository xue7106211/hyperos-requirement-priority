import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DimensionRadar } from "@/components/DimensionRadar";
import type { DimensionKey, DimensionScore } from "@/domain/types";
import { DIMENSION_KEYS } from "@/domain/types";

function scores(n: 0 | 1 | 2 | 3 | 4): Record<DimensionKey, DimensionScore> {
  const out = {} as Record<DimensionKey, DimensionScore>;
  for (const key of DIMENSION_KEYS) {
    out[key] = { score: n, reason: "" };
  }
  return out;
}

describe("DimensionRadar", () => {
  it("全 0 分时数据多边形收在中心", () => {
    render(<DimensionRadar scores={scores(0)} />);
    const shape = screen.getByTestId("radar-shape");
    expect(shape.getAttribute("points")).toContain("110.0,110.0");
  });

  it("全 4 分时数据多边形到达最外圈", () => {
    render(<DimensionRadar scores={scores(4)} />);
    const shape = screen.getByTestId("radar-shape");
    expect(shape.getAttribute("points")).toContain("110.0,38.0");
  });
});

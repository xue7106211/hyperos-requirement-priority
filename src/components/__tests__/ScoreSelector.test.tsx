import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoreSelector } from "@/components/ScoreSelector";

describe("ScoreSelector", () => {
  it("渲染 5 个档位按钮", () => {
    render(<ScoreSelector value={2} onChange={()=>{}} anchors={["0","1","2","3","4"]} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });
  it("点击某档触发 onChange 对应值", () => {
    const fn = vi.fn();
    render(<ScoreSelector value={0} onChange={fn} anchors={["0","1","2","3","4"]} />);
    fireEvent.click(screen.getByText("3"));
    expect(fn).toHaveBeenCalledWith(3);
  });
});

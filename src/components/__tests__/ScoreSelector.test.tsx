import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoreSelector } from "@/components/ScoreSelector";

describe("ScoreSelector", () => {
  it("五档锚点渲染 5 个档位按钮", () => {
    render(<ScoreSelector value={2} onChange={()=>{}} anchors={["0","1","2","3","4"]} />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });
  it("四档锚点只渲染 4 个档位按钮，且没有 4", () => {
    render(<ScoreSelector value={2} onChange={()=>{}} anchors={["0","1","2","3"]} />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.queryByText("4")).not.toBeInTheDocument();
  });
  it("点击某档触发 onChange 对应值", () => {
    const fn = vi.fn();
    render(<ScoreSelector value={0} onChange={fn} anchors={["0","1","2","3","4"]} />);
    fireEvent.click(screen.getByText("3"));
    expect(fn).toHaveBeenCalledWith(3);
  });
});

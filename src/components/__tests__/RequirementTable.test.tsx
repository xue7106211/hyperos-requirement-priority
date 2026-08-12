import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { RequirementTable } from "@/components/RequirementTable";

const rows = [
  { id:"1", name:"低分需求", mainCategory:"体验优化", grade:"C", valueScore:40, confidence:"低", escalationTrigger:null, evaluatedAt:"2026-01-01" },
  { id:"2", name:"直升需求", mainCategory:"平台基建", grade:"S", valueScore:null, confidence:"高", escalationTrigger:"legal", evaluatedAt:"2026-01-02" },
] as any;

describe("RequirementTable", () => {
  it("按等级排序：S 行在 C 行之前", () => {
    render(<RequirementTable requirements={rows} onRowClick={()=>{}} />);
    const trs = screen.getAllByRole("row").slice(1); // 去表头
    expect(within(trs[0]).getByText("直升需求")).toBeInTheDocument();
  });
  it("直升需求价值分列显示「直升」", () => {
    render(<RequirementTable requirements={rows} onRowClick={()=>{}} />);
    const trs = screen.getAllByRole("row").slice(1);
    // 第一行是 S 级直升需求，价值分列(第5列)应显示"直升"
    const cells = within(trs[0]).getAllByRole("cell");
    expect(cells[4]).toHaveTextContent("直升");
  });
});

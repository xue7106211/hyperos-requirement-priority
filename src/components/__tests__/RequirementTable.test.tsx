import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { RequirementTable, sortRequirements } from "@/components/RequirementTable";

const rows = [
  { id:"1", name:"低分需求", mainCategory:"体验优化", grade:"C", valueScore:40, escalationTrigger:null, evaluatedAt:"2026-01-01" },
  { id:"2", name:"直升需求", mainCategory:"平台基建", grade:"S", valueScore:null, escalationTrigger:"legal", evaluatedAt:"2026-01-02" },
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
    // 列顺序：# / 需求名 / 主类型 / 等级 / 价值分 / 状态
    const cells = within(trs[0]).getAllByRole("cell");
    expect(cells[4]).toHaveTextContent("直升");
  });
  it("不再有置信度列", () => {
    render(<RequirementTable requirements={rows} onRowClick={()=>{}} />);
    expect(screen.queryByText("置信度")).not.toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(6);
  });
});

describe("sortRequirements", () => {
  it("同等级同分时按评估时间升序", () => {
    const same = [
      { id:"late", grade:"A", valueScore:70, evaluatedAt:"2026-02-01" },
      { id:"early", grade:"A", valueScore:70, evaluatedAt:"2026-01-01" },
    ] as any;
    expect(sortRequirements(same).map((r) => r.id)).toEqual(["early", "late"]);
  });
  it("同等级下价值分高者在前，直升（null）排最前", () => {
    const mixed = [
      { id:"low", grade:"S", valueScore:86, evaluatedAt:"2026-01-01" },
      { id:"escalated", grade:"S", valueScore:null, evaluatedAt:"2026-01-03" },
      { id:"high", grade:"S", valueScore:95, evaluatedAt:"2026-01-02" },
    ] as any;
    expect(sortRequirements(mixed).map((r) => r.id)).toEqual(["escalated", "high", "low"]);
  });
});

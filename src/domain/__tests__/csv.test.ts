import { describe, it, expect } from "vitest";
import { exportToCsv, importFromCsv } from "@/domain/csv";
import type { Requirement, DimensionScore, DimensionKey } from "@/domain/types";

const mk = (n:0|1|2|3|4): DimensionScore => ({ score:n, reason:"r" });
function req(id:string): Requirement {
  const s = { strategy:mk(3),userProblem:mk(2),systemImpact:mk(4),leverage:mk(3),deviceEnable:mk(1),competitive:mk(2) } as Record<DimensionKey,DimensionScore>;
  return { id,name:"需求"+id,description:"d",problemStatement:"p",mainCategory:"平台基建",tags:["折叠屏"],
    targetUserScenario:"",expectedCapability:"",affectedScope:"",frequency:"",strategyWindow:"",businessRequesterCount:1,
    evidence:"",competitiveEvidence:"",escalationTrigger:null,scores:s,confidence:"中",valueScore:78.5,grade:"A",
    modelVersion:"v2.0",weightsSnapshot:{strategy:23,userProblem:17,systemImpact:20,leverage:18,deviceEnable:12,competitive:10},
    thresholdsSnapshot:{S:85,A:70,B:50},evaluatedAt:"2026-08-12" };
}

describe("csv 往返", () => {
  it("导出含 BOM 且首行为表头", () => {
    const csv = exportToCsv([req("1")]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(csv).toContain("需求名称");
  });
  it("导出再导入可还原关键字段", () => {
    const csv = exportToCsv([req("1"), req("2")]);
    const { requirements, report } = importFromCsv(csv);
    expect(report.success).toBe(2);
    expect(requirements[0].name).toBe("需求1");
    expect(requirements[0].scores.systemImpact.score).toBe(4);
  });
  it("脏行被跳过并记录原因，不影响合法行", () => {
    const csv = exportToCsv([req("1")]) + "\n坏数据,,,,\n";
    const { requirements, report } = importFromCsv(csv);
    expect(report.success).toBe(1);
    expect(report.skipped).toBeGreaterThan(0);
    expect(report.reasons.length).toBeGreaterThan(0);
  });
});

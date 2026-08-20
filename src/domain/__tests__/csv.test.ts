import { describe, it, expect } from "vitest";
import { exportToCsv, importFromCsv } from "@/domain/csv";
import type { Requirement, DimensionScore, DimensionKey, ScoreValue } from "@/domain/types";

const mk = (n: ScoreValue): DimensionScore => ({ score:n, reason:"r" });
function req(id:string): Requirement {
  const s = { strategy:mk(3),userProblem:mk(2),systemImpact:mk(4),leverage:mk(3),deviceEnable:mk(1),competitive:mk(2) } as Record<DimensionKey,DimensionScore>;
  return { id,name:"需求"+id,description:"d",problemStatement:"p",mainCategory:"平台基建",tags:["折叠屏"],
    targetUserScenario:"",expectedCapability:"",affectedScope:"",frequency:"",strategyWindow:"",businessRequesterCount:1,
    evidence:"",competitiveEvidence:"",escalationTrigger:null,scores:s,valueScore:78.5,grade:"A",
    modelVersion:"HyperOS Requirement Value Model v2.1",
    weightsSnapshot:{strategy:23,userProblem:17,systemImpact:20,leverage:18,deviceEnable:12,competitive:10},
    thresholdsSnapshot:{S:85,A:70,B:50},evaluatedAt:"2026-08-12" };
}

describe("csv 往返", () => {
  it("导出含 BOM 且首行为表头", () => {
    const csv = exportToCsv([req("1")]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(csv).toContain("需求名称");
  });
  it("表头包含承接 OS 美学战略，且不再包含置信度", () => {
    const header = exportToCsv([req("1")]).split("\n")[0];
    expect(header).toContain("承接 OS 美学战略-分数");
    expect(header).not.toContain("置信度");
  });
  it("导出再导入可还原关键字段", () => {
    const csv = exportToCsv([req("1"), req("2")]);
    const { requirements, report } = importFromCsv(csv);
    expect(report.success).toBe(2);
    expect(requirements[0].name).toBe("需求1");
    expect(requirements[0].scores.systemImpact.score).toBe(4);
    expect(requirements[0].scores.deviceEnable.score).toBe(1);
  });
  it("设备与生态赋能超过四档上限的行被跳过", () => {
    const bad = req("1");
    (bad.scores.deviceEnable as any).score = 4; // v2.0 遗留取值
    const { requirements, report } = importFromCsv(exportToCsv([bad]));
    expect(requirements).toHaveLength(0);
    expect(report.skipped).toBe(1);
    expect(report.reasons[0]).toContain("0-3");
  });
  it("脏行被跳过并记录原因，不影响合法行", () => {
    const csv = exportToCsv([req("1")]) + "\n坏数据,,,,\n";
    const { requirements: _reqs, report } = importFromCsv(csv);
    expect(report.success).toBe(1);
    expect(report.skipped).toBeGreaterThan(0);
    expect(report.reasons.length).toBeGreaterThan(0);
    expect(_reqs).toHaveLength(1);
  });
});

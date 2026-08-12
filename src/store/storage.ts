import type { Requirement, ModelConfig } from "@/domain/types";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";

const REQ_KEY = "hyperos-rvm-v2:requirements";
const CFG_KEY = "hyperos-rvm-v2:config";

export function loadRequirements(): Requirement[] {
  const raw = localStorage.getItem(REQ_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Requirement[]; } catch { return []; }
}
export function saveRequirements(reqs: Requirement[]): void {
  localStorage.setItem(REQ_KEY, JSON.stringify(reqs));
}
export function loadConfig(): ModelConfig {
  const raw = localStorage.getItem(CFG_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try { return JSON.parse(raw) as ModelConfig; } catch { return DEFAULT_CONFIG; }
}
export function saveConfig(c: ModelConfig): void {
  localStorage.setItem(CFG_KEY, JSON.stringify(c));
}

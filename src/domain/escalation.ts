import type { EscalationTrigger, Grade } from "./types";
import { ESCALATION_META } from "./modelConfig";

export function checkEscalation(trigger: EscalationTrigger): Grade | null {
  if (trigger === null) return null;
  return ESCALATION_META[trigger].grade;
}

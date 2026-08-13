import { useEffect, useState } from "react";

const INTRO_KEY = "hyperos-rvm-intro";

/** 同一会话内只播一次刊头进场。新会话再播。 */
export function useSessionIntro(): boolean {
  const [skipIntro] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (skipIntro) return;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
  }, [skipIntro]);

  return skipIntro;
}

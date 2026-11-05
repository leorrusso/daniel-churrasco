import { willingnessContribution } from "./willingness.ts";

export type ArgumentChoice = "nao" | "sim";

export type CountState = {
  committed: number;
  text: string;
  invalid: boolean;
};

/** Large enough for a real backlog, still a safe integer. Not the penalty cap. */
export const MAX_COUNT = 1_000_000;

export function initialCount(): CountState {
  return { committed: 0, text: "0", invalid: false };
}

export function argumentPenalty(choice: ArgumentChoice): number {
  return choice === "sim" ? -15 : 0;
}

/** −2 per project, and the penalty itself stops at −10. The count is not trimmed. */
export function projectPenalty(count: number): number {
  return asPenalty(Math.min(10, safeCount(count) * 2));
}

/** −1 per bug, and the penalty itself stops at −15. The count is not trimmed. */
export function bugPenalty(count: number): number {
  return asPenalty(Math.min(15, safeCount(count)));
}

export function applySubjective(
  raw: number,
  input: { willingness: number; argument: ArgumentChoice; projects: number; bugs: number },
): {
  willingness: number;
  argument: number;
  projects: number;
  bugs: number;
  raw: number;
  percentage: number;
} {
  const willingness = willingnessContribution(input.willingness);
  const argument = argumentPenalty(input.argument);
  const projects = projectPenalty(input.projects);
  const bugs = bugPenalty(input.bugs);
  const nextRaw = raw + willingness + argument + projects + bugs;
  return {
    willingness,
    argument,
    projects,
    bugs,
    raw: nextRaw,
    percentage: Math.max(0, Math.min(100, Math.round(nextRaw))),
  };
}

export function countOnChange(text: string, previous: CountState): CountState {
  if (text === "") {
    return { committed: previous.committed, text: "", invalid: false };
  }
  if (!/^\d+$/.test(text)) {
    return { committed: previous.committed, text, invalid: true };
  }
  if (text.length > 7) {
    return { committed: previous.committed, text, invalid: true };
  }
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_COUNT) {
    return { committed: previous.committed, text, invalid: true };
  }
  return { committed: parsed, text, invalid: false };
}

export function countOnBlur(state: CountState): CountState {
  const trimmed = state.text.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { committed: state.committed, text: String(state.committed), invalid: false };
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_COUNT) {
    return { committed: state.committed, text: String(state.committed), invalid: false };
  }
  return { committed: parsed, text: String(parsed), invalid: false };
}

function safeCount(count: number): number {
  if (!Number.isSafeInteger(count) || count < 0) return 0;
  return count;
}

function asPenalty(magnitude: number): number {
  return magnitude === 0 ? 0 : -magnitude;
}

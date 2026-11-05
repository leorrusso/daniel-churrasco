/** 50 leaves the published score untouched. 0 subtracts 20, 100 adds 20. */
export const WILLINGNESS_NEUTRAL = 50;

export type WillingnessState = {
  committed: number;
  text: string;
  invalid: boolean;
};

export function initialWillingness(): WillingnessState {
  return { committed: WILLINGNESS_NEUTRAL, text: String(WILLINGNESS_NEUTRAL), invalid: false };
}

export function clampWillingness(value: number): number {
  if (!Number.isFinite(value)) return WILLINGNESS_NEUTRAL;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Linear map: 0 → -20, 50 → 0, 100 → +20. Rounded to the nearest point. */
export function willingnessContribution(value: number): number {
  const clamped = clampWillingness(value);
  const points = Math.round(((clamped - WILLINGNESS_NEUTRAL) * 20) / 50);
  return points === 0 ? 0 : points;
}

export function applyWillingness(raw: number, willingness: number): {
  contribution: number;
  raw: number;
  percentage: number;
} {
  const contribution = willingnessContribution(willingness);
  const nextRaw = raw + contribution;
  return {
    contribution,
    raw: nextRaw,
    percentage: Math.max(0, Math.min(100, Math.round(nextRaw))),
  };
}

export function willingnessFromSlider(value: number): WillingnessState {
  const committed = clampWillingness(value);
  return { committed, text: String(committed), invalid: false };
}

/**
 * Typing keeps the last valid score until the field holds an integer from 0 to 100.
 * Blank and unfinished text do not move the score. Out of range is marked invalid.
 */
export function willingnessOnChange(text: string, previous: WillingnessState): WillingnessState {
  if (text === "") {
    return { committed: previous.committed, text: "", invalid: false };
  }
  if (!/^\d{1,3}$/.test(text)) {
    return { committed: previous.committed, text, invalid: true };
  }
  const parsed = Number(text);
  if (parsed > 100) {
    return { committed: previous.committed, text, invalid: true };
  }
  return { committed: parsed, text, invalid: false };
}

/** Empty, junk, or out-of-range text settles back to a number from 0 to 100. */
export function willingnessOnBlur(state: WillingnessState): WillingnessState {
  const trimmed = state.text.trim();
  if (!/^\d{1,3}$/.test(trimmed)) {
    return { committed: state.committed, text: String(state.committed), invalid: false };
  }
  const committed = clampWillingness(Number(trimmed));
  return { committed, text: String(committed), invalid: false };
}

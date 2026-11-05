import type { ChanceResult } from "@/lib/types";

export function shareSentence(chance: ChanceResult): string {
  return `Chance do Daniel fazer churrasco hoje (${chance.shortDate}): ${chance.percentage}%. ${chance.verdict}.`;
}

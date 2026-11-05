import { beerFactor } from "@/lib/beer";
import { footballFactor } from "@/lib/football";
import { holidayFactor } from "@/lib/holidays";
import { clampPercent, SCORE, verdictFor } from "@/lib/score";
import { stfFactor } from "@/lib/stf";
import { formatClock, formatLongDate, formatShortDate, zonedNow } from "@/lib/time";
import type { ChanceResult } from "@/lib/types";
import { createFetchGate } from "@/lib/http";
import { weatherFactor } from "@/lib/weather";

export async function getChance(now: Date): Promise<ChanceResult> {
  const zoned = zonedNow(now);
  const gate = createFetchGate(4);
  const [clima, feriado, spfc, selecao, stf] = await Promise.all([
    weatherFactor(gate),
    holidayFactor(zoned.iso, zoned.weekday, gate),
    footballFactor("spfc", zoned.iso, now, gate),
    footballFactor("selecao", zoned.iso, now, gate),
    stfFactor(gate),
  ]);
  const cerveja = beerFactor(zoned.iso, zoned.weekday);
  const factors = [clima, feriado, cerveja, spfc, selecao, stf];
  const raw = SCORE.base + factors.reduce((sum, factor) => sum + factor.contribution, 0);
  const percentage = clampPercent(raw);
  const verdict = verdictFor(percentage);

  return {
    percentage,
    raw,
    base: SCORE.base,
    verdict: verdict.verdict,
    verdictDetail: verdict.detail,
    dateIso: zoned.iso,
    dateLabel: formatLongDate(now),
    shortDate: formatShortDate(now),
    fetchedAtLabel: formatClock(now),
    factors,
  };
}

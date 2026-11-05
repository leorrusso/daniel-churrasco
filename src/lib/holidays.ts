import { fetchJson, type FetchGate } from "@/lib/http";
import { SCORE } from "@/lib/score";
import { formatCivilDate } from "@/lib/time";
import type { Factor } from "@/lib/types";

type Holiday = {
  date: string;
  name: string;
  type: string;
};

/** Usada só se a BrasilAPI falhar. Cobre o ano civil de 2026. */
const FALLBACK_2026: Holiday[] = [
  { date: "2026-01-01", name: "Confraternização mundial", type: "national" },
  { date: "2026-02-16", name: "Carnaval", type: "national" },
  { date: "2026-02-17", name: "Carnaval", type: "national" },
  { date: "2026-04-03", name: "Sexta-feira Santa", type: "national" },
  { date: "2026-04-05", name: "Páscoa", type: "national" },
  { date: "2026-04-21", name: "Tiradentes", type: "national" },
  { date: "2026-05-01", name: "Dia do trabalho", type: "national" },
  { date: "2026-06-04", name: "Corpus Christi", type: "national" },
  { date: "2026-09-07", name: "Independência do Brasil", type: "national" },
  { date: "2026-10-12", name: "Nossa Senhora Aparecida", type: "national" },
  { date: "2026-11-02", name: "Finados", type: "national" },
  { date: "2026-11-15", name: "Proclamação da República", type: "national" },
  { date: "2026-11-20", name: "Dia da consciência negra", type: "national" },
  { date: "2026-12-25", name: "Natal", type: "national" },
];

function nextHoliday(holidays: Holiday[], todayIso: string): Holiday | undefined {
  return holidays
    .filter((holiday) => holiday.date > todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

function weekendFactor(
  weekday: number,
  weightLabel: string,
  source: string,
  extraDetail: string,
): Factor {
  if (weekday === 6) {
    return {
      id: "feriado",
      title: "Feriado no Brasil?",
      status: "Sábado, quase feriado",
      detail: `Não é feriado nacional. ${extraDetail}`.trim(),
      joke: "Não é feriado, mas o calendário piscou.",
      weightLabel,
      contribution: 11,
      tone: "boost",
      source,
    };
  }
  if (weekday === 0) {
    return {
      id: "feriado",
      title: "Feriado no Brasil?",
      status: "Domingo",
      detail: `Não é feriado nacional. ${extraDetail}`.trim(),
      joke: "Domingo já nasce com cheiro de carvão.",
      weightLabel,
      contribution: 9,
      tone: "boost",
      source,
    };
  }
  if (weekday === 5) {
    return {
      id: "feriado",
      title: "Feriado no Brasil?",
      status: "Sextou",
      detail: `Não é feriado nacional. ${extraDetail}`.trim(),
      joke: "Sexta é feriado emocional. O RH que lute.",
      weightLabel,
      contribution: 7,
      tone: "boost",
      source,
    };
  }
  return {
    id: "feriado",
    title: "Feriado no Brasil?",
    status: "Dia útil",
    detail: extraDetail || "Dia de semana comum.",
    joke: "O patrão não colabora. A teimosia entra na conta à parte.",
    weightLabel,
    contribution: 0,
    tone: "neutral",
    source,
  };
}

export async function holidayFactor(
  todayIso: string,
  weekday: number,
  gate?: FetchGate,
): Promise<Factor> {
  const weightLabel = `Peso até +${SCORE.feriado.max}`;
  const year = todayIso.slice(0, 4);
  let holidays: Holiday[] | null = null;
  let source = "BrasilAPI · feriados nacionais";

  try {
    const data = await fetchJson<Holiday[]>(
      `https://brasilapi.com.br/api/feriados/v1/${year}`,
      8000,
      gate,
    );
    holidays = data.filter((holiday) => holiday.type === "national");
  } catch {
    if (year === "2026") {
      holidays = FALLBACK_2026;
      source = "Lista local de 2026 (BrasilAPI indisponível)";
    }
  }

  if (!holidays) {
    const fallback = weekendFactor(
      weekday,
      weightLabel,
      "BrasilAPI indisponível",
      "Não deu para confirmar se hoje é feriado nacional.",
    );
    return { ...fallback, tone: weekday === 1 || weekday === 2 || weekday === 3 || weekday === 4 ? "fallback" : fallback.tone };
  }

  const today = holidays.find((holiday) => holiday.date === todayIso);
  if (today) {
    return {
      id: "feriado",
      title: "Feriado no Brasil?",
      status: `Feriado: ${today.name}`,
      detail: `${formatCivilDate(today.date)} é feriado nacional. A brasa tem álibi oficial.`,
      joke: "Feriado nacional é o churrasco se sentindo obrigatório.",
      weightLabel,
      contribution: SCORE.feriado.max,
      tone: "boost",
      source,
    };
  }

  const upcoming = nextHoliday(holidays, todayIso);
  const extra = upcoming
    ? `Próximo feriado nacional: ${upcoming.name}, ${formatCivilDate(upcoming.date)}.`
    : "Nenhum outro feriado nacional neste ano.";
  return weekendFactor(weekday, weightLabel, source, extra);
}

import { fetchJson, type FetchGate } from "@/lib/http";
import { SCORE } from "@/lib/score";
import { formatKickoff, localDateIso } from "@/lib/time";
import type { Factor, FactorId } from "@/lib/types";

type MatchStatus = "scheduled" | "live" | "finished";

type Match = {
  home: string;
  away: string;
  kickoff: string;
  localDate: string;
  competition: string;
  status: MatchStatus;
  timeKnown: boolean;
  source: "ESPN" | "TheSportsDB";
};

type ProviderResult = {
  provider: "ESPN" | "TheSportsDB";
  ok: boolean;
  matches: Match[];
};

const NAMES: Record<string, string> = {
  brazil: "Brasil",
  japan: "Japão",
  germany: "Alemanha",
  france: "França",
  spain: "Espanha",
  england: "Inglaterra",
  netherlands: "Holanda",
  croatia: "Croácia",
  argentina: "Argentina",
  uruguay: "Uruguai",
  italy: "Itália",
  portugal: "Portugal",
  mexico: "México",
  "south korea": "Coreia do Sul",
  usa: "Estados Unidos",
  "united states": "Estados Unidos",
  scotland: "Escócia",
  norway: "Noruega",
  morocco: "Marrocos",
  haiti: "Haiti",
  egypt: "Egito",
  panama: "Panamá",
  india: "Índia",
  australia: "Austrália",
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function translate(name: string): string {
  return NAMES[fold(name)] ?? name;
}

function quality(match: Match): number {
  let score = match.timeKnown ? 2 : 0;
  if (match.source === "ESPN") score += 2;
  if (match.status === "live") score += 1;
  return score;
}

function dedupe(matches: Match[]): Match[] {
  const map = new Map<string, Match>();
  for (const match of matches) {
    const key = `${fold(match.home)}|${fold(match.away)}|${match.localDate}`;
    const previous = map.get(key);
    if (!previous || quality(match) >= quality(previous)) {
      map.set(key, match);
    }
  }
  return [...map.values()];
}

function parseEspn(data: unknown, competition: string): Match[] {
  if (!data || typeof data !== "object") return [];
  const events = (data as { events?: unknown }).events;
  if (!Array.isArray(events)) return [];
  const matches: Match[] = [];

  for (const event of events) {
    if (!event || typeof event !== "object") continue;
    const row = event as Record<string, unknown>;
    if (typeof row.date !== "string") continue;
    const kickoffDate = new Date(row.date);
    if (Number.isNaN(kickoffDate.getTime())) continue;

    const competitionRow = Array.isArray(row.competitions)
      ? (row.competitions[0] as Record<string, unknown> | undefined)
      : undefined;
    const competitors = Array.isArray(competitionRow?.competitors)
      ? competitionRow.competitors
      : [];

    let home = "";
    let away = "";
    for (const competitor of competitors) {
      if (!competitor || typeof competitor !== "object") continue;
      const side = competitor as Record<string, unknown>;
      const team =
        side.team && typeof side.team === "object"
          ? (side.team as Record<string, unknown>)
          : {};
      const name = typeof team.displayName === "string" ? team.displayName : "";
      if (side.homeAway === "home") home = name;
      if (side.homeAway === "away") away = name;
    }

    if (!home || !away) {
      const label = typeof row.name === "string" ? row.name : "";
      const parts = label.split(" at ");
      if (parts.length === 2) {
        away = parts[0];
        home = parts[1];
      } else {
        continue;
      }
    }

    const statusNode =
      competitionRow?.status && typeof competitionRow.status === "object"
        ? (competitionRow.status as Record<string, unknown>)
        : {};
    const typeNode =
      statusNode.type && typeof statusNode.type === "object"
        ? (statusNode.type as Record<string, unknown>)
        : {};
    const state = typeof typeNode.state === "string" ? typeNode.state : "";
    const status: MatchStatus =
      state === "in" ? "live" : typeNode.completed === true || state === "post" ? "finished" : "scheduled";

    const kickoff = kickoffDate.toISOString();
    matches.push({
      home: translate(home),
      away: translate(away),
      kickoff,
      localDate: localDateIso(kickoff),
      competition,
      status,
      timeKnown: true,
      source: "ESPN",
    });
  }

  return matches;
}

function sportsDbInstant(event: Record<string, unknown>): { kickoff: string; timeKnown: boolean } | null {
  const timestamp = typeof event.strTimestamp === "string" ? event.strTimestamp : "";
  const date = typeof event.dateEvent === "string" ? event.dateEvent : "";
  const time = typeof event.strTime === "string" ? event.strTime : "";

  if (timestamp) {
    const withZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(timestamp) ? timestamp : `${timestamp}Z`;
    const parsed = new Date(withZone);
    if (!Number.isNaN(parsed.getTime())) {
      return { kickoff: parsed.toISOString(), timeKnown: true };
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const clock = /^\d{2}:\d{2}/.test(time) ? time.slice(0, 8) : "";
    const parsed = new Date(`${date}T${clock || "15:00:00"}Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return { kickoff: parsed.toISOString(), timeKnown: Boolean(clock) };
    }
  }

  return null;
}

function sportsDbStatus(value: string): MatchStatus {
  const status = value.toUpperCase();
  if (["1H", "2H", "HT", "LIVE", "IN PLAY"].some((token) => status.includes(token))) {
    return "live";
  }
  if (["FT", "AET", "PEN", "FULL", "FINISHED", "AWARDED"].some((token) => status.includes(token))) {
    return "finished";
  }
  return "scheduled";
}

function parseSportsDb(data: unknown): Match[] {
  if (!data || typeof data !== "object") return [];
  const events = (data as { events?: unknown; results?: unknown }).events
    ?? (data as { results?: unknown }).results;
  if (!Array.isArray(events)) return [];
  const matches: Match[] = [];

  for (const event of events) {
    if (!event || typeof event !== "object") continue;
    const row = event as Record<string, unknown>;
    const instant = sportsDbInstant(row);
    if (!instant) continue;
    const home = typeof row.strHomeTeam === "string" ? row.strHomeTeam : "";
    const away = typeof row.strAwayTeam === "string" ? row.strAwayTeam : "";
    if (!home || !away) continue;
    matches.push({
      home: translate(home),
      away: translate(away),
      kickoff: instant.kickoff,
      localDate: localDateIso(instant.kickoff),
      competition: typeof row.strLeague === "string" ? row.strLeague : "Futebol",
      status: sportsDbStatus(typeof row.strStatus === "string" ? row.strStatus : ""),
      timeKnown: instant.timeKnown,
      source: "TheSportsDB",
    });
  }

  return matches;
}

async function loadEspn(
  teamId: string,
  league: string,
  label: string,
  year: number,
  gate?: FetchGate,
): Promise<Match[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}/schedule?season=${year}`;
  const data = await fetchJson<unknown>(url, 8000, gate);
  return parseEspn(data, label);
}

async function loadSportsDb(teamId: string, gate?: FetchGate): Promise<Match[]> {
  const settled = await Promise.allSettled([
    fetchJson<unknown>(`https://www.thesportsdb.com/api/v1/json/123/eventsnext.php?id=${teamId}`, 8000, gate),
    fetchJson<unknown>(`https://www.thesportsdb.com/api/v1/json/123/eventslast.php?id=${teamId}`, 8000, gate),
  ]);
  const payloads = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  if (payloads.length === 0) {
    throw new Error("TheSportsDB indisponível");
  }
  return payloads.flatMap((payload) => parseSportsDb(payload));
}

async function settleProvider(
  provider: "ESPN" | "TheSportsDB",
  tasks: Array<Promise<Match[]>>,
): Promise<ProviderResult> {
  const settled = await Promise.allSettled(tasks);
  const matches = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const ok = settled.some((result) => result.status === "fulfilled");
  return { provider, ok, matches };
}

const SP_LEAGUES = [
  { league: "bra.1", label: "Brasileirão" },
  { league: "bra.copa_do_brazil", label: "Copa do Brasil" },
  { league: "conmebol.sudamericana", label: "Sul-Americana" },
  { league: "conmebol.libertadores", label: "Libertadores" },
];

const BR_LEAGUES = [
  { league: "fifa.friendly", label: "Amistoso" },
  { league: "fifa.world", label: "Copa do Mundo" },
  { league: "fifa.worldq.conmebol", label: "Eliminatórias" },
];

async function loadCalendar(kind: "spfc" | "selecao", year: number, gate?: FetchGate): Promise<{
  matches: Match[];
  source: string;
  ok: boolean;
}> {
  const espn =
    kind === "spfc"
      ? settleProvider(
          "ESPN",
          SP_LEAGUES.map((item) => loadEspn("2026", item.league, item.label, year, gate)),
        )
      : settleProvider(
          "ESPN",
          BR_LEAGUES.map((item) => loadEspn("205", item.league, item.label, year, gate)),
        );
  const sportsDb = settleProvider("TheSportsDB", [
    loadSportsDb(kind === "spfc" ? "134291" : "134496", gate),
  ]);
  const [espnResult, dbResult] = await Promise.all([espn, sportsDb]);
  const ok = espnResult.ok || dbResult.ok;
  const working = [espnResult, dbResult].filter((result) => result.ok).map((result) => result.provider);
  const failed = [espnResult, dbResult].filter((result) => !result.ok).map((result) => result.provider);
  const source = ok
    ? failed.length > 0
      ? `${working.join(" · ")} (falhou: ${failed.join(", ")})`
      : working.join(" · ")
    : "Calendário indisponível";
  return {
    matches: dedupe([...espnResult.matches, ...dbResult.matches]),
    source,
    ok,
  };
}

function involves(match: Match, needles: string[]): boolean {
  const home = fold(match.home);
  const away = fold(match.away);
  return needles.some((needle) => home.includes(needle) || away.includes(needle));
}

function opponent(match: Match, needles: string[]): string {
  const home = fold(match.home);
  return needles.some((needle) => home.includes(needle)) ? match.away : match.home;
}

function classicName(name: string): string | null {
  const folded = fold(name);
  if (folded.includes("corinthians")) return "Majestoso";
  if (folded.includes("palmeiras")) return "Choque-Rei";
  if (folded.includes("santos")) return "San-São";
  if (folded.includes("argentina")) return "clássico contra a Argentina";
  return null;
}

function competitionLabel(name: string): string {
  const folded = fold(name);
  if (folded.includes("friendl") || folded.includes("amistoso")) return "Amistoso";
  if (folded.includes("serie a") || folded.includes("brasileir")) return "Brasileirão";
  if (folded.includes("libertadores")) return "Libertadores";
  if (folded.includes("sudamericana") || folded.includes("sul-americana")) return "Sul-Americana";
  if (folded.includes("copa do brasil")) return "Copa do Brasil";
  return name;
}

function stateLabel(status: MatchStatus): string {
  if (status === "live") return "rolando agora";
  if (status === "finished") return "encerrado";
  return "marcado";
}

function matchLine(match: Match): string {
  return `${match.home} x ${match.away} · ${formatKickoff(match.kickoff, match.timeKnown)} · ${competitionLabel(match.competition)} · ${stateLabel(match.status)}`;
}

function pickToday(matches: Match[], todayIso: string): Match | undefined {
  const today = matches
    .filter((match) => match.localDate === todayIso)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  return today.find((match) => match.status === "live") ?? today.at(-1);
}

function pickNext(matches: Match[], todayIso: string, nowIso: string): Match | undefined {
  return matches
    .filter((match) => match.localDate > todayIso && match.kickoff >= nowIso && match.status !== "finished")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
}

function pickLast(matches: Match[], todayIso: string): Match | undefined {
  return matches
    .filter((match) => match.localDate < todayIso)
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff))[0];
}

export async function footballFactor(
  kind: "spfc" | "selecao",
  todayIso: string,
  now: Date,
  gate?: FetchGate,
): Promise<Factor> {
  const year = Number(todayIso.slice(0, 4));
  const id: FactorId = kind === "spfc" ? "spfc" : "selecao";
  const title = kind === "spfc" ? "Tem jogo do SPFC?" : "Tem jogo da Seleção?";
  const max = kind === "spfc" ? SCORE.spfc.max : SCORE.selecao.max;
  const weightLabel = `Peso até +${max}`;
  const needles = kind === "spfc" ? ["sao paulo"] : ["brasil", "brazil"];

  try {
    const calendar = await loadCalendar(kind, year, gate);
    if (!calendar.ok) {
      return {
        id,
        title,
        status: "Calendário indisponível",
        detail: "As fontes de tabela não responderam. O fator fica neutro e não altera a chance.",
        joke:
          kind === "spfc"
            ? "A tabela do Tricolor sumiu. Sem chute, sem ponto."
            : "O calendário da Seleção não atendeu. Peso neutro, zero drama.",
        weightLabel,
        contribution: 0,
        tone: "fallback",
        source: calendar.source,
      };
    }

    const relevant = calendar.matches.filter((match) => involves(match, needles));
    const today = pickToday(relevant, todayIso);
    if (today) {
      const rival = classicName(opponent(today, needles));
      const huge = kind === "selecao";
      const contribution = huge ? max : rival ? max : 14;
      const status = rival
        ? `Hoje tem ${rival}`
        : today.status === "live"
          ? "Tá rolando agora"
          : today.status === "finished"
            ? "Já teve jogo hoje"
            : "Hoje tem jogo";
      const joke = rival
        ? kind === "spfc"
          ? "Clássico é cláusula pétrea da gelada. O churrasco vira programa oficial."
          : "Argentina em campo deixa de ser churrasco e vira ritual."
        : kind === "spfc"
          ? "Jogo do São Paulo hoje. A picanha assiste junto — ou o Daniel assiste a picanha."
          : "Dia de amarelinha. Até quem não torce abre uma lata.";
      return {
        id,
        title,
        status,
        detail: `${matchLine(today)}. Horário de Brasília.`,
        joke,
        weightLabel,
        contribution,
        tone: "boost",
        source: calendar.source,
      };
    }

    const next = pickNext(relevant, todayIso, now.toISOString());
    const last = pickLast(relevant, todayIso);
    const lastRival = last ? classicName(opponent(last, needles)) : null;
    const pieces = [
      next ? `Próximo: ${matchLine(next)}.` : "Nenhum próximo jogo listado.",
      last ? `Último: ${matchLine(last)}.` : "",
      lastRival ? `Esse último foi ${lastRival}.` : "",
    ].filter(Boolean);

    return {
      id,
      title,
      status: "Sem jogo hoje",
      detail: `${pieces.join(" ")} Horário de Brasília.`,
      joke:
        kind === "spfc"
          ? "Sem Tricolor em campo. A brasa fica sem narrador."
          : "A Seleção não joga hoje. O hino fica no bolso.",
      weightLabel,
      contribution: 0,
      tone: "neutral",
      source: calendar.source,
    };
  } catch {
    return {
      id,
      title,
      status: "Calendário indisponível",
      detail: "As fontes de tabela não responderam. O fator fica neutro e não altera a chance.",
      joke: "Tabela fora do ar. A carne decide sozinha.",
      weightLabel,
      contribution: 0,
      tone: "fallback",
      source: "Calendário indisponível",
    };
  }
}

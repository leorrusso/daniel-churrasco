export const SAO_PAULO = "America/Sao_Paulo";

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type ZonedNow = {
  iso: string;
  weekday: number;
};

export function zonedNow(date: Date, timeZone = SAO_PAULO): ZonedNow {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return { iso, weekday: WEEKDAYS[weekdayName] ?? 0 };
}

export function formatLongDate(date: Date, timeZone = SAO_PAULO): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(date: Date, timeZone = SAO_PAULO): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatClock(date: Date, timeZone = SAO_PAULO): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatKickoff(iso: string, timeKnown: boolean, timeZone = SAO_PAULO): string {
  const date = new Date(iso);
  if (!timeKnown) {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  }
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Civil date (YYYY-MM-DD) shown in America/Sao_Paulo, without shifting to the previous day. */
export function formatCivilDate(isoDate: string, timeZone = SAO_PAULO): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day, 15, 0, 0));
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(anchor);
}

export function localDateIso(instantIso: string, timeZone = SAO_PAULO): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instantIso));
}

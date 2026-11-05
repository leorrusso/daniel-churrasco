export type FactorId =
  | "clima"
  | "feriado"
  | "cerveja"
  | "spfc"
  | "selecao"
  | "stf";

export type FactorTone = "boost" | "drop" | "neutral" | "fallback";

export type Factor = {
  id: FactorId;
  title: string;
  status: string;
  detail: string;
  joke: string;
  weightLabel: string;
  contribution: number;
  tone: FactorTone;
  source: string;
  simulated?: boolean;
};

export type ChanceResult = {
  percentage: number;
  raw: number;
  base: number;
  verdict: string;
  verdictDetail: string;
  dateIso: string;
  dateLabel: string;
  shortDate: string;
  fetchedAtLabel: string;
  factors: Factor[];
};

export const SCORE = {
  base: 20,
  clima: { min: -14, max: 28 },
  feriado: { max: 18 },
  cerveja: { max: 14 },
  spfc: { max: 18 },
  selecao: { max: 20 },
  stf: { max: 40 },
} as const;

export function clampPercent(raw: number): number {
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function formatPoints(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function verdictFor(percentage: number): { verdict: string; detail: string } {
  if (percentage >= 82) {
    return {
      verdict: "Pode ligar o carvão",
      detail: "A conta gritou picanha. Chama o pessoal antes que esfrie a ideia.",
    };
  }
  if (percentage >= 66) {
    return {
      verdict: "Chama a galera",
      detail: "A carne pede e a gelada concorda. Falta só alguém levar o gelo.",
    };
  }
  if (percentage >= 50) {
    return {
      verdict: "Só se tiver IPA gelada",
      detail: "Não é certeza, mas a brasa está negociável. Uma lata boa desempata.",
    };
  }
  if (percentage >= 34) {
    return {
      verdict: "Meio termo: linguiça e uma latinha",
      detail: "Churrasco tímido. Sem convite no grupo da família.",
    };
  }
  if (percentage >= 18) {
    return {
      verdict: "Hoje é dia de delivery",
      detail: "O carvão fica guardado. O aplicativo de comida não.",
    };
  }
  return {
    verdict: "O Daniel vai ficar no sofá",
    detail: "Nem a linguiça acredita nesse plano. Melhor deixar a grelha quieta.",
  };
}

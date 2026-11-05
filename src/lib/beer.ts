import { SCORE } from "@/lib/score";
import type { Factor } from "@/lib/types";

/**
 * Sem API pública nacional de preço de cerveja.
 * O índice é determinístico para a data: o mesmo dia sempre devolve as mesmas "promos".
 */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BRANDS = ["Skol", "Brahma", "Heineken"] as const;

export function beerFactor(dateIso: string, weekday: number): Factor {
  const random = mulberry32(hashString(`gelada:${dateIso}`));
  const promoWindow = weekday === 0 || weekday === 5 || weekday === 6;
  const brands = BRANDS.map((name) => ({
    name,
    promo: random() < (promoWindow ? 0.62 : 0.38),
  }));
  const promoCount = brands.filter((brand) => brand.promo).length;

  let score = 0.25;
  if (promoWindow) score += 0.35;
  score += promoCount * 0.13;
  if (score > 1) score = 1;

  const contribution = Math.round(score * SCORE.cerveja.max);
  const index = Math.round(score * 10);
  const brandLine = brands
    .map((brand) =>
      brand.promo ? `${brand.name} em promo simulada` : `${brand.name} preço cheio`,
    )
    .join(" · ");

  let joke = "Nenhuma promo no dado de hoje. Cerveja cheia ainda assim é cerveja.";
  if (promoCount >= 2) {
    joke = "Duas marcas piscando oferta fictícia. O Daniel ouve a latinha daqui.";
  } else if (promoCount === 1) {
    joke = "Uma gelada em promo imaginária. O universo tentou, o mercado talvez não.";
  }

  return {
    id: "cerveja",
    title: "Preço da gelada",
    status: `Índice da gelada ${index}/10`,
    detail: `${brandLine}. ${
      promoWindow
        ? "Sexta, sábado e domingo sobem a vibe de promoção."
        : "No meio da semana a promo simulada fica mais tímida."
    }`,
    joke,
    weightLabel: `Peso até +${SCORE.cerveja.max}`,
    contribution,
    tone: contribution >= 8 ? "boost" : "neutral",
    source:
      "Aproximado/simulado. Não existe API pública nacional de preço — o índice usa o dia da semana e um sorteio fixo pela data. Não é cotação de mercado.",
    simulated: true,
  };
}

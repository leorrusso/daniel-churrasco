import { fetchText, type FetchGate } from "@/lib/http";
import { SCORE } from "@/lib/score";
import type { Factor } from "@/lib/types";

const FEED = "https://agenciabrasil.ebc.com.br/rss/politica/feed.xml";

type RssItem = {
  title: string;
  link: string;
};

function decode(value: string): string {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const pattern = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match = pattern.exec(xml);
  while (match) {
    const block = match[1];
    const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(block);
    const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(block);
    if (titleMatch) {
      items.push({
        title: decode(titleMatch[1]),
        link: linkMatch ? decode(linkMatch[1]) : "https://agenciabrasil.ebc.com.br/politica",
      });
    }
    match = pattern.exec(xml);
  }
  return items;
}

/**
 * Quase nunca é verdade. Só conta manchete que afirma impeachment/cassação
 * já ocorrida de ministro do STF — pedido, ameaça ou opinião não contam.
 */
export function confirmedImpeachment(title: string): boolean {
  const text = title.toLowerCase();
  const aboutCourt = /\bstf\b|supremo tribunal/.test(text);
  const aboutMinister = /ministro/.test(text);
  if (!aboutCourt || !aboutMinister) return false;
  if (
    /(pedido|pede|pedem|pediu|defende|defend|amea[cç]|propost|protocol|artigo|opini[aã]o|pode sofrer|risco|debate|discute|analisa|quer impeach|n[aã]o aprov)/.test(
      text,
    )
  ) {
    return false;
  }
  return /(sofreu impeachment|impeachment aprovado|impeachment foi aprovado|foi cassad[oa]|é cassad[oa]|teve o mandato cassado|aprov(?:a|ou)(?: o)? impeachment)/.test(
    text,
  );
}

export async function stfFactor(gate?: FetchGate): Promise<Factor> {
  const weightLabel = `Coringa +${SCORE.stf.max} só com manchete afirmativa`;
  try {
    const xml = await fetchText(FEED, 8000, gate);
    const items = parseItems(xml);
    const hit = items.find((item) => confirmedImpeachment(item.title));
    if (hit) {
      return {
        id: "stf",
        title: "Impeachment no STF?",
        status: "Manchete recente afirma",
        detail: `O feed da Agência Brasil trouxe: “${hit.title}”. ${hit.link} Entra como coringa de zoação, não como conclusão jurídica.`,
        joke: "A manchete acendeu o coringa. O jurista de plantão ainda não foi consultado.",
        weightLabel,
        contribution: SCORE.stf.max,
        tone: "boost",
        source: "Agência Brasil (EBC), feed de política. Só manchete recente com afirmação explícita.",
      };
    }
    return {
      id: "stf",
      title: "Impeachment no STF?",
      status: "Não verificado",
      detail:
        "O feed recente da Agência Brasil não trouxe afirmação de impeachment de ministro. Falta de palavra-chave não prova que aconteceu nem que não aconteceu. O fator fica neutro.",
      joke: "Sem prova, sem ponto. O churrasco não vai depender de boato.",
      weightLabel,
      contribution: 0,
      tone: "neutral",
      source: "Agência Brasil (EBC), feed de política. Checagem leve, resultado inconclusivo.",
    };
  } catch {
    return {
      id: "stf",
      title: "Impeachment no STF?",
      status: "Não verificado",
      detail:
        "A fonte não respondeu. Sem confirmação, o fator fica neutro. Isso não afirma que houve impeachment nem que não houve.",
      joke: "Fonte muda, carvão espera. Zero ponto até alguém confirmar.",
      weightLabel,
      contribution: 0,
      tone: "fallback",
      source: "Checagem indisponível. Sem chute de manchete.",
    };
  }
}

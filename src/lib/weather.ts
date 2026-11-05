import { fetchJson, type FetchGate } from "@/lib/http";
import { SCORE } from "@/lib/score";
import type { Factor } from "@/lib/types";

const FORECAST_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.3045&longitude=-51.1696&current=temperature_2m,precipitation,weather_code&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,weather_code&timezone=America%2FSao_Paulo&forecast_days=1";

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    precipitation?: number;
    weather_code?: number;
  };
  daily?: {
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
};

function pt(value: number, digits = 1): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function weatherLabel(code: number): string {
  if (code === 0) return "céu limpo";
  if (code === 1) return "quase limpo";
  if (code === 2) return "parcialmente nublado";
  if (code === 3) return "nublado";
  if (code === 45 || code === 48) return "neblina";
  if (code >= 51 && code <= 57) return "garoa";
  if (code >= 61 && code <= 67) return "chuva";
  if (code >= 71 && code <= 77) return "precipitação invernal";
  if (code >= 80 && code <= 82) return "pancadas";
  if (code === 95) return "trovoada";
  if (code >= 96) return "trovoada com granizo";
  return "tempo instável";
}

function isRainCode(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
}

function isHeavyCode(code: number): boolean {
  return (code >= 65 && code <= 67) || code === 82;
}

export function scoreWeather(input: {
  tempMax: number;
  precipNow: number;
  precipDay: number;
  prob: number;
  codeNow: number;
  codeDay: number;
}): { points: number; status: string; joke: string } {
  const precip = Math.max(input.precipNow, input.precipDay);
  const storm = input.codeNow >= 95 || input.codeDay >= 95;
  const heavy =
    precip >= 8 ||
    (input.prob >= 80 && precip >= 3) ||
    isHeavyCode(input.codeNow) ||
    isHeavyCode(input.codeDay);
  const rain =
    precip >= 1 ||
    input.precipNow >= 0.4 ||
    (input.prob >= 60 && (isRainCode(input.codeNow) || isRainCode(input.codeDay)));

  if (storm) {
    return {
      points: SCORE.clima.min,
      status: "Temporal",
      joke: "Temporal não é tempero. O carvão ia acender e o céu apagou.",
    };
  }
  if (heavy) {
    return {
      points: -10,
      status: "Chuva forte",
      joke: "Churrasco de galocha só se o Daniel for teimoso demais.",
    };
  }
  if (rain) {
    return {
      points: -4,
      status: "Chuva no caminho",
      joke: "Dá para assar, mas a picanha vai pedir guarda-chuva.",
    };
  }

  const temp = input.tempMax;
  if (temp < 16) {
    return {
      points: 2,
      status: "Frio de sopa",
      joke: "Frio pede caldo, não costela. A não ser que tenha cobertor e teimosia.",
    };
  }
  if (temp < 18) {
    return {
      points: 6,
      status: "Fresquinho",
      joke: "Tá na beirada dos 18°C. A brasa aquece, mas o short jeans reclama.",
    };
  }
  if (temp > 36) {
    return {
      points: 6,
      status: "Calor de derreter queijo",
      joke: "A carne cozinha sozinha. O churrasqueiro também.",
    };
  }
  if (
    temp >= 22 &&
    temp <= 31 &&
    input.codeDay <= 1 &&
    input.precipDay < 0.3 &&
    input.prob < 30
  ) {
    return {
      points: SCORE.clima.max,
      status: "Céu de picanha",
      joke: "Sol, brisa e zero desculpa. Liga o carvão.",
    };
  }
  if (temp >= 18 && temp <= 34) {
    return {
      points: 20,
      status: "Tempo de churrasco",
      joke: "Nem precisa filtro. O dia em Londrina colabora.",
    };
  }
  return {
    points: 8,
    status: "Mais ou menos",
    joke: "O céu não assinou o contrato, mas também não vetou a linguiça.",
  };
}

export async function weatherFactor(gate?: FetchGate): Promise<Factor> {
  const weightLabel = `Peso de ${SCORE.clima.min} a +${SCORE.clima.max}`;
  try {
    const data = await fetchJson<OpenMeteoResponse>(FORECAST_URL, 8000, gate);
    const tempNow = data.current?.temperature_2m;
    const precipNow = data.current?.precipitation;
    const codeNow = data.current?.weather_code;
    const tempMax = data.daily?.temperature_2m_max?.[0];
    const tempMin = data.daily?.temperature_2m_min?.[0];
    const precipDay = data.daily?.precipitation_sum?.[0];
    const prob = data.daily?.precipitation_probability_max?.[0];
    const codeDay = data.daily?.weather_code?.[0];

    if (
      tempNow === undefined ||
      precipNow === undefined ||
      codeNow === undefined ||
      tempMax === undefined ||
      tempMin === undefined ||
      precipDay === undefined ||
      prob === undefined ||
      codeDay === undefined
    ) {
      throw new Error("previsão incompleta");
    }

    const scored = scoreWeather({
      tempMax,
      precipNow,
      precipDay,
      prob,
      codeNow,
      codeDay,
    });

    return {
      id: "clima",
      title: "Clima em Londrina",
      status: scored.status,
      detail: `Agora ${pt(tempNow)}°C, ${weatherLabel(codeNow)}, ${pt(precipNow)} mm caindo. No dia: máxima ${pt(tempMax)}°C, mínima ${pt(tempMin)}°C, ${pt(precipDay)} mm e ${Math.round(prob)}% de chance de chuva (${weatherLabel(codeDay)}).`,
      joke: scored.joke,
      weightLabel,
      contribution: scored.points,
      tone: scored.points > 8 ? "boost" : scored.points < 0 ? "drop" : "neutral",
      source: "Open-Meteo · Londrina/PR (−23,3045, −51,1696)",
    };
  } catch {
    return {
      id: "clima",
      title: "Clima em Londrina",
      status: "Clima indisponível",
      detail: "A previsão não respondeu. Este fator entra neutro, sem inventar temperatura.",
      joke: "Sem céu, sem chute. O carvão fica no escuro.",
      weightLabel,
      contribution: 0,
      tone: "fallback",
      source: "Open-Meteo indisponível",
    };
  }
}

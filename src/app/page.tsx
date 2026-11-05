import { Flame } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";

import { ChancePanel } from "@/components/chance-panel";
import { ChanceSkeleton } from "@/components/chance-skeleton";
import { WillingnessProvider } from "@/components/willingness-provider";
import { getChance } from "@/lib/chance";

async function LiveChance() {
  await connection();
  const chance = await getChance(new Date());
  return <ChancePanel chance={chance} />;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <a
        href="#resultado"
        className="sr-only rounded-lg bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        Ir para o resultado
      </a>
      <header className="flex items-center gap-4 sm:gap-6">
        <img
          src="/daniel.webp"
          alt="Daniel"
          width={682}
          height={1024}
          className="size-28 shrink-0 rounded-2xl object-cover object-[center_18%] ring-1 ring-foreground/15 sm:size-40"
        />
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Flame aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm font-medium tracking-wide text-accent uppercase">Churrascômetro</p>
          </div>
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Chance do Daniel fazer churrasco
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Estimativa de zoação para hoje, no horário de Brasília, com o clima de Londrina. Não é
            ciência, cotação nem parecer jurídico.
          </p>
        </div>
      </header>
      <WillingnessProvider>
        <Suspense fallback={<ChanceSkeleton />}>
          <LiveChance />
        </Suspense>
      </WillingnessProvider>
      <footer className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          Feito para zoar o Daniel com dado real quando a internet colabora. Não é consultoria de
          tempo, de futebol nem de direito constitucional.
        </p>
        <ul className="flex flex-col gap-1">
          <li>
            Clima:{" "}
            <a
              className="rounded-sm text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-primary focus-visible:ring-3 focus-visible:ring-ring"
              href="https://open-meteo.com/"
            >
              Open-Meteo
            </a>
          </li>
          <li>
            Feriados:{" "}
            <a
              className="rounded-sm text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-primary focus-visible:ring-3 focus-visible:ring-ring"
              href="https://brasilapi.com.br/"
            >
              BrasilAPI
            </a>
          </li>
          <li>Cerveja: índice simulado, sem loja e sem API falsa.</li>
          <li>Futebol: ESPN e TheSportsDB, com peso neutro se as duas falharem.</li>
          <li>
            STF: checagem leve no feed de política da{" "}
            <a
              className="rounded-sm text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-primary focus-visible:ring-3 focus-visible:ring-ring"
              href="https://agenciabrasil.ebc.com.br/politica"
            >
              Agência Brasil
            </a>
            .
          </li>
        </ul>
      </footer>
    </main>
  );
}

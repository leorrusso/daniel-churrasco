"use client";

import { RefreshCw, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FactorCard } from "@/components/factor-card";
import { HoroscopeStub } from "@/components/horoscope-stub";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useWillingness } from "@/components/willingness-provider";
import { shareSentence } from "@/lib/share";
import { formatPoints, verdictFor } from "@/lib/score";
import type { ChanceResult } from "@/lib/types";
import { applySubjective, type CountState } from "@/lib/subjective";

export function ChancePanel({ chance }: { chance: ChanceResult }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const {
    state: willingness,
    setFromSlider,
    setText,
    commitText,
    argument,
    setArgument,
    projects,
    setProjectsText,
    commitProjects,
    bugs,
    setBugsText,
    commitBugs,
  } = useWillingness();
  const adjusted = applySubjective(chance.raw, {
    willingness: willingness.committed,
    argument,
    projects: projects.committed,
    bugs: bugs.committed,
  });
  const verdict = verdictFor(adjusted.percentage);
  const sentence = shareSentence({
    ...chance,
    percentage: adjusted.percentage,
    verdict: verdict.verdict,
  });
  const limited = adjusted.raw !== adjusted.percentage;

  function forgetCopy() {
    setCopied(false);
    setManualCopy(null);
  }

  function refresh() {
    setCopied(false);
    startTransition(() => {
      router.refresh();
    });
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(sentence);
      setManualCopy(null);
      setCopied(true);
    } catch {
      setCopied(false);
      setManualCopy(sentence);
    }
  }

  return (
    <div id="resultado" className="flex flex-col gap-4" aria-busy={pending}>
      <Card>
        <CardHeader>
          <CardDescription>
            <time dateTime={chance.dateIso}>{chance.dateLabel}</time>
            {" · "}
            Londrina/PR
          </CardDescription>
          <CardTitle>
            <p className="ember-glow font-heading text-7xl font-semibold tracking-tight text-primary tabular-nums sm:text-8xl">
              {adjusted.percentage}
              <span className="text-3xl sm:text-4xl">%</span>
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">{verdict.verdict}</h2>
            <p className="text-muted-foreground">{verdict.detail}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
            <div className="flex items-end justify-between gap-3">
              <label htmlFor="vontade" className="text-sm font-medium">
                Vontade dele agora
              </label>
              <span className="text-sm font-medium tabular-nums">
                {formatPoints(adjusted.willingness)} pts
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={willingness.committed}
                aria-label="Ajustar a vontade dele"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={willingness.committed}
                aria-valuetext={`${willingness.committed} de 100`}
                onChange={(event) => {
                  forgetCopy();
                  setFromSlider(Number(event.target.value));
                }}
                className="h-11 min-w-0 flex-1 cursor-pointer accent-primary"
              />
              <input
                id="vontade"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={3}
                value={willingness.text}
                aria-invalid={willingness.invalid || undefined}
                aria-describedby={
                  willingness.invalid ? "vontade-ajuda vontade-erro" : "vontade-ajuda"
                }
                onChange={(event) => {
                  forgetCopy();
                  setText(event.target.value);
                }}
                onBlur={commitText}
                className="h-11 w-20 rounded-lg border border-input bg-background px-3 text-base tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring"
              />
            </div>
            <p id="vontade-ajuda" className="text-sm text-muted-foreground">
              Palpite seu, fora das fontes. 0 tira 20 pontos, 50 não mexe na conta, 100 soma 20.
            </p>
            {willingness.invalid ? (
              <p id="vontade-erro" className="text-sm text-destructive">
                Digite um número de 0 a 100.
              </p>
            ) : null}
          </div>
          <fieldset className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
            <legend className="text-sm font-medium">Brigou com a mulher?</legend>
            <div className="flex gap-2">
              {(
                [
                  ["nao", "Não"],
                  ["sim", "Sim"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-background text-sm font-medium has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring"
                >
                  <input
                    type="radio"
                    name="brigou"
                    value={value}
                    checked={argument === value}
                    onChange={() => {
                      forgetCopy();
                      setArgument(value);
                    }}
                    className="size-4 accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Regra da zoação: sim tira 15 pontos. Não afirma nada sobre a vida real.
              <span className="ml-2 font-medium text-foreground tabular-nums">
                {formatPoints(adjusted.argument)} pts
              </span>
            </p>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <CountField
              id="projetos"
              label="Projetos em andamento"
              help="Cada um tira 2 pontos, no máximo 10. O número digitado não é cortado."
              state={projects}
              points={adjusted.projects}
              onText={(text) => {
                forgetCopy();
                setProjectsText(text);
              }}
              onCommit={commitProjects}
            />
            <CountField
              id="bugs"
              label="Bugs para resolver"
              help="Cada um tira 1 ponto, no máximo 15. O número digitado não é cortado."
              state={bugs}
              points={adjusted.bugs}
              onText={(text) => {
                forgetCopy();
                setBugsText(text);
              }}
              onCommit={commitBugs}
            />
          </div>
          <div
            role="meter"
            aria-label="Chance de churrasco"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={adjusted.percentage}
            aria-valuetext={`${adjusted.percentage}%`}
            className="h-3 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${adjusted.percentage}%` }}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" size="lg" onClick={refresh} disabled={pending}>
              <RefreshCw data-icon="inline-start" className={pending ? "motion-safe:animate-spin" : undefined} />
              {pending ? "Atualizando" : "Atualizar"}
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={share}>
              <Share2 data-icon="inline-start" />
              {copied ? "Copiado" : "Compartilhar"}
            </Button>
          </div>
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {copied
              ? "Frase copiada. Pode mandar no grupo."
              : `Atualizado às ${chance.fetchedAtLabel} (horário de Brasília).`}
          </p>
          {manualCopy ? (
            <p className="text-sm">
              A área de transferência não colaborou. Seleciona o texto:{" "}
              <span className="font-medium text-foreground">{manualCopy}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-base">De onde vem a conta</h2>
          </CardTitle>
          <CardDescription>
            Começa em {chance.base} pontos de teimosia do Daniel. Cada fator soma ou tira. O total
            fica entre 0% e 100%. É zoação, não previsão científica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span>Teimosia do Daniel</span>
              <span className="font-medium text-success tabular-nums">+{chance.base}</span>
            </li>
            {chance.factors.map((factor) => (
              <li key={factor.id} className="flex items-center justify-between gap-3">
                <span>{factor.title}</span>
                <span
                  className={
                    factor.contribution > 0
                      ? "font-medium text-success tabular-nums"
                      : factor.contribution < 0
                        ? "font-medium text-destructive tabular-nums"
                        : "font-medium text-muted-foreground tabular-nums"
                  }
                >
                  {formatPoints(factor.contribution)}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3">
              <span>Vontade dele ({willingness.committed})</span>
              <span className={pointsClass(adjusted.willingness)}>{formatPoints(adjusted.willingness)}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Brigou com a mulher? ({argument === "sim" ? "sim" : "não"})</span>
              <span className={pointsClass(adjusted.argument)}>{formatPoints(adjusted.argument)}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Projetos em andamento ({projects.committed})</span>
              <span className={pointsClass(adjusted.projects)}>{formatPoints(adjusted.projects)}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Bugs para resolver ({bugs.committed})</span>
              <span className={pointsClass(adjusted.bugs)}>{formatPoints(adjusted.bugs)}</span>
            </li>
            <li className="pt-1" aria-hidden="true">
              <Separator />
            </li>
            <li className="flex items-center justify-between gap-3 font-medium">
              <span>Chance de hoje</span>
              <span className="tabular-nums">{adjusted.percentage}%</span>
            </li>
          </ul>
          {limited ? (
            <p className="pt-3 text-sm text-muted-foreground">
              A soma deu {adjusted.raw} e foi limitada a {adjusted.percentage}%.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {chance.factors.map((factor) => (
          <FactorCard key={factor.id} factor={factor} />
        ))}
        <HoroscopeStub />
      </div>
    </div>
  );
}

function pointsClass(value: number): string {
  if (value > 0) return "font-medium text-success tabular-nums";
  if (value < 0) return "font-medium text-destructive tabular-nums";
  return "font-medium text-muted-foreground tabular-nums";
}

function CountField({
  id,
  label,
  help,
  state,
  points,
  onText,
  onCommit,
}: {
  id: string;
  label: string;
  help: string;
  state: CountState;
  points: number;
  onText: (text: string) => void;
  onCommit: () => void;
}) {
  const helpId = `${id}-ajuda`;
  const errorId = `${id}-erro`;
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="text-sm font-medium tabular-nums">{formatPoints(points)} pts</span>
      </div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={7}
        value={state.text}
        aria-invalid={state.invalid || undefined}
        aria-describedby={state.invalid ? `${helpId} ${errorId}` : helpId}
        onChange={(event) => onText(event.target.value)}
        onBlur={onCommit}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring"
      />
      <p id={helpId} className="text-sm text-muted-foreground">
        {help}
      </p>
      {state.invalid ? (
        <p id={errorId} className="text-sm text-destructive">
          Use um número inteiro a partir de zero.
        </p>
      ) : null}
    </div>
  );
}

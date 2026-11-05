import {
  Beer,
  CalendarDays,
  CloudSun,
  Flag,
  Scale,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPoints } from "@/lib/score";
import type { Factor, FactorId } from "@/lib/types";

const ICONS: Record<FactorId, LucideIcon> = {
  clima: CloudSun,
  feriado: CalendarDays,
  cerveja: Beer,
  spfc: Trophy,
  selecao: Flag,
  stf: Scale,
};

function badgeVariant(factor: Factor) {
  if (factor.tone === "fallback") return "outline" as const;
  if (factor.contribution > 0) return "default" as const;
  if (factor.contribution < 0) return "destructive" as const;
  return "secondary" as const;
}

export function FactorCard({ factor }: { factor: Factor }) {
  const Icon = ICONS[factor.id];
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            {factor.title}
          </h3>
        </CardTitle>
        <CardAction>
          <Badge variant={badgeVariant(factor)}>
            {formatPoints(factor.contribution)} pts
          </Badge>
        </CardAction>
        <CardDescription>{factor.weightLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-base font-medium text-foreground">{factor.status}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{factor.detail}</p>
        <p className="text-sm leading-relaxed">{factor.joke}</p>
      </CardContent>
      <CardFooter className="text-xs leading-relaxed text-muted-foreground">
        {factor.source}
      </CardFooter>
    </Card>
  );
}

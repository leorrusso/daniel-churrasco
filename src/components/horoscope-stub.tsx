import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// TODO(horoscopo): incluir o signo quando o Daniel escolher um. Não entra no cálculo.
export function HoroscopeStub() {
  return (
    <Card aria-disabled="true" className="opacity-70">
      <CardHeader>
        <CardTitle>
          <h3 className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-accent">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            Horóscopo da picanha
          </h3>
        </CardTitle>
        <CardDescription>Em breve</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge variant="outline">Fora da conta</Badge>
        <p className="text-sm leading-relaxed text-muted-foreground">
          O mapa astral ficou de fora até alguém revelar o signo. Quando entrar, vai ser mais uma
          desculpa — não um oráculo.
        </p>
      </CardContent>
    </Card>
  );
}

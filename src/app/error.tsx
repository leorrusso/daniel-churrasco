"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold">A brasa apagou</h1>
      <p className="text-muted-foreground">
        Não deu para calcular a chance agora. O churrasco fica em suspenso, não em pânico.
      </p>
      <Button type="button" size="lg" onClick={() => reset()}>
        Tentar de novo
      </Button>
    </main>
  );
}

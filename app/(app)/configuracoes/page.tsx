import { Button } from "@/components/ui/button";
import { sair } from "../actions";

export default function ConfiguracoesPage() {
  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <p className="text-muted-foreground">
        Configurações de IA (Claude/Gemini) chegam na Fase 4.
      </p>

      <form action={sair}>
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>
    </main>
  );
}

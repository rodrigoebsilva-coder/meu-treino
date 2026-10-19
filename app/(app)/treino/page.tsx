import { createClient } from "@/lib/supabase/server";
import type { TreinoCompleto, ExercicioResumo } from "@/lib/treino/types";
import { TreinoView } from "./treino-view";

export default async function TreinoPage() {
  const supabase = await createClient();

  const { data: treino } = await supabase
    .from("treinos")
    .select(
      "*, treino_dias(*, treino_exercicios(*, exercicio:exercicios(id, nome, grupo_muscular, youtube_url)))"
    )
    .eq("status", "ativo")
    .order("ordem", { referencedTable: "treino_dias", ascending: true })
    .order("ordem", { referencedTable: "treino_dias.treino_exercicios", ascending: true })
    .maybeSingle<TreinoCompleto>();

  const { data: exercicios } = await supabase
    .from("exercicios")
    .select("id, nome, grupo_muscular, youtube_url")
    .order("nome", { ascending: true })
    .returns<ExercicioResumo[]>();

  if (!treino) {
    return (
      <main className="flex flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Treino</h1>
        <p className="text-muted-foreground">
          Você ainda não tem um treino ativo. Isso chega na Fase 4 (geração por IA) ou
          pode ser criado manualmente depois.
        </p>
      </main>
    );
  }

  return <TreinoView treino={treino} exerciciosDisponiveis={exercicios ?? []} />;
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { TreinoCompleto, ExercicioResumo } from "@/lib/treino/types";
import { TreinoView } from "./treino-view";

export default async function TreinoPage() {
  const supabase = await createClient();

  const { data: treino } = await supabase
    .from("treinos")
    .select(
      "*, treino_dias(*, treino_exercicios(*, exercicio:exercicios(id, nome, grupo_muscular, youtube_url, dica_casa)))"
    )
    .eq("status", "ativo")
    .order("ordem", { referencedTable: "treino_dias", ascending: true })
    .order("ordem", { referencedTable: "treino_dias.treino_exercicios", ascending: true })
    .maybeSingle<TreinoCompleto>();

  const { data: exercicios } = await supabase
    .from("exercicios")
    .select("id, nome, grupo_muscular, youtube_url, dica_casa")
    .order("nome", { ascending: true })
    .returns<ExercicioResumo[]>();

  if (!treino) {
    return (
      <main className="flex flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Treino 💪</h1>
        <p className="text-muted-foreground">Você ainda não tem um treino ativo.</p>
        <Button
          render={<Link href="/treino/gerar-ia">Gerar treino com IA</Link>}
          nativeButton={false}
          className="w-fit"
        />
      </main>
    );
  }

  return <TreinoView treino={treino} exerciciosDisponiveis={exercicios ?? []} />;
}

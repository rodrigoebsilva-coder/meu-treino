import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { TreinoCompleto, ExercicioResumo } from "@/lib/treino/types";
import { gerarAlternativasParaTreino } from "@/lib/treino/alternativas";
import { TreinoView } from "./treino-view";

const SELECT_TREINO =
  "*, treino_dias(*, treino_exercicios(*, exercicio:exercicios(id, nome, grupo_muscular, youtube_url, dica_casa, tipo), alternativas:treino_exercicio_alternativas(exercicio_id)))";

export default async function TreinoPage() {
  const supabase = await createClient();

  let { data: treino } = await supabase
    .from("treinos")
    .select(SELECT_TREINO)
    .eq("status", "ativo")
    .order("ordem", { referencedTable: "treino_dias", ascending: true })
    .order("ordem", { referencedTable: "treino_dias.treino_exercicios", ascending: true })
    .maybeSingle<TreinoCompleto>();

  // Backfill/rede de segurança: treinos de antes dessa feature (ou
  // exercícios adicionados manualmente) podem não ter alternativas ainda.
  const faltaAlternativa = treino?.treino_dias.some((d) =>
    d.treino_exercicios.some((te) => te.exercicio_id && te.alternativas.length === 0)
  );
  if (treino && faltaAlternativa) {
    await gerarAlternativasParaTreino(supabase, treino.id);
    ({ data: treino } = await supabase
      .from("treinos")
      .select(SELECT_TREINO)
      .eq("status", "ativo")
      .order("ordem", { referencedTable: "treino_dias", ascending: true })
      .order("ordem", { referencedTable: "treino_dias.treino_exercicios", ascending: true })
      .maybeSingle<TreinoCompleto>());
  }

  const { data: exercicios } = await supabase
    .from("exercicios")
    .select("id, nome, grupo_muscular, youtube_url, dica_casa, tipo")
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

  // Nomes das alternativas vêm do mesmo `exercicios` já buscado acima pro
  // seletor de troca de exercício — evita um join aninhado a mais na query.
  const nomesPorId = new Map((exercicios ?? []).map((e) => [e.id, e.nome]));
  const treinoComNomes: TreinoCompleto = {
    ...treino,
    treino_dias: treino.treino_dias.map((d) => ({
      ...d,
      treino_exercicios: d.treino_exercicios.map((te) => ({
        ...te,
        alternativas: te.alternativas.map((a) => ({
          exercicio_id: a.exercicio_id,
          nome: nomesPorId.get(a.exercicio_id) ?? "Exercício",
        })),
      })),
    })),
  };

  return <TreinoView treino={treinoComNomes} exerciciosDisponiveis={exercicios ?? []} />;
}

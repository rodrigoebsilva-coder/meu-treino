import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExecucaoClient } from "./execucao-client";

export default async function ExecutarPage({
  params,
}: {
  params: Promise<{ treinoDiaId: string }>;
}) {
  const { treinoDiaId } = await params;
  const supabase = await createClient();

  // RLS já garante que só vem algo se for do usuário logado; o maybeSingle
  // aqui é só pra dar um 404 amigável em vez de uma tela vazia.
  const { data: dia } = await supabase
    .from("treino_dias")
    .select("id, treino_id")
    .eq("id", treinoDiaId)
    .maybeSingle();

  if (!dia) {
    notFound();
  }

  return <ExecucaoClient treinoDiaId={treinoDiaId} treinoId={dia.treino_id} />;
}

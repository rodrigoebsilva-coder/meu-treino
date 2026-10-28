import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { ProvedorIA } from "@/lib/ai/provider";
import type { TipoAcao } from "@/lib/ai/schemas";
import { GerarPageClient } from "./gerar-page-client";

export default async function GerarIaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipoAcao?: string; semanas?: string }>;
}) {
  const params = await searchParams;
  const tipoAcaoInicial = params.tipoAcao === "novo_ciclo" ? ("novo_ciclo" as TipoAcao) : undefined;
  const semanas = Number(params.semanas);
  const semanasInicial = semanas >= 1 && semanas <= 52 ? semanas : undefined;
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("config_ia")
    .select("provedor_padrao, modelo_padrao")
    .maybeSingle();

  const { data: treinoAtivo } = await supabase.from("treinos").select("id").eq("status", "ativo").maybeSingle();

  const { data: exercicios } = await supabase.from("exercicios").select("id, nome").order("nome", { ascending: true });

  const exerciciosPorId = Object.fromEntries((exercicios ?? []).map((e) => [e.id, e.nome]));

  if (!config?.modelo_padrao) {
    return (
      <main className="flex flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Gerar treino com IA 🤖</h1>
        <p className="text-muted-foreground">
          Configure um provedor e uma chave de API antes de gerar um treino.
        </p>
        <Button render={<Link href="/configuracoes/ia">Configurar IA</Link>} nativeButton={false} className="w-fit" />
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Gerar treino com IA 🤖</h1>
      <GerarPageClient
        provedorPadrao={config.provedor_padrao as ProvedorIA}
        modeloPadrao={config.modelo_padrao}
        temTreinoAtivo={!!treinoAtivo}
        exerciciosPorId={exerciciosPorId}
        tipoAcaoInicial={tipoAcaoInicial}
        semanasInicial={semanasInicial}
      />
    </main>
  );
}

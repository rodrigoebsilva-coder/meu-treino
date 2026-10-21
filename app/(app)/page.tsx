import Link from "next/link";
import { Flame, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { buscarTreinoAtivo, buscarProximoDia, buscarResumoSemana } from "@/lib/dashboard/dados";
import { calcularStreak } from "@/lib/evolucao/dados";

function formatarDuracao(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  if (horas === 0) return `${minutos}min`;
  return `${horas}h${String(minutos).padStart(2, "0")}`;
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: anamnese } = await supabase
    .from("anamnese_atual")
    .select("objetivo, dias_disponiveis")
    .maybeSingle();

  const treinoAtivo = await buscarTreinoAtivo(supabase);
  const [proximoDia, resumoSemana, streak] = await Promise.all([
    treinoAtivo ? buscarProximoDia(supabase, treinoAtivo.dias) : Promise.resolve(null),
    buscarResumoSemana(supabase),
    calcularStreak(supabase),
  ]);

  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Hoje</h1>

      {anamnese ? (
        <p className="text-muted-foreground">
          Objetivo atual: {anamnese.objetivo} · {anamnese.dias_disponiveis}x por semana.
        </p>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <p className="text-muted-foreground">Você ainda não preencheu seu perfil/anamnese.</p>
            <Button render={<Link href="/perfil">Preencher perfil</Link>} nativeButton={false} className="w-fit" />
          </CardContent>
        </Card>
      )}

      {treinoAtivo && proximoDia ? (
        <Card>
          <CardHeader>
            <CardTitle>Treino de hoje</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{proximoDia.nome}</p>
              <p className="text-sm text-muted-foreground">{proximoDia.grupos_musculares.join(", ")}</p>
            </div>
            <Button render={<Link href={`/treino/executar/${proximoDia.id}`}>Iniciar</Link>} nativeButton={false} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <p className="text-muted-foreground">Nenhum treino ativo ainda.</p>
            <Button render={<Link href="/treino/gerar-ia">Gerar treino com IA</Link>} nativeButton={false} className="w-fit" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-sm text-muted-foreground">Treinos essa semana</span>
            <span className="text-2xl font-semibold">
              {resumoSemana.treinosFeitos}
              {anamnese ? <span className="text-base text-muted-foreground">/{anamnese.dias_disponiveis}</span> : null}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-sm text-muted-foreground">Séries essa semana</span>
            <span className="text-2xl font-semibold">{resumoSemana.seriesFeitas}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-sm text-muted-foreground">Tempo treinado</span>
            <span className="text-2xl font-semibold">{formatarDuracao(resumoSemana.duracaoTotalSegundos)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-sm text-muted-foreground">Streak</span>
            <span className="flex items-center gap-1 text-2xl font-semibold">
              <Flame className="size-5 text-primary" /> {streak}
            </span>
          </CardContent>
        </Card>
      </div>

      {resumoSemana.energiaMedia !== null || resumoSemana.sonoMedia !== null ? (
        <Card>
          <CardHeader>
            <CardTitle>Check-in médio da semana</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-6 text-sm">
            {resumoSemana.energiaMedia !== null ? (
              <span>
                Energia: <strong>{resumoSemana.energiaMedia.toFixed(1)}</strong>
              </span>
            ) : null}
            {resumoSemana.sonoMedia !== null ? (
              <span>
                Sono: <strong>{resumoSemana.sonoMedia.toFixed(1)}</strong>
              </span>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Button
        variant="outline"
        render={
          <Link href="/relatorio">
            <FileText /> Ver relatório completo
          </Link>
        }
        nativeButton={false}
        className="w-fit"
      />
    </main>
  );
}

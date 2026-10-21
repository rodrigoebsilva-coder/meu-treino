import Link from "next/link";
import { Flame, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { buscarTreinoAtivo, buscarProximosDias, buscarResumoSemana } from "@/lib/dashboard/dados";
import { calcularStreak } from "@/lib/evolucao/dados";
import { statusMesociclo } from "@/lib/mesociclo/fases";
import { SoliaLogo } from "@/components/solia-logo";

function formatarDuracao(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  if (horas === 0) return `${minutos}min`;
  return `${horas}h${String(minutos).padStart(2, "0")}`;
}

function saudacao(hora: number) {
  if (hora < 5) return "Boa noite";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: anamnese } = await supabase
    .from("anamnese_atual")
    .select("objetivo, dias_disponiveis")
    .maybeSingle();

  const treinoAtivo = await buscarTreinoAtivo(supabase);
  const [proximosDias, resumoSemana, streak] = await Promise.all([
    treinoAtivo ? buscarProximosDias(supabase, treinoAtivo.dias, 5) : Promise.resolve([]),
    buscarResumoSemana(supabase),
    calcularStreak(supabase),
  ]);
  const proximoDia = proximosDias[0] ?? null;
  const depoisDeHoje = proximosDias.slice(1);
  const mesociclo = treinoAtivo ? statusMesociclo(treinoAtivo.criado_em, treinoAtivo.duracao_semanas) : null;

  return (
    <main className="flex flex-col gap-6 p-6">
      <SoliaLogo className="text-sm text-muted-foreground" />

      <h1 className="font-heading text-2xl font-semibold">{saudacao(new Date().getHours())} 👋</h1>

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
            <CardTitle>Treino de hoje 💪</CardTitle>
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

      {depoisDeHoje.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Próximos treinos 📅</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{depoisDeHoje.map((d) => d.nome).join(" · ")}</p>
          </CardContent>
        </Card>
      ) : null}

      {mesociclo ? (
        <Card>
          <CardHeader>
            <CardTitle>Mesociclo 🎯</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {mesociclo.fase ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Semana {mesociclo.semana} de {mesociclo.duracaoSemanas}
                  </span>
                  <span className="font-medium">{mesociclo.fase.nome}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (mesociclo.semana / mesociclo.duracaoSemanas) * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Seu mesociclo de {mesociclo.duracaoSemanas} semanas terminou — hora de gerar um novo ciclo.
                </p>
                <Button
                  render={<Link href="/treino/gerar-ia?tipoAcao=novo_ciclo">Gerar novo ciclo</Link>}
                  nativeButton={false}
                  className="w-fit"
                />
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-sm text-muted-foreground">Treinos essa semana</span>
            <span className="font-heading text-3xl font-semibold">
              {resumoSemana.treinosFeitos}
              {anamnese ? <span className="text-base text-muted-foreground">/{anamnese.dias_disponiveis}</span> : null}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-sm text-muted-foreground">Séries essa semana</span>
            <span className="font-heading text-3xl font-semibold">{resumoSemana.seriesFeitas}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-sm text-muted-foreground">Tempo treinado</span>
            <span className="font-heading text-3xl font-semibold">{formatarDuracao(resumoSemana.duracaoTotalSegundos)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            <span className="text-sm text-muted-foreground">Streak</span>
            <span className="flex items-center gap-1 font-heading text-3xl font-semibold">
              <Flame className="size-6 fill-orange-500 text-orange-500" /> {streak}
            </span>
          </CardContent>
        </Card>
      </div>

      {resumoSemana.energiaMedia !== null || resumoSemana.sonoMedia !== null ? (
        <Card>
          <CardHeader>
            <CardTitle>Check-in médio da semana 📝</CardTitle>
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
